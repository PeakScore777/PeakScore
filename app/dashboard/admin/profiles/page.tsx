import { redirect } from "next/navigation";

import AdminProfileManager from "@/components/dashboard/admin/AdminProfileManager";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminProfilesPage() {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  return <AdminProfileManager />;
}
