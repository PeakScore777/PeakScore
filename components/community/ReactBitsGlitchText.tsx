"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./ReactBitsGlitchText.css";

type GlitchMode = "slices" | "rgb" | "scan" | "noise";
type GlitchTrigger = "always" | "hover" | "click";
type GlitchStyle = CSSProperties & Record<`--${string}`, string | number | undefined>;

type Props = {
  children: string;
  className?: string;
  style?: CSSProperties;
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
const SLICE_STOPS: [number, number][] = [
  [20, 50], [10, 60], [15, 55], [25, 35], [30, 40], [40, 20], [10, 60],
  [15, 55], [25, 35], [30, 40], [20, 50], [10, 60], [15, 55], [25, 35],
  [30, 40], [40, 20], [20, 50], [10, 60], [15, 55], [25, 35], [30, 40]
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const bandAt = (u: number): [number, number] => {
  const x = clamp(u, 0, 1) * (SLICE_STOPS.length - 1);
  const index = Math.min(SLICE_STOPS.length - 2, Math.floor(x));
  const fraction = x - index;
  const [topStart, bottomStart] = SLICE_STOPS[index];
  const [topEnd, bottomEnd] = SLICE_STOPS[index + 1];
  return [
    topStart + (topEnd - topStart) * fraction,
    bottomStart + (bottomEnd - bottomStart) * fraction
  ];
};

const pingPong = (time: number, period: number) => {
  const phase = (time / period) % 2;
  return phase < 1 ? 1 - phase : phase - 1;
};

const fitBand = (top: number, bottom: number): [number, number] => {
  const safeTop = clamp(top, 0, 100);
  const safeBottom = clamp(bottom, 0, 100);
  return safeTop + safeBottom >= 100 ? [0, 100] : [safeTop, safeBottom];
};

const makeEvent = (now: number, milliseconds: number): GlitchEvent => {
  const random = Math.random;
  const sign = () => random() < 0.5 ? -1 : 1;
  return {
    until: now + milliseconds * (1 + Math.floor(random() * 3)),
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
};

const stepLength = (speed: number) =>
  70 * Math.sqrt(Math.max(0.05, speed) / 0.5);

const maskForBand = (band: "a" | "b") =>
  `linear-gradient(#000 var(--glitch-${band}-top, 0%), transparent var(--glitch-${band}-top, 0%), transparent calc(100% - var(--glitch-${band}-bottom, 100%)), #000 calc(100% - var(--glitch-${band}-bottom, 100%)))`;

export default function ReactBitsGlitchText({
  children,
  className = "",
  style,
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
  fontWeight = 900
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const settings: Settings = {
    speed, offset, intensity, skew, flicker, enableShadows, shadowColors, burstDuration
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const safeMode: GlitchMode = MODES.includes(mode) ? mode : "slices";
  const activeTrigger: GlitchTrigger =
    trigger === "hover" || trigger === "click"
      ? trigger
      : enableOnHover ? "hover" : "always";
  const characters = safeMode === "noise" ? Array.from(children) : null;
  const characterCount = characters?.length ?? 0;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    );
    const cells = charRefs.current
      .slice(0, characterCount)
      .filter((cell): cell is HTMLSpanElement => Boolean(cell));
    const written: Record<string, string> = {};
    const swaps = new Map<number, number>();

    let frameId = 0;
    let last = 0;
    let clock = 0;
    let visible = true;
    let hovering = false;
    let burstStart = 0;
    let burstEnd = 0;
    let nextStep = 0;
    let event: GlitchEvent | null = null;
    let alpha = 1;
    let jitter: [number, number, number, number] = [1, 1, 0, 0];

    const write = (name: string, value: string) => {
      if (written[name] === value) return;
      written[name] = value;
      root.style.setProperty(name, value);
    };

    const rest = () => {
      write("--glitch-a-top", "0%");
      write("--glitch-a-bottom", "100%");
      write("--glitch-b-top", "0%");
      write("--glitch-b-bottom", "100%");
      write("--glitch-a-x", "0px");
      write("--glitch-a-y", "0px");
      write("--glitch-b-x", "0px");
      write("--glitch-b-y", "0px");
      write("--glitch-a-shadow", "none");
      write("--glitch-b-shadow", "none");
      write("--glitch-skew", "0deg");
      write("--glitch-alpha", "1");
      write("--glitch-split", "0");
      swaps.forEach((_, index) => cells[index]?.removeAttribute("data-glyph"));
      swaps.clear();
      event = null;
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

    const swap = (index: number, now: number, milliseconds: number, current: Settings) => {
      const cell = cells[index];
      if (!cell || cell.textContent === " ") return;
      cell.setAttribute("data-glyph", GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
      cell.style.setProperty(
        "--glitch-glyph",
        current.enableShadows ? current.shadowColors[index % 2] : "currentColor"
      );
      swaps.set(index, now + milliseconds * (1 + Math.floor(Math.random() * 3)));
    };

    const step = (now: number, current: Settings, power: number) => {
      const milliseconds = stepLength(current.speed);
      if (event && now >= event.until) event = null;
      if (!event && Math.random() < power * power * 0.35) {
        event = makeEvent(now, milliseconds);
      }
      jitter = [
        0.6 + Math.random() * 0.8,
        0.6 + Math.random() * 0.8,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ];
      alpha = current.flicker && Math.random() < 0.04 + 0.16 * power
        ? 0.45 + Math.random() * 0.35
        : 1;

      if (cells.length) {
        swaps.forEach((until, index) => {
          if (now < until) return;
          cells[index]?.removeAttribute("data-glyph");
          swaps.delete(index);
        });
        const chance = 0.01 + 0.16 * power * power;
        cells.forEach((_, index) => {
          if (Math.random() < (swaps.has(index) ? 0.35 : chance)) {
            swap(index, now, milliseconds, current);
          }
        });
        if (event?.fresh) {
          const start = Math.floor(Math.random() * cells.length);
          const run = 2 + Math.floor(Math.random() * 3);
          for (let index = 0; index < run; index += 1) {
            swap((start + index) % cells.length, now, milliseconds, current);
          }
        }
      }
      if (event) event.fresh = false;
      nextStep = now + milliseconds * (0.7 + Math.random() * 0.6);
    };

    const frame = (now: number) => {
      frameId = 0;
      if (!isActive(now)) {
        rest();
        last = 0;
        return;
      }

      const current = settingsRef.current;
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
      const scale = 0.4 + 1.2 * power;
      const effectiveOffset = Math.max(0, current.offset);
      const pace = Math.max(0.05, current.speed);

      let bandA: [number, number] = [0, 100];
      let bandB: [number, number] = [0, 100];
      let ax = 0;
      let ay = 0;
      let bx = 0;
      let by = 0;
      let split = 0;

      if (safeMode === "slices") {
        bandA = bandAt(pingPong(clock, 3 * pace));
        bandB = bandAt(pingPong(clock, 2 * pace));
        ax = effectiveOffset * scale;
        bx = -effectiveOffset * scale;
        if (live) {
          bandA = [live.aTop, 100 - live.aTop - live.aHeight];
          bandB = [live.bTop, 100 - live.bTop - live.bHeight];
          ax = effectiveOffset * scale * live.ax;
          bx = effectiveOffset * scale * live.bx;
          ay = effectiveOffset * live.ay;
          by = effectiveOffset * live.by;
        }
      } else if (safeMode === "rgb") {
        const spread = effectiveOffset * (0.22 + 0.45 * power);
        ax = spread * jitter[0];
        bx = -spread * jitter[1];
        ay = effectiveOffset * 0.06 * jitter[2];
        by = effectiveOffset * 0.06 * jitter[3];
        if (live) {
          ax = effectiveOffset * scale * Math.abs(live.ax);
          bx = -effectiveOffset * scale * Math.abs(live.bx);
          ay = effectiveOffset * live.ay;
          by = effectiveOffset * live.by;
        }
        split = current.enableShadows ? 0.9 : 0.4;
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

      write("--glitch-a-top", `${bandA[0].toFixed(2)}%`);
      write("--glitch-a-bottom", `${bandA[1].toFixed(2)}%`);
      write("--glitch-b-top", `${bandB[0].toFixed(2)}%`);
      write("--glitch-b-bottom", `${bandB[1].toFixed(2)}%`);
      write("--glitch-a-x", `${ax.toFixed(2)}px`);
      write("--glitch-a-y", `${ay.toFixed(2)}px`);
      write("--glitch-b-x", `${bx.toFixed(2)}px`);
      write("--glitch-b-y", `${by.toFixed(2)}px`);
      write(
        "--glitch-a-shadow",
        shadows ? `${(-ax / 2).toFixed(2)}px 0 ${current.shadowColors[0]}` : "none"
      );
      write(
        "--glitch-b-shadow",
        shadows ? `${(-bx / 2).toFixed(2)}px 0 ${current.shadowColors[1]}` : "none"
      );
      write("--glitch-skew", `${(live ? current.skew * live.skew : 0).toFixed(2)}deg`);
      write("--glitch-alpha", alpha.toFixed(2));
      write("--glitch-split", String(split));

      frameId = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (frameId || !isActive(performance.now())) return;
      last = 0;
      frameId = requestAnimationFrame(frame);
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
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    wake();

    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("click", onClick);
      rest();
    };
  }, [safeMode, activeTrigger, characterCount]);

  const visualClasses = className
    .split(/\s+/)
    .filter((token) =>
      token.startsWith("color-") ||
      token.startsWith("effect-") ||
      token.startsWith("is-name-style-")
    )
    .join(" ");
  const rootStyle: GlitchStyle = {
    ...style,
    color: color ?? style?.color,
    fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize ?? style?.fontSize,
    fontWeight: fontWeight ?? style?.fontWeight,
    "--glitch-color-a": enableShadows ? shadowColors[0] : "currentColor",
    "--glitch-color-b": enableShadows ? shadowColors[1] : "currentColor",
    "--glitch-mask-a": maskForBand("a"),
    "--glitch-mask-b": maskForBand("b")
  };
  const layer = safeMode === "rgb" ? "split" : safeMode === "noise" ? "hidden" : "band";

  return (
    <div ref={rootRef} className={`ps-reactbits-glitch glitch glitch--${safeMode} ${className}`} style={rootStyle}>
      <span className={`glitch__text ps-reactbits-glitch__text ps-glitch-text ${visualClasses}`} aria-hidden={characters ? "true" : undefined}>
        {characters
          ? characters.map((character, index) => (
              <span
                key={index}
                ref={(element) => { charRefs.current[index] = element; }}
                className="glitch__char ps-glitch-char"
              >
                {character}
              </span>
            ))
          : children}
      </span>
      {characters && <span className="glitch__sr ps-glitch-sr">{children}</span>}
      <span className={`glitch__slice glitch__slice--b ps-glitch-slice ps-glitch-slice--b ${visualClasses}`} aria-hidden="true">
        {children}
      </span>
      <span className={`glitch__slice glitch__slice--a ps-glitch-slice ps-glitch-slice--a ${visualClasses}`} aria-hidden="true">
        {children}
      </span>
    </div>
  );
}
