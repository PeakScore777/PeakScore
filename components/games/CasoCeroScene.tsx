"use client";

import { useState } from "react";
import {
  FlaskConical,
  Microscope,
  Waves,
  Leaf,
  Check,
  X,
} from "lucide-react";
import CasoCeroAmbientBackdrop from "@/components/games/CasoCeroAmbientBackdrop";

type EvidenceItem = {
  id: number;
  label: string;
  title: string;
  description: string;
  image: string;
  photographerPage: string;
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
    image: "https://images.pexels.com/videos/5157996/pexels-photo-5157996.jpeg?auto=compress&cs=tinysrgb&w=1000",
    photographerPage: "https://www.pexels.com/video/flowing-river-while-raining-5157996/",
    scene: "river",
    icon: Waves,
    tag: "OBSERVACIÓN",
  },
  {
    id: 2,
    label: "TRABAJO DE CAMPO",
    title: "Muestras etiquetadas",
    description:
      "Revisa cómo se recolectaron las muestras. Una comparación válida requiere identificar el lugar y mantener un procedimiento consistente.",
    image: "https://images.pexels.com/photos/20806050/pexels-photo-20806050.jpeg?auto=compress&cs=tinysrgb&w=1000",
    photographerPage: "https://www.pexels.com/photo/collecting-water-into-a-plastic-bottle-from-the-spring-20806050/",
    scene: "samples",
    icon: FlaskConical,
    tag: "MÉTODO",
  },
  {
    id: 3,
    label: "ANÁLISIS",
    title: "Resultados del laboratorio",
    description:
      "Contrasta las mediciones y sus unidades antes de formular una conclusión. Los datos deben respaldar lo que afirmas.",
    image: "https://images.pexels.com/photos/8850985/pexels-photo-8850985.jpeg?auto=compress&cs=tinysrgb&w=1000",
    photographerPage: "https://www.pexels.com/photo/person-holding-a-dropper-experimenting-chemical-on-a-glass-bottle-8850985/",
    scene: "lab",
    icon: Microscope,
    tag: "DATOS",
  },
  {
    id: 4,
    label: "ECOSISTEMA",
    title: "Vida bajo el agua",
    description:
      "Relaciona las condiciones del agua con los organismos observados, sin confundir una correlación con una causa demostrada.",
    image: "https://images.pexels.com/photos/9170405/pexels-photo-9170405.jpeg?auto=compress&cs=tinysrgb&w=1000",
    photographerPage: "https://www.pexels.com/photo/beige-photo-of-a-fish-and-stones-in-water-9170405/",
    scene: "ecosystem",
    icon: Leaf,
    tag: "CONTEXTO",
  },
];

function EvidenceArtwork({ item }: { item: EvidenceItem }) {
  return (
    <div
      role="img"
      aria-label={item.title}
      className={"caso-cero-evidence-photo h-full w-full bg-[#13272b] bg-cover bg-center " + (item.scene === "river" ? "caso-cero-evidence-river" : "")}
      style={{ backgroundImage: "linear-gradient(135deg, rgba(5, 17, 22, .12), rgba(3, 8, 12, .24)), url('" + item.image + "')" }}
    >
      <div className="h-full w-full bg-gradient-to-t from-[#071016]/30 via-transparent to-white/[0.04]" />
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
      <span className={"absolute -top-1 left-1/2 z-10 h-5 w-2 -translate-x-1/2 rounded-sm border border-[#d7b06b] bg-[#8e6535] shadow-sm transition " + (selected ? "rotate-12" : "")} />
      <div className={"border-[3px] bg-[#e7ddc5] p-2 shadow-[3px_4px_0_#02080b,0_12px_24px_#0008] transition group-hover:rotate-0 " + (selected ? "border-[#f0c16b]" : "border-[#b7a889]")}>
        <div className="aspect-[3/2] overflow-hidden bg-[#13272b]">
          <EvidenceArtwork item={item} />
        </div>
        <div className="flex items-center justify-between gap-1 px-1 pb-1 pt-2 text-[#28322f]">
          <span className="truncate text-[9px] font-black tracking-[.02em] sm:text-[10px]">{item.label}</span>
          <Icon className="h-4 w-4 shrink-0" />
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
    <div className="border border-[#6b5940]/90 bg-[#071116]/95 p-4 shadow-[0_8px_28px_rgba(0,0,0,.4)] backdrop-blur-md sm:p-5">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center border border-[#6b8d83] bg-[#183b3b] text-[#a8e0d1]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black tracking-[.16em] text-[#e7bb70]">{item.tag} · PISTA {String(item.id).padStart(2, "0")}</p>
          <h3 className="mt-1 text-sm font-black text-[#f2e6cf] sm:text-base">{item.title}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar evidencia" className="grid h-7 w-7 shrink-0 place-items-center border border-[#455b5b] text-[#d1ded9] hover:bg-white/10">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#c4d1cf] sm:text-sm">{item.description}</p>
    </div>
  );
}

export default function CasoCeroScene() {
  const [selected, setSelected] = useState<number | null>(null);
  const active = evidence.find((item) => item.id === selected);

  return (
    <section aria-label="Escena de investigación Caso Cero" className="caso-cero-scene relative isolate overflow-hidden border-y border-[#705638] bg-[#081116] text-white shadow-[0_16px_60px_rgba(0,0,0,.42)]">
      <div className="relative aspect-[16/9] w-full max-h-[720px] overflow-hidden">
        <CasoCeroAmbientBackdrop />

        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(2,7,11,.22)_0%,transparent_36%,rgba(2,7,11,.12)_64%,rgba(2,7,11,.58)_100%)]" />

        <div className="absolute left-[39%] right-[4%] top-[5%] z-10">
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a3d0c6] drop-shadow sm:text-[10px]">Laboratorio de campo · Archivo 001</p>
          <h2 className="mt-1 text-base font-black uppercase tracking-[.06em] text-[#f7e8ca] drop-shadow-[0_2px_5px_rgba(0,0,0,.9)] sm:text-xl lg:text-2xl">El misterio del río</h2>
        </div>

        <div className="pointer-events-none absolute left-[39%] right-[4%] top-[23%] z-[2] hidden h-[3px] rotate-[-1deg] bg-[#9d7040] shadow-[0_2px_4px_#000] lg:block">
          <span className="absolute inset-0 bg-gradient-to-b from-[#e0b779] via-[#8a5e31] to-[#382315]" />
        </div>

        <div className="absolute left-[39%] right-[4%] top-[24%] z-10 hidden grid-cols-4 gap-[1.5%] lg:grid">
          {evidence.map((item, index) => (
            <div key={item.id} className={index % 2 ? "rotate-[1.2deg]" : "rotate-[-1.2deg]"}>
              <EvidenceCard item={item} selected={selected === item.id} onSelect={() => setSelected(selected === item.id ? null : item.id)} />
            </div>
          ))}
        </div>

        {active && (
          <div className="absolute bottom-[3%] left-[39%] right-[4%] z-20 hidden lg:block">
            <EvidenceDetails item={active} onClose={() => setSelected(null)} />
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 border border-[#c5a26d]/45 bg-[#071016]/70 px-2.5 py-1.5 text-[8px] font-black tracking-widest text-[#e8d6b6] backdrop-blur-sm sm:bottom-5 sm:left-5 sm:text-[9px]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#82cbb6]" />
          OBSERVAR · COMPARAR · CONCLUIR
        </div>
      </div>

      <div className="relative z-10 border-t border-[#55442d] bg-[#080f13]/95 p-3 lg:hidden">
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
