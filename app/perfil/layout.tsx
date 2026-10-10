import type { ReactNode } from "react";
import PerfilSidebar from "@/components/perfil/PerfilSidebar";

export default function PerfilLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="profile-biome-background min-h-screen text-[var(--app-text)] transition-colors duration-200">
      <PerfilSidebar />

      <div className="min-w-0 pb-24 lg:ml-[270px] lg:pb-0 xl:ml-[290px]">
        {children}
      </div>
    </div>
  );
}