'use client';

import { useMemo, type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
};

function signalOrder(length: number) {
  const values = Array.from({ length }, (_, index) => index);
  let seed = 0x51a7;
  for (let i = values.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  const order = new Array<number>(length);
  values.forEach((index, rank) => { order[index] = rank; });
  return order;
}

/** Original Signal Bloom lettering: violet contour with a staggered luminous fill. */
export default function SignalBloomDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  previewMode = false,
}: Props) {
  const Tag = tag;
  const chars = useMemo(() => Array.from(String(text ?? "")), [text]);
  const order = useMemo(() => signalOrder(chars.length), [chars.length]);
  const rootStyle = {
    ...style,
    "--signal-cycle": previewMode ? "9.2s" : "10.4s",
    "--signal-stagger": previewMode ? "38ms" : "46ms",
  } as CSSProperties;

  return (
    <Tag className={className + " ps-signal-bloom"} style={rootStyle} aria-label={text}>
      <span className="ps-signal-bloom__line" aria-hidden="true">
        {chars.map((char, index) => (
          <span
            className="ps-signal-bloom__glyph"
            data-char={char === " " ? "\u00a0" : char}
            style={{ "--signal-order": order[index] } as CSSProperties}
            key={index}
          >
            {char === " " ? "\u00a0" : char}
          </span>
        ))}
      </span>
    </Tag>
  );
}
