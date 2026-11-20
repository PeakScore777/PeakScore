"use client";

import { useEffect, useState } from "react";
import {
  FOUNDER_MESSAGES,
  FOUNDER_HEART_MESSAGE,
} from "@/lib/constants/founder-messages";

type FounderPhase = "idle" | "approach" | "alert" | "escape" | "return";

const APPROACH_MS = 7200;
const ALERT_MS = 420;
const ESCAPE_MS = 3600;
const RETURN_MS = 5600;

export default function ArcadeFounderSequence() {
  const [phase, setPhase] = useState<FounderPhase>("idle");
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const timers = new Set<number>();

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (active) callback();
      }, delay);
      timers.add(timer);
    };

    const startCycle = (initial: boolean) => {
      if (!active) return;
      setPhase("idle");
      if (!initial) {
        setMessageIndex((current) => (current + 1) % FOUNDER_MESSAGES.length);
      }

      // On the first appearance the Founder gets a longer greeting.
      // On every return, the pursuers restart one second after he rests.
      const idleMs = initial ? 3500 : 1000;
      schedule(() => setPhase("approach"), idleMs);
      schedule(() => setPhase("alert"), idleMs + APPROACH_MS);
      schedule(() => setPhase("escape"), idleMs + APPROACH_MS + ALERT_MS);
      schedule(
        () => setPhase("return"),
        idleMs + APPROACH_MS + ALERT_MS + ESCAPE_MS,
      );
      schedule(
        () => startCycle(false),
        idleMs + APPROACH_MS + ALERT_MS + ESCAPE_MS + RETURN_MS,
      );
    };

    startCycle(true);
    return () => {
      active = false;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const message = FOUNDER_MESSAGES[messageIndex];

  return (
    <section
      className="arcade-founder-scene"
      data-phase={phase}
      aria-label="El fundador y los personajes del catálogo"
    >
      <div className="arcade-chase-pack" aria-hidden="true">
        <span className="arcade-chase-character arcade-chase-slime" />
        <span className="arcade-chase-character arcade-chase-guardian" />
        <span className="arcade-chase-character arcade-chase-score" />
      </div>

      <div className="arcade-founder-body" aria-hidden="true">
        <span className="arcade-founder-art" />
      </div>

      {(phase === "idle" || phase === "approach") && (
        <div className="arcade-founder-bubble" aria-live="polite">
          <p>{message}</p>
          {message === FOUNDER_HEART_MESSAGE && (
            <span className="arcade-founder-heart" aria-label="corazón">♥</span>
          )}
          <span className="arcade-founder-bubble-tail" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
