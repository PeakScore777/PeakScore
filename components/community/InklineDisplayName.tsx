'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Props = {
  text: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
};

/** A measured SVG lettering reveal with a restrained draw / hold / erase cycle. */
export default function InklineDisplayName({
  text,
  strokeColor = "currentColor",
  fillColor = "currentColor",
  strokeWidth = 1.4,
  fontWeight = 800,
  fontFamily = "inherit",
  className = "",
  style,
  tag = "strong",
}: Props) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chars = useMemo(() => Array.from(String(text ?? "")), [text]);
  const Tag = tag;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const node = textRef.current;
    if (!root || !node) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled || !textRef.current) return;
      try {
        const b = textRef.current.getBBox();
        if (!b.width || !b.height) return;
        const pad = Math.max(3, strokeWidth * 2);
        const next = { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 };
        setBox((prev) => prev && Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5 ? prev : next);
      } catch { /* SVG may not be measurable until its font is ready. */ }
    };
    measure();
    document.fonts?.ready?.then(measure).catch(() => {});
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(root);
    return () => { cancelled = true; observer?.disconnect(); };
  }, [text, fontFamily, fontWeight, strokeWidth]);

  const viewBox = box ? `${box.x} ${box.y} ${box.width} ${box.height}` : "0 -100 800 140";
  const sharedStyle = { ...style, maxWidth: "100%" } as CSSProperties;

  return (
    <Tag className={className + " ps-inkline-name"} style={sharedStyle} aria-label={text}>
      <span ref={rootRef} className="ps-inkline-measure" aria-hidden="true">
        <svg className="ps-inkline-svg" viewBox={viewBox} preserveAspectRatio="xMinYMid meet" aria-hidden="true" style={{ visibility: box ? "visible" : "hidden" }}>
          <defs>
            <clipPath id={`ps-inkline-${clipId}`} clipPathUnits="objectBoundingBox">
              <rect className="ps-inkline-wipe" x="0" y="0" width="1" height="1" />
            </clipPath>
          </defs>
          <text ref={textRef} x="0" y="0" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="ps-inkline-outline" style={{ fontFamily, fontWeight }}>
            {chars.map((char, index) => <tspan key={index}>{char === " " ? "\u00a0" : char}</tspan>)}
          </text>
          <text x="0" y="0" fill={fillColor} stroke="none" clipPath={`url(#ps-inkline-${clipId})`} className="ps-inkline-fill" style={{ fontFamily, fontWeight }}>
            {chars.map((char, index) => <tspan key={index}>{char === " " ? "\u00a0" : char}</tspan>)}
          </text>
        </svg>
      </span>
    </Tag>
  );
}
