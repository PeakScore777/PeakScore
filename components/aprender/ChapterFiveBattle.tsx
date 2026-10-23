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

function PixelHeart({ color }: { color: "green" | "red" }) {
  const pixels = [
    "01100110",
    "11111111",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000",
  ];
  const fill = color === "green" ? "#68f542" : "#ff343e";
  const shade = color === "green" ? "#237d24" : "#9e1521";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 7"
      className="pixel-heart"
      shapeRendering="crispEdges"
    >
      {pixels.flatMap((row, y) =>
        row.split("").map((pixel, x) =>
          pixel === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={y >= 5 ? shade : fill}
              stroke="#101014"
              strokeWidth=".12"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function HealthBar({ value, side }: { value: number; side: "nova" | "guardian" }) {
  const width = Math.max(0, Math.min(100, (value / 8) * 100));
  const segments = Array.from({ length: 8 }, (_, index) => index < value);
  return (
    <div
      role="progressbar"
      aria-label={side === "nova" ? "Vida de Nova" : "Vida del Guardián"}
      aria-valuemin={0}
      aria-valuemax={8}
      aria-valuenow={value}
      className="relative flex w-full items-center gap-2 px-1 pb-1 pt-1"
    >
      <PixelHeart color={side === "nova" ? "green" : "red"} />
      <div className="relative h-4 flex-1 border-2 border-[#101014] bg-[#292a31] p-[2px] shadow-[0_2px_0_#08090d] sm:h-5">
        <div
          className={`h-full transition-[width] duration-500 ease-out ${side === "nova" ? "bg-gradient-to-b from-[#b8ff65] via-[#58d832] to-[#24851c]" : "bg-gradient-to-b from-[#ff8b82] via-[#ed3939] to-[#9d101c]"}`}
          style={{ width: `${width}%` }}
        />
        <div className="pointer-events-none absolute inset-0 flex gap-[2px] px-[2px]">
          {segments.map((active, index) => (
            <span key={index} className="h-full flex-1 border-r border-black/50 last:border-r-0" />
          ))}
        </div>
      </div>
      <span className="absolute left-7 top-0 h-1.5 w-1.5 border border-[#101014] bg-[#ffe5b8]" />
      <span className="absolute right-0 top-0 h-1.5 w-1.5 border border-[#101014] bg-[#ffe5b8]" />
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
      className="battle-overlay pointer-events-none fixed inset-x-3 bottom-[72px] z-20 bg-transparent sm:inset-x-6 sm:bottom-5"
    >
      <div className="flex w-full items-end justify-between gap-4">
        <div className="flex w-[28vw] max-w-[270px] flex-col items-start gap-1.5 sm:gap-2">
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
        <div className="flex w-[34vw] max-w-[360px] flex-col items-end gap-1.5 sm:gap-2">
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
        .pixel-heart { width: 24px; height: 21px; flex: 0 0 24px; image-rendering: pixelated; filter: drop-shadow(1px 2px 0 #101014); }
        .battle-nova {
          transform: translateY(-44px);
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          min-height: 124px;
        }
        .battle-guardian {
          transform: translateY(-44px);
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          min-height: 160px;
        }
        .battle-sprite {
          width: min(100%, 180px);
          aspect-ratio: 1 / 1;
          background-repeat: no-repeat;
          background-size: 800% 100%;
          background-position: 0% 50%;
          image-rendering: pixelated;
          filter: drop-shadow(0 5px 0 rgba(0,0,0,.38));
        }
        .battle-guardian .battle-sprite {
          width: min(100%, 290px);
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
          .battle-overlay { bottom: 64px; }
          .pixel-heart { width: 20px; height: 18px; flex-basis: 20px; }
          .battle-nova { min-height: 96px; transform: translateY(-28px); }
          .battle-guardian { min-height: 122px; transform: translateY(-28px); }
          .battle-sprite { width: min(100%, 132px); }
          .battle-guardian .battle-sprite { width: min(100%, 190px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .battle-sprite-playing { animation: none; background-position: 100% 50%; }
        }
      `}</style>
    </section>
  );
}
