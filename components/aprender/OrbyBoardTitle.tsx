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

    setVisibleCharacters(0);
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
      data-orby-title-pencil={!finished && animate ? "moving" : "hidden"}
      style={style}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing relative inline-block max-w-full overflow-visible break-words text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl " + className}
    >
      <span className="orby-board-title-ink" aria-hidden="true" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>{text}</span>
      {!finished && animate ? (
        <svg
          className="orby-board-title-pencil"
          aria-hidden="true"
          viewBox="0 0 30 30"
          style={{ left: `calc(${progress * 100}% - 4px)` }}
        >
          <path d="M5 21.8 18.6 8.2l4.2 4.2L9.2 26H5z" fill="#f2c46d" stroke="#55483b" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="m18.6 8.2 2.2-2.2a2.1 2.1 0 0 1 3 0l2.1 2.1a2.1 2.1 0 0 1 0 3l-2.1 2.1z" fill="#ed9fb1" stroke="#55483b" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="m5 21.8 4.2 4.2L5 27z" fill="#55483b" />
          <path d="m7.2 23.9 13.6-13.6" fill="none" stroke="#fff4d9" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      ) : null}
    </h2>
  );
}
