"use client";

import { ArrowUpRight, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

/* ============================================================
   ANIMACIONES
============================================================ */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

/* ============================================================
   DATOS
============================================================ */

const subjects = [
  {
    name: "Matemáticas",
    value: 91,
    color: "bg-blue-400",
    glow: "shadow-[0_0_14px_rgba(59,130,246,0.55)]",
  },
  {
    name: "Lectura Crítica",
    value: 76,
    color: "bg-violet-400",
    glow: "shadow-[0_0_14px_rgba(139,92,246,0.55)]",
  },
  {
    name: "Ciencias Naturales",
    value: 68,
    color: "bg-cyan-300",
    glow: "shadow-[0_0_14px_rgba(34,211,238,0.55)]",
  },
  {
    name: "Sociales",
    value: 82,
    color: "bg-pink-400",
    glow: "shadow-[0_0_14px_rgba(244,114,182,0.5)]",
  },
];

/* ============================================================
   ESTRELLAS PIXELADAS
============================================================ */

const stars = [
  { left: "3%", top: "10%", size: 2, delay: 0 },
  { left: "8%", top: "31%", size: 3, delay: 1.2 },
  { left: "13%", top: "17%", size: 2, delay: 0.5 },
  { left: "18%", top: "43%", size: 2, delay: 1.8 },
  { left: "23%", top: "7%", size: 3, delay: 0.8 },
  { left: "28%", top: "25%", size: 2, delay: 2.2 },
  { left: "33%", top: "12%", size: 2, delay: 1.1 },
  { left: "38%", top: "38%", size: 3, delay: 0.3 },
  { left: "43%", top: "8%", size: 2, delay: 1.6 },
  { left: "48%", top: "46%", size: 2, delay: 0.7 },
  { left: "53%", top: "15%", size: 3, delay: 2 },
  { left: "58%", top: "32%", size: 2, delay: 1.4 },
  { left: "63%", top: "6%", size: 2, delay: 0.4 },
  { left: "68%", top: "43%", size: 3, delay: 1.9 },
  { left: "73%", top: "18%", size: 2, delay: 0.9 },
  { left: "78%", top: "8%", size: 2, delay: 2.4 },
  { left: "83%", top: "34%", size: 3, delay: 1.3 },
  { left: "88%", top: "13%", size: 2, delay: 0.6 },
  { left: "93%", top: "40%", size: 2, delay: 1.7 },

  { left: "5%", top: "67%", size: 2, delay: 2.1 },
  { left: "15%", top: "83%", size: 3, delay: 0.2 },
  { left: "29%", top: "71%", size: 2, delay: 1.5 },
  { left: "44%", top: "89%", size: 2, delay: 0.9 },
  { left: "59%", top: "77%", size: 3, delay: 1.2 },
  { left: "75%", top: "88%", size: 2, delay: 2.3 },
  { left: "90%", top: "70%", size: 2, delay: 0.5 },
];

/* ============================================================
   NUBE PIXEL ART ROSA
============================================================ */

function PinkPixelCloud({
  className = "",
  scale = 1,
  opacity = 0.7,
}: {
  className?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <div
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
            id="pinkCloudFill"
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
            id="pinkCloudHighlight"
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
            id="pinkCloudGlow"
            x="-30%"
            y="-40%"
            width="160%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Glow */}
        <path
          d="M22 69H8V56H20V43H33V30H48V20H64V27H77V15H95V8H112V15H126V28H142V36H159V48H174V61H183V75H169V84H145V91H121V98H83V93H58V87H34V82H22V69Z"
          fill="#ec4899"
          opacity="0.28"
          filter="url(#pinkCloudGlow)"
        />

        {/* Sombra */}
        <path
          d="M22 69H8V56H20V43H33V30H48V20H64V27H77V15H95V8H112V15H126V28H142V36H159V48H174V61H183V75H169V84H145V91H121V98H83V93H58V87H34V82H22V69Z"
          fill="#7c3aed"
          opacity="0.5"
        />

        {/* Nube principal */}
        <path
          d="M22 64H14V52H27V39H39V28H54V21H68V30H80V20H96V12H111V19H125V31H140V39H157V51H172V64H181V73H166V82H143V89H119V94H84V89H59V84H37V78H22V64Z"
          fill="url(#pinkCloudFill)"
        />

        {/* Luz superior */}
        <path
          d="M42 39H53V29H66V36H78V30H91V21H105V25H116V34H127V43H108V39H93V43H77V48H58V53H43V47H35V43H42V39Z"
          fill="url(#pinkCloudHighlight)"
          opacity="0.82"
        />

        {/* Sombra inferior pixelada */}
        <path
          d="M20 64H36V70H57V76H82V82H115V87H83V83H57V78H34V73H20V64Z"
          fill="#9d174d"
          opacity="0.38"
        />

        {/* Pixeles de luz */}
        <rect
          x="48"
          y="31"
          width="7"
          height="7"
          fill="#fff1f8"
          opacity="0.9"
        />

        <rect
          x="121"
          y="39"
          width="6"
          height="6"
          fill="#fdf2f8"
          opacity="0.72"
        />

        <rect
          x="143"
          y="53"
          width="5"
          height="5"
          fill="#f5d0fe"
          opacity="0.65"
        />
      </svg>
    </div>
  );
}

/* ============================================================
   ICONOS PIXELADOS
============================================================ */

function PixelBolt() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 2L5 13H11L10 22L19 11H13V2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PixelPath() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 18V14H8V11H12V8H16V5H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      <rect
        x="3"
        y="17"
        width="3"
        height="3"
        fill="currentColor"
      />

      <rect
        x="18"
        y="3"
        width="3"
        height="3"
        fill="currentColor"
      />
    </svg>
  );
}

