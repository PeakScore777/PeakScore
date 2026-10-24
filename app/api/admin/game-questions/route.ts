import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAI, getSafeAIErrorMessage } from "@/lib/ai/router";

export const runtime = "nodejs";
const ADMIN_EMAIL = "aragonyostynsena07@gmail.com";
const SUBJECTS = ["Matemáticas", "Química", "Física", "Biología", "Historia", "Inglés"] as const;
const DIFFICULTIES = ["facil", "media", "dificil"] as const;

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  if (user.email?.toLowerCase() !== ADMIN_EMAIL) return { supabase, response: NextResponse.json({ error: "No tienes permiso para administrar el banco de juegos." }, { status: 403 }) };
  return { supabase, response: null };
}

function validateQuestion(value: unknown) {
  if (!value || typeof value !== "object") return "Datos inválidos.";
  const q = value as Record<string, unknown>;
  if (typeof q.subject !== "string" || !(SUBJECTS as readonly string[]).includes(q.subject)) return "Selecciona una materia válida.";
  if (typeof q.topic !== "string" || q.topic.trim().length < 2 || q.topic.length > 140) return "El tema debe tener entre 2 y 140 caracteres.";
  if (typeof q.difficulty !== "string" || !(DIFFICULTIES as readonly string[]).includes(q.difficulty)) return "Selecciona una dificultad válida.";
  if (typeof q.clue !== "string" || q.clue.trim().length < 10 || q.clue.length > 1200) return "La pregunta debe tener entre 10 y 1200 caracteres.";
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => typeof o !== "string" || !o.trim() || o.length > 400)) return "Escribe exactamente cuatro opciones válidas.";
  if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) > 3) return "Indica una única respuesta correcta.";
  if (typeof q.explanation !== "string" || q.explanation.trim().length < 5 || q.explanation.length > 1800) return "Añade una explicación de entre 5 y 1800 caracteres.";
  if (typeof q.hint !== "string" || q.hint.trim().length < 3 || q.hint.length > 500) return "Añade una pista de entre 3 y 500 caracteres.";
  if (q.status !== undefined && !["draft", "published", "archived"].includes(String(q.status))) return "Estado inválido.";
  return null;
}

