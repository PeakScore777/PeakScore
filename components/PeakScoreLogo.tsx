"use client";

import Image from "next/image";

type PeakScoreLogoProps = {
  variant?: "light" | "dark";
  showTagline?: boolean;
  compact?: boolean;
  symbolOnly?: boolean;
  className?: string;
};

export default function PeakScoreLogo({
  variant = "dark",
  compact = false,
  symbolOnly = false,
  className = "",
}: PeakScoreLogoProps) {
  const textColor =
    variant === "dark"
      ? "text-slate-950"
      : "text-white";

  /*
   * ==========================================================
   * SOLO SÍMBOLO
   * ==========================================================
   */

  if (symbolOnly) {
    return (
      <div
        className={`relative shrink-0 ${
          compact
            ? "h-7 w-7"
            : "h-14 w-14"
        } ${className}`}
      >
        <Image
          src="/images/branding/peakscore-logo-transparente.png"
          alt="PeakScore"
          fill
          priority
          sizes={compact ? "28px" : "56px"}
          className="object-contain"
        />
      </div>
    );
  }

  /*
   * ==========================================================
   * LOGO COMPLETO
   * ==========================================================
   */

  return (
    <div
      className={`flex items-center ${
        compact
          ? "gap-1.5"
          : "gap-3"
      } ${className}`}
    >
      {/* =====================================================
          SÍMBOLO OFICIAL
      ====================================================== */}

      <div
        className={`relative shrink-0 ${
          compact
            ? "h-7 w-7"
            : "h-14 w-14"
        }`}
      >
        <Image
          src="/images/branding/peakscore-logo-transparente.png"
          alt="PeakScore"
          fill
          priority
          sizes={compact ? "28px" : "56px"}
          className="object-contain"
        />
      </div>

      {/* =====================================================
          NOMBRE
      ====================================================== */}

      <span
        className={`font-extrabold tracking-[-0.045em] ${textColor} ${
          compact
            ? "text-[13px]"
            : "text-[23px]"
        }`}
      >
        PeakScore
      </span>
    </div>
  );
}