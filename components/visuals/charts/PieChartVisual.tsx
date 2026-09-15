"use client";

import type { ChartVisualData } from "@/lib/visuals/types";

import ChartContainer from "./ChartContainer";

import {
  formatChartValue,
  getSeriesColor,
} from "./chartUtils";

import {
  ICFES_VISUAL_THEME,
} from "@/lib/visuals/visualTheme";

/* =========================================================
   PEAKSCORE — PIE CHART VISUAL

   Renderer profesional para gráficos circulares.

   Contrato:

   categories[i]
        ↓
   series[0].values[i]

   Características:
   - Una serie principal.
   - Validación segura de datos.
   - Ignora valores inválidos y negativos.
   - Cálculo puro de ángulos.
   - show_legend.
   - Caso especial de 100%.
   - Diseño académico consistente.
========================================================= */

interface PieChartVisualProps {
  data: ChartVisualData;
}

interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const SIZE = 320;
const CENTER = SIZE / 2;

const RADIUS = 112;

/* =========================================================
   UTILIDADES
========================================================= */

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function normalizeLabel(
  value: unknown,
  index: number
): string {
  const label = String(
    value ?? ""
  ).trim();

  return (
    label ||
    `Categoría ${index + 1}`
  );
}

function formatPercentage(
  percentage: number
): string {
  if (
    !Number.isFinite(
      percentage
    )
  ) {
    return "0%";
  }

  const value =
    percentage * 100;

  if (
    Math.abs(
      value - Math.round(value)
    ) < 0.001
  ) {
    return `${Math.round(value)}%`;
  }

  return `${value
    .toFixed(1)
    .replace(/\.0$/, "")}%`;
}

/* =========================================================
   CONVERSIÓN POLAR → CARTESIANA
========================================================= */

function polarToCartesian(
  angle: number,
  radius: number
) {
  const radians =
    (angle * Math.PI) / 180;

  return {
    x:
      CENTER +
      radius *
        Math.cos(radians),

    y:
      CENTER +
      radius *
        Math.sin(radians),
  };
}

/* =========================================================
   PATH DE SEGMENTO
========================================================= */

