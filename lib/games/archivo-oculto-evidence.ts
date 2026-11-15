import type { ArchivoContentBlock } from "@/lib/games/archivo-oculto-bank";

export type ArchivoEvidenceRecord = {
  title: string;
  description: string | null;
  tag: string;
  image_url: string;
  display_after_paragraph: number;
  layout: "float" | "wide";
};

/**
 * Places the selected documentary photographs inside the reading flow.
 * A position of 0 means before the first paragraph; 1 means after paragraph 1.
 */
export function addEvidenceToReading(
  contentBlocks: unknown,
  evidence: ArchivoEvidenceRecord[],
): ArchivoContentBlock[] {
  const sourceBlocks = Array.isArray(contentBlocks)
    ? contentBlocks as ArchivoContentBlock[]
    : [];
  if (!evidence.length) return sourceBlocks;

  const evidenceByPosition = new Map<number, ArchivoEvidenceRecord[]>();
  for (const item of evidence) {
    const position = Math.max(0, Math.floor(Number(item.display_after_paragraph) || 0));
    const bucket = evidenceByPosition.get(position) ?? [];
    bucket.push(item);
    evidenceByPosition.set(position, bucket);
  }

  const result: ArchivoContentBlock[] = [];
  const appendEvidence = (items: ArchivoEvidenceRecord[] | undefined) => {
    if (!items) return;
    for (const item of items) {
      result.push({
        type: "image",
        url: item.image_url,
        alt: item.description?.trim() || item.title,
        caption: [item.title, item.description?.trim()].filter(Boolean).join(" · "),
        layout: item.layout,
      });
    }
  };

  appendEvidence(evidenceByPosition.get(0));
  let paragraphIndex = 0;
  for (const block of sourceBlocks) {
    result.push(block);
    if (block.type === "paragraph") {
      paragraphIndex += 1;
      appendEvidence(evidenceByPosition.get(paragraphIndex));
    }
  }

  // Keep images placed beyond the current paragraph count, rather than silently dropping them.
  for (const [position, items] of evidenceByPosition) {
    if (position > paragraphIndex) appendEvidence(items);
  }

  return result;
}
