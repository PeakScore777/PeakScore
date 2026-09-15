"use client";

import { useId } from "react";

import type {
  GeometryCutout,
  GeometryLabel,
  GeometryMeasurement,
  GeometryVisualData,
} from "@/lib/visuals/types";

import {
  ICFES_VISUAL_THEME,
  getAcademicSeriesColor,
} from "@/lib/visuals/visualTheme";

/* =========================================================
   PEAKSCORE - GEOMETRY VISUAL ENGINE

   Motor profesional para representaciones geométricas
   académicas tipo ICFES.

   PRINCIPIOS:
   - SVG matemáticamente consistente.
   - Dimensiones integradas a la figura.
   - Etiquetas ancladas a geometría real.
   - Escalado proporcional cuando existen medidas.
   - Sin posiciones HTML flotantes.
   - IDs SVG únicos por instancia.
   - Estética académica sobria.
========================================================= */

interface GeometryVisualProps {
  data: GeometryVisualData;
}

/* =========================================================
   CANVAS
========================================================= */

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 500;

/* =========================================================
   PALETA / TEMA
========================================================= */

const FIGURE_COLOR = getAcademicSeriesColor(0);

const COLORS = {
  figure: FIGURE_COLOR,
  figureDark: "#1d4ed8",

  figureFill: "#eff6ff",
  figureFillStrong: "#dbeafe",

  dimension: "#475569",
  dimensionLight: "#94a3b8",

  text: ICFES_VISUAL_THEME.text.primary,
  secondaryText: ICFES_VISUAL_THEME.text.secondary,

  guide: "#cbd5e1",
  background: "#ffffff",
};

/* =========================================================
   TIPOS AUXILIARES
========================================================= */

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

/* =========================================================
   EXTRAER NÚMERO

   Ejemplos:
   "12 m" -> 12
   "8 cm" -> 8
   "r = 4" -> 4
========================================================= */

function extractNumber(value: string | number): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/,/g, ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);

  return Number.isFinite(parsed) ? parsed : null;
}

/* =========================================================
   BUSCAR MEDIDA
========================================================= */

function getMeasurement(
  measurements: GeometryMeasurement[],
  searchTerms: string[],
): GeometryMeasurement | undefined {
  const safeMeasurements = Array.isArray(measurements)
    ? measurements
    : [];

  const normalizedTerms = searchTerms
    .map(normalizeText)
    .filter(Boolean);

  // Primero intentamos coincidencia exacta para evitar que aliases
  // cortos como "r" coincidan accidentalmente con otras palabras.
  const exactMatch = safeMeasurements.find((measurement) => {
    const label = normalizeText(measurement.label);
    return normalizedTerms.includes(label);
  });

  if (exactMatch) {
    return exactMatch;
  }

  return safeMeasurements.find((measurement) => {
    const label = normalizeText(measurement.label);

    return normalizedTerms.some((term) => {
      if (term.length <= 1) {
        return false;
      }

      return label.includes(term);
    });
  });
}

/* =========================================================
   PUNTO MEDIO
========================================================= */

function getMidpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

/* =========================================================
   NORMAL

   Devuelve un vector unitario perpendicular al segmento.
========================================================= */

function getNormal(first: Point, second: Point): Point {
  const dx = second.x - first.x;
  const dy = second.y - first.y;

  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x: -dy / length,
    y: dx / length,
  };
}

/* =========================================================
   ESCALAR RECTÁNGULO

   Mantiene proporciones reales cuando existen medidas.
========================================================= */

function getRectangleDimensions(
  horizontalValue: number | null,
  verticalValue: number | null,
) {
  const maxWidth = 420;
  const maxHeight = 250;

  const fallbackWidth = 380;
  const fallbackHeight = 220;

  if (
    horizontalValue === null ||
    verticalValue === null ||
    horizontalValue <= 0 ||
    verticalValue <= 0
  ) {
    return {
      width: fallbackWidth,
      height: fallbackHeight,
    };
  }

  const ratio = horizontalValue / verticalValue;

  if (!Number.isFinite(ratio) || ratio <= 0) {
    return {
      width: fallbackWidth,
      height: fallbackHeight,
    };
  }

  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    width,
    height,
  };
}

