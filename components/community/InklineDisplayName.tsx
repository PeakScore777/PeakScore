'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import { observeNameMotionVisibility } from "./name-motion-visibility";

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
  strokeColor = "#A78BFA",
  fillColor = "currentColor",
  strokeWidth = 1.4,
  fontWeight = 800,
  fontFamily = "inherit",
  className = "",
  style,
  tag = "strong",
}: Props) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const motionRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chars = useMemo(() => Array.from(String(text ?? "")), [text]);
  const Tag = tag;
  const effectTokens = className.split(/\s+/);
  const chromaflow = effectTokens.includes("effect-chromaflow");
  const gradientFlow = effectTokens.includes("effect-gradient-flow");
  const gummy = effectTokens.includes("effect-gummy");
  const chromaflowGradientId = `ps-inkline-${clipId}-chromaflow`;
  const gradientFlowGradientId = `ps-inkline-${clipId}-gradient-flow`;
  const gummyGradientId = `ps-inkline-${clipId}-gummy`;
  const styleTokens = style as (CSSProperties & Record<string, unknown>) | undefined;
  const gummyPalette = typeof styleTokens?.["--name-prism-gradient"] === "string"
    ? (styleTokens["--name-prism-gradient"] as string).match(/#[0-9a-f]{6}/gi) ?? []
    : [];
  const gummyStops = gummyPalette.length >= 2
    ? gummyPalette
    : ["#F6A8CF", "#FFE2B8", "#FFFFFF", "#B7F1E0", "#A9C8FF", "#D5A6FF"];

  const forceMotion = effectTokens.includes("ps-community-name-preview-live");

  useEffect(() => {
    const node = motionRef.current;
    if (forceMotion) {
      if (node) node.dataset.motionVisible = "true";
      return;
    }
    return observeNameMotionVisibility(node);
  }, [forceMotion]);

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
    <Tag ref={motionRef as Ref<HTMLElement>} className={className + " ps-inkline-name"} style={sharedStyle} aria-label={text} data-motion-visible={forceMotion ? "true" : "false"}>
      <span ref={rootRef} className="ps-inkline-measure" aria-hidden="true">
        <svg className="ps-inkline-svg" viewBox={viewBox} preserveAspectRatio="xMinYMid meet" aria-hidden="true" style={{ visibility: box ? "visible" : "hidden" }}>
          <defs>
            {chromaflow && (
              <linearGradient id={chromaflowGradientId} x1="-50%" y1="0%" x2="150%" y2="0%">
                <stop offset="0%" stopColor="#ffb52e"/>
                <stop offset="12.5%" stopColor="#f5e84a"/>
                <stop offset="25%" stopColor="#43df9a"/>
                <stop offset="37.5%" stopColor="#35c9dc"/>
                <stop offset="50%" stopColor="#4d8cff"/>
                <stop offset="62.5%" stopColor="#a66cff"/>
                <stop offset="75%" stopColor="#f05bc8"/>
                <stop offset="87.5%" stopColor="#ff665e"/>
                <stop offset="100%" stopColor="#ffb52e"/>
                <animateTransform attributeName="gradientTransform" attributeType="XML" type="translate" values="-0.5 0;0.5 0;-0.5 0" dur="4.8s" repeatCount="indefinite"/>
              </linearGradient>
            )}
            {gradientFlow && (
              <linearGradient id={gradientFlowGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E84DE8"/>
                <stop offset="24%" stopColor="#A34DFF"/>
                <stop offset="48%" stopColor="#527CFF"/>
                <stop offset="68%" stopColor="#31B9D2"/>
                <stop offset="84%" stopColor="#48D8A2"/>
                <stop offset="100%" stopColor="#E84DE8"/>
                <animateTransform attributeName="gradientTransform" attributeType="XML" type="translate" values="-1 0;1 0;-1 0" dur="5.2s" repeatCount="indefinite"/>
              </linearGradient>
            )}
            {gummy && (
              <linearGradient id={gummyGradientId} x1="-35%" y1="0%" x2="135%" y2="0%">
                {gummyStops.map((stop, index) => (
                  <stop key={stop + index} offset={(index / Math.max(1, gummyStops.length - 1) * 100) + "%"} stopColor={stop}/>
                ))}
                <animateTransform attributeName="gradientTransform" attributeType="XML" type="translate" values="-0.35 0;0.35 0;-0.35 0" dur="7.2s" repeatCount="indefinite"/>
              </linearGradient>
            )}
          </defs>
          <text ref={textRef} x="0" y="0" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" className="ps-inkline-outline" style={{ fontFamily, fontWeight }}>
            {chars.map((char, index) => <tspan key={index}>{char === " " ? "\u00a0" : char}</tspan>)}
          </text>
          <text x="0" y="0" fill={gradientFlow ? `url(#${gradientFlowGradientId})` : chromaflow ? `url(#${chromaflowGradientId})` : gummy ? `url(#${gummyGradientId})` : fillColor} stroke="none" className="ps-inkline-fill" style={{ fontFamily, fontWeight }}>
            {chars.map((char, index) => <tspan key={index}>{char === " " ? "\u00a0" : char}</tspan>)}
          </text>
        </svg>
      </span>
    </Tag>
  );
}
