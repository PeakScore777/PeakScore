/* =========================================================
   PEAKSCORE — PROFESSIONAL VISUAL ENGINE
   Visual Data Contracts

   Motor visual escalable para preguntas tipo ICFES.

   Principios:
   - Datos estructurados.
   - Renderizado determinista.
   - Compatible con generación mediante IA.
   - Extensible sin romper preguntas existentes.
========================================================= */

/* =========================================================
   CORE
========================================================= */

export type VisualType =
  | "chart"
  | "table"
  | "math_graph"
  | "diagram"
  | "geometry"
  | "map"
  | "illustration"
  | "infographic"
  | "image_context";

export interface VisualBase {
  /**
   * Versión del contrato visual.
   *
   * Permite evolucionar el motor sin romper
   * preguntas almacenadas anteriormente.
   */
  version?: number;

  /**
   * Título opcional mostrado dentro del visual.
   */
  title: string | null;

  /**
   * Descripción accesible del visual.
   *
   * Útil para accesibilidad, lectores de pantalla
   * y validación del contenido.
   */
  description?: string | null;
}

/* =========================================================
   CHART
========================================================= */

export type ChartType =
  | "bar"
  | "line"
  | "pie"
  | "scatter"
  | "area";

export interface ChartSeries {
  name: string;

  /**
   * Valores asociados a categories.
   */
  values: number[];

  /**
   * Identificador opcional para renderizado.
   *
   * NO depende de colores hardcodeados.
   */
  id?: string;
}

export interface ChartVisualData extends VisualBase {
  chart_type: ChartType;

  x_label: string | null;

  y_label: string | null;

  categories: string[];

  series: ChartSeries[];

  /**
   * Permite mostrar valores encima de barras,
   * puntos o líneas cuando la pregunta lo requiere.
   */
  show_values?: boolean;

  /**
   * Configuración visual opcional.
   */
  show_legend?: boolean;

  show_grid?: boolean;

  /**
   * Valores mínimos y máximos opcionales.
   *
   * Especialmente útil para gráficos matemáticos
   * o estadísticas ICFES.
   */
  y_min?: number | null;

  y_max?: number | null;
}

/* =========================================================
   TABLE
========================================================= */

export type TableCell = string | number | boolean | null;

export interface TableVisualData extends VisualBase {
  headers: string[];

  rows: TableCell[][];

  /**
   * Permite destacar la primera columna.
   */
  emphasize_first_column?: boolean;

  /**
   * Permite usar numeración de filas.
   */
  show_row_numbers?: boolean;
}

/* =========================================================
   MATH GRAPH
========================================================= */

export type MathGraphType =
  | "function"
  | "points"
  | "coordinate_plane"
  | "mixed";

export interface MathGraphPoint {
  x: number;

  y: number;

  label?: string | null;

  /**
   * Identificador opcional.
   */
  id?: string;

  /**
   * Si debe mostrarse la etiqueta.
   */
  show_label?: boolean;
}

/**
 * Función matemática estructurada.
 *
 * Ejemplos:
 *
 * expression: "2*x + 3"
 * expression: "x^2 - 4"
 *
 * La expresión NO debe ejecutarse directamente
 * como JavaScript.
 *
 * El renderer debe utilizar un parser matemático
 * seguro.
 */
export interface MathGraphFunction {
  id: string;

  /**
   * Expresión matemática.
   */
  expression: string;

  /**
   * Etiqueta visual.
   *
   * Ejemplo:
   * f(x)
   */
  label: string;

  /**
   * Dominio opcional.
   */
  domain?: [number, number];

  /**
   * Indica si debe visualizarse.
   */
  visible?: boolean;
}

export interface MathGraphAxis {
  min: number;

  max: number;

  /**
   * Intervalo principal de la cuadrícula.
   */
  step?: number;
}

export interface MathGraphVisualData extends VisualBase {
  graph_type: MathGraphType;

  x_label: string | null;

  y_label: string | null;

  /**
   * Se mantienen para compatibilidad con
   * preguntas existentes.
   */
  x_range: [number, number];

  y_range: [number, number];

  /**
   * Puntos individuales.
   */
  points: MathGraphPoint[];

  /**
   * Funciones matemáticas.
   *
   * Esta es una mejora fundamental del motor.
   * Antes solo podíamos representar puntos.
   */
  functions?: MathGraphFunction[];

  /**
   * Mostrar cuadrícula.
   */
  show_grid?: boolean;

  /**
   * Mostrar etiquetas numéricas.
   */
  show_axis_numbers?: boolean;

  /**
   * Mostrar ejes cartesianos.
   */
  show_axes?: boolean;

  /**
   * Configuración avanzada opcional.
   */
  x_axis?: MathGraphAxis;

  y_axis?: MathGraphAxis;
}

/* =========================================================
   GEOMETRY
========================================================= */

export type GeometryShape =
  | "triangle"
  | "rectangle"
  | "square"
  | "circle"
  | "semicircle"
  | "polygon"
  | "trapezoid"
  | "parallelogram"
  | "rhombus"
  | "composite";

export type GeometryPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right";

export interface GeometryLabel {
  text: string;

  position: GeometryPosition;

  /**
   * Desplazamiento fino.
   *
   * Útil cuando un label necesita ubicarse
   * exactamente como en una figura ICFES.
   */
  offset_x?: number;

  offset_y?: number;
}

export interface GeometryMeasurement {
  /**
   * Ejemplo:
   * AB
   * Radio
   * Altura
   */
  label: string;

