"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  RotateCcw,
} from "lucide-react";

type ExamResultsProps = {
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  onRetry: () => void;
};

type ResultLevel = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function ExamResults({
  correctAnswers,
  incorrectAnswers,
  percentage,
  onRetry,
}: ExamResultsProps) {
  const router = useRouter();

  const [stage, setStage] = useState<
    "analysis" | "reveal" | "complete"
  >("analysis");

  const [score, setScore] = useState(0);

  const safePercentage = Math.max(
    0,
    Math.min(100, percentage)
  );

  const totalQuestions =
    correctAnswers + incorrectAnswers;

  /*
   * =========================================================
   * MENSAJE DEL RESULTADO
   * =========================================================
   */

  const result = useMemo<ResultLevel>(() => {
    if (safePercentage >= 90) {
      return {
        eyebrow: "Nivel destacado",
        title: "Rendimiento excepcional",
        description:
          "Tu desempeño refleja un dominio sólido de este simulacro.",
      };
    }

    if (safePercentage >= 70) {
      return {
        eyebrow: "Buen nivel",
        title: "Muy buen rendimiento",
        description:
          "Tu preparación está tomando forma. Mantén el ritmo.",
      };
    }

    if (safePercentage >= 50) {
      return {
        eyebrow: "En progreso",
        title: "Buen punto de partida",
        description:
          "Ya tienes una base. Ahora puedes convertir tus errores en progreso.",
      };
    }

    return {
      eyebrow: "Punto de partida",
      title: "Aquí empieza la mejora",
      description:
        "Cada intento te da información para prepararte mejor.",
    };
  }, [safePercentage]);

  /*
   * =========================================================
   * SECUENCIA DE ENTRADA
   * =========================================================
   */

  useEffect(() => {
    const revealTimer = window.setTimeout(() => {
      setStage("reveal");
    }, 700);

    const completeTimer = window.setTimeout(() => {
      setStage("complete");
    }, 1450);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  /*
   * =========================================================
   * ANIMACIÓN DEL SCORE
   * =========================================================
   */

  useEffect(() => {
    if (
      stage !== "reveal" &&
      stage !== "complete"
    ) {
      return;
    }

    const duration = 950;
    const start = performance.now();

    let frame = 0;

    const animate = (time: number) => {
      const progress = Math.min(
        (time - start) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setScore(
        Math.round(
          safePercentage * eased
        )
      );

      if (progress < 1) {
        frame = requestAnimationFrame(
          animate
        );
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [stage, safePercentage]);

  /*
   * =========================================================
   * SVG
   * =========================================================
   */

  const radius = 102;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) * circumference;

  /*
   * =========================================================
   * PARTÍCULAS
   * =========================================================
   */

  const particles = [
    {
      x: "-130px",
      y: "-85px",
      delay: "0ms",
    },
    {
      x: "128px",
      y: "-78px",
      delay: "70ms",
    },
    {
      x: "-145px",
      y: "38px",
      delay: "130ms",
    },
    {
      x: "142px",
      y: "42px",
      delay: "190ms",
    },
    {
      x: "-60px",
      y: "-135px",
      delay: "240ms",
    },
    {
      x: "65px",
      y: "-134px",
      delay: "290ms",
    },
  ];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7f9] px-4 py-8 sm:px-6 sm:py-12">

      {/* =====================================================
          GRID TECNOLÓGICA DE FONDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage:
            "radial-gradient(circle at center, black 0%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 0%, transparent 72%)",
        }}
      />

      {/* =====================================================
          HALO CENTRAL
      ====================================================== */}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_100px_rgba(255,255,255,0.9)] transition-all duration-1000 ${
          stage === "complete"
            ? "scale-110 opacity-100"
            : "scale-75 opacity-0"
        }`}
      />

      {/* =====================================================
          PARTÍCULAS
      ====================================================== */}

      {stage !== "analysis" &&
        particles.map((particle, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="peak-particle absolute hidden h-1 w-1 rounded-full bg-slate-400 sm:block"
            style={
              {
                left: "50%",
                top: "50%",
                "--x": particle.x,
                "--y": particle.y,
                animationDelay: particle.delay,
              } as React.CSSProperties
            }
          />
        ))}

      {/* =====================================================
          CONTENEDOR
      ====================================================== */}

      <section className="peak-results relative z-10 w-full max-w-3xl">

        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">

          {/* =================================================
              BARRA SUPERIOR
          ================================================== */}

          <div className="relative h-1 bg-slate-100">

            <div
              className={`absolute inset-y-0 left-0 bg-slate-950 transition-all duration-[1200ms] ${
                stage === "complete"
                  ? "w-full"
                  : "w-1/3"
              }`}
            />

          </div>

          <div className="px-5 py-8 sm:px-12 sm:py-12">

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="text-center">

              <div
                className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all duration-700 ${
                  stage === "complete"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >

                <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />

                Peak Moment

              </div>

              <p
                className={`mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-all duration-700 ${
                  stage === "complete"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
              >
                Simulacro completado
              </p>

              <h1
                className={`mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 transition-all duration-700 sm:text-4xl ${
                  stage === "complete"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                {result.title}
              </h1>

              <p
                className={`mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 transition-all duration-700 ${
                  stage === "complete"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                {result.description}
              </p>

            </div>

            {/* =================================================
                SCORE CORE
            ================================================== */}

            <div className="relative mx-auto mt-8 h-[290px] w-[290px] sm:mt-10 sm:h-[320px] sm:w-[320px]">

              {/* Anillo exterior */}

              <div
                aria-hidden="true"
                className={`absolute inset-[22px] rounded-full border border-slate-200 transition-all duration-1000 ${
                  stage === "complete"
                    ? "scale-100 opacity-100"
                    : "scale-90 opacity-0"
                }`}
              />

              {/* Anillo técnico */}

              <svg
                viewBox="0 0 240 240"
                className="absolute inset-0 h-full w-full -rotate-90"
              >

                {/* Base */}

                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-100"
                />

                {/* Segmentos */}

                <circle
                  cx="120"
                  cy="120"
                  r={radius + 12}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="1 10"
                  className="text-slate-300"
                />

                {/* Progreso */}

                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="text-slate-950"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transition:
                      "stroke-dashoffset 80ms linear",
                  }}
                />

              </svg>

              {/* Línea vertical */}

              <div
                aria-hidden="true"
                className={`absolute left-1/2 top-6 h-8 w-px -translate-x-1/2 bg-slate-300 transition-all duration-700 ${
                  stage === "complete"
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              />

              {/* SCORE */}

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="text-center">

                  <p
                    className={`mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 transition-all duration-500 ${
                      stage === "complete"
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    Score
                  </p>

                  <div
                    className={`font-black tracking-[-0.07em] text-slate-950 transition-all duration-700 ${
                      stage === "analysis"
                        ? "scale-90 opacity-0"
                        : "scale-100 opacity-100"
                    }`}
                  >
                    <span className="text-[5rem] leading-none sm:text-[6rem]">
                      {score}
                    </span>

                    <span className="ml-1 text-3xl text-slate-400 sm:text-4xl">
                      %
                    </span>
                  </div>

                  <p
                    className={`mt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400 transition-all duration-700 ${
                      stage === "complete"
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0"
                    }`}
                  >
                    {result.eyebrow}
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                MÉTRICAS
            ================================================== */}

            <div
              className={`transition-all duration-700 ${
                stage === "complete"
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}
            >

              <div className="mb-3 text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Desglose del intento
                </span>
              </div>

              <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200">

                <Metric
                  value={correctAnswers}
                  label="Correctas"
                  type="positive"
                />

                <Metric
                  value={incorrectAnswers}
                  label="Incorrectas"
                  type="negative"
                />

                <Metric
                  value={Math.max(
                    0,
                    totalQuestions -
                      correctAnswers -
                      incorrectAnswers
                  )}
                  label="Sin responder"
                  type="neutral"
                />

              </div>

            </div>

            {/* =================================================
                ACCIONES
            ================================================== */}

            <div
              className={`mt-8 transition-all duration-700 ${
                stage === "complete"
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}
            >

              <button
                type="button"
                onClick={onRetry}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_15px_35px_rgba(15,23,42,0.18)] active:translate-y-0"
              >

                <RotateCcw
                  size={16}
                  className="transition-transform duration-500 group-hover:-rotate-90"
                />

                Reintentar simulacro

                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />

              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/simulacros"
                  )
                }
                className="group mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-500 transition duration-300 hover:bg-slate-50 hover:text-slate-900"
              >

                <ArrowLeft
                  size={15}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />

                Volver a simulacros

              </button>

            </div>

          </div>

          {/* =================================================
              FOOTER TECNOLÓGICO
          ================================================== */}

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:px-12">

            <div className="flex items-center justify-between gap-4">

              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                PeakScore
              </span>

              <span className="text-[9px] font-bold text-slate-400">
                Tu progreso. Medido.
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CSS
      ====================================================== */}

      <style jsx>{`
        .peak-results {
          animation: peakEnter 700ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .peak-particle {
          animation: peakParticle 1000ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        @keyframes peakEnter {
          from {
            opacity: 0;
            transform: translateY(24px)
              scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes peakParticle {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%)
              scale(0);
          }

          15% {
            opacity: 0.8;
            transform: translate(-50%, -50%)
              scale(1);
          }

          100% {
            opacity: 0;
            transform:
              translate(
                calc(-50% + var(--x)),
                calc(-50% + var(--y))
              )
              scale(0.25);
          }
        }

        @media (max-width: 640px) {
          .peak-particle {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .peak-results,
          .peak-particle {
            animation: none;
          }
        }
      `}</style>

    </main>
  );
}

/*
 * =========================================================
 * MÉTRICA
 * =========================================================
 */

function Metric({
  value,
  label,
  type,
}: {
  value: number;
  label: string;
  type: "positive" | "negative" | "neutral";
}) {
  const valueClass =
    type === "positive"
      ? "text-emerald-600"
      : type === "negative"
        ? "text-slate-900"
        : "text-slate-400";

  const dotClass =
    type === "positive"
      ? "bg-emerald-500"
      : type === "negative"
        ? "bg-slate-300"
        : "bg-slate-200";

  return (
    <div className="border-r border-slate-200 p-4 text-center last:border-r-0 sm:p-5">

      <div className="mx-auto flex items-center justify-center gap-2">

        <span
          className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
        />

        <span
          className={`text-2xl font-black ${valueClass}`}
        >
          {value}
        </span>

      </div>

      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-[9px]">
        {label}
      </p>

    </div>
  );
}