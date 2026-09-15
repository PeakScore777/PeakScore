"use client";

import { useId } from "react";

import type { ChartVisualData } from "@/lib/visuals/types";

import {
  getAcademicSeriesColor,
  ICFES_VISUAL_THEME,
} from "@/lib/visuals/visualTheme";

import ChartContainer from "./ChartContainer";

import {
  clamp,
  createNiceScale,
  formatChartValue,
  getNumericRange,
} from "./chartUtils";

/* =========================================================
   PEAKSCORE — LINE CHART VISUAL

   Motor profesional para gráficas de líneas académicas.

   Características:
   - Una o múltiples series.
   - Datos faltantes sin conexiones falsas.
   - Valores positivos y negativos.
   - Escala académica automática.
   - Límites manuales y_min / y_max.
   - show_grid.
   - show_legend.
   - Labels inteligentes.
   - Diseño consistente con el sistema visual PeakScore.
========================================================= */

interface LineChartVisualProps {
  data: ChartVisualData;
}

/* =========================================================
   CONFIGURACIÓN SVG
========================================================= */

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 470;

const LEGEND_HEIGHT = 46;

const MARGIN = {
  top:
    ICFES_VISUAL_THEME.spacing.topPadding +
    LEGEND_HEIGHT,

  right:
    ICFES_VISUAL_THEME.spacing.rightPadding,

  bottom: Math.max(
    ICFES_VISUAL_THEME.spacing.bottomPadding,
    82
  ),

  left:
    ICFES_VISUAL_THEME.spacing.leftPadding,
};

/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface ChartPoint {
  index: number;
  value: number;
}

interface ChartSegment {
  points: ChartPoint[];
}

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

function getSafeLimit(
  value: unknown,
  fallback: number
): number {
  return isFiniteNumber(value)
    ? value
    : fallback;
}

/**
 * Divide labels largos en máximo dos líneas.
 */
