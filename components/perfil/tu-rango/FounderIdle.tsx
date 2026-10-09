"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FOUNDER_GIF =
  "/images/profile/rank/founder/the_character_animation.gif";

const DIALOGUES = [
  "¡Sigue avanzando!",
  "¡Sube de nivel!",
  "Cada logro te acerca a la cima.",
  "¡Un nuevo rango te espera!",
];

type FounderIdleProps = {
  dialogueInterval?: number;
  showDialogue?: boolean;
};

export default function FounderIdle({
  dialogueInterval = 10000,
  showDialogue = true,
}: FounderIdleProps) {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [dialogueVisible, setDialogueVisible] = useState(false);

  useEffect(() => {
    if (!showDialogue) {
      setDialogueVisible(false);
      return;
    }

    const initialTimeout = window.setTimeout(() => {
      setDialogueVisible(true);
    }, 1500);

    const dialogueTimer = window.setInterval(() => {
      setDialogueIndex((current) => (current + 1) % DIALOGUES.length);
      setDialogueVisible(true);
    }, dialogueInterval);

    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(dialogueTimer);
    };
  }, [dialogueInterval, showDialogue]);

  useEffect(() => {
    if (!showDialogue || !dialogueVisible) return;

    const hideTimeout = window.setTimeout(() => {
      setDialogueVisible(false);
    }, 4000);

    return () => window.clearTimeout(hideTimeout);
  }, [dialogueVisible, dialogueIndex, showDialogue]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Fundador más grande, apoyado visualmente en la plataforma */}
      <div className="absolute -left-[1%] bottom-[50px] aspect-[232/254] w-[56%] max-w-[230px]">
        <Image
          src={FOUNDER_GIF}
          alt="Fundador de PeakScore animado"
          fill
          unoptimized
          priority
          sizes="(min-width: 640px) 230px, 56vw"
          draggable={false}
          className="select-none object-contain"
        />
      </div>

      {/* Globo a la derecha y cerca de la cara */}
      {showDialogue && (
        <div
          className={`absolute left-[40%] top-[50%] z-30 w-[58%] max-w-[235px] transition-[opacity,transform] duration-300 ${
            dialogueVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-2 opacity-0"
          }`}
          aria-live="polite"
        >
          <div className="relative border-2 border-violet-300/80 bg-[#100b25] px-2 py-3 text-center shadow-[3px_3px_0_#39266d]">
            <p className="text-[7px] leading-[1.8] text-white sm:text-[8px]">
              {DIALOGUES[dialogueIndex]}
            </p>

            <span className="absolute -left-[7px] top-5 h-3 w-3 rotate-45 border-b-2 border-l-2 border-violet-300/80 bg-[#100b25]" />
          </div>
        </div>
      )}
    </div>
  );
}