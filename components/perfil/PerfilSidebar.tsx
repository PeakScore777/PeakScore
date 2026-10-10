"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserRound,
  UsersRound,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Medal,
  Settings,
} from "lucide-react";

const ITEMS = [
  { label: "Mi perfil", href: "/perfil", icon: UserRound },
  { label: "Personajes", href: "/perfil/personajes", icon: UsersRound },
  { label: "Tu rango", href: "/perfil/rango", icon: Trophy },
  {
    label: "Estadísticas",
    href: "/perfil/estadisticas",
    icon: ChartNoAxesColumnIncreasing,
  },
  { label: "Insignias", href: "/perfil/insignias", icon: Medal },
  {
    label: "Configuración",
    href: "/perfil/configuracion",
    icon: Settings,
  },
];

export default function PerfilSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/perfil"
      ? pathname === "/perfil"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside
        className="
          fixed bottom-0 left-0 top-[66px] z-40 hidden
          w-[270px] overflow-y-auto border-r px-4 py-6
          backdrop-blur-xl transition-colors duration-200
          lg:block xl:w-[290px]
          border-[var(--app-border)]
          bg-[var(--app-surface)]
          text-[var(--app-text)]
        "
      >
        <nav
          aria-label="Secciones del perfil"
          className="flex flex-col gap-2"
        >
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`
                  group flex min-h-[64px] items-center gap-4
                  rounded-xl border px-4 py-3
                  transition-all duration-200
                  ${
                    active
                      ? "border-violet-400/40 bg-violet-500/15 text-[var(--app-text)] shadow-[inset_3px_0_0_#a78bfa]"
                      : "border-transparent text-[var(--app-text-muted)] hover:border-[var(--app-border)] hover:bg-[var(--app-surface-secondary)] hover:text-[var(--app-text)]"
                  }
                `}
              >
                <span
                  className={`
                    flex size-11 shrink-0 items-center justify-center
                    rounded-lg transition-colors
                    ${
                      active
                        ? "bg-violet-500/15 text-violet-500"
                        : "bg-[var(--app-surface-secondary)] text-[var(--app-text-muted)] group-hover:text-[var(--app-text)]"
                    }
                  `}
                >
                  <Icon size={21} strokeWidth={1.8} />
                </span>

                <span className="text-sm font-semibold">
                  {item.label}
                </span>

                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-violet-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Barra de navegación inferior para móvil */}
      <nav
        aria-label="Secciones del perfil"
        className="
          fixed inset-x-0 bottom-0 z-50 border-t px-1 pt-2
          pb-[max(8px,env(safe-area-inset-bottom))]
          backdrop-blur-xl transition-colors duration-200
          lg:hidden
          border-[var(--app-border)]
          bg-[var(--app-surface)]/95
          text-[var(--app-text)]
        "
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`
                  relative flex min-w-0 flex-1 flex-col
                  items-center justify-center gap-1 rounded-lg
                  px-0.5 py-2 transition-colors duration-200
                  ${
                    active
                      ? "bg-violet-500/15 text-violet-500"
                      : "text-[var(--app-text-muted)] hover:bg-[var(--app-surface-secondary)] hover:text-[var(--app-text)]"
                  }
                `}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.3 : 1.8}
                />

                <span className="max-w-full truncate text-[9px] font-medium">
                  {item.label}
                </span>

                {active && (
                  <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-violet-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}