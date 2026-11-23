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
  tx: number;
  ty: number;
  dx: number;
  dy: number;
  size: number;
  alpha: number;
  phase: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const smooth = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Mistfall: lightweight particle dissolve/rebuild.
 * The invisible text keeps the exact inline layout; canvas is only a visual overlay.
 */
export default function MistfallDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  previewMode = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const Tag = tag;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!canvas || !host || !ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let lastFrame = 0;
    let visible = true;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let particles: Particle[] = [];
    let cycleStart = performance.now();
    let resizeFrame = 0;

    const cycle = previewMode ? 8.4 : 9.2;
    const hold = 4.4;
    const dissolve = 1.35;
    const rebuild = 1.35;
    const targetFps = previewMode ? 12 : 18;
    const maxParticles = previewMode ? 64 : 145;
    let seed = 78231;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const build = () => {
      const bounds = host.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return;

      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, previewMode ? 1 : 1.15);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rasterize the exact text box, not a separately sized/offset canvas.
      const probe = document.createElement("canvas");
      probe.width = Math.max(1, Math.ceil(width * dpr));
      probe.height = Math.max(1, Math.ceil(height * dpr));
      const pctx = probe.getContext("2d", { willReadFrequently: true });
      if (!pctx) return;

      const computed = getComputedStyle(host);
      const fontSize = parseFloat(computed.fontSize) || 16;
      const fontWeight = computed.fontWeight || "800";
      const fontFamily = computed.fontFamily || "sans-serif";
      const letterSpacing = parseFloat(computed.letterSpacing) || 0;
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pctx.font = fontWeight + " " + fontSize + "px " + fontFamily;
      pctx.textAlign = "center";
      pctx.textBaseline = "middle";
      pctx.fillStyle = "#fff";

      if (letterSpacing && "letterSpacing" in pctx) {
        (pctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = computed.letterSpacing;
      }
      pctx.fillText(text, width / 2, height / 2);

      const pixels = pctx.getImageData(0, 0, probe.width, probe.height).data;
      const candidates: { x: number; y: number }[] = [];
      // Coarse sampling keeps the word recognizable with far fewer particles.
      const step = previewMode ? 3 : 2;
      for (let y = 0; y < probe.height; y += step) {
        for (let x = 0; x < probe.width; x += step) {
          if (pixels[(y * probe.width + x) * 4 + 3] > 100) candidates.push({ x: x / dpr, y: y / dpr });
        }
      }
      if (!candidates.length) return;

      particles = Array.from({ length: Math.min(maxParticles, candidates.length) }, () => {
        const point = candidates[Math.floor(random() * candidates.length)];
        const angle = (random() - 0.5) * Math.PI * 1.6;
        // Keep the cloud close to the word; no profile-sized explosion.
        const radius = 7 + random() * Math.min(18, fontSize * 0.55);
        return {
          tx: point.x,
          ty: point.y,
          dx: Math.cos(angle) * radius,
          dy: Math.sin(angle) * radius - random() * 5,
          size: 0.55 + random() * (previewMode ? 0.45 : 0.65),
          alpha: 0.65 + random() * 0.35,
          phase: random() * Math.PI * 2,
        };
      });
    };

    const scheduleBuild = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(build);
    };

    const resizeObserver = new ResizeObserver(scheduleBuild);
    resizeObserver.observe(host);
    build();

    const draw = (now: number) => {
      if (!visible || reduced) return;
      if (now - lastFrame < 1000 / targetFps) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const elapsed = ((now - cycleStart) / 1000) % cycle;
      if (elapsed < 0.04 && now - cycleStart > cycle * 1000) cycleStart = now - elapsed * 1000;

      const dissolveStart = hold;
      const rebuildStart = cycle - rebuild;
      ctx.clearRect(0, 0, width, height);

      // Batch all particles into one path; avoid per-particle shadows and draw calls.
      ctx.beginPath();
      for (const particle of particles) {
        const horizontal = particle.tx / Math.max(1, width);
        const dissolveProgress = smooth((elapsed - dissolveStart - (1 - horizontal) * 0.28) / dissolve);
        const rebuildProgress = smooth((elapsed - rebuildStart - horizontal * 0.2) / rebuild);
        let spread = 0;
        if (elapsed >= dissolveStart && elapsed < rebuildStart) spread = dissolveProgress;
        else if (elapsed >= rebuildStart) spread = 1 - rebuildProgress;

        const drift = Math.max(0, Math.min(1, spread));
        const floatX = Math.sin(now * 0.001 + particle.phase) * drift * 2.2;
        const floatY = Math.cos(now * 0.00115 + particle.phase * 1.3) * drift * 2.8;
        const x = particle.tx + particle.dx * drift + floatX;
        const y = particle.ty + particle.dy * drift + floatY;
        const radius = particle.size * (1 + drift * 0.12);

        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
      }
      ctx.fillStyle = "rgba(248,246,255,0.92)";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fill();

      // A single subtle halo pass, not an expensive shadow on every particle.
      if (elapsed >= dissolveStart && elapsed < rebuildStart) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#b99aff";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      cancelAnimationFrame(raf);
      if (visible && !reduced) {
        lastFrame = 0;
        raf = requestAnimationFrame(draw);
      }
    }, { rootMargin: "40px" });
    intersection.observe(host);

    if (!reduced) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersection.disconnect();
    };
  }, [text, previewMode]);

  return (
    <Tag className={className + " ps-mistfall-name"} style={style} aria-label={text}>
      <span className="ps-mistfall-layout" aria-hidden="true">{text}</span>
      <canvas ref={canvasRef} className="ps-mistfall-canvas" aria-hidden="true" />
    </Tag>
  );
}
