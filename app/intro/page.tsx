import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntroExperience from "./IntroExperience";

export default async function IntroPage() {
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
    console.error("Intro status lookup failed:", error.message);
    // Do not expose an unhandled database error page.
    // The onboarding migration must be applied before enabling this route.
    redirect("/perfil/personaje");
  }

  if (!profile) {
    redirect("/perfil/personaje");
  }

  if (profile.intro_completed_at) {
    redirect("/perfil/personaje");
  }

  return <IntroExperience />;
}
