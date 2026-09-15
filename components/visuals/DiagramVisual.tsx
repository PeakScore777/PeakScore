"use client";

import { useId } from "react";

import type {
  DiagramConnection,
  DiagramElement,
  DiagramVisualData,
} from "@/lib/visuals/types";

import {
  getAcademicSeriesColor,
  ICFES_VISUAL_THEME,
} from "@/lib/visuals/visualTheme";

/* =========================================================
   PEAKSCORE — DIAGRAM VISUAL ENGINE

   Motor profesional para diagramas académicos.

   OBJETIVOS:
   - Layout automático.
   - Relaciones lineales y jerárquicas.
   - Conexiones SVG reales.
   - Flechas profesionales.
   - Etiquetas integradas.
   - Líneas separadas de los nodos.
   - Texto multilínea seguro.
   - Canvas adaptable a diagramas grandes.
   - IDs SVG únicos por instancia.
   - Estética académica tipo ICFES.

   IMPORTANTE:
   - No modifica los datos recibidos.
   - No agrega propiedades al contrato de DiagramVisualData.
   - Mantiene elements, connections, title y labels existentes.
========================================================= */

interface DiagramVisualProps {
  data: DiagramVisualData;
}

/* =========================================================
   CANVAS BASE
========================================================= */

const BASE_CANVAS_WIDTH = 900;
const BASE_CANVAS_HEIGHT = 520;

const NODE_WIDTH = 150;
const NODE_HEIGHT = 68;

const MIN_HORIZONTAL_GAP = 38;
const DEFAULT_HORIZONTAL_GAP = 70;
const VERTICAL_GAP = 110;

const CANVAS_SIDE_PADDING = 80;
const LABEL_HORIZONTAL_PADDING = 10;

/* =========================================================
   PALETA ACADÉMICA
========================================================= */

const ACCENT = getAcademicSeriesColor(0);

const COLORS = {
  nodeFill: "#ffffff",
  nodeBorder: "#cbd5e1",
  nodeText: ICFES_VISUAL_THEME.text.primary,

  connection: ICFES_VISUAL_THEME.axis.color,
  connectionLight: "#cbd5e1",

  connectionLabelFill: "#ffffff",
  connectionLabelBorder: "#e2e8f0",
  connectionLabelText: ICFES_VISUAL_THEME.text.secondary,

  accent: ACCENT,
  accentSoft: "#eff6ff",

  background: "#ffffff",
};

/* =========================================================
   TIPOS AUXILIARES
========================================================= */

interface Point {
  x: number;
  y: number;
}

interface DiagramLevel {
  elementIds: string[];
}

interface CanvasSize {
  width: number;
  height: number;
}

/* =========================================================
   UTILIDADES GENERALES
========================================================= */

function normalizeText(value: string): string {
  return String(value ?? "").trim();
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(Math.max(value, min), max);
}

/* =========================================================
   TEXTO DE NODOS

   SVG no hace wrapping automático. Dividimos etiquetas
   largas en un máximo de 3 líneas sin alterar el contenido
   de los datos originales.
========================================================= */

function wrapText(
  value: string,
  maxCharacters = 19,
  maxLines = 3,
): string[] {
  const text = normalizeText(value);

  if (!text) {
    return [""];
  }

  if (text.length <= maxCharacters) {
    return [text];
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current
      ? `${current} ${word}`
      : word;

    if (
      candidate.length > maxCharacters &&
      current
    ) {
      lines.push(current);
      current = word;

      if (lines.length === maxLines - 1) {
        break;
      }
    } else {
      current = candidate;
    }
  }

  if (
    current &&
    lines.length < maxLines
  ) {
    lines.push(current);
  }

  if (lines.length === maxLines) {
    const consumed = lines.join(" ");
    const remainingWords = words
      .join(" ")
      .slice(consumed.length)
      .trim();

    if (remainingWords) {
      const lastIndex = lines.length - 1;
      const last = lines[lastIndex];

      lines[lastIndex] =
        `${last.slice(
          0,
          Math.max(1, maxCharacters - 1),
        )}…`;
    }
  }

  return lines.slice(0, maxLines);
}

