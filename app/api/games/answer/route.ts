import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CASE_ZERO_QUESTIONS } from "@/lib/games/caso-cero-bank";

export const runtime = "nodejs";

async function readCorrectCount(sessionId: string): Promise<number> {
  const { count } = await supabaseAdmin.from("game_round_answers").select("id", { count: "exact", head: true })
    .eq("session_id", sessionId).eq("is_correct", true);
  return count ?? 0;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const sessionId = data.sessionId;
  const questionId = data.questionId;
  const selectedOption = data.selectedOption;
  const timedOut = selectedOption === null;

  if (typeof sessionId !== "string" || typeof questionId !== "string" ||
    (!timedOut && (!Number.isInteger(selectedOption) || (selectedOption as number) < 0 || (selectedOption as number) > 3))) {
    return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabaseAdmin.from("game_round_sessions")
    .select("id,user_id,game_key,question_ids,answer_key,expires_at").eq("id", sessionId).eq("user_id", user.id).single();
  if (sessionError || !session || new Date(session.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "La sesión expiró. Inicia otra partida." }, { status: 409 });
  }
  if (!session.question_ids.includes(questionId) || !Object.prototype.hasOwnProperty.call(session.answer_key, questionId)) {
    return NextResponse.json({ error: "La pregunta no pertenece a esta partida." }, { status: 403 });
  }

  const caseExplanation = session.game_key === "caso-cero" ? CASE_ZERO_QUESTIONS.find((item) => item.id === questionId)?.explanation : undefined;

  const { data: previous } = await supabaseAdmin.from("game_round_answers")
    .select("is_correct,selected_option").eq("session_id", sessionId).eq("question_id", questionId).maybeSingle();
  if (previous) {
    return NextResponse.json({ isCorrect: previous.is_correct, correctCount: await readCorrectCount(sessionId),
      correctOption: Number(session.answer_key[questionId]), alreadyAnswered: true, alreadyCorrect: previous.is_correct, ...(caseExplanation ? { explanation: caseExplanation } : {}) });
  }

  const correctOption = session.answer_key[questionId];
  const safeSelectedOption = timedOut ? (Number(correctOption) + 1) % 4 : selectedOption as number;
  const isCorrect = !timedOut && correctOption === safeSelectedOption;
  const { error: saveError } = await supabaseAdmin.from("game_round_answers").insert({
    session_id: sessionId, user_id: user.id, question_id: questionId,
    selected_option: safeSelectedOption, is_correct: isCorrect,
  });
  if (saveError) {
    const { data: retryCheck } = await supabaseAdmin.from("game_round_answers").select("is_correct")
      .eq("session_id", sessionId).eq("question_id", questionId).maybeSingle();
    if (retryCheck) {
      return NextResponse.json({ isCorrect: retryCheck.is_correct, correctCount: await readCorrectCount(sessionId),
        correctOption: Number(session.answer_key[questionId]), alreadyAnswered: true, alreadyCorrect: retryCheck.is_correct, ...(caseExplanation ? { explanation: caseExplanation } : {}) });
    }
    console.error("[game-answer] Error guardando intento:", saveError.message);
    return NextResponse.json({ error: "No se pudo guardar la respuesta." }, { status: 500 });
  }
  return NextResponse.json({ isCorrect, correctCount: await readCorrectCount(sessionId), correctOption: Number(correctOption), alreadyAnswered: false, timedOut, ...(caseExplanation ? { explanation: caseExplanation } : {}) });
}
