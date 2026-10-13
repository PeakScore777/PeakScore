"use client";

import { useEffect, useState, type ReactNode } from "react";
import PerfilSidebar from "@/components/perfil/PerfilSidebar";

export default function PerfilClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // El layout cliente permanece montado al navegar entre secciones del perfil.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSidebarLoading(false);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="profile-biome-background min-h-screen text-[var(--app-text)] transition-colors duration-200">
      <PerfilSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((current) => !current)}
        loading={sidebarLoading}
      />

      <div
        className={`
          min-w-0 pb-24 transition-[margin] duration-300 ease-in-out
          lg:pb-0
          ${
            sidebarOpen
              ? "lg:ml-[270px] xl:ml-[290px]"
              : "lg:ml-0"
          }
        `}
      >
        {children}
      </div>
    </div>
  );
}
