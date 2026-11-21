import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";

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
    const { data } = await supabase.storage.from("community-profile-avatars")
      .createSignedUrl(profileResult.data.avatar_path, 1800);
    avatarUrl = data?.signedUrl ?? null;
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

export async function PATCH(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

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
    .upsert({
      user_id: user.id,
      display_name: displayName,
      pronouns,
      status_text: statusText,
      about,
    }, { onConflict: "user_id" })
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
