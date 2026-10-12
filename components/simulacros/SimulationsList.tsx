
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

const pixelFont = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontWeight: 400,
  WebkitFontSmoothing: "none" as const,
};

const backgroundStyle = {
  backgroundImage: "url('/images/backgrounds/simulacros-fondo.webp')",
};

export default function SimulationsList() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [statuses, setStatuses] = useState<
    Record<string, SimulationStatus>
  >({});
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const simulationsData = await getSimulations();
        setSimulations(simulationsData);

        const statusMap: Record<string, SimulationStatus> = {};

        await Promise.all(
          simulationsData.map(async (simulation) => {
            try {
              const response = await fetch(
                `/api/simulations/${simulation.id}/progress`,
                {
                  method: "GET",
                  cache: "no-store",
                },
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

              const isInProgress = Boolean(activeAttempt);

              const isCompleted =
                !isInProgress &&
                (data.completed === true ||
                  data.status === "completed" ||
                  Boolean(data.lastCompletedAttempt));

              let status: SimulationStatus["status"] = "not_started";

              if (isInProgress) {
                status = "in_progress";
              } else if (isCompleted) {
                status = "completed";
              }

              const attempt = isInProgress
                ? activeAttempt
                : (data.lastCompletedAttempt ?? null);

              const answered =
                answers.length > 0
                  ? answers.length
                  : (activeAttempt?.current_question ?? 0);

              const timeLeft =
                activeAttempt?.time_left ??
                data.attempt?.time_left ??
                (simulation.duration ?? 90) * 60;

              statusMap[simulation.id] = {
                status,
                answered,
                currentQuestion: activeAttempt?.current_question ?? 0,
                timeLeft,
                attempt,
              };
            } catch (error) {
              console.error(
                `[PeakScore] Error obteniendo estado de ${simulation.id}:`,
                error,
              );
            }
          }),
        );

        setStatuses(statusMap);
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando simulacros:",
          error,
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
    if (deletingId) return;

    setOpenMenu(null);
    setConfirmDeleteId(simulationId);
  }

  async function handleDelete(simulationId: string) {
    if (deletingId) return;

    const simulation = simulations.find(
      (item) => item.id === simulationId,
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
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No fue posible eliminar el simulacro.",
        );
      }

      setSimulations((current) =>
        current.filter((item) => item.id !== simulationId),
      );

      setStatuses((current) => {
        const updated = { ...current };
        delete updated[simulationId];
        return updated;
      });
    } catch (error) {
      console.error(
        "[PeakScore] Error eliminando simulacro:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el simulacro.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="relative isolate min-h-screen overflow-hidden bg-[#070813] px-4 py-10 sm:px-6 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
          style={backgroundStyle}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[#080918]/25"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-10 space-y-4">
            <div className="h-3 w-48 animate-pulse bg-white/20" />
            <div className="h-12 w-96 max-w-full animate-pulse bg-white/15" />
            <div className="h-5 w-80 max-w-full animate-pulse bg-white/15" />
          </div>

          <div className="grid gap-7 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-[480px] animate-pulse border border-white/10 bg-[#080a18]/90"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#070813] px-4 pb-16 pt-8 text-white sm:px-6 sm:pt-12 lg:px-10">
      {/* Escenario de fantasía */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
        style={backgroundStyle}
      />

      {/* Oscurecimiento suave para permitir leer el contenido */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#070813]/25 via-[#070813]/35 to-[#070813]/70"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Encabezado */}
        <header className="mb-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[3px] w-9 bg-[#8de9f2]" />

              <p
                className="text-[8px] leading-5 tracking-[0.12em] text-[#b8f8ff] sm:text-[9px]"
                style={pixelFont}
              >
                PEAKSCORE / APRENDER
              </p>
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-white [text-shadow:0_3px_20px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl">
              Tu próxima aventura
              <span className="mt-1 block text-[#a8f2fa]">
                comienza aquí.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)] sm:text-base">
              Explora tus conocimientos, supera desafíos y construye
              tu camino hacia tu mejor resultado ICFES.
            </p>
          </div>

          <div className="flex w-fit items-center gap-4 border border-white/15 bg-[#080a18]/90 px-5 py-4 shadow-[0_0_25px_rgba(105,90,190,0.15)] backdrop-blur-xl">
            <div className="h-10 w-1.5 bg-gradient-to-b from-[#8de9f2] to-[#9380d6]" />

            <div>
              <p
                className="text-[8px] leading-5 text-[#b7b4d7]"
                style={pixelFont}
              >
                TU RECORRIDO
              </p>

              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                {simulations.length}
                <span className="ml-2 text-sm font-semibold text-slate-400">
                  pruebas
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* Selección de rutas */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#8de9f2]/50 bg-[#080a18]/90">
            <span
              aria-hidden="true"
              className="h-3 w-3 rotate-45 border-2 border-[#8de9f2]"
            />
          </div>

          <div>
            <p
              className="text-[8px] leading-5 tracking-wide text-[#b8f8ff]"
              style={pixelFont}
            >
              ELIGE TU RUTA
            </p>

            <p className="mt-1 text-sm text-white">
              Cada práctica te acerca a tu objetivo.
            </p>
          </div>
        </div>

        {/* Modos principales */}
        <section className="grid items-stretch gap-7 lg:grid-cols-2">
          {/* Ruta de entrenamiento */}
          <Link
            href="/simulacros/nuevo"
            className="group relative flex min-w-0 flex-col overflow-hidden border border-[#8de9f2]/50 bg-[#080a14]/95 shadow-[0_15px_45px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-1 hover:border-[#8de9f2] hover:shadow-[0_18px_55px_rgba(83,211,238,0.12)]"
          >
            <div className="relative h-60 overflow-hidden bg-[#101329] sm:h-[280px]">
              <video
                aria-hidden="true"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
                <source
                  src="/video/simulacros/entrenamiento-personalizado.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 bg-gradient-to-t from-[#070813]/95 via-[#070813]/15 to-[#070813]/10" />

              <div className="absolute left-5 top-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border border-[#8de9f2]/70 bg-[#080a18]/90 text-sm font-black text-[#b8f8ff]">
                  01
                </span>

                <span
                  className="border border-white/20 bg-[#080a18]/85 px-3 py-2 text-[8px] leading-4 text-[#b8f8ff] backdrop-blur-md"
                  style={pixelFont}
                >
                  RUTA DISPONIBLE
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5">
                <p
                  className="text-[8px] leading-5 tracking-wide text-[#8de9f2]"
                  style={pixelFont}
                >
                  EXPLORA / PRACTICA / MEJORA
                </p>

                <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Entrena a tu manera
                </h2>
              </div>

              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-1 w-24 bg-[#8de9f2]"
              />

              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-1 w-12 bg-[#9b8be6]"
              />
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className="text-[8px] leading-5 text-[#b7b1e8]"
                  style={pixelFont}
                >
                  RUTA DE ENTRENAMIENTO
                </p>

                <span className="border border-[#8de9f2]/30 bg-[#8de9f2]/10 px-3 py-1.5 text-[10px] font-bold text-[#b8f8ff]">
                  A tu ritmo
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-[27px]">
                Entrenamiento personalizado
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Escoge la materia y la cantidad de preguntas. Practica
                los temas que necesitas reforzar y avanza a tu propio ritmo.
              </p>

              <div className="mt-6 grid grid-cols-3 border border-white/10 bg-black/25">
                <div className="border-r border-white/10 px-2 py-3 text-center sm:px-3">
                  <p
                    className="text-[7px] leading-4 text-[#8de9f2]"
                    style={pixelFont}
                  >
                    05–50
                  </p>
                  <p className="mt-2 text-xs font-bold text-white">
                    Preguntas
                  </p>
                </div>

                <div className="border-r border-white/10 px-2 py-3 text-center sm:px-3">
                  <p
                    className="text-[7px] leading-4 text-[#b7a9f5]"
                    style={pixelFont}
                  >
                    TU RUTA
                  </p>
                  <p className="mt-2 text-xs font-bold text-white">
                    Por materia
                  </p>
                </div>

                <div className="px-2 py-3 text-center sm:px-3">
                  <p
                    className="text-[7px] leading-4 text-[#8de9f2]"
                    style={pixelFont}
                  >
                    AVANCE
                  </p>
                  <p className="mt-2 text-xs font-bold text-white">
                    Resultados
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <div className="flex min-h-14 items-center justify-between gap-4 border border-[#8de9f2]/70 bg-gradient-to-r from-[#15263a] to-[#242044] px-5 py-4 text-white transition group-hover:from-[#1b394a] group-hover:to-[#30265d]">
                  <span
                    className="text-[8px] leading-5 text-[#c4faff] sm:text-[9px]"
                    style={pixelFont}
                  >
                    COMENZAR A APRENDER
                  </span>

                  <span
                    aria-hidden="true"
                    className="text-2xl text-[#8de9f2] transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Ruta del desafío integral */}
          <article className="relative flex min-w-0 flex-col overflow-hidden border border-[#a89bea]/50 bg-[#080a14]/95 shadow-[0_15px_45px_rgba(0,0,0,0.4)]">
            <div className="relative h-60 overflow-hidden bg-[#101329] sm:h-[280px]">
              <video
                aria-hidden="true"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source
                  src="/video/simulacros/desafio-icfes-integral.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 bg-gradient-to-t from-[#070813]/95 via-[#070813]/15 to-[#070813]/10" />

              <div className="absolute left-5 top-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border border-[#b7a9f5]/70 bg-[#080a18]/90 text-sm font-black text-[#d8ceff]">
                  02
                </span>

                <span
                  className="border border-white/20 bg-[#080a18]/85 px-3 py-2 text-[8px] leading-4 text-[#d8ceff] backdrop-blur-md"
                  style={pixelFont}
                >
                  NUEVA AVENTURA
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5">
                <p
                  className="text-[8px] leading-5 tracking-wide text-[#c6b9ff]"
                  style={pixelFont}
                >
                  CINCO ÁREAS / UN DESAFÍO
                </p>

                <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                  El gran desafío ICFES
                </h2>
              </div>

              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-1 w-24 bg-[#a89bea]"
              />

              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-1 w-12 bg-[#d7ceff]"
              />
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className="text-[8px] leading-5 text-[#b7b1e8]"
                  style={pixelFont}
                >
                  DESAFÍO INTEGRAL
                </p>

                <span className="border border-[#a89bea]/30 bg-[#a89bea]/10 px-3 py-1.5 text-[10px] font-bold text-[#d8ceff]">
                  Próximamente
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-[27px]">
                Prepárate para el reto completo
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Una experiencia que reunirá las cinco áreas del examen
                en una prueba integral para evaluar tu preparación.
              </p>

              <div className="mt-6 grid grid-cols-3 border border-white/10 bg-black/25">
                <div className="border-r border-white/10 px-2 py-3 text-center sm:px-3">
                  <p
                    className="text-[7px] leading-4 text-[#c6b9ff]"
                    style={pixelFont}
                  >
                    05
                  </p>
                  <p className="mt-2 text-xs font-bold text-white">
                    Áreas
                  </p>
                </div>

                <div className="border-r border-white/10 px-2 py-3 text-center sm:px-3">
                  <p
                    className="text-[7px] leading-4 text-[#c6b9ff]"
                    style={pixelFont}
                  >
                    152
                  </p>
                  <p className="mt-2 text-xs font-bold text-white">
                    Preguntas
                  </p>
                </div>

                <div className="px-2 py-3 text-center sm:px-3">
                  <p
                    className="text-[7px] leading-4 text-[#c6b9ff]"
                    style={pixelFont}
                  >
                    ICFES
                  </p>
                  <p className="mt-2 text-xs font-bold text-white">
                    Integral
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <div className="flex min-h-14 items-center justify-between gap-4 border border-[#a89bea]/30 bg-[#a89bea]/[0.07] px-5 py-4 text-[#bbb1e9]">
                  <span
                    className="text-[8px] leading-5 sm:text-[9px]"
                    style={pixelFont}
                  >
                    EN PREPARACIÓN
                  </span>

                  <span aria-hidden="true" className="text-xl">
                    ···
                  </span>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* Historial de simulacros */}
        <section className="mt-16">
          <header className="mb-6 flex flex-col gap-4 border-b border-white/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[8px] leading-5 tracking-wide text-[#b8f8ff]"
                style={pixelFont}
              >
                TU CAMINO RECORRIDO
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)] sm:text-4xl">
                Tu aventura continúa
              </h2>

              <p className="mt-2 text-sm text-white">
                Retoma tus pruebas y descubre cuánto has avanzado.
              </p>
            </div>

            <span className="w-fit border border-white/15 bg-[#080a18]/90 px-4 py-3 text-sm font-bold text-white backdrop-blur-md">
              {simulations.length} pruebas registradas
            </span>
          </header>

          {simulations.length === 0 ? (
            <div className="relative overflow-hidden border border-white/15 bg-[#080a18]/95 p-8 shadow-[0_15px_40px_rgba(0,0,0,0.3)] sm:p-10">
              <div
                aria-hidden="true"
                className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-[#8de9f2] via-[#a89bea] to-transparent"
              />

              <p
                className="text-[8px] leading-5 text-[#8de9f2]"
                style={pixelFont}
              >
                PUNTO DE PARTIDA
              </p>

              <h3 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                Tu primera aventura te espera
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Inicia tu primer entrenamiento para registrar tu progreso
                y consultar los resultados que vayas obteniendo.
              </p>

              <Link
                href="/simulacros/nuevo"
                className="mt-7 inline-flex min-h-12 items-center justify-between gap-5 border border-[#8de9f2]/60 bg-[#14263a] px-5 py-3 text-sm font-black text-[#c4faff] transition hover:bg-[#1b394a]"
              >
                Comenzar mi recorrido
                <span aria-hidden="true" className="text-xl">
                  →
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {simulations.map((simulation, index) => {
                const simulationStatus = statuses[simulation.id];
                const status = simulationStatus?.status ?? "not_started";

                const isInProgress = status === "in_progress";
                const isCompleted = status === "completed";

                const answered = simulationStatus?.answered ?? 0;
                const total = simulation.total_questions;

                const percentage =
                  total > 0
                    ? Math.min(
                        Math.round((answered / total) * 100),
                        100,
                      )
                    : 0;

                const description =
                  simulation.description ??
                  "Simulacro personalizado para practicar y medir tu desempeño.";

                const subject = simulation.subject ?? simulation.type;
                const duration = simulation.duration ?? 90;
                const difficulty = simulation.difficulty ?? "Media";
                const attempt = simulationStatus?.attempt;

                const isDeleting = deletingId === simulation.id;

                const canDelete =
                  Boolean(simulation.created_by) && isCompleted;

                return (
                  <article
                    key={simulation.id}
                    className="group relative flex min-w-0 flex-col overflow-hidden border border-white/10 bg-[#080a14]/95 text-white shadow-[0_12px_35px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-[#8de9f2]/40 hover:shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                  >
                    <div className="h-1 bg-gradient-to-r from-[#8de9f2] via-[#8374c7] to-[#b7a9f5]" />

                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                      <p
                        className="text-[8px] leading-5 text-[#b8f8ff]"
                        style={pixelFont}
                      >
                        REGISTRO {String(index + 1).padStart(2, "0")}
                      </p>

                      {canDelete && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === simulation.id
                                  ? null
                                  : simulation.id,
                              )
                            }
                            disabled={isDeleting}
                            aria-label="Opciones del simulacro"
                            className="border border-white/15 bg-white/5 px-2.5 py-1 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-50"
                          >
                            ...
                          </button>

                          {openMenu === simulation.id && (
                            <div className="absolute right-0 top-full z-30 mt-2 w-44 border border-white/15 bg-[#101225] p-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => requestDelete(simulation.id)}
                                className="w-full px-3 py-3 text-left text-sm font-bold text-[#ffb7ca] hover:bg-white/5"
                              >
                                Eliminar simulacro
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 ${
                            isCompleted
                              ? "bg-[#76d6b0]"
                              : isInProgress
                                ? "bg-[#b7a9f5]"
                                : "bg-[#8de9f2]"
                          }`}
                        />

                        <p
                          className="text-[8px] leading-5 text-slate-300"
                          style={pixelFont}
                        >
                          {isCompleted
                            ? "COMPLETADO"
                            : isInProgress
                              ? "EN CURSO"
                              : "POR COMENZAR"}
                        </p>
                      </div>

                      <h3 className="text-xl font-black leading-7 text-white">
                        {simulation.title}
                      </h3>

                      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">
                        {description}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        {[
                          { label: "MATERIA", value: subject },
                          { label: "PREGUNTAS", value: String(total) },
                          { label: "DURACIÓN", value: `${duration} min` },
                          { label: "DIFICULTAD", value: difficulty },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="border border-white/10 bg-[#111426] p-3"
                          >
                            <p
                              className="text-[7px] leading-4 text-[#9f98c8]"
                              style={pixelFont}
                            >
                              {item.label}
                            </p>

                            <p className="mt-2 truncate text-sm font-bold text-white">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {isInProgress && (
                        <div className="mt-5 border border-[#b7a9f5]/20 bg-[#a89bea]/[0.07] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p
                                className="text-[8px] leading-5 text-[#c7bbff]"
                                style={pixelFont}
                              >
                                TU AVANCE
                              </p>

                              <p className="mt-1 text-xs text-slate-300">
                                {answered} de {total} respondidas
                              </p>
                            </div>

                            <span className="text-sm font-black text-[#c7bbff]">
                              {percentage}%
                            </span>
                          </div>

                          <div className="flex h-2 gap-1">
                            {Array.from({ length: 10 }).map((_, block) => (
                              <span
                                key={block}
                                className={`flex-1 ${
                                  block < Math.ceil(percentage / 10)
                                    ? "bg-[#a89bea]"
                                    : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>

                          <p className="mt-3 text-xs font-semibold text-slate-300">
                            Tiempo restante:{" "}
                            {formatTime(
                              simulationStatus?.timeLeft ?? duration * 60,
                            )}
                          </p>
                        </div>
                      )}

                      {isCompleted && attempt && (
                        <div className="mt-5 border border-[#76d6b0]/25 bg-[#76d6b0]/[0.06] p-4">
                          <p
                            className="text-[8px] leading-5 text-[#a5f1d1]"
                            style={pixelFont}
                          >
                            RESULTADO
                          </p>

                          <p className="mt-2 text-3xl font-black text-white">
                            {attempt.score ?? 0}
                          </p>

                          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="border border-white/10 bg-[#111426] p-2">
                              <p className="text-lg font-black text-[#8be0ba]">
                                {attempt.correct_answers ?? 0}
                              </p>

                              <p className="text-[10px] text-slate-300">
                                Correctas
                              </p>
                            </div>

                            <div className="border border-white/10 bg-[#111426] p-2">
                              <p className="text-lg font-black text-[#ffb7ca]">
                                {attempt.incorrect_answers ?? 0}
                              </p>

                              <p className="text-[10px] text-slate-300">
                                Incorrectas
                              </p>
                            </div>

                            <div className="border border-white/10 bg-[#111426] p-2">
                              <p className="text-lg font-black text-white">
                                {attempt.unanswered_answers ?? 0}
                              </p>

                              <p className="text-[10px] text-slate-300">
                                Sin responder
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/simulacros/${simulation.id}`}
                        className={`mt-6 flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-sm font-black transition ${
                          isCompleted
                            ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                            : isInProgress
                              ? "border-[#a89bea]/50 bg-[#292344] text-[#ded6ff] hover:bg-[#352d56]"
                              : "border-[#8de9f2]/40 bg-[#14263a] text-[#c4faff] hover:bg-[#1b394a]"
                        }`}
                      >
                        <span>
                          {isCompleted
                            ? "Repetir simulacro"
                            : isInProgress
                              ? "Continuar aventura"
                              : "Comenzar prueba"}
                        </span>

                        <span aria-hidden="true" className="text-xl">
                          →
                        </span>
                      </Link>
                    </div>

                    {(isInProgress || isCompleted) && (
                      <div className="border-t border-white/10 bg-black/20 px-5 py-3">
                        <p className="text-xs font-semibold text-slate-300">
                          {isInProgress
                            ? "Tu progreso está guardado."
                            : "Prueba completada."}
                        </p>
                      </div>
                    )}

                    {isDeleting && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#080a14]/95">
                        <p
                          className="text-[9px] leading-6 text-[#b8f8ff]"
                          style={pixelFont}
                        >
                          ELIMINANDO...
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de confirmación */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md border border-[#8de9f2]/40 bg-[#080a14] p-6 text-white shadow-[0_0_45px_rgba(83,211,238,0.08)] sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <p
              className="text-[8px] leading-5 text-[#8de9f2]"
              style={pixelFont}
            >
              CONFIRMAR ACCIÓN
            </p>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="delete-title"
                  className="text-xl font-black text-white"
                >
                  Eliminar simulacro
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Se eliminarán este simulacro, su progreso y sus resultados.
                  Las preguntas originales permanecerán intactas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                aria-label="Cerrar"
                className="text-2xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void handleDelete(confirmDeleteId)}
                disabled={Boolean(deletingId)}
                className="border border-[#8de9f2]/40 bg-[#14263a] px-4 py-3 text-sm font-bold text-[#c4faff] hover:bg-[#1b394a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
