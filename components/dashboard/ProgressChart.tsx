"use client";

import { useEffect, useMemo, useId, useState } from "react";

import { supabase } from "@/lib/supabase/browser";

interface ProgressChartProps {
  userId: string;
}

interface SimulationAttempt {
  id: string;
  score: number | null;
  completed_at: string | null;
  started_at: string | null;
}

interface ChartPoint {
  label: string;
  score: number;
  date: string;
  x: number;
  y: number;
}

export default function ProgressChart({
  userId,
}: ProgressChartProps) {
  const gradientId = useId();

  const [attempts, setAttempts] = useState<
    SimulationAttempt[]
  >([]);

  const [loading, setLoading] = useState(true);

  /*
   * ============================================================
   * CARGAR PROGRESO
   * ============================================================
   */

  useEffect(() => {
    async function loadProgress() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("simulation_attempts")
        .select(
          "id, score, completed_at, started_at"
        )
        .eq("user_id", userId)
        .not("score", "is", null)
        .order("completed_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "[PeakScore] Error cargando progreso:",
          error
        );

        setAttempts([]);
        setLoading(false);
        return;
      }

      setAttempts(data ?? []);
      setLoading(false);
    }

    loadProgress();
  }, [userId]);

  /*
   * ============================================================
   * DATOS DE LA GRÁFICA
   * ============================================================
   */

  const chartData = useMemo(() => {
    return attempts
      .filter(
        (attempt) =>
          attempt.score !== null &&
          Number.isFinite(Number(attempt.score))
      )
      .slice(-8)
      .map((attempt, index) => {
        const rawDate =
          attempt.completed_at ??
          attempt.started_at ??
          new Date().toISOString();

        const date = new Date(rawDate);

        return {
          label: `Sim ${index + 1}`,
          score: Number(attempt.score),
          date: date.toLocaleDateString(
            "es-CO",
            {
              day: "2-digit",
              month: "short",
            }
          ),
        };
      });
  }, [attempts]);

  /*
   * ============================================================
   * PUNTAJE ACTUAL
   * ============================================================
   */

  const latestScore =
    chartData.length > 0
      ? chartData[chartData.length - 1].score
      : 0;

  const previousScore =
    chartData.length > 1
      ? chartData[chartData.length - 2].score
      : latestScore;

  const difference =
    latestScore - previousScore;

  const maxScore = 500;

  /*
   * ============================================================
   * POSICIONES
   * ============================================================
   */

  const chartPoints = useMemo<
    ChartPoint[]
  >(() => {
    if (chartData.length === 0) {
      return [];
    }

    const width = 1000;
    const height = 300;

    const horizontalPadding = 30;
    const verticalPadding = 25;

    const usableWidth =
      width - horizontalPadding * 2;

    const usableHeight =
      height - verticalPadding * 2;

    return chartData.map((point, index) => {
      const x =
        chartData.length === 1
          ? width / 2
          : horizontalPadding +
            (index /
              (chartData.length - 1)) *
              usableWidth;

      const normalizedScore =
        Math.max(
          0,
          Math.min(
            point.score,
            maxScore
          )
        ) / maxScore;

      const y =
        height -
        verticalPadding -
        normalizedScore *
          usableHeight;

      return {
        ...point,
        x,
        y,
      };
    });
  }, [chartData]);

  /*
   * ============================================================
   * LÍNEA
   * ============================================================
   */

  const linePath = useMemo(() => {
    if (chartPoints.length === 0) {
      return "";
    }

    return chartPoints
      .map((point, index) => {
        if (index === 0) {
          return `M ${point.x} ${point.y}`;
        }

        const previous =
          chartPoints[index - 1];

        const controlX =
          (previous.x + point.x) / 2;

        return `
          C
          ${controlX} ${previous.y},
          ${controlX} ${point.y},
          ${point.x} ${point.y}
        `;
      })
      .join(" ");
  }, [chartPoints]);

  /*
   * ============================================================
   * ÁREA
   * ============================================================
   */

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) {
      return "";
    }

    const first = chartPoints[0];

    const last =
      chartPoints[
        chartPoints.length - 1
      ];

    return `
      ${linePath}
      L ${last.x} 300
      L ${first.x} 300
      Z
    `;
  }, [chartPoints, linePath]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <section
        className="
          overflow-hidden
          rounded-[24px]
          border
          border-slate-800
          bg-[#080b12]
          p-6
          shadow-[0_12px_40px_rgba(0,0,0,0.18)]
          select-none
          md:p-7
        "
      >
        <div className="animate-pulse">
          <div className="h-3 w-28 rounded-full bg-slate-800" />

          <div className="mt-3 h-6 w-52 rounded-lg bg-slate-800" />

          <div className="mt-2 h-3 w-72 max-w-full rounded-full bg-slate-900" />

          <div className="mt-8 h-[300px] rounded-2xl bg-slate-900" />
        </div>
      </section>
    );
  }

  /*
   * ============================================================
   * COMPONENTE
   * ============================================================
   */

  return (
    <section
      className="
        overflow-hidden
        rounded-[24px]
        border
        border-slate-800
        bg-[#080b12]
        shadow-[0_12px_40px_rgba(0,0,0,0.18)]
        transition-shadow
        duration-300
        hover:shadow-[0_18px_45px_rgba(0,0,0,0.24)]
        select-none
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-white/[0.06] px-6 py-6 md:px-7">

        <div className="flex items-start justify-between gap-6">

          <div className="min-w-0">

            <p className="select-none text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
              Rendimiento
            </p>

            <div className="mt-2 flex items-center gap-3">

              <h2 className="select-none text-[20px] font-bold tracking-[-0.025em] text-white md:text-[21px]">
                Evolución de tu puntaje
              </h2>

              {chartData.length > 1 && (
                <span
                  className={`
                    hidden
                    select-none
                    rounded-full
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    sm:inline-flex
                    ${
                      difference > 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : difference < 0
                          ? "bg-red-500/10 text-red-400"
                          : "bg-white/[0.06] text-slate-400"
                    }
                  `}
                >
                  {difference > 0
                    ? `+${difference} pts`
                    : `${difference} pts`}
                </span>
              )}

            </div>

            <p className="mt-1 select-none text-[12px] font-medium leading-5 text-slate-500">
              Visualiza cómo evoluciona tu rendimiento en los simulacros.
            </p>

          </div>

          {chartData.length > 0 && (
            <div className="hidden shrink-0 text-right sm:block">

              <p className="select-none text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Puntaje actual
              </p>

              <p className="mt-1 select-none text-[24px] font-bold tracking-[-0.04em] text-white">
                {latestScore}
              </p>

            </div>
          )}

        </div>

      </div>

      {/* ======================================================
          SIN DATOS
      ====================================================== */}

      {chartData.length === 0 ? (
        <div className="px-6 py-6 md:px-7 md:py-7">

          <div
            className="
              relative
              min-h-[300px]
              overflow-hidden
              rounded-[20px]
              border
              border-white/[0.06]
              bg-[#0b0f18]
              select-none
            "
          >

            {/* FONDO TÉCNICO */}

            <div className="absolute inset-0">

              <div
                className="
                  absolute
                  inset-0
                  opacity-70
                "
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)",
                  backgroundSize:
                    "72px 60px",
                }}
              />

              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  h-[220px]
                  w-[520px]
                  max-w-[90%]
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-blue-500/[0.05]
                  blur-3xl
                "
              />

            </div>

            {/* LÍNEA DECORATIVA */}

            <div className="pointer-events-none absolute inset-x-8 bottom-16 hidden h-[90px] md:block">

              <svg
                viewBox="0 0 800 100"
                className="h-full w-full"
                preserveAspectRatio="none"
              >

                <path
                  d="M0 78 C90 70 120 72 185 65 C260 56 285 70 355 53 C425 36 455 48 520 40 C590 32 640 45 705 22 C750 8 780 18 800 10"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeDasharray="7 9"
                />

              </svg>

            </div>

            {/* CONTENIDO */}

            <div
              className="
                relative
                z-10
                flex
                min-h-[300px]
                flex-col
                items-center
                justify-center
                px-6
                text-center
                select-none
              "
            >

              {/* MARCA VISUAL */}

              <div className="relative flex h-[58px] w-[92px] items-end justify-center gap-1.5">

                <span className="h-[20%] w-2.5 rounded-t-md bg-blue-950" />
                <span className="h-[42%] w-2.5 rounded-t-md bg-blue-900" />
                <span className="h-[68%] w-2.5 rounded-t-md bg-blue-700" />
                <span className="h-full w-2.5 rounded-t-md bg-blue-500" />

                <div className="absolute -bottom-2 left-1/2 h-px w-[92px] -translate-x-1/2 bg-slate-800" />

              </div>

              <p className="mt-7 select-none text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
                Tu progreso empieza aquí
              </p>

              <h3 className="mt-2 select-none text-[17px] font-bold tracking-[-0.02em] text-white">
                Aún no hay resultados registrados
              </h3>

              <p className="mt-2 max-w-md select-none text-[12px] font-medium leading-5 text-slate-500">
                Completa tu primer simulacro para comenzar a construir
                tu historial de rendimiento.
              </p>

              <div className="mt-5 flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                <span className="select-none text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                  PeakScore
                </span>

                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />

              </div>

            </div>

          </div>

        </div>
      ) : (
        <>
          {/* ==================================================
              RESUMEN
          ================================================== */}

          <div className="grid grid-cols-2 gap-px border-b border-white/[0.06] bg-white/[0.04]">

            <div className="bg-[#080b12] px-6 py-5 md:px-7">

              <p className="select-none text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Puntaje actual
              </p>

              <div className="mt-1 flex items-baseline gap-2">

                <span className="select-none text-[26px] font-bold tracking-[-0.04em] text-white">
                  {latestScore}
                </span>

                <span className="select-none text-[11px] font-semibold text-slate-600">
                  / 500
                </span>

              </div>

            </div>

            <div className="bg-[#080b12] px-6 py-5 md:px-7">

              <p className="select-none text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Simulacros registrados
              </p>

              <p className="mt-1 select-none text-[26px] font-bold tracking-[-0.04em] text-white">
                {attempts.length}
              </p>

            </div>

          </div>

          {/* ==================================================
              GRÁFICA
          ================================================== */}

          <div className="px-5 pb-6 pt-7 md:px-7">

            <div className="relative h-[300px] w-full">

              {/* LÍNEAS DE REFERENCIA */}

              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-3">

                {[500, 375, 250, 125, 0].map(
                  (score) => (
                    <div
                      key={score}
                      className="flex items-center gap-3"
                    >

                      <span className="w-8 select-none text-right text-[9px] font-semibold text-slate-600">
                        {score}
                      </span>

                      <div className="h-px flex-1 border-t border-dashed border-slate-800" />

                    </div>
                  )
                )}

              </div>

              {/* SVG */}

              <svg
                viewBox="0 0 1000 300"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full pl-8"
              >

                <defs>

                  <linearGradient
                    id={`progressArea-${gradientId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity="0.20"
                    />

                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity="0"
                    />

                  </linearGradient>

                </defs>

                {/* ÁREA */}

                <path
                  d={areaPath}
                  fill={`url(#progressArea-${gradientId})`}
                />

                {/* LÍNEA */}

                <path
                  d={linePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* PUNTOS */}

                {chartPoints.map(
                  (point) => (
                    <g
                      key={`${point.label}-${point.date}`}
                    >

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill="#080b12"
                        stroke="#1d4ed8"
                        strokeWidth="2"
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#3b82f6"
                      />

                    </g>
                  )
                )}

              </svg>

            </div>

            {/* ETIQUETAS */}

            <div className="ml-11 mt-3 flex justify-between">

              {chartData.map(
                (point) => (
                  <div
                    key={`${point.label}-${point.date}`}
                    className="text-center select-none"
                  >

                    <p className="select-none text-[10px] font-bold text-slate-500">
                      {point.label}
                    </p>

                    <p className="mt-0.5 select-none text-[9px] font-medium text-slate-700">
                      {point.date}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>
        </>
      )}

    </section>
  );
}