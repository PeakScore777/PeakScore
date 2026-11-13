export type OrbyBoardBlock =
  | { type: "heading" | "text"; text: string }
  | { type: "formula"; text: string }
  | { type: "step"; label: string; text: string }
  | { type: "callout"; text: string };

export type OrbyBoardPoint = { x: number; y: number; label?: string };
export type OrbyBoardVisual =
  | {
      type: "diagram";
      title: string;
      nodes: Array<{ id: string; label: string; x: number; y: number }>;
      edges: Array<{ from: string; to: string; label?: string }>;
    }
  | {
      type: "graph";
      title: string;
      xLabel: string;
      yLabel: string;
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      points: OrbyBoardPoint[];
      kind: "line" | "scatter";
    }
  | {
      type: "vectors";
      title: string;
      origin: { x: number; y: number };
      vectors: Array<{ label: string; dx: number; dy: number }>;
    }
  | { type: "table"; title: string; headers: string[]; rows: string[][] }
  | { type: "molecule"; title: string; atoms: Array<{ id: string; element: string; x: number; y: number; charge?: string }>; bonds: Array<{ from: string; to: string; order: 1 | 2 | 3 }> }
  | { type: "circuit"; title: string; components: Array<{ id: string; kind: "battery" | "resistor" | "lamp" | "switch"; x: number; y: number; label: string }>; connections: Array<{ from: string; to: string }> }
  | { type: "cell"; title: string; cellType: "animal" | "plant" | "prokaryotic"; organelles: Array<{ id: string; kind: "nucleus" | "mitochondrion" | "chloroplast" | "vacuole" | "membrane" | "cell-wall" | "ribosome" | "endoplasmic-reticulum" | "golgi" | "cytoplasm"; x: number; y: number; label: string }> }
  | { type: "dna"; title: string; pairs: Array<{ left: "A" | "T" | "C" | "G"; right: "A" | "T" | "C" | "G" }> }
  | { type: "punnett"; title: string; topAlleles: [string, string]; sideAlleles: [string, string] }
  | { type: "cell-division"; title: string; mode: "mitosis" | "meiosis"; phases: Array<{ name: string; detail: string }> }
  | { type: "organ-system"; title: string; system: "nervous" | "circulatory" | "respiratory" | "digestive" | "endocrine" | "urinary" | "skeletal" | "muscular"; structures: Array<{ id: string; name: string; x: number; y: number; role: string }> }
  | { type: "neuron"; title: string; parts: Array<{ id: string; name: string; role: string }> }
  | { type: "physiology-process"; title: string; process: "blood-flow" | "gas-exchange" | "digestion" | "nephron-filtration" | "muscle-contraction" | "synaptic-transmission"; stages: Array<{ name: string; detail: string; location: string }> }
  | {
      type: "timeline";
      title: string;
      events: Array<{ label: string; detail?: string; position: number }>;
    }
  | { type: "sketch"; title: string; strokes: OrbySketchStroke[] }
  | { type: "image"; title: string; src: string; alt: string; caption?: string }
  | {
      type: "vector-illustration";
      title: string;
      shapes: Array<
        | { id: string; kind: "path"; commands: OrbySvgPathCommand[]; fill: OrbySvgPaint; stroke: OrbySvgColor; strokeWidth: number; opacity: number }
        | { id: string; kind: "circle"; cx: number; cy: number; r: number; fill: OrbySvgPaint; stroke: OrbySvgColor; strokeWidth: number; opacity: number }
        | { id: string; kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: OrbySvgPaint; stroke: OrbySvgColor; strokeWidth: number; opacity: number }
        | { id: string; kind: "line"; x1: number; y1: number; x2: number; y2: number; stroke: OrbySvgColor; strokeWidth: number; opacity: number }
        | { id: string; kind: "polygon"; points: Array<{ x: number; y: number }>; fill: OrbySvgPaint; stroke: OrbySvgColor; strokeWidth: number; opacity: number }
      >;
      labels: Array<{ x: number; y: number; text: string; tone: OrbySvgColor; anchor: "start" | "middle" | "end" }>;
    }
  | { type: "annotation"; title: string; mark: "circle" | "underline" | "arrow" | "bracket"; points: Array<{ x: number; y: number }>; tone: "blue" | "red" | "accent" | "success" | "muted"; label?: string };

export type OrbySvgColor = "ink" | "blue" | "red" | "orange" | "green" | "yellow" | "teal" | "purple" | "muted" | "white";
export type OrbySvgPaint = OrbySvgColor | "none";
export type OrbySvgPathCommand =
  | { op: "M" | "L"; x: number; y: number }
  | { op: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: "Q"; x1: number; y1: number; x: number; y: number }
  | { op: "Z" };

/**
 * Estimates handwriting duration from the actual path geometry, not the
 * number of sampled points. This keeps short strokes quick and long contours
 * readable without making sparse paths unnaturally fast.
 *
 * Numeric input remains supported for compatibility with older tests/tools.
 * The live renderer schedules new strokes against the active drawing timeline.
 */
/**
 * Shared stagger for SVG components whose actual stroke animation lives on
 * a child path/line. CSS animation-delay is not inherited by SVG descendants.
 */
export function getOrbyBoardProgressiveDelay(index: number): number {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return Math.min(safeIndex * 90, 630);
}

export function getOrbySketchStrokeTiming(
  index: number,
  pointsOrPointCount: number | readonly { x: number; y: number }[],
) {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  if (typeof pointsOrPointCount === "number") {
    const safePointCount = Number.isFinite(pointsOrPointCount)
      ? Math.max(2, Math.min(40, Math.floor(pointsOrPointCount)))
      : 2;
    return {
      delay: Math.min(safeIndex * 260, 1_300),
      duration: Math.min(1_600, Math.max(760, safePointCount * 34)),
    };
  }

  let pathLength = 0;
  for (let index = 1; index < pointsOrPointCount.length; index += 1) {
    const previous = pointsOrPointCount[index - 1];
    const current = pointsOrPointCount[index];
    pathLength += Math.hypot(current.x - previous.x, current.y - previous.y);
  }
  return {
    // Only a brief pen-lift gap is allowed; do not accumulate multi-second
    // waits as the board grows across cumulative snapshots.
    delay: Math.min(safeIndex * 70, 350),
    duration: Math.round(Math.min(1_900, Math.max(420, pathLength * 14))),
  };
}

