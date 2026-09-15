"use client";

import { useId } from "react";

import type { ChartVisualData } from "@/lib/visuals/types";

import {
  getAcademicSeriesColor,
  ICFES_VISUAL_THEME,
} from "@/lib/visuals/visualTheme";

import ChartContainer from "./ChartContainer";

import {
  createNiceScale,
  formatChartValue,
} from "./chartUtils";

/* =========================================================
   PEAKSCORE — BAR CHART VISUAL

   Gráfica de barras académica.

   Objetivos:
   - Estilo académico inspirado en material tipo ICFES.
   - Alta legibilidad.
   - SVG responsive.
   - Compatible con múltiples series.
   - Compatible con valores negativos.
   - Escala automática segura.
   - Labels largos protegidos.
   - Datos inválidos controlados.
   - Respeta show_grid.
   - Respeta show_legend.
   - No convierte datos faltantes en valores cero falsos.
========================================================= */

interface BarChartVisualProps {
  data: ChartVisualData;
}

/* =========================================================
   DIMENSIONES SVG
========================================================= */

const SVG_WIDTH = 900;
const SVG_HEIGHT = 470;

/* =========================================================
   ESPACIADO
========================================================= */

const LEGEND_HEIGHT = 46;

const PADDING = {
  top:
    ICFES_VISUAL_THEME.spacing.topPadding +
    LEGEND_HEIGHT,

  right:
    ICFES_VISUAL_THEME.spacing.rightPadding,

  bottom: Math.max(
    ICFES_VISUAL_THEME.spacing.bottomPadding,
    92
  ),

  left:
    ICFES_VISUAL_THEME.spacing.leftPadding,
};

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
  value: unknown
): string {
  return String(value ?? "").trim();
}

/**
 * Divide labels largos en máximo dos líneas.
 */
