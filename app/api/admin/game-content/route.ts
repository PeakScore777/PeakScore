import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAME_KEYS = [
  "archivo-oculto",
  "que-es-esa-vaina",
  "caso-cero",
  "operacion-rescate",
  "mapa-de-decisiones",
  "mision-global",
] as const;
const SUBJECTS = [
  "Lectura Crítica",
  "Mixto",
  "Ciencias Naturales",
  "Matemáticas",
  "Sociales y Ciudadanas",
  "Inglés",
  "Química",
  "Física",
  "Biología",
  "Historia",
] as const;
const DIFFICULTIES = ["facil", "media", "dificil"] as const;

async function adminClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return { supabase, user: null, response: NextResponse.json({ error: "No tienes permisos de administración." }, { status: 403 }) };
  }
  return { supabase, user, response: null };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestionImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || !process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  try {
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const candidate = new URL(value);
    const prefix = "/storage/v1/object/public/question-images/archivo-oculto/";
    return candidate.origin === base.origin && candidate.pathname.startsWith(prefix);
  } catch {
    return false;
  }
}

function validBlocks(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) return false;
  let totalTextCharacters = 0;
  let imageCount = 0;
  for (const block of value) {
    if (!record(block)) return false;
    if (block.type === "paragraph") {
      if (typeof block.text !== "string" || !block.text.trim() || block.text.length > 5000) return false;
      totalTextCharacters += block.text.length;
      continue;
    }
    if (block.type === "image") {
      imageCount += 1;
      if (!isQuestionImageUrl(block.url)
        || typeof block.alt !== "string" || !block.alt.trim() || block.alt.length > 300
        || (block.caption !== undefined && (typeof block.caption !== "string" || block.caption.length > 300))
        || (block.layout !== undefined && block.layout !== "float" && block.layout !== "wide")) return false;
      continue;
    }
    return false;
  }
  return totalTextCharacters >= 80 && totalTextCharacters <= 3600 && imageCount <= 3;
}