/**
 * A small handwriting motion profile shared by the ink and the moving pen.
 * The pen accelerates gently after each lift, travels naturally through the
 * middle of a stroke, and eases out before lifting. Keeping both SMIL tracks
 * on the same profile prevents the nib from drifting away from the ink.
 */
export function getOrbySketchMotionProfile(points: readonly { x: number; y: number }[]) {
  let turnRadians = 0;
  for (let index = 2; index < points.length; index += 1) {
    const a = points[index - 2];
    const b = points[index - 1];
    const c = points[index];
    const first = Math.atan2(b.y - a.y, b.x - a.x);
    const second = Math.atan2(c.y - b.y, c.x - b.x);
    const delta = Math.atan2(Math.sin(second - first), Math.cos(second - first));
    turnRadians += Math.abs(delta);
  }

  // Keep a single valid 0→1 SMIL interval. Curvier paths get a slightly
  // softer easing curve without introducing nonexistent keyframe values.
  const complexity = Math.min(1, turnRadians / (Math.PI * 2));
  const controlStart = (0.28 + complexity * 0.08).toFixed(2);
  const controlEnd = (0.72 - complexity * 0.08).toFixed(2);
  return {
    keyPoints: "0;1",
    keyTimes: "0;1",
    keySplines: `${controlStart} 0 ${controlEnd} 1`,
  };
}

export type OrbySketchStroke = {
  id: string;
  points: Array<{ x: number; y: number }>;
  tone: "ink" | "blue" | "red" | "accent" | "muted" | "success";
  width: number;
  label?: string;
  labelX?: number;
  labelY?: number;
};

export type OrbyBoardLayoutElement = {
  /** Stable, unique ID for this spatial teaching stage. */
  id: string;
  /** Monotonic teaching order; append new stages instead of reordering old ones. */
  sequence: number;
  kind: "block" | "visual";
  /** Index into blocks[] or visuals[], depending on kind. */
  index: number;
  /** Zero-based page on a vertical sequence of 16:9 teaching sheets (v3 only). */
  page?: number;
  /** Normalized position and size on the shared 16:9 teaching canvas (0–100). */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OrbyBoardLayout = {
  aspectRatio: "16:9";
  /** Number of vertically chained teaching sheets (required by v3). */
  pageCount?: number;
  /** Ordered spatial composition. Every block and visual must appear exactly once. */
  elements: OrbyBoardLayoutElement[];
};

export type OrbyBoard = {
  version: 1 | 2 | 3;
  title: string;
  blocks: OrbyBoardBlock[];
  /** Exact short phrase that should be heard before this snapshot is shown in Live voice. */
  spokenCue?: string;
  visuals?: OrbyBoardVisual[];
  /** Optional spatial composition; v3 uses pageCount + page on each layout element. */
  layout?: OrbyBoardLayout;
  /** Temporary teacher-only focus target; never an input surface for students. */
  teacherFocus?:
    | { strokeId: string; elementId?: never; pointIndex?: number; targetId?: never; label?: string; revision: number }
    | { elementId: string; strokeId?: never; targetId?: string; label?: string; revision: number };
};

const MAX_BLOCKS = 8;
const MAX_VISUALS = 4;
const MAX_PAGED_BLOCKS = 24;
const MAX_PAGED_VISUALS = 8;
const MAX_BOARD_ELEMENTS_PER_PAGE = 12;
const MAX_BOARD_PAGES = 4;
const MAX_SKETCH_STROKES = 40;
const MAX_TEXT = 240;
const MAX_BOARD_BYTES = 22_000;
const MAX_PAGED_BOARD_BYTES = 36_000;

function withinBoardBudget(board: OrbyBoard, maxBytes = MAX_BOARD_BYTES): boolean {
  return new TextEncoder().encode(JSON.stringify(board)).byteLength <= maxBytes;
}

function safeText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>\u0000-\u001f]/g, " ")
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u200D\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function safeId(value: unknown): string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,24}$/.test(value) ? value : "";
}

const ORBY_SVG_COLORS = new Set<OrbySvgColor>(["ink", "blue", "red", "orange", "green", "yellow", "teal", "purple", "muted", "white"]);

function sanitizeSvgColor(value: unknown, fallback: OrbySvgColor): OrbySvgColor {
  return typeof value === "string" && ORBY_SVG_COLORS.has(value as OrbySvgColor)
    ? value as OrbySvgColor
    : fallback;
}

