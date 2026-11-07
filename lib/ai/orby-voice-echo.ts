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
  if (incoming.length < 2) return false;

  const candidates = typeof assistantSpeech === "string" ? [assistantSpeech] : assistantSpeech;
  const incomingWords = incoming.split(" ")
    .filter((word) => /^[a-z]{2,}$/i.test(word) && !LOW_INFORMATION_WORDS.has(word));

  for (const candidate of candidates) {
    const spoken = normalizeVoiceText(candidate);
    if (spoken.length < 2) continue;
    if (spoken === incoming) return true;

    // Greetings and acknowledgements can be echoes only when the recent
    // assistant audio contains that same standalone low-information word.
    // Match a complete token, never a substring ("sí" must not match "sin").
    if (LOW_INFORMATION_WORDS.has(incoming)) {
      if (spoken.split(" ").includes(incoming)) return true;
      continue;
    }

    // Exact multiword matches are strong echo evidence. Keep common complete
    // greetings eligible even when stop-word removal leaves only one word.
    const isGreetingPhrase = /^(?:hola(?: de nuevo)?|oye orby|oee(?: hermano)?|oe(?: hermano)?|buenas(?: tardes| noches)?|buenos dias)$/.test(incoming);
    if (isGreetingPhrase && spoken.split(" ").includes(incoming)) return true;

    // Curriculum terms such as "Saber 11" have too little lexical signal
    // for a fuzzy echo match; never suppress them as a short phrase.
    if (incomingWords.length < 2 || spoken.length < 6) continue;
    if (spoken.includes(incoming) || incoming.includes(spoken)) return true;

    const spokenWords = new Set(spoken.split(" ")
      .filter((word) => /^[a-z]{2,}$/i.test(word) && !LOW_INFORMATION_WORDS.has(word)));
    const overlap = incomingWords.filter((word) => spokenWords.has(word)).length;
    const minimumOverlap = incomingWords.length < 4 ? incomingWords.length : 3;
    if (overlap >= minimumOverlap && overlap / incomingWords.length >= 0.68) return true;
  }

  return false;
}

/**
 * A short fragment heard while Orby is speaking is more likely to be speaker
 * echo or VAD noise than a deliberate interruption. Require a meaningful
 * phrase before barging into Live playback; the full transcript is still
 * accepted normally once playback has ended.
 */
export function isStrongVoiceBargeIn(
  transcript: string,
  assistantSpeech: string | readonly string[] = [],
): boolean {
  const incoming = normalizeVoiceText(transcript);
  if (!incoming || isLikelyVoicePlaybackEcho(incoming, assistantSpeech)) return false;
  if (/^(?:no entiendo|no entendi|espera|esperate|un momento|repiteme|detente|para|alto|oye orby|por que|porque|como asi|no te escucho|tengo otra pregunta)$/.test(incoming)) {
    return true;
  }
  const meaningfulWords = incoming.split(" ")
    .filter((word) => /^[a-z]{2,}$/i.test(word) && !LOW_INFORMATION_WORDS.has(word));
  return incoming.length >= 12 && meaningfulWords.length >= 2;
}

/**
 * Same words can be a legitimate answer in a later speech activity ("sí", "no",
 * "vale"). Suppress duplicates only inside the same detected activity window.
 */
export function isDuplicateVoiceTranscriptInActivity(
  transcript: string,
  previousTranscript: string,
  activityGeneration: number,
  previousActivityGeneration: number,
  previousAt: number,
  now = Date.now(),
  duplicateWindowMs = 10_000,
): boolean {
  const incoming = normalizeVoiceText(transcript);
  const previous = normalizeVoiceText(previousTranscript);
  if (!incoming || !previous || incoming !== previous) return false;
  if (activityGeneration !== previousActivityGeneration) return false;
  const age = now - previousAt;
  return age >= 0 && age < duplicateWindowMs;
}
