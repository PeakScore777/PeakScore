export type FuzzyTextTrigger = "hover" | "always" | "click";
export type FuzzyTextDirection = "horizontal" | "vertical" | "both";

export type FuzzyTextSettings = {
  preset: "static";
  color: string;
  colorSplit: number;
  trigger: FuzzyTextTrigger;
  direction: FuzzyTextDirection;
  baseIntensity: number;
  hoverIntensity: number;
  fuzzRange: number;
  sliceSize: number;
  fps: number;
  transitionDuration: number;
  intro: boolean;
  introDuration: number;
  enableHover: boolean;
  clickEffect: boolean;
  glitchMode: boolean;
  glitchInterval: number;
  glitchDuration: number;
  letterSpacing: number;
};

export const DEFAULT_FUZZY_TEXT_SETTINGS: FuzzyTextSettings = {
  preset: "static",
  color: "#FFFFFF",
  colorSplit: 0,
  trigger: "hover",
  direction: "horizontal",
  baseIntensity: 0.2,
  hoverIntensity: 0.5,
  fuzzRange: 30,
  sliceSize: 1,
  fps: 60,
  transitionDuration: 0,
  intro: true,
  introDuration: 1400,
  enableHover: true,
  clickEffect: false,
  glitchMode: false,
  glitchInterval: 2000,
  glitchDuration: 200,
  letterSpacing: 0,
};

const clamp = (value: unknown, fallback: number, min: number, max: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
};

export function normalizeFuzzyTextSettings(value: unknown): FuzzyTextSettings {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const defaults = DEFAULT_FUZZY_TEXT_SETTINGS;
  const color = typeof source.color === "string" && /^#[0-9a-f]{6}$/i.test(source.color)
    ? source.color.toUpperCase()
    : defaults.color;
  const trigger: FuzzyTextTrigger = source.trigger === "always" || source.trigger === "click" ? source.trigger : "hover";
  const direction: FuzzyTextDirection = source.direction === "vertical" || source.direction === "both" ? source.direction : "horizontal";
  return {
    preset: "static",
    color,
    colorSplit: clamp(source.colorSplit, defaults.colorSplit, 0, 1),
    trigger,
    direction,
    baseIntensity: clamp(source.baseIntensity, defaults.baseIntensity, 0, 1),
    hoverIntensity: clamp(source.hoverIntensity, defaults.hoverIntensity, 0, 1),
    fuzzRange: clamp(source.fuzzRange, defaults.fuzzRange, 0, 100),
    sliceSize: clamp(source.sliceSize, defaults.sliceSize, 1, 20),
    fps: clamp(source.fps, defaults.fps, 1, 60),
    transitionDuration: clamp(source.transitionDuration, defaults.transitionDuration, 0, 3000),
    intro: typeof source.intro === "boolean" ? source.intro : defaults.intro,
    introDuration: clamp(source.introDuration, defaults.introDuration, 0, 5000),
    enableHover: typeof source.enableHover === "boolean" ? source.enableHover : defaults.enableHover,
    clickEffect: typeof source.clickEffect === "boolean" ? source.clickEffect : defaults.clickEffect,
    glitchMode: typeof source.glitchMode === "boolean" ? source.glitchMode : defaults.glitchMode,
    glitchInterval: clamp(source.glitchInterval, defaults.glitchInterval, 250, 30000),
    glitchDuration: clamp(source.glitchDuration, defaults.glitchDuration, 50, 3000),
    letterSpacing: clamp(source.letterSpacing, defaults.letterSpacing, 0, 20),
  };
}
