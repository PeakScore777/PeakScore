"use client";

import React from "react";
import Image from "next/image";
import OrbyBoardTitle from "@/components/aprender/OrbyBoardTitle";

import { useEffect, useId, useRef, useState } from "react";
import { getOrbyBoardProgressiveDelay, getOrbySketchMotionProfile, getOrbySketchStrokeTiming, type OrbyBoard as OrbyBoardData, type OrbyBoardVisual, type OrbySketchStroke, type OrbySvgColor } from "@/lib/ai/orby-board";

const colors = {
  orange: "#dc2626",
  ink: "#252525",
  grid: "#e2e8f0",
};

function VisualTargetFocus({
  targetId,
  currentId,
  x,
  y,
  label,
  revision,
}: {
  targetId?: string;
  currentId: string;
  x: number;
  y: number;
  label?: string;
  revision?: number;
}) {
  if (!targetId || targetId !== currentId) return null;
  const labelOnLeft = x > 72;
  const labelX = labelOnLeft ? Math.max(7, x - 7) : Math.min(93, x + 7);
  const labelY = Math.max(8, y - 6);
  return (
    <g
      key={`${targetId}:${revision ?? 0}`}
      data-orby-teacher-focus={targetId}
      data-orby-focus-target={targetId}
      pointerEvents="none"
    >
      {label ? <path
        d={`M ${x} ${y} L ${labelOnLeft ? labelX + 1.5 : labelX - 1.5} ${labelY + 1}`}
        fill="none" stroke="#dc2626" strokeWidth="0.55" strokeDasharray="1.4 1"
      /> : null}
      <circle className="orby-board-focus-ring" cx={x} cy={y} r="4.6" fill="none" stroke="#dc2626" strokeWidth="0.9">
        <animate attributeName="r" values="3.8;6.1;3.8" dur="1.25s" repeatCount="2" fill="freeze"/>
        <animate attributeName="opacity" values="0.95;0.55;0" dur="1.25s" repeatCount="2" fill="freeze"/>
      </circle>
      <circle className="orby-board-focus-dot" cx={x} cy={y} r="1.5" fill="#dc2626" stroke="#fff" strokeWidth="0.6"/>
      {label ? <text
        data-orby-teacher-focus-label="true"
        x={labelX} y={labelY}
        textAnchor={labelOnLeft ? "end" : "start"}
        fontSize="3.8" fontWeight="700" fill="#b91c1c"
      >{label}<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.7s" fill="freeze"/></text> : null}
    </g>
  );
}

type VisualFocusTarget = { targetId: string; label?: string; revision: number };

function normalizeBoardTitle(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isDuplicateBoardTitle(block: OrbyBoardData["blocks"][number], title: string): boolean {
  return block.type === "heading" && normalizeBoardTitle(block.text) === normalizeBoardTitle(title);
}

/**
 * Writes the class title one glyph at a time, like a teacher writing on a
 * whiteboard. The keyed component only remounts when the topic changes, so
 * later cumulative board snapshots never restart the title animation.
 */
function wrapDiagramLabel(value: string, maxChars = 15): string[] {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const pieces = word.length > maxChars
      ? word.match(new RegExp(`.{1,${maxChars}}`, "gu")) ?? [word]
      : [word];
    for (const piece of pieces) {
      if (!line) line = piece;
      else if ((line + " " + piece).length <= maxChars) line += " " + piece;
      else {
        lines.push(line);
        line = piece;
      }
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function getDiagramNodeBox(node: Extract<OrbyBoardVisual, { type: "diagram" }>["nodes"][number]) {
  const lines = wrapDiagramLabel(node.label);
  const maxLineLength = Math.max(1, ...lines.map((line) => line.length));
  const width = Math.min(28, Math.max(16, maxLineLength * 1.55 + 5));
  const height = Math.max(10, lines.length * 3.4 + 3.6);
  const x = Math.min(99 - width, Math.max(1, node.x - width / 2));
  const y = Math.min(99 - height, Math.max(1, node.y - height / 2));
  return { x, y, width, height, centerX: x + width / 2, centerY: y + height / 2, lines };
}

function getDiagramEdgePoint(
  from: ReturnType<typeof getDiagramNodeBox>,
  to: ReturnType<typeof getDiagramNodeBox>,
) {
  const dx = to.centerX - from.centerX;
  const dy = to.centerY - from.centerY;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: from.centerX, y: from.centerY };
  const scale = Math.min(
    Math.abs(dx) < 0.001 ? Infinity : from.width / 2 / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Infinity : from.height / 2 / Math.abs(dy),
  );
  return { x: from.centerX + dx * scale, y: from.centerY + dy * scale };
}

function Diagram({ visual, startDelayMs = 0, focus }: { visual: Extract<OrbyBoardVisual, { type: "diagram" }>; startDelayMs?: number; focus?: VisualFocusTarget }) {
  const markerId = "orby-arrow-" + useId().replace(/:/g, "");
  const boxes = new Map(visual.nodes.map((node) => [node.id, getDiagramNodeBox(node)]));
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Diagrama conceptual"} className="h-auto max-h-72 w-full overflow-visible">
      <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={colors.ink}/></marker></defs>
      {visual.edges.map((edge, index) => {
        const from = boxes.get(edge.from);
        const to = boxes.get(edge.to);
        if (!from || !to) return null;
        const start = getDiagramEdgePoint(from, to);
        const end = getDiagramEdgePoint(to, from);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        return <g key={`${edge.from}:${edge.to}:${edge.label || ""}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
          <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} pathLength={1} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={colors.ink} strokeWidth="0.8" markerEnd={`url(#${markerId})`} />
          {edge.label ? <text x={midX} y={midY - 2} fontSize="3.1" textAnchor="middle" fill={colors.ink} paintOrder="stroke" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">{edge.label}</text> : null}
        </g>;
      })}
      {visual.nodes.map((node, index) => {
        const box = boxes.get(node.id);
        if (!box) return null;
        return <g key={`${node.id}:${node.x}:${node.y}:${node.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
          <rect x={box.x} y={box.y} width={box.width} height={box.height} rx="2" fill="#fee2e2" stroke={colors.orange} strokeWidth="0.7"/>
          <text x={box.centerX} y={box.centerY - ((box.lines.length - 1) * 1.7) + 0.9} fontSize="2.7" textAnchor="middle" fill="#7f1d1d">
            {box.lines.map((line, lineIndex) => <tspan key={lineIndex} x={box.centerX} dy={lineIndex === 0 ? 0 : 3.4}>{line}</tspan>)}
          </text>
          <VisualTargetFocus targetId={focus?.targetId} currentId={node.id} x={box.centerX} y={box.centerY} label={focus?.label} revision={focus?.revision}/>
        </g>;
      })}
    </svg>
  );
}

function smoothSketchPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  return path + ` T ${last.x} ${last.y}`;
}

function getSketchStrokeKey(stroke: OrbySketchStroke): string {
  return `${stroke.id}:${stroke.points.map((point) => point.x + "," + point.y).join(";")}:${stroke.tone}:${stroke.width}`;
}

function Sketch({ visual, focus, drawingActive, startDelayMs = 0 }: { visual: Extract<OrbyBoardVisual, { type: "sketch" }>; focus?: { strokeId: string; pointIndex?: number; label?: string; revision: number }; drawingActive: boolean; startDelayMs?: number }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const scheduledStrokeKeysRef = useRef(new Set<string>());
  const strokeEndTimesRef = useRef(new Map<string, number>());
  const [strokeTimings, setStrokeTimings] = useState<Record<string, { beginTime: number; duration: number }>>({});

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // SVG's own clock drives both ink and pen movement. Pausing this clock
    // freezes every SMIL animation together; no wall-clock correction is needed.
    if (drawingActive) svg.unpauseAnimations();
    else svg.pauseAnimations();

    const now = svg.getCurrentTime();
    const currentKeys = new Set(visual.strokes.map(getSketchStrokeKey));
    let changed = false;
    for (const key of scheduledStrokeKeysRef.current) {
      if (!currentKeys.has(key)) {
        scheduledStrokeKeysRef.current.delete(key);
        strokeEndTimesRef.current.delete(key);
        changed = true;
      }
    }

    // One teacher pen at a time. Existing strokes keep their original place
    // in the timeline; new strokes follow only the still-pending work.
    const queuedStrokeEnds = [...strokeEndTimesRef.current.values()];
    // Give React one frame to mount the SMIL nodes before the pen starts.
    // Keep a small, deliberate pen-lift pause after every queued stroke.
    const stageStartTime = now + (scheduledStrokeKeysRef.current.size === 0
      ? Math.max(0, startDelayMs) / 1_000
      : 0);
    let queueCursor = Math.max(now + 0.06, stageStartTime, ...queuedStrokeEnds.map((endAt) => endAt + 0.11));
    const additions: Array<[string, { beginTime: number; duration: number }]> = [];
    for (const stroke of visual.strokes) {
      const key = getSketchStrokeKey(stroke);
      if (scheduledStrokeKeysRef.current.has(key)) continue;
      const durationMs = getOrbySketchStrokeTiming(0, stroke.points).duration;
      const duration = durationMs / 1_000;
      const beginTime = queueCursor;
      const endAt = beginTime + duration;
      scheduledStrokeKeysRef.current.add(key);
      strokeEndTimesRef.current.set(key, endAt);
      additions.push([key, { beginTime, duration }]);
      queueCursor = endAt + 0.11;
    }

    if (changed || additions.length) {
      setStrokeTimings((current) => {
        const next = { ...current };
        for (const key of Object.keys(next)) {
          if (!currentKeys.has(key)) delete next[key];
        }
        for (const [key, timing] of additions) next[key] = timing;
        return next;
      });
    }
  }, [drawingActive, startDelayMs, visual.strokes]);

  const palette = {
    ink: "#252525",
    blue: "#2563eb",
    red: "#dc2626",
    accent: "#dc2626",
    muted: "#64748b",
    success: "#0f766e",
  } as const;
  return (
    <svg ref={svgRef} data-orby-drawing-active={drawingActive ? "true" : "false"} viewBox="0 0 100 100" role="img" aria-label={visual.title || "Dibujo a mano alzada"} className="block h-auto min-h-[440px] w-full overflow-visible sm:min-h-[560px]">
      {visual.strokes.map((stroke) => {
        const color = palette[stroke.tone];
        const path = smoothSketchPath(stroke.points);
        const motion = getOrbySketchMotionProfile(stroke.points);
        const key = getSketchStrokeKey(stroke);
        const timing = strokeTimings[key];
        const duration = timing?.duration ?? getOrbySketchStrokeTiming(0, stroke.points).duration / 1_000;
        const beginTime = timing?.beginTime ?? 0;
        const animationReady = Boolean(timing);
        const lastPoint = stroke.points[stroke.points.length - 1];
        return <g key={key}>
          <path
            d={path}
            pathLength={1}
            className="orby-board-sketch-stroke"
            fill="none"
            stroke={color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "none", strokeDasharray: 1, strokeDashoffset: 1 }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="1"
              to="0"
              begin={animationReady ? `${beginTime}s` : "indefinite"}
              dur={`${duration}s`}
              calcMode="spline"
              keyTimes={motion.keyTimes}
              keySplines={motion.keySplines}
              fill="freeze"
            />
          </path>
          <g opacity={0} className="orby-board-pen-tip" data-orby-teacher-pointer={stroke.id} aria-hidden="true">
            {/* The nib is the animation origin (0,0); the barrel trails behind it.
                This keeps the visible pen tip exactly on the ink path instead of
                floating several canvas units ahead of the stroke. */}
            <path d="M -10 -1.25 L -1.8 -1.25 L 0 0 L -1.8 1.25 L -10 1.25 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.42" strokeLinejoin="round"/>
            <path d="M -7.6 -1.1 L -7.6 1.1 M -8.5 -1.1 L -8.5 1.1" stroke="#78350f" strokeWidth="0.25"/>
            <path d="M -1.8 -1.25 L 0 0 L -1.8 1.25 Z" fill="#f8fafc" stroke="#78350f" strokeWidth="0.25"/>
            <path d="M -10 -0.9 L -11.1 0 L -10 0.9" fill="none" stroke="#78350f" strokeWidth="0.35" strokeLinecap="round"/>
            <animateMotion path={path} dur={`${duration}s`} begin={animationReady ? `${beginTime}s` : "indefinite"} rotate="auto" calcMode="spline" keyPoints={motion.keyPoints} keyTimes={motion.keyTimes} keySplines={motion.keySplines} fill="freeze"/>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.03;0.96;1" dur={`${duration}s`} begin={animationReady ? `${beginTime}s` : "indefinite"} fill="freeze"/>
          </g>
          {stroke.label && stroke.labelX !== undefined && stroke.labelY !== undefined
            ? <text
                x={stroke.labelX}
                y={stroke.labelY}
                opacity={0}
                data-orby-sketch-label="true"
                className="orby-board-handwriting"
                fontSize="4"
                fontWeight="600"
                fill={color}
              >
                {stroke.label}
                <animate attributeName="opacity" from="0" to="1" begin={animationReady ? `${beginTime + duration + 0.02}s` : "indefinite"} dur="0.18s" fill="freeze"/>
              </text>
            : null}
          <circle data-orby-sketch-endpoint="true" cx={lastPoint.x} cy={lastPoint.y} r="0.45" fill={color} opacity={0}>
            <animate attributeName="opacity" from="0" to="1" begin={animationReady ? `${beginTime + duration}s` : "indefinite"} dur="0.12s" fill="freeze"/>
          </circle>
          {focus?.strokeId === stroke.id ? (() => {
            const focusIndex = Number.isInteger(focus.pointIndex)
              ? Math.max(0, Math.min(stroke.points.length - 1, focus.pointIndex as number))
              : Math.floor(stroke.points.length / 2);
            const target = stroke.points[focusIndex];
            const labelOnLeft = target.x > 72;
            const labelX = labelOnLeft ? Math.max(8, target.x - 7) : Math.min(92, target.x + 7);
            const labelY = Math.max(8, target.y - 6);
            return <g key={`${focus.strokeId}:${focus.revision}`} data-orby-teacher-focus={stroke.id} data-orby-focus-point={focusIndex} pointerEvents="none" aria-label={focus.label || "Punto señalado por la profesora"}>
              {focus.label ? <path d={`M ${target.x} ${target.y} L ${labelOnLeft ? labelX + 1.5 : labelX - 1.5} ${labelY + 1}`} fill="none" stroke="#dc2626" strokeWidth="0.55" strokeDasharray="1.4 1"/> : null}
              <circle className="orby-board-focus-ring" cx={target.x} cy={target.y} r="4.2" fill="none" stroke="#dc2626" strokeWidth="0.85">
                <animate attributeName="r" values="3.4;5.8;3.4" dur="1.25s" repeatCount="2" fill="freeze"/>
                <animate attributeName="opacity" values="0.95;0.55;0" dur="1.25s" repeatCount="2" fill="freeze"/>
              </circle>
              <circle className="orby-board-focus-dot" cx={target.x} cy={target.y} r="1.45" fill="#dc2626" stroke="#fff" strokeWidth="0.55"/>
              {focus.label ? <text data-orby-teacher-focus-label="true" x={labelX} y={labelY} textAnchor={labelOnLeft ? "end" : "start"} fontSize="3.8" fontWeight="700" fill="#b91c1c">{focus.label}<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.7s" fill="freeze"/></text> : null}
            </g>;
          })() : null}
        </g>;
      })}
    </svg>
  );
}

function Graph({ visual, startDelayMs = 0 }: { visual: Extract<OrbyBoardVisual, { type: "graph" }>; startDelayMs?: number }) {
  const left = 15, right = 94, top = 10, bottom = 76;
  const px = (x: number) => left + ((x - visual.xMin) / (visual.xMax - visual.xMin)) * (right - left);
  const py = (y: number) => bottom - ((y - visual.yMin) / (visual.yMax - visual.yMin)) * (bottom - top);
  const formatTick = (value: number) => {
    if (Object.is(value, -0)) return "0";
    return Number(value.toPrecision(3)).toString();
  };
  const ticks = Array.from({ length: 5 }, (_, index) => ({
    x: visual.xMin + (visual.xMax - visual.xMin) * index / 4,
    y: visual.yMin + (visual.yMax - visual.yMin) * index / 4,
  }));
  const path = visual.points.map((point, index) => `${index ? "L" : "M"} ${px(point.x)} ${py(point.y)}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Gráfica de datos"} className="h-auto max-h-72 w-full">
      {ticks.map((tick, index) => {
        const x = px(tick.x);
        const y = py(tick.y);
        return <g key={index}>
          <line x1={left} y1={y} x2={right} y2={y} stroke={colors.grid} strokeWidth="0.45"/>
          <line x1={x} y1={top} x2={x} y2={bottom} stroke={colors.grid} strokeWidth="0.45"/>
          <line x1={x} y1={bottom} x2={x} y2={bottom + 1.6} stroke={colors.ink} strokeWidth="0.55"/>
          <text x={x} y="82" fontSize="2.65" textAnchor="middle" fill={colors.ink}>{formatTick(tick.x)}</text>
          <line x1={left - 1.6} y1={y} x2={left} y2={y} stroke={colors.ink} strokeWidth="0.55"/>
          <text x={left - 2.5} y={y + 1} fontSize="2.65" textAnchor="end" fill={colors.ink}>{formatTick(tick.y)}</text>
        </g>;
      })}
      <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} x1={left} y1={top} x2={left} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} x1={left} y1={bottom} x2={right} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      {visual.kind === "line" ? <path key={path} className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + 120}ms` }} pathLength={1} d={path} fill="none" stroke={colors.orange} strokeWidth="1.5" strokeLinejoin="round"/> : null}
      {visual.points.map((point, index) => <g key={`${point.x}:${point.y}:${point.label || index}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
        <circle cx={px(point.x)} cy={py(point.y)} r="1.8" fill={colors.orange}/>
        {point.label ? <text x={px(point.x)} y={py(point.y) - 3} fontSize="3" textAnchor="middle" fill={colors.ink}>{point.label}</text> : null}
      </g>)}
      <text x={(left + right) / 2} y="94" fontSize="4" textAnchor="middle" fill={colors.ink}>{visual.xLabel}</text>
      <text x="3" y="43" fontSize="4" textAnchor="middle" fill={colors.ink} transform="rotate(-90 3 43)">{visual.yLabel}</text>
    </svg>
  );
}

function Vectors({ visual, startDelayMs = 0 }: { visual: Extract<OrbyBoardVisual, { type: "vectors" }>; startDelayMs?: number }) {
  const markerId = "orby-vector-arrow-" + useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Diagrama de vectores"} className="h-auto max-h-72 w-full">
      <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={colors.orange}/></marker></defs>
      <line x1="8" y1={visual.origin.y} x2="92" y2={visual.origin.y} stroke={colors.grid} strokeWidth="0.5"/>
      <line x1={visual.origin.x} y1="8" x2={visual.origin.x} y2="92" stroke={colors.grid} strokeWidth="0.5"/>
      <circle cx={visual.origin.x} cy={visual.origin.y} r="1.5" fill={colors.ink}/>
      {visual.vectors.map((vector, index) => {
        const endX = visual.origin.x + vector.dx;
        const endY = visual.origin.y - vector.dy;
        return <g key={`${vector.label}:${visual.origin.x}:${visual.origin.y}:${vector.dx}:${vector.dy}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
          <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} pathLength={1} x1={visual.origin.x} y1={visual.origin.y} x2={endX} y2={endY} stroke={colors.orange} strokeWidth="1.2" markerEnd={`url(#${markerId})`}/>
          <text x={endX + 2} y={endY - 2} fontSize="3.6" fill={colors.ink}>{vector.label}</text>
        </g>;
      })}
    </svg>
  );
}

function Molecule({ visual, startDelayMs = 0, focus }: { visual: Extract<OrbyBoardVisual, { type: "molecule" }>; startDelayMs?: number; focus?: VisualFocusTarget }) {
  const atoms = new Map(visual.atoms.map((atom) => [atom.id, atom]));
  const atomFill = (element: string) => {
    const palette: Record<string, string> = {
      H: "#f8fafc", C: "#e2e8f0", N: "#dbeafe", O: "#fee2e2",
      F: "#dcfce7", Cl: "#dcfce7", Br: "#ffedd5", I: "#ede9fe",
      S: "#fef3c7", P: "#ffedd5",
    };
    return palette[element] || "#ffedd5";
  };
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Modelo molecular esquemático"} className="h-auto max-h-72 w-full">
      {visual.bonds.map((bond, index) => {
        const from = atoms.get(bond.from), to = atoms.get(bond.to);
        if (!from || !to) return null;
        const dx = to.x - from.x, dy = to.y - from.y;
        const length = Math.hypot(dx, dy);
        if (length < 0.01) return null;
        const ux = dx / length, uy = dy / length;
        const perpendicularX = -uy, perpendicularY = ux;
        const atomRadius = Math.min(5.3, length * 0.28);
        const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-1.25, 1.25] : bond.order === 3 ? [-2.5, 0, 2.5] : [];
        const delay = startDelayMs + getOrbyBoardProgressiveDelay(index);
        return <g key={`${bond.from}:${bond.to}:${bond.order}:${from.x}:${from.y}:${to.x}:${to.y}`}>
          {offsets.map((offset) => <line
            className="orby-board-stroke"
            style={{ animationDelay: `${delay}ms` }}
            pathLength={1}
            key={offset}
            x1={from.x + ux * atomRadius + perpendicularX * offset}
            y1={from.y + uy * atomRadius + perpendicularY * offset}
            x2={to.x - ux * atomRadius + perpendicularX * offset}
            y2={to.y - uy * atomRadius + perpendicularY * offset}
            stroke={colors.ink}
            strokeWidth="1.15"
            strokeLinecap="round"
          />)}
        </g>;
      })}
      {visual.atoms.map((atom, index) => <g key={`${atom.id}:${atom.x}:${atom.y}:${atom.element}:${atom.charge || ""}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
        <circle cx={atom.x} cy={atom.y} r="5.3" fill={atomFill(atom.element)} stroke={colors.ink} strokeWidth="0.7"/>
        <text x={atom.x} y={atom.y + 1.45} fontSize="4.1" fontWeight="bold" textAnchor="middle" fill={colors.ink}>{atom.element}</text>
        {atom.charge ? <text x={atom.x + 4.1} y={atom.y - 3.8} fontSize="2.5" fontWeight="bold" textAnchor="middle" fill="#b91c1c">{atom.charge}</text> : null}
        <VisualTargetFocus targetId={focus?.targetId} currentId={atom.id} x={atom.x} y={atom.y} label={focus?.label} revision={focus?.revision}/>
      </g>)}
    </svg>
  );
}

function Circuit({ visual, startDelayMs = 0, focus }: { visual: Extract<OrbyBoardVisual, { type: "circuit" }>; startDelayMs?: number; focus?: VisualFocusTarget }) {
  const components = new Map(visual.components.map((component) => [component.id, component]));
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Circuito eléctrico esquemático"} className="h-auto max-h-72 w-full">
      {visual.connections.map((connection, index) => {
        const from = components.get(connection.from), to = components.get(connection.to);
        if (!from || !to) return null;
        return <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} pathLength={1} key={`${connection.from}:${connection.to}:${from.x}:${from.y}:${to.x}:${to.y}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.ink} strokeWidth="1.1" strokeLinecap="round"/>;
      })}
      {visual.components.map((component, index) => <g key={`${component.id}:${component.kind}:${component.x}:${component.y}:${component.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
        {component.kind === "battery" ? <g>
          <line x1={component.x - 5} y1={component.y - 5} x2={component.x - 5} y2={component.y + 5} stroke={colors.orange} strokeWidth="1.5"/>
          <line x1={component.x + 1} y1={component.y - 8} x2={component.x + 1} y2={component.y + 8} stroke={colors.orange} strokeWidth="2"/>
        </g> : null}
        {component.kind === "resistor" ? <rect x={component.x - 6} y={component.y - 3} width="12" height="6" rx="1" fill="#ffedd5" stroke={colors.orange} strokeWidth="1.1"/> : null}
        {component.kind === "lamp" ? <g>
          <circle cx={component.x} cy={component.y} r="5" fill="#fef3c7" stroke={colors.orange} strokeWidth="1.1"/>
          <path d={`M ${component.x - 3} ${component.y - 3} L ${component.x + 3} ${component.y + 3} M ${component.x + 3} ${component.y - 3} L ${component.x - 3} ${component.y + 3}`} stroke={colors.orange} strokeWidth="0.9"/>
        </g> : null}
        {component.kind === "switch" ? <g>
          <circle cx={component.x - 4} cy={component.y} r="1.2" fill={colors.ink}/>
          <circle cx={component.x + 4} cy={component.y} r="1.2" fill={colors.ink}/>
          <line x1={component.x - 4} y1={component.y} x2={component.x + 3} y2={component.y - 4} stroke={colors.orange} strokeWidth="1.3"/>
        </g> : null}
        <text x={component.x} y={component.y + 12} fontSize="3.4" textAnchor="middle" fill={colors.ink}>{component.label}</text>
        <VisualTargetFocus targetId={focus?.targetId} currentId={component.id} x={component.x} y={component.y} label={focus?.label} revision={focus?.revision}/>
      </g>)}
    </svg>
  );
}

function Cell({ visual, startDelayMs = 0, focus }: { visual: Extract<OrbyBoardVisual, { type: "cell" }>; startDelayMs?: number; focus?: VisualFocusTarget }) {
  const organelleColors: Record<string, string> = {
    nucleus: "#c4b5fd", mitochondrion: "#fca5a5", chloroplast: "#86efac",
    vacuole: "#bfdbfe", membrane: "#fdba74", "cell-wall": "#a3a3a3",
    ribosome: "#fcd34d", "endoplasmic-reticulum": "#ddd6fe", golgi: "#f9a8d4", cytoplasm: "#e0f2fe",
  };
  const cellTypeNames: Record<typeof visual.cellType, string> = {
    animal: "Célula animal",
    plant: "Célula vegetal",
    prokaryotic: "Célula procariota",
  };
  const accessibleLabels = visual.organelles.map((item, index) => `${index + 1}. ${item.label}`).join("; ");

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${cellTypeNames[visual.cellType]}. ${accessibleLabels}`}
        className="mx-auto h-auto max-h-72 w-full"
      >
        {visual.cellType === "plant" ? <rect x="7" y="7" width="86" height="86" rx="17" fill="#f0fdf4" stroke="#64748b" strokeWidth="2.2"/> : null}
        <ellipse cx="50" cy="50" rx={visual.cellType === "prokaryotic" ? 40 : 37} ry={visual.cellType === "prokaryotic" ? 29 : 36}
          fill="#f8fafc" stroke={colors.orange} strokeWidth="1.8"/>

        {visual.organelles.map((item, index) => {
          const fill = organelleColors[item.kind] || "#e2e8f0";
          const itemKey = `${item.id}:${item.x}:${item.y}:${item.label}`;
          const animationStyle = { animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` };
          if (item.kind === "nucleus") return <g key={itemKey} className="orby-board-appear" style={animationStyle}>
            <circle cx={item.x} cy={item.y} r="8" fill={fill} stroke={colors.ink} strokeWidth="0.7"/>
            <circle cx={item.x + 2} cy={item.y - 1} r="2" fill="#7c3aed"/>
          </g>;
          if (item.kind === "mitochondrion") return <g key={itemKey} className="orby-board-appear" style={animationStyle}>
            <ellipse cx={item.x} cy={item.y} rx="7" ry="4" fill={fill} stroke={colors.ink} strokeWidth="0.6"/>
            <path d={`M ${item.x - 5} ${item.y} q 2 -4 4 0 t 4 0`} fill="none" stroke={colors.ink} strokeWidth="0.5"/>
          </g>;
          if (item.kind === "chloroplast") return <g key={itemKey} className="orby-board-appear" style={animationStyle}>
            <ellipse cx={item.x} cy={item.y} rx="7" ry="4" fill={fill} stroke={colors.ink} strokeWidth="0.6"/>
            <path d={`M ${item.x - 4} ${item.y - 1} h8 M ${item.x - 4} ${item.y + 1} h8`} stroke="#166534" strokeWidth="0.7"/>
          </g>;
          if (item.kind === "vacuole") return <rect className="orby-board-appear" style={animationStyle} key={itemKey}
            x={item.x - 7} y={item.y - 5} width="14" height="10" rx="3" fill={fill} stroke={colors.ink} strokeWidth="0.6"/>;
          if (item.kind === "ribosome") return <circle className="orby-board-appear" style={animationStyle} key={itemKey}
            cx={item.x} cy={item.y} r="2" fill={fill} stroke={colors.ink} strokeWidth="0.4"/>;
          if (item.kind === "cell-wall" || item.kind === "membrane") return null;
          return <g key={itemKey} className="orby-board-appear" style={animationStyle}>
            <ellipse cx={item.x} cy={item.y} rx="6" ry="3.5" fill={fill} stroke={colors.ink} strokeWidth="0.5"/>
          </g>;
        })}

        {/* Numbered pins keep the cell drawing clean; the readable labels live below. */}
        {visual.organelles.map((item, index) => (
          <g key={item.id + "-pin"}>
            <circle cx={item.x} cy={item.y} r="3.6" fill="#fff" stroke="#475569" strokeWidth="1.1"/>
            <text x={item.x} y={item.y + 1.3} fontSize="3.7" fontWeight="800" textAnchor="middle" fill="#1e293b">{index + 1}</text>
            <VisualTargetFocus targetId={focus?.targetId} currentId={item.id} x={item.x} y={item.y} label={focus?.label} revision={focus?.revision}/>
          </g>
        ))}
      </svg>

      <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {visual.organelles.map((item, index) => <li key={item.id} className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-extrabold text-slate-700">{index + 1}</span>
          <p className="min-w-0 pt-0.5 text-[11px] font-semibold leading-4 text-slate-800">{item.label}</p>
        </li>)}
      </ol>
    </div>
  );
}

function Dna({ visual, startDelayMs = 0 }: { visual: Extract<OrbyBoardVisual, { type: "dna" }>; startDelayMs?: number }) {
  const step = 76 / Math.max(visual.pairs.length - 1, 1);
  const baseWidth = 8;
  const baseHeight = Math.min(5.8, step * 0.78);
  const baseFontSize = Math.min(3.8, Math.max(2.8, step * 0.5));
  const rows = visual.pairs.map((pair, index) => {
    const angle = (index * Math.PI) / 5 + Math.PI / 4;
    const twist = Math.sin(angle) * 3.5;
    const spread = 16 + twist;
    return {
      pair,
      index,
      y: 12 + index * step,
      leftX: 50 - spread,
      rightX: 50 + spread,
      frontFacing: Math.cos(angle) >= 0,
    };
  });
  const smoothRail = (points: Array<{ x: number; y: number }>) => {
    if (!points.length) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[Math.max(0, index - 1)];
      const current = points[index];
      const next = points[index + 1];
      const after = points[Math.min(points.length - 1, index + 2)];
      const control1X = current.x + (next.x - previous.x) / 6;
      const control1Y = current.y + (next.y - previous.y) / 6;
      const control2X = next.x - (after.x - current.x) / 6;
      const control2Y = next.y - (after.y - current.y) / 6;
      path += ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`;
    }
    return path;
  };
  const leftRail = smoothRail(rows.map((row) => ({ x: row.leftX, y: row.y })));
  const rightRail = smoothRail(rows.map((row) => ({ x: row.rightX, y: row.y })));
  const pairDescription = rows.map(({ pair }) => `${pair.left}–${pair.right}`).join(", ");

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${visual.title || "ADN de doble hélice"}. Pares complementarios: ${pairDescription}. Esquema simplificado.`}
      className="h-auto max-h-72 w-full"
    >
      {/* Dos cadenas curvas y continuas: el estrechamiento periódico representa el giro helicoidal. */}
      <path d={leftRail} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1}/>
      <path d={rightRail} fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1}/>

      {rows.map(({ pair, index, y, leftX, rightX, frontFacing }) => {
        const delay = startDelayMs + getOrbyBoardProgressiveDelay(index);
        return (
          <g key={`${index}:${pair.left}:${pair.right}:${y}`} className="orby-board-appear" style={{ animationDelay: `${delay}ms` }}>
            <line
              className="orby-board-stroke"
              style={{ animationDelay: `${delay}ms`, opacity: frontFacing ? 0.95 : 0.62 }}
              pathLength={1}
              x1={leftX + baseWidth / 2}
              y1={y}
              x2={rightX - baseWidth / 2}
              y2={y}
              stroke={frontFacing ? "#64748b" : "#94a3b8"}
              strokeWidth={frontFacing ? 1.25 : 0.9}
            />
            <rect x={leftX - baseWidth / 2} y={y - baseHeight / 2} width={baseWidth} height={baseHeight} rx={1.4}
              fill="#dbeafe" stroke="#1d4ed8" strokeWidth="0.65"/>
            <rect x={rightX - baseWidth / 2} y={y - baseHeight / 2} width={baseWidth} height={baseHeight} rx={1.4}
              fill="#ffedd5" stroke="#c2410c" strokeWidth="0.65"/>
            <text x={leftX} y={y + baseFontSize * 0.34} fontSize={baseFontSize} fontWeight="700" textAnchor="middle" fill="#1e3a8a">{pair.left}</text>
            <text x={rightX} y={y + baseFontSize * 0.34} fontSize={baseFontSize} fontWeight="700" textAnchor="middle" fill="#9a3412">{pair.right}</text>
          </g>
        );
      })}
      <text x="30" y="7" textAnchor="middle" fontSize="4.2" fontWeight="700" fill="#1d4ed8">5′</text>
      <text x="70" y="7" textAnchor="middle" fontSize="4.2" fontWeight="700" fill="#c2410c">3′</text>
      <text x="30" y="96" textAnchor="middle" fontSize="4.2" fontWeight="700" fill="#1d4ed8">3′</text>
      <text x="70" y="96" textAnchor="middle" fontSize="4.2" fontWeight="700" fill="#c2410c">5′</text>
    </svg>
  );
}

function Punnett({ visual }: { visual: Extract<OrbyBoardVisual, { type: "punnett" }> }) {
  const combine = (first: string, second: string) => [first, second].sort((a, b) => a === a.toUpperCase() ? -1 : b === b.toUpperCase() ? 1 : 0).join("");
  const cells = [
    [combine(visual.topAlleles[0], visual.sideAlleles[0]), combine(visual.topAlleles[1], visual.sideAlleles[0])],
    [combine(visual.topAlleles[0], visual.sideAlleles[1]), combine(visual.topAlleles[1], visual.sideAlleles[1])],
  ];
  return (
    <div className="mx-auto grid max-w-xs grid-cols-3 gap-1 text-center text-sm">
      <div/>
      {visual.topAlleles.map((allele, index) => <div key={index} className="rounded bg-orange-100 p-2 font-bold">{allele}</div>)}
      {visual.sideAlleles.map((allele, row) => <React.Fragment key={row}>
        <div className="rounded bg-orange-100 p-2 font-bold">{allele}</div>
        {cells[row].map((genotype, col) => <div key={col} className="rounded border border-slate-200 bg-white p-3 font-mono font-bold text-slate-900">{genotype}</div>)}
      </React.Fragment>)}
    </div>
  );
}

function CellDivision({ visual }: { visual: Extract<OrbyBoardVisual, { type: "cell-division" }> }) {
  const chromosomeCount = 3;
  const phaseColors = ["#2563eb", "#dc2626", "#0f766e"];
  const finalCellPositions = visual.mode === "mitosis"
    ? [{ x: 32, y: 37, rx: 27, ry: 29 }, { x: 88, y: 37, rx: 27, ry: 29 }]
    : [{ x: 32, y: 19, rx: 24, ry: 14 }, { x: 88, y: 19, rx: 24, ry: 14 }, { x: 32, y: 55, rx: 24, ry: 14 }, { x: 88, y: 55, rx: 24, ry: 14 }];

  const drawCell = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    phase: number,
    meiosisI: boolean,
    compact = false,
  ) => {
    const scale = compact ? 0.58 : 1;
    const chromosomeRows = compact ? [cy] : [cy - 8 * scale, cy, cy + 8 * scale];
    const poleOffset = rx * 0.72;
    return (
      <g key={`${cx}-${cy}-${phase}`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" stroke="#64748b" strokeWidth={compact ? 1 : 1.5}/>
        {phase === 0 ? (
          <>
            <ellipse cx={cx} cy={cy} rx={rx * 0.48} ry={ry * 0.68} fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="2 2"/>
            {chromosomeRows.map((y, index) => {
              const x = cx + (index - 1) * 9 * scale;
              return <g key={index} stroke={phaseColors[index]} strokeWidth={compact ? 1.8 : 2.2} strokeLinecap="round">
                <path d={`M${x - 3 * scale} ${y - 4 * scale} L${x + 3 * scale} ${y + 4 * scale} M${x + 3 * scale} ${y - 4 * scale} L${x - 3 * scale} ${y + 4 * scale}`}/>
                {meiosisI ? <path d={`M${x - 1 * scale} ${y - 4 * scale} L${x + 5 * scale} ${y + 4 * scale} M${x + 5 * scale} ${y - 4 * scale} L${x - 1 * scale} ${y + 4 * scale}`} stroke={phaseColors[(index + 1) % phaseColors.length]}/> : null}
              </g>;
            })}
          </>
        ) : null}
        {phase === 1 ? (
          <>
            <path d={`M${cx - poleOffset} ${cy - ry * 0.55} L${cx - poleOffset} ${cy + ry * 0.55} M${cx + poleOffset} ${cy - ry * 0.55} L${cx + poleOffset} ${cy + ry * 0.55}`} stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/>
            {chromosomeRows.map((y, index) => {
              const x = cx;
              return <g key={index}>
                <path d={`M${cx - poleOffset} ${cy} L${x} ${y} M${cx + poleOffset} ${cy} L${x} ${y}`} stroke="#cbd5e1" strokeWidth="0.8"/>
                <path d={`M${x - 3 * scale} ${y - 4 * scale} L${x + 3 * scale} ${y + 4 * scale} M${x + 3 * scale} ${y - 4 * scale} L${x - 3 * scale} ${y + 4 * scale}`} stroke={phaseColors[index]} strokeWidth="2" strokeLinecap="round"/>
                {meiosisI ? <path d={`M${x + 3 * scale} ${y - 4 * scale} L${x + 9 * scale} ${y + 4 * scale} M${x + 9 * scale} ${y - 4 * scale} L${x + 3 * scale} ${y + 4 * scale}`} stroke={phaseColors[(index + 1) % phaseColors.length]} strokeWidth="2" strokeLinecap="round"/> : null}
              </g>;
            })}
          </>
        ) : null}
        {phase === 2 ? (
          <>
            <path d={`M${cx - poleOffset} ${cy - ry * 0.55} L${cx - poleOffset} ${cy + ry * 0.55} M${cx + poleOffset} ${cy - ry * 0.55} L${cx + poleOffset} ${cy + ry * 0.55}`} stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/>
            {phaseColors.slice(0, chromosomeCount).map((color, index) => {
              const y = cy + (index - 1) * 7 * scale;
              const xLeft = cx - rx * 0.42;
              const xRight = cx + rx * 0.42;
              return meiosisI ? (
                <g key={index} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
                  <path d={`M${xLeft - 3 * scale} ${y - 4 * scale} L${xLeft + 3 * scale} ${y + 4 * scale} M${xLeft + 3 * scale} ${y - 4 * scale} L${xLeft - 3 * scale} ${y + 4 * scale}`}/>
                  <path d={`M${xRight - 3 * scale} ${y - 4 * scale} L${xRight + 3 * scale} ${y + 4 * scale} M${xRight + 3 * scale} ${y - 4 * scale} L${xRight - 3 * scale} ${y + 4 * scale}`} stroke={phaseColors[(index + 1) % phaseColors.length]}/>
                </g>
              ) : (
                <g key={index} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
                  <path d={`M${xLeft - 3 * scale} ${y - 4 * scale} L${xLeft + 2 * scale} ${y + 2 * scale} L${xLeft + 5 * scale} ${y - 2 * scale}`}/>
                  <path d={`M${xRight - 5 * scale} ${y - 2 * scale} L${xRight - 2 * scale} ${y + 2 * scale} L${xRight + 3 * scale} ${y - 4 * scale}`} stroke={phaseColors[(index + 1) % phaseColors.length]}/>
                </g>
              );
            })}
          </>
        ) : null}
        {phase === 3 ? (
          <>
            <ellipse cx={cx} cy={cy} rx={rx * 0.4} ry={ry * 0.58} fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8"/>
            {chromosomeRows.slice(0, compact ? 1 : 2).map((y, index) => (
              <path key={index} d={`M${cx - 3 * scale} ${y - 2 * scale} L${cx + 3 * scale} ${y + 2 * scale}`} stroke={phaseColors[index]} strokeWidth="1.6" strokeLinecap="round"/>
            ))}
          </>
        ) : null}
      </g>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {visual.phases.map((phase, index) => {
        const phaseIndex = visual.mode === "mitosis" ? index : index % 4;
        const meiosisI = visual.mode === "meiosis" && index < 4;
        const isFirstDivisionFinal = visual.mode === "meiosis" && index === 3;
        const isFinalDivision = phaseIndex === 3 && (visual.mode === "mitosis" || index === visual.phases.length - 1);
        const cells = isFinalDivision
          ? finalCellPositions
          : visual.mode === "meiosis" && (!meiosisI || isFirstDivisionFinal)
            ? [{ x: 32, y: 37, rx: 27, ry: 29 }, { x: 88, y: 37, rx: 27, ry: 29 }]
            : [{ x: 60, y: 37, rx: 48, ry: 29 }];
        const compact = visual.mode === "meiosis" && index >= 4;
        return (
          <div key={phase.name} className="min-w-0 rounded-lg border border-slate-200 bg-white p-2">
            <svg viewBox="0 0 120 74" role="img" aria-label={`${phase.name}: ${phase.detail}`} className="mb-2 h-auto w-full rounded bg-slate-50">
              {cells.map((cell) => drawCell(cell.x, cell.y, cell.rx, cell.ry, phaseIndex, meiosisI, compact && !isFinalDivision))}
            </svg>
            <p className="text-[11px] font-bold text-slate-900">{phase.name}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-600">{phase.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

function OrganSystem({ visual, focus }: { visual: Extract<OrbyBoardVisual, { type: "organ-system" }>; focus?: VisualFocusTarget }) {
  const palettes: Record<string, { fill: string; stroke: string }> = {
    nervous: { fill: "#fef3c7", stroke: "#b45309" },
    circulatory: { fill: "#fee2e2", stroke: "#b91c1c" },
    respiratory: { fill: "#dbeafe", stroke: "#1d4ed8" },
    digestive: { fill: "#ffedd5", stroke: "#c2410c" },
    endocrine: { fill: "#f3e8ff", stroke: "#7e22ce" },
    urinary: { fill: "#dcfce7", stroke: "#15803d" },
    skeletal: { fill: "#f1f5f9", stroke: "#475569" },
    muscular: { fill: "#fce7f3", stroke: "#be185d" },
  };
  const palette = palettes[visual.system];
  const systemArtwork = (() => {
    switch (visual.system) {
      case "nervous":
        return (
          <g fill="none" stroke="#b45309" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 8 C41 4 33 11 36 19 C30 25 39 31 46 27 C50 31 56 29 58 25 C68 24 67 13 60 10 C57 6 53 6 50 8Z" fill="#fef3c7" strokeWidth="1.8"/>
            <path d="M50 11 C45 9 43 14 47 16 C42 20 47 25 50 23 M52 10 C58 10 59 15 55 17 C60 21 55 25 52 24" strokeWidth="1"/>
            <path d="M50 29 C48 40 52 53 50 66 C49 75 47 83 43 92 M50 66 C52 77 55 85 59 92" strokeWidth="2.4"/>
            <path d="M49 37 C40 39 34 47 27 54 M51 37 C60 39 66 47 73 54 M50 52 C41 56 36 64 31 71 M50 52 C59 56 64 64 69 71 M49 68 C43 74 40 81 38 88 M51 68 C57 74 60 81 62 88" strokeWidth="1.4"/>
          </g>
        );
      case "circulatory":
        return (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 10 L50 33 M50 33 C45 36 43 42 43 50 M50 33 C55 36 57 42 57 50" stroke="#2563eb" strokeWidth="2.8"/>
            <path d="M50 33 C46 25 38 24 35 31 C31 41 43 50 50 56 C57 50 69 41 65 31 C62 24 54 25 50 33Z" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2"/>
            <path d="M50 13 C41 20 40 25 41 31 M50 13 C59 20 60 25 59 31 M50 54 L50 79 M50 65 C40 65 34 72 29 81 M50 65 C60 65 66 72 71 81" stroke="#b91c1c" strokeWidth="2.1"/>
            <path d="M45 18 C35 18 29 26 27 34 M55 18 C65 18 71 26 73 34 M50 77 L45 91 M50 77 L55 91" stroke="#2563eb" strokeWidth="1.8"/>
          </g>
        );
      case "respiratory":
        return (
          <g fill="none" stroke="#1d4ed8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 9 L50 35 M50 28 L40 39 M50 28 L60 39" strokeWidth="3"/>
            <path d="M43 30 C34 29 27 37 24 49 C20 64 24 78 36 79 C43 78 46 69 47 57 L47 39Z" fill="#dbeafe" strokeWidth="2"/>
            <path d="M57 30 C66 29 73 37 76 49 C80 64 76 78 64 79 C57 78 54 69 53 57 L53 39Z" fill="#dbeafe" strokeWidth="2"/>
            <path d="M40 40 L33 51 L35 65 M60 40 L67 51 L65 65 M50 35 L50 70" strokeWidth="1.5"/>
            <path d="M29 84 Q50 90 71 84" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2"/>
          </g>
        );
      case "digestive":
        return (
          <g fill="none" stroke="#c2410c" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 8 L50 34" strokeWidth="3"/>
            <path d="M50 30 C46 34 44 39 46 44" strokeWidth="2.4"/>
            <path d="M46 42 C34 35 28 45 32 55 C35 63 46 65 54 58 C63 51 64 39 57 37 C53 36 50 39 50 44" fill="#ffedd5" strokeWidth="2"/>
            <path d="M34 45 C28 39 23 42 22 49 C20 58 27 64 35 63" fill="#fdba74" strokeWidth="1.4"/>
            <path d="M37 66 C28 66 29 78 38 79 C45 80 46 72 51 73 C56 74 54 82 63 81 C73 80 72 68 63 67 C57 66 56 72 50 71 C44 70 44 65 37 66Z" fill="#fed7aa" strokeWidth="1.8"/>
            <path d="M38 68 C43 73 39 77 46 78 C54 79 50 68 58 69 M38 74 C44 81 53 75 61 78" strokeWidth="1.1"/>
          </g>
        );
      case "endocrine":
        return (
          <g fill="none" stroke="#7e22ce" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 7 C42 7 38 13 41 19 C43 25 57 25 59 19 C62 13 58 7 50 7Z" fill="#f3e8ff" strokeWidth="1.6"/>
            <path d="M50 25 L50 89" stroke="#c4b5fd" strokeWidth="1.2" strokeDasharray="3 3"/>
            <path d="M45 32 C40 28 36 32 38 36 C40 39 45 39 47 35 M53 32 C60 28 64 32 62 36 C60 39 55 39 53 35" fill="#e9d5ff" strokeWidth="1.4"/>
            <path d="M43 47 C46 43 54 43 57 47 C54 52 46 52 43 47Z" fill="#e9d5ff" strokeWidth="1.4"/>
            <path d="M40 62 C43 56 57 56 60 62 C58 69 42 69 40 62Z" fill="#e9d5ff" strokeWidth="1.4"/>
            <path d="M43 79 C47 75 53 75 57 79" strokeWidth="2"/>
          </g>
        );
      case "urinary":
        return (
          <g fill="none" stroke="#15803d" strokeLinecap="round" strokeLinejoin="round">
            <path d="M37 26 C25 22 21 34 25 47 C28 57 38 57 42 49 C45 40 44 30 37 26Z" fill="#dcfce7" strokeWidth="2"/>
            <path d="M63 26 C75 22 79 34 75 47 C72 57 62 57 58 49 C55 40 56 30 63 26Z" fill="#dcfce7" strokeWidth="2"/>
            <path d="M39 49 C41 60 43 69 48 77 M61 49 C59 60 57 69 52 77" strokeWidth="1.8"/>
            <path d="M42 78 C43 69 57 69 58 78 C60 88 55 91 50 91 C45 91 40 88 42 78Z" fill="#bbf7d0" strokeWidth="2"/>
            <path d="M50 91 L50 96" strokeWidth="1.6"/>
          </g>
        );
      case "skeletal":
        return (
          <g fill="none" stroke="#64748b" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="50" cy="11" r="6.5" fill="#f1f5f9" strokeWidth="1.8"/>
            <path d="M50 18 L50 62 M50 23 C39 20 33 26 31 35 M50 23 C61 20 67 26 69 35 M50 30 C39 28 36 38 40 46 C44 51 56 51 60 46 C64 38 61 28 50 30Z" strokeWidth="1.8"/>
            <path d="M50 29 C38 33 38 41 50 43 C62 41 62 33 50 29 M50 37 C38 41 39 48 50 50 C61 48 62 41 50 37" strokeWidth="1.1"/>
            <path d="M50 60 L40 69 L60 69Z M40 69 L32 91 M60 69 L68 91 M31 34 L18 56 M69 34 L82 56 M18 56 L15 66 M82 56 L85 66" strokeWidth="2.4"/>
            <g fill="#e2e8f0" strokeWidth="1"><circle cx="50" cy="25" r="2"/><circle cx="50" cy="33" r="2"/><circle cx="50" cy="41" r="2"/><circle cx="50" cy="49" r="2"/><circle cx="50" cy="57" r="2"/></g>
          </g>
        );
      case "muscular":
        return (
          <g fill="#fce7f3" stroke="#be185d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M39 21 C31 22 28 31 31 39 C34 46 41 45 44 38 L46 25Z"/>
            <path d="M61 21 C69 22 72 31 69 39 C66 46 59 45 56 38 L54 25Z"/>
            <path d="M39 43 C33 43 31 54 36 65 L42 72 L48 66 L47 48Z"/>
            <path d="M61 43 C67 43 69 54 64 65 L58 72 L52 66 L53 48Z"/>
            <path d="M32 25 C26 29 23 37 23 47 L18 57 L25 60 L34 48Z"/>
            <path d="M68 25 C74 29 77 37 77 47 L82 57 L75 60 L66 48Z"/>
            <path d="M43 70 L37 87 L43 94 L50 89 L49 72Z"/>
            <path d="M57 70 L63 87 L57 94 L50 89 L51 72Z"/>
            <path d="M38 20 C42 14 58 14 62 20" fill="none"/>
          </g>
        );
    }
  })();
  const systemNames: Record<typeof visual.system, string> = {
    nervous: "Sistema nervioso",
    circulatory: "Sistema circulatorio",
    respiratory: "Sistema respiratorio",
    digestive: "Sistema digestivo",
    endocrine: "Sistema endocrino",
    urinary: "Sistema urinario",
    skeletal: "Sistema óseo",
    muscular: "Sistema muscular",
  };
  const accessibleDescription = visual.structures.map((item, index) => `${index + 1}. ${item.name}: ${item.role}`).join("; ");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(180px,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-xl border border-slate-100 bg-white p-2">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`${systemNames[visual.system]}. ${accessibleDescription}. Ubicación esquemática, no a escala.`}
          className="h-auto max-h-80 w-full"
        >
          {systemArtwork}
          {visual.structures.map((item, index) => (
            <g key={item.id}>
              <circle cx={item.x} cy={item.y} r="3.7" fill="#fff" stroke={palette.stroke} strokeWidth="1.3"/>
              <text x={item.x} y={item.y + 1.35} fontSize="3.5" fontWeight="800" textAnchor="middle" fill={palette.stroke}>{index + 1}</text>
              <VisualTargetFocus targetId={focus?.targetId} currentId={item.id} x={item.x} y={item.y} label={focus?.label} revision={focus?.revision}/>
            </g>
          ))}
        </svg>
        <p className="mt-1 text-center text-[9px] font-medium text-slate-500">Vista esquemática · no está a escala</p>
      </div>
      <ol className="grid grid-cols-1 content-start gap-2">
        {visual.structures.map((item, index) => <li key={item.id} className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-extrabold" style={{ color: palette.stroke }}>{index + 1}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-900">{item.name}</p>
            <p className="text-[10px] leading-4 text-slate-600">{item.role}</p>
          </div>
        </li>)}
      </ol>
    </div>
  );
}

function Neuron({ visual }: { visual: Extract<OrbyBoardVisual, { type: "neuron" }> }) {
  const directionArrowId = `orby-neuron-direction-arrow-${useId().replace(/:/g, "")}`;
  const callouts = [
    { name: "dendritas", cx: 66, cy: 32, ax: 112, ay: 79 },
    { name: "soma", cx: 174, cy: 34, ax: 175, ay: 91 },
    { name: "núcleo", cx: 202, cy: 190, ax: 181, ay: 128 },
    { name: "axón", cx: 333, cy: 35, ax: 333, ay: 111 },
    { name: "mielina", cx: 254, cy: 190, ax: 254, ay: 135 },
    { name: "nodos de ranvier", cx: 297, cy: 34, ax: 284, ay: 113 },
    { name: "terminales sinápticas", cx: 488, cy: 38, ax: 478, ay: 103 },
  ].flatMap((item) => {
    const index = visual.parts.findIndex((part) => part.name.trim().toLocaleLowerCase("es") === item.name);
    return index < 0 ? [] : [{ ...item, number: index + 1 }];
  });
  const accessibleParts = visual.parts.map((part) => part.name).join(", ");

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 520 220"
        role="img"
        aria-label={`${visual.title || "Esquema de neurona"}: ${accessibleParts}. Las dendritas reciben señales; el impulso recorre el axón hasta las terminales sinápticas.`}
        className="h-auto max-h-64 w-full"
      >
        <defs>
          <marker id={directionArrowId} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6" fill="none" stroke="#64748b" strokeWidth="1"/>
          </marker>
        </defs>

        {/* Arborización dendrítica: varias ramas reciben señales alrededor del soma. */}
        <g fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M151 112 C132 104 124 91 109 77 M109 77 L89 51 M109 77 L78 73 M109 77 L94 96"/>
          <path d="M133 101 C125 81 123 64 126 48 M126 48 L116 31 M126 48 L143 35"/>
          <path d="M145 119 C126 117 111 111 94 117 M94 117 L72 107 M94 117 L83 137"/>
          <path d="M146 136 C126 143 114 154 102 169 M102 169 L82 178 M102 169 L103 193"/>
          <path d="M155 145 C145 160 143 174 151 189 M151 189 L139 204 M151 189 L169 203"/>
          <path d="M119 91 L103 65 L88 59 M119 91 L101 91 L81 82"/>
        </g>

        {/* Cuerpo celular y núcleo. */}
        <path d="M148 123 C148 100 160 88 180 88 C201 88 215 103 215 124 C215 146 201 160 180 160 C160 160 148 146 148 123Z"
          fill="#ffedd5" stroke="#c2410c" strokeWidth="3"/>
        <ellipse cx="181" cy="124" rx="15" ry="17" fill="#f97316" stroke="#9a3412" strokeWidth="2"/>
        <circle cx="177" cy="119" r="4" fill="#fff7ed" opacity=".9"/>

        {/* Axón: el segmento inicial continúa hacia la arborización terminal. */}
        <path d="M213 124 C275 124 360 124 461 124" fill="none" stroke="#b45309" strokeWidth="5" strokeLinecap="round"/>
        <path d="M214 124 L226 124" stroke="#92400e" strokeWidth="7" strokeLinecap="round"/>

        {/* Vainas de mielina discontinuas; los espacios son nodos de Ranvier. */}
        <g fill="#dbeafe" stroke="#2563eb" strokeWidth="2.2">
          <rect x="232" y="111" width="43" height="26" rx="12"/>
          <rect x="292" y="111" width="43" height="26" rx="12"/>
          <rect x="352" y="111" width="43" height="26" rx="12"/>
          <rect x="412" y="111" width="35" height="26" rx="12"/>
        </g>
        <g fill="#fff" stroke="#2563eb" strokeWidth="1.5">
          <circle cx="284" cy="124" r="4"/>
          <circle cx="344" cy="124" r="4"/>
          <circle cx="404" cy="124" r="4"/>
        </g>

        {/* Terminales sinápticas ramificadas: el extremo del axón se divide. */}
        <g fill="none" stroke="#c2410c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M461 124 C477 119 479 101 489 88 L501 72"/>
          <path d="M479 102 L500 101 L510 91"/>
          <path d="M461 124 C481 126 486 141 499 151 L508 166"/>
          <path d="M483 143 L502 137 L512 143"/>
        </g>
        <g fill="#f97316" stroke="#9a3412" strokeWidth="1.5">
          <circle cx="501" cy="72" r="5"/>
          <circle cx="510" cy="91" r="5"/>
          <circle cx="508" cy="166" r="5"/>
          <circle cx="512" cy="143" r="5"/>
        </g>

        {/* Flecha del sentido general de propagación. */}
        <path d="M225 68 L467 68" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 4" markerEnd={`url(#${directionArrowId})`}/>
        <text x="345" y="59" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">Sentido del impulso nervioso</text>

        {/* Los números enlazan cada estructura con su explicación de abajo. */}
        <g stroke="#64748b" strokeWidth="1.1" fill="none" opacity=".9">
          {callouts.map((item) => <path key={item.name} d={`M${item.cx} ${item.cy + (item.cy < 100 ? 10 : -10)} L${item.ax} ${item.ay}`} strokeDasharray="3 3"/>)}
        </g>
        {callouts.map((item) => (
          <g key={item.name}>
            <circle cx={item.cx} cy={item.cy} r="10" fill="#fff" stroke="#c2410c" strokeWidth="2"/>
            <text x={item.cx} y={item.cy + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#9a3412">{item.number}</text>
          </g>
        ))}
      </svg>

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visual.parts.map((part, index) => <li key={part.id} className="flex gap-2 rounded-md border border-slate-100 bg-slate-50 p-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-white text-[10px] font-extrabold text-orange-800">{index + 1}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-900">{part.name}</p>
            <p className="text-[10px] leading-4 text-slate-600">{part.role}</p>
          </div>
        </li>)}
      </ol>
      <p className="text-[10px] text-slate-500">Esquema conceptual, no está a escala. La vaina de mielina aparece en segmentos y deja espacios llamados nodos de Ranvier.</p>
    </div>
  );
}

function PhysiologyProcess({ visual, startDelayMs = 0 }: { visual: Extract<OrbyBoardVisual, { type: "physiology-process" }>; startDelayMs?: number }) {
  return (
    <ol className="relative space-y-2">
      {visual.stages.map((stage, index) => <li key={stage.name} className="orby-board-appear relative flex gap-3" style={{ animationDelay: `${startDelayMs + index * 110}ms` }}>
        <div className="flex w-8 shrink-0 flex-col items-center">
          <span className="z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-50 text-[11px] font-black text-orange-900">{index + 1}</span>
          {index < visual.stages.length - 1 ? <span aria-hidden="true" className="my-1 min-h-5 w-0.5 flex-1 bg-orange-200"/> : null}
        </div>
        <div className="mb-1 min-w-0 flex-1 rounded-lg border border-slate-100 bg-slate-50 p-2">
          <p className="text-[11px] font-bold text-slate-900">{stage.name}</p>
          <p className="mt-0.5 text-[10px] leading-4 text-slate-600">{stage.detail}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-orange-800">{stage.location}</p>
        </div>
      </li>)}
    </ol>
  );
}

function Visual({ visual, board, drawingActive, startDelayMs = 0, elementId }: { visual: OrbyBoardVisual; board: OrbyBoardData; drawingActive: boolean; startDelayMs?: number; elementId?: string }) {
  // Keep hooks unconditional even when the visual primitive changes between snapshots.
  const annotationMarkerId = `orby-annotation-arrow-${useId().replace(/:/g, "")}`;
  // Capture the optional focus object once so TypeScript can preserve its narrowing.
  const teacherFocus = board.teacherFocus;
  const sketchFocus = teacherFocus && typeof teacherFocus.strokeId === "string"
    ? teacherFocus
    : undefined;
  const visualFocus = teacherFocus && teacherFocus.elementId === elementId && typeof teacherFocus.targetId === "string"
    ? { targetId: teacherFocus.targetId, label: teacherFocus.label, revision: teacherFocus.revision }
    : undefined;
  if (visual.type === "vector-illustration") {
    const palette: Record<OrbySvgColor, string> = {
      ink: "#27313b", blue: "#3976a8", red: "#c85a54", orange: "#d58a42",
      green: "#568b70", yellow: "#c6a65b", teal: "#4f8f8a", purple: "#81739a",
      muted: "#718096", white: "#ffffff",
    };
    const paint = (value: string) => value === "none" ? "none" : palette[value as OrbySvgColor] ?? palette.ink;
    const pathData = (commands: Array<Record<string, unknown>>) => commands.map((command) => {
      if (command.op === "Z") return "Z";
      if (command.op === "C") return `C ${command.x1} ${command.y1} ${command.x2} ${command.y2} ${command.x} ${command.y}`;
      if (command.op === "Q") return `Q ${command.x1} ${command.y1} ${command.x} ${command.y}`;
      return `${command.op} ${command.x} ${command.y}`;
    }).join(" ");
    return <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Ilustración vectorial educativa"} className="h-full max-h-full w-full overflow-visible" preserveAspectRatio="xMidYMid meet">
      {visual.shapes.map((shape, index) => {
        const common = {
          fill: "fill" in shape ? paint(shape.fill) : "none",
          stroke: paint(shape.stroke),
          strokeWidth: shape.strokeWidth,
          opacity: shape.opacity,
          strokeLinecap: "round" as const,
          strokeLinejoin: "round" as const,
          vectorEffect: "non-scaling-stroke" as const,
        };
        // One continuous teacher-pen sequence: each contour begins after the
        // previous one has become readable, instead of all paths racing together.
        const delay = startDelayMs + index * 185;
        const reveal = {
          animationDelay: `${delay}ms`,
          animationDuration: "520ms",
          animationPlayState: drawingActive ? "running" as const : "paused" as const,
        };
        const fillReveal = {
          animationDelay: `${delay + 500}ms`,
          animationPlayState: drawingActive ? "running" as const : "paused" as const,
        };
        const shapeClass = "orby-board-stroke" + ("fill" in shape && shape.fill !== "none" ? " orby-board-vector-fill" : "");
        if (shape.kind === "path") {
          return <path key={shape.id} d={pathData(shape.commands as unknown as Array<Record<string, unknown>>)} {...common} pathLength={1} fillOpacity={0} className={shapeClass} style={reveal} />;
        }
        if (shape.kind === "circle") return <circle key={shape.id} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} pathLength={1} fillOpacity={0} className={shapeClass} style={reveal}/>;
        if (shape.kind === "ellipse") return <ellipse key={shape.id} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} pathLength={1} fillOpacity={0} className={shapeClass} style={reveal}/>;
        if (shape.kind === "line") return <line key={shape.id} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...common} className="orby-board-stroke" pathLength={1} style={reveal}/>;
        return <polygon key={shape.id} points={shape.points.map((point) => `${point.x},${point.y}`).join(" ")} {...common} pathLength={1} fillOpacity={0} className={shapeClass} style={reveal}/>;
      })}
      {visual.labels.map((label, index) => <text key={index} x={label.x} y={label.y} textAnchor={label.anchor} fontSize="3.4" fontWeight="650" fill={palette[label.tone]} opacity={0} className="orby-board-handwriting orby-board-vector-label" style={{ animationDelay: `${startDelayMs + visual.shapes.length * 185 + 80 + index * 90}ms`, animationPlayState: drawingActive ? "running" : "paused" }}>{label.text}</text>)}
    </svg>;
  }
  if (visual.type === "annotation") {
    const palette = visual.tone === "red" ? "#dc2626"
      : visual.tone === "blue" ? "#2563eb"
        : visual.tone === "success" ? "#0f766e"
         : visual.tone === "muted" ? "#64748b" : "#dc2626";
    const first = visual.points[0], last = visual.points[visual.points.length - 1];
    const path = visual.points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
    const minX = Math.min(...visual.points.map((point) => point.x));
    const maxX = Math.max(...visual.points.map((point) => point.x));
    const minY = Math.min(...visual.points.map((point) => point.y));
    const maxY = Math.max(...visual.points.map((point) => point.y));
    const markerId = annotationMarkerId;
    return <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Anotación del profesor"} className="h-auto max-h-72 w-full overflow-visible">
      <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={palette}/></marker></defs>
      {visual.mark === "circle" ? <ellipse className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} cx={(minX + maxX) / 2} cy={(minY + maxY) / 2} rx={Math.max(2, (maxX - minX) / 2)} ry={Math.max(2, (maxY - minY) / 2)} fill="none" stroke={palette} strokeWidth="1.35" strokeLinecap="round" /> : null}
      {visual.mark === "underline" ? <path className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={path} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round"/> : null}
      {visual.mark === "arrow" ? <path className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={path} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round" markerEnd={`url(#${markerId})`}/> : null}
      {visual.mark === "bracket" ? <path className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={`M ${first.x} ${first.y} L ${last.x} ${first.y} L ${last.x} ${last.y}`} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> : null}
      {visual.label ? <text x={Math.min(88, last.x + 2)} y={Math.max(7, last.y - 2)} fontSize="3.8" fontWeight="700" fill={palette} className="orby-board-appear" style={{ animationDelay: `${startDelayMs}ms` }}>{visual.label}</text> : null}
    </svg>;
  }
  if (visual.type === "image") return (
    <figure className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="relative min-h-0 flex-1">
        <Image
          src={visual.src}
          alt={visual.alt}
          fill
          unoptimized
          sizes="(max-width: 768px) 90vw, 42vw"
          className="object-contain"
        />
      </div>
      {visual.caption ? <figcaption className="orby-board-handwriting shrink-0 pt-1 text-center text-[clamp(9px,1.1vw,14px)] leading-tight text-slate-600">{visual.caption}</figcaption> : null}
    </figure>
  );
  if (visual.type === "diagram") return <Diagram visual={visual} startDelayMs={startDelayMs} focus={visualFocus}/>;
  if (visual.type === "sketch") return <Sketch visual={visual} focus={sketchFocus} drawingActive={drawingActive} startDelayMs={startDelayMs}/>;
  if (visual.type === "graph") return <Graph visual={visual} startDelayMs={startDelayMs}/>;
  if (visual.type === "vectors") return <Vectors visual={visual} startDelayMs={startDelayMs}/>;
  if (visual.type === "molecule") return <Molecule visual={visual} startDelayMs={startDelayMs} focus={visualFocus}/>;
  if (visual.type === "circuit") return <Circuit visual={visual} startDelayMs={startDelayMs} focus={visualFocus}/>;
  if (visual.type === "cell") return <Cell visual={visual} startDelayMs={startDelayMs} focus={visualFocus}/>;
  if (visual.type === "dna") return <Dna visual={visual} startDelayMs={startDelayMs}/>;
  if (visual.type === "punnett") return <Punnett visual={visual}/>;
  if (visual.type === "cell-division") return <CellDivision visual={visual}/>;
  if (visual.type === "organ-system") return <OrganSystem visual={visual} focus={visualFocus}/>;
  if (visual.type === "neuron") return <Neuron visual={visual}/>;
  if (visual.type === "physiology-process") return <PhysiologyProcess visual={visual} startDelayMs={startDelayMs}/>;
  if (visual.type === "table") return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead><tr>{visual.headers.map((header, index) => <th key={index} className="border-b border-slate-200 bg-orange-50 px-3 py-2 font-bold text-slate-800">{header}</th>)}</tr></thead>
        <tbody>{visual.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-slate-100 px-3 py-2 text-slate-700">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  return (
    <div className="relative min-h-24 px-2 pb-1 pt-1">
      <div className="absolute left-2 right-2 top-[7px] h-px bg-slate-300"/>
      {visual.events.map((event, index) => {
        const align = event.position < 12 ? "translate-x-0 text-left" : event.position > 88 ? "-translate-x-full text-right" : "-translate-x-1/2 text-center";
        return <div key={`${event.position}:${event.label}:${index}`} className="orby-board-appear absolute top-0 w-24 space-y-2" style={{ left: `${event.position}%`, animationDelay: `${startDelayMs + index * 100}ms` }}>
          <div className="h-3 w-3 rounded-full border-2 border-orange-500 bg-white"/>
          <div className={align}>
            <p className="text-[11px] font-bold leading-4 text-slate-800">{event.label}</p>
            {event.detail ? <p className="mt-1 text-[10px] leading-4 text-slate-600">{event.detail}</p> : null}
          </div>
        </div>;
      })}
    </div>
  );
}

function getHandwritingRevealStyle(text: string): React.CSSProperties {
  // Approximate spoken Spanish pacing: keep the reveal readable instead of
  // finishing every paragraph in the same short burst. Pausing the class
  // freezes this CSS animation through the board's drawingActive state.
  const safeLength = Math.max(0, text.trim().length);
  const durationSeconds = Math.min(10, Math.max(0.9, safeLength * 0.055));
  return { animationDuration: `${durationSeconds.toFixed(2)}s` };
}

function renderBoardBlock(block: OrbyBoardData["blocks"][number], index: number) {
  const stage = index + 1;
  if (block.type === "heading") {
    return <h4 data-board-stage={stage} style={getHandwritingRevealStyle(block.text)} className="orby-board-write-text orby-board-handwriting orby-board-layout-heading text-slate-900">{block.text}</h4>;
  }
  if (block.type === "formula") {
    return <p data-board-stage={stage} style={getHandwritingRevealStyle(block.text)} className="orby-board-write-text orby-board-handwriting orby-board-layout-formula text-blue-700">{block.text}</p>;
  }
  if (block.type === "step") {
    return <p data-board-stage={stage} style={getHandwritingRevealStyle(block.label + block.text)} className="orby-board-write-text orby-board-handwriting orby-board-layout-text text-slate-800"><span className="font-semibold text-slate-900">{block.label}: </span>{block.text}</p>;
  }
  if (block.type === "callout") {
    return <p data-board-stage={stage} style={getHandwritingRevealStyle(block.text)} className="orby-board-write-text orby-board-handwriting orby-board-layout-callout text-red-700">{block.text}</p>;
  }
  return <p data-board-stage={stage} style={getHandwritingRevealStyle(block.text)} className="orby-board-write-text orby-board-handwriting orby-board-layout-text text-slate-800">{block.text}</p>;
}

export default function OrbyBoard({ board, drawingActive = true, showTitle = true }: { board: OrbyBoardData; drawingActive?: boolean; showTitle?: boolean }) {
  const boardRef = useRef<HTMLElement | null>(null);
  const spatialLayout = board.version === 2 || board.version === 3 ? board.layout : undefined;
  const pageCount = spatialLayout?.pageCount ?? 1;
  const [activePage, setActivePage] = useState(0);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const panPointerRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const zoomRef = useRef(1);
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  function updateZoom(nextZoom: number) {
    const boundedZoom = Math.min(2, Math.max(0.6, Math.round(nextZoom * 10) / 10));
    const viewport = canvasViewportRef.current;
    const previousZoom = zoomRef.current;
    if (boundedZoom === previousZoom) return;
    const centerX = viewport ? viewport.scrollLeft + viewport.clientWidth / 2 : 0;
    const centerY = viewport ? viewport.scrollTop + viewport.clientHeight / 2 : 0;
    zoomRef.current = boundedZoom;
    setZoom(boundedZoom);
    if (viewport) {
      const ratio = boundedZoom / previousZoom;
      requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(0, centerX * ratio - viewport.clientWidth / 2);
        viewport.scrollTop = Math.max(0, centerY * ratio - viewport.clientHeight / 2);
      });
    }
  }

  function handleCanvasPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const shouldPan = event.button === 1 || (panMode && event.button === 0);
    if (!shouldPan) return;
    if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select, [data-orby-no-pan]")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panPointerRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setIsPanning(true);
  }

  function handleCanvasPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pointer = panPointerRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft -= event.clientX - pointer.x;
    event.currentTarget.scrollTop -= event.clientY - pointer.y;
    panPointerRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function handleCanvasPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (panPointerRef.current?.pointerId !== event.pointerId) return;
    panPointerRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleCanvasKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const viewport = event.currentTarget;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
    const distance = Math.max(48, Math.round(viewport.clientWidth * 0.12));
    const verticalDistance = Math.max(48, Math.round(viewport.clientHeight * 0.12));
    if (event.key === "ArrowLeft") viewport.scrollBy({ left: -distance, behavior });
    else if (event.key === "ArrowRight") viewport.scrollBy({ left: distance, behavior });
    else if (event.key === "ArrowUp") viewport.scrollBy({ top: -verticalDistance, behavior });
    else if (event.key === "ArrowDown") viewport.scrollBy({ top: verticalDistance, behavior });
    else if (event.key === "PageUp") viewport.scrollBy({ top: -viewport.clientHeight * 0.8, behavior });
    else if (event.key === "PageDown") viewport.scrollBy({ top: viewport.clientHeight * 0.8, behavior });
    else return;
    event.preventDefault();
  }

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;
    // Pause every SVG visual on the teaching sheet, not just freehand sketch.
    // This keeps annotations, charts and diagrams frozen with Orby's voice.
    boardElement.querySelectorAll<SVGSVGElement>("svg").forEach((svg) => {
      if (drawingActive) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
  }, [drawingActive, board]);

  // Follow the teacher spotlight with a camera move, like a real guided board.
  // Internal target IDs are spotlighted inside their parent visual; the camera
  // frames that visual without relying on fragile text/transcript matching.
  useEffect(() => {
    const focus = board.teacherFocus;
    const viewport = canvasViewportRef.current;
    if (!spatialLayout || !viewport) return;

    const latestElement = [...spatialLayout.elements].sort((first, second) => second.sequence - first.sequence)[0];
    const targetElementId = focus?.elementId ?? latestElement?.id;
    if (!focus?.strokeId && !targetElementId) return;

    const selector = focus?.strokeId
      ? `[data-orby-teacher-focus="${focus.strokeId}"]`
      : `[data-orby-layout-element="${targetElementId}"]`;
    const target = boardRef.current?.querySelector<HTMLElement | SVGElement>(selector);
    if (!target) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const nextZoom = focus ? 1.35 : 1.12;
    if (zoomRef.current !== nextZoom) {
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    }

    // setZoom changes the page width. Wait for React to commit that width
    // before measuring the target, otherwise the camera can calculate its
    // scroll offset from the previous zoom and appear to lag behind the teacher.
    let measureFrame = 0;
    let verticalPanTimer: number | null = null;
    const layoutFrame = window.requestAnimationFrame(() => {
      measureFrame = window.requestAnimationFrame(() => {
        if (!viewport.isConnected || !target.isConnected) return;
        const targetRect = target.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const left = Math.max(0, Math.min(
          viewport.scrollLeft + targetRect.left + targetRect.width / 2
            - viewportRect.left - viewport.clientWidth / 2,
          viewport.scrollWidth - viewport.clientWidth,
        ));
        const top = Math.max(0, Math.min(
          viewport.scrollTop + targetRect.top + targetRect.height / 2
            - viewportRect.top - viewport.clientHeight / 2,
          viewport.scrollHeight - viewport.clientHeight,
        ));
        if (reducedMotion) {
          viewport.scrollTo({ left, top, behavior: "auto" });
          return;
        }

        // Studdy-like camera path: first pan across the current teaching row,
        // then travel down to the next vertical position/sheet. Keeping the
        // two movements sequential avoids diagonal jumps that lose the learner.
        const horizontalDistance = Math.abs(left - viewport.scrollLeft);
        const verticalDistance = Math.abs(top - viewport.scrollTop);
        viewport.scrollTo({ left, top: viewport.scrollTop, behavior: "smooth" });
        if (verticalDistance > 20) {
          verticalPanTimer = window.setTimeout(() => {
            if (!viewport.isConnected || !target.isConnected) return;
            viewport.scrollTo({ left, top, behavior: "smooth" });
          }, horizontalDistance > 24 ? 420 : 80);
        }
      });
    });
    return () => {
      window.cancelAnimationFrame(layoutFrame);
      if (measureFrame) window.cancelAnimationFrame(measureFrame);
      if (verticalPanTimer !== null) window.clearTimeout(verticalPanTimer);
    };
  }, [board, board.teacherFocus, spatialLayout]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const boardElement = boardRef.current;
    const viewport = canvasViewportRef.current;
    if (!boardElement || !viewport || typeof IntersectionObserver === "undefined") return;
    const pages = Array.from(boardElement.querySelectorAll<HTMLElement>("[data-orby-board-page-section]"));
    if (!pages.length) return;

    const visibleRatios = new Map<HTMLElement, number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const page = entry.target as HTMLElement;
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          visibleRatios.set(page, entry.intersectionRatio);
        } else {
          visibleRatios.delete(page);
        }
      }
      const visible = [...visibleRatios.entries()].sort((first, second) => {
        const ratioDifference = second[1] - first[1];
        if (ratioDifference !== 0) return ratioDifference;
        return Number(first[0].dataset.orbyBoardPageSection) - Number(second[0].dataset.orbyBoardPageSection);
      })[0]?.[0];
      if (!visible) return;
      const nextPage = Number(visible.dataset.orbyBoardPageSection);
      if (Number.isInteger(nextPage) && nextPage >= 0 && nextPage < pageCount) setActivePage(nextPage);
    }, { root: viewport, threshold: [0.1, 0.25, 0.5, 0.75] });

    pages.forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [board, pageCount]);

  function navigateToBoardPage(pageIndex: number) {
    const page = boardRef.current?.querySelector<HTMLElement>(
      `[data-orby-board-page-section="${pageIndex}"]`,
    );
    if (!page) return;
    setActivePage(pageIndex);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    page.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <style>{`.orby-board-tool-button { display:inline-flex; min-height:34px; min-width:34px; align-items:center; justify-content:center; border:1px solid #e2e8f0; border-radius:8px; background:#fff; padding:0 10px; color:#475569; font-size:11px; font-weight:650; transition:background-color .15s,border-color .15s,color .15s; } .orby-board-tool-button:hover:not(:disabled) { border-color:#fed7aa; background:#fff7ed; color:#9a3412; } .orby-board-tool-button:focus-visible { outline:2px solid #f97316; outline-offset:2px; } .orby-board-tool-button:disabled { cursor:not-allowed; opacity:.4; } .orby-board-tool-button-active { border-color:#f97316; background:#fff7ed; color:#9a3412; } .orby-board-pages-zoom { transition: width 560ms cubic-bezier(.22,.75,.25,1); } @media print {@page { size: A4 landscape; margin: 10mm; } html, body { background: #fff !important; } body * { visibility: hidden !important; } .orby-board, .orby-board * { visibility: visible !important; } .orby-board { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; min-height: 0 !important; overflow: visible !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important; } .orby-board [data-orby-no-print], .orby-board .orby-board-toolbar { display: none !important; } .orby-board > header { position: static !important; background: #fff !important; } .orby-board-canvas-scroll { max-height: none !important; overflow: visible !important; } .orby-board-pages-zoom { width: 100% !important; } .orby-board-pages { display: block !important; }
.orby-board-page { break-after: page; page-break-after: always; }
.orby-board-page:last-child { break-after: auto; page-break-after: auto; }
.orby-board-pages-zoom { transition: width 560ms cubic-bezier(.22,.75,.25,1); }
.orby-board-page-heading { display: none !important; }
.orby-board-canvas { width: 100% !important; min-width: 0 !important; max-width: none !important; aspect-ratio: 16 / 9 !important; break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .orby-board-layout-stage { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-appear, .orby-board .orby-board-sketch-stroke { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-pen-tip, .orby-board [data-orby-teacher-focus] { display: none !important; } .orby-board section { break-inside: avoid; box-shadow: none !important; } .orby-board svg { overflow: visible !important; }} .orby-board svg[data-orby-drawing-active="false"] .orby-board-appear, .orby-board svg[data-orby-drawing-active="false"] .orby-board-sketch-stroke { animation-play-state: paused !important; } .orby-board svg[data-orby-drawing-active="false"] .orby-board-pen-tip { visibility: hidden !important; } @media (prefers-reduced-motion: reduce) { .orby-board .orby-board-layout-stage, .orby-board .orby-board-appear { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-stroke, .orby-board .orby-board-sketch-stroke { animation: none !important; stroke-dasharray: none !important; stroke-dashoffset: 0 !important; } .orby-board .orby-board-pen-tip { display: none !important; } .orby-board [data-orby-sketch-label], .orby-board [data-orby-sketch-endpoint] { opacity: 1 !important; } .orby-board svg animate, .orby-board svg animateMotion, .orby-board [data-orby-teacher-focus] animate { display: none !important; } .orby-board .orby-board-focus-ring, .orby-board .orby-board-focus-dot, .orby-board [data-orby-teacher-focus-label] { opacity: 1 !important; } }`} </style>
      <section ref={boardRef} data-orby-drawing-active={drawingActive ? "true" : "false"} aria-label={"Pizarra: " + board.title} className="orby-board mx-auto min-h-full w-full overflow-hidden bg-white text-slate-900">
        {showTitle && <header className="orby-board-paper-heading flex items-start justify-between gap-3 bg-white px-4 pb-4 pt-7 sm:px-10 sm:pb-5 sm:pt-10">
          <div className="min-w-0">
            <OrbyBoardTitle key={board.title} text={board.title} animate={drawingActive} />
          </div>
          <button type="button" data-orby-no-print onClick={() => window.print()} aria-label="Exportar la clase a PDF" title="Exportar PDF" className="orby-board-export shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800">PDF</button>
        </header>}

        {spatialLayout ? (
          <div data-orby-no-print className="orby-board-toolbar flex flex-wrap items-center justify-between gap-3 px-4 pb-3 sm:px-8">
            <div className="flex items-center gap-1.5" role="group" aria-label="Controles de zoom de la pizarra">
              <button type="button" aria-label="Alejar la pizarra" title="Alejar" onClick={() => updateZoom(zoom - 0.1)} disabled={zoom <= 0.6} className="orby-board-tool-button">−</button>
              <output aria-live="polite" aria-atomic="true" className="min-w-12 text-center text-xs font-semibold tabular-nums text-slate-600">{Math.round(zoom * 100)}%</output>
              <button type="button" aria-label="Acercar la pizarra" title="Acercar" onClick={() => updateZoom(zoom + 0.1)} disabled={zoom >= 2} className="orby-board-tool-button">+</button>
              <button type="button" onClick={() => updateZoom(1)} className="orby-board-tool-button px-3">Ajustar</button>
            </div>
            <button
              type="button"
              aria-pressed={panMode}
              onClick={() => {
                panPointerRef.current = null;
                setIsPanning(false);
                setPanMode((current) => !current);
              }}
              className={panMode ? "orby-board-tool-button orby-board-tool-button-active" : "orby-board-tool-button"}
            >
              {panMode ? "Finalizar movimiento" : "Mover pizarra"}
            </button>
            <p id="orby-board-viewport-help" role="status" className="basis-full text-[10px] text-slate-500">
              {panMode
                ? "Arrastra la pizarra para desplazarte. También puedes usar las flechas del teclado cuando el área esté enfocada."
                : "Acerca o aleja la vista. Activa «Mover pizarra» para arrastrar el contenido sin seleccionar texto."}
            </p>
          </div>
        ) : null}

        {spatialLayout && pageCount > 1 ? (
          <nav aria-label="Navegación de hojas de la clase" data-orby-no-print className="orby-board-page-nav flex flex-wrap items-center justify-between gap-2 px-4 pb-2 sm:px-8">
            <span className="text-[10px] font-semibold tracking-wide text-slate-500">CONTENIDO DE LA CLASE</span>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Ir a una hoja">
              {Array.from({ length: pageCount }, (_, pageIndex) => (
                <button
                  key={`page-nav-${pageIndex}`}
                  type="button"
                  aria-label={`Ir a la hoja ${pageIndex + 1} de ${pageCount}`}
                  aria-current={activePage === pageIndex ? "location" : undefined}
                  onClick={() => navigateToBoardPage(pageIndex)}
                  className="orby-board-page-nav-item"
                >
                  <span aria-hidden="true">{pageIndex + 1}</span>
                  <span>Hoja {pageIndex + 1}</span>
                </button>
              ))}
            </div>
          </nav>
        ) : null}

        {spatialLayout ? (
          <div
            ref={canvasViewportRef}
            className={`orby-board-canvas-scroll mx-auto max-h-[min(72vh,900px)] w-full overflow-auto overscroll-contain px-2 py-3 sm:px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${panMode ? "cursor-grab touch-none select-none" : ""} ${isPanning ? "cursor-grabbing" : ""}`}
            role="region"
            aria-label="Área desplazable de la pizarra"
            aria-describedby="orby-board-viewport-help"
            tabIndex={0}
            onKeyDown={handleCanvasKeyDown}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerEnd}
            onPointerCancel={handleCanvasPointerEnd}
          >
            <div className="orby-board-pages-zoom mx-auto" style={{ width: `${zoom * 100}%` }}>
              <div
                className="orby-board-pages"
                style={pageCount > 1 ? {
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  width: "200%",
                  alignItems: "start",
                } : undefined}
              >
              {Array.from({ length: spatialLayout.pageCount ?? 1 }, (_, pageIndex) => (
                <section
                  key={`page-${pageIndex}`}
                  data-orby-board-page-section={pageIndex}
                  className="orby-board-page"
                  aria-label={spatialLayout.pageCount && spatialLayout.pageCount > 1
                    ? `Hoja ${pageIndex + 1} de ${spatialLayout.pageCount}: ${board.title}`
                    : `Composición didáctica: ${board.title}`}
                >
                  {spatialLayout.pageCount && spatialLayout.pageCount > 1 ? (
                    <div className="orby-board-page-heading" aria-hidden="true">
                      <span>CLASE · HOJA {pageIndex + 1}</span>
                      <span>{pageIndex + 1} / {spatialLayout.pageCount}</span>
                    </div>
                  ) : null}
                  <div
                    className="orby-board-canvas"
                    data-orby-board-page={pageIndex}
                    role="group"
                    aria-label={`Composición didáctica ${pageIndex + 1}: ${board.title}`}
                  >
                    {spatialLayout.elements.filter((element) => (element.page ?? 0) === pageIndex).map((element, pageElementIndex) => {
                      // Stage locally within each sheet: every new note/visual gets its own reveal beat.
                      const stageDelay = pageElementIndex * 135;
                      const style: React.CSSProperties = {
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.width}%`,
                        height: `${element.height}%`,
                        animationDelay: `${stageDelay}ms`,
                        animationPlayState: drawingActive ? "running" : "paused",
                      };
                      const visual = element.kind === "visual" ? board.visuals?.[element.index] : undefined;
                      const block = element.kind === "block" ? board.blocks[element.index] : undefined;
                      if (block && isDuplicateBoardTitle(block, board.title)) return null;
                      const accessibleLabel = block
                        ? block.type === "step" ? `${block.label}: ${block.text}` : block.text
                        : visual?.title || `Apoyo visual ${element.sequence}`;
                      const isFocusedStage = typeof board.teacherFocus?.elementId === "string"
                        && board.teacherFocus.elementId === element.id;
                      return (
                        <div
                          key={element.id}
                          data-orby-layout-element={element.id}
                          data-orby-layout-kind={element.kind}
                          data-orby-layout-sequence={element.sequence}
                          data-orby-layout-page={pageIndex}
                          data-orby-teacher-focus={isFocusedStage ? "element" : undefined}
                          aria-label={accessibleLabel}
                          className={isFocusedStage ? "orby-board-layout-stage orby-board-layout-stage-focused" : "orby-board-layout-stage"}
                          style={style}
                        >
                          {block ? renderBoardBlock(block, element.index)
                            : visual ? <div className="orby-board-layout-visual">
                                {visual.title && visual.type !== "sketch"
                                  ? <h4 className="orby-board-handwriting orby-board-layout-visual-title">{visual.title}</h4>
                                  : null}
                                <Visual visual={visual} board={board} drawingActive={drawingActive} startDelayMs={stageDelay} elementId={element.id}/>
                              </div>
                              : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto min-h-[60vh] w-full max-w-[1200px] space-y-5 px-4 py-5 sm:space-y-7 sm:px-10 sm:py-8">
            {board.blocks.map((block, index) => {
              if (isDuplicateBoardTitle(block, board.title)) return null;
              const blockKey = `${block.type}:${index}`;
              const revealClass = "orby-board-appear";
              const stageStyle = { animationDelay: `${index * 90}ms`, animationPlayState: drawingActive ? "running" as const : "paused" as const };
              if (block.type === "heading") return <h4 key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-write-text orby-board-handwriting text-2xl font-medium leading-tight tracking-tight text-slate-900 sm:text-4xl ${revealClass}`}>{block.text}</h4>;
              if (block.type === "formula") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-write-text orby-board-handwriting overflow-x-auto text-lg font-medium leading-8 text-slate-900 sm:text-2xl ${revealClass}`}>{block.text}</p>;
              if (block.type === "step") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-write-text orby-board-handwriting text-base leading-7 text-slate-800 sm:text-xl ${revealClass}`}><span className="font-semibold text-blue-700">{block.label}: </span>{block.text}</p>;
              if (block.type === "callout") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-write-text orby-board-handwriting text-base leading-7 text-slate-900 sm:text-xl ${revealClass}`}>{block.text}</p>;
              return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-base leading-7 text-slate-800 sm:text-xl ${revealClass}`}>{block.text}</p>;
            })}
            {board.visuals?.map((visual, index) => <section key={`${visual.type}:${index}`} style={{ animationDelay: `${(board.blocks.length + index) * 90}ms`, animationPlayState: drawingActive ? "running" : "paused" }} data-board-visual-stage={board.blocks.length + index + 1} aria-label={visual.title} className="orby-board-appear space-y-2 border-0 bg-transparent p-0">
              {visual.title && visual.type !== "sketch" ? <h4 className="orby-board-handwriting text-base font-medium text-slate-700">{visual.title}</h4> : null}
              <Visual visual={visual} board={board} drawingActive={drawingActive}/>
            </section>)}
          </div>
        )}
      </section>
    </>
  );
}
