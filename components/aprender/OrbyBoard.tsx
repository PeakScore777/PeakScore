"use client";

import React from "react";

import { useEffect, useId, useRef, useState } from "react";
import { getOrbySketchStrokeTiming, type OrbyBoard as OrbyBoardData, type OrbyBoardVisual, type OrbySketchStroke } from "@/lib/ai/orby-board";

const colors = {
  orange: "#dc2626",
  ink: "#252525",
  grid: "#e2e8f0",
};

function Diagram({ visual }: { visual: Extract<OrbyBoardVisual, { type: "diagram" }> }) {
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
        return <g key={`${edge.from}:${edge.to}:${from.x}:${from.y}:${to.x}:${to.y}:${edge.label || ""}`} style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
          <line className="orby-board-stroke" pathLength={1} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.ink} strokeWidth="0.8" markerEnd={`url(#${markerId})`} />
          {edge.label ? <text x={midX} y={midY - 2} fontSize="3.2" textAnchor="middle" fill={colors.ink}>{edge.label}</text> : null}
        </g>;
      })}
      <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={colors.ink}/></marker></defs>
      {visual.nodes.map((node, index) => <g key={`${node.id}:${node.x}:${node.y}:${node.label}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
        <rect className="orby-board-appear" x={node.x - 8} y={node.y - 5} width="16" height="10" rx="2" fill="#fee2e2" stroke={colors.orange} strokeWidth="0.7"/>
        <text x={node.x} y={node.y + 1} fontSize="3.1" textAnchor="middle" fill="#7f1d1d">{node.label}</text>
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

function Sketch({ visual, focus, drawingActive }: { visual: Extract<OrbyBoardVisual, { type: "sketch" }>; focus?: { strokeId: string; label?: string; revision: number }; drawingActive: boolean }) {
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
    let queueCursor = Math.max(now + 0.06, ...queuedStrokeEnds.map((endAt) => endAt + 0.11));
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
  }, [drawingActive, visual.strokes]);

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
              calcMode="linear"
              fill="freeze"
            />
          </path>
          <g opacity={0} className="orby-board-pen-tip" data-orby-teacher-pointer={stroke.id} aria-hidden="true">
            <path d="M -5.2 -1.25 L 2.8 -1.25 L 5.2 0 L 2.8 1.25 L -5.2 1.25 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.42" strokeLinejoin="round"/>
            <path d="M -2.8 -1.1 L -2.8 1.1 M -3.8 -1.1 L -3.8 1.1" stroke="#78350f" strokeWidth="0.25"/>
            <path d="M 4.2 -0.72 L 5.2 0 L 4.2 0.72 Z" fill="#f8fafc" stroke="#78350f" strokeWidth="0.25"/>
            <animateMotion path={path} dur={`${duration}s`} begin={animationReady ? `${beginTime}s` : "indefinite"} rotate="auto" fill="freeze"/>
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
          <circle cx={lastPoint.x} cy={lastPoint.y} r="0.45" fill={color} opacity={0}>
            <animate attributeName="opacity" from="0" to="1" begin={animationReady ? `${beginTime + duration}s` : "indefinite"} dur="0.12s" fill="freeze"/>
          </circle>
          {focus?.strokeId === stroke.id ? <g key={`${focus.strokeId}:${focus.revision}`} data-orby-teacher-focus={stroke.id} pointerEvents="none">
            <circle cx={stroke.points[Math.floor(stroke.points.length / 2)].x} cy={stroke.points[Math.floor(stroke.points.length / 2)].y} r="3.2" fill="none" stroke="#dc2626" strokeWidth="0.9">
              <animate attributeName="r" values="2.6;5.2;2.6" dur="1.35s" repeatCount="2" fill="freeze"/>
              <animate attributeName="opacity" values="0.95;0.35;0" dur="1.35s" repeatCount="2" fill="freeze"/>
            </circle>
            {focus.label ? <text x={Math.min(88, stroke.points[Math.floor(stroke.points.length / 2)].x + 5)} y={Math.max(7, stroke.points[Math.floor(stroke.points.length / 2)].y - 5)} fontSize="3.5" fontWeight="700" fill="#b91c1c">{focus.label}<animate attributeName="opacity" values="1;1;0" keyTimes="0;0.75;1" dur="2.7s" fill="freeze"/></text> : null}
          </g> : null}
        </g>;
      })}
    </svg>
  );
}

function Graph({ visual }: { visual: Extract<OrbyBoardVisual, { type: "graph" }> }) {
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
      <line className="orby-board-stroke" pathLength={1} x1={left} y1={top} x2={left} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      <line className="orby-board-stroke" pathLength={1} x1={left} y1={bottom} x2={right} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      {visual.kind === "line" ? <path key={path} className="orby-board-stroke" pathLength={1} d={path} fill="none" stroke={colors.orange} strokeWidth="1.5" strokeLinejoin="round"/> : null}
      {visual.points.map((point, index) => <g key={`${point.x}:${point.y}:${point.label || index}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
        <circle className="orby-board-appear" cx={px(point.x)} cy={py(point.y)} r="1.8" fill={colors.orange}/>
        {point.label ? <text x={px(point.x)} y={py(point.y) - 3} fontSize="3" textAnchor="middle" fill={colors.ink}>{point.label}</text> : null}
      </g>)}
      <text x="53" y="94" fontSize="4" textAnchor="middle" fill={colors.ink}>{visual.xLabel}</text>
      <text x="3" y="45" fontSize="4" textAnchor="middle" fill={colors.ink} transform="rotate(-90 3 45)">{visual.yLabel}</text>
      <text x={left} y="85" fontSize="3" fill={colors.ink}>{visual.xMin}</text>
      <text x={right} y="85" fontSize="3" textAnchor="end" fill={colors.ink}>{visual.xMax}</text>
    </svg>
  );
}

