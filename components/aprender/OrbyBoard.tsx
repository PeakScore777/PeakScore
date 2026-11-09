"use client";

import React from "react";

import { useEffect, useId, useRef, useState } from "react";
import { getOrbyBoardProgressiveDelay, getOrbySketchMotionProfile, getOrbySketchStrokeTiming, type OrbyBoard as OrbyBoardData, type OrbyBoardVisual, type OrbySketchStroke } from "@/lib/ai/orby-board";

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

function Diagram({ visual, startDelayMs = 0, focus }: { visual: Extract<OrbyBoardVisual, { type: "diagram" }>; startDelayMs?: number; focus?: VisualFocusTarget }) {
  const markerId = "orby-arrow-" + useId().replace(/:/g, "");
  const nodes = new Map(visual.nodes.map((node) => [node.id, node]));
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Diagrama conceptual"} className="h-auto max-h-72 w-full overflow-visible">
      {visual.edges.map((edge, index) => {
        const from = nodes.get(edge.from);
        const to = nodes.get(edge.to);
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return <g key={`${edge.from}:${edge.to}:${from.x}:${from.y}:${to.x}:${to.y}:${edge.label || ""}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
          <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} pathLength={1} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.ink} strokeWidth="0.8" markerEnd={`url(#${markerId})`} />
          {edge.label ? <text x={midX} y={midY - 2} fontSize="3.2" textAnchor="middle" fill={colors.ink}>{edge.label}</text> : null}
        </g>;
      })}
      <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={colors.ink}/></marker></defs>
      {visual.nodes.map((node, index) => <g key={`${node.id}:${node.x}:${node.y}:${node.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
        <rect x={node.x - 8} y={node.y - 5} width="16" height="10" rx="2" fill="#fee2e2" stroke={colors.orange} strokeWidth="0.7"/>
        <text x={node.x} y={node.y + 1} fontSize="3.1" textAnchor="middle" fill="#7f1d1d">{node.label}</text>
        <VisualTargetFocus targetId={focus?.targetId} currentId={node.id} x={node.x} y={node.y} label={focus?.label} revision={focus?.revision}/>
      </g>)}
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
            <path d="M -5.2 -1.25 L 2.8 -1.25 L 5.2 0 L 2.8 1.25 L -5.2 1.25 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.42" strokeLinejoin="round"/>
            <path d="M -2.8 -1.1 L -2.8 1.1 M -3.8 -1.1 L -3.8 1.1" stroke="#78350f" strokeWidth="0.25"/>
            <path d="M 4.2 -0.72 L 5.2 0 L 4.2 0.72 Z" fill="#f8fafc" stroke="#78350f" strokeWidth="0.25"/>
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
  const left = 12, right = 94, top = 10, bottom = 78;
  const px = (x: number) => left + ((x - visual.xMin) / (visual.xMax - visual.xMin)) * (right - left);
  const py = (y: number) => bottom - ((y - visual.yMin) / (visual.yMax - visual.yMin)) * (bottom - top);
  const path = visual.points.map((point, index) => `${index ? "L" : "M"} ${px(point.x)} ${py(point.y)}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Gráfica de datos"} className="h-auto max-h-72 w-full">
      {[0, 1, 2, 3, 4].map((step) => {
        const y = top + (bottom - top) * step / 4;
        return <line key={step} x1={left} y1={y} x2={right} y2={y} stroke={colors.grid} strokeWidth="0.45"/>;
      })}
      <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} x1={left} y1={top} x2={left} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} x1={left} y1={bottom} x2={right} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      {visual.kind === "line" ? <path key={path} className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + 120}ms` }} pathLength={1} d={path} fill="none" stroke={colors.orange} strokeWidth="1.5" strokeLinejoin="round"/> : null}
      {visual.points.map((point, index) => <g key={`${point.x}:${point.y}:${point.label || index}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
        <circle cx={px(point.x)} cy={py(point.y)} r="1.8" fill={colors.orange}/>
        {point.label ? <text x={px(point.x)} y={py(point.y) - 3} fontSize="3" textAnchor="middle" fill={colors.ink}>{point.label}</text> : null}
      </g>)}
      <text x="53" y="94" fontSize="4" textAnchor="middle" fill={colors.ink}>{visual.xLabel}</text>
      <text x="3" y="45" fontSize="4" textAnchor="middle" fill={colors.ink} transform="rotate(-90 3 45)">{visual.yLabel}</text>
      <text x={left} y="85" fontSize="3" fill={colors.ink}>{visual.xMin}</text>
      <text x={right} y="85" fontSize="3" textAnchor="end" fill={colors.ink}>{visual.xMax}</text>
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
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Modelo molecular esquemático"} className="h-auto max-h-72 w-full">
      {visual.bonds.map((bond, index) => {
        const from = atoms.get(bond.from), to = atoms.get(bond.to);
        if (!from || !to) return null;
        const dx = to.x - from.x, dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        const offsetX = (-dy / length) * 1.5, offsetY = (dx / length) * 1.5;
        const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-1.5, 1.5] : [-3, 0, 3];
        return <g key={`${bond.from}:${bond.to}:${bond.order}:${from.x}:${from.y}:${to.x}:${to.y}`} style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>{offsets.map((offset) => <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} pathLength={1} key={offset}
          x1={from.x + offsetX * offset} y1={from.y + offsetY * offset}
          x2={to.x + offsetX * offset} y2={to.y + offsetY * offset}
          stroke={colors.ink} strokeWidth="1.1" strokeLinecap="round"/>)}</g>;
      })}
      {visual.atoms.map((atom, index) => <g key={`${atom.id}:${atom.x}:${atom.y}:${atom.element}:${atom.charge || ""}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
        <circle cx={atom.x} cy={atom.y} r="5.3" fill={atom.element === "O" ? "#fee2e2" : atom.element === "N" ? "#dbeafe" : atom.element === "H" ? "#f1f5f9" : "#ffedd5"} stroke={colors.ink} strokeWidth="0.6"/>
        <text x={atom.x} y={atom.y + 1.5} fontSize="4.2" fontWeight="bold" textAnchor="middle" fill={colors.ink}>{atom.element}{atom.charge || ""}</text>
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
  const center = visual.cellType === "prokaryotic" ? { x: 50, y: 50 } : { x: 50, y: 50 };
  const organelleColors: Record<string, string> = {
    nucleus: "#c4b5fd", mitochondrion: "#fca5a5", chloroplast: "#86efac",
    vacuole: "#bfdbfe", membrane: "#fdba74", "cell-wall": "#a3a3a3",
    ribosome: "#fcd34d", "endoplasmic-reticulum": "#ddd6fe", golgi: "#f9a8d4", cytoplasm: "#e0f2fe",
  };
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Esquema celular"} className="h-auto max-h-72 w-full">
      {visual.cellType === "plant" ? <rect x="7" y="7" width="86" height="86" rx="17" fill="#f0fdf4" stroke="#64748b" strokeWidth="2.2"/> : null}
      <ellipse cx={center.x} cy={center.y} rx={visual.cellType === "prokaryotic" ? 40 : 37} ry={visual.cellType === "prokaryotic" ? 29 : 36}
        fill="#f8fafc" stroke={colors.orange} strokeWidth="1.8"/>
      {visual.organelles.map((item, index) => {
        const fill = organelleColors[item.kind] || "#e2e8f0";
        if (item.kind === "nucleus") return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}><circle cx={item.x} cy={item.y} r="8" fill={fill} stroke={colors.ink} strokeWidth="0.7"/><circle cx={item.x + 2} cy={item.y - 1} r="2" fill="#7c3aed"/></g>;
        if (item.kind === "mitochondrion") return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}><ellipse cx={item.x} cy={item.y} rx="7" ry="4" fill={fill} stroke={colors.ink} strokeWidth="0.6"/><path d={`M ${item.x - 5} ${item.y} q 2 -4 4 0 t 4 0`} fill="none" stroke={colors.ink} strokeWidth="0.5"/></g>;
        if (item.kind === "chloroplast") return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}><ellipse cx={item.x} cy={item.y} rx="7" ry="4" fill={fill} stroke={colors.ink} strokeWidth="0.6"/><path d={`M ${item.x - 4} ${item.y - 1} h8 M ${item.x - 4} ${item.y + 1} h8`} stroke="#166534" strokeWidth="0.7"/></g>;
        if (item.kind === "vacuole") return <rect className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} key={`${item.id}:${item.x}:${item.y}:${item.label}`} x={item.x - 7} y={item.y - 5} width="14" height="10" rx="3" fill={fill} stroke={colors.ink} strokeWidth="0.6"/>;
        if (item.kind === "ribosome") return <circle className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} key={`${item.id}:${item.x}:${item.y}:${item.label}`} cx={item.x} cy={item.y} r="2" fill={fill} stroke={colors.ink} strokeWidth="0.4"/>;
        if (item.kind === "cell-wall" || item.kind === "membrane") return null;
        return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}><ellipse cx={item.x} cy={item.y} rx="6" ry="3.5" fill={fill} stroke={colors.ink} strokeWidth="0.5"/></g>;
      })}
      {visual.organelles.map((item) => <g key={item.id + "-label"}>
        <text x={item.x} y={item.y + 10} fontSize="3.1" textAnchor="middle" fill={colors.ink}>{item.label}</text>
        <VisualTargetFocus targetId={focus?.targetId} currentId={item.id} x={item.x} y={item.y} label={focus?.label} revision={focus?.revision}/>
      </g>)}
    </svg>
  );
}

function Dna({ visual, startDelayMs = 0 }: { visual: Extract<OrbyBoardVisual, { type: "dna" }>; startDelayMs?: number }) {
  const step = 76 / Math.max(visual.pairs.length - 1, 1);
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Pares de bases del ADN"} className="h-auto max-h-72 w-full">
      {visual.pairs.map((pair, index) => {
        const y = 12 + index * step;
        const x1 = 50 + Math.sin(index * 0.9) * 18;
        const x2 = 50 - Math.sin(index * 0.9) * 18;
        return <g key={`${index}:${pair.left}:${pair.right}:${y}`} className="orby-board-appear" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }}>
          <line className="orby-board-stroke" style={{ animationDelay: `${startDelayMs + getOrbyBoardProgressiveDelay(index)}ms` }} pathLength={1} x1={x1} y1={y} x2={x2} y2={y} stroke={colors.ink} strokeWidth="1.2"/>
          <circle cx={x1} cy={y} r="5" fill="#dbeafe" stroke={colors.ink} strokeWidth="0.5"/>
          <circle cx={x2} cy={y} r="5" fill="#fee2e2" stroke={colors.ink} strokeWidth="0.5"/>
          <text x={x1} y={y + 1.5} fontSize="4" textAnchor="middle" fill={colors.ink}>{pair.left}</text>
          <text x={x2} y={y + 1.5} fontSize="4" textAnchor="middle" fill={colors.ink}>{pair.right}</text>
        </g>;
      })}
      <path key={visual.pairs.map((pair) => pair.left + pair.right).join("") + "-left"} className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={visual.pairs.map((_, index) => `${index ? "L" : "M"} ${50 + Math.sin(index * 0.9) * 18} ${12 + index * step}`).join(" ")} fill="none" stroke={colors.orange} strokeWidth="1.3"/>
      <path key={visual.pairs.map((pair) => pair.left + pair.right).join("") + "-right"} className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={visual.pairs.map((_, index) => `${index ? "L" : "M"} ${50 - Math.sin(index * 0.9) * 18} ${12 + index * step}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="1.3"/>
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
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {visual.phases.map((phase, index) => <div key={phase.name} className="min-w-0 rounded-lg border border-slate-200 bg-white p-2">
        <div className="mb-2 flex h-10 items-center justify-center rounded bg-orange-50 text-[10px] font-black text-orange-800">
          {visual.mode === "mitosis" ? ["◯","⊗","↗","◎"][index] : ["◯","⊗","↗","◎","◯","⊗","↗","◎"][index]}
        </div>
        <p className="text-[11px] font-bold text-slate-900">{phase.name}</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-600">{phase.detail}</p>
      </div>)}
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
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Esquema del sistema humano"} className="h-auto max-h-72 w-full">
        <circle cx="50" cy="12" r="7" fill="#f8fafc" stroke={colors.ink} strokeWidth="1"/>
        <path d="M50 20 L50 65 M50 28 L31 47 M50 28 L69 47 M50 65 L36 91 M50 65 L64 91" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
        {visual.structures.map((item) => <g key={item.id}>
          <line x1="50" y1="24" x2={item.x} y2={item.y} stroke={palette.stroke} strokeWidth="0.55" strokeDasharray="2 1"/>
          <circle cx={item.x} cy={item.y} r="4.3" fill={palette.fill} stroke={palette.stroke} strokeWidth="0.9"/>
          <text x={item.x} y={item.y + 1.3} fontSize="3.1" fontWeight="bold" textAnchor="middle" fill={colors.ink}>{item.name.slice(0, 2)}</text>
          <VisualTargetFocus targetId={focus?.targetId} currentId={item.id} x={item.x} y={item.y} label={focus?.label} revision={focus?.revision}/>
        </g>)}
      </svg>
      <ol className="space-y-2">
        {visual.structures.map((item, index) => <li key={item.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
          <p className="text-[11px] font-bold text-slate-900">{index + 1}. {item.name}</p>
          <p className="text-[10px] leading-4 text-slate-600">{item.role}</p>
        </li>)}
      </ol>
    </div>
  );
}

function Neuron({ visual }: { visual: Extract<OrbyBoardVisual, { type: "neuron" }> }) {
  const points = [
    { x: 18, y: 50 }, { x: 35, y: 50 }, { x: 53, y: 50 }, { x: 72, y: 50 }, { x: 88, y: 50 },
  ];
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 100 72" role="img" aria-label={visual.title || "Esquema simplificado de una neurona"} className="h-auto max-h-56 w-full">
        <g fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round">
          <path d="M18 36 L10 23 M18 36 L7 39 M18 36 L12 54 M18 36 L22 18 M18 36 L29 25"/>
          <path d="M18 36 Q28 26 35 36 Q28 46 18 36" fill="#fed7aa"/>
          <path d="M35 36 L88 36" stroke="#c2410c" strokeWidth="2.3"/>
          <path d="M88 36 L94 25 M88 36 L96 36 M88 36 L94 47" />
          <path d="M46 31 Q50 36 46 41 M58 31 Q62 36 58 41 M70 31 Q74 36 70 41" stroke="#60a5fa" strokeWidth="4"/>
        </g>
        <circle cx="26" cy="36" r="2.8" fill="#7c3aed"/>
        <path d="M12 62 L88 62" stroke="#64748b" strokeWidth="0.6" strokeDasharray="2 2"/>
        <path d="M84 59 L88 62 L84 65" fill="none" stroke="#64748b" strokeWidth="0.8"/>
        <text x="50" y="69" fontSize="3.5" textAnchor="middle" fill={colors.ink}>Dirección general del impulso nervioso</text>
        {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="0.8" fill={colors.orange}/>)}
      </svg>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visual.parts.map((part, index) => <li key={part.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
          <p className="text-[11px] font-bold text-slate-900">{index + 1}. {part.name}</p>
          <p className="text-[10px] leading-4 text-slate-600">{part.role}</p>
        </li>)}
      </ol>
      <p className="text-[10px] text-slate-500">Esquema conceptual, no está a escala. La mielina y los nodos se representan de forma simplificada.</p>
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
      {visual.mark === "circle" ? <ellipse className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} cx={(minX + maxX) / 2} cy={(minY + maxY) / 2} rx={Math.max(2, (maxX - minX) / 2)} ry={Math.max(2, (maxY - minY) / 2)} fill="none" stroke={palette} strokeWidth="1.35" strokeDasharray="3 1" /> : null}
      {visual.mark === "underline" ? <path className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={path} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round"/> : null}
      {visual.mark === "arrow" ? <path className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={path} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round" markerEnd={`url(#${markerId})`}/> : null}
      {visual.mark === "bracket" ? <path className="orby-board-stroke" style={{ animationDelay: `${startDelayMs}ms` }} pathLength={1} d={`M ${first.x} ${first.y} L ${last.x} ${first.y} L ${last.x} ${last.y}`} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> : null}
      {visual.label ? <text x={Math.min(88, last.x + 2)} y={Math.max(7, last.y - 2)} fontSize="3.8" fontWeight="700" fill={palette} className="orby-board-appear" style={{ animationDelay: `${startDelayMs}ms` }}>{visual.label}</text> : null}
    </svg>;
  }
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

function renderBoardBlock(block: OrbyBoardData["blocks"][number], index: number) {
  const stage = index + 1;
  if (block.type === "heading") {
    return <h4 data-board-stage={stage} className="orby-board-handwriting orby-board-layout-heading text-slate-900">{block.text}</h4>;
  }
  if (block.type === "formula") {
    return <p data-board-stage={stage} className="orby-board-handwriting orby-board-layout-formula text-blue-700">{block.text}</p>;
  }
  if (block.type === "step") {
    return <p data-board-stage={stage} className="orby-board-handwriting orby-board-layout-text text-slate-800"><span className="font-semibold text-blue-700">{block.label}: </span>{block.text}</p>;
  }
  if (block.type === "callout") {
    return <p data-board-stage={stage} className="orby-board-handwriting orby-board-layout-callout text-red-700">{block.text}</p>;
  }
  return <p data-board-stage={stage} className="orby-board-handwriting orby-board-layout-text text-slate-800">{block.text}</p>;
}

export default function OrbyBoard({ board, drawingActive = true }: { board: OrbyBoardData; drawingActive?: boolean }) {
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
      <style>{`.orby-board-tool-button { display:inline-flex; min-height:34px; min-width:34px; align-items:center; justify-content:center; border:1px solid #e2e8f0; border-radius:8px; background:#fff; padding:0 10px; color:#475569; font-size:11px; font-weight:650; transition:background-color .15s,border-color .15s,color .15s; } .orby-board-tool-button:hover:not(:disabled) { border-color:#fed7aa; background:#fff7ed; color:#9a3412; } .orby-board-tool-button:focus-visible { outline:2px solid #f97316; outline-offset:2px; } .orby-board-tool-button:disabled { cursor:not-allowed; opacity:.4; } .orby-board-tool-button-active { border-color:#f97316; background:#fff7ed; color:#9a3412; } @media print {@page { size: A4 landscape; margin: 10mm; } html, body { background: #fff !important; } body * { visibility: hidden !important; } .orby-board, .orby-board * { visibility: visible !important; } .orby-board { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; min-height: 0 !important; overflow: visible !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important; } .orby-board [data-orby-no-print], .orby-board .orby-board-toolbar { display: none !important; } .orby-board > header { position: static !important; background: #fff !important; } .orby-board-canvas-scroll { max-height: none !important; overflow: visible !important; } .orby-board-pages-zoom { width: 100% !important; } .orby-board-pages { display: block !important; }
.orby-board-page { break-after: page; page-break-after: always; }
.orby-board-page:last-child { break-after: auto; page-break-after: auto; }
.orby-board-page-heading { display: none !important; }
.orby-board-canvas { width: 100% !important; min-width: 0 !important; max-width: none !important; aspect-ratio: 16 / 9 !important; break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .orby-board-layout-stage { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-appear, .orby-board .orby-board-sketch-stroke { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-pen-tip, .orby-board [data-orby-teacher-focus] { display: none !important; } .orby-board section { break-inside: avoid; box-shadow: none !important; } .orby-board svg { overflow: visible !important; }} .orby-board svg[data-orby-drawing-active="false"] .orby-board-appear, .orby-board svg[data-orby-drawing-active="false"] .orby-board-sketch-stroke { animation-play-state: paused !important; } .orby-board svg[data-orby-drawing-active="false"] .orby-board-pen-tip { visibility: hidden !important; } @media (prefers-reduced-motion: reduce) { .orby-board .orby-board-layout-stage, .orby-board .orby-board-appear { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-stroke, .orby-board .orby-board-sketch-stroke { animation: none !important; stroke-dasharray: none !important; stroke-dashoffset: 0 !important; } .orby-board .orby-board-pen-tip { display: none !important; } .orby-board [data-orby-sketch-label], .orby-board [data-orby-sketch-endpoint] { opacity: 1 !important; } .orby-board svg animate, .orby-board svg animateMotion, .orby-board [data-orby-teacher-focus] animate { display: none !important; } .orby-board .orby-board-focus-ring, .orby-board .orby-board-focus-dot, .orby-board [data-orby-teacher-focus-label] { opacity: 1 !important; } }`} </style>
      <section ref={boardRef} data-orby-drawing-active={drawingActive ? "true" : "false"} aria-label={"Pizarra: " + board.title} className="orby-board mx-auto min-h-full w-full overflow-hidden bg-white text-slate-900">
        <header className="orby-board-paper-heading flex items-start justify-between gap-3 bg-white px-4 pb-3 pt-5 sm:px-8 sm:pt-7">
          <div className="min-w-0">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">OMEGAX · CLASE EN DIRECTO</p>
            <h3 className="orby-board-handwriting orby-board-title-highlight inline-block max-w-full break-words text-base font-semibold leading-snug text-slate-900 sm:text-xl">{board.title}</h3>
          </div>
          <button type="button" data-orby-no-print onClick={() => window.print()} className="orby-board-export shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800">Exportar PDF</button>
        </header>

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
              <div className="orby-board-pages">
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
                    {spatialLayout.elements.filter((element) => (element.page ?? 0) === pageIndex).map((element) => {
                      const stageDelay = Math.min((element.sequence - 1) * 135, 945);
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
              const blockKey = `${block.type}:${index}`;
              const revealClass = "orby-board-appear";
              const stageStyle = { animationDelay: `${Math.min(index * 65, 260)}ms`, animationPlayState: drawingActive ? "running" as const : "paused" as const };
              if (block.type === "heading") return <h4 key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-2xl font-medium leading-tight tracking-tight text-slate-900 decoration-red-400 decoration-2 underline underline-offset-4 sm:text-4xl ${revealClass}`}>{block.text}</h4>;
              if (block.type === "formula") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting overflow-x-auto text-lg font-medium leading-8 text-blue-700 sm:text-2xl ${revealClass}`}>{block.text}</p>;
              if (block.type === "step") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-base leading-7 text-slate-800 sm:text-xl ${revealClass}`}><span className="font-semibold text-blue-700">{block.label}: </span>{block.text}</p>;
              if (block.type === "callout") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting border-l-2 border-red-400 pl-3 text-base leading-7 text-red-700 sm:text-xl ${revealClass}`}>{block.text}</p>;
              return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-base leading-7 text-slate-800 sm:text-xl ${revealClass}`}>{block.text}</p>;
            })}
            {board.visuals?.map((visual, index) => <section key={`${visual.type}:${index}`} style={{ animationDelay: `${Math.min((board.blocks.length + index) * 65, 325)}ms`, animationPlayState: drawingActive ? "running" : "paused" }} data-board-visual-stage={board.blocks.length + index + 1} aria-label={visual.title} className="orby-board-appear space-y-2 border-0 bg-transparent p-0">
              {visual.title && visual.type !== "sketch" ? <h4 className="orby-board-handwriting text-base font-medium text-slate-700">{visual.title}</h4> : null}
              <Visual visual={visual} board={board} drawingActive={drawingActive}/>
            </section>)}
          </div>
        )}
      </section>
    </>
  );
}
