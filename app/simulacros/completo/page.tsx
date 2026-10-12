import { redirect } from "next/navigation";

import CompleteSimulationNotice from "@/components/simulacros/CompleteSimulationNotice";
import { createClient } from "@/lib/supabase/server";

export default async function SimulacroCompletoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CompleteSimulationNotice />;
}