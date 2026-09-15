"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Testimonial = {
  name: string;
  role: string;
  character: string;
  initialScore: number;
  finalScore: number;
  text: string;
  accent: "cyan" | "purple" | "blue";
};

const testimonials: Testimonial[] = [
  {
    name: "Laura Gómez",
    role: "Preparación ICFES",
    character: "/characters/Vexa.png",
    initialScore: 371,
    finalScore: 423,
    text: "PeakScore me ayudó a identificar mis errores y mejorar mi preparación de forma mucho más organizada.",
    accent: "cyan",
  },
  {
    name: "Juan Pérez",
    role: "Preparación ICFES",
    character: "/characters/peaky.png",
    initialScore: 399,
    finalScore: 445,
    text: "Los simulacros me permitieron entender en qué áreas estaba fallando y dónde debía concentrar mi estudio.",
    accent: "purple",
  },
  {
    name: "Sara Martínez",
    role: "Preparación ICFES",
    character: "/characters/zyro.png",
    initialScore: 401,
    finalScore: 473,
    text: "Ahora puedo ver mi progreso y tomar decisiones sobre mi preparación basándome en mis resultados.",
    accent: "cyan",
  },
];

function ScoreBar({
  initialScore,
  finalScore,
  accent,
}: {
  initialScore: number;
  finalScore: number;
  accent: "cyan" | "purple" | "blue";
}) {
  const finalPosition = (finalScore / 500) * 100;
  const initialPosition = (initialScore / 500) * 100;

  const accentGradient =
    accent === "purple"
      ? "from-fuchsia-500 via-purple-500 to-cyan-400"
      : accent === "blue"
        ? "from-blue-500 via-cyan-400 to-cyan-300"
        : "from-cyan-400 via-blue-500 to-purple-500";

  return (
    <div className="mt-7">
      {/* Escala */}
      <div className="mb-2 flex justify-between text-[8px] font-medium text-slate-500">
        <span>0</span>
        <span>100</span>
        <span>200</span>
        <span>300</span>
        <span>400</span>
        <span>500</span>
      </div>

      {/* Barra */}
      <div className="relative h-[5px] overflow-visible rounded-full bg-slate-900">
        {/* Progreso */}
        <motion.div
          initial={{ width: 0 }}
          whileInView={{
            width: `${finalPosition}%`,
          }}
          viewport={{ once: true }}
          transition={{
            duration: 1.1,
            ease: "easeOut",
          }}
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${accentGradient}`}
        />

        {/* Punto inicial */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-slate-700 bg-slate-500"
          style={{
            left: `calc(${initialPosition}% - 4px)`,
          }}
        />

        {/* Punto final */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.75,
            type: "spring",
            stiffness: 300,
          }}
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
          style={{
            left: `calc(${finalPosition}% - 6px)`,
          }}
        />
      </div>
    </div>
  );
}

function PixelCloud({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute opacity-60 ${className}`}
    >
      <div className="relative h-12 w-36">
        <div className="absolute bottom-0 left-0 h-5 w-32 bg-purple-950/80" />
        <div className="absolute bottom-4 left-5 h-6 w-20 bg-purple-900/80" />
        <div className="absolute bottom-6 left-12 h-7 w-14 bg-fuchsia-900/50" />
        <div className="absolute bottom-2 right-0 h-4 w-14 bg-indigo-950" />
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#020617] py-24 md:py-28">
      {/* =========================================================
          FONDO PEAKSCORE
      ========================================================== */}

      <div className="pointer-events-none absolute inset-0">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow superior */}
        <div className="absolute left-1/2 top-[-180px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-blue-700/10 blur-[140px]" />

        {/* Glow lateral */}
        <div className="absolute left-[-200px] top-1/3 h-[350px] w-[350px] rounded-full bg-purple-700/10 blur-[120px]" />

        <div className="absolute right-[-200px] top-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[120px]" />

        {/* Estrellas pixel */}
        <span className="absolute left-[8%] top-[15%] h-1 w-1 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
        <span className="absolute left-[18%] top-[30%] h-1 w-1 bg-purple-400" />
        <span className="absolute left-[74%] top-[14%] h-1 w-1 bg-cyan-400" />
        <span className="absolute right-[12%] top-[32%] h-1 w-1 bg-fuchsia-400" />
        <span className="absolute right-[23%] bottom-[18%] h-1 w-1 bg-blue-400" />

        {/* Nubes pixel */}
        <PixelCloud className="left-[-20px] top-[18%]" />
        <PixelCloud className="right-[-25px] top-[21%] scale-125" />
        <PixelCloud className="left-[4%] bottom-[8%] scale-90" />
        <PixelCloud className="right-[5%] bottom-[7%] scale-110" />
      </div>

      {/* =========================================================
          CONTENIDO
      ========================================================== */}

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            margin: "-80px",
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Label */}
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-slate-950/70 px-5 py-2 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-300">
              Progreso medible
            </span>

            <span className="h-1.5 w-1.5 bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
          </div>

          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-6xl">
            El progreso se puede
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
              medir.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            Entrena, analiza tu rendimiento y descubre cómo evoluciona tu
            preparación para el ICFES.
          </p>
        </motion.div>

        {/* =========================================================
            TESTIMONIOS
        ========================================================== */}

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => {
            const improvement = item.finalScore - item.initialScore;

            const borderClass =
              item.accent === "purple"
                ? "border-fuchsia-500/30 hover:border-fuchsia-400/60"
                : "border-cyan-500/30 hover:border-cyan-400/60";

            const glowClass =
              item.accent === "purple"
                ? "bg-fuchsia-500"
                : "bg-cyan-400";

            const numberClass =
              item.accent === "purple"
                ? "text-fuchsia-400"
                : "text-cyan-400";

            return (
              <motion.article
                key={item.name}
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  margin: "-60px",
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                className={`
                  group relative overflow-hidden
                  rounded-[24px]
                  border
                  ${borderClass}
                  bg-[#030b1d]/90
                  backdrop-blur-md
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-[0_20px_70px_rgba(0,0,0,0.45)]
                `}
              >
                {/* Línea superior */}
                <div
                  className={`
                    absolute left-0 right-0 top-0 h-[2px]
                    bg-gradient-to-r
                    ${
                      item.accent === "purple"
                        ? "from-transparent via-fuchsia-500 to-transparent"
                        : "from-transparent via-cyan-400 to-transparent"
                    }
                  `}
                />

                {/* Pixel corners */}
                <div
                  className={`absolute left-0 top-0 h-3 w-3 border-l border-t ${item.accent === "purple" ? "border-fuchsia-400" : "border-cyan-400"}`}
                />

                <div
                  className={`absolute right-0 top-0 h-3 w-3 border-r border-t ${item.accent === "purple" ? "border-fuchsia-400" : "border-cyan-400"}`}
                />

                <div className="p-6 md:p-7">
                  {/* =================================================
                      PERFIL
                  ================================================== */}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Personaje */}
                      <div className="relative h-[74px] w-[74px] shrink-0">
                        {/* Halo */}
                        <div
                          className={`absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full ${glowClass}/10 blur-xl`}
                        />

                        {/* Marco pixel */}
                        <div
                          className={`
                            absolute inset-0
                            border
                            ${
                              item.accent === "purple"
                                ? "border-fuchsia-500/40"
                                : "border-cyan-400/40"
                            }
                            bg-slate-950/80
                          `}
                        />

                        <Image
                          src={item.character}
                          alt={item.name}
                          fill
                          sizes="74px"
                          className="relative z-10 object-contain object-bottom"
                          priority={index === 0}
                        />
                      </div>

                      {/* Nombre */}
                      <div>
                        <h3 className="text-sm font-bold text-white md:text-base">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">
                          {item.role}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${glowClass}`}
                          />

                          <span className="text-[8px] font-medium text-slate-500">
                            Estudiante PeakScore
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mejora */}
                    <div
                      className={`
                        flex h-10 min-w-10 items-center justify-center
                        border
                        ${
                          item.accent === "purple"
                            ? "border-fuchsia-500/30 bg-fuchsia-500/5 text-fuchsia-400"
                            : "border-cyan-400/30 bg-cyan-400/5 text-cyan-300"
                        }
                        px-2
                      `}
                    >
                      <span className="font-mono text-[11px] font-bold">
                        +{improvement}
                      </span>
                    </div>
                  </div>

                  {/* =================================================
                      TESTIMONIO
                  ================================================== */}

                  <div className="relative mt-7 min-h-[78px]">
                    <span className="absolute -left-1 -top-3 font-serif text-4xl leading-none text-slate-800">
                      “
                    </span>

                    <p className="relative pl-3 text-xs leading-6 text-slate-300">
                      {item.text}
                    </p>
                  </div>

                  {/* =================================================
                      PUNTAJES
                  ================================================== */}

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    {/* Inicial */}
                    <div className="relative overflow-hidden border border-slate-800 bg-[#050d20] p-4">
                      <div className="absolute right-0 top-0 h-5 w-5 border-r border-t border-slate-700" />

                      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Inicial
                      </p>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="font-mono text-3xl font-black tracking-tight text-slate-300">
                          {item.initialScore}
                        </span>

                        <span className="font-mono text-[9px] text-slate-600">
                          /500
                        </span>
                      </div>
                    </div>

                    {/* Evolución */}
                    <div
                      className={`
                        relative overflow-hidden border
                        ${
                          item.accent === "purple"
                            ? "border-fuchsia-500/30 bg-fuchsia-500/[0.04]"
                            : "border-cyan-400/30 bg-cyan-400/[0.04]"
                        }
                        p-4
                      `}
                    >
                      <div
                        className={`
                          absolute right-0 top-0 h-5 w-5 border-r border-t
                          ${
                            item.accent === "purple"
                              ? "border-fuchsia-400/60"
                              : "border-cyan-400/60"
                          }
                        `}
                      />

                      <p
                        className={`text-[8px] font-bold uppercase tracking-[0.16em] ${numberClass}`}
                      >
                        Evolución
                      </p>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span
                          className={`font-mono text-3xl font-black tracking-tight ${numberClass}`}
                        >
                          {item.finalScore}
                        </span>

                        <span
                          className={`font-mono text-[9px] ${numberClass}/50`}
                        >
                          /500
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra */}
                  <ScoreBar
                    initialScore={item.initialScore}
                    finalScore={item.finalScore}
                    accent={item.accent}
                  />

                  {/* Separador */}
                  <div className="mt-7 border-t border-slate-800/80 pt-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Escala global
                        </p>

                        <p className="mt-1 font-mono text-[9px] text-slate-400">
                          0 — 500
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[8px] uppercase tracking-[0.14em] text-slate-600">
                          Evolución
                        </p>

                        <p
                          className={`mt-1 font-mono text-[10px] font-bold ${numberClass}`}
                        >
                          +{improvement} pts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow inferior */}
                <div
                  className={`
                    pointer-events-none absolute
                    bottom-[-80px]
                    left-1/2
                    h-32
                    w-48
                    -translate-x-1/2
                    rounded-full
                    ${glowClass}/10
                    blur-[60px]
                    opacity-0
                    transition-opacity
                    duration-300
                    group-hover:opacity-100
                  `}
                />
              </motion.article>
            );
          })}
        </div>

        {/* =========================================================
            FOOTER DE SECCIÓN
        ========================================================== */}

        <motion.div
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
            duration: 0.6,
            delay: 0.2,
          }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/60" />

          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Tu progreso, punto a punto.
            </span>

            <span className="h-1.5 w-1.5 bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
          </div>

          <span className="h-px w-12 bg-gradient-to-l from-transparent to-fuchsia-500/60" />
        </motion.div>
      </div>
    </section>
  );
}