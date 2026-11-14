import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ARCHIVO_OCULTO_QUESTIONS,
  ARCHIVO_OCULTO_READINGS,
} from "@/lib/games/archivo-oculto-bank";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const candidate = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const source = candidate.source;
  const rawIds = candidate.questionIds;

  if (!Array.isArray(rawIds) || rawIds.length !== 10
    || rawIds.some((id) => typeof id !== "string")
    || new Set(rawIds).size !== 10) {
    return NextResponse.json({ error: "El expediente debe contener diez preguntas diferentes." }, { status: 400 });
  }

  const questionIds = rawIds as string[];
  let answerKey: Record<string, number>;
  let readings: unknown[];
  let questions: unknown[];

  if (source === "database") {
    const { data: rows, error } = await supabaseAdmin.from("game_questions")
      .select("id,passage_id,answer,competency,competency_short,difficulty,clue,options")
      .eq("game_key", "archivo-oculto")
      .eq("status", "published")
      .in("id", questionIds);

    if (error || !rows || rows.length !== 10) {
      return NextResponse.json({ error: "Una o más preguntas ya no están publicadas. Actualiza el libro." }, { status: 409 });
    }

    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!row.passage_id) return NextResponse.json({ error: "Una pregunta no tiene lectura asociada." }, { status: 409 });
      counts.set(row.passage_id, (counts.get(row.passage_id) ?? 0) + 1);
    }
    if (counts.size !== 2 || [...counts.values()].some((count) => count !== 5)) {
      return NextResponse.json({ error: "El expediente debe combinar dos lecturas con cinco preguntas cada una." }, { status: 409 });
    }

    const passageIds = [...counts.keys()];
    const { data: passageRows, error: passageError } = await supabaseAdmin
      .from("game_reading_passages")
      .select("id,title,reading_type,source_label,content_blocks")
      .eq("game_key", "archivo-oculto")
      .eq("status", "published")
      .in("id", passageIds);

    if (passageError || !passageRows || passageRows.length !== 2) {
      return NextResponse.json({ error: "Una de las lecturas ya no está disponible." }, { status: 409 });
    }

    const byId = new Map(rows.map((row) => [row.id, row]));
    const orderedRows = questionIds.map((id) => byId.get(id)).filter((row): row is NonNullable<typeof row> => Boolean(row));
    if (orderedRows.length !== 10) {
      return NextResponse.json({ error: "No se pudo reconstruir el expediente." }, { status: 409 });
    }

    answerKey = Object.fromEntries(orderedRows.map((row) => [row.id, row.answer]));
    readings = passageRows.map((passage) => ({
      id: passage.id,
      title: passage.title,
      typeLabel: passage.reading_type,
      authorLabel: passage.source_label,
      contentBlocks: passage.content_blocks,
    }));
    questions = orderedRows.map((question) => ({
      id: question.id,
      readingId: question.passage_id,
      competency: question.competency ?? "",
      competencyShort: question.competency_short ?? question.competency ?? "Lectura crítica",
      difficulty: question.difficulty,
      prompt: question.clue,
      options: question.options,
    }));
  } else if (source === "seed") {
    const allowed = new Set(ARCHIVO_OCULTO_QUESTIONS.map((question) => question.id));
    if (questionIds.some((id) => !allowed.has(id))) {
      return NextResponse.json({ error: "El expediente inicial no coincide con el banco disponible." }, { status: 409 });
    }
    const byId = new Map(ARCHIVO_OCULTO_QUESTIONS.map((question) => [question.id, question]));
    const ordered = questionIds.map((id) => byId.get(id)).filter((question): question is NonNullable<typeof question> => Boolean(question));
    if (ordered.length !== 10) {
      return NextResponse.json({ error: "No se pudo reconstruir el expediente inicial." }, { status: 409 });
    }
    answerKey = Object.fromEntries(ordered.map((question) => [question.id, question.answer]));
    readings = ARCHIVO_OCULTO_READINGS;
    questions = ordered.map((question) => ({
      id: question.id,
      readingId: question.readingId,
      competency: question.competency,
      competencyShort: question.competencyShort,
      difficulty: question.difficulty,
      prompt: question.prompt,
      options: question.options,
    }));
  } else {
    return NextResponse.json({ error: "Origen de contenido inválido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("game_round_sessions")
    .insert({
      user_id: user.id,
      game_key: "archivo-oculto",
      question_ids: questionIds,
      answer_key: answerKey,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[archivo-oculto-session] No se pudo crear la sesión:", error?.message);
    return NextResponse.json({ error: "No se pudo abrir el libro. Inténtalo de nuevo." }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id, readings, questions, source });
}
