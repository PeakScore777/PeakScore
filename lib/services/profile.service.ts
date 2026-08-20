import { supabase } from "@/lib/supabase/browser";
import type { Profile } from "@/types/profile";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error obteniendo el perfil:", error);
    return null;
  }

  return data as Profile;
}