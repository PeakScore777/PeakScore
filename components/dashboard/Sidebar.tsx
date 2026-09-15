"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { supabase } from "@/lib/supabase/browser";
import { updateUserStreak } from "@/lib/services/streak.service";

import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  UserRound,
  ShieldCheck,
  Database,
  Flame,
  ChevronRight,
  Sparkles,
  Crown,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);
  const [streak, setStreak] = useState(0);

  /*
   * ============================================================
   * VERIFICAR ROL DEL USUARIO
   * ============================================================
   */

  useEffect(() => {
    async function checkAdminRole() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Error obteniendo usuario:",
            userError
          );

          setIsAdmin(false);
          return;
        }

        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data, error } = await supabase
          .from("institution_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error(
            "Error verificando rol:",
            error
          );

          setIsAdmin(false);
          return;
        }

        setIsAdmin(data?.role === "admin");
      } catch (error) {
        console.error(
          "Error inesperado verificando administrador:",
          error
        );

        setIsAdmin(false);
      }
    }

    /*
     * ============================================================
     * CARGAR RACHA REAL DEL USUARIO
     * ============================================================
     */

    async function loadStreak() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(
            "[PeakScore] No se pudo obtener el usuario para la racha:",
            userError
          );

          return;
        }

        const currentStreak = await updateUserStreak(user.id);

        setStreak(currentStreak);
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando racha:",
          error
        );
      }
    }

    checkAdminRole();
    loadStreak();
  }, []);

  /*
   * ============================================================
   * RUTA ACTIVA
   * ============================================================
   */

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  /*
   * ============================================================
   * NAVEGACIÓN PRINCIPAL
   * ============================================================
   */

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Simulacros",
      href: "/simulacros",
      icon: ClipboardCheck,
    },
    {
      label: "Estadísticas",
      href: "/estadisticas",
      icon: BarChart3,
    },
    {
      label: "Perfil",
      href: "/perfil",
      icon: UserRound,
    },
  ];

  return (
    <aside
      className="
        sticky
        top-0
        flex
        h-screen
        w-[278px]
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-slate-800/80
        bg-[#080F1D]
        text-white
      "
    >
      {/* ======================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-blue-600/[0.07] blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/[0.045] blur-3xl" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </div>

      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className="relative border-b border-white/[0.07] px-6 py-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
        >
          {/* LOGO */}

          <div
            className="
              relative
              flex
              h-[43px]
              w-[43px]
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-[13px]
              bg-gradient-to-br
              from-blue-500
              via-blue-600
              to-indigo-700
              shadow-[0_8px_24px_rgba(37,99,235,0.28)]
              transition-transform
              duration-300
              group-hover:scale-[1.04]
            "
          >
            <span className="relative z-10 text-[21px] font-black tracking-[-0.06em] text-white">
              P
            </span>

            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

            <div className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/10 blur-md" />
          </div>

          {/* BRAND TEXT */}

          <div className="min-w-0">
            <div className="text-[19px] font-extrabold tracking-[-0.045em] text-white">
              Peak<span className="text-blue-400">Score</span>
            </div>

            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-500">
              Preparación ICFES
            </p>
          </div>
        </Link>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="relative flex-1 overflow-y-auto px-4 py-7 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {/* ====================================================
            MAIN SECTION
        ==================================================== */}

        <div className="mb-3 px-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-slate-600">
            Tu preparación
          </p>
        </div>

        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group
                  relative
                  flex
                  h-[54px]
                  items-center
                  gap-3
                  rounded-[13px]
                  px-3
                  transition-all
                  duration-200
                  ${
                    active
                      ? `
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        text-white
                        shadow-[0_8px_24px_rgba(37,99,235,0.22)]
                      `
                      : `
                        text-slate-400
                        hover:bg-white/[0.045]
                        hover:text-slate-100
                      `
                  }
                `}
              >
                {/* ACTIVE INDICATOR */}

                {active && (
                  <span
                    className="
                      absolute
                      -left-4
                      top-1/2
                      h-7
                      w-[3px]
                      -translate-y-1/2
                      rounded-r-full
                      bg-blue-400
                      shadow-[0_0_12px_rgba(96,165,250,0.8)]
                    "
                  />
                )}

                {/* ICON */}

                <span
                  className={`
                    flex
                    h-[36px]
                    w-[36px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[10px]
                    transition-all
                    duration-200
                    ${
                      active
                        ? "bg-white/12 text-white"
                        : "bg-white/[0.035] text-slate-500 group-hover:bg-white/[0.07] group-hover:text-slate-200"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2 : 1.7}
                  />
                </span>

                {/* LABEL */}

                <span
                  className={`
                    flex-1
                    text-[13px]
                    ${
                      active
                        ? "font-semibold"
                        : "font-medium"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* CHEVRON */}

                <ChevronRight
                  size={15}
                  strokeWidth={1.7}
                  className={`
                    transition-all
                    duration-200
                    ${
                      active
                        ? "translate-x-0 text-white/70"
                        : "-translate-x-1 text-slate-700 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    }
                  `}
                />
              </Link>
            );
          })}
        </nav>

        {/* ====================================================
            PROGRESS
        ==================================================== */}

        <div className="mt-8">
          <div className="mb-3 px-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-slate-600">
              Progreso
            </p>
          </div>

          <div
            className="
              relative
              overflow-hidden
              rounded-[17px]
              border
              border-white/[0.07]
              bg-gradient-to-br
              from-white/[0.055]
              to-white/[0.018]
              p-4
            "
          >
            {/* subtle glow */}

            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/[0.06] blur-2xl" />

            <div className="relative">
              {/* TOP */}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-[10px]
                      border
                      border-orange-400/10
                      bg-orange-500/[0.09]
                      text-orange-400
                    "
                  >
                    <Flame
                      size={17}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-200">
                      Racha actual
                    </p>

                    <p className="mt-0.5 text-[9px] font-medium text-slate-500">
                      Mantén el ritmo
                    </p>
                  </div>
                </div>

                <span className="text-[13px] font-bold text-orange-400">
                  {streak} {streak === 1 ? "día" : "días"}
                </span>
              </div>

              {/* PROGRESS BAR */}

              <div className="mt-4">
                <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    style={{
                      width: `${Math.min(
                        (streak / 7) * 100,
                        100
                      )}%`,
                    }}
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-orange-500
                      to-amber-300
                      shadow-[0_0_10px_rgba(249,115,22,0.25)]
                    "
                  />
                </div>
              </div>

              <p className="mt-3 text-[9px] font-medium leading-relaxed text-slate-600">
                Sigue preparándote para mantener tu progreso.
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================
            ADMINISTRATION
        ==================================================== */}

        {isAdmin && (
          <div className="mt-8">
            {/* SECTION TITLE */}

            <div className="mb-3 flex items-center gap-3 px-3">
              <span className="h-px flex-1 bg-white/[0.07]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-600">
                Administración
              </span>

              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>

            <nav className="space-y-1.5">
              {/* ADMIN PANEL */}

              <Link
                href="/dashboard/admin"
                className={`
                  group
                  flex
                  h-[54px]
                  items-center
                  gap-3
                  rounded-[13px]
                  px-3
                  transition-all
                  duration-200
                  ${
                    isActive("/dashboard/admin")
                      ? "bg-white/[0.075] text-white"
                      : "text-slate-400 hover:bg-white/[0.045] hover:text-white"
                  }
                `}
              >
                <span
                  className="
                    flex
                    h-[36px]
                    w-[36px]
                    items-center
                    justify-center
                    rounded-[10px]
                    bg-indigo-500/[0.09]
                    text-indigo-400
                  "
                >
                  <ShieldCheck
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                <span className="flex-1 text-[13px] font-medium">
                  Panel de administración
                </span>

                <ChevronRight
                  size={15}
                  className="text-slate-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500"
                />
              </Link>

              {/* QUESTION BANK */}

              <Link
                href="/dashboard/question-bank"
                className={`
                  group
                  flex
                  h-[54px]
                  items-center
                  gap-3
                  rounded-[13px]
                  px-3
                  transition-all
                  duration-200
                  ${
                    isActive("/dashboard/question-bank")
                      ? "bg-white/[0.075] text-white"
                      : "text-slate-400 hover:bg-white/[0.045] hover:text-white"
                  }
                `}
              >
                <span
                  className="
                    flex
                    h-[36px]
                    w-[36px]
                    items-center
                    justify-center
                    rounded-[10px]
                    bg-emerald-500/[0.09]
                    text-emerald-400
                  "
                >
                  <Database
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                <span className="flex-1 text-[13px] font-medium">
                  Banco de preguntas
                </span>

                <ChevronRight
                  size={15}
                  className="text-slate-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500"
                />
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* ======================================================
          BOTTOM BRAND CARD
      ====================================================== */}

      <div className="relative border-t border-white/[0.07] p-4">
        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[15px]
            border
            border-white/[0.07]
            bg-white/[0.025]
            px-3.5
            py-3
            transition-colors
            duration-200
            hover:bg-white/[0.04]
          "
        >
          {/* glow */}

          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-500/[0.06] blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-[10px]
                bg-blue-500/[0.09]
                text-blue-400
              "
            >
              <Sparkles
                size={16}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[11px] font-bold text-slate-300">
                  PeakScore
                </p>

                <Crown
                  size={11}
                  className="text-blue-400"
                />
              </div>

              <p className="mt-0.5 truncate text-[9px] font-medium text-slate-600">
                Tu progreso, un paso a la vez.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}