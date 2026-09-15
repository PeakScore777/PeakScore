"use client";

import { motion, useReducedMotion } from "framer-motion";

/* =========================================================
   DATOS
========================================================= */

type SubjectIconType =
  | "reading"
  | "math"
  | "social"
  | "science"
  | "english";

const subjects: Array<{
  code: string;
  shortCode: string;
  name: string;
  score: number;
  color: string;
  icon: SubjectIconType;
}> = [
  {
    code: "MAT",
    shortCode: "MA",
    name: "Matemáticas",
    score: 100,
    color: "cyan",
    icon: "math",
  },
  {
    code: "LECT",
    shortCode: "LC",
    name: "Lectura Crítica",
    score: 100,
    color: "violet",
    icon: "reading",
  },
  {
    code: "CN",
    shortCode: "CN",
    name: "Ciencias Naturales",
    score: 71,
    color: "cyan",
    icon: "science",
  },
  {
    code: "SOC",
    shortCode: "SC",
    name: "Sociales y Ciudadanas",
    score: 76,
    color: "pink",
    icon: "social",
  },
  {
    code: "ING",
    shortCode: "IN",
    name: "Inglés",
    score: 88,
    color: "blue",
    icon: "english",
  },
];

/* =========================================================
   ICONOS DE LAS ÁREAS
   Diseñados específicamente para PeakScore.
========================================================= */

function SubjectIcon({
  type,
}: {
  type: SubjectIconType;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-[19px] w-[19px]"
    >
      {/* Lectura Crítica */}
      {type === "reading" && (
        <g {...common}>
          <path d="M6.5 8.5h8.1c2.1 0 3.9.8 5 2.2v14.3c-1.1-1.1-2.7-1.7-4.7-1.7H6.5z" />
          <path d="M25.5 8.5h-8.1c-2.1 0-3.9.8-5 2.2v14.3c1.1-1.1 2.7-1.7 4.7-1.7h8.4z" />
          <path d="M12.4 11.5h-3M12.4 15h-3M19.6 11.5h3M19.6 15h3" />
          <path d="M16 10.8v13.1" />
        </g>
      )}

      {/* Matemáticas */}
      {type === "math" && (
        <g {...common}>
          <rect
            x="6.5"
            y="6.5"
            width="19"
            height="19"
            rx="3"
          />

          <path d="M10 11h12" />

          <path d="M10 17h5" />
          <path d="M12.5 14.5v5" />

          <path d="M19 15h4" />
          <path d="M21 13v4" />

          <path d="M19 21h4" />
        </g>
      )}

      {/* Sociales y Ciudadanas */}
      {type === "social" && (
        <g {...common}>
          <circle
            cx="16"
            cy="16"
            r="9.5"
          />

          <path d="M10 20.5c2.2-2.4 4.1-3.6 6.2-3.6 2.1 0 3.9 1.1 5.8 3.1" />

          <path d="M10.5 12.5c1.6 1.4 3.3 2.1 5.4 2.1 2.2 0 4.1-.8 5.7-2.4" />

          <path d="M16 6.5c1.8 2.2 2.7 4.5 2.7 7.2 0 2.9-1 5.9-2.9 9.7" />

          <path d="M13.3 7.1c-1.6 2.2-2.4 4.4-2.4 6.8 0 2.8.9 5.4 2.8 8.1" />
        </g>
      )}

      {/* Ciencias Naturales */}
      {type === "science" && (
        <g {...common}>
          <path d="M12 6.5v7.1l-5 9a2.8 2.8 0 0 0 2.5 4.1h13a2.8 2.8 0 0 0 2.5-4.1l-5-9V6.5" />

          <path d="M10.2 17.2h11.6" />

          <circle
            cx="13"
            cy="21"
            r="1"
            fill="currentColor"
            stroke="none"
          />

          <circle
            cx="17"
            cy="19.5"
            r="1.2"
            fill="currentColor"
            stroke="none"
          />

          <circle
            cx="20.5"
            cy="22"
            r="0.9"
            fill="currentColor"
            stroke="none"
          />
        </g>
      )}

      {/* Inglés */}
      {type === "english" && (
        <g {...common}>
          <path d="M7 8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6.7L12 24v-3.5H9a2 2 0 0 1-2-2z" />

          <path d="M11 11.8h8.5M11 15.7h5.5" />

          <path d="M23 7.5v-2" />
          <path d="M25.3 9.2l1.4-1.4" />
          <path d="M20.7 9.2l-1.4-1.4" />
        </g>
      )}
    </svg>
  );
}

