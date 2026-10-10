import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import PerfilSidebar from "@/components/perfil/PerfilSidebar";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    redirect("/login");
  }

  if (
    assurance.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  ) {
    redirect("/login/mfa");
  }

  return (
    <div className="profile-biome-background min-h-screen text-[var(--app-text)] transition-colors duration-200">
      <PerfilSidebar />

      <div className="min-w-0 pb-24 lg:ml-[270px] lg:pb-0 xl:ml-[290px]">
        {children}
      </div>
    </div>
  );
}