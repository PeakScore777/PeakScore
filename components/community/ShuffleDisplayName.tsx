"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ElementType, type Ref } from "react";

type ShuffleProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
  effect?: "slide" | "flip" | "blur";
  shuffleDirection?: "left" | "right" | "up" | "down";
  duration?: number;
  ease?: string;
  threshold?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "strong";
  textAlign?: CSSProperties["textAlign"];
  shuffleTimes?: number;
  animationMode?: "evenodd" | "sequence" | "center" | "random";
  stagger?: number;
  triggerOnce?: boolean;
  respectReducedMotion?: boolean;
};

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-";

export default function ShuffleDisplayName({
  text, className = "", style, effect = "slide", shuffleDirection = "right",
  duration = 0.35, ease = "power3.out", threshold = 0.1, tag = "span",
  textAlign = "inherit", shuffleTimes = 1, animationMode = "evenodd",
  stagger = 0.03, triggerOnce = true, respectReducedMotion = true,
}: ShuffleProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const hasPlayed = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const Tag = tag as ElementType;
  const chars = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !text) return;
    const reduced = respectReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let observer: IntersectionObserver | null = null;
    let fallback = 0;
    const play = () => {
      if (triggerOnce && hasPlayed.current) return;
      hasPlayed.current = true;
      setPlaying(false);
      setRun((value) => value + 1);
      requestAnimationFrame(() => setPlaying(true));
    };
    if (!("IntersectionObserver" in window)) {
      fallback = window.setTimeout(play, 0);
    } else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          play();
          if (triggerOnce) observer?.disconnect();
        }
      }, { threshold: Math.max(0, Math.min(1, threshold)) });
      observer.observe(node);
    }
    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
    };
  }, [text, threshold, triggerOnce, respectReducedMotion]);

  const safeDuration = Math.max(0.12, duration);
  const safeStagger = Math.max(0, stagger);
  const rolls = Math.max(1, Math.min(3, Math.floor(shuffleTimes)));
  const total = Math.max(1, chars.length);
  const order = (index: number) => {
    if (animationMode === "sequence") return index;
    if (animationMode === "center") return Math.abs(index - (total - 1) / 2);
    if (animationMode === "random") return ((index * 17 + 11) % total) / total * total;
    const oddCount = Math.floor(total / 2);
    const evenStart = oddCount ? (safeDuration + Math.max(0, oddCount - 1) * safeStagger) * 0.7 : 0;
    return index % 2 === 1 ? Math.floor(index / 2) : evenStart / Math.max(safeStagger, 0.001) + index / 2;
  };

  return (
    <Tag
      ref={rootRef as Ref<HTMLElement>}
      className={("ps-name-shuffle " + className).trim()}
      style={{ ...style, textAlign }}
      aria-label={text}
      data-shuffle-run={run}
      data-shuffle-effect={effect}
      data-shuffle-direction={shuffleDirection}
    >
      <span className="ps-name-shuffle__content" aria-hidden="true">
        {chars.map((char, index) => {
          if (char === " ") return <span className="ps-name-shuffle__space" key={index}>{"\u00a0"}</span>;
          const seed = (index * 13 + run * 7) % GLYPHS.length;
          const intermediate = Array.from({ length: rolls }, (_, n) => GLYPHS[(seed + n * 9 + 3) % GLYPHS.length]);
          const glyphs = [char, ...intermediate, char];
          const delay = animationMode === "random" ? order(index) * safeStagger : order(index) * safeStagger;
          const vertical = shuffleDirection === "up" || shuffleDirection === "down";
          const reverse = shuffleDirection === "left" || shuffleDirection === "up";
          const travel = reverse ? "100%" : "-100%";
          return (
            <span className="ps-name-shuffle__cell" key={index}>
              <span className="ps-name-shuffle__sizer">{char}</span>
              <span
                className={"ps-name-shuffle__track" + (playing ? " is-playing" : "")}
                style={{
                  ["--shuffle-duration" as string]: safeDuration + "s",
                  ["--shuffle-delay" as string]: delay + "s",
                  ["--shuffle-travel" as string]: travel,
                  ["--shuffle-ease" as string]: ease === "power3.out" ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.2,.8,.2,1)",
                  ["--shuffle-axis" as string]: vertical ? "Y" : "X",
                } as CSSProperties}
              >
                {glyphs.map((glyph, n) => <span key={n}>{glyph}</span>)}
              </span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
