"use client";

import { createElement, type CSSProperties, useEffect, useRef, useState } from "react";

export default function OrbyBoardTitle({ text, animate = true, paused = false, className = "", onComplete }: {
  text: string;
  animate?: boolean;
  paused?: boolean;
  className?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  const visibleCharactersRef = useRef(animate ? 0 : Array.from(text).length);
  const completedTextRef = useRef<string | null>(null);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const characters = Array.from(text);
  // Keep the handwritten title crisp and quick, like a real teacher writing
  // the heading before the explanation begins.
  const duration = Math.min(4_200, Math.max(650, characters.length * 64));
  const [visibleCharacters, setVisibleCharacters] = useState(animate ? 0 : characters.length);
  const progress = characters.length ? visibleCharacters / characters.length : 1;
  const finished = visibleCharacters >= characters.length;
  const glyphs = characters.map((character, index) => createElement("span", { key: index, className: "orby-board-title-glyph", style: { opacity: index < visibleCharacters ? 1 : 0 } }, character === " " ? "\u00a0" : character));

  useEffect(() => {
    let completionTimer: number | null = null;
    const completeWithoutAnimation = !animate || !text.trim()
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const completeOnce = () => {
      if (completedTextRef.current === text) return;
      completedTextRef.current = text;
      onCompleteRef.current?.();
    };

    if (completeWithoutAnimation) {
      visibleCharactersRef.current = characters.length;
      completionTimer = window.setTimeout(() => {
        setVisibleCharacters(characters.length);
        completeOnce();
      }, 0);
      return () => { if (completionTimer !== null) window.clearTimeout(completionTimer); };
    }

    // Pausing the lesson also pauses the title's interval. The ref preserves
    // the exact glyph count, so resuming never restarts or skips the heading.
    if (paused) return;

    let count = visibleCharactersRef.current;
    if (count >= characters.length) {
      completionTimer = window.setTimeout(completeOnce, 180);
      return () => { if (completionTimer !== null) window.clearTimeout(completionTimer); };
    }

    const baseInterval = Math.max(42, Math.min(66, duration / Math.max(1, characters.length)));
    let glyphTimer: number | null = null;
    const getNextGlyphDelay = (character: string, nextCharacter: string | undefined) => {
      // A teacher naturally pauses between words and at punctuation instead
      // of revealing every glyph with a metronomic interval.
      if (/[.!?…]/u.test(character)) return baseInterval + 190;
      if (/[,;:]/u.test(character)) return baseInterval + 115;
      if (/\\s/u.test(character)) return baseInterval + 34;
      if (nextCharacter && /[.!?,;:]/u.test(nextCharacter)) return baseInterval + 12;
      return baseInterval;
    };
    const writeNextGlyph = () => {
      count = Math.min(characters.length, count + 1);
      visibleCharactersRef.current = count;
      setVisibleCharacters(count);
      if (count >= characters.length) {
        completionTimer = window.setTimeout(completeOnce, 180);
        return;
      }
      glyphTimer = window.setTimeout(
        writeNextGlyph,
        getNextGlyphDelay(characters[count - 1], characters[count]),
      );
    };
    glyphTimer = window.setTimeout(writeNextGlyph, baseInterval);
    return () => {
      if (glyphTimer !== null) window.clearTimeout(glyphTimer);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
    };
  }, [text, animate, paused, duration, characters.length]);

  const style = {
    "--orby-title-write-duration": duration + "ms",
    "--orby-title-progress": (progress * 100) + "%",
  } as CSSProperties;
  const inkStyle = { clipPath: `inset(0 ${100 - progress * 100}% 0 0)` } as CSSProperties;

  return (
    <h2
      aria-label={text}
      data-orby-title-writing={finished ? "complete" : "writing"}
      data-orby-title-pencil={!finished && animate ? "moving" : "hidden"}
      data-orby-title-paused={paused ? "true" : "false"}
      style={style}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing relative inline-block max-w-full overflow-visible break-words text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl " + className}
    >
      <span className="orby-board-title-ink" aria-hidden="true" style={inkStyle}>{glyphs}</span>
      {!finished && animate ? (
        <svg
          className="orby-board-title-pencil"
          aria-hidden="true"
          viewBox="0 0 30 30"
          style={{ left: `calc(${progress * 100}% - 4px)` }}
        >
          <path d="M5.2 22.1 19.1 8.2l3.9 3.9L9.1 26H5.2z" fill="#fff" stroke="#171717" strokeWidth="1.65" strokeLinejoin="round" />
          <path d="m19.1 8.2 2.4-2.4a2.2 2.2 0 0 1 3.1 0l1.5 1.5a2.2 2.2 0 0 1 0 3.1l-2.4 2.4z" fill="#fff" stroke="#171717" strokeWidth="1.65" strokeLinejoin="round" />
          <path d="m5.2 22.1 3.9 3.9-4.8 1.1z" fill="#171717" stroke="#171717" strokeWidth="1" strokeLinejoin="round" />
          <path d="m8.4 22.8 12.1-12.1" fill="none" stroke="#171717" strokeWidth="1.1" strokeLinecap="round" />
          <path d="m21.4 7.5 3.1 3.1" fill="none" stroke="#171717" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      ) : null}
    </h2>
  );
}
