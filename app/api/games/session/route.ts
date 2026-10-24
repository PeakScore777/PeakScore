import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { QUESTION_BANK } from "@/lib/games/que-es-esa-vaina-bank";
import { CASE_ZERO_QUESTIONS } from "@/lib/games/caso-cero-bank";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const data = body && typeof body === "object" ? body as { questionIds?: unknown; gameKey?: unknown } : {};
  const gameKey = data.gameKey === "caso-cero" ? "caso-cero" : data.gameKey === undefined || data.gameKey === "que-es-esa-vaina" ? "que-es-esa-vaina" : null;
  const ids = data.questionIds;
  if (!gameKey) return NextResponse.json({ error: "Juego no disponible." }, { status: 400 });
  if (!Array.isArray(ids) || ids.length !== 10 || ids.some((id) => typeof id !== "string") || new Set(ids).size !== 10) {
    return NextResponse.json({ error: "La partida debe incluir diez preguntas únicas." }, { status: 400 });
  }

  const local: Map<string, { answer: number }> = new Map();
  const localQuestions = gameKey === "caso-cero" ? CASE_ZERO_QUESTIONS : QUESTION_BANK;
  for (const question of localQuestions) local.set(question.id, { answer: question.answer });
  const uuidIds = (ids as string[]).filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  const dbQuestions = new Map<string, { answer: number }>();
  if (uuidIds.length) {
    const { data, error: dbError } = await supabaseAdmin.from("game_questions")
      .select("id,answer").in("id", uuidIds).eq("game_key", gameKey).eq("status", "published");
    if (dbError) return NextResponse.json({ error: "No se pudo validar el banco de preguntas." }, { status: 500 });
    for (const row of data ?? []) dbQuestions.set(row.id, { answer: row.answer });
  }

  const answerKey: Record<string, number> = {};
  for (const id of ids as string[]) {
    const q = dbQuestions.get(id) ?? local.get(id);
    if (!q || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      return NextResponse.json({ error: "Una pregunta ya no está disponible. Reinicia la partida." }, { status: 409 });
    }
    answerKey[id] = q.answer;
  }

  const { data: session, error: insertError } = await supabaseAdmin.from("game_round_sessions")
    .insert({ user_id: user.id, game_key: gameKey, question_ids: ids, answer_key: answerKey })
    .select("id").single();
  if (insertError || !session) {
    console.error("[game-session] No se pudo crear sesión:", insertError?.message);
    return NextResponse.json({ error: "No se pudo iniciar la partida segura." }, { status: 500 });
  }
  return NextResponse.json({ sessionId: session.id });
}
