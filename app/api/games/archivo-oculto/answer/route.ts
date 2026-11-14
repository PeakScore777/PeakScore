import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ARCHIVO_OCULTO_QUESTIONS } from "@/lib/games/archivo-oculto-bank";

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
  const { sessionId, questionId, selectedOption } = candidate;
  if (typeof sessionId !== "string" || typeof questionId !== "string"
    || !Number.isInteger(selectedOption) || (selectedOption as number) < 0 || (selectedOption as number) > 3) {
    return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabaseAdmin.from("game_round_sessions")
    .select("id,user_id,game_key,question_ids,answer_key,expires_at,completed_at")
    .eq("id", sessionId).eq("user_id", user.id).eq("game_key", "archivo-oculto").maybeSingle();
  if (sessionError || !session || new Date(session.expires_at).getTime() < Date.now() || session.completed_at) {
    return NextResponse.json({ error: "La sesión expiró o ya fue cerrada. Abre un expediente nuevo." }, { status: 409 });
  }
  if (!session.question_ids.includes(questionId) || !Object.prototype.hasOwnProperty.call(session.answer_key, questionId)) {
    return NextResponse.json({ error: "La pregunta no pertenece a este libro." }, { status: 403 });
  }

  let explanation = "";
  if (questionId.startsWith("ao-")) {
    const question = ARCHIVO_OCULTO_QUESTIONS.find((item) => item.id === questionId);
    if (!question) return NextResponse.json({ error: "La pregunta no existe." }, { status: 404 });
    explanation = question.explanation;
  } else {
    const { data: question, error } = await supabaseAdmin.from("game_questions")
      .select("explanation,status,game_key")
      .eq("id", questionId).eq("game_key", "archivo-oculto").maybeSingle();
    if (error || !question || question.status !== "published") {
      return NextResponse.json({ error: "La pregunta dejó de estar disponible." }, { status: 409 });
    }
    explanation = question.explanation;
  }

  const correctOption = Number(session.answer_key[questionId]);
  const { data: previous } = await supabaseAdmin.from("game_round_answers")
    .select("is_correct,selected_option")
    .eq("session_id", sessionId).eq("question_id", questionId).maybeSingle();

  if (previous) {
    return NextResponse.json({
      isCorrect: previous.is_correct,
      correctOption,
      correctCount: await readCorrectCount(sessionId),
      alreadyAnswered: true,
      explanation,
    });
  }

  const isCorrect = correctOption === selectedOption;
  const { error: saveError } = await supabaseAdmin.from("game_round_answers").insert({
    session_id: sessionId,
    user_id: user.id,
    question_id: questionId,
    selected_option: selectedOption,
    is_correct: isCorrect,
  });

  if (saveError) {
    const { data: retry } = await supabaseAdmin.from("game_round_answers")
      .select("is_correct").eq("session_id", sessionId).eq("question_id", questionId).maybeSingle();
    if (!retry) {
      console.error("[archivo-oculto-answer] No se pudo guardar la respuesta:", saveError.message);
      return NextResponse.json({ error: "No se pudo guardar tu respuesta." }, { status: 500 });
    }
    return NextResponse.json({
      isCorrect: retry.is_correct,
      correctOption,
      correctCount: await readCorrectCount(sessionId),
      alreadyAnswered: true,
      explanation,
    });
  }

  return NextResponse.json({
    isCorrect,
    correctOption,
    correctCount: await readCorrectCount(sessionId),
    alreadyAnswered: false,
    explanation,
  });
}

async function readCorrectCount(sessionId: string) {
  const { count, error } = await supabaseAdmin.from("game_round_answers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId).eq("is_correct", true);
  if (error) throw new Error("No se pudo calcular el resultado de lectura.");
  return count ?? 0;
}
