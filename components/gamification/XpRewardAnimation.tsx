"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type XpRewardAnimationProps = {
  open: boolean;
  xp: number;
  nextLabel?: string;
  onContinue: () => void;
  onRepeat?: () => void;
  onReview?: () => void;
};

/**
 * Celebración visual reutilizable para recompensas de EXP.
 * La página que lo invoque debe abrirlo únicamente tras confirmar
 * en servidor que la recompensa fue concedida.
 */
export default function XpRewardAnimation({
  open,
  xp,
  nextLabel = "CONTINUAR",
  onContinue,
  onRepeat,
  onReview,
}: XpRewardAnimationProps) {
  const [count, setCount] = useState(0);

  const particles = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => ({
        id: index,
        left: `${(index * 37 + 11) % 100}%`,
        delay: `${((index * 13) % 80) / 100}s`,
        duration: `${1.45 + ((index * 17) % 110) / 100}s`,
        drift: `${((index * 29) % 240) - 120}px`,
        rotation: `${((index * 47) % 900) - 450}deg`,
        size: index % 5 === 0 ? 10 : index % 3 === 0 ? 7 : 5,
        color: ["#48e5ff", "#4f83ff", "#a78bfa", "#f8d66d", "#ffffff", "#4de0a5"][index % 6],
      })),
    [],
  );

  useEffect(() => {
    if (!open) {
      setCount(0);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 650;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setCount(Math.round(Math.max(0, xp) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [open, xp]);

  useEffect(() => {
    if (!open) return;
    const audio = new Audio("/sounds/xp-gain.mp3");
    audio.volume = 0.32;
    void audio.play().catch(() => {
      // El navegador puede bloquear audio si no hubo interacción previa.
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") onContinue();
      if (event.key === "Escape") event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      className="xp-reward-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xp-reward-title"
    >
      <div className="xp-confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="xp-confetti-piece absolute top-[-14px]"
            style={{
              left: particle.left,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              ["--xp-drift" as string]: particle.drift,
              ["--xp-rotation" as string]: particle.rotation,
            } as CSSProperties}
          />
        ))}
      </div>

      <section className="xp-reward-card relative z-10 flex w-full max-w-md flex-col items-center bg-transparent px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="xp-badge-entry relative h-44 w-44 sm:h-52 sm:w-52">
          <div className="absolute inset-4 rounded-full bg-cyan-300/20 blur-2xl" />
          <Image
            src="/peaky/homepage/xp.webp"
            alt="Insignia de experiencia XP"
            fill
            priority
            sizes="(max-width: 640px) 176px, 208px"
            className="object-contain drop-shadow-[0_0_18px_rgba(34,211,238,.4)]"
          />
        </div>

        <p className="pixel-font mt-3 text-[9px] tracking-[.18em] text-cyan-100/80">RECOMPENSA DESBLOQUEADA</p>
        <h2 id="xp-reward-title" className="pixel-font mt-5 text-3xl text-white drop-shadow-[0_0_16px_rgba(34,211,238,.55)] sm:text-4xl">
          +{count} XP
        </h2>
        <p className="mt-4 text-sm font-semibold text-slate-200">¡EXPERIENCIA GANADA!</p>
        <p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">Cada desafío te acerca a tu próxima conquista.</p>

        {onRepeat && onReview ? (
          <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" onClick={onRepeat} className="inline-flex min-h-12 items-center justify-center gap-2 border border-cyan-100/35 bg-[#111b2b] px-4 py-3 text-xs font-extrabold text-white transition hover:border-cyan-100 hover:bg-[#1c2b42]"><span aria-hidden="true">↻</span> REPETIR PRÁCTICA</button>
            <button type="button" onClick={onReview} className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-cyan-200 bg-cyan-300 px-4 py-3 text-xs font-extrabold text-[#07111b] transition hover:bg-cyan-100">REPASAR TEORÍA</button>
          </div>
        ) : (
          <button type="button" autoFocus onClick={onContinue} className="pixel-font mt-8 inline-flex min-h-12 w-full items-center justify-center border-2 border-cyan-200 bg-cyan-300 px-5 py-4 text-[10px] text-[#07111b] shadow-[4px_4px_0_#155e75] transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-[5px_5px_0_#155e75] active:translate-y-0 active:shadow-none">{nextLabel}</button>
        )}
      </section>

      <style jsx global>{`
        @keyframes xp-confetti-fall {
          0% { transform: translate3d(0, -5vh, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate3d(var(--xp-drift), 110vh, 0) rotate(var(--xp-rotation)); opacity: 0; }
        }
        @keyframes xp-badge-pop {
          0% { opacity: 0; transform: scale(.28) rotate(-12deg); }
          62% { opacity: 1; transform: scale(1.09) rotate(3deg); }
          78% { transform: scale(.96) rotate(-1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes xp-card-rise {
          0% { opacity: 0; transform: translateY(22px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .xp-confetti-piece { animation-name: xp-confetti-fall; animation-timing-function: cubic-bezier(.2,.65,.35,1); animation-fill-mode: both; }
        .xp-badge-entry { animation: xp-badge-pop 680ms cubic-bezier(.2,.85,.25,1.25) both; }
        .xp-reward-card { animation: xp-card-rise 280ms ease-out both; }
        .xp-reward-overlay { background: #000 !important; }
        .xp-reward-card { border: 0 !important; outline: 0 !important; box-shadow: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .xp-confetti-piece { animation-duration: 1ms !important; }
          .xp-badge-entry, .xp-reward-card { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