const preparationSteps = [
  {
    number: "01",
    title: "Practica",
    description:
      "Resuelve preguntas y refuerza tus conocimientos.",
    image: "/iconospixel/practicapixel.png",
    accent: "cyan",
  },
  {
    number: "02",
    title: "Analiza",
    description:
      "Revisa tus resultados y detecta dónde mejorar.",
    image: "/iconospixel/graficapixel.png",
    accent: "violet",
  },
  {
    number: "03",
    title: "Avanza",
    description:
      "Convierte cada sesión en un paso más hacia tu objetivo.",
    image: "/iconospixel/subedenivelpixel.png",
    accent: "cyan",
  },
];

/* =========================================================
   ESTRELLAS
========================================================= */

const particles = [
  { left: "4%", top: "7%", size: 2 },
  { left: "9%", top: "22%", size: 3 },
  { left: "15%", top: "11%", size: 2 },
  { left: "22%", top: "5%", size: 2 },
  { left: "29%", top: "17%", size: 2 },
  { left: "36%", top: "8%", size: 3 },
  { left: "43%", top: "14%", size: 2 },
  { left: "51%", top: "6%", size: 2 },
  { left: "58%", top: "18%", size: 2 },
  { left: "66%", top: "7%", size: 3 },
  { left: "74%", top: "14%", size: 2 },
  { left: "82%", top: "6%", size: 2 },
  { left: "91%", top: "12%", size: 3 },
  { left: "96%", top: "26%", size: 2 },

  { left: "6%", top: "42%", size: 2 },
  { left: "13%", top: "58%", size: 2 },
  { left: "21%", top: "67%", size: 3 },
  { left: "79%", top: "63%", size: 2 },
  { left: "88%", top: "55%", size: 2 },
  { left: "95%", top: "72%", size: 3 },
];

/* =========================================================
   COMPONENTE
========================================================= */

