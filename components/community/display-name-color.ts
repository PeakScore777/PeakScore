const AUTOMATIC_OR_SPECTRUM_EFFECTS = new Set(["toon", "gummy", "prism", "chromaflow"]);

/** Never let a stale solid swatch override an effect that owns its own palette. */
export function displayNameColorForEffect(effect: string | null | undefined, color: string | null | undefined): string {
  if (AUTOMATIC_OR_SPECTRUM_EFFECTS.has(effect ?? "plain")) return "default";
  return color ?? "default";
}
