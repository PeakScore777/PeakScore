import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const OWNER_EMAIL = (process.env.PEAKSCORE_OWNER_EMAIL || "aragonyostynsena07@gmail.com").trim().toLowerCase();

export async function getOrbyOwner() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.email?.trim().toLowerCase() !== OWNER_EMAIL) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin" || profile.id !== user.id) return null;

  return {
    user,
    label: typeof profile.full_name === "string" && profile.full_name.trim()
      ? profile.full_name.trim().slice(0, 80)
      : "Administrador principal",
  };
}

export async function requireOrbyOwner() {
  const owner = await getOrbyOwner();
  if (!owner) redirect("/dashboard/admin");
  return owner;
}
