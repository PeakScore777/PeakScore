import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CUENCA_CHAPTER_KEY = "cuenca-de-los-ecos-chapter-01";
const VALID_PERFECT_ANSWERS = [
  ["C", "B", "B"],
  ["C", "B", "C"],
] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Inicia sesión para guardar tu progreso y reclamar la EXP." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const candidate = body as Record<string, unknown>;
  if (candidate.courseKey !== CUENCA_CHAPTER_KEY) {
    return NextResponse.json({ error: "Curso no disponible." }, { status: 400 });
  }

  const answers = candidate.answers;
  if (
    !Array.isArray(answers) ||
    answers.length !== 3 ||
    !answers.every((answer) => typeof answer === "string" && /^[A-D]$/.test(answer))
  ) {
    return NextResponse.json(
      { error: "No se pudo validar el desafío completo." },
      { status: 400 },
    );
  }

  const isPerfect = VALID_PERFECT_ANSWERS.some(
    (expected) => expected.length === answers.length &&
      expected.every((answer, index) => answer === answers[index]),
  );
  if (!isPerfect) {
    return NextResponse.json(
      { error: "Necesitas acertar todas las preguntas para obtener la EXP." },
      { status: 422 },
    );
  }

  const { data, error } = await supabase.rpc(
    "claim_cuenca_chapter_one_reward",
    { p_answers: answers },
  );

  if (error) {
    console.error("[cuenca-learning-reward] No se pudo reclamar la EXP:", error.message);
    return NextResponse.json(
      { error: "No se pudo confirmar la recompensa. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
