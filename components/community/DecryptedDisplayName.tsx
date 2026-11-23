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
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: RevealDirection;
  characters?: string;
  scrambleColor?: string;
  loop?: boolean;
  loopDelay?: number;
  animateOn?: "view" | "mount";
};

const DEFAULT_GLYPHS = "0123456789ABCDEF";
const glyphWidths = new Map<string, Map<string, number>>();
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

function getGlyphWidth(font: string, glyph: string) {
  let byGlyph = glyphWidths.get(font);
  if (!byGlyph) {
    byGlyph = new Map<string, number>();
    glyphWidths.set(font, byGlyph);
  }
  const cached = byGlyph.get(glyph);
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return 0;
  measureContext = measureContext || document.createElement("canvas").getContext("2d");
  if (!measureContext) return 0;
  measureContext.font = font;
  const width = measureContext.measureText(glyph).width;
  byGlyph.set(glyph, width);
  return width;
}

function makeInitialFrame(characters: string[], pool: string[]): Frame {
  const safePool = pool.length ? pool : ["0", "1"];
  return {
    shown: characters.map((character, index) => {
      if (isSpace(character)) return character;
      const code = character.codePointAt(0) ?? index;
      return safePool[(code + index * 7) % safePool.length];
    }),
    revealed: characters.map(isSpace),
    squeeze: characters.map(() => 1)
  };
}

function createRevealOrder(characters: string[], direction: RevealDirection) {
  const order = characters.map((character, index) => ({ character, index }))
    .filter((entry) => !isSpace(entry.character))
    .map((entry) => entry.index);
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
  speed = 40,
  maxIterations = 10,
  sequential = true,
  revealDirection = "random",
  characters = DEFAULT_GLYPHS,
  scrambleColor = "#2bb673",
  loop = false,
  loopDelay = 1800,
  animateOn = "view"
}: Props) {
  const Tag = tag;
  const graphemes = useMemo(() => splitGraphemes(String(text ?? "")), [text]);
  const pool = useMemo(() => Array.from(characters || DEFAULT_GLYPHS), [characters]);
  const [frame, setFrame] = useState<Frame>(() => makeInitialFrame(graphemes, pool));
  const revealedRef = useRef(frame.revealed);
  const containerRef = useRef<HTMLElement | null>(null);
  const speedStep = Math.max(16, speed);

  useEffect(() => {
    let disposed = false;
    let ticker: ReturnType<typeof setInterval> | null = null;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;
    let hasStarted = false;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const resetFrame = () => {
      const initial = makeInitialFrame(graphemes, pool);
      revealedRef.current = initial.revealed;
      setFrame(initial);
    };

    const fitGlyph = (index: number, glyph: string) => {
      const node = containerRef.current;
      if (!node || typeof window === "undefined" || isSpace(glyph)) return 1;
      const computed = window.getComputedStyle(node);
      const font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const spacing = Number.parseFloat(computed.letterSpacing) || 0;
      const originalWidth = getGlyphWidth(font, graphemes[index] ?? glyph) + spacing;
      const glyphWidth = getGlyphWidth(font, glyph) + spacing;
      if (!originalWidth || !glyphWidth || glyphWidth <= originalWidth + 0.01) return 1;
      return Math.round(Math.max(0.05, originalWidth / glyphWidth) * 1000) / 1000;
    };

    const finish = () => {
      const complete: Frame = {
        shown: graphemes,
        revealed: graphemes.map(() => true),
        squeeze: graphemes.map(() => 1)
      };
      revealedRef.current = complete.revealed;
      setFrame(complete);
      if (loop && !reducedMotion && !disposed) {
        restartTimer = setTimeout(() => {
          if (!disposed) {
            hasStarted = false;
            play();
          }
        }, Math.max(500, loopDelay));
      }
    };

    const play = () => {
      if (disposed || hasStarted) return;
      hasStarted = true;
      if (reducedMotion) {
        finish();
        return;
      }

      resetFrame();
      const order = createRevealOrder(graphemes, revealDirection);
      if (order.length === 0) {
        finish();
        return;
      }
      let cursor = 0;
      const perTick = sequential ? 1 : Math.max(1, Math.ceil(order.length / Math.max(1, maxIterations)));

      ticker = setInterval(() => {
        if (disposed) return;
        const nextRevealed = [...revealedRef.current];
        for (let count = 0; count < perTick && cursor < order.length; count += 1) {
          nextRevealed[order[cursor]] = true;
          cursor += 1;
        }
        const nextShown = graphemes.map((character, index) => {
          if (isSpace(character) || nextRevealed[index]) return character;
          return pool[Math.floor(Math.random() * pool.length)] ?? character;
        });
        const nextFrame: Frame = {
          shown: nextShown,
          revealed: nextRevealed,
          squeeze: nextShown.map((glyph, index) => nextRevealed[index] ? 1 : fitGlyph(index, glyph))
        };
        revealedRef.current = nextRevealed;
        setFrame(nextFrame);
        if (cursor >= order.length) {
          if (ticker) clearInterval(ticker);
          ticker = null;
          finish();
        }
      }, speedStep);
    };

    resetFrame();
    if (animateOn === "mount" || typeof IntersectionObserver === "undefined") {
      play();
    } else {
      const node = containerRef.current;
      if (!node) {
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
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      if (ticker) clearInterval(ticker);
      if (restartTimer) clearTimeout(restartTimer);
    };
  }, [graphemes, pool, speedStep, maxIterations, sequential, revealDirection, loop, loopDelay, animateOn]);

  const groups = useMemo(() => {
    const result: Array<string | { key: number; indices: number[] }> = [];
    let word: { key: number; indices: number[] } | null = null;
    graphemes.forEach((character, index) => {
      if (isSpace(character)) {
        result.push(character);
        word = null;
        return;
      }
      if (!word) {
        word = { key: index, indices: [] };
        result.push(word);
      }
      word.indices.push(index);
    });
    return result;
  }, [graphemes]);

  return (
    <Tag
      ref={(node: HTMLElement | null) => { containerRef.current = node; }}
      className={[`ps-decrypted-name name-enter-decrypt`, className].filter(Boolean).join(" ")}
      style={{ ...style, "--ps-decrypt-color": scrambleColor, display: "inline-block", maxWidth: "100%" } as CSSProperties}
      aria-label={text}
    >
      <span className="ps-decrypted-sr-only">{text}</span>
      <span className="ps-decrypted-content" aria-hidden="true">
        {groups.map((group, groupIndex) => typeof group === "string" ? (
          <span key={`space-${groupIndex}`}>{group}</span>
        ) : (
          <span className="ps-decrypted-word" key={group.key}>
            {group.indices.map((index) => {
              const character = graphemes[index];
              const revealed = frame.revealed[index] ?? true;
              if (revealed) {
                return <span className="ps-decrypted-cell is-revealed" key={index}>{character}</span>;
              }
              const glyph = frame.shown[index] ?? character;
              return (
                <span className="ps-decrypted-cell is-encrypted" key={index}>
                  <span className="ps-decrypted-ghost">{character}</span>
                  <span
                    className="ps-decrypted-glyph"
                    style={{
                      color: scrambleColor,
                      transform: `translateX(-50%) scaleX(${frame.squeeze[index] ?? 1})`
                    }}
                  >
                    {glyph}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </Tag>
  );
}
