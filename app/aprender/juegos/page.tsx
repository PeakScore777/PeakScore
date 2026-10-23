import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GamesHub from "@/components/games/GamesHub";

export const metadata = {
  title: "Juegos | PeakScore",
  description: "Minijuegos educativos para reforzar conceptos y aprender jugando.",
};

export default async function JuegosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <GamesHub />;
}
