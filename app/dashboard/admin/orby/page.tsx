import { requireAdmin } from "@/lib/auth/admin";
import OrbyKnowledgeStudio from "@/components/admin/OrbyKnowledgeStudio";

export const dynamic = "force-dynamic";

export default async function OrbyKnowledgePage() {
  await requireAdmin();
  return <OrbyKnowledgeStudio />;
}
