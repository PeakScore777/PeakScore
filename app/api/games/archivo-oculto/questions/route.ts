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
    .select("id,passage_id,competency,competency_short,difficulty,clue,options")
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .in("passage_id", passageIds)
    .order("created_at", { ascending: false });

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

  const available = shuffle(passages.flatMap((passage) => {
    const pool = questionsByPassage.get(passage.id) ?? [];
    if (pool.length < 5) return [];
    return [{ passage, questions: shuffle(pool).slice(0, 5) }];
  }));
  if (!available.length) {
    return NextResponse.json({
      error: "No hay lecturas publicadas con cinco preguntas listas. Revisa el contenido desde administración.",
    }, { status: 409 });
  }

  // A single published passage is a complete five-question reading.
  // When two or more are ready, combine the first two into a ten-question book.
  const selected = available.slice(0, 2);
  const selectedPassageIds = selected.map(({ passage }) => passage.id);
  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("game_evidence_assets")
    .select("title,description,tag,image_url,passage_id,display_after_paragraph,layout")
    .in("passage_id", selectedPassageIds)
    .order("display_after_paragraph", { ascending: true })
    .order("created_at", { ascending: true });

  if (evidenceError) {
    // Keep the reading and question flow available while an optional evidence migration is pending.
    console.warn("[archivo-oculto] Evidence photos could not be loaded:", evidenceError.message);
  }

  const evidenceByPassage = new Map<string, ArchivoEvidenceRecord[]>();
  for (const row of evidenceRows ?? []) {
    if (!row.passage_id) continue;
    const bucket = evidenceByPassage.get(row.passage_id) ?? [];
    bucket.push({
      title: row.title,
      description: row.description,
      tag: row.tag,
      image_url: row.image_url,
      display_after_paragraph: row.display_after_paragraph,
      layout: row.layout === "wide" ? "wide" : "float",
    });
    evidenceByPassage.set(row.passage_id, bucket);
  }

  const readings = selected.map(({ passage }) => ({
    id: passage.id,
    title: passage.title,
    typeLabel: passage.reading_type,
    authorLabel: passage.source_label,
    contentBlocks: addEvidenceToReading(
      passage.content_blocks,
      evidenceByPassage.get(passage.id) ?? [],
    ),
  }));
  const questions = selected.flatMap(({ questions: items }) => items.map((question) => ({
    id: question.id,
    readingId: question.passage_id,
    competency: question.competency ?? "",
    competencyShort: question.competency_short ?? question.competency ?? "Lectura crítica",
    difficulty: question.difficulty,
    prompt: question.clue,
    options: question.options as string[],
  })));

  return NextResponse.json({ source: "database", readings, questions });
}