function sanitizeVectorShape(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = safeId(raw.id);
  if (!id) return null;
  const stroke = sanitizeSvgColor(raw.stroke, "ink");
  const fill = raw.fill === undefined || raw.fill === "none" ? "none" : sanitizeSvgColor(raw.fill, "white");
  const strokeWidth = raw.strokeWidth === undefined ? 1.25 : raw.strokeWidth;
  const opacity = raw.opacity === undefined ? 1 : raw.opacity;
  if (!finite(strokeWidth, 0.35, 4) || !finite(opacity, 0.1, 1)) return null;
  const style = { id, stroke, fill, strokeWidth, opacity };
  if (raw.kind === "path") {
    if (!Array.isArray(raw.commands) || raw.commands.length < 2 || raw.commands.length > 64) return null;
    const commands: OrbySvgPathCommand[] = [];
    for (const candidate of raw.commands) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
      const command = candidate as Record<string, unknown>;
      if (command.op === "Z") { commands.push({ op: "Z" }); continue; }
      if (command.op === "M" || command.op === "L") {
        if (!finite(command.x, 0, 100) || !finite(command.y, 0, 100)) return null;
        commands.push({ op: command.op, x: command.x, y: command.y });
      } else if (command.op === "C") {
        if (!finite(command.x1, 0, 100) || !finite(command.y1, 0, 100)
          || !finite(command.x2, 0, 100) || !finite(command.y2, 0, 100)
          || !finite(command.x, 0, 100) || !finite(command.y, 0, 100)) return null;
        commands.push({ op: "C", x1: command.x1, y1: command.y1, x2: command.x2, y2: command.y2, x: command.x, y: command.y });
      } else if (command.op === "Q") {
        if (!finite(command.x1, 0, 100) || !finite(command.y1, 0, 100)
          || !finite(command.x, 0, 100) || !finite(command.y, 0, 100)) return null;
        commands.push({ op: "Q", x1: command.x1, y1: command.y1, x: command.x, y: command.y });
      } else return null;
    }
    if (commands[0]?.op !== "M" || commands.some((item, index) => item.op === "Z" && index === 0)) return null;
    return { kind: "path", commands, ...style };
  }
  if (raw.kind === "circle") {
    if (!finite(raw.cx, 0, 100) || !finite(raw.cy, 0, 100) || !finite(raw.r, 0.5, 30)) return null;
    return { kind: "circle", cx: raw.cx, cy: raw.cy, r: raw.r, ...style };
  }
  if (raw.kind === "ellipse") {
    if (!finite(raw.cx, 0, 100) || !finite(raw.cy, 0, 100)
      || !finite(raw.rx, 0.5, 40) || !finite(raw.ry, 0.5, 40)) return null;
    return { kind: "ellipse", cx: raw.cx, cy: raw.cy, rx: raw.rx, ry: raw.ry, ...style };
  }
  if (raw.kind === "line") {
    if (!finite(raw.x1, 0, 100) || !finite(raw.y1, 0, 100)
      || !finite(raw.x2, 0, 100) || !finite(raw.y2, 0, 100)) return null;
    return { kind: "line", id, x1: raw.x1, y1: raw.y1, x2: raw.x2, y2: raw.y2, stroke, strokeWidth, opacity };
  }
  if (raw.kind === "polygon") {
    if (!Array.isArray(raw.points) || raw.points.length < 3 || raw.points.length > 32) return null;
    const points: Array<{ x: number; y: number }> = [];
    for (const point of raw.points) {
      if (!point || typeof point !== "object" || Array.isArray(point)) return null;
      const candidate = point as Record<string, unknown>;
      if (!finite(candidate.x, 0, 100) || !finite(candidate.y, 0, 100)) return null;
      points.push({ x: candidate.x, y: candidate.y });
    }
    return { kind: "polygon", points, ...style };
  }
  return null;
}

