import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { userId } = await context.params;
  if (!UUID_PATTERN.test(userId)) return fail("El perfil solicitado no es válido.", 400);

  const [profileResult, badgesResult] = await Promise.all([
    supabase.rpc("get_peakstyle_public_profile", { p_user_id: userId }),
    supabase.from("community_public_role_badges")
      .select("role_key,label,badge_color")
      .eq("user_id", userId),
  ]);

  if (profileResult.error) {
    if (profileResult.error.code === "42501") return fail("Este perfil no está disponible.", 403);
    console.error("[PeakStyle] Public profile read failed.", { code: profileResult.error.code });
    return fail("No se pudo cargar este perfil.", 503);
  }

  const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
  if (!profile) return fail("Este perfil no existe.", 404);

  return NextResponse.json({
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bannerUrl: profile.banner_url,
      bio: profile.profile_bio ?? "",
      pronouns: profile.profile_pronouns ?? "",
      level: profile.level,
      xp: profile.xp,
      selectedCharacter: profile.selected_character,
      equippedCosmetics: profile.equipped_cosmetics ?? [],
      roleBadges: badgesResult.error ? [] : (badgesResult.data ?? []).map((badge) => ({
        roleKey: badge.role_key,
        label: badge.label,
        badgeColor: badge.badge_color,
      })),
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
