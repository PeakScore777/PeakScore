import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const HINT_COST = 5;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const candidate = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof candidate.sessionId !== "string" || typeof candidate.questionId !== "string") {
    return NextResponse.json({ error: "La pista no es válida." }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("use_que_es_esa_vaina_hint", {
    p_session_id: candidate.sessionId, p_question_id: candidate.questionId,
  });
  if (error) {
    const message = error.message.includes("COINS_INSUFFICIENT") ? `Necesitas ${HINT_COST} Peak Coins para revelar esta pista.`
      : error.message.includes("SESSION_INVALID_OR_EXPIRED") ? "La partida expiró. Inicia otra."
      : error.message.includes("QUESTION_ALREADY_ANSWERED") ? "Esta pregunta ya fue respondida; continúa con la siguiente."
      : error.message.includes("QUESTION_INVALID") ? "La pregunta no pertenece a esta partida."
      : error.message.includes("UNAUTHORIZED") ? "Inicia sesión para comprar una pista."
      : "No se pudo comprar la pista. Inténtalo de nuevo.";
    const status = error.message.includes("COINS_INSUFFICIENT") || error.message.includes("QUESTION_ALREADY_ANSWERED") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
  const reward = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return NextResponse.json({ alreadyUsed: Boolean(reward.alreadyUsed), coinsSpent: Number(reward.coinsSpent) || 0,
    coinsTotal: Number(reward.coinsTotal) || 0, hintCost: HINT_COST });
}
