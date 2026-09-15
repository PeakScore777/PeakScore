/* =========================================================
   PEAKSCORE — CHART UTILITIES

   Utilidades matemáticas compartidas para el motor
   profesional de gráficas.

   Este archivo NO renderiza componentes.
   Solamente contiene cálculos reutilizables.
========================================================= */

/* =========================================================
   COLORES DE SERIES
========================================================= */

export const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
] as const;

export function getSeriesColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/* =========================================================
   VALIDACIÓN NUMÉRICA
========================================================= */

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/* =========================================================
   NORMALIZAR DECIMALES

   Evita resultados como:
   0.30000000000000004
========================================================= */

export function normalizeNumber(
  value: number,
  decimals = 8
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(decimals));
}

/* =========================================================
   CLAMP

   Mantiene un valor dentro de límites seguros.
========================================================= */

export function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}

/* =========================================================
   OBTENER RANGO NUMÉRICO
========================================================= */

export interface NumericRange {
  min: number;
  max: number;
}

/**
 * Obtiene el rango real de un conjunto de valores.
 *
 * includeZero:
 * - true  -> recomendado para BarChart.
 * - false -> recomendado para LineChart y ScatterChart.
 */
export function getNumericRange(
  values: number[],
  options: {
    includeZero?: boolean;
  } = {}
): NumericRange {
  const { includeZero = false } = options;

  const validValues = values.filter(isFiniteNumber);

  if (validValues.length === 0) {
    return {
      min: 0,
      max: 1,
    };
  }

  let min = Math.min(...validValues);
  let max = Math.max(...validValues);

  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }

  /*
   * Evitamos rangos vacíos.
   */
  if (min === max) {
    const adjustment =
      Math.abs(min) > 0
        ? Math.abs(min) * 0.1
        : 1;

    min -= adjustment;
    max += adjustment;
  }

  return {
    min: normalizeNumber(min),
    max: normalizeNumber(max),
  };
}

/* =========================================================
   AGREGAR PADDING AL RANGO

   Evita que puntos, líneas o elementos visuales
   queden pegados a los límites de la gráfica.
========================================================= */

export function addRangePadding(
  range: NumericRange,
  padding = 0.1
): NumericRange {
  if (
    !Number.isFinite(range.min) ||
    !Number.isFinite(range.max)
  ) {
    return {
      min: 0,
      max: 1,
    };
  }

  if (range.min === range.max) {
    return {
      min: range.min - 1,
      max: range.max + 1,
    };
  }

  const safePadding = clamp(padding, 0, 0.5);

  const size = range.max - range.min;

  const paddingAmount = size * safePadding;

  return {
    min: normalizeNumber(range.min - paddingAmount),
    max: normalizeNumber(range.max + paddingAmount),
  };
}

/* =========================================================
   PASO "BONITO"

   Genera escalas académicamente legibles:

   1
   2
   5
   10
   20
   50
   100
   etc.
========================================================= */

export function getNiceStep(
  range: number,
  targetTicks = 5
): number {
  if (!Number.isFinite(range) || range <= 0) {
    return 1;
  }

  const safeTargetTicks = Math.max(
    Math.floor(targetTicks),
    1
  );

  const rawStep = range / safeTargetTicks;

  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(rawStep))
  );

  const normalized = rawStep / magnitude;

  let niceNormalized: number;

  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  return niceNormalized * magnitude;
}

/* =========================================================
   CREAR ESCALA
========================================================= */

export interface ChartScale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

export function createNiceScale({
  min,
  max,
  targetTicks = 5,
}: {
  min: number;
  max: number;
  targetTicks?: number;
}): ChartScale {
  /*
   * Protección contra valores inválidos.
   */
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return {
      min: 0,
      max: 1,
      step: 1,
      ticks: [0, 1],
    };
  }

  let safeMin = min;
  let safeMax = max;

  /*
   * Garantizamos orden correcto.
   */
  if (safeMin > safeMax) {
    [safeMin, safeMax] = [
      safeMax,
      safeMin,
    ];
  }

  /*
   * Evitamos un rango vacío.
   */
  if (safeMin === safeMax) {
    const adjustment =
      Math.abs(safeMin) > 0
        ? Math.abs(safeMin) * 0.1
        : 1;

    safeMin -= adjustment;
    safeMax += adjustment;
  }

  const range = safeMax - safeMin;

  const step = getNiceStep(
    range,
    targetTicks
  );

  /*
   * Expandimos la escala a valores fáciles de leer.
   */
  const niceMin =
    Math.floor(safeMin / step) * step;

  const niceMax =
    Math.ceil(safeMax / step) * step;

  const ticks: number[] = [];

  /*
   * Protección contra loops infinitos.
   */
  const maximumIterations = 100;

  let current = niceMin;
  let iterations = 0;

  while (
    current <= niceMax + step * 0.000001 &&
    iterations < maximumIterations
  ) {
    ticks.push(
      normalizeNumber(current)
    );

    current += step;
    iterations += 1;
  }

  /*
   * Garantía adicional por si ocurre
   * algún problema de precisión.
   */
  if (ticks.length === 0) {
    ticks.push(
      normalizeNumber(niceMin),
      normalizeNumber(niceMax)
    );
  }

  return {
    min: normalizeNumber(niceMin),
    max: normalizeNumber(niceMax),
    step: normalizeNumber(step),
    ticks,
  };
}

/* =========================================================
   FORMATEAR VALORES

   Preparado para:
   - Etiquetas de ejes.
   - Tooltips.
   - Valores académicos.
========================================================= */

export function formatChartValue(
  value: number,
  decimals = 2
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  const safeDecimals = clamp(
    Math.floor(decimals),
    0,
    10
  );

  return value
    .toFixed(safeDecimals)
    .replace(/\.?0+$/, "");
}