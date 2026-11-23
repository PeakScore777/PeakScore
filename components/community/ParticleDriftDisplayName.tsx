'use client';

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
};

type Particle = {
  x: number; y: number; tx: number; ty: number;
  dx: number; dy: number; phase: number; size: number; alpha: number;
};

export default function ParticleDriftDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  previewMode = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !host || !ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let started = 0;
    let visible = true;
    let disposed = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cycle = previewMode ? 7600 : 9200;
    const hold = previewMode ? 1800 : 2500;
    const scatterStart = hold;
    const cloudStart = hold + 1250;
    const reformStart = hold + 2850;

    const build = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      const computed = getComputedStyle(host);
      const fontSize = Math.max(12, parseFloat(computed.fontSize) || 32);
      const fontFamily = computed.fontFamily || "sans-serif";
      const fontWeight = computed.fontWeight || "700";
      const measure = document.createElement("canvas");
      const mctx = measure.getContext("2d");
      if (!mctx) return;
      mctx.font = fontWeight + " " + fontSize + "px " + fontFamily;
      const measured = mctx.measureText(text);
      height = Math.max(1, rect.height || fontSize * 1.35);
      const maxWidth = Math.max(1, width - 8);
      const scale = Math.min(1, maxWidth / Math.max(1, measured.width));
      const drawFont = fontSize * scale;
      mctx.font = fontWeight + " " + drawFont + "px " + fontFamily;
      const metrics = mctx.measureText(text);
      const textWidth = metrics.width;
      const ascent = metrics.actualBoundingBoxAscent || drawFont * .78;
      const descent = metrics.actualBoundingBoxDescent || drawFont * .22;
      const textHeight = ascent + descent;
      const off = document.createElement("canvas");
      off.width = Math.ceil(textWidth + 8);
      off.height = Math.ceil(textHeight + 8);
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.font = fontWeight + " " + drawFont + "px " + fontFamily;
      octx.textBaseline = "alphabetic";
      octx.fillStyle = "#fff";
      octx.fillText(text, 4, ascent + 4);
      const pixels = octx.getImageData(0, 0, off.width, off.height).data;
      const step = previewMode ? 2.8 : 2.4;
      const originX = (width - textWidth) / 2;
      const originY = (height - textHeight) / 2;
      const next: Particle[] = [];
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const alpha = pixels[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3];
          if (alpha < 90) continue;
          const tx = originX + x - 4;
          const ty = originY + y - 4;
          const angle = Math.random() * Math.PI * 2;
          const distance = 14 + Math.random() * Math.max(width * .22, 32);
          next.push({
            x: tx + Math.cos(angle) * distance,
            y: ty + Math.sin(angle) * distance,
            tx, ty,
            dx: (Math.random() - .5) * 2,
            dy: (Math.random() - .5) * 2,
            phase: Math.random() * Math.PI * 2,
            size: .65 + Math.random() * 1.05,
            alpha: .55 + Math.random() * .45,
          });
        }
      }
      particles = next;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) drawStatic();
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(host).color || "#fff";
      ctx.font = getComputedStyle(host).font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2);
    };

    const ease = (v: number) => {
      const t = Math.max(0, Math.min(1, v));
      return t * t * (3 - 2 * t);
    };

    const frame = (now: number) => {
      if (disposed || !visible) return;
      if (!started) started = now;
      const elapsed = (now - started) % cycle;
      ctx.clearRect(0, 0, width, height);

      const scatter = ease((elapsed - scatterStart) / 1050);
      const reform = ease((elapsed - reformStart) / 1250);
      const holdAlpha = elapsed < scatterStart ? 1 : elapsed < cloudStart ? 1 - scatter : elapsed < reformStart ? 0 : reform;
      const cloudStrength = elapsed < scatterStart ? 0 : elapsed < cloudStart ? scatter : elapsed < reformStart ? 1 : 1 - reform;
      const time = elapsed / 1000;

      for (const p of particles) {
        const swirl = time * 1.8 + p.phase;
        const cloudX = p.tx + Math.cos(swirl) * (18 + width * .10) + p.dx * 24;
        const cloudY = p.ty + Math.sin(swirl * 1.23) * (12 + height * .28) + p.dy * 18;
        const x = p.tx * (1 - cloudStrength) + cloudX * cloudStrength;
        const y = p.ty * (1 - cloudStrength) + cloudY * cloudStrength;
        const opacity = Math.max(.04, holdAlpha * p.alpha + cloudStrength * .62);
        const glow = cloudStrength > .08;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = glow ? "#e9ddff" : (getComputedStyle(host).color || "#fff");
        if (glow) {
          ctx.shadowColor = "rgba(167,139,250,.82)";
          ctx.shadowBlur = 4 + cloudStrength * 5;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + cloudStrength * .25), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    };

    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !reduceMotion && !raf) raf = requestAnimationFrame(frame);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    observer?.observe(host);
    const resize = new ResizeObserver(build);
    resize.observe(host);
    build();
    if (!reduceMotion && !observer) raf = requestAnimationFrame(frame);
    else if (!reduceMotion && visible) raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer?.disconnect();
    };
  }, [text, previewMode]);

  const Tag = tag as ElementType;
  return (
    <Tag
      ref={(node) => { hostRef.current = node as HTMLElement | null; }}
      className={className + " ps-particle-drift"}
      style={{ ...style, display: "inline-block", position: "relative", verticalAlign: "baseline", width: "max-content", maxWidth: "100%" }}
      aria-label={text}
    >
      <canvas ref={canvasRef} className="ps-particle-drift__canvas" aria-hidden="true" />
      <span className="ps-particle-drift__sr">{text}</span>
    </Tag>
  );
}
