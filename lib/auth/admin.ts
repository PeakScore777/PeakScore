import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Stable identity of PeakScore's platform owner. This is not a secret:
 * authorization still requires the server-read profile role and a verified
 * MFA session. Never derive this identity from client-provided data.
 */
export const CANONICAL_ADMIN_USER_ID =
  "a72e2869-97d5-4dcc-9636-4afabc229879";

export function isCanonicalAdmin(
  userId: string,
  role: string | null | undefined,
): boolean {
  return userId === CANONICAL_ADMIN_USER_ID && role === "admin";
}

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

  // El propietario canónico debe coincidir con el rol administrado en DB.
  if (!isCanonicalAdmin(user.id, profile?.role)) {
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