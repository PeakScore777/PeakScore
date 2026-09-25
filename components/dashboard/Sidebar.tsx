"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { supabase } from "@/lib/supabase/browser";

import {
  LayoutDashboard,
  ClipboardCheck,
  UserRound,
  ShieldCheck,
  Database,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);

  /*
   * ============================================================
   * VERIFICAR ROL DEL USUARIO
   * ============================================================
   *
   * SOLO los usuarios con role = "admin"
   * pueden ver la sección de Administración.
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

    checkAdminRole();
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
   * NAVEGACIÓN
   * ============================================================
   *
   * Estadísticas:
   * eliminada porque ya está dentro del Dashboard.
   *
   * Racha:
   * eliminada porque ahora está en las StatCards.
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
        z-50
        flex
        h-screen
        w-[290px]
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-[#17294A]
        bg-[#070D1D]
        text-white
      "
    >
      {/* ======================================================
          AMBIENTE GALÁCTICO PEAKSCORE
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Fondo principal */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-[#08152A]
            via-[#080F20]
            to-[#0B0920]
          "
        />

        {/* Glow azul superior */}

        <div
          className="
            absolute
            -left-[180px]
            -top-[160px]
            h-[430px]
            w-[430px]
            rounded-full
            bg-cyan-400/[0.08]
            blur-[120px]
          "
        />

        {/* Glow violeta inferior */}

        <div
          className="
            absolute
            -bottom-[180px]
            -right-[180px]
            h-[500px]
            w-[500px]
            rounded-full
            bg-violet-500/[0.09]
            blur-[130px]
          "
        />

        {/* Glow rosa */}

        <div
          className="
            absolute
            left-[35%]
            top-[42%]
            h-[220px]
            w-[220px]
            rounded-full
            bg-fuchsia-400/[0.035]
            blur-[100px]
          "
        />

        {/* ==================================================
            ÓRBITAS DECORATIVAS
        ================================================== */}

        <div
          className="
            absolute
            -right-[150px]
            top-[90px]
            h-[150px]
            w-[390px]
            rotate-[-20deg]
            rounded-[50%]
            border
            border-cyan-300/[0.045]
          "
        />

        <div
          className="
            absolute
            -right-[170px]
            top-[115px]
            h-[205px]
            w-[450px]
            rotate-[-20deg]
            rounded-[50%]
            border
            border-violet-300/[0.035]
          "
        />

        {/* ==================================================
            ESTRELLAS
        ================================================== */}

        <span
          className="
            absolute
            left-[15%]
            top-[12%]
            h-[3px]
            w-[3px]
            rounded-full
            bg-white
            shadow-[0_0_10px_rgba(255,255,255,0.9)]
          "
        />

        <span
          className="
            absolute
            left-[80%]
            top-[9%]
            h-[2px]
            w-[2px]
            rounded-full
            bg-cyan-200
            shadow-[0_0_9px_rgba(103,232,249,0.95)]
          "
        />

        <span
          className="
            absolute
            right-[14%]
            top-[28%]
            h-[2px]
            w-[2px]
            rounded-full
            bg-yellow-200
            shadow-[0_0_9px_rgba(253,224,71,0.85)]
          "
        />

        <span
          className="
            absolute
            left-[8%]
            top-[48%]
            h-[2px]
            w-[2px]
            rounded-full
            bg-fuchsia-300
            shadow-[0_0_9px_rgba(244,114,182,0.9)]
          "
        />

        <span
          className="
            absolute
            right-[8%]
            bottom-[28%]
            h-[2px]
            w-[2px]
            rounded-full
            bg-cyan-200
            shadow-[0_0_9px_rgba(103,232,249,0.85)]
          "
        />

        <span
          className="
            absolute
            left-[18%]
            bottom-[15%]
            h-[3px]
            w-[3px]
            rounded-full
            bg-violet-200
            shadow-[0_0_10px_rgba(196,181,253,0.85)]
          "
        />

        {/* ==================================================
            DESTELLO
        ================================================== */}

        <div
          className="
            absolute
            right-[20%]
            top-[22%]
            h-5
            w-5
          "
        >
          <span
            className="
              absolute
              left-1/2
              top-0
              h-full
              w-px
              -translate-x-1/2
              bg-cyan-200/70
            "
          />

          <span
            className="
              absolute
              left-0
              top-1/2
              h-px
              w-full
              -translate-y-1/2
              bg-cyan-200/70
            "
          />

          <span
            className="
              absolute
              left-1/2
              top-1/2
              h-1.5
              w-1.5
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-white
              shadow-[0_0_10px_rgba(103,232,249,1)]
            "
          />
        </div>

        {/* ==================================================
            NUBES PIXELADAS
        ================================================== */}

        {/* Nube rosa */}

        <div
          className="
            absolute
            left-[-20px]
            top-[23%]
            h-[18px]
            w-[82px]
            opacity-70
          "
        >
          <span
            className="
              absolute
              bottom-0
              left-0
              h-2
              w-8
              bg-pink-400/25
            "
          />

          <span
            className="
              absolute
              bottom-2
              left-5
              h-3
              w-7
              bg-pink-400/30
            "
          />

          <span
            className="
              absolute
              bottom-0
              left-11
              h-2
              w-10
              bg-pink-400/20
            "
          />

          <span
            className="
              absolute
              bottom-3
              left-7
              h-2
              w-5
              bg-fuchsia-300/25
            "
          />
        </div>

        {/* Nube cyan */}

        <div
          className="
            absolute
            right-[-15px]
            top-[34%]
            h-[20px]
            w-[92px]
            opacity-60
          "
        >
          <span
            className="
              absolute
              bottom-0
              right-0
              h-2
              w-9
              bg-cyan-400/20
            "
          />

          <span
            className="
              absolute
              bottom-2
              right-7
              h-3
              w-8
              bg-cyan-300/25
            "
          />

          <span
            className="
              absolute
              bottom-0
              right-14
              h-2
              w-9
              bg-blue-400/20
            "
          />

          <span
            className="
              absolute
              bottom-3
              right-10
              h-2
              w-6
              bg-cyan-200/20
            "
          />
        </div>

        {/* Nube amarilla */}

        <div
          className="
            absolute
            left-[-10px]
            bottom-[23%]
            h-[20px]
            w-[90px]
            opacity-45
          "
        >
          <span
            className="
              absolute
              bottom-0
              left-0
              h-2
              w-10
              bg-yellow-300/20
            "
          />

          <span
            className="
              absolute
              bottom-2
              left-6
              h-3
              w-8
              bg-amber-300/25
            "
          />

          <span
            className="
              absolute
              bottom-0
              left-13
              h-2
              w-9
              bg-yellow-200/20
            "
          />
        </div>

        {/* Nube violeta */}

        <div
          className="
            absolute
            right-[-20px]
            bottom-[10%]
            h-[24px]
            w-[100px]
            opacity-40
          "
        >
          <span
            className="
              absolute
              bottom-0
              right-0
              h-2
              w-10
              bg-violet-400/25
            "
          />

          <span
            className="
              absolute
              bottom-2
              right-8
              h-3
              w-8
              bg-fuchsia-400/20
            "
          />

          <span
            className="
              absolute
              bottom-0
              right-16
              h-2
              w-9
              bg-purple-300/20
            "
          />
        </div>

        {/* Línea superior */}

        <div
          className="
            absolute
            left-0
            right-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-300/50
            to-transparent
          "
        />
      </div>

      {/* ======================================================
          HEADER / LOGO
      ====================================================== */}

      <header
        className="
          relative
          z-20
          px-6
          pb-5
          pt-6
        "
      >
        <Link
          href="/dashboard"
          className="
            group
            flex
            items-center
            gap-3.5
          "
        >
          {/* LOGO REAL */}

          <div
            className="
              relative
              h-[48px]
              w-[48px]
              shrink-0
            "
          >
            <Image
              src="/images/branding/peakscore-logo-transparente.png"
              alt="PeakScore"
              fill
              priority
              sizes="48px"
              className="
                object-contain
                drop-shadow-[0_0_14px_rgba(0,180,255,0.20)]
                transition-transform
                duration-300
                group-hover:scale-105
              "
            />
          </div>

          {/* TEXTO */}

          <div>
            <h1
              className="
                text-[20px]
                font-black
                leading-none
                tracking-[-0.055em]
                text-white
              "
            >
              PeakScore
            </h1>

            <p
              className="
                mt-1.5
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.25em]
                text-slate-500
              "
            >
              Preparación ICFES
            </p>
          </div>
        </Link>

        {/* Línea */}

        <div
          className="
            mt-5
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-300/[0.10]
            to-transparent
          "
        />
      </header>

      {/* ======================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative
          z-20
          flex-1
          overflow-y-auto
          px-6
          scrollbar-thin
          scrollbar-track-transparent
          scrollbar-thumb-white/10
        "
      >
        {/* ====================================================
            NAVEGACIÓN
        ==================================================== */}

        <nav className="space-y-1">

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="
                  group
                  relative
                  flex
                  h-[58px]
                  items-center
                  gap-4
                "
              >
                {/* Indicador activo */}

                <span
                  className={`
                    absolute
                    -left-6
                    top-1/2
                    h-8
                    w-[3px]
                    -translate-y-1/2
                    rounded-r-full
                    transition-all
                    duration-300

                    ${
                      active
                        ? `
                          bg-gradient-to-b
                          from-cyan-300
                          via-blue-400
                          to-violet-400
                          opacity-100
                          shadow-[0_0_14px_rgba(34,211,238,0.9)]
                        `
                        : "opacity-0"
                    }
                  `}
                />

                {/* ICONO */}

                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.6}
                  className={`
                    shrink-0
                    transition-all
                    duration-300

                    ${
                      active
                        ? "text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                        : "text-slate-600 group-hover:text-cyan-200"
                    }
                  `}
                />

                {/* TEXTO */}

                <span
                  className={`
                    flex-1
                    text-[13px]
                    transition-colors
                    duration-300

                    ${
                      active
                        ? "font-bold text-white"
                        : "font-medium text-slate-500 group-hover:text-slate-200"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* FLECHA */}

                <ChevronRight
                  size={15}
                  strokeWidth={1.7}
                  className={`
                    transition-all
                    duration-300

                    ${
                      active
                        ? "text-cyan-300/80"
                        : "text-slate-700 opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
                    }
                  `}
                />
              </Link>
            );
          })}

        </nav>

        {/* ====================================================
            PEAKY
        ==================================================== */}

        <section className="relative mt-7">

          {/* Glow detrás */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              h-[170px]
              w-[190px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-cyan-400/[0.07]
              blur-[55px]
            "
          />

          {/* Nubes pixeladas inferiores */}

          <div
            className="
              pointer-events-none
              absolute
              bottom-1
              left-1/2
              z-0
              h-[18px]
              w-[220px]
              -translate-x-1/2
            "
          >
            <span
              className="
                absolute
                bottom-0
                left-0
                h-[8px]
                w-[35px]
                bg-cyan-400/20
              "
            />

            <span
              className="
                absolute
                bottom-[6px]
                left-[25px]
                h-[10px]
                w-[38px]
                bg-blue-400/25
              "
            />

            <span
              className="
                absolute
                bottom-0
                left-[58px]
                h-[9px]
                w-[45px]
                bg-pink-400/25
              "
            />

            <span
              className="
                absolute
                bottom-[5px]
                left-[98px]
                h-[11px]
                w-[40px]
                bg-fuchsia-400/20
              "
            />

            <span
              className="
                absolute
                bottom-0
                right-0
                h-[8px]
                w-[45px]
                bg-cyan-300/20
              "
            />
          </div>

          {/* ==================================================
              PEAKY COMPLETO
          ================================================== */}

          <div
            className="
              relative
              z-10
              flex
              w-full
              items-center
              justify-center
            "
          >
            <Image
              src="/dashboard/sidebarpeaky.png"
              alt="Peaky"
              width={220}
              height={220}
              sizes="220px"
              priority
              className="
                block
                h-auto
                w-[220px]
                max-w-full
                object-contain
                object-center
                drop-shadow-[0_8px_22px_rgba(0,0,0,0.35)]
              "
            />
          </div>

          {/* Marca pequeña */}

          <div
            className="
              relative
              z-20
              mt-[-4px]
              flex
              items-center
              justify-center
              gap-2
            "
          >
            <span
              className="
                h-px
                w-7
                bg-gradient-to-r
                from-transparent
                to-cyan-300/20
              "
            />

            <span
              className="
                text-[8px]
                font-bold
                uppercase
                tracking-[0.25em]
                text-cyan-300/65
              "
            >
              PeakScore
            </span>

            <span
              className="
                h-px
                w-7
                bg-gradient-to-l
                from-transparent
                to-cyan-300/20
              "
            />
          </div>

        </section>

        {/* ====================================================
            ADMINISTRACIÓN
        ==================================================== */}

        {isAdmin && (
          <section className="mt-7">

            {/* Encabezado */}

            <div
              className="
                mb-2
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  h-px
                  flex-1
                  bg-gradient-to-r
                  from-transparent
                  to-fuchsia-400/[0.12]
                "
              />

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                "
              >
                <ShieldCheck
                  size={11}
                  strokeWidth={2}
                  className="text-fuchsia-300/70"
                />

                <span
                  className="
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.20em]
                    text-fuchsia-200/65
                  "
                >
                  Administración
                </span>
              </div>

              <span
                className="
                  h-px
                  flex-1
                  bg-gradient-to-l
                  from-transparent
                  to-fuchsia-400/[0.12]
                "
              />
            </div>

            {/* ==================================================
                PANEL ADMINISTRACIÓN
            ================================================== */}

            <Link
              href="/dashboard/admin"
              className="
                group
                relative
                flex
                h-[55px]
                items-center
                gap-4
              "
            >
              {/* Indicador */}

              <span
                className={`
                  absolute
                  -left-6
                  top-1/2
                  h-7
                  w-[3px]
                  -translate-y-1/2
                  rounded-r-full
                  bg-fuchsia-400
                  shadow-[0_0_13px_rgba(217,70,239,0.7)]

                  ${
                    isActive("/dashboard/admin")
                      ? "opacity-100"
                      : "opacity-0"
                  }
                `}
              />

              <ShieldCheck
                size={20}
                strokeWidth={
                  isActive("/dashboard/admin")
                    ? 2
                    : 1.6
                }
                className={`
                  shrink-0
                  transition-colors
                  duration-300

                  ${
                    isActive("/dashboard/admin")
                      ? "text-fuchsia-300"
                      : "text-slate-600 group-hover:text-fuchsia-300"
                  }
                `}
              />

              <span
                className={`
                  flex-1
                  text-[13px]

                  ${
                    isActive("/dashboard/admin")
                      ? "font-bold text-white"
                      : "font-medium text-slate-500 group-hover:text-slate-200"
                  }
                `}
              >
                Panel de administración
              </span>

              <ChevronRight
                size={15}
                strokeWidth={1.7}
                className="
                  text-slate-700
                  opacity-0
                  transition-all
                  duration-300
                  group-hover:translate-x-1
                  group-hover:text-fuchsia-300
                  group-hover:opacity-100
                "
              />
            </Link>

            {/* ==================================================
                BANCO DE PREGUNTAS
            ================================================== */}

            <Link
              href="/dashboard/question-bank"
              className="
                group
                relative
                flex
                h-[55px]
                items-center
                gap-4
              "
            >
              {/* Indicador */}

              <span
                className={`
                  absolute
                  -left-6
                  top-1/2
                  h-7
                  w-[3px]
                  -translate-y-1/2
                  rounded-r-full
                  bg-emerald-400
                  shadow-[0_0_13px_rgba(52,211,153,0.65)]

                  ${
                    isActive("/dashboard/question-bank")
                      ? "opacity-100"
                      : "opacity-0"
                  }
                `}
              />

              <Database
                size={20}
                strokeWidth={
                  isActive("/dashboard/question-bank")
                    ? 2
                    : 1.6
                }
                className={`
                  shrink-0
                  transition-colors
                  duration-300

                  ${
                    isActive("/dashboard/question-bank")
                      ? "text-emerald-300"
                      : "text-slate-600 group-hover:text-emerald-300"
                  }
                `}
              />

              <span
                className={`
                  flex-1
                  text-[13px]

                  ${
                    isActive("/dashboard/question-bank")
                      ? "font-bold text-white"
                      : "font-medium text-slate-500 group-hover:text-slate-200"
                  }
                `}
              >
                Banco de preguntas
              </span>

              <ChevronRight
                size={15}
                strokeWidth={1.7}
                className="
                  text-slate-700
                  opacity-0
                  transition-all
                  duration-300
                  group-hover:translate-x-1
                  group-hover:text-emerald-300
                  group-hover:opacity-100
                "
              />
            </Link>

          </section>
        )}

      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        className="
          relative
          z-20
          px-6
          pb-5
          pt-3
        "
      >
        {/* Separador */}

        <div
          className="
            mb-3
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/[0.07]
            to-transparent
          "
        />

        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          {/* Logo pequeño */}

          <div
            className="
              relative
              h-[30px]
              w-[30px]
              shrink-0
            "
          >
            <Image
              src="/images/branding/peakscore-logo-transparente.png"
              alt="PeakScore"
              fill
              sizes="30px"
              className="object-contain"
            />
          </div>

          {/* Texto */}

          <div>
            <p
              className="
                text-[10px]
                font-bold
                text-slate-300
              "
            >
              PeakScore
            </p>

            <p
              className="
                mt-0.5
                text-[7px]
                font-medium
                uppercase
                tracking-[0.17em]
                text-slate-600
              "
            >
              Preparación ICFES
            </p>
          </div>
        </div>
      </footer>
    </aside>
  );
}