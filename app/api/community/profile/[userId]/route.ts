import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage } from "@/lib/security/sanitize-raster-image";
import { DEFAULT_FUZZY_TEXT_SETTINGS, normalizeFuzzyTextSettings, type FuzzyTextSettings } from "@/components/community/fuzzy-text-settings";
import {
  getContentLengthError,
  isSameOriginMutation,
  readBodyWithinLimit,
  readFormDataWithinLimit,
} from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OWNED_OBJECT_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/i;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_AVATAR_BYTES + 128 * 1024;
const DEFAULT_CARD_COLOR = "#B7D7C3";
const DEFAULT_THEME_SECONDARY = "#8FB9A6";
const DEFAULT_ACCENT_COLOR = "#3987FF";
const DEFAULT_PLATE_STYLE = "classic";
const DEFAULT_DISPLAY_NAME_STYLE = "classic";
const DEFAULT_DISPLAY_NAME_PRISM_COLORS = ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"];
const DEFAULT_AVATAR_FRAME = "none";
const DEFAULT_AVATAR_DECORATION = "none";
const DEFAULT_PROFILE_FRAME = "none";
const DEFAULT_PROFILE_EFFECT = "none";
const PLATE_STYLES = new Set(["classic", "grid", "arcade", "signal"]);
const DISPLAY_NAME_STYLES = new Set(["classic", "tempo", "sakura", "jellybean", "modern", "medieval", "8bit", "vampyre", "monkey-bars", "mainframe", "headbang", "journal", "display", "editorial", "elegant", "geometric", "retro", "handwritten", "signature", "techno", "rounded", "stencil"]);
const DISPLAY_NAME_EFFECTS = new Set(["plain", "gradient", "neon", "toon", "pop", "gummy", "prism"]);
const DISPLAY_NAME_ANIMATIONS = new Set(["decrypt","signal-break","fuzzy-text","shuffle-blur","shuffle-flip","shuffle"]);
const DISPLAY_NAME_COLORS = new Set(["default", "pink", "green", "blue", "purple", "magenta", "red", "gold", "custom-gradient"]);
const AVATAR_FRAMES = new Set(["none", "solar", "violet", "cyan", "ember"]);
const AVATAR_DECORATIONS = new Set(["none", "bloom", "electric", "glitch"]);
const PROFILE_FRAMES = new Set(["none", "obsidian", "lunar", "crimson", "aurora"]);
const PROFILE_EFFECTS = new Set(["none", "aurora", "embers", "starlight", "scanline"]);
const ACCENT_COLORS = new Set(["#3987FF", "#9A72F5", "#E75DA6", "#F16E65", "#E5B64C", "#52C7A4"]);

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
    .select("user_id,member_number,display_name,avatar_path,pronouns,status_text,about,created_at")
    .eq("user_id", userId)
    .maybeSingle();

  // Social identity is independent: never seed it from public.profiles or account email.
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
      .select("user_id,member_number,display_name,avatar_path,pronouns,status_text,about,created_at")
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
      .select("banner_path,card_color,theme_color_secondary,plate_style,display_name_style,display_name_effect,display_name_animation,display_name_fuzzy_settings,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors,accent_color,avatar_frame,avatar_decoration_id,profile_frame_id,profile_effect_id,status_expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  // Appearance is optional metadata. A missing column, policy mismatch or a
  // partially applied studio migration must never hide the core social profile.
  const appearanceReady = !appearanceResult.error;
  if (appearanceResult.error) {
    console.warn("[Community] Optional profile appearance unavailable.", { code: appearanceResult.error.code });
  }
  if (rolesResult.error) {
    console.warn("[Community] Optional public role badges unavailable.", { code: rolesResult.error.code });
  }
  const appearance = appearanceResult.data;
  const statusExpiresAt = appearanceReady ? appearance?.status_expires_at ?? null : null;
  const statusExpired = Boolean(statusExpiresAt && Date.parse(statusExpiresAt) <= Date.now());
  const safeAvatarDecoration = appearanceReady && AVATAR_DECORATIONS.has(appearance?.avatar_decoration_id ?? "")
    ? appearance?.avatar_decoration_id : DEFAULT_AVATAR_DECORATION;
  const safeProfileFrame = appearanceReady && PROFILE_FRAMES.has(appearance?.profile_frame_id ?? "")
    ? appearance?.profile_frame_id : DEFAULT_PROFILE_FRAME;
  const safeProfileEffect = appearanceReady && PROFILE_EFFECTS.has(appearance?.profile_effect_id ?? "")
    ? appearance?.profile_effect_id : DEFAULT_PROFILE_EFFECT;

  return NextResponse.json({
    profile: {
      userId: profileResult.data.user_id,
      memberNumber: profileResult.data.member_number,
      displayName: profileResult.data.display_name,
      avatarUrl: publicAssetUrl("community-profile-avatars", profileResult.data.avatar_path),
      bannerUrl: appearanceReady ? publicAssetUrl("community-profile-banners", appearance?.banner_path ?? null) : null,
      cardColor: appearanceReady ? appearance?.card_color ?? DEFAULT_CARD_COLOR : DEFAULT_CARD_COLOR,
      themeColorSecondary: appearanceReady ? appearance?.theme_color_secondary ?? DEFAULT_THEME_SECONDARY : DEFAULT_THEME_SECONDARY,
      plateStyle: appearanceReady && PLATE_STYLES.has(appearance?.plate_style ?? "")
        ? appearance?.plate_style : DEFAULT_PLATE_STYLE,
      displayNameStyle: appearanceReady && DISPLAY_NAME_STYLES.has(appearance?.display_name_style ?? "")
        ? appearance?.display_name_style : DEFAULT_DISPLAY_NAME_STYLE,
      displayNameEffect: appearanceReady && DISPLAY_NAME_EFFECTS.has(appearance?.display_name_effect ?? "") ? appearance?.display_name_effect : "plain",
      displayNameAnimation: appearanceReady && DISPLAY_NAME_ANIMATIONS.has(appearance?.display_name_animation === "glitch" ? "signal-break" : appearance?.display_name_animation ?? "") ? (appearance?.display_name_animation === "glitch" ? "signal-break" : appearance?.display_name_animation) : "decrypt",
      displayNameFuzzySettings: normalizeFuzzyTextSettings(appearanceReady ? appearance?.display_name_fuzzy_settings : null),
      displayNameColor: appearanceReady && DISPLAY_NAME_COLORS.has(appearance?.display_name_color ?? "") ? appearance?.display_name_color : "default",
      displayNameGradientStart: appearanceReady && /^#[0-9A-F]{6}$/i.test(appearance?.display_name_gradient_start ?? "") ? appearance?.display_name_gradient_start : "#B86BFF",
      displayNameGradientEnd: appearanceReady && /^#[0-9A-F]{6}$/i.test(appearance?.display_name_gradient_end ?? "") ? appearance?.display_name_gradient_end : "#4E9BFF",
      displayNamePrismColors: appearanceReady && Array.isArray(appearance?.display_name_prism_colors) && appearance.display_name_prism_colors.length === 5 && appearance.display_name_prism_colors.every((color) => typeof color === "string" && /^#[0-9A-F]{6}$/i.test(color)) ? appearance.display_name_prism_colors : DEFAULT_DISPLAY_NAME_PRISM_COLORS,
      accentColor: appearanceReady && ACCENT_COLORS.has((appearance?.accent_color ?? "").toUpperCase())
        ? appearance?.accent_color : DEFAULT_ACCENT_COLOR,
      avatarFrame: appearanceReady && AVATAR_FRAMES.has(appearance?.avatar_frame ?? "")
        ? appearance?.avatar_frame : DEFAULT_AVATAR_FRAME,
      appearanceReady,
      pronouns: profileResult.data.pronouns ?? "",
      statusText: statusExpired ? "" : profileResult.data.status_text ?? "",
      statusExpiresAt: statusExpired ? null : statusExpiresAt,
      avatarDecorationId: safeAvatarDecoration,
      profileFrameId: safeProfileFrame,
      profileEffectId: safeProfileEffect,
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

  const pronouns = typeof payload.pronouns === "string" ? payload.pronouns.trim() : "";
  const statusText = typeof payload.statusText === "string" ? payload.statusText.trim() : "";
  const statusExpiresAtInput = payload.statusExpiresAt === null ? null
    : typeof payload.statusExpiresAt === "string" ? payload.statusExpiresAt.trim() : null;
  const about = typeof payload.about === "string" ? payload.about.trim() : "";
  const cardColor = typeof payload.cardColor === "string" ? payload.cardColor.trim() : DEFAULT_CARD_COLOR;
  const themeColorSecondary = typeof payload.themeColorSecondary === "string" ? payload.themeColorSecondary.trim() : DEFAULT_THEME_SECONDARY;
  const plateStyle = typeof payload.plateStyle === "string" ? payload.plateStyle.trim() : DEFAULT_PLATE_STYLE;
  const displayNameStyle = typeof payload.displayNameStyle === "string" ? payload.displayNameStyle.trim() : DEFAULT_DISPLAY_NAME_STYLE;
  const displayNameEffect = typeof payload.displayNameEffect === "string" ? payload.displayNameEffect.trim() : "plain";
  const displayNameAnimation = typeof payload.displayNameAnimation === "string" ? payload.displayNameAnimation.trim() : "decrypt";
  const displayNameFuzzySettings = normalizeFuzzyTextSettings(payload.displayNameFuzzySettings);
  const displayNameColor = typeof payload.displayNameColor === "string" ? payload.displayNameColor.trim() : "default";
  const displayNameGradientStart = typeof payload.displayNameGradientStart === "string" ? payload.displayNameGradientStart.trim().toUpperCase() : "#B86BFF";
  const displayNameGradientEnd = typeof payload.displayNameGradientEnd === "string" ? payload.displayNameGradientEnd.trim().toUpperCase() : "#4E9BFF";
  const displayNamePrismColors = Array.isArray(payload.displayNamePrismColors) ? payload.displayNamePrismColors : DEFAULT_DISPLAY_NAME_PRISM_COLORS;
  const accentColor = typeof payload.accentColor === "string" ? payload.accentColor.trim().toUpperCase() : DEFAULT_ACCENT_COLOR;
  const avatarFrame = typeof payload.avatarFrame === "string" ? payload.avatarFrame.trim() : DEFAULT_AVATAR_FRAME;
  const avatarDecorationId = typeof payload.avatarDecorationId === "string" ? payload.avatarDecorationId.trim() : DEFAULT_AVATAR_DECORATION;
  const profileFrameId = typeof payload.profileFrameId === "string" ? payload.profileFrameId.trim() : DEFAULT_PROFILE_FRAME;
  const profileEffectId = typeof payload.profileEffectId === "string" ? payload.profileEffectId.trim() : DEFAULT_PROFILE_EFFECT;

  if (pronouns.length > 32 || statusText.length > 80 || about.length > 256) {
    return fail("Revisa los límites: pronombres 32, estado 80 y biografía 256 caracteres.", 400);
  }
  if (/[<>]/.test(pronouns + statusText + about)) {
    return fail("No se permite HTML en el perfil comunitario.", 400);
  }
  if (!/^#[0-9a-f]{6}$/i.test(cardColor) || !/^#[0-9a-f]{6}$/i.test(themeColorSecondary)) return fail("El tema de perfil no es válido.", 400);
  if (!PLATE_STYLES.has(plateStyle)) return fail("El estilo de placa no es válido.", 400);
  if (!DISPLAY_NAME_STYLES.has(displayNameStyle)) return fail("El estilo de nombre no está disponible.", 400);
  if (!DISPLAY_NAME_EFFECTS.has(displayNameEffect) || !DISPLAY_NAME_COLORS.has(displayNameColor) || !DISPLAY_NAME_ANIMATIONS.has(displayNameAnimation)) return fail("El efecto o color del nombre no está disponible.", 400);
  if (!/^#[0-9A-F]{6}$/.test(displayNameGradientStart) || !/^#[0-9A-F]{6}$/.test(displayNameGradientEnd)) return fail("Los colores del degradado no son válidos.", 400);
  if (displayNamePrismColors.length !== 5 || !displayNamePrismColors.every((color: unknown) => typeof color === "string" && /^#[0-9A-F]{6}$/i.test(color))) return fail("El efecto Prisma necesita exactamente cinco colores válidos.", 400);
  if (!ACCENT_COLORS.has(accentColor)) return fail("El color de acento no está disponible.", 400);
  if (!AVATAR_FRAMES.has(avatarFrame)) return fail("El marco de avatar no está disponible.", 400);
  if (!AVATAR_DECORATIONS.has(avatarDecorationId)) return fail("La decoración de avatar no está disponible.", 400);
  if (!PROFILE_FRAMES.has(profileFrameId)) return fail("El marco de perfil no está disponible.", 400);
  if (!PROFILE_EFFECTS.has(profileEffectId)) return fail("El efecto de perfil no está disponible.", 400);
  if (statusExpiresAtInput !== null) {
    const expires = Date.parse(statusExpiresAtInput);
    if (!Number.isFinite(expires) || expires <= Date.now() || expires > Date.now() + 7 * 24 * 60 * 60 * 1000) {
      return fail("La caducidad del estado no es válida. Elige una duración máxima de siete días.", 400);
    }
  }

  // One owner-scoped database update keeps the identity and visual appearance atomic.
  // The service client is never exposed to the browser and is used only after the auth/owner gate.
  const { data, error } = await supabaseAdmin.from("community_member_profiles")
    .update({
      pronouns,
      status_text: statusText,
      status_expires_at: statusText ? statusExpiresAtInput : null,
      about,
      card_color: cardColor,
      theme_color_secondary: themeColorSecondary,
      plate_style: plateStyle,
      display_name_style: displayNameStyle,
      display_name_effect: displayNameEffect,
      display_name_animation: displayNameAnimation,
      display_name_fuzzy_settings: displayNameFuzzySettings,
      display_name_color: displayNameColor,
      display_name_gradient_start: displayNameGradientStart,
      display_name_gradient_end: displayNameGradientEnd,
      display_name_prism_colors: displayNamePrismColors.map((color: string) => color.toUpperCase()),
      accent_color: accentColor,
      avatar_frame: avatarFrame,
      avatar_decoration_id: avatarDecorationId,
      profile_frame_id: profileFrameId,
      profile_effect_id: profileEffectId,
    })
    .eq("user_id", user.id)
    .select("user_id,member_number,display_name,pronouns,status_text,status_expires_at,about,created_at,card_color,theme_color_secondary,plate_style,display_name_style,display_name_effect,display_name_animation,display_name_fuzzy_settings,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors,accent_color,avatar_frame,avatar_decoration_id,profile_frame_id,profile_effect_id")
    .maybeSingle();

  if (error || !data) {
    console.error("[Community] Profile update failed.", { code: error?.code });
    return fail("No se pudo guardar tu identidad comunitaria.", 503);
  }

  return NextResponse.json({
    success: true,
    appearanceSaved: true,
    profile: {
      userId: data.user_id,
      memberNumber: data.member_number,
      displayName: data.display_name,
      pronouns: data.pronouns ?? "",
      statusText: data.status_expires_at && Date.parse(data.status_expires_at) <= Date.now() ? "" : data.status_text ?? "",
      statusExpiresAt: data.status_expires_at && Date.parse(data.status_expires_at) > Date.now() ? data.status_expires_at : null,
      about: data.about ?? "",
      cardColor: data.card_color ?? DEFAULT_CARD_COLOR,
      themeColorSecondary: data.theme_color_secondary ?? DEFAULT_THEME_SECONDARY,
      plateStyle: PLATE_STYLES.has(data.plate_style ?? "") ? data.plate_style : DEFAULT_PLATE_STYLE,
      displayNameStyle: DISPLAY_NAME_STYLES.has(data.display_name_style ?? "") ? data.display_name_style : DEFAULT_DISPLAY_NAME_STYLE,
      displayNameEffect: DISPLAY_NAME_EFFECTS.has(data.display_name_effect ?? "") ? data.display_name_effect : "plain",
      displayNameAnimation: DISPLAY_NAME_ANIMATIONS.has(data.display_name_animation === "glitch" ? "signal-break" : data.display_name_animation ?? "") ? (data.display_name_animation === "glitch" ? "signal-break" : data.display_name_animation) : "decrypt",
      displayNameFuzzySettings: normalizeFuzzyTextSettings(data.display_name_fuzzy_settings),
      displayNameColor: DISPLAY_NAME_COLORS.has(data.display_name_color ?? "") ? data.display_name_color : "default",
      displayNameGradientStart: data.display_name_gradient_start ?? "#B86BFF",
      displayNameGradientEnd: data.display_name_gradient_end ?? "#4E9BFF",
      displayNamePrismColors: data.display_name_prism_colors ?? DEFAULT_DISPLAY_NAME_PRISM_COLORS,
      accentColor: ACCENT_COLORS.has((data.accent_color ?? "").toUpperCase()) ? data.accent_color : DEFAULT_ACCENT_COLOR,
      avatarFrame: AVATAR_FRAMES.has(data.avatar_frame ?? "") ? data.avatar_frame : DEFAULT_AVATAR_FRAME,
      avatarDecorationId: AVATAR_DECORATIONS.has(data.avatar_decoration_id ?? "") ? data.avatar_decoration_id : DEFAULT_AVATAR_DECORATION,
      profileFrameId: PROFILE_FRAMES.has(data.profile_frame_id ?? "") ? data.profile_frame_id : DEFAULT_PROFILE_FRAME,
      profileEffectId: PROFILE_EFFECTS.has(data.profile_effect_id ?? "") ? data.profile_effect_id : DEFAULT_PROFILE_EFFECT,
      appearanceReady: true,
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
  // Discord-style identity: uploaded images belong to the avatar only.
  // The profile banner is a color surface persisted through PATCH.cardColor.
  if (kind !== "avatar") return fail("Solo puedes subir una imagen para tu avatar. El banner se personaliza con color.", 400);
  const maxBytes = MAX_AVATAR_BYTES;
  const bucket = "community-profile-avatars";
  const pathColumn = "avatar_path";
  const responseField = "avatarUrl";
  const file = parsed.formData.get("file");

  if (!(file instanceof File) || file.size <= 0 || file.size > maxBytes) {
    return fail("Selecciona una imagen válida de máximo 5 MB.", 413);
  }
  const allowedImageType = ["image/png", "image/jpeg", "image/webp"].includes(file.type) || (kind === "avatar" && file.type === "image/gif");
  if (!allowedImageType) {
    return fail("El avatar debe ser PNG, JPG, WebP o GIF.", 415);
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
    return fail("No se pudo preparar la actualización del avatar.", 503);
  }

  const storagePath = user.id + "/" + randomUUID() + "." + sanitized.extension;
  const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(storagePath, sanitized.buffer, {
    contentType: sanitized.contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (uploadError) {
    console.error("[Community] Profile image upload failed.", { bucket, code: uploadError.name });
    return fail("No se pudo guardar el avatar. Inténtalo de nuevo.", 503);
  }

  const { data: updatedProfile, error: updateError } = await supabaseAdmin.from("community_member_profiles")
    .update({ [pathColumn]: storagePath })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    await supabaseAdmin.storage.from(bucket).remove([storagePath]);
    console.error("[Community] Profile image reference update failed.", { code: updateError?.code });
    return fail("No se pudo actualizar el avatar.", 503);
  }

  const previousRecord = previous as { avatar_path?: string | null } | null;
  const previousPath = previousRecord?.[pathColumn];
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

export async function DELETE(request: Request, context: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId) || userId !== user.id) {
    return fail("Solo puedes retirar imágenes de tu propio perfil comunitario.", 403);
  }

  const raw = await readBodyWithinLimit(request, 1024);
  if (raw === null) return fail("La solicitud no es válida.", 400);
  let payload: { kind?: unknown };
  try {
    payload = JSON.parse(raw) as { kind?: unknown };
  } catch {
    return fail("El formato de la solicitud no es válido.", 400);
  }
  const kind = payload.kind;
  if (kind !== "avatar") return fail("Solo puedes retirar la imagen de tu avatar. El banner se personaliza con color.", 400);

  const bucket = "community-profile-avatars";
  const pathColumn = "avatar_path";
  const { data: current, error: readError } = await supabaseAdmin.from("community_member_profiles")
    .select(pathColumn)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("[Community] Image reference read failed.", { code: readError.code });
    return fail("No se pudo leer la imagen actual.", 503);
  }

  const currentRecord = current as { avatar_path?: string | null; banner_path?: string | null } | null;
  const previousPath = currentRecord?.[pathColumn];
  if (!previousPath) return NextResponse.json({ success: true, removed: false }, { headers: { "Cache-Control": "no-store" } });
  if (!OWNED_OBJECT_PATH.test(previousPath) || !previousPath.startsWith(user.id + "/")) {
    console.error("[Community] Refusing to remove an image with an unexpected storage path.");
    return fail("La ruta de la imagen no es válida.", 409);
  }

  const { data: updated, error: updateError } = await supabaseAdmin.from("community_member_profiles")
    .update({ [pathColumn]: null })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (updateError || !updated) {
    console.error("[Community] Image reference clear failed.", { code: updateError?.code });
    return fail("No se pudo retirar la imagen del perfil.", 503);
  }

  const { error: removeError } = await supabaseAdmin.storage.from(bucket).remove([previousPath]);
  if (removeError) {
    console.warn("[Community] Removed profile image reference but storage cleanup is pending.", { bucket, code: removeError.name });
  }
  return NextResponse.json({
    success: true,
    removed: true,
    cleanupPending: Boolean(removeError),
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
