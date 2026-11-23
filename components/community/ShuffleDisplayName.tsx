"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ElementType, type Ref } from "react";

type ShuffleEffect = "slide" | "flip" | "blur";
type ShuffleDirection = "left" | "right" | "up" | "down";
type ShuffleMode = "evenodd" | "sequence" | "center" | "random";

type ShuffleProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
  effect?: ShuffleEffect;
  shuffleDirection?: ShuffleDirection;
  duration?: number;
  ease?: string;
  threshold?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "strong";
  textAlign?: CSSProperties["textAlign"];
  shuffleTimes?: number;
  animationMode?: ShuffleMode;
  stagger?: number;
  scrambleCharset?: string;
  respectReducedMotion?: boolean;
};

const DEFAULT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=?";

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
  scrambleCharset = "",
  respectReducedMotion = true,
}: ShuffleProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const visibleRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const Tag = tag as ElementType;
  const chars = useMemo(() => Array.from(text), [text]);

  const safeDuration = Math.max(0.2, duration);
  const safeStagger = Math.max(0, stagger);
  const rolls = Math.max(1, Math.min(24, Math.floor(shuffleTimes)));
  const charset = scrambleCharset || DEFAULT_GLYPHS;

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !text) return;
    const reduced = respectReducedMotion
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      visibleRef.current = false;
      const reducedMotionFrame = window.requestAnimationFrame(() => setIsVisible(false));
      return () => window.cancelAnimationFrame(reducedMotionFrame);
    }

    let observer: IntersectionObserver | null = null;
    let fallbackTimer = 0;
    let resumeFrame = 0;
    const updateVisibility = (visible: boolean) => {
      if (visibleRef.current === visible) return;
      visibleRef.current = visible;
      if (visible) {
        resumeFrame = window.requestAnimationFrame(() => setIsVisible(true));
      } else {
        window.cancelAnimationFrame(resumeFrame);
        setIsVisible(false);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      fallbackTimer = window.setTimeout(() => updateVisibility(true), 0);
    } else {
      observer = new IntersectionObserver((entries) => {
        updateVisibility(entries.some((entry) => entry.isIntersecting));
      }, { threshold: Math.max(0, Math.min(1, threshold)) });
      observer.observe(node);
    }

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallbackTimer);
      window.cancelAnimationFrame(resumeFrame);
      visibleRef.current = false;
    };
  }, [text, threshold, respectReducedMotion]);

  const getDelay = (index: number) => {
    if (animationMode === "sequence") return index * safeStagger;
    if (animationMode === "center") return Math.abs(index - (chars.length - 1) / 2) * safeStagger;
    if (animationMode === "random") {
      const length = Math.max(1, chars.length);
      return (((index * 17 + 11) % length) / length) * safeStagger * length;
    }
    const oddCount = Math.floor(chars.length / 2);
    const evenStart = oddCount
      ? (safeDuration + Math.max(0, oddCount - 1) * safeStagger) * 0.7
      : 0;
    return index % 2 === 1
      ? Math.floor(index / 2) * safeStagger
      : evenStart + (index / 2) * safeStagger;
  };

  const resolveGlyph = (character: string, index: number, glyphIndex: number) => {
    if (!scrambleCharset) return character;
    const seed = Math.abs(index * 19 + glyphIndex * 11 + 7);
    return charset[seed % charset.length] || character;
  };

  return (
    <Tag
      ref={rootRef as Ref<HTMLElement>}
      className={("ps-name-shuffle " + className).trim()}
      style={{
        ...style,
        textAlign,
        "--ps-chroma-char-count": Math.max(1, chars.length),
        "--ps-chroma-background-size": Math.max(1, chars.length) * 100 + "%",
      } as CSSProperties}
      aria-label={text}
      data-shuffle-effect={effect}
      data-shuffle-direction={shuffleDirection}
      data-shuffle-active={isVisible ? "true" : "false"}
    >
      <span className="ps-name-shuffle__content" aria-hidden="true">
        {chars.map((character, index) => {
          if (character === " ") {
            return <span className="ps-name-shuffle__space" key={index}>{"\u00a0"}</span>;
          }
          const glyphs = [
            character,
            ...Array.from({ length: rolls }, (_, glyphIndex) => resolveGlyph(character, index, glyphIndex)),
            character,
          ];
          const itemCount = glyphs.length;
          const itemSize = 100 / itemCount;
          const endOffset = -((itemCount - 1) / itemCount) * 100;
          const delay = getDelay(index);
          return (
            <span className="ps-name-shuffle__cell" key={index}>
              <span className="ps-name-shuffle__sizer">{character}</span>
              <span className="ps-name-shuffle__window">
              <span
                className="ps-name-shuffle__track"
                style={{
                  ["--shuffle-item-size" as string]: itemSize + "%",
                  ["--shuffle-track-size" as string]: itemCount * 100 + "%",
                  ["--shuffle-end" as string]: endOffset + "%",
                  ["--shuffle-duration" as string]: safeDuration + "s",
                  ["--shuffle-delay" as string]: delay + "s",
                  ["--ps-chroma-position" as string]: (chars.length <= 1 ? 50 : (index / (chars.length - 1)) * 100) + "%",
                  ["--shuffle-ease" as string]: ease === "expo.out"
                    ? "cubic-bezier(.16,1,.3,1)"
                    : ease === "power2.out"
                      ? "cubic-bezier(.12,.78,.22,1)"
                      : "cubic-bezier(.16,1,.3,1)",
                } as CSSProperties}
              >
                {glyphs.map((glyph, glyphIndex) => (
                  <span
                    key={glyphIndex}
                    style={{
                      ["--shuffle-glyph-delay" as string]: (glyphIndex * safeStagger * 0.55) + "s",
                    } as CSSProperties}
                  >
                    {glyph}
                  </span>
                ))}
              </span>
              </span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
