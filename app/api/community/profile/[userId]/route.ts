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

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId)) return fail("El miembro solicitado no es válido.", 400);

  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("community_member_profiles")
      .select("user_id,display_name,avatar_path,pronouns,status_text,about,created_at")
      .eq("user_id", userId).maybeSingle(),
    supabase.from("community_public_role_badges")
      .select("role_key,label,badge_color")
      .eq("user_id", userId),
  ]);
  if (profileResult.error) {
    console.error("[Community] Profile read failed.", { code: profileResult.error.code });
    return fail("No se pudo cargar el perfil comunitario.", 503);
  }
  if (!profileResult.data) return fail("Este miembro todavía no tiene perfil comunitario.", 404);

  let avatarUrl: string | null = null;
  if (profileResult.data.avatar_path) {
    avatarUrl = supabase.storage.from("community-profile-avatars")
      .getPublicUrl(profileResult.data.avatar_path).data.publicUrl;
  }

  return NextResponse.json({
    profile: {
      userId: profileResult.data.user_id,
      displayName: profileResult.data.display_name,
      avatarUrl,
      pronouns: profileResult.data.pronouns,
      statusText: profileResult.data.status_text,
      about: profileResult.data.about,
      joinedAt: profileResult.data.created_at,
      roles: rolesResult.error ? [] : (rolesResult.data ?? []).map((role) => ({
        roleKey: role.role_key, label: role.label, badgeColor: role.badge_color,
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
  if (!UUID_PATTERN.test(userId) || userId !== user.id) return fail("Solo puedes editar tu propio perfil comunitario.", 403);

  const raw = await readBodyWithinLimit(request, 4096);
  if (raw === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const pronouns = typeof payload.pronouns === "string" ? payload.pronouns.trim() : "";
  const statusText = typeof payload.statusText === "string" ? payload.statusText.trim() : "";
  const about = typeof payload.about === "string" ? payload.about.trim() : "";

  if (displayName.length < 2 || displayName.length > 32
    || pronouns.length > 32 || statusText.length > 80 || about.length > 280) {
    return fail("Revisa los límites: nombre 2–32, pronombres 32, estado 80 y descripción 280 caracteres.", 400);
  }
  if (/[<>]/.test(displayName + pronouns + statusText + about)) {
    return fail("No se permite HTML en el perfil comunitario.", 400);
  }

  const { data, error } = await supabase.from("community_member_profiles")
    .update({
      display_name: displayName,
      pronouns,
      status_text: statusText,
      about,
    })
    .eq("user_id", user.id)
    .select("user_id,display_name,pronouns,status_text,about,created_at")
    .single();

  if (error || !data) {
    console.error("[Community] Profile update failed.", { code: error?.code });
    return fail("No se pudo guardar tu perfil comunitario.", 503);
  }
  return NextResponse.json({
    success: true,
    profile: {
      userId: data.user_id,
      displayName: data.display_name,
      pronouns: data.pronouns,
      statusText: data.status_text,
      about: data.about,
      joinedAt: data.created_at,
      isOwnProfile: true,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const sizeError = getContentLengthError(request, MAX_AVATAR_BYTES + 128 * 1024);
  if (sizeError) return fail(sizeError.message, sizeError.status);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);
  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId) || userId !== user.id) return fail("Solo puedes cambiar tu propio avatar comunitario.", 403);

  const { data: withinLimit, error: limitError } = await supabase.rpc("consume_community_attachment_rate_limit");
  if (limitError) return fail("La protección de carga no está disponible. Inténtalo de nuevo.", 503);
  if (withinLimit !== true) {
    return NextResponse.json(
      { error: "Has subido demasiadas imágenes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
    );
  }

  const parsed = await readFormDataWithinLimit(request, MAX_AVATAR_BYTES + 128 * 1024);
  if (!parsed.ok) return fail("La imagen supera el tamaño permitido o el formulario no es válido.", parsed.reason === "too_large" ? 413 : 400);
  const file = parsed.formData.get("file");
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
    return fail("Selecciona una imagen de máximo 5 MB.", 413);
  }

  let sanitized: Awaited<ReturnType<typeof sanitizeRasterImage>>;
  try {
    sanitized = await sanitizeRasterImage(new Uint8Array(await file.arrayBuffer()), file.type, MAX_AVATAR_BYTES);
  } catch {
    return fail("Solo se permiten imágenes PNG, JPG o WebP válidas, estáticas y seguras.", 415);
  }

  const { data: previous } = await supabase.from("community_member_profiles")
    .select("avatar_path").eq("user_id", user.id).maybeSingle();
  const storagePath = user.id + "/" + crypto.randomUUID() + "." + sanitized.extension;
  const { error: uploadError } = await supabaseAdmin.storage.from("community-profile-avatars")
    .upload(storagePath, sanitized.buffer, {
      contentType: sanitized.contentType,
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError) {
    console.error("[Community] Avatar upload failed.", { code: uploadError.name });
    return fail("No se pudo guardar la imagen.", 503);
  }

  const { data: updatedProfile, error: updateError } = await supabaseAdmin.from("community_member_profiles")
    .update({ avatar_path: storagePath })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (updateError || !updatedProfile) {
    await supabaseAdmin.storage.from("community-profile-avatars").remove([storagePath]);
    console.error("[Community] Avatar profile update failed.", { code: updateError.code });
    return fail("No se pudo actualizar tu avatar.", 503);
  }

  if (previous?.avatar_path) {
    const { error: removeError } = await supabaseAdmin.storage.from("community-profile-avatars").remove([previous.avatar_path]);
    if (removeError) console.warn("[Community] Previous avatar cleanup failed.", { code: removeError.name });
  }
  const avatarUrl = supabase.storage.from("community-profile-avatars").getPublicUrl(storagePath).data.publicUrl;
  return NextResponse.json({ success: true, avatarUrl }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
