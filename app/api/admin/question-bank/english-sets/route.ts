import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "aragonyostynsena07@gmail.com";
const MAX_QUESTIONS = 30;

type Choice = { key: string; text: string };
type ManualQuestion = {
  prompt: string;
  options: Choice[];
  answer: string;
  explanation?: string;
  imageUrl?: string;
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.normalize("NFC").trim().slice(0, max) : "";
}

function validOptions(value: unknown, part: number): value is Choice[] {
  if (!Array.isArray(value)) return false;
  const expected = part === 2 ? [7, 8] : [part === 7 ? 4 : 3];
  return (Array.isArray(expected) ? expected.includes(value.length) : value.length === expected) && value.every((item, index) =>
    item && item.key === String.fromCharCode(65 + index) &&
    typeof item.text === "string" && item.text.trim().length > 0 && item.text.length <= 5000
  );
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role, email").eq("id", user.id).maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "No fue posible verificar tus permisos." }, { status: 500 });
    }
    if (profile?.role !== "admin" || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Solo el administrador autorizado puede crear conjuntos de Inglés." }, { status: 403 });
    }

    const body = await request.json();
    const part = Number(body?.part);
    const session = Number(body?.session);
    const title = clean(body?.title, 200);
    const instructions = clean(body?.instructions, 5000);
    const sharedText = clean(body?.sharedText, 30000);
    const wordBank = Array.isArray(body?.wordBank)
      ? body.wordBank.map((word: unknown) => clean(word, 200)).filter(Boolean).slice(0, 20)
      : [];
    const questions: ManualQuestion[] = body?.questions;

    if (!Number.isInteger(part) || part < 1 || part > 7 || ![1, 2].includes(session) || !title) {
      return NextResponse.json({ error: "Parte, sesión o título inválido." }, { status: 400 });
    }
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > MAX_QUESTIONS) {
      return NextResponse.json({ error: "El conjunto debe contener entre 1 y 30 preguntas." }, { status: 400 });
    }
    if ([4, 6, 7].includes(part) && sharedText.length < 20) {
      return NextResponse.json({ error: "Esta parte necesita un texto compartido de al menos 20 caracteres." }, { status: 400 });
    }
    if (part === 2 && wordBank.length < 3) {
      return NextResponse.json({ error: "La Parte 2 necesita un banco de palabras." }, { status: 400 });
    }

    for (const [index, question] of questions.entries()) {
      const prompt = clean(question?.prompt, 10000);
      const answer = clean(question?.answer, 1).toUpperCase();
      if (!prompt || !validOptions(question?.options, part) || !question.options.some(option => option.key === answer)) {
        return NextResponse.json({ error: `Revisa la pregunta ${index + 1}: enunciado, opciones o respuesta correcta inválidos.` }, { status: 400 });
      }
      if (part === 1 && !clean(question.imageUrl, 2048)) {
        return NextResponse.json({ error: `La pregunta ${index + 1} de la Parte 1 necesita una imagen o aviso.` }, { status: 400 });
      }
    }

    const { data: set, error: setError } = await supabaseAdmin
      .from("english_question_sets")
      .insert({
        part, session, title, instructions, shared_text: sharedText || null,
        word_bank: part === 2 ? wordBank : null,
        status: "draft", created_by: user.id,
      })
      .select("id")
      .single();

    if (setError || !set) {
      console.error("[PeakScore] Error creando conjunto manual de Inglés.", { code: setError?.code });
      return NextResponse.json({ error: "No se pudo crear el conjunto. Verifica que la migración de Inglés esté aplicada en el entorno de desarrollo." }, { status: 500 });
    }

    const rows = questions.map((question, index) => ({
      subject: "Inglés",
      session,
      component: `Parte ${part}`,
      competence: "Uso y comprensión del inglés",
      difficulty: clean(body?.difficulty, 20) || "Media",
      context_text: sharedText || null,
      question: clean(question.prompt, 10000),
      option_a: question.options[0].text,
      option_b: question.options[1].text,
      option_c: question.options[2].text,
      option_d: question.options[3]?.text ?? "No aplica",
      correct_answer: question.answer.toUpperCase(),
      explanation: clean(question.explanation, 5000) || null,
      image_url: clean(question.imageUrl, 2048) || null,
      source: "Creación manual PeakScore",
      is_active: false,
      english_part: part,
      english_set_id: set.id,
      english_position: index + 1,
      english_options: question.options,
    }));

    const { error: questionsError } = await supabaseAdmin.from("questions").insert(rows);
    if (questionsError) {
      await supabaseAdmin.from("english_question_sets").delete().eq("id", set.id);
      console.error("[PeakScore] Error guardando preguntas del conjunto.", { code: questionsError.code });
      return NextResponse.json({ error: "No se guardaron las preguntas. Revisa el esquema de desarrollo y vuelve a intentarlo." }, { status: 500 });
    }

    return NextResponse.json({ success: true, setId: set.id, count: rows.length, status: "draft" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida al guardar el conjunto." }, { status: 400 });
  }
}
