"use client";

import type {
  ChartVisualData,
  DiagramVisualData,
  GeometryVisualData,
  MathGraphVisualData,
  TableVisualData,
  VisualData,
  VisualType,
} from "@/lib/visuals/types";

import {
  isChartVisualData,
  isDiagramVisualData,
  isGeometryVisualData,
  isMathGraphVisualData,
  isTableVisualData,
} from "@/lib/visuals/types";

import GeometryVisual from "@/components/visuals/GeometryVisual";
import DiagramVisual from "@/components/visuals/DiagramVisual";
import BarChartVisual from "@/components/visuals/charts/BarChartVisual";
import LineChartVisual from "@/components/visuals/charts/LineChartVisual";
import MathGraphVisual from "@/components/visuals/math/MathGraphVisual";
import PieChartVisual from "@/components/visuals/charts/PieChartVisual";
import ScatterChartVisual from "@/components/visuals/charts/ScatterChartVisual";
import AreaChartVisual from "@/components/visuals/charts/AreaChartVisual";

/* =========================================================
   PROPS
========================================================= */

interface QuestionVisualRendererProps {
  requiresVisual?: boolean;
  visualType: VisualType | null;
  visualDescription?: string | null;
  visualData: VisualData | null;
}

/* =========================================================
   UTILIDADES
========================================================= */

const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
];

function getSeriesColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function getNumericRange(values: number[]) {
  if (values.length === 0) {
    return {
      min: 0,
      max: 1,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    min: Math.min(0, min),
    max: max === min ? max + 1 : max,
  };
}

function getNiceStep(maxValue: number) {
  if (maxValue <= 5) return 1;
  if (maxValue <= 10) return 2;
  if (maxValue <= 25) return 5;
  if (maxValue <= 50) return 10;
  if (maxValue <= 100) return 20;
  if (maxValue <= 250) return 50;
  if (maxValue <= 500) return 100;

  return Math.ceil(maxValue / 5);
}

/* =========================================================
   VISUAL CONTAINER
========================================================= */

function VisualContainer({
  title,
  children,
}: {
  title?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="border-b border-slate-200 px-5 py-3">
          <h3 className="text-center text-sm font-semibold text-slate-800">
            {title}
          </h3>
        </div>
      )}

      {children}
    </section>
  );
}

/* =========================================================
   CHART RENDERER
========================================================= */

