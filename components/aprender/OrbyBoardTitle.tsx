"use client";

import { createElement, type AnimationEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type TitlePhase = "writing" | "highlighting" | "complete";

function getNextGlyphDelay(glyph: string, nextGlyph: string | undefined, baseInterval: number) {
  if (/[.!?…]/u.test(glyph)) return baseInterval + 190;
  if (/[,;:]/u.test(glyph)) return baseInterval + 115;
  if (/\s/u.test(glyph)) return baseInterval + 34;
  if (nextGlyph && /[.!?,;:]/u.test(nextGlyph)) return baseInterval + 20;
  return baseInterval;
}

export default function OrbyBoardTitle({
  text,
  animate = true,
  paused = false,
  className = "",
  onComplete,
}: {
  text: string;
  animate?: boolean;
  paused?: boolean;
  className?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  const visibleCharactersRef = useRef(animate ? 0 : Array.from(text).length);
  const completedTextRef = useRef<string | null>(null);
  const activeTextRef = useRef(text);
  const characters = useMemo(() => Array.from(text), [text]);
  const duration = Math.min(5_000, Math.max(1_500, characters.length * 230));
  const [visibleCharacters, setVisibleCharacters] = useState(animate ? 0 : characters.length);
  const [phase, setPhase] = useState<TitlePhase>(animate ? "writing" : "complete");
  const progress = characters.length ? visibleCharacters / characters.length : 1;
  const style = {
    "--orby-title-write-duration": duration + "ms",
    "--orby-title-progress": progress * 100 + "%",
    "--orby-title-marker-duration": "680ms",
    "--orby-title-animation-state": paused ? "paused" : "running",
  } as CSSProperties;
  const inkStyle = { clipPath: `inset(0 ${100 - progress * 100}% 0 0)` } as CSSProperties;
  const glyphs = characters.map((character, index) =>
    createElement("span", { key: index, className: "orby-board-title-glyph" }, character === " " ? "\u00a0" : character),
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (activeTextRef.current === text) return;
    activeTextRef.current = text;
    visibleCharactersRef.current = 0;
    completedTextRef.current = null;
    setVisibleCharacters(0);
    setPhase(animate ? "writing" : "complete");
  }, [text, animate]);

  useEffect(() => {
    let glyphTimer: number | null = null;
    let frame: number | null = null;
    const finish = () => {
      if (completedTextRef.current === text) return;
      completedTextRef.current = text;
      onCompleteRef.current?.();
    };
    const noMotion = !animate || !text.trim() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (noMotion) {
      frame = window.requestAnimationFrame(() => {
        visibleCharactersRef.current = characters.length;
        setVisibleCharacters(characters.length);
        setPhase("complete");
        finish();
      });
      return () => {
        if (frame !== null) window.cancelAnimationFrame(frame);
      };
    }
    if (paused) return;
    if (phase !== "writing") return;

    let count = visibleCharactersRef.current;
    const interval = duration / Math.max(1, characters.length);
    const writeNextGlyph = () => {
      count = Math.min(characters.length, count + 1);
      visibleCharactersRef.current = count;
      setVisibleCharacters(count);
      if (count >= characters.length) {
        setPhase("highlighting");
        return;
      }
      glyphTimer = window.setTimeout(writeNextGlyph, getNextGlyphDelay(characters[count - 1], characters[count], interval));
    };
    glyphTimer = window.setTimeout(writeNextGlyph, interval);
    return () => {
      if (glyphTimer !== null) window.clearTimeout(glyphTimer);
    };
  }, [text, animate, paused, phase, duration, characters]);

  const markerEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.animationName !== "orby-title-marker-pencil" || phase !== "highlighting") return;
    setPhase("complete");
    if (completedTextRef.current !== text) {
      completedTextRef.current = text;
      onCompleteRef.current?.();
    }
  };

  return (
    <h2
      aria-label={text}
      data-orby-title-writing={phase}
      data-orby-title-pencil={phase === "writing" ? "moving" : "hidden"}
      data-orby-title-paused={paused ? "true" : "false"}
      style={style}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing relative inline-block max-w-full overflow-visible break-words text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl " + className}
    >
      <span className="orby-board-title-ink" aria-hidden="true" style={inkStyle}>{glyphs}</span>
      {phase === "writing" && animate ? (
        <svg
          className="orby-board-title-pencil"
          aria-hidden="true"
          viewBox="0 0 30 30"
          style={{ left: `calc(${progress * 100}% - 4px)` }}
        >
          <path d="M5.2 22.1 19.1 8.2l3.9 3.9L9.1 26H5.2z" fill="#fff" stroke="#171717" strokeWidth="1.65" strokeLinejoin="round" />
          <path d="m19.1 8.2 2.4-2.4a2.2 2.2 0 0 1 3.1 0l1.5 1.5a2.2 2.2 0 0 1 0 3.1l-2.4 2.4z" fill="#fff" stroke="#171717" strokeWidth="1.65" strokeLinejoin="round" />
          <path d="m5.2 22.1 3.9 3.9-4.8 1.1z" fill="#171717" stroke="#171717" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      ) : null}
      {phase === "highlighting" && animate ? (
        <span className="orby-board-title-marker-runner" aria-hidden="true" onAnimationEnd={markerEnd}>
          <svg className="orby-board-title-highlight-pencil" viewBox="0 0 38 22">
            <path d="M2 7 L28 7 L35 11 L28 15 L2 15 Z" fill="#f5c842" stroke="#6b5a2b" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M2 7 L7 11 L2 15 Z" fill="#fff4bc" stroke="#6b5a2b" strokeWidth=".8" />
          </svg>
        </span>
      ) : null}
    </h2>
  );
}
