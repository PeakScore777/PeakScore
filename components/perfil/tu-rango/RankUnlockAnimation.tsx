"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type RankUnlockAnimationProps = {
  rankName: string;
  rankImage: string;
  lockedImage?: string;
  active: boolean;
  onComplete?: () => void;
};

export default function RankUnlockAnimation({
  rankName,
  rankImage,
  lockedImage = "/images/ranks/ui/rank-lock.webp",
  active,
  onComplete,
}: RankUnlockAnimationProps) {
  const [phase, setPhase] = useState<"locked" | "unlocking" | "revealed">(
    "locked",
  );

  useEffect(() => {
    if (!active) {
      setPhase("locked");
      return;
    }

    setPhase("unlocking");

    const revealTimer = window.setTimeout(() => {
      setPhase("revealed");
    }, 1200);

    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, 2200);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
    };
  }, [active, onComplete]);

  return (
    <div
      className={`relative isolate flex min-h-[230px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-violet-300/20 bg-[#080612] p-5 text-center text-white ${
        phase === "revealed" ? "rank-unlock-celebration" : ""
      }`}
      aria-live="polite"
    >
      <style jsx>{`
        .rank-unlock-celebration::before {
          content: "";
          position: absolute;
          inset: -50%;
          z-index: -1;
          pointer-events: none;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(167, 139, 250, 0.2),
            transparent 35%
          );
          animation: rank-shine 3s linear infinite;
        }

        @keyframes rank-shine {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rank-reveal {
          0% {
            transform: scale(0.72);
            filter: grayscale(1) brightness(0.5);
          }
          65% {
            transform: scale(1.12);
            filter: grayscale(0) brightness(1.5);
          }
          100% {
            transform: scale(1);
            filter: grayscale(0) brightness(1);
          }
        }

        @keyframes lock-disappear {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          45% {
            opacity: 1;
            transform: scale(1.12) rotate(-8deg);
          }
          100% {
            opacity: 0;
            transform: scale(1.8) rotate(14deg);
          }
        }

        .rank-emblem-reveal {
          animation: rank-reveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .rank-lock-disappear {
          animation: lock-disappear 0.8s ease-in forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .rank-unlock-celebration::before,
          .rank-emblem-reveal,
          .rank-lock-disappear {
            animation: none;
          }
        }
      `}</style>

      <div className="relative h-32 w-32">
        <Image
          src={rankImage}
          alt={`Rango ${rankName}`}
          fill
          sizes="128px"
          className={`object-contain ${
            phase === "revealed"
              ? "rank-emblem-reveal"
              : phase === "unlocking"
                ? "grayscale brightness-50"
                : "grayscale brightness-50"
          }`}
        />

        {phase !== "revealed" && (
          <Image
            src={lockedImage}
            alt="Candado del rango"
            fill
            sizes="128px"
            className={`z-10 scale-[0.42] object-contain drop-shadow-lg ${
              phase === "unlocking" ? "rank-lock-disappear" : ""
            }`}
          />
        )}
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
        {phase === "locked"
          ? "Rango bloqueado"
          : phase === "unlocking"
            ? "Desbloqueando..."
            : "¡Nuevo rango!"}
      </p>

      <h3 className="mt-1 text-xl font-black uppercase tracking-wide">
        {rankName}
      </h3>

      {phase === "revealed" && (
        <p className="mt-2 text-sm font-semibold text-emerald-200">
          ¡Has alcanzado un nuevo rango!
        </p>
      )}
    </div>
  );
}
