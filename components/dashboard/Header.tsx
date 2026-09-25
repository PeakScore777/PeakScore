"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";

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
    <header
      className="
        sticky
        top-0
        z-50
        h-[76px]
        overflow-hidden
        border-b
        border-cyan-400/10
        bg-[#020817]
      "
    >
      {/* =====================================================
          FONDO PEAKSCORE
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0">
        {/* Base */}
        <div className="absolute inset-0 bg-[#020817]" />

        {/* Imagen espacial transparente */}
        <Image
          src="/dashboard/header-space.png"
          alt=""
          fill
          priority
          className="
            object-cover
            object-center
            opacity-95
          "
        />

        {/* Degradado para que el contenido siga siendo legible */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-[#020817]/90
            via-[#020817]/35
            to-[#020817]/75
          "
        />

        {/* Oscurecimiento inferior */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-8
            bg-gradient-to-t
            from-[#020817]/80
            to-transparent
          "
        />

        {/* Línea luminosa inferior */}
        <div
          className="
            absolute
            bottom-0
            left-0
            right-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-400/30
            to-transparent
          "
        />
      </div>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div
        className="
          relative
          z-10
          flex
          h-full
          items-center
          justify-end
          px-5
          md:px-8
          lg:px-10
        "
      >
        <div className="flex items-center gap-3">

          {/* =================================================
              PERFIL
          ================================================= */}

          <div
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-cyan-400/20
              bg-[#061224]/80
              px-3
              py-2
              shadow-[0_0_24px_rgba(34,211,238,0.08)]
              backdrop-blur-md
            "
          >
            {/* Avatar */}

            <div
              className="
                relative
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                border
                border-cyan-400/40
                bg-[#071a30]
                shadow-[0_0_14px_rgba(34,211,238,0.12)]
              "
            >
              {/* Brillo */}

              <div
                className="
                  absolute
                  inset-0
                  bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.28),transparent_65%)]
                "
              />

              <span
                className="
                  relative
                  z-10
                  text-[13px]
                  font-black
                  text-cyan-300
                "
              >
                {initial}
              </span>
            </div>

            {/* Información */}

            <div className="hidden min-w-0 sm:block">
              <p
                className="
                  max-w-[150px]
                  truncate
                  text-[12px]
                  font-bold
                  leading-tight
                  text-white
                "
              >
                {userName}
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-emerald-400
                    shadow-[0_0_7px_rgba(52,211,153,0.9)]
                  "
                />

                <span
                  className="
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-cyan-300/70
                  "
                >
                  Tu perfil
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              DIVISOR
          ================================================= */}

          <div
            className="
              hidden
              h-9
              w-px
              bg-gradient-to-b
              from-transparent
              via-cyan-400/25
              to-transparent
              sm:block
            "
          />

          {/* =================================================
              CERRAR SESIÓN
          ================================================= */}

          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="
              group
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-400/15
              bg-[#061224]/80
              text-slate-400
              shadow-[0_0_18px_rgba(34,211,238,0.04)]
              backdrop-blur-md
              transition-all
              duration-200
              hover:border-red-400/40
              hover:bg-red-500/10
              hover:text-red-400
              active:scale-95
            "
          >
            <LogOut
              size={16}
              strokeWidth={1.8}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
            />
          </button>
        </div>
      </div>
    </header>
  );
}