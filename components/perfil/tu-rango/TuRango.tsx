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
        className={`${pixelFont.className} relative isolate mt-5 w-full overflow-hidden rounded-2xl border border-indigo-400/25 bg-[#080719] text-white shadow-[0_0_35px_rgba(76,29,149,0.16)]`}
      >
        {/* Fondo espacial */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/profile/rank/tu-rango-bg.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover object-center"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#05030b]/55 via-transparent to-[#05030b]/55" />

        {/* Encabezado */}
        <header className="relative z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-[#080719]/70 px-3 py-3 backdrop-blur-sm sm:px-4">
          <div className="min-w-0">
            <p className="text-[7px] leading-relaxed text-cyan-200/90 sm:text-[8px]">
              SISTEMA DE ASCENSO
            </p>

            <h2 className="mt-2 text-[13px] leading-relaxed sm:text-[15px]">
              TU RANGO
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="shrink-0 border-2 border-violet-300/40 bg-violet-950/85 px-2 py-3 text-[7px] text-white transition-colors hover:border-cyan-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:px-3 sm:text-[8px]"
          >
            <span className="flex items-center gap-2">
              EXPLORAR RANGOS
              <span aria-hidden="true" className="text-cyan-200">
                ↗
              </span>
            </span>
          </button>
        </header>

        {/* Bioma */}
        <div className="relative h-[480px] sm:h-[510px]">
          {/* Panel extendido hasta los laterales del bioma */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 border-2 border-white/10 bg-[#080612]/95 px-3 py-4 pb-5 shadow-[3px_3px_0_rgba(0,0,0,0.35)] backdrop-blur-sm sm:gap-4 sm:px-5">
            {/* Emblema del rango */}
            <div className="relative h-[136px] w-[136px] shrink-0 sm:h-[148px] sm:w-[148px]">
              <div className="absolute inset-3 rounded-full bg-violet-500/25 blur-xl" />

              <Image
                src={rankImage}
                alt={`Emblema del rango ${rankName}`}
                fill
                sizes="112px"
                className="object-contain drop-shadow-[0_0_10px_rgba(167,139,250,0.4)]"
              />
            </div>

            {/* Datos del rango actual */}
            <div className="min-w-0 flex-1 py-1">
              <p className="text-[7px] leading-[1.9] text-indigo-200 sm:text-[8px]">
                RANGO ACTUAL
              </p>

              <h3 className="mt-2 break-words text-[11px] leading-[1.8] sm:text-[13px]">
                {rankName.toUpperCase()}
              </h3>

              <p className="mt-2 text-[6px] leading-[1.9] text-white/70 sm:text-[7px]">
                EXPERIENCIA DE TEMPORADA
              </p>

              <p className="mt-2 text-[10px] leading-[1.8] text-cyan-200 sm:text-[12px]">
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