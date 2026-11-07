"use client";

import { useId } from "react";
import type { OrbyBoard as OrbyBoardData, OrbyBoardVisual } from "@/lib/ai/orby-board";

const colors = {
  orange: "#f97316",
  ink: "#334155",
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
        return <g key={index}>
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.ink} strokeWidth="0.8" markerEnd={`url(#${markerId})`} />
          {edge.label ? <text x={midX} y={midY - 2} fontSize="3.2" textAnchor="middle" fill={colors.ink}>{edge.label}</text> : null}
        </g>;
      })}
      <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={colors.ink}/></marker></defs>
      {visual.nodes.map((node) => <g key={node.id}>
        <rect x={node.x - 8} y={node.y - 5} width="16" height="10" rx="2" fill="#ffedd5" stroke={colors.orange} strokeWidth="0.7"/>
        <text x={node.x} y={node.y + 1} fontSize="3.1" textAnchor="middle" fill="#7c2d12">{node.label}</text>
      </g>)}
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
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={colors.ink} strokeWidth="0.8"/>
      {visual.kind === "line" ? <path d={path} fill="none" stroke={colors.orange} strokeWidth="1.5" strokeLinejoin="round"/> : null}
      {visual.points.map((point, index) => <g key={index}>
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
        return <g key={index}>
          <line x1={visual.origin.x} y1={visual.origin.y} x2={endX} y2={endY} stroke={colors.orange} strokeWidth="1.2" markerEnd={`url(#${markerId})`}/>
          <text x={endX + 2} y={endY - 2} fontSize="3.6" fill={colors.ink}>{vector.label}</text>
        </g>;
      })}
    </svg>
  );
}

function Visual({ visual }: { visual: OrbyBoardVisual }) {
  if (visual.type === "diagram") return <Diagram visual={visual}/>;
  if (visual.type === "graph") return <Graph visual={visual}/>;
  if (visual.type === "vectors") return <Vectors visual={visual}/>;
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
        return <div key={index} className="absolute top-0 w-24 space-y-2" style={{ left: `${event.position}%` }}>
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

export default function OrbyBoard({ board }: { board: OrbyBoardData }) {
  return (
    <section aria-label={"Pizarra: " + board.title} className="mt-4 overflow-hidden rounded-xl border border-orange-200 bg-[#fffdf8] text-slate-900 shadow-sm">
      <header className="flex items-center gap-2 border-b border-orange-100 bg-orange-50 px-4 py-3">
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-sm font-black text-white">O</span>
        <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-orange-950">Pizarra · {board.title}</h3>
      </header>
      <div className="space-y-3 p-4">
        {board.blocks.map((block, index) => {
          if (block.type === "heading") return <h4 key={index} className="text-sm font-bold text-slate-900">{block.text}</h4>;
          if (block.type === "formula") return <div key={index} className="overflow-x-auto rounded-lg border border-slate-200 bg-white px-3 py-3 text-center font-mono text-sm font-semibold text-slate-900">{block.text}</div>;
          if (block.type === "step") return <div key={index} className="flex gap-3 rounded-lg bg-white p-3"><span className="shrink-0 rounded-md bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-900">{block.label}</span><p className="text-sm leading-6 text-slate-700">{block.text}</p></div>;
          if (block.type === "callout") return <div key={index} className="rounded-lg border-l-4 border-orange-500 bg-orange-50 px-3 py-2 text-sm leading-6 text-orange-950">{block.text}</div>;
          return <p key={index} className="text-sm leading-6 text-slate-700">{block.text}</p>;
        })}
        {board.visuals?.map((visual, index) => <section key={index} aria-label={visual.title} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          {visual.title ? <h4 className="text-xs font-bold text-slate-800">{visual.title}</h4> : null}
          <Visual visual={visual}/>
        </section>)}
      </div>
    </section>
  );
}
