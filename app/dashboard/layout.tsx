import { ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">

      <Sidebar />

      <main
        className="
          min-w-0
          flex-1
          overflow-x-hidden
          bg-slate-100
        "
      >
        {children}
      </main>

    </div>
  );
}