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
function safeProfileThemeColor(value: string | null | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value! : fallback;
}

function themeLuminance(hex: string) {
  const clean = safeProfileThemeColor(hex, "#B7D7C3").slice(1);
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function blendProfileThemeColors(first: string, second: string, amount: number) {
  const a = safeProfileThemeColor(first, "#B7D7C3").slice(1);
  const b = safeProfileThemeColor(second, "#8FB9A6").slice(1);
  const channels = [0, 2, 4].map((index) => {
    const av = parseInt(a.slice(index, index + 2), 16);
    const bv = parseInt(b.slice(index, index + 2), 16);
    return Math.round(av * (1 - amount) + bv * amount).toString(16).padStart(2, "0");
  });
  return "#" + channels.join("");
}

/** Same shared contrast foreground used by the profile-card editor preview. */
export function readableProfileTextColor(cardColor?: string | null, secondaryColor?: string | null) {
  const first = safeProfileThemeColor(cardColor, "#B7D7C3");
  const second = safeProfileThemeColor(secondaryColor, "#8FB9A6");
  const samples = Array.from({ length: 9 }, (_, index) => blendProfileThemeColors(first, second, index / 8));
  const contrast = (ink: string, sample: string) => {
    const a = themeLuminance(ink);
    const b = themeLuminance(sample);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const lightInk = "#F7F8FA";
  const darkInk = "#17191F";
  const lightWorst = Math.min(...samples.map((sample) => contrast(lightInk, sample)));
  const darkWorst = Math.min(...samples.map((sample) => contrast(darkInk, sample)));
  return lightWorst >= darkWorst ? lightInk : darkInk;
}

export function displayNameSolidColor(
  color: string | null | undefined,
  customGradientStart?: string | null,
  automaticColor = "currentColor"
): string {
  if (color === "custom-gradient") {
    return /^#[0-9a-f]{6}$/i.test(customGradientStart ?? "")
      ? customGradientStart!
      : "#B86BFF";
  }
  if (!color || color === "default") return automaticColor;
  return DISPLAY_NAME_SOLID_PALETTE[color] ?? automaticColor;
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
