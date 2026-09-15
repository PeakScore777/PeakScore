"use client";

import {
  Search,
  Bell,
  LogOut,
  ChevronDown,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";

interface HeaderProps {
  userName: string;
  onLogout: () => void;
}

export default function Header({
  userName,
  onLogout,
}: HeaderProps) {
  const initial =
    userName?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[88px] items-center justify-between px-6 md:px-8 lg:px-10">

        {/* ==================================================
            IDENTIDAD DEL DASHBOARD
        ================================================== */}

        <div className="flex min-w-0 items-center gap-4">

          {/* =================================================
              PEAKSCORE VISUAL MARK
          ================================================= */}

          <div className="relative hidden h-[48px] w-[48px] shrink-0 sm:block">

            {/* Glow */}

            <div className="absolute inset-0 rounded-[15px] bg-blue-500/15 blur-md" />

            {/* Main square */}

            <div
              className="
                relative
                flex
                h-full
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-[15px]
                bg-gradient-to-br
                from-blue-500
                via-blue-600
                to-blue-700
                shadow-[0_8px_24px_rgba(37,99,235,0.22)]
              "
            >
              {/* Decorative shine */}

              <div className="absolute -right-3 -top-4 h-8 w-8 rounded-full bg-white/15" />

              <div className="absolute -bottom-4 -left-3 h-7 w-7 rounded-full bg-white/10" />

              {/* PeakScore mark */}

              <span className="relative text-[21px] font-black tracking-[-0.08em] text-white">
                P
              </span>
            </div>

            {/* Active indicator */}

            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          {/* =================================================
              GREETING CONTENT
          ================================================= */}

          <div className="min-w-0">

            {/* Top line */}

            <div className="mb-1.5 flex items-center gap-2">

              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[9px] font-bold uppercase tracking-[0.19em] text-slate-400">
                  Sesión activa
                </span>
              </div>

              <span className="h-3 w-px bg-slate-200" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-blue-600">
                PeakScore
              </span>
            </div>

            {/* Main greeting */}

            <div className="flex items-center gap-3">

              <h1 className="truncate text-[25px] font-bold leading-none tracking-[-0.045em] text-slate-950 md:text-[27px]">
                Hola, {userName}
              </h1>

              {/* Study status */}

              <div
                className="
                  hidden
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-blue-100
                  bg-blue-50/70
                  px-2.5
                  py-1
                  md:flex
                "
              >
                <GraduationCap
                  size={11}
                  strokeWidth={2}
                  className="text-blue-600"
                />

                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-blue-600">
                  Preparación ICFES
                </span>
              </div>

            </div>

            {/* Supporting line */}

            <div className="mt-1.5 flex items-center gap-2">

              <p className="text-[11px] font-medium text-slate-400">
                Tu progreso comienza con una sesión más.
              </p>

              <ArrowUpRight
                size={12}
                strokeWidth={2}
                className="text-slate-300"
              />

            </div>

          </div>
        </div>

        {/* ==================================================
            CONTROLES
        ================================================== */}

        <div className="flex items-center gap-2 md:gap-3">

          {/* =================================================
              BUSCADOR
          ================================================= */}

          <div
            className="
              hidden
              h-[42px]
              w-[220px]
              items-center
              rounded-xl
              border
              border-slate-200
              bg-slate-50/50
              px-3.5
              transition-all
              duration-200
              focus-within:border-blue-300
              focus-within:bg-white
              focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.05)]
              lg:flex
            "
          >
            <Search
              size={16}
              strokeWidth={1.8}
              className="shrink-0 text-slate-400"
            />

            <input
              type="text"
              placeholder="Buscar..."
              className="
                ml-2.5
                h-full
                min-w-0
                flex-1
                bg-transparent
                text-[12px]
                font-medium
                text-slate-700
                outline-none
                placeholder:text-slate-400
              "
            />

            <span
              className="
                ml-2
                hidden
                rounded-md
                border
                border-slate-200
                bg-white
                px-1.5
                py-0.5
                text-[9px]
                font-semibold
                text-slate-400
                xl:block
              "
            >
              /
            </span>
          </div>

          {/* =================================================
              NOTIFICACIONES
          ================================================= */}

          <button
            type="button"
            aria-label="Notificaciones"
            className="
              relative
              flex
              h-[42px]
              w-[42px]
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-500
              transition-all
              duration-200
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-800
              active:scale-95
            "
          >
            <Bell
              size={17}
              strokeWidth={1.8}
            />

            <span
              className="
                absolute
                right-[9px]
                top-[8px]
                h-1.5
                w-1.5
                rounded-full
                bg-blue-600
                ring-2
                ring-white
              "
            />
          </button>

          {/* =================================================
              DIVISOR
          ================================================= */}

          <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />

          {/* =================================================
              PERFIL
          ================================================= */}

          <button
            type="button"
            className="
              group
              flex
              items-center
              gap-2.5
              rounded-xl
              px-1.5
              py-1
              transition-colors
              duration-200
              hover:bg-slate-50
            "
          >

            {/* Avatar */}

            <div
              className="
                flex
                h-[42px]
                w-[42px]
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-blue-500
                via-blue-600
                to-blue-700
                text-[13px]
                font-bold
                text-white
                shadow-[0_6px_18px_rgba(37,99,235,0.20)]
              "
            >
              {initial}
            </div>

            {/* User info */}

            <div className="hidden min-w-0 text-left xl:block">

              <p className="max-w-[120px] truncate text-[12px] font-bold leading-tight text-slate-800">
                {userName}
              </p>

              <p className="mt-1 text-[10px] font-medium leading-none text-slate-400">
                Estudiante
              </p>

            </div>

            <ChevronDown
              size={14}
              strokeWidth={1.8}
              className="
                hidden
                text-slate-400
                transition-transform
                duration-200
                group-hover:translate-y-0.5
                xl:block
              "
            />

          </button>

          {/* =================================================
              DIVISOR
          ================================================= */}

          <div className="hidden h-8 w-px bg-slate-200 md:block" />

          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="
              flex
              h-[42px]
              w-[42px]
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-400
              transition-all
              duration-200
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-500
              active:scale-95
            "
          >
            <LogOut
              size={17}
              strokeWidth={1.8}
            />
          </button>

        </div>
      </div>
    </header>
  );
}