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
    <h2
      aria-label={text}
      data-orby-title-writing={finished ? "complete" : "writing"}
      className={"orby-board-handwriting orby-board-title-highlight orby-board-title-writing inline-block max-w-full break-words text-3xl font-medium leading-tight tracking-tight text-slate-950 sm:text-4xl " + className}
    >
      <span aria-hidden="true">{written}</span>
      {!finished ? <span className="orby-board-title-pen" aria-hidden="true"/> : null}
    </h2>
  );
}
