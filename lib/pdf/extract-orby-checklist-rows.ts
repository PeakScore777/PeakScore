export type OrbyChecklistSourceChunk = {
  page_number: number;
  content: string;
};

export type ExtractedChecklistRow = {
  name: string;
  parent_concept: string;
  area: string;
  page: number;
};

function detectAcademicArea(value: string): string | null {
  if (/^matem[aá]ticas\b/i.test(value)) return "Matemáticas";
  if (/^f[ií]sica\b/i.test(value)) return "Física";
  if (/^biolog[ií]a\b/i.test(value)) return "Biología";
  if (/^qu[ií]mica\b/i.test(value)) return "Química";
  if (/^(?:ciencias\s+sociales|sociales)\b/i.test(value)) return "Ciencias Sociales";
  if (/^an[aá]lisis\s+textual\b/i.test(value)) return "Análisis Textual";
  if (/^an[aá]lisis\s+de\s+la\s+imagen\b/i.test(value)) return "Análisis de la Imagen";
  return null;
}

function normalizeKey(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extract every explicit numbered/bulleted row from a document in page order.
 * It deliberately does not require labels such as "temario" or "checklist":
 * study guides often present complete lists beneath subject/module headings.
 */
export function extractOrbyChecklistRows(
  chunks: OrbyChecklistSourceChunk[]
): ExtractedChecklistRow[] {
  const rows = new Map<string, ExtractedChecklistRow>();
  let currentArea = "Transversal";
  let currentParent = "Contenidos del documento";
  let pending: { name: string; page: number } | null = null;

  const addPending = () => {
    if (!pending) return;
    const name = pending.name
      .replace(/^\\s+|\\s+$/g, "")
      .replace(/\\s+/g, " ")
      .trim()
      .replace(/[.;:]$/, "");
    pending = null;

    if (name.length < 3 || name.length > 260) return;
    if (/^(?:p[aá]gina\s+\d+|ok|estado|\u2713|\u2717)$/i.test(name)) return;
    if (/^(?:somos consultores|te damos la llave|a continuaci[oó]n|al finalizar|para que lleves tu control)$/i.test(name)) return;

    const key = pendingPageKey(name, pendingPage);
    if (!rows.has(key)) {
      rows.set(key, {
        name: name.slice(0, 180),
        parent_concept: currentParent.slice(0, 180),
        area: currentArea,
        page: pendingPage,
      });
    }
  };

  let pendingPage = 1;

  for (const chunk of [...chunks].sort((a, b) => a.page_number - b.page_number)) {
    const lines = chunk.content
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines) {
      const block = line.match(/^BLOQUE\s+[IVXLCDM0-9]+\s*[.:–—-]?\s*(.+)$/i);
      if (block) {
        addPending();
        currentParent = block[1].replace(/[.;:]$/, "").trim() || "Contenidos del documento";
        continue;
      }

      // Only module/area headings should change the current section.
      // Numbered content such as "Operaciones con vectores [gráfico]" is a
      // syllabus row, not a heading.
      const bracketHeading = line.match(/^(?:Matemáticas(?:\s+\d+(?:\s+y\s+\d+)?)?|Física(?:\s+\d+(?:\s+y\s+\d+)?)?|Biología(?:\s+\d+)?|Química(?:\s+\d+(?:\s+y\s+\d+)?)?|Sociales(?:\s+\d+)?|Imagen(?:\s+\d+)?|Análisis\s+Textual|Análisis\s+de\s+la\s+Imagen)\s+\[([^\]]+)\]$/i);
      if (bracketHeading) {
        addPending();
        const prefix = line.slice(0, line.indexOf("[")).trim();
        currentArea = detectAcademicArea(prefix) ?? currentArea;
        currentParent = line.slice(0, 180);
        continue;
      }

      const detectedArea = detectAcademicArea(line);
      if (detectedArea) {
        addPending();
        currentArea = detectedArea;
        currentParent = line.slice(0, 180);
        continue;
      }

      if (/^(?:matem[aá]ticas|f[ií]sica|biolog[ií]a|qu[ií]mica|sociales|imagen)\s+\d+(?:\s+y\s+\d+)?$/i.test(line)) {
        addPending();
        currentArea = detectAcademicArea(line) ?? currentArea;
        currentParent = line.slice(0, 180);
        continue;
      }

      // Some PDF extractors return "1." and its label as separate lines.
      // Keep the page/number context until the label arrives.
      const standaloneNumber = line.match(/^\s*\d+[.)]\s*$/);
      if (standaloneNumber) {
        addPending();
        pending = { name: "", page: chunk.page_number };
        pendingPage = chunk.page_number;
        continue;
      }

      const numbered = line.match(/^\s*\d+[.)]\s*(.+)$/);
      const bulleted = line.match(/^\s*[•●▪◦*–—-]\s*(.+)$/);
      const item = numbered ?? bulleted;

      if (item) {
        addPending();
        pending = { name: item[1].trim(), page: chunk.page_number };
        pendingPage = chunk.page_number;
        continue;
      }

      if (/^(?:p[aá]gina\s+\d+|check\s*list|contenidos?|temas|subtemas|área|asignatura|estado)$/i.test(line)) {
        addPending();
        continue;
      }

      // If the list marker was detached from its text, this is its label.
      if (pending && !pending.name) {
        pending.name = line;
        continue;
      }

      // Join wrapped text only when the preceding source row visibly continues.
      if (pending && /[-,:;(/\[]$/.test(pending.name)) {
        pending.name += " " + line;
      } else {
        addPending();
      }
    }
  }

  addPending();
  return [...rows.values()];
}

function pendingPageKey(name: string, page: number): string {
  return page + "|" + normalizeKey(name);
}