export async function GET() {
  const { supabase, response } = await getAdminClient();
  if (response) return response;
  const { data, error } = await supabase.from("game_questions").select("*").eq("game_key", "que-es-esa-vaina").order("created_at", { ascending: false }).limit(300);
  if (error) return NextResponse.json({ error: "No se pudo cargar el banco. Comprueba que aplicaste la migración de Supabase." }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, response } = await getAdminClient();
  if (response) return response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (body && typeof body === "object" && (body as Record<string, unknown>).aiGenerate === true) {
    const requestData = body as { gameName?: unknown; amount?: unknown; subject?: unknown; difficulty?: unknown; focus?: unknown };
    const gameName = typeof requestData.gameName === "string" ? requestData.gameName.trim() : "";
    const amount = Number(requestData.amount);
    const subject = typeof requestData.subject === "string" && (SUBJECTS as readonly string[]).includes(requestData.subject) ? requestData.subject : "";
    const difficulty = typeof requestData.difficulty === "string" && ["facil", "media", "dificil", "mixta"].includes(requestData.difficulty) ? requestData.difficulty : "mixta";
    const focus = typeof requestData.focus === "string" ? requestData.focus.trim().slice(0, 500) : "";
    if (gameName !== "¿Qué es esa vaina?") return NextResponse.json({ error: "Selecciona un juego válido." }, { status: 400 });
    if (!subject || !Number.isInteger(amount) || amount < 1 || amount > 20) return NextResponse.json({ error: "Selecciona una materia y una cantidad entre 1 y 20." }, { status: 400 });
    const prompt = `Genera exactamente ${amount} preguntas originales en español para el juego educativo "${gameName}" de PeakScore. Materia: ${subject}. Dificultad: ${difficulty}. Enfoque opcional: ${focus || "variar temas apropiados de la materia"}. Devuelve SOLO JSON válido con esta forma: {"questions":[{"subject":"${subject}","topic":"tema breve","difficulty":"facil|media|dificil","clue":"enunciado o pista clara","options":["A","B","C","D"],"answer":0,"explanation":"explicación correcta paso a paso","hint":"orientación breve"}]}. answer es índice 0 a 3. Cuatro opciones plausibles, una sola correcta. No repitas enunciados ni opciones idénticas. No uses preguntas copiadas de pruebas oficiales; crea contenido original. Sin markdown.`;
    try {
      const generated = await generateAI({ prompt, task: "question_generation", useFallback: true });
      const raw = typeof generated === "string" ? generated : (generated as { text?: string }).text?.trim() ?? "";
      if (!raw) return NextResponse.json({ error: "La IA no devolvió contenido. Intenta de nuevo." }, { status: 422 });
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(cleaned) as { questions?: unknown };
      if (!Array.isArray(parsed.questions) || parsed.questions.length !== amount) return NextResponse.json({ error: "La IA no devolvió la cantidad exacta. Intenta de nuevo con menos preguntas." }, { status: 422 });
      const rows = parsed.questions.map((value) => {
        if (!value || typeof value !== "object") throw new Error("Pregunta inválida");
        const q = value as Record<string, unknown>;
        const item = { subject, topic: q.topic, difficulty: q.difficulty ?? (difficulty === "mixta" ? "media" : difficulty), clue: q.clue, options: q.options, answer: q.answer, explanation: q.explanation, hint: q.hint, status: "draft" };
        const issue = validateQuestion(item);
        if (issue) throw new Error(issue);
        return { game_key: "que-es-esa-vaina", subject: item.subject, topic: (item.topic as string).trim(), difficulty: item.difficulty, clue: (item.clue as string).trim(), options: item.options, answer: item.answer, explanation: (item.explanation as string).trim(), hint: (item.hint as string).trim(), status: "draft", created_by: user?.id };
      });
      const { data: inserted, error: insertError } = await supabase.from("game_questions").insert(rows).select("id");
      if (insertError) return NextResponse.json({ error: "La IA generó preguntas, pero no se pudieron guardar. Verifica la migración de Supabase." }, { status: 500 });
      return NextResponse.json({ generated: inserted?.length ?? 0, status: "draft", message: "Preguntas generadas y guardadas como borradores para revisión." }, { status: 201 });
    } catch (error) {
      console.error("[game-question-ai] Error controlado", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ error: getSafeAIErrorMessage(error) }, { status: 503 });
    }
  }
  if (body && typeof body === "object" && (body as Record<string, unknown>).bulkImport === true) {
    const payload = body as { questions?: unknown };
    if (!Array.isArray(payload.questions) || payload.questions.length === 0 || payload.questions.length > 150) {
      return NextResponse.json({ error: "La importación debe contener entre 1 y 150 preguntas." }, { status: 400 });
    }
    const prepared = payload.questions.map((value) => {
      if (!value || typeof value !== "object") return value;
      const q = value as Record<string, unknown>;
      return { ...q, difficulty: q.difficulty ?? "media", status: "draft" };
    });
    for (const q of prepared) {
      const validation = validateQuestion(q);
      if (validation) return NextResponse.json({ error: `Importación cancelada: ${validation}` }, { status: 400 });
    }
    const { data: existing, error: existingError } = await supabase.from("game_questions").select("subject,clue").eq("game_key", "que-es-esa-vaina").limit(1000);
    if (existingError) return NextResponse.json({ error: "No se pudo revisar si ya existen preguntas. Comprueba la migración de Supabase." }, { status: 500 });
    const seen = new Set((existing ?? []).map((q) => `${q.subject}::${String(q.clue).trim().toLocaleLowerCase()}`));
    const unique = prepared.filter((value) => {
      const q = value as Record<string, unknown>;
      const key = `${q.subject}::${String(q.clue).trim().toLocaleLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length === 0) return NextResponse.json({ imported: 0, skipped: prepared.length, message: "Todas las preguntas ya estaban registradas." });
    const { data: { user } } = await supabase.auth.getUser();
    const rows = unique.map((value) => {
      const q = value as Record<string, unknown>;
      return { game_key: "que-es-esa-vaina", subject: q.subject, topic: (q.topic as string).trim(), difficulty: q.difficulty, clue: (q.clue as string).trim(), options: q.options, answer: q.answer, explanation: (q.explanation as string).trim(), hint: (q.hint as string).trim(), status: "draft", created_by: user?.id };
    });
    const { data: inserted, error: insertError } = await supabase.from("game_questions").insert(rows).select("id");
    if (insertError) return NextResponse.json({ error: "No se pudo completar la importación. No se confirmó ningún lote; revisa la migración y vuelve a intentarlo." }, { status: 500 });
    return NextResponse.json({ imported: inserted?.length ?? 0, skipped: prepared.length - unique.length, message: "Las preguntas se importaron como borradores para revisión." }, { status: 201 });
  }
  const validation = validateQuestion(body);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });
  const q = body as Record<string, unknown>;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("game_questions").insert({
    game_key: "que-es-esa-vaina", subject: q.subject, topic: (q.topic as string).trim(),
    difficulty: q.difficulty, clue: (q.clue as string).trim(), options: q.options,
    answer: q.answer, explanation: (q.explanation as string).trim(), hint: (q.hint as string).trim(),
    status: q.status === "published" ? "published" : "draft", created_by: user?.id,
  }).select("*").single();
  if (error) return NextResponse.json({ error: "No se pudo guardar la pregunta. Comprueba la migración y las políticas de Supabase." }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, response } = await getAdminClient();
  if (response) return response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const candidate = body as Record<string, unknown>;
  if (typeof candidate.id !== "string" || !candidate.id) return NextResponse.json({ error: "Falta el identificador." }, { status: 400 });
  const validation = validateQuestion(candidate);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });
  const { id, ...q } = candidate;
  const { data, error } = await supabase.from("game_questions").update({
    subject: q.subject, topic: (q.topic as string).trim(), difficulty: q.difficulty,
    clue: (q.clue as string).trim(), options: q.options, answer: q.answer,
    explanation: (q.explanation as string).trim(), hint: (q.hint as string).trim(),
    status: q.status ?? "draft", updated_at: new Date().toISOString(),
  }).eq("id", id).eq("game_key", "que-es-esa-vaina").select("*").single();
  if (error) return NextResponse.json({ error: "No se pudo actualizar la pregunta." }, { status: 500 });
  return NextResponse.json({ question: data });
}
