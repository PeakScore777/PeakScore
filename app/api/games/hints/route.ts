import { NextResponse } from "next/server";
import { QUESTION_BANK } from "@/lib/games/que-es-esa-vaina-bank";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const HINT_COSTS = [5, 10, 15] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const candidate = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof candidate.sessionId !== "string" || typeof candidate.questionId !== "string" || !Number.isInteger(candidate.hintNumber) || Number(candidate.hintNumber) < 1 || Number(candidate.hintNumber) > 3) {
    return NextResponse.json({ error: "La pista no es válida." }, { status: 400 });
  }
  const hintNumber = Number(candidate.hintNumber) as 1 | 2 | 3;
  const hintCost = HINT_COSTS[hintNumber - 1];

  // Read authoritative session data before charging; never return the answer before payment succeeds.
  const { data: session, error: sessionReadError } = await supabaseAdmin
    .from("game_round_sessions")
    .select("answer_key,question_ids")
    .eq("id", candidate.sessionId)
    .eq("user_id", user.id)
    .eq("game_key", "que-es-esa-vaina")
    .maybeSingle();
  if (sessionReadError || !session || !session.question_ids?.includes(candidate.questionId)) {
    return NextResponse.json({ error: "La pregunta no pertenece a esta partida." }, { status: 403 });
  }

  const localQuestion = QUESTION_BANK.find((item) => item.id === candidate.questionId);
  let dbQuestion: { subject?: string; topic?: string; hint?: string; options?: string[] } | null = null;
  if (!localQuestion) {
    const { data: row } = await supabaseAdmin.from("game_questions")
      .select("subject,topic,hint,options")
      .eq("id", candidate.questionId)
      .eq("game_key", "que-es-esa-vaina")
      .maybeSingle();
    if (row) dbQuestion = {
      subject: typeof row.subject === "string" ? row.subject : undefined,
      topic: typeof row.topic === "string" ? row.topic : undefined,
      hint: typeof row.hint === "string" ? row.hint : undefined,
      options: Array.isArray(row.options) ? row.options.filter((option): option is string => typeof option === "string") : undefined,
    };
  }

  const topic = localQuestion?.topic ?? dbQuestion?.topic ?? "el concepto principal de la pregunta";
  const subject = localQuestion?.subject ?? dbQuestion?.subject ?? "la materia correspondiente";
  const options = localQuestion?.options ?? dbQuestion?.options ?? [];
  const answerIndex = Number(session.answer_key?.[candidate.questionId]);
  const hintText = hintNumber === 1
    ? (localQuestion?.hint ?? dbQuestion?.hint ?? `Busca la relación más importante entre los datos y lo que pregunta el enunciado.`)
    : hintNumber === 2
      ? `Categoría: ${subject}. Tema: ${topic}. Identifica qué concepto de este tema permite resolver la pregunta.`
      : Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < options.length
        ? `La respuesta correcta es: ${options[answerIndex]}`
        : `El tema que debes resolver es “${topic}”. Revisa las opciones y busca la que sea consistente con la explicación del concepto.`;

  const { data, error } = await supabaseAdmin.rpc("use_que_es_esa_vaina_hint", {
    p_user_id: user.id,
    p_session_id: candidate.sessionId,
    p_question_id: candidate.questionId,
    p_hint_number: hintNumber,
  });
  if (error) {
    const message = error.message.includes("COINS_INSUFFICIENT") ? `Necesitas ${hintCost} Peak Coins para revelar esta pista.`
      : error.message.includes("SESSION_INVALID_OR_EXPIRED") ? "La partida expiró. Inicia otra."
      : error.message.includes("QUESTION_ALREADY_ANSWERED") ? "Esta pregunta ya fue respondida; continúa con la siguiente."
      : error.message.includes("HINT_ALREADY_USED_THIS_SESSION") ? "Ya utilizaste esta pista en esta partida. Las otras pistas siguen disponibles."
      : error.message.includes("QUESTION_INVALID") ? "La pregunta no pertenece a esta partida."
      : error.message.includes("UNAUTHORIZED") ? "Inicia sesión para comprar una pista."
      : "No se pudo comprar la pista. Inténtalo de nuevo.";
    const status = error.message.includes("COINS_INSUFFICIENT") || error.message.includes("QUESTION_ALREADY_ANSWERED") || error.message.includes("HINT_ALREADY_USED_THIS_SESSION") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
  const reward = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return NextResponse.json({
    alreadyUsed: Boolean(reward.alreadyUsed),
    hintNumber: Number(reward.hintNumber) || hintNumber,
    hintText,
    coinsSpent: Number(reward.coinsSpent) || 0,
    coinsTotal: Number(reward.coinsTotal) || 0,
    hintCost: Number(reward.hintCost) || hintCost,
  });
}
