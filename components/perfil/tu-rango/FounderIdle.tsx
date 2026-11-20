"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  FOUNDER_MESSAGES,
  FOUNDER_HEART_MESSAGE,
  founderMessageDuration,
} from "@/lib/constants/founder-messages";

const FOUNDER_GIF =
  "/images/profile/rank/founder/the_character_animation.gif";

type FounderIdleProps = {
  showDialogue?: boolean;
};

export default function FounderIdle({
  showDialogue = true,
}: FounderIdleProps) {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [dialogueVisible, setDialogueVisible] = useState(false);
  const dialogueIndexRef = useRef(0);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    if (!showDialogue) {
      setDialogueVisible(false);
      return () => {
        active = false;
      };
    }

    const showCurrentMessage = () => {
      if (!active) return;

      const currentMessage = FOUNDER_MESSAGES[dialogueIndexRef.current];
      setDialogueVisible(true);

      timer = window.setTimeout(() => {
        setDialogueVisible(false);

        timer = window.setTimeout(() => {
          if (!active) return;

          const nextIndex =
            (dialogueIndexRef.current + 1) % FOUNDER_MESSAGES.length;
          dialogueIndexRef.current = nextIndex;
          setDialogueIndex(nextIndex);
          showCurrentMessage();
        }, 450);
      }, founderMessageDuration(currentMessage));
    };

    timer = window.setTimeout(showCurrentMessage, 1500);

    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [showDialogue]);

  const dialogueClass = dialogueVisible
    ? "translate-x-0 opacity-100"
    : "translate-x-2 opacity-0";

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute bottom-[14%] left-[2%] aspect-[232/254] w-[53%] max-w-[220px] sm:bottom-[18%] sm:left-[3%] sm:w-[48%] sm:max-w-[250px]">
        <Image
          src={FOUNDER_GIF}
          alt="Fundador de PeakScore animado"
          fill
          unoptimized
          priority
          sizes="(min-width: 640px) 250px, 53vw"
          draggable={false}
          className="select-none object-contain"
        />
      </div>

      {showDialogue && (
        <div
          className={"absolute left-[42%] top-[54%] z-30 w-[58%] max-w-[220px] transition-[opacity,transform] duration-300 sm:left-[35%] sm:top-[calc(48%_-_1px)] sm:w-[62%] sm:max-w-[220px] " + dialogueClass}
          aria-live="polite"
        >
          <div className="relative border-2 border-violet-300/80 bg-[#100b25] px-2 py-2.5 text-center shadow-[3px_3px_0_#39266d]">
            <p className="text-[8px] leading-[1.8] text-white">
              {FOUNDER_MESSAGES[dialogueIndex]}
              {FOUNDER_MESSAGES[dialogueIndex] === FOUNDER_HEART_MESSAGE && (
                <span className="ml-1 text-red-400" aria-label="corazón">♥</span>
              )}
            </p>
            <span className="absolute -left-[7px] top-5 h-3 w-3 rotate-45 border-b-2 border-l-2 border-violet-300/80 bg-[#100b25]" />
          </div>
        </div>
      )}
    </div>
  );
}