/* =========================================================
   DEPENDENCIAS
========================================================= */

function getIncomingConnections(
  elementId: string,
  connections: DiagramConnection[],
): number {
  return connections.filter(
    (connection) =>
      connection.to === elementId,
  ).length;
}

/* =========================================================
   CONSTRUIR NIVELES

   Se utiliza un recorrido por niveles.

   Protección contra:
   - ciclos;
   - conexiones duplicadas;
   - nodos desconectados;
   - referencias a nodos inexistentes.
========================================================= */

function buildDiagramLevels(
  elements: DiagramElement[],
  connections: DiagramConnection[],
): DiagramLevel[] {
  if (elements.length === 0) {
    return [];
  }

  const validIds = new Set(
    elements.map((element) => element.id),
  );

  const validConnections =
    connections.filter(
      (connection) =>
        validIds.has(connection.from) &&
        validIds.has(connection.to),
    );

  const levels: DiagramLevel[] = [];
  const assigned = new Set<string>();

  let currentLevel = uniqueIds(
    elements
      .filter(
        (element) =>
          getIncomingConnections(
            element.id,
            validConnections,
          ) === 0,
      )
      .map((element) => element.id),
  );

  /*
   * En un ciclo no existe raíz.
   * Tomamos el primer nodo como punto inicial
   * y dejamos el resto para la protección final.
   */
  if (currentLevel.length === 0) {
    currentLevel = [elements[0].id];
  }

  while (currentLevel.length > 0) {
    const levelIds = uniqueIds(
      currentLevel.filter(
        (id) => !assigned.has(id),
      ),
    );

    if (levelIds.length === 0) {
      break;
    }

    levelIds.forEach((id) =>
      assigned.add(id),
    );

    levels.push({
      elementIds: levelIds,
    });

    const nextLevel: string[] = [];

    for (const elementId of levelIds) {
      for (const connection of validConnections) {
        if (
          connection.from !== elementId ||
          assigned.has(connection.to)
        ) {
          continue;
        }

        nextLevel.push(connection.to);
      }
    }

    currentLevel = uniqueIds(nextLevel);
  }

  /*
   * Nodos aislados o ramas no alcanzadas:
   * se mantienen visibles en el último nivel.
   */
  const remaining = elements
    .filter(
      (element) =>
        !assigned.has(element.id),
    )
    .map((element) => element.id);

  if (remaining.length > 0) {
    levels.push({
      elementIds: remaining,
    });
  }

  return levels;
}

/* =========================================================
   DIAGRAMA LINEAL
========================================================= */

function isLinearDiagram(
  elements: DiagramElement[],
  connections: DiagramConnection[],
): boolean {
  if (
    elements.length <= 1 ||
    connections.length !==
      elements.length - 1
  ) {
    return false;
  }

  const validIds = new Set(
    elements.map((element) => element.id),
  );

  const validConnections =
    connections.filter(
      (connection) =>
        validIds.has(connection.from) &&
        validIds.has(connection.to),
    );

  if (
    validConnections.length !==
    elements.length - 1
  ) {
    return false;
  }

  return elements.every((element) => {
    const incoming =
      validConnections.filter(
        (connection) =>
          connection.to === element.id,
      ).length;

    const outgoing =
      validConnections.filter(
        (connection) =>
          connection.from === element.id,
      ).length;

    return incoming <= 1 && outgoing <= 1;
  });
}

/* =========================================================
   ORDEN LINEAL

   Conserva el orden natural cuando el grafo forma una
   cadena. Si por alguna razón no se puede reconstruir,
   utiliza el orden original de elements.
========================================================= */