function Vectors({ visual }: { visual: Extract<OrbyBoardVisual, { type: "vectors" }> }) {
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
        return <g key={`${vector.label}:${visual.origin.x}:${visual.origin.y}:${vector.dx}:${vector.dy}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
          <line className="orby-board-stroke" pathLength={1} x1={visual.origin.x} y1={visual.origin.y} x2={endX} y2={endY} stroke={colors.orange} strokeWidth="1.2" markerEnd={`url(#${markerId})`}/>
          <text x={endX + 2} y={endY - 2} fontSize="3.6" fill={colors.ink}>{vector.label}</text>
        </g>;
      })}
    </svg>
  );
}

function Molecule({ visual }: { visual: Extract<OrbyBoardVisual, { type: "molecule" }> }) {
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
        return <g key={`${bond.from}:${bond.to}:${bond.order}:${from.x}:${from.y}:${to.x}:${to.y}`} style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>{offsets.map((offset) => <line className="orby-board-stroke" pathLength={1} key={offset}
          x1={from.x + offsetX * offset} y1={from.y + offsetY * offset}
          x2={to.x + offsetX * offset} y2={to.y + offsetY * offset}
          stroke={colors.ink} strokeWidth="1.1" strokeLinecap="round"/>)}</g>;
      })}
      {visual.atoms.map((atom, index) => <g key={`${atom.id}:${atom.x}:${atom.y}:${atom.element}:${atom.charge || ""}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
        <circle cx={atom.x} cy={atom.y} r="5.3" fill={atom.element === "O" ? "#fee2e2" : atom.element === "N" ? "#dbeafe" : atom.element === "H" ? "#f1f5f9" : "#ffedd5"} stroke={colors.ink} strokeWidth="0.6"/>
        <text x={atom.x} y={atom.y + 1.5} fontSize="4.2" fontWeight="bold" textAnchor="middle" fill={colors.ink}>{atom.element}{atom.charge || ""}</text>
      </g>)}
    </svg>
  );
}

function Circuit({ visual }: { visual: Extract<OrbyBoardVisual, { type: "circuit" }> }) {
  const components = new Map(visual.components.map((component) => [component.id, component]));
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Circuito eléctrico esquemático"} className="h-auto max-h-72 w-full">
      {visual.connections.map((connection) => {
        const from = components.get(connection.from), to = components.get(connection.to);
        if (!from || !to) return null;
        return <line className="orby-board-stroke" pathLength={1} key={`${connection.from}:${connection.to}:${from.x}:${from.y}:${to.x}:${to.y}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.ink} strokeWidth="1.1" strokeLinecap="round"/>;
      })}
      {visual.components.map((component, index) => <g key={`${component.id}:${component.kind}:${component.x}:${component.y}:${component.label}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
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
      </g>)}
    </svg>
  );
}

function Cell({ visual }: { visual: Extract<OrbyBoardVisual, { type: "cell" }> }) {
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
        if (item.kind === "nucleus") return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}><circle cx={item.x} cy={item.y} r="8" fill={fill} stroke={colors.ink} strokeWidth="0.7"/><circle cx={item.x + 2} cy={item.y - 1} r="2" fill="#7c3aed"/></g>;
        if (item.kind === "mitochondrion") return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}><ellipse cx={item.x} cy={item.y} rx="7" ry="4" fill={fill} stroke={colors.ink} strokeWidth="0.6"/><path d={`M ${item.x - 5} ${item.y} q 2 -4 4 0 t 4 0`} fill="none" stroke={colors.ink} strokeWidth="0.5"/></g>;
        if (item.kind === "chloroplast") return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}><ellipse cx={item.x} cy={item.y} rx="7" ry="4" fill={fill} stroke={colors.ink} strokeWidth="0.6"/><path d={`M ${item.x - 4} ${item.y - 1} h8 M ${item.x - 4} ${item.y + 1} h8`} stroke="#166534" strokeWidth="0.7"/></g>;
        if (item.kind === "vacuole") return <rect className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }} key={`${item.id}:${item.x}:${item.y}:${item.label}`} x={item.x - 7} y={item.y - 5} width="14" height="10" rx="3" fill={fill} stroke={colors.ink} strokeWidth="0.6"/>;
        if (item.kind === "ribosome") return <circle className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }} key={`${item.id}:${item.x}:${item.y}:${item.label}`} cx={item.x} cy={item.y} r="2" fill={fill} stroke={colors.ink} strokeWidth="0.4"/>;
        if (item.kind === "cell-wall" || item.kind === "membrane") return null;
        return <g key={`${item.id}:${item.x}:${item.y}:${item.label}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}><ellipse cx={item.x} cy={item.y} rx="6" ry="3.5" fill={fill} stroke={colors.ink} strokeWidth="0.5"/></g>;
      })}
      {visual.organelles.map((item) => <text key={item.id + "-label"} x={item.x} y={item.y + 10} fontSize="3.1" textAnchor="middle" fill={colors.ink}>{item.label}</text>)}
    </svg>
  );
}

