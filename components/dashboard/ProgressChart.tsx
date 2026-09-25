"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/browser";

/* ============================================================
   PROPS
============================================================ */

interface ProgressChartProps {
  userId: string;
}

/* ============================================================
   TIPOS
============================================================ */

interface SimulationAttempt {
  id: string;
  simulation_id: string;
  score: number | null;
  completed_at: string | null;
  started_at: string | null;
}

interface SimulationMeta {
  id: string;
  type: string | null;
  session: number | null;
}

interface SimulationAnswer {
  attempt_id: string;
  question_id: string;
  is_correct: boolean | null;
}

interface QuestionSubject {
  id: string;
  subject: string | null;
}

interface CompleteRun {
  id: string;
  session1: SimulationAttempt;
  session2: SimulationAttempt;
  score: number;
  completedAt: string;
}

interface ChartPoint {
  label: string;
  score: number;
  date: string;
  x: number;
  y: number;
}

/* ============================================================
   CONSTANTES
============================================================ */

const MAX_SCORE = 500;

/* ============================================================
   NORMALIZAR TEXTO
============================================================ */

function normalizeText(value: string | null) {
  return (
    value
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim() ?? ""
  );
}

/* ============================================================
   CALCULAR PUNTAJE GLOBAL
============================================================ */

function calculateGlobalScore(
  answers: SimulationAnswer[],
  questions: QuestionSubject[],
) {
  const questionMap = new Map<string, string>();

  for (const question of questions) {
    questionMap.set(
      question.id,
      normalizeText(question.subject),
    );
  }

  const totals = {
    matematicas: 0,
    lectura: 0,
    sociales: 0,
    ciencias: 0,
    ingles: 0,
  };

  const correct = {
    matematicas: 0,
    lectura: 0,
    sociales: 0,
    ciencias: 0,
    ingles: 0,
  };

  for (const answer of answers) {
    const subject =
      questionMap.get(answer.question_id) ?? "";

    let key:
      | keyof typeof totals
      | null = null;

    if (subject.includes("matem")) {
      key = "matematicas";
    } else if (subject.includes("lectura")) {
      key = "lectura";
    } else if (subject.includes("sociales")) {
      key = "sociales";
    } else if (subject.includes("ciencias")) {
      key = "ciencias";
    } else if (subject.includes("ingles")) {
      key = "ingles";
    }

    if (!key) continue;

    totals[key] += 1;

    if (answer.is_correct === true) {
      correct[key] += 1;
    }
  }

  const percentage = {
    matematicas:
      totals.matematicas > 0
        ? (correct.matematicas / totals.matematicas) * 100
        : 0,

    lectura:
      totals.lectura > 0
        ? (correct.lectura / totals.lectura) * 100
        : 0,

    sociales:
      totals.sociales > 0
        ? (correct.sociales / totals.sociales) * 100
        : 0,

    ciencias:
      totals.ciencias > 0
        ? (correct.ciencias / totals.ciencias) * 100
        : 0,

    ingles:
      totals.ingles > 0
        ? (correct.ingles / totals.ingles) * 100
        : 0,
  };

  /*
   * Ponderación actual de PeakScore:
   *
   * Matemáticas      × 3
   * Lectura Crítica  × 3
   * Sociales         × 3
   * Ciencias         × 3
   * Inglés           × 1
   *
   * Total = 13
   */

  const weighted =
    percentage.matematicas * 3 +
    percentage.lectura * 3 +
    percentage.sociales * 3 +
    percentage.ciencias * 3 +
    percentage.ingles;

  return Math.round((weighted / 13) * 5);
}

/* ============================================================
   FECHA
============================================================ */

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "short",
    },
  );
}

/* ============================================================
   COMPONENTE
============================================================ */

