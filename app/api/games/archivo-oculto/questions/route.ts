import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ARCHIVO_OCULTO_QUESTIONS,
  ARCHIVO_OCULTO_READINGS,
} from "@/lib/games/archivo-oculto-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function seedContent() {
  return {
    source: "seed" as const,
    readings: ARCHIVO_OCULTO_READINGS,
    questions: ARCHIVO_OCULTO_QUESTIONS.map((question) => ({
      id: question.id,
      readingId: question.readingId,
      competency: question.competency,
      competencyShort: question.competencyShort,
      difficulty: question.difficulty,
      prompt: question.prompt,
      options: question.options,
    })),
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: passages, error: passageError } = await supabase
    .from("game_reading_passages")
    .select("id,title,reading_type,source_label,content_blocks")
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  if (passageError || !passages?.length) return NextResponse.json(seedContent());

  const ready = await Promise.all(passages.map(async (passage) => {
    const { data, error } = await supabase
      .from("game_questions")
      .select("id,passage_id,competency,competency_short,difficulty,clue,options")
      .eq("game_key", "archivo-oculto")
      .eq("passage_id", passage.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error || !data || data.length < 5) return null;
    return { passage, questions: shuffle(data).slice(0, 5) };
  }));

  const available = shuffle(ready.filter((item): item is NonNullable<typeof item> => item !== null));
  if (available.length < 2) {
    return NextResponse.json({
      ...seedContent(),
      notice: "Se muestran los expedientes iniciales hasta que haya dos lecturas publicadas con cinco preguntas cada una.",
    });
  }

  const selected = available.slice(0, 2);
  const readings = selected.map(({ passage }) => ({
    id: passage.id,
    title: passage.title,
    typeLabel: passage.reading_type,
    authorLabel: passage.source_label,
    contentBlocks: passage.content_blocks,
  }));
  const questions = selected.flatMap(({ questions: items }) => items.map((question) => ({
    id: question.id,
    readingId: question.passage_id,
    competency: question.competency ?? "",
    competencyShort: question.competency_short ?? question.competency ?? "Lectura crítica",
    difficulty: question.difficulty,
    prompt: question.clue,
    options: question.options as string[],
  })));

  return NextResponse.json({ source: "database", readings, questions });
}
