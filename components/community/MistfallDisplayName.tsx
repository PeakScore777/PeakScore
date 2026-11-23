'use client';

import { useEffect, useRef, type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
};

type Particle = {
  x: number; y: number; tx: number; ty: number;
  dx: number; dy: number; size: number; alpha: number; phase: number;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const smooth = (v: number) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };

/** Mistfall: text condenses from a luminous particle cloud, then gently disperses. */
export default function MistfallDisplayName({
  text, className = "", style, tag = "strong", previewMode = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const Tag = tag;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !host || !ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let last = 0;
    let visible = true;
    let width = 1, height = 1, dpr = 1;
    let particles: Particle[] = [];
    const cycle = previewMode ? 9.8 : 11.2;
    const hold = 2.4;
    const dissolve = 2.0;
    const recovery = 1.5;
    const count = previewMode ? 1150 : 1700;
    let seed = 78231;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

    const build = () => {
      const bounds = host.getBoundingClientRect();
      const cssFont = getComputedStyle(host);
      const fontSize = Math.max(16, parseFloat(cssFont.fontSize) || 32);
      const fontFamily = cssFont.fontFamily || "sans-serif";
      const fontWeight = cssFont.fontWeight || "800";
      const letterSpacing = parseFloat(cssFont.letterSpacing) || 0;
      const probe = document.createElement("canvas");
      const pctx = probe.getContext("2d", { willReadFrequently: true });
      if (!pctx) return;
      pctx.font = fontWeight + " " + fontSize + "px " + fontFamily;
      const metrics = pctx.measureText(text);
      const textWidth = Math.max(1, metrics.width + Math.max(0, text.length - 1) * letterSpacing);
      const textHeight = Math.max(fontSize * 1.2, (metrics.actualBoundingBoxAscent || fontSize) + (metrics.actualBoundingBoxDescent || fontSize * .2));
      width = Math.max(80, Math.min(Math.max(bounds.width, textWidth + 40), textWidth + 100));
      height = Math.max(textHeight + 52, fontSize * 1.8);
      dpr = Math.min(window.devicePixelRatio || 1, previewMode ? 1 : 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      probe.width = Math.ceil(textWidth + 24);
      probe.height = Math.ceil(textHeight + 24);
      pctx.font = fontWeight + " " + fontSize + "px " + fontFamily;
      pctx.textAlign = "center";
      pctx.textBaseline = "middle";
      pctx.fillStyle = "#fff";
      pctx.fillText(text, probe.width / 2, probe.height / 2);
      const pixels = pctx.getImageData(0, 0, probe.width, probe.height).data;
      const points: { x: number; y: number }[] = [];
      const step = previewMode ? 2 : 2;
      for (let y = 0; y < probe.height; y += step) {
        for (let x = 0; x < probe.width; x += step) {
          if (pixels[(y * probe.width + x) * 4 + 3] > 110) points.push({ x, y });
        }
      }
      if (!points.length) return;
      const scale = Math.min(1, (width - 24) / probe.width);
      const ox = (width - probe.width * scale) / 2;
      const oy = (height - probe.height * scale) / 2;
      particles = Array.from({ length: Math.min(count, points.length * 2) }, (_, i) => {
        const pt = points[Math.floor(rand() * points.length)];
        const tx = ox + pt.x * scale;
        const ty = oy + pt.y * scale;
        const angle = rand() * Math.PI * 2;
        const radius = 18 + rand() * Math.min(width * .22, 72);
        return {
          x: tx, y: ty, tx, ty,
          dx: Math.cos(angle) * radius + (rand() - .5) * 22,
          dy: Math.sin(angle) * radius - rand() * 34,
          size: .45 + rand() * 1.05,
          alpha: .32 + rand() * .68,
          phase: rand() * Math.PI * 2,
        };
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resize = new ResizeObserver(() => build());
    resize.observe(host);
    build();

    const draw = (now: number) => {
      if (!visible || reduced) return;
      if (now - last < (previewMode ? 42 : 33)) { raf = requestAnimationFrame(draw); return; }
      last = now;
      const t = (now / 1000) % cycle;
      const disperseStart = hold;
      const disperseEnd = hold + dissolve;
      const rebuildStart = cycle - recovery;
      const disperse = smooth((t - disperseStart) / dissolve);
      const rebuild = smooth((t - rebuildStart) / recovery);
      const cloud = t < disperseStart ? 0 : t < disperseEnd ? disperse : t < rebuildStart ? 1 : 1 - rebuild;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const drift = cloud * (1 - rebuild);
        const flutter = Math.sin(now * .0011 + p.phase) * (1.2 + drift * 2.8);
        const wanderX = Math.sin(now * .00043 + p.phase * 1.7) * drift * 10;
        const wanderY = Math.cos(now * .00051 + p.phase) * drift * 7;
        const x = p.tx + p.dx * drift + wanderX + flutter * .24;
        const y = p.ty + p.dy * drift + wanderY + flutter * .18;
        const alpha = p.alpha * (t < hold ? 1 : t < disperseEnd ? 1 - disperse * .22 : t < rebuildStart ? .72 : .72 + rebuild * .28);
        const flicker = .78 + .22 * Math.sin(now * .002 + p.phase);
        const size = p.size * (1 + drift * .22);
        ctx.globalAlpha = clamp(alpha * flicker, 0, 1);
        ctx.fillStyle = "#f7f4ff";
        ctx.shadowColor = "rgba(174,132,255,.85)";
        ctx.shadowBlur = drift > .12 ? 5 + drift * 5 : 1.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
      else cancelAnimationFrame(raf);
    }, { rootMargin: "80px" });
    observer.observe(host);
    if (!reduced) raf = requestAnimationFrame(draw);
    else {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "currentColor";
      ctx.font = "800 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, width / 2, height / 2);
    }
    return () => { cancelAnimationFrame(raf); resize.disconnect(); observer.disconnect(); };
  }, [text, previewMode]);

  return (
    <Tag className={className + " ps-mistfall-name"} style={style} aria-label={text}>
      <canvas ref={canvasRef} className="ps-mistfall-canvas" aria-hidden="true" />
    </Tag>
  );
}