function splitCategoryLabel(
  label: string,
  maxLength = 18
): string[] {
  const normalized =
    normalizeLabel(label);

  if (!normalized) {
    return [""];
  }

  if (
    normalized.length <= maxLength
  ) {
    return [normalized];
  }

  const words =
    normalized.split(/\s+/);

  const lines: string[] = [];

  let currentLine = "";

  for (const word of words) {
    const nextLine =
      currentLine.length > 0
        ? `${currentLine} ${word}`
        : word;

    if (
      nextLine.length > maxLength &&
      currentLine.length > 0
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= 2) {
    return lines;
  }

  return [
    lines[0],
    `${lines
      .slice(1)
      .join(" ")
      .slice(0, maxLength - 1)}…`,
  ];
}

function getSafeLimit(
  value: unknown,
  fallback: number
): number {
  return isFiniteNumber(value)
    ? value
    : fallback;
}

/**
 * Obtiene el ancho ideal de cada grupo.
 */
function getGroupPadding(
  categoryWidth: number
): number {
  return Math.min(
    Math.max(categoryWidth * 0.08, 10),
    22
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function BarChartVisual({
  data,
}: BarChartVisualProps) {
  /* =======================================================
     ID ÚNICO
  ======================================================= */

  const reactId = useId();

  const safeId = reactId.replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );

  const clipId =
    `peakscore-bar-clip-${safeId}`;

  /* =======================================================
     CATEGORÍAS
  ======================================================= */

  const categories =
    Array.isArray(data.categories)
      ? data.categories.map(normalizeLabel)
      : [];

  /* =======================================================
     SERIES

     IMPORTANTE:

     No convertimos valores inválidos o faltantes en 0.

     undefined / null / NaN:
       → dato inexistente
       → no se dibuja una barra

     0 real:
       → sigue siendo un valor válido
  ======================================================= */

  const series =
    Array.isArray(data.series)
      ? data.series
          .filter(
            (item) =>
              item &&
              typeof item.name === "string" &&
              Array.isArray(item.values)
          )
          .map((item) => ({
            name:
              normalizeLabel(item.name) ||
              "Serie",

            values: item.values.map(
              (value) =>
                isFiniteNumber(value)
                  ? value
                  : null
            ),
          }))
      : [];

  /* =======================================================
     VALORES VÁLIDOS
  ======================================================= */

  const validValues =
    series.flatMap((item) =>
      item.values.filter(isFiniteNumber)
    );

  /* =======================================================
     VALIDACIÓN
  ======================================================= */

  const hasData =
    categories.length > 0 &&
    series.length > 0 &&
    validValues.length > 0;

  /* =======================================================
     ESTADO SIN DATOS
  ======================================================= */

  if (!hasData) {
    return (
      <ChartContainer
        title={data.title}
        xLabel={null}
        yLabel={null}
      >
        <div className="flex min-h-[280px] items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold text-slate-700">
              No hay suficientes datos para mostrar esta gráfica.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Verifica que existan categorías y valores numéricos válidos.
            </p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  /* =======================================================
     LÍMITES DE ESCALA
  ======================================================= */

  const calculatedMin =
    Math.min(
      0,
      ...validValues
    );

  const calculatedMax =
    Math.max(
      1,
      0,
      ...validValues
    );

  let rawMin =
    getSafeLimit(
      data.y_min,
      calculatedMin
    );

  let rawMax =
    getSafeLimit(
      data.y_max,
      calculatedMax
    );

  /**
   * Protección contra límites invertidos.
   */
  if (rawMin > rawMax) {
    [rawMin, rawMax] = [
      rawMax,
      rawMin,
    ];
  }

  /**
   * Protección contra rango cero.
   */
  if (rawMin === rawMax) {
    const padding =
      Math.abs(rawMin) > 0
        ? Math.abs(rawMin) * 0.15
        : 1;

    rawMin -= padding;
    rawMax += padding;
  }

  /* =======================================================
     ESCALA
  ======================================================= */

  const scale =
    createNiceScale({
      min: rawMin,
      max: rawMax,
      targetTicks: 5,
    });

  /* =======================================================
     ÁREA DE GRÁFICA
  ======================================================= */

  const chartWidth =
    SVG_WIDTH -
    PADDING.left -
    PADDING.right;

  const chartHeight =
    SVG_HEIGHT -
    PADDING.top -
    PADDING.bottom;

  const chartRight =
    PADDING.left +
    chartWidth;

  const chartBottom =
    PADDING.top +
    chartHeight;

  /* =======================================================
     POSICIÓN Y
  ======================================================= */

  const getY = (
    value: number
  ): number => {
    const range =
      scale.max -
      scale.min;

    if (
      !Number.isFinite(range) ||
      range <= 0
    ) {
      return chartBottom;
    }

    return (
      PADDING.top +
      ((scale.max - value) /
        range) *
        chartHeight
    );
  };

  /* =======================================================
     LÍNEA BASE
  ======================================================= */

  const zeroY =
    getY(0);

  const baselineY =
    Math.min(
      Math.max(
        zeroY,
        PADDING.top
      ),
      chartBottom
    );

  /* =======================================================
     DISTRIBUCIÓN HORIZONTAL
  ======================================================= */

  const categoryCount =
    Math.max(
      categories.length,
      1
    );

  const categoryWidth =
    chartWidth /
    categoryCount;

  const groupPadding =
    getGroupPadding(
      categoryWidth
    );

  const availableGroupWidth =
    Math.max(
      categoryWidth -
        groupPadding * 2,
      1
    );

  const seriesCount =
    Math.max(
      series.length,
      1
    );

  const barGap =
    seriesCount > 1
      ? Math.min(
          8,
          availableGroupWidth *
            0.045
        )
      : 0;

  const totalGapWidth =
    barGap *
    Math.max(
      seriesCount - 1,
      0
    );

  const barWidth =
    Math.max(
      (
        availableGroupWidth -
        totalGapWidth
      ) /
        seriesCount,
      2
    );

  /* =======================================================
     CONFIGURACIÓN DE GRID
  ======================================================= */

  const showGrid =
    data.show_grid !== false;

  /* =======================================================
     LEYENDA
  ======================================================= */

  const hasLegend =
    data.show_legend !== false &&
    series.length > 1;

  const legendMarkerSize =
    ICFES_VISUAL_THEME
      .legend
      .markerSize;

  const legendGap =
    ICFES_VISUAL_THEME
      .legend
      .gap;

  const legendItemWidth =
    hasLegend
      ? Math.min(
          170,
          chartWidth /
            series.length
        )
      : 0;

  const legendTotalWidth =
    legendItemWidth *
    series.length;

  const legendStartX =
    PADDING.left +
    Math.max(
      0,
      (
        chartWidth -
        legendTotalWidth
      ) /
        2
    );

  const legendY =
    PADDING.top -
    26;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <ChartContainer
      title={data.title}
      xLabel={null}
      yLabel={null}
    >
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="block min-w-[640px] w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={
            data.title ??
            "Gráfica de barras"
          }
          style={{
            fontFamily:
              ICFES_VISUAL_THEME
                .typography
                .fontFamily,
          }}
        >
          <title>
            {data.title ??
              "Gráfica de barras"}
          </title>

          {/* ===============================================
              DEFINICIONES
          =============================================== */}

          <defs>
            <clipPath id={clipId}>
              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={chartWidth}
                height={chartHeight}
              />
            </clipPath>
          </defs>

          {/* ===============================================
              FONDO
          =============================================== */}

          <rect
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            fill={
              ICFES_VISUAL_THEME
                .background
                .primary
            }
          />

          {/* ===============================================
              GRID + TICKS Y
          =============================================== */}

          {scale.ticks.map(
            (tick) => {
              const y =
                getY(tick);

              const isZero =
                Math.abs(tick) <
                0.000001;

              return (
                <g
                  key={`tick-${tick}`}
                >
                  {/* GRID */}

                  {showGrid && (
                    <line
                      x1={PADDING.left}
                      y1={y}
                      x2={chartRight}
                      y2={y}
                      stroke={
                        isZero
                          ? ICFES_VISUAL_THEME
                              .axis
                              .color
                          : ICFES_VISUAL_THEME
                              .grid
                              .color
                      }
                      strokeWidth={
                        isZero
                          ? ICFES_VISUAL_THEME
                              .axis
                              .width
                          : ICFES_VISUAL_THEME
                              .grid
                              .width
                      }
                      opacity={
                        isZero
                          ? 1
                          : ICFES_VISUAL_THEME
                              .grid
                              .opacity
                      }
                      strokeDasharray={
                        isZero
                          ? undefined
                          : ICFES_VISUAL_THEME
                              .grid
                              .dashArray
                      }
                    />
                  )}

                  {/* TICK */}

                  <line
                    x1={
                      PADDING.left -
                      ICFES_VISUAL_THEME
                        .axis
                        .tickLength
                    }
                    y1={y}
                    x2={PADDING.left}
                    y2={y}
                    stroke={
                      ICFES_VISUAL_THEME
                        .axis
                        .color
                    }
                    strokeWidth={
                      ICFES_VISUAL_THEME
                        .axis
                        .tickWidth
                    }
                  />

                  {/* LABEL */}

                  <text
                    x={
                      PADDING.left -
                      15
                    }
                    y={y + 4}
                    textAnchor="end"
                    fontSize={
                      ICFES_VISUAL_THEME
                        .typography
                        .tickLabelSize
                    }
                    fontWeight={
                      isZero
                        ? ICFES_VISUAL_THEME
                            .typography
                            .fontWeight
                            .medium
                        : ICFES_VISUAL_THEME
                            .typography
                            .fontWeight
                            .regular
                    }
                    fill={
                      ICFES_VISUAL_THEME
                        .text
                        .axis
                    }
                  >
                    {formatChartValue(
                      tick
                    )}
                  </text>
                </g>
              );
            }
          )}

          {/* ===============================================
              EJE Y
          =============================================== */}

          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={chartBottom}
            stroke={
              ICFES_VISUAL_THEME
                .axis
                .color
            }
            strokeWidth={
              ICFES_VISUAL_THEME
                .axis
                .width
            }
          />

          {/* ===============================================
              EJE X / BASE
          =============================================== */}

          <line
            x1={PADDING.left}
            y1={baselineY}
            x2={chartRight}
            y2={baselineY}
            stroke={
              ICFES_VISUAL_THEME
                .axis
                .color
            }
            strokeWidth={
              ICFES_VISUAL_THEME
                .axis
                .width
            }
          />

          {/* ===============================================
              BARRAS
          =============================================== */}

          <g
            clipPath={`url(#${clipId})`}
          >
            {categories.map(
              (
                category,
                categoryIndex
              ) => {
                const groupStart =
                  PADDING.left +
                  categoryIndex *
                    categoryWidth +
                  groupPadding;

                return (
                  <g
                    key={`category-bars-${categoryIndex}`}
                  >
                    {series.map(
                      (
                        seriesItem,
                        seriesIndex
                      ) => {
                        const rawValue =
                          seriesItem.values[
                            categoryIndex
                          ];

                        /**
                         * Dato inexistente:
                         * No renderizamos barra.
                         */
                        if (
                          !isFiniteNumber(
                            rawValue
                          )
                        ) {
                          return null;
                        }

                        const value =
                          rawValue;

                        const valueY =
                          getY(value);

                        const barX =
                          groupStart +
                          seriesIndex *
                            (
                              barWidth +
                              barGap
                            );

                        const barTop =
                          Math.min(
                            valueY,
                            baselineY
                          );

                        const barHeight =
                          Math.abs(
                            baselineY -
                              valueY
                          );

                        const color =
                          getAcademicSeriesColor(
                            seriesIndex
                          );

                        const isPositive =
                          value >= 0;

                        return (
                          <g
                            key={`${categoryIndex}-${seriesIndex}`}
                          >
                            {/* BARRA */}

                            {barHeight > 0 && (
                              <rect
                                x={barX}
                                y={barTop}
                                width={barWidth}
                                height={Math.max(
                                  barHeight,
                                  1
                                )}
                                rx={0}
                                fill={color}
                                stroke={
                                  ICFES_VISUAL_THEME
                                    .bar
                                    .stroke
                                }
                                strokeWidth={
                                  ICFES_VISUAL_THEME
                                    .bar
                                    .strokeWidth
                                }
                                opacity={
                                  ICFES_VISUAL_THEME
                                    .bar
                                    .opacity
                                }
                              />
                            )}

                            {/* VALOR */}

                            {data.show_values !==
                              false &&
                              value !== 0 && (
                                <text
                                  x={
                                    barX +
                                    barWidth / 2
                                  }
                                  y={
                                    isPositive
                                      ? Math.max(
                                          barTop -
                                            7,
                                          PADDING.top +
                                            12
                                        )
                                      : Math.min(
                                          barTop +
                                            barHeight +
                                            15,
                                          chartBottom -
                                            4
                                        )
                                  }
                                  textAnchor="middle"
                                  fontSize={
                                    ICFES_VISUAL_THEME
                                      .bar
                                      .valueLabelSize
                                  }
                                  fontWeight={
                                    ICFES_VISUAL_THEME
                                      .typography
                                      .fontWeight
                                      .medium
                                  }
                                  fill={
                                    ICFES_VISUAL_THEME
                                      .bar
                                      .valueLabelColor
                                  }
                                >
                                  {formatChartValue(
                                    value
                                  )}
                                </text>
                              )}
                          </g>
                        );
                      }
                    )}
                  </g>
                );
              }
            )}
          </g>

          {/* ===============================================
              CATEGORÍAS X
          =============================================== */}

          {categories.map(
            (
              category,
              categoryIndex
            ) => {
              const categoryCenter =
                PADDING.left +
                categoryIndex *
                  categoryWidth +
                categoryWidth / 2;

              const lines =
                splitCategoryLabel(
                  category
                );

              return (
                <text
                  key={`category-label-${categoryIndex}`}
                  x={categoryCenter}
                  y={chartBottom + 25}
                  textAnchor="middle"
                  fontSize={
                    ICFES_VISUAL_THEME
                      .typography
                      .axisLabelSize
                  }
                  fontWeight={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontWeight
                      .medium
                  }
                  fill={
                    ICFES_VISUAL_THEME
                      .text
                      .secondary
                  }
                >
                  {lines.map(
                    (
                      line,
                      lineIndex
                    ) => (
                      <tspan
                        key={`${lineIndex}-${line}`}
                        x={
                          categoryCenter
                        }
                        dy={
                          lineIndex === 0
                            ? 0
                            : 15
                        }
                      >
                        {line}
                      </tspan>
                    )
                  )}
                </text>
              );
            }
          )}

          {/* ===============================================
              LEYENDA
          =============================================== */}

          {hasLegend && (
            <g>
              {series.map(
                (
                  seriesItem,
                  index
                ) => {
                  const legendX =
                    legendStartX +
                    index *
                      legendItemWidth;

                  return (
                    <g
                      key={`legend-${index}`}
                    >
                      <rect
                        x={legendX}
                        y={
                          legendY -
                          legendMarkerSize /
                            2
                        }
                        width={
                          legendMarkerSize
                        }
                        height={
                          legendMarkerSize
                        }
                        rx={0}
                        fill={
                          getAcademicSeriesColor(
                            index
                          )
                        }
                      />

                      <text
                        x={
                          legendX +
                          legendMarkerSize +
                          legendGap
                        }
                        y={legendY + 1}
                        dominantBaseline="middle"
                        fontSize={
                          ICFES_VISUAL_THEME
                            .legend
                            .fontSize
                        }
                        fontWeight={
                          ICFES_VISUAL_THEME
                            .typography
                            .fontWeight
                            .regular
                        }
                        fill={
                          ICFES_VISUAL_THEME
                            .legend
                            .textColor
                        }
                      >
                        {seriesItem.name}
                      </text>
                    </g>
                  );
                }
              )}
            </g>
          )}

          {/* ===============================================
              LABEL EJE Y
          =============================================== */}

          {data.y_label && (
            <text
              x="25"
              y={
                PADDING.top +
                chartHeight / 2
              }
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={
                ICFES_VISUAL_THEME
                  .typography
                  .axisLabelSize
              }
              fontWeight={
                ICFES_VISUAL_THEME
                  .typography
                  .fontWeight
                  .medium
              }
              fill={
                ICFES_VISUAL_THEME
                  .text
                  .axis
              }
              transform={`rotate(-90 25 ${
                PADDING.top +
                chartHeight / 2
              })`}
            >
              {data.y_label}
            </text>
          )}

          {/* ===============================================
              LABEL EJE X
          =============================================== */}

          {data.x_label && (
            <text
              x={
                PADDING.left +
                chartWidth / 2
              }
              y={SVG_HEIGHT - 17}
              textAnchor="middle"
              fontSize={
                ICFES_VISUAL_THEME
                  .typography
                  .axisLabelSize
              }
              fontWeight={
                ICFES_VISUAL_THEME
                  .typography
                  .fontWeight
                  .medium
              }
              fill={
                ICFES_VISUAL_THEME
                  .text
                  .axis
              }
            >
              {data.x_label}
            </text>
          )}
        </svg>
      </div>
    </ChartContainer>
  );
}