import "server-only";

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ArchivoOcultoShelfStory = {
  id: string;
  title: string;
  caseCode: string | null;
  questionIds: string[];
};

/**
 * Published shelf metadata is identical for every student.
 * Cache only this public catalog; per-user completion state is queried
 * separately after the authenticated user has been resolved.
 */
const getCachedShelfCatalog = unstable_cache(
  async (): Promise<ArchivoOcultoShelfStory[]> => {
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
  },
  ["archivo-oculto-shelf-catalog-v1"],
  {
    revalidate: 300,
    tags: ["archivo-oculto-shelf-catalog"],
  },
);

export function getArchivoOcultoShelfCatalog() {
  return getCachedShelfCatalog();
}
