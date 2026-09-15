"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ==========================================================================
   PEAKSCORE — HOW IT WORKS
   ========================================================================== */

const EASE = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    number: "01",
    title: "Practica",
    description:
      "Resuelve preguntas de todas las áreas y prepara tu mente para el ICFES.",
    label: "PUNTO DE PARTIDA",
    progress: 5,
    theme: "blue" as const,
    icon: "practice" as const,
  },
  {
    number: "02",
    title: "Mejora",
    description:
      "Analiza tus resultados, descubre tus fortalezas y trabaja en tus errores.",
    label: "ANÁLISIS",
    progress: 6,
    theme: "purple" as const,
    icon: "progress" as const,
  },
  {
    number: "03",
    title: "Sube de nivel",
    description:
      "Cumple tus metas, gana XP y alcanza una mejor versión de tu rendimiento.",
    label: "EVOLUCIÓN",
    progress: 7,
    theme: "cyan" as const,
    icon: "target" as const,
  },
];

/* ==========================================================================
   MOTION
   ========================================================================== */

function useReveal() {
  const reduced = useReducedMotion();

  return {
    reduced,

    reveal: reduced
      ? {}
      : {
          initial: {
            opacity: 0,
            y: 28,
          },

          whileInView: {
            opacity: 1,
            y: 0,
          },

          viewport: {
            once: true,
            margin: "-80px",
          },
        },

    float: reduced
      ? {}
      : {
          animate: {
            y: [0, -8, 0],
          },

          transition: {
            duration: 4.8,
            repeat: Infinity,
            ease: EASE,
          },
        },
  };
}

/* ==========================================================================
   DECORACIONES PIXEL
   ========================================================================== */

function PixelSpark({
  className = "",
  scale = 1,
}: {
  className?: string;
  scale?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        transform: `scale(${scale})`,
      }}
    >
      <div className="grid grid-cols-3 gap-[3px]">
        <i className="h-1.5 w-1.5 bg-blue-300" />
        <i className="h-1.5 w-1.5 bg-blue-500" />
        <i className="h-1.5 w-1.5 bg-blue-300" />

        <i className="h-1.5 w-1.5 bg-blue-500" />
        <i className="h-1.5 w-1.5 bg-white" />
        <i className="h-1.5 w-1.5 bg-cyan-300" />

        <i className="h-1.5 w-1.5 bg-blue-300" />
        <i className="h-1.5 w-1.5 bg-blue-400" />
        <i className="h-1.5 w-1.5 bg-blue-300" />
      </div>
    </div>
  );
}

function PixelPlus({
  className = "",
  color = "blue",
}: {
  className?: string;
  color?: "blue" | "purple" | "cyan";
}) {
  const tone =
    color === "purple"
      ? "bg-fuchsia-400"
      : color === "cyan"
        ? "bg-cyan-300"
        : "bg-blue-300";

  return (
    <div
      aria-hidden="true"
      className={`absolute ${className}`}
    >
      <div
        className={`absolute left-3 top-0 h-3 w-3 ${tone}`}
      />

      <div
        className={`absolute left-0 top-3 h-3 w-9 ${tone}`}
      />

      <div
        className={`absolute left-3 top-6 h-3 w-3 ${tone}`}
      />
    </div>
  );
}

function PinkPixelCloud({
  className = "",
  scale = 1,
  opacity = 0.5,
}: {
  className?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <svg
        width="190"
        height="105"
        viewBox="0 0 190 105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="howPinkCloudFill"
            x1="30"
            y1="20"
            x2="160"
            y2="95"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ffe4f2" />
            <stop offset="0.3" stopColor="#f9a8d4" />
            <stop offset="0.68" stopColor="#e879f9" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>

          <linearGradient
            id="howPinkCloudHighlight"
            x1="60"
            y1="20"
            x2="105"
            y2="65"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#fbcfe8" />
          </linearGradient>

          <filter
            id="howPinkCloudGlow"
            x="-30%"
            y="-40%"
            width="160%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <path
          d="M22 69H8V56H20V43H33V30H48V20H64V27H77V15H95V8H112V15H126V28H142V36H159V48H174V61H183V75H169V84H145V91H121V98H83V93H58V87H34V82H22V69Z"
          fill="#ec4899"
          opacity="0.28"
          filter="url(#howPinkCloudGlow)"
        />

        <path
          d="M22 69H8V56H20V43H33V30H48V20H64V27H77V15H95V8H112V15H126V28H142V36H159V48H174V61H183V75H169V84H145V91H121V98H83V93H58V87H34V82H22V69Z"
          fill="#7c3aed"
          opacity="0.5"
        />

        <path
          d="M22 64H14V52H27V39H39V28H54V21H68V30H80V20H96V12H111V19H125V31H140V39H157V51H172V64H181V73H166V82H143V89H119V94H84V89H59V84H37V78H22V64Z"
          fill="url(#howPinkCloudFill)"
        />

        <path
          d="M42 39H53V29H66V36H78V30H91V21H105V25H116V34H127V43H108V39H93V43H77V48H58V53H43V47H35V43H42V39Z"
          fill="url(#howPinkCloudHighlight)"
          opacity="0.82"
        />

        <path
          d="M20 64H36V70H57V76H82V82H115V87H83V83H57V78H34V73H20V64Z"
          fill="#9d174d"
          opacity="0.38"
        />

        <rect x="48" y="31" width="7" height="7" fill="#fff1f8" opacity="0.9" />
        <rect x="121" y="39" width="6" height="6" fill="#fdf2f8" opacity="0.72" />
        <rect x="143" y="53" width="5" height="5" fill="#f5d0fe" opacity="0.65" />
      </svg>
    </div>
  );
}

