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

  // While Live is still streaming, never expose the final token early just
  // because the currently queued PCM horizon is shorter than the full reply.
  // turnComplete releases this guard after all response audio has been queued.
  const lastHighlightableWord = responseComplete ? wordCount - 1 : wordCount - 2;
  const safePrevious = Number.isFinite(previousWordIndex)
    ? Math.max(-1, Math.min(lastHighlightableWord, Math.floor(previousWordIndex)))
    : -1;
  if (lastHighlightableWord < 0) return safePrevious;
  if (!Number.isFinite(elapsedSeconds) || !Number.isFinite(scheduledAudioSeconds)
    || scheduledAudioSeconds <= 0) return safePrevious;

  const weights = words.map(getOrbySubtitleWordWeight);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return safePrevious;

  const progress = Math.min(1, Math.max(0, elapsedSeconds / scheduledAudioSeconds));
  const targetWeight = progress * totalWeight;
  let elapsedWeight = 0;
  let candidate = lastHighlightableWord;
  for (let index = 0; index <= lastHighlightableWord; index += 1) {
    elapsedWeight += weights[index];
    if (targetWeight < elapsedWeight || index === lastHighlightableWord) {
      candidate = index;
      break;
    }
  }
  return Math.max(safePrevious, candidate);
}

/**
 * Select only words that the shared audio clock has reached.
 * The returned window is bounded and never exposes future transcript words.
 */
export function getOrbySubtitleWindow(
  transcript: string,
  currentWordIndex: number,
  maxWords = 8,
): { text: string; startWordIndex: number; endWordIndex: number } | null {
  const normalized = typeof transcript === "string"
    ? transcript.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim()
    : "";
  if (!normalized || !Number.isFinite(currentWordIndex) || currentWordIndex < 0) return null;
  const words = [...normalized.matchAll(/\S+/gu)];
  if (!words.length) return null;

  // Use fixed, cumulative phrase chunks instead of a rolling "last N words"
  // window. A spoken phrase stays visible until its final word is reached;
  // only then does the next chunk replace it. Never expose future words.
  const endWordIndex = Math.min(words.length - 1, Math.floor(currentWordIndex));
  const safeChunkSize = Number.isFinite(maxWords)
    ? Math.max(1, Math.min(12, Math.floor(maxWords)))
    : 8;
  const startWordIndex = Math.floor(endWordIndex / safeChunkSize) * safeChunkSize;
  const start = words[startWordIndex].index ?? 0;
  const last = words[endWordIndex];
  const end = (last.index ?? start) + last[0].length;
  return {
    text: normalized.slice(start, end),
    startWordIndex,
    endWordIndex,
  };
}

/**
 * Keep whitespace as separate segments so the UI can highlight words without
 * changing the transcript's punctuation or spacing.
 */
export function splitOrbySubtitleSegments(value: string): string[] {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? (text.match(/\S+|\s+/gu) ?? []) : [];
}