function ChartRenderer({
  data,
}: {
  data: ChartVisualData;
}) {
  const width = 760;
  const height = 420;

  const padding = {
    top: 40,
    right: 40,
    bottom: 80,
    left: 70,
  };

  const chartWidth =
    width - padding.left - padding.right;

  const chartHeight =
    height - padding.top - padding.bottom;

  const allValues = data.series.flatMap(
    (series) => series.values
  );

  const calculatedRange =
    getNumericRange(allValues);

  const yMin =
    data.y_min ?? calculatedRange.min;

  const rawYMax =
    data.y_max ?? calculatedRange.max;

  const step = getNiceStep(rawYMax);

  const yMax =
    data.y_max ??
    Math.ceil(rawYMax / step) * step;

  const range =
    yMax - yMin || 1;

  const getY = (value: number) => {
    return (
      padding.top +
      chartHeight -
      ((value - yMin) / range) * chartHeight
    );
  };

  const getX = (index: number) => {
    const count =
      Math.max(data.categories.length, 1);

    if (count === 1) {
      return padding.left + chartWidth / 2;
    }

    return (
      padding.left +
      (index / (count - 1)) * chartWidth
    );
  };

  const ticks: number[] = [];

  for (
    let value = yMin;
    value <= yMax + step * 0.1;
    value += step
  ) {
    ticks.push(Number(value.toFixed(6)));
  }

  const categoryCount =
    Math.max(data.categories.length, 1);

  /* =====================================================
     BAR CHART
  ===================================================== */

  function renderBars() {
    const seriesCount =
      Math.max(data.series.length, 1);

    const groupWidth =
      chartWidth / categoryCount;

    const availableWidth =
      groupWidth * 0.7;

    const barWidth =
      Math.max(
        10,
        availableWidth / seriesCount
      );

    return data.categories.map(
      (category, categoryIndex) => {
        const centerX =
          padding.left +
          categoryIndex * groupWidth +
          groupWidth / 2;

        return (
          <g
            key={`bar-group-${category}-${categoryIndex}`}
          >
            {data.series.map(
              (series, seriesIndex) => {
                const value =
                  series.values[categoryIndex] ?? 0;

                const zeroY =
                  getY(
                    yMin <= 0 && yMax >= 0
                      ? 0
                      : yMin
                  );

                const valueY =
                  getY(value);

                const barHeight =
                  Math.abs(valueY - zeroY);

                const x =
                  centerX -
                  availableWidth / 2 +
                  seriesIndex * barWidth;

                const y =
                  value >= 0
                    ? valueY
                    : zeroY;

                return (
                  <g
                    key={`${series.name}-${categoryIndex}`}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(
                        barWidth - 4,
                        2
                      )}
                      height={Math.max(
                        barHeight,
                        1
                      )}
                      rx="3"
                      fill={getSeriesColor(
                        seriesIndex
                      )}
                    />

                    {data.show_values && (
                      <text
                        x={
                          x +
                          Math.max(
                            barWidth - 4,
                            2
                          ) /
                            2
                        }
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#334155"
                      >
                        {value}
                      </text>
                    )}
                  </g>
                );
              }
            )}

            <text
              x={centerX}
              y={height - 45}
              textAnchor="middle"
              fontSize="12"
              fill="#475569"
            >
              {category}
            </text>
          </g>
        );
      }
    );
  }

  /* =====================================================
     LINE CHART
  ===================================================== */

  function renderLines() {
    return data.series.map(
      (series, seriesIndex) => {
        const points =
          data.categories
            .map((_, index) => {
              const value =
                series.values[index];

              if (
                value === undefined ||
                !Number.isFinite(value)
              ) {
                return null;
              }

              return `${getX(index)},${getY(
                value
              )}`;
            })
            .filter(
              (
                point
              ): point is string => point !== null
            )
            .join(" ");

        return (
          <g key={series.name}>
            <polyline
              points={points}
              fill="none"
              stroke={getSeriesColor(
                seriesIndex
              )}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {series.values.map(
              (value, index) => {
                if (
                  !Number.isFinite(value)
                ) {
                  return null;
                }

                const x = getX(index);
                const y = getY(value);

                return (
                  <g
                    key={`${series.name}-${index}`}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="white"
                      stroke={getSeriesColor(
                        seriesIndex
                      )}
                      strokeWidth="3"
                    />

                    {data.show_values && (
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#334155"
                      >
                        {value}
                      </text>
                    )}
                  </g>
                );
              }
            )}
          </g>
        );
      }
    );
  }

  /* =====================================================
     SCATTER CHART

     El modelo actual de datos utiliza categories +
     values, por lo que cada categoría representa el
     eje X ordinal.

     Si más adelante necesitamos scatter XY real,
     añadiremos un contrato específico.
  ===================================================== */

  function renderScatter() {
    return data.series.map(
      (series, seriesIndex) =>
        series.values.map(
          (value, index) => {
            if (!Number.isFinite(value)) {
              return null;
            }

            const x = getX(index);
            const y = getY(value);

            return (
              <g
                key={`${series.name}-${index}`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill={getSeriesColor(
                    seriesIndex
                  )}
                />

                {data.show_values && (
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#334155"
                  >
                    {value}
                  </text>
                )}
              </g>
            );
          }
        )
    );
  }

  /* =====================================================
     PIE CHART
  ===================================================== */

  function renderPie() {
    const series = data.series[0];

    if (!series) {
      return null;
    }

    const values =
      series.values.slice(
        0,
        data.categories.length
      );

    const total = values.reduce(
      (sum, value) =>
        sum + Math.max(value, 0),
      0
    );

    if (total <= 0) {
      return (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="#64748b"
          fontSize="14"
        >
          No hay datos disponibles
        </text>
      );
    }

    const centerX = width / 2;
    const centerY =
      padding.top + chartHeight / 2;

    const radius =
      Math.min(chartHeight / 2 - 20, 120);

    let startAngle = -Math.PI / 2;

    return values.map(
      (value, index) => {
        const percentage =
          Math.max(value, 0) / total;

        const angle =
          percentage * Math.PI * 2;

        const endAngle =
          startAngle + angle;

        const startX =
          centerX +
          radius * Math.cos(startAngle);

        const startY =
          centerY +
          radius * Math.sin(startAngle);

        const endX =
          centerX +
          radius * Math.cos(endAngle);

        const endY =
          centerY +
          radius * Math.sin(endAngle);

        const largeArc =
          angle > Math.PI ? 1 : 0;

        const path = [
          `M ${centerX} ${centerY}`,
          `L ${startX} ${startY}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
          "Z",
        ].join(" ");

        const middleAngle =
          startAngle + angle / 2;

        const labelRadius =
          radius + 35;

        const labelX =
          centerX +
          labelRadius *
            Math.cos(middleAngle);

        const labelY =
          centerY +
          labelRadius *
            Math.sin(middleAngle);

        startAngle = endAngle;

        return (
          <g
            key={`${data.categories[index]}-${index}`}
          >
            <path
              d={path}
              fill={getSeriesColor(index)}
              stroke="white"
              strokeWidth="2"
            />

            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              fontSize="12"
              fill="#334155"
            >
              {data.categories[index]}
            </text>

            {data.show_values && (
              <text
                x={
                  centerX +
                  (radius * 0.55) *
                    Math.cos(middleAngle)
                }
                y={
                  centerY +
                  (radius * 0.55) *
                    Math.sin(middleAngle)
                }
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="white"
              >
                {value}
              </text>
            )}
          </g>
        );
      }
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <VisualContainer title={data.title}>
      <div className="w-full overflow-x-auto p-4 sm:p-6">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[620px] w-full"
          role="img"
          aria-label={
            data.description ??
            data.title ??
            "Gráfica estadística"
          }
        >
          <rect
            width={width}
            height={height}
            fill="white"
          />

          {data.chart_type !== "pie" && (
            <>
              {data.show_grid !== false &&
                ticks.map((tick) => {
                  const y = getY(tick);

                  return (
                    <g key={`grid-${tick}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={
                          width -
                          padding.right
                        }
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />

                      <text
                        x={
                          padding.left - 12
                        }
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#64748b"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={
                  height -
                  padding.bottom
                }
                stroke="#94a3b8"
                strokeWidth="1.5"
              />

              <line
                x1={padding.left}
                y1={
                  height -
                  padding.bottom
                }
                x2={
                  width -
                  padding.right
                }
                y2={
                  height -
                  padding.bottom
                }
                stroke="#94a3b8"
                strokeWidth="1.5"
              />

              {data.chart_type === "bar" &&
                renderBars()}

              {data.chart_type === "line" &&
                renderLines()}

              {data.chart_type === "scatter" &&
                renderScatter()}

              {data.chart_type === "area" &&
                renderLines()}

              {data.categories.map(
                (category, index) => (
                  <text
                    key={`x-label-${category}-${index}`}
                    x={getX(index)}
                    y={height - 45}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#475569"
                  >
                    {category}
                  </text>
                )
              )}

              {data.x_label && (
                <text
                  x={width / 2}
                  y={height - 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {data.x_label}
                </text>
              )}

              {data.y_label && (
                <text
                  x="18"
                  y={height / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                  transform={`rotate(-90 18 ${
                    height / 2
                  })`}
                >
                  {data.y_label}
                </text>
              )}
            </>
          )}

          {data.chart_type === "pie" &&
            renderPie()}
        </svg>

        {data.show_legend !== false &&
          data.series.length > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
              {data.series.map(
                (series, index) => (
                  <div
                    key={series.name}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{
                        backgroundColor:
                          getSeriesColor(index),
                      }}
                    />

                    <span>
                      {series.name}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </VisualContainer>
  );
}

/* =========================================================
   TABLE RENDERER
========================================================= */

function TableRenderer({
  data,
}: {
  data: TableVisualData;
}) {
  const headers = Array.isArray(data.headers)
    ? data.headers
    : [];

  const rows = Array.isArray(data.rows)
    ? data.rows
    : [];

  /*
   * La tabla debe conservar una estructura rectangular aunque
   * una fila generada por IA tenga menos/más celdas que headers.
   * No modificamos data; solo normalizamos el render.
   */
  const columnCount = Math.max(
    headers.length,
    ...rows.map((row) =>
      Array.isArray(row) ? row.length : 0,
    ),
    0,
  );

  const safeHeaders = Array.from(
    { length: columnCount },
    (_, index) =>
      headers[index] !== undefined
        ? String(headers[index])
        : "",
  );

  const safeRows = rows.map((row) =>
    Array.from(
      { length: columnCount },
      (_, index) =>
        Array.isArray(row)
          ? row[index] ?? null
          : null,
    ),
  );

  const getCellAlignment = (
    cell: string | number | boolean | null,
  ) => {
    if (typeof cell === "number") {
      return "text-right";
    }

    if (typeof cell === "boolean") {
      return "text-center";
    }

    return "text-left";
  };

  const formatCell = (
    cell: string | number | boolean | null,
  ): string => {
    if (cell === null) {
      return "";
    }

    return String(cell);
  };

  return (
    <VisualContainer title={data.title}>
      <div className="w-full overflow-x-auto">
        {columnCount === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              No hay datos disponibles para mostrar.
            </p>
          </div>
        ) : (
          <table
            className="w-full min-w-[560px] border-collapse text-sm"
            aria-label={
              data.title ??
              "Tabla de datos"
            }
          >
            <thead>
              <tr className="bg-slate-50">
                {data.show_row_numbers && (
                  <th
                    scope="col"
                    className="
                      w-12
                      border-b
                      border-r
                      border-slate-200
                      px-3
                      py-3
                      text-center
                      text-xs
                      font-semibold
                      text-slate-500
                    "
                  >
                    #
                  </th>
                )}

                {safeHeaders.map(
                  (header, index) => (
                    <th
                      key={`header-${index}-${header}`}
                      scope="col"
                      className="
                        border-b
                        border-r
                        border-slate-200
                        px-4
                        py-3
                        text-left
                        align-middle
                        text-xs
                        font-semibold
                        leading-5
                        text-slate-700
                        last:border-r-0
                      "
                    >
                      <span className="block whitespace-normal break-words">
                        {header || `Columna ${index + 1}`}
                      </span>
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {safeRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columnCount +
                      (data.show_row_numbers
                        ? 1
                        : 0)
                    }
                    className="
                      px-6
                      py-10
                      text-center
                      text-sm
                      text-slate-500
                    "
                  >
                    No hay filas disponibles.
                  </td>
                </tr>
              ) : (
                safeRows.map(
                  (row, rowIndex) => (
                    <tr
                      key={`row-${rowIndex}`}
                      className="
                        border-b
                        border-slate-100
                        last:border-b-0
                      "
                    >
                      {data.show_row_numbers && (
                        <td
                          className="
                            border-r
                            border-slate-100
                            bg-slate-50/50
                            px-3
                            py-3
                            text-center
                            align-middle
                            text-xs
                            font-medium
                            tabular-nums
                            text-slate-500
                          "
                        >
                          {rowIndex + 1}
                        </td>
                      )}

                      {row.map(
                        (cell, cellIndex) => (
                          <td
                            key={`cell-${rowIndex}-${cellIndex}`}
                            className={[
                              "border-r border-slate-100 px-4 py-3 align-middle leading-5 text-slate-700 last:border-r-0",
                              getCellAlignment(cell),
                              data.emphasize_first_column &&
                              cellIndex === 0
                                ? "font-semibold text-slate-800"
                                : "",
                            ].join(" ")}
                          >
                            <span className="block whitespace-normal break-words">
                              {formatCell(cell)}
                            </span>
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </VisualContainer>
  );
}

/* =========================================================
   MATH GRAPH RENDERER
========================================================= */

function MathGraphRenderer({
  data,
}: {
  data: MathGraphVisualData;
}) {
  const width = 760;
  const height = 460;

  const padding = {
    top: 40,
    right: 45,
    bottom: 55,
    left: 60,
  };

  const graphWidth =
    width -
    padding.left -
    padding.right;

  const graphHeight =
    height -
    padding.top -
    padding.bottom;

  const [xMin, xMax] =
    data.x_range;

  const [yMin, yMax] =
    data.y_range;

  const getX = (x: number) =>
    padding.left +
    ((x - xMin) / (xMax - xMin)) *
      graphWidth;

  const getY = (y: number) =>
    padding.top +
    graphHeight -
    ((y - yMin) / (yMax - yMin)) *
      graphHeight;

  const xAxisY =
    yMin <= 0 && yMax >= 0
      ? getY(0)
      : null;

  const yAxisX =
    xMin <= 0 && xMax >= 0
      ? getX(0)
      : null;

  const xStep =
    data.x_axis?.step ??
    Math.max(
      1,
      Math.ceil((xMax - xMin) / 10)
    );

  const yStep =
    data.y_axis?.step ??
    Math.max(
      1,
      Math.ceil((yMax - yMin) / 10)
    );

  const xTicks: number[] = [];
  const yTicks: number[] = [];

  for (
    let x =
      Math.ceil(xMin / xStep) *
      xStep;
    x <= xMax;
    x += xStep
  ) {
    xTicks.push(x);
  }

  for (
    let y =
      Math.ceil(yMin / yStep) *
      yStep;
    y <= yMax;
    y += yStep
  ) {
    yTicks.push(y);
  }

  return (
    <VisualContainer title={data.title}>
      <div className="w-full overflow-x-auto p-4 sm:p-6">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[650px] w-full"
          role="img"
          aria-label={
            data.description ??
            data.title ??
            "Plano cartesiano"
          }
        >
          <rect
            width={width}
            height={height}
            fill="white"
          />

          {/* GRID */}

          {data.show_grid !== false &&
            xTicks.map((x) => (
              <line
                key={`vertical-${x}`}
                x1={getX(x)}
                y1={padding.top}
                x2={getX(x)}
                y2={
                  height -
                  padding.bottom
                }
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

          {data.show_grid !== false &&
            yTicks.map((y) => (
              <line
                key={`horizontal-${y}`}
                x1={padding.left}
                y1={getY(y)}
                x2={
                  width -
                  padding.right
                }
                y2={getY(y)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

          {/* AXES */}

          {data.show_axes !== false &&
            xAxisY !== null && (
              <line
                x1={padding.left}
                y1={xAxisY}
                x2={
                  width -
                  padding.right
                }
                y2={xAxisY}
                stroke="#475569"
                strokeWidth="2"
              />
            )}

          {data.show_axes !== false &&
            yAxisX !== null && (
              <line
                x1={yAxisX}
                y1={padding.top}
                x2={yAxisX}
                y2={
                  height -
                  padding.bottom
                }
                stroke="#475569"
                strokeWidth="2"
              />
            )}

          {/* NUMBERS */}

          {data.show_axis_numbers !== false &&
            xAxisY !== null &&
            xTicks.map((x) => {
              if (x === 0) return null;

              return (
                <text
                  key={`x-number-${x}`}
                  x={getX(x)}
                  y={xAxisY + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                >
                  {x}
                </text>
              );
            })}

          {data.show_axis_numbers !== false &&
            yAxisX !== null &&
            yTicks.map((y) => {
              if (y === 0) return null;

              return (
                <text
                  key={`y-number-${y}`}
                  x={yAxisX - 10}
                  y={getY(y) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {y}
                </text>
              );
            })}

          {/* POINTS */}

          {data.points.map(
            (point, index) => {
              const cx = getX(point.x);
              const cy = getY(point.y);

              const shouldShowLabel =
                point.show_label !== false &&
                Boolean(point.label);

              return (
                <g
                  key={
                    point.id ??
                    `${point.x}-${point.y}-${index}`
                  }
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill="#2563eb"
                    stroke="white"
                    strokeWidth="2"
                  />

                  {shouldShowLabel && (
                    <text
                      x={cx + 10}
                      y={cy - 10}
                      fontSize="13"
                      fill="#1e293b"
                      fontWeight="500"
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              );
            }
          )}

          {/* AXIS LABELS */}

          {data.x_label && (
            <text
              x={
                width -
                padding.right
              }
              y={
                height -
                padding.bottom +
                35
              }
              textAnchor="end"
              fontSize="13"
              fill="#475569"
            >
              {data.x_label}
            </text>
          )}

          {data.y_label && (
            <text
              x={
                padding.left -
                20
              }
              y={padding.top}
              fontSize="13"
              fill="#475569"
            >
              {data.y_label}
            </text>
          )}
        </svg>

        {/* IMPORTANTE:
            Las funciones matemáticas se renderizarán
            en el siguiente motor especializado.

            No evaluamos expressions con eval() ni
            JavaScript dinámico por seguridad.
        */}

        {data.functions &&
          data.functions.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {data.functions.map(
                (fn, index) => (
                  <div
                    key={fn.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          getSeriesColor(index),
                      }}
                    />

                    <span>
                      {fn.label} ={" "}
                      {fn.expression}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </VisualContainer>
  );
}

/* =========================================================
   FALLBACK
========================================================= */

function VisualFallback({
  title = "Visual no disponible",
  description,
}: {
  title?: string;
  description?: string | null;
}) {
  return (
    <div className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-700">
        {title}
      </p>

      {description && (
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   VALIDACIÓN VISUAL
========================================================= */

function matchesVisualType(
  visualType: VisualType,
  visualData: VisualData
) {
  switch (visualType) {
    case "chart":
      return isChartVisualData(visualData);

    case "table":
      return isTableVisualData(visualData);

    case "math_graph":
      return isMathGraphVisualData(
        visualData
      );

    case "geometry":
      return isGeometryVisualData(
        visualData
      );

    case "diagram":
      return isDiagramVisualData(
        visualData
      );

    default:
      return true;
  }
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function QuestionVisualRenderer({
  requiresVisual = false,
  visualType,
  visualDescription,
  visualData,
}: QuestionVisualRendererProps) {
  /*
   * La pregunta no requiere visual.
   */
  if (!requiresVisual) {
    return null;
  }

  /*
   * La pregunta declara visual,
   * pero todavía no tiene datos.
   */
  if (!visualType || !visualData) {
    return (
      <VisualFallback
        title="Información visual incompleta"
        description={
          visualDescription ??
          "Esta pregunta requiere un elemento visual, pero aún no cuenta con datos estructurados para renderizarlo."
        }
      />
    );
  }

  /*
   * Evitamos que datos de un tipo incorrecto
   * sean enviados accidentalmente a otro renderer.
   */
  if (
    !matchesVisualType(
      visualType,
      visualData
    )
  ) {
    return (
      <VisualFallback
        title="Datos visuales incompatibles"
        description={
          "El tipo de visual y los datos almacenados no coinciden."
        }
      />
    );
  }

  switch (visualType) {
    /* =====================================================
       CHART
    ===================================================== */

    case "chart": {
      const chartData = visualData as ChartVisualData;

      /*
       * Gráficas migradas al motor profesional.
       */
      switch (chartData.chart_type) {
        case "bar":
          return (
            <BarChartVisual
              data={chartData}
            />
          );

        case "line":
          return (
            <LineChartVisual
              data={chartData}
            />
          );

        case "pie":
          return (
            <PieChartVisual
              data={chartData}
            />
          );

        /*
         * Los tipos que todavía no tienen renderer
         * profesional continúan usando el renderer anterior.
         */

        case "scatter":
          return (
            <ScatterChartVisual
              data={chartData}
            />
          );

        case "area":
          return (
            <AreaChartVisual
              data={chartData}
            />
          );

        default:
          return (
            <ChartRenderer
              data={chartData}
            />
          );
      }
    }

    /* =====================================================
       TABLE
    ===================================================== */

    case "table":
      return (
        <TableRenderer
          data={
            visualData as TableVisualData
          }
        />
      );

    /* =====================================================
       MATH GRAPH
    ===================================================== */

    case "math_graph":
      return (
        <MathGraphVisual
           data={
             visualData as MathGraphVisualData
           }
        />
      );

    /* =====================================================
       GEOMETRY
    ===================================================== */

    case "geometry":
      return (
        <GeometryVisual
          data={
            visualData as GeometryVisualData
          }
        />
      );

    /* =====================================================
       DIAGRAM
    ===================================================== */

    case "diagram":
      return (
        <DiagramVisual
          data={
            visualData as DiagramVisualData
          }
        />
      );

    /* =====================================================
       FUTURE VISUAL TYPES
    ===================================================== */

    case "map":
      return (
        <VisualFallback
          title="Motor de mapas en preparación"
          description={
            visualDescription
          }
        />
      );

    case "illustration":
      return (
        <VisualFallback
          title="Ilustración no disponible"
          description={
            visualDescription
          }
        />
      );

    case "infographic":
      return (
        <VisualFallback
          title="Infografía no disponible"
          description={
            visualDescription
          }
        />
      );

    case "image_context":
      return (
        <VisualFallback
          title="Imagen contextual no disponible"
          description={
            visualDescription
          }
        />
      );

    default:
      return (
        <VisualFallback
          description={
            visualDescription
          }
        />
      );
  }
}