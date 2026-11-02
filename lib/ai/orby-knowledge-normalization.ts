export type OrbyKnowledgeConcept = {
  name: string;
  area: string;
  parent_concept: string;
  aliases: string[];
  evidence_pages: number[];
  confidence: number;
  importance: number;
  evidence: string;
};

/**
 * Normalizes a concept label for identity matching while preserving its
 * display name elsewhere. Mathematical notations such as "|X|" are treated
 * as aliases, not as separate academic concepts.
 */
export function normalizeOrbyConceptIdentity(value: string): string {
  return value
    .replace(/\|[^|]{1,32}\|/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStrings(values: string[], limit: number, maxLength: number): string[] {
  const output = new Map<string, string>();
  for (const raw of values) {
    const value = raw.trim().slice(0, maxLength);
    if (!value) continue;
    const key = normalizeOrbyConceptIdentity(value);
    if (key && !output.has(key)) output.set(key, value);
    if (output.size >= limit) break;
  }
  return [...output.values()];
}

/**
 * Deduplicates concepts by academic area + normalized name, independent of
 * parent heading. Evidence pages and aliases are merged; the most descriptive
 * source heading is retained as the primary parent.
 */
export function deduplicateOrbyKnowledgeConcepts<T extends OrbyKnowledgeConcept>(concepts: T[]): T[] {
  const merged = new Map<string, T>();

  for (const concept of concepts) {
    const name = concept.name.trim().slice(0, 180);
    const area = concept.area.trim().slice(0, 80) || "Transversal";
    if (!name) continue;

    const key = normalizeOrbyConceptIdentity(area) + "|" + normalizeOrbyConceptIdentity(name);
    const incoming = {
      ...concept,
      name,
      area,
      parent_concept: concept.parent_concept.trim().slice(0, 180),
      aliases: Array.isArray(concept.aliases) ? concept.aliases : [],
      evidence_pages: Array.isArray(concept.evidence_pages) ? concept.evidence_pages : [],
    } as T;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, incoming);
      continue;
    }

    const existingParent = existing.parent_concept || "";
    const incomingParent = incoming.parent_concept || "";
    const chooseIncomingParent = normalizeOrbyConceptIdentity(incomingParent).length
      > normalizeOrbyConceptIdentity(existingParent).length;

    const chosenName = incoming.name.length > existing.name.length ? incoming.name : existing.name;
    const alternateNames = [existing.name, incoming.name].filter((value) => value !== chosenName);
    const evidenceParts = uniqueStrings([existing.evidence, incoming.evidence], 8, 1000);
    const pages = [...new Set([...existing.evidence_pages, ...incoming.evidence_pages])]
      .filter((page) => Number.isInteger(page) && page > 0)
      .sort((a, b) => a - b);

    merged.set(key, {
      ...existing,
      name: chosenName,
      parent_concept: chooseIncomingParent ? incomingParent : existingParent,
      aliases: uniqueStrings([...existing.aliases, ...incoming.aliases, ...alternateNames], 12, 100),
      evidence_pages: pages,
      confidence: Math.max(existing.confidence, incoming.confidence),
      importance: Math.max(existing.importance, incoming.importance),
      evidence: evidenceParts.join(" · ").slice(0, 1000),
    });
  }

  return [...merged.values()];
}
