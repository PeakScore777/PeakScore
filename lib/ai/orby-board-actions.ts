import { sanitizeOrbyBoard, type OrbyBoard, type OrbyBoardBlock, type OrbyBoardVisual, type OrbySketchStroke } from "@/lib/ai/orby-board";

type OptionalActionMeta = { actionId?: string; sequence?: number; turnGeneration: number; dependsOn?: string[] };
type RequiredActionMeta = { actionId: string; sequence: number; turnGeneration: number; dependsOn?: string[] };

export type OrbyBoardAction =
  | (OptionalActionMeta & { operation: "focus"; strokeId: string; elementId?: never; pointIndex?: number; targetId?: never; label?: string })
  | (OptionalActionMeta & { operation: "focus"; elementId: string; strokeId?: never; pointIndex?: never; targetId?: string; label?: string })
  | (OptionalActionMeta & { operation: "clear-focus"; targetId?: never })
  | (OptionalActionMeta & { operation: "erase"; strokeIds: string[] })
  | (OptionalActionMeta & { operation: "replace"; strokeId: string; replacement: OrbySketchStroke })
  | (RequiredActionMeta & { operation: "append-block"; elementId: string; block: OrbyBoardBlock; page?: number; position: { x: number; y: number; width: number; height: number } })
  | (RequiredActionMeta & { operation: "append-strokes"; elementId: string; strokes: OrbySketchStroke[] });

export type OrbyBoardActionSequenceState = {
  generation: number;
  lastSequence: number;
  actionIds: string[];
};

export function createOrbyBoardActionSequenceState(generation = -1): OrbyBoardActionSequenceState {
  return { generation, lastSequence: 0, actionIds: [] };
}

export function evaluateOrbyBoardActionSequence(
  state: OrbyBoardActionSequenceState,
  action: OrbyBoardAction,
  generation: number,
): { accepted: boolean; reason?: "duplicate" | "out_of_order" | "dependency_not_applied" | "wrong_generation" | "missing_action_identity"; nextState: OrbyBoardActionSequenceState } {
  const current = state.generation === generation ? state : createOrbyBoardActionSequenceState(generation);
  // Every Live operation is bound to the active generation and an idempotency key.
  // This prevents duplicate focus/erase/replace calls from replaying after a delayed event.
  if (action.turnGeneration !== generation) {
    return { accepted: false, reason: "wrong_generation", nextState: current };
  }
  if (!action.actionId || action.sequence === undefined) {
    return { accepted: false, reason: "missing_action_identity", nextState: current };
  }
  if (current.actionIds.includes(action.actionId)) {
    return { accepted: false, reason: "duplicate", nextState: current };
  }
  if (action.sequence <= current.lastSequence) {
    return { accepted: false, reason: "out_of_order", nextState: current };
  }
  if (action.dependsOn?.some((dependency) => !current.actionIds.includes(dependency))) {
    return { accepted: false, reason: "dependency_not_applied", nextState: current };
  }
  return {
    accepted: true,
    nextState: {
      generation,
      lastSequence: action.sequence,
      actionIds: [...current.actionIds, action.actionId].slice(-32),
    },
  };
}

function getFocusableVisualTargetIds(visual: OrbyBoardVisual): string[] {
  switch (visual.type) {
    case "diagram":
      return visual.nodes.map((node) => node.id);
    case "molecule":
      return visual.atoms.map((atom) => atom.id);
    case "cell":
      // Outer membrane and cell-wall are not individually positioned glyphs
      // in the current renderer, so do not claim exact targeting for them yet.
      return visual.organelles
        .filter((item) => item.kind !== "membrane" && item.kind !== "cell-wall")
        .map((item) => item.id);
    case "circuit":
      return visual.components.map((component) => component.id);
    case "organ-system":
      return visual.structures.map((structure) => structure.id);
    default:
      return [];
  }
}

const safeId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,24}$/.test(value);

function cleanText(value: unknown, max = 240): string {
  return typeof value === "string"
    ? value.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}