function getLinearOrder(
  elements: DiagramElement[],
  connections: DiagramConnection[],
): DiagramElement[] {
  if (elements.length <= 1) {
    return elements;
  }

  const byId = new Map(
    elements.map((element) => [
      element.id,
      element,
    ]),
  );

  const outgoing = new Map<
    string,
    string
  >();

  const incoming = new Set<string>();

  for (const connection of connections) {
    if (
      !byId.has(connection.from) ||
      !byId.has(connection.to)
    ) {
      continue;
    }

    outgoing.set(
      connection.from,
      connection.to,
    );

    incoming.add(connection.to);
  }

  const root =
    elements.find(
      (element) =>
        !incoming.has(element.id),
    ) ?? elements[0];

  const ordered: DiagramElement[] = [];
  const visited = new Set<string>();

  let current: DiagramElement | undefined =
    root;

  while (
    current &&
    !visited.has(current.id)
  ) {
    ordered.push(current);
    visited.add(current.id);

    const nextId =
      outgoing.get(current.id);

    current = nextId
      ? byId.get(nextId)
      : undefined;
  }

  /*
   * Seguridad adicional para cualquier estructura
   * inesperada o conexión duplicada.
   */
  for (const element of elements) {
    if (!visited.has(element.id)) {
      ordered.push(element);
    }
  }

  return ordered;
}

/* =========================================================
   GAP LINEAL ADAPTATIVO
========================================================= */

function getLinearGap(
  elementCount: number,
): number {
  if (elementCount <= 1) {
    return DEFAULT_HORIZONTAL_GAP;
  }

  const available =
    BASE_CANVAS_WIDTH -
    CANVAS_SIDE_PADDING * 2;

  const ideal =
    (available -
      elementCount * NODE_WIDTH) /
    Math.max(1, elementCount - 1);

  return clamp(
    ideal,
    MIN_HORIZONTAL_GAP,
    DEFAULT_HORIZONTAL_GAP,
  );
}

/* =========================================================
   TAMAÑO DE CANVAS PARA DIAGRAMAS GRANDES
========================================================= */

function getCanvasSize(
  elements: DiagramElement[],
  connections: DiagramConnection[],
  linear: boolean,
): CanvasSize {
  if (elements.length === 0) {
    return {
      width: BASE_CANVAS_WIDTH,
      height: BASE_CANVAS_HEIGHT,
    };
  }

  if (linear) {
    const gap = getLinearGap(
      elements.length,
    );

    const contentWidth =
      elements.length * NODE_WIDTH +
      Math.max(0, elements.length - 1) *
        gap;

    return {
      width: Math.max(
        BASE_CANVAS_WIDTH,
        contentWidth +
          CANVAS_SIDE_PADDING * 2,
      ),
      height: BASE_CANVAS_HEIGHT,
    };
  }

  const levels =
    buildDiagramLevels(
      elements,
      connections,
    );

  const maxNodesInLevel =
    levels.reduce(
      (max, level) =>
        Math.max(
          max,
          level.elementIds.length,
        ),
      1,
    );

  const horizontalGap =
    maxNodesInLevel <= 1
      ? DEFAULT_HORIZONTAL_GAP
      : Math.max(
          MIN_HORIZONTAL_GAP,
          Math.min(
            DEFAULT_HORIZONTAL_GAP,
            (
              BASE_CANVAS_WIDTH -
              CANVAS_SIDE_PADDING * 2 -
              maxNodesInLevel *
                NODE_WIDTH
            ) /
              Math.max(
                1,
                maxNodesInLevel - 1,
              ),
          ),
        );

  const requiredWidth =
    maxNodesInLevel *
      NODE_WIDTH +
    Math.max(
      0,
      maxNodesInLevel - 1,
    ) *
      horizontalGap +
    CANVAS_SIDE_PADDING * 2;

  const requiredHeight =
    levels.length *
      NODE_HEIGHT +
    Math.max(
      0,
      levels.length - 1,
    ) *
      VERTICAL_GAP +
    CANVAS_SIDE_PADDING * 2;

  return {
    width: Math.max(
      BASE_CANVAS_WIDTH,
      requiredWidth,
    ),
    height: Math.max(
      BASE_CANVAS_HEIGHT,
      requiredHeight,
    ),
  };
}

