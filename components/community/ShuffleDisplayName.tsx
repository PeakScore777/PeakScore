"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties, ElementType } from "react";
import { gsap } from "gsap";

type ShuffleDirection = "left" | "right" | "up" | "down";
type AnimationMode = "evenodd" | "sequence" | "center" | "random";

type ShuffleProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
  effect?: "slide" | "flip" | "blur";
  shuffleDirection?: ShuffleDirection;
  duration?: number;
  ease?: string;
  threshold?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "strong";
  textAlign?: CSSProperties["textAlign"];
  shuffleTimes?: number;
  animationMode?: AnimationMode;
  stagger?: number;
  triggerOnce?: boolean;
  respectReducedMotion?: boolean;
};

/**
 * PeakScore's lightweight React Bits Shuffle adaptation.
 * It runs automatically when the name enters the viewport; there is no hover
 * listener and no perpetual loop. The slide reel is built with native spans,
 * so the same component works in the profile, member list and chat.
 */
export default function ShuffleDisplayName({
  text,
  className = "",
  style,
  effect = "slide",
  shuffleDirection = "right",
  duration = 0.35,
  ease = "power3.out",
  threshold = 0.1,
  tag = "span",
  textAlign = "inherit",
  shuffleTimes = 1,
  animationMode = "evenodd",
  stagger = 0.03,
  triggerOnce = true,
  respectReducedMotion = true,
}: ShuffleProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const trackRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hasPlayed = useRef(false);
  const Tag = tag as ElementType;
  const characters = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    const root = rootRef.current;
    const tracks = trackRefs.current.filter((node): node is HTMLSpanElement => Boolean(node));
    if (!root || !tracks.length) return;

    let timeline: gsap.core.Timeline | null = null;
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    const reduced = respectReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const play = () => {
      if (cancelled || (triggerOnce && hasPlayed.current)) return;
      hasPlayed.current = true;
      if (reduced) return;

      const vertical = shuffleDirection === "up" || shuffleDirection === "down";
      const reverse = shuffleDirection === "left" || shuffleDirection === "up";
      const axis = vertical ? "yPercent" : "xPercent";
      const from = reverse ? 0 : -66.6667;
      const to = reverse ? -66.6667 : 0;
      const safeDuration = Math.max(0.12, duration);
      const safeStagger = Math.max(0, stagger);
      const safeRolls = Math.max(1, Math.min(3, Math.floor(shuffleTimes)));
      const offsets = tracks.map((_, index) => {
        if (animationMode === "sequence") return index * safeStagger;
        if (animationMode === "center") return Math.abs(index - (tracks.length - 1) / 2) * safeStagger;
        if (animationMode === "random") return Math.random() * safeStagger * tracks.length;
        const oddCount = Math.floor(tracks.length / 2);
        const evenStart = oddCount ? (safeDuration + Math.max(0, oddCount - 1) * safeStagger) * 0.7 : 0;
        return index % 2 === 1
          ? Math.floor(index / 2) * safeStagger
          : evenStart + (index / 2) * safeStagger;
      });

      tracks.forEach((track) => {
        gsap.set(track, { xPercent: vertical ? 0 : from, yPercent: vertical ? from : 0 });
      });

      timeline = gsap.timeline();
      tracks.forEach((track, index) => {
        timeline?.to(track, {
          [axis]: to,
          duration: safeDuration * safeRolls,
          ease,
          force3D: true,
        }, offsets[index]);
      });
    };

    if (reduced) {
      hasPlayed.current = true;
      return () => { cancelled = true; };
    }

    if (typeof IntersectionObserver === "undefined") {
      play();
    } else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          play();
          if (triggerOnce) observer?.disconnect();
        }
      }, { threshold: Math.max(0, Math.min(1, threshold)) });
      observer.observe(root);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      timeline?.kill();
      tracks.forEach((track) => gsap.set(track, { clearProps: "transform" }));
    };
  }, [text, duration, ease, threshold, shuffleDirection, shuffleTimes, animationMode, stagger, triggerOnce, respectReducedMotion, characters.length]);

  trackRefs.current = [];

  return (
    <Tag
      ref={rootRef as React.Ref<HTMLElement>}
      className={("ps-name-shuffle " + className).trim()}
      style={{ ...style, textAlign }}
      aria-label={text}
    >
      <span className="ps-name-shuffle__content" aria-hidden="true">
        {characters.map((character, index) => {
          const glyph = character === " " ? "\u00a0" : character;
          return (
            <span className="ps-name-shuffle__cell" key={index}>
              <span className="ps-name-shuffle__sizer">{glyph}</span>
              <span
                className="ps-name-shuffle__track"
                ref={(node) => { trackRefs.current[index] = node; }}
              >
                <span>{glyph}</span>
                <span>{glyph}</span>
                <span>{glyph}</span>
              </span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
