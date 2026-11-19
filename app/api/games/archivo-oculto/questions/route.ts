import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  // Shelf payload is intentionally small: titles, ordered question IDs and
  // this student's completion flags. Reading blocks, photos, options and
  // suspect dossiers are loaded only after a specific book is opened.
  const { data: passages, error: passageError } = await supabase
    .from("game_reading_passages")
    .select("id,title")
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
  const [questionsResult, progressResult] = await Promise.all([
    supabase
      .from("game_questions")
      .select("id,passage_id,display_order,created_at")
      .eq("game_key", "archivo-oculto")
      .eq("status", "published")
      .in("passage_id", passageIds)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(600),
    supabase
      .from("game_reading_passage_progress")
      .select("passage_id")
      .eq("user_id", user.id)
      .in("passage_id", passageIds),
  ]);

  const { data: publishedQuestions, error: questionError } = questionsResult;
  const { data: completedPassages, error: progressError } = progressResult;
  if (questionError) {
    console.error("[archivo-oculto] Could not load published questions:", questionError.message);
    return NextResponse.json({ error: "No se pudieron cargar las preguntas publicadas." }, { status: 500 });
  }
  if (progressError) {
    console.warn("[archivo-oculto] Could not load completed book progress:", progressError.message);
  }

  const questionsByPassage = new Map<string, string[]>();
  for (const question of publishedQuestions ?? []) {
    if (!question.passage_id) continue;
    const bucket = questionsByPassage.get(question.passage_id) ?? [];
    bucket.push(question.id);
    questionsByPassage.set(question.passage_id, bucket);
  }
  const completedPassageIds = new Set((completedPassages ?? []).map((row) => row.passage_id));

  const stories = passages.flatMap((passage) => {
    const questionIds = (questionsByPassage.get(passage.id) ?? []).slice(0, 5);
    if (questionIds.length !== 5) return [];
    return [{
      id: passage.id,
      title: passage.title,
      completed: completedPassageIds.has(passage.id),
      questionIds,
    }];
  });

  if (!stories.length) {
    return NextResponse.json({
      error: "No hay historias publicadas con cinco preguntas listas. Publica una historia completa para desbloquear su libro.",
    }, { status: 409 });
  }

  return NextResponse.json({ source: "database", stories });
}