  /**
   * Ejemplo:
   * 12 m
   * 4 cm
   */
  value: string;

  /**
   * Ubicación de la medida.
   */
  position?: GeometryPosition;
}

/* =========================================================
   GEOMETRY CUTOUTS
========================================================= */

export type GeometryCutoutType =
  | "semicircle"
  | "circle"
  | "rectangle"
  | "triangle";

export type GeometryCutoutSide =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center";

export interface GeometryCutout {
  id?: string;

  type: GeometryCutoutType;

  side: GeometryCutoutSide;

  /**
   * Radio para círculos y semicírculos.
   */
  radius?: number;

  /**
   * Ancho para recortes rectangulares.
   */
  width?: number;

  /**
   * Alto para recortes rectangulares.
   */
  height?: number;

  /**
   * Define si la región debe visualizarse
   * como removida.
   */
  removed?: boolean;
}

/* =========================================================
   GEOMETRY POINTS
========================================================= */

/**
 * Punto geométrico.
 *
 * Permite construir polígonos y figuras
 * personalizadas más adelante.
 */
export interface GeometryPoint {
  id: string;

  x: number;

  y: number;

  label?: string | null;
}

/**
 * Segmento entre dos puntos.
 */
export interface GeometrySegment {
  from: string;

  to: string;

  label?: string | null;

  measurement?: string | null;
}

/* =========================================================
   GEOMETRY VISUAL DATA
========================================================= */

export interface GeometryVisualData extends VisualBase {
  shape: GeometryShape;

  labels: GeometryLabel[];

  measurements: GeometryMeasurement[];

  /**
   * Recortes o regiones removidas.
   */
  cutouts?: GeometryCutout[];

  /**
   * Puntos personalizados.
   *
   * Preparado para geometría más compleja.
   */
  points?: GeometryPoint[];

  /**
   * Segmentos entre puntos.
   */
  segments?: GeometrySegment[];

  /**
   * Permite escalar proporcionalmente la figura.
   */
  preserve_aspect_ratio?: boolean;

  /**
   * Mostrar medidas dentro del diagrama.
   */
  show_measurements?: boolean;
}

/* =========================================================
   DIAGRAM
========================================================= */

export type DiagramElementType =
  | "node"
  | "process"
  | "decision"
  | "input"
  | "output"
  | "group";

export interface DiagramElement {
  id: string;

  label: string;

  type?: DiagramElementType;

  /**
   * Posición opcional.
   *
   * Si no existe, el renderer puede aplicar
   * un algoritmo de layout automático.
   */
  x?: number;

  y?: number;

  width?: number;

  height?: number;
}

export interface DiagramConnection {
  from: string;

  to: string;

  label: string | null;

  directional?: boolean;
}

export interface DiagramVisualData extends VisualBase {
  elements: DiagramElement[];

  connections: DiagramConnection[];

  /**
   * Permite definir el flujo principal.
   */
  layout?: "horizontal" | "vertical" | "free";
}

/* =========================================================
   MAP
========================================================= */

/**
 * Preparado para preguntas geográficas,
 * sociales y contextos territoriales.
 */
export interface MapRegion {
  id: string;

  label: string;

  value?: string | number | null;
}

export interface MapVisualData extends VisualBase {
  /**
   * Región o mapa base.
   *
   * Ejemplo:
   * colombia
   */
  map_id: string;

  regions?: MapRegion[];
}

/* =========================================================
   ILLUSTRATION
========================================================= */

/**
 * Contexto estructurado para ilustraciones.
 *
 * La imagen real puede provenir de:
 * - Supabase Storage
 * - CDN
 * - Assets internos
 */
export interface IllustrationVisualData extends VisualBase {
  image_url: string;

  caption?: string | null;

  alt_text?: string | null;
}

/* =========================================================
   INFOGRAPHIC
========================================================= */

export interface InfographicItem {
  id: string;

  title: string;

  value?: string | number | null;

  description?: string | null;
}

export interface InfographicVisualData extends VisualBase {
  items: InfographicItem[];
}

/* =========================================================
   IMAGE CONTEXT
========================================================= */

export interface ImageContextVisualData extends VisualBase {
  image_url: string;

  caption?: string | null;

  alt_text?: string | null;

  source?: string | null;
}

/* =========================================================
   UNIÓN PRINCIPAL
========================================================= */

export type VisualData =
  | ChartVisualData
  | TableVisualData
  | MathGraphVisualData
  | GeometryVisualData
  | DiagramVisualData
  | MapVisualData
  | IllustrationVisualData
  | InfographicVisualData
  | ImageContextVisualData;

/* =========================================================
   PAYLOAD COMPLETO DEL VISUAL
========================================================= */

export interface QuestionVisual {
  requires_visual: boolean;

  visual_type: VisualType | null;

  visual_description: string | null;

  visual_data: VisualData | null;
}

/* =========================================================
   TYPE GUARDS
========================================================= */

export function isChartVisualData(
  data: VisualData
): data is ChartVisualData {
  return "chart_type" in data;
}

export function isTableVisualData(
  data: VisualData
): data is TableVisualData {
  return "headers" in data && "rows" in data;
}

export function isMathGraphVisualData(
  data: VisualData
): data is MathGraphVisualData {
  return "graph_type" in data;
}

export function isGeometryVisualData(
  data: VisualData
): data is GeometryVisualData {
  return "shape" in data && "measurements" in data;
}

export function isDiagramVisualData(
  data: VisualData
): data is DiagramVisualData {
  return "elements" in data && "connections" in data;
}