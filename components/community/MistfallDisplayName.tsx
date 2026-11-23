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
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const easeOut = (n: number) => 1 - Math.pow(1 - clamp(n, 0, 1), 3);
const easeInOut = (n: number) => {
  const t = clamp(n, 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Mistfall is an entrance animation: a compact violet-white particle cloud
 * converges into the exact glyph silhouette once, then leaves stable text.
 */
export default function MistfallDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  previewMode = false,
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

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      setFormed(true);
      return;
    }

    let raf = 0;
    let resizeRaf = 0;
    let start = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let particles: Particle[] = [];
    let disposed = false;
    let started = false;
    let lastFrame = 0;

    const duration = previewMode ? 1.9 : 2.35;
    const fps = previewMode ? 24 : 30;
    const maxParticles = previewMode ? 260 : 620;
    let seed = 0x4d495354;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const build = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, previewMode ? 1 : 1.25);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const probe = document.createElement("canvas");
      probe.width = canvas.width;
      probe.height = canvas.height;
      const pctx = probe.getContext("2d", { willReadFrequently: true });
      if (!pctx) return false;

      const computed = getComputedStyle(host);
      const fontSize = parseFloat(computed.fontSize) || 16;
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pctx.font = computed.font || `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
      pctx.textAlign = "center";
      pctx.textBaseline = "middle";
      pctx.fillStyle = "#fff";
      if ("letterSpacing" in pctx) {
        (pctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = computed.letterSpacing;
      }
      pctx.fillText(text, width / 2, height / 2);

      const data = pctx.getImageData(0, 0, probe.width, probe.height).data;
      const points: { x: number; y: number }[] = [];
      const sampleStep = previewMode ? 2 : 1.65;
      for (let y = 0; y < probe.height; y += Math.max(1, Math.round(sampleStep * dpr))) {
        for (let x = 0; x < probe.width; x += Math.max(1, Math.round(sampleStep * dpr))) {
          if (data[(y * probe.width + x) * 4 + 3] > 95) {
            points.push({ x: x / dpr, y: y / dpr });
          }
        }
      }
      if (!points.length) return false;

      // Keep the particle cloud tight to the word instead of exploding across the card.
      const selected = points.length > maxParticles
        ? Array.from({ length: maxParticles }, (_, i) => points[Math.floor(i * points.length / maxParticles)])
        : points;

      particles = selected.map((point) => {
        const angle = random() * Math.PI * 2;
        const radius = 8 + random() * Math.min(22, fontSize * 0.72);
        return {
          x: point.x + Math.cos(angle) * radius,
          y: point.y + Math.sin(angle) * radius * 0.78,
          tx: point.x,
          ty: point.y,
          vx: (random() - 0.5) * 9,
          vy: (random() - 0.5) * 8,
          radius: 0.45 + random() * (previewMode ? 0.5 : 0.65),
          phase: random() * Math.PI * 2,
        };
      });
      return true;
    };

    const finish = () => {
      if (disposed) return;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, width, height);
      setFormed(true);
    };

    const draw = (now: number) => {
      if (disposed) return;
      if (now - lastFrame < 1000 / fps) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;
      const progress = clamp((now - start) / (duration * 1000), 0, 1);
      const converge = easeInOut(progress);
      const settle = easeOut(progress);

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      for (const particle of particles) {
        const flutter = (1 - converge) * Math.sin(now * 0.006 + particle.phase) * 1.5;
        const x = particle.x + (particle.tx - particle.x) * converge + flutter;
        const y = particle.y + (particle.ty - particle.y) * converge;
        const radius = particle.radius * (0.9 + settle * 0.1);
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
      }
      ctx.fillStyle = "#f8f6ff";
      ctx.globalAlpha = 0.94;
      ctx.fill();

      // One restrained violet glow pass over the whole cloud.
      if (progress < 0.78) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - progress / 0.78) * 0.12;
        ctx.fillStyle = "#a78bfa";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;

      if (progress >= 1) {
        finish();
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const begin = () => {
      if (disposed || started) return;
      started = true;
      start = performance.now();
      lastFrame = 0;
      raf = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (started || disposed) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (build()) begin();
      });
    });
    resizeObserver.observe(host);

    if (build()) begin();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
    };
  }, [text, previewMode]);

  return (
    <Tag className={className + " ps-mistfall-name" + (formed ? " is-formed" : "")} style={style} aria-label={text}>
      <span className="ps-mistfall-layout" aria-hidden="true">{text}</span>
      <canvas ref={canvasRef} className="ps-mistfall-canvas" aria-hidden="true" />
    </Tag>
  );
}