function PixelHeart() {
  const blocks = [
    "left-2 top-1",
    "left-5 top-1",
    "left-1 top-4",
    "left-4 top-4",
    "left-7 top-4",
    "left-2 top-7",
    "left-5 top-7",
    "left-3.5 top-10",
  ];

  return (
    <div
      aria-hidden="true"
      className="relative h-14 w-14 opacity-80"
    >
      {blocks.map((position, index) => (
        <i
          key={`${position}-${index}`}
          className={`absolute h-3 w-3 ${
            index === 3
              ? "bg-fuchsia-300"
              : "bg-fuchsia-500"
          } ${position}`}
        />
      ))}
    </div>
  );
}

/* ==========================================================================
   ICONOS DE LOS 3 PASOS
   ========================================================================== */

function PixelPractice() {
  return (
    <img
      src="/iconospixel/practicapixel.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-[108px] w-[108px] object-contain"
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
}

function PixelGrowth() {
  return (
    <img
      src="/iconospixel/graficapixel.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-[108px] w-[108px] object-contain"
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
}

function PixelTarget() {
  return (
    <img
      src="/iconospixel/subedenivelpixel.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-[108px] w-[108px] object-contain"
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
}

function StepIcon({
  type,
}: {
  type: "practice" | "progress" | "target";
}) {
  if (type === "practice") {
    return <PixelPractice />;
  }

  if (type === "progress") {
    return <PixelGrowth />;
  }

  return <PixelTarget />;
}

/* ==========================================================================
   MARCADOR PIXEL
   ========================================================================== */

function PixelProgress({
  filled,
  total = 9,
  theme = "blue",
}: {
  filled: number;
  total?: number;
  theme?: "blue" | "purple" | "cyan";
}) {
  const active =
    theme === "purple"
      ? "bg-fuchsia-500"
      : theme === "cyan"
        ? "bg-cyan-400"
        : "bg-blue-500";

  return (
    <div
      className="flex gap-1.5"
      aria-hidden="true"
    >
      {Array.from({
        length: total,
      }).map((_, index) => (
        <i
          key={index}
          className={`h-2.5 w-2.5 ${
            index < filled
              ? active
              : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ==========================================================================
   BOTONES
   ========================================================================== */

function PixelButton({
  children,
  variant = "blue",
  className = "",
}: {
  children: ReactNode;
  variant?: "blue" | "purple" | "cyan";
  className?: string;
}) {
  const colors =
    variant === "purple"
      ? "border-fuchsia-300 bg-fuchsia-500 text-white shadow-[4px_4px_0_#701a75]"
      : variant === "cyan"
        ? "border-cyan-200 bg-cyan-400 text-[#04113c] shadow-[4px_4px_0_#0e7490]"
        : "border-blue-200 bg-blue-500 text-white shadow-[4px_4px_0_#172554]";

  return (
    <button
      type="button"
      className={`relative border-2 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-transform duration-200 hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none ${colors} ${className}`}
    >
      <span className="absolute left-0 top-0 h-1.5 w-5 bg-white/60" />

      <span className="absolute bottom-0 right-0 h-1.5 w-5 bg-black/20" />

      {children}
    </button>
  );
}

/* ==========================================================================
   HUD — PNG COMPLETO
   ========================================================================== */

function HudPixelCard({
  src,
  alt,
  className = "",
  glow = "blue",
}: {
  src: string;
  alt: string;
  className?: string;
  glow?: "blue" | "gold" | "cyan";
}) {
  const glowColor =
    glow === "gold"
      ? "rgba(250, 204, 21, 0.65)"
      : glow === "cyan"
        ? "rgba(34, 211, 238, 0.65)"
        : "rgba(37, 99, 235, 0.65)";

  return (
    <motion.div
      className={`relative flex w-full items-center justify-center ${className}`}
      whileHover={{
        y: -6,
        scale: 1.035,
        filter: `drop-shadow(0 0 14px ${glowColor})`,
      }}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 20,
        mass: 0.7,
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="block h-auto w-full object-contain"
        style={{
          imageRendering: "pixelated",
        }}
      />
    </motion.div>
  );
}

/* ==========================================================================
   RACHA — PNG COMPLETO
   ========================================================================== */

function PixelFlame() {
  return (
    <img
      src="/iconospixel/rachapixel.png"
      alt="Racha 12"
      draggable={false}
      className="block h-auto w-full object-contain"
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
}

function StreakCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <motion.div
      className={`relative flex w-full items-center justify-center ${
        compact
          ? "min-h-[100px]"
          : "min-h-[120px]"
      }`}
      whileHover={{
        y: -6,
        scale: 1.035,
        filter:
          "drop-shadow(0 0 18px rgba(249,115,22,0.72))",
      }}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 20,
        mass: 0.7,
      }}
    >
      <PixelFlame />
    </motion.div>
  );
}

/* ==========================================================================
   PIXEL FLOOR
   ========================================================================== */

function PixelChest() {
  return (
    <img
      src="/iconospixel/bolsopixel.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-32 w-40 shrink-0 object-contain"
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
}

function PixelBooks() {
  return (
    <div
      aria-hidden="true"
      className="relative h-36 w-44"
    >
      <i className="absolute bottom-0 left-5 h-8 w-32 rotate-[-2deg] bg-purple-700 shadow-[5px_5px_0_#020617]" />

      <i className="absolute bottom-8 left-0 h-8 w-32 rotate-[2deg] bg-blue-600 shadow-[5px_5px_0_#020617]" />

      <i className="absolute bottom-16 left-8 h-8 w-32 rotate-[-3deg] bg-purple-500 shadow-[5px_5px_0_#020617]" />

      <i className="absolute bottom-24 left-16 h-8 w-24 rotate-[2deg] bg-blue-400 shadow-[5px_5px_0_#020617]" />

      <i className="absolute bottom-2 left-5 h-1 w-32 bg-cyan-300/60" />

      <i className="absolute bottom-10 left-0 h-1 w-32 bg-cyan-300/50" />

      <i className="absolute bottom-[72px] left-8 h-1 w-32 bg-white/30" />
    </div>
  );
}

function PixelOrb() {
  return (
    <div
      aria-hidden="true"
      className="relative h-32 w-32"
    >
      <i className="absolute left-4 top-1 h-24 w-24 rounded-full border-4 border-blue-400 bg-[#07133f] shadow-[0_0_45px_rgba(37,99,235,0.8)]" />

      <i className="absolute left-8 top-5 h-16 w-16 rounded-full border-2 border-cyan-300/50" />

      <i className="absolute left-[38px] top-[38px] h-7 w-7 border-4 border-cyan-300" />

      <i className="absolute left-[45px] top-[45px] h-3 w-3 bg-white" />

      <i className="absolute bottom-0 left-1/2 h-5 w-24 -translate-x-1/2 border-4 border-blue-500 bg-blue-900" />
    </div>
  );
}

/* ==========================================================================
   MAIN
   ========================================================================== */

export default function HowItWorks() {
  const {
    reduced,
    reveal,
    float,
  } = useReveal();

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#06134d] py-20 text-white sm:py-24 lg:py-28"
    >
      {/* ======================================================================
          BACKGROUND
          ====================================================================== */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[12%] h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-white/[0.09] blur-[150px]" />

        <div className="absolute left-[30%] top-[30%] h-[750px] w-[950px] rounded-full bg-blue-500/[0.23] blur-[150px]" />

        <div className="absolute -left-[320px] top-[18%] h-[760px] w-[760px] rounded-full bg-indigo-600/[0.45] blur-[130px]" />

        <div className="absolute -right-[320px] top-[26%] h-[760px] w-[760px] rounded-full bg-purple-600/[0.28] blur-[150px]" />

        <div className="absolute bottom-[-350px] left-1/2 h-[760px] w-[1000px] -translate-x-1/2 rounded-full bg-cyan-500/[0.14] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* NUBES PIXEL ART ROSA */}
        <PinkPixelCloud
          className="left-[-55px] top-[130px]"
          scale={0.9}
          opacity={0.42}
        />

        <PinkPixelCloud
          className="left-[8%] top-[520px]"
          scale={0.55}
          opacity={0.25}
        />

        <PinkPixelCloud
          className="right-[-55px] top-[185px]"
          scale={0.82}
          opacity={0.38}
        />

        <PinkPixelCloud
          className="right-[7%] bottom-[130px]"
          scale={0.52}
          opacity={0.24}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-[390px] opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.35) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            transform:
              "perspective(420px) rotateX(58deg)",
            transformOrigin: "bottom",
          }}
        />
      </div>

      {/* ======================================================================
          PIXEL AMBIENCE
          ====================================================================== */}

      <PixelSpark
        className="left-[4%] top-[12%]"
        scale={1.35}
      />

      <PixelSpark
        className="left-[22%] top-[7%]"
        scale={0.7}
      />

      <PixelSpark
        className="left-[45%] top-[13%]"
        scale={0.8}
      />

      <PixelSpark
        className="right-[25%] top-[8%]"
        scale={0.7}
      />

      <PixelSpark
        className="right-[5%] top-[17%]"
        scale={1.4}
      />

      <PixelSpark
        className="left-[5%] bottom-[25%]"
        scale={0.75}
      />

      <PixelSpark
        className="right-[34%] bottom-[18%]"
        scale={0.65}
      />

      <PixelSpark
        className="right-[6%] bottom-[20%]"
        scale={1.35}
      />

      <PixelPlus
        className="left-[3%] top-[31%]"
      />

      <PixelPlus
        className="left-[27%] top-[22%]"
        color="cyan"
      />

      <PixelPlus
        className="right-[15%] top-[27%]"
        color="purple"
      />

      <PixelPlus
        className="right-[34%] bottom-[31%]"
        color="cyan"
      />

      <div className="absolute right-[25%] top-[11%] hidden lg:block">
        <PixelHeart />
      </div>

      {/* ======================================================================
          CONTENT
          ====================================================================== */}

      <div className="relative mx-auto max-w-[1650px] px-5 sm:px-8 lg:px-12">
        {/* HEADER */}

        <motion.header
          {...reveal}
          transition={{
            duration: 0.85,
            ease: EASE,
          }}
          className="mx-auto max-w-5xl text-center"
        >
          <div className="mb-5 flex items-center justify-center gap-3 sm:mb-6">
            <img
              src="/images/branding/peakscore-logo-transparente.png"
              alt="PeakScore"
              draggable={false}
              className="h-14 w-14 object-contain sm:h-20 sm:w-20"
            />

            <div className="text-4xl font-black tracking-[-0.06em] sm:text-6xl">
              <span className="text-white">
                Peak
              </span>

              <span className="text-blue-500">
                Score
              </span>
            </div>
          </div>

          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-blue-400/70" />

            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-blue-200">
              Cómo funciona
            </span>

            <span className="h-px w-12 bg-blue-400/70" />
          </div>

          <h2 className="text-[47px] font-black leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-[82px]">
            ¿Cómo funciona
            <br />

            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              PeakScore?
            </span>
          </h2>

          <p className="mt-7 text-sm font-medium text-blue-100/90 sm:text-lg">
            Peaky te lo explica en{" "}
            <span className="font-black text-purple-300">
              3 simples pasos
            </span>
          </p>
        </motion.header>

        {/* ====================================================================
            PEAKY + STEPS
            ==================================================================== */}

        <div className="mt-14 grid items-end gap-8 lg:mt-16 lg:grid-cols-[0.82fr_1.58fr] lg:gap-12">
          {/* PEAKY */}

          <motion.div
            {...reveal}
            transition={{
              duration: 0.9,
              delay: 0.08,
              ease: EASE,
            }}
            className="relative order-2 flex min-h-[540px] items-end justify-center lg:order-1 lg:min-h-[610px] lg:justify-start"
          >
            <div className="absolute bottom-10 left-[35%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/35 blur-[105px]" />

            {/* BUBBLE */}

            <motion.div
              {...float}
              className="absolute left-[4%] top-0 z-40 w-[225px] border-4 border-slate-950 bg-white px-5 py-5 text-center shadow-[9px_9px_0_#020617] sm:w-[245px]"
            >
              <div className="text-base font-black leading-5 text-slate-950 sm:text-lg">
                Te explico
                <br />
                cómo funciona
                <br />

                <span className="text-blue-600">
                  PeakScore
                </span>
              </div>

              <div className="absolute -bottom-5 left-12 h-7 w-7 rotate-45 border-b-4 border-r-4 border-slate-950 bg-white" />
            </motion.div>

            {/* PEAKY */}

            <motion.div
              {...float}
              transition={{
                duration: 4.7,
                repeat: Infinity,
                ease: EASE,
              }}
              className="relative z-20 mt-20 w-full"
            >
              <img
                src="/peaky/homepage/howitworkpeaky.png"
                alt="Peaky explicando cómo funciona PeakScore"
                draggable={false}
                className="mx-auto block h-auto w-full max-w-[650px] object-contain drop-shadow-[0_35px_55px_rgba(0,0,0,0.48)] lg:mx-0"
              />
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-blue-400/10 to-transparent" />
          </motion.div>

          {/* ==================================================================
              STEPS
              ================================================================== */}

          <div className="relative order-1 lg:order-2">
            {/* CONNECTOR */}

            <div className="pointer-events-none absolute left-[8%] right-[7%] top-[35px] hidden lg:block">
              <motion.div
                initial={
                  reduced
                    ? false
                    : {
                        scaleX: 0,
                      }
                }
                whileInView={
                  reduced
                    ? undefined
                    : {
                        scaleX: 1,
                      }
                }
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 1.1,
                  ease: EASE,
                }}
                className="h-1 origin-left border-t-2 border-dashed border-white/70"
              />

              <div className="absolute -right-1 -top-2 h-3 w-3 rotate-45 border-r-2 border-t-2 border-white" />
            </div>

            <div className="grid gap-7 md:grid-cols-3 md:gap-5">
              {steps.map(
                (step, index) => {
                  const gradient =
                    step.theme ===
                    "purple"
                      ? "from-purple-500 to-fuchsia-600"
                      : step.theme ===
                          "cyan"
                        ? "from-cyan-400 to-teal-500"
                        : "from-blue-500 to-indigo-700";

                  return (
                    <motion.article
                      key={step.number}
                      {...reveal}
                      transition={{
                        duration: 0.72,
                        delay:
                          0.14 +
                          index * 0.12,
                        ease: EASE,
                      }}
                      className="group relative"
                    >
                      {/* NUMBER */}

                      <div className="relative z-30 mb-5 flex items-center justify-center md:justify-start">
                        <div
                          className={`relative flex h-[70px] w-[70px] items-center justify-center border-4 border-white bg-gradient-to-br ${gradient} shadow-[6px_6px_0_rgba(2,6,23,0.9)] transition-transform duration-300 group-hover:-translate-y-1`}
                        >
                          <span className="text-xl font-black">
                            {step.number}
                          </span>

                          <i className="absolute -right-2 -top-2 h-3 w-3 bg-white" />

                          <i className="absolute -bottom-2 -left-2 h-3 w-3 bg-white" />
                        </div>
                      </div>

                      {/* CARD */}

                      <div
                        className={`relative min-h-[390px] overflow-hidden bg-white p-7 text-slate-950 shadow-[9px_9px_0_rgba(2,6,23,0.6)] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[13px_13px_0_rgba(2,6,23,0.7)]`}
                        style={{
                          clipPath:
                            "polygon(0 16px, 16px 16px, 16px 0, calc(100% - 16px) 0, calc(100% - 16px) 16px, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 16px calc(100% - 16px), 0 calc(100% - 16px))",
                        }}
                      >
                        {/* BORDE PIXELADO */}

                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-95`}
                          style={{
                            clipPath:
                              "polygon(0 16px, 16px 16px, 16px 0, calc(100% - 16px) 0, calc(100% - 16px) 16px, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 16px calc(100% - 16px), 0 calc(100% - 16px))",
                          }}
                        />

                        <div
                          className="pointer-events-none absolute inset-[3px] bg-white"
                          style={{
                            clipPath:
                              "polygon(0 14px, 14px 14px, 14px 0, calc(100% - 14px) 0, calc(100% - 14px) 14px, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 14px calc(100% - 14px), 0 calc(100% - 14px))",
                          }}
                        />

                        {/* PIXEL ACCENTS */}

                        <div
                          className={`pointer-events-none absolute right-0 top-0 h-3 w-20 bg-gradient-to-r ${gradient}`}
                        />

                        <div
                          className={`pointer-events-none absolute bottom-0 left-0 h-3 w-20 bg-gradient-to-r ${gradient}`}
                        />

                        <i className="pointer-events-none absolute right-5 top-5 h-2 w-2 bg-blue-100" />
                        <i className="pointer-events-none absolute bottom-5 left-5 h-2 w-2 bg-blue-100" />

                        {/* CONTENIDO */}

                        <div className="relative z-10">

                        {/* ICONO */}

                        <div className="relative mx-auto flex h-[132px] w-[132px] items-center justify-center">
                          <StepIcon
                            type={step.icon}
                          />
                        </div>

                        {/* TITLE */}

                        <h3 className="mt-7 text-center text-[25px] font-black tracking-[-0.045em]">
                          {step.title}
                        </h3>

                        {/* DESCRIPTION */}

                        <p className="mx-auto mt-4 max-w-[280px] text-center text-[14px] leading-6 text-slate-600">
                          {step.description}
                        </p>

                        {/* LABEL */}

                        <div className="mt-7 flex items-center justify-center gap-3">
                          <span className="h-1 w-7 bg-slate-200" />

                          <span className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">
                            {step.label}
                          </span>

                          <span className="h-1 w-7 bg-slate-200" />
                        </div>

                        {/* PROGRESS */}

                        <div className="mt-6 flex justify-center">
                          <PixelProgress
                            filled={
                              step.progress
                            }
                            total={9}
                            theme={
                              step.theme
                            }
                          />
                        </div>
                      </div>
                    </div>
                    </motion.article>
                  );
                },
              )}
            </div>
          </div>
        </div>

        {/* ====================================================================
            STATS
            ==================================================================== */}

        <motion.div
          {...reveal}
          transition={{
            duration: 0.8,
            delay: 0.25,
          }}
          className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4"
        >
          {/* XP — PNG COMPLETO */}

          <HudPixelCard
            src="/iconospixel/xp_pixel.png"
            alt="XP 2.450"
            glow="blue"
          />

          {/* NIVEL — PNG COMPLETO */}

          <HudPixelCard
            src="/iconospixel/nivelpixel.png"
            alt="Nivel 12"
            glow="gold"
          />

          {/* RACHA — PNG COMPLETO */}

          <StreakCard />

          {/* DIAMANTES — PNG COMPLETO */}

          <HudPixelCard
            src="/iconospixel/diamantepixel.png"
            alt="Diamantes 350"
            glow="cyan"
          />
        </motion.div>

        {/* ====================================================================
            PIXEL FLOOR
            ==================================================================== */}

        <div className="pointer-events-none relative mt-7 hidden h-36 lg:block">
          {/* BOLSO */}

          <div className="absolute bottom-0 left-[11%]">
            <PixelChest />
          </div>

          {/* ORB */}

          <div className="absolute bottom-0 left-[62%]">
            <PixelOrb />
          </div>

          {/* LIBROS */}

          <div className="absolute bottom-0 right-[3%]">
            <PixelBooks />
          </div>

          {/* CURSOR */}

          <div className="absolute bottom-8 left-[56%] h-7 w-7 rotate-45 border-l-2 border-t-2 border-white/70" />
        </div>

        {/* ====================================================================
            FOOTER LINE
            ==================================================================== */}

        <motion.div
          {...reveal}
          transition={{
            duration: 0.6,
            delay: 0.4,
          }}
          className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-blue-100/25">
            PEAKSCORE / PREPARACIÓN / PROGRESO
          </span>

          <a
            href="#progress"
            className="group flex items-center gap-2 text-[10px] font-black text-blue-200/50 transition-colors hover:text-white"
          >
            Ver progreso

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </motion.div>
      </div>

      {/* ======================================================================
          MOBILE HUD
          ====================================================================== */}

      <div className="relative mx-auto mt-8 grid max-w-lg gap-3 px-5 lg:hidden">
        {/* XP — PNG COMPLETO */}

        <HudPixelCard
          src="/iconospixel/xp_pixel.png"
          alt="XP 2.450"
          glow="blue"
        />

        <div className="grid grid-cols-2 gap-3">
          {/* NIVEL — PNG COMPLETO */}

          <HudPixelCard
            src="/iconospixel/nivelpixel.png"
            alt="Nivel 12"
            glow="gold"
          />

          {/* RACHA — PNG COMPLETO */}

          <StreakCard compact />
        </div>
      </div>
    </section>
  );
}