export default function ProgressChart({
  userId,
}: ProgressChartProps) {
  const gradientId = useId();

  const [completeRuns, setCompleteRuns] =
    useState<CompleteRun[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* ==========================================================
     CARGAR SIMULACROS COMPLETOS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadCompleteRuns() {
      if (!userId) {
        setCompleteRuns([]);
        setLoading(false);
        return;
      }

      try {
        /* ======================================================
           1. INTENTOS FINALIZADOS
        ====================================================== */

        const {
          data: attemptRows,
          error: attemptsError,
        } = await supabase
          .from("simulation_attempts")
          .select(
            `
              id,
              simulation_id,
              score,
              completed_at,
              started_at
            `,
          )
          .eq("user_id", userId)
          .not("completed_at", "is", null)
          .order("completed_at", {
            ascending: true,
          });

        if (attemptsError) {
          console.warn(
            "[PeakScore] No fue posible cargar los intentos:",
            attemptsError,
          );

          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        const attempts =
          (attemptRows ?? []) as SimulationAttempt[];

        if (attempts.length === 0) {
          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        /* ======================================================
           2. OBTENER SIMULACIONES
        ====================================================== */

        const simulationIds = Array.from(
          new Set(
            attempts
              .map(
                (attempt) =>
                  attempt.simulation_id,
              )
              .filter(Boolean),
          ),
        );

        if (simulationIds.length === 0) {
          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        const {
          data: simulationRows,
          error: simulationsError,
        } = await supabase
          .from("simulations")
          .select(
            "id, type, session",
          )
          .in("id", simulationIds);

        if (simulationsError) {
          console.warn(
            "[PeakScore] No fue posible cargar las simulaciones:",
            simulationsError,
          );

          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        const simulations =
          (simulationRows ?? []) as SimulationMeta[];

        const simulationMap =
          new Map<string, SimulationMeta>();

        for (const simulation of simulations) {
          simulationMap.set(
            simulation.id,
            simulation,
          );
        }

        /* ======================================================
           3. FILTRAR ÚNICAMENTE COMPLETOS
        ====================================================== */

        const completeAttempts =
          attempts.filter((attempt) => {
            const simulation =
              simulationMap.get(
                attempt.simulation_id,
              );

            if (!simulation) {
              return false;
            }

            const type =
              normalizeText(simulation.type);

            return (
              type === "completo" &&
              (
                simulation.session === 1 ||
                simulation.session === 2
              )
            );
          });

        if (completeAttempts.length === 0) {
          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        /* ======================================================
           4. SEPARAR SESIONES
        ====================================================== */

        const session1Attempts =
          completeAttempts
            .filter(
              (attempt) =>
                simulationMap.get(
                  attempt.simulation_id,
                )?.session === 1,
            )
            .sort(
              (a, b) =>
                new Date(
                  a.completed_at ?? 0,
                ).getTime() -
                new Date(
                  b.completed_at ?? 0,
                ).getTime(),
            );

        const session2Attempts =
          completeAttempts
            .filter(
              (attempt) =>
                simulationMap.get(
                  attempt.simulation_id,
                )?.session === 2,
            )
            .sort(
              (a, b) =>
                new Date(
                  a.completed_at ?? 0,
                ).getTime() -
                new Date(
                  b.completed_at ?? 0,
                ).getTime(),
            );

        /* ======================================================
           5. EMPAREJAR SESIÓN 1 + SESIÓN 2

           El esquema actual no tiene un identificador común
           para agrupar ambas sesiones.

           Por eso se toma para cada Sesión 2 la Sesión 1
           finalizada inmediatamente anterior que todavía
           no haya sido utilizada.
        ====================================================== */

        const usedSession1Ids =
          new Set<string>();

        const pairedRuns: Array<{
          session1: SimulationAttempt;
          session2: SimulationAttempt;
        }> = [];

        for (const session2 of session2Attempts) {
          const session2Time =
            new Date(
              session2.completed_at ?? 0,
            ).getTime();

          let candidate:
            | SimulationAttempt
            | null = null;

          for (
            let index =
              session1Attempts.length - 1;
            index >= 0;
            index--
          ) {
            const session1 =
              session1Attempts[index];

            if (
              usedSession1Ids.has(
                session1.id,
              )
            ) {
              continue;
            }

            const session1Time =
              new Date(
                session1.completed_at ?? 0,
              ).getTime();

            if (
              session1Time <=
              session2Time
            ) {
              candidate = session1;
              break;
            }
          }

          if (!candidate) {
            continue;
          }

          usedSession1Ids.add(
            candidate.id,
          );

          pairedRuns.push({
            session1: candidate,
            session2,
          });
        }

        /* ======================================================
           SI NO EXISTE SESIÓN 1 + SESIÓN 2,
           NO EXISTE SIMULACRO COMPLETO
        ====================================================== */

        if (pairedRuns.length === 0) {
          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        /* ======================================================
           6. OBTENER RESPUESTAS DE LAS DOS SESIONES
        ====================================================== */

        const attemptIds =
          pairedRuns.flatMap(
            (run) => [
              run.session1.id,
              run.session2.id,
            ],
          );

        const {
          data: answerRows,
          error: answersError,
        } = await supabase
          .from("simulation_answers")
          .select(
            `
              attempt_id,
              question_id,
              is_correct
            `,
          )
          .in(
            "attempt_id",
            attemptIds,
          );

        if (answersError) {
          console.warn(
            "[PeakScore] No fue posible cargar las respuestas:",
            answersError,
          );

          if (mounted) {
            setCompleteRuns([]);
          }

          return;
        }

        const answers =
          (answerRows ?? []) as SimulationAnswer[];

        /* ======================================================
           7. OBTENER MATERIAS
        ====================================================== */

        const questionIds =
          Array.from(
            new Set(
              answers
                .map(
                  (answer) =>
                    answer.question_id,
                )
                .filter(Boolean),
            ),
          );

        let questions: QuestionSubject[] =
          [];

        if (questionIds.length > 0) {
          const {
            data: questionRows,
            error: questionsError,
          } = await supabase
            .from("questions")
            .select(
              "id, subject",
            )
            .in(
              "id",
              questionIds,
            );

          if (questionsError) {
            console.warn(
              "[PeakScore] No fue posible cargar las materias:",
              questionsError,
            );
          } else {
            questions =
              (questionRows ?? []) as QuestionSubject[];
          }
        }

        /* ======================================================
           8. CALCULAR CADA COMPLETO
        ====================================================== */

        const calculatedRuns =
          pairedRuns.map(
            (run, index) => {
              const runAttemptIds =
                new Set([
                  run.session1.id,
                  run.session2.id,
                ]);

              const runAnswers =
                answers.filter(
                  (answer) =>
                    runAttemptIds.has(
                      answer.attempt_id,
                    ),
                );

              const score =
                calculateGlobalScore(
                  runAnswers,
                  questions,
                );

              const completedAt =
                run.session2.completed_at ??
                run.session1.completed_at ??
                new Date().toISOString();

              return {
                id:
                  `complete-${index}-` +
                  `${run.session1.id}-` +
                  `${run.session2.id}`,

                session1:
                  run.session1,

                session2:
                  run.session2,

                score,

                completedAt,
              };
            },
          );

        /* ======================================================
           9. ORDENAR CRONOLÓGICAMENTE
        ====================================================== */

        calculatedRuns.sort(
          (a, b) =>
            new Date(
              a.completedAt,
            ).getTime() -
            new Date(
              b.completedAt,
            ).getTime(),
        );

        if (mounted) {
          setCompleteRuns(
            calculatedRuns,
          );
        }
      } catch (error) {
        console.warn(
          "[PeakScore] Error cargando simulacros completos:",
          error,
        );

        if (mounted) {
          setCompleteRuns([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCompleteRuns();

    return () => {
      mounted = false;
    };
  }, [userId]);

  /* ==========================================================
     ÚLTIMOS 8 COMPLETOS
  ========================================================== */

  const visibleRuns = useMemo(
    () =>
      completeRuns.slice(-8),
    [completeRuns],
  );

  /* ==========================================================
     PUNTAJE ACTUAL
  ========================================================== */

  const latestScore =
    visibleRuns.length > 0
      ? visibleRuns[
          visibleRuns.length - 1
        ].score
      : 0;

  /* ==========================================================
     PUNTAJE ANTERIOR
  ========================================================== */

  const previousScore =
    visibleRuns.length > 1
      ? visibleRuns[
          visibleRuns.length - 2
        ].score
      : latestScore;

  const difference =
    latestScore - previousScore;

  /* ==========================================================
     PORCENTAJE
  ========================================================== */

  const percentage = Math.round(
    (latestScore / MAX_SCORE) * 100,
  );

  /* ==========================================================
     MENSAJE
  ========================================================== */

  const progressMessage =
    visibleRuns.length === 0
      ? "Tu expedición todavía no comienza."
      : latestScore >= 450
        ? "Estás muy cerca de la cima."
        : latestScore >= 350
          ? "Tu progreso empieza a tomar altura."
          : latestScore >= 250
            ? "Cada simulacro te lleva más arriba."
            : "Sigue practicando y construye tu ascenso.";

  /* ==========================================================
     PUNTOS DE LA GRÁFICA
  ========================================================== */

  const chartPoints =
    useMemo<ChartPoint[]>(
      () => {
        if (visibleRuns.length === 0) {
          return [];
        }

        const width = 1000;
        const height = 320;

        const paddingX = 50;
        const paddingY = 30;

        const usableWidth =
          width - paddingX * 2;

        const usableHeight =
          height - paddingY * 2;

        return visibleRuns.map(
          (run, index) => {
            const x =
              visibleRuns.length === 1
                ? width / 2
                : paddingX +
                  (index /
                    (visibleRuns.length - 1)) *
                    usableWidth;

            const normalized =
              Math.max(
                0,
                Math.min(
                  run.score,
                  MAX_SCORE,
                ),
              ) / MAX_SCORE;

            const y =
              height -
              paddingY -
              normalized *
                usableHeight;

            return {
              label:
                `Completo ${index + 1}`,

              score: run.score,

              date:
                formatDate(
                  run.completedAt,
                ),

              x,
              y,
            };
          },
        );
      },
      [visibleRuns],
    );

  /* ==========================================================
     PATH DE LA LÍNEA
  ========================================================== */

  const linePath = useMemo(
    () => {
      if (
        chartPoints.length === 0
      ) {
        return "";
      }

      return chartPoints
        .map(
          (point, index) => {
            if (index === 0) {
              return `M ${point.x} ${point.y}`;
            }

            const previous =
              chartPoints[
                index - 1
              ];

            const controlX =
              (previous.x +
                point.x) /
              2;

            return `
              C
              ${controlX} ${previous.y},
              ${controlX} ${point.y},
              ${point.x} ${point.y}
            `;
          },
        )
        .join(" ");
    },
    [chartPoints],
  );

  /* ==========================================================
     PATH DEL ÁREA
  ========================================================== */

  const areaPath = useMemo(
    () => {
      if (
        chartPoints.length === 0
      ) {
        return "";
      }

      const first =
        chartPoints[0];

      const last =
        chartPoints[
          chartPoints.length - 1
        ];

      return `
        ${linePath}
        L ${last.x} 320
        L ${first.x} 320
        Z
      `;
    },
    [
      chartPoints,
      linePath,
    ],
  );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <section
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-cyan-400/10
          bg-[#020914]
          shadow-[0_25px_80px_rgba(2,8,23,0.22)]
        "
      >
        <div
          className="
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-400
            to-transparent
            opacity-80
          "
        />

        <div className="animate-pulse p-7">
          <div className="h-2 w-28 rounded-full bg-cyan-400/10" />

          <div className="mt-5 h-8 w-64 rounded-lg bg-slate-800/80" />

          <div className="mt-3 h-3 w-80 rounded bg-slate-900" />

          <div className="mt-7 h-1.5 rounded-full bg-slate-900" />

          <div className="mt-7 h-[360px] rounded-[24px] bg-[#06111e]" />
        </div>
      </section>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-cyan-400/10
        bg-[#020914]
        shadow-[0_25px_80px_rgba(2,8,23,0.24)]
      "
    >
      {/* ======================================================
          BRILLO SUPERIOR
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          z-20
          h-px
          bg-gradient-to-r
          from-transparent
          via-cyan-400
          to-transparent
          opacity-80
        "
      />

      {/* ======================================================
          DECORACIÓN
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-[-140px]
          top-[-180px]
          h-[360px]
          w-[360px]
          rounded-full
          bg-cyan-400/[0.035]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          left-[-180px]
          bottom-[-180px]
          h-[360px]
          w-[360px]
          rounded-full
          bg-blue-500/[0.025]
          blur-3xl
        "
      />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          relative
          border-b
          border-white/[0.06]
          px-6
          py-6
          md:px-7
          md:py-7
        "
      >
        <div className="flex items-start justify-between gap-6">
          {/* IZQUIERDA */}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-cyan-400
                  shadow-[0_0_10px_rgba(34,211,238,0.9)]
                "
              />

              <p
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.22em]
                  text-cyan-400
                "
                style={{
                  fontFamily:
                    '"Press Start 2P", "Courier New", monospace',
                }}
              >
                RUTA DE ASCENSO
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2
                className="
                  text-[22px]
                  font-black
                  tracking-[-0.04em]
                  text-white
                  md:text-[25px]
                "
              >
                Evolución de tu puntaje
              </h2>

              {visibleRuns.length > 1 && (
                <span
                  className={`
                    rounded-lg
                    border
                    px-2.5
                    py-1.5
                    text-[8px]
                    font-black
                    ${
                      difference > 0
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                        : difference < 0
                          ? "border-red-400/20 bg-red-400/10 text-red-400"
                          : "border-slate-700 bg-slate-800/40 text-slate-400"
                    }
                  `}
                >
                  {difference > 0
                    ? `+${difference} pts`
                    : difference < 0
                      ? `${difference} pts`
                      : "0 pts"}
                </span>
              )}
            </div>

            <p className="mt-2 text-[11px] font-medium text-slate-500">
              {progressMessage}
            </p>
          </div>

          {/* DERECHA */}

          <div className="shrink-0 text-right">
            <p
              className="
                text-[7px]
                font-black
                uppercase
                tracking-[0.18em]
                text-slate-600
              "
              style={{
                fontFamily:
                  '"Press Start 2P", "Courier New", monospace',
              }}
            >
              PUNTAJE ACTUAL
            </p>

            <div className="mt-1 flex items-baseline justify-end gap-1">
              <span
                className="
                  text-[31px]
                  font-black
                  leading-none
                  tracking-[-0.06em]
                  text-white
                "
              >
                {latestScore}
              </span>

              <span className="text-[8px] font-bold text-slate-600">
                /500
              </span>
            </div>

            <p className="mt-1 text-[7px] font-black text-cyan-400/70">
              {percentage}% de la cima
            </p>
          </div>
        </div>

        {/* ====================================================
            BARRA
        ==================================================== */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="
                text-[7px]
                font-black
                uppercase
                tracking-[0.15em]
                text-slate-600
              "
            >
              PROGRESO DE ASCENSO
            </span>

            <span className="text-[7px] font-black text-slate-600">
              {latestScore} / 500
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                via-cyan-400
                to-blue-400
                shadow-[0_0_12px_rgba(34,211,238,0.45)]
                transition-all
                duration-700
              "
              style={{
                width:
                  `${Math.max(
                    percentage,
                    visibleRuns.length > 0
                      ? 1
                      : 0,
                  )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          RESUMEN
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-2
          border-b
          border-white/[0.06]
        "
      >
        <div
          className="
            border-r
            border-white/[0.06]
            px-6
            py-5
            md:px-7
          "
        >
          <p
            className="
              text-[7px]
              font-black
              uppercase
              tracking-[0.15em]
              text-slate-600
            "
            style={{
              fontFamily:
                '"Press Start 2P", "Courier New", monospace',
            }}
          >
            PUNTAJE ACTUAL
          </p>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[29px] font-black tracking-[-0.05em] text-white">
              {latestScore}
            </span>

            <span className="text-[8px] font-bold text-slate-600">
              / 500
            </span>
          </div>
        </div>

        <div className="px-6 py-5 md:px-7">
          <p
            className="
              text-[7px]
              font-black
              uppercase
              tracking-[0.15em]
              text-slate-600
            "
            style={{
              fontFamily:
                '"Press Start 2P", "Courier New", monospace',
            }}
          >
            SIMULACROS COMPLETOS
          </p>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[29px] font-black tracking-[-0.05em] text-white">
              {completeRuns.length}
            </span>

            <span className="text-[8px] font-bold text-slate-600">
              finalizados
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          ESTADO SIN SIMULACROS COMPLETOS
      ====================================================== */}

      {visibleRuns.length === 0 ? (
        <div className="p-4 md:p-5">
          <div
            className="
              relative
              aspect-[3/1]
              min-h-[300px]
              overflow-hidden
              rounded-[22px]
              border
              border-cyan-400/10
              bg-[#06111e]
            "
          >
            {/* IMAGEN PEAKSCORE */}

            <Image
              src="/dashboard/peakyprogress3.png"
              alt="Primera expedición PeakScore"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 900px"
              className="
                object-cover
                object-center
              "
            />

            {/* OSCURECIMIENTO MUY SUTIL */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-t
                from-[#020914]/30
                via-transparent
                to-[#020914]/10
              "
            />

            {/* BORDE INTERIOR */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                rounded-[22px]
                ring-1
                ring-inset
                ring-white/[0.04]
              "
            />
          </div>

          <div className="mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-cyan-400
                  shadow-[0_0_8px_rgba(34,211,238,0.8)]
                "
              />

              <span
                className="
                  text-[7px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                  text-slate-600
                "
              >
                SESIÓN 1 + SESIÓN 2
              </span>
            </div>

            <span className="text-[7px] font-bold text-slate-700">
              Completa ambas sesiones para comenzar
            </span>
          </div>
        </div>
      ) : (
        /* ====================================================
           GRÁFICA CON DATOS
        ==================================================== */

        <div className="relative p-4 md:p-5">
          <div
            className="
              relative
              overflow-hidden
              rounded-[22px]
              border
              border-cyan-400/[0.08]
              bg-[#040d18]
            "
          >
            {/* DECORACIÓN DE FONDO */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                opacity-30
              "
              style={{
                backgroundImage:
                  `
                  radial-gradient(
                    circle at 15% 85%,
                    rgba(34,211,238,0.08),
                    transparent 28%
                  ),
                  radial-gradient(
                    circle at 85% 15%,
                    rgba(59,130,246,0.07),
                    transparent 28%
                  )
                `,
              }}
            />

            {/* GRID VERTICAL */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                opacity-[0.12]
              "
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(34,211,238,0.055) 1px, transparent 1px)",
                backgroundSize:
                  "20% 100%",
              }}
            />

            {/* NIVELES */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                flex
                flex-col
                justify-between
                px-3
                py-5
              "
            >
              {[500, 375, 250, 125, 0].map(
                (score) => (
                  <div
                    key={score}
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <span
                      className="
                        w-8
                        text-right
                        text-[7px]
                        font-black
                        text-slate-700
                      "
                    >
                      {score}
                    </span>

                    <div
                      className="
                        h-px
                        flex-1
                        border-t
                        border-dashed
                        border-cyan-400/[0.06]
                      "
                    />
                  </div>
                ),
              )}
            </div>

            {/* TÍTULO INTERNO */}

            <div className="relative z-10 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="
                      text-[7px]
                      font-black
                      uppercase
                      tracking-[0.18em]
                      text-cyan-400
                    "
                  >
                    RUTA DE ASCENSO
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    Evolución de tus simulacros completos
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border
                    border-cyan-400/10
                    bg-[#071522]/80
                    px-3
                    py-2
                    backdrop-blur-md
                  "
                >
                  <p
                    className="
                      text-[6px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-slate-600
                    "
                  >
                    ÚLTIMO COMPLETO
                  </p>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[14px] font-black text-cyan-300">
                      {latestScore}
                    </span>

                    <span className="text-[7px] font-bold text-slate-600">
                      /500
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG */}

            <div className="relative mt-2 h-[330px] w-full">
              <svg
                viewBox="0 0 1000 320"
                preserveAspectRatio="none"
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                "
              >
                <defs>
                  {/* ÁREA */}

                  <linearGradient
                    id={`area-${gradientId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#22d3ee"
                      stopOpacity="0.18"
                    />

                    <stop
                      offset="55%"
                      stopColor="#0ea5e9"
                      stopOpacity="0.055"
                    />

                    <stop
                      offset="100%"
                      stopColor="#020914"
                      stopOpacity="0"
                    />
                  </linearGradient>

                  {/* LÍNEA */}

                  <linearGradient
                    id={`line-${gradientId}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#06b6d4"
                    />

                    <stop
                      offset="50%"
                      stopColor="#22d3ee"
                    />

                    <stop
                      offset="100%"
                      stopColor="#60a5fa"
                    />
                  </linearGradient>

                  {/* GLOW */}

                  <filter
                    id={`glow-${gradientId}`}
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
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
                </defs>

                {/* ÁREA */}

                <path
                  d={areaPath}
                  fill={`url(#area-${gradientId})`}
                />

                {/* GLOW */}

                <path
                  d={linePath}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.08"
                  filter={`url(#glow-${gradientId})`}
                />

                {/* LÍNEA */}

                <path
                  d={linePath}
                  fill="none"
                  stroke={`url(#line-${gradientId})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* PUNTOS */}

                {chartPoints.map(
                  (point, index) => (
                    <g
                      key={`${point.label}-${point.date}-${index}`}
                    >
                      {/* HALO */}

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="18"
                        fill="#22d3ee"
                        opacity="0.045"
                      />

                      {/* ANILLO EXTERIOR */}

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="10"
                        fill="#020914"
                        stroke="#0891b2"
                        strokeWidth="2"
                      />

                      {/* NÚCLEO */}

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#67e8f9"
                      />

                      {/* ÚLTIMO PUNTO */}

                      {index ===
                        chartPoints.length - 1 && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="17"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1"
                          opacity="0.25"
                        />
                      )}
                    </g>
                  ),
                )}
              </svg>
            </div>

            {/* ETIQUETAS */}

            <div
              className="
                relative
                border-t
                border-white/[0.035]
                px-7
                py-4
              "
            >
              <div className="flex justify-between gap-3">
                {visibleRuns.map(
                  (run, index) => (
                    <div
                      key={run.id}
                      className="min-w-0 text-center"
                    >
                      <div
                        className={`
                          mx-auto
                          mb-2
                          h-1
                          w-1
                          rounded-full
                          ${
                            index ===
                            visibleRuns.length - 1
                              ? "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                              : "bg-slate-700"
                          }
                        `}
                      />

                      <p
                        className={`
                          text-[7px]
                          font-black
                          ${
                            index ===
                            visibleRuns.length - 1
                              ? "text-cyan-400"
                              : "text-slate-600"
                          }
                        `}
                      >
                        Completo {index + 1}
                      </p>

                      <p className="mt-1 text-[7px] font-bold text-slate-700">
                        {formatDate(
                          run.completedAt,
                        )}
                      </p>

                      <p
                        className={`
                          mt-1
                          text-[9px]
                          font-black
                          ${
                            index ===
                            visibleRuns.length - 1
                              ? "text-white"
                              : "text-slate-500"
                          }
                        `}
                      >
                        {run.score}
                        <span className="ml-0.5 text-[6px] text-slate-700">
                          pts
                        </span>
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* ====================================================
              PIE
          ==================================================== */}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-cyan-400
                  shadow-[0_0_8px_rgba(34,211,238,0.8)]
                "
              />

              <span
                className="
                  text-[7px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                  text-slate-600
                "
              >
                SESIÓN 1 + SESIÓN 2
              </span>
            </div>

            <span className="text-[7px] font-bold text-slate-700">
              Meta máxima: 500 pts
            </span>
          </div>
        </div>
      )}
    </section>
  );
}