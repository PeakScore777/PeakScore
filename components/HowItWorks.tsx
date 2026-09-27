"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import type { LandingTheme } from "@/components/Navbar";

/* ==========================================================================
   PEAKSCORE — HOW IT WORKS
   ========================================================================== */

const EASE = [0.22, 1, 0.36, 1] as const;

type StepTheme = "blue" | "purple" | "cyan";

type Step = {
  number: string;
  title: string;
  description: string;
  label: string;
  theme: StepTheme;
  icon: string;
};

/* ==========================================================================
   STEPS
   ========================================================================== */

const steps: Step[] = [
  {
    number: "01",
    title: "Practica",
    description:
      "Entrena con preguntas tipo ICFES y simulacros adaptados a tus objetivos.",
    label: "TU PUNTO DE PARTIDA",
    theme: "blue",
    icon: "/peaky/homepage/practica.png",
  },
  {
    number: "02",
    title: "Mejora",
    description:
      "Comprende tus resultados, identifica oportunidades y fortalece tus habilidades.",
    label: "CONOCE TU PROGRESO",
    theme: "purple",
    icon: "/peaky/homepage/graficapixel.webp",
  },
  {
    number: "03",
    title: "Sube de nivel",
    description:
      "Avanza hacia tus metas, acumula experiencia y celebra cada logro.",
    label: "ALCANZA TU PEAK",
    theme: "cyan",
    icon: "/peaky/homepage/subedenivelpixel.webp",
  },
];

/* ==========================================================================
   CARD STYLES
   ========================================================================== */

const stepStyles = {
  blue: {
    accent: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-600",
    textDark: "text-blue-300",
    textLight: "text-blue-700",
    borderDark: "border-blue-400/25",
    borderLight: "border-blue-200/80",
    iconDark: "bg-blue-500/10",
    iconLight: "bg-blue-50/80",
  },

  purple: {
    accent: "bg-fuchsia-500",
    gradient: "from-fuchsia-500 to-violet-600",
    textDark: "text-fuchsia-300",
    textLight: "text-violet-700",
    borderDark: "border-fuchsia-400/25",
    borderLight: "border-violet-200/80",
    iconDark: "bg-fuchsia-500/10",
    iconLight: "bg-violet-50/80",
  },

  cyan: {
    accent: "bg-cyan-400",
    gradient: "from-cyan-400 to-emerald-500",
    textDark: "text-cyan-300",
    textLight: "text-teal-700",
    borderDark: "border-cyan-400/25",
    borderLight: "border-cyan-200/80",
    iconDark: "bg-cyan-500/10",
    iconLight: "bg-cyan-50/80",
  },
} as const;

/* ==========================================================================
   BACKGROUND PATHS
   ========================================================================== */

function getBackgroundPaths(theme: LandingTheme) {
  if (theme === "dark") {
    return {
      desktop: "/peaky/homepage/howitworkoscuro.webp",
      mobile: "/peaky/homepage/howitworkmobileoscuro.webp",
    };
  }

  return {
    desktop: "/peaky/homepage/howitworkclaro.webp",
    mobile: "/peaky/homepage/howitworkmobileclaro.webp",
  };
}

/* ==========================================================================
   THEME BACKGROUND
   ========================================================================== */

