"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";

type GlitchMode = "slices" | "rgb" | "scan" | "noise";
type GlitchTrigger = "always" | "hover" | "click";
type NameTag = "strong" | "span" | "h2" | "h3";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: NameTag;
  mode?: GlitchMode;
  trigger?: GlitchTrigger;
  enableOnHover?: boolean;
  speed?: number;
  intensity?: number;
  burstDuration?: number;
  offset?: number;
  skew?: number;
  flicker?: boolean;
  enableShadows?: boolean;
  shadowColors?: [string, string];
  color?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  frameRate?: number;
  previewMode?: boolean;
};

type Settings = {
  speed: number;
  offset: number;
  intensity: number;
  skew: number;
  flicker: boolean;
  enableShadows: boolean;
  shadowColors: [string, string];
  burstDuration: number;
};

type GlitchEvent = {
  until: number;
  aTop: number;
  aHeight: number;
  bTop: number;
  bHeight: number;
  ax: number;
  bx: number;
  ay: number;
  by: number;
  skew: number;
  fresh: boolean;
};

const MODES: GlitchMode[] = ["slices", "rgb", "scan", "noise"];
const GLYPHS = "#%&@$?<>/\\=+*~^!";
function splitGraphemes(value: string) {
  type SegmenterConstructor = new (
    locale?: string,
    options?: { granularity: "grapheme" }
  ) => { segment: (input: string) => Iterable<{ segment: string }> };

  const Segmenter = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (Segmenter) {
    return Array.from(
      new Segmenter(undefined, { granularity: "grapheme" }).segment(value),
      (part) => part.segment
    );
  }
  return Array.from(value);
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function fitBand(top: number, bottom: number): [number, number] {
  const safeTop = clamp(top, 0, 100);
  const safeBottom = clamp(bottom, 0, 100);
  return safeTop + safeBottom >= 100 ? [0, 100] : [safeTop, safeBottom];
}

const SIGNAL_BREAK_CYCLE_MS = 720;
const SIGNAL_BREAK_BURST_MS = 180;

function hashSignalName(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeEvent(now: number, stepMs: number, seed?: number): GlitchEvent {
  let state = seed === undefined ? 0 : seed >>> 0;
  const random = seed === undefined
    ? Math.random
    : () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      };
  const sign = () => (random() < 0.5 ? -1 : 1);

  return {
    until: now + Math.max(stepMs * (1 + Math.floor(random() * 3)), SIGNAL_BREAK_BURST_MS),
    aTop: random() * 80,
    aHeight: 5 + random() * 22,
    bTop: random() * 85,
    bHeight: 3 + random() * 14,
    ax: sign() * (1.3 + random() * 1.5),
    bx: sign() * (1.1 + random() * 1.2),
    ay: (random() - 0.5) * 0.5,
    by: (random() - 0.5) * 0.5,
    skew: sign() * (0.4 + random() * 0.6),
    fresh: true
  };
}

function stepLength(speed: number) {
  return 70 * Math.sqrt(Math.max(0.05, speed) / 0.5);
}

export default function SignalBreakDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
  mode = "slices",
  trigger = "always",
  enableOnHover = false,
  speed = 0.5,
  intensity = 0.5,
  burstDuration = 0.6,
  offset = 10,
  skew = 0,
  flicker = false,
  enableShadows = true,
  shadowColors = ["#ff0000", "#00ffff"],
  color,
  fontSize,
  fontWeight,
  frameRate = 30,
  previewMode = false
}: Props) {
  const Tag = tag;
  const rootRef = useRef<HTMLElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const settings: Settings = {
    speed,
    offset,
    intensity,
    skew,
    flicker,
    enableShadows,
    shadowColors,
    burstDuration
  };
  const settingsRef = useRef(settings);
  useLayoutEffect(() => {
    settingsRef.current = settings;
  });

  const safeMode: GlitchMode = MODES.includes(mode) ? mode : "slices";
  const activeTrigger: GlitchTrigger =
    trigger === "hover" || trigger === "click"
      ? trigger
      : enableOnHover
        ? "hover"
        : "always";

  const characters = safeMode === "noise" ? splitGraphemes(text) : null;
  const characterCount = characters?.length ?? 0;
  const chromaCharacterCount = characters?.length ?? splitGraphemes(text).length;
  const chromaScale = Math.max(2.6, chromaCharacterCount);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = !previewMode && Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    );
    const cells = charRefs.current
      .slice(0, characterCount)
      .filter((cell): cell is HTMLSpanElement => Boolean(cell));

    const written: Record<string, string> = {};
    const swaps = new Map<number, number>();
    const computedFontSize = Number.parseFloat(window.getComputedStyle(root).fontSize) || 16;

    // React Bits' 10px offset is designed for large demo typography.
    // Scale it down for profile names so small glyphs do not fly apart.
    const offsetScale = clamp(computedFontSize / 34, 0.32, 0.85);
    const syncSeed = hashSignalName(text);
    const phaseOffset = syncSeed % SIGNAL_BREAK_CYCLE_MS;

    let raf = 0;
    let last = 0;
    let lastRender = 0;
    let clock = 0;
    let visible = true;
    let hovering = false;
    let burstStart = 0;
    let burstEnd = 0;
    let nextStep = 0;
    let activeCycle = -1;
    let event: GlitchEvent | null = null;
    let alpha = 1;

    const write = (name: string, value: string) => {
      if (written[name] === value) return;
      written[name] = value;
      root.style.setProperty(name, value);
    };

    const rest = () => {
      write("--ps-glitch-a-top", "0%");
      write("--ps-glitch-a-bottom", "100%");
      write("--ps-glitch-b-top", "0%");
      write("--ps-glitch-b-bottom", "100%");
      write("--ps-glitch-a-x", "0px");
      write("--ps-glitch-a-y", "0px");
      write("--ps-glitch-b-x", "0px");
      write("--ps-glitch-b-y", "0px");
      write("--ps-glitch-a-shadow", "none");
      write("--ps-glitch-b-shadow", "none");
      write("--ps-glitch-skew", "0deg");
      write("--ps-glitch-alpha", "1");
      write("--ps-glitch-split", "0");
      root.classList.remove("is-glitching");
      cells.forEach((cell) => cell.removeAttribute("data-glyph"));
      swaps.clear();
      event = null;
      activeCycle = -1;
    };

    const isActive = (now: number) =>
      !reducedMotion &&
      !document.hidden &&
      visible &&
      (
        activeTrigger === "always" ||
        (activeTrigger === "hover" && hovering) ||
        now < burstEnd
      );

    const swap = (index: number, now: number, stepMs: number, current: Settings) => {
      const cell = cells[index];
      if (!cell || cell.textContent === " ") return;

      cell.setAttribute("data-glyph", GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
      cell.style.setProperty(
        "--ps-glitch-glyph",
        current.enableShadows ? current.shadowColors[index % 2] : "currentColor"
      );
      swaps.set(index, now + stepMs * (1 + Math.floor(Math.random() * 3)));
    };

    const step = (now: number, current: Settings, power: number) => {
      const stepMs = stepLength(current.speed);
      if (event && now >= event.until) event = null;
      if (activeTrigger !== "always" && !event && Math.random() < 0.38 + power * 0.16) {
        event = makeEvent(now, stepMs);
      }

      alpha = current.flicker && Math.random() < 0.04 + 0.16 * power
        ? 0.45 + Math.random() * 0.35
        : 1;

      if (cells.length) {
        swaps.forEach((until, index) => {
          if (now < until) return;
          cells[index]?.removeAttribute("data-glyph");
          swaps.delete(index);
        });

        const chance = 0.002 + 0.035 * power * power;
        cells.forEach((_, index) => {
          if (Math.random() < (swaps.has(index) ? 0.35 : chance)) {
            swap(index, now, stepMs, current);
          }
        });

        if (event?.fresh) {
          const start = Math.floor(Math.random() * cells.length);
          const run = 2 + Math.floor(Math.random() * 3);
          for (let index = 0; index < run; index += 1) {
            swap((start + index) % cells.length, now, stepMs, current);
          }
        }
      }

      if (event) event.fresh = false;
      nextStep = now + stepMs * (1.25 + Math.random() * 1.5);
    };

    const frame = (now: number) => {
      raf = 0;

      if (!isActive(now)) {
        rest();
        last = 0;
        return;
      }

      // Keep the CSS-driven glitch smooth without forcing layout/style writes at 60Hz.
      if (lastRender && now - lastRender < 1000 / clamp(frameRate, 12, 60)) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastRender = now;
      const current = settingsRef.current;
      if (activeTrigger === "always") {
        const synchronizedNow = now + phaseOffset;
        const cycleIndex = Math.floor(synchronizedNow / SIGNAL_BREAK_CYCLE_MS);
        if (cycleIndex !== activeCycle) {
          activeCycle = cycleIndex;
          const cycleStart = cycleIndex * SIGNAL_BREAK_CYCLE_MS - phaseOffset;
          const seed = (syncSeed ^ Math.imul(cycleIndex + 1, 0x45d9f3b)) >>> 0;
          event = makeEvent(cycleStart, stepLength(current.speed), seed);
          event.until = cycleStart + SIGNAL_BREAK_BURST_MS;
        }
      }
      const delta = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      clock += delta;

      const bursting = now < burstEnd;
      const burstLeft = bursting
        ? 1 - ((now - burstStart) / Math.max(1, burstEnd - burstStart)) * 0.55
        : 0;
      const power = Math.max(clamp(current.intensity, 0, 1), burstLeft);

      if (now >= nextStep) step(now, current, power);

      const live = event && now < event.until ? event : null;
      root.classList.toggle("is-glitching", Boolean(live));
      const scale = 0.4 + 1.2 * power;
      const effectiveOffset = Math.max(0, current.offset) * offsetScale;
      const pace = Math.max(0.05, current.speed);

      let bandA: [number, number] = [0, 100];
      let bandB: [number, number] = [0, 100];
      let ax = 0;
      let ay = 0;
      let bx = 0;
      let by = 0;
      let split = 0;

      if (safeMode === "slices") {
        // Keep the word perfectly aligned between short, deliberate interference bursts.
        if (live) {
          bandA = [live.aTop, 100 - live.aTop - live.aHeight];
          bandB = [live.bTop, 100 - live.bTop - live.bHeight];
          ax = effectiveOffset * scale * live.ax;
          bx = effectiveOffset * scale * live.bx;
          ay = effectiveOffset * live.ay;
          by = effectiveOffset * live.by;
        }
      } else if (safeMode === "rgb") {
        if (live) {
          ax = effectiveOffset * scale * Math.abs(live.ax);
          bx = -effectiveOffset * scale * Math.abs(live.bx);
          ay = effectiveOffset * live.ay;
          by = effectiveOffset * live.by;
        }

        split = current.enableShadows && live ? 0.82 : 0;
      } else if (safeMode === "scan") {
        const pass = 2.4 * pace;
        const cycle = pass * (1 + (1 - power) * 1.2);
        const local = clock % cycle;
        const height = 9 + 9 * power;

        if (local < pass) {
          const direction = Math.floor(clock / cycle) % 2 ? -1 : 1;
          const center = -height + (local / pass) * (100 + 2 * height);
          const trail = center - height * 1.5;
          const thin = height * 0.35;
          bandA = [center - height / 2, 100 - (center + height / 2)];
          bandB = [trail - thin / 2, 100 - (trail + thin / 2)];
          ax = effectiveOffset * scale * 1.5 * direction * (0.75 + 0.25 * Math.sin(clock * 23));
          bx = -ax * 0.5;
        }

        if (live) {
          bandB = [live.bTop, 100 - live.bTop - live.bHeight];
          bx = effectiveOffset * scale * live.bx * 1.4;
        }
      }

      bandA = fitBand(bandA[0], bandA[1]);
      bandB = fitBand(bandB[0], bandB[1]);

      const shadows = current.enableShadows && safeMode !== "rgb";
      write("--ps-glitch-a-top", `${bandA[0].toFixed(2)}%`);
      write("--ps-glitch-a-bottom", `${bandA[1].toFixed(2)}%`);
      write("--ps-glitch-b-top", `${bandB[0].toFixed(2)}%`);
      write("--ps-glitch-b-bottom", `${bandB[1].toFixed(2)}%`);
      write("--ps-glitch-a-x", `${ax.toFixed(2)}px`);
      write("--ps-glitch-a-y", `${ay.toFixed(2)}px`);
      write("--ps-glitch-b-x", `${bx.toFixed(2)}px`);
      write("--ps-glitch-b-y", `${by.toFixed(2)}px`);
      write(
        "--ps-glitch-a-shadow",
        shadows ? `${(-ax / 2).toFixed(2)}px 0 ${current.shadowColors[0]}` : "none"
      );
      write(
        "--ps-glitch-b-shadow",
        shadows ? `${(-bx / 2).toFixed(2)}px 0 ${current.shadowColors[1]}` : "none"
      );
      write("--ps-glitch-skew", `${(live ? current.skew * live.skew : 0).toFixed(2)}deg`);
      write("--ps-glitch-alpha", alpha.toFixed(2));
      write("--ps-glitch-split", String(split));

      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !isActive(performance.now())) return;
      last = 0;
      lastRender = 0;
      raf = requestAnimationFrame(frame);
    };

    const onEnter = () => {
      hovering = true;
      wake();
    };
    const onLeave = () => {
      hovering = false;
    };
    const onClick = () => {
      const now = performance.now();
      const current = settingsRef.current;
      burstStart = now;
      burstEnd = now + Math.max(0.1, current.burstDuration) * 1000;
      event = makeEvent(now, stepLength(current.speed));
      nextStep = now;
      wake();
    };

    if (activeTrigger === "hover") {
      root.addEventListener("pointerenter", onEnter);
      root.addEventListener("pointerleave", onLeave);
    }
    if (activeTrigger === "click") root.addEventListener("click", onClick);

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) wake();
        })
      : null;

    observer?.observe(root);
    const onVisibilityChange = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("click", onClick);
      rest();
    };
  }, [safeMode, activeTrigger, characterCount, frameRate, previewMode, text, phaseOffset]);

  const visualClasses = className
    .split(/\s+/)
    .filter((token) => token.startsWith("color-"))
    .join(" ");
  const rootClasses = className
    .split(/\s+/)
    .filter((token) => token && !token.startsWith("color-"))
    .join(" ");

  const rootStyle = {
    ...style,
    "--ps-chroma-char-count": Math.max(1, chromaCharacterCount),
    "--ps-chroma-background-size": chromaScale * 100 + "%",
    "--ps-chroma-shift-end": (chromaScale / (chromaScale - 1) * 100) + "%",
    color: color ?? style?.color,
    fontSize: fontSize !== undefined
      ? typeof fontSize === "number" ? `${fontSize}px` : fontSize
      : style?.fontSize,
    fontWeight: fontWeight ?? style?.fontWeight,
    "--ps-glitch-color-a": enableShadows ? shadowColors[0] : "currentColor",
    "--ps-glitch-color-b": enableShadows ? shadowColors[1] : "currentColor"
  } as CSSProperties;

  return (
    <Tag
      ref={(node: HTMLElement | null) => { rootRef.current = node; }}
      className={`ps-glitch-name ps-glitch-name--${safeMode} ${rootClasses}`}
      style={rootStyle}
    >
      <span className={`ps-glitch-text ${visualClasses}`} aria-hidden={characters ? "true" : undefined}>
        {characters
          ? characters.map((character, index) => (
              <span
                key={index}
                ref={(node) => { charRefs.current[index] = node; }}
                className="ps-glitch-char"
                style={{ "--ps-chroma-position": (text.length <= 1 ? 50 : (index / (text.length - 1)) * 100) + "%" } as CSSProperties}
              >
                {character}
              </span>
            ))
          : text}
      </span>
      {characters && <span className="ps-glitch-sr">{text}</span>}
      <span className={`ps-glitch-slice ps-glitch-slice--b ${visualClasses}`} aria-hidden="true">{text}</span>
      <span className={`ps-glitch-slice ps-glitch-slice--a ${visualClasses}`} aria-hidden="true">{text}</span>
    </Tag>
  );
}
