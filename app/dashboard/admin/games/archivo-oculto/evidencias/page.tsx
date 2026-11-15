import { requireAdmin } from "@/lib/auth/admin";
import ArchivoOcultoEvidenceStudio from "@/components/games/ArchivoOcultoEvidenceStudio";

export const dynamic = "force-dynamic";

type EvidencePageProps = {
  searchParams: Promise<{ passageId?: string }>;
};

export default async function ArchivoOcultoEvidencePage({ searchParams }: EvidencePageProps) {
  await requireAdmin();
  const params = await searchParams;
  return <ArchivoOcultoEvidenceStudio initialPassageId={params.passageId ?? ""} />;
}
