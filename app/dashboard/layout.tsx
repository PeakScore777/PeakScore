import { ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">

      <Sidebar />

      <main className="flex-1 bg-slate-100">
        {children}
      </main>

    </div>
  );
}