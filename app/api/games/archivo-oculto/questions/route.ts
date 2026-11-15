import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addEvidenceToReading, type ArchivoEvidenceRecord } from "@/lib/games/archivo-oculto-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: passages, error: passageError } = await supabase
    .from("game_reading_passages")
    .select("id,title,reading_type,source_label,content_blocks")
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  if (passageError) {
    console.error("[archivo-oculto] Could not load published readings:", passageError.message);
    return NextResponse.json({ error: "No se pudieron cargar las lecturas publicadas." }, { status: 500 });
  }
  if (!passages?.length) {
    return NextResponse.json({ error: "Todavía no hay lecturas publicadas para este expediente." }, { status: 409 });
  }

  const passageIds = passages.map((passage) => passage.id);
  const { data: publishedQuestions, error: questionError } = await supabase
    .from("game_questions")
    .select("id,passage_id,competency,competency_short,difficulty,clue,options,display_order,created_at")
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .in("passage_id", passageIds)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (questionError) {
    console.error("[archivo-oculto] Could not load published questions:", questionError.message);
    return NextResponse.json({ error: "No se pudieron cargar las preguntas publicadas." }, { status: 500 });
  }

  const questionsByPassage = new Map<string, typeof publishedQuestions>();
  for (const question of publishedQuestions ?? []) {
    if (!question.passage_id) continue;
    const bucket = questionsByPassage.get(question.passage_id) ?? [];
    bucket.push(question);
    questionsByPassage.set(question.passage_id, bucket);
  }

  const stories = passages.flatMap((passage) => {
    const pool = questionsByPassage.get(passage.id) ?? [];
    if (pool.length < 5) return [];
    const storyQuestions = pool.slice(0, 5);
    const evidence = evidenceByPassage.get(passage.id) ?? [];
    return [{
      id: passage.id,
      title: passage.title,
      typeLabel: passage.reading_type,
      authorLabel: passage.source_label,
      contentBlocks: addEvidenceToReading(passage.content_blocks, evidence),
      questions: storyQuestions.map((question) => ({
        id: question.id,
        readingId: question.passage_id,
        competency: question.competency ?? "",
        competencyShort: question.competency_short ?? question.competency ?? "Lectura crítica",
        difficulty: question.difficulty,
        prompt: question.clue,
        options: question.options as string[],
      })),
    }];
  });

  if (!stories.length) {
    return NextResponse.json({
      error: "No hay historias publicadas con cinco preguntas listas. Publica una historia completa para desbloquear su libro.",
    }, { status: 409 });
  }

  return NextResponse.json({ source: "database", stories });
}
