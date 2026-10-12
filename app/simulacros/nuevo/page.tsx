import { redirect } from "next/navigation";

import NewSimulationForm from "@/components/simulacros/NewSimulationForm";
import { createClient } from "@/lib/supabase/server";

export default async function NuevoSimulacroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NewSimulationForm />;
}