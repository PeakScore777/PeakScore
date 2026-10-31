import { requireOrbyOwner } from "@/lib/auth/orby-owner";
import OrbyKnowledgeStudio from "@/components/admin/OrbyKnowledgeStudio";

export const dynamic = "force-dynamic";

export default async function OrbyKnowledgePage() {
  await requireOrbyOwner();
  return <OrbyKnowledgeStudio />;
}
