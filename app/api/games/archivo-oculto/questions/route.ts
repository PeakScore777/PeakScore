import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addEvidenceToReading, type ArchivoEvidenceRecord } from "@/lib/games/archivo-oculto-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("game_evidence_assets")
    .select("title,description,tag,image_url,passage_id,display_after_paragraph,layout")
    .in("passage_id", passageIds)
    .order("display_after_paragraph", { ascending: true })
    .order("created_at", { ascending: true });

  if (evidenceError) {
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

  const { data: suspectRows, error: suspectError } = await supabase
    .from("game_reading_suspects")
    .select("id,passage_id,name,role,description,motive,alibi,image_url,display_order")
    .in("passage_id", passageIds)
    .order("display_order", { ascending: true });

  if (suspectError) console.warn("[archivo-oculto] Suspect portraits could not be loaded:", suspectError.message);
  const suspectsByPassage = new Map<string, NonNullable<typeof suspectRows>>();
  for (const suspect of suspectRows ?? []) {
    const bucket = suspectsByPassage.get(suspect.passage_id) ?? [];
    bucket.push(suspect);
    suspectsByPassage.set(suspect.passage_id, bucket);
  }

  // Progress is stored once per user and passage. This is a fixed-size
  // library lookup, independent of how many practice sessions the student has.
  const { data: completedPassages, error: progressError } = await supabase
    .from("game_reading_passage_progress")
    .select("passage_id")
    .eq("user_id", user.id)
    .in("passage_id", passageIds);

  if (progressError) {
    console.warn("[archivo-oculto] Could not load completed book progress:", progressError.message);
  }
  const completedPassageIds = new Set((completedPassages ?? []).map((row) => row.passage_id));

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
      suspects: (suspectsByPassage.get(passage.id) ?? []).map((suspect) => ({
        id: suspect.id, name: suspect.name, role: suspect.role,
        description: suspect.description, motive: suspect.motive,
        alibi: suspect.alibi, imageUrl: suspect.image_url,
      })),
      completed: completedPassageIds.has(passage.id),
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
