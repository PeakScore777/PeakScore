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
  const fill = color === "green" ? "#58e63d" : "#ff343e";
  const shadow = color === "green" ? "#207b22" : "#9e1521";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 15"
      width="18"
      height="17"
      className="pixel-heart"
      shapeRendering="crispEdges"
    >
      <path d="M1 4V2H3V1H6V2H8V4H10V2H12V1H15V3H16V7H15V9H13V11H11V13H9V14H7V13H5V11H3V9H2V7H1Z" fill="#101014" />
      <path d="M2 4V3H4V2H6V3H8V5H10V3H12V2H14V3H15V6H14V8H12V10H10V12H8V13H7V12H5V10H3V8H2V6H1V4Z" fill={fill} />
      <path d="M3 4H5V5H3Z M11 3H13V4H11Z" fill="#fff2dd" />
      <path d="M4 9H6V11H8V12H7V11H5Z" fill={shadow} />
    </svg>
  );
}

function HealthBar({ value, side, total }: { value: number; side: "nova" | "guardian"; total: number }) {
  const percent = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  const color = side === "nova"
    ? "linear-gradient(to bottom, #91ff68 0%, #42d52c 48%, #23851c 100%)"
    : "linear-gradient(to bottom, #ff8989 0%, #f3323c 48%, #a80f20 100%)";

  return (
    <div
      role="progressbar"
      aria-label={side === "nova" ? "Vida de Nova" : "Vida del Guardián"}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className="healthbar-wrap"
    >
      <PixelHeart color={side === "nova" ? "green" : "red"} />
      <div className="healthbar-track">
        <div
          className="healthbar-fill"
          style={{ width: `${percent}%`, background: color }}
        />
        <div className="healthbar-gloss" />
      </div>
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
        <div className="ml-5 flex w-[28vw] max-w-[270px] flex-col items-start gap-1.5 sm:ml-10 sm:gap-2">
          <HealthBar value={novaHealth} side="nova" total={totalQuestions} />
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
        <div className="mr-5 flex w-[34vw] max-w-[360px] flex-col items-end gap-1.5 sm:mr-10 sm:gap-2">
          <HealthBar value={guardianHealth} side="guardian" total={totalQuestions} />
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
        .healthbar-wrap { display:flex; align-items:center; gap:4px; width:100%; padding:3px 2px; }
        .pixel-heart { display:block; width:18px !important; height:17px !important; min-width:18px; flex:0 0 18px; image-rendering:pixelated; filter:drop-shadow(1px 1px 0 #101014); }
        .healthbar-track { position:relative; flex:1; height:17px; min-width:0; overflow:hidden; border:2px solid #111116; background:#f4f0e8; box-shadow:inset 0 0 0 1px #777; }
        .healthbar-fill { position:absolute; inset:0 auto 0 0; transition:width 650ms cubic-bezier(.2,.75,.25,1); }
        .healthbar-gloss { position:absolute; inset:2px 2px auto 2px; height:3px; background:rgba(255,255,255,.28); pointer-events:none; }
        .battle-nova {
          transform: translateY(-68px);
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          min-height: 124px;
        }
        .battle-guardian {
          transform: translateY(-68px);
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
          .healthbar-track { height:14px; }
          .pixel-heart { width:16px !important; height:15px !important; min-width:16px; flex-basis:16px; }
          .battle-nova { min-height: 96px; transform: translateY(-40px); }
          .battle-guardian { min-height: 122px; transform: translateY(-40px); }
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
