"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/browser";
import type { LandingTheme } from "@/components/Navbar";

/* ============================================================
   TYPES
============================================================ */

type DashboardPreviewProps = {
  theme: LandingTheme;
};

/* ============================================================
   BACKGROUNDS
============================================================ */

const backgrounds = {
  light: {
    desktop:
      "/peaky/homepage/peakscore-claro-desktop.webp",
    mobile:
      "/peaky/homepage/peakscore-claro-mobile.webp",
  },

  dark: {
    desktop:
      "/peaky/homepage/peakscore-oscuro-desktop.webp",
    mobile:
      "/peaky/homepage/peakscore-oscuro-mobile.webp",
  },
} as const;

/* ============================================================
   LOGOS
============================================================ */

const logos = {
  light:
    "/images/branding/peakscore-logo-claro.png",

  dark:
    "/images/branding/peakscore-logo-transparente2.png",
} as const;

/* ============================================================
   SUBJECTS
============================================================ */

const subjects = [
  {
    name: "Lectura Crítica",
    score: 80,
    color: "bg-sky-400",
    icon: "/dashboard/lecturaprogress.webp",
  },
  {
    name: "Matemáticas",
    score: 100,
    color: "bg-fuchsia-500",
    icon: "/dashboard/matematicaprogress.webp",
  },
  {
    name: "Sociales y Ciudadanas",
    score: 100,
    color: "bg-emerald-400",
    icon: "/dashboard/socialesprogress.webp",
  },
  {
    name: "Ciencias Naturales",
    score: 79,
    color: "bg-amber-400",
    icon: "/dashboard/naturalesprogress.webp",
  },
  {
    name: "Inglés",
    score: 100,
    color: "bg-cyan-400",
    icon: "/dashboard/inglesprogress.webp",
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function DashboardPreview({
  theme,
}: DashboardPreviewProps) {
  const isDark = theme === "dark";

  const [authGateOpen, setAuthGateOpen] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(false);

  /* ==========================================================
     AUTH MODAL SCROLL
  ========================================================== */

  useEffect(() => {
    if (!authGateOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [authGateOpen]);

  /* ==========================================================
     ESC
  ========================================================== */

  useEffect(() => {
    if (!authGateOpen) return;

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setAuthGateOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [authGateOpen]);

  /* ==========================================================
     EXPLORE
  ========================================================== */

  const handleExplore = async () => {
    if (checkingAuth) return;

    setCheckingAuth(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Error comprobando sesión:",
          error
        );

        setAuthGateOpen(true);
        return;
      }

      if (session?.user) {
        window.location.href = "/dashboard";
        return;
      }

      setAuthGateOpen(true);
    } catch (error) {
      console.error(
        "Error comprobando autenticación:",
        error
      );

      setAuthGateOpen(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <>
      {/* ========================================================
          MAIN SECTION
      ======================================================== */}

      <section
        id="progress"
        className={`
          relative
          isolate
          w-full
          overflow-hidden
          ${
            isDark
              ? "bg-[#020617]"
              : "bg-[#eef6ff]"
          }
        `}
      >
        {/* ======================================================
            DESKTOP
        ====================================================== */}

        <div
          className="
            relative
            hidden
            aspect-[3/2]
            w-full
            overflow-hidden
            md:block
          "
        >
          {/* ====================================================
              LIGHT BACKGROUND
          ==================================================== */}

          <div
            className={`
              absolute
              inset-0
              z-0
              transition-opacity
              duration-500
              ${
                isDark
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          >
            <Image
              src={backgrounds.light.desktop}
              alt=""
              fill
              priority={!isDark}
              sizes="100vw"
              className="
                select-none
                object-cover
                object-center
              "
            />
          </div>

          {/* ====================================================
              DARK BACKGROUND
          ==================================================== */}

          <div
            className={`
              absolute
              inset-0
              z-0
              transition-opacity
              duration-500
              ${
                isDark
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          >
            <Image
              src={backgrounds.dark.desktop}
              alt=""
              fill
              priority={isDark}
              sizes="100vw"
              className="
                select-none
                object-cover
                object-center
              "
            />
          </div>

          {/* ====================================================
              LIGHT READABILITY
          ==================================================== */}

          <div
            className={`
              pointer-events-none
              absolute
              inset-0
              z-[2]
              transition-opacity
              duration-500
              ${
                isDark
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          >
            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[58%]
                bg-gradient-to-r
                from-white/82
                via-white/42
                to-transparent
              "
            />

            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[35%]
                bg-white/20
              "
            />
          </div>

          {/* ====================================================
              DARK READABILITY
          ==================================================== */}

          <div
            className={`
              pointer-events-none
              absolute
              inset-0
              z-[2]
              transition-opacity
              duration-500
              ${
                isDark
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          >
            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[55%]
                bg-gradient-to-r
                from-[#020617]/65
                via-[#020617]/25
                to-transparent
              "
            />
          </div>

          {/* ====================================================
              CONTENT
          ==================================================== */}

          <div className="absolute inset-0 z-10">
            {/* ==================================================
                LOGO
            ================================================== */}

            <div
              className="
                absolute
                left-[5.5%]
                top-[4.5%]
                z-40
                w-[7.2%]
                min-w-[72px]
                max-w-[110px]
              "
            >
              <Image
                key={isDark ? "peakscore-logo-dark" : "peakscore-logo-light"}
                src={isDark ? logos.dark : logos.light}
                alt="PeakScore"
                width={1254}
                height={1254}
                priority
                unoptimized
                sizes="110px"
                className="
                  h-auto
                  w-full
                  object-contain
                  object-left
                  drop-shadow-[0_5px_18px_rgba(0,0,0,0.25)]
                "
              />
            </div>

            {/* ==================================================
                HERO COPY
            ================================================== */}

            <div
              className="
                absolute
                left-[5.5%]
                top-[16%]
                z-30
                w-[35%]
              "
            >
              {/* BADGE */}

              <div
                className={`
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-3
                  py-1.5
                  text-[clamp(8px,0.7vw,12px)]
                  font-black
                  uppercase
                  tracking-[0.08em]
                  backdrop-blur-md
                  ${
                    isDark
                      ? `
                        border-cyan-400/45
                        bg-[#04152e]/85
                        text-cyan-300
                      `
                      : `
                        border-blue-700/20
                        bg-white/80
                        text-blue-700
                      `
                  }
                `}
              >
                <span
                  className={
                    isDark
                      ? "text-cyan-300"
                      : "text-blue-600"
                  }
                >
                  ✦
                </span>

                TU CAMINO AL ICFES
              </div>

              {/* TITLE */}

              <h2
                className={`
                  mt-[2.8%]
                  max-w-[620px]
                  text-[clamp(30px,3.25vw,55px)]
                  font-black
                  leading-[0.98]
                  tracking-[-0.045em]
                  ${
                    isDark
                      ? "text-white"
                      : "text-slate-950"
                  }
                `}
              >
                Cada simulacro
                <br />
                te acerca a tu{" "}
                <span
                  className="
                    bg-gradient-to-r
                    from-cyan-400
                    via-blue-500
                    to-fuchsia-500
                    bg-clip-text
                    text-transparent
                  "
                >
                  Peak
                </span>
              </h2>

              {/* DESCRIPTION */}

              <p
                className={`
                  mt-[4%]
                  max-w-[520px]
                  text-[clamp(9px,0.82vw,15px)]
                  font-medium
                  leading-[1.55]
                  ${
                    isDark
                      ? "text-blue-50/80"
                      : "text-slate-700/90"
                  }
                `}
              >
                Prepárate con una experiencia
                construida alrededor de las pruebas
                que realmente vas a presentar.
              </p>

              {/* ==================================================
                  PEAKSCORE PRODUCT FEATURES
              ================================================== */}

              <div
                className="
                  mt-[5%]
                  space-y-[3%]
                "
              >
                {/* =================================================
                    FEATURE 1
                ================================================= */}

                <ProductFeature
                  type="sessions"
                  isDark={isDark}
                  eyebrow="SIMULACROS"
                  title="Entrena como en Saber 11"
                  description="Sesiones separadas para practicar con la estructura real del examen."
                />

                {/* =================================================
                    FEATURE 2
                ================================================= */}

                <ProductFeature
                  type="bank"
                  isDark={isDark}
                  eyebrow="BANCO DE PREGUNTAS"
                  title="Practica exactamente lo que necesitas"
                  description="Filtra tus preguntas por área, sesión y dificultad para enfocar cada práctica."
                />

                {/* =================================================
                    FEATURE 3
                ================================================= */}

                <ProductFeature
                  type="analysis"
                  isDark={isDark}
                  eyebrow="ANÁLISIS"
                  title="Convierte cada error en progreso"
                  description="Después de practicar, identifica dónde fallaste y qué debes reforzar."
                />
              </div>
            </div>

            {/* ==================================================
                NO FLOATING CARDS
                NO GENERIC INFO CARD
            ================================================== */}

            {/* ==================================================
                SUBJECT BAR
            ================================================== */}

            <SubjectBar />

            {/* ==================================================
                CTA
            ================================================== */}

            <ExploreButton
              checkingAuth={checkingAuth}
              onClick={handleExplore}
            />
          </div>
        </div>

        {/* ======================================================
            MOBILE
        ====================================================== */}

        <div
          className="
            relative
            min-h-[900px]
            w-full
            overflow-hidden
            md:hidden
          "
        >
          {/* ====================================================
              MOBILE LIGHT
          ==================================================== */}

          <div
            className={`
              absolute
              inset-0
              transition-opacity
              duration-500
              ${
                isDark
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          >
            <Image
              src={backgrounds.light.mobile}
              alt=""
              fill
              priority={!isDark}
              sizes="100vw"
              className="
                select-none
                object-cover
                object-center
              "
            />
          </div>

          {/* ====================================================
              MOBILE DARK
          ==================================================== */}

          <div
            className={`
              absolute
              inset-0
              transition-opacity
              duration-500
              ${
                isDark
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          >
            <Image
              src={backgrounds.dark.mobile}
              alt=""
              fill
              priority={isDark}
              sizes="100vw"
              className="
                select-none
                object-cover
                object-center
              "
            />
          </div>

          {/* ====================================================
              MOBILE LIGHT OVERLAY
          ==================================================== */}

          <div
            className={`
              pointer-events-none
              absolute
              inset-0
              z-[2]
              ${
                isDark
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          >
            <div
              className="
                absolute
                inset-x-0
                top-0
                h-[58%]
                bg-gradient-to-b
                from-white/75
                via-white/25
                to-transparent
              "
            />

            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[92%]
                bg-gradient-to-r
                from-white/60
                via-white/20
                to-transparent
              "
            />
          </div>

          {/* ====================================================
              MOBILE DARK OVERLAY
          ==================================================== */}

          <div
            className={`
              pointer-events-none
              absolute
              inset-0
              z-[2]
              ${
                isDark
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          >
            <div
              className="
                absolute
                inset-x-0
                top-0
                h-[58%]
                bg-gradient-to-b
                from-[#020617]/60
                via-[#020617]/20
                to-transparent
              "
            />
          </div>

          {/* ====================================================
              MOBILE CONTENT
          ==================================================== */}

          <div className="absolute inset-0 z-10">
            {/* LOGO */}

            <div
              className="
                absolute
                left-[6%]
                top-[3.5%]
                z-40
                w-[82px]
              "
            >
              <Image
                key={isDark ? "peakscore-logo-dark-mobile" : "peakscore-logo-light-mobile"}
                src={isDark ? logos.dark : logos.light}
                alt="PeakScore"
                width={1254}
                height={1254}
                priority
                unoptimized
                sizes="82px"
                className="
                  h-auto
                  w-full
                  object-contain
                  object-left
                  drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)]
                "
              />
            </div>

            {/* ==================================================
                MOBILE HERO
            ================================================== */}

            <div
              className="
                absolute
                left-[6%]
                right-[6%]
                top-[11%]
                z-30
              "
            >
              <div
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.07em]
                  backdrop-blur-md
                  ${
                    isDark
                      ? `
                        border-cyan-400/45
                        bg-[#04152e]/85
                        text-cyan-300
                      `
                      : `
                        border-blue-700/20
                        bg-white/80
                        text-blue-700
                      `
                  }
                `}
              >
                <span>✦</span>

                TU CAMINO AL ICFES
              </div>

              <h2
                className={`
                  mt-3
                  max-w-[410px]
                  text-[31px]
                  font-black
                  leading-[0.98]
                  tracking-[-0.045em]
                  ${
                    isDark
                      ? "text-white"
                      : "text-slate-950"
                  }
                `}
              >
                Cada simulacro
                <br />
                te acerca a tu{" "}
                <span
                  className="
                    bg-gradient-to-r
                    from-cyan-400
                    via-blue-500
                    to-fuchsia-500
                    bg-clip-text
                    text-transparent
                  "
                >
                  Peak
                </span>
              </h2>

              <p
                className={`
                  mt-4
                  max-w-[390px]
                  text-[11px]
                  font-medium
                  leading-[1.55]
                  ${
                    isDark
                      ? "text-blue-50/80"
                      : "text-slate-700/90"
                  }
                `}
              >
                Prepárate con una experiencia
                construida alrededor de las pruebas
                que realmente vas a presentar.
              </p>

              {/* ==================================================
                  MOBILE PRODUCT FEATURES
              ================================================== */}

              <div className="mt-6 space-y-1.5">
                <MobileProductFeature
                  isDark={isDark}
                  type="sessions"
                  eyebrow="SIMULACROS"
                  title="Entrena como en Saber 11"
                  description="Sesiones 1 y 2 con sus respectivas áreas."
                />

                <MobileProductFeature
                  isDark={isDark}
                  type="bank"
                  eyebrow="BANCO DE PREGUNTAS"
                  title="Practica por objetivo"
                  description="Área, sesión y dificultad en un mismo flujo."
                />

                <MobileProductFeature
                  isDark={isDark}
                  type="analysis"
                  eyebrow="ANÁLISIS"
                  title="Aprende de tus errores"
                  description="Detecta qué necesitas reforzar después de practicar."
                />
              </div>
            </div>

            {/* ==================================================
                MOBILE SUBJECTS
            ================================================== */}

            <MobileSubjectBar />

            {/* ==================================================
                MOBILE CTA
            ================================================== */}

            <ExploreButton
              checkingAuth={checkingAuth}
              onClick={handleExplore}
              mobile
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          AUTH GATE
      ======================================================== */}

      {authGateOpen && (
        <div
          className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            bg-black/70
            px-4
            py-6
            backdrop-blur-md
          "
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setAuthGateOpen(false);
            }
          }}
        >
          <div
            className={`
              relative
              w-full
              max-w-[430px]
              overflow-hidden
              rounded-3xl
              border
              p-6
              shadow-[0_30px_100px_rgba(0,0,0,0.45)]
              ${
                isDark
                  ? "border-white/10 bg-[#071329]"
                  : "border-slate-200 bg-white"
              }
            `}
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={() =>
                setAuthGateOpen(false)
              }
              aria-label="Cerrar"
              className={`
                absolute
                right-4
                top-4
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                ${
                  isDark
                    ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }
              `}
            >
              <X className="h-4 w-4" />
            </button>

            {/* LOGO */}

            <div className="mb-6 w-[145px]">
              <Image
                src={
                  isDark
                    ? logos.dark
                    : logos.light
                }
                alt="PeakScore"
                width={330}
                height={100}
                unoptimized
                className="
                  h-auto
                  w-full
                  object-contain
                  object-left
                "
              />
            </div>

            {/* ICON */}

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
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "bg-blue-50 text-blue-600"
                }
              `}
            >
              <LockKeyhole className="h-5 w-5" />
            </div>

            {/* TITLE */}

            <h2
              className={`
                text-2xl
                font-black
                tracking-tight
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }
              `}
            >
              Tu aventura comienza aquí
            </h2>

            {/* DESCRIPTION */}

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
              Para explorar tu camino, guardar
              tu progreso y acceder a tu dashboard
              necesitas una cuenta de PeakScore.
            </p>

            {/* BENEFITS */}

            <div className="mt-5 space-y-2.5">
              {[
                "Guarda tu progreso",
                "Consulta tus resultados",
                "Sigue tu camino hacia el Peak",
              ].map((item) => (
                <div
                  key={item}
                  className={`
                    flex
                    items-center
                    gap-2.5
                    text-xs
                    font-semibold
                    ${
                      isDark
                        ? "text-white/70"
                        : "text-slate-600"
                    }
                  `}
                >
                  <span
                    className={`
                      flex
                      h-5
                      w-5
                      items-center
                      justify-center
                      rounded-full
                      ${
                        isDark
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-emerald-50 text-emerald-600"
                      }
                    `}
                  >
                    <Check className="h-3 w-3" />
                  </span>

                  {item}
                </div>
              ))}
            </div>

            {/* ACTIONS */}

            <div className="mt-7 space-y-2.5">
              <Link
                href="/login"
                onClick={() =>
                  setAuthGateOpen(false)
                }
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
                  ${
                    isDark
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }
                `}
              >
                Ya tengo una cuenta
              </Link>

              <Link
                href="/register"
                onClick={() =>
                  setAuthGateOpen(false)
                }
                className="
                  group
                  flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-600
                  via-violet-600
                  to-fuchsia-600
                  text-sm
                  font-black
                  text-white
                  shadow-[0_10px_30px_rgba(79,70,229,0.28)]
                  transition-transform
                  duration-200
                  hover:-translate-y-0.5
                "
              >
                Crear mi cuenta

                <ArrowRight
                  className="
                    h-4
                    w-4
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   PRODUCT FEATURE — DESKTOP
============================================================ */

function ProductFeature({
  eyebrow,
  title,
  description,
  isDark,
  type,
}: {
  eyebrow: string;
  title: string;
  description: string;
  isDark: boolean;
  type: "sessions" | "bank" | "analysis";
}) {
  const accent =
    type === "sessions"
      ? isDark
        ? "text-cyan-300"
        : "text-blue-700"
      : type === "bank"
        ? isDark
          ? "text-violet-300"
          : "text-violet-700"
        : isDark
          ? "text-amber-300"
          : "text-amber-700";

  const line =
    type === "sessions"
      ? isDark
        ? "bg-cyan-400"
        : "bg-blue-600"
      : type === "bank"
        ? isDark
          ? "bg-violet-400"
          : "bg-violet-600"
        : isDark
          ? "bg-amber-400"
          : "bg-amber-500";

  const number =
    type === "sessions" ? "01" : type === "bank" ? "02" : "03";

  return (
    <div
      className={`
        group relative flex items-start gap-[2.2%]
        border-b pb-[2.5%] pt-[1.2%]
        last:border-b-0
        ${isDark ? "border-white/8" : "border-slate-900/10"}
      `}
    >
      <div className="flex w-[clamp(24px,2.2vw,34px)] shrink-0 flex-col items-center self-stretch">
        <span
          className={`
            pt-0.5 font-mono text-[clamp(7px,0.55vw,10px)]
            font-bold tracking-[0.16em] ${accent}
          `}
        >
          {number}
        </span>
        <span className={`mt-2 w-px flex-1 opacity-35 ${line}`} />
      </div>

      <div className="min-w-0 flex-1 pb-0.5">
        <div className="flex items-center gap-2">
          <p
            className={`
              text-[clamp(6px,0.52vw,9px)]
              font-black uppercase tracking-[0.16em] ${accent}
            `}
          >
            {eyebrow}
          </p>
          <span
            className={`
              h-px w-[clamp(18px,2vw,34px)]
              ${isDark ? "bg-white/12" : "bg-slate-900/12"}
            `}
          />
        </div>

        <p
          className={`
            mt-0.5 text-[clamp(11px,0.82vw,16px)]
            font-black tracking-[-0.02em]
            ${isDark ? "text-white" : "text-slate-950"}
          `}
        >
          {title}
        </p>

        <p
          className={`
            mt-0.5 max-w-[500px]
            text-[clamp(7px,0.55vw,10.5px)]
            font-medium leading-[1.35]
            ${isDark ? "text-blue-100/55" : "text-slate-600"}
          `}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MOBILE PRODUCT FEATURE
============================================================ */

function MobileProductFeature({
  eyebrow,
  title,
  description,
  isDark,
  type,
}: {
  eyebrow: string;
  title: string;
  description: string;
  isDark: boolean;
  type: "sessions" | "bank" | "analysis";
}) {
  const accent =
    type === "sessions"
      ? isDark
        ? "text-cyan-300"
        : "text-blue-700"
      : type === "bank"
        ? isDark
          ? "text-violet-300"
          : "text-violet-700"
        : isDark
          ? "text-amber-300"
          : "text-amber-700";

  const number =
    type === "sessions" ? "01" : type === "bank" ? "02" : "03";

  return (
    <div
      className={`
        relative flex items-start gap-3 border-t py-3
        ${isDark ? "border-white/10" : "border-slate-900/10"}
      `}
    >
      <span
        className={`
          w-5 shrink-0 pt-0.5 font-mono text-[8px]
          font-black tracking-[0.12em] ${accent}
        `}
      >
        {number}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`
            text-[7px] font-black uppercase
            tracking-[0.12em] ${accent}
          `}
        >
          {eyebrow}
        </p>

        <p
          className={`
            mt-0.5 text-[11px] font-black leading-tight
            ${isDark ? "text-white" : "text-slate-950"}
          `}
        >
          {title}
        </p>

        <p
          className={`
            mt-1 max-w-[330px] text-[8px]
            font-medium leading-[1.35]
            ${isDark ? "text-white/50" : "text-slate-600"}
          `}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SUBJECT BAR — DESKTOP
============================================================ */

function SubjectBar() {
  return (
    <div
      className="
        absolute
        bottom-[13.5%]
        left-[5.5%]
        z-30
        flex
        w-[89%]
        items-stretch
        overflow-hidden
        rounded-[clamp(12px,1.2vw,20px)]
        border
        border-cyan-400/55
        bg-[#071a35]/92
        shadow-[0_15px_40px_rgba(0,0,0,0.22)]
        backdrop-blur-xl
      "
    >
      {subjects.map(
        (subject, index) => (
          <div
            key={subject.name}
            className={`
              flex
              min-w-0
              flex-1
              items-center
              gap-[5%]
              px-[1.35%]
              py-[1.15%]
              ${
                index !==
                subjects.length - 1
                  ? "border-r border-blue-300/15"
                  : ""
              }
            `}
          >
            <div
              className="
                relative
                h-[clamp(35px,3.7vw,60px)]
                w-[clamp(35px,3.7vw,60px)]
                shrink-0
              "
            >
              <Image
                src={subject.icon}
                alt=""
                fill
                sizes="60px"
                className="object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate
                  text-[clamp(6px,0.62vw,11px)]
                  font-bold
                  text-white
                "
              >
                {subject.name}
              </p>

              <p
                className="
                  mt-0.5
                  text-[clamp(14px,1.35vw,23px)]
                  font-black
                  leading-none
                  text-white
                "
              >
                {subject.score}

                <span
                  className="
                    ml-1
                    text-[clamp(7px,0.58vw,10px)]
                    font-bold
                    text-blue-200/55
                  "
                >
                  /100
                </span>
              </p>

              <div
                className="
                  mt-1.5
                  h-[clamp(4px,0.4vw,7px)]
                  overflow-hidden
                  rounded-full
                  bg-white/10
                "
              >
                <div
                  className={`
                    h-full
                    rounded-full
                    ${subject.color}
                  `}
                  style={{
                    width: `${subject.score}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   SUBJECT BAR — MOBILE
============================================================ */

function MobileSubjectBar() {
  return (
    <div
      className="
        absolute
        bottom-[9%]
        left-[5%]
        z-30
        grid
        w-[90%]
        grid-cols-2
        overflow-hidden
        rounded-2xl
        border
        border-cyan-400/55
        bg-[#071a35]/92
        shadow-[0_15px_35px_rgba(0,0,0,0.22)]
        backdrop-blur-xl
      "
    >
      {subjects.map(
        (subject, index) => {
          const isLast =
            index === subjects.length - 1;

          return (
            <div
              key={subject.name}
              className={`
                flex
                min-w-0
                items-center
                gap-2
                px-2.5
                py-2.5
                ${
                  isLast
                    ? "col-span-2 justify-center"
                    : ""
                }
                ${
                  !isLast
                    ? "border-b border-blue-300/15"
                    : ""
                }
                ${
                  index % 2 === 0 &&
                  !isLast
                    ? "border-r border-blue-300/15"
                    : ""
                }
              `}
            >
              <div
                className="
                  relative
                  h-[38px]
                  w-[38px]
                  shrink-0
                "
              >
                <Image
                  src={subject.icon}
                  alt=""
                  fill
                  sizes="38px"
                  className="object-contain"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-[8px]
                    font-bold
                    text-white
                  "
                >
                  {subject.name}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[17px]
                    font-black
                    leading-none
                    text-white
                  "
                >
                  {subject.score}

                  <span
                    className="
                      ml-0.5
                      text-[8px]
                      font-bold
                      text-blue-200/55
                    "
                  >
                    /100
                  </span>
                </p>

                <div
                  className="
                    mt-1.5
                    h-1
                    overflow-hidden
                    rounded-full
                    bg-white/10
                  "
                >
                  <div
                    className={`
                      h-full
                      rounded-full
                      ${subject.color}
                    `}
                    style={{
                      width: `${subject.score}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/* ============================================================
   CTA
============================================================ */

function ExploreButton({
  checkingAuth,
  onClick,
  mobile = false,
}: {
  checkingAuth: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={checkingAuth}
      className={`
        absolute
        left-1/2
        z-40
        flex
        -translate-x-1/2
        items-center
        justify-center
        gap-2
        rounded-full
        bg-gradient-to-r
        from-cyan-400
        via-blue-500
        to-fuchsia-500
        font-black
        text-white
        shadow-[0_12px_40px_rgba(42,100,255,0.4)]
        transition-all
        duration-200
        hover:scale-[1.035]
        hover:shadow-[0_16px_50px_rgba(42,100,255,0.55)]
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-cyan-300
        disabled:cursor-wait
        disabled:opacity-80
        ${
          mobile
            ? `
              bottom-[2.5%]
              h-[43px]
              w-[58%]
              text-[11px]
            `
            : `
              bottom-[3.2%]
              h-[5.6%]
              w-[21%]
              text-[clamp(9px,1vw,17px)]
            `
        }
      `}
    >
      {checkingAuth
        ? "Comprobando..."
        : "Explora tu camino"}

      {!checkingAuth && (
        <ArrowRight
          className="
            h-[1em]
            w-[1em]
          "
        />
      )}
    </button>
  );
}