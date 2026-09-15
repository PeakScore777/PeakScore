/* =========================================================
   PEAKSCORE — VALIDACIÓN DEL MOTOR VISUAL
========================================================= */

import type {
  VisualType,
  ChartType,
  MathGraphType,
  GeometryShape,
  GeometryPosition,
  GeometryCutoutType,
  GeometryCutoutSide,
  QuestionVisual,
} from "@/lib/visuals/types";

/* =========================================================
   HELPERS
========================================================= */

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(
  value: unknown
): value is string {
  return typeof value === "string";
}

function isNullableString(
  value: unknown
): value is string | null {
  return value === null || isString(value);
}

function isOptionalNullableString(
  value: unknown
): boolean {
  return (
    value === undefined ||
    value === null ||
    isString(value)
  );
}

function isNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isBoolean(
  value: unknown
): value is boolean {
  return typeof value === "boolean";
}

function isArray(
  value: unknown
): value is unknown[] {
  return Array.isArray(value);
}

/* =========================================================
   BASE VISUAL VALIDATION

   Propiedades compartidas por VisualBase.

   title es obligatorio según el contrato.
   version y description son opcionales.
========================================================= */

function hasValidVisualBase(
  data: Record<string, unknown>
): boolean {
  if (!isNullableString(data.title)) {
    return false;
  }

  if (
    data.version !== undefined &&
    !isNumber(data.version)
  ) {
    return false;
  }

  if (
    data.description !== undefined &&
    !isOptionalNullableString(data.description)
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   VALID CONSTANTS
========================================================= */

const VISUAL_TYPES: VisualType[] = [
  "chart",
  "table",
  "math_graph",
  "diagram",
  "geometry",
  "map",
  "illustration",
  "infographic",
  "image_context",
];

const CHART_TYPES: ChartType[] = [
  "bar",
  "line",
  "pie",
  "scatter",
  "area",
];

const MATH_GRAPH_TYPES: MathGraphType[] = [
  "function",
  "points",
  "coordinate_plane",
  "mixed",
];

const GEOMETRY_SHAPES: GeometryShape[] = [
  "triangle",
  "rectangle",
  "square",
  "circle",
  "semicircle",
  "polygon",
  "trapezoid",
  "parallelogram",
  "rhombus",
  "composite",
];

const GEOMETRY_POSITIONS: GeometryPosition[] = [
  "top",
  "bottom",
  "left",
  "right",
  "center",
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
];

const GEOMETRY_CUTOUT_TYPES: GeometryCutoutType[] = [
  "semicircle",
  "circle",
  "rectangle",
  "triangle",
];

const GEOMETRY_CUTOUT_SIDES: GeometryCutoutSide[] = [
  "top",
  "bottom",
  "left",
  "right",
  "center",
];

/* =========================================================
   CHART VALIDATION
========================================================= */

function isValidChartData(
  data: unknown
): boolean {
  if (!isRecord(data)) {
    return false;
  }

  if (!hasValidVisualBase(data)) {
    return false;
  }

  if (
    !isString(data.chart_type) ||
    !CHART_TYPES.includes(
      data.chart_type as ChartType
    )
  ) {
    return false;
  }

  if (!isNullableString(data.x_label)) {
    return false;
  }

  if (!isNullableString(data.y_label)) {
    return false;
  }

  if (
    !isArray(data.categories) ||
    !data.categories.every(isString)
  ) {
    return false;
  }

  if (!isArray(data.series)) {
    return false;
  }

  if (
    data.show_values !== undefined &&
    !isBoolean(data.show_values)
  ) {
    return false;
  }

  if (
    data.show_legend !== undefined &&
    !isBoolean(data.show_legend)
  ) {
    return false;
  }

  if (
    data.show_grid !== undefined &&
    !isBoolean(data.show_grid)
  ) {
    return false;
  }

  if (
    data.y_min !== undefined &&
    data.y_min !== null &&
    !isNumber(data.y_min)
  ) {
    return false;
  }

  if (
    data.y_max !== undefined &&
    data.y_max !== null &&
    !isNumber(data.y_max)
  ) {
    return false;
  }

  return data.series.every((series) => {
    if (!isRecord(series)) {
      return false;
    }

    if (!isString(series.name)) {
      return false;
    }

    if (
      !isArray(series.values) ||
      !series.values.every(isNumber)
    ) {
      return false;
    }

    if (
      series.id !== undefined &&
      !isString(series.id)
    ) {
      return false;
    }

    return true;
  });
}

/* =========================================================
   TABLE VALIDATION
========================================================= */

function isValidTableData(
  data: unknown
): boolean {
  if (!isRecord(data)) {
    return false;
  }

  if (!hasValidVisualBase(data)) {
    return false;
  }

  if (
    !isArray(data.headers) ||
    !data.headers.every(isString)
  ) {
    return false;
  }

  if (!isArray(data.rows)) {
    return false;
  }

  if (
    data.emphasize_first_column !== undefined &&
    !isBoolean(data.emphasize_first_column)
  ) {
    return false;
  }

  if (
    data.show_row_numbers !== undefined &&
    !isBoolean(data.show_row_numbers)
  ) {
    return false;
  }

  return data.rows.every((row) => {
    if (!isArray(row)) {
      return false;
    }

    return row.every(
      (cell) =>
        cell === null ||
        isString(cell) ||
        isNumber(cell) ||
        isBoolean(cell)
    );
  });
}

/* =========================================================
   MATH GRAPH HELPERS
========================================================= */

function isValidMathGraphAxis(
  axis: unknown
): boolean {
  if (!isRecord(axis)) {
    return false;
  }

  if (!isNumber(axis.min)) {
    return false;
  }

  if (!isNumber(axis.max)) {
    return false;
  }

  if (
    axis.step !== undefined &&
    !isNumber(axis.step)
  ) {
    return false;
  }

  return true;
}

function isValidMathGraphFunction(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isString(value.id) ||
    value.id.trim().length === 0
  ) {
    return false;
  }

  if (!isString(value.expression)) {
    return false;
  }

  if (!isString(value.label)) {
    return false;
  }

  if (value.domain !== undefined) {
    if (
      !isArray(value.domain) ||
      value.domain.length !== 2 ||
      !value.domain.every(isNumber)
    ) {
      return false;
    }
  }

  if (
    value.visible !== undefined &&
    !isBoolean(value.visible)
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   MATH GRAPH VALIDATION
========================================================= */

function isValidMathGraphData(
  data: unknown
): boolean {
  if (!isRecord(data)) {
    return false;
  }

  if (!hasValidVisualBase(data)) {
    return false;
  }

  if (
    !isString(data.graph_type) ||
    !MATH_GRAPH_TYPES.includes(
      data.graph_type as MathGraphType
    )
  ) {
    return false;
  }

  if (!isNullableString(data.x_label)) {
    return false;
  }

  if (!isNullableString(data.y_label)) {
    return false;
  }

  if (
    !isArray(data.x_range) ||
    data.x_range.length !== 2 ||
    !data.x_range.every(isNumber)
  ) {
    return false;
  }

  if (
    !isArray(data.y_range) ||
    data.y_range.length !== 2 ||
    !data.y_range.every(isNumber)
  ) {
    return false;
  }

  if (!isArray(data.points)) {
    return false;
  }

  if (
    !data.points.every((point) => {
      if (!isRecord(point)) {
        return false;
      }

      if (!isNumber(point.x)) {
        return false;
      }

      if (!isNumber(point.y)) {
        return false;
      }

      if (
        point.label !== undefined &&
        !isNullableString(point.label)
      ) {
        return false;
      }

      if (
        point.id !== undefined &&
        !isString(point.id)
      ) {
        return false;
      }

      if (
        point.show_label !== undefined &&
        !isBoolean(point.show_label)
      ) {
        return false;
      }

      return true;
    })
  ) {
    return false;
  }

  if (data.functions !== undefined) {
    if (
      !isArray(data.functions) ||
      !data.functions.every(
        isValidMathGraphFunction
      )
    ) {
      return false;
    }
  }

  if (
    data.show_grid !== undefined &&
    !isBoolean(data.show_grid)
  ) {
    return false;
  }

  if (
    data.show_axis_numbers !== undefined &&
    !isBoolean(data.show_axis_numbers)
  ) {
    return false;
  }

  if (
    data.show_axes !== undefined &&
    !isBoolean(data.show_axes)
  ) {
    return false;
  }

  if (
    data.x_axis !== undefined &&
    !isValidMathGraphAxis(data.x_axis)
  ) {
    return false;
  }

  if (
    data.y_axis !== undefined &&
    !isValidMathGraphAxis(data.y_axis)
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   GEOMETRY HELPERS
========================================================= */

function isValidGeometryLabel(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (!isString(value.text)) {
    return false;
  }

  if (
    !isString(value.position) ||
    !GEOMETRY_POSITIONS.includes(
      value.position as GeometryPosition
    )
  ) {
    return false;
  }

  if (
    value.offset_x !== undefined &&
    !isNumber(value.offset_x)
  ) {
    return false;
  }

  if (
    value.offset_y !== undefined &&
    !isNumber(value.offset_y)
  ) {
    return false;
  }

  return true;
}

function isValidGeometryMeasurement(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (!isString(value.label)) {
    return false;
  }

  if (!isString(value.value)) {
    return false;
  }

  if (
    value.position !== undefined &&
    (
      !isString(value.position) ||
      !GEOMETRY_POSITIONS.includes(
        value.position as GeometryPosition
      )
    )
  ) {
    return false;
  }

  return true;
}

function isValidGeometryCutout(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.id !== undefined &&
    !isString(value.id)
  ) {
    return false;
  }

  if (
    !isString(value.type) ||
    !GEOMETRY_CUTOUT_TYPES.includes(
      value.type as GeometryCutoutType
    )
  ) {
    return false;
  }

  if (
    !isString(value.side) ||
    !GEOMETRY_CUTOUT_SIDES.includes(
      value.side as GeometryCutoutSide
    )
  ) {
    return false;
  }

  if (
    value.radius !== undefined &&
    !isNumber(value.radius)
  ) {
    return false;
  }

  if (
    value.width !== undefined &&
    !isNumber(value.width)
  ) {
    return false;
  }

  if (
    value.height !== undefined &&
    !isNumber(value.height)
  ) {
    return false;
  }

  if (
    value.removed !== undefined &&
    !isBoolean(value.removed)
  ) {
    return false;
  }

  return true;
}

function isValidGeometryPoint(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isString(value.id) ||
    value.id.trim().length === 0
  ) {
    return false;
  }

  if (!isNumber(value.x)) {
    return false;
  }

  if (!isNumber(value.y)) {
    return false;
  }

  if (
    value.label !== undefined &&
    !isNullableString(value.label)
  ) {
    return false;
  }

  return true;
}

function isValidGeometrySegment(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isString(value.from) ||
    value.from.trim().length === 0
  ) {
    return false;
  }

  if (
    !isString(value.to) ||
    value.to.trim().length === 0
  ) {
    return false;
  }

  if (
    value.label !== undefined &&
    !isNullableString(value.label)
  ) {
    return false;
  }

  if (
    value.measurement !== undefined &&
    !isNullableString(value.measurement)
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   GEOMETRY VALIDATION
========================================================= */

function isValidGeometryData(
  data: unknown
): boolean {
  if (!isRecord(data)) {
    return false;
  }

  if (!hasValidVisualBase(data)) {
    return false;
  }

  if (
    !isString(data.shape) ||
    !GEOMETRY_SHAPES.includes(
      data.shape as GeometryShape
    )
  ) {
    return false;
  }

  if (
    !isArray(data.labels) ||
    !data.labels.every(isValidGeometryLabel)
  ) {
    return false;
  }

  if (
    !isArray(data.measurements) ||
    !data.measurements.every(
      isValidGeometryMeasurement
    )
  ) {
    return false;
  }

  if (
    data.cutouts !== undefined &&
    (
      !isArray(data.cutouts) ||
      !data.cutouts.every(
        isValidGeometryCutout
      )
    )
  ) {
    return false;
  }

  if (
    data.points !== undefined &&
    (
      !isArray(data.points) ||
      !data.points.every(
        isValidGeometryPoint
      )
    )
  ) {
    return false;
  }

  if (
    data.segments !== undefined &&
    (
      !isArray(data.segments) ||
      !data.segments.every(
        isValidGeometrySegment
      )
    )
  ) {
    return false;
  }

  if (
    data.preserve_aspect_ratio !== undefined &&
    !isBoolean(data.preserve_aspect_ratio)
  ) {
    return false;
  }

  if (
    data.show_measurements !== undefined &&
    !isBoolean(data.show_measurements)
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   DIAGRAM VALIDATION
========================================================= */

const DIAGRAM_ELEMENT_TYPES = [
  "node",
  "process",
  "decision",
  "input",
  "output",
  "group",
] as const;

const DIAGRAM_LAYOUTS = [
  "horizontal",
  "vertical",
  "free",
] as const;

function isValidDiagramElementType(
  value: unknown
): boolean {
  return (
    isString(value) &&
    (
      DIAGRAM_ELEMENT_TYPES as readonly string[]
    ).includes(value)
  );
}

function isValidDiagramLayout(
  value: unknown
): boolean {
  return (
    isString(value) &&
    (
      DIAGRAM_LAYOUTS as readonly string[]
    ).includes(value)
  );
}

function isValidDiagramData(
  data: unknown
): boolean {
  if (!isRecord(data)) {
    return false;
  }

  if (!hasValidVisualBase(data)) {
    return false;
  }

  if (
    !isArray(data.elements) ||
    data.elements.length === 0
  ) {
    return false;
  }

  const elementIds = new Set<string>();

  for (const element of data.elements) {
    if (!isRecord(element)) {
      return false;
    }

    if (
      !isString(element.id) ||
      element.id.trim().length === 0
    ) {
      return false;
    }

    if (
      !isString(element.label) ||
      element.label.trim().length === 0
    ) {
      return false;
    }

    if (
      element.type !== undefined &&
      !isValidDiagramElementType(element.type)
    ) {
      return false;
    }

    if (
      element.x !== undefined &&
      !isNumber(element.x)
    ) {
      return false;
    }

    if (
      element.y !== undefined &&
      !isNumber(element.y)
    ) {
      return false;
    }

    if (
      element.width !== undefined &&
      !isNumber(element.width)
    ) {
      return false;
    }

    if (
      element.height !== undefined &&
      !isNumber(element.height)
    ) {
      return false;
    }

    if (elementIds.has(element.id)) {
      return false;
    }

    elementIds.add(element.id);
  }

  if (!isArray(data.connections)) {
    return false;
  }

  if (
    data.layout !== undefined &&
    !isValidDiagramLayout(data.layout)
  ) {
    return false;
  }

  return data.connections.every((connection) => {
    if (!isRecord(connection)) {
      return false;
    }

    if (
      !isString(connection.from) ||
      connection.from.trim().length === 0
    ) {
      return false;
    }

    if (
      !isString(connection.to) ||
      connection.to.trim().length === 0
    ) {
      return false;
    }

    if (!elementIds.has(connection.from)) {
      return false;
    }

    if (!elementIds.has(connection.to)) {
      return false;
    }

    if (!isNullableString(connection.label)) {
      return false;
    }

    if (
      connection.directional !== undefined &&
      !isBoolean(connection.directional)
    ) {
      return false;
    }

    return true;
  });
}

/* =========================================================
   MAIN VISUAL DATA VALIDATOR
========================================================= */

export function validateVisualData(
  visualType: VisualType | null,
  visualData: unknown
): boolean {
  if (visualType === null) {
    return visualData === null;
  }

  if (!VISUAL_TYPES.includes(visualType)) {
    return false;
  }

  if (
    visualData === null ||
    visualData === undefined
  ) {
    return false;
  }

  switch (visualType) {
    case "chart":
      return isValidChartData(visualData);

    case "table":
      return isValidTableData(visualData);

    case "math_graph":
      return isValidMathGraphData(visualData);

    case "geometry":
      return isValidGeometryData(visualData);

    case "diagram":
      return isValidDiagramData(visualData);

    /*
     * Estos tipos existen en el contrato,
     * pero todavía no tienen renderer implementado.
     */
    case "map":
    case "illustration":
    case "infographic":
    case "image_context":
      return false;

    default:
      return false;
  }
}

/* =========================================================
   LEGACY / SIMPLE VALIDATOR
========================================================= */

export function isValidVisualPayload(
  visualType: VisualType | null,
  visualData: unknown
): boolean {
  return validateVisualData(
    visualType,
    visualData
  );
}

/* =========================================================
   QUESTION VISUAL TYPE GUARD
========================================================= */

/**
 * Valida el payload visual completo generado
 * por la IA antes de enviarlo al renderer.
 */
export function isValidQuestionVisual(
  value: unknown
): value is QuestionVisual {
  if (!isRecord(value)) {
    return false;
  }

  if (!isBoolean(value.requires_visual)) {
    return false;
  }

  const visualType = value.visual_type;

  const hasValidVisualType =
    visualType === null ||
    (
      isString(visualType) &&
      VISUAL_TYPES.includes(
        visualType as VisualType
      )
    );

  if (!hasValidVisualType) {
    return false;
  }

  if (
    !isNullableString(
      value.visual_description
    )
  ) {
    return false;
  }

  /*
   * La pregunta no requiere visual.
   */
  if (value.requires_visual === false) {
    return (
      value.visual_type === null &&
      value.visual_data === null
    );
  }

  /*
   * La pregunta requiere visual.
   */
  if (value.visual_type === null) {
    return false;
  }

  return validateVisualData(
    value.visual_type as VisualType,
    value.visual_data
  );
}