import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ARCHIVO_OCULTO_QUESTIONS, ARCHIVO_OCULTO_READINGS } from "@/lib/games/archivo-oculto-bank";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const questions = ARCHIVO_OCULTO_QUESTIONS.map((question) => ({
    id: question.id,
    readingId: question.readingId,
    competency: question.competency,
    competencyShort: question.competencyShort,
    difficulty: question.difficulty,
    prompt: question.prompt,
    options: question.options,
  }));
  return NextResponse.json({ readings: ARCHIVO_OCULTO_READINGS, questions });
}