function sanitizeVisual(value: unknown): OrbyBoardVisual | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.type === "sketch") {
    if (!Array.isArray(raw.strokes) || raw.strokes.length < 1 || raw.strokes.length > MAX_SKETCH_STROKES) return null;
    const strokes: OrbySketchStroke[] = [];
    const ids = new Set<string>();
    for (const entry of raw.strokes) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      if (!id || ids.has(id) || !Array.isArray(item.points) || item.points.length < 2 || item.points.length > 40) return null;
      ids.add(id);
      const points: Array<{ x: number; y: number }> = [];
      for (const pointEntry of item.points) {
        if (!pointEntry || typeof pointEntry !== "object" || Array.isArray(pointEntry)) return null;
        const point = pointEntry as Record<string, unknown>;
        if (!finite(point.x, 4, 96) || !finite(point.y, 4, 96)) return null;
        points.push({ x: point.x, y: point.y });
      }
      const tone = item.tone === undefined ? "ink" : item.tone;
      if (tone !== "ink" && tone !== "blue" && tone !== "red" && tone !== "accent" && tone !== "muted" && tone !== "success") return null;
      const width = item.width === undefined ? 1.25 : item.width;
      if (!finite(width, 0.6, 2.4)) return null;
      const label = safeText(item.label, 48);
      const hasLabelPosition = item.labelX !== undefined || item.labelY !== undefined;
      if ((label && (!finite(item.labelX, 4, 96) || !finite(item.labelY, 4, 96)))
        || (hasLabelPosition && !label)) return null;
      strokes.push({
        id,
        points,
        tone,
        width,
        ...(label ? { label } : {}),
        ...(hasLabelPosition ? { labelX: item.labelX as number, labelY: item.labelY as number } : {}),
      });
    }
    return { type: "sketch", title: safeText(raw.title, 80), strokes };
  }
  if (raw.type === "image") {
    // Only same-origin, authenticated Orby image routes are allowed on the board.
    // Never let model-produced URLs load arbitrary remote content.
    const src = typeof raw.src === "string" ? raw.src : "";
    if (!/^\/api\/orby\/images\?path=[A-Za-z0-9%._~-]+$/.test(src)) return null;
    const alt = safeText(raw.alt, 160);
    if (!alt) return null;
    return {
      type: "image",
      title: safeText(raw.title, 80),
      src,
      alt,
      ...(raw.caption === undefined ? {} : { caption: safeText(raw.caption, 180) }),
    };
  }

  if (raw.type === "vector-illustration") {
    const rawLabels = raw.labels === undefined ? [] : raw.labels;
    // A vector illustration is reserved for a real educational scene,
    // not a lone icon or decorative mark. Keep the scene bounded and labeled.
    if (!Array.isArray(raw.shapes) || raw.shapes.length < 5 || raw.shapes.length > 40
      || !Array.isArray(rawLabels) || rawLabels.length < 1 || rawLabels.length > 18) return null;
    const shapes = raw.shapes.map(sanitizeVectorShape);
    if (shapes.some((shape) => shape === null)) return null;
    const shapeIds = shapes.map((shape) => (shape as { id: string }).id);
    if (new Set(shapeIds).size !== shapeIds.length) return null;
    const labels: Array<{ x: number; y: number; text: string; tone: OrbySvgColor; anchor: "start" | "middle" | "end" }> = [];
    for (const entry of rawLabels) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const label = entry as Record<string, unknown>;
      const text = safeText(label.text, 40);
      if (!text || !finite(label.x, 2, 98) || !finite(label.y, 2, 98)
        || (label.anchor !== undefined && !["start", "middle", "end"].includes(String(label.anchor)))) return null;
      labels.push({
        x: label.x, y: label.y, text,
        tone: sanitizeSvgColor(label.tone, "ink"),
        anchor: label.anchor === "middle" || label.anchor === "end" ? label.anchor : "start",
      });
    }
    return { type: "vector-illustration", title: safeText(raw.title, 80), shapes: shapes as Extract<OrbyBoardVisual, { type: "vector-illustration" }>["shapes"], labels };
  }

  if (raw.type === "annotation") {
    if (!["circle", "underline", "arrow", "bracket"].includes(String(raw.mark))
      || !Array.isArray(raw.points) || raw.points.length < 2 || raw.points.length > 12) return null;

    // Optional fields may be absent or explicitly undefined (some SDK payloads
    // materialize optional keys this way). Normalize both to omission. Reject
    // null/objects/numbers instead of silently hiding malformed model output.
    if ((raw.title !== undefined && typeof raw.title !== "string")
      || (raw.label !== undefined && typeof raw.label !== "string")) return null;
    const title = raw.title === undefined ? "" : safeText(raw.title, 80);
    const label = raw.label === undefined ? "" : safeText(raw.label, 48);

    const points: Array<{ x: number; y: number }> = [];
    for (const entry of raw.points) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const point = entry as Record<string, unknown>;
      // Only the two coordinates are part of the public contract. Additional
      // SDK metadata (including undefined values) is intentionally discarded.
      if (!finite(point.x, 4, 96) || !finite(point.y, 4, 96)) return null;
      points.push({ x: point.x, y: point.y });
    }

    const tone = raw.tone === undefined ? "accent" : raw.tone;
    if (tone !== "blue" && tone !== "red" && tone !== "accent" && tone !== "success" && tone !== "muted") return null;
    return {
      type: "annotation",
      title,
      mark: raw.mark as "circle" | "underline" | "arrow" | "bracket",
      points,
      tone,
      ...(label ? { label } : {}),
    };
  }

  if (raw.type === "diagram") {
    if (!Array.isArray(raw.nodes) || raw.nodes.length < 2 || raw.nodes.length > 12
      || !Array.isArray(raw.edges) || raw.edges.length > 20) return null;
    const nodes: Array<{ id: string; label: string; x: number; y: number }> = [];
    const ids = new Set<string>();
    for (const entry of raw.nodes) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const node = entry as Record<string, unknown>;
      const id = safeId(node.id);
      const label = safeText(node.label, 64);
      if (!id || ids.has(id) || !label || !finite(node.x, 5, 95) || !finite(node.y, 8, 92)) return null;
      ids.add(id);
      nodes.push({ id, label, x: node.x, y: node.y });
    }
    const edges: Array<{ from: string; to: string; label?: string }> = [];
    for (const entry of raw.edges) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const edge = entry as Record<string, unknown>;
      const from = safeId(edge.from);
      const to = safeId(edge.to);
      const label = safeText(edge.label, 48);
      if (!from || !to || from === to || !ids.has(from) || !ids.has(to)) return null;
      edges.push({ from, to, ...(label ? { label } : {}) });
    }
    return { type: "diagram", title: safeText(raw.title, 80), nodes, edges };
  }

  if (raw.type === "graph") {
    if (!Array.isArray(raw.points) || raw.points.length < 2 || raw.points.length > 24
      || !finite(raw.xMin, -1_000_000, 1_000_000) || !finite(raw.xMax, -1_000_000, 1_000_000)
      || !finite(raw.yMin, -1_000_000, 1_000_000) || !finite(raw.yMax, -1_000_000, 1_000_000)
      || raw.xMin >= raw.xMax || raw.yMin >= raw.yMax
      || (raw.kind !== "line" && raw.kind !== "scatter")) return null;
    const points: OrbyBoardPoint[] = [];
    for (const entry of raw.points) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const point = entry as Record<string, unknown>;
      if (!finite(point.x, raw.xMin, raw.xMax) || !finite(point.y, raw.yMin, raw.yMax)) return null;
      const label = safeText(point.label, 32);
      points.push({ x: point.x, y: point.y, ...(label ? { label } : {}) });
    }
    return {
      type: "graph",
      title: safeText(raw.title, 80),
      xLabel: safeText(raw.xLabel, 40),
      yLabel: safeText(raw.yLabel, 40),
      xMin: raw.xMin, xMax: raw.xMax, yMin: raw.yMin, yMax: raw.yMax,
      points, kind: raw.kind,
    };
  }

  if (raw.type === "vectors") {
    if (!raw.origin || typeof raw.origin !== "object" || Array.isArray(raw.origin)
      || !Array.isArray(raw.vectors) || raw.vectors.length < 1 || raw.vectors.length > 8) return null;
    const origin = raw.origin as Record<string, unknown>;
    if (!finite(origin.x, 10, 90) || !finite(origin.y, 10, 90)) return null;
    const vectors: Array<{ label: string; dx: number; dy: number }> = [];
    for (const entry of raw.vectors) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const vector = entry as Record<string, unknown>;
      const label = safeText(vector.label, 40);
      if (!label || !finite(vector.dx, -40, 40) || !finite(vector.dy, -40, 40)
        || (vector.dx === 0 && vector.dy === 0)
        // Validate the actual arrow tip, not only its delta. The SVG canvas is
        // normalized to 0–100; an otherwise valid vector must stay inside it.
        || !finite(origin.x + vector.dx, 4, 96)
        || !finite(origin.y - vector.dy, 4, 96)) return null;
      vectors.push({ label, dx: vector.dx, dy: vector.dy });
    }
    return { type: "vectors", title: safeText(raw.title, 80), origin: { x: origin.x, y: origin.y }, vectors };
  }

  if (raw.type === "table") {
    if (!Array.isArray(raw.headers) || raw.headers.length < 2 || raw.headers.length > 5
      || !Array.isArray(raw.rows) || raw.rows.length < 1 || raw.rows.length > 8) return null;
    const headers = raw.headers.map((item) => safeText(item, 40));
    if (headers.some((item) => !item)) return null;
    const rows: string[][] = [];
    for (const row of raw.rows) {
      if (!Array.isArray(row) || row.length !== headers.length) return null;
      const cells = row.map((item) => safeText(item, 64));
      if (cells.some((item) => !item)) return null;
      rows.push(cells);
    }
    return { type: "table", title: safeText(raw.title, 80), headers, rows };
  }

  if (raw.type === "molecule") {
    if (!Array.isArray(raw.atoms) || raw.atoms.length < 2 || raw.atoms.length > 16
      || !Array.isArray(raw.bonds) || raw.bonds.length < 1 || raw.bonds.length > 24) return null;
    const atoms: Array<{ id: string; element: string; x: number; y: number; charge?: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.atoms) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const atom = entry as Record<string, unknown>;
      const id = safeId(atom.id);
      const element = safeText(atom.element, 2);
      const charge = safeText(atom.charge, 3);
      if (!id || ids.has(id) || !/^[A-Z][a-z]?$/.test(element)
        || !finite(atom.x, 8, 92) || !finite(atom.y, 8, 92)
        || (atom.charge !== undefined && !/^(?:[+-]|[1-9][+-])$/.test(charge))) return null;
      ids.add(id);
      atoms.push({ id, element, x: atom.x, y: atom.y, ...(charge ? { charge } : {}) });
    }
    const bonds: Array<{ from: string; to: string; order: 1 | 2 | 3 }> = [];
    const seenBonds = new Set<string>();
    for (const entry of raw.bonds) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const bond = entry as Record<string, unknown>;
      const from = safeId(bond.from);
      const to = safeId(bond.to);
      const key = [from, to].sort().join(":");
      if (!from || !to || from === to || !ids.has(from) || !ids.has(to)
        || seenBonds.has(key) || (bond.order !== 1 && bond.order !== 2 && bond.order !== 3)) return null;
      seenBonds.add(key);
      bonds.push({ from, to, order: bond.order });
    }
    return { type: "molecule", title: safeText(raw.title, 80), atoms, bonds };
  }

  if (raw.type === "circuit") {
    if (!Array.isArray(raw.components) || raw.components.length < 2 || raw.components.length > 12
      || !Array.isArray(raw.connections) || raw.connections.length < 1 || raw.connections.length > 20) return null;
    const components: Array<{ id: string; kind: "battery" | "resistor" | "lamp" | "switch"; x: number; y: number; label: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.components) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const component = entry as Record<string, unknown>;
      const id = safeId(component.id);
      const kind = component.kind;
      const label = safeText(component.label, 24);
      if (!id || ids.has(id) || !["battery", "resistor", "lamp", "switch"].includes(String(kind))
        || !label || !finite(component.x, 8, 92) || !finite(component.y, 8, 92)) return null;
      ids.add(id);
      components.push({ id, kind: kind as "battery" | "resistor" | "lamp" | "switch", x: component.x, y: component.y, label });
    }
    const connections: Array<{ from: string; to: string }> = [];
    const seenConnections = new Set<string>();
    for (const entry of raw.connections) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const connection = entry as Record<string, unknown>;
      const from = safeId(connection.from);
      const to = safeId(connection.to);
      const key = [from, to].sort().join(":");
      if (!from || !to || from === to || !ids.has(from) || !ids.has(to) || seenConnections.has(key)) return null;
      seenConnections.add(key);
      connections.push({ from, to });
    }
    return { type: "circuit", title: safeText(raw.title, 80), components, connections };
  }

  if (raw.type === "cell") {
    if (!["animal", "plant", "prokaryotic"].includes(String(raw.cellType))
      || !Array.isArray(raw.organelles) || raw.organelles.length < 2 || raw.organelles.length > 14) return null;
    const allowed = ["nucleus", "mitochondrion", "chloroplast", "vacuole", "membrane", "cell-wall", "ribosome", "endoplasmic-reticulum", "golgi", "cytoplasm"];
    const organelles: Array<{ id: string; kind: "nucleus" | "mitochondrion" | "chloroplast" | "vacuole" | "membrane" | "cell-wall" | "ribosome" | "endoplasmic-reticulum" | "golgi" | "cytoplasm"; x: number; y: number; label: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.organelles) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      const kind = item.kind;
      const label = safeText(item.label, 36);
      if (!id || ids.has(id) || !allowed.includes(String(kind)) || !label
        || !finite(item.x, 10, 90) || !finite(item.y, 10, 90)) return null;
      ids.add(id);
      organelles.push({ id, kind: kind as typeof organelles[number]["kind"], x: item.x, y: item.y, label });
    }
    if (raw.cellType === "animal" && organelles.some((item) => item.kind === "cell-wall" || item.kind === "chloroplast")) return null;
    if (raw.cellType === "plant" && !organelles.some((item) => item.kind === "cell-wall")) return null;
    if (raw.cellType === "prokaryotic" && organelles.some((item) => ["nucleus", "mitochondrion", "chloroplast", "endoplasmic-reticulum", "golgi"].includes(item.kind))) return null;
    return { type: "cell", title: safeText(raw.title, 80), cellType: raw.cellType as "animal" | "plant" | "prokaryotic", organelles };
  }

  if (raw.type === "dna") {
    if (!Array.isArray(raw.pairs) || raw.pairs.length < 2 || raw.pairs.length > 12) return null;
    const pairs: Array<{ left: "A" | "T" | "C" | "G"; right: "A" | "T" | "C" | "G" }> = [];
    for (const entry of raw.pairs) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const pair = entry as Record<string, unknown>;
      if (!["A", "T", "C", "G"].includes(String(pair.left)) || !["A", "T", "C", "G"].includes(String(pair.right))
        || !((pair.left === "A" && pair.right === "T") || (pair.left === "T" && pair.right === "A")
          || (pair.left === "C" && pair.right === "G") || (pair.left === "G" && pair.right === "C"))) return null;
      pairs.push({ left: pair.left as "A" | "T" | "C" | "G", right: pair.right as "A" | "T" | "C" | "G" });
    }
    return { type: "dna", title: safeText(raw.title, 80), pairs };
  }

  if (raw.type === "punnett") {
    if (!Array.isArray(raw.topAlleles) || raw.topAlleles.length !== 2
      || !Array.isArray(raw.sideAlleles) || raw.sideAlleles.length !== 2) return null;
    const validAllele = (value: unknown) => typeof value === "string" && /^[A-Za-z]$/.test(value);
    if (!raw.topAlleles.every(validAllele) || !raw.sideAlleles.every(validAllele)) return null;
    return {
      type: "punnett",
      title: safeText(raw.title, 80),
      topAlleles: raw.topAlleles as [string, string],
      sideAlleles: raw.sideAlleles as [string, string],
    };
  }

  if (raw.type === "cell-division") {
    const expected = raw.mode === "mitosis"
      ? ["Profase", "Metafase", "Anafase", "Telofase y citocinesis"]
      : ["Profase I", "Metafase I", "Anafase I", "Telofase I", "Profase II", "Metafase II", "Anafase II", "Telofase II"];
    if ((raw.mode !== "mitosis" && raw.mode !== "meiosis")
      || !Array.isArray(raw.phases) || raw.phases.length < 1 || raw.phases.length > expected.length) return null;
    const phases: Array<{ name: string; detail: string }> = [];
    for (let index = 0; index < raw.phases.length; index += 1) {
      const entry = raw.phases[index];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const phase = entry as Record<string, unknown>;
      const name = safeText(phase.name, 40);
      const detail = safeText(phase.detail, 120);
      if (name !== expected[index] || !detail) return null;
      phases.push({ name, detail });
    }
    return { type: "cell-division", title: safeText(raw.title, 80), mode: raw.mode, phases };
  }

  if (raw.type === "organ-system") {
    const allowed = ["nervous", "circulatory", "respiratory", "digestive", "endocrine", "urinary", "skeletal", "muscular"];
    if (!allowed.includes(String(raw.system)) || !Array.isArray(raw.structures)
      || raw.structures.length < 2 || raw.structures.length > 12) return null;
    const structures: Array<{ id: string; name: string; x: number; y: number; role: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.structures) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      const name = safeText(item.name, 48);
      const role = safeText(item.role, 100);
      if (!id || ids.has(id) || !name || !role || !finite(item.x, 10, 90) || !finite(item.y, 8, 92)) return null;
      ids.add(id);
      structures.push({ id, name, x: item.x, y: item.y, role });
    }
    return { type: "organ-system", title: safeText(raw.title, 80), system: raw.system as "nervous" | "circulatory" | "respiratory" | "digestive" | "endocrine" | "urinary" | "skeletal" | "muscular", structures };
  }

  if (raw.type === "neuron") {
    if (!Array.isArray(raw.parts) || raw.parts.length < 4 || raw.parts.length > 8) return null;
    const allowed = ["dendritas", "soma", "núcleo", "cono axónico", "axón", "mielina", "nodos de ranvier", "terminales sinápticas"];
    const parts: Array<{ id: string; name: string; role: string }> = [];
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const entry of raw.parts) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      const name = safeText(item.name, 36);
      const role = safeText(item.role, 110);
      if (!id || ids.has(id) || !allowed.includes(name.toLocaleLowerCase("es")) || names.has(name.toLocaleLowerCase("es")) || !role) return null;
      ids.add(id);
      names.add(name.toLocaleLowerCase("es"));
      parts.push({ id, name, role });
    }
    if (!["dendritas", "soma", "axón", "terminales sinápticas"].every((name) => names.has(name))) return null;
    return { type: "neuron", title: safeText(raw.title, 80), parts };
  }

  if (raw.type === "physiology-process") {
    const sequences: Record<string, string[]> = {
      "blood-flow": ["Venas cavas", "Aurícula derecha", "Ventrículo derecho", "Arterias pulmonares", "Pulmones", "Venas pulmonares", "Aurícula izquierda", "Ventrículo izquierdo", "Aorta y cuerpo"],
      "gas-exchange": ["Aire llega al alvéolo", "Ventilación y difusión", "Oxígeno pasa a la sangre", "Dióxido de carbono pasa al alvéolo", "La sangre sale oxigenada"],
      digestion: ["Boca", "Esófago", "Estómago", "Intestino delgado", "Absorción de nutrientes", "Intestino grueso", "Eliminación"],
      "nephron-filtration": ["Glomérulo", "Cápsula de Bowman", "Túbulo proximal", "Asa de Henle", "Túbulo distal", "Conducto colector", "Orina hacia la pelvis renal"],
      "muscle-contraction": ["Impulso llega a la unión neuromuscular", "Se libera acetilcolina", "Se propaga el potencial muscular", "Retículo libera calcio", "Actina y miosina interactúan", "Sarcómero se acorta", "Calcio se retira y el músculo se relaja"],
      "synaptic-transmission": ["Potencial llega al terminal", "Entran iones calcio", "Vesículas liberan neurotransmisor", "Neurotransmisor cruza la hendidura", "Se une a receptores", "La célula postsináptica responde", "Neurotransmisor se elimina o recicla"],
    };
    const expected = sequences[String(raw.process)];
    if (!expected || !Array.isArray(raw.stages) || raw.stages.length < 1 || raw.stages.length > expected.length) return null;
    const stages: Array<{ name: string; detail: string; location: string }> = [];
    for (let index = 0; index < raw.stages.length; index += 1) {
      const entry = raw.stages[index];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const name = safeText(item.name, 64);
      const detail = safeText(item.detail, 140);
      const location = safeText(item.location, 64);
      if (name !== expected[index] || !detail || !location) return null;
      stages.push({ name, detail, location });
    }
    return { type: "physiology-process", title: safeText(raw.title, 80), process: raw.process as "blood-flow" | "gas-exchange" | "digestion" | "nephron-filtration" | "muscle-contraction" | "synaptic-transmission", stages };
  }

  if (raw.type === "timeline") {
    if (!Array.isArray(raw.events) || raw.events.length < 2 || raw.events.length > 8) return null;
    const events: Array<{ label: string; detail?: string; position: number }> = [];
    let previous = -1;
    for (const entry of raw.events) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const event = entry as Record<string, unknown>;
      const label = safeText(event.label, 48);
      const detail = safeText(event.detail, 80);
      if (!label || !finite(event.position, 0, 100) || event.position <= previous) return null;
      previous = event.position;
      events.push({ label, ...(detail ? { detail } : {}), position: event.position });
    }
    return { type: "timeline", title: safeText(raw.title, 80), events };
  }

  return null;
}

