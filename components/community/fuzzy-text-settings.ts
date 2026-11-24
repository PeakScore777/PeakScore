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
  // React Bits reference setup: a restrained, continuous horizontal signal.
  preset: "static", color: "#F1F3F8", colorSplit: 0.08, trigger: "always",
  direction: "horizontal", baseIntensity: 0.14, hoverIntensity: 0.26,
  fuzzRange: 16, sliceSize: 1, fps: 60, transitionDuration: 0,
  intro: false, introDuration: 0, enableHover: false, clickEffect: false,
  glitchMode: false, glitchInterval: 2000, glitchDuration: 200, letterSpacing: 0,
};

export function normalizeFuzzyTextSettings(value: unknown): FuzzyTextSettings {
  void value;
  return { ...DEFAULT_FUZZY_TEXT_SETTINGS };
}

export function resolveFuzzyTextAppearance(
  className: string,
  style?: Record<string, unknown>
): { color: string; gradient?: string[] } {
  const value = (key: string) => typeof style?.[key] === "string" ? style[key] as string : "";
  const effect = className.match(/(?:^|\\s)effect-([a-z-]+)/)?.[1] ?? "plain";
  const solid = value("--name-solid-color");
  const start = value("--name-gradient-start") || "#65D8C2";
  const end = value("--name-gradient-end") || "#9C83F5";
  const prism = value("--name-prism-gradient");
  const prismStops = prism.match(/#[0-9a-f]{6}/gi) ?? [];
  const colorClass = className.match(/(?:^|\\s)color-([a-z-]+)/)?.[1] ?? "default";
  const palette: Record<string, string> = {
    default: "#F1F3F8", pink: "#F06AA8", green: "#55CFA3", blue: "#63A9F5",
    purple: "#A88AF2", magenta: "#D96BCB", red: "#E46E79", gold: "#D8B875",
  };
  const gradients: Record<string, string[]> = {
    gradient: [start, "#FFFFFF", end],
    "custom-gradient": [start, "#FFFFFF", end],
    toon: ["#FFFFFF", "#E9EDF5", "#AAB5C9", "#FFFFFF", "#8290A9"],
    gummy: ["#F6A8CF", "#FFE2B8", "#FFFFFF", "#B7F1E0", "#A9C8FF", "#D5A6FF"],
    chromaflow: ["#FFB52E", "#F5E84A", "#43DF9A", "#35C9DC", "#4D8CFF", "#A66CFF", "#F05BC8", "#FF665E"],
  };
  if ((effect === "prism" || effect === "gummy") && prismStops.length >= 2) {
    return { color: "#FFFFFF", gradient: prismStops };
  }
  if (gradients[effect]) return { color: "#FFFFFF", gradient: gradients[effect] };
  if (colorClass === "custom-gradient") return { color: "#FFFFFF", gradient: [start, "#FFFFFF", end] };
  if (effect === "neon") return { color: "#F4EAFF" };
  return {
    color: /^#[0-9a-f]{6}$/i.test(solid) ? solid : (palette[colorClass] ?? "#F1F3F8"),
  };
}
