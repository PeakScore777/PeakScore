import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage, type SupportedRasterMime } from "@/lib/security/sanitize-raster-image";
import { isSameOriginMutation, readFormDataWithinLimit } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const ALLOWED_MIME_TYPES = new Set<SupportedRasterMime>(["image/png", "image/jpeg", "image/webp"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

function getOwnedProfileAssetPath(value: string | null | undefined, userId: string) {
  if (!value) return null;
  try {
    const path = new URL(value).pathname;
    const prefix = "/storage/v1/object/public/profile-assets/" + userId + "/";
    if (!path.startsWith(prefix)) return null;
    const objectPath = path.slice(prefix.length);
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(objectPath)) return null;
    return userId + "/" + objectPath;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const parsed = await readFormDataWithinLimit(request, MAX_REQUEST_BYTES);
  if (!parsed.ok) {
    return fail(
      parsed.reason === "too_large"
        ? "La imagen supera el tamaño permitido."
        : "El formulario de imagen no es válido.",
      parsed.reason === "too_large" ? 413 : 400,
    );
  }

  const form = parsed.formData;
  const assetType = String(form.get("asset_type") ?? "");
  const file = form.get("file");
  if (assetType !== "avatar" && assetType !== "banner") return fail("El tipo de imagen no es válido.", 400);
  if (!(file instanceof File) || file.size <= 0) return fail("Selecciona una imagen válida.", 400);
  if (file.size > MAX_IMAGE_BYTES) return fail("La imagen debe pesar máximo 8 MB.", 413);
  if (!ALLOWED_MIME_TYPES.has(file.type as SupportedRasterMime)) {
    return fail("Solo se permiten imágenes PNG, JPG o WebP estáticas.", 415);
  }

  const { data: withinLimit, error: limitError } = await supabase.rpc("consume_peakstyle_asset_rate_limit", {
    p_asset_type: assetType,
  });
  if (limitError) {
    console.error("[PeakStyle] Asset rate limit unavailable.", { code: limitError.code });
    return fail("La protección de carga no está disponible. Inténtalo de nuevo.", 503);
  }
  if (withinLimit !== true) {
    return NextResponse.json(
      { error: "Has cambiado demasiadas imágenes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
    );
  }

  let sanitized: Awaited<ReturnType<typeof sanitizeRasterImage>>;
  try {
    sanitized = await sanitizeRasterImage(
      new Uint8Array(await file.arrayBuffer()),
      file.type as SupportedRasterMime,
      MAX_IMAGE_BYTES,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "La imagen no es válida.";
    return fail(message, 400);
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url,profile_banner_url")
    .eq("id", user.id)
    .single();

  if (profileError || !existingProfile) return fail("No se pudo cargar tu perfil.", 503);

  const storagePath = user.id + "/" + randomUUID() + "." + sanitized.extension;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("profile-assets")
    .upload(storagePath, sanitized.buffer, {
      contentType: sanitized.contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("[PeakStyle] Profile asset upload failed.", { code: uploadError.name });
    return fail("No se pudo guardar la imagen.", 503);
  }

  const publicUrl = supabaseAdmin.storage.from("profile-assets").getPublicUrl(storagePath).data.publicUrl;
  const { data: updated, error: updateError } = await supabase.rpc("update_my_peakstyle_asset", {
    p_asset_type: assetType,
    p_asset_url: publicUrl,
  });

  if (updateError || updated !== true) {
    await supabaseAdmin.storage.from("profile-assets").remove([storagePath]);
    const denied = updateError?.code === "42501";
    return fail(denied ? "No se pudo validar esta imagen." : "No se pudo actualizar tu perfil.", denied ? 403 : 503);
  }

  const previousUrl = assetType === "avatar" ? existingProfile.avatar_url : existingProfile.profile_banner_url;
  const previousPath = getOwnedProfileAssetPath(previousUrl, user.id);
  if (previousPath && previousPath !== storagePath) {
    const { error: cleanupError } = await supabaseAdmin.storage.from("profile-assets").remove([previousPath]);
    if (cleanupError) console.warn("[PeakStyle] Previous image cleanup pending.", { code: cleanupError.name });
  }

  return NextResponse.json({
    success: true,
    assetType,
    assetUrl: publicUrl,
    sanitized: true,
    metadataRemoved: true,
    width: sanitized.width,
    height: sanitized.height,
  }, { headers: { "Cache-Control": "no-store" } });
}
