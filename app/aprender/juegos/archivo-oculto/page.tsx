import "@openpageflip/core/styles.css";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArchivoOcultoGame from "@/components/games/ArchivoOcultoGame";

export const metadata = {
  title: "El Archivo Oculto | PeakScore",
  description: "Practica Lectura Crítica Saber 11 con textos, preguntas y un libro interactivo.",
};

export default async function ArchivoOcultoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ArchivoOcultoGame />;
}