function sanitizeOrbyBoardLayout(
  value: unknown,
  blockCount: number,
  visualCount: number,
  paged = false,
): OrbyBoardLayout | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const pageCount = raw.pageCount;
  if (raw.aspectRatio !== "16:9" || !Array.isArray(raw.elements)
    || raw.elements.length < 1
    || raw.elements.length > (paged ? MAX_PAGED_BLOCKS + MAX_PAGED_VISUALS : MAX_BLOCKS + MAX_VISUALS)
    || raw.elements.length !== blockCount + visualCount
    || (paged && (!Number.isInteger(pageCount) || !finite(pageCount, 2, MAX_BOARD_PAGES)))
    || (!paged && raw.pageCount !== undefined)) return null;

  const elements: OrbyBoardLayoutElement[] = [];
  const ids = new Set<string>();
  const blockIndexes = new Set<number>();
  const visualIndexes = new Set<number>();
  const elementsPerPage = new Map<number, number>();
  let previousSequence = 0;

  for (const candidate of raw.elements) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const item = candidate as Record<string, unknown>;
    const id = safeId(item.id);
    const page = paged ? item.page : undefined;
    if (!id || ids.has(id)
      || !Number.isInteger(item.sequence) || !finite(item.sequence, 1, 1_000)
      || item.sequence <= previousSequence
      || (item.kind !== "block" && item.kind !== "visual")
      || !Number.isInteger(item.index)
      || (paged && (!Number.isInteger(page) || !finite(page, 0, Number(pageCount) - 1)))
      || (!paged && item.page !== undefined)
      || !finite(item.x, 0, 100) || !finite(item.y, 0, 100)
      || !finite(item.width, 8, 100) || !finite(item.height, 8, 100)
      || item.x + item.width > 100 || item.y + item.height > 100) return null;

    const index = item.index as number;
    if (item.kind === "block") {
      if (index < 0 || index >= blockCount || blockIndexes.has(index)) return null;
      blockIndexes.add(index);
    } else {
      if (index < 0 || index >= visualCount || visualIndexes.has(index)) return null;
      visualIndexes.add(index);
    }

    if (paged) {
      const pageIndex = page as number;
      const count = (elementsPerPage.get(pageIndex) ?? 0) + 1;
      if (count > MAX_BOARD_ELEMENTS_PER_PAGE) return null;
      elementsPerPage.set(pageIndex, count);
    }

    ids.add(id);
    previousSequence = item.sequence as number;
    elements.push({
      id,
      sequence: item.sequence as number,
      kind: item.kind,
      index,
      ...(paged ? { page: page as number } : {}),
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    });
  }

  if (blockIndexes.size !== blockCount || visualIndexes.size !== visualCount) return null;
  if (paged) {
    for (let page = 0; page < Number(pageCount); page += 1) {
      if (!elementsPerPage.has(page)) return null;
    }
  }
  return { aspectRatio: "16:9", elements, ...(paged ? { pageCount: pageCount as number } : {}) };
}