function sanitizeActionMeta(raw: Record<string, unknown>, required = false): OptionalActionMeta | null {
  const hasId = raw.actionId !== undefined;
  const hasSequence = raw.sequence !== undefined;
  const hasGeneration = raw.turnGeneration !== undefined;
  if (!hasGeneration || typeof raw.turnGeneration !== "number"
    || !Number.isInteger(raw.turnGeneration) || raw.turnGeneration < 0 || raw.turnGeneration > 1_000_000) return null;
  if (hasId !== hasSequence) return null;
  if (!hasId) {
    if (required || raw.dependsOn !== undefined) return null;
    return { turnGeneration: raw.turnGeneration };
  }
  if (!safeId(raw.actionId) || typeof raw.sequence !== "number"
    || !Number.isInteger(raw.sequence) || raw.sequence < 1 || raw.sequence > 1_000) return null;
  if (raw.dependsOn !== undefined && (!Array.isArray(raw.dependsOn)
    || raw.dependsOn.length > 5 || !raw.dependsOn.every(safeId)
    || new Set(raw.dependsOn).size !== raw.dependsOn.length
    || (hasId && raw.dependsOn.includes(raw.actionId)))) return null;
  return {
    actionId: raw.actionId,
    sequence: raw.sequence,
    turnGeneration: raw.turnGeneration as number,
    ...(Array.isArray(raw.dependsOn) && raw.dependsOn.length ? { dependsOn: raw.dependsOn as string[] } : {}),
  };
}

function sanitizeBoardBlock(value: unknown): OrbyBoardBlock | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.type === "heading" || raw.type === "text" || raw.type === "formula" || raw.type === "callout") {
    const text = cleanText(raw.text);
    return text ? { type: raw.type, text } : null;
  }
  if (raw.type === "step") {
    const label = cleanText(raw.label, 48);
    const text = cleanText(raw.text);
    return label && text ? { type: "step", label, text } : null;
  }
  return null;
}

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
  if ((raw.label !== undefined && typeof raw.label !== "string")
    || (raw.labelX !== undefined && typeof raw.labelX !== "number")
    || (raw.labelY !== undefined && typeof raw.labelY !== "number")) return null;
const label = raw.label === undefined ? "" : cleanText(raw.label, 48);
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
  const meta = sanitizeActionMeta(raw, raw.operation === "append-block" || raw.operation === "append-strokes");
  if (!meta) return null;

  if (raw.operation === "append-block") {
    if (!meta.actionId || meta.sequence === undefined || meta.turnGeneration === undefined || !safeId(raw.elementId)) return null;
    const block = sanitizeBoardBlock(raw.block);
    const position = raw.position && typeof raw.position === "object" && !Array.isArray(raw.position)
      ? raw.position as Record<string, unknown>
      : null;
    if (!block || !position
      || typeof position.x !== "number" || !Number.isFinite(position.x) || position.x < 0 || position.x > 100
      || typeof position.y !== "number" || !Number.isFinite(position.y) || position.y < 0 || position.y > 100
      || typeof position.width !== "number" || !Number.isFinite(position.width) || position.width < 8 || position.width > 100
      || typeof position.height !== "number" || !Number.isFinite(position.height) || position.height < 8 || position.height > 100
      || position.x + position.width > 100 || position.y + position.height > 100
      || (raw.page !== undefined && (typeof raw.page !== "number" || !Number.isInteger(raw.page) || raw.page < 0 || raw.page > 3))) return null;
    return {
      ...meta, actionId: meta.actionId, sequence: meta.sequence, turnGeneration: meta.turnGeneration,
      operation: "append-block", elementId: raw.elementId, block,
      ...(raw.page === undefined ? {} : { page: raw.page as number }),
      position: { x: position.x, y: position.y, width: position.width, height: position.height },
    };
  }
  if (raw.operation === "append-strokes") {
    if (!meta.actionId || meta.sequence === undefined || meta.turnGeneration === undefined || !safeId(raw.elementId)
      || !Array.isArray(raw.strokes) || raw.strokes.length < 1 || raw.strokes.length > 5) return null;
    const strokes: OrbySketchStroke[] = [];
    const ids = new Set<string>();
    for (const entry of raw.strokes) {
      const id = entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>).id
        : undefined;
      if (!safeId(id) || ids.has(id)) return null;
      const stroke = sanitizeStroke(entry, id);
      if (!stroke) return null;
      ids.add(id);
      strokes.push(stroke);
    }
    return {
      ...meta, actionId: meta.actionId, sequence: meta.sequence, turnGeneration: meta.turnGeneration,
      operation: "append-strokes", elementId: raw.elementId, strokes,
    };
  }

  if (raw.operation === "focus") {
    const hasStrokeId = raw.strokeId !== undefined;
    const hasElementId = raw.elementId !== undefined;
    const hasPointIndex = raw.pointIndex !== undefined;
    const hasTargetId = raw.targetId !== undefined;
    if (hasStrokeId === hasElementId) return null;
    if ((hasStrokeId && !safeId(raw.strokeId)) || (hasElementId && !safeId(raw.elementId))) return null;
    // pointIndex selects a real point on freehand ink. targetId selects a
    // stable, renderer-backed child inside a spatial visual. Neither accepts
    // free-form coordinates or can be mixed with the other target family.
    if (hasPointIndex && (!hasStrokeId || hasElementId || hasTargetId
      || typeof raw.pointIndex !== "number" || !Number.isInteger(raw.pointIndex)
      || raw.pointIndex < 0 || raw.pointIndex > 39)) return null;
    if (hasTargetId && (!hasElementId || hasStrokeId || hasPointIndex || !safeId(raw.targetId))) return null;
    if (raw.label !== undefined && typeof raw.label !== "string") return null;
const label = raw.label === undefined ? "" : cleanText(raw.label, 48);
    return hasStrokeId
      ? {
          ...meta,
          operation: "focus",
          strokeId: raw.strokeId as string,
          ...(hasPointIndex ? { pointIndex: raw.pointIndex as number } : {}),
          ...(label ? { label } : {}),
        }
      : {
          ...meta,
          operation: "focus",
          elementId: raw.elementId as string,
          ...(hasTargetId ? { targetId: raw.targetId as string } : {}),
          ...(label ? { label } : {}),
        };
  }
  if (raw.operation === "clear-focus") {
    const forbidden = ["strokeId", "elementId", "pointIndex", "targetId", "label", "strokeIds", "replacement", "block", "position", "strokes"];
    if (forbidden.some((key) => raw[key] !== undefined)) return null;
    return { ...meta, operation: "clear-focus" };
  }

  if (raw.operation === "erase") {
    if (!Array.isArray(raw.strokeIds) || raw.strokeIds.length < 1 || raw.strokeIds.length > 8
      || !raw.strokeIds.every(safeId) || new Set(raw.strokeIds).size !== raw.strokeIds.length) return null;
    return { ...meta, operation: "erase", strokeIds: raw.strokeIds };
  }
  if (raw.operation === "replace") {
    if (!safeId(raw.strokeId)) return null;
    const replacement = sanitizeStroke(raw.replacement, raw.strokeId);
    return replacement ? { ...meta, operation: "replace", strokeId: raw.strokeId, replacement } : null;
  }
  return null;
}

function rectanglesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
): boolean {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}
function validateUpdatedBoard(candidate: OrbyBoard): OrbyBoard | null {
  const validated = sanitizeOrbyBoard(candidate);
  if (!validated) return null;
  return candidate.teacherFocus ? { ...validated, teacherFocus: candidate.teacherFocus } : validated;
}

export function applyOrbyBoardAction(board: OrbyBoard, action: OrbyBoardAction): OrbyBoard | null {
  if (action.operation === "append-block") {
    if ((board.version !== 2 && board.version !== 3) || !board.layout
      || board.layout.elements.some((element) => element.id === action.elementId)) return null;

    const paged = board.version === 3;
    const maxBlocks = paged ? 24 : 8;
    const maxElements = paged ? 32 : 12;
    if (board.blocks.length >= maxBlocks || board.layout.elements.length >= maxElements) return null;

    const currentPageCount = paged ? board.layout.pageCount ?? 0 : 1;
    const targetPage = paged ? action.page : undefined;
    if (paged && (targetPage === undefined || targetPage < 0 || targetPage > currentPageCount
      || targetPage > 3 || (targetPage === currentPageCount && currentPageCount >= 4))) return null;
    if (!paged && action.page !== undefined) return null;

    const pageElements = board.layout.elements.filter((element) => (element.page ?? 0) === (targetPage ?? 0));
    if (pageElements.length >= 12
      || pageElements.some((element) => rectanglesOverlap(action.position, element))) return null;

    const nextLayoutSequence = Math.max(
      action.sequence,
      ...board.layout.elements.map((element) => element.sequence + 1),
    );
    const opensNewPage = paged && targetPage === currentPageCount;
    const candidate: OrbyBoard = {
      ...board,
      teacherFocus: undefined,
      blocks: [...board.blocks, action.block],
      layout: {
        ...board.layout,
        ...(paged ? { pageCount: opensNewPage ? currentPageCount + 1 : currentPageCount } : {}),
        elements: [...board.layout.elements, {
          id: action.elementId,
          sequence: nextLayoutSequence,
          kind: "block",
          index: board.blocks.length,
          ...(paged ? { page: targetPage } : {}),
          ...action.position,
        }],
      },
    };
    return validateUpdatedBoard(candidate);
  }

  if (action.operation === "append-strokes") {
    if (!board.layout || !board.visuals || (board.version !== 2 && board.version !== 3)) return null;
    const target = board.layout.elements.find((element) =>
      element.id === action.elementId && element.kind === "visual");
    if (!target) return null;
    const visual = board.visuals[target.index];
    if (!visual || visual.type !== "sketch" || visual.strokes.length + action.strokes.length > 40) return null;
    const existingIds = new Set(visual.strokes.map((stroke) => stroke.id));
    if (action.strokes.some((stroke) => existingIds.has(stroke.id))) return null;
    const candidate: OrbyBoard = {
      ...board,
      teacherFocus: undefined,
      visuals: board.visuals.map((item, index) => index === target.index && item.type === "sketch"
        ? { ...item, strokes: [...item.strokes, ...action.strokes] }
        : item),
    };
    return validateUpdatedBoard(candidate);
  }

  const boardVisuals = board.visuals ?? [];
  const sketches = boardVisuals.filter((visual) => visual.type === "sketch");
  if (sketches.length > 1) return null;
  const strokeIdCounts = new Map<string, number>();
  for (const visual of sketches) {
    for (const stroke of visual.strokes) strokeIdCounts.set(stroke.id, (strokeIdCounts.get(stroke.id) ?? 0) + 1);
  }
  const existsExactlyOnce = (id: string) => strokeIdCounts.get(id) === 1;
  if (action.operation === "focus") {
    const revision = (board.teacherFocus?.revision ?? 0) + 1;
    if (typeof action.elementId === "string") {
      const targetElement = board.layout?.elements.find((element) => element.id === action.elementId);
      if (!targetElement) return null;
      if (action.targetId !== undefined) {
        if (targetElement.kind !== "visual") return null;
        const visual = board.visuals?.[targetElement.index];
        if (!visual) return null;
        const matchingTargets = getFocusableVisualTargetIds(visual).filter((id) => id === action.targetId);
        if (matchingTargets.length !== 1) return null;
      }
      return {
        ...board,
        teacherFocus: {
          elementId: action.elementId,
          ...(action.targetId ? { targetId: action.targetId } : {}),
          revision,
          ...(action.label ? { label: action.label } : {}),
        },
      };
    }
    if (!existsExactlyOnce(action.strokeId)) return null;
    const targetStroke = sketches.flatMap((visual) => visual.strokes)
      .find((stroke) => stroke.id === action.strokeId);
    if (!targetStroke || (action.pointIndex !== undefined && action.pointIndex >= targetStroke.points.length)) return null;
    return {
      ...board,
      teacherFocus: {
        strokeId: action.strokeId,
        ...(action.pointIndex !== undefined ? { pointIndex: action.pointIndex } : {}),
        revision,
        ...(action.label ? { label: action.label } : {}),
      },
    };
  }
  if (action.operation === "clear-focus") {
    // Clearing teacher attention is presentation-only; keep every board block,
    // sketch stroke, layout ID and sequence exactly as they were.
    return { ...board, teacherFocus: undefined };
  }

  if (action.operation === "erase") {
    if (!action.strokeIds.every(existsExactlyOnce)) return null;
    const originalVisuals = board.visuals ?? [];
    let removedVisualIndex = -1;
    const visuals: OrbyBoardVisual[] = [];
    originalVisuals.forEach((visual, visualIndex) => {
      if (visual.type !== "sketch") {
        visuals.push(visual);
        return;
      }
      const strokes = visual.strokes.filter((stroke) => !action.strokeIds.includes(stroke.id));
      if (strokes.length) {
        visuals.push({ ...visual, strokes });
        return;
      }
      removedVisualIndex = visualIndex;
    });

    // If the last freehand stroke is erased, remove its now-empty visual stage
    // and shift only later visual indexes. Keep all surviving element IDs and
    // their monotonic sequence numbers unchanged.
    const layout = board.layout && removedVisualIndex >= 0
      ? {
          ...board.layout,
          elements: board.layout.elements
            .filter((element) => !(element.kind === "visual" && element.index === removedVisualIndex))
            .map((element) => element.kind === "visual" && element.index > removedVisualIndex
              ? { ...element, index: element.index - 1 }
              : element),
        }
      : board.layout;

    return {
      ...board,
      visuals,
      ...(layout ? { layout } : {}),
      teacherFocus: undefined,
    };
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
