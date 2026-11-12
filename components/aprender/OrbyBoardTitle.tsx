"use client";

import { useEffect, useRef, useState } from "react";

export default function OrbyBoardTitle({ text, animate = true, className = "", onComplete }: {
  text: string;
  animate?: boolean;
  className?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  const [written, setWritten] = useState(() => animate ? "" : text);
  const [finished, setFinished] = useState(() => !animate || Array.from(text).length === 0);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const glyphs = Array.from(text);
    let index = 0;
    let timer: number | null = null;
    let completionTimer: number | null = null;
    let cancelled = false;
    let completed = false;
    const finishWriting = () => {
      if (cancelled || completed) return;
      completed = true;
      setWritten(text);
      setFinished(true);
      // Wait for the yellow marker to finish drawing before the tutor speaks.
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      completionTimer = window.setTimeout(
        () => { if (!cancelled) onCompleteRef.current?.(); },
        reducedMotion ? 0 : 710,
      );
    };

    if (!animate || glyphs.length === 0) {
      timer = window.setTimeout(finishWriting, 0);
    } else {
      const writeNext = () => {
        if (cancelled) return;
        index += 1;
        setWritten(glyphs.slice(0, index).join(""));
        if (index >= glyphs.length) {
          finishWriting();
          return;
        }
        const last = glyphs[index - 1];
        const pause = /[,;:]/.test(last) ? 150 : /[.!?]/.test(last) ? 210 : 58;
        timer = window.setTimeout(writeNext, pause);
      };
      timer = window.setTimeout(writeNext, 120);
    }

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
    };
  }, [text, animate]);

  return (
    <>
      <style>{`
        .orby-board-title-highlight { position:relative; isolation:isolate; }
        .orby-board-title-highlight::after {
          content:""; position:absolute; z-index:-1; left:-.025em; right:-.025em; bottom:.055em;
          height:.72em; border-radius:.18em; opacity:.58;
          background:linear-gradient(90deg,#fde047 0%,#facc15 62%,#fef08a 100%);
          transform:scaleX(0); transform-origin:left center;
        }
        .orby-board-title-highlight[data-orby-title-writing="complete"]::after {
          animation:orby-title-marker-draw 620ms cubic-bezier(.16,1,.3,1) 90ms both;
        }
        @keyframes orby-title-marker-draw { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @media(prefers-reduced-motion:reduce) {
          .orby-board-title-highlight::after { transform:scaleX(1); }
          .orby-board-title-highlight[data-orby-title-writing="complete"]::after { animation:none; }
        }
      `}</style>
      <h2
      aria-label={text}
      data-orby-title-writing={finished ? "complete" : "writing"}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing inline-block max-w-full break-words text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl " + className}
    >
      <span aria-hidden="true">{written}</span>
      {!finished ? (
        <svg className="orby-board-title-pencil" viewBox="0 0 28 28" aria-hidden="true">
          <path d="M5 19.8 18.9 5.9a2.7 2.7 0 0 1 3.8 3.8L8.8 23.6 4 24.8Z" fill="#f4c542" stroke="#343434" strokeWidth="1.25" strokeLinejoin="round"/>
          <path d="m4 24.8 1.2-5 3.8 3.8Z" fill="#f1c6a6" stroke="#343434" strokeWidth="1.1" strokeLinejoin="round"/>
          <path d="m18.9 5.9 3.8 3.8" stroke="#343434" strokeWidth="1.1"/>
          <path d="m4 24.8 1.8-.5-1.3-1.3Z" fill="#343434"/>
        </svg>
      ) : null}
      </h2>
    </>
  );
}
