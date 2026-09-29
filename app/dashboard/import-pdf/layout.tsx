import { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/admin";

export default async function ImportPdfLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return children;
}
