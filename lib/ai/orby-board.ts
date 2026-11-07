export type OrbyBoardBlock =
  | { type: "heading" | "text"; text: string }
  | { type: "formula"; text: string }
  | { type: "step"; label: string; text: string }
  | { type: "callout"; text: string };

export type OrbyBoard = {
  version: 1;
  title: string;
  blocks: OrbyBoardBlock[];
};

const MAX_BLOCKS = 8;
const MAX_TEXT = 240;

function safeText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Validates model-produced teaching-board data. Never accepts markup, URLs, SVG or executable content. */
export function sanitizeOrbyBoard(value: unknown): OrbyBoard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || !Array.isArray(raw.blocks)) return null;
  const title = safeText(raw.title, 100);
  if (!title || raw.blocks.length === 0 || raw.blocks.length > MAX_BLOCKS) return null;

  const blocks: OrbyBoardBlock[] = [];
  for (const candidate of raw.blocks) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const item = candidate as Record<string, unknown>;
    const type = item.type;
    if (type === "heading" || type === "text" || type === "formula" || type === "callout") {
      const text = safeText(item.text);
      if (!text) return null;
      blocks.push({ type, text });
    } else if (type === "step") {
      const label = safeText(item.label, 48);
      const text = safeText(item.text);
      if (!label || !text) return null;
      blocks.push({ type, label, text });
    } else {
      return null;
    }
  }
  return { version: 1, title, blocks };
}
