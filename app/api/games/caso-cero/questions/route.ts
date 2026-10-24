import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CASE_ZERO_QUESTIONS } from "@/lib/games/caso-cero-bank";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  // Nunca enviar las claves de respuesta ni las explicaciones antes de contestar.
  const questions = CASE_ZERO_QUESTIONS.map((item) => ({
    id: item.id,
    subject: item.subject,
    topic: item.topic,
    competence: item.competence,
    difficulty: item.difficulty,
    title: item.title,
    context: item.context,
    evidenceLabel: item.evidenceLabel,
    evidenceRows: item.evidenceRows,
    evidenceUnit: item.evidenceUnit,
    question: item.question,
    options: item.options,
    hint: item.hint,
  }));

  return NextResponse.json({ questions });
}
