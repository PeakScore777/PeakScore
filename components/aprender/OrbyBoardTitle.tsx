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
    let cancelled = false;
    let completed = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finishWriting = () => {
      if (cancelled || completed) return;
      completed = true;
      setWritten(text);
      setFinished(true);
      onCompleteRef.current?.();
    };

    if (!animate || reducedMotion || glyphs.length === 0) {
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
        const pause = /[,;:]/.test(last) ? 155 : /[.!?]/.test(last) ? 240 : 72;
        timer = window.setTimeout(writeNext, pause);
      };
      timer = window.setTimeout(writeNext, 170);
    }

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [text, animate]);

  return (
    <>
      <style>{`
        .orby-board-title-highlight { position:relative; isolation:isolate; }
        .orby-board-title-highlight::after {
          content:""; position:absolute; z-index:-1; left:-.025em; right:-.025em; bottom:.055em;
          height:.24em; border-radius:999px; opacity:.92;
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
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing inline-block max-w-full break-words text-3xl font-medium leading-tight tracking-tight text-slate-950 sm:text-4xl " + className}
    >
      <span aria-hidden="true">{written}</span>
      {!finished ? <span className="orby-board-title-pen" aria-hidden="true"/> : null}
      </h2>
    </>
  );
}
