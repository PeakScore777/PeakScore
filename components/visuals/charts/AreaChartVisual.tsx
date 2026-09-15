"use client";

import { useMemo } from "react";

import ChartContainer from "./ChartContainer";

import {
  createNiceScale,
  formatChartValue,
} from "./chartUtils";

import {
  getAcademicSeriesColor,
  ICFES_VISUAL_THEME,
} from "@/lib/visuals/visualTheme";

import type {
  ChartVisualData,
  ChartSeries,
} from "@/lib/visuals/types";

interface AreaChartVisualProps {
  data: ChartVisualData;
}

/* =========================================================
   PEAKSCORE — AREA CHART VISUAL

   Gráfica de área para representar evolución,
   magnitudes acumuladas o cambios continuos.

   Características:

   - Múltiples series.
   - Escala Y automática.
   - Respeta y_min / y_max.
   - Área real con relleno.
   - Línea superior.
   - Puntos de referencia.
   - Grid configurable.
   - Leyenda configurable.
   - Manejo seguro de datos faltantes.
   - Tema académico ICFES.
========================================================= */

/* =========================================================
   DIMENSIONES SVG
========================================================= */

const SVG_WIDTH = 760;
const SVG_HEIGHT = 440;

const MARGIN = {
  top: 32,
  right: 36,
  bottom: 64,
  left: 72,
};

/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface AreaPoint {
  index: number;
  value: number;
}

/* =========================================================
   HELPERS
========================================================= */

/**
 * Determina cuántos puntos debe tener el eje X.
 *
 * No dependemos exclusivamente de categories porque
 * una serie puede contener más valores que categorías.
 */
function getPointCount(
  categories: unknown[],
  series: ChartSeries[]
): number {
  const seriesPointCount =
    series.reduce(
      (max, currentSeries) =>
        Math.max(
          max,
          currentSeries.values?.length ?? 0
        ),
      0
    );

  return Math.max(
    categories.length,
    seriesPointCount,
    1
  );
}

/**
 * Crea un rango seguro cuando min y max
 * son iguales.
 */
function getSafeRange(
  min: number,
  max: number
): {
  min: number;
  max: number;
} {
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return {
      min: 0,
      max: 1,
    };
  }

  if (min === max) {
    const padding =
      Math.abs(min) > 0
        ? Math.abs(min) * 0.1
        : 1;

    return {
      min: min - padding,
      max: max + padding,
    };
  }

  return {
    min,
    max,
  };
}

/**
 * Devuelve únicamente valores numéricos válidos.
 *
 * Importante:
 * null/undefined/NaN NO se convierten en cero.
 */
