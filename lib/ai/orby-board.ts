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
  | {
      type: "timeline";
      title: string;
      events: Array<{ label: string; detail?: string; position: number }>;
    };

export type OrbyBoard = {
  version: 1 | 2;
  title: string;
  blocks: OrbyBoardBlock[];
  visuals?: OrbyBoardVisual[];
};

const MAX_BLOCKS = 8;
const MAX_VISUALS = 4;
const MAX_TEXT = 240;

function safeText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function safeId(value: unknown): string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,24}$/.test(value) ? value : "";
}

function sanitizeVisual(value: unknown): OrbyBoardVisual | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
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
        || (vector.dx === 0 && vector.dy === 0)) return null;
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

/** Strictly validates model-produced board data; the client renders only known React/SVG primitives. */
export function sanitizeOrbyBoard(value: unknown): OrbyBoard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if ((raw.version !== 1 && raw.version !== 2) || !Array.isArray(raw.blocks)
    || raw.blocks.length === 0 || raw.blocks.length > MAX_BLOCKS) return null;
  const title = safeText(raw.title, 100);
  if (!title) return null;

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
    if (raw.visuals !== undefined) return null;
    return { version: 1, title, blocks };
  }
  if (!Array.isArray(raw.visuals) || raw.visuals.length > MAX_VISUALS) return null;
  const visuals: OrbyBoardVisual[] = [];
  for (const candidate of raw.visuals) {
    const visual = sanitizeVisual(candidate);
    if (!visual) return null;
    visuals.push(visual);
  }
  return { version: 2, title, blocks, visuals };
}
