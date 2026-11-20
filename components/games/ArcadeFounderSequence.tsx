"use client";

import {
  useEffect,
  useState,
  type AnimationEvent,
  type CSSProperties,
} from "react";
import {
  FOUNDER_MESSAGES,
  FOUNDER_HEART_MESSAGE,
  founderMessageDuration,
} from "@/lib/constants/founder-messages";

type FounderPhase = "idle" | "approach" | "alert" | "escape" | "return";

const INITIAL_IDLE_MS = 4000;
const RETURN_IDLE_MS = 1000;
const ALERT_MS = 180;

function getApproachDuration(message: string) {
  // Allow the quote to remain readable while the trio approaches the yellow line.
  return Math.min(20000, Math.max(7200, founderMessageDuration(message) + 1800));
}

export default function ArcadeFounderSequence() {
  const [phase, setPhase] = useState<FounderPhase>("idle");
  const [messageIndex, setMessageIndex] = useState(0);
  const [hasCompletedCycle, setHasCompletedCycle] = useState(false);

  const message = FOUNDER_MESSAGES[messageIndex] ?? FOUNDER_MESSAGES[0];
  const approachDuration = getApproachDuration(message);
  const sceneStyle = {
    "--arcade-approach-duration": `${approachDuration}ms`,
  } as CSSProperties;

  // First intro gets a little more time; every return is followed by a 1s pause.
  useEffect(() => {
    if (phase !== "idle") return;

    const timer = window.setTimeout(
      () => setPhase("approach"),
      hasCompletedCycle ? RETURN_IDLE_MS : INITIAL_IDLE_MS,
    );

    return () => window.clearTimeout(timer);
  }, [phase, hasCompletedCycle]);

  // One very brief surprised PNG, then immediately start running to the right.
  useEffect(() => {
    if (phase !== "alert") return;

    const timer = window.setTimeout(() => setPhase("escape"), ALERT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const handlePackAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    if (
      phase === "approach" &&
      event.animationName === "arcade-chase-approach"
    ) {
      // The pack only triggers surprise after the 500/500 reaches the yellow marker.
      setPhase("alert");
      return;
    }

    if (
      phase === "escape" &&
      event.animationName === "arcade-chase-exit"
    ) {
      // All three pursuers have fully left the right edge before Founder walks back.
      setPhase("return");
    }
  };

  const handleFounderAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    if (
      phase === "return" &&
      event.animationName === "arcade-founder-walk-back"
    ) {
      // Founder has reached the exact red-marker anchor again.
      setMessageIndex((current) => (current + 1) % FOUNDER_MESSAGES.length);
      setHasCompletedCycle(true);
      setPhase("idle");
    }
  };

  return (
    <section
      className="arcade-founder-scene"
      data-phase={phase}
      style={sceneStyle}
      aria-label="Secuencia del Founder y los personajes del catálogo"
    >
      {/* Left-to-right order: Slime, Guardian, then the leading 500/500. */}
      <div
        className="arcade-chase-pack"
        aria-hidden="true"
        onAnimationEnd={handlePackAnimationEnd}
      >
        <span className="arcade-chase-character arcade-chase-slime" />
        <span className="arcade-chase-character arcade-chase-guardian" />
        <span className="arcade-chase-character arcade-chase-score" />
      </div>

      {/* Anchor remains on the red mark; only the inner Founder moves away and back. */}
      <div className="arcade-founder-anchor" aria-hidden="true">
        <div
          className="arcade-founder-motion"
          onAnimationEnd={handleFounderAnimationEnd}
        >
          <span className="arcade-founder-art" />
        </div>
      </div>

      {(phase === "idle" || phase === "approach") && (
        <div className="arcade-founder-bubble peakscore-game-dialogue" aria-live="polite">
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
