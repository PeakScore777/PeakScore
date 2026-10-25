"use client";

import { useState } from "react";
import { FlaskConical, Microscope, Waves, Leaf, Search, Check, ChevronRight, X } from "lucide-react";

const evidence = [
  { id: 1, label: "PUNTO DE MUESTREO", title: "Dos zonas del río", description: "Compara el agua antes y después del punto de interés. El aspecto visual por sí solo no demuestra la causa de una diferencia.", icon: Waves, scene: "river", tag: "OBSERVACIÓN" },
  { id: 2, label: "TRABAJO DE CAMPO", title: "Muestras etiquetadas", description: "Revisa cómo se recolectaron las muestras. Una comparación válida requiere identificar el lugar y mantener un procedimiento consistente.", icon: FlaskConical, scene: "samples", tag: "MÉTODO" },
  { id: 3, label: "ANÁLISIS", title: "Resultados del laboratorio", description: "Contrasta las mediciones y sus unidades antes de formular una conclusión. Los datos deben respaldar lo que afirmas.", icon: Microscope, scene: "lab", tag: "DATOS" },
  { id: 4, label: "ECOSISTEMA", title: "Vida bajo el agua", description: "Relaciona las condiciones del agua con los organismos observados, sin confundir una correlación con una causa demostrada.", icon: Leaf, scene: "ecosystem", tag: "CONTEXTO" },
];

function EvidenceArtwork({ scene }: { scene: string }) {
  if (scene === "river") return (
    <div className="relative h-full min-h-24 overflow-hidden bg-[linear-gradient(180deg,#7ba8a2_0%,#d3c7a0_42%,#456d5e_43%,#1b4e4b_100%)]">
      <div className="absolute inset-x-0 top-[35%] h-4 bg-white/20 blur-sm" />
      <div className="absolute -left-4 bottom-0 h-14 w-28 -rotate-6 rounded-t-[50%] bg-[#24483c]" />
      <div className="absolute -right-5 bottom-0 h-16 w-32 rotate-6 rounded-t-[50%] bg-[#344f3d]" />
      <div className="absolute left-[42%] top-[53%] h-1 w-20 rotate-3 bg-[#a8c8bb]/70" />
      <span className="absolute left-2 top-2 border border-white/40 bg-[#102722]/70 px-2 py-1 text-[8px] font-black tracking-widest text-white">ZONA A / B</span>
    </div>
  );
  if (scene === "samples") return (
    <div className="relative flex h-full min-h-24 items-end justify-center gap-3 overflow-hidden bg-[linear-gradient(145deg,#213a3c,#101b25)] pb-3">
      {[["#8dc9b5", "A1"], ["#c1a86e", "B2"], ["#4e9e9a", "C3"]].map(([color, label]) => (
        <div key={label} className="relative h-14 w-7 rounded-b-lg border border-white/45 bg-white/10 shadow-lg">
          <div className="absolute inset-x-0 bottom-0 h-[58%] rounded-b-md opacity-90" style={{ background: color }} />
          <div className="absolute -top-2 left-1/2 h-3 w-4 -translate-x-1/2 rounded-t-sm border border-white/50 bg-[#b8c3bd]" />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-white">{label}</span>
        </div>
      ))}
      <div className="absolute right-2 top-2 rotate-[-8deg] border border-[#d7ba7b]/60 bg-[#29251a] px-2 py-1 text-[8px] text-[#f1d69b]">REGISTRO</div>
    </div>
  );
  if (scene === "lab") return (
    <div className="relative h-full min-h-24 overflow-hidden bg-[linear-gradient(145deg,#1a2c38,#101720)] p-3">
      <div className="absolute bottom-3 left-3 right-3 top-4 border border-[#82c5b8]/35 bg-[#dbe5d9]/95 p-2">
        <div className="flex h-full items-end justify-around gap-2 border-b border-l border-[#45605b] px-2 pb-1">
          {[32, 58, 43, 76, 64].map((height, index) => <div key={index} className="w-[13%] rounded-t-sm bg-[#428d82]" style={{ height: height + "%" }} />)}
        </div>
      </div>
      <span className="absolute right-3 top-1 text-[8px] font-black tracking-widest text-[#a7d8d0]">REPORTE 04</span>
    </div>
  );
  return (
    <div className="relative h-full min-h-24 overflow-hidden bg-[linear-gradient(180deg,#3e7f79,#183e42_58%,#112a32)]">
      <div className="absolute left-0 right-0 top-[40%] h-px bg-[#b1d9bb]/50" />
      {[0, 1, 2, 3, 4].map((n) => <div key={n} className="absolute bottom-2" style={{ left: (10 + n * 18) + "%", transform: "rotate(" + (n % 2 ? 14 : -12) + "deg)" }}><Leaf className="h-7 w-7 text-[#9ecb91]" /></div>)}
      <div className="absolute right-5 top-5 h-2 w-7 rounded-full bg-[#d7c48b] shadow-[0_0_12px_#d7c48b]" />
      <div className="absolute left-3 top-2 text-[8px] font-black tracking-widest text-[#d3e8d7]">ECOSISTEMA</div>
    </div>
  );
}

