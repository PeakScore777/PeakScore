"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type Props = {
  text?: string; asciiFontSize?: number; charset?: string; colors?: string[];
  textColor?: string; fontFamily?: string; fontWeight?: number; textScale?: number;
  blocks?: number; waves?: number; waveSpeed?: number; chroma?: number; tilt?: number;
  hueShift?: number; scramble?: number; clickRipple?: boolean; intro?: boolean;
  idle?: boolean; interactive?: boolean; theme?: "dark" | "light";
  className?: string; style?: CSSProperties;
};

const DEFAULT_CHARSET = " .'\u0060^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function GlyphStorm({
  text = "PeakScore", asciiFontSize = 7, charset = DEFAULT_CHARSET,
  colors = ["#F4F4F5", "#A1A1AA", "#39D9FF"], textColor = "#F4F4F5",
  fontFamily = FONT, fontWeight = 800, textScale = 1, blocks = 0.12,
  waves = 0.48, waveSpeed = 0.72, chroma = 0.18, tilt = 0.55,
  hueShift = 0, scramble = 0.32, clickRipple = true, intro = true,
  idle = true, interactive = true, theme = "dark", className = "", style,
}: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const source = document.createElement("canvas");
    const sourceCtx = source.getContext("2d", { willReadFrequently: true });
    if (!ctx || !sourceCtx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const glyphs = Array.from(charset || DEFAULT_CHARSET);
    const palette = (colors.length ? colors : ["#F4F4F5"]).slice(0, 3);
    const tones = [palette[0], palette[1] || palette[0], palette[2] || palette[1] || palette[0]];
    const cell = clamp(asciiFontSize, 4, 18);
    const state = {
      width: 1, height: 1, dpr: 1, time: 0, last: 0, raf: 0,
      pointerX: -9999, pointerY: -9999, inside: false,
      rippleX: -9999, rippleY: -9999, rippleAt: -10,
      visible: true, alive: true, introAt: performance.now(),
    };
    let sourcePixels = new Uint8ClampedArray(4);
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      state.width = Math.max(1, Math.round(rect.width * state.dpr));
      state.height = Math.max(1, Math.round(rect.height * state.dpr));
      canvas.width = state.width;
      canvas.height = state.height;
      source.width = Math.max(1, Math.round(state.width * 1.5));
      source.height = Math.max(1, Math.round(state.height * 1.5));
      sourceCtx.clearRect(0, 0, source.width, source.height);
      sourceCtx.fillStyle = textColor;
      sourceCtx.textAlign = "center";
      sourceCtx.textBaseline = "middle";
      sourceCtx.font = fontWeight + " " + Math.round(source.height * 0.72 * textScale) + "px " + fontFamily;
      sourceCtx.fillText(text || " ", source.width / 2, source.height / 2, source.width * 0.96);
      sourcePixels = sourceCtx.getImageData(0, 0, source.width, source.height).data;
    };

    const draw = (now: number) => {
      state.raf = 0;
      if (!state.alive || !state.visible) return;
      const dt = Math.min(0.05, Math.max(0, (now - (state.last || now)) / 1000));
      state.last = now;
      state.time += reduced ? 0 : dt;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const pixels = sourcePixels;
      const cols = Math.ceil(w / (cell * state.dpr * 0.62));
      const rows = Math.ceil(h / (cell * state.dpr));
      const cw = w / Math.max(1, cols), ch = h / Math.max(1, rows);
      const px = state.pointerX * state.dpr, py = state.pointerY * state.dpr;
      const introProgress = intro && !reduced ? clamp((now - state.introAt) / 1150, 0, 1) : 1;
      const rippleAge = now / 1000 - state.rippleAt;
      const rippleRadius = rippleAge * Math.max(w, h) * 0.78;
      const hue = interactive && state.inside ? Math.atan2(py - h / 2, px - w / 2) * hueShift : 0;
      const parse = (hex: string) => {
        const v = hex.replace("#", "");
        const n = parseInt(v.length === 3 ? v.split("").map((z) => z + z).join("") : v, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const ca = parse(tones[0]), cb = parse(tones[1]), cc = parse(tones[2]);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = (col + 0.5) * cw, y = (row + 0.5) * ch;
          const wave = reduced || !idle && !interactive ? 0 : Math.sin(state.time * waveSpeed * 2 + col * 0.17) * waves * ch * 0.72;
          const sx = clamp(Math.floor((x / w) * source.width), 0, source.width - 1);
          const sy = clamp(Math.floor(((y - wave) / h) * source.height), 0, source.height - 1);
          const alpha = pixels[(sy * source.width + sx) * 4 + 3] / 255;
          if (alpha < 0.08) continue;
          const distance = Math.hypot(x - px, y - py);
          const scrambleOn = interactive && state.inside && distance < h * (0.22 + scramble * 0.35);
          const rippleOn = clickRipple && rippleAge >= 0 && rippleAge < 1.25 &&
            Math.abs(Math.hypot(x - state.rippleX * state.dpr, y - state.rippleY * state.dpr) - rippleRadius) < ch * 2.2;
          const seed = Math.sin(col * 127.1 + row * 311.7 + Math.floor(state.time * 16) * 74.7) * 43758.5453;
          const random = seed - Math.floor(seed);
          const decoding = introProgress < 1 && random > introProgress;
          const index = decoding || scrambleOn && random < scramble || rippleOn
            ? Math.floor(random * glyphs.length) : Math.round(alpha * (glyphs.length - 1));
          const glyph = glyphs[clamp(index, 0, glyphs.length - 1)] || "#";
          const spread = clamp(Math.hypot(x - w / 2, y - h / 2) / Math.max(1, Math.hypot(w, h) * 0.56), 0, 1);
          const from = spread < 0.5 ? ca : cb, to = spread < 0.5 ? cb : cc;
          const blend = spread < 0.5 ? spread * 2 : (spread - 0.5) * 2;
          let rgb = from.map((v, i) => v + (to[i] - v) * blend);
          if (hue) {
            const [r, g, b] = rgb.map((v) => v / 255);
            const avg = (r + g + b) / 3, co = Math.cos(hue), si = Math.sin(hue);
            rgb = [
              clamp((r * co + avg * (1 - co) + (g - b) * si) * 255, 0, 255),
              clamp((g * co + avg * (1 - co) + (b - r) * si) * 255, 0, 255),
              clamp((b * co + avg * (1 - co) + (r - g) * si) * 255, 0, 255),
            ];
          }
          const color = "rgb(" + rgb.map((v) => Math.round(v)).join(",") + ")";
          const tiltX = interactive && state.inside ? ((px / Math.max(1, w)) - 0.5) * tilt * ch * 0.6 : 0;
          const tiltY = interactive && state.inside ? ((py / Math.max(1, h)) - 0.5) * tilt * ch * 0.3 : 0;
          const jitter = (scrambleOn ? (random - 0.5) * ch * 1.5 : 0) + tiltX;
          if (blocks > 0.01 && alpha > 0.35) {
            ctx.globalAlpha = blocks * alpha * 0.22;
            ctx.fillStyle = color;
            ctx.fillRect(x - cw * 0.5, y - ch * 0.46 + wave, cw * 0.94, ch * 0.9);
          }
          ctx.font = "500 " + Math.max(5, ch * 0.92) + "px " + fontFamily;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          if (chroma > 0.02 && !reduced) {
            ctx.globalAlpha = Math.min(0.35, chroma * 0.34) * alpha;
            ctx.fillStyle = "#FF4D8D";
            ctx.fillText(glyph, x - chroma * 2 * state.dpr + jitter, y + wave);
            ctx.fillStyle = "#36D9FF";
            ctx.fillText(glyph, x + chroma * 2 * state.dpr - jitter, y + wave);
          }
          ctx.globalAlpha = alpha * (decoding ? 0.55 : 1);
          ctx.fillStyle = theme === "light" ? "#18181B" : color;
          ctx.fillText(glyph, x + jitter, y + wave + tiltY);
        }
      }
      ctx.globalAlpha = 1;
      const shouldAnimate = !reduced && (idle || interactive && state.inside) || introProgress < 1 || rippleAge >= 0 && rippleAge < 1.25;
      if (shouldAnimate) {
        state.raf = window.requestAnimationFrame(draw);
      }
    };

    const wake = () => {
      if (!state.raf && state.alive && state.visible) {
        state.last = performance.now();
        state.raf = window.requestAnimationFrame(draw);
      }
    };
    const locate = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      state.pointerX = event.clientX - rect.left;
      state.pointerY = event.clientY - rect.top;
      state.inside = true;
      wake();
    };
    const onMove = (event: PointerEvent) => locate(event);
    const onLeave = () => { state.inside = false; };
    const onDown = (event: PointerEvent) => {
      if (!clickRipple || !interactive) return;
      locate(event);
      state.rippleX = state.pointerX;
      state.rippleY = state.pointerY;
      state.rippleAt = performance.now() / 1000;
      wake();
    };

    resize();
    resizeObserver = new ResizeObserver(() => { resize(); wake(); });
    resizeObserver.observe(wrap);
    intersectionObserver = new IntersectionObserver((entries) => {
      state.visible = entries.some((entry) => entry.isIntersecting);
      if (state.visible) wake();
      else if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
    }, { threshold: 0.05 });
    intersectionObserver.observe(wrap);
    if (interactive) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
      wrap.addEventListener("pointerdown", onDown);
    }
    wake();

    return () => {
      state.alive = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
    };
  }, [text, asciiFontSize, charset, colors, textColor, fontFamily, fontWeight, textScale, blocks, waves, waveSpeed, chroma, tilt, hueShift, scramble, clickRipple, intro, idle, interactive, theme]);

  const width = Math.max(3.4, Array.from(text).length * 0.68);
  return (
    <span ref={wrapRef} className={"ps-glyph-storm " + className}
      style={{
        position: "relative", display: "inline-block", verticalAlign: "middle",
        width: width + "em", maxWidth: "100%", height: "1.2em", overflow: "hidden",
        lineHeight: 1, color: theme === "light" ? "#18181B" : textColor, ...style,
      }}
      role="img" aria-label={text}>
      <canvas ref={canvasRef} aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      <span className="ps-glyph-storm-fallback" style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}>{text}</span>
    </span>
  );
}