/* =========================================================
   DIMENSION LINE
========================================================= */

interface DimensionLineProps {
  start: Point;
  end: Point;
  label: string;
  arrowId: string;
  offset?: number;
  labelOffset?: number;
}

function DimensionLine({
  start,
  end,
  label,
  arrowId,
  offset = 30,
  labelOffset = 18,
}: DimensionLineProps) {
  const normal = getNormal(start, end);

  const dimensionStart = {
    x: start.x + normal.x * offset,
    y: start.y + normal.y * offset,
  };

  const dimensionEnd = {
    x: end.x + normal.x * offset,
    y: end.y + normal.y * offset,
  };

  const midpoint = getMidpoint(
    dimensionStart,
    dimensionEnd,
  );

  const labelPosition = {
    x: midpoint.x + normal.x * labelOffset,
    y: midpoint.y + normal.y * labelOffset,
  };

  return (
    <g>
      {/* Líneas auxiliares */}

      <line
        x1={start.x}
        y1={start.y}
        x2={dimensionStart.x}
        y2={dimensionStart.y}
        stroke={COLORS.dimensionLight}
        strokeWidth="1.4"
      />

      <line
        x1={end.x}
        y1={end.y}
        x2={dimensionEnd.x}
        y2={dimensionEnd.y}
        stroke={COLORS.dimensionLight}
        strokeWidth="1.4"
      />

      {/* Línea de dimensión */}

      <line
        x1={dimensionStart.x}
        y1={dimensionStart.y}
        x2={dimensionEnd.x}
        y2={dimensionEnd.y}
        stroke={COLORS.dimension}
        strokeWidth="1.8"
        markerStart={`url(#${arrowId})`}
        markerEnd={`url(#${arrowId})`}
      />

      {/* Etiqueta */}

      <text
        x={labelPosition.x}
        y={labelPosition.y}
        fill={COLORS.secondaryText}
        fontFamily={ICFES_VISUAL_THEME.typography.fontFamily}
        fontSize="15"
        fontWeight={ICFES_VISUAL_THEME.typography.fontWeight.medium}
        textAnchor="middle"
        dominantBaseline="middle"
        paintOrder="stroke"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinejoin="round"
      >
        {label}
      </text>
    </g>
  );
}

/* =========================================================
   GEOMETRY LABELS
========================================================= */

function getLabelCoordinates(
  label: GeometryLabel,
  bounds: Bounds,
): Point {
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;

  const padding = 24;

  switch (label.position) {
    case "top":
      return {
        x: centerX,
        y: bounds.top - padding,
      };

    case "bottom":
      return {
        x: centerX,
        y: bounds.bottom + padding,
      };

    case "left":
      return {
        x: bounds.left - padding,
        y: centerY,
      };

    case "right":
      return {
        x: bounds.right + padding,
        y: centerY,
      };

    case "top_left":
      return {
        x: bounds.left + 8,
        y: bounds.top + 12,
      };

    case "top_right":
      return {
        x: bounds.right - 8,
        y: bounds.top + 12,
      };

    case "bottom_left":
      return {
        x: bounds.left + 8,
        y: bounds.bottom - 12,
      };

    case "bottom_right":
      return {
        x: bounds.right - 8,
        y: bounds.bottom - 12,
      };

    case "center":
    default:
      return {
        x: centerX,
        y: centerY,
      };
  }
}

function GeometryLabels({
  labels,
  bounds,
}: {
  labels: GeometryLabel[];
  bounds: Bounds;
}) {
  return (
    <>
      {labels.map((label, index) => {
        const position = getLabelCoordinates(
          label,
          bounds,
        );

        return (
          <text
            key={`${label.text}-${index}`}
            x={position.x}
            y={position.y}
            fill={COLORS.text}
            fontFamily={ICFES_VISUAL_THEME.typography.fontFamily}
            fontSize="17"
            fontWeight={
              ICFES_VISUAL_THEME.typography.fontWeight.medium
            }
            textAnchor="middle"
            dominantBaseline="middle"
            paintOrder="stroke"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinejoin="round"
          >
            {label.text}
          </text>
        );
      })}
    </>
  );
}

/* =========================================================
   RECTANGLE PATH

   El recorte semicircular forma parte del contorno real.
========================================================= */

