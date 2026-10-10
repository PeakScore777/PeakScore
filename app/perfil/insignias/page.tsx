import { redirect } from "next/navigation";

import InsigniasColeccion from "@/components/perfil/InsigniasColeccion";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function InsigniasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: badgeRows, error: badgesError },
    { data: userBadges, error: userBadgesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("badges")
      .select("id, name, description, requirement_type, requirement_target, icon")
      .order("name", { ascending: true }),
    supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", user.id),
  ]);

  if (badgesError) {
    console.error("[Insignias] Error al leer el catálogo.", {
      code: badgesError.code ?? "UNKNOWN",
    });
  }

  if (userBadgesError) {
    console.error("[Insignias] Error al leer la colección del usuario.", {
      code: userBadgesError.code ?? "UNKNOWN",
    });
  }

  const earned = new Map(
    (userBadges ?? []).map((item) => [item.badge_id, item.unlocked_at]),
  );

  const badges = (badgeRows ?? []).map((badge) => ({
    ...badge,
    unlockedAt: earned.get(badge.id) ?? null,
  }));

  return (
    <InsigniasColeccion
      badges={badges}
      error={
        badgesError || userBadgesError
          ? "No pudimos cargar una parte de la colección. Recarga la página para volver a intentarlo."
          : null
      }
    />
  );
}
