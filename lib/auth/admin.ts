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
      "Error verificando permisos de administrador:",
      error
    );

    redirect("/dashboard");
  }

  // Usuario autenticado pero no administrador
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    user,
    profile,
  };
}