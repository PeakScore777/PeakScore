import { requireAdmin } from "@/lib/auth/admin";
import ArchivoOcultoOSStudio from "@/components/games/ArchivoOcultoOSStudio";

export const dynamic = "force-dynamic";

export default async function ArchivoOcultoOSPage() {
  await requireAdmin();
  return <ArchivoOcultoOSStudio />;
}
