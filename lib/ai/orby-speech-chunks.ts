/**
 * Split Orby's spoken answer into endpoint-safe chunks without changing
 * sentence order. Keep this pure so long-answer regressions are testable.
 */
export function splitOrbySpeechIntoChunks(value: string, maxLength = 480): string[] {
  const limit = Math.max(1, Math.floor(maxLength));
  const sentences = value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [value];
  const chunks: string[] = [];
  let pending = "";

  const append = (segment: string) => {
    let remaining = segment.trim();
    while (remaining) {
      const available = limit - pending.length - (pending ? 1 : 0);
      if (available <= 0) {
        chunks.push(pending);
        pending = "";
        continue;
      }
      if (remaining.length <= available) {
        pending = pending ? `${pending} ${remaining}` : remaining;
        break;
      }
      if (pending) {
        chunks.push(pending);
        pending = "";
        continue;
      }
      let boundary = remaining.lastIndexOf(" ", available);
      if (boundary < Math.floor(available * 0.55)) boundary = available;
      chunks.push(remaining.slice(0, boundary).trim());
      remaining = remaining.slice(boundary).trim();
    }
  };

  for (const sentence of sentences) append(sentence);
  if (pending) chunks.push(pending);
  return chunks.filter(Boolean);
}
