"use client";

import { useEffect } from "react";

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
  const fill = color === "green" ? "#54e637" : "#ff303b";
  const shadow = color === "green" ? "#23851c" : "#a80f20";
  return (
    <svg aria-hidden="true" viewBox="0 0 16 15" width="15" height="14" shapeRendering="crispEdges" style={{ display: "block", width: 15, height: 14, flex: "0 0 15px", imageRendering: "pixelated" }}>
      <path d="M1 4V2H3V1H6V2H8V4H10V2H12V1H15V3H16V7H15V9H13V11H11V13H9V14H7V13H5V11H3V9H2V7H1Z" fill="#101014" />
      <path d="M2 4V3H4V2H6V3H8V5H10V3H12V2H14V3H15V6H14V8H12V10H10V12H8V13H7V12H5V10H3V8H2V6H1V4Z" fill={fill} />
      <path d="M3 4H5V5H3Z M11 3H13V4H11Z" fill="#fff2dd" />
      <path d="M4 9H6V11H8V12H7V11H5Z" fill={shadow} />
    </svg>
  );
}

function HealthBar({ value, side, total }: { value: number; side: "nova" | "guardian"; total: number }) {
  const percent = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  const fill = side === "nova"
    ? "linear-gradient(180deg,#8dff62 0%,#4be02e 55%,#23851c 100%)"
    : "linear-gradient(180deg,#ff7777 0%,#f3323c 55%,#a80f20 100%)";

  return (
    <div
      role="progressbar"
      aria-label={side === "nova" ? "Vida de Nova" : "Vida del Guardián"}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", minWidth: 0 }}
    >
      <PixelHeart color={side === "nova" ? "green" : "red"} />
      <div style={{ position: "relative", flex: "1 1 auto", minWidth: 0, height: 13, padding: 2, boxSizing: "border-box", background: "#34343a", border: "1px solid #111116", boxShadow: "0 1px 0 #666" }}>
        <div style={{ position: "absolute", left: 2, top: 2, bottom: 2, width: `${percent}%`, background: fill, clipPath: "polygon(2% 0,100% 0,98% 100%,0 100%)", transition: "width 550ms ease-out" }} />
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

  // La animación dura 1 s a 8 FPS: el golpe se lanza al iniciar el sprite,
  // se recorta a 250 ms y el sonido de daño entra al llegar al frame de impacto.
  useEffect(() => {
    if (result === null) return;
    const hurtTimer = window.setTimeout(() => {
      const hurtAudio = new Audio("/sounds/chapter-5-hurt.wav");
      hurtAudio.volume = 0.34;
      void hurtAudio.play().catch(() => {});
    }, 250);
    const attackAudio = new Audio("/sounds/chapter-5-attack.mp3");
    attackAudio.volume = 0.30;
    void attackAudio.play().catch(() => {});
    const attackCutoff = window.setTimeout(() => {
      attackAudio.pause();
      attackAudio.currentTime = 0;
    }, 250);
    return () => {
      window.clearTimeout(attackCutoff);
      window.clearTimeout(hurtTimer);
      attackAudio.pause();
      attackAudio.currentTime = 0;
    };
  }, [result, sequence]);
  const attempts = Math.min(totalQuestions, questionIndex + (checked ? 1 : 0));
  const novaHealth = Math.max(0, totalQuestions - (attempts - score));
  const guardianHealth = Math.max(0, totalQuestions - score);
  const novaSprite = !playing || novaAttacks ? SPRITES.novaAttack : SPRITES.novaHurt;
  const guardianSprite = !playing || novaAttacks ? SPRITES.guardianHurt : SPRITES.guardianAttack;

  return (
    <section aria-label="Combate de Nova y el Guardián" className="battle-overlay pointer-events-none fixed inset-x-0 bottom-[72px] z-20 bg-transparent">
      <div className="battle-fighter battle-fighter-nova">
        <HealthBar value={novaHealth} side="nova" total={totalQuestions} />
        <div
          key={`nova-${sequence}-${result}`}
          role="img"
          aria-label="Nova en combate"
          className={`battle-sprite battle-nova-sprite ${playing ? "battle-sprite-playing" : ""}`}
          style={{ backgroundImage: `url("${novaSprite}")` }}
        />
      </div>
      <div className="battle-fighter battle-fighter-guardian">
        <HealthBar value={guardianHealth} side="guardian" total={totalQuestions} />
        <div
          key={`guardian-${sequence}-${result}`}
          role="img"
          aria-label="Guardián en combate"
          className={`battle-sprite battle-guardian-sprite ${playing ? "battle-sprite-playing" : ""}`}
          style={{ backgroundImage: `url("${guardianSprite}")` }}
        />
      </div>
      <style jsx>{`
        .battle-overlay { height: 300px; pointer-events: none; }
        .battle-fighter { position:absolute; bottom:0; display:flex; flex-direction:column; align-items:stretch; gap:8px; }
        .battle-fighter-nova { left:clamp(24px,4vw,68px); width:clamp(176px,17vw,208px); }
        .battle-fighter-guardian { right:clamp(24px,4vw,68px); width:clamp(196px,19vw,230px); }
        .battle-sprite { align-self:center; background-repeat:no-repeat; background-size:800% 100%; background-position:0% 50%; image-rendering:pixelated; filter:drop-shadow(0 3px 0 rgba(0,0,0,.38)); }
        .battle-nova-sprite { width:clamp(158px,13vw,184px); height:clamp(158px,13vw,184px); }
        .battle-guardian-sprite { width:clamp(237px,19.5vw,276px); height:clamp(237px,19.5vw,276px); }
        .battle-sprite-playing { animation:chapter-five-sprite-frames 1s steps(1,end) 1 both; }
        @keyframes chapter-five-sprite-frames {
          0% { background-position:0% 50%; }
          12.5% { background-position:14.2857% 50%; }
          25% { background-position:28.5714% 50%; }
          37.5% { background-position:42.8571% 50%; }
          50% { background-position:57.1429% 50%; }
          62.5% { background-position:71.4286% 50%; }
          75% { background-position:85.7143% 50%; }
          87.5%,100% { background-position:100% 50%; }
        }
        @media (max-width: 700px) {
          .battle-overlay { height:235px; bottom:64px; }
          .battle-fighter { gap:5px; }
          .battle-fighter-nova { left:10px; width:clamp(130px,34vw,166px); }
          .battle-fighter-guardian { right:10px; width:clamp(144px,37vw,180px); }
          .battle-nova-sprite { width:clamp(118px,29vw,142px); height:clamp(118px,29vw,142px); }
          .battle-guardian-sprite { width:clamp(177px,43vw,212px); height:clamp(177px,43vw,212px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .battle-sprite-playing { animation:none; background-position:100% 50%; }
        }
      `}</style>
    </section>
  );
}
