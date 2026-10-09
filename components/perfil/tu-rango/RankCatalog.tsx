"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import RankCard, { type RankCardData } from "./RankCard";

const RANKS: RankCardData[] = [
  {
    id: "renacer",
    name: "Renacer",
    image: "/images/ranks/renacer.webp",
    requirement: "Comienza tu camino",
    unlocked: true,
    current: true,
  },
  {
    id: "aprendiz",
    name: "Aprendiz",
    image: "/images/ranks/aprendiz.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "explorador",
    name: "Explorador",
    image: "/images/ranks/explorador.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "competidor",
    name: "Competidor",
    image: "/images/ranks/competidor.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "avanzado",
    name: "Avanzado",
    image: "/images/ranks/avanzado.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "elite",
    name: "Élite",
    image: "/images/ranks/elite.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "maestro",
    name: "Maestro",
    image: "/images/ranks/maestro.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "gran-maestro",
    name: "Gran Maestro",
    image: "/images/ranks/gran-maestro.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "leyenda",
    name: "Leyenda",
    image: "/images/ranks/leyenda.webp",
    requirement: "Requisito por definir",
    unlocked: false,
  },
  {
    id: "peak",
    name: "Peak",
    image: "/images/ranks/peak.webp",
    requirement: "La cima de PeakScore",
    unlocked: false,
  },
];

type RankCatalogProps = {
  open: boolean;
  onClose: () => void;
  currentRankId?: string;
  currentSeasonXP?: number;
  unlockedRankIds?: string[];
};

export default function RankCatalog({
  open,
  onClose,
  currentRankId = "renacer",
  currentSeasonXP = 0,
  unlockedRankIds = ["renacer"],
}: RankCatalogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const ranks = RANKS.map((rank) => ({
    ...rank,
    unlocked: unlockedRankIds.includes(rank.id),
    current: rank.id === currentRankId,
    requirement:
      rank.id === currentRankId
        ? `${currentSeasonXP.toLocaleString("es-CO")} XP de temporada`
        : rank.requirement,
  }));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rank-catalog-title"
        className="relative flex max-h-[90dvh] w-full max-w-[850px] flex-col overflow-hidden rounded-2xl border border-violet-300/20 bg-[#080612] text-white shadow-[0_0_70px_rgba(109,40,217,0.2)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-violet-950/60 to-[#080612] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300/70">
              PeakScore · Progresión
            </p>
            <h2
              id="rank-catalog-title"
              className="mt-1 text-xl font-black uppercase tracking-wider sm:text-2xl"
            >
              Todos los rangos
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Cada rango representa un paso hacia la cima.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar catálogo de rangos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <X size={19} />
          </button>
        </header>

        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-white/55">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Desbloqueado
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white/25" />
              Bloqueado
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ranks.map((rank) => (
              <RankCard key={rank.id} rank={rank} />
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/10 px-5 py-3 text-center text-[10px] text-white/40">
          Sigue acumulando experiencia para avanzar en PeakScore.
        </footer>
      </section>
    </div>
  );
}
