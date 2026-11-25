import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage, type SupportedRasterMime } from "@/lib/security/sanitize-raster-image";
import { isSameOriginMutation, readFormDataWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "community-profile-avatars";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const STATIC_IMAGE_MIME_TYPES = new Set<SupportedRasterMime>(["image/png", "image/jpeg", "image/webp"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function ownedSpaceAssetPath(value: string | null, spaceId: string, assetType: "icon" | "banner") {
  const prefix = "spaces/" + spaceId + "/";
  if (!value?.startsWith(prefix)) return null;
  const filename = value.slice(prefix.length);
  const allowedExtensions = assetType === "banner"
    ? /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/i
    : /^[0-9a-f-]{36}\.(png|jpg|webp)$/i;
  return allowedExtensions.test(filename) ? value : null;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);
  if (!(await verifyCommunityFounder(user.id))) return fail("Solo el founder puede cambiar la imagen de un servidor.", 403);

  const parsed = await readFormDataWithinLimit(request, MAX_REQUEST_BYTES);
  if (!parsed.ok) return fail(parsed.reason === "too_large" ? "La imagen supera el tamaño permitido." : "El formulario de imagen no es válido.", parsed.reason === "too_large" ? 413 : 400);

  const form = parsed.formData;
  const spaceId = String(form.get("space_id") ?? "");
  const assetType = String(form.get("asset_type") ?? "");
  const file = form.get("file");
  if (!UUID.test(spaceId)) return fail("El espacio no es válido.", 400);
  if (assetType !== "icon" && assetType !== "banner") return fail("El tipo de imagen no es válido.", 400);
  if (!(file instanceof File) || file.size <= 0) return fail("Selecciona una imagen válida.", 400);
  if (file.size > MAX_IMAGE_BYTES) return fail("La imagen debe pesar máximo 5 MB.", 413);
  const isStaticImage = STATIC_IMAGE_MIME_TYPES.has(file.type as SupportedRasterMime);
  const isAnimatedBanner = assetType === "banner" && file.type === "image/gif";
  if (!isStaticImage && !isAnimatedBanner) {
    return fail(assetType === "icon"
      ? "El icono solo admite PNG, JPG o WebP estáticos."
      : "La portada admite PNG, JPG, WebP o GIF animado.",
    415);
  }

  // Read the target community with the authenticated Founder session so RLS
  // and the same Supabase project used by the browser govern this lookup.
  // The service-role client is reserved for the actual Storage object upload.
  // Keep icon changes independent from the optional banner_path migration.
  // Older remote schemas may have icon_path but not banner_path yet.
  const { data: space, error: spaceError } = await supabase.from("community_spaces")
    .select("id,slug,space_type,icon_path")
    .eq("id", spaceId)
    .eq("is_enabled", true)
    .maybeSingle();
  if (spaceError) {
    console.error("[PeakScore Community] Branding space lookup failed.", {
      code: spaceError.code,
      spaceId,
    });
    return fail("No se pudo consultar la comunidad. Comprueba la conexión del servidor con Supabase.", 503);
  }

  const isPreIcfesCommunity = space?.space_type === "preicfes";
  const isGlobalCommunity = space?.space_type === "global"
    && space.id === "00000000-0000-4000-8000-000000000001";
  if (!space || (!isPreIcfesCommunity && !isGlobalCommunity)) {
    console.warn("[PeakScore Community] Unsupported or missing branding space.", {
      spaceId,
      spaceType: space?.space_type ?? null,
      slug: space?.slug ?? null,
    });
    return fail("No encontramos una comunidad activa compatible con esa identidad.", 404);
  }

  let sanitized: Awaited<ReturnType<typeof sanitizeRasterImage>>;
  try { sanitized = await sanitizeRasterImage(new Uint8Array(await file.arrayBuffer()), file.type as SupportedRasterMime, MAX_IMAGE_BYTES); }
  catch (error) { return fail(error instanceof Error ? error.message : "La imagen no es válida.", 400); }

  const assetPath = "spaces/" + spaceId + "/" + randomUUID() + "." + sanitized.extension;
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(assetPath, sanitized.buffer, {
    contentType: sanitized.contentType, cacheControl: "31536000", upsert: false,
  });
  if (uploadError) {
    console.error("[PeakScore Community] Server branding upload failed.", { code: uploadError.name });
    return fail("No se pudo guardar la imagen.", 503);
  }

  let previousAssetPath: string | null = space.icon_path;
  if (assetType === "banner") {
    const { data: bannerRow, error: bannerLookupError } = await supabase.from("community_spaces")
      .select("banner_path")
      .eq("id", spaceId)
      .eq("is_enabled", true)
      .maybeSingle();
    if (bannerLookupError) {
      await supabaseAdmin.storage.from(BUCKET).remove([assetPath]);
      console.error("[PeakScore Community] Banner column is unavailable for this upload.", {
        code: bannerLookupError.code,
        spaceId,
      });
      return fail("La portada todavía no está habilitada en la base de datos remota. El icono sí puede actualizarse; primero debe aplicarse la migración de portada en un entorno validado.", 503);
    }
    previousAssetPath = bannerRow?.banner_path ?? null;
  }
  const previousPath = ownedSpaceAssetPath(previousAssetPath, spaceId, assetType);
  const { data: updated, error: updateError } = await supabase.rpc("update_community_space_asset", {
    p_space_id: spaceId, p_asset_type: assetType, p_asset_path: assetPath,
  });
  if (updateError || updated !== true) {
    await supabaseAdmin.storage.from(BUCKET).remove([assetPath]);
    const denied = updateError?.code === "42501";
    return fail(denied ? "Solo el founder puede cambiar esta imagen." : "No se pudo actualizar la identidad del servidor.", denied ? 403 : 503);
  }

  if (previousPath && previousPath !== assetPath) {
    const { error: cleanupError } = await supabaseAdmin.storage.from(BUCKET).remove([previousPath]);
    if (cleanupError) console.warn("[PeakScore Community] Previous server image cleanup pending.", { code: cleanupError.name });
  }

  const assetUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(assetPath).data.publicUrl;
  return NextResponse.json({ success: true, assetType, assetPath, assetUrl, sanitized: true, metadataRemoved: true, width: sanitized.width, height: sanitized.height }, { headers: { "Cache-Control": "no-store" } });
}