function createSlicePath(
  startAngle: number,
  endAngle: number,
  radius: number
): string {
  const angleDifference =
    endAngle - startAngle;

  const start =
    polarToCartesian(
      startAngle,
      radius
    );

  const end =
    polarToCartesian(
      endAngle,
      radius
    );

  const largeArcFlag =
    angleDifference > 180
      ? 1
      : 0;

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function PieChartVisual({
  data,
}: PieChartVisualProps) {
  /* =======================================================
     NORMALIZACIÓN
  ======================================================= */

  const categories =
    Array.isArray(data.categories)
      ? data.categories
      : [];

  const series =
    Array.isArray(data.series)
      ? data.series
      : [];

  const primarySeries =
    series[0];

  /* =======================================================
     CONSTRUCCIÓN DE DATOS

     Un gráfico circular utiliza una única serie.

     categories[i]
          ↓
     values[i]
  ======================================================= */

  const rawSlices = primarySeries
    ? categories
        .map(
          (category, index) => {
            const rawValue =
              primarySeries
                .values[index];

            const value =
              isFiniteNumber(
                rawValue
              ) &&
              rawValue > 0
                ? rawValue
                : 0;

            return {
              label:
                normalizeLabel(
                  category,
                  index
                ),

              value,

              color:
                getSeriesColor(
                  index
                ),
            };
          }
        )
        .filter(
          (slice) =>
            slice.value > 0
        )
    : [];

  /* =======================================================
     TOTAL
  ======================================================= */

  const total =
    rawSlices.reduce(
      (
        sum,
        slice
      ) =>
        sum + slice.value,
      0
    );

  /* =======================================================
     ÁNGULOS

     IMPORTANTE:

     No usamos una variable mutable durante
     el JSX render.

     Calculamos todos los segmentos antes.
  ======================================================= */

  let angleCursor = -90;

  const slices: PieSlice[] =
    total > 0
      ? rawSlices.map(
          (slice) => {
            const percentage =
              slice.value /
              total;

            const angle =
              percentage * 360;

            const startAngle =
              angleCursor;

            const endAngle =
              startAngle +
              angle;

            angleCursor =
              endAngle;

            return {
              ...slice,

              percentage,

              startAngle,

              endAngle,
            };
          }
        )
      : [];

  /* =======================================================
     ESTADO DE DATOS
  ======================================================= */

  const hasData =
    slices.length > 0 &&
    total > 0;

  const title =
    data.title ?? null;

  const showLegend =
    data.show_legend !== false;

  /* =======================================================
     ESTADO VACÍO
  ======================================================= */

  if (!hasData) {
    return (
      <ChartContainer
        title={title}
      >
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay datos válidos disponibles
            para mostrar este gráfico.
          </p>
        </div>
      </ChartContainer>
    );
  }

  /* =======================================================
     CASO ESPECIAL

     Un solo segmento = 100%.

     SVG arc no maneja correctamente
     un círculo completo como arco.
  ======================================================= */

  const isSingleSlice =
    slices.length === 1;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <ChartContainer
      title={title}
    >
      <div
        className={[
          "flex w-full flex-col items-center",

          showLegend
            ? "gap-8 lg:flex-row lg:items-center lg:justify-center"
            : "justify-center",
        ].join(" ")}
      >
        {/* =================================================
            PIE CHART
        ================================================= */}

        <div className="relative flex shrink-0 items-center justify-center">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-auto w-full max-w-[320px]"
            role="img"
            aria-label={
              title ??
              "Gráfico circular"
            }
            style={{
              fontFamily:
                ICFES_VISUAL_THEME
                  .typography
                  .fontFamily,
            }}
          >
            <title>
              {title ??
                "Gráfico circular"}
            </title>

            {/* =============================================
                FONDO
            ============================================= */}

            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill={
                ICFES_VISUAL_THEME
                  .background
                  .primary
              }
            />

            {/* =============================================
                SEGMENTOS
            ============================================= */}

            {isSingleSlice ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill={
                  slices[0].color
                }
                stroke={
                  ICFES_VISUAL_THEME
                    .background
                    .primary
                }
                strokeWidth="3"
              >
                <title>
                  {`${slices[0].label}: ${formatChartValue(
                    slices[0].value
                  )} (${formatPercentage(
                    slices[0].percentage
                  )})`}
                </title>
              </circle>
            ) : (
              slices.map(
                (
                  slice,
                  index
                ) => (
                  <path
                    key={`${slice.label}-${index}`}
                    d={createSlicePath(
                      slice.startAngle,
                      slice.endAngle,
                      RADIUS
                    )}
                    fill={
                      slice.color
                    }
                    stroke={
                      ICFES_VISUAL_THEME
                        .background
                        .primary
                    }
                    strokeWidth="3"
                    strokeLinejoin="round"
                  >
                    <title>
                      {`${slice.label}: ${formatChartValue(
                        slice.value
                      )} (${formatPercentage(
                        slice.percentage
                      )})`}
                    </title>
                  </path>
                )
              )
            )}

            {/* =============================================
                CONTORNO

                Ayuda a dar una apariencia más limpia
                en material académico.
            ============================================= */}

            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={
                ICFES_VISUAL_THEME
                  .axis
                  .color
              }
              strokeWidth="1"
              opacity="0.18"
            />

            {/* =============================================
                TOTAL CENTRAL
            ============================================= */}

            <circle
              cx={CENTER}
              cy={CENTER}
              r="52"
              fill={
                ICFES_VISUAL_THEME
                  .background
                  .primary
              }
              opacity="0.96"
            />

            <text
              x={CENTER}
              y={CENTER - 7}
              textAnchor="middle"
              fontSize="24"
              fontWeight="700"
              fill={
                ICFES_VISUAL_THEME
                  .text
                  .primary
              }
            >
              {formatChartValue(
                total
              )}
            </text>

            <text
              x={CENTER}
              y={CENTER + 17}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill={
                ICFES_VISUAL_THEME
                  .text
                  .secondary
              }
            >
              Total
            </text>
          </svg>
        </div>

        {/* =================================================
            LEYENDA
        ================================================= */}

        {showLegend && (
          <div className="grid w-full max-w-md gap-2.5">
            {slices.map(
              (
                slice,
                index
              ) => (
                <div
                  key={`${slice.label}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  {/* =======================================
                      LABEL
                  ======================================= */}

                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor:
                          slice.color,
                      }}
                    />

                    <span className="truncate text-sm font-medium text-slate-700">
                      {slice.label}
                    </span>
                  </div>

                  {/* =======================================
                      VALORES
                  ======================================= */}

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatChartValue(
                        slice.value
                      )}
                    </span>

                    <span className="min-w-[42px] text-right text-xs font-medium text-slate-500">
                      {formatPercentage(
                        slice.percentage
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </ChartContainer>
  );
}