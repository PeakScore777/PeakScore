const AUTOMATIC_OR_SPECTRUM_EFFECTS = new Set(["toon", "gummy", "prism", "chromaflow", "gradient-flow"]);

/** Never let a stale solid swatch override an effect that owns its own palette. */
export function displayNameColorForEffect(effect: string | null | undefined, color: string | null | undefined): string {
  if (AUTOMATIC_OR_SPECTRUM_EFFECTS.has(effect ?? "plain")) return "default";
  return color ?? "default";
}


const DISPLAY_NAME_SOLID_PALETTE: Record<string, string> = {
  pink: "#F06AA8",
  green: "#55CFA3",
  blue: "#63A9F5",
  purple: "#A88AF2",
  magenta: "#D96BCB",
  red: "#E46E79",
  gold: "#D8B875",
};

/** Resolve one canonical swatch value for profile, member-list and chat renderers. */
export function displayNameSolidColor(
  color: string | null | undefined,
  customGradientStart?: string | null
): string {
  if (color === "custom-gradient") {
    return /^#[0-9a-f]{6}$/i.test(customGradientStart ?? "")
      ? customGradientStart!
      : "#B86BFF";
  }
  return DISPLAY_NAME_SOLID_PALETTE[color ?? ""] ?? "currentColor";
}


/** Keep Inkline's contour hue coherent with the selected finish. */
export function displayNameInklineStrokeColor(
  effect: string | null | undefined,
  style?: Record<string, unknown>
): string {
  const read = (key: string, fallback: string) =>
    typeof style?.[key] === "string" ? style[key] as string : fallback;
  const selectedPalette = read("--name-prism-gradient", "").match(/#[0-9a-f]{6}/gi) ?? [];
  switch (effect ?? "plain") {
    case "gradient": return read("--name-gradient-start", "#9D83FF");
    case "toon": return "#DDE3EC";
    case "gummy":
    case "prism": return selectedPalette[0] ?? "#FF9C45";
    case "chromaflow": return "#A66CFF";
    case "gradient-flow": return "#A34DFF";
    case "neon": return "#E8D8FF";
    case "pop": return read("--name-solid-color", "#55CFA3");
    default: return read("--name-solid-color", "#A78BFA");
  }
}
