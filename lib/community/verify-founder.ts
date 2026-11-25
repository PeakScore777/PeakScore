import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Founder identity is anchored to the only platform admin profile.
 * The database bootstrap is idempotent and service-role-only.
 */
export async function verifyCommunityFounder(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data: platformAdmins, error: adminLookupError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(2);

  if (adminLookupError || platformAdmins?.length !== 1 || platformAdmins[0]?.id !== userId) {
    return false;
  }

  const { data, error } = await supabaseAdmin.rpc("bootstrap_community_founder", {
    p_founder_user_id: userId,
  });

  return !error && data === true;
}
