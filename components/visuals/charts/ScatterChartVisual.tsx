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

interface ScatterChartVisualProps {
  data: ChartVisualData;
}

/* =========================================================
   PEAKSCORE — SCATTER CHART VISUAL

   Gráfica de dispersión académica.

   Reglas:

   - Cada valor de una serie representa Y.
   - categories[index] representa X cuando es numérico.
   - Si X no es numérico, se utiliza la posición del dato.
   - Los puntos NO se conectan.
   - Respeta y_min / y_max definidos por el visual.
   - Respeta show_grid.
   - Respeta show_legend.
   - Soporta múltiples series.
   - Mantiene una apariencia académica tipo ICFES.
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

interface ScatterPoint {
  x: number;
  y: number;
  seriesIndex: number;
  seriesName: string;
  pointIndex: number;
}

/* =========================================================
   HELPERS
========================================================= */

/**
 * Convierte un valor a número cuando es posible.
 *
 * Permite:
 * - number
 * - strings numéricos
 * - strings con coma decimal
 *
 * Si no es válido devuelve null.
 */
function parseNumeric(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .replace(",", ".");

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Evita escalas degeneradas cuando todos
 * los datos tienen exactamente el mismo valor.
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

/* =========================================================
   COMPONENTE
========================================================= */

export default function ScatterChartVisual({
  data,
}: ScatterChartVisualProps) {
  const series = data.series ?? [];
  const categories = data.categories ?? [];

  /* =======================================================
     PROCESAMIENTO DE DATOS Y ESCALAS
  ======================================================= */

  const {
    points,
    xScale,
    yScale,
  } = useMemo(() => {
    const generatedPoints: ScatterPoint[] = [];

    /* -------------------------------------------------------
       CREAR PUNTOS
    ------------------------------------------------------- */

    series.forEach(
      (
        currentSeries: ChartSeries,
        seriesIndex: number
      ) => {
        const values =
          currentSeries.values ?? [];

        values.forEach(
          (
            value: number,
            pointIndex: number
          ) => {
            /*
             * Los valores inválidos no deben
             * convertirse en 0.
             */
            if (!Number.isFinite(value)) {
              return;
            }

            const category =
              categories[pointIndex];

            const parsedCategory =
              parseNumeric(category);

            /*
             * Si categories contiene valores
             * numéricos, funcionan como X.
             *
             * Si no, utilizamos 1, 2, 3...
             */
            const x =
              parsedCategory !== null
                ? parsedCategory
                : pointIndex + 1;

            generatedPoints.push({
              x,
              y: value,
              seriesIndex,
              seriesName:
                currentSeries.name ||
                `Serie ${seriesIndex + 1}`,
              pointIndex,
            });
          }
        );
      }
    );

    /* -------------------------------------------------------
       VALORES X
    ------------------------------------------------------- */

    const xValues =
      generatedPoints.map(
        (point) => point.x
      );

    /* -------------------------------------------------------
       VALORES Y
    ------------------------------------------------------- */

    const yValues =
      generatedPoints.map(
        (point) => point.y
      );

    const safeXValues =
      xValues.length > 0
        ? xValues
        : [0, 1];

    const safeYValues =
      yValues.length > 0
        ? yValues
        : [0, 1];

    /* -------------------------------------------------------
       RANGO X

       IMPORTANTE:
       ChartVisualData NO tiene x_min/x_max.
       No inventamos propiedades.
    ------------------------------------------------------- */

    const xMin =
      Math.min(...safeXValues);

    const xMax =
      Math.max(...safeXValues);

    /* -------------------------------------------------------
       RANGO Y

       Aquí sí utilizamos y_min / y_max porque
       existen en ChartVisualData.
    ------------------------------------------------------- */

    const yMin =
      data.y_min ??
      Math.min(0, ...safeYValues);

    const yMax =
      data.y_max ??
      Math.max(0, ...safeYValues);

    const safeXRange =
      getSafeRange(
        xMin,
        xMax
      );

    const safeYRange =
      getSafeRange(
        yMin,
        yMax
      );

    /* -------------------------------------------------------
       ESCALA X
    ------------------------------------------------------- */

    const calculatedXScale =
      createNiceScale({
        min: safeXRange.min,
        max: safeXRange.max,
        targetTicks: 6,
      });

    /* -------------------------------------------------------
       ESCALA Y
    ------------------------------------------------------- */

    const calculatedYScale =
      createNiceScale({
        min: safeYRange.min,
        max: safeYRange.max,
        targetTicks: 6,
      });

    return {
      points: generatedPoints,
      xScale: calculatedXScale,
      yScale: calculatedYScale,
    };
  }, [
    categories,
    data.y_max,
    data.y_min,
    series,
  ]);

  /* =======================================================
     ÁREA INTERNA DEL GRÁFICO
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
    value: number
  ): number => {
    const range =
      xScale.max -
      xScale.min;

    if (range === 0) {
      return (
        MARGIN.left +
        chartWidth / 2
      );
    }

    return (
      MARGIN.left +
      ((value - xScale.min) /
        range) *
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
     VISIBILIDAD DEL CERO
  ======================================================= */

  const zeroXVisible =
    xScale.min <= 0 &&
    xScale.max >= 0;

  const zeroYVisible =
    yScale.min <= 0 &&
    yScale.max >= 0;

  /* =======================================================
     POSICIÓN DE LOS EJES
  ======================================================= */

  const xAxisY = zeroYVisible
    ? getYPosition(0)
    : MARGIN.top + chartHeight;

  const yAxisX = zeroXVisible
    ? getXPosition(0)
    : MARGIN.left;

  /* =======================================================
     LEYENDA
  ======================================================= */

  const hasLegend =
    data.show_legend !== false &&
    series.length > 1;

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
            "Gráfica de dispersión"
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
              GRID VERTICAL
          ================================================= */}

          {data.show_grid !== false &&
            xScale.ticks.map(
              (tick: number) => {
                const x =
                  getXPosition(tick);

                return (
                  <line
                    key={`x-grid-${tick}`}
                    x1={x}
                    x2={x}
                    y1={MARGIN.top}
                    y2={
                      MARGIN.top +
                      chartHeight
                    }
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
            x1={yAxisX}
            x2={yAxisX}
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
                    yAxisX -
                    axisTickLength
                  }
                  x2={yAxisX}
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

          {xScale.ticks.map(
            (tick: number) => {
              const x =
                getXPosition(tick);

              return (
                <line
                  key={`x-tick-${tick}`}
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
                  x={yAxisX - 10}
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

          {xScale.ticks.map(
            (tick: number) => {
              const x =
                getXPosition(tick);

              return (
                <text
                  key={`x-label-${tick}`}
                  x={x}
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
                  {formatChartValue(
                    tick
                  )}
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
              PUNTOS DE DISPERSIÓN
          ================================================= */}

          {points.map(
            (
              point: ScatterPoint
            ) => {
              const cx =
                getXPosition(
                  point.x
                );

              const cy =
                getYPosition(
                  point.y
                );

              const pointColor =
                getAcademicSeriesColor(
                  point.seriesIndex
                );

              return (
                <g
                  key={`${point.seriesIndex}-${point.pointIndex}`}
                >
                  {/* Halo muy sutil */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill={pointColor}
                    opacity={0.12}
                  />

                  {/* Punto principal */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5.5}
                    fill={pointColor}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    <title>
                      {`${point.seriesName}: (${formatChartValue(
                        point.x
                      )}, ${formatChartValue(
                        point.y
                      )})`}
                    </title>
                  </circle>
                </g>
              );
            }
          )}

          {/* =================================================
              ESTADO SIN DATOS
          ================================================= */}

          {points.length === 0 && (
            <text
              x={
                MARGIN.left +
                chartWidth / 2
              }
              y={
                MARGIN.top +
                chartHeight / 2
              }
              textAnchor="middle"
              fontSize={14}
              fontWeight={
                regularFontWeight
              }
              fill={secondaryText}
            >
              No hay datos disponibles
            </text>
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
                        rounded-full
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