function getValidValues(
  series: ChartSeries[]
): number[] {
  return series.flatMap(
    (currentSeries) =>
      (currentSeries.values ?? []).filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value)
      )
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function AreaChartVisual({
  data,
}: AreaChartVisualProps) {
  const series = data.series ?? [];
  const categories = data.categories ?? [];

  /* =======================================================
     NÚMERO DE PUNTOS
  ======================================================= */

  const pointCount = useMemo(
    () =>
      getPointCount(
        categories,
        series
      ),
    [categories, series]
  );

  /* =======================================================
     ESCALA Y
  ======================================================= */

  const yScale = useMemo(() => {
    const values =
      getValidValues(series);

    const safeValues =
      values.length > 0
        ? values
        : [0, 1];

    const calculatedMin =
      data.y_min ??
      Math.min(
        0,
        ...safeValues
      );

    const calculatedMax =
      data.y_max ??
      Math.max(
        0,
        ...safeValues
      );

    const safeRange =
      getSafeRange(
        calculatedMin,
        calculatedMax
      );

    return createNiceScale({
      min: safeRange.min,
      max: safeRange.max,
      targetTicks: 6,
    });
  }, [
    data.y_max,
    data.y_min,
    series,
  ]);

  /* =======================================================
     ÁREA INTERNA
  ======================================================= */

  const chartWidth =
    SVG_WIDTH -
    MARGIN.left -
    MARGIN.right;

  const chartHeight =
    SVG_HEIGHT -
    MARGIN.top -
    MARGIN.bottom;

  /* =======================================================
     POSICIÓN X
  ======================================================= */

  const getXPosition = (
    index: number
  ): number => {
    const denominator =
      Math.max(
        pointCount - 1,
        1
      );

    return (
      MARGIN.left +
      (index / denominator) *
        chartWidth
    );
  };

  /* =======================================================
     POSICIÓN Y
  ======================================================= */

  const getYPosition = (
    value: number
  ): number => {
    const range =
      yScale.max -
      yScale.min;

    if (range === 0) {
      return (
        MARGIN.top +
        chartHeight / 2
      );
    }

    return (
      MARGIN.top +
      chartHeight -
      ((value - yScale.min) /
        range) *
        chartHeight
    );
  };

  /* =======================================================
     LÍNEA BASE DEL ÁREA
  ======================================================= */

  const zeroVisible =
    yScale.min <= 0 &&
    yScale.max >= 0;

  const baseValue =
    zeroVisible
      ? 0
      : yScale.min;

  const baseY =
    getYPosition(baseValue);

  /* =======================================================
     POSICIÓN EJE X
  ======================================================= */

  const xAxisY =
    zeroVisible
      ? getYPosition(0)
      : MARGIN.top +
        chartHeight;

  /* =======================================================
     LEYENDA
  ======================================================= */

  const hasLegend =
    data.show_legend !== false &&
    series.length > 1;

  /* =======================================================
     CREAR SEGMENTOS DE DATOS

     Los valores faltantes separan la línea y el área.
     Esto evita conectar artificialmente dos puntos
     cuando existe un dato ausente.
  ======================================================= */

  const createSegments = (
    values: number[]
  ): AreaPoint[][] => {
    const segments: AreaPoint[][] = [];
    let currentSegment: AreaPoint[] = [];

    values.forEach(
      (value, index) => {
        if (
          typeof value !== "number" ||
          !Number.isFinite(value)
        ) {
          if (
            currentSegment.length > 0
          ) {
            segments.push(
              currentSegment
            );

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
      segments.push(
        currentSegment
      );
    }

    return segments;
  };

  /* =======================================================
     CREAR PATH DE LÍNEA
  ======================================================= */

  const createLinePath = (
    points: AreaPoint[]
  ): string => {
    if (points.length === 0) {
      return "";
    }

    return points
      .map(
        (
          point,
          pointIndex
        ) => {
          const x =
            getXPosition(
              point.index
            );

          const y =
            getYPosition(
              point.value
            );

          return pointIndex === 0
            ? `M ${x} ${y}`
            : `L ${x} ${y}`;
        }
      )
      .join(" ");
  };

  /* =======================================================
     CREAR PATH DE ÁREA
  ======================================================= */

  const createAreaPath = (
    points: AreaPoint[]
  ): string => {
    if (points.length === 0) {
      return "";
    }

    /*
     * Con un único punto no tiene sentido
     * crear un área.
     */
    if (points.length === 1) {
      return "";
    }

    const firstPoint =
      points[0];

    const lastPoint =
      points[
        points.length - 1
      ];

    const linePath =
      createLinePath(points);

    const firstX =
      getXPosition(
        firstPoint.index
      );

    const lastX =
      getXPosition(
        lastPoint.index
      );

    return [
      linePath,
      `L ${lastX} ${baseY}`,
      `L ${firstX} ${baseY}`,
      "Z",
    ].join(" ");
  };

  /* =======================================================
     TEMA VISUAL
  ======================================================= */

  const axisColor =
    ICFES_VISUAL_THEME.axis.color;

  const axisWidth =
    ICFES_VISUAL_THEME.axis.width;

  const axisTickWidth =
    ICFES_VISUAL_THEME.axis
      .tickWidth;

  const axisTickLength =
    ICFES_VISUAL_THEME.axis
      .tickLength;

  const gridColor =
    ICFES_VISUAL_THEME.grid.color;

  const gridWidth =
    ICFES_VISUAL_THEME.grid.width;

  const gridOpacity =
    ICFES_VISUAL_THEME.grid.opacity;

  const gridDashArray =
    ICFES_VISUAL_THEME.grid
      .dashArray;

  const fontFamily =
    ICFES_VISUAL_THEME.typography
      .fontFamily;

  const tickLabelSize =
    ICFES_VISUAL_THEME.typography
      .tickLabelSize;

  const axisLabelSize =
    ICFES_VISUAL_THEME.typography
      .axisLabelSize;

  const regularFontWeight =
    ICFES_VISUAL_THEME.typography
      .fontWeight.regular;

  const mediumFontWeight =
    ICFES_VISUAL_THEME.typography
      .fontWeight.medium;

  const primaryText =
    ICFES_VISUAL_THEME.text.primary;

  const secondaryText =
    ICFES_VISUAL_THEME.text.secondary;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <ChartContainer
      title={data.title}
      xLabel={null}
      yLabel={null}
    >
      <div className="w-full">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={
            data.title ??
            "Gráfica de área"
          }
          style={{
            fontFamily,
          }}
        >
          {/* =================================================
              GRID HORIZONTAL
          ================================================= */}

          {data.show_grid !== false &&
            yScale.ticks.map(
              (tick: number) => {
                const y =
                  getYPosition(tick);

                return (
                  <line
                    key={`y-grid-${tick}`}
                    x1={MARGIN.left}
                    x2={
                      MARGIN.left +
                      chartWidth
                    }
                    y1={y}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth={
                      gridWidth
                    }
                    opacity={
                      gridOpacity
                    }
                    strokeDasharray={
                      gridDashArray
                    }
                  />
                );
              }
            )}

          {/* =================================================
              EJE X
          ================================================= */}

          <line
            x1={MARGIN.left}
            x2={
              MARGIN.left +
              chartWidth
            }
            y1={xAxisY}
            y2={xAxisY}
            stroke={axisColor}
            strokeWidth={axisWidth}
          />

          {/* =================================================
              EJE Y
          ================================================= */}

          <line
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={
              MARGIN.top +
              chartHeight
            }
            stroke={axisColor}
            strokeWidth={axisWidth}
          />

          {/* =================================================
              TICKS EJE Y
          ================================================= */}

          {yScale.ticks.map(
            (tick: number) => {
              const y =
                getYPosition(tick);

              return (
                <line
                  key={`y-tick-${tick}`}
                  x1={
                    MARGIN.left -
                    axisTickLength
                  }
                  x2={MARGIN.left}
                  y1={y}
                  y2={y}
                  stroke={axisColor}
                  strokeWidth={
                    axisTickWidth
                  }
                />
              );
            }
          )}

          {/* =================================================
              TICKS EJE X
          ================================================= */}

          {Array.from({
            length: pointCount,
          }).map(
            (_, index) => {
              const x =
                getXPosition(index);

              return (
                <line
                  key={`x-tick-${index}`}
                  x1={x}
                  x2={x}
                  y1={xAxisY}
                  y2={
                    xAxisY +
                    axisTickLength
                  }
                  stroke={axisColor}
                  strokeWidth={
                    axisTickWidth
                  }
                />
              );
            }
          )}

          {/* =================================================
              ETIQUETAS EJE Y
          ================================================= */}

          {yScale.ticks.map(
            (tick: number) => {
              const y =
                getYPosition(tick);

              return (
                <text
                  key={`y-label-${tick}`}
                  x={
                    MARGIN.left - 12
                  }
                  y={y + 4}
                  textAnchor="end"
                  fontSize={
                    tickLabelSize
                  }
                  fontWeight={
                    regularFontWeight
                  }
                  fill={secondaryText}
                >
                  {formatChartValue(
                    tick
                  )}
                </text>
              );
            }
          )}

          {/* =================================================
              ETIQUETAS EJE X
          ================================================= */}

          {Array.from({
            length: pointCount,
          }).map(
            (_, index) => {
              /*
               * Solo mostramos una etiqueta cuando
               * realmente existe una categoría.
               */
              if (
                index >=
                categories.length
              ) {
                return null;
              }

              const category =
                categories[index];

              return (
                <text
                  key={`x-label-${index}`}
                  x={
                    getXPosition(
                      index
                    )
                  }
                  y={
                    xAxisY + 24
                  }
                  textAnchor="middle"
                  fontSize={
                    tickLabelSize
                  }
                  fontWeight={
                    regularFontWeight
                  }
                  fill={secondaryText}
                >
                  {String(category)}
                </text>
              );
            }
          )}

          {/* =================================================
              NOMBRE DEL EJE X
          ================================================= */}

          {data.x_label && (
            <text
              x={
                MARGIN.left +
                chartWidth / 2
              }
              y={
                SVG_HEIGHT - 10
              }
              textAnchor="middle"
              fontSize={
                axisLabelSize
              }
              fontWeight={
                mediumFontWeight
              }
              fill={primaryText}
            >
              {data.x_label}
            </text>
          )}

          {/* =================================================
              NOMBRE DEL EJE Y
          ================================================= */}

          {data.y_label && (
            <text
              x={18}
              y={
                MARGIN.top +
                chartHeight / 2
              }
              textAnchor="middle"
              fontSize={
                axisLabelSize
              }
              fontWeight={
                mediumFontWeight
              }
              fill={primaryText}
              transform={`
                rotate(
                  -90
                  18
                  ${
                    MARGIN.top +
                    chartHeight / 2
                  }
                )
              `}
            >
              {data.y_label}
            </text>
          )}

          {/* =================================================
              ÁREAS
          ================================================= */}

          {series.map(
            (
              currentSeries: ChartSeries,
              seriesIndex: number
            ) => {
              const segments =
                createSegments(
                  currentSeries.values
                );

              const color =
                getAcademicSeriesColor(
                  seriesIndex
                );

              return segments.map(
                (
                  segment,
                  segmentIndex
                ) => {
                  const areaPath =
                    createAreaPath(
                      segment
                    );

                  if (
                    !areaPath
                  ) {
                    return null;
                  }

                  return (
                    <path
                      key={
                        `${
                          currentSeries.id ??
                          `series-${seriesIndex}`
                        }-area-${segmentIndex}`
                      }
                      d={areaPath}
                      fill={color}
                      fillOpacity={0.14}
                      stroke="none"
                    />
                  );
                }
              );
            }
          )}

          {/* =================================================
              LÍNEAS
          ================================================= */}

          {series.map(
            (
              currentSeries: ChartSeries,
              seriesIndex: number
            ) => {
              const segments =
                createSegments(
                  currentSeries.values
                );

              const color =
                getAcademicSeriesColor(
                  seriesIndex
                );

              return segments.map(
                (
                  segment,
                  segmentIndex
                ) => {
                  const linePath =
                    createLinePath(
                      segment
                    );

                  if (
                    !linePath
                  ) {
                    return null;
                  }

                  return (
                    <path
                      key={
                        `${
                          currentSeries.id ??
                          `series-${seriesIndex}`
                        }-line-${segmentIndex}`
                      }
                      d={linePath}
                      fill="none"
                      stroke={color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                }
              );
            }
          )}

          {/* =================================================
              PUNTOS
          ================================================= */}

          {series.map(
            (
              currentSeries: ChartSeries,
              seriesIndex: number
            ) => {
              const color =
                getAcademicSeriesColor(
                  seriesIndex
                );

              return (
                currentSeries.values.map(
                  (
                    value,
                    pointIndex
                  ) => {
                    if (
                      typeof value !==
                        "number" ||
                      !Number.isFinite(
                        value
                      )
                    ) {
                      return null;
                    }

                    const cx =
                      getXPosition(
                        pointIndex
                      );

                    const cy =
                      getYPosition(
                        value
                      );

                    return (
                      <circle
                        key={`${seriesIndex}-${pointIndex}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#ffffff"
                        stroke={color}
                        strokeWidth={2}
                      >
                        <title>
                          {`${
                            currentSeries.name ||
                            `Serie ${
                              seriesIndex + 1
                            }`
                          }: ${formatChartValue(
                            value
                          )}`}
                        </title>
                      </circle>
                    );
                  }
                )
              );
            }
          )}
        </svg>

        {/* =================================================
            LEYENDA
        ================================================= */}

        {hasLegend && (
          <div
            className="
              mt-3
              flex
              flex-wrap
              justify-center
              gap-x-6
              gap-y-2
            "
          >
            {series.map(
              (
                currentSeries: ChartSeries,
                index: number
              ) => {
                const seriesName =
                  currentSeries.name ||
                  `Serie ${index + 1}`;

                const color =
                  getAcademicSeriesColor(
                    index
                  );

                return (
                  <div
                    key={
                      currentSeries.id ??
                      `${seriesName}-${index}`
                    }
                    className="
                      flex
                      items-center
                      gap-2
                    "
                    style={{
                      fontSize:
                        ICFES_VISUAL_THEME
                          .legend
                          .fontSize,
                      color:
                        ICFES_VISUAL_THEME
                          .legend
                          .textColor,
                    }}
                  >
                    <span
                      className="
                        shrink-0
                        rounded-sm
                      "
                      style={{
                        width:
                          ICFES_VISUAL_THEME
                            .legend
                            .markerSize,
                        height:
                          ICFES_VISUAL_THEME
                            .legend
                            .markerSize,
                        backgroundColor:
                          color,
                      }}
                    />

                    <span>
                      {seriesName}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </ChartContainer>
  );
}