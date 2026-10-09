"use client";

import Image from "next/image";
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export type RankCardData = {
  id: string;
  name: string;
  image: string;
  requirement: string;
  unlocked: boolean;
  current?: boolean;
};

type RankCardProps = {
  rank: RankCardData;
  onSelect?: (rank: RankCardData) => void;
};

export default function RankCard({ rank, onSelect }: RankCardProps) {
  const locked = !rank.unlocked;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(rank)}
      aria-label={`${rank.name}${locked ? ", bloqueado" : ", desbloqueado"}`}
      className={`${pixelFont.className} group relative flex min-h-[190px] w-full flex-col items-center overflow-hidden rounded-xl border p-3 text-center transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
        rank.current
          ? "border-violet-300/80 bg-violet-950/60 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          : "border-white/10 bg-[#0b0918]/85 hover:border-violet-300/40 hover:bg-violet-950/30"
      }`}
    >
      {rank.current && (
        <span className="absolute left-2 top-2 border border-violet-300/30 bg-violet-400/15 px-2 py-1 text-[6px] text-violet-200">
          ACTUAL
        </span>
      )}

      <div className="relative mt-3 h-[104px] w-[104px] shrink-0">
        <Image
          src={rank.image}
          alt={`Rango ${rank.name}`}
          fill
          sizes="104px"
          className={`object-contain transition duration-500 ${
            locked
              ? "scale-95 grayscale brightness-[0.45] group-hover:brightness-[0.6]"
              : "drop-shadow-[0_0_10px_rgba(167,139,250,0.2)] group-hover:scale-105"
          }`}
        />

        {locked && (
          <>
            <div className="absolute inset-0 rounded-full bg-black/15" />

            <Image
              src="/images/ranks/ui/rank-lock.webp"
              alt="Bloqueado"
              fill
              sizes="104px"
              className="z-10 scale-[0.38] object-contain drop-shadow-lg"
            />
          </>
        )}
      </div>

      <h3 className="mt-2 break-words text-[8px] leading-relaxed text-white">
        {rank.name.toUpperCase()}
      </h3>

      <p className="mt-2 text-[6px] leading-relaxed text-white/60">
        {rank.requirement}
      </p>

      <span
        className={`mt-3 px-2 py-2 text-[6px] ${
          locked
            ? "border border-white/10 bg-white/5 text-white/45"
            : "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
        }`}
      >
        {locked ? "BLOQUEADO" : "DESBLOQUEADO"}
      </span>
    </button>
  );
}