const BOARD_LAYOUT_OVERLAP_TOLERANCE = 0.1;

/** Annotations and freehand ink are intentionally placed over existing content. */
function isIntentionalBoardOverlay(board: OrbyBoard, element: OrbyBoardLayoutElement): boolean {
  if (element.kind !== "visual") return false;
  const visual = board.visuals?.[element.index];
  return visual?.type === "annotation" || visual?.type === "sketch";
}

function boardLayoutElementsOverlap(
  first: OrbyBoardLayoutElement,
  second: OrbyBoardLayoutElement,
): boolean {
  const overlapX = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
  const overlapY = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y);
  return overlapX > BOARD_LAYOUT_OVERLAP_TOLERANCE
    && overlapY > BOARD_LAYOUT_OVERLAP_TOLERANCE;
}

function findAvailableBoardLayoutPosition(
  element: OrbyBoardLayoutElement,
  placed: readonly OrbyBoardLayoutElement[],
): { x: number; y: number } | null {
  const maxX = Math.max(0, 100 - element.width);
  const maxY = Math.max(0, 100 - element.height);
  const axisCandidates = (maximum: number, origin: number) => {
    const values = new Set<number>([0, maximum, Math.max(0, Math.min(maximum, origin))]);
    for (let value = 0; value < maximum; value += 2) values.add(value);
    return [...values];
  };
  const xCandidates = axisCandidates(maxX, element.x);
  const yCandidates = axisCandidates(maxY, element.y);
  const candidates: Array<{ x: number; y: number; distance: number; directionPenalty: number }> = [];

  for (const y of yCandidates) {
    for (const x of xCandidates) {
      const dx = x - element.x;
      const dy = y - element.y;
      candidates.push({
        x,
        y,
        distance: dx * dx + dy * dy,
        // On equal movement, prefer keeping the stage below/right of its anchor.
        directionPenalty: Number(dy < 0) + Number(dx < 0),
      });
    }
  }

  candidates.sort((first, second) =>
    first.distance - second.distance
    || first.directionPenalty - second.directionPenalty
    || first.y - second.y
    || first.x - second.x,
  );

  for (const candidate of candidates) {
    const positioned = { ...element, x: candidate.x, y: candidate.y };
    const collides = placed.some((other) => boardLayoutElementsOverlap(positioned, other));
    if (!collides) return { x: candidate.x, y: candidate.y };
  }
  return null;
}

