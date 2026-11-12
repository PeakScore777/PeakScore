"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

export default function OrbyBoardTitle({ text, animate = true, className = "", onComplete }: {
  text: string;
  animate?: boolean;
  className?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [finished, setFinished] = useState(!animate || text.length === 0);
  const duration = Math.min(3_200, Math.max(1_200, Array.from(text).length * 43));

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
        <svg className="orby-board-title-pencil" viewBox="0 0 36 36" aria-hidden="true">
          <path d="m5.1 26.1 17.8-17.8 5.2 5.2-17.8 17.8-6.5 1.3Z" fill="#f4d58c" stroke="#292929" strokeWidth="1.45" strokeLinejoin="round"/>
          <path d="m5.1 26.1-1.3 6.5 6.5-1.3Z" fill="#e8b98e" stroke="#292929" strokeWidth="1.35" strokeLinejoin="round"/>
          <path d="m3.8 32.6 2.6-2.6 2.6 2.6Z" fill="#292929"/>
          <path d="m22.9 8.3 3.2-3.2a2.8 2.8 0 0 1 4 0l1.2 1.2a2.8 2.8 0 0 1 0 4l-3.2 3.2Z" fill="#d88986" stroke="#292929" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="m22.9 8.3 5.2 5.2M25.5 5.7l5.2 5.2" fill="none" stroke="#292929" strokeWidth="1.05"/>
          <path d="m5.1 26.1 5.2 5.2" fill="none" stroke="#9a6a37" strokeWidth="1.05"/>
        </svg>
      ) : null}
    </h2>
  );
}