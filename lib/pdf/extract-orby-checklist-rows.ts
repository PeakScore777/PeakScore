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

export type ExtractedCompetencyRow = {
  name: string;
  area: string;
  page: number;
  evidence: string;
  question_count: number;
};

function normalizeKey(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanLine(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/[.;:]$/, "").trim();
}

function exactAreaHeading(value: string): { area: string; label: string } | null {
  const line = cleanLine(value);
  const key = normalizeKey(line);

  const exact: Record<string, string> = {
    "lectura-critica": "Lectura Crítica",
    "matematicas": "Matemáticas",
    "matematicas-unal": "Matemáticas",
    "ciencias-naturales": "Ciencias Naturales",
    "ciencias-sociales-y-competencias-ciudadanas": "Ciencias Sociales",
    "ciencias-sociales": "Ciencias Sociales",
    "sociales": "Ciencias Sociales",
    "fisica": "Física",
    "biologia": "Biología",
    "quimica": "Química",
    "analisis-textual": "Análisis Textual",
    "analisis-de-la-imagen": "Análisis de la Imagen",
    "ingles": "Inglés",
    "ciencia-tecnologia-y-sociedad": "Ciencia, Tecnología y Sociedad",
  };

  const area = exact[key];
  return area ? { area, label: line } : null;
}

function moduleHeading(value: string): { area: string; label: string } | null {
  const line = cleanLine(value);
  const match = line.match(/^(Matemáticas(?:\s+UNAL)?|Física|Biología|Química|Sociales|Imagen)\s+\d+(?:\s+y\s+\d+)?(?:\s+\[[^\]]+\])?$/i);
  if (!match) return null;

  const prefix = match[1].replace(/\s+UNAL$/i, "");
  const key = normalizeKey(prefix);
  const areaByKey: Record<string, string> = {
    "matematicas": "Matemáticas",
    "fisica": "Física",
    "biologia": "Biología",
    "quimica": "Química",
    "sociales": "Ciencias Sociales",
    "imagen": "Análisis de la Imagen",
  };
  const area = areaByKey[key];
  return area ? { area, label: line } : null;
}

function subsectionHeading(value: string, currentSection: string): { area: string; label: string } | null {
  const line = cleanLine(value);
  const match = line.match(/^1\.[1-4]\s*(Química|Biología|Física|Ciencia,\s*Tecnología\s+y\s*Sociedad)$/i);
  if (!match) return null;

  const raw = match[1].replace(/\s+/g, " ");
  const key = normalizeKey(raw);
  const areaByKey: Record<string, string> = {
    "quimica": "Química",
    "biologia": "Biología",
    "fisica": "Física",
    "ciencia-tecnologia-y-sociedad": "Ciencia, Tecnología y Sociedad",
  };
  const area = areaByKey[key];
  return area ? { area, label: currentSection + " / " + raw } : null;
}

function detectAreaHeading(value: string, currentSection: string): { area: string; label: string } | null {
  return exactAreaHeading(value)
    ?? moduleHeading(value)
    ?? subsectionHeading(value, currentSection);
}

function isControlHeading(value: string): boolean {
  return /^(?:(?:\d+(?:\.\d+)?)[.)]?\s*)?(?:temario|competencias?|estructura|n[uú]mero de preguntas|sesi[oó]n\s+\d+)$/i.test(cleanLine(value));
}

function listMarker(value: string): { level: number; text: string } | null {
  const line = value.trim();

  const numbered = line.match(/^\d+[.)]\s*(.*)$/);
  if (numbered) return { level: 0, text: numbered[1].trim() };

  const dash = line.match(/^[-–—]\s+(.+)$/);
  if (dash) return { level: 0, text: dash[1].trim() };

  const hollow = line.match(/^[o○◦]\s+(.+)$/i);
  if (hollow) return { level: 1, text: hollow[1].trim() };

  const section = line.match(/^§\s*(.+)$/);
  if (section) return { level: 2, text: section[1].trim() };

  const dot = line.match(/^[•●▪*]\s*(.+)$/);
  if (dot) return { level: 3, text: dot[1].trim() };

  return null;
}

/**
 * Extracts source-backed syllabus rows with their original hierarchy.
 * Area names are changed only by exact subject headings or recognized module
 * headings, never by ordinary prose that happens to contain a subject word.
 */
