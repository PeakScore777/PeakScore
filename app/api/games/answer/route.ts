import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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
  if (typeof sessionId !== "string" || typeof questionId !== "string" || !Number.isInteger(selectedOption) || (selectedOption as number) < 0 || (selectedOption as number) > 3) {
    return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabaseAdmin.from("game_round_sessions")
    .select("id,user_id,question_ids,answer_key,expires_at").eq("id", sessionId).eq("user_id", user.id).single();
  if (sessionError || !session || new Date(session.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "La sesión expiró. Inicia otra partida." }, { status: 409 });
  }
  if (!session.question_ids.includes(questionId) || !Object.prototype.hasOwnProperty.call(session.answer_key, questionId)) {
    return NextResponse.json({ error: "La pregunta no pertenece a esta partida." }, { status: 403 });
  }

  const { data: previous } = await supabaseAdmin.from("game_round_answers").select("is_correct")
    .eq("session_id", sessionId).eq("question_id", questionId).maybeSingle();
  if (previous?.is_correct) {
    const { count } = await supabaseAdmin.from("game_round_answers").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("is_correct", true);
    return NextResponse.json({ isCorrect: true, correctCount: count ?? 0, alreadyCorrect: true });
  }

  const isCorrect = session.answer_key[questionId] === selectedOption;
  if (isCorrect) {
    const { error: saveError } = await supabaseAdmin.from("game_round_answers").insert({
      session_id: sessionId, user_id: user.id, question_id: questionId, selected_option: selectedOption, is_correct: true,
    });
    if (saveError) {
      const { data: retryCheck } = await supabaseAdmin.from("game_round_answers").select("is_correct").eq("session_id", sessionId).eq("question_id", questionId).maybeSingle();
      if (!retryCheck?.is_correct) return NextResponse.json({ error: "No se pudo guardar la respuesta." }, { status: 500 });
    }
  }
  const { count } = await supabaseAdmin.from("game_round_answers").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("is_correct", true);
  return NextResponse.json({ isCorrect, correctCount: count ?? 0 });
}
