import { requireAdmin } from "@/lib/auth/admin";
import AdminGameQuestionsPanel from "@/components/games/AdminGameQuestionsPanel";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  await requireAdmin();
  return <AdminGameQuestionsPanel />;
}
