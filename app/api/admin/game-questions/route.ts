import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