export function extractOrbyChecklistRows(
  chunks: OrbyChecklistSourceChunk[]
): ExtractedChecklistRow[] {
  const rows = new Map<string, ExtractedChecklistRow>();
  let currentArea = "Transversal";
  let currentSection = "Contenidos del documento";
  const hierarchy: string[] = [];
  let pending: { name: string; level: number; page: number } | null = null;

  const flushPending = () => {
    if (!pending) return;
    const name = cleanLine(pending.name);
    const level = pending.level;
    const page = pending.page;
    pending = null;

    if (name.length < 3 || name.length > 260 || isControlHeading(name)) return;
    if (/^(?:p[aá]gina\s+\d+|ok|estado|✓|✗)$/i.test(name)) return;
    if (/^(?:somos consultores|te damos la llave|a continuación|al finalizar|para que lleves tu control)$/i.test(name)) return;

    const parent = level === 0
      ? currentSection
      : hierarchy[level - 1] ?? currentSection;
    const key = page + "|" + normalizeKey(currentArea) + "|" + normalizeKey(parent) + "|" + normalizeKey(name);

    if (!rows.has(key)) {
      rows.set(key, {
        name: name.slice(0, 180),
        parent_concept: parent.slice(0, 180),
        area: currentArea,
        page,
      });
    }

    hierarchy.length = level;
    hierarchy[level] = name;
  };

  for (const chunk of [...chunks].sort((a, b) => a.page_number - b.page_number)) {
    const lines = chunk.content
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines) {
      const block = line.match(/^BLOQUE\s+[IVXLCDM0-9]+\s*[.:–—-]?\s*(.+)$/i);
      if (block) {
        flushPending();
        currentSection = cleanLine(block[1]) || "Contenidos del documento";
        hierarchy.length = 0;
        continue;
      }

      const heading = detectAreaHeading(line, currentSection);
      if (heading) {
        flushPending();
        currentArea = heading.area;
        currentSection = heading.label;
        hierarchy.length = 0;
        continue;
      }

      if (isControlHeading(line)) {
        flushPending();
        hierarchy.length = 0;
        continue;
      }

      const marker = listMarker(line);
      if (marker) {
        flushPending();
        if (!marker.text) {
          pending = { name: "", level: marker.level, page: chunk.page_number };
          continue;
        }
        if (isControlHeading(marker.text)) {
          hierarchy.length = 0;
          continue;
        }
        pending = { name: marker.text, level: marker.level, page: chunk.page_number };
        continue;
      }

      if (pending) {
        const startsLikeContinuation = /^[a-záéíóúñ(]/.test(line);
        const previousNeedsContinuation = /[-,:;(/[\]]$/.test(pending.name);
        if (startsLikeContinuation || previousNeedsContinuation) {
          pending.name += " " + line;
          continue;
        }
        flushPending();
      }

      // Headings and table rows without explicit list markers are intentionally
      // not converted into concepts. They can still be interpreted by Gemini.
    }
    flushPending();
  }

  return [...rows.values()];
}

/**
 * Reads explicit competency tables of the form "Competencia | Preguntas".
 * It preserves wrapped competency names and their question count as source
 * evidence instead of depending solely on free-form model extraction.
 */
export function extractOrbyCompetencyRows(
  chunks: OrbyChecklistSourceChunk[]
): ExtractedCompetencyRow[] {
  const output = new Map<string, ExtractedCompetencyRow>();
  let currentArea = "Transversal";
  let inCompetencyTable = false;
  let pendingLines: string[] = [];

  const flushCompetency = (page: number, count: number) => {
    const name = cleanLine(pendingLines.join(" "));
    pendingLines = [];
    if (name.length < 5 || /^(?:competencia|preguntas|estructura|n[uú]mero de preguntas)$/i.test(name)) return;

    const key = normalizeKey(currentArea) + "|" + normalizeKey(name);
    if (output.has(key)) return;

    output.set(key, {
      name: name.slice(0, 180),
      area: currentArea,
      page,
      evidence: name,
      question_count: count,
    });
  };

  for (const chunk of [...chunks].sort((a, b) => a.page_number - b.page_number)) {
    const lines = chunk.content
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines) {
      const heading = detectAreaHeading(line, "");
      if (heading) {
        if (inCompetencyTable) {
          pendingLines = [];
          inCompetencyTable = false;
        }
        currentArea = heading.area;
        continue;
      }

      if (/^(?:\d+[.)]\s*)?competencias?$/i.test(line)) {
        inCompetencyTable = true;
        pendingLines = [];
        continue;
      }

      if (!inCompetencyTable) continue;
      if (/^\d+[.)]\s*estructura\b/i.test(line) || /^n[uú]mero de preguntas\b/i.test(line)) {
        inCompetencyTable = false;
        pendingLines = [];
        continue;
      }
      if (/^(?:competencia\s+preguntas|competencia|preguntas)$/i.test(line)) continue;

      const standaloneCount = line.match(/^(\d{1,3})$/);
      if (standaloneCount && pendingLines.length) {
        flushCompetency(chunk.page_number, Number(standaloneCount[1]));
        continue;
      }

      const withCount = line.match(/^(.+?)\s+(\d{1,3})\s*(?:preguntas?)?$/i);
      if (withCount) {
        if (withCount[1].trim()) pendingLines.push(withCount[1].trim());
        flushCompetency(chunk.page_number, Number(withCount[2]));
        continue;
      }

      pendingLines.push(line);
    }
  }

  return [...output.values()];
}