function getRectanglePath({
  x,
  y,
  width,
  height,
  cutout,
  radius,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  cutout?: GeometryCutout;
  radius: number;
}) {
  const right = x + width;
  const bottom = y + height;

  const safeRadius = Math.max(
    0,
    Math.min(
      radius,
      cutout?.side === "top" || cutout?.side === "bottom"
        ? width / 2
        : height / 2,
    ),
  );

  if (!cutout || safeRadius <= 0) {
    return `
      M ${x} ${y}
      H ${right}
      V ${bottom}
      H ${x}
      Z
    `;
  }

  /* =======================================================
     RECORTE SUPERIOR

     Arco semicircular real hacia el interior.
  ======================================================= */

  if (cutout.side === "top") {
    const centerX = x + width / 2;
    const leftCut = centerX - safeRadius;
    const rightCut = centerX + safeRadius;

    return `
      M ${x} ${y}
      H ${leftCut}
      A ${safeRadius} ${safeRadius} 0 0 1 ${rightCut} ${y}
      H ${right}
      V ${bottom}
      H ${x}
      Z
    `;
  }

  /* =======================================================
     RECORTE INFERIOR
  ======================================================= */

  if (cutout.side === "bottom") {
    const centerX = x + width / 2;
    const leftCut = centerX - safeRadius;
    const rightCut = centerX + safeRadius;

    return `
      M ${x} ${y}
      H ${right}
      V ${bottom}
      H ${rightCut}
      A ${safeRadius} ${safeRadius} 0 0 0 ${leftCut} ${bottom}
      H ${x}
      Z
    `;
  }

  /* =======================================================
     RECORTE IZQUIERDO
  ======================================================= */

  if (cutout.side === "left") {
    const centerY = y + height / 2;
    const topCut = centerY - safeRadius;
    const bottomCut = centerY + safeRadius;

    return `
      M ${x} ${y}
      H ${right}
      V ${bottom}
      H ${x}
      V ${bottomCut}
      A ${safeRadius} ${safeRadius} 0 0 0 ${x} ${topCut}
      V ${y}
      Z
    `;
  }

  /* =======================================================
     RECORTE DERECHO
  ======================================================= */

  if (cutout.side === "right") {
    const centerY = y + height / 2;
    const topCut = centerY - safeRadius;
    const bottomCut = centerY + safeRadius;

    return `
      M ${x} ${y}
      H ${right}
      V ${topCut}
      A ${safeRadius} ${safeRadius} 0 0 1 ${right} ${bottomCut}
      V ${bottom}
      H ${x}
      Z
    `;
  }

  return `
    M ${x} ${y}
    H ${right}
    V ${bottom}
    H ${x}
    Z
  `;
}

/* =========================================================
   RECTANGLE VISUAL
========================================================= */

