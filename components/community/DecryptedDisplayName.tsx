"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type DecryptTag = "strong" | "span" | "h2" | "h3";
type RevealDirection = "start" | "end" | "center" | "random";
type Frame = { shown: string[]; revealed: boolean[]; squeeze: number[] };

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: DecryptTag;
  id?: string;
  speed?: number;
  maxIterations?: number;
  durationMs?: number;
  sequential?: boolean;
  revealDirection?: RevealDirection;
  characters?: string;
  scrambleColor?: string;
  loop?: boolean;
  loopDelay?: number;
  animateOn?: "view" | "mount";
  forceMotion?: boolean;
};

const DEFAULT_GLYPHS = "0123456789ABCDEF";
const widthCache = new Map<string, Map<string, number>>();
let measureContext: CanvasRenderingContext2D | null = null;

function splitGraphemes(value: string) {
  type SegmenterConstructor = new (
    locale?: string,
    options?: { granularity: "grapheme" }
  ) => { segment: (input: string) => Iterable<{ segment: string }> };
  const Segmenter = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (Segmenter) {
    return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(value), (part) => part.segment);
  }
  return Array.from(value);
}

function isSpace(character: string) {
  return /^\s+$/u.test(character);
}

function glyphWidth(font: string, character: string) {
  let byCharacter = widthCache.get(font);
  if (!byCharacter) {
    byCharacter = new Map<string, number>();
    widthCache.set(font, byCharacter);
  }
  const cached = byCharacter.get(character);
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return 0;
  measureContext = measureContext || document.createElement("canvas").getContext("2d");
  if (!measureContext) return 0;
  measureContext.font = font;
  const width = measureContext.measureText(character).width;
  byCharacter.set(character, width);
  return width;
}

function makeFrame(characters: string[], pool: string[], revealAll = false): Frame {
  const safePool = pool.length ? pool : ["0", "1"];
  const revealed = characters.map((character) => revealAll || isSpace(character));
  return {
    shown: characters.map((character, index) => {
      if (revealed[index]) return character;
      const code = character.codePointAt(0) ?? index;
      return safePool[(code + index * 7) % safePool.length];
    }),
    revealed,
    squeeze: characters.map(() => 1)
  };
}

function revealOrder(characters: string[], direction: RevealDirection) {
  const order = characters
    .map((character, index) => ({ character, index }))
    .filter(({ character }) => !isSpace(character))
    .map(({ index }) => index);

  if (direction === "end") return order.reverse();
  if (direction === "center") {
    const middle = (characters.length - 1) / 2;
    return order.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
  }
  if (direction === "random") {
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
  }
  return order;
}

