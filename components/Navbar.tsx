"use client";

import Image from "next/image";
import Link from "next/link";

import { supabase } from "@/lib/supabase/browser";

import {
  ArrowRight,
  BookOpen,
  Bug,
  ChevronDown,
  Crown,
  Home,
  Layers3,
  Moon,
  Sun,
  Upload,
  Users,
  X,
  Menu,
  LayoutDashboard,
  BarChart3,
  FileText,
  MessageCircle,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

/* ============================================================
   TEMA GLOBAL
============================================================ */

export type LandingTheme = "light" | "dark";

type NavbarProps = {
  theme: LandingTheme;
  onThemeChange: (theme: LandingTheme) => void;
};

/* ============================================================
   TIPOS
============================================================ */

type DropdownName =
  | "platform"
  | "preparation"
  | "community"
  | null;

/* ============================================================
   NAVEGACIÓN PRINCIPAL
============================================================ */

const navLinks = [
  {
    label: "Inicio",
    href: "#inicio",
    icon: Home,
  },
];

/* ============================================================
   NAVBAR
============================================================ */

export default function Navbar({
  theme,
  onThemeChange,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [openDropdown, setOpenDropdown] =
    useState<DropdownName>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === "dark";

  /* ==========================================================
     CERRAR CON ESC
  ========================================================== */

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setMobileOpen(false);
      setBugOpen(false);
      setAuthGateOpen(false);
      setOpenDropdown(null);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* ==========================================================
     CERRAR DROPDOWNS AL HACER CLICK AFUERA
  ========================================================== */

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current) return;

      if (
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, []);

  /* ==========================================================
     BLOQUEAR SCROLL DEL BODY CUANDO EL MODAL BUG ESTÁ ABIERTO
  ========================================================== */

  useEffect(() => {
    if (!bugOpen && !authGateOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [bugOpen, authGateOpen]);

  /* ==========================================================
     CAMBIO DE TEMA
  ========================================================== */

  const changeTheme = (
    nextTheme: LandingTheme
  ) => {
    if (nextTheme === theme) return;

    onThemeChange(nextTheme);
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  /* ==========================================================
     DROPDOWN
  ========================================================== */

  const toggleDropdown = (
    dropdown: Exclude<DropdownName, null>
  ) => {
    setOpenDropdown((current) =>
      current === dropdown
        ? null
        : dropdown
    );
  };

  /* ==========================================================
     CERRAR MENÚ MOBILE
  ========================================================== */

  const closeNavigation = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  /* ==========================================================
     BUG
  ========================================================== */

  const openBugReport = () => {
    closeNavigation();
    setBugOpen(true);
  };

  /* ==========================================================
     PREPARACIÓN
     
     No intentamos averiguar si la persona "tiene cuenta"
     porque eso permitiría enumerar cuentas.
     
     El flujo seguro es:
     
     - usuario no autenticado → registro
     - usuario autenticado → preparación
     
     La protección real de /dashboard/simulacros/new
     debe seguir estando en servidor/middleware.
  ========================================================== */

  const handlePreparation = async () => {
    closeNavigation();

    if (checkingAuth) return;

    setCheckingAuth(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Error verificando sesión para simulacros:",
          error
        );

        setAuthGateOpen(true);
        return;
      }

      if (session?.user) {
        window.location.href =
          "/dashboard/simulacros/new";
        return;
      }

      setAuthGateOpen(true);
    } catch (error) {
      console.error(
        "Error inesperado verificando sesión:",
        error
      );

      setAuthGateOpen(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className={`
          sticky
          top-0
          z-[100]
          w-full
          border-b
          bg-transparent
          ${
            isDark
              ? "border-white/10"
              : "border-slate-200/70"
          }
        `}
      >
        {/* ====================================================
            FONDO DESKTOP
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            hidden
            overflow-hidden
            md:block
          "
        >
          <div className="absolute inset-0">
            <Image
              src="/peaky/homepage/navbaroscuro.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className={`
                object-cover
                object-center
                transition-opacity
                duration-300
                ease-out
                ${
                  isDark
                    ? "opacity-100"
                    : "opacity-0"
                }
              `}
            />

            <Image
              src="/peaky/homepage/navbarclaro.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className={`
                object-cover
                object-center
                transition-opacity
                duration-300
                ease-out
                ${
                  isDark
                    ? "opacity-0"
                    : "opacity-100"
                }
              `}
            />
          </div>

          <div
            className={`
              absolute
              inset-0
              ${
                isDark
                  ? "bg-[#050719]/35"
                  : "bg-white/20"
              }
            `}
          />
        </div>

        {/* ====================================================
            FONDO MOBILE
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            overflow-hidden
            md:hidden
          "
        >
          <div className="absolute inset-0">
            <Image
              src="/peaky/homepage/navbarmobileoscuro.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className={`
                object-cover
                object-center
                transition-opacity
                duration-300
                ease-out
                ${
                  isDark
                    ? "opacity-100"
                    : "opacity-0"
                }
              `}
            />

            <Image
              src="/peaky/homepage/navbarmobileclaro.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className={`
                object-cover
                object-center
                transition-opacity
                duration-300
                ease-out
                ${
                  isDark
                    ? "opacity-0"
                    : "opacity-100"
                }
              `}
            />
          </div>

          <div
            className={`
              absolute
              inset-0
              ${
                isDark
                  ? "bg-[#050719]/30"
                  : "bg-white/15"
              }
            `}
          />
        </div>

        {/* ====================================================
            NAV
        ==================================================== */}

        <nav
          className="
            relative
            mx-auto
            flex
            min-h-[78px]
            w-full
            max-w-[1540px]
            items-center
            gap-4
            px-4
            sm:px-6
            lg:px-8
            xl:px-10
          "
          aria-label="Navegación principal"
        >
          {/* ==================================================
              LOGO
          ================================================== */}

          <Link
            href="/"
            aria-label="PeakScore inicio"
            onClick={closeNavigation}
            className="
              group
              relative
              z-20
              flex
              h-[58px]
              w-[58px]
              shrink-0
              items-center
              justify-center
              sm:h-[62px]
              sm:w-[62px]
            "
          >
            <div
              className={`
                relative
                h-full
                w-full
                origin-center
                transition-transform
                duration-300
                group-hover:-translate-y-0.5
                ${
                  isDark
                    ? "drop-shadow-[0_4px_12px_rgba(60,70,255,0.25)]"
                    : "drop-shadow-[0_4px_12px_rgba(80,180,40,0.20)]"
                }
              `}
            >
              <div className="absolute inset-0">
                <Image
                  src="/images/branding/peakscore-logo-transparente2.png"
                  alt="PeakScore"
                  fill
                  priority
                  sizes="62px"
                  className={`
                    object-contain
                    object-center
                    transition-opacity
                    duration-200
                    ease-out
                    ${
                      isDark
                        ? "opacity-100"
                        : "opacity-0"
                    }
                  `}
                />

                <Image
                  src="/images/branding/peakscore-logo-claro.png"
                  alt=""
                  fill
                  priority
                  sizes="62px"
                  aria-hidden="true"
                  className={`
                    object-contain
                    object-center
                    transition-opacity
                    duration-200
                    ease-out
                    ${
                      isDark
                        ? "opacity-0"
                        : "opacity-100"
                    }
                  `}
                />
              </div>
            </div>
          </Link>

          {/* ==================================================
              DESKTOP NAVIGATION
          ================================================== */}

          <div
            ref={dropdownRef}
            className="
              hidden
              flex-1
              items-center
              justify-center
              lg:flex
            "
          >
            <div
              className={`
                flex
                items-center
                gap-1
                rounded-2xl
                border
                p-1
                backdrop-blur-xl
                ${
                  isDark
                    ? "border-white/10 bg-[#090b24]/55"
                    : "border-slate-200/80 bg-white/65"
                }
              `}
            >
              {/* INICIO */}

              <a
                href="#inicio"
                onClick={() =>
                  setOpenDropdown(null)
                }
                className={`
                  group
                  flex
                  h-11
                  items-center
                  gap-2
                  rounded-xl
                  px-4
                  text-[12px]
                  font-extrabold
                  transition-all
                  duration-200
                  ${
                    isDark
                      ? "text-white/80 hover:bg-violet-500/15 hover:text-white"
                      : "text-slate-700 hover:bg-lime-100 hover:text-slate-950"
                  }
                `}
              >
                <Home
                  className={`
                    h-4
                    w-4
                    transition-transform
                    duration-200
                    group-hover:scale-110
                    ${
                      isDark
                        ? "text-white"
                        : "text-slate-800"
                    }
                  `}
                />

                Inicio
              </a>

              {/* =================================================
                  PLATAFORMA
              ================================================= */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    toggleDropdown("platform")
                  }
                  aria-expanded={
                    openDropdown === "platform"
                  }
                  className={`
                    group
                    flex
                    h-11
                    items-center
                    gap-2
                    rounded-xl
                    px-4
                    text-[12px]
                    font-extrabold
                    transition-all
                    duration-200
                    ${
                      isDark
                        ? "text-white/80 hover:bg-violet-500/15 hover:text-white"
                        : "text-slate-700 hover:bg-lime-100 hover:text-slate-950"
                    }
                  `}
                >
                  <Layers3 className="h-4 w-4" />

                  Plataforma

                  <ChevronDown
                    className={`
                      h-3.5
                      w-3.5
                      opacity-60
                      transition-transform
                      ${
                        openDropdown === "platform"
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                {openDropdown ===
                  "platform" && (
                  <PlatformDropdown
                    theme={theme}
                    onClose={() =>
                      setOpenDropdown(null)
                    }
                  />
                )}
              </div>

              {/* =================================================
                  PREPARACIÓN
              ================================================= */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    toggleDropdown("preparation")
                  }
                  aria-expanded={
                    openDropdown === "preparation"
                  }
                  className={`
                    group
                    flex
                    h-11
                    items-center
                    gap-2
                    rounded-xl
                    px-4
                    text-[12px]
                    font-extrabold
                    transition-all
                    duration-200
                    ${
                      isDark
                        ? "text-white/80 hover:bg-violet-500/15 hover:text-white"
                        : "text-slate-700 hover:bg-lime-100 hover:text-slate-950"
                    }
                  `}
                >
                  <BookOpen className="h-4 w-4" />

                  Simulacros

                  <ChevronDown
                    className={`
                      h-3.5
                      w-3.5
                      opacity-60
                      transition-transform
                      ${
                        openDropdown ===
                        "preparation"
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                {openDropdown ===
                  "preparation" && (
                  <PreparationDropdown
                    theme={theme}
                    onStart={handlePreparation}
                    onClose={() =>
                      setOpenDropdown(null)
                    }
                  />
                )}
              </div>

              {/* =================================================
                  COMUNIDAD
              ================================================= */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    toggleDropdown("community")
                  }
                  aria-expanded={
                    openDropdown === "community"
                  }
                  className={`
                    group
                    flex
                    h-11
                    items-center
                    gap-2
                    rounded-xl
                    px-4
                    text-[12px]
                    font-extrabold
                    transition-all
                    duration-200
                    ${
                      isDark
                        ? "text-white/80 hover:bg-violet-500/15 hover:text-white"
                        : "text-slate-700 hover:bg-lime-100 hover:text-slate-950"
                    }
                  `}
                >
                  <Users className="h-4 w-4" />

                  Comunidad

                  <ChevronDown
                    className={`
                      h-3.5
                      w-3.5
                      opacity-60
                      transition-transform
                      ${
                        openDropdown ===
                        "community"
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                {openDropdown ===
                  "community" && (
                  <CommunityDropdown
                    theme={theme}
                    onClose={() =>
                      setOpenDropdown(null)
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* ==================================================
              ACCIONES DESKTOP
          ================================================== */}

          <div
            className="
              hidden
              items-center
              gap-2
              lg:flex
            "
          >
            {/* PRECIOS */}

            <button
              type="button"
              disabled
              className={`
                group
                flex
                h-11
                cursor-default
                items-center
                gap-2
                rounded-xl
                px-3
                text-[12px]
                font-black
                ${
                  isDark
                    ? "text-amber-300"
                    : "text-amber-700"
                }
              `}
              title="Planes premium próximamente"
            >
              <Crown
                className={`
                  h-[17px]
                  w-[17px]
                  ${
                    isDark
                      ? "text-amber-300"
                      : "text-amber-600"
                  }
                `}
              />

              Precios
            </button>

            {/* SEPARADOR */}

            <div
              className={`
                mx-1
                h-7
                w-px
                ${
                  isDark
                    ? "bg-white/15"
                    : "bg-slate-300"
                }
              `}
            />

            {/* BUG */}

            <button
              type="button"
              onClick={openBugReport}
              className={`
                group
                flex
                h-11
                items-center
                gap-2
                rounded-xl
                border
                px-4
                text-[12px]
                font-black
                transition-all
                duration-200
                ${
                  isDark
                    ? "border-violet-400/30 bg-[#0b0d2a]/70 text-white hover:border-violet-400/70 hover:bg-violet-500/10"
                    : "border-slate-300 bg-white/75 text-slate-800 hover:border-lime-500 hover:bg-lime-50"
                }
              `}
            >
              <Bug
                className={`
                  h-[17px]
                  w-[17px]
                  transition-transform
                  duration-200
                  group-hover:rotate-6
                  ${
                    isDark
                      ? "text-violet-300"
                      : "text-emerald-700"
                  }
                `}
              />

              Reportar Bug
            </button>

            {/* TEMA */}

            <div
              className={`
                ml-1
                flex
                h-11
                items-center
                rounded-xl
                border
                p-1
                ${
                  isDark
                    ? "border-white/10 bg-[#090b24]/75"
                    : "border-slate-200 bg-white/80"
                }
              `}
              aria-label="Cambiar apariencia"
            >
              <button
                type="button"
                onClick={() =>
                  changeTheme("dark")
                }
                aria-label="Activar modo oscuro"
                aria-pressed={isDark}
                className={`
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  transition-all
                  duration-200
                  ${
                    isDark
                      ? "bg-violet-600 text-white shadow-[0_0_18px_rgba(124,58,237,0.45)]"
                      : "text-slate-500 hover:bg-slate-100"
                  }
                `}
              >
                <Moon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  changeTheme("light")
                }
                aria-label="Activar modo claro"
                aria-pressed={!isDark}
                className={`
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  transition-all
                  duration-200
                  ${
                    !isDark
                      ? "bg-lime-400 text-slate-950 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Sun className="h-4 w-4" />
              </button>
            </div>

            {/* COMENZAR */}

            <Link
              href="/register"
              className={`
                group
                relative
                ml-1
                flex
                h-11
                min-w-[132px]
                items-center
                justify-center
                gap-2
                overflow-hidden
                rounded-xl
                px-5
                text-[12px]
                font-black
                transition-all
                duration-200
                hover:-translate-y-0.5
                ${
                  isDark
                    ? "border border-violet-400/50 bg-gradient-to-r from-violet-700 via-blue-600 to-indigo-600 text-white shadow-[0_8px_25px_rgba(79,70,229,0.35)]"
                    : "border border-lime-500 bg-lime-400 text-slate-950 shadow-[0_8px_25px_rgba(132,204,22,0.25)]"
                }
              `}
            >
              <span className="relative z-10">
                Comenzar
              </span>

              <ArrowRight
                className="
                  relative
                  z-10
                  h-4
                  w-4
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
              />

              <span
                className={`
                  absolute
                  bottom-0
                  left-0
                  h-1
                  w-full
                  ${
                    isDark
                      ? "bg-white/20"
                      : "bg-emerald-500/30"
                  }
                `}
              />
            </Link>
          </div>

          {/* ==================================================
              MOBILE ACTIONS
          ================================================== */}

          <div
            className="
              ml-auto
              flex
              items-center
              gap-2
              lg:hidden
            "
          >
            {/* BUG */}

            <button
              type="button"
              onClick={openBugReport}
              aria-label="Reportar un bug"
              className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                transition-all
                ${
                  isDark
                    ? "border-white/10 bg-[#090b24]/80 text-violet-300"
                    : "border-slate-200 bg-white/85 text-slate-700"
                }
              `}
            >
              <Bug className="h-[17px] w-[17px]" />
            </button>

            {/* TEMA */}

            <button
              type="button"
              onClick={() =>
                changeTheme(
                  isDark ? "light" : "dark"
                )
              }
              aria-label={
                isDark
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
              className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                transition-all
                ${
                  isDark
                    ? "border-violet-400/30 bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.35)]"
                    : "border-lime-500/50 bg-lime-400 text-slate-950 shadow-[0_0_15px_rgba(163,230,53,0.30)]"
                }
              `}
            >
              {isDark ? (
                <Moon className="h-[17px] w-[17px]" />
              ) : (
                <Sun className="h-[17px] w-[17px]" />
              )}
            </button>

            {/* MENU */}

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (previous) => !previous
                )
              }
              aria-label={
                mobileOpen
                  ? "Cerrar menú"
                  : "Abrir menú"
              }
              aria-expanded={mobileOpen}
              className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                transition-all
                ${
                  isDark
                    ? "border-white/15 bg-[#090b24]/80 text-white"
                    : "border-slate-200 bg-white/85 text-slate-800"
                }
              `}
            >
              {mobileOpen ? (
                <X className="h-[19px] w-[19px]" />
              ) : (
                <Menu className="h-[19px] w-[19px]" />
              )}
            </button>
          </div>
        </nav>

        {/* ====================================================
            MOBILE MENU
        ==================================================== */}

        {mobileOpen && (
          <div
            className={`
              relative
              z-[90]
              border-t
              backdrop-blur-xl
              lg:hidden
              ${
                isDark
                  ? "border-white/10 bg-[#07091c]/96"
                  : "border-slate-200 bg-white/96"
              }
            `}
          >
            <div className="mx-auto max-w-[700px] px-4 pb-5 pt-3 sm:px-6">

              {/* INICIO */}

              <MobileNavLink
                theme={theme}
                icon={Home}
                label="Inicio"
                href="#inicio"
                onClick={closeNavigation}
              />

              {/* PLATAFORMA */}

              <MobileSection
                theme={theme}
                icon={Layers3}
                label="Plataforma"
                open={
                  openDropdown === "platform"
                }
                onClick={() =>
                  toggleDropdown("platform")
                }
              />

              {openDropdown === "platform" && (
                <div className="mb-1 ml-3 border-l border-white/10 pl-2">
                  <MobileSubLink
                    theme={theme}
                    icon={Layers3}
                    label="Características"
                    href="#features"
                    onClick={closeNavigation}
                  />

                  <MobileSubLink
                    theme={theme}
                    icon={BookOpen}
                    label="Cómo funciona"
                    href="#how-it-works"
                    onClick={closeNavigation}
                  />

                  <MobileSubLink
                    theme={theme}
                    icon={BarChart3}
                    label="Progreso"
                    href="#progress"
                    onClick={closeNavigation}
                  />
                </div>
              )}

              {/* PREPARACIÓN */}

              <MobileSection
                theme={theme}
                icon={BookOpen}
                label="Simulacros"
                open={
                  openDropdown ===
                  "preparation"
                }
                onClick={() =>
                  toggleDropdown(
                    "preparation"
                  )
                }
              />

              {openDropdown ===
                "preparation" && (
                <div className="mb-1 ml-3 border-l border-white/10 pl-2">
                  <button
                    type="button"
                    onClick={handlePreparation}
                    className={`
                      flex
                      h-11
                      w-full
                      items-center
                      justify-between
                      rounded-lg
                      px-3
                      text-left
                      text-sm
                      font-bold
                      ${
                        isDark
                          ? "text-white/80 hover:bg-violet-500/10 hover:text-white"
                          : "text-slate-700 hover:bg-lime-50"
                      }
                    `}
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      Crear simulacro
                    </span>

                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </button>
                </div>
              )}

              {/* COMUNIDAD */}

              <MobileSection
                theme={theme}
                icon={Users}
                label="Comunidad"
                open={
                  openDropdown === "community"
                }
                onClick={() =>
                  toggleDropdown("community")
                }
              />

              {openDropdown === "community" && (
                <div
                  className={`
                    mb-1
                    ml-3
                    rounded-xl
                    border
                    px-4
                    py-3
                    ${
                      isDark
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-slate-200 bg-slate-50"
                    }
                  `}
                >
                  <p
                    className={`
                      text-xs
                      font-black
                      ${
                        isDark
                          ? "text-white"
                          : "text-slate-900"
                      }
                    `}
                  >
                    Comunidad PeakScore
                  </p>

                  <p
                    className={`
                      mt-1
                      text-[11px]
                      leading-5
                      ${
                        isDark
                          ? "text-white/45"
                          : "text-slate-500"
                      }
                    `}
                  >
                    Próximamente podrás encontrar
                    grupos, rankings y espacios para
                    estudiar con otros estudiantes.
                  </p>
                </div>
              )}

              {/* PRECIOS */}

              <button
                type="button"
                disabled
                className={`
                  flex
                  h-12
                  w-full
                  cursor-default
                  items-center
                  justify-between
                  rounded-xl
                  px-4
                  text-sm
                  font-black
                  ${
                    isDark
                      ? "text-amber-300"
                      : "text-amber-700"
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  <Crown className="h-[18px] w-[18px]" />

                  Precios
                </span>

                <span className="text-xs opacity-50">
                  Próximamente
                </span>
              </button>

              {/* DIVISOR */}

              <div
                className={`
                  my-3
                  h-px
                  ${
                    isDark
                      ? "bg-white/10"
                      : "bg-slate-200"
                  }
                `}
              />

              {/* BUG */}

              <button
                type="button"
                onClick={openBugReport}
                className={`
                  flex
                  h-12
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  text-sm
                  font-black
                  ${
                    isDark
                      ? "text-violet-200 hover:bg-violet-500/10"
                      : "text-slate-800 hover:bg-lime-50"
                  }
                `}
              >
                <Bug className="h-[18px] w-[18px]" />

                Reportar Bug
              </button>

              {/* APARIENCIA */}

              <div
                className={`
                  mt-2
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  px-4
                  py-3
                  ${
                    isDark
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-200 bg-slate-50"
                  }
                `}
              >
                <span
                  className={`
                    text-sm
                    font-black
                    ${
                      isDark
                        ? "text-white"
                        : "text-slate-800"
                    }
                  `}
                >
                  Modo de apariencia
                </span>

                <div
                  className={`
                    flex
                    rounded-xl
                    border
                    p-1
                    ${
                      isDark
                        ? "border-white/10 bg-[#090b24]"
                        : "border-slate-200 bg-white"
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() =>
                      changeTheme("dark")
                    }
                    aria-label="Modo oscuro"
                    aria-pressed={isDark}
                    className={`
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      ${
                        isDark
                          ? "bg-violet-600 text-white"
                          : "text-slate-400"
                      }
                    `}
                  >
                    <Moon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      changeTheme("light")
                    }
                    aria-label="Modo claro"
                    aria-pressed={!isDark}
                    className={`
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      ${
                        !isDark
                          ? "bg-lime-400 text-slate-950"
                          : "text-white/40"
                      }
                    `}
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* AUTH */}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={closeNavigation}
                  className={`
                    flex
                    h-12
                    items-center
                    justify-center
                    rounded-xl
                    border
                    text-xs
                    font-black
                    ${
                      isDark
                        ? "border-white/15 bg-white/5 text-white"
                        : "border-slate-200 bg-white text-slate-800"
                    }
                  `}
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/register"
                  onClick={closeNavigation}
                  className={`
                    flex
                    h-12
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    text-xs
                    font-black
                    ${
                      isDark
                        ? "bg-gradient-to-r from-violet-700 to-blue-600 text-white"
                        : "bg-lime-400 text-slate-950"
                    }
                  `}
                >
                  Comenzar

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================
          MODAL BUG
      ====================================================== */}

      {bugOpen && (
        <BugReportModal
          theme={theme}
          onClose={() => setBugOpen(false)}
        />
      )}

      {authGateOpen && (
        <AuthGateModal
          theme={theme}
          onClose={() => setAuthGateOpen(false)}
        />
      )}
    </>
  );
}

/* ============================================================
   MODAL — ACCESO A SIMULACROS
============================================================ */

function AuthGateModal({
  theme,
  onClose,
}: {
  theme: LandingTheme;
  onClose: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className="
        fixed
        inset-0
        z-[300]
        flex
        items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-md
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      <div
        className={`
          w-full
          max-w-[430px]
          overflow-hidden
          rounded-3xl
          border
          p-6
          shadow-2xl
          ${
            isDark
              ? "border-violet-400/20 bg-[#0b0d25]"
              : "border-slate-200 bg-white"
          }
        `}
      >
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className={`
                mb-4
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                ${
                  isDark
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-lime-100 text-emerald-700"
                }
              `}
            >
              <FileText className="h-6 w-6" />
            </div>

            <h2
              id="auth-gate-title"
              className={`
                text-xl
                font-black
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }
              `}
            >
              Acceso a simulacros
            </h2>

            <p
              className={`
                mt-2
                text-sm
                leading-6
                ${
                  isDark
                    ? "text-white/55"
                    : "text-slate-500"
                }
              `}
            >
              Para realizar simulacros necesitas
              iniciar sesión o crear tu cuenta de
              PeakScore.
            </p>
          </div>

          {/* CERRAR */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              ${
                isDark
                  ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              }
            `}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ACCIONES */}

        <div className="mt-6 space-y-3">
          {/* LOGIN */}

          <Link
            href="/login"
            onClick={onClose}
            className={`
              flex
              h-12
              w-full
              items-center
              justify-center
              rounded-xl
              border
              text-sm
              font-black
              transition-all
              hover:-translate-y-0.5
              ${
                isDark
                  ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }
            `}
          >
            Ya tengo una cuenta
          </Link>

          {/* REGISTRO */}

          <Link
            href="/register"
            onClick={onClose}
            className={`
              flex
              h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              text-sm
              font-black
              transition-all
              hover:-translate-y-0.5
              ${
                isDark
                  ? "bg-gradient-to-r from-violet-700 to-blue-600 text-white shadow-[0_8px_25px_rgba(79,70,229,0.25)]"
                  : "bg-lime-400 text-slate-950 shadow-[0_8px_25px_rgba(132,204,22,0.20)]"
              }
            `}
          >
            Crear cuenta

            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DROPDOWN — PLATAFORMA
============================================================ */

function PlatformDropdown({
  theme,
  onClose,
}: {
  theme: LandingTheme;
  onClose: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        absolute
        left-1/2
        top-[calc(100%+10px)]
        z-[200]
        w-[270px]
        -translate-x-1/2
        overflow-hidden
        rounded-2xl
        border
        p-2
        shadow-2xl
        backdrop-blur-2xl
        ${
          isDark
            ? "border-white/10 bg-[#090b24]/95 shadow-black/40"
            : "border-slate-200 bg-white/95 shadow-slate-300/40"
        }
      `}
    >
      <DropdownLink
        theme={theme}
        icon={Layers3}
        title="Características"
        description="Conoce lo que ofrece PeakScore"
        href="#features"
        onClick={onClose}
      />

      <DropdownLink
        theme={theme}
        icon={BookOpen}
        title="Cómo funciona"
        description="Descubre el flujo de preparación"
        href="#how-it-works"
        onClick={onClose}
      />

      <DropdownLink
        theme={theme}
        icon={BarChart3}
        title="Tu progreso"
        description="Visualiza el seguimiento"
        href="#progress"
        onClick={onClose}
      />
    </div>
  );
}

/* ============================================================
   DROPDOWN — PREPARACIÓN
============================================================ */

function PreparationDropdown({
  theme,
  onStart,
  onClose,
}: {
  theme: LandingTheme;
  onStart: () => void;
  onClose: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        absolute
        left-1/2
        top-[calc(100%+10px)]
        z-[200]
        w-[290px]
        -translate-x-1/2
        overflow-hidden
        rounded-2xl
        border
        p-2
        shadow-2xl
        backdrop-blur-2xl
        ${
          isDark
            ? "border-white/10 bg-[#090b24]/95 shadow-black/40"
            : "border-slate-200 bg-white/95 shadow-slate-300/40"
        }
      `}
    >
      <button
        type="button"
        onClick={onStart}
        className={`
          group
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          p-3
          text-left
          transition-colors
          ${
            isDark
              ? "hover:bg-violet-500/10"
              : "hover:bg-lime-50"
          }
        `}
      >
        <span
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${
              isDark
                ? "bg-violet-500/15 text-violet-300"
                : "bg-lime-100 text-emerald-700"
            }
          `}
        >
          <FileText className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`
              block
              text-xs
              font-black
              ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }
            `}
          >
            Simulacros
          </span>

          <span
            className={`
              mt-0.5
              block
              text-[10px]
              leading-4
              ${
                isDark
                  ? "text-white/45"
                  : "text-slate-500"
              }
            `}
          >
            Practica con simulacros tipo ICFES
          </span>
        </span>

        <ArrowRight
          className={`
            h-4
            w-4
            shrink-0
            transition-transform
            group-hover:translate-x-1
            ${
              isDark
                ? "text-violet-300"
                : "text-emerald-600"
            }
          `}
        />
      </button>

      <div
        className={`
          mx-2
          h-px
          ${
            isDark
              ? "bg-white/10"
              : "bg-slate-200"
          }
        `}
      />

      <Link
        href="#how-it-works"
        onClick={onClose}
        className={`
          flex
          items-center
          gap-3
          rounded-xl
          p-3
          text-xs
          font-bold
          ${
            isDark
              ? "text-white/75 hover:bg-violet-500/10 hover:text-white"
              : "text-slate-700 hover:bg-lime-50"
          }
        `}
      >
        <BookOpen className="h-4 w-4" />

        Cómo prepararte
      </Link>
    </div>
  );
}

/* ============================================================
   DROPDOWN — COMUNIDAD
============================================================ */

function CommunityDropdown({
  theme,
  onClose,
}: {
  theme: LandingTheme;
  onClose: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        absolute
        left-1/2
        top-[calc(100%+10px)]
        z-[200]
        w-[300px]
        -translate-x-1/2
        overflow-hidden
        rounded-2xl
        border
        p-2
        shadow-2xl
        backdrop-blur-2xl
        ${
          isDark
            ? "border-white/10 bg-[#090b24]/95 shadow-black/40"
            : "border-slate-200 bg-white/95 shadow-slate-300/40"
        }
      `}
    >
      <div className="p-3">
        <div
          className={`
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            ${
              isDark
                ? "bg-violet-500/15 text-violet-300"
                : "bg-lime-100 text-emerald-700"
            }
          `}
        >
          <Users className="h-5 w-5" />
        </div>

        <p
          className={`
            mt-3
            text-xs
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          Comunidad PeakScore
        </p>

        <p
          className={`
            mt-1
            text-[10px]
            leading-5
            ${
              isDark
                ? "text-white/45"
                : "text-slate-500"
            }
          `}
        >
          Estamos preparando espacios para
          estudiantes, rankings y comunidades de
          estudio.
        </p>
      </div>

      <div
        className={`
          mx-2
          h-px
          ${
            isDark
              ? "bg-white/10"
              : "bg-slate-200"
          }
        `}
      />

      <div
        className={`
          flex
          items-center
          gap-3
          rounded-xl
          p-3
          ${
            isDark
              ? "text-white/45"
              : "text-slate-400"
          }
        `}
      >
        <MessageCircle className="h-4 w-4" />

        <span className="text-[10px] font-bold">
          Próximamente
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   LINK DROPDOWN
============================================================ */

function DropdownLink({
  theme,
  icon: Icon,
  title,
  description,
  href,
  onClick,
}: {
  theme: LandingTheme;
  icon: typeof Layers3;
  title: string;
  description: string;
  href: string;
  onClick: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group
        flex
        items-center
        gap-3
        rounded-xl
        p-3
        transition-colors
        ${
          isDark
            ? "hover:bg-violet-500/10"
            : "hover:bg-lime-50"
        }
      `}
    >
      <span
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            isDark
              ? "bg-white/5 text-violet-300"
              : "bg-slate-100 text-emerald-700"
          }
        `}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`
            block
            text-xs
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          {title}
        </span>

        <span
          className={`
            mt-0.5
            block
            text-[10px]
            leading-4
            ${
              isDark
                ? "text-white/40"
                : "text-slate-500"
            }
          `}
        >
          {description}
        </span>
      </span>

      <ArrowRight
        className={`
          h-4
          w-4
          shrink-0
          opacity-40
          transition-transform
          group-hover:translate-x-1
          ${
            isDark
              ? "text-violet-300"
              : "text-emerald-600"
          }
        `}
      />
    </Link>
  );
}

/* ============================================================
   MOBILE LINK
============================================================ */

function MobileNavLink({
  theme,
  icon: Icon,
  label,
  href,
  onClick,
}: {
  theme: LandingTheme;
  icon: typeof Home;
  label: string;
  href: string;
  onClick: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex
        h-12
        items-center
        justify-between
        rounded-xl
        px-4
        text-sm
        font-black
        ${
          isDark
            ? "text-white/85 hover:bg-violet-500/10 hover:text-white"
            : "text-slate-800 hover:bg-lime-50"
        }
      `}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-[18px] w-[18px]" />

        {label}
      </span>

      <ArrowRight className="h-4 w-4 opacity-50" />
    </Link>
  );
}

/* ============================================================
   MOBILE SECTION
============================================================ */

function MobileSection({
  theme,
  icon: Icon,
  label,
  open,
  onClick,
}: {
  theme: LandingTheme;
  icon: typeof Home;
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`
        flex
        h-12
        w-full
        items-center
        justify-between
        rounded-xl
        px-4
        text-sm
        font-black
        ${
          isDark
            ? "text-white/85 hover:bg-violet-500/10 hover:text-white"
            : "text-slate-800 hover:bg-lime-50"
        }
      `}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-[18px] w-[18px]" />

        {label}
      </span>

      <ChevronDown
        className={`
          h-4
          w-4
          opacity-50
          transition-transform
          ${open ? "rotate-180" : ""}
        `}
      />
    </button>
  );
}

/* ============================================================
   MOBILE SUB LINK
============================================================ */

function MobileSubLink({
  theme,
  icon: Icon,
  label,
  href,
  onClick,
}: {
  theme: LandingTheme;
  icon: typeof Home;
  label: string;
  href: string;
  onClick: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex
        h-11
        items-center
        gap-3
        rounded-lg
        px-3
        text-xs
        font-bold
        ${
          isDark
            ? "text-white/65 hover:bg-violet-500/10 hover:text-white"
            : "text-slate-600 hover:bg-lime-50"
        }
      `}
    >
      <Icon className="h-4 w-4" />

      {label}
    </Link>
  );
}

/* ============================================================
   MODAL REPORTAR BUG
============================================================ */

type BugReportModalProps = {
  theme: LandingTheme;
  onClose: () => void;
};

function BugReportModal({
  theme,
  onClose,
}: BugReportModalProps) {
  const isDark = theme === "dark";

  const [description, setDescription] =
    useState("");

  const [screenshot, setScreenshot] =
    useState<File | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  /* ==========================================================
     ARCHIVO
  ========================================================== */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setScreenshot(file);
  };

  /* ==========================================================
     SUBMIT
     
     IMPORTANTE:
     La UI queda preparada, pero no inventamos todavía
     endpoint, tabla ni bucket que no existan.
  ========================================================== */

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSubmitted(true);
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[300]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-black/70
        p-4
        backdrop-blur-md
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
    >
      <div
        className={`
          relative
          my-auto
          w-full
          max-w-[560px]
          overflow-hidden
          rounded-3xl
          border
          shadow-2xl
          ${
            isDark
              ? "border-violet-400/20 bg-[#0b0d25]"
              : "border-slate-200 bg-white"
          }
        `}
      >
        {/* HEADER */}

        <div
          className={`
            flex
            items-center
            justify-between
            border-b
            px-5
            py-4
            sm:px-6
            ${
              isDark
                ? "border-white/10"
                : "border-slate-200"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                ${
                  isDark
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-lime-100 text-emerald-700"
                }
              `}
            >
              <Bug className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="bug-report-title"
                className={`
                  text-base
                  font-black
                  ${
                    isDark
                      ? "text-white"
                      : "text-slate-950"
                  }
                `}
              >
                Reportar un Bug
              </h2>

              <p
                className={`
                  mt-0.5
                  text-[11px]
                  ${
                    isDark
                      ? "text-white/50"
                      : "text-slate-500"
                  }
                `}
              >
                Ayúdanos a mejorar PeakScore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reporte"
            className={`
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              ${
                isDark
                  ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              }
            `}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CONTENIDO */}

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div
              className={`
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                ${
                  isDark
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-lime-100 text-emerald-700"
                }
              `}
            >
              <Bug className="h-6 w-6" />
            </div>

            <h3
              className={`
                mt-5
                text-lg
                font-black
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }
              `}
            >
              Reporte preparado
            </h3>

            <p
              className={`
                mx-auto
                mt-2
                max-w-sm
                text-sm
                leading-6
                ${
                  isDark
                    ? "text-white/55"
                    : "text-slate-500"
                }
              `}
            >
              La interfaz está lista. La conexión
              con el sistema de reportes se
              conectará cuando tengamos el backend
              correspondiente.
            </p>

            <button
              type="button"
              onClick={onClose}
              className={`
                mt-7
                h-11
                rounded-xl
                px-7
                text-sm
                font-black
                ${
                  isDark
                    ? "bg-violet-600 text-white"
                    : "bg-lime-400 text-slate-950"
                }
              `}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-5 py-5 sm:px-6"
          >
            {/* DESCRIPCIÓN */}

            <label
              htmlFor="bug-description"
              className={`
                block
                text-xs
                font-black
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-800"
                }
              `}
            >
              Describe el problema
            </label>

            <div className="relative mt-2">
              <textarea
                id="bug-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(
                      0,
                      1000
                    )
                  )
                }
                maxLength={1000}
                required
                rows={5}
                placeholder="Describe qué pasó y qué esperabas que pasara..."
                className={`
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  px-4
                  py-3
                  text-sm
                  outline-none
                  ${
                    isDark
                      ? "border-white/10 bg-[#07091c] text-white placeholder:text-white/30 focus:border-violet-400/60"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-lime-500"
                  }
                `}
              />

              <span
                className={`
                  absolute
                  bottom-3
                  right-3
                  text-[10px]
                  ${
                    isDark
                      ? "text-white/35"
                      : "text-slate-400"
                  }
                `}
              >
                {description.length}/1000
              </span>
            </div>

            {/* SCREENSHOT */}

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label
                  className={`
                    text-xs
                    font-black
                    ${
                      isDark
                        ? "text-white"
                        : "text-slate-800"
                    }
                  `}
                >
                  Captura de pantalla
                </label>

                <span
                  className={`
                    text-[10px]
                    ${
                      isDark
                        ? "text-white/40"
                        : "text-slate-400"
                    }
                  `}
                >
                  Opcional
                </span>
              </div>

              <label
                htmlFor="bug-screenshot"
                className={`
                  mt-2
                  flex
                  min-h-[125px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  px-5
                  py-5
                  text-center
                  ${
                    isDark
                      ? "border-white/15 bg-[#07091c]/70 hover:border-violet-400/50 hover:bg-violet-500/5"
                      : "border-slate-300 bg-slate-50 hover:border-lime-500 hover:bg-lime-50"
                  }
                `}
              >
                <Upload
                  className={`
                    h-6
                    w-6
                    ${
                      isDark
                        ? "text-violet-300"
                        : "text-emerald-600"
                    }
                  `}
                />

                <span
                  className={`
                    mt-2
                    text-xs
                    font-bold
                    ${
                      isDark
                        ? "text-white/75"
                        : "text-slate-700"
                    }
                  `}
                >
                  {screenshot
                    ? screenshot.name
                    : "Haz clic para subir una imagen"}
                </span>

                <span
                  className={`
                    mt-1
                    text-[10px]
                    ${
                      isDark
                        ? "text-white/35"
                        : "text-slate-400"
                    }
                  `}
                >
                  PNG, JPG o WEBP · máximo 5 MB
                </span>

                <input
                  id="bug-screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {/* ACCIONES */}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`
                  flex
                  h-12
                  flex-1
                  items-center
                  justify-center
                  rounded-xl
                  border
                  text-sm
                  font-black
                  ${
                    isDark
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!description.trim()}
                className={`
                  flex
                  h-12
                  flex-[1.4]
                  items-center
                  justify-center
                  rounded-xl
                  text-sm
                  font-black
                  transition-all
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  ${
                    isDark
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                      : "bg-lime-400 text-slate-950"
                  }
                `}
              >
                Enviar Reporte
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}