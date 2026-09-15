"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  CheckCircle2,
  FileText,
  ArrowUpRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase/browser";

interface RecentSimulation {
  id: string;
  date: string;
  score: number;
  duration: string;
  status: string;
}

export default function RecentSimulations() {
  const [simulations, setSimulations] = useState<RecentSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentSimulations() {
      try {
        /*
         * =====================================
         * USUARIO ACTUAL
         * =====================================
         */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(
            "[PeakScore] Error obteniendo usuario:",
            userError
          );

          setSimulations([]);
          return;
        }

        /*
         * =====================================
         * ÚLTIMOS INTENTOS
         * =====================================
         */

        const {
          data: attempts,
          error: attemptsError,
        } = await supabase
          .from("simulation_attempts")
          .select(
            "id, simulation_id, started_at, completed_at, score"
          )
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", {
            ascending: false,
          })
          .limit(5);

        if (attemptsError) {
          console.error(
            "[PeakScore] Error obteniendo simulacros recientes:",
            attemptsError
          );

          setSimulations([]);
          return;
        }

        if (!attempts || attempts.length === 0) {
          setSimulations([]);
          return;
        }

        /*
         * =====================================
         * INFORMACIÓN DE SIMULACROS
         * =====================================
         */

        const simulationIds = [
          ...new Set(
            attempts.map(
              (attempt) => attempt.simulation_id
            )
          ),
        ];

        const {
          data: simulationData,
          error: simulationError,
        } = await supabase
          .from("simulations")
          .select("id, title, duration")
          .in("id", simulationIds);

        if (simulationError) {
          console.error(
            "[PeakScore] Error obteniendo información de simulacros:",
            simulationError
          );

          setSimulations([]);
          return;
        }

        /*
         * =====================================
         * MAPA DE SIMULACROS
         * =====================================
         */

        const simulationMap = new Map(
          (simulationData ?? []).map(
            (simulation) => [
              simulation.id,
              simulation,
            ]
          )
        );

        /*
         * =====================================
         * FORMATEAR RESULTADOS
         * =====================================
         */

        const formattedSimulations: RecentSimulation[] =
          attempts.map((attempt) => {
            const simulation = simulationMap.get(
              attempt.simulation_id
            );

            /*
             * FECHA
             */

            const completedDate = attempt.completed_at
              ? new Date(attempt.completed_at)
              : new Date();

            const date = completedDate.toLocaleDateString(
              "es-CO",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            );

            /*
             * DURACIÓN REAL
             */

            let duration = "—";

            if (
              attempt.started_at &&
              attempt.completed_at
            ) {
              const start = new Date(
                attempt.started_at
              ).getTime();

              const end = new Date(
                attempt.completed_at
              ).getTime();

              const difference = Math.max(
                0,
                end - start
              );

              const totalMinutes = Math.floor(
                difference / 60000
              );

              const hours = Math.floor(
                totalMinutes / 60
              );

              const minutes = totalMinutes % 60;

              if (hours > 0) {
                duration = `${hours}h ${minutes
                  .toString()
                  .padStart(2, "0")}m`;
              } else {
                duration = `${minutes} min`;
              }
            }

            /*
             * PUNTAJE
             */

            const score =
              typeof attempt.score === "number"
                ? attempt.score
                : 0;

            return {
              id: attempt.id,
              date,
              score,
              duration,
              status: "Completado",
            };
          });

        setSimulations(formattedSimulations);
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando simulacros recientes:",
          error
        );

        setSimulations([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecentSimulations();
  }, []);

  /*
   * =====================================
   * LOADING
   * =====================================
   */

  if (loading) {
    return (
      <article
        className="
          rounded-[26px]
          border
          border-slate-200/80
          bg-white
          p-7
          shadow-[0_4px_24px_rgba(15,23,42,0.05)]
        "
      >
        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
            <FileText
              size={17}
              strokeWidth={1.8}
              className="text-slate-500"
            />
          </div>

          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">
              Últimos simulacros
            </h2>

            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Historial reciente
            </p>
          </div>

        </div>

        <div className="mt-7 space-y-3">

          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

        </div>
      </article>
    );
  }

  /*
   * =====================================
   * SIN SIMULACROS
   * =====================================
   */

  if (simulations.length === 0) {
    return (
      <article
        className="
          relative
          overflow-hidden
          rounded-[26px]
          border
          border-slate-200/80
          bg-white
          p-7
          shadow-[0_4px_24px_rgba(15,23,42,0.05)]
        "
      >
        {/* DECORACIÓN */}

        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-40
            w-40
            rounded-full
            bg-blue-500/[0.035]
            blur-2xl
          "
        />

        {/* HEADER */}

        <div className="relative flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText
              size={17}
              strokeWidth={1.8}
            />
          </div>

          <div>

            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">
              Últimos simulacros
            </h2>

            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Historial reciente
            </p>

          </div>

        </div>

        {/* EMPTY STATE */}

        <div
          className="
            relative
            mt-7
            flex
            min-h-[255px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-slate-200
            bg-slate-50/50
            px-6
            text-center
          "
        >

          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

            <FileText
              size={23}
              strokeWidth={1.6}
              className="text-slate-400"
            />

          </div>

          <h3 className="mt-5 text-[14px] font-bold text-slate-800">
            Aún no hay resultados
          </h3>

          <p className="mt-2 max-w-[230px] text-[11px] font-medium leading-5 text-slate-400">
            Completa tu primer simulacro para comenzar a construir tu historial de rendimiento.
          </p>

          <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">

            <span className="h-px w-8 bg-slate-200" />

            PeakScore

            <span className="h-px w-8 bg-slate-200" />

          </div>

        </div>
      </article>
    );
  }

  /*
   * =====================================
   * HISTORIAL
   * =====================================
   */

  return (
    <article
      className="
        rounded-[26px]
        border
        border-slate-200/80
        bg-white
        p-7
        shadow-[0_4px_24px_rgba(15,23,42,0.05)]
      "
    >
      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText
              size={17}
              strokeWidth={1.8}
            />
          </div>

          <div>

            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">
              Últimos simulacros
            </h2>

            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Historial reciente
            </p>

          </div>

        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-400">
          {simulations.length} recientes
        </span>

      </div>

      {/* LISTA */}

      <div className="mt-7 space-y-3">

        {simulations.map(
          (simulation, index) => (
            <div
              key={simulation.id}
              className="
                group
                rounded-2xl
                border
                border-slate-100
                bg-slate-50/50
                p-4
                transition-all
                duration-200
                hover:border-slate-200
                hover:bg-white
                hover:shadow-sm
              "
            >

              <div className="flex items-center justify-between gap-4">

                {/* IZQUIERDA */}

                <div className="flex min-w-0 items-center gap-3">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-blue-100
                      bg-blue-50
                      text-[11px]
                      font-bold
                      text-blue-600
                    "
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-[12px] font-bold text-slate-800">
                      Simulacro {index + 1}
                    </p>

                    <div className="mt-1 flex items-center gap-2">

                      <span className="text-[10px] font-medium text-slate-400">
                        {simulation.date}
                      </span>

                      <span className="h-1 w-1 rounded-full bg-slate-300" />

                      <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">

                        <Clock3
                          size={11}
                          strokeWidth={1.8}
                        />

                        {simulation.duration}

                      </span>

                    </div>

                  </div>

                </div>

                {/* DERECHA */}

                <div className="flex shrink-0 items-center gap-4">

                  <div className="text-right">

                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Puntaje
                    </p>

                    <p className="mt-0.5 text-[17px] font-bold tracking-[-0.02em] text-slate-900">
                      {simulation.score}
                    </p>

                  </div>

                  <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                  <div className="hidden items-center gap-1.5 text-[10px] font-semibold text-emerald-600 sm:flex">

                    <CheckCircle2
                      size={14}
                      strokeWidth={1.8}
                    />

                    Completado

                  </div>

                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.8}
                    className="
                      text-slate-300
                      transition-transform
                      duration-200
                      group-hover:-translate-y-0.5
                      group-hover:translate-x-0.5
                      group-hover:text-blue-500
                    "
                  />

                </div>

              </div>

            </div>
          )
        )}

      </div>
    </article>
  );
}