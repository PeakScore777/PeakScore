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

  return (
    <div
      aria-label="Animación de combate"
      className="mx-auto flex w-full max-w-[420px] items-center justify-center gap-3 sm:gap-8"
    >
      <div
        key={`nova-${sequence}-${result}`}
        role="img"
        aria-label="Nova"
        className={`battle-sprite ${playing ? "battle-sprite-playing" : ""}`}
        style={{ backgroundImage: `url("${novaSprite}")` }}
      />
      <div
        key={`guardian-${sequence}-${result}`}
        role="img"
        aria-label="Guardián"
        className={`battle-sprite ${playing ? "battle-sprite-playing" : ""}`}
        style={{ backgroundImage: `url("${guardianSprite}")` }}
      />
      <style jsx>{`
        .battle-sprite {
          width: min(38vw, 150px);
          aspect-ratio: 1 / 1;
          flex: 0 1 150px;
          background-repeat: no-repeat;
          background-size: 800% 100%;
          background-position: 0% 50%;
          image-rendering: pixelated;
          filter: drop-shadow(0 5px 0 rgba(0,0,0,.38));
        }
        .battle-sprite-playing {
          animation: chapter-five-sprite-frames 1s steps(1, end) 1 both;
        }
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
    </div>
  );
}