function ThemeBackground({
  theme,
}: {
  theme: LandingTheme;
}) {
  const [visibleTheme, setVisibleTheme] =
    useState<LandingTheme>(theme);

  const [incomingTheme, setIncomingTheme] =
    useState<LandingTheme | null>(null);

  const [incomingReady, setIncomingReady] = useState(false);

  useEffect(() => {
    if (theme === visibleTheme) {
      return;
    }

    setIncomingReady(false);
    setIncomingTheme(theme);
  }, [theme, visibleTheme]);

  useEffect(() => {
    if (!incomingTheme || !incomingReady) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisibleTheme(incomingTheme);
      setIncomingTheme(null);
      setIncomingReady(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [incomingTheme, incomingReady]);

  const visiblePaths = getBackgroundPaths(visibleTheme);

  const incomingPaths = incomingTheme
    ? getBackgroundPaths(incomingTheme)
    : null;

  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        -z-30
        overflow-hidden
      "
    >
      {/* FONDO ACTUAL */}

      <picture className="absolute inset-0 block">
        <source
          media="(max-width: 767px)"
          srcSet={visiblePaths.mobile}
        />

        <img
          src={visiblePaths.desktop}
          alt=""
          draggable={false}
          decoding="async"
          className="
            h-full
            w-full
            object-cover
            object-center
          "
        />
      </picture>

      {/* FONDO EN TRANSICIÓN */}

      {incomingPaths && (
        <picture
          className={`
            absolute
            inset-0
            block
            transition-opacity
            duration-500
            ease-out
            ${
              incomingReady
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        >
          <source
            media="(max-width: 767px)"
            srcSet={incomingPaths.mobile}
          />

          <img
            src={incomingPaths.desktop}
            alt=""
            draggable={false}
            decoding="async"
            onLoad={() => setIncomingReady(true)}
            className="
              h-full
              w-full
              object-cover
              object-center
            "
          />
        </picture>
      )}
    </div>
  );
}

/* ==========================================================================
   STEP CARD
   ========================================================================== */

function StepCard({
  step,
  index,
  theme,
  reducedMotion,
}: {
  step: Step;
  index: number;
  theme: LandingTheme;
  reducedMotion: boolean;
}) {
  const isDark = theme === "dark";
  const colors = stepStyles[step.theme];

  return (
    <motion.article
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 24,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.65,
        delay: index * 0.1,
        ease: EASE,
      }}
      className={`
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-[26px]
        border
        p-5
        backdrop-blur-xl
        transition-all
        duration-300
        sm:p-6

        ${
          isDark
            ? `${colors.borderDark} bg-[#07143b]/92 shadow-[0_22px_55px_rgba(0,0,0,0.28)]`
            : `${colors.borderLight} bg-white/92 shadow-[0_18px_45px_rgba(20,64,120,0.13)]`
        }

        ${
          reducedMotion
            ? ""
            : "hover:-translate-y-1.5"
        }
      `}
    >
      {/* ACCENT SUPERIOR */}

      <div
        className={`
          absolute
          inset-x-0
          top-0
          h-1
          ${colors.accent}
        `}
      />

      {/* HEADER */}

      <div className="flex items-center justify-between gap-3">
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            text-sm
            font-black
            text-white
            shadow-lg
            ${colors.gradient}
          `}
        >
          {step.number}
        </div>

        <span
          className={`
            text-right
            text-[8px]
            font-black
            uppercase
            tracking-[0.14em]
            sm:text-[9px]
            ${
              isDark
                ? colors.textDark
                : colors.textLight
            }
          `}
        >
          {step.label}
        </span>
      </div>

      {/* ICONO */}

      <div
        className={`
          relative
          mx-auto
          mt-6
          flex
          h-32
          w-full
          max-w-[180px]
          items-center
          justify-center
          overflow-hidden
          rounded-[24px]
          ${
            isDark
              ? colors.iconDark
              : colors.iconLight
          }
        `}
      >
        <Image
          src={step.icon}
          alt=""
          width={150}
          height={150}
          sizes="(max-width: 640px) 120px, 150px"
          quality={78}
          className="
            h-[112px]
            w-[112px]
            object-contain
            transition-transform
            duration-300
            sm:h-[126px]
            sm:w-[126px]
            group-hover:scale-105
          "
        />
      </div>

      {/* CONTENIDO */}

      <div className="mt-6 flex flex-1 flex-col text-center">
        <h3
          className={`
            text-xl
            font-black
            tracking-tight
            sm:text-[22px]
            ${
              isDark
                ? "text-white"
                : "text-[#091e49]"
            }
          `}
        >
          {step.title}
        </h3>

        <p
          className={`
            mx-auto
            mt-3
            max-w-[260px]
            text-[12px]
            leading-[1.7]
            sm:text-[13px]
            ${
              isDark
                ? "text-blue-100/75"
                : "text-slate-600"
            }
          `}
        >
          {step.description}
        </p>

        {/* INDICADOR */}

        <div className="mt-auto flex justify-center gap-1.5 pt-7">
          {steps.map((item, dotIndex) => (
            <span
              key={item.number}
              aria-hidden="true"
              className={`
                h-1.5
                rounded-full
                transition-all
                duration-300
                ${
                  dotIndex === index
                    ? `w-7 ${colors.accent}`
                    : `w-1.5 ${
                        isDark
                          ? "bg-white/20"
                          : "bg-slate-200"
                      }`
                }
              `}
            />
          ))}
        </div>
      </div>
    </motion.article>
  );
}

/* ==========================================================================
   PEAK HUD
   ========================================================================== */

type HudAccent =
  | "blue"
  | "gold"
  | "orange"
  | "cyan";

type HudItemProps = {
  icon: string;
  label: string;
  value: string;
  accent: HudAccent;
  theme: LandingTheme;
};

const hudConfig = {
  blue: {
    text: "text-cyan-300",
    glow: "bg-cyan-400",
    border: "border-cyan-400/25",
    iconBg: "bg-cyan-400/10",
    bar: "from-cyan-400 to-blue-500",
  },

  gold: {
    text: "text-amber-300",
    glow: "bg-amber-400",
    border: "border-amber-400/25",
    iconBg: "bg-amber-400/10",
    bar: "from-amber-300 to-orange-500",
  },

  orange: {
    text: "text-orange-300",
    glow: "bg-orange-400",
    border: "border-orange-400/25",
    iconBg: "bg-orange-400/10",
    bar: "from-orange-400 to-red-500",
  },

  cyan: {
    text: "text-cyan-300",
    glow: "bg-cyan-400",
    border: "border-cyan-400/25",
    iconBg: "bg-cyan-400/10",
    bar: "from-cyan-300 to-emerald-400",
  },
} as const;

function HudItem({
  icon,
  label,
  value,
  accent,
  theme,
}: HudItemProps) {
  const isDark = theme === "dark";
  const config = hudConfig[accent];

  return (
    <motion.div
      whileHover={{
        y: -4,
        scale: 1.015,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 22,
      }}
      className={`
        group
        relative
        overflow-hidden
        rounded-[24px]
        border
        p-4
        backdrop-blur-xl
        transition-colors
        duration-500
        sm:p-5

        ${
          isDark
            ? `
              ${config.border}
              bg-[#06143b]/92
              shadow-[0_18px_45px_rgba(0,0,0,0.28)]
            `
            : `
              border-white/80
              bg-white/92
              shadow-[0_16px_38px_rgba(20,64,120,0.12)]
            `
        }
      `}
    >
      {/* GLOW INTERNO */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-20
          w-20
          rounded-full
          opacity-10
          blur-2xl
          ${config.glow}
        `}
      />

      {/* ESQUINA DECORATIVA */}

      <div
        aria-hidden="true"
        className={`
          absolute
          right-0
          top-0
          h-12
          w-12
          opacity-20
          ${
            isDark
              ? "border-l border-b"
              : "border-l border-b"
          }
          ${config.border}
        `}
      />

      <div className="relative flex items-center gap-3">
        {/* ICONO */}

        <div
          className={`
            relative
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-2xl
            border
            ${
              isDark
                ? `${config.border} ${config.iconBg}`
                : "border-slate-200/80 bg-slate-50"
            }
          `}
        >
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="
              h-11
              w-11
              object-contain
              transition-transform
              duration-300
              group-hover:scale-110
            "
          />
        </div>

        {/* DATA */}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`
                text-[8px]
                font-black
                uppercase
                tracking-[0.2em]
                sm:text-[9px]
                ${
                  isDark
                    ? config.text
                    : "text-slate-500"
                }
              `}
            >
              {label}
            </span>

            <span
              className={`
                hidden
                text-[7px]
                font-black
                uppercase
                tracking-[0.15em]
                sm:block
                ${
                  isDark
                    ? "text-white/30"
                    : "text-slate-300"
                }
              `}
            >
              PEAK
            </span>
          </div>

          <div
            className={`
              mt-1
              text-[25px]
              font-black
              leading-none
              tracking-[-0.04em]
              ${
                isDark
                  ? "text-white"
                  : "text-[#091e49]"
              }
            `}
          >
            {value}
          </div>
        </div>
      </div>

      {/* MINI PROGRESS */}

      <div className="relative mt-4">
        <div
          className={`
            h-1
            w-full
            overflow-hidden
            rounded-full
            ${
              isDark
                ? "bg-white/10"
                : "bg-slate-100"
            }
          `}
        >
          <motion.div
            initial={{
              width: "0%",
            }}
            whileInView={{
              width: "68%",
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 1,
              delay: 0.25,
              ease: EASE,
            }}
            className={`
              h-full
              rounded-full
              bg-gradient-to-r
              ${config.bar}
            `}
          />
        </div>
      </div>

      {/* IDENTIFICADOR */}

      <div
        className={`
          mt-2
          flex
          items-center
          justify-between
          text-[7px]
          font-bold
          uppercase
          tracking-[0.12em]
          ${
            isDark
              ? "text-white/35"
              : "text-slate-400"
          }
        `}
      >
        <span>
          PROGRESO
        </span>

        <span>
          ACTIVO
        </span>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   MAIN
   ========================================================================== */

export default function HowItWorks({
  theme,
}: {
  theme: LandingTheme;
}) {
  const reducedMotion = Boolean(useReducedMotion());

  const isDark = theme === "dark";

  const reveal = reducedMotion
    ? {}
    : {
        initial: {
          opacity: 0,
          y: 24,
        },

        whileInView: {
          opacity: 1,
          y: 0,
        },

        viewport: {
          once: true,
          margin: "-70px",
        },
      };

  return (
    <section
      id="how-it-works"
      className={`
        relative
        isolate
        overflow-hidden
        transition-colors
        duration-500

        ${
          isDark
            ? "bg-[#050b2d] text-white"
            : "bg-[#dff5ff] text-[#091e49]"
        }
      `}
    >
      {/* =====================================================================
          BACKGROUND
          ===================================================================== */}

      <ThemeBackground theme={theme} />

      {/* =====================================================================
          OVERLAY
          ===================================================================== */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          inset-0
          -z-10
          transition-colors
          duration-500

          ${
            isDark
              ? "bg-[#020617]/25"
              : "bg-white/5"
          }
        `}
      />

      {/* =====================================================================
          CONTENT
          ===================================================================== */}

      <div
        className="
          relative
          mx-auto
          max-w-[1500px]
          px-5
          py-16
          sm:px-8
          sm:py-20
          lg:px-12
          lg:py-24
        "
      >
        {/* ===================================================================
            HEADER
            =================================================================== */}

        <motion.header
          {...reveal}
          transition={{
            duration: 0.75,
            ease: EASE,
          }}
          className="mx-auto max-w-4xl text-center"
        >
          {/* BADGE */}

          <div
            className={`
              mx-auto
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              px-4
              py-2
              text-[9px]
              font-black
              uppercase
              tracking-[0.22em]
              backdrop-blur-xl

              ${
                isDark
                  ? "border-blue-300/25 bg-[#08163d]/80 text-blue-200"
                  : "border-blue-200/80 bg-white/85 text-blue-700"
              }
            `}
          >
            <span
              className={`
                h-1.5
                w-1.5
                rounded-full
                ${
                  isDark
                    ? "bg-cyan-400"
                    : "bg-blue-500"
                }
              `}
            />

            Cómo funciona

            <span
              className={`
                h-1.5
                w-1.5
                rounded-full
                ${
                  isDark
                    ? "bg-fuchsia-400"
                    : "bg-emerald-500"
                }
              `}
            />
          </div>

          {/* TITLE */}

          <h2
            className={`
              mt-6
              text-[42px]
              font-black
              leading-[0.98]
              tracking-[-0.06em]
              sm:text-6xl
              lg:text-[76px]

              ${
                isDark
                  ? "text-white"
                  : "text-[#06184a]"
              }
            `}
          >
            ¿Cómo funciona
            <br />

            <span
              className={`
                bg-gradient-to-r
                bg-clip-text
                text-transparent

                ${
                  isDark
                    ? "from-cyan-300 via-blue-400 to-fuchsia-400"
                    : "from-blue-700 via-blue-500 to-emerald-500"
                }
              `}
            >
              PeakScore?
            </span>
          </h2>

          {/* DESCRIPTION */}

          <p
            className={`
              mx-auto
              mt-5
              max-w-2xl
              text-sm
              font-medium
              leading-7
              sm:text-base

              ${
                isDark
                  ? "text-blue-100/80"
                  : "text-[#18366c]/90"
              }
            `}
          >
            Prepárate para el ICFES de una manera diferente.
            Practica, descubre tus fortalezas y alcanza tus
            metas en tres pasos.
          </p>
        </motion.header>

        {/* ===================================================================
            PEAKY + STEPS
            =================================================================== */}

        <div
          className="
            mt-12
            grid
            items-center
            gap-10
            lg:mt-16
            lg:grid-cols-[0.8fr_1.6fr]
            lg:gap-12
          "
        >
          {/* =================================================================
              PEAKY
              ================================================================= */}

          <motion.div
            {...reveal}
            transition={{
              duration: 0.85,
              ease: EASE,
            }}
            className="
              relative
              order-2
              mx-auto
              flex
              w-full
              max-w-[550px]
              flex-col
              items-center
              lg:order-1
            "
          >
            {/* SPEECH BUBBLE */}

            <motion.div
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: [0, -5, 0],
                    }
              }
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: EASE,
              }}
              className={`
                relative
                z-20
                w-fit
                max-w-[260px]
                rounded-[22px]
                border
                px-6
                py-4
                text-center
                shadow-xl
                backdrop-blur-xl

                ${
                  isDark
                    ? "border-blue-300/25 bg-[#08163d]/95 text-white"
                    : "border-white bg-white/95 text-[#091e49]"
                }
              `}
            >
              <p className="text-base font-black leading-6">
                Tu camino hacia el Peak
                <br />

                <span
                  className={
                    isDark
                      ? "text-cyan-300"
                      : "text-emerald-600"
                  }
                >
                  empieza aquí.
                </span>
              </p>

              <p
                className={`
                  mt-2
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]

                  ${
                    isDark
                      ? "text-blue-200/65"
                      : "text-slate-500"
                  }
                `}
              >
                Practica · Analiza · Evoluciona
              </p>
            </motion.div>

            {/* PEAKY */}

            <motion.div
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: [0, -8, 0],
                    }
              }
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: EASE,
              }}
              className="relative mt-4 w-full"
            >
              <Image
                key={theme}
                src={
                  isDark
                    ? "/peaky/homepage/howitworkpeaky.webp"
                    : "/peaky/homepage/howitworkpeakyclaro.webp"
                }
                alt="Peaky, la mascota de PeakScore"
                width={1199}
                height={1312}
                sizes="(max-width: 1023px) 85vw, 460px"
                quality={85}
                className="
                  mx-auto
                  h-auto
                  w-full
                  max-w-[480px]
                  object-contain
                  drop-shadow-[0_25px_40px_rgba(0,0,0,0.28)]
                "
              />
            </motion.div>
          </motion.div>

          {/* =================================================================
              STEPS
              ================================================================= */}

          <div className="order-1 lg:order-2">
            <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <StepCard
                  key={step.number}
                  step={step}
                  index={index}
                  theme={theme}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>

            {/* MENSAJE */}

            <motion.div
              {...reveal}
              transition={{
                duration: 0.7,
                delay: 0.2,
                ease: EASE,
              }}
              className={`
                mt-5
                rounded-2xl
                border
                px-5
                py-4
                text-center
                text-xs
                font-semibold
                leading-6
                backdrop-blur-xl
                sm:text-sm

                ${
                  isDark
                    ? "border-white/10 bg-[#07143b]/80 text-blue-100/85"
                    : "border-white/80 bg-white/85 text-[#18366c]"
                }
              `}
            >
              Cada pregunta que resuelves te acerca a tu
              próximo logro.
            </motion.div>
          </div>
        </div>

        {/* ===================================================================
            PEAK HUD
            =================================================================== */}

        <motion.div
          {...reveal}
          transition={{
            duration: 0.75,
            delay: 0.25,
            ease: EASE,
          }}
          className="
            mt-10
            grid
            grid-cols-2
            gap-3
            lg:mt-12
            lg:grid-cols-4
          "
        >
          {/* XP */}

          <HudItem
            icon="/peaky/homepage/xp.webp"
            label="XP"
            value="2.450"
            accent="blue"
            theme={theme}
          />

          {/* NIVEL */}

          <HudItem
            icon="/dashboard/premio-pixel.webp"
            label="Nivel"
            value="12"
            accent="gold"
            theme={theme}
          />

          {/* RACHA */}

          <HudItem
            icon="/dashboard/racha-pixel.webp"
            label="Racha"
            value="12"
            accent="orange"
            theme={theme}
          />

          {/* DIAMANTES */}

          <HudItem
            icon="/peaky/homepage/diamante.webp"
            label="Diamantes"
            value="350"
            accent="cyan"
            theme={theme}
          />
        </motion.div>

        {/* ===================================================================
            FOOTER
            =================================================================== */}

        <motion.p
          {...reveal}
          transition={{
            duration: 0.7,
            delay: 0.35,
            ease: EASE,
          }}
          className={`
            mt-5
            text-center
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.16em]

            ${
              isDark
                ? "text-blue-100/55"
                : "text-blue-900/55"
            }
          `}
        >
          Ejemplo de tu progreso en PeakScore
        </motion.p>
      </div>
    </section>
  );
}