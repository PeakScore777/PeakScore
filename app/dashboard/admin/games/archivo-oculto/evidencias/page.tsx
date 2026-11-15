import { requireAdmin } from "@/lib/auth/admin";
import ArchivoOcultoEvidenceStudio from "@/components/games/ArchivoOcultoEvidenceStudio";

export const dynamic = "force-dynamic";

export default async function ArchivoOcultoEvidencePage() {
  await requireAdmin();
  return <ArchivoOcultoEvidenceStudio />;
}
