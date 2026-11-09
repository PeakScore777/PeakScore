/**
 * Karaoke-style subtitle timing for Orby's streamed audio.
 *
 * Gemini Live supplies incremental output text and PCM audio, but it does not
 * expose word-level phonetic timestamps. This helper maps the current audio
 * playback clock to a monotonic visual word highlight; it must never be
 * described as exact phoneme alignment.
 */
export function countOrbySubtitleWords(value: string): number {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? (text.match(/\S+/gu)?.length ?? 0) : 0;
}

/**
 * Returns the word index that should be visually highlighted at this audio
 * playback position. The schedule is anchored to Web Audio's playback clock
 * and the duration of PCM already queued for the current response.
 *
 * previousWordIndex prevents the highlight from moving backwards when more
 * streamed audio extends the denominator or another transcript chunk arrives.
 */
export function getOrbyKaraokeWordIndex(
  elapsedSeconds: number,
  scheduledAudioSeconds: number,
  wordCount: number,
  previousWordIndex = -1,
): number {
  if (!Number.isFinite(wordCount) || wordCount <= 0) return -1;
  const safeWordCount = Math.max(0, Math.floor(wordCount));
  const safePrevious = Number.isFinite(previousWordIndex)
    ? Math.max(-1, Math.min(safeWordCount - 1, Math.floor(previousWordIndex)))
    : -1;
  if (!Number.isFinite(elapsedSeconds) || !Number.isFinite(scheduledAudioSeconds)
    || scheduledAudioSeconds <= 0) return safePrevious;

  const progress = Math.min(1, Math.max(0, elapsedSeconds / scheduledAudioSeconds));
  const candidate = Math.min(safeWordCount - 1, Math.floor(progress * safeWordCount));
  return Math.max(safePrevious, candidate);
}


/**
 * Estimates relative spoken duration for one subtitle token. Gemini Live does
 * not expose word-level phoneme timestamps, so this is a visual pacing estimate
 * rather than a claim of exact transcription/audio alignment.
 */
function getOrbySubtitleWordWeight(token: string): number {
  const normalized = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase("es-CO");
  if (!normalized) return 0.75;

  const letters = normalized.replace(/[0-9]/g, "");
  const vowelGroups = letters.match(/[aeiouy]+/g)?.length ?? 0;
  const estimatedSyllables = /^\d+$/.test(normalized)
    ? Math.ceil(normalized.length / 2)
    : Math.max(1, vowelGroups, Math.ceil(Array.from(normalized).length / 6));
  const boundedSyllables = Math.min(6, estimatedSyllables);
  const punctuationPause = /[.!?…][”’"')\]]*$/.test(token)
    ? 0.42
    : /[,;:][”’"')\]]*$/.test(token)
      ? 0.18
      : 0;
  return 0.52 + boundedSyllables * 0.48 + punctuationPause;
}

/**
 * Karaoke index weighted by estimated syllables/word length and punctuation.
 * Existing spoken words keep a monotonic index when more streamed transcript
 * text extends the active response.
 */
export function getOrbyKaraokeWordIndexForText(
  elapsedSeconds: number,
  scheduledAudioSeconds: number,
  transcript: string,
  previousWordIndex = -1,
  responseComplete = true,
): number {
  const words = splitOrbySubtitleSegments(typeof transcript === "string" ? transcript : "")
    .filter((part) => part.trim().length > 0);
  const wordCount = words.length;
  if (wordCount === 0) return -1;

  const safePrevious = Number.isFinite(previousWordIndex)
    ? Math.max(-1, Math.min(wordCount - 1, Math.floor(previousWordIndex)))
    : -1;
  if (!Number.isFinite(elapsedSeconds) || !Number.isFinite(scheduledAudioSeconds)
    || scheduledAudioSeconds <= 0) return safePrevious;

  const weights = words.map(getOrbySubtitleWordWeight);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return safePrevious;

  const progress = Math.min(1, Math.max(0, elapsedSeconds / scheduledAudioSeconds));
  const targetWeight = progress * totalWeight;
  let elapsedWeight = 0;
  let candidate = wordCount - 1;
  for (let index = 0; index < wordCount; index += 1) {
    elapsedWeight += weights[index];
    if (targetWeight < elapsedWeight || index === wordCount - 1) {
      candidate = index;
      break;
    }
  }
  return Math.max(safePrevious, candidate);
}

/**
 * Keep whitespace as separate segments so the UI can highlight words without
 * changing the transcript's punctuation or spacing.
 */
export function splitOrbySubtitleSegments(value: string): string[] {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? (text.match(/\S+|\s+/gu) ?? []) : [];
}
