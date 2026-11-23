export type FuzzyTextTrigger = "hover" | "always" | "click";
export type FuzzyTextDirection = "horizontal" | "vertical" | "both";

export type FuzzyTextSettings = {
  preset: "static"; color: string; colorSplit: number; trigger: FuzzyTextTrigger;
  direction: FuzzyTextDirection; baseIntensity: number; hoverIntensity: number;
  fuzzRange: number; sliceSize: number; fps: number; transitionDuration: number;
  intro: boolean; introDuration: number; enableHover: boolean; clickEffect: boolean;
  glitchMode: boolean; glitchInterval: number; glitchDuration: number; letterSpacing: number;
};

// Curated art direction: no user-facing technical tuning.
export const DEFAULT_FUZZY_TEXT_SETTINGS: FuzzyTextSettings = {
  preset: "static", color: "#FFFFFF", colorSplit: 0.18, trigger: "hover",
  direction: "horizontal", baseIntensity: 0.035, hoverIntensity: 0.14,
  fuzzRange: 7, sliceSize: 3, fps: 24, transitionDuration: 260,
  intro: true, introDuration: 680, enableHover: true, clickEffect: false,
  glitchMode: false, glitchInterval: 2400, glitchDuration: 160, letterSpacing: 0,
};

export function normalizeFuzzyTextSettings(_value: unknown): FuzzyTextSettings {
  return { ...DEFAULT_FUZZY_TEXT_SETTINGS };
}