function Dna({ visual }: { visual: Extract<OrbyBoardVisual, { type: "dna" }> }) {
  const step = 76 / Math.max(visual.pairs.length - 1, 1);
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={visual.title || "Pares de bases del ADN"} className="h-auto max-h-72 w-full">
      {visual.pairs.map((pair, index) => {
        const y = 12 + index * step;
        const x1 = 50 + Math.sin(index * 0.9) * 18;
        const x2 = 50 - Math.sin(index * 0.9) * 18;
        return <g key={`${index}:${pair.left}:${pair.right}:${y}`} className="orby-board-appear" style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}>
          <line className="orby-board-stroke" pathLength={1} x1={x1} y1={y} x2={x2} y2={y} stroke={colors.ink} strokeWidth="1.2"/>
          <circle cx={x1} cy={y} r="5" fill="#dbeafe" stroke={colors.ink} strokeWidth="0.5"/>
          <circle cx={x2} cy={y} r="5" fill="#fee2e2" stroke={colors.ink} strokeWidth="0.5"/>
          <text x={x1} y={y + 1.5} fontSize="4" textAnchor="middle" fill={colors.ink}>{pair.left}</text>
          <text x={x2} y={y + 1.5} fontSize="4" textAnchor="middle" fill={colors.ink}>{pair.right}</text>
        </g>;
      })}
      <path key={visual.pairs.map((pair) => pair.left + pair.right).join("") + "-left"} className="orby-board-stroke" pathLength={1} d={visual.pairs.map((_, index) => `${index ? "L" : "M"} ${50 + Math.sin(index * 0.9) * 18} ${12 + index * step}`).join(" ")} fill="none" stroke={colors.orange} strokeWidth="1.3"/>
      <path key={visual.pairs.map((pair) => pair.left + pair.right).join("") + "-right"} className="orby-board-stroke" pathLength={1} d={visual.pairs.map((_, index) => `${index ? "L" : "M"} ${50 - Math.sin(index * 0.9) * 18} ${12 + index * step}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="1.3"/>
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

function OrganSystem({ visual }: { visual: Extract<OrbyBoardVisual, { type: "organ-system" }> }) {
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

function PhysiologyProcess({ visual }: { visual: Extract<OrbyBoardVisual, { type: "physiology-process" }> }) {
  return (
    <ol className="relative space-y-2">
      {visual.stages.map((stage, index) => <li key={stage.name} className="orby-board-appear relative flex gap-3" style={{ animationDelay: `${Math.min(index * 110, 770)}ms` }}>
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

function Visual({ visual, board, drawingActive }: { visual: OrbyBoardVisual; board: OrbyBoardData; drawingActive: boolean }) {
  // Keep hooks unconditional even when the visual primitive changes between snapshots.
  const annotationMarkerId = `orby-annotation-arrow-${useId().replace(/:/g, "")}`;
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
      {visual.mark === "circle" ? <ellipse className="orby-board-stroke" pathLength={1} cx={(minX + maxX) / 2} cy={(minY + maxY) / 2} rx={Math.max(2, (maxX - minX) / 2)} ry={Math.max(2, (maxY - minY) / 2)} fill="none" stroke={palette} strokeWidth="1.35" strokeDasharray="3 1" /> : null}
      {visual.mark === "underline" ? <path className="orby-board-stroke" pathLength={1} d={path} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round"/> : null}
      {visual.mark === "arrow" ? <path className="orby-board-stroke" pathLength={1} d={path} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round" markerEnd={`url(#${markerId})`}/> : null}
      {visual.mark === "bracket" ? <path className="orby-board-stroke" pathLength={1} d={`M ${first.x} ${first.y} L ${last.x} ${first.y} L ${last.x} ${last.y}`} fill="none" stroke={palette} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> : null}
      {visual.label ? <text x={Math.min(88, last.x + 2)} y={Math.max(7, last.y - 2)} fontSize="3.8" fontWeight="700" fill={palette} className="orby-board-appear">{visual.label}</text> : null}
    </svg>;
  }
  if (visual.type === "diagram") return <Diagram visual={visual}/>;
  if (visual.type === "sketch") return <Sketch visual={visual} focus={board.teacherFocus} drawingActive={drawingActive}/>;
  if (visual.type === "graph") return <Graph visual={visual}/>;
  if (visual.type === "vectors") return <Vectors visual={visual}/>;
  if (visual.type === "molecule") return <Molecule visual={visual}/>;
  if (visual.type === "circuit") return <Circuit visual={visual}/>;
  if (visual.type === "cell") return <Cell visual={visual}/>;
  if (visual.type === "dna") return <Dna visual={visual}/>;
  if (visual.type === "punnett") return <Punnett visual={visual}/>;
  if (visual.type === "cell-division") return <CellDivision visual={visual}/>;
  if (visual.type === "organ-system") return <OrganSystem visual={visual}/>;
  if (visual.type === "neuron") return <Neuron visual={visual}/>;
  if (visual.type === "physiology-process") return <PhysiologyProcess visual={visual}/>;
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
        return <div key={`${event.position}:${event.label}:${index}`} className="orby-board-appear absolute top-0 w-24 space-y-2" style={{ left: `${event.position}%`, animationDelay: `${Math.min(index * 100, 700)}ms` }}>
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

export default function OrbyBoard({ board, drawingActive = true }: { board: OrbyBoardData; drawingActive?: boolean }) {
  const boardRef = useRef<HTMLElement | null>(null);

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

  return (
    <>
      <style>{`@media print {@page { size: A4; margin: 12mm; } html, body { background: #fff !important; } body * { visibility: hidden !important; } .orby-board, .orby-board * { visibility: visible !important; } .orby-board { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; min-height: 0 !important; overflow: visible !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important; } .orby-board [data-orby-no-print], .orby-board .orby-board-toolbar { display: none !important; } .orby-board > header { position: static !important; background: #fff !important; } .orby-board > div { position: static !important; max-width: none !important; padding: 8mm 0 !important; } .orby-board section { break-inside: avoid; box-shadow: none !important; } .orby-board svg { overflow: visible !important; } .orby-board .orby-board-appear, .orby-board .orby-board-sketch-stroke { animation: none !important; opacity: 1 !important; } .orby-board .orby-board-pen-tip, .orby-board [data-orby-teacher-focus] { display: none !important; }} .orby-board svg[data-orby-drawing-active="false"] .orby-board-appear, .orby-board svg[data-orby-drawing-active="false"] .orby-board-sketch-stroke { animation-play-state: paused !important; } .orby-board svg[data-orby-drawing-active="false"] .orby-board-pen-tip { visibility: hidden !important; } @media (prefers-reduced-motion: reduce) { .orby-board [data-orby-teacher-focus] animate { display: none; } }`} </style>
    <section ref={boardRef} data-orby-drawing-active={drawingActive ? "true" : "false"} aria-label={"Pizarra: " + board.title} className="orby-board mx-auto min-h-full w-full overflow-hidden bg-white text-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2 sm:px-8">
        <h3 className="orby-board-handwriting min-w-0 truncate text-base font-medium text-slate-700 sm:text-lg">{board.title}</h3>
        <button type="button" data-orby-no-print onClick={() => window.print()} className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50">Exportar PDF</button>
      </header>
      <div className="mx-auto min-h-[60vh] w-full max-w-[1200px] space-y-5 px-4 py-5 sm:space-y-7 sm:px-10 sm:py-8">
        {board.blocks.map((block, index) => {
          const blockKey = `${block.type}:${index}`;
          const revealClass = "orby-board-appear";
          const stageStyle = { animationDelay: `${Math.min(index * 65, 260)}ms` };
          if (block.type === "heading") return <h4 key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-2xl font-medium leading-tight tracking-tight text-slate-900 decoration-red-400 decoration-2 underline underline-offset-4 sm:text-4xl ${revealClass}`}>{block.text}</h4>;
          if (block.type === "formula") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting overflow-x-auto text-lg font-medium leading-8 text-blue-700 sm:text-2xl ${revealClass}`}>{block.text}</p>;
          if (block.type === "step") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-base leading-7 text-slate-800 sm:text-xl ${revealClass}`}><span className="font-semibold text-blue-700">{block.label}: </span>{block.text}</p>;
          if (block.type === "callout") return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting border-l-2 border-red-400 pl-3 text-base leading-7 text-red-700 sm:text-xl ${revealClass}`}>{block.text}</p>;
          return <p key={blockKey} style={stageStyle} data-board-stage={index + 1} className={`orby-board-handwriting text-base leading-7 text-slate-800 sm:text-xl ${revealClass}`}>{block.text}</p>;
        })}
        {board.visuals?.map((visual, index) => <section key={`${visual.type}:${index}`} style={{ animationDelay: `${Math.min((board.blocks.length + index) * 65, 325)}ms` }} data-board-visual-stage={board.blocks.length + index + 1} aria-label={visual.title} className="orby-board-appear space-y-2 border-0 bg-transparent p-0">
          {visual.title && visual.type !== "sketch" ? <h4 className="orby-board-handwriting text-base font-medium text-slate-700">{visual.title}</h4> : null}
          <Visual visual={visual} board={board} drawingActive={drawingActive}/>
        </section>)}
      </div>
    </section>
    </>
  );
}
