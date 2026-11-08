import type { OrbyBoard, OrbySketchStroke } from "@/lib/ai/orby-board";

export type OrbyBoardAction =
  | { operation: "focus"; strokeId: string; label?: string }
  | { operation: "erase"; strokeIds: string[] }
  | { operation: "replace"; strokeId: string; replacement: OrbySketchStroke };

const safeId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,24}$/.test(value);

function sanitizeStroke(value: unknown, expectedId: string): OrbySketchStroke | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.id !== expectedId || !safeId(raw.id) || !Array.isArray(raw.points)
    || raw.points.length < 2 || raw.points.length > 40) return null;
  const points: Array<{ x: number; y: number }> = [];
  for (const entry of raw.points) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const point = entry as Record<string, unknown>;
    if (typeof point.x !== "number" || !Number.isFinite(point.x) || point.x < 4 || point.x > 96
      || typeof point.y !== "number" || !Number.isFinite(point.y) || point.y < 4 || point.y > 96) return null;
    points.push({ x: point.x, y: point.y });
  }
  const tone = raw.tone === undefined ? "ink" : raw.tone;
  const width = raw.width === undefined ? 1.25 : raw.width;
  if (!["ink", "blue", "red", "accent", "muted", "success"].includes(String(tone))
    || typeof width !== "number" || !Number.isFinite(width) || width < 0.6 || width > 2.4) return null;
  const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(raw, key);
  if ((hasOwn("label") && raw.label !== undefined && typeof raw.label !== "string")
    || (hasOwn("labelX") && raw.labelX !== undefined && typeof raw.labelX !== "number")
    || (hasOwn("labelY") && raw.labelY !== undefined && typeof raw.labelY !== "number")) return null;
  const label = raw.label === undefined
    ? ""
    : raw.label.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 48);
  const hasLabelPosition = raw.labelX !== undefined || raw.labelY !== undefined;
  if ((label && (!Number.isFinite(raw.labelX) || (raw.labelX as number) < 4 || (raw.labelX as number) > 96
      || !Number.isFinite(raw.labelY) || (raw.labelY as number) < 4 || (raw.labelY as number) > 96))
    || (hasLabelPosition && !label)) return null;
  return {
    id: expectedId, points, tone: tone as OrbySketchStroke["tone"], width,
    ...(label ? { label, labelX: raw.labelX as number, labelY: raw.labelY as number } : {}),
  };
}

export function sanitizeOrbyBoardAction(value: unknown): OrbyBoardAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.operation === "focus") {
    if (!safeId(raw.strokeId)) return null;
    if (Object.prototype.hasOwnProperty.call(raw, "label")
      && raw.label !== undefined && typeof raw.label !== "string") return null;
    const label = raw.label === undefined
      ? ""
      : raw.label.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 48);
    return { operation: "focus", strokeId: raw.strokeId, ...(label ? { label } : {}) };
  }
  if (raw.operation === "erase") {
    if (!Array.isArray(raw.strokeIds) || raw.strokeIds.length < 1 || raw.strokeIds.length > 8
      || !raw.strokeIds.every(safeId) || new Set(raw.strokeIds).size !== raw.strokeIds.length) return null;
    return { operation: "erase", strokeIds: raw.strokeIds };
  }
  if (raw.operation === "replace") {
    if (!safeId(raw.strokeId)) return null;
    const replacement = sanitizeStroke(raw.replacement, raw.strokeId);
    return replacement ? { operation: "replace", strokeId: raw.strokeId, replacement } : null;
  }
  return null;
}

export function applyOrbyBoardAction(board: OrbyBoard, action: OrbyBoardAction): OrbyBoard | null {
  const sketches = (board.visuals ?? []).filter((visual) => visual.type === "sketch");
  const strokeIdCounts = new Map<string, number>();
  for (const visual of sketches) {
    for (const stroke of visual.strokes) strokeIdCounts.set(stroke.id, (strokeIdCounts.get(stroke.id) ?? 0) + 1);
  }
  const existsExactlyOnce = (id: string) => strokeIdCounts.get(id) === 1;
  if (action.operation === "focus") {
    if (!existsExactlyOnce(action.strokeId)) return null;
    return { ...board, teacherFocus: { strokeId: action.strokeId, revision: (board.teacherFocus?.revision ?? 0) + 1, ...(action.label ? { label: action.label } : {}) } };
  }
  if (action.operation === "erase") {
    if (!action.strokeIds.every(existsExactlyOnce)) return null;
    const visuals = (board.visuals ?? []).flatMap((visual) => {
      if (visual.type !== "sketch") return [visual];
      const strokes = visual.strokes.filter((stroke) => !action.strokeIds.includes(stroke.id));
      return strokes.length ? [{ ...visual, strokes }] : [];
    });
    return { ...board, visuals, teacherFocus: undefined };
  }
  if (!existsExactlyOnce(action.strokeId)) return null;
  const visuals = (board.visuals ?? []).map((visual) => {
    if (visual.type !== "sketch" || !visual.strokes.some((stroke) => stroke.id === action.strokeId)) return visual;
    return {
      ...visual,
      strokes: visual.strokes.map((stroke) => stroke.id === action.strokeId ? action.replacement : stroke),
    };
  });
  return { ...board, visuals, teacherFocus: { strokeId: action.strokeId, label: "Corrección", revision: (board.teacherFocus?.revision ?? 0) + 1 } };
}
