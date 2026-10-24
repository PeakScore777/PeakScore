import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CasoCeroGame from "@/components/games/CasoCeroGame";

export const metadata = {
  title: "Caso Cero | PeakScore Juegos",
  description: "Investiga evidencias, interpreta datos y desarrolla el razonamiento científico para Saber 11.",
};

export default async function CasoCeroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CasoCeroGame />;
}
