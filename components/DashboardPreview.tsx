"use client";

import type { ReactNode } from "react";

import {
  ArrowUpRight,
  ChevronDown,
  Crosshair,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

/* =========================================================
   DATOS DEL DASHBOARD
========================================================= */

type SubjectMarkType =
  | "reading"
  | "math"
  | "social"
  | "science"
  | "english";

const subjects: Array<{
  name: string;
  short: string;
  score: number;
  color: string;
  mark: SubjectMarkType;
}> = [
  {
    name: "Lectura Crítica",
    short: "LC",
    score: 76,
    color: "cyan",
    mark: "reading",
  },
  {
    name: "Matemáticas",
    short: "MAT",
    score: 80,
    color: "purple",
    mark: "math",
  },
  {
    name: "Sociales y Ciudadanas",
    short: "SC",
    score: 80,
    color: "blue",
    mark: "social",
  },
  {
    name: "Ciencias Naturales",
    short: "CN",
    score: 79,
    color: "pink",
    mark: "science",
  },
  {
    name: "Inglés",
    short: "ING",
    score: 100,
    color: "cyan",
    mark: "english",
  },
];

/* =========================================================
   ICONOS PROPIOS DE ÁREA
========================================================= */

function SubjectMark({
  type,
}: {
  type: SubjectMarkType;
}) {
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
    >
      {type === "reading" && (
        <g {...strokeProps}>
          <path d="M7 7.5h8.2c2 0 3.8.9 4.8 2.3v14.7c-1-1.2-2.5-1.9-4.5-1.9H7z" />
          <path d="M25 7.5h-6.2c-2 0-3.8.9-4.8 2.3v14.7c1-1.2 2.5-1.9 4.5-1.9H25z" />
          <path d="M14 9.8v12.9" />
          <path d="M9.5 11.5h3M9.5 15h3M19 11.5h3M19 15h3" />
        </g>
      )}

      {type === "math" && (
        <g {...strokeProps}>
          <rect
            x="6.5"
            y="6.5"
            width="19"
            height="19"
            rx="3.5"
          />
          <path d="M10 11h12" />
          <path d="M10.5 17h5M13 14.5v5" />
          <path d="M19.5 15.5h3M21 14v3" />
          <path d="M19.5 21h3" />
        </g>
      )}

      {type === "social" && (
        <g {...strokeProps}>
          <path d="M8 12.5 16 7l8 5.5" />
          <path d="M10 12.5v11h12v-11" />
          <path d="M13 23.5v-6h6v6" />
          <path d="M7 25h18" />
          <path d="M11.5 13.5v2M16 13.5v2M20.5 13.5v2" />
        </g>
      )}

      {type === "science" && (
        <g {...strokeProps}>
          <path d="M12 6v7.2l-5.1 9.1a2.7 2.7 0 0 0 2.4 4h13.4a2.7 2.7 0 0 0 2.4-4L20 13.2V6" />
          <path d="M10.2 17h11.6" />
          <path d="M12.3 20.5h2.2M18 22.5h2.2" />
          <circle
            cx="16"
            cy="19.2"
            r="1.1"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="21"
            cy="18"
            r="0.9"
            fill="currentColor"
            stroke="none"
          />
        </g>
      )}

      {type === "english" && (
        <g {...strokeProps}>
          <path d="M7 8.5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-7l-5 4v-4H9c-1.1 0-2-.9-2-2z" />
          <path d="M11 12h8M11 16h5" />
          <path d="M22.5 8.5v-2M25 10l1.5-1.5M9.5 10 8 8.5" />
        </g>
      )}
    </svg>
  );
}

/* =========================================================
   PARTICULAS PIXEL
========================================================= */