export default function DecryptedDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  id,
  speed = 40,
  maxIterations = 10,
  durationMs = 2200,
  sequential = true,
  revealDirection = "random",
  characters = DEFAULT_GLYPHS,
  scrambleColor = "#2bb673",
  loop = false,
  loopDelay = 1800,
  animateOn = "view",
  forceMotion = false
}: Props) {
  const Tag = tag;
  const graphemes = useMemo(() => splitGraphemes(String(text ?? "")), [text]);
  const pool = useMemo(() => Array.from(characters || DEFAULT_GLYPHS), [characters]);
  const [frame, setFrame] = useState<Frame>(() => makeFrame(graphemes, pool));
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const hasPlayedRef = useRef(false);
  const safeSpeed = Math.max(24, speed);
  const safeDuration = Math.max(1200, durationMs);

  useEffect(() => {
    let disposed = false;
    let ticker: ReturnType<typeof setInterval> | null = null;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;

    hasPlayedRef.current = false;
    const reducedMotion = !forceMotion && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const initial = () => {
      const next = makeFrame(graphemes, pool);
      setFrame(next);
      return next;
    };

    const squeezeGlyph = (index: number, glyph: string) => {
      const node = contentRef.current;
      if (!node || typeof window === "undefined") return 1;
      const computed = window.getComputedStyle(node);
      const font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const spacing = Number.parseFloat(computed.letterSpacing) || 0;
      const originalWidth = glyphWidth(font, graphemes[index] ?? glyph) + spacing;
      const randomWidth = glyphWidth(font, glyph) + spacing;
      if (!originalWidth || !randomWidth || randomWidth <= originalWidth + 0.01) return 1;
      return Math.round(Math.max(0.05, originalWidth / randomWidth) * 1000) / 1000;
    };

    const complete = () => {
      if (disposed) return;
      setFrame({
        shown: graphemes,
        revealed: graphemes.map(() => true),
        squeeze: graphemes.map(() => 1)
      });
      // Keep the resolved text visible after the decode. Replaying the scramble
      // on a short loop made the preview look as though it lost trailing letters.
      if (loop && !reducedMotion) {
        restartTimer = setTimeout(() => {
          if (!disposed) {
            hasPlayedRef.current = false;
            play();
          }
        }, Math.max(500, loopDelay));
      }
    };

    const play = () => {
      if (disposed || hasPlayedRef.current) return;
      hasPlayedRef.current = true;
      if (reducedMotion) {
        complete();
        return;
      }

      let mask = initial().revealed;
      const order = revealOrder(graphemes, revealDirection);
      if (order.length === 0) {
        complete();
        return;
      }

      // Keep the scramble alive for a deliberate minimum-length sequence,
      // independent of how many graphemes the display name contains.
      // Glyphs refresh every safeSpeed ms; real characters resolve across durationMs.
      let elapsed = 0;
      let cursor = 0;
      const revealBatch = sequential
        ? 1
        : Math.max(1, Math.ceil(order.length / Math.max(1, maxIterations)));

      ticker = setInterval(() => {
        if (disposed) return;
        elapsed += safeSpeed;
        const progress = Math.min(1, elapsed / safeDuration);
        const scheduledCount = Math.floor(progress * order.length);
        const targetCursor = Math.min(
          order.length,
          sequential
            ? scheduledCount
            : Math.ceil(scheduledCount / revealBatch) * revealBatch
        );
        const nextMask = [...mask];

        while (cursor < targetCursor) {
          nextMask[order[cursor]] = true;
          cursor += 1;
        }

        const nextShown = graphemes.map((character, index) => {
          if (isSpace(character) || nextMask[index]) return character;
          return pool[Math.floor(Math.random() * pool.length)] ?? character;
        });
        const nextFrame: Frame = {
          shown: nextShown,
          revealed: nextMask,
          squeeze: nextShown.map((glyph, index) => nextMask[index] ? 1 : squeezeGlyph(index, glyph))
        };
        mask = nextMask;
        setFrame(nextFrame);

        if (progress >= 1 || cursor >= order.length) {
          if (ticker) clearInterval(ticker);
          ticker = null;
          complete();
        }
      }, safeSpeed);
    };

    const node = contentRef.current;
    if (animateOn === "mount" || typeof IntersectionObserver === "undefined" || !node) {
      play();
    } else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect();
          play();
        }
      }, { threshold: 0.12 });
      observer.observe(node);
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      if (ticker) clearInterval(ticker);
      if (restartTimer) clearTimeout(restartTimer);
    };
  }, [graphemes, pool, safeSpeed, safeDuration, maxIterations, sequential, revealDirection, loop, loopDelay, animateOn, forceMotion, className, style?.fontFamily, style?.fontSize, style?.fontWeight, style?.letterSpacing]);

  const safeStyle = {
    ...style,
    "--ps-decrypt-color": scrambleColor,
    "--ps-chroma-char-count": Math.max(1, graphemes.length),
    "--ps-chroma-background-size": Math.max(1, graphemes.length) * 100 + "%",
    display: "inline-flex",
    alignItems: "baseline",
    maxWidth: "100%",
    whiteSpace: "pre"
  } as CSSProperties;

  return (
    <Tag
      id={id}
      className={[`ps-decrypted-name name-enter-decrypt`, className].filter(Boolean).join(" ")}
      style={safeStyle}
      aria-label={text}
    >
      <span
        ref={contentRef}
        className="ps-decrypted-content"
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          maxWidth: "100%",
          whiteSpace: "pre",
          font: "inherit",
          letterSpacing: "inherit",
          lineHeight: "inherit",
        }}
      >
        {graphemes.map((character, index) => {
          if (isSpace(character)) return character;
          const revealed = frame.revealed[index] ?? false;
          if (revealed) {
            return <span
              className="ps-decrypted-cell is-revealed"
              data-glyph={character}
              key={index}
              style={{ flex: "0 0 auto", whiteSpace: "pre", "--ps-chroma-position": (graphemes.length <= 1 ? 50 : (index / (graphemes.length - 1)) * 100) + "%" } as CSSProperties}
            >{character}</span>;
          }
          const glyph = frame.shown[index] ?? character;
          return (
            <span
              className="ps-decrypted-cell is-encrypted"
              key={index}
              style={{ flex: "0 0 auto", whiteSpace: "pre", "--ps-chroma-position": (graphemes.length <= 1 ? 50 : (index / (graphemes.length - 1)) * 100) + "%" } as CSSProperties}
            >
              <span className="ps-decrypted-ghost">{character}</span>
              <span
                className="ps-decrypted-glyph"
                data-glyph={glyph}
                style={{ transform: `translateX(-50%) scaleX(${frame.squeeze[index] ?? 1})` }}
              >
                {glyph}
              </span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
