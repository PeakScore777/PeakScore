import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage } from "@/lib/security/sanitize-raster-image";
import {
  getContentLengthError,
  isSameOriginMutation,
  readBodyWithinLimit,
  readFormDataWithinLimit,
} from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OWNED_OBJECT_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/i;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_BANNER_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_BANNER_BYTES + 128 * 1024;
const DEFAULT_CARD_COLOR = "#24252A";
const DEFAULT_PLATE_STYLE = "classic";
const PLATE_STYLES = new Set(["classic", "grid", "arcade", "signal"]);
const OPTIONAL_COLUMN_ERRORS = new Set(["42703", "PGRST204", "PGRST205"]);

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function publicAssetUrl(bucket: string, path: string | null) {
  return path ? supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
}

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId)) return fail("El miembro solicitado no es válido.", 400);

  let profileResult = await supabase.from("community_member_profiles")
    .select("user_id,display_name,avatar_path,pronouns,status_text,about,created_at")
    .eq("user_id", userId)
    .maybeSingle();

  // Social identity is never seeded from public.profiles, account email or academic progress.
  if (!profileResult.data && !profileResult.error && userId === user.id) {
    const metadata = user.user_metadata ?? {};
    const candidate = [metadata.full_name, metadata.name, metadata.user_name]
      .find((value) => typeof value === "string" && value.trim().length > 0);
    const displayName = (typeof candidate === "string" ? candidate.trim() : "Miembro").slice(0, 32);
    await supabase.from("community_member_profiles").upsert({
      user_id: user.id,
      display_name: displayName.length >= 2 ? displayName : "Miembro",
    }, { onConflict: "user_id", ignoreDuplicates: true });
    profileResult = await supabase.from("community_member_profiles")
      .select("user_id,display_name,avatar_path,pronouns,status_text,about,created_at")
      .eq("user_id", userId)
      .maybeSingle();
  }

  if (profileResult.error) {
    console.error("[Community] Profile read failed.", { code: profileResult.error.code });
    return fail("No se pudo cargar el perfil comunitario.", 503);
  }
  if (!profileResult.data) return fail("Este miembro todavía no tiene perfil comunitario.", 404);

  const [rolesResult, appearanceResult] = await Promise.all([
    supabase.from("community_public_role_badges")
      .select("role_key,label,badge_color")
      .eq("user_id", userId),
    supabase.from("community_member_profiles")
      .select("banner_path,card_color,plate_style")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const appearanceReady = !appearanceResult.error;
  if (appearanceResult.error && !OPTIONAL_COLUMN_ERRORS.has(appearanceResult.error.code ?? "")) {
    console.error("[Community] Profile appearance read failed.", { code: appearanceResult.error.code });
    return fail("No se pudo cargar la apariencia del perfil.", 503);
  }

  return NextResponse.json({
    profile: {
      userId: profileResult.data.user_id,
      displayName: profileResult.data.display_name,
      avatarUrl: publicAssetUrl("community-profile-avatars", profileResult.data.avatar_path),
      bannerUrl: appearanceReady
        ? publicAssetUrl("community-profile-banners", appearanceResult.data?.banner_path ?? null)
        : null,
      cardColor: appearanceReady ? appearanceResult.data?.card_color ?? DEFAULT_CARD_COLOR : DEFAULT_CARD_COLOR,
      plateStyle: appearanceReady && PLATE_STYLES.has(appearanceResult.data?.plate_style ?? "")
        ? appearanceResult.data?.plate_style
        : DEFAULT_PLATE_STYLE,
      appearanceReady,
      pronouns: profileResult.data.pronouns ?? "",
      statusText: profileResult.data.status_text ?? "",
      about: profileResult.data.about ?? "",
      joinedAt: profileResult.data.created_at,
      roles: rolesResult.error ? [] : (rolesResult.data ?? []).map((role) => ({
        roleKey: role.role_key,
        label: role.label,
        badgeColor: role.badge_color,
      })),
      isOwnProfile: profileResult.data.user_id === user.id,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId) || userId !== user.id) {
    return fail("Solo puedes editar tu propio perfil comunitario.", 403);
  }

  const raw = await readBodyWithinLimit(request, 4096);
  if (raw === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return fail("El formato de la solicitud no es válido.", 400);
  }

  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const pronouns = typeof payload.pronouns === "string" ? payload.pronouns.trim() : "";
  const statusText = typeof payload.statusText === "string" ? payload.statusText.trim() : "";
  const about = typeof payload.about === "string" ? payload.about.trim() : "";
  const cardColor = typeof payload.cardColor === "string" ? payload.cardColor.trim() : DEFAULT_CARD_COLOR;
  const plateStyle = typeof payload.plateStyle === "string" ? payload.plateStyle.trim() : DEFAULT_PLATE_STYLE;

  if (displayName.length < 2 || displayName.length > 32 || pronouns.length > 32 || statusText.length > 80 || about.length > 280) {
    return fail("Revisa los límites: nombre 2–32, pronombres 32, estado 80 y descripción 280 caracteres.", 400);
  }
  if (/[<>]/.test(displayName + pronouns + statusText + about)) {
    return fail("No se permite HTML en el perfil comunitario.", 400);
  }
  if (!/^#[0-9a-f]{6}$/i.test(cardColor)) return fail("El color de la tarjeta no es válido.", 400);
  if (!PLATE_STYLES.has(plateStyle)) return fail("El estilo de placa no es válido.", 400);

  // Save existing basic fields separately so the editor remains usable on a database
  // where the additive appearance migration has not yet been applied.
  const { data, error } = await supabase.from("community_member_profiles")
    .update({ display_name: displayName, pronouns, status_text: statusText, about })
    .eq("user_id", user.id)
    .select("user_id,display_name,pronouns,status_text,about,created_at")
    .single();

  if (error || !data) {
    console.error("[Community] Profile update failed.", { code: error?.code });
    return fail("No se pudo guardar tu perfil comunitario.", 503);
  }

  // The service-role write is restricted to the authenticated owner's UUID.
  const appearanceUpdate = await supabaseAdmin.from("community_member_profiles")
    .update({ card_color: cardColor, plate_style: plateStyle })
    .eq("user_id", user.id)
    .select("card_color,plate_style")
    .maybeSingle();

  const appearanceSaved = !appearanceUpdate.error && Boolean(appearanceUpdate.data);
  if (appearanceUpdate.error && !OPTIONAL_COLUMN_ERRORS.has(appearanceUpdate.error.code ?? "")) {
    console.error("[Community] Profile appearance update failed.", { code: appearanceUpdate.error.code });
    return fail("No se pudo guardar la apariencia del perfil.", 503);
  }

  return NextResponse.json({
    success: true,
    appearanceSaved,
    profile: {
      userId: data.user_id,
      displayName: data.display_name,
      pronouns: data.pronouns ?? "",
      statusText: data.status_text ?? "",
      about: data.about ?? "",
      cardColor: appearanceSaved ? appearanceUpdate.data?.card_color ?? DEFAULT_CARD_COLOR : DEFAULT_CARD_COLOR,
      plateStyle: appearanceSaved && PLATE_STYLES.has(appearanceUpdate.data?.plate_style ?? "")
        ? appearanceUpdate.data?.plate_style
        : DEFAULT_PLATE_STYLE,
      appearanceReady: appearanceSaved,
      joinedAt: data.created_at,
      isOwnProfile: true,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const sizeError = getContentLengthError(request, MAX_REQUEST_BYTES);
  if (sizeError) return fail(sizeError.message, sizeError.status);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId) || userId !== user.id) {
    return fail("Solo puedes cambiar las imágenes de tu propio perfil comunitario.", 403);
  }

  const parsed = await readFormDataWithinLimit(request, MAX_REQUEST_BYTES);
  if (!parsed.ok) {
    return fail("La imagen supera el tamaño permitido o el formulario no es válido.", parsed.reason === "too_large" ? 413 : 400);
  }

  const kind = parsed.formData.get("kind");
  if (kind !== "avatar" && kind !== "banner") return fail("El tipo de imagen no es válido.", 400);
  const maxBytes = kind === "avatar" ? MAX_AVATAR_BYTES : MAX_BANNER_BYTES;
  const bucket = kind === "avatar" ? "community-profile-avatars" : "community-profile-banners";
  const pathColumn = kind === "avatar" ? "avatar_path" : "banner_path";
  const responseField = kind === "avatar" ? "avatarUrl" : "bannerUrl";
  const file = parsed.formData.get("file");

  if (!(file instanceof File) || file.size <= 0 || file.size > maxBytes) {
    return fail(kind === "avatar"
      ? "Selecciona una imagen válida de máximo 5 MB."
      : "Selecciona una imagen válida de máximo 8 MB.", 413);
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return fail("Solo se permiten imágenes PNG, JPG o WebP estáticas.", 415);
  }

  const { data: withinLimit, error: limitError } = await supabase.rpc("consume_community_attachment_rate_limit");
  if (limitError) {
    console.error("[Community] Profile image rate limit unavailable.", { code: limitError.code });
    return fail("La protección de carga no está disponible. Inténtalo de nuevo.", 503);
  }
  if (withinLimit !== true) {
    return NextResponse.json({ error: "Has subido demasiadas imágenes. Inténtalo más tarde." }, {
      status: 429,
      headers: { "Retry-After": "3600", "Cache-Control": "no-store" },
    });
  }

  let sanitized: Awaited<ReturnType<typeof sanitizeRasterImage>>;
  try {
    sanitized = await sanitizeRasterImage(new Uint8Array(await file.arrayBuffer()), file.type, maxBytes);
  } catch {
    return fail("La imagen no es válida o contiene un formato no permitido.", 415);
  }

  const { data: previous, error: previousError } = await supabaseAdmin.from("community_member_profiles")
    .select(pathColumn)
    .eq("user_id", user.id)
    .maybeSingle();

  if (previousError) {
    const missingBannerColumn = kind === "banner" && OPTIONAL_COLUMN_ERRORS.has(previousError.code ?? "");
    return fail(missingBannerColumn
      ? "El banner comunitario todavía no está activado. Aplica la migración de apariencia de esta rama."
      : "No se pudo preparar la actualización de la imagen.", 503);
  }

  const storagePath = user.id + "/" + randomUUID() + "." + sanitized.extension;
  const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(storagePath, sanitized.buffer, {
    contentType: sanitized.contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (uploadError) {
    console.error("[Community] Profile image upload failed.", { bucket, code: uploadError.name });
    return fail("No se pudo guardar la imagen comunitaria. Comprueba que la migración de apariencia esté aplicada.", 503);
  }

  const { data: updatedProfile, error: updateError } = await supabaseAdmin.from("community_member_profiles")
    .update({ [pathColumn]: storagePath })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    await supabaseAdmin.storage.from(bucket).remove([storagePath]);
    console.error("[Community] Profile image reference update failed.", { code: updateError?.code });
    return fail("No se pudo actualizar la imagen comunitaria.", 503);
  }

  const previousPath = previous?.[pathColumn] as string | null | undefined;
  if (previousPath && OWNED_OBJECT_PATH.test(previousPath) && previousPath.startsWith(user.id + "/")) {
    const { error: cleanupError } = await supabaseAdmin.storage.from(bucket).remove([previousPath]);
    if (cleanupError) console.warn("[Community] Previous image cleanup failed.", { code: cleanupError.name });
  }

  return NextResponse.json({
    success: true,
    [responseField]: publicAssetUrl(bucket, storagePath),
    sanitized: true,
    metadataRemoved: true,
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
