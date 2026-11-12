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
  const duration = Math.min(6_200, Math.max(2_800, characters.length * 78));
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

    const resetTimer = window.setTimeout(() => setVisibleCharacters(0), 0);
    let count = 0;
    const interval = Math.max(48, duration / Math.max(1, characters.length));
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
      if (resetTimer !== null) window.clearTimeout(resetTimer);
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
