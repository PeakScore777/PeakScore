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

/**
 * StrokeText-style Inkline: measured SVG glyphs, 1.6s outline draw,
 * 50ms character stagger, 200ms fill delay, left-to-right wipe and yoyo loop.
 * Web Animations reproduces the supplied reference without adding a dependency.
 */
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
  const layoutRef = useRef<HTMLSpanElement | null>(null);
  const motionRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);
  const wipeRef = useRef<SVGRectElement | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [dash, setDash] = useState(200);
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chars = useMemo(() => Array.from(String(text ?? "")), [text]);
  const Tag = tag;
  const effectTokens = className.split(/\s+/);
  const chromaflow = effectTokens.includes("effect-chromaflow");
  const gradientFlow = effectTokens.includes("effect-gradient-flow");
  const gummy = effectTokens.includes("effect-gummy");
  const chromaflowGradientId = "ps-inkline-" + clipId + "-chromaflow";
  const gradientFlowGradientId = "ps-inkline-" + clipId + "-gradient-flow";
  const gummyGradientId = "ps-inkline-" + clipId + "-gummy";
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
    const root = motionRef.current;
    const node = textRef.current;
    if (!root || !node) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled || !textRef.current || !motionRef.current) return;
      try {
        const bounds = textRef.current.getBBox();
        if (!bounds.width || !bounds.height) return;
        const computedSize = Number.parseFloat(getComputedStyle(motionRef.current).fontSize) || 16;
        const nextDash = Math.max(200, Math.ceil(computedSize * 7));
        const pad = Math.max(3, strokeWidth * 2);
        const next = {
          x: bounds.x - pad,
          y: bounds.y - pad,
          width: bounds.width + pad * 2,
          height: bounds.height + pad * 2,
        };
        setDash((previous) => previous === nextDash ? previous : nextDash);
        setBox((previous) =>
          previous &&
          Math.abs(previous.x - next.x) < 0.5 &&
          Math.abs(previous.y - next.y) < 0.5 &&
          Math.abs(previous.width - next.width) < 0.5 &&
          Math.abs(previous.height - next.height) < 0.5
            ? previous
            : next
        );
      } catch {
        // Keep the layout text available until SVG metrics load.
      }
    };
    measure();
    document.fonts?.ready?.then(measure).catch(() => {});
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(root);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [text, fontFamily, fontWeight, strokeWidth]);

  useEffect(() => {
    if (!box || !textRef.current || !wipeRef.current) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const glyphs = Array.from(textRef.current.querySelectorAll<SVGTSpanElement>("[data-inkline-char]"));
    const wipe = wipeRef.current;
    if (!glyphs.length) return;

    if (reduced) {
      glyphs.forEach((glyph) => { glyph.style.strokeDashoffset = "0px"; });
      wipe.setAttribute("width", String(box.width));
      return;
    }

    const drawMs = 1600;
    const staggerMs = 50;
    const fillDelayMs = 200;
    const fillMs = 800;
    const repeatDelayMs = 900;
    const lastStaggerMs = Math.max(0, glyphs.length - 1) * staggerMs;
    const fillStartMs = drawMs + lastStaggerMs + fillDelayMs;
    const forwardMs = fillStartMs + fillMs;
    const cycleMs = forwardMs * 2 + repeatDelayMs;
    const animations: Animation[] = [];
    const drawEase = "cubic-bezier(0.2, 0, 0, 1)";
    const fillEase = "cubic-bezier(0.22, 0.72, 0.22, 1)";
    const percent = (milliseconds: number) => Math.max(0, Math.min(1, milliseconds / cycleMs));

    glyphs.forEach((glyph, index) => {
      const startMs = index * staggerMs;
      const drawEndMs = startMs + drawMs;
      const reverseStartMs = forwardMs + repeatDelayMs + (forwardMs - drawEndMs);
      const reverseEndMs = forwardMs + repeatDelayMs + (forwardMs - startMs);
      const frames: Keyframe[] = [
        { strokeDashoffset: dash + "px", offset: 0 },
        { strokeDashoffset: dash + "px", offset: percent(startMs) },
        { strokeDashoffset: "0px", offset: percent(drawEndMs), easing: drawEase },
        { strokeDashoffset: "0px", offset: percent(forwardMs) },
        { strokeDashoffset: "0px", offset: percent(forwardMs + repeatDelayMs) },
        { strokeDashoffset: "0px", offset: percent(reverseStartMs) },
        { strokeDashoffset: dash + "px", offset: percent(reverseEndMs), easing: drawEase },
        { strokeDashoffset: dash + "px", offset: 1 },
      ];
      animations.push(glyph.animate(frames, {
        duration: cycleMs,
        iterations: Infinity,
        easing: "linear",
      }));
    });

    const reverseFillEndMs = forwardMs + repeatDelayMs + (forwardMs - fillStartMs);
    const fillFrames: Keyframe[] = [
      { width: "0px", offset: 0 },
      { width: "0px", offset: percent(fillStartMs) },
      { width: box.width + "px", offset: percent(forwardMs), easing: fillEase },
      { width: box.width + "px", offset: percent(forwardMs + repeatDelayMs) },
      { width: "0px", offset: percent(reverseFillEndMs), easing: fillEase },
      { width: "0px", offset: 1 },
    ];
    animations.push(wipe.animate(fillFrames, {
      duration: cycleMs,
      iterations: Infinity,
      easing: "linear",
    }));

    return () => animations.forEach((animation) => animation.cancel());
  }, [box, dash, chars.length]);

  const viewBox = box
    ? box.x + " " + box.y + " " + box.width + " " + box.height
    : "0 -100 800 140";
  const sharedStyle = {
    ...style,
    "--ps-inkline-dash-length": dash + "px",
    position: "relative",
    display: "inline-block",
    width: "max-content",
    maxWidth: "100%",
    lineHeight: 1.2,
    verticalAlign: "baseline",
    overflow: "visible",
  } as CSSProperties;

  return (
    <Tag
      ref={motionRef as Ref<HTMLElement>}
      className={(className + " ps-inkline-name").trim()}
      style={sharedStyle}
      aria-label={text}
      data-motion-visible={forceMotion ? "true" : "false"}
      data-inkline-ready={box ? "true" : "false"}
    >
      <span ref={layoutRef} className="ps-inkline-layout" aria-hidden="true">{text}</span>
      <span className="ps-inkline-measure" aria-hidden="true">
        <svg
          className="ps-inkline-svg"
          viewBox={viewBox}
          preserveAspectRatio="xMinYMid meet"
          aria-hidden="true"
          style={{ visibility: box ? "visible" : "hidden" }}
        >
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
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <rect
                ref={wipeRef}
                x={box?.x ?? 0}
                y={box?.y ?? 0}
                width="0"
                height={box?.height ?? 0}
              />
            </clipPath>
          </defs>
          <text
            ref={textRef}
            x="0"
            y="0"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="ps-inkline-outline"
            style={{ fontFamily, fontWeight }}
          >
            {chars.map((char, index) => (
              <tspan
                key={index}
                data-inkline-char
                style={{
                  strokeDasharray: dash + "px",
                  strokeDashoffset: dash + "px",
                }}
              >
                {char === " " ? "\u00a0" : char}
              </tspan>
            ))}
          </text>
          <text
            x="0"
            y="0"
            fill={gradientFlow ? "url(#" + gradientFlowGradientId + ")" : chromaflow ? "url(#" + chromaflowGradientId + ")" : gummy ? "url(#" + gummyGradientId + ")" : fillColor}
            stroke="none"
            className="ps-inkline-fill"
            clipPath={"url(#" + clipId + ")"}
            style={{ fontFamily, fontWeight }}
          >
            {chars.map((char, index) => <tspan key={index}>{char === " " ? "\u00a0" : char}</tspan>)}
          </text>
        </svg>
      </span>
    </Tag>
  );
}