/* =========================================================
   LAYOUT LINEAL
========================================================= */

/* =========================================================
   LAYOUT LINEAL REAL

   Variante que conserva el orden derivado del grafo.
========================================================= */

function buildLinearGraphLayout(
  elements: DiagramElement[],
  connections: DiagramConnection[],
  canvasWidth: number,
): Map<string, Point> {
  const positions =
    new Map<string, Point>();

  const ordered =
    getLinearOrder(
      elements,
      connections,
    );

  const gap = getLinearGap(
    ordered.length,
  );

  const totalWidth =
    ordered.length * NODE_WIDTH +
    Math.max(0, ordered.length - 1) *
      gap;

  const startX =
    (canvasWidth - totalWidth) / 2;

  const y = BASE_CANVAS_HEIGHT / 2;

  ordered.forEach(
    (element, index) => {
      positions.set(element.id, {
        x:
          startX +
          NODE_WIDTH / 2 +
          index *
            (NODE_WIDTH + gap),
        y,
      });
    },
  );

  return positions;
}

/* =========================================================
   LAYOUT JERÁRQUICO
========================================================= */

function buildHierarchicalLayout(
  elements: DiagramElement[],
  connections: DiagramConnection[],
  canvasWidth: number,
  canvasHeight: number,
): Map<string, Point> {
  const positions =
    new Map<string, Point>();

  const levels =
    buildDiagramLevels(
      elements,
      connections,
    );

  if (levels.length === 0) {
    return positions;
  }

  const maxCount =
    levels.reduce(
      (max, level) =>
        Math.max(
          max,
          level.elementIds.length,
        ),
      1,
    );

  const availableWidth =
    canvasWidth -
    CANVAS_SIDE_PADDING * 2;

  const gap =
    maxCount <= 1
      ? DEFAULT_HORIZONTAL_GAP
      : Math.max(
          MIN_HORIZONTAL_GAP,
          Math.min(
            DEFAULT_HORIZONTAL_GAP,
            (
              availableWidth -
              maxCount * NODE_WIDTH
            ) /
              Math.max(
                1,
                maxCount - 1,
              ),
          ),
        );

  const totalHeight =
    levels.length *
      NODE_HEIGHT +
    Math.max(
      0,
      levels.length - 1,
    ) *
      VERTICAL_GAP;

  const startY =
    Math.max(
      NODE_HEIGHT / 2 +
        CANVAS_SIDE_PADDING / 2,
      (canvasHeight -
        totalHeight) /
        2 +
        NODE_HEIGHT / 2,
    );

  levels.forEach(
    (level, levelIndex) => {
      const count =
        level.elementIds.length;

      const levelWidth =
        count * NODE_WIDTH +
        Math.max(0, count - 1) *
          gap;

      const startX =
        (canvasWidth -
          levelWidth) /
        2;

      level.elementIds.forEach(
        (elementId, index) => {
          positions.set(
            elementId,
            {
              x:
                startX +
                NODE_WIDTH / 2 +
                index *
                  (NODE_WIDTH + gap),

              y:
                startY +
                levelIndex *
                  (NODE_HEIGHT +
                    VERTICAL_GAP),
            },
          );
        },
      );
    },
  );

  return positions;
}

/* =========================================================
   PUNTOS DE CONEXIÓN

   Las conexiones comienzan exactamente en el borde
   exterior del nodo, evitando atravesarlo.
========================================================= */

function getConnectionPoints(
  from: Point,
  to: Point,
): {
  start: Point;
  end: Point;
  orientation: "horizontal" | "vertical";
} {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (
    Math.abs(dx) >=
    Math.abs(dy)
  ) {
    const direction =
      Math.sign(dx) || 1;

    return {
      start: {
        x:
          from.x +
          direction *
            (NODE_WIDTH / 2),
        y: from.y,
      },

      end: {
        x:
          to.x -
          direction *
            (NODE_WIDTH / 2),
        y: to.y,
      },

      orientation: "horizontal",
    };
  }

  const direction =
    Math.sign(dy) || 1;

  return {
    start: {
      x: from.x,
      y:
        from.y +
        direction *
          (NODE_HEIGHT / 2),
    },

    end: {
      x: to.x,
      y:
        to.y -
        direction *
          (NODE_HEIGHT / 2),
    },

    orientation: "vertical",
  };
}