function PixelParticles() {
  const particles = [
    { x: "4%", y: "9%", delay: 0, size: 3 },
    { x: "11%", y: "19%", delay: 0.8, size: 2 },
    { x: "18%", y: "7%", delay: 1.4, size: 2 },
    { x: "27%", y: "13%", delay: 0.4, size: 3 },
    { x: "36%", y: "6%", delay: 1.2, size: 2 },
    { x: "46%", y: "16%", delay: 0.6, size: 2 },
    { x: "56%", y: "8%", delay: 1.7, size: 3 },
    { x: "66%", y: "15%", delay: 0.3, size: 2 },
    { x: "76%", y: "6%", delay: 1.1, size: 3 },
    { x: "87%", y: "13%", delay: 0.5, size: 2 },
    { x: "95%", y: "8%", delay: 1.8, size: 2 },

    { x: "6%", y: "35%", delay: 1.2, size: 2 },
    { x: "15%", y: "46%", delay: 0.2, size: 3 },
    { x: "25%", y: "32%", delay: 1.5, size: 2 },
    { x: "34%", y: "42%", delay: 0.9, size: 2 },
    { x: "48%", y: "35%", delay: 1.8, size: 3 },
    { x: "61%", y: "43%", delay: 0.7, size: 2 },
    { x: "72%", y: "34%", delay: 1.3, size: 2 },
    { x: "84%", y: "45%", delay: 0.1, size: 3 },
    { x: "94%", y: "37%", delay: 1.6, size: 2 },

    { x: "8%", y: "65%", delay: 0.4, size: 2 },
    { x: "19%", y: "76%", delay: 1.5, size: 3 },
    { x: "31%", y: "63%", delay: 0.8, size: 2 },
    { x: "43%", y: "73%", delay: 1.2, size: 2 },
    { x: "57%", y: "65%", delay: 0.3, size: 3 },
    { x: "69%", y: "76%", delay: 1.7, size: 2 },
    { x: "81%", y: "64%", delay: 0.6, size: 2 },
    { x: "93%", y: "72%", delay: 1.1, size: 3 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute block bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.95)]"
          style={{
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            opacity: [0.25, 1, 0.25],
            scale: [0.8, 1.5, 0.8],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 3,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   CRUCES PIXELADAS
========================================================= */

function PixelCrosses() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute left-[5%] top-[16%]"
        animate={{
          opacity: [0.35, 1, 0.35],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        <span className="absolute left-2 top-0 h-6 w-1 bg-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.9)]" />
        <span className="absolute left-0 top-2 h-1 w-6 bg-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.9)]" />
      </motion.div>

      <motion.div
        className="absolute right-[7%] top-[27%]"
        animate={{
          opacity: [0.25, 1, 0.25],
          rotate: [0, 90, 180],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      >
        <span className="absolute left-2 top-0 h-5 w-1 bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
        <span className="absolute left-0 top-2 h-1 w-5 bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
      </motion.div>

      <motion.div
        className="absolute bottom-[16%] left-[8%]"
        animate={{
          opacity: [0.3, 0.9, 0.3],
          scale: [1, 0.75, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        <span className="absolute left-1.5 top-0 h-4 w-1 bg-blue-400" />
        <span className="absolute left-0 top-1.5 h-1 w-4 bg-blue-400" />
      </motion.div>
    </div>
  );
}

/* =========================================================
   NUBE PIXEL ART
========================================================= */

function PixelCloud({
  className = "",
  scale = "normal",
}: {
  className?: string;
  scale?: "small" | "normal" | "large";
}) {
  const dimensions =
    scale === "large"
      ? "h-28 w-56"
      : scale === "small"
        ? "h-12 w-28"
        : "h-20 w-40";

  return (
    <motion.div
      className={`pointer-events-none absolute ${dimensions} ${className}`}
      animate={{
        x: [0, 10, 0],
        y: [0, -4, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="absolute inset-0 bg-fuchsia-500/15 blur-2xl" />

      <div
        className="absolute inset-0 bg-gradient-to-b from-pink-300 via-fuchsia-500 to-purple-900 shadow-[0_0_25px_rgba(217,70,239,0.25)]"
        style={{
          clipPath:
            "polygon(0 62%, 7% 62%, 7% 44%, 15% 44%, 15% 29%, 25% 29%, 25% 17%, 37% 17%, 37% 29%, 48% 29%, 48% 8%, 61% 8%, 61% 18%, 72% 18%, 72% 32%, 83% 32%, 83% 22%, 93% 22%, 93% 44%, 100% 44%, 100% 100%, 0 100%)",
        }}
      />

      <div
        className="absolute inset-0 bg-pink-100/60"
        style={{
          clipPath:
            "polygon(12% 48%, 20% 48%, 20% 31%, 30% 31%, 30% 21%, 38% 21%, 38% 38%, 49% 38%, 49% 19%, 57% 19%, 57% 31%, 68% 31%, 68% 45%, 78% 45%, 78% 37%, 88% 37%, 88% 53%, 100% 53%, 100% 64%, 12% 64%)",
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-[35%] bg-purple-950/60"
        style={{
          clipPath:
            "polygon(0 25%, 18% 25%, 18% 0, 36% 0, 36% 30%, 53% 30%, 53% 8%, 72% 8%, 72% 34%, 100% 34%, 100% 100%, 0 100%)",
        }}
      />
    </motion.div>
  );
}

/* =========================================================
   TARJETA BASE
========================================================= */

function DashboardCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[20px]",
        "border border-[#263d7a]",
        "bg-[linear-gradient(145deg,#071633_0%,#030a20_100%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_45px_rgba(0,0,0,0.25)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* =========================================================
   GRÁFICA ICFES
   ESCALA OFICIAL: 0 - 500
========================================================= */

function PerformanceChart() {
  /*
    Puntaje global Saber 11:
    - Escala: 0 a 500.
    - El valor actual de esta preview es 402.
    - La serie anterior es ilustrativa y termina en el valor actual.
  */

  const data = [
    { label: "12 jun", score: 344 },
    { label: "15 jun", score: 357 },
    { label: "18 jun", score: 353 },
    { label: "21 jun", score: 369 },
    { label: "25 jun", score: 365 },
    { label: "29 jun", score: 381 },
    { label: "03 jul", score: 376 },
    { label: "07 jul", score: 390 },
    { label: "11 jul", score: 386 },
    { label: "16 jul", score: 397 },
    { label: "19 jul", score: 400 },
    { label: "21 jul", score: 402 },
  ];

  const width = 1100;
  const height = 380;

  const minScore = 0;
  const maxScore = 500;

  const paddingLeft = 58;
  const paddingRight = 28;
  const paddingTop = 34;
  const paddingBottom = 54;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((item, index) => {
    const x =
      paddingLeft +
      (index / (data.length - 1)) * chartWidth;

    const y =
      paddingTop +
      ((maxScore - item.score) /
        (maxScore - minScore)) *
        chartHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[index - 1];
      const controlX =
        previous.x +
        (point.x - previous.x) * 0.5;

      return `
        C
        ${controlX} ${previous.y},
        ${controlX} ${point.y},
        ${point.x} ${point.y}
      `;
    })
    .join(" ");

  const baselineY = height - paddingBottom;

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${baselineY}
    L ${points[0].x} ${baselineY}
    Z
  `;

  const gridValues = [500, 400, 300, 200, 100, 0];

  const targetScore = 470;

  const targetY =
    paddingTop +
    ((maxScore - targetScore) /
      (maxScore - minScore)) *
      chartHeight;

  const current = data[data.length - 1];

  return (
    <div className="relative h-[285px] w-full sm:h-[310px]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="icfes-chart-area"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#22d3ee"
              stopOpacity="0.30"
            />
            <stop
              offset="42%"
              stopColor="#3b82f6"
              stopOpacity="0.14"
            />
            <stop
              offset="100%"
              stopColor="#7c3aed"
              stopOpacity="0"
            />
          </linearGradient>

          <linearGradient
            id="icfes-chart-line"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="#3b82f6"
            />
            <stop
              offset="50%"
              stopColor="#22d3ee"
            />
            <stop
              offset="100%"
              stopColor="#67e8f9"
            />
          </linearGradient>

          <filter
            id="icfes-chart-glow"
            x="-30%"
            y="-40%"
            width="160%"
            height="180%"
          >
            <feGaussianBlur
              stdDeviation="5"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id="icfes-point-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="4"
              result="pointBlur"
            />
            <feMerge>
              <feMergeNode in="pointBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Guías horizontales de la escala 0–500 */}
        {gridValues.map((value) => {
          const y =
            paddingTop +
            ((maxScore - value) /
              (maxScore - minScore)) *
              chartHeight;

          return (
            <g key={value}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke={
                  value === 0
                    ? "#304575"
                    : "#15284f"
                }
                strokeWidth={
                  value === 0 ? "1.5" : "1"
                }
                strokeDasharray={
                  value === 0
                    ? undefined
                    : "3 12"
                }
              />

              <text
                x="4"
                y={y + 3}
                fill="#50618a"
                fontSize="10"
                fontWeight="700"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Guías verticales sutiles */}
        {points.map((point, index) => (
          <line
            key={`vertical-${index}`}
            x1={point.x}
            x2={point.x}
            y1={paddingTop}
            y2={baselineY}
            stroke="#102044"
            strokeWidth="1"
            opacity={
              index === 0 ||
              index === points.length - 1
                ? 0.5
                : 0.25
            }
          />
        ))}

        {/* Zona superior cercana a la meta */}
        <rect
          x={paddingLeft}
          y={paddingTop}
          width={chartWidth}
          height={Math.max(
            0,
            targetY - paddingTop,
          )}
          fill="#a855f7"
          opacity="0.025"
        />

        {/* Línea de meta */}
        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={targetY}
          y2={targetY}
          stroke="#c084fc"
          strokeWidth="1.5"
          strokeDasharray="6 9"
          opacity="0.65"
        />

        {/* Área bajo la evolución */}
        <motion.path
          d={areaPath}
          fill="url(#icfes-chart-area)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        />

        {/* Glow de la línea */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.14"
          filter="url(#icfes-chart-glow)"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 1.7,
            ease: "easeOut",
          }}
        />

        {/* Línea principal */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#icfes-chart-line)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#icfes-chart-glow)"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 1.7,
            ease: "easeOut",
          }}
        />

        {/* Puntos de cada sesión */}
        {points.map((point, index) => (
          <g
            key={`${point.label}-${index}`}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={
                index === points.length - 1
                  ? 12
                  : 8
              }
              fill="#22d3ee"
              opacity={
                index === points.length - 1
                  ? 0.12
                  : 0.07
              }
            />

            <circle
              cx={point.x}
              cy={point.y}
              r={
                index === points.length - 1
                  ? 5
                  : 4
              }
              fill="#06132f"
              stroke="#38d9f5"
              strokeWidth="2.5"
              filter={
                index === points.length - 1
                  ? "url(#icfes-point-glow)"
                  : undefined
              }
            />
          </g>
        ))}

        {/* Pulso del punto actual */}
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="12"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.5"
          initial={{
            opacity: 0.55,
            r: 8,
          }}
          animate={{
            opacity: [0.55, 0, 0.55],
            r: [8, 20, 8],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </svg>

      {/* Meta */}
      <div
        className="absolute right-0 rounded-md border border-fuchsia-400/30 bg-[#090d26]/95 px-2.5 py-1.5 shadow-[0_0_18px_rgba(168,85,247,0.08)]"
        style={{
          top: `${Math.max(
            3,
            (targetY / height) * 100 - 3,
          )}%`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />

          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-fuchsia-300">
            Meta 470
          </span>
        </div>
      </div>

      {/* Valor actual */}
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          duration: 0.5,
          delay: 1.15,
        }}
        className="absolute right-0 top-[38%] min-w-[108px] rounded-xl border border-cyan-400/35 bg-[#071333]/95 px-3.5 py-2.5 shadow-[0_0_28px_rgba(34,211,238,0.12)]"
      >
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,1)]" />

          <span className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-500">
            Actual
          </span>
        </div>

        <p className="mt-1 font-mono text-2xl font-black leading-none text-white">
          {current.score}

          <span className="ml-1 text-[9px] font-bold text-slate-500">
            /500
          </span>
        </p>
      </motion.div>

      {/* Fechas */}
      <div className="absolute bottom-0 left-[58px] right-[28px] flex justify-between text-[8px] font-bold text-slate-600">
        <span>{data[0].label}</span>

        <span className="hidden sm:block">
          {data[Math.floor(data.length / 2)].label}
        </span>

        <span>
          {data[data.length - 1].label}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   CIRCULO DE PREPARACION
========================================================= */

function ProgressRing({
  value,
}: {
  value: number;
}) {
  const radius = 42;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
      >
        <defs>
          <linearGradient
            id="dashboard-ring"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#2563eb"
            />

            <stop
              offset="55%"
              stopColor="#7c3aed"
            />

            <stop
              offset="100%"
              stopColor="#d946ef"
            />
          </linearGradient>
        </defs>

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#14244a"
          strokeWidth="7"
        />

        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#dashboard-ring)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{
            strokeDashoffset: circumference,
          }}
          whileInView={{
            strokeDashoffset: offset,
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

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-black text-white">
          {value}%
        </span>

        <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-500">
          preparado
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   RACHA PIXEL
========================================================= */

function ActivityDots() {
  const days = [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
  ];

  return (
    <div className="flex gap-1">
      {days.map((active, index) => (
        <motion.div
          key={index}
          animate={
            active
              ? {
                  y: [0, -3, 0],
                }
              : undefined
          }
          transition={{
            duration: 1.4,
            delay: index * 0.08,
            repeat: Infinity,
          }}
          className={`flex h-7 w-7 items-center justify-center ${
            active
              ? "text-orange-400 drop-shadow-[0_0_9px_rgba(251,146,60,0.65)]"
              : "text-[#142142]"
          }`}
        >
          <Flame
            className="h-6 w-6"
            fill={
              active
                ? "currentColor"
                : "none"
            }
          />
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   MINI PROGRESO
========================================================= */

function MiniProgress() {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-slate-500">
          Dominio
        </span>

        <span className="font-black text-white">
          91%
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#14244a]">
        <motion.div
          initial={{
            width: 0,
          }}
          whileInView={{
            width: "91%",
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.9,
          }}
          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
        />
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD PREVIEW
========================================================= */

export default function DashboardPreview() {
  const shouldReduceMotion =
    useReducedMotion();

  const reveal = (y = 20) =>
    shouldReduceMotion
      ? false
      : {
          opacity: 0,
          y,
        };

  return (
    <section
      id="progress"
      className="relative overflow-hidden bg-[#020617] py-28 sm:py-36"
    >
      {/* =====================================================
          FONDO ESPACIAL
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Glow azul */}

        <div className="absolute left-1/2 top-[-180px] h-[650px] w-[1000px] -translate-x-1/2 rounded-full bg-blue-700/10 blur-[150px]" />

        {/* Glow morado */}

        <div className="absolute bottom-[-200px] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-700/10 blur-[150px]" />

        {/* Gradientes */}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(37,99,235,0.2),transparent_38%),radial-gradient(circle_at_50%_85%,rgba(126,34,206,0.12),transparent_45%)]" />

        {/* Grid pixel */}

        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(46,74,135,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(46,74,135,.45) 1px, transparent 1px)",
            backgroundSize:
              "54px 54px",
          }}
        />

        <PixelParticles />

        <PixelCrosses />

        {/* Nubes */}

        <PixelCloud
          className="left-[-25px] top-[17%] opacity-90"
          scale="normal"
        />

        <PixelCloud
          className="right-[-25px] top-[9%] opacity-85"
          scale="normal"
        />

        <PixelCloud
          className="bottom-[5%] left-[-35px] opacity-95"
          scale="large"
        />

        <PixelCloud
          className="bottom-[5%] right-[-30px] opacity-90"
          scale="normal"
        />
      </div>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-7 lg:px-8">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <motion.div
          initial={reveal(20)}
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{
            once: true,
            margin: "-100px",
          }}
          transition={{
            duration: 0.65,
          }}
          className="grid gap-8 lg:grid-cols-[1.1fr_0.75fr] lg:items-end"
        >
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[2px] w-9 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />

              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                Tu progreso
              </span>
            </div>

            <h2 className="max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-[62px]">
              Tu preparación,
              <br />

              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                convertida en datos.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-400 lg:justify-self-end">
            Cada simulacro, cada pregunta y cada
            sesión construyen una imagen más clara
            de tu preparación.
          </p>
        </motion.div>

        {/* =====================================================
            DASHBOARD
        ===================================================== */}

        <motion.div
          initial={reveal(35)}
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{
            once: true,
            margin: "-70px",
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mt-14"
        >
          {/* Marco principal */}

          <div className="relative overflow-hidden rounded-[26px] border border-[#304782] bg-[#03091d] shadow-[0_35px_100px_rgba(0,0,0,0.55),0_0_80px_rgba(37,99,235,0.08)]">
            {/* Línea superior */}

            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* =================================================
                BARRA
            ================================================= */}

            <div className="flex h-14 items-center justify-between border-b border-[#243762] px-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.7)]" />

                  <span className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" />

                  <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                </div>

                <div className="hidden h-5 w-px bg-[#263965] sm:block" />

                <span className="text-sm font-black text-white">
                  Peak
                  <span className="text-blue-400">
                    Score
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden text-[10px] font-bold text-blue-400 sm:block">
                  Vista general
                </span>

                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(34,211,238,0)",
                      "0 0 22px rgba(34,211,238,0.25)",
                      "0 0 0 rgba(34,211,238,0)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 bg-[#071333] text-cyan-300"
                >
                  <TrendingUp className="h-5 w-5" />
                </motion.div>
              </div>
            </div>

            {/* =================================================
                CONTENIDO
            ================================================= */}

            <div className="bg-[radial-gradient(circle_at_50%_0%,rgba(23,55,125,0.13),transparent_45%),#03091d] p-4 sm:p-6 lg:p-7">
              {/* =================================================
                  TOP
              ================================================= */}

              <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                {/* =================================================
                    IZQUIERDA
                ================================================= */}

                <div className="space-y-5">
                  {/* Puntaje */}

                  <DashboardCard className="relative overflow-hidden p-6 sm:p-7">
                    <div className="absolute right-[-50px] top-[-50px] h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

                    <div className="relative flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                        Puntaje global
                      </span>

                      <span className="rounded-md border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-[9px] font-black text-emerald-300">
                        ↗ +12
                      </span>
                    </div>

                    <div className="relative mt-6 flex items-end gap-2">
                      <motion.span
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          duration: 0.6,
                        }}
                        className="font-mono text-6xl font-black tracking-[-0.08em] text-white sm:text-7xl"
                      >
                        423
                      </motion.span>

                      <span className="mb-2 text-lg text-slate-500">
                        /500
                      </span>
                    </div>

                    <div className="relative mt-6">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">
                          Progreso hacia tu meta
                        </span>

                        <span className="font-black text-white">
                          85.5%
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#14244a]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          whileInView={{
                            width: "85.5%",
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            duration: 1,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
                        />
                      </div>
                    </div>

                    <div className="relative mt-4 flex justify-between text-[8px] text-slate-600">
                      <span>0</span>
                      <span>250</span>
                      <span>500</span>
                    </div>
                  </DashboardCard>

                  {/* Preparación */}

                  <DashboardCard className="p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                          Preparación
                        </p>

                        <p className="mt-1 text-base font-black text-white">
                          Nivel general
                        </p>
                      </div>

                      <span className="rounded-md border border-emerald-400/30 px-2 py-1 text-[9px] font-black text-emerald-300">
                        Bueno
                      </span>
                    </div>

                    <div className="mt-7 flex items-center gap-5">
                      <ProgressRing value={82} />

                      <div>
                        <p className="text-sm font-black text-white">
                          Vas avanzando.
                        </p>

                        <p className="mt-2 max-w-[180px] text-[10px] leading-5 text-slate-400">
                          Tu dedicación muestra una
                          tendencia positiva en las
                          últimas sesiones.
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-fuchsia-400" />

                          <span className="text-[9px] font-bold text-fuchsia-300">
                            Meta: 470
                          </span>
                        </div>
                      </div>
                    </div>
                  </DashboardCard>
                </div>

                {/* =================================================
                    DERECHA
                ================================================= */}

                <div className="space-y-5">
                  {/* Gráfica */}

                  <DashboardCard className="p-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                          Puntaje global
                        </p>

                        <h3 className="mt-2 text-xl font-black text-white">
                          Rendimiento en el tiempo
                        </h3>

                        <p className="mt-1 text-[9px] text-slate-500">
                          Escala oficial Saber 11 · 0–500
                        </p>
                      </div>

                      <button
                        type="button"
                        className="hidden items-center gap-1 rounded-lg border border-[#304274] bg-[#071332] px-3 py-2 text-[10px] font-bold text-slate-300 sm:flex"
                      >
                        30 días

                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <PerformanceChart />
                    </div>
                  </DashboardCard>

                  {/* Materias */}

                  <DashboardCard className="p-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                          Áreas evaluadas
                        </p>

                        <h3 className="mt-2 text-xl font-black text-white">
                          Rendimiento por prueba
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="text-[10px] font-black text-fuchsia-400"
                      >
                        Ver todo
                      </button>
                    </div>

                    <div className="mt-6 space-y-4">
                      {subjects.map(
                        (subject, index) => {
                          const barColors = [
                            "from-blue-500 to-cyan-400",
                            "from-violet-500 to-fuchsia-400",
                            "from-cyan-400 to-sky-400",
                            "from-fuchsia-500 to-pink-400",
                            "from-blue-500 to-cyan-400",
                          ];

                          return (
                            <div
                              key={subject.name}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={[
                                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                      "border bg-[#071735]/90",
                                      "shadow-[inset_0_0_12px_rgba(34,211,238,0.06)]",
                                      subject.color ===
                                      "purple"
                                        ? "border-violet-400/45 text-violet-300"
                                        : subject.color ===
                                          "blue"
                                          ? "border-sky-400/45 text-sky-300"
                                          : subject.color ===
                                            "pink"
                                            ? "border-fuchsia-400/45 text-fuchsia-300"
                                            : "border-cyan-400/45 text-cyan-300",
                                    ].join(" ")}
                                  >
                                    <SubjectMark
                                      type={
                                        subject.mark
                                      }
                                    />
                                  </span>

                                  <span className="text-[10px] font-semibold text-slate-200 sm:text-xs">
                                    {subject.name}
                                  </span>
                                </div>

                                <span className="font-mono text-[10px] font-black text-white">
                                  {subject.score}/100
                                </span>
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-[#14244a]">
                                <motion.div
                                  initial={{
                                    width: 0,
                                  }}
                                  whileInView={{
                                    width: `${subject.score}%`,
                                  }}
                                  viewport={{
                                    once: true,
                                  }}
                                  transition={{
                                    duration: 0.8,
                                    delay:
                                      index * 0.08,
                                  }}
                                  className={`h-full rounded-full bg-gradient-to-r ${barColors[index]} shadow-[0_0_8px_rgba(34,211,238,0.35)]`}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* =================================================
                  INFERIOR
              ================================================= */}

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {/* Racha */}

                <DashboardCard className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                        Actividad
                      </p>

                      <p className="mt-1 text-base font-black text-white">
                        14 días de racha
                      </p>
                    </div>

                    <span className="rounded-md border border-emerald-400/30 px-2 py-1 text-[8px] font-black text-emerald-300">
                      ACTIVA
                    </span>
                  </div>

                  <div className="mt-5">
                    <ActivityDots />
                  </div>

                  <p className="mt-3 text-[9px] text-slate-500">
                    ¡Sigue así!
                  </p>
                </DashboardCard>

                {/* Objetivo */}

                <DashboardCard className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                        Próximo objetivo
                      </p>

                      <p className="mt-1 text-base font-black text-white">
                        Matemáticas
                      </p>
                    </div>

                    <motion.div
                      animate={{
                        rotate: [0, 8, -8, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                    >
                      <Crosshair className="h-5 w-5" />
                    </motion.div>
                  </div>

                  <MiniProgress />

                  <p className="mt-3 text-[9px] text-slate-500">
                    9 puntos para superar tu mejor
                    resultado.
                  </p>
                </DashboardCard>

                {/* Última sesión */}

                <DashboardCard className="relative overflow-hidden border-fuchsia-500/70 p-5 shadow-[0_0_30px_rgba(217,70,239,0.12)]">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-2xl" />

                  <div className="absolute right-4 top-4 text-fuchsia-400/60">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                      Última sesión
                    </p>

                    <p className="mt-1 text-base font-black text-white">
                      Simulacro completo
                    </p>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-4xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]">
                        402
                      </p>

                      <p className="mt-1 text-[9px] text-slate-400">
                        Puntaje obtenido
                      </p>
                    </div>

                    <span className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-1 text-[8px] font-black text-fuchsia-300">
                      HOY
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#14244a]">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      whileInView={{
                        width: "85.5%",
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.9,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                </DashboardCard>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =====================================================
            CIERRE
        ===================================================== */}

        <motion.div
          initial={reveal(10)}
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mx-auto mt-10 flex max-w-2xl items-center gap-4"
        >
          <div className="hidden h-px flex-1 bg-[#20325c] sm:block" />

          <p className="text-center text-[10px] font-medium leading-5 text-slate-500">
            No estudies a ciegas.
            <br className="sm:hidden" />
            Conoce exactamente dónde estás y hacia
            dónde avanzar.
          </p>

          <div className="hidden h-px flex-1 bg-[#20325c] sm:block" />
        </motion.div>
      </div>
    </section>
  );
}