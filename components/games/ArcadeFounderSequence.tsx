"use client";

import { useEffect, useRef, useState, type AnimationEvent, type CSSProperties } from "react";
import {
  FOUNDER_MESSAGES,
  FOUNDER_HEART_MESSAGE,
} from "@/lib/constants/founder-messages";

type FounderPhase = "idle" | "approach" | "alert" | "escape" | "return";

const INITIAL_IDLE_MS = 3500;
const RETURN_IDLE_MS = 1000;
const ALERT_MS = 180;
const ESCAPE_MS = 3600;
const RETURN_MS = 5600;

function getApproachDuration(message: string) {
  const words = message.trim().split(/\s+/).filter(Boolean).length;
  // Longer messages get more time on screen while the Founder stays still
  // and the pursuers approach the yellow marker.
  return Math.min(18000, Math.max(7200, 2600 + words * 165));
}

export default function ArcadeFounderSequence() {
  const [phase, setPhase] = useState<FounderPhase>("idle");
  const [messageIndex, setMessageIndex] = useState(0);
  const firstIdle = useRef(true);

  const message = FOUNDER_MESSAGES[messageIndex] ?? FOUNDER_MESSAGES[0];
  const approachDuration = getApproachDuration(message);

  const sceneStyle = {
    "--arcade-approach-duration": `${approachDuration}ms`,
  } as CSSProperties;

  // The Founder speaks while resting and while the pursuers approach.
  // After returning to the red marker, he rests for exactly one second.
  useEffect(() => {
    if (phase !== "idle") return;

    const delay = firstIdle.current ? INITIAL_IDLE_MS : RETURN_IDLE_MS;
    firstIdle.current = false;
    const timer = window.setTimeout(() => setPhase("approach"), delay);

    return () => window.clearTimeout(timer);
  }, [phase]);

  // The surprise is a single PNG held briefly, then the escape starts.
  useEffect(() => {
    if (phase !== "alert") return;
    const timer = window.setTimeout(() => setPhase("escape"), ALERT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const handlePackAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "arcade-chase-approach") return;
    if (phase === "approach") setPhase("alert");
  };

  const handleFounderAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    if (phase === "escape" && event.animationName === "arcade-founder-run-out") {
      setPhase("return");
      return;
    }

    if (phase === "return" && event.animationName === "arcade-founder-walk-back") {
      setMessageIndex((current) => (current + 1) % FOUNDER_MESSAGES.length);
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
      {/* Left-to-right order: Slime, Guardian, 500/500 (the leader). */}
      <div
        className="arcade-chase-pack"
        aria-hidden="true"
        onAnimationEnd={handlePackAnimationEnd}
      >
        <span className="arcade-chase-character arcade-chase-slime" />
        <span className="arcade-chase-character arcade-chase-guardian" />
        <span className="arcade-chase-character arcade-chase-score" />
      </div>

      {/* The anchor's CENTER sits on the red marker. Only the inner body moves. */}
      <div className="arcade-founder-anchor" aria-hidden="true">
        <div
          className="arcade-founder-motion"
          onAnimationEnd={handleFounderAnimationEnd}
        >
          <span className="arcade-founder-art" />
        </div>
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