/**
 * Repair only accidental collisions in a teacher-authored spatial layout.
 *
 * Elements are considered in teaching order, so the earliest authored
 * positions are anchors and never move to accommodate later content. Existing
 * page assignments, sizes, sequence numbers and IDs are preserved. Annotation
 * and sketch visuals are deliberate overlays and are excluded from collision
 * packing. Cumulative v3 sheets remain deterministic as later elements append.
 */
export function arrangeOrbyBoardForTeaching(board: OrbyBoard): OrbyBoard {
  const layout = board.layout;
  if (!layout || layout.elements.length < 2 || (board.version !== 2 && board.version !== 3)) return board;

  const arranged: OrbyBoardLayoutElement[] = [];
  let changed = false;

  for (const element of layout.elements) {
    if (isIntentionalBoardOverlay(board, element)) {
      arranged.push(element);
      continue;
    }

    const earlierOnSamePage = arranged.filter((other) =>
      (board.version !== 3 || (other.page ?? 0) === (element.page ?? 0))
      && !isIntentionalBoardOverlay(board, other),
    );
    const hasCollision = earlierOnSamePage.some((other) => boardLayoutElementsOverlap(element, other));
    if (!hasCollision) {
      arranged.push(element);
      continue;
    }

    const position = findAvailableBoardLayoutPosition(element, earlierOnSamePage);
    if (!position) {
      // Preserve the teacher's original composition when the available canvas
      // cannot fit the element; never silently shrink or discard teaching content.
      arranged.push(element);
      continue;
    }

    changed ||= position.x !== element.x || position.y !== element.y;
    arranged.push({ ...element, ...position });
  }

  if (!changed) return board;
  return {
    ...board,
    layout: {
      ...layout,
      elements: arranged,
    },
  };
}


