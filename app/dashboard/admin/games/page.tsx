import { requireAdmin } from "@/lib/auth/admin";
import AdminGamesWorkspace from "@/components/games/AdminGamesWorkspace";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  await requireAdmin();
  return <AdminGamesWorkspace />;
}
