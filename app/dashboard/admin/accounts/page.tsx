import AdminAccountModeration from "@/components/dashboard/admin/AdminAccountModeration";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminAccountsPage() {
  await requireAdmin();
  return <AdminAccountModeration />;
}
