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
  return text ? (text.match(/\S+/gu) ?? []).length : 0;
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