function PixelAnalytics() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 19V5M4 19H20"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <rect
        x="7"
        y="13"
        width="3"
        height="5"
        fill="currentColor"
      />

      <rect
        x="11"
        y="10"
        width="3"
        height="8"
        fill="currentColor"
      />

      <rect
        x="15"
        y="7"
        width="3"
        height="11"
        fill="currentColor"
      />
    </svg>
  );
}

/* ============================================================
   SCORE CIRCULAR
============================================================ */

function ScoreRing() {
  return (
    <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <defs>
          <linearGradient
            id="scoreGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        <circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />

        <motion.circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="square"
          strokeDasharray="245"
          initial={{
            strokeDashoffset: 245,
          }}
          whileInView={{
            strokeDashoffset: 245 - 245 * 0.84,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
          }}
        />
      </svg>

      <div className="relative text-center">
        <div className="text-[25px] font-black leading-none text-white">
          84
        </div>

        <div className="mt-1 text-[6px] font-bold uppercase tracking-[0.18em] text-white/30">
          Puntaje
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   GRÁFICA PEAKSCORE
============================================================ */

function PeakTrendChart() {
  return (
    <div className="relative h-[112px] overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#091936]">
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 right-0 top-[25%] border-t border-white/[0.035]" />
        <div className="absolute left-0 right-0 top-[50%] border-t border-white/[0.035]" />
        <div className="absolute left-0 right-0 top-[75%] border-t border-white/[0.035]" />

        <div className="absolute bottom-0 left-[20%] top-0 border-l border-white/[0.025]" />
        <div className="absolute bottom-0 left-[40%] top-0 border-l border-white/[0.025]" />
        <div className="absolute bottom-0 left-[60%] top-0 border-l border-white/[0.025]" />
        <div className="absolute bottom-0 left-[80%] top-0 border-l border-white/[0.025]" />
      </div>

      {/* Header */}
      <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
        <div>
          <p className="text-[6px] font-bold uppercase tracking-[0.2em] text-white/30">
            Evolución
          </p>

          <p className="mt-0.5 text-[9px] font-bold text-white/80">
            Últimos simulacros
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-1">
          <span className="h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_7px_rgba(34,211,238,0.9)]" />

          <span className="text-[6px] font-bold text-cyan-300">
            +8.4%
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 320 130"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-[76%] w-full"
      >
        <defs>
          <linearGradient
            id="peakArea"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              stopColor="#22d3ee"
              stopOpacity="0.18"
            />

            <stop
              offset="1"
              stopColor="#22d3ee"
              stopOpacity="0"
            />
          </linearGradient>

          <filter id="chartGlow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Área */}
        <motion.path
          d="M0 101 L32 94 L64 98 L96 81 L128 85 L160 69 L192 73 L224 55 L256 61 L288 40 L320 23 L320 130 L0 130 Z"
          fill="url(#peakArea)"
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.8,
          }}
        />

        {/* Glow */}
        <path
          d="M0 101 L32 94 L64 98 L96 81 L128 85 L160 69 L192 73 L224 55 L256 61 L288 40 L320 23"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="7"
          opacity="0.18"
          filter="url(#chartGlow)"
        />

        {/* Línea */}
        <motion.path
          d="M0 101 L32 94 L64 98 L96 81 L128 85 L160 69 L192 73 L224 55 L256 61 L288 40 L320 23"
          fill="none"
          stroke="#38dff4"
          strokeWidth="2.5"
          strokeLinecap="square"
          initial={{
            pathLength: 0,
          }}
          whileInView={{
            pathLength: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 1.3,
            ease: "easeOut",
          }}
        />

        {/* Puntos */}
        {[
          [32, 94],
          [64, 98],
          [96, 81],
          [128, 85],
          [160, 69],
          [192, 73],
          [224, 55],
          [256, 61],
          [288, 40],
        ].map(([cx, cy], index) => (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r="2.2"
            fill="#0b1938"
            stroke="#67e8f9"
            strokeWidth="1.3"
          />
        ))}

        {/* Punto actual */}
        <circle
          cx="320"
          cy="23"
          r="5"
          fill="#22d3ee"
          opacity="0.15"
        />

        <circle
          cx="320"
          cy="23"
          r="3"
          fill="#a5f3fc"
        />
      </svg>

      {/* Labels */}
      <div className="absolute bottom-2 left-3 right-3 flex justify-between">
        <span className="text-[5px] font-semibold text-white/20">
          SIM 01
        </span>

        <span className="text-[5px] font-semibold text-white/20">
          SIM 03
        </span>

        <span className="text-[5px] font-semibold text-white/20">
          SIM 06
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#020617] py-24 sm:py-32"
    >
      {/* ======================================================
          FONDO
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(59,130,246,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.55) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Nebulosa superior */}
        <div className="absolute left-1/2 top-[-320px] h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-blue-600/[0.09] blur-[160px]" />

        {/* Glow izquierdo */}
        <div className="absolute left-[-280px] top-[32%] h-[520px] w-[520px] rounded-full bg-cyan-500/[0.055] blur-[140px]" />

        {/* Glow derecho */}
        <div className="absolute right-[-250px] top-[43%] h-[620px] w-[620px] rounded-full bg-violet-600/[0.06] blur-[150px]" />

        {/* Glow inferior */}
        <div className="absolute bottom-[-280px] left-1/2 h-[550px] w-[1000px] -translate-x-1/2 rounded-full bg-blue-700/[0.07] blur-[150px]" />

        {/* ====================================================
            ESTRELLAS
        ==================================================== */}

        {stars.map((star, index) => (
          <motion.span
            key={index}
            className="absolute rounded-[1px] bg-cyan-300"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              boxShadow:
                star.size >= 3
                  ? "0 0 9px rgba(34,211,238,0.85)"
                  : "0 0 5px rgba(59,130,246,0.65)",
            }}
            initial={{
              opacity: 0.2,
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.18, 0.85, 0.18],
                    scale: [1, 1.35, 1],
                  }
            }
            transition={{
              duration: 3,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* ====================================================
            NUBES ROSADAS
        ==================================================== */}

        <PinkPixelCloud
          className="left-[-55px] top-[145px]"
          scale={0.82}
          opacity={0.52}
        />

        <PinkPixelCloud
          className="left-[-75px] top-[520px]"
          scale={0.62}
          opacity={0.38}
        />

        <PinkPixelCloud
          className="right-[-50px] top-[190px]"
          scale={0.9}
          opacity={0.5}
        />

        <PinkPixelCloud
          className="right-[-70px] top-[555px]"
          scale={0.7}
          opacity={0.4}
        />

        <PinkPixelCloud
          className="left-[41%] top-[455px]"
          scale={0.42}
          opacity={0.18}
        />

        {/* ====================================================
            CRUCES PIXEL
        ==================================================== */}

        <div className="absolute left-[11%] top-[57%] h-4 w-4 opacity-40">
          <span className="absolute left-[6px] top-0 h-4 w-[2px] bg-blue-400" />
          <span className="absolute left-0 top-[6px] h-[2px] w-4 bg-blue-400" />
        </div>

        <div className="absolute right-[12%] top-[61%] h-4 w-4 opacity-35">
          <span className="absolute left-[6px] top-0 h-4 w-[2px] bg-violet-400" />
          <span className="absolute left-0 top-[6px] h-[2px] w-4 bg-violet-400" />
        </div>
      </div>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{
            once: true,
            margin: "-100px",
          }}
          variants={fadeUp}
          transition={{
            duration: 0.7,
          }}
          className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end"
        >
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-9 bg-cyan-400" />

              <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-400">
                Todo en un solo lugar
              </span>
            </div>

            <h2 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-[70px]">
              Todo lo que necesitas
              <br />
              para{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                prepararte.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-base leading-7 text-slate-400 lg:justify-self-end">
            Entrena con simulacros reales, sigue tu progreso y mejora cada día
            con un plan hecho para ti. PeakScore te guía en todo el camino.
          </p>
        </motion.div>

        {/* ====================================================
            TRES FEATURES
        ==================================================== */}

        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{
            once: true,
            margin: "-80px",
          }}
          variants={staggerContainer}
          className="mt-16 grid items-stretch gap-5 lg:grid-cols-3"
        >
          {/* ==================================================
              01 — SIMULACROS
          ================================================== */}

          <motion.article
            variants={fadeUp}
            transition={{
              duration: 0.7,
            }}
            className="group relative flex min-h-[560px] flex-col overflow-hidden rounded-[26px] border border-blue-900/70 bg-[#050a2c] shadow-[0_30px_90px_-40px_rgba(37,99,235,0.35)] transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-[0_40px_100px_-40px_rgba(37,99,235,0.5)] lg:h-[560px]"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="pointer-events-none absolute right-5 top-5 h-16 w-16 border-r border-t border-blue-400/10" />

            <div className="relative z-10 p-7 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center text-[9px] font-black text-white">
                    <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                      <path d="M12 2H28L38 12V28L28 38H12L2 28V12L12 2Z" fill="rgba(37,99,235,0.14)" stroke="rgba(96,165,250,0.65)" strokeWidth="1.2" />
                      <path d="M13 6H27L34 13V27L27 34H13L6 27V13L13 6Z" fill="rgba(37,99,235,0.10)" stroke="rgba(34,211,238,0.28)" strokeWidth="0.8" />
                      <path d="M9 12H13M27 28H31M28 9L31 12M9 28L12 31" stroke="rgba(103,232,249,0.65)" strokeWidth="1.2" strokeLinecap="square" />
                      <circle cx="20" cy="20" r="8.5" fill="rgba(2,10,44,0.72)" stroke="rgba(96,165,250,0.28)" />
                    </svg>
                    <span className="relative z-10 tracking-[-0.03em]">01</span>
                  </span>

                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white">
                      Simulacros
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-blue-400" />

                      <span className="text-[8px] font-medium uppercase tracking-[0.16em] text-blue-300/50">
                        Entrenamiento
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:border-cyan-300 group-hover:bg-blue-600 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                </div>
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
                Vive la experiencia ICFES con simulacros estructurados por
                áreas y con cronómetro.
              </p>
            </div>

            <div className="relative mt-auto overflow-hidden px-2">
              <motion.img
                src="/peaky/homepage/features1.png"
                alt="Simulacros PeakScore"
                className="h-[250px] w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -5,
                      }
                }
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050a2c] to-transparent" />
            </div>

            <div className="relative z-10 px-5 pb-5 pt-2">
              <div className="flex items-center gap-3 rounded-full border border-blue-500/50 bg-blue-600/15 px-5 py-3 text-xs font-medium text-blue-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-blue-400/20 bg-blue-400/10 text-cyan-300">
                  <PixelBolt />
                </span>

                <span>
                  Practica como si ya estuvieras en el examen.
                </span>
              </div>
            </div>
          </motion.article>

          {/* ==================================================
              02 — TU PROGRESO
          ================================================== */}

          <motion.article
            variants={fadeUp}
            transition={{
              duration: 0.7,
            }}
            className="group relative flex min-h-[560px] flex-col overflow-hidden rounded-[26px] border border-violet-900/70 bg-[#08052f] shadow-[0_30px_90px_-40px_rgba(139,92,246,0.35)] transition-all duration-500 hover:-translate-y-2 hover:border-violet-500/50 hover:shadow-[0_40px_100px_-40px_rgba(139,92,246,0.5)] lg:h-[560px]"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-[80px] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="pointer-events-none absolute bottom-10 left-[-100px] h-40 w-40 rounded-full bg-purple-500/10 blur-[60px]" />

            <div className="pointer-events-none absolute right-5 top-5 h-16 w-16 border-r border-t border-violet-400/10" />

            <div className="relative z-10 p-7 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center text-[9px] font-black text-white">
                    <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                      <path d="M12 2H28L38 12V28L28 38H12L2 28V12L12 2Z" fill="rgba(139,92,246,0.14)" stroke="rgba(167,139,250,0.68)" strokeWidth="1.2" />
                      <path d="M13 6H27L34 13V27L27 34H13L6 27V13L13 6Z" fill="rgba(139,92,246,0.10)" stroke="rgba(192,132,252,0.30)" strokeWidth="0.8" />
                      <path d="M9 12H13M27 28H31M28 9L31 12M9 28L12 31" stroke="rgba(196,181,253,0.68)" strokeWidth="1.2" strokeLinecap="square" />
                      <circle cx="20" cy="20" r="8.5" fill="rgba(8,5,47,0.76)" stroke="rgba(167,139,250,0.30)" />
                    </svg>
                    <span className="relative z-10 tracking-[-0.03em]">02</span>
                  </span>

                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white">
                      Tu progreso
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-violet-400" />

                      <span className="text-[8px] font-medium uppercase tracking-[0.16em] text-violet-300/50">
                        Evolución
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:border-violet-300 group-hover:bg-violet-600 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.35)]">
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                </div>
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
                Sigue tu plan personalizado, cumple metas y avanza cada día.
              </p>
            </div>

            <div className="relative mt-auto overflow-hidden px-2">
              <motion.img
                src="/peaky/homepage/features2.png"
                alt="Progreso PeakScore"
                className="h-[250px] w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -5,
                      }
                }
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08052f] to-transparent" />
            </div>

            <div className="relative z-10 px-5 pb-5 pt-2">
              <div className="flex items-center gap-3 rounded-full border border-violet-500/50 bg-violet-600/15 px-5 py-3 text-xs font-medium text-violet-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-violet-400/20 bg-violet-400/10 text-violet-300">
                  <PixelPath />
                </span>

                <span>
                  Un plan hecho para ti. Un camino para avanzar.
                </span>
              </div>
            </div>
          </motion.article>

          {/* ==================================================
              03 — ANÁLISIS INTELIGENTE
          ================================================== */}

          <motion.article
            variants={fadeUp}
            transition={{
              duration: 0.7,
            }}
            className="group relative flex min-h-[560px] flex-col overflow-hidden rounded-[26px] border border-cyan-900/70 bg-[#06152d] shadow-[0_30px_90px_-40px_rgba(6,182,212,0.3)] transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-[0_40px_100px_-40px_rgba(6,182,212,0.45)] lg:h-[560px]"
          >
            {/* Glow superior */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-[80px] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Glow inferior */}
            <div className="pointer-events-none absolute bottom-[-100px] left-[-100px] h-56 w-56 rounded-full bg-blue-600/15 blur-[80px]" />

            {/* Decoración */}
            <div className="pointer-events-none absolute right-5 top-5 h-16 w-16 border-r border-t border-cyan-400/10" />

            {/* HEADER */}
            <div className="relative z-10 p-7 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center text-[9px] font-black text-white">
                    <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                      <path d="M12 2H28L38 12V28L28 38H12L2 28V12L12 2Z" fill="rgba(6,182,212,0.14)" stroke="rgba(103,232,249,0.68)" strokeWidth="1.2" />
                      <path d="M13 6H27L34 13V27L27 34H13L6 27V13L13 6Z" fill="rgba(6,182,212,0.10)" stroke="rgba(34,211,238,0.30)" strokeWidth="0.8" />
                      <path d="M9 12H13M27 28H31M28 9L31 12M9 28L12 31" stroke="rgba(165,243,252,0.70)" strokeWidth="1.2" strokeLinecap="square" />
                      <circle cx="20" cy="20" r="8.5" fill="rgba(6,21,45,0.78)" stroke="rgba(103,232,249,0.30)" />
                    </svg>
                    <span className="relative z-10 tracking-[-0.03em]">03</span>
                  </span>

                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white">
                      Análisis inteligente
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-cyan-400" />

                      <span className="text-[8px] font-medium uppercase tracking-[0.16em] text-cyan-300/50">
                        Rendimiento
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:border-cyan-300 group-hover:bg-cyan-500/80 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                </div>
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
                Descubre tus fortalezas y detecta qué áreas necesitan más
                atención.
              </p>
            </div>

            {/* ==================================================
                PANEL ANALÍTICO
            ================================================== */}

            <div className="relative z-10 mx-5 mt-2 flex flex-1 flex-col overflow-hidden rounded-[20px] border border-cyan-400/20 bg-[#07142f]/95 p-3 shadow-[inset_0_0_55px_rgba(6,182,212,0.04)]">
              {/* HEADER DEL PANEL */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/10 text-cyan-300">
                    <PixelAnalytics />
                  </div>

                  <div>
                    <p className="text-[6px] font-bold uppercase tracking-[0.2em] text-white/30">
                      PeakScore AI
                    </p>

                    <p className="text-[10px] font-black text-white/85">
                      Lectura de rendimiento
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                  <span className="text-[6px] font-black uppercase tracking-wider text-emerald-300">
                    Mejorando
                  </span>
                </div>
              </div>

              {/* SCORE */}
              <div className="grid grid-cols-[92px_1fr] gap-3 rounded-[17px] border border-white/[0.07] bg-[#0a1937] p-3">
                <ScoreRing />

                <div className="flex min-w-0 flex-col justify-center">
                  <p className="text-[6px] font-bold uppercase tracking-[0.2em] text-white/25">
                    Nivel actual
                  </p>

                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[17px] font-black text-white">
                      Alto
                    </span>

                    <span className="text-[7px] font-bold text-cyan-300">
                      +8.4%
                    </span>
                  </div>

                  <p className="mt-1 text-[7px] leading-3 text-white/35">
                    Tu desempeño supera el promedio de tus últimos
                    simulacros.
                  </p>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      whileInView={{
                        width: "84%",
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                    />
                  </div>
                </div>
              </div>

              {/* GRÁFICA */}
              <div className="mt-2.5">
                <PeakTrendChart />
              </div>

              {/* FORTALEZA + PRIORIDAD */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="relative overflow-hidden rounded-[13px] border border-blue-400/10 bg-[#0a1937] p-2.5">
                  <div className="absolute right-[-10px] top-[-10px] h-10 w-10 rounded-full bg-blue-500/10 blur-xl" />

                  <div className="relative">
                    <p className="text-[6px] font-bold uppercase tracking-[0.16em] text-white/25">
                      Fortaleza
                    </p>

                    <p className="mt-1 text-[9px] font-black text-white">
                      Matemáticas
                    </p>

                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[11px] font-black text-blue-300">
                        91%
                      </span>

                      <span className="text-[6px] font-bold text-emerald-300">
                        +6%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[13px] border border-pink-400/10 bg-[#0a1937] p-2.5">
                  <div className="absolute right-[-10px] top-[-10px] h-10 w-10 rounded-full bg-pink-500/10 blur-xl" />

                  <div className="relative">
                    <p className="text-[6px] font-bold uppercase tracking-[0.16em] text-white/25">
                      Prioridad
                    </p>

                    <p className="mt-1 text-[9px] font-black text-white">
                      Ciencias
                    </p>

                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[11px] font-black text-pink-300">
                        68%
                      </span>

                      <span className="text-[6px] font-bold text-amber-300">
                        Atención
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INSIGHT */}
              <div className="mt-2.5 flex flex-1 items-center gap-2.5 rounded-[14px] border border-violet-400/10 bg-gradient-to-r from-violet-500/[0.07] to-cyan-400/[0.04] p-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10">
                  <div className="absolute inset-1 rounded-md border border-violet-300/10" />

                  <span className="text-[11px] font-black text-violet-300">
                    ✦
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[7px] font-black uppercase tracking-[0.16em] text-violet-300">
                    Insight recomendado
                  </p>

                  <p className="mt-1 text-[7px] leading-3 text-white/45">
                    Refuerza Ciencias Naturales para equilibrar tu perfil y
                    aumentar tu puntaje global.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="relative z-10 px-5 pb-5 pt-3">
              <div className="flex items-center gap-3 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-5 py-3 text-xs font-medium text-cyan-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-400/15 bg-cyan-400/10 text-cyan-300">
                  <PixelAnalytics />
                </span>

                <span>
                  Entiende tu rendimiento, mejora tus resultados.
                </span>
              </div>
            </div>
          </motion.article>
        </motion.div>

        {/* ====================================================
            MAPA DE PREPARACIÓN
        ==================================================== */}

        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{
            once: true,
            margin: "-100px",
          }}
          variants={fadeUp}
          transition={{
            duration: 0.8,
            delay: 0.15,
          }}
          className="group relative mt-5 overflow-hidden rounded-[28px] border border-blue-900/60 bg-[#020b2c] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.65)]"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-120px] h-[350px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[110px]" />

            <div className="absolute bottom-[-100px] left-[30%] h-[250px] w-[400px] rounded-full bg-cyan-500/[0.06] blur-[90px]" />

            <div className="absolute left-[8%] top-[25%] h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />

            <div className="absolute left-[27%] top-[15%] h-1 w-1 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />

            <div className="absolute left-[51%] top-[20%] h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />

            <div className="absolute right-[23%] top-[28%] h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.9)]" />

            <div className="absolute right-[8%] top-[18%] h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />

            {/* Nubes rosadas */}
            <PinkPixelCloud
              className="left-[-42px] top-[20px]"
              scale={0.55}
              opacity={0.25}
            />

            <PinkPixelCloud
              className="right-[-48px] bottom-[5px]"
              scale={0.6}
              opacity={0.22}
            />
          </div>

          <motion.img
            src="/peaky/homepage/featuresmapa.png"
            alt="Mapa de preparación PeakScore"
            className="relative z-10 block h-auto w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.008]"
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -3,
                  }
            }
          />
        </motion.div>

        {/* ====================================================
            CIERRE
        ==================================================== */}

        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{
            once: true,
          }}
          variants={fadeUp}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
          className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-bold text-white">
              Menos improvisación. Más preparación.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Todo lo que haces en PeakScore tiene un propósito.
            </p>
          </div>

          <a
            href="#how-it-works"
            className="group/link inline-flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-cyan-400"
          >
            Conoce cómo funciona

            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}