/* =========================================================
   PATH DE CONEXIÓN

   Para relaciones jerárquicas se usa una curva suave.
   Para conexiones casi horizontales se conserva una
   trayectoria limpia y predecible.
========================================================= */

function createConnectionPath(
  start: Point,
  end: Point,
  orientation:
    | "horizontal"
    | "vertical",
): string {
  if (
    orientation ===
    "horizontal"
  ) {
    const distance =
      Math.abs(end.x - start.x);

    const control =
      Math.min(
        distance * 0.45,
        110,
      );

    const direction =
      Math.sign(
        end.x - start.x,
      ) || 1;

    return `
      M ${start.x} ${start.y}
      C
        ${start.x + direction * control}
        ${start.y}
        ${end.x - direction * control}
        ${end.y}
        ${end.x}
        ${end.y}
    `;
  }

  /*
   * Para relaciones verticales, una curva con punto medio
   * reduce cambios bruscos y conserva la lectura jerárquica.
   */
  const midpointY =
    (start.y + end.y) / 2;

  return `
    M ${start.x} ${start.y}
    C
      ${start.x}
      ${midpointY}
      ${end.x}
      ${midpointY}
      ${end.x}
      ${end.y}
  `;
}

/* =========================================================
   POSICIÓN DE ETIQUETA
========================================================= */

function getConnectionLabelPosition(
  start: Point,
  end: Point,
  orientation:
    | "horizontal"
    | "vertical",
): Point {
  if (
    orientation ===
    "horizontal"
  ) {
    return {
      x:
        (start.x + end.x) / 2,
      y:
        (start.y + end.y) / 2 -
        18,
    };
  }

  return {
    x:
      (start.x + end.x) / 2 +
      12,
    y:
      (start.y + end.y) / 2,
  };
}

/* =========================================================
   ANCHO DE ETIQUETA DE CONEXIÓN
========================================================= */

function getConnectionLabelWidth(
  label: string,
): number {
  return clamp(
    label.length * 7 +
      LABEL_HORIZONTAL_PADDING * 2,
    58,
    190,
  );
}

/* =========================================================
   CONEXIONES
========================================================= */

interface ConnectionLayerProps {
  connections: DiagramConnection[];
  positions: Map<string, Point>;
  arrowId: string;
}

function ConnectionLayer({
  connections,
  positions,
  arrowId,
}: ConnectionLayerProps) {
  return (
    <g aria-hidden="true">
      {connections.map(
        (connection, index) => {
          const from =
            positions.get(
              connection.from,
            );

          const to =
            positions.get(
              connection.to,
            );

          if (!from || !to) {
            return null;
          }

          const points =
            getConnectionPoints(
              from,
              to,
            );

          const path =
            createConnectionPath(
              points.start,
              points.end,
              points.orientation,
            );

          return (
            <g
              key={`${connection.from}-${connection.to}-${index}`}
            >
              {/* Halo discreto para separar la conexión
                  del fondo sin convertirla en decoración. */}
              <path
                d={path}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Línea principal */}
              <path
                d={path}
                fill="none"
                stroke={
                  COLORS.connection
                }
                strokeWidth="1.8"
                strokeLinecap="round"
                markerEnd={`url(#${arrowId})`}
              />
            </g>
          );
        },
      )}
    </g>
  );
}

/* =========================================================
   ETIQUETAS DE CONEXIÓN
========================================================= */

interface ConnectionLabelsProps {
  connections: DiagramConnection[];
  positions: Map<string, Point>;
}

