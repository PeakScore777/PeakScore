export type OrbyWebSource = {
  title: string;
  url: string;
  publisher: string;
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
  const query = normalizeQuery(rawQuery);
  if (query.length < 4) return { sources: [], searched: [], warnings: [] };

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
  return { sources: deduped.slice(0, maxSources), searched, warnings };
}
