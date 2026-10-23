import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QueEsEsaVainaGame from "@/components/games/QueEsEsaVainaGame";

export const metadata = {
  title: "¿Qué es esa vaina? | PeakScore Juegos",
  description: "Descifra pistas, aprende conceptos y refuerza tus conocimientos para el ICFES.",
};

export default async function QueEsEsaVainaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <QueEsEsaVainaGame />;
}
