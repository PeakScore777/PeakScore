import { redirect } from "next/navigation";

import SimulationsList from "@/components/simulacros/SimulationsList";
import { createClient } from "@/lib/supabase/server";

export default async function SimulacrosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SimulationsList />;
}