function ConnectionLabels({
  connections,
  positions,
}: ConnectionLabelsProps) {
  return (
    <g>
      {connections.map(
        (connection, index) => {
          if (!connection.label) {
            return null;
          }

          const from =
            positions.get(
              connection.from,
            );

          const to =
            positions.get(
              connection.to,
            );

          if (!from || !to) {
            return null;
          }

          const points =
            getConnectionPoints(
              from,
              to,
            );

          const position =
            getConnectionLabelPosition(
              points.start,
              points.end,
              points.orientation,
            );

          const labelWidth =
            getConnectionLabelWidth(
              connection.label,
            );

          return (
            <g
              key={`connection-label-${connection.from}-${connection.to}-${index}`}
            >
              <rect
                x={
                  position.x -
                  labelWidth / 2
                }
                y={
                  position.y - 12
                }
                width={labelWidth}
                height="24"
                rx="5"
                fill={
                  COLORS.connectionLabelFill
                }
                stroke={
                  COLORS.connectionLabelBorder
                }
                strokeWidth="1"
              />

              <text
                x={position.x}
                y={position.y + 4}
                textAnchor="middle"
                fill={
                  COLORS.connectionLabelText
                }
                fontFamily={
                  ICFES_VISUAL_THEME
                    .typography
                    .fontFamily
                }
                fontSize="12"
                fontWeight={
                  ICFES_VISUAL_THEME
                    .typography
                    .fontWeight
                    .medium
                }
              >
                {connection.label}
              </text>
            </g>
          );
        },
      )}
    </g>
  );
}

/* =========================================================
   NODOS
========================================================= */

interface NodesLayerProps {
  elements: DiagramElement[];
  positions: Map<string, Point>;
  rootId?: string;
}

