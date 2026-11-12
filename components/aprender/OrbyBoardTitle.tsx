"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

export default function OrbyBoardTitle({ text, animate = true, className = "", onComplete }: {
  text: string;
  animate?: boolean;
  className?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const characters = Array.from(text);
  const duration = Math.min(3_200, Math.max(1_200, characters.length * 43));
  const [visibleCharacters, setVisibleCharacters] = useState(animate ? 0 : characters.length);
  const progress = characters.length ? visibleCharacters / characters.length : 1;
  const finished = visibleCharacters >= characters.length;

  useEffect(() => {
    let completionTimer: number | null = null;
    if (!animate || !text.trim() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      completionTimer = window.setTimeout(() => {
        setVisibleCharacters(characters.length);
        onCompleteRef.current?.();
      }, 0);
      return () => { if (completionTimer !== null) window.clearTimeout(completionTimer); };
    }

    let count = 0;
    const interval = Math.max(24, duration / Math.max(1, characters.length));
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleCharacters(count);
      if (count >= characters.length) {
        window.clearInterval(timer);
        completionTimer = window.setTimeout(() => onCompleteRef.current?.(), 180);
      }
    }, interval);
    return () => {
      window.clearInterval(timer);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
    };
  }, [text, animate, duration, characters.length]);

  const style = {
    "--orby-title-write-duration": duration + "ms",
    "--orby-title-progress": (progress * 100) + "%",
  } as CSSProperties;

  return (
    <h2
      aria-label={text}
      data-orby-title-writing={finished ? "complete" : "writing"}
      style={style}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing relative inline-block max-w-full break-words text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl " + className}
    >
      <span className="orby-board-title-ink" aria-hidden="true" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>{text}</span>
      {!finished ? (
        <svg className="orby-board-title-pencil" viewBox="0 0 36 36" aria-hidden="true" style={{ left: `calc(${progress * 100}% - 18px)` }}>
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