function RectangleVisual({
  data,
  arrowId,
}: {
  data: GeometryVisualData;
  arrowId: string;
}) {
  /* =======================================================
     MEDIDAS
  ======================================================= */

  const horizontalMeasurement = getMeasurement(
    data.measurements,
    [
      "ab",
      "base",
      "ancho",
      "width",
      "horizontal",
      "largo",
    ],
  );

  const verticalMeasurement = getMeasurement(
    data.measurements,
    [
      "bc",
      "alto",
      "height",
      "vertical",
    ],
  );

  const horizontalValue = horizontalMeasurement
    ? extractNumber(horizontalMeasurement.value)
    : null;

  const verticalValue = verticalMeasurement
    ? extractNumber(verticalMeasurement.value)
    : null;

  /* =======================================================
     DIMENSIONES PROPORCIONALES
  ======================================================= */

  const dimensions = getRectangleDimensions(
    horizontalValue,
    verticalValue,
  );

  const width = dimensions.width;
  const height = dimensions.height;

  const x =
    (VIEWBOX_WIDTH - width) / 2 - 30;

  const y =
    (VIEWBOX_HEIGHT - height) / 2 - 15;

  const right = x + width;
  const bottom = y + height;

  const bounds: Bounds = {
    left: x,
    right,
    top: y,
    bottom,
  };

  /* =======================================================
     RECORTE
  ======================================================= */

  const semicircleCutout =
    data.cutouts?.find(
      (cutout) =>
        cutout.type === "semicircle" &&
        cutout.removed !== false,
    );

  const radiusMeasurement = getMeasurement(
    data.measurements,
    [
      "radio",
      "radius",
      "r",
    ],
  );

  const measurementRadius = radiusMeasurement
    ? extractNumber(radiusMeasurement.value)
    : null;

  const rawCutoutRadius =
    semicircleCutout?.radius ??
    measurementRadius ??
    0;

  const cutoutRadiusValue =
    Number.isFinite(rawCutoutRadius) &&
    rawCutoutRadius > 0
      ? rawCutoutRadius
      : 0;

  /* =======================================================
     RADIO VISUAL
  ======================================================= */

  let visualRadius = 0;

  if (
    semicircleCutout &&
    cutoutRadiusValue > 0
  ) {
    const limitingDimension =
      semicircleCutout.side === "top" ||
      semicircleCutout.side === "bottom"
        ? width
        : height;

    const referenceValue =
      semicircleCutout.side === "top" ||
      semicircleCutout.side === "bottom"
        ? horizontalValue
        : verticalValue;

    if (
      referenceValue !== null &&
      referenceValue > 0
    ) {
      visualRadius =
        (cutoutRadiusValue /
          referenceValue) *
        limitingDimension;
    } else {
      visualRadius =
        limitingDimension * 0.18;
    }

    visualRadius = Math.min(
      Math.max(1, visualRadius),
      Math.max(1, limitingDimension * 0.32),
    );
  }

  /* =======================================================
     PATH
  ======================================================= */

  const rectanglePath = getRectanglePath({
    x,
    y,
    width,
    height,
    cutout: semicircleCutout,
    radius: visualRadius,
  });

  return (
    <>
      {/* FIGURA */}

      <path
        d={rectanglePath}
        fill={COLORS.figureFill}
        stroke={COLORS.figure}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* LÍNEAS DE DIMENSIÓN */}

      {horizontalMeasurement && (
        <DimensionLine
          start={{
            x,
            y: bottom,
          }}
          end={{
            x: right,
            y: bottom,
          }}
          label={horizontalMeasurement.value}
          arrowId={arrowId}
          offset={42}
          labelOffset={20}
        />
      )}

      {verticalMeasurement && (
        <DimensionLine
          start={{
            x: right,
            y,
          }}
          end={{
            x: right,
            y: bottom,
          }}
          label={verticalMeasurement.value}
          arrowId={arrowId}
          offset={42}
          labelOffset={22}
        />
      )}

      {/* RADIO DEL RECORTE */}

      {semicircleCutout &&
        visualRadius > 0 &&
        cutoutRadiusValue > 0 && (
          <>
            {semicircleCutout.side ===
              "top" && (
              <>
                <line
                  x1={
                    x + width / 2
                  }
                  y1={y}
                  x2={
                    x + width / 2
                  }
                  y2={
                    y +
                    visualRadius *
                      0.7
                  }
                  stroke={
                    COLORS.dimension
                  }
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />

                <text
                  x={
                    x +
                    width / 2 +
                    18
                  }
                  y={
                    y +
                    visualRadius *
                      0.5
                  }
                  fill={
                    COLORS.secondaryText
                  }
                  fontFamily={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontFamily
                  }
                  fontSize="14"
                  fontWeight={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontWeight
                      .medium
                  }
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="6"
                >
                  r = {cutoutRadiusValue}
                </text>
              </>
            )}

            {semicircleCutout.side ===
              "bottom" && (
              <>
                <line
                  x1={
                    x + width / 2
                  }
                  y1={bottom}
                  x2={
                    x + width / 2
                  }
                  y2={
                    bottom -
                    visualRadius *
                      0.7
                  }
                  stroke={
                    COLORS.dimension
                  }
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />

                <text
                  x={
                    x +
                    width / 2 +
                    18
                  }
                  y={
                    bottom -
                    visualRadius *
                      0.5
                  }
                  fill={
                    COLORS.secondaryText
                  }
                  fontFamily={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontFamily
                  }
                  fontSize="14"
                  fontWeight={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontWeight
                      .medium
                  }
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="6"
                >
                  r = {cutoutRadiusValue}
                </text>
              </>
            )}

            {semicircleCutout.side ===
              "left" && (
              <>
                <line
                  x1={x}
                  y1={
                    y + height / 2
                  }
                  x2={
                    x +
                    visualRadius *
                      0.7
                  }
                  y2={
                    y + height / 2
                  }
                  stroke={
                    COLORS.dimension
                  }
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />

                <text
                  x={
                    x +
                    visualRadius *
                      0.5
                  }
                  y={
                    y +
                    height / 2 -
                    16
                  }
                  fill={
                    COLORS.secondaryText
                  }
                  fontFamily={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontFamily
                  }
                  fontSize="14"
                  fontWeight={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontWeight
                      .medium
                  }
                  textAnchor="middle"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="6"
                >
                  r = {cutoutRadiusValue}
                </text>
              </>
            )}

            {semicircleCutout.side ===
              "right" && (
              <>
                <line
                  x1={right}
                  y1={
                    y + height / 2
                  }
                  x2={
                    right -
                    visualRadius *
                      0.7
                  }
                  y2={
                    y + height / 2
                  }
                  stroke={
                    COLORS.dimension
                  }
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />

                <text
                  x={
                    right -
                    visualRadius *
                      0.5
                  }
                  y={
                    y +
                    height / 2 -
                    16
                  }
                  fill={
                    COLORS.secondaryText
                  }
                  fontFamily={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontFamily
                  }
                  fontSize="14"
                  fontWeight={
                    ICFES_VISUAL_THEME
                      .typography
                      .fontWeight
                      .medium
                  }
                  textAnchor="middle"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="6"
                >
                  r = {cutoutRadiusValue}
                </text>
              </>
            )}
          </>
        )}

      {/* ETIQUETAS */}

      <GeometryLabels
        labels={data.labels}
        bounds={bounds}
      />
    </>
  );
}

