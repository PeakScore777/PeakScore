"use client";

import Image from "next/image";
import { Press_Start_2P } from "next/font/google";
import { useState } from "react";
import FounderIdle from "./FounderIdle";
import RankCatalog from "./RankCatalog";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

type TuRangoProps = {
  rankId?: string;
  rankName?: string;
  seasonXP?: number;
  unlockedRankIds?: string[];
};

const RANK_IMAGES: Record<string, string> = {
  renacer: "/images/ranks/renacer.webp",
  aprendiz: "/images/ranks/aprendiz.webp",
  explorador: "/images/ranks/explorador.webp",
  competidor: "/images/ranks/competidor.webp",
  avanzado: "/images/ranks/avanzado.webp",
  elite: "/images/ranks/elite.webp",
  maestro: "/images/ranks/maestro.webp",
  "gran-maestro": "/images/ranks/granmaestro.webp",
  leyenda: "/images/ranks/leyenda.webp",
  peak: "/images/ranks/peak.webp",
};

export default function TuRango({
  rankId = "renacer",
  rankName = "Renacer",
  seasonXP = 0,
  unlockedRankIds = ["renacer"],
}: TuRangoProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);

  const rankImage = RANK_IMAGES[rankId] ?? RANK_IMAGES.renacer;
  const formattedXP = Math.max(0, seasonXP).toLocaleString("es-CO");

  return (
    <>
      <section
        className={`${pixelFont.className} relative isolate mt-5 w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-400/25 bg-[#080719] text-white shadow-[0_0_35px_rgba(76,29,149,0.16)]`}
      >
        {/* Encabezado */}
        <header className="relative z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-[#080719]/90 px-2.5 py-3 sm:px-4">
          <div className="min-w-0">
            <p className="text-[6px] leading-[1.9] text-cyan-200/90 sm:text-[8px]">
              SISTEMA DE ASCENSO
            </p>

            <h2 className="mt-2 text-[11px] leading-[1.8] sm:text-[15px]">
              TU RANGO
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="shrink-0 border-2 border-violet-300/40 bg-violet-950/90 px-2 py-2.5 text-[6px] text-white transition-colors hover:border-cyan-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:px-3 sm:py-3 sm:text-[8px]"
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              EXPLORAR RANGOS
              <span aria-hidden="true" className="text-cyan-200">
                ↗
              </span>
            </span>
          </button>
        </header>

        {/* Escenario adaptable: fondo independiente para cada pantalla */}
        <div className="relative isolate h-[560px] overflow-hidden sm:h-[590px] lg:h-[600px]">
          {/* Fondo vertical: móvil */}
          <div className="pointer-events-none absolute inset-0 z-0 sm:hidden">
            <Image
              src="/images/profile/rank/tu-rango-mobile-bg.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-bottom"
            />
          </div>

          {/* Fondo horizontal: tablet y PC */}
          <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
            <Image
              src="/images/profile/rank/tu-rango-desktop-bg.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 620px, 100vw"
              className="object-cover object-bottom"
            />
          </div>

          {/* Oscurece ligeramente el escenario sin ocultar la plataforma */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#05030b]/10 via-transparent to-[#05030b]/10"
          />

          {/* Panel del rango actual */}
          <div className="absolute inset-x-0 top-0 z-[5] flex items-center gap-2 border-2 border-white/10 bg-[#080612]/95 px-2 py-3 shadow-[3px_3px_0_rgba(0,0,0,0.35)] backdrop-blur-sm sm:gap-4 sm:px-4 sm:py-4">
            {/* Emblema */}
            <div className="relative h-[108px] w-[108px] shrink-0 sm:h-[136px] sm:w-[136px]">
              <div className="absolute inset-3 rounded-full bg-violet-500/25 blur-xl" />

              <Image
                src={rankImage}
                alt={`Emblema del rango ${rankName}`}
                fill
                sizes="136px"
                className="object-contain drop-shadow-[0_0_10px_rgba(167,139,250,0.4)]"
              />
            </div>

            {/* Información */}
            <div className="min-w-0 flex-1 py-1">
              <p className="text-[6px] leading-[1.9] text-indigo-200 sm:text-[8px]">
                RANGO ACTUAL
              </p>

              <h3 className="mt-2 break-words text-[10px] leading-[1.8] sm:text-[13px]">
                {rankName.toUpperCase()}
              </h3>

              <p className="mt-2 text-[5px] leading-[1.9] text-white/70 sm:text-[7px]">
                EXPERIENCIA DE TEMPORADA
              </p>

              <p className="mt-2 text-[9px] leading-[1.8] text-cyan-200 sm:text-[12px]">
                {formattedXP} XP
              </p>
            </div>
          </div>

          {/* Fundador y diálogo */}
          <FounderIdle showDialogue dialogueInterval={10000} />
        </div>
      </section>

      {/* Catálogo original */}
      <RankCatalog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        currentRankId={rankId}
        currentSeasonXP={seasonXP}
        unlockedRankIds={unlockedRankIds}
      />
    </>
  );
}