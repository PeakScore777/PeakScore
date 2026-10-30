import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrbyWorkspacePage from "@/components/aprender/OrbyWorkspacePage";

export const metadata: Metadata = {
  title: "Orby · Tu espacio de estudio | PeakScore",
  description: "Conversaciones, explicaciones y notas de voz para preparar Saber 11.",
};

export const dynamic = "force-dynamic";

export default async function OrbyPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <OrbyWorkspacePage />;
}
