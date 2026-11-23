'use client';

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
};

type Particle = {
  x: number; y: number; tx: number; ty: number;
  radius: number; phase: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const ease = (n: number) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };

/** Mistfall: one-shot particle convergence that resolves into a stable, readable name. */
export default function MistfallDisplayName({
  text, className = "", style, tag = "strong", previewMode = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [formed, setFormed] = useState(false);
  const Tag = tag;

  useEffect(() => {
    setFormed(false);
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!canvas || !host || !ctx) return;

    const reduced = !previewMode && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    if (reduced) { setFormed(true); return; }

    let raf = 0, resizeRaf = 0, lastFrame = 0, startedAt = 0;
    let width = 1, height = 1, dpr = 1, particles: Particle[] = [];
    let disposed = false, started = false, finished = false, visible = false, pausedAt = 0;
    const duration = previewMode ? 2.05 : 2.45;
    const fps = previewMode ? 12 : 24;
    const maxParticles = previewMode ? 120 : 520;
    let seed = 0x4d495354;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

    const build = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      width = rect.width; height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, previewMode ? 1 : 1.25);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const probe = document.createElement("canvas");
      probe.width = canvas.width; probe.height = canvas.height;
      const pctx = probe.getContext("2d", { willReadFrequently: true });
      if (!pctx) return false;
      const computed = getComputedStyle(host);
      const fontSize = parseFloat(computed.fontSize) || 16;
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pctx.font = computed.font || `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
      pctx.textAlign = "center"; pctx.textBaseline = "middle"; pctx.fillStyle = "#fff";
      if ("letterSpacing" in pctx) (pctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = computed.letterSpacing;
      pctx.fillText(text, width / 2, height / 2);

      const data = pctx.getImageData(0, 0, probe.width, probe.height).data;
      const points: {x:number;y:number}[] = [];
      const stride = previewMode ? 2 : 2;
      for (let y = 0; y < probe.height; y += stride) {
        for (let x = 0; x < probe.width; x += stride) {
          if (data[(y * probe.width + x) * 4 + 3] > 90) points.push({x:x/dpr,y:y/dpr});
        }
      }
      if (!points.length) return false;
      // Evenly distribute samples across the full glyph mask; avoid random holes in the word.
      const count = Math.min(maxParticles, points.length);
      particles = Array.from({length:count},(_,i) => {
        const point = points[Math.floor((i + 0.5) * points.length / count)];
        const angle = random() * Math.PI * 2;
        const radius = 9 + random() * Math.min(20, fontSize * 0.7);
        return {
          x: point.x + Math.cos(angle) * radius,
          y: point.y + Math.sin(angle) * radius * 0.72,
          tx: point.x, ty: point.y,
          radius: 0.7 + random() * (previewMode ? 0.45 : 0.6),
          phase: random() * Math.PI * 2,
        };
      });
      return true;
    };

    const finish = () => {
      if (disposed) return;
      finished = true;
      cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, width, height);
      setFormed(true);
    };

    const draw = (now:number) => {
      if (disposed) return;
      if (now - lastFrame < 1000 / fps) { raf = requestAnimationFrame(draw); return; }
      lastFrame = now;
      const progress = clamp((now - startedAt) / (duration * 1000), 0, 1);
      const convergence = ease(progress);
      ctx.clearRect(0,0,width,height);
      ctx.beginPath();
      for (const p of particles) {
        const flutter = (1 - convergence) * Math.sin(now * 0.006 + p.phase) * 1.15;
        const x = p.x + (p.tx - p.x) * convergence + flutter;
        const y = p.y + (p.ty - p.y) * convergence;
        ctx.moveTo(x + p.radius, y);
        ctx.arc(x,y,p.radius,0,Math.PI*2);
      }
      ctx.fillStyle = "#f8f6ff";
      ctx.globalAlpha = 0.96;
      ctx.fill();
      if (progress < 0.82) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - progress / 0.82) * 0.13;
        ctx.fillStyle = "#a78bfa";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
      if (progress >= 0.78) setFormed(true);
      if (progress >= 1) { finish(); return; }
      raf = requestAnimationFrame(draw);
    };

    const begin = () => {
      if (disposed || !visible || finished) return;
      if (!started) {
        started = true;
        startedAt = performance.now();
        lastFrame = 0;
      } else if (pausedAt) {
        startedAt += performance.now() - pausedAt;
        pausedAt = 0;
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (started || disposed || !visible) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (visible && !started && build()) begin();
      });
    });
    resizeObserver.observe(host);

    const intersectionObserver = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (!visible) {
            if (started && !finished && !pausedAt) pausedAt = performance.now();
            cancelAnimationFrame(raf);
            raf = 0;
            return;
          }
          if (!started) {
            if (build()) begin();
          } else {
            begin();
          }
        }, { rootMargin: "64px" });

    if (intersectionObserver) {
      intersectionObserver.observe(host);
    } else {
      visible = true;
      if (build()) begin();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [text, previewMode]);

  return (
    <Tag className={className + " ps-mistfall-name" + (formed ? " is-formed" : "")} style={style} aria-label={text}>
      <span className="ps-mistfall-layout" aria-hidden="true">{text}</span>
      <canvas ref={canvasRef} className="ps-mistfall-canvas" aria-hidden="true" />
    </Tag>
  );
}
