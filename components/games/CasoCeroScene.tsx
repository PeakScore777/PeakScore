"use client";

import { useState } from "react";
import {
  FlaskConical,
  Microscope,
  Waves,
  Leaf,
  Search,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import CasoCeroAmbientBackdrop from "@/components/games/CasoCeroAmbientBackdrop";

type EvidenceItem = {
  id: number;
  label: string;
  title: string;
  description: string;
  icon: typeof Waves;
  scene: "river" | "samples" | "lab" | "ecosystem";
  tag: string;
};

const evidence: EvidenceItem[] = [
  {
    id: 1,
    label: "PUNTO DE MUESTREO",
    title: "Dos zonas del río",
    description:
      "Compara el agua antes y después del punto de interés. El aspecto visual por sí solo no demuestra la causa de una diferencia.",
    icon: Waves,
    scene: "river",
    tag: "OBSERVACIÓN",
  },
  {
    id: 2,
    label: "TRABAJO DE CAMPO",
    title: "Muestras etiquetadas",
    description:
      "Revisa cómo se recolectaron las muestras. Una comparación válida requiere identificar el lugar y mantener un procedimiento consistente.",
    icon: FlaskConical,
    scene: "samples",
    tag: "MÉTODO",
  },
  {
    id: 3,
    label: "ANÁLISIS",
    title: "Resultados del laboratorio",
    description:
      "Contrasta las mediciones y sus unidades antes de formular una conclusión. Los datos deben respaldar lo que afirmas.",
    icon: Microscope,
    scene: "lab",
    tag: "DATOS",
  },
  {
    id: 4,
    label: "ECOSISTEMA",
    title: "Vida bajo el agua",
    description:
      "Relaciona las condiciones del agua con los organismos observados, sin confundir una correlación con una causa demostrada.",
    icon: Leaf,
    scene: "ecosystem",
    tag: "CONTEXTO",
  },
];

function EvidenceArtwork({ scene }: { scene: EvidenceItem["scene"] }) {
  if (scene === "river") {
    return (
      <div className="relative h-full min-h-16 overflow-hidden bg-[linear-gradient(180deg,#a5b9bc_0%,#607f7c_37%,#315348_38%,#102e30_100%)]">
        <div className="absolute inset-x-0 top-[42%] h-2 bg-white/30 blur-sm" />
        <div className="absolute -left-3 bottom-0 h-10 w-24 -rotate-6 rounded-t-[50%] bg-[#263e32]" />
        <div className="absolute -right-4 bottom-0 h-12 w-28 rotate-6 rounded-t-[50%] bg-[#1b3833]" />
        <div className="absolute left-[38%] top-[56%] h-px w-14 rotate-3 bg-[#c6ddd4]/80" />
        <span className="absolute left-1.5 top-1.5 border border-white/50 bg-[#102722]/80 px-1.5 py-0.5 text-[7px] font-black tracking-wider text-white">ZONA A / B</span>
      </div>
    );
  }

  if (scene === "samples") {
    return (
      <div className="relative flex h-full min-h-16 items-end justify-center gap-3 overflow-hidden bg-[linear-gradient(145deg,#33494a,#0d1921)] pb-2">
        {[["#c5d8ca", "A1"], ["#b4a16f", "B2"], ["#538d82", "C3"]].map(([color, label]) => (
          <div key={label} className="relative h-12 w-6 rounded-b-md border border-white/50 bg-white/15 shadow-lg">
            <div className="absolute inset-x-0 bottom-0 h-[58%] rounded-b-sm opacity-90" style={{ background: color }} />
            <div className="absolute -top-1.5 left-1/2 h-2.5 w-3.5 -translate-x-1/2 rounded-t-sm border border-white/50 bg-[#c0c9c2]" />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[6px] font-black text-white">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (scene === "lab") {
    return (
      <div className="relative h-full min-h-16 overflow-hidden bg-[linear-gradient(145deg,#263943,#0c141d)] p-2">
        <div className="absolute bottom-2 left-2 right-2 top-2 border border-[#82c5b8]/45 bg-[#dbe5d9]/95 p-1.5">
          <div className="flex h-full items-end justify-around gap-1 border-b border-l border-[#45605b] px-1 pb-1">
            {[32, 58, 43, 76, 64].map((height, index) => (
              <div key={index} className="w-[13%] rounded-t-sm bg-[#428d82]" style={{ height: height + "%" }} />
            ))}
          </div>
        </div>
        <span className="absolute right-2 top-1 text-[6px] font-black tracking-widest text-[#a7d8d0]">REPORTE 04</span>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-16 overflow-hidden bg-[linear-gradient(180deg,#3e7f79,#183e42_58%,#112a32)]">
      <div className="absolute left-0 right-0 top-[40%] h-px bg-[#b1d9bb]/50" />
      {[0, 1, 2, 3, 4].map((n) => (
        <div key={n} className="absolute bottom-2" style={{ left: 10 + n * 18 + "%", transform: "rotate(" + (n % 2 ? 14 : -12) + "deg)" }}>
          <Leaf className="h-6 w-6 text-[#9ecb91]" />
        </div>
      ))}
      <span className="absolute left-2 top-1 text-[7px] font-black tracking-widest text-[#d3e8d7]">ECOSISTEMA</span>
    </div>
  );
}

function EvidenceCard({
  item,
  selected,
  onSelect,
  compact = false,
}: {
  item: EvidenceItem;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-label={"Investigar evidencia: " + item.title}
      aria-pressed={selected}
      onClick={onSelect}
      className={
        "group relative min-w-0 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca7b] " +
        (selected ? "-translate-y-1 scale-[1.025]" : "hover:-translate-y-1") +
        (compact ? " w-full" : "")
      }
    >
      <span className={"absolute -top-1 left-1/2 z-10 h-4 w-2 -translate-x-1/2 rounded-sm border border-[#d7b06b] bg-[#8e6535] shadow-sm transition " + (selected ? "rotate-12" : "")} />
      <div className={"border-[3px] bg-[#e7ddc5] p-1.5 shadow-[3px_4px_0_#02080b,0_8px_18px_#0006] transition group-hover:rotate-0 " + (selected ? "border-[#f0c16b]" : "border-[#b7a889]")}>
        <div className={compact ? "h-24 overflow-hidden" : "h-[clamp(64px,8.5vw,112px)] overflow-hidden"}>
          <EvidenceArtwork scene={item.scene} />
        </div>
        <div className="flex items-center justify-between gap-1 px-1 pb-1 pt-2 text-[#28322f]">
          <span className="truncate text-[7px] font-black tracking-[.04em] sm:text-[8px]">{item.label}</span>
          <Icon className="h-3 w-3 shrink-0" />
        </div>
      </div>
      {selected && (
        <span className="absolute -right-1 -top-2 grid h-5 w-5 place-items-center rounded-full border border-[#c7eddb] bg-[#286b51] text-white shadow">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

function EvidenceDetails({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  const Icon = item.icon;
  return (
    <div className="border border-[#6b5940] bg-[#0b171c]/95 p-3 shadow-[3px_3px_0_#03080b] backdrop-blur-sm sm:p-4">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center border border-[#6b8d83] bg-[#183b3b] text-[#a8e0d1]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-black tracking-[.18em] text-[#e7bb70]">{item.tag} · PISTA {String(item.id).padStart(2, "0")}</p>
          <h3 className="mt-1 text-xs font-black text-[#f2e6cf] sm:text-sm">{item.title}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar evidencia" className="grid h-7 w-7 shrink-0 place-items-center border border-[#455b5b] text-[#d1ded9] hover:bg-white/10">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-5 text-[#c4d1cf] sm:text-xs">{item.description}</p>
    </div>
  );
}

export default function CasoCeroScene() {
  const [selected, setSelected] = useState<number | null>(null);
  const active = evidence.find((item) => item.id === selected);

  return (
    <section aria-label="Escena de investigación Caso Cero" className="relative isolate overflow-hidden border-y border-[#705638] bg-[#081116] text-white shadow-[0_16px_60px_rgba(0,0,0,.35)]">
      <div className="relative h-[clamp(365px,56.25vw,720px)] overflow-hidden">
        <CasoCeroAmbientBackdrop />

        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(2,7,11,.22)_0%,transparent_36%,rgba(2,7,11,.12)_64%,rgba(2,7,11,.58)_100%)]" />

        <div className="absolute left-[31%] right-[16%] top-[5%] z-10">
          <p className="text-[7px] font-black uppercase tracking-[.25em] text-[#a3d0c6] drop-shadow sm:text-[9px]">Laboratorio de campo · Archivo 001</p>
          <h2 className="mt-1 text-xs font-black uppercase tracking-[.08em] text-[#f7e8ca] drop-shadow-[0_2px_5px_rgba(0,0,0,.9)] sm:text-lg lg:text-xl">El misterio del río</h2>
        </div>

        <div className="pointer-events-none absolute left-[31%] right-[16%] top-[20%] z-[2] hidden h-[3px] rotate-[-1deg] bg-[#9d7040] shadow-[0_2px_4px_#000] sm:block">
          <span className="absolute inset-0 bg-gradient-to-b from-[#e0b779] via-[#8a5e31] to-[#382315]" />
        </div>

        <div className="absolute left-[31%] right-[16%] top-[21%] z-10 hidden grid-cols-4 gap-[1.5%] sm:grid">
          {evidence.map((item, index) => (
            <div key={item.id} className={index % 2 ? "rotate-[1.2deg]" : "rotate-[-1.2deg]"}>
              <EvidenceCard item={item} selected={selected === item.id} onSelect={() => setSelected(selected === item.id ? null : item.id)} />
            </div>
          ))}
        </div>

        {active && (
          <div className="absolute bottom-[3%] left-[31%] right-[16%] z-20 hidden sm:block">
            <EvidenceDetails item={active} onClose={() => setSelected(null)} />
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 border border-[#c5a26d]/45 bg-[#071016]/70 px-2.5 py-1.5 text-[8px] font-black tracking-widest text-[#e8d6b6] backdrop-blur-sm sm:bottom-5 sm:left-5 sm:text-[9px]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#82cbb6]" />
          OBSERVAR · COMPARAR · CONCLUIR
        </div>
      </div>

      <div className="relative z-10 border-t border-[#55442d] bg-[#080f13]/95 p-3 sm:hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#8fcac0]">Tendedero de evidencias</p>
            <p className="mt-1 text-[10px] text-[#d7dfdb]">Toca una foto para examinar la pista.</p>
          </div>
          <span className="border border-[#6d5938] bg-[#211b12] px-2 py-1 text-[8px] font-black tracking-widest text-[#edc77f]">4 PISTAS</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {evidence.map((item) => (
            <EvidenceCard key={item.id} item={item} compact selected={selected === item.id} onSelect={() => setSelected(selected === item.id ? null : item.id)} />
          ))}
        </div>
        {active && <div className="mt-3"><EvidenceDetails item={active} onClose={() => setSelected(null)} /></div>}
      </div>
    </section>
  );
}
