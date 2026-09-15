/* =========================================================
   PEAKSCORE — ACADEMIC VISUAL THEME

   Sistema centralizado de estilos para visuales académicos.

   Objetivo:
   - Mantener consistencia visual.
   - Acercar las gráficas al estilo de material académico
     e instrumentos de evaluación como el ICFES.
   - Evitar estilos dispersos entre componentes.
   - Permitir reutilización en gráficas, diagramas,
     geometría y planos cartesianos.

   IMPORTANTE:
   Este archivo NO renderiza componentes.
   Solamente define estilos compartidos.
========================================================= */

/* =========================================================
   TEMA VISUAL PRINCIPAL
========================================================= */

export const ICFES_VISUAL_THEME = {
  /* =======================================================
     FONDO GENERAL
  ======================================================= */

  background: {
    primary: "#ffffff",
    secondary: "#f8fafc",
    muted: "#f1f5f9",
  },

  /* =======================================================
     TEXTO
  ======================================================= */

  text: {
    primary: "#0f172a",
    secondary: "#334155",
    muted: "#64748b",
    axis: "#334155",
  },

  /* =======================================================
     EJES
  ======================================================= */

  axis: {
    color: "#334155",
    width: 1.5,
    tickWidth: 1,
    tickLength: 5,
  },

  /* =======================================================
     CUADRÍCULA
  ======================================================= */

  grid: {
    color: "#cbd5e1",
    width: 1,
    opacity: 0.65,
    dashArray: "0",
  },

  /* =======================================================
     TIPOGRAFÍA
  ======================================================= */

  typography: {
    fontFamily:
      "Arial, Helvetica, sans-serif",

    titleSize: 15,

    subtitleSize: 13,

    labelSize: 12,

    axisLabelSize: 11,

    tickLabelSize: 10,

    annotationSize: 11,

    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  /* =======================================================
     GRÁFICAS DE BARRAS
  ======================================================= */

  bar: {
    fill: "#4f46e5",

    stroke: "#312e81",

    strokeWidth: 1,

    opacity: 0.92,

    borderRadius: 1,

    gapRatio: 0.18,

    valueLabelColor: "#0f172a",

    valueLabelSize: 10,
  },

  /* =======================================================
     GRÁFICAS DE LÍNEAS
  ======================================================= */

  line: {
    color: "#334155",

    width: 2,

    pointRadius: 3.5,

    pointStrokeWidth: 1.5,

    pointFill: "#ffffff",

    smooth: false,
  },

  /* =======================================================
     SERIES ACADÉMICAS

     Colores moderados para mantener legibilidad.
     Evitamos colores excesivamente saturados.
  ======================================================= */

  series: [
    "#334155",
    "#4f46e5",
    "#0f766e",
    "#b45309",
    "#9f1239",
    "#475569",
  ],

  /* =======================================================
     GRÁFICAS CIRCULARES
  ======================================================= */

  pie: {
    stroke: "#ffffff",

    strokeWidth: 1.5,

    labelColor: "#0f172a",

    labelSize: 11,

    opacity: 0.95,
  },

  /* =======================================================
     LEYENDAS
  ======================================================= */

  legend: {
    fontSize: 10,

    textColor: "#334155",

    markerSize: 8,

    gap: 8,
  },

  /* =======================================================
     DIAGRAMAS
  ======================================================= */

  diagram: {
    stroke: "#334155",

    strokeWidth: 1.5,

    fill: "#ffffff",

    secondaryFill: "#f8fafc",

    labelColor: "#0f172a",

    labelSize: 12,

    nodeRadius: 4,

    arrowSize: 6,
  },

  /* =======================================================
     GEOMETRÍA
  ======================================================= */

  geometry: {
    stroke: "#1e293b",

    strokeWidth: 1.75,

    fill: "transparent",

    pointRadius: 3.5,

    pointFill: "#ffffff",

    pointStroke: "#1e293b",

    labelColor: "#0f172a",

    labelSize: 11,
  },

  /* =======================================================
     PLANO CARTESIANO
  ======================================================= */

  mathGraph: {
    axisColor: "#0f172a",

    axisWidth: 1.5,

    gridColor: "#cbd5e1",

    gridWidth: 1,

    functionColor: "#7c3aed",

    functionWidth: 2,

    pointRadius: 3,

    labelColor: "#334155",

    labelSize: 10,
  },

  /* =======================================================
     DIMENSIONES Y ESPACIADO
  ======================================================= */

  spacing: {
    chartPadding: 28,

    topPadding: 32,

    rightPadding: 28,

    bottomPadding: 48,

    leftPadding: 58,
  },
} as const;

/* =========================================================
   TIPO DEL TEMA

   Nos permitirá reutilizar correctamente el tipo
   en futuras utilidades sin duplicar estructuras.
========================================================= */

export type AcademicVisualTheme =
  typeof ICFES_VISUAL_THEME;

/* =========================================================
   OBTENER COLOR DE SERIE

   Función reutilizable para visuales con múltiples
   series de datos.
========================================================= */

export function getAcademicSeriesColor(
  index: number
): string {
  const colors =
    ICFES_VISUAL_THEME.series;

  return colors[
    index % colors.length
  ];
}

/* =========================================================
   OPACIDAD SEGURA

   Mantiene los valores de opacidad entre 0 y 1.
========================================================= */

export function getSafeOpacity(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(
    Math.max(value, 0),
    1
  );
}