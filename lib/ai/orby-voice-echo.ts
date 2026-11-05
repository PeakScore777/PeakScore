const LOW_INFORMATION_WORDS = new Set([
  "no", "si", "y", "o", "de", "la", "el", "en", "es", "que", "con", "por", "para",
  "del", "un", "una", "me", "te", "lo", "se", "ya", "pero", "como", "muy", "mas",
  "eso", "esta", "este", "mi", "tu", "hola", "oe", "oee", "oye", "ey",
]);

function normalizeVoiceText(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9\s]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects when speech recognition feeds Orby's own recent audio back as input.
 * The caller may provide several recent assistant utterances because Live ASR
 * can deliver a delayed echo after a newer, shorter response has started.
 */
export function isLikelyVoicePlaybackEcho(
  transcript: string,
  assistantSpeech: string | readonly string[],
): boolean {
  const incoming = normalizeVoiceText(transcript);
  if (incoming.length < 3) return false;

  const candidates = typeof assistantSpeech === "string" ? [assistantSpeech] : assistantSpeech;
  const incomingWords = incoming.split(" ")
    .filter((word) => word.length >= 2 && !LOW_INFORMATION_WORDS.has(word));
  // Short curriculum phrases such as “Saber 11” are valid student input.
  if (incomingWords.length < 3) return false;

  for (const candidate of candidates) {
    const spoken = normalizeVoiceText(candidate);
    if (spoken.length < 6) continue;
    if (spoken.includes(incoming) || incoming.includes(spoken)) return true;

    const spokenWords = new Set(spoken.split(" ")
      .filter((word) => word.length >= 2 && !LOW_INFORMATION_WORDS.has(word)));
    const overlap = incomingWords.filter((word) => spokenWords.has(word)).length;
    const minimumOverlap = incomingWords.length < 4 ? incomingWords.length : 3;
    if (overlap >= minimumOverlap && overlap / incomingWords.length >= 0.68) return true;
  }

  return false;
}
