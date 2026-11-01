/**
 * Split extracted PDF text without cutting ordinary words at fixed offsets.
 * Prefer sentence boundaries, then whitespace; only an unbroken token longer
 * than the limit is allowed to be sliced.
 */
export function splitOrbyText(text: string, maxChars: number): string[] {
  const safeLimit = Math.max(80, Math.floor(maxChars));
  const normalized = text
    .replace(/\r/g, "")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];

  const splitLongParagraph = (paragraph: string): string[] => {
    const parts: string[] = [];
    let start = 0;

    while (start < paragraph.length) {
      let end = Math.min(start + safeLimit, paragraph.length);

      if (end < paragraph.length) {
        const minimumPreferredBoundary = start + Math.floor(safeLimit * 0.62);
        const window = paragraph.slice(start, end);
        const sentenceBoundary = Math.max(
          window.lastIndexOf(". "),
          window.lastIndexOf("! "),
          window.lastIndexOf("? "),
          window.lastIndexOf("; "),
          window.lastIndexOf(": ")
        );

        if (sentenceBoundary >= minimumPreferredBoundary - start) {
          end = start + sentenceBoundary + 1;
        } else {
          const whitespaceBoundary = window.lastIndexOf(" ");
          if (whitespaceBoundary >= minimumPreferredBoundary - start) {
            end = start + whitespaceBoundary;
          } else {
            const nextWhitespace = paragraph.indexOf(" ", end);
            if (nextWhitespace > end && nextWhitespace <= start + safeLimit + 80) {
              end = nextWhitespace;
            }
          }
        }
      }

      const part = paragraph.slice(start, end).trim();
      if (part) parts.push(part);
      start = end;
      while (start < paragraph.length && /\s/.test(paragraph[start])) start++;
    }

    return parts;
  };

  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > safeLimit) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...splitLongParagraph(paragraph));
      continue;
    }

    const candidate = current ? current + "\n\n" + paragraph : paragraph;
    if (candidate.length > safeLimit && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