export default function Stats() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#020617] py-24 sm:py-32">

      {/* =====================================================
          FONDO GENERAL
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_12%,rgba(30,64,175,0.16),transparent_32%),radial-gradient(circle_at_18%_65%,rgba(124,58,237,0.10),transparent_30%),radial-gradient(circle_at_85%_72%,rgba(14,116,144,0.07),transparent_28%)]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* =================================================
            ESTRELLAS
        ================================================= */}

        {particles.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute block rounded-full bg-cyan-300"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              boxShadow:
                "0 0 10px rgba(34,211,238,0.8)",
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 2.5 + (index % 4),
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.12,
                  }
            }
          />
        ))}

        {/* =================================================
            PIXEL CROSSES
        ================================================= */}

        <div className="absolute left-[4%] top-[32%] opacity-80">
          <div className="relative h-7 w-7">
            <span className="absolute left-3 top-0 h-7 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            <span className="absolute left-0 top-3 h-1 w-7 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
        </div>

        <div className="absolute right-[5%] top-[38%] opacity-80">
          <div className="relative h-7 w-7">
            <span className="absolute left-3 top-0 h-7 w-1 bg-fuchsia-400 shadow-[0_0_10px_#d946ef]" />
            <span className="absolute left-0 top-3 h-1 w-7 bg-fuchsia-400 shadow-[0_0_10px_#d946ef]" />
          </div>
        </div>

        <div className="absolute left-[7%] bottom-[17%] opacity-70">
          <div className="relative h-5 w-5">
            <span className="absolute left-2 top-0 h-5 w-1 bg-violet-400" />
            <span className="absolute left-0 top-2 h-1 w-5 bg-violet-400" />
          </div>
        </div>

        <div className="absolute right-[9%] bottom-[18%] opacity-70">
          <div className="relative h-5 w-5">
            <span className="absolute left-2 top-0 h-5 w-1 bg-cyan-400" />
            <span className="absolute left-0 top-2 h-1 w-5 bg-cyan-400" />
          </div>
        </div>

        {/* =================================================
            NUBE PIXELADA — IZQUIERDA SUPERIOR
        ================================================= */}

        <div className="absolute -left-24 top-[12%] opacity-45">
          <div className="relative h-[125px] w-[430px]">

            <div className="absolute bottom-3 left-0 h-8 w-[390px] bg-purple-900/35" />

            <div className="absolute bottom-7 left-8 h-14 w-20 bg-fuchsia-600/25" />

            <div className="absolute bottom-12 left-20 h-16 w-28 bg-purple-600/30" />

            <div className="absolute bottom-9 left-42 h-12 w-24 bg-fuchsia-500/25" />

            <div className="absolute bottom-5 left-56 h-16 w-32 bg-purple-700/30" />

            <div className="absolute bottom-16 left-28 h-5 w-16 bg-fuchsia-400/15" />

            <div className="absolute bottom-20 left-48 h-4 w-12 bg-purple-300/15" />

            <div className="absolute bottom-0 left-[-30px] h-4 w-[450px] bg-blue-700/20" />

          </div>
        </div>

        {/* =================================================
            NUBE PIXELADA — DERECHA SUPERIOR
        ================================================= */}

        <div className="absolute -right-28 top-[17%] opacity-45">
          <div className="relative h-[135px] w-[450px]">

            <div className="absolute bottom-4 right-0 h-9 w-[410px] bg-purple-900/35" />

            <div className="absolute bottom-8 right-10 h-15 w-24 bg-fuchsia-600/25" />

            <div className="absolute bottom-13 right-24 h-16 w-32 bg-purple-600/30" />

            <div className="absolute bottom-10 right-52 h-14 w-28 bg-fuchsia-500/25" />

            <div className="absolute bottom-6 right-76 h-12 w-24 bg-purple-700/30" />

            <div className="absolute bottom-20 right-40 h-5 w-14 bg-fuchsia-300/15" />

            <div className="absolute bottom-23 right-20 h-4 w-12 bg-purple-300/15" />

            <div className="absolute bottom-0 right-[-30px] h-4 w-[480px] bg-blue-700/20" />

          </div>
        </div>

        {/* =================================================
            NUBE PIXELADA — IZQUIERDA MEDIA
        ================================================= */}

        <div className="absolute -left-28 top-[47%] opacity-30">
          <div className="relative h-[110px] w-[390px]">

            <div className="absolute bottom-0 left-0 h-8 w-80 bg-blue-800/25" />

            <div className="absolute bottom-4 left-14 h-13 w-24 bg-purple-700/25" />

            <div className="absolute bottom-9 left-28 h-11 w-28 bg-fuchsia-500/20" />

            <div className="absolute bottom-5 left-52 h-10 w-32 bg-purple-800/25" />

          </div>
        </div>

        {/* =================================================
            NUBE PIXELADA — DERECHA MEDIA
        ================================================= */}

        <div className="absolute -right-28 top-[52%] opacity-30">
          <div className="relative h-[110px] w-[400px]">

            <div className="absolute bottom-0 right-0 h-8 w-80 bg-blue-800/25" />

            <div className="absolute bottom-4 right-14 h-13 w-24 bg-purple-700/25" />

            <div className="absolute bottom-9 right-30 h-11 w-28 bg-fuchsia-500/20" />

            <div className="absolute bottom-5 right-52 h-10 w-32 bg-purple-800/25" />

          </div>
        </div>

        {/* =================================================
            NUBES INFERIORES
        ================================================= */}

        <div className="absolute left-[6%] bottom-[5%] opacity-20">
          <div className="relative h-20 w-[300px]">

            <div className="absolute bottom-0 left-0 h-7 w-64 bg-purple-800/30" />

            <div className="absolute bottom-4 left-16 h-9 w-20 bg-fuchsia-500/20" />

            <div className="absolute bottom-7 left-32 h-7 w-24 bg-purple-600/25" />

          </div>
        </div>

        <div className="absolute right-[6%] bottom-[5%] opacity-20">
          <div className="relative h-20 w-[300px]">

            <div className="absolute bottom-0 right-0 h-7 w-64 bg-purple-800/30" />

            <div className="absolute bottom-4 right-16 h-9 w-20 bg-fuchsia-500/20" />

            <div className="absolute bottom-7 right-32 h-7 w-24 bg-purple-600/25" />

          </div>
        </div>

      </div>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div className="relative z-10 mx-auto max-w-[1180px] px-5 sm:px-7 lg:px-8">

        {/* ===================================================
            HEADER
        =================================================== */}

        <motion.div
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                }
          }
          whileInView={
            reduceMotion
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
            duration: 0.7,
          }}
          className="relative min-h-[270px]"
        >

          <div className="relative z-30 max-w-[610px]">

            <div className="mb-5 flex items-center gap-3">

              <span className="h-px w-9 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />

              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
                Una preparación con dirección
              </span>

            </div>

            <h2 className="text-[46px] font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-[60px] lg:text-[66px]">

              No se trata de
              <br />

              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                estudiar por estudiar.
              </span>

            </h2>

            <p className="mt-5 max-w-[570px] text-sm leading-6 text-slate-400 sm:text-[15px]">
              PeakScore organiza tu preparación para que cada pregunta,
              cada simulacro y cada resultado tengan un propósito.
            </p>

          </div>

          {/* =================================================
              NUBES DETRÁS DE PEAKY
          ================================================= */}

          <div className="pointer-events-none absolute right-[-35px] top-[-15px] z-0 hidden h-[245px] w-[590px] lg:block">

            <div className="absolute bottom-[45px] left-[40px] h-[58px] w-[190px] opacity-60">

              <div className="absolute bottom-0 left-0 h-8 w-44 bg-purple-700/35" />

              <div className="absolute bottom-5 left-5 h-9 w-16 bg-fuchsia-500/30" />

              <div className="absolute bottom-9 left-14 h-10 w-20 bg-purple-500/30" />

              <div className="absolute bottom-4 left-28 h-8 w-20 bg-fuchsia-500/25" />

            </div>

            <div className="absolute bottom-[72px] right-[115px] h-[62px] w-[190px] opacity-65">

              <div className="absolute bottom-0 right-0 h-8 w-44 bg-purple-700/40" />

              <div className="absolute bottom-5 right-8 h-10 w-20 bg-fuchsia-500/35" />

              <div className="absolute bottom-10 right-24 h-9 w-20 bg-purple-500/35" />

              <div className="absolute bottom-4 right-44 h-8 w-16 bg-fuchsia-500/30" />

            </div>

            <div className="absolute bottom-[35px] right-[-20px] h-[72px] w-[200px] opacity-60">

              <div className="absolute bottom-0 right-0 h-9 w-48 bg-purple-800/40" />

              <div className="absolute bottom-5 right-12 h-12 w-20 bg-fuchsia-500/35" />

              <div className="absolute bottom-10 right-28 h-10 w-20 bg-purple-500/35" />

            </div>

            <div className="absolute right-[245px] top-[18px] h-10 w-24 opacity-50">

              <div className="absolute bottom-0 left-0 h-5 w-24 bg-fuchsia-500/25" />

              <div className="absolute bottom-3 left-5 h-6 w-10 bg-purple-500/30" />

            </div>

          </div>

          {/* =================================================
              PEAKY
          ================================================= */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    x: 40,
                    scale: 0.96,
                  }
            }
            whileInView={
              reduceMotion
                ? undefined
                : {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  }
            }
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
            }}
            className="pointer-events-none absolute right-[-50px] top-[-35px] z-10 hidden h-[290px] w-[570px] lg:block"
          >

            <img
              src="/peaky/homepage/statspeakyruta.png"
              alt=""
              className="h-full w-full object-contain object-right drop-shadow-[0_0_30px_rgba(37,99,235,0.25)]"
            />

          </motion.div>

        </motion.div>

        {/* ===================================================
            PRIMERA FILA
        =================================================== */}

        <div className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">

          {/* =================================================
              TU PREPARACIÓN
          ================================================= */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 25,
                  }
            }
            whileInView={
              reduceMotion
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
              duration: 0.65,
            }}
            className="relative overflow-hidden rounded-[22px] border border-cyan-500/25 bg-[#03091d]/95 p-7 sm:p-8"
          >

            <div className="pointer-events-none absolute inset-2 rounded-[18px] border border-blue-500/[0.05]" />

            <div className="absolute right-6 top-6 grid grid-cols-4 gap-1 opacity-50">

              {Array.from({
                length: 8,
              }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1 w-1 ${
                    index % 3 === 0
                      ? "bg-fuchsia-400"
                      : "bg-cyan-400"
                  }`}
                />
              ))}

            </div>

            <div className="relative">

              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">
                Tu preparación
              </p>

              <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">
                Un ciclo que se repite.
              </h3>

              <div className="relative mt-8">

                <div className="absolute left-[22px] top-7 bottom-7 w-px bg-gradient-to-b from-cyan-400/60 via-fuchsia-500/40 to-cyan-400/60" />

                <div className="space-y-7">

                  {preparationSteps.map(
                    (step, index) => (
                      <motion.div
                        key={step.number}
                        initial={
                          reduceMotion
                            ? false
                            : {
                                opacity: 0,
                                x: -12,
                              }
                        }
                        whileInView={
                          reduceMotion
                            ? undefined
                            : {
                                opacity: 1,
                                x: 0,
                              }
                        }
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.1,
                        }}
                        className="relative flex gap-5"
                      >

                        {/* =================================
                            BADGE PIXEL
                        ================================= */}

                        <div
                          className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center border bg-[#03091d] ${
                            step.accent === "violet"
                              ? "border-fuchsia-500/60 shadow-[0_0_18px_rgba(217,70,239,0.16)]"
                              : "border-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                          }`}
                        >

                          <span
                            className={`absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 ${
                              step.accent === "violet"
                                ? "border-fuchsia-400"
                                : "border-cyan-300"
                            }`}
                          />

                          <span
                            className={`absolute -right-px -top-px h-2 w-2 border-r-2 border-t-2 ${
                              step.accent === "violet"
                                ? "border-fuchsia-400"
                                : "border-cyan-300"
                            }`}
                          />

                          <span
                            className={`absolute -bottom-px -left-px h-2 w-2 border-b-2 border-l-2 ${
                              step.accent === "violet"
                                ? "border-fuchsia-400"
                                : "border-cyan-300"
                            }`}
                          />

                          <span
                            className={`absolute -bottom-px -right-px h-2 w-2 border-b-2 border-r-2 ${
                              step.accent === "violet"
                                ? "border-fuchsia-400"
                                : "border-cyan-300"
                            }`}
                          />

                          <img
                            src={step.image}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />

                        </div>

                        <div className="pt-1">

                          <div className="flex items-center gap-3">

                            <span
                              className={`font-mono text-[9px] font-black tracking-[0.16em] ${
                                step.accent === "violet"
                                  ? "text-fuchsia-400"
                                  : "text-cyan-400"
                              }`}
                            >
                              FASE {step.number}
                            </span>

                            <span className="h-px w-5 bg-slate-800" />

                          </div>

                          <h4 className="mt-1 text-sm font-black text-white">
                            {step.title}
                          </h4>

                          <p className="mt-1 max-w-[310px] text-xs leading-5 text-slate-500">
                            {step.description}
                          </p>

                        </div>

                      </motion.div>
                    ),
                  )}

                </div>

              </div>

              <div className="mt-8 border-t border-white/[0.07] pt-5">

                <div className="flex items-center gap-3">

                  <span className="relative h-2 w-2">

                    <span className="absolute inset-0 bg-emerald-400 shadow-[0_0_10px_#34d399]" />

                    <span className="absolute -left-1 -top-1 h-1 w-1 bg-emerald-200" />

                  </span>

                  <span className="text-[10px] text-slate-400">
                    Cada sesión aporta información para tu siguiente paso.
                  </span>

                </div>

              </div>

            </div>

          </motion.div>

          {/* =================================================
              ÁREAS
          ================================================= */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 25,
                  }
            }
            whileInView={
              reduceMotion
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
              duration: 0.65,
              delay: 0.08,
            }}
            className="relative overflow-hidden rounded-[22px] border border-cyan-500/25 bg-[#03091d]/95 p-7 sm:p-8"
          >

            <div className="pointer-events-none absolute inset-2 rounded-[18px] border border-blue-500/[0.05]" />

            <div className="relative">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">
                    Vista general
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">
                    Tus áreas, de un vistazo.
                  </h3>

                </div>

                {/* =========================================
                    INDICADOR DE ESCALA
                ========================================= */}

                <div className="relative hidden h-9 min-w-[148px] items-center justify-center border border-fuchsia-500/30 bg-[#05091b] px-4 sm:flex">

                  <span className="absolute left-0 top-0 h-1.5 w-1.5 bg-fuchsia-400" />

                  <span className="absolute right-0 top-0 h-1.5 w-1.5 bg-fuchsia-400" />

                  <span className="absolute bottom-0 left-0 h-1.5 w-1.5 bg-fuchsia-400" />

                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-fuchsia-400" />

                  <span className="font-mono text-[8px] font-black uppercase tracking-[0.14em] text-fuchsia-300">
                    PUNTAJE POR PRUEBA
                  </span>

                </div>

              </div>

              <div className="mt-7 space-y-2">

                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject.code}
                    initial={
                      reduceMotion
                        ? false
                        : {
                            opacity: 0,
                            x: 12,
                          }
                    }
                    whileInView={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            x: 0,
                          }
                    }
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.07,
                    }}
                    className="border-b border-blue-500/[0.07] py-2.5"
                  >

                    <div className="flex items-center gap-3">

                      {/* =====================================
                          ICONO PROPIO DE MATERIA
                      ===================================== */}

                      <div
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border bg-[#050b20] ${
                          subject.color === "pink"
                            ? "border-fuchsia-400/45 text-fuchsia-300 shadow-[0_0_14px_rgba(217,70,239,0.10)]"
                            : subject.color === "violet"
                              ? "border-violet-400/45 text-violet-300 shadow-[0_0_14px_rgba(139,92,246,0.10)]"
                              : "border-cyan-400/45 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.10)]"
                        }`}
                      >

                        <span
                          className={`absolute bottom-0 left-2 right-2 h-px ${
                            subject.color === "pink"
                              ? "bg-fuchsia-500/80"
                              : subject.color === "violet"
                                ? "bg-violet-500/80"
                                : "bg-cyan-500/80"
                          }`}
                        />

                        <SubjectIcon type={subject.icon} />

                      </div>

                      <span className="w-[125px] shrink-0 text-[11px] font-bold text-slate-300 sm:w-[155px]">
                        {subject.name}
                      </span>

                      <div className="relative flex-1">

                        <div className="h-[7px] overflow-hidden bg-slate-900/90">

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
                              duration: 0.85,
                              delay:
                                0.2 +
                                index * 0.07,
                            }}
                            className={`h-full ${
                              subject.color === "pink"
                                ? "bg-gradient-to-r from-fuchsia-500 to-pink-400"
                                : subject.color === "violet"
                                  ? "bg-gradient-to-r from-violet-600 to-purple-400"
                                  : "bg-gradient-to-r from-blue-600 to-cyan-400"
                            }`}
                          />

                        </div>

                        <div className="pointer-events-none absolute inset-0 flex justify-between opacity-20">

                          {Array.from({
                            length: 25,
                          }).map((_, i) => (
                            <span
                              key={i}
                              className="h-full w-px bg-[#020617]"
                            />
                          ))}

                        </div>

                      </div>

                      <div className="flex min-w-[63px] items-baseline justify-end gap-1">

                        <span className="font-mono text-sm font-black text-white">
                          {subject.score}
                        </span>

                        <span className="font-mono text-[8px] text-slate-600">
                          /100
                        </span>

                      </div>

                    </div>

                  </motion.div>
                ))}

              </div>

              <div className="mt-5 flex items-center justify-between">

                <span className="text-[9px] text-slate-600">
                  Resultados por prueba en escala ICFES.
                </span>

                <span className="text-[9px] font-black text-cyan-400">
                  Ver progreso completo →
                </span>

              </div>

            </div>

          </motion.div>

        </div>

        {/* ===================================================
            TRES TARJETAS
        =================================================== */}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* =================================================
              RESULTADO
          ================================================= */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 25,
                  }
            }
            whileInView={
              reduceMotion
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
              duration: 0.55,
            }}
            className="group relative min-h-[300px] overflow-hidden rounded-[22px] border border-cyan-500/25 bg-[#03091d]/95 p-6"
          >

            <div className="absolute right-5 top-5 font-mono text-[9px] font-black tracking-[0.16em] text-cyan-400">
              FASE 01
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Después de practicar
            </p>

            <div className="pointer-events-none absolute right-[-4px] top-[35px] h-[175px] w-[185px]">

              <img
                src="/peaky/homepage/statspremio.png"
                alt=""
                className="h-full w-full object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-transform duration-500 group-hover:scale-110"
              />

            </div>

            <div className="relative z-10 mt-[100px]">

              <h3 className="text-2xl font-black tracking-[-0.035em] text-white">
                Resultado
              </h3>

              <p className="mt-2 max-w-[230px] text-[10px] leading-5 text-slate-500">
                Tu desempeño queda registrado para entender cómo estás avanzando.
              </p>

              <div className="mt-4 flex items-end gap-2">

                <span className="font-mono text-4xl font-black text-cyan-400">
                  434
                </span>

                <span className="mb-1 font-mono text-sm text-slate-500">
                  /500
                </span>

              </div>

              <div className="mt-4 border-t border-white/[0.07] pt-4">

                <div className="flex items-center gap-3">

                  <span className="h-2 w-2 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />

                  <span className="text-[9px] text-slate-500">
                    Información clara
                  </span>

                </div>

              </div>

            </div>

          </motion.div>

          {/* =================================================
              ENFOQUE
          ================================================= */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 25,
                  }
            }
            whileInView={
              reduceMotion
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
              duration: 0.55,
              delay: 0.08,
            }}
            className="group relative min-h-[300px] overflow-hidden rounded-[22px] border border-fuchsia-500/25 bg-[#03091d]/95 p-6"
          >

            <div className="absolute right-5 top-5 font-mono text-[9px] font-black tracking-[0.16em] text-fuchsia-400">
              FASE 02
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-400">
              Después de analizar
            </p>

            <div className="pointer-events-none absolute right-[-3px] top-[35px] h-[175px] w-[185px]">

              <img
                src="/peaky/homepage/statslibro.png"
                alt=""
                className="h-full w-full object-contain drop-shadow-[0_0_25px_rgba(217,70,239,0.3)] transition-transform duration-500 group-hover:scale-110"
              />

            </div>

            <div className="relative z-10 mt-[100px]">

              <h3 className="text-2xl font-black tracking-[-0.035em] text-white">
                Enfoque
              </h3>

              <p className="mt-2 max-w-[230px] text-[10px] leading-5 text-slate-500">
                Detecta las áreas donde concentrar tu esfuerzo.
              </p>

              <div className="mt-4 flex items-end gap-2">

                <span className="font-mono text-4xl font-black text-fuchsia-400">
                  3
                </span>

                <span className="mb-1 text-[10px] text-slate-500">
                  áreas clave
                </span>

              </div>

              <div className="mt-4 border-t border-white/[0.07] pt-4">

                <div className="flex items-center gap-3">

                  <span className="h-2 w-2 bg-fuchsia-400 shadow-[0_0_10px_#d946ef]" />

                  <span className="text-[9px] text-slate-500">
                    Guía de atención
                  </span>

                </div>

              </div>

            </div>

          </motion.div>

          {/* =================================================
              PROGRESO
          ================================================= */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 25,
                  }
            }
            whileInView={
              reduceMotion
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
              duration: 0.55,
              delay: 0.16,
            }}
            className="group relative min-h-[300px] overflow-hidden rounded-[22px] border border-cyan-500/25 bg-[#03091d]/95 p-6"
          >

            <div className="absolute right-5 top-5 font-mono text-[9px] font-black tracking-[0.16em] text-cyan-400">
              FASE 03
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Con cada sesión
            </p>

            <div className="pointer-events-none absolute right-[-8px] top-[30px] h-[185px] w-[200px]">

              <img
                src="/peaky/homepage/statsmontaña.png"
                alt=""
                className="h-full w-full object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-transform duration-500 group-hover:scale-110"
              />

            </div>

            <div className="relative z-10 mt-[100px]">

              <h3 className="text-2xl font-black tracking-[-0.035em] text-white">
                Progreso
              </h3>

              <p className="mt-2 max-w-[230px] text-[10px] leading-5 text-slate-500">
                Convierte cada sesión en una referencia para avanzar.
              </p>

              {/* =============================================
                  434 / 500 = 86.8%
              ============================================= */}

              <div className="mt-4 flex items-end gap-2">

                <span className="font-mono text-4xl font-black text-cyan-400">
                  86.8
                </span>

                <span className="mb-1 font-mono text-sm text-slate-500">
                  %
                </span>

              </div>

              <div className="mt-2 flex items-center gap-2">

                <span className="font-mono text-[9px] text-slate-600">
                  434 / 500
                </span>

                <span className="h-px w-6 bg-cyan-500/30" />

                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-cyan-500/70">
                  avance
                </span>

              </div>

              <div className="mt-4 border-t border-white/[0.07] pt-4">

                <div className="flex items-center gap-3">

                  <span className="h-2 w-2 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />

                  <span className="text-[9px] text-slate-500">
                    Mejora continua
                  </span>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

        {/* ===================================================
            CIERRE
        =================================================== */}

        <div className="mt-12 flex flex-col items-center justify-center gap-4">

          <div className="flex items-center gap-2">

            <span className="h-px w-12 bg-blue-500/40" />

            <span className="h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />

            <span className="h-px w-12 bg-fuchsia-500/40" />

          </div>

          <p className="text-center text-xs text-slate-600">
            El objetivo no es tener más información.
            <br />
            Es aplicarla e intercambiarla.
          </p>

        </div>

      </div>
    </section>
  );
}