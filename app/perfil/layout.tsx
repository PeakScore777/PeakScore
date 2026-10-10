
"use client";

import { useEffect, useState, type ReactNode } from "react";
import PerfilSidebar from "@/components/perfil/PerfilSidebar";

export default function PerfilLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Se ejecuta una sola vez al montar el layout de Perfil.
  // Al navegar entre sus páginas, el layout permanece montado
  // y el sidebar no vuelve a mostrar el skeleton.
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
