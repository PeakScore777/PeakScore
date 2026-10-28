import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeasonContext } from "@/lib/gamification/season-service";
import { getRankBySeasonXp } from "@/lib/gamification/ranks";
import LearningCatalog from "@/components/aprender/LearningCatalog";

export const metadata = {
  title: "Cursos | PeakScore",
  description: "Explora rutas de aprendizaje y prepárate para el examen Saber 11.",
};

function safeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export default async function AprenderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, coins")
    .eq("id", user.id)
    .maybeSingle();

  let seasonXp = 0;
  let rankName = "Aprendiz";
  let seasonName = "TEMPORADA ACTUAL";

  try {
    const { season, participation } = await getCurrentSeasonContext(user.id);
    seasonXp = safeNumber(participation.seasonXp);
    seasonName = season.name.toLocaleUpperCase("es-CO");
    rankName = getRankBySeasonXp(
      seasonXp,
      participation.startingRank === "aprendiz",
    ).name;
  } catch (error) {
    console.error("[Niveles] No se pudo cargar el contexto de temporada:", error);
  }

  const coins = safeNumber(profile?.coins);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "EXPLORADOR";

  return (
    <LearningCatalog
      firstName={firstName}
      seasonName={seasonName}
      seasonXp={seasonXp}
      coins={coins}
      rankName={rankName}
    />
  );
}
