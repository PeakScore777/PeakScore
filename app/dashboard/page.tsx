import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("intro_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Dashboard intro status lookup failed:", error.message);
    redirect("/perfil");
  }

  if (!profile) {
    redirect("/perfil");
  }

  if (!profile.intro_completed_at) {
    redirect("/intro");
  }

  redirect("/perfil");
}