function splitCategoryLabel(
  value: unknown,
  maxLength = 18
): string[] {
  const label =
    normalizeLabel(value);

  if (!label) {
    return [""];
  }

  if (
    label.length <= maxLength
  ) {
    return [label];
  }

  const words =
    label.split(/\s+/);

  const lines: string[] = [];

  let currentLine = "";

  for (const word of words) {
    const nextLine =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    if (
      nextLine.length > maxLength &&
      currentLine
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

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function LineChartVisual({
  data,
}: LineChartVisualProps) {
  const uniqueId = useId();

  /* =======================================================
     CATEGORÍAS
  ======================================================= */

  const categories =
    Array.isArray(data.categories)
      ? data.categories.map(normalizeLabel)
      : [];

  /* =======================================================
     SERIES

     Conservamos valores inválidos como null.
     Esto permite romper correctamente las líneas.
  ======================================================= */

  const series =
    Array.isArray(data.series)
      ? data.series
          .filter(
            (serie) =>
              serie &&
              typeof serie.name === "string" &&
              Array.isArray(serie.values)
          )
          .map((serie) => ({
            name:
              normalizeLabel(serie.name) ||
              "Serie",

            values: serie.values.map(
              (value) =>
                isFiniteNumber(value)
                  ? value
                  : null
            ),
          }))
      : [];

  /* =======================================================
     VALIDACIÓN BÁSICA
  ======================================================= */

  if (
    categories.length === 0 ||
    series.length === 0
  ) {
    return (
      <ChartContainer
        title={data.title}
        xLabel={null}
        yLabel={null}
      >
        <div className="flex min-h-[280px] items-center justify-center px-6">
          <p className="text-sm text-slate-500">
            No hay suficientes datos para mostrar la gráfica.
          </p>
        </div>
      </ChartContainer>
    );
  }

  /* =======================================================
     OBTENER VALORES VÁLIDOS
  ======================================================= */

  const allValues =
    series.flatMap((serie) =>
      serie.values.filter(
        isFiniteNumber
      )
    );

  /* =======================================================
     VALIDACIÓN DE VALORES
  ======================================================= */

  if (allValues.length === 0) {
    return (
      <ChartContainer
        title={data.title}
        xLabel={null}
        yLabel={null}
      >
        <div className="flex min-h-[280px] items-center justify-center px-6">
          <p className="text-sm text-slate-500">
            No hay valores numéricos válidos para mostrar.
          </p>
        </div>
      </ChartContainer>
    );
  }

  /* =======================================================
     DIMENSIONES
  ======================================================= */

  const plotWidth =
    VIEWBOX_WIDTH -
    MARGIN.left -
    MARGIN.right;

  const plotHeight =
    VIEWBOX_HEIGHT -
    MARGIN.top -
    MARGIN.bottom;

  const chartRight =
    MARGIN.left +
    plotWidth;

  const chartBottom =
    MARGIN.top +
    plotHeight;

  /* =======================================================
     ESCALA NUMÉRICA
  ======================================================= */

  const numericRange =
    getNumericRange(allValues);

  const calculatedMin =
    numericRange.min;

  const calculatedMax =
    numericRange.max;

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
   * Protección contra rango vacío.
   */

  if (rawMin === rawMax) {
    const padding =
      Math.abs(rawMin) > 0
        ? Math.abs(rawMin) * 0.15
        : 1;

    rawMin -= padding;
    rawMax += padding;
  }

  const scale =
    createNiceScale({
      min: rawMin,
      max: rawMax,
      targetTicks: 6,
    });

  /* =======================================================
     POSICIÓN Y
  ======================================================= */

  const getY = (
    value: number
  ): number => {
    const safeValue =
      clamp(
        value,
        scale.min,
        scale.max
      );

    const range =
      scale.max -
      scale.min;

    if (
      !Number.isFinite(range) ||
      range <= 0
    ) {
      return (
        MARGIN.top +
        plotHeight / 2
      );
    }

    const normalized =
      (safeValue -
        scale.min) /
      range;

    return (
      MARGIN.top +
      plotHeight -
      normalized * plotHeight
    );
  };

  /* =======================================================
     POSICIÓN X
  ======================================================= */

  const getX = (
    index: number
  ): number => {
    if (
      categories.length <= 1
    ) {
      return (
        MARGIN.left +
        plotWidth / 2
      );
    }

    return (
      MARGIN.left +
      (index /
        (categories.length - 1)) *
        plotWidth
    );
  };

  /* =======================================================
     EJE CERO
  ======================================================= */

  const zeroAxisY =
    scale.min <= 0 &&
    scale.max >= 0
      ? getY(0)
      : null;

  /* =======================================================
     CLIP ID
  ======================================================= */

  const safeId =
    uniqueId.replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );

  const clipId =
    `peakscore-line-${safeId}`;

  /* =======================================================
     CONFIGURACIÓN VISUAL
  ======================================================= */

  const showGrid =
    data.show_grid !== false;

  const showLegend =
    data.show_legend !== false &&
    series.length > 1;

  /* =======================================================
     SEGMENTOS

     Un null rompe la línea.

     Ejemplo:

     [10, 20, null, 50]

     Produce:

     10 ─── 20

     50

     NO conecta 20 con 50.
  ======================================================= */

  const createSegments = (
    values: (
      number | null
    )[]
  ): ChartSegment[] => {
    const segments:
      ChartSegment[] = [];

    let currentSegment:
      ChartPoint[] = [];

    values.forEach(
      (value, index) => {
        const isValid =
          isFiniteNumber(value) &&
          index < categories.length;

        if (!isValid) {
          if (
            currentSegment.length >
            0
          ) {
            segments.push({
              points:
                currentSegment,
            });

            currentSegment = [];
          }

          return;
        }

        currentSegment.push({
          index,
          value,
        });
      }
    );

    if (
      currentSegment.length > 0
    ) {
      segments.push({
        points:
          currentSegment,
      });
    }

    return segments;
  };

  /* =======================================================
     PUNTOS VÁLIDOS
  ======================================================= */

  const getValidPoints = (
    values: (
      number | null
    )[]
  ): ChartPoint[] => {
    return values
      .map(
        (
          value,
          index
        ) => ({
          value,
          index,
        })
      )
      .filter(
        (
          point
        ): point is {
          value: number;
          index: number;
        } =>
          isFiniteNumber(
            point.value
          ) &&
          point.index <
            categories.length
      )
      .map((point) => ({
        index:
          point.index,
        value:
          point.value,
      }));
  };

  /* =======================================================
     PATH SVG
  ======================================================= */

  const createPath = (
    points: ChartPoint[]
  ): string =>
    points
      .map(
        (
          point,
          pointIndex
        ) => {
          const x =
            getX(point.index);

          const y =
            getY(point.value);

          return `${
            pointIndex === 0
              ? "M"
              : "L"
          } ${x} ${y}`;
        }
      )
      .join(" ");

  /* =======================================================
     LABELS X INTELIGENTES
  ======================================================= */

  const getLabelStep = (): number => {
    if (
      categories.length <= 8
    ) {
      return 1;
    }

    if (
      categories.length <= 16
    ) {
      return 2;
    }

    if (
      categories.length <= 24
    ) {
      return 3;
    }

    return Math.ceil(
      categories.length / 8
    );
  };

  const xLabelStep =
    getLabelStep();

  /* =======================================================
     LEYENDA
  ======================================================= */

  const legendMarkerSize =
    ICFES_VISUAL_THEME
      .legend
      .markerSize;

  const legendGap =
    ICFES_VISUAL_THEME
      .legend
      .gap;

  const legendItemWidth =
    Math.min(
      180,
      plotWidth /
        Math.max(
          series.length,
          1
        )
    );

  const legendTotalWidth =
    legendItemWidth *
    series.length;

  const legendStartX =
    MARGIN.left +
    Math.max(
      0,
      (
        plotWidth -
        legendTotalWidth
      ) / 2
    );

  const legendY =
    MARGIN.top - 26;

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
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="block min-w-[640px] w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={
            data.title ??
            "Gráfica de líneas"
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
              "Gráfica de líneas"}
          </title>

          {/* ===============================================
              DEFINICIONES
          =============================================== */}

          <defs>
            <clipPath id={clipId}>
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={plotWidth}
                height={plotHeight}
              />
            </clipPath>
          </defs>

          {/* ===============================================
              FONDO
          =============================================== */}

          <rect
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill={
              ICFES_VISUAL_THEME
                .background
                .primary
            }
          />

          {/* ===============================================
              GRID HORIZONTAL + TICKS
          =============================================== */}

          {scale.ticks.map(
            (tick) => {
              const y =
                getY(tick);

              const isZero =
                Math.abs(tick) <
                  0.000001 &&
                zeroAxisY !== null;

              return (
                <g
                  key={`horizontal-${tick}`}
                >
                  {showGrid && (
                    <line
                      x1={MARGIN.left}
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

                  <line
                    x1={
                      MARGIN.left -
                      ICFES_VISUAL_THEME
                        .axis
                        .tickLength
                    }
                    y1={y}
                    x2={MARGIN.left}
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

                  <text
                    x={
                      MARGIN.left -
                      15
                    }
                    y={y + 4}
                    textAnchor="end"
                    fontSize={
                      ICFES_VISUAL_THEME
                        .typography
                        .tickLabelSize
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
              GRID VERTICAL
          =============================================== */}

          {showGrid &&
            categories.map(
              (_, index) => {
                const x =
                  getX(index);

                return (
                  <line
                    key={`vertical-${index}`}
                    x1={x}
                    y1={MARGIN.top}
                    x2={x}
                    y2={chartBottom}
                    stroke={
                      ICFES_VISUAL_THEME
                        .grid
                        .color
                    }
                    strokeWidth={
                      ICFES_VISUAL_THEME
                        .grid
                        .width
                    }
                    opacity={
                      ICFES_VISUAL_THEME
                        .grid
                        .opacity *
                      0.65
                    }
                    strokeDasharray={
                      ICFES_VISUAL_THEME
                        .grid
                        .dashArray
                    }
                  />
                );
              }
            )}

          {/* ===============================================
              EJE Y
          =============================================== */}

          <line
            x1={MARGIN.left}
            y1={MARGIN.top}
            x2={MARGIN.left}
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
              EJE X

              Si 0 está dentro de la escala,
              usamos el eje de referencia.
          =============================================== */}

          <line
            x1={MARGIN.left}
            y1={
              zeroAxisY ??
              chartBottom
            }
            x2={chartRight}
            y2={
              zeroAxisY ??
              chartBottom
            }
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
              TICKS X + LABELS
          =============================================== */}

          {categories.map(
            (
              category,
              index
            ) => {
              const shouldShow =
                index %
                  xLabelStep ===
                  0 ||
                index ===
                  categories.length -
                    1;

              const x =
                getX(index);

              const axisY =
                zeroAxisY ??
                chartBottom;

              return (
                <g
                  key={`category-${index}`}
                >
                  <line
                    x1={x}
                    y1={axisY}
                    x2={x}
                    y2={
                      axisY +
                      ICFES_VISUAL_THEME
                        .axis
                        .tickLength
                    }
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

                  {shouldShow && (
                    <text
                      x={x}
                      y={
                        chartBottom +
                        25
                      }
                      textAnchor="middle"
                      fontSize={
                        ICFES_VISUAL_THEME
                          .typography
                          .axisLabelSize
                      }
                      fill={
                        ICFES_VISUAL_THEME
                          .text
                          .secondary
                      }
                    >
                      {splitCategoryLabel(
                        category
                      ).map(
                        (
                          line,
                          lineIndex
                        ) => (
                          <tspan
                            key={`${lineIndex}-${line}`}
                            x={x}
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
                  )}
                </g>
              );
            }
          )}

          {/* ===============================================
              SERIES
          =============================================== */}

          <g
            clipPath={`url(#${clipId})`}
          >
            {series.map(
              (
                serie,
                seriesIndex
              ) => {
                const color =
                  getAcademicSeriesColor(
                    seriesIndex
                  );

                const segments =
                  createSegments(
                    serie.values
                  );

                const validPoints =
                  getValidPoints(
                    serie.values
                  );

                if (
                  validPoints.length ===
                  0
                ) {
                  return null;
                }

                return (
                  <g
                    key={`series-${seriesIndex}`}
                  >
                    {/* LÍNEAS */}

                    {segments.map(
                      (
                        segment,
                        segmentIndex
                      ) => {
                        /**
                         * Un único punto no debe
                         * crear un path vacío visual.
                         */

                        if (
                          segment.points
                            .length < 2
                        ) {
                          return null;
                        }

                        const path =
                          createPath(
                            segment.points
                          );

                        return (
                          <path
                            key={`segment-${seriesIndex}-${segmentIndex}`}
                            d={path}
                            fill="none"
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      }
                    )}

                    {/* PUNTOS */}

                    {validPoints.map(
                      (point) => {
                        const x =
                          getX(
                            point.index
                          );

                        const y =
                          getY(
                            point.value
                          );

                        return (
                          <g
                            key={`point-${seriesIndex}-${point.index}`}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r="6"
                              fill={
                                ICFES_VISUAL_THEME
                                  .background
                                  .primary
                              }
                              stroke={color}
                              strokeWidth="2.5"
                            />

                            <circle
                              cx={x}
                              cy={y}
                              r="2.5"
                              fill={color}
                            />

                            <title>
                              {`${serie.name}: ${formatChartValue(
                                point.value
                              )}`}
                            </title>
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
              LEYENDA
          =============================================== */}

          {showLegend && (
            <g>
              {series.map(
                (
                  serie,
                  index
                ) => {
                  const legendX =
                    legendStartX +
                    index *
                      legendItemWidth;

                  const name =
                    serie.name.length >
                    20
                      ? `${serie.name.slice(
                          0,
                          18
                        )}…`
                      : serie.name;

                  const color =
                    getAcademicSeriesColor(
                      index
                    );

                  return (
                    <g
                      key={`legend-${index}`}
                    >
                      <line
                        x1={legendX}
                        y1={legendY}
                        x2={
                          legendX +
                          legendMarkerSize +
                          8
                        }
                        y2={legendY}
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      <circle
                        cx={
                          legendX +
                          (
                            legendMarkerSize +
                            8
                          ) /
                            2
                        }
                        cy={legendY}
                        r="3"
                        fill={color}
                      />

                      <text
                        x={
                          legendX +
                          legendMarkerSize +
                          8 +
                          legendGap
                        }
                        y={legendY + 4}
                        fontSize={
                          ICFES_VISUAL_THEME
                            .legend
                            .fontSize
                        }
                        fill={
                          ICFES_VISUAL_THEME
                            .legend
                            .textColor
                        }
                      >
                        {name}
                      </text>

                      <title>
                        {serie.name}
                      </title>
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
                MARGIN.top +
                plotHeight / 2
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
                MARGIN.top +
                plotHeight / 2
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
                MARGIN.left +
                plotWidth / 2
              }
              y={
                VIEWBOX_HEIGHT -
                16
              }
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