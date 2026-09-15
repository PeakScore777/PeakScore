import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";

export default async function GenerateQuestionsPage() {
  await requireAdmin();

  redirect("/dashboard/question-bank/new?mode=ai");
}