import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ARCHIVO_OCULTO_QUESTIONS } from "@/lib/games/archivo-oculto-bank";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const questionIds = ARCHIVO_OCULTO_QUESTIONS.map((question) => question.id);
  const answerKey = Object.fromEntries(ARCHIVO_OCULTO_QUESTIONS.map((question) => [question.id, question.answer]));
  const { data, error: insertError } = await supabaseAdmin.from("game_round_sessions")
    .insert({ user_id: user.id, game_key: "archivo-oculto", question_ids: questionIds, answer_key: answerKey })
    .select("id").single();

  if (insertError || !data) {
    console.error("[archivo-oculto-session] No se pudo crear la sesión:", insertError?.message);
    return NextResponse.json({ error: "No se pudo abrir el libro. Comprueba que la migración del juego esté aplicada." }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}
