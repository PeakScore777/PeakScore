import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ArchivoOcultoShelfStory = {
  id: string;
  title: string;
  caseCode: string | null;
  questionIds: string[];
};

const CATALOG_CACHE_TAG = "archivo-oculto-shelf-catalog";

/**
 * Reads only published shelf metadata. The result is shared across students;
 * per-student completion state is always loaded separately by the API route.
 */
async function queryPublishedShelfCatalog(): Promise<ArchivoOcultoShelfStory[]> {
  const { data: passages, error: passageError } = await supabaseAdmin
    .from("game_reading_passages")
    .select("id,title,case_code")
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  if (passageError) throw passageError;
  if (!passages?.length) return [];

  const passageIds = passages.map((passage) => passage.id);
  const { data: questions, error: questionError } = await supabaseAdmin
    .from("game_questions")
    .select("id,passage_id,display_order,created_at")
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .in("passage_id", passageIds)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(600);

  if (questionError) throw questionError;

  const questionsByPassage = new Map<string, string[]>();
  for (const question of questions ?? []) {
    if (!question.passage_id) continue;
    const bucket = questionsByPassage.get(question.passage_id) ?? [];
    bucket.push(question.id);
    questionsByPassage.set(question.passage_id, bucket);
  }

  return passages.flatMap((passage) => {
    const questionIds = (questionsByPassage.get(passage.id) ?? []).slice(0, 5);
    if (questionIds.length !== 5) return [];
    return [{
      id: passage.id,
      title: passage.title,
      caseCode: passage.case_code,
      questionIds,
    }];
  });
}

const getCachedShelfCatalog = unstable_cache(
  queryPublishedShelfCatalog,
  ["archivo-oculto-shelf-catalog-v2"],
  {
    revalidate: 300,
    tags: [CATALOG_CACHE_TAG],
  },
);

export async function getArchivoOcultoShelfCatalog(): Promise<ArchivoOcultoShelfStory[]> {
  let cachedCatalog: ArchivoOcultoShelfStory[] | null = null;

  try {
    cachedCatalog = await getCachedShelfCatalog();
  } catch (cacheError) {
    // A cache read/refresh failure must not hide books that are available in
    // Postgres. Fall through to one direct read before failing the request.
    console.warn("[archivo-oculto] Cached shelf lookup failed; retrying Postgres:", cacheError);
  }

  if (cachedCatalog?.length) return cachedCatalog;

  // Empty catalog results can be cached for five minutes. This is especially
  // harmful just after publishing a book: readers would see "0 libros" even
  // though Postgres already has complete, published books. Verify empty cache
  // results against Postgres directly and expire the stale empty entry.
  const freshCatalog = await queryPublishedShelfCatalog();
  if (freshCatalog.length) {
    try {
      revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
    } catch (error) {
      // The live data is already available to this request; cache invalidation
      // failure must not turn a valid catalog into a failed page load.
      console.warn("[archivo-oculto] Could not expire empty shelf cache:", error);
    }
  }

  return freshCatalog;
}
