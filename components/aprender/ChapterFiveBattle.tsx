"use client";

type Props = {
  result: boolean | null;
  sequence: number;
  questionIndex: number;
  score: number;
  totalQuestions: number;
  checked: boolean;
};

const SPRITES = {
  novaAttack: "/images/aprender/battle/nova-attack.png",
  novaHurt: "/images/aprender/battle/nova-hurt.png",
  guardianAttack: "/images/aprender/battle/guardian-attack.png",
  guardianHurt: "/images/aprender/battle/guardian-hurt.png",
} as const;

function HealthBar({ value, side }: { value: number; side: "nova" | "guardian" }) {
  const width = Math.max(0, Math.min(100, (value / 8) * 100));
  return (
    <div
      role="progressbar"
      aria-label={side === "nova" ? "Vida de Nova" : "Vida del Guardián"}
      aria-valuemin={0}
      aria-valuemax={8}
      aria-valuenow={value}
      className="h-3 w-full overflow-hidden border border-white/25 bg-[#171923] p-[2px] sm:h-4"
    >
      <div
        className={`h-full transition-[width] duration-500 ease-out ${side === "nova" ? "bg-gradient-to-r from-emerald-500 to-lime-300" : "bg-gradient-to-r from-red-600 to-orange-400"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function ChapterFiveBattle({
  result,
  sequence,
  questionIndex,
  score,
  totalQuestions,
  checked,
}: Props) {
  const playing = result !== null;
  const novaAttacks = result === true;
  const attempts = Math.min(totalQuestions, questionIndex + (checked ? 1 : 0));
  const novaHealth = Math.max(0, totalQuestions - (attempts - score));
  const guardianHealth = Math.max(0, totalQuestions - score);
  const novaSprite = !playing || novaAttacks ? SPRITES.novaAttack : SPRITES.novaHurt;
  const guardianSprite = !playing || novaAttacks ? SPRITES.guardianHurt : SPRITES.guardianAttack;

  return (
    <section
      aria-label="Combate de Nova y el Guardián"
      className="w-full bg-[#080f1c] px-3 py-3 sm:px-6 sm:py-4"
    >
      <div className="mx-auto flex w-full max-w-[980px] items-end justify-between gap-5 sm:gap-12">
        <div className="flex w-[43%] max-w-[300px] flex-col items-start gap-1.5 sm:gap-2">
          <HealthBar value={novaHealth} side="nova" />
          <div className="battle-nova" aria-label="Nova">
            <div
              key={`nova-${sequence}-${result}`}
              role="img"
              aria-label="Nova en combate"
              className={`battle-sprite ${playing ? "battle-sprite-playing" : ""}`}
              style={{ backgroundImage: `url("${novaSprite}")` }}
            />
          </div>
        </div>
        <div className="flex w-[43%] max-w-[360px] flex-col items-end gap-1.5 sm:gap-2">
          <HealthBar value={guardianHealth} side="guardian" />
          <div className="battle-guardian" aria-label="Guardián">
            <div
              key={`guardian-${sequence}-${result}`}
              role="img"
              aria-label="Guardián en combate"
              className={`battle-sprite ${playing ? "battle-sprite-playing" : ""}`}
              style={{ backgroundImage: `url("${guardianSprite}")` }}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        .battle-nova {
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          min-height: 112px;
        }
        .battle-guardian {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          min-height: 140px;
        }
        .battle-sprite {
          width: min(100%, 156px);
          aspect-ratio: 1 / 1;
          background-repeat: no-repeat;
          background-size: 800% 100%;
          background-position: 0% 50%;
          image-rendering: pixelated;
          filter: drop-shadow(0 5px 0 rgba(0,0,0,.38));
        }
        .battle-guardian .battle-sprite {
          width: min(100%, 230px);
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
        @media (max-width: 480px) {
          .battle-nova { min-height: 84px; }
          .battle-guardian { min-height: 108px; }
          .battle-sprite { width: min(100%, 112px); }
          .battle-guardian .battle-sprite { width: min(100%, 165px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .battle-sprite-playing { animation: none; background-position: 100% 50%; }
        }
      `}</style>
    </section>
  );
}