export async function GET(request: Request) {
  const { supabase, response } = await adminClient();
  if (response) return response;
  const url = new URL(request.url);
  const gameKey = url.searchParams.get("gameKey") ?? "archivo-oculto";
  if (!(GAME_KEYS as readonly string[]).includes(gameKey)) {
    return NextResponse.json({ error: "Juego no válido." }, { status: 400 });
  }

  if (gameKey === "archivo-oculto") {
    const { data: passages, error: passageError } = await supabase
      .from("game_reading_passages")
      .select("*")
      .eq("game_key", gameKey)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (passageError) return NextResponse.json({ error: "No se pudieron cargar las lecturas." }, { status: 500 });

    const ids = (passages ?? []).map((passage) => passage.id);
    let questions: unknown[] = [];
    if (ids.length) {
      const { data, error } = await supabase.from("game_questions")
        .select("*").eq("game_key", gameKey).in("passage_id", ids)
        .order("created_at", { ascending: false }).limit(1000);
      if (error) return NextResponse.json({ error: "No se pudieron cargar las preguntas." }, { status: 500 });
      questions = data ?? [];
    }
    return NextResponse.json({ passages: passages ?? [], questions, gameKey });
  }

  const { data, error } = await supabase.from("game_questions")
    .select("*").eq("game_key", gameKey)
    .order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "No se pudo cargar el banco de preguntas." }, { status: 500 });
  return NextResponse.json({ passages: [], questions: data ?? [], gameKey });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await adminClient();
  if (response || !user) return response;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!record(body) || typeof body.action !== "string") {
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  }

  if (body.action === "passage") {
    const passage = body.passage;
    if (!record(passage) || typeof passage.title !== "string" || passage.title.trim().length < 3 || passage.title.length > 180
      || typeof passage.readingType !== "string" || passage.readingType.trim().length < 2 || passage.readingType.length > 120
      || !validBlocks(passage.contentBlocks)) {
      return NextResponse.json({ error: "Completa el título, el tipo de texto y añade entre 80 y 3600 caracteres de texto con imágenes válidas." }, { status: 400 });
    }
    const row = {
      game_key: "archivo-oculto",
      title: passage.title.trim(),
      reading_type: passage.readingType.trim(),
      source_label: typeof passage.sourceLabel === "string" ? passage.sourceLabel.trim().slice(0, 180) : "Texto original de práctica · PeakScore",
      content_blocks: passage.contentBlocks,
      status: "draft",
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("game_reading_passages").insert(row).select("*").single();
    if (error || !data) {
      console.error("[admin-game-content] Passage save failed:", error?.message);
      return NextResponse.json({ error: "No se pudo guardar la lectura." }, { status: 500 });
    }
    return NextResponse.json({ passage: data }, { status: 201 });
  }

  if (body.action === "question") {
    const question = body.question;
    if (!record(question)) return NextResponse.json({ error: "Pregunta inválida." }, { status: 400 });
    const gameKey = question.gameKey;
    const subject = question.subject;
    const topic = question.topic;
    const difficulty = question.difficulty;
    const clue = question.prompt;
    const options = question.options;
    const answer = question.answer;
    const explanation = question.explanation;
    const hint = question.hint ?? "Relee el fragmento y busca la evidencia.";
    const passageId = typeof question.passageId === "string" && question.passageId ? question.passageId : null;

    if (typeof gameKey !== "string" || !(GAME_KEYS as readonly string[]).includes(gameKey)
      || typeof subject !== "string" || !(SUBJECTS as readonly string[]).includes(subject)
      || typeof topic !== "string" || topic.trim().length < 2 || topic.length > 140
      || typeof difficulty !== "string" || !(DIFFICULTIES as readonly string[]).includes(difficulty)
      || typeof clue !== "string" || clue.trim().length < 10 || clue.length > 1200
      || !Array.isArray(options) || options.length !== 4 || options.some((item) => typeof item !== "string" || !item.trim() || item.length > 280)
      || !Number.isInteger(answer) || (answer as number) < 0 || (answer as number) > 3
      || typeof explanation !== "string" || explanation.trim().length < 5 || explanation.length > 900
      || typeof hint !== "string" || hint.trim().length < 3 || hint.length > 500) {
      return NextResponse.json({ error: "Revisa materia, tema, dificultad, enunciado, cuatro opciones, respuesta y explicación." }, { status: 400 });
    }
    if (new Set(options.map((item) => String(item).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim())).size !== 4) {
      return NextResponse.json({ error: "Las cuatro opciones deben ser diferentes." }, { status: 400 });
    }
    if (gameKey === "archivo-oculto" && !passageId) {
      return NextResponse.json({ error: "Asocia esta pregunta a una lectura." }, { status: 400 });
    }
    if (gameKey !== "archivo-oculto" && passageId) {
      return NextResponse.json({ error: "Este juego no utiliza lecturas asociadas." }, { status: 400 });
    }
    if (passageId) {
      const { data: passage } = await supabase.from("game_reading_passages")
        .select("id,status").eq("id", passageId).eq("game_key", "archivo-oculto").maybeSingle();
      if (!passage) return NextResponse.json({ error: "La lectura seleccionada no existe." }, { status: 404 });
      if (passage.status === "archived") return NextResponse.json({ error: "No puedes añadir preguntas a una lectura archivada." }, { status: 409 });
    }

    const row = {
      game_key: gameKey,
      subject,
      topic: topic.trim(),
      difficulty,
      clue: clue.trim(),
      options,
      answer,
      explanation: explanation.trim(),
      hint: hint.trim(),
      status: "draft",
      created_by: user.id,
      passage_id: passageId,
      competency: typeof question.competency === "string" ? question.competency.trim().slice(0, 180) : null,
      competency_short: typeof question.competencyShort === "string" ? question.competencyShort.trim().slice(0, 80) : null,
      image_url: typeof question.imageUrl === "string" && isQuestionImageUrl(question.imageUrl) ? question.imageUrl : null,
    };
    const { data, error } = await supabase.from("game_questions").insert(row).select("*").single();
    if (error || !data) {
      console.error("[admin-game-content] Question save failed:", error?.message);
      return NextResponse.json({ error: "No se pudo guardar la pregunta." }, { status: 500 });
    }
    return NextResponse.json({ question: data }, { status: 201 });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const { supabase, response } = await adminClient();
  if (response) return response;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!record(body) || typeof body.action !== "string") {
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  }

  if (body.action === "publish-passage" && typeof body.passageId === "string") {
    const { data: passage } = await supabase.from("game_reading_passages")
      .select("id,status").eq("id", body.passageId).eq("game_key", "archivo-oculto").maybeSingle();
    if (!passage) return NextResponse.json({ error: "La lectura no existe." }, { status: 404 });
    const { count, error: countError } = await supabase.from("game_questions")
      .select("id", { count: "exact", head: true })
      .eq("game_key", "archivo-oculto").eq("passage_id", passage.id).in("status", ["draft", "published"]);
    if (countError || (count ?? 0) < 5) {
      return NextResponse.json({ error: "Cada lectura necesita al menos cinco preguntas antes de publicarse." }, { status: 409 });
    }
    const { error: questionsError } = await supabase.from("game_questions")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("game_key", "archivo-oculto").eq("passage_id", passage.id).eq("status", "draft");
    if (questionsError) return NextResponse.json({ error: "No se pudieron publicar las preguntas." }, { status: 500 });
    const { data, error } = await supabase.from("game_reading_passages")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", passage.id).select("*").single();
    if (error || !data) return NextResponse.json({ error: "No se pudo publicar la lectura." }, { status: 500 });
    return NextResponse.json({ passage: data, publishedQuestions: count });
  }

  if (body.action === "passage-status" && typeof body.passageId === "string"
    && ["draft", "archived"].includes(String(body.status))) {
    const { data, error } = await supabase.from("game_reading_passages")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.passageId).select("*").single();
    if (error || !data) return NextResponse.json({ error: "No se pudo cambiar el estado de la lectura." }, { status: 500 });
    return NextResponse.json({ passage: data });
  }

  if (body.action === "question-status" && typeof body.questionId === "string"
    && ["draft", "published", "archived"].includes(String(body.status))) {
    const { data: question, error: readError } = await supabase.from("game_questions")
      .select("id,game_key,passage_id").eq("id", body.questionId).maybeSingle();
    if (readError || !question) return NextResponse.json({ error: "La pregunta no existe." }, { status: 404 });
    if (question.game_key === "archivo-oculto" && body.status === "published") {
      const { data: passage } = await supabase.from("game_reading_passages")
        .select("status").eq("id", question.passage_id).maybeSingle();
      if (passage?.status !== "published") {
        return NextResponse.json({ error: "Publica primero la lectura asociada y sus cinco preguntas." }, { status: 409 });
      }
    }
    const { data, error } = await supabase.from("game_questions")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", question.id).select("*").single();
    if (error || !data) return NextResponse.json({ error: "No se pudo cambiar el estado de la pregunta." }, { status: 500 });
    return NextResponse.json({ question: data });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
