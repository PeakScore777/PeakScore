"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MoreVertical,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import {
  getSimulations,
  type Simulation,
} from "@/lib/services/simulation.service";

interface Attempt {
  id: string;
  score: number | null;
  correct_answers: number | null;
  incorrect_answers: number | null;
  unanswered_answers: number | null;
  completed_at: string | null;
}

interface SimulationStatus {
  status: "not_started" | "in_progress" | "completed";
  answered: number;
  currentQuestion: number;
  timeLeft: number;
  attempt: Attempt | null;
}

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [statuses, setStatuses] = useState<
    Record<string, SimulationStatus>
  >({});
  const [loading, setLoading] = useState(true);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<string | null>(null);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const simulationsData = await getSimulations();

        setSimulations(simulationsData);

        const statusMap: Record<
          string,
          SimulationStatus
        > = {};

        await Promise.all(
          simulationsData.map(async (simulation) => {
            try {
              const response = await fetch(
                `/api/simulations/${simulation.id}/progress`,
                {
                  method: "GET",
                  cache: "no-store",
                }
              );

              const data = await response.json();

              if (!response.ok || !data.success) {
                return;
              }

              const answers = Array.isArray(data.answers)
                ? data.answers
                : [];

              const activeAttempt =
                data.attempt &&
                data.attempt.completed_at === null
                  ? data.attempt
                  : null;

              const isCompleted =
                data.completed === true ||
                data.status === "completed" ||
                Boolean(data.lastCompletedAttempt);

              const isInProgress =
                !isCompleted &&
                Boolean(activeAttempt);

              let status: SimulationStatus["status"] =
                "not_started";

              if (isCompleted) {
                status = "completed";
              } else if (isInProgress) {
                status = "in_progress";
              }

              const attempt = isCompleted
                ? data.lastCompletedAttempt ?? null
                : activeAttempt;

              const answered =
                answers.length > 0
                  ? answers.length
                  : activeAttempt?.current_question ?? 0;

              const timeLeft =
                activeAttempt?.time_left ??
                data.attempt?.time_left ??
                (simulation.duration ?? 90) * 60;

              statusMap[simulation.id] = {
                status,
                answered,
                currentQuestion:
                  activeAttempt?.current_question ?? 0,
                timeLeft,
                attempt,
              };
            } catch (error) {
              console.error(
                `[PeakScore] Error obteniendo estado de ${simulation.id}:`,
                error
              );
            }
          })
        );

        setStatuses(statusMap);
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando simulacros:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function formatTime(seconds: number) {
    if (!seconds || seconds <= 0) {
      return "Tiempo agotado";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes} min ${remainingSeconds
      .toString()
      .padStart(2, "0")} s`;
  }

  function requestDelete(simulationId: string) {
    if (deletingId) {
      return;
    }

    setOpenMenu(null);
    setConfirmDeleteId(simulationId);
  }

  async function handleDelete(simulationId: string) {
    if (deletingId) {
      return;
    }

    const simulation = simulations.find(
      (item) => item.id === simulationId
    );

    const simulationStatus = statuses[simulationId];

    if (
      !simulation ||
      !simulation.created_by ||
      simulationStatus?.status !== "completed"
    ) {
      setConfirmDeleteId(null);
      return;
    }

    setDeletingId(simulationId);
    setConfirmDeleteId(null);
    setOpenMenu(null);

    try {
      const response = await fetch(
        `/api/simulations/${simulationId}/delete`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "No fue posible eliminar el simulacro."
        );
      }

      setSimulations((current) =>
        current.filter(
          (simulation) =>
            simulation.id !== simulationId
        )
      );

      setStatuses((current) => {
        const updated = { ...current };

        delete updated[simulationId];

        return updated;
      });
    } catch (error) {
      console.error(
        "[PeakScore] Error eliminando simulacro:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el simulacro."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-200" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Preparación ICFES
            </p>

            <h1 className="text-4xl font-black tracking-tight text-slate-950">
              Simulacros
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Practica, mide tu rendimiento y continúa
              mejorando con cada intento.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Disponibles
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {simulations.length}
            </p>
          </div>
        </div>

        {/* CREAR SIMULACROS */}

        <section className="mb-10 grid gap-5 lg:grid-cols-2">

          {/* SIMULACRO NORMAL */}

          <Link
            href="/dashboard/simulacros/new"
            className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
          >
            <div className="absolute left-0 top-0 h-1 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />

            <div className="flex items-start justify-between gap-5">

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  Práctica personalizada
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Simulacro normal
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Elige la materia, cantidad de preguntas
                  y dificultad para crear una práctica a
                  tu medida.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600">
                <ArrowRight
                  size={19}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </div>

            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Configurar simulacro</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* SIMULACRO COMPLETO */}

          <Link
            href="/dashboard/simulacros/completo"
            className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute left-0 top-0 h-1 w-0 bg-white transition-all duration-300 group-hover:w-full" />

            <div className="flex items-start justify-between gap-5">

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Prueba completa
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Simulacro completo
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                  Presenta una prueba completa organizada
                  por PeakScore con una estructura más
                  cercana al examen real.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-all duration-300 group-hover:bg-white/10">
                <ArrowRight
                  size={19}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </div>

            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span>Ver simulacro completo</span>
              <ArrowRight size={14} />
            </div>
          </Link>

        </section>

        {/* SIN SIMULACROS */}

        {simulations.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">
              No hay simulacros disponibles
            </h2>

            <p className="mt-2 text-slate-600">
              Todavía no hay simulacros registrados en
              la plataforma.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {simulations.map((simulation) => {
              const simulationStatus =
                statuses[simulation.id];

              const status =
                simulationStatus?.status ??
                "not_started";

              const isInProgress =
                status === "in_progress";

              const isCompleted =
                status === "completed";

              const answered =
                simulationStatus?.answered ?? 0;

              const total =
                simulation.total_questions;

              const percentage =
                total > 0
                  ? Math.min(
                      Math.round(
                        (answered / total) * 100
                      ),
                      100
                    )
                  : 0;

              const description =
                simulation.description ??
                "Practica con preguntas tipo ICFES y evalúa tu desempeño.";

              const subject =
                simulation.subject ??
                simulation.type;

              const duration =
                simulation.duration ?? 90;

              const difficulty =
                simulation.difficulty ?? "Media";

              const attempt =
                simulationStatus?.attempt;

              const isDeleting =
                deletingId === simulation.id;

              const isUserSimulation =
                Boolean(simulation.created_by);

              const canDelete =
                isUserSimulation &&
                isCompleted;

              return (
                <article
                  key={simulation.id}
                  className="group relative overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* COLOR */}

                  <div
                    className={`h-2 w-full rounded-t-[28px] ${
                      simulation.color ??
                      "bg-blue-600"
                    }`}
                  />

                  {/* MENÚ */}

                  {canDelete && (
                    <div className="absolute right-5 top-6 z-30">

                      <button
                        type="button"
                        onClick={() => {
                          if (isDeleting) {
                            return;
                          }

                          setOpenMenu(
                            openMenu ===
                              simulation.id
                              ? null
                              : simulation.id
                          );
                        }}
                        disabled={isDeleting}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Opciones del simulacro"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu ===
                        simulation.id && (
                        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">

                          <button
                            type="button"
                            onClick={() =>
                              requestDelete(
                                simulation.id
                              )
                            }
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />

                            Eliminar
                          </button>

                        </div>
                      )}

                    </div>
                  )}

                  <div className="p-7">

                    {/* ESTADO */}

                    <div className="mb-5 pr-10">

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                          <CheckCircle2 size={14} />
                          Finalizado
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-700">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          En progreso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600">
                          <Play size={13} />
                          Sin iniciar
                        </span>
                      )}

                    </div>

                    {/* TÍTULO */}

                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      {simulation.title}
                    </h2>

                    <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600">
                      {description}
                    </p>

                    {/* INFORMACIÓN */}

                    <div className="mt-6 grid grid-cols-2 gap-3">

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Materia
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {subject}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Preguntas
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {total}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Duración
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                          <Clock3
                            size={14}
                            className="text-slate-400"
                          />

                          {duration} min
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Dificultad
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {difficulty}
                        </p>
                      </div>

                    </div>

                    {/* PROGRESO */}

                    {isInProgress && (
                      <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">

                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-amber-900">
                              Tu progreso
                            </p>

                            <p className="mt-0.5 text-[11px] text-amber-700">
                              {answered} de{" "}
                              {total} respondidas
                            </p>
                          </div>

                          <span className="text-sm font-black text-amber-700">
                            {percentage}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-amber-100">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                          <Clock3 size={13} />

                          {formatTime(
                            simulationStatus?.timeLeft ??
                              duration * 60
                          )}{" "}
                          restantes
                        </p>

                      </div>
                    )}

                    {/* RESULTADO */}

                    {isCompleted &&
                      attempt && (
                        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                              <Trophy
                                size={20}
                                className="text-emerald-600"
                              />
                            </div>

                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                                Puntaje
                              </p>

                              <p className="text-2xl font-black text-slate-950">
                                {attempt.score ?? 0}
                              </p>
                            </div>

                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">

                            <div className="rounded-xl bg-white p-3 text-center">
                              <p className="text-lg font-black text-emerald-600">
                                {attempt.correct_answers ??
                                  0}
                              </p>

                              <p className="text-[9px] font-bold uppercase text-slate-400">
                                Correctas
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-3 text-center">
                              <p className="text-lg font-black text-red-500">
                                {attempt.incorrect_answers ??
                                  0}
                              </p>

                              <p className="text-[9px] font-bold uppercase text-slate-400">
                                Incorrectas
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-3 text-center">
                              <p className="text-lg font-black text-slate-500">
                                {attempt.unanswered_answers ??
                                  0}
                              </p>

                              <p className="text-[9px] font-bold uppercase text-slate-400">
                                Sin responder
                              </p>
                            </div>

                          </div>

                        </div>
                      )}

                    {/* BOTÓN */}

                    <Link
                      href={`/simulacros/${simulation.id}`}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black transition ${
                        isCompleted
                          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          : isInProgress
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw size={17} />
                          Repetir simulacro
                          <ArrowRight size={17} />
                        </>
                      ) : isInProgress ? (
                        <>
                          <Play size={17} />
                          Continuar
                          <ArrowRight size={17} />
                        </>
                      ) : (
                        <>
                          <Play size={17} />
                          Comenzar simulacro
                          <ArrowRight size={17} />
                        </>
                      )}
                    </Link>

                  </div>

                  {/* PIE */}

                  {isInProgress && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-7 py-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Clock3
                          size={15}
                          className="text-amber-500"
                        />

                        Tu progreso está guardado
                      </div>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-7 py-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500"
                        />

                        Simulacro completado
                      </div>
                    </div>
                  )}

                  {/* ELIMINANDO */}

                  {isDeleting && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[28px] bg-white/85 backdrop-blur-sm">

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">

                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-red-500" />

                        <span className="text-sm font-bold text-slate-700">
                          Eliminando...
                        </span>

                      </div>

                    </div>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* MODAL DE CONFIRMACIÓN */}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-5 backdrop-blur-sm">

          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >

            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Trash2 size={20} />
                </div>

                <h2
                  id="delete-title"
                  className="text-xl font-black text-slate-950"
                >
                  Eliminar simulacro
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Se eliminarán este simulacro, su progreso y sus resultados.
                  Las preguntas originales permanecerán intactas.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConfirmDeleteId(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setConfirmDeleteId(null)
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(confirmDeleteId)
                }
                disabled={Boolean(deletingId)}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId
                  ? "Eliminando..."
                  : "Sí, eliminar"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}