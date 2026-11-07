"use client";

import type { OrbyBoard as OrbyBoardData } from "@/lib/ai/orby-board";

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
      </div>
    </section>
  );
}