/** Strictly validates model-produced board data; the client renders only known React/SVG primitives. */
export function sanitizeOrbyBoard(value: unknown): OrbyBoard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if ((raw.version !== 1 && raw.version !== 2 && raw.version !== 3) || !Array.isArray(raw.blocks)) return null;
  const paged = raw.version === 3;
  const maxBlocks = paged ? MAX_PAGED_BLOCKS : MAX_BLOCKS;
  const maxVisuals = paged ? MAX_PAGED_VISUALS : MAX_VISUALS;
  if (raw.blocks.length > maxBlocks) return null;
  const title = safeText(raw.title, 100);
  if (!title) return null;
  const spokenCue = raw.spokenCue === undefined ? "" : safeText(raw.spokenCue, 100);
  const spokenCueWords = spokenCue ? spokenCue.split(/\s+/).filter(Boolean).length : 0;
  if (raw.spokenCue !== undefined && (spokenCueWords < 3 || spokenCueWords > 12
    || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/u.test(spokenCue))) return null;

  const blocks: OrbyBoardBlock[] = [];
  for (const candidate of raw.blocks) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const item = candidate as Record<string, unknown>;
    const type = item.type;
    if (type === "heading" || type === "text" || type === "formula" || type === "callout") {
      const text = safeText(item.text);
      if (!text) return null;
      blocks.push({ type, text });
    } else if (type === "step") {
      const label = safeText(item.label, 48);
      const text = safeText(item.text);
      if (!label || !text) return null;
      blocks.push({ type, label, text });
    } else {
      return null;
    }
  }

  if (raw.version === 1) {
    // Spatial composition is an additive v2/v3 capability; legacy v1 stays text-only.
    if (blocks.length === 0 || raw.visuals !== undefined || raw.layout !== undefined) return null;
    const board: OrbyBoard = { version: 1, title, blocks, ...(spokenCue ? { spokenCue } : {}) };
    return withinBoardBudget(board) ? board : null;
  }
  if (!Array.isArray(raw.visuals) || raw.visuals.length > maxVisuals) return null;
  const visuals: OrbyBoardVisual[] = [];
  for (const candidate of raw.visuals) {
    const visual = sanitizeVisual(candidate);
    if (!visual) return null;
    visuals.push(visual);
  }
  // A visual-only snapshot is valid: Live can draw the first sketch before
  // sending its accompanying text block. Reject only a completely empty board.
  if (blocks.length === 0 && visuals.length === 0) return null;
  // A single cumulative sketch owns the teacher pen. Multiple independent
  // sketch SVGs would create parallel pen timelines and violate the lesson UX.
  if (visuals.filter((visual) => visual.type === "sketch").length > 1) return null;
  const layout = raw.layout === undefined
    ? undefined
    : sanitizeOrbyBoardLayout(raw.layout, blocks.length, visuals.length, paged);
  if ((raw.layout !== undefined && !layout) || (paged && !layout)) return null;
  const board: OrbyBoard = {
    version: paged ? 3 : 2,
    title,
    blocks,
    visuals,
    ...(spokenCue ? { spokenCue } : {}),
    ...(layout ? { layout } : {}),
  };
  return withinBoardBudget(board, paged ? MAX_PAGED_BOARD_BYTES : MAX_BOARD_BYTES)
    ? arrangeOrbyBoardForTeaching(board)\n    : null;
}
