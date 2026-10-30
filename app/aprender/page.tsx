import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LearningCatalog from "@/components/aprender/LearningCatalog";

export const metadata = {
  title: "Cursos | PeakScore",
  description: "Explora rutas de aprendizaje y prepárate para el examen Saber 11.",
};

export default async function AprenderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <LearningCatalog />;
}