export default function CasoCeroScene() {
  const [selected, setSelected] = useState<number | null>(null);
  const active = evidence.find((item) => item.id === selected);
  return (
    <div className="relative min-h-[340px] overflow-hidden border-t border-[#55452e] bg-[#09151b] p-3 sm:p-5 lg:border-l lg:border-t-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,rgba(51,132,124,.26),transparent_55%),radial-gradient(ellipse_at_90%_95%,rgba(196,130,53,.18),transparent_45%)]" />
      <div className="relative flex items-center justify-between gap-2">
        <div><p className="text-[8px] font-black uppercase tracking-[.22em] text-[#8fcac0]">Laboratorio de campo</p><h2 className="mt-1 text-sm font-black text-[#f5e7cc] sm:text-base">Tendedero de evidencias</h2></div>
        <span className="border border-[#6d5938] bg-[#211b12] px-2 py-1 text-[8px] font-black tracking-widest text-[#edc77f]">ARCHIVO 001</span>
      </div>
      <div className="relative mt-5 pb-2">
        <div className="absolute left-2 right-2 top-2 h-[3px] rotate-[-2deg] bg-[#bd8c4d] shadow-[0_2px_3px_#000]" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {evidence.map((item, index) => {
            const Icon = item.icon;
            const isSelected = selected === item.id;
            return (
              <button key={item.id} type="button" aria-label={"Investigar evidencia: " + item.title} aria-pressed={isSelected} onClick={() => setSelected(isSelected ? null : item.id)} className={"group relative min-w-0 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca7b] " + (isSelected ? "-translate-y-1 scale-[1.02]" : "hover:-translate-y-1")}>
                <span className={"absolute -top-1 left-1/2 z-10 h-4 w-2 -translate-x-1/2 rounded-sm border border-[#d7b06b] bg-[#8e6535] shadow-sm transition " + (isSelected ? "rotate-12" : "")} />
                <div className={"border-[3px] bg-[#e7ddc5] p-1.5 shadow-[3px_4px_0_#02080b,0_8px_18px_#0006] transition group-hover:rotate-0 " + (index % 2 ? "rotate-[1.5deg]" : "rotate-[-1deg]") + " " + (isSelected ? "border-[#f0c16b]" : "border-[#b7a889]")}>
                  <div className="h-[78px] overflow-hidden sm:h-[92px]"><EvidenceArtwork scene={item.scene} /></div>
                  <div className="flex items-center justify-between gap-1 px-1 pb-1 pt-2 text-[#28322f]"><span className="truncate text-[8px] font-black tracking-[.08em]">{item.label}</span><Icon className="h-3 w-3 shrink-0" /></div>
                </div>
                {isSelected && <span className="absolute -right-1 -top-2 grid h-5 w-5 place-items-center rounded-full border border-[#c7eddb] bg-[#286b51] text-white shadow"><Check className="h-3 w-3" /></span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative mt-4 border border-[#354b4e] bg-[#0d2025]/95 p-3 shadow-[3px_3px_0_#03080b]">
        {active ? (
          <div key={active.id} className="transition duration-200">
            <div className="flex items-start gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center border border-[#6b8d83] bg-[#183b3b] text-[#a8e0d1]"><active.icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-[8px] font-black tracking-[.18em] text-[#e7bb70]">{active.tag} · PISTA {String(active.id).padStart(2, "0")}</p><h3 className="mt-1 text-xs font-black text-[#f2e6cf]">{active.title}</h3></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar evidencia" className="grid h-7 w-7 shrink-0 place-items-center border border-[#455b5b] text-[#d1ded9] hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-[#b9cbc9]">{active.description}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d4b16f] bg-[#1c2a28] text-[#f0c97f]"><Search className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#e5bd76]">Selecciona una fotografía</p><p className="mt-1 text-[10px] leading-4 text-[#9eb5b4]">Toca una evidencia para abrir su ficha de análisis.</p></div><ChevronRight className="h-4 w-4 shrink-0 text-[#8cb9b0]" /></div>
        )}
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-[#34494a] pt-3">
        <div className="flex items-center gap-2 text-[9px] text-[#a9beb9]"><Microscope className="h-4 w-4 text-[#d9ad65]" /> OBSERVAR · COMPARAR · CONCLUIR</div>
        <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest text-[#d8b36f]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8bc7b9]" /> EN INVESTIGACIÓN</div>
      </div>
    </div>
  );
}
