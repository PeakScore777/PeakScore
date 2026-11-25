'use client';

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { observeNameMotionVisibility } from "./name-motion-visibility";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
};

function buildOrder(length: number) {
  const indices = Array.from({ length }, (_, i) => i);
  let seed = 0x6d2b79f5;
  for (let i = indices.length - 1; i > 0; i--) {
    seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) | 0;
    const j = (seed >>> 0) % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const rank = new Array<number>(length);
  indices.forEach((index, position) => { rank[index] = position; });
  return rank;
}

/** Halo Signal: randomized letter ignition, soft violet bloom and restrained flicker. */
export default function HaloSignalDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  previewMode = false,
}: Props) {
  const Tag = tag;
  const rootRef = useRef<HTMLElement | null>(null);
  const forceMotion = previewMode && className.split(/\s+/).includes("ps-community-name-preview-live");
  useEffect(() => {
    const node = rootRef.current;
    if (forceMotion) {
      if (node) node.dataset.motionVisible = "true";
      return;
    }
    return observeNameMotionVisibility(node);
  }, [forceMotion]);
  const chars = useMemo(() => Array.from(String(text ?? "")), [text]);
  const order = useMemo(() => buildOrder(chars.length), [chars.length]);
  const chromaScale = Math.max(2.6, chars.length);
  const rootStyle = {
    ...style,
    "--halo-cycle": previewMode ? "8.8s" : "10.8s",
    "--halo-step": previewMode ? "42ms" : "55ms",
    "--ps-chroma-char-count": Math.max(1, chars.length),
    "--ps-chroma-background-size": chromaScale * 100 + "%",
    "--ps-chroma-shift-end": (chromaScale / (chromaScale - 1) * 100) + "%",
  } as CSSProperties;

  return (
    <Tag ref={(node) => { rootRef.current = node; }} className={className + " ps-halo-signal"} style={rootStyle} aria-label={text} data-motion-visible={forceMotion ? "true" : "false"}>
      <span className="ps-halo-signal__text" aria-hidden="true">
        {chars.map((char, index) => (
          <span
            className="ps-halo-signal__glyph"
            data-glyph={char === " " ? "\u00a0" : char}
            key={index}
            style={{
              "--halo-order": order[index],
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
