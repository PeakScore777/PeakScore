"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

export default function OrbyBoardTitle({ text, animate = true, className = "", onComplete }: {
  text: string;
  animate?: boolean;
  className?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  const [finished, setFinished] = useState(!animate || text.length === 0);
  const duration = Math.min(3_600, Math.max(1_350, Array.from(text).length * 58));

  useEffect(() => {
    let completionTimer: number | null = null;
    let resetTimer: number | null = null;
    let writingTimer: number | null = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || !text.trim() || reducedMotion) {
      completionTimer = window.setTimeout(() => {
        if (cancelled) return;
        setFinished(true);
        onCompleteRef.current?.();
      }, 0);
    } else {
      resetTimer = window.setTimeout(() => {
        if (!cancelled) setFinished(false);
      }, 0);
      writingTimer = window.setTimeout(() => {
        if (cancelled) return;
        setFinished(true);
        completionTimer = window.setTimeout(() => {
          if (!cancelled) onCompleteRef.current?.();
        }, 360);
      }, duration);
    }

    return () => {
      cancelled = true;
      if (resetTimer !== null) window.clearTimeout(resetTimer);
      if (writingTimer !== null) window.clearTimeout(writingTimer);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
    };
  }, [text, animate, duration]);

  return (
    <h2
      aria-label={text}
      data-orby-title-writing={finished ? "complete" : "writing"}
      style={{ "--orby-title-write-duration": duration + "ms" } as CSSProperties}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing inline-block max-w-full break-words text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl " + className}
    >
      <span className="orby-board-title-ink" aria-hidden="true">{text}</span>
      {!finished ? (
        <svg className="orby-board-title-pencil" viewBox="0 0 28 28" aria-hidden="true">
          <path d="M5 19.8 18.9 5.9a2.7 2.7 0 0 1 3.8 3.8L8.8 23.6 4 24.8Z" fill="#f4c542" stroke="#343434" strokeWidth="1.25" strokeLinejoin="round"/>
          <path d="m4 24.8 1.2-5 3.8 3.8Z" fill="#f1c6a6" stroke="#343434" strokeWidth="1.1" strokeLinejoin="round"/>
          <path d="m18.9 5.9 3.8 3.8" stroke="#343434" strokeWidth="1.1"/>
          <path d="m4 24.8 1.8-.5-1.3-1.3Z" fill="#343434"/>
        </svg>
      ) : null}
    </h2>
  );
}