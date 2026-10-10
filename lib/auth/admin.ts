import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No hay usuario autenticado
  if (!user) {
    redirect("/login");
  }

  // Obtener rol desde profiles
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Error verificando permisos de administrador.",
      {
        errorCode: error.code ?? "UNKNOWN",
      }
    );

    redirect("/dashboard");
  }

  // Usuario autenticado pero no administrador
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Las herramientas globales requieren MFA. Si todavía no hay
  // factor configurado, permite al administrador abrir Configuración.
  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    redirect("/perfil/configuracion");
  }

  if (assurance.currentLevel !== "aal2") {
    if (assurance.nextLevel === "aal2") {
      redirect("/login/mfa");
    }

    redirect("/perfil/configuracion");
  }

  return {
    user,
    profile,
  };
}