/* =========================================================
   SQUARE VISUAL

   Representa una lámina cuadrada con los cuatro cortes
   congruentes de lado x. Esto permite renderizar el valor
   "square" que puede llegar desde datos ya existentes sin
   romper el contrato de GeometryVisualData.
========================================================= */

function SquareVisual({
  data,
  arrowId,
}: {
  data: GeometryVisualData;
  arrowId: string;
}) {
  const x = 225;
  const y = 65;
  const size = 350;
  const cutSize = 72;

  const right = x + size;
  const bottom = y + size;

  const sideMeasurement = getMeasurement(data.measurements, [
    "lado de corte",
    "lado corte",
    "corte",
    "lado",
  ]);

  const sideLabel = sideMeasurement?.value ?? "x";

  const sheetSideLabel =
    data.labels.find(
      (label) =>
        label.position === "top" ||
        label.position === "bottom" ||
        label.position === "left" ||
        label.position === "right",
    )?.text ?? "12 cm";

  const bounds: Bounds = {
    left: x,
    right,
    top: y,
    bottom,
  };

  const cornerCuts = [
    { x, y, labelX: x + cutSize / 2, labelY: y + cutSize / 2 },
    {
      x: right - cutSize,
      y,
      labelX: right - cutSize / 2,
      labelY: y + cutSize / 2,
    },
    {
      x,
      y: bottom - cutSize,
      labelX: x + cutSize / 2,
      labelY: bottom - cutSize / 2,
    },
    {
      x: right - cutSize,
      y: bottom - cutSize,
      labelX: right - cutSize / 2,
      labelY: bottom - cutSize / 2,
    },
  ];

  return (
    <>
      {/* Lámina cuadrada */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={COLORS.figureFill}
        stroke={COLORS.figure}
        strokeWidth="3.2"
      />

      {/* Cuadrados de corte en las cuatro esquinas */}
      {cornerCuts.map((cut, index) => (
        <g key={`square-cut-${index}`}>
          <rect
            x={cut.x}
            y={cut.y}
            width={cutSize}
            height={cutSize}
            fill={COLORS.figureFillStrong}
            stroke={COLORS.dimension}
            strokeWidth="1.8"
            strokeDasharray="7 5"
          />

          <text
            x={cut.labelX}
            y={cut.labelY}
            fill={COLORS.secondaryText}
            fontFamily={ICFES_VISUAL_THEME.typography.fontFamily}
            fontSize="16"
            fontWeight={ICFES_VISUAL_THEME.typography.fontWeight.medium}
            textAnchor="middle"
            dominantBaseline="middle"
            paintOrder="stroke"
            stroke="#ffffff"
            strokeWidth="5"
          >
            {sideLabel}
          </text>
        </g>
      ))}

      {/* Líneas centrales de referencia para evidenciar la lámina */}
      <line
        x1={x + cutSize}
        y1={y + cutSize}
        x2={right - cutSize}
        y2={y + cutSize}
        stroke={COLORS.guide}
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      <line
        x1={x + cutSize}
        y1={bottom - cutSize}
        x2={right - cutSize}
        y2={bottom - cutSize}
        stroke={COLORS.guide}
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Medida del lado de la lámina */}
      <DimensionLine
        start={{ x, y: bottom }}
        end={{ x: right, y: bottom }}
        label={sheetSideLabel}
        arrowId={arrowId}
        offset={40}
        labelOffset={18}
      />

      {/* Etiquetas adicionales */}
      <GeometryLabels
        labels={data.labels}
        bounds={bounds}
      />
    </>
  );
}

/* =========================================================
   TRIANGLE VISUAL
========================================================= */

function TriangleVisual({
  data,
}: {
  data: GeometryVisualData;
}) {
  const top: Point = {
    x: 400,
    y: 95,
  };

  const left: Point = {
    x: 205,
    y: 355,
  };

  const right: Point = {
    x: 595,
    y: 355,
  };

  const bounds: Bounds = {
    left: left.x,
    right: right.x,
    top: top.y,
    bottom: left.y,
  };

  return (
    <>
      {/* Figura */}

      <polygon
        points={`
          ${top.x},${top.y}
          ${right.x},${right.y}
          ${left.x},${left.y}
        `}
        fill={COLORS.figureFill}
        stroke={COLORS.figure}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Vértices */}

      {[top, left, right].map(
        (point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={COLORS.figureDark}
          />
        ),
      )}

      {/* Etiquetas */}

      <GeometryLabels
        labels={data.labels}
        bounds={bounds}
      />
    </>
  );
}

/* =========================================================
   CIRCLE VISUAL
========================================================= */

function CircleVisual({
  data,
}: {
  data: GeometryVisualData;
}) {
  const cx = 400;
  const cy = 240;

  const radius = 145;

  const bounds: Bounds = {
    left: cx - radius,
    right: cx + radius,
    top: cy - radius,
    bottom: cy + radius,
  };

  const radiusMeasurement =
    getMeasurement(
      data.measurements,
      [
        "radio",
        "radius",
        "r",
      ],
    );

  const diameterMeasurement =
    getMeasurement(
      data.measurements,
      [
        "diametro",
        "diámetro",
        "diameter",
      ],
    );

  return (
    <>
      {/* Círculo */}

      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={COLORS.figureFill}
        stroke={COLORS.figure}
        strokeWidth="3.2"
      />

      {/* Centro */}

      <circle
        cx={cx}
        cy={cy}
        r="4"
        fill={COLORS.figureDark}
      />

      {/* Radio */}

      {radiusMeasurement && (
        <>
          <line
            x1={cx}
            y1={cy}
            x2={cx + radius}
            y2={cy}
            stroke={COLORS.dimension}
            strokeWidth="2"
          />

          <text
            x={cx + radius / 2}
            y={cy - 16}
            textAnchor="middle"
            fill={COLORS.secondaryText}
            fontFamily={
              ICFES_VISUAL_THEME
                .typography
                .fontFamily
            }
            fontSize="15"
            fontWeight={
              ICFES_VISUAL_THEME
                .typography
                .fontWeight
                .medium
            }
            paintOrder="stroke"
            stroke="#ffffff"
            strokeWidth="6"
          >
            {radiusMeasurement.value}
          </text>
        </>
      )}

      {/* Diámetro */}

      {diameterMeasurement && (
        <>
          <line
            x1={cx - radius}
            y1={cy}
            x2={cx + radius}
            y2={cy}
            stroke={COLORS.dimension}
            strokeWidth="1.6"
            strokeDasharray="6 5"
          />

          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            fill={COLORS.secondaryText}
            fontFamily={
              ICFES_VISUAL_THEME
                .typography
                .fontFamily
            }
            fontSize="14"
            fontWeight={
              ICFES_VISUAL_THEME
                .typography
                .fontWeight
                .medium
            }
            paintOrder="stroke"
            stroke="#ffffff"
            strokeWidth="6"
          >
            {diameterMeasurement.value}
          </text>
        </>
      )}

      <GeometryLabels
        labels={data.labels}
        bounds={bounds}
      />
    </>
  );
}

/* =========================================================
   POLYGON VISUAL
========================================================= */

function PolygonVisual({
  data,
}: {
  data: GeometryVisualData;
}) {
  const points: Point[] = [
    {
      x: 400,
      y: 70,
    },
    {
      x: 600,
      y: 170,
    },
    {
      x: 525,
      y: 370,
    },
    {
      x: 275,
      y: 370,
    },
    {
      x: 200,
      y: 170,
    },
  ];

  const bounds: Bounds = {
    left: 200,
    right: 600,
    top: 70,
    bottom: 370,
  };

  return (
    <>
      <polygon
        points={points
          .map(
            (point) =>
              `${point.x},${point.y}`,
          )
          .join(" ")}
        fill={COLORS.figureFill}
        stroke={COLORS.figure}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Vértices */}

      {points.map(
        (point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={COLORS.figureDark}
          />
        ),
      )}

      <GeometryLabels
        labels={data.labels}
        bounds={bounds}
      />
    </>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function GeometryVisual({
  data,
}: GeometryVisualProps) {
  const uniqueId = useId();

  const safeId = uniqueId.replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  );

  const arrowId =
    `geometry-arrow-${safeId}`;

  const measurements = Array.isArray(data.measurements)
    ? data.measurements
    : [];

  const labels = Array.isArray(data.labels)
    ? data.labels
    : [];

  const safeData: GeometryVisualData = {
    ...data,
    measurements,
    labels,
  };

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-[0_1px_3px_rgba(15,23,42,0.06)]
      "
    >
      {/* ===================================================
          TÍTULO
      =================================================== */}

      {data.title && (
        <div
          className="
            border-b
            border-slate-200
            bg-slate-50/70
            px-6
            py-3.5
          "
        >
          <p
            className="
              text-center
              text-sm
              font-semibold
              tracking-tight
              text-slate-800
            "
          >
            {data.title}
          </p>
        </div>
      )}

      {/* ===================================================
          CANVAS
      =================================================== */}

      <div
        className="
          w-full
          overflow-x-auto
          bg-white
        "
      >
        <svg
          viewBox={`
            0
            0
            ${VIEWBOX_WIDTH}
            ${VIEWBOX_HEIGHT}
          `}
          className="
            min-w-[650px]
            w-full
          "
          role="img"
          aria-label={
            data.title ??
            "Representación geométrica"
          }
        >
          {/* =================================================
              DEFINICIONES
          ================================================= */}

          <defs>
            <marker
              id={arrowId}
              markerWidth="9"
              markerHeight="9"
              refX="4.5"
              refY="4.5"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path
                d="
                  M 0 0
                  L 9 4.5
                  L 0 9
                  Z
                "
                fill={COLORS.dimension}
              />
            </marker>

          </defs>

          {/* =================================================
              FONDO
          ================================================= */}

          <rect
            x="0"
            y="0"
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill={COLORS.background}
          />

          {/* =================================================
              ÁREA DE FIGURA
          ================================================= */}

          <g>
            {data.shape ===
              "rectangle" && (
              <RectangleVisual
                data={safeData}
                arrowId={arrowId}
              />
            )}

            {data.shape ===
              "square" && (
              <SquareVisual
                data={safeData}
                arrowId={arrowId}
              />
            )}

            {data.shape ===
              "triangle" && (
              <TriangleVisual
                data={safeData}
              />
            )}

            {data.shape ===
              "circle" && (
              <CircleVisual
                data={safeData}
              />
            )}

            {data.shape ===
              "polygon" && (
              <PolygonVisual
                data={safeData}
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}