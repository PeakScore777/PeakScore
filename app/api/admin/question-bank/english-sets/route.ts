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
  const expected = [part === 7 ? 4 : part === 2 ? 0 : 3];
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
    if ([4, 5, 6, 7].includes(part) && sharedText.length < 20) {
      return NextResponse.json({ error: "Esta parte necesita un texto compartido de al menos 20 caracteres." }, { status: 400 });
    }
    if (part === 2 && (wordBank.length < 7 || wordBank.length > 8)) {
      return NextResponse.json({ error: "La Parte 2 necesita siete palabras A–G y, opcionalmente, una octava palabra H de ejemplo." }, { status: 400 });
    }

    for (const [index, question] of questions.entries()) {
      const prompt = clean(question?.prompt, 10000);
      const answer = clean(question?.answer, 1).toUpperCase();
      if (!prompt || !validOptions(question?.options, part) || (part === 2 ? !wordBank.slice(0, 7).some((_, i) => String.fromCharCode(65 + i) === answer) : !question.options.some(option => option.key === answer))) {
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
      option_a: question.options[0]?.text ?? "—",
      option_b: question.options[1]?.text ?? "—",
      option_c: question.options[2]?.text ?? "—",
      option_d: question.options[3]?.text ?? "—",
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


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) return NextResponse.json({ error: "No fue posible verificar tus permisos." }, { status: 500 });
    if (profile?.role !== "admin" || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionValue = searchParams.get("session");
    const partValue = searchParams.get("part");
    let query = supabaseAdmin.from("english_question_sets")
      .select("id, part, title, session, status, created_at, updated_at, word_bank, shared_text, instructions")
      .order("created_at", { ascending: false });
    if (sessionValue && ["1", "2"].includes(sessionValue)) query = query.eq("session", Number(sessionValue));
    if (partValue && /^[1-7]$/.test(partValue)) query = query.eq("part", Number(partValue));

    const { data: sets, error: setsError } = await query;
    if (setsError) {
      console.error("[PeakScore] Error consultando conjuntos de Inglés.", { code: setsError.code });
      return NextResponse.json({ error: "No fue posible cargar los conjuntos. Verifica la migración del entorno de desarrollo." }, { status: 500 });
    }
    const ids = (sets ?? []).map(set => set.id);
    const { data: rows, error: rowsError } = ids.length
      ? await supabaseAdmin.from("questions").select("id, english_set_id, english_position").in("english_set_id", ids).order("english_position", { ascending: true })
      : { data: [], error: null };
    if (rowsError) return NextResponse.json({ error: "No fue posible contar las preguntas de los conjuntos." }, { status: 500 });

    const counts = new Map<string, number>();
    for (const row of rows ?? []) counts.set(row.english_set_id, (counts.get(row.english_set_id) ?? 0) + 1);
    return NextResponse.json({
      success: true,
      sets: (sets ?? []).map(set => ({ ...set, question_count: counts.get(set.id) ?? 0 })),
      totals: {
        sets: (sets ?? []).length,
        questions: (rows ?? []).length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
    }
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) return NextResponse.json({ error: "No fue posible verificar tus permisos." }, { status: 500 });
    if (profile?.role !== "admin" || user.email?.toLowerCase() !== ADMIN_EMAIL) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const body = await request.json();
    const setId = clean(body?.setId, 64);
    const status = body?.status;
    if (!/^[0-9a-f-]{36}$/i.test(setId) || !["review", "approved", "rejected", "draft"].includes(status)) {
      return NextResponse.json({ error: "Conjunto o estado inválido." }, { status: 400 });
    }
    const { data: set, error: setError } = await supabaseAdmin.from("english_question_sets")
      .select("id, part, status, shared_text, word_bank, instructions").eq("id", setId).maybeSingle();
    if (setError) return NextResponse.json({ error: "No fue posible consultar el conjunto." }, { status: 500 });
    if (!set) return NextResponse.json({ error: "El conjunto no existe." }, { status: 404 });

    const { data: questions, error: questionError } = await supabaseAdmin.from("questions")
      .select("id, question, correct_answer, option_a, option_b, option_c, option_d, image_url, english_options")
      .eq("english_set_id", setId).order("english_position", { ascending: true });
    if (questionError) return NextResponse.json({ error: "No fue posible revisar las preguntas." }, { status: 500 });
    if (!questions?.length) return NextResponse.json({ error: "No se puede revisar un conjunto vacío." }, { status: 400 });

    if (status === "approved") {
      const wordBank = Array.isArray(set.word_bank) ? set.word_bank : [];
      const hasSharedText = typeof set.shared_text === "string" && set.shared_text.trim().length >= 20;
      const validWordBank = wordBank.length >= 7 && wordBank.length <= 8 &&
        wordBank.every((word: unknown) => typeof word === "string" && word.trim().length > 0);
      const invalidSharedContext = [4, 5, 6, 7].includes(set.part) && !hasSharedText;
      const invalidWordBank = set.part === 2 && !validWordBank;
      const incomplete = questions.some(q => {
        const options = Array.isArray(q.english_options) ? q.english_options as Array<{ key?: unknown; text?: unknown }> : [];
        const expectedOptionCount = set.part === 7 ? 4 : set.part === 2 ? 0 : 3;
        const optionsValid = options.length === expectedOptionCount && options.every((option, index) =>
          option && option.key === String.fromCharCode(65 + index) &&
          typeof option.text === "string" && option.text.trim().length > 0
        );
        const answerValid = set.part === 2
          ? ["A", "B", "C", "D", "E", "F", "G"].includes(q.correct_answer)
          : ["A", "B", "C", "D"].includes(q.correct_answer);
        return !q.question?.trim() || !answerValid || !optionsValid ||
          (set.part === 1 && !q.image_url?.trim()) ||
          (set.part !== 2 && ![q.option_a, q.option_b, q.option_c].every(v => typeof v === "string" && v.trim())) ||
          (set.part === 7 && !q.option_d?.trim());
      });
      if (invalidSharedContext) return NextResponse.json({ error: "Este conjunto necesita un texto compartido válido antes de aprobarse." }, { status: 400 });
      if (invalidWordBank) return NextResponse.json({ error: "La Parte 2 necesita siete palabras A–G y, opcionalmente, una palabra H de ejemplo." }, { status: 400 });
      if (incomplete) return NextResponse.json({ error: "Hay preguntas incompletas o con opciones incorrectas. Corrige el conjunto antes de aprobarlo." }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin.from("english_question_sets").update({
      status, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", setId);
    if (updateError) return NextResponse.json({ error: "No se pudo actualizar el estado del conjunto." }, { status: 500 });

    const { error: activateError } = await supabaseAdmin.from("questions").update({ is_active: status === "approved" }).eq("english_set_id", setId);
    if (activateError) {
      await supabaseAdmin.from("english_question_sets").update({ status: set.status }).eq("id", setId);
      return NextResponse.json({ error: "No se pudo sincronizar la activación de las preguntas." }, { status: 500 });
    }
    return NextResponse.json({ success: true, setId, status });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
