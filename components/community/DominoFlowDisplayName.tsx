'use client';

import { useMemo, type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
};

/** Stable staggered domino cascade for display-name lettering. */
export default function DominoFlowDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  previewMode = false,
}: Props) {
  const Tag = tag;
  const chars = useMemo(() => Array.from(String(text ?? "")), [text]);
  const chromaScale = Math.max(2.6, chars.length);
  const rootStyle = {
    ...style,
    "--domino-cycle": previewMode ? "8.2s" : "10.2s",
    "--domino-step": previewMode ? "64ms" : "82ms",
    "--ps-chroma-char-count": Math.max(1, chars.length),
    "--ps-chroma-background-size": chromaScale * 100 + "%",
    "--ps-chroma-shift-end": (chromaScale / (chromaScale - 1) * 100) + "%",
  } as CSSProperties;

  return (
    <Tag className={className + " ps-domino-flow"} style={rootStyle} aria-label={text}>
      <span className="ps-domino-flow__word" aria-hidden="true">
        {chars.map((char, index) => (
          <span
            className="ps-domino-flow__tile"
            key={index}
            style={{
              "--domino-index": index,
              "--ps-chroma-position": (chars.length <= 1 ? 50 : (index / (chars.length - 1)) * 100) + "%",
            } as CSSProperties}
          >
            {char === " " ? "\u00a0" : char}
          </span>
        ))}
      </span>
    </Tag>
  );
}
