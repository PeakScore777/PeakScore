"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

type TutorReviewItem = {
  questionId: string;
  number: number;
  question: string;
  context: string | null;
  options: Record<string, string>;
  selectedAnswer: string | null;
  correctAnswer: string;
  explanation: string;
  whyYourAnswer?: string;
  method: string;
  tip: string;
  source: "ai" | "official" | "unavailable";
};

type TutorReview = {
  source: "ai" | "official" | "none";
  summary: string;
  items: TutorReviewItem[];
};

function formatTutorExplanation(explanation: string): string {
  return explanation
    .trim()
    .replace(/\s*(Paso\s*[1-3]:)/gi, "\n$1")
    .replace(/^\n/, "");
}

type ExamResultsProps = {
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredAnswers: number;
  totalQuestions: number;
  percentage: number;
  simulationId: string;
  attemptId: string | null;
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
  unansweredAnswers,
  totalQuestions,
  percentage,
  simulationId,
  attemptId,
  onRetry,
}: ExamResultsProps) {
  const router = useRouter();

  const [tutorStatus, setTutorStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [tutorReview, setTutorReview] = useState<TutorReview | null>(null);
  const [tutorError, setTutorError] = useState("");

  const requestTutorReview = useCallback(async () => {
    if (tutorStatus === "loading" || tutorStatus === "ready") return;

    if (!attemptId) {
      setTutorStatus("error");
      setTutorError("No encontramos el intento guardado para preparar la revisión.");
      return;
    }

    setTutorStatus("loading");
    setTutorError("");

    try {
      const response = await fetch(
        `/api/simulations/${simulationId}/tutor-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId }),
        },
      );
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        source?: TutorReview["source"];
        summary?: string;
        items?: TutorReviewItem[];
      };

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "TUTOR no pudo revisar este intento en este momento.",
        );
      }

      setTutorReview({
        source: data.source ?? "official",
        summary:
          data.summary ??
          "Revisemos tus errores y convirtámoslos en una oportunidad para mejorar.",
        items: Array.isArray(data.items) ? data.items : [],
      });
      setTutorStatus("ready");
    } catch (error) {
      setTutorError(
        error instanceof Error
          ? error.message
          : "No pudimos cargar la explicación de TUTOR.",
      );
      setTutorStatus("error");
    }
  }, [attemptId, simulationId, tutorStatus]);

  useEffect(() => {
    if (tutorStatus === "idle") {
      void requestTutorReview();
    }
  }, [requestTutorReview, tutorStatus]);

  const [stage, setStage] = useState<
    "analysis" | "reveal" | "complete"
  >("analysis");

  const [score, setScore] = useState(0);

  const safePercentage = Math.max(
    0,
    Math.min(100, percentage)
  );

  const unansweredCount = Math.max(
    0,
    unansweredAnswers,
    totalQuestions - correctAnswers - incorrectAnswers,
  );

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

      <section className="peak-results relative z-10 w-full max-w-6xl">

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

          <div className="px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
              <div className="min-w-0">

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

                RESUMEN DE TU PRÁCTICA

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

              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    RESULTADO GENERAL
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                    Así te fue
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {correctAnswers} de {totalQuestions} correctas
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
                  value={unansweredCount}
                  label="Sin responder"
                  type="neutral"
                />

              </div>

            </div>

              </div>

              <div className="min-w-0">
            {/* =================================================
                TUTOR — EXPLICACIÓN DE ERRORES
            ================================================== */}
            <section className="mt-8 overflow-hidden rounded-[24px] border border-violet-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.06)] lg:mt-0">
              <div className="flex flex-wrap items-center gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-5 sm:px-7">
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
                  <img
                    src="/avatars/photo_perfil/orbyp.png"
                    alt="Orby, tu TUTOR"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                      <Sparkles size={12} />
                      TUTOR
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Repaso personalizado
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                    Convierte tus errores en aprendizaje
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                    No solo verás la clave. TUTOR te ayuda a identificar la pista, seguir el razonamiento y reconocer una pregunta parecida la próxima vez.
                  </p>
                </div>

                {tutorStatus !== "loading" && tutorStatus !== "ready" && (
                  <button
                    type="button"
                    onClick={() => void requestTutorReview()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <Sparkles size={16} />
                    {tutorStatus === "error" ? "Intentar de nuevo" : "Explicar mis errores"}
                  </button>
                )}
              </div>

              {tutorStatus === "idle" && (
                <div className="px-5 py-5 sm:px-7">
                  <p className="text-sm leading-6 text-slate-500">
                    Cuando estés listo, pídele a TUTOR que revise este intento. La calificación se conserva mientras repasas.
                  </p>
                </div>
              )}

              {tutorStatus === "loading" && (
                <div className="flex items-center gap-4 px-5 py-7 sm:px-7">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <LoaderCircle size={22} className="animate-spin" />
                  </span>
                  <div>
                    <p className="font-extrabold text-slate-900">Orby está preparando tus explicaciones…</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Está comparando tus respuestas con la clave y los criterios de la pregunta.
                    </p>
                  </div>
                </div>
              )}

              {tutorStatus === "error" && (
                <div className="px-5 py-5 sm:px-7">
                  <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    {tutorError || "TUTOR no está disponible temporalmente. Puedes volver a intentarlo."}
                  </p>
                </div>
              )}

              {tutorStatus === "ready" && tutorReview && (
                <div className="space-y-4 px-4 py-5 sm:px-7 sm:py-6">
                  <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-4 sm:p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
                      <BookOpenCheck size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">
                        Tu plan de mejora
                      </p>
                      <p className="mt-1 text-sm leading-6 text-violet-950">
                        {tutorReview.summary}
                      </p>
                    </div>
                  </div>

                  {tutorReview.items.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="font-extrabold text-emerald-900">
                        ¡Excelente! No tienes errores por repasar.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Mantén la práctica y sigue fortaleciendo tu preparación.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tutorReview.items.map((item) => (
                        <article
                          key={item.questionId}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                            <p className="text-sm font-black text-slate-900">
                              Pregunta {item.number}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700">
                                Tu respuesta: {item.selectedAnswer ?? "Sin responder"}
                              </span>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                Correcta: {item.correctAnswer}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                <Sparkles size={16} />
                              </span>
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-extrabold text-slate-900">
                                    {item.source === "ai" ? "Explicación personalizada de TUTOR" : item.source === "official" ? "Explicación del banco de preguntas" : "Guía de repaso"}
                                  </p>
                                  {item.source === "official" && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                      Sin explicación de IA
                                    </span>
                                  )}
                                  {item.source === "unavailable" && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                      Sin explicación disponible
                                    </span>
                                  )}
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                  {formatTutorExplanation(item.explanation)}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
                                <p className="text-[10px] font-black uppercase tracking-wide text-rose-700">
                                  {item.selectedAnswer ? "Lo que marcaste" : "Tu respuesta"}
                                </p>
                                <p className="mt-1 text-sm font-bold leading-5 text-rose-950">
                                  {item.selectedAnswer
                                    ? `${item.selectedAnswer}. ${item.options[item.selectedAnswer] ?? "Opción seleccionada"}`
                                    : "La dejaste sin responder"}
                                </p>
                                {item.whyYourAnswer && (
                                  <p className="mt-2 text-xs leading-5 text-rose-900">
                                    {item.whyYourAnswer}
                                  </p>
                                )}
                              </div>
                              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                                  La respuesta correcta
                                </p>
                                <p className="mt-1 text-sm font-bold leading-5 text-emerald-950">
                                  {item.correctAnswer}. {item.options[item.correctAnswer] ?? "Respuesta correcta"}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-emerald-900">
                                  Busca la pista que conecta esta opción con lo que pregunta el enunciado.
                                </p>
                              </div>
                            </div>

                            {item.method && (
                              <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
                                <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-900">
                                  <BookOpenCheck size={14} />
                                  Cómo resolver una similar
                                </p>
                                <p className="text-sm leading-6 text-cyan-950">{item.method}</p>
                              </div>
                            )}

                            {item.tip && (
                              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                                <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-900">
                                  <Lightbulb size={14} />
                                  Consejo de Orby
                                </p>
                                <p className="text-sm leading-6 text-amber-950">{item.tip}</p>
                              </div>
                            )}

                            <details className="group rounded-xl border border-slate-200">
                              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                Ver enunciado y opciones
                              </summary>
                              <div className="space-y-3 border-t border-slate-100 p-4">
                                {item.context && (
                                  <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                                    {item.context}
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">
                                  {item.question}
                                </p>
                                <div className="space-y-2">
                                  {Object.entries(item.options).map(([letter, optionText]) => (
                                    <div
                                      key={letter}
                                      className={[
                                        "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm leading-6",
                                        letter === item.correctAnswer
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                                          : letter === item.selectedAnswer
                                            ? "border-rose-200 bg-rose-50 text-rose-950"
                                            : "border-slate-100 bg-white text-slate-600",
                                      ].join(" ")}
                                    >
                                      <span className="font-black">{letter}.</span>
                                      <span className="min-w-0 flex-1">{optionText}</span>
                                      {letter === item.correctAnswer && (
                                        <Check size={15} className="mt-1 shrink-0 text-emerald-700" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </details>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {tutorReview.items.some((item) => item.source !== "ai") && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                      Algunas preguntas usan la explicación guardada en el banco porque TUTOR no pudo personalizarlas en este intento. Las tarjetas indican la fuente; puedes reintentar para solicitar otra revisión.
                    </p>
                  )}
                </div>
              )}
            </section>

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
                    "/simulacros"
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