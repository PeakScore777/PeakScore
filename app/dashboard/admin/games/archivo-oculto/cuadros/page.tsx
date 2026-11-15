import { requireAdmin } from "@/lib/auth/admin";
import ArchivoOcultoFrameStudio from "@/components/games/ArchivoOcultoFrameStudio";

export const dynamic = "force-dynamic";

export default async function ArchivoOcultoFramesPage() {
  await requireAdmin();
  return <ArchivoOcultoFrameStudio />;
}
