import { ReactNode } from "react";
import { redirect } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}