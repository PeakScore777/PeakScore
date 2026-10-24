import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slug = "cristales-misteriosos";
const ANSWERS = ["A", "B", "C", "D"] as const;
const DIFFICULTIES = ["Fácil", "Media", "Difícil"] as const;

type Answer = (typeof ANSWERS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];
type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json | undefined };

type LessonQuestionRow = {
  lesson_slug: string;
  position: number;
  difficulty: Difficulty;
  competency: string;
  context_text: string;
  context_blocks: Json[];
  prompt: string;
  options: { label: Answer; text: string }[];
  correct_answer: Answer;
  explanation: string;
  is_published: boolean;
  updated_by: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.some((item) => item === value);
}

function isAnswer(value: unknown): value is Answer {
  return typeof value === "string" && ANSWERS.some((item) => item === value);
}

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, admin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const admin =
    profile?.role === "admin" ||
    user.email?.trim().toLowerCase() === "aragonyostynsena07@gmail.com";

  return { supabase, user, admin };
}

export async function GET() {
  const { supabase, user, admin } = await auth();

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }

  let query = supabase
    .from("lesson_questions")
    .select(
      "id,lesson_slug,position,difficulty,competency,context_text,context_blocks,prompt,options,correct_answer,explanation,is_published,updated_at",
    )
    .eq("lesson_slug", slug)
    .order("position");

  if (!admin) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    const missingMigration = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missingMigration
          ? "Falta aplicar la migración lesson_questions en Supabase."
          : "No se pudieron cargar las preguntas.",
        isAdmin: admin,
        questions: [],
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ questions: data ?? [], isAdmin: admin });
}

export async function PUT(request: Request) {
  const { supabase, user, admin } = await auth();

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }

  if (!admin) {
    return NextResponse.json(
      { error: "Solo un administrador puede editar estas preguntas." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);

  if (
    !isRecord(body) ||
    !Array.isArray(body.questions) ||
    body.questions.length !== 3
  ) {
    return NextResponse.json(
      { error: "La misión debe tener exactamente tres preguntas." },
      { status: 400 },
    );
  }

  const rows: LessonQuestionRow[] = [];

  for (let index = 0; index < 3; index += 1) {
    const question = body.questions[index];

    if (!isRecord(question)) {
      return NextResponse.json(
        { error: "Una de las preguntas tiene un formato inválido." },
        { status: 400 },
      );
    }

    const prompt =
      typeof question.prompt === "string" ? question.prompt.trim() : "";
    const explanation =
      typeof question.explanation === "string"
        ? question.explanation.trim()
        : "";
    const difficulty = question.difficulty;
    const correctAnswer = question.correct_answer;
    const rawOptions = Array.isArray(question.options)
      ? question.options.slice(0, 4)
      : [];

    const optionsAreValid =
      rawOptions.length === 4 &&
      rawOptions.every(
        (option) =>
          isRecord(option) &&
          typeof option.text === "string" &&
          option.text.trim().length > 0,
      );

    if (
      !isDifficulty(difficulty) ||
      !isAnswer(correctAnswer) ||
      !prompt ||
      !explanation ||
      !optionsAreValid
    ) {
      return NextResponse.json(
        {
          error:
            "Completa dificultad, enunciado, cuatro opciones, respuesta y explicación.",
        },
        { status: 400 },
      );
    }

    const rawBlocks = Array.isArray(question.context_blocks)
      ? question.context_blocks.slice(0, 12)
      : [];
    const contextBlocks: Json[] = [];

    for (const block of rawBlocks) {
      if (!isRecord(block) || (block.type !== "paragraph" && block.type !== "table")) {
        return NextResponse.json(
          { error: "Bloque de contexto no permitido." },
          { status: 400 },
        );
      }

      if (block.type === "paragraph") {
        if (typeof block.text !== "string") {
          return NextResponse.json(
            { error: "El párrafo del contexto tiene un formato inválido." },
            { status: 400 },
          );
        }

        contextBlocks.push({
          type: "paragraph",
          text: block.text.slice(0, 12000),
        });
        continue;
      }

      const headers = block.headers;
      const rawRows = block.rows;
      const validHeaders =
        Array.isArray(headers) &&
        headers.length >= 1 &&
        headers.length <= 8 &&
        headers.every((header) => typeof header === "string");
      const validRows =
        Array.isArray(rawRows) &&
        rawRows.length <= 20 &&
        rawRows.every(
          (row) =>
            Array.isArray(row) &&
            Array.isArray(headers) &&
            row.length === headers.length &&
            row.every((cell) => typeof cell === "string"),
        );

      if (!validHeaders || !validRows) {
        return NextResponse.json(
          { error: "Revisa la estructura de la tabla." },
          { status: 400 },
        );
      }

      const normalizedHeaders = (headers as string[]).map((header) =>
        header.slice(0, 200),
      );
      const normalizedRows = (rawRows as unknown[]).map((row) =>
        (row as string[]).map((cell) => cell.slice(0, 1000)),
      );

      contextBlocks.push({
        type: "table",
        title: typeof block.title === "string" ? block.title.slice(0, 200) : "",
        headers: normalizedHeaders,
        rows: normalizedRows,
      });
    }

    const normalizedOptions = rawOptions.map((option, optionIndex) => {
      const optionRecord = option as Record<string, unknown>;
      return {
        label: ANSWERS[optionIndex],
        text: (optionRecord.text as string).trim().slice(0, 2000),
      };
    });

    rows.push({
      lesson_slug: slug,
      position: index + 1,
      difficulty,
      competency:
        typeof question.competency === "string"
          ? question.competency.slice(0, 200)
          : "",
      context_text:
        typeof question.context_text === "string"
          ? question.context_text.slice(0, 12000)
          : "",
      context_blocks: contextBlocks,
      prompt: prompt.slice(0, 5000),
      options: normalizedOptions,
      correct_answer: correctAnswer,
      explanation: explanation.slice(0, 12000),
      is_published: question.is_published === true,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase
    .from("lesson_questions")
    .upsert(rows, { onConflict: "lesson_slug,position" });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron guardar. Comprueba que la migración esté aplicada." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, saved: 3 });
}
