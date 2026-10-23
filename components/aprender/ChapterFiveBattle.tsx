"use client";

type Props = { result: boolean | null; sequence: number };

const SPRITES = {
  novaAttack: "/images/aprender/battle/nova-attack.png",
  novaHurt: "/images/aprender/battle/nova-hurt.png",
  guardianAttack: "/images/aprender/battle/guardian-attack.png",
  guardianHurt: "/images/aprender/battle/guardian-hurt.png",
} as const;

function BattleSprite({
  name,
  src,
  playing,
  label,
}: {
  name: string;
  src: string;
  playing: boolean;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div
        role="img"
        aria-label={label}
        className={`battle-sprite ${playing ? "battle-sprite-playing" : ""}`}
        style={{ backgroundImage: `url("${src}")` }}
      />
      <span className="pixel-font text-[8px] tracking-wide text-slate-200">{name}</span>
    </div>
  );
}

export default function ChapterFiveBattle({ result, sequence }: Props) {
  const playing = result !== null;
  const novaAttacks = result === true;
  const novaSprite = !playing || novaAttacks ? SPRITES.novaAttack : SPRITES.novaHurt;
  const guardianSprite = !playing || novaAttacks ? SPRITES.guardianHurt : SPRITES.guardianAttack;
  const status = !playing
    ? "RESPONDE PARA ACTIVAR EL COMBATE"
    : novaAttacks
      ? "¡CORRECTO! NOVA ATACA · EL GUARDIÁN RECIBE DAÑO"
      : "¡INTÉNTALO DE NUEVO! EL GUARDIÁN ATACA · NOVA RECIBE DAÑO";

  return (
    <section
      aria-label="Combate de Nova contra el guardián"
      className="overflow-hidden rounded-xl border border-[#21405e] bg-[radial-gradient(ellipse_at_top,rgba(24,68,105,.42),rgba(5,12,24,.98)_70%)] p-4 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="pixel-font text-[9px] text-cyan-200">DUELO DEL SANTUARIO</p>
        <span className="border border-cyan-200/20 bg-black/30 px-2 py-1 text-[8px] text-slate-300">
          8 FPS · 125 MS/FRAME
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
        <BattleSprite
          key={`nova-${sequence}-${result}`}
          name="NOVA"
          src={novaSprite}
          playing={playing}
          label={novaAttacks ? "Nova ejecuta su ataque" : playing ? "Nova recibe daño" : "Nova en posición de combate"}
        />
        <div className="pixel-font px-1 text-[10px] text-amber-200 sm:px-3 sm:text-xs" aria-hidden="true">VS</div>
        <BattleSprite
          key={`guardian-${sequence}-${result}`}
          name="GUARDIAN"
          src={guardianSprite}
          playing={playing}
          label={novaAttacks ? "El guardián recibe daño" : playing ? "El guardián ejecuta su ataque" : "El guardián en posición de combate"}
        />
      </div>
      <p aria-live="polite" className="mt-3 min-h-8 text-center text-[9px] leading-5 text-cyan-100 sm:text-[10px]">
        {status}
      </p>
      <style jsx>{`
        .battle-sprite {
          width: min(100%, 210px);
          aspect-ratio: 8 / 1;
          background-repeat: no-repeat;
          background-size: 800% 100%;
          background-position: 0% 50%;
          image-rendering: pixelated;
          filter: drop-shadow(0 5px 0 rgba(0,0,0,.38));
        }
        .battle-sprite-playing {
          animation: chapter-five-sprite-frames 1s steps(1, end) 1 both;
        }
        .pixel-font { font-family: var(--font-press-start), "Press Start 2P", monospace; }
        @keyframes chapter-five-sprite-frames {
          0% { background-position: 0% 50%; }
          12.5% { background-position: 14.2857% 50%; }
          25% { background-position: 28.5714% 50%; }
          37.5% { background-position: 42.8571% 50%; }
          50% { background-position: 57.1429% 50%; }
          62.5% { background-position: 71.4286% 50%; }
          75% { background-position: 85.7143% 50%; }
          87.5%, 100% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .battle-sprite-playing { animation: none; background-position: 100% 50%; }
        }
      `}</style>
    </section>
  );
}