function NodesLayer({
  elements,
  positions,
  rootId,
}: NodesLayerProps) {
  return (
    <g>
      {elements.map(
        (element) => {
          const position =
            positions.get(
              element.id,
            );

          if (!position) {
            return null;
          }

          const x =
            position.x -
            NODE_WIDTH / 2;

          const y =
            position.y -
            NODE_HEIGHT / 2;

          const lines =
            wrapText(
              element.label,
            );

          const isRoot =
            element.id === rootId;

          const lineHeight = 17;

          const firstLineY =
            position.y -
            ((lines.length - 1) *
              lineHeight) /
              2 +
            5;

          return (
            <g
              key={element.id}
            >
              {/* Sombra mínima */}
              <rect
                x={x}
                y={y + 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="8"
                fill="#0f172a"
                opacity="0.045"
              />

              {/* Nodo */}
              <rect
                x={x}
                y={y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="8"
                fill={
                  isRoot
                    ? COLORS.accentSoft
                    : COLORS.nodeFill
                }
                stroke={
                  isRoot
                    ? COLORS.accent
                    : COLORS.nodeBorder
                }
                strokeWidth={
                  isRoot ? "2" : "1.4"
                }
              />

              {/* Indicador académico */}
              <rect
                x={x}
                y={y}
                width="4"
                height={NODE_HEIGHT}
                rx="2"
                fill={
                  isRoot
                    ? COLORS.accent
                    : "#e2e8f0"
                }
              />

              {/* Texto */}
              <text
                x={position.x}
                y={firstLineY}
                textAnchor="middle"
                fill={
                  COLORS.nodeText
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
              >
                {lines.map(
                  (
                    line,
                    lineIndex,
                  ) => (
                    <tspan
                      key={`${element.id}-line-${lineIndex}`}
                      x={position.x}
                      dy={
                        lineIndex === 0
                          ? 0
                          : lineHeight
                      }
                    >
                      {line}
                    </tspan>
                  ),
                )}
              </text>
            </g>
          );
        },
      )}
    </g>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function DiagramVisual({
  data,
}: DiagramVisualProps) {
  const rawId = useId();

  const safeId =
    rawId.replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    );

  const arrowId =
    `diagram-arrow-${safeId}`;

  const {
    title,
    elements,
    connections,
  } = data;

  const safeElements =
    Array.isArray(elements)
      ? elements
      : [];

  const safeConnections =
    Array.isArray(connections)
      ? connections
      : [];

  /* =======================================================
     ESTADO VACÍO
  ======================================================= */

  if (safeElements.length === 0) {
    return (
      <div
        className="
          w-full
          rounded-xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          p-8
          text-center
        "
      >
        <p
          className="
            text-sm
            font-medium
            text-slate-600
          "
        >
          Este diagrama no contiene
          elementos.
        </p>
      </div>
    );
  }

  /* =======================================================
     VALIDAR CONEXIONES

     No se renderizan relaciones hacia nodos que no existen.
  ======================================================= */

  const validElementIds =
    new Set(
      safeElements.map(
        (element) => element.id,
      ),
    );

  const safeGraphConnections =
    safeConnections.filter(
      (connection) =>
        validElementIds.has(
          connection.from,
        ) &&
        validElementIds.has(
          connection.to,
        ),
    );

  /* =======================================================
     LAYOUT
  ======================================================= */

  const linear =
    isLinearDiagram(
      safeElements,
      safeGraphConnections,
    );

  const canvas =
    getCanvasSize(
      safeElements,
      safeGraphConnections,
      linear,
    );

  const positions =
    linear
      ? buildLinearGraphLayout(
          safeElements,
          safeGraphConnections,
          canvas.width,
        )
      : buildHierarchicalLayout(
          safeElements,
          safeGraphConnections,
          canvas.width,
          canvas.height,
        );

  const rootId =
    buildDiagramLevels(
      safeElements,
      safeGraphConnections,
    )[0]?.elementIds[0];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="
        w-full
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
      "
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      {title && (
        <header
          className="
            border-b
            border-slate-200
            bg-slate-50/60
            px-6
            py-3.5
          "
        >
          <h3
            className="
              text-center
              text-sm
              font-semibold
              tracking-tight
              text-slate-800
            "
          >
            {title}
          </h3>
        </header>
      )}

      {/* ===================================================
          CANVAS
      =================================================== */}

      <div
        className="
          w-full
          overflow-x-auto
          bg-white
          p-3
          sm:p-5
        "
      >
        <svg
          viewBox={`
            0
            0
            ${canvas.width}
            ${canvas.height}
          `}
          className="
            block
            min-w-[700px]
            w-full
            h-auto
          "
          role="img"
          aria-label={
            title ??
            "Diagrama académico"
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
              refX="8"
              refY="4.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="
                  M 0 0
                  L 9 4.5
                  L 0 9
                  Z
                "
                fill={
                  COLORS.connection
                }
              />
            </marker>
          </defs>

          {/* =================================================
              FONDO
          ================================================= */}

          <rect
            x="0"
            y="0"
            width={canvas.width}
            height={canvas.height}
            fill={
              COLORS.background
            }
          />

          {/* =================================================
              CONEXIONES
          ================================================= */}

          <ConnectionLayer
            connections={
              safeGraphConnections
            }
            positions={positions}
            arrowId={arrowId}
          />

          {/* =================================================
              ETIQUETAS
          ================================================= */}

          <ConnectionLabels
            connections={
              safeGraphConnections
            }
            positions={positions}
          />

          {/* =================================================
              NODOS
          ================================================= */}

          <NodesLayer
            elements={safeElements}
            positions={positions}
            rootId={rootId}
          />
        </svg>
      </div>

      {/* ===================================================
          FOOTER INFORMATIVO
      =================================================== */}

      {safeGraphConnections.length >
        0 && (
        <footer
          className="
            border-t
            border-slate-100
            bg-slate-50/30
            px-5
            py-2.5
          "
        >
          <p
            className="
              text-center
              text-[11px]
              font-medium
              text-slate-500
            "
          >
            {safeElements.length}{" "}
            elementos ·{" "}
            {
              safeGraphConnections.length
            }{" "}
            relaciones
          </p>
        </footer>
      )}
    </section>
  );
}
