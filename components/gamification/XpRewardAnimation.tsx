"use client";

import { useEffect } from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";

type XpRewardAnimationProps = {
  open: boolean;
  xp: number;
  nextLabel: string;
  onContinue: () => void;
};

export default function XpRewardAnimation({
  open,
  xp,
  nextLabel,
  onContinue,
}: XpRewardAnimationProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onContinue();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onContinue();
      }}
    >
      <section
        aria-modal="true"
        aria-labelledby="xp-reward-title"
        role="dialog"
        className="relative w-full max-w-md overflow-hidden border border-emerald-200/30 bg-[#0d1724] text-center text-white shadow-[0_25px_90px_rgba(0,0,0,.6)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-200" />
        <button
          type="button"
          onClick={onContinue}
          aria-label="Cerrar recompensa"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-7 pt-9 sm:px-9">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200/30 bg-emerald-300/10 text-emerald-200 shadow-[0_0_40px_rgba(110,231,183,.12)]">
            <Sparkles className="h-10 w-10" />
          </div>
          <p className="pixel-font mt-6 text-[9px] uppercase tracking-[.16em] text-emerald-200">
            Recompensa desbloqueada
          </p>
          <h2 id="xp-reward-title" className="mt-3 text-2xl font-black tracking-tight">
            ¡Buen trabajo!
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Completaste el desafío y tu esfuerzo cuenta para seguir avanzando.
          </p>

          <div className="my-6 flex items-center justify-center gap-3 border border-emerald-200/20 bg-emerald-200/[.05] px-4 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 text-emerald-950">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="text-left">
              <p className="text-2xl font-black text-emerald-100">+{xp} XP</p>
              <p className="text-xs text-slate-400">Experiencia ganada</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-12 w-full items-center justify-center border border-emerald-200 bg-emerald-200 px-5 py-3 text-xs font-black uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-100"
          >
            {nextLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
