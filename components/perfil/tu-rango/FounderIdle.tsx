"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  createFounderMessageDeck,
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
  const [dialogue, setDialogue] = useState<string>(FOUNDER_MESSAGES[0]);
  const [dialogueVisible, setDialogueVisible] = useState(false);
  const deckRef = useRef<ReturnType<typeof createFounderMessageDeck> | null>(null);
  if (deckRef.current === null) {
    deckRef.current = createFounderMessageDeck(FOUNDER_MESSAGES[0]);
  }

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    if (!showDialogue) {
      const frame = window.requestAnimationFrame(() => setDialogueVisible(false));
      return () => {
        active = false;
        window.cancelAnimationFrame(frame);
      };
    }

    const showCurrentMessage = () => {
      if (!active) return;

      setDialogueVisible(true);
      timer = window.setTimeout(() => {
        setDialogueVisible(false);
        timer = window.setTimeout(() => {
          if (!active) return;
          const nextMessage = deckRef.current?.next() ?? FOUNDER_MESSAGES[0];
          setDialogue(nextMessage);
          showCurrentMessage();
        }, 450);
      }, founderMessageDuration(dialogue));
    };

    timer = window.setTimeout(() => {
      if (!active) return;
      const randomStart = Math.floor(Math.random() * FOUNDER_MESSAGES.length);
      deckRef.current = createFounderMessageDeck(FOUNDER_MESSAGES[randomStart]);
      setDialogue(FOUNDER_MESSAGES[randomStart]);
      showCurrentMessage();
    }, 1500);

    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [showDialogue, dialogue]);

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
          className={"absolute left-[42%] top-[54%] z-30 w-[62%] max-w-[270px] transition-[opacity,transform] duration-300 sm:left-[35%] sm:top-[calc(48%_-_1px)] sm:w-[64%] sm:max-w-[290px] " + dialogueClass}
          aria-live="polite"
        >
          <div className="peakscore-game-dialogue px-2 py-2.5">
            <p>
              {dialogue}
              {dialogue === FOUNDER_HEART_MESSAGE && (
                <span className="ml-2 text-rose-400" aria-label="corazón">♥</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
