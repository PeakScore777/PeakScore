export type FuzzyTextTrigger = "hover" | "always" | "click";
export type FuzzyTextDirection = "horizontal" | "vertical" | "both";

export type FuzzyTextSettings = {
  preset: "static"; color: string; colorSplit: number; trigger: FuzzyTextTrigger;
  direction: FuzzyTextDirection; baseIntensity: number; hoverIntensity: number;
  fuzzRange: number; sliceSize: number; fps: number; transitionDuration: number;
  intro: boolean; introDuration: number; enableHover: boolean; clickEffect: boolean;
  glitchMode: boolean; glitchInterval: number; glitchDuration: number; letterSpacing: number;
};

// Fixed art direction for the name's animated noise reveal. No pointer interaction.
export const DEFAULT_FUZZY_TEXT_SETTINGS: FuzzyTextSettings = {
  preset: "static", color: "currentColor", colorSplit: 0.12, trigger: "always",
  direction: "both", baseIntensity: 0.12, hoverIntensity: 0.2,
  fuzzRange: 10, sliceSize: 2, fps: 30, transitionDuration: 220,
  intro: true, introDuration: 1050, enableHover: false, clickEffect: false,
  glitchMode: false, glitchInterval: 2600, glitchDuration: 180, letterSpacing: 0,
};

export function normalizeFuzzyTextSettings(_value: unknown): FuzzyTextSettings {
  return { ...DEFAULT_FUZZY_TEXT_SETTINGS };
}
