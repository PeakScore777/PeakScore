export type OrbyWebSource = {
  title: string;
  url: string;
  publisher: string;
  citationNumber?: number;
  publishedAt: string | null;
  excerpt: string;
  kind: "encyclopedia" | "research";
};

export type OrbyWebResearchResult = {
  sources: OrbyWebSource[];
  searched: string[];
  warnings: string[];
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

function cleanText(value: unknown, max = 1200): string {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

function normalizeQuery(value: string): string {
  return value.normalize("NFKC").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

function normalizeForMatching(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO");
}

const SEARCH_STOP_WORDS = new Set([
  "que", "como", "cual", "cuales", "cuando", "donde", "porque", "para", "por", "con", "sin",
  "una", "uno", "unos", "unas", "del", "las", "los", "el", "la", "y", "o", "en", "de", "al",
  "es", "son", "fue", "ser", "sea", "se", "un", "su", "sus", "mi", "mis", "me", "te", "lo",
  "explica", "explicame", "ensena", "ensename", "ayudame", "quiero", "saber", "entender",
  "dame", "fuente", "fuentes", "referencia", "referencias", "bibliografia", "cita", "citas",
  "articulo", "articulos", "paper", "papers", "publicacion", "publicaciones", "estudio", "estudios",
  "investigacion", "investigaciones", "evidencia", "cientifico", "cientifica", "cientificos", "cientificas",
  "reciente", "recientes", "actual", "actuales", "actualizado", "actualizada", "vigente", "verifica",
  "verificar", "comprueba", "contrasta", "confirmar", "busca", "buscar", "investiga", "investigar",
  "indaga", "indagar", "sobre", "acerca", "segun", "dato", "datos", "informe", "informes",
  "esto", "esta", "este", "estos", "estas", "eso", "esa", "ese", "esas", "esos", "aqui", "ahi", "aquello",
  "contacto", "telefono", "estudiante", "profesor", "profesora", "companero", "companera", "nombre", "apellido", "llamo",
  "the", "what", "when", "where", "which", "how", "why", "is", "are", "of", "to", "in", "on",
  "and", "or", "for", "with", "about", "explain", "tell", "me", "please",
]);

function meaningfulTerms(value: string): string[] {
  // Public search receives topical keywords only, not full chat text, emails,
  // URLs, phone numbers or long numeric identifiers from student messages.
  const scrubbed = value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b(?:\+?\d[\d().\s-]{7,}\d)\b/g, " ");
  return [...new Set(
    normalizeForMatching(scrubbed)
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .filter((term) => term.length >= 3
        && !SEARCH_STOP_WORDS.has(term)
        && !/^\d+$/.test(term)),
  )];
}

/**
 * The tutor model already has general academic knowledge. Public research is
 * reserved for requests that genuinely need external evidence, current facts,
 * or explicit references; normal concept teaching should not pay the latency
 * and reliability cost of a web lookup.
 */
export function shouldSearchOrbyPublicSources(input: string | {
  message?: string;
  question?: string;
  topic?: string;
}): boolean {
  const text = typeof input === "string"
    ? input
    : [input.message, input.question, input.topic].filter(Boolean).join(" ");
  const normalized = normalizeForMatching(text).replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  const asksForSources = /\b(?:fuentes?|referencias?|bibliografia|citas?|citar|articulos? cientificos?|papers?|publicaciones cientificas?|estudios publicados|investigaciones? (?:cientificas?|recientes?)|evidencia (?:cientifica|publicada|externa)|busca (?:en )?(?:internet|la web)|busca informacion|busqueda (?:web|en internet)|investiga(?:r)?|indaga(?:r)?|haz (?:una )?investigacion|consulta (?:en )?(?:internet|la web)|segun estudios|revision sistematica|meta.?analisis)\b/.test(normalized);
  const asksForCurrentFacts = /\b(?:actual(?:mente|izado|izada|izados|izadas)?|vigente|hoy|ahora|a dia de hoy|reciente(?:s)?|ultimo(?:s)?|ultima(?:s)?|este ano|del ano|en 202[5-9]|en 203[0-5]|novedades?|cambios? recientes?|reforma actual|version actual|dato actualizado|estadisticas actuales|cifras actuales|datos recientes|hallazgo reciente|descubrimiento reciente|estudio mas reciente)\b/.test(normalized);
  const needsExternalVerification = /\b(?:verifica|comprueba|contrasta|confirma|es cierto que|que dice la investigacion|que dice la ciencia|consenso cientifico|segun la evidencia|dato oficial|cifra oficial|informe oficial|normativa actual|regulacion vigente)\b/.test(normalized);

  return asksForSources || asksForCurrentFacts || needsExternalVerification;
}

function rankRelevantSources(query: string, sources: OrbyWebSource[]): OrbyWebSource[] {
  const terms = meaningfulTerms(query);
  if (!terms.length) return [];
  const minimumMatches = terms.length <= 2 ? 1 : 2;
  return sources
    .map((source) => {
      const title = new Set(meaningfulTerms(source.title));
      const excerpt = new Set(meaningfulTerms(source.excerpt));
      const titleMatches = terms.filter((term) => title.has(term)).length;
      const excerptMatches = terms.filter((term) => excerpt.has(term)).length;
      const matches = new Set([
        ...terms.filter((term) => title.has(term)),
        ...terms.filter((term) => excerpt.has(term)),
      ]).size;
      return { source, matches, score: titleMatches * 3 + excerptMatches };
    })
    .filter((item) => item.matches >= minimumMatches)
    .sort((a, b) => b.score - a.score || b.matches - a.matches)
    .map((item) => item.source);
}

/** Keep only references that the generated answer explicitly cites. */
export function reconcileOrbyPublicCitations(
  reply: string,
  sources: OrbyWebSource[],
): { reply: string; sources: Array<OrbyWebSource & { citationNumber: number }> } {
  const mentioned = new Set<number>();
  for (const match of reply.matchAll(/\[(\d{1,2})\]/g)) {
    const index = Number(match[1]);
    if (Number.isInteger(index) && index >= 1 && index <= sources.length) mentioned.add(index);
  }
  const safeReply = reply.replace(/\[(\d{1,2})\]/g, (marker, rawIndex: string) => {
    const index = Number(rawIndex);
    const source = sources[index - 1];
    if (!mentioned.has(index) || !source) return "";
    // Persist the citation as a Markdown link in the assistant message itself.
    // The chat can then restore a working source link after a history reload.
    return `[${index}](${source.url})`;
  });
  return {
    reply: safeReply.replace(/[ \t]{2,}/g, " ").replace(/ +([,.;:!?])/g, "$1").trim(),
    sources: [...mentioned].sort((a, b) => a - b).map((index) => ({
      ...sources[index - 1],
      citationNumber: index,
    })),
  };
}

function reconstructAbstract(index: unknown): string {
  if (!index || typeof index !== "object" || Array.isArray(index)) return "";
  const entries = Object.entries(index as Record<string, unknown>)
    .flatMap(([word, positions]) => Array.isArray(positions)
      ? positions.filter((position): position is number => Number.isInteger(position) && position >= 0)
        .map((position) => ({ word, position }))
      : [])
    .sort((a, b) => a.position - b.position)
    .slice(0, 220);
  return entries.map((entry) => entry.word).join(" ").slice(0, 1400);
}

async function safeJson(fetcher: FetchLike, url: string): Promise<unknown> {
  const response = await fetcher(url, {
    method: "GET",
    headers: { Accept: "application/json", "User-Agent": "PeakScore-Orby/1.0 (educational research)" },
    signal: AbortSignal.timeout(5500),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("PUBLIC_RESEARCH_SOURCE_UNAVAILABLE");
  return response.json();
}

/**
 * Free, keyless academic context discovery. This is deliberately not a general
 * web crawler: requests are restricted to Wikimedia and OpenAlex APIs, URLs
 * are reconstructed from trusted identifiers, and provider content is treated
 * as untrusted evidence rather than instructions.
 */
export async function searchOrbyPublicSources(
  rawQuery: string,
  options: { fetcher?: FetchLike; maxSources?: number } = {},
): Promise<OrbyWebResearchResult> {
  const normalizedInput = normalizeQuery(rawQuery);
  const query = meaningfulTerms(normalizedInput).slice(0, 12).join(" ");
  if (query.length < 4 || !query.trim()) return { sources: [], searched: [], warnings: [] };

  const fetcher = options.fetcher ?? fetch;
  const maxSources = Math.max(1, Math.min(5, Math.floor(options.maxSources ?? 4)));
  const encoded = encodeURIComponent(query);
  const searched = ["Wikimedia", "OpenAlex"];
  const warnings: string[] = [];

  const [wikiResult, openAlexResult] = await Promise.allSettled([
    safeJson(fetcher, `https://es.wikipedia.org/w/rest.php/v1/search/page?q=${encoded}&limit=3`),
    safeJson(fetcher, `https://api.openalex.org/works?search=${encoded}&per-page=4&select=id,doi,title,publication_year,authorships,primary_location,abstract_inverted_index,type,cited_by_count`),
  ]);

  const sources: OrbyWebSource[] = [];

  if (wikiResult.status === "fulfilled") {
    const payload = wikiResult.value as { pages?: Array<{ key?: string; title?: string; description?: string; excerpt?: string }> };
    for (const page of Array.isArray(payload?.pages) ? payload.pages : []) {
      const key = typeof page.key === "string" ? page.key : "";
      const title = cleanText(page.title, 180);
      const excerpt = cleanText(page.description || page.excerpt, 900);
      if (!title || !key || !/^[\p{L}\p{N}_%()-]+$/u.test(key)) continue;
      sources.push({
        title,
        url: `https://es.wikipedia.org/wiki/${encodeURIComponent(key).replace(/%2F/gi, "/")}`,
        publisher: "Wikipedia en español",
        publishedAt: null,
        excerpt,
        kind: "encyclopedia",
      });
    }
  } else {
    warnings.push("WIKIMEDIA_UNAVAILABLE");
  }

  if (openAlexResult.status === "fulfilled") {
    const payload = openAlexResult.value as { results?: Array<Record<string, unknown>> };
    for (const work of Array.isArray(payload?.results) ? payload.results : []) {
      const title = cleanText(work.title, 220);
      const id = typeof work.id === "string" ? work.id : "";
      if (!title || !/^https:\/\/openalex\.org\/W\d+$/i.test(id)) continue;
      const doi = typeof work.doi === "string" && /^https:\/\/doi\.org\//i.test(work.doi)
        ? work.doi
        : "";
      const abstract = reconstructAbstract(work.abstract_inverted_index);
      // Metadata-only records are not evidence. Keep only papers with a usable abstract.
      if (abstract.length < 50) continue;
      const location = work.primary_location && typeof work.primary_location === "object"
        ? work.primary_location as Record<string, unknown>
        : {};
      const source = location.source && typeof location.source === "object"
        ? location.source as Record<string, unknown>
        : {};
      const publisher = cleanText(source.display_name, 140) || "OpenAlex (índice académico)";
      sources.push({
        title,
        url: doi || id,
        publisher,
        publishedAt: Number.isInteger(work.publication_year) ? String(work.publication_year) : null,
        excerpt: abstract,
        kind: "research",
      });
    }
  } else {
    warnings.push("OPENALEX_UNAVAILABLE");
  }

  const deduped = [...new Map(sources.map((source) => [source.url, source])).values()];
  return { sources: rankRelevantSources(query, deduped).slice(0, maxSources), searched, warnings };
}
