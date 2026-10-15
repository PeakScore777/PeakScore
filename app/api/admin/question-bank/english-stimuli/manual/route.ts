import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PARTS = {
  1: { format: "english_matching", stimulus_type: "word_bank", options: 0 },
  2: { format: "english_notice", stimulus_type: "notice", options: 3 },
  3: { format: "english_conversation", stimulus_type: "conversation", options: 3 },
  4: { format: "english_grammar_cloze", stimulus_type: "cloze_text", options: 3 },
  5: { format: "english_literal_reading", stimulus_type: "reading_text", options: 3 },
  6: { format: "english_inferential_reading", stimulus_type: "reading_text", options: 4 },
  7: { format: "english_lexical_cloze", stimulus_type: "cloze_text", options: 4 },
} as const;

type Part = keyof typeof PARTS;
type Option = { key: string; text: string };

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

function validOptions(value: unknown, expectedCount: number): value is Option[] {
  if (!Array.isArray(value) || value.length !== expectedCount) return false;
  return value.every((option, index) =>
    option && typeof option === "object" &&
    option.key === String.fromCharCode(65 + index) &&
    typeof option.text === "string" &&
    option.text.trim().length > 0 &&
    option.text.length <= 5000
  );
}

export async function POST(request: Request) {
  try {
    const auth = await createClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return fail("Debes iniciar sesión.", 401);

    const { data: profile, error: profileError } = await auth
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) return fail("No se pudieron verificar tus permisos.", 500);
    if (profile?.role !== "admin") return fail("No tienes permisos para crear preguntas.", 403);

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("El cuerpo de la solicitud no es válido.");
      body = parsed as Record<string, unknown>;
    } catch {
      return fail("El cuerpo de la solicitud contiene JSON inválido.");
    }

    const partNumber = Number(body.part);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 7) return fail("Selecciona una parte de Inglés válida.");
    const part = partNumber as Part;
    const config = PARTS[part];
    const stimulus = typeof body.stimulus === "string" ? body.stimulus.trim() : "";
    const questions = body.questions;
    if (!stimulus || stimulus.length > 20000) return fail("El estímulo es obligatorio y no puede superar 20.000 caracteres.");
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) return fail("La cantidad de preguntas del conjunto no es válida.");
    if ((part === 1 && questions.length !== 5) || ((part === 2 || part === 3) && questions.length !== 1)) {
      return fail(part === 1 ? "La Parte 1 requiere exactamente cinco descripciones." : "Las Partes 2 y 3 requieren exactamente una pregunta por estímulo.");
    }
    const editorialRange = part === 4 ? { min: 4, max: 8 }
      : part === 5 ? { min: 4, max: 7 }
      : part === 6 ? { min: 2, max: 4 }
      : part === 7 ? { min: 4, max: 8 }
      : null;
    if (editorialRange && (questions.length < editorialRange.min || questions.length > editorialRange.max)) {
      return fail(`La Parte ${part} requiere entre ${editorialRange.min} y ${editorialRange.max} preguntas por estímulo.`);
    }

    const wordBank = body.word_bank;
    if (part === 1 && !validOptions(wordBank, 7)) return fail("La Parte 1 requiere siete opciones A–G completas.");
    if (part === 1 && new Set((wordBank as Option[]).map((option) => option.text.trim().toLocaleLowerCase("en"))).size !== 7) {
      return fail("Las siete palabras del banco deben ser distintas.");
    }

    const normalizedQuestions: Record<string, unknown>[] = [];
    for (let index = 0; index < questions.length; index++) {
      const item = questions[index] as Record<string, unknown>;
      const question = typeof item?.question === "string" ? item.question.trim() : "";
      const explanation = typeof item?.explanation === "string" ? item.explanation.trim() : "";
      const skill = typeof item?.skill === "string" ? item.skill.trim() : "";
      const difficulty = item?.difficulty;
      const answer = typeof item?.correct_answer === "string" ? item.correct_answer.trim().toUpperCase() : "";
      if (!question || question.length > 10000 || !explanation || explanation.length > 20000 || !skill || skill.length > 200 || !["Fácil", "Media", "Difícil"].includes(String(difficulty))) {
        return fail(`Completa el enunciado, habilidad, dificultad y explicación del ítem ${index + 1}.`);
      }
      if (part === 1) {
        if (!(wordBank as Option[]).some((option) => option.key === answer)) return fail(`La respuesta del ítem ${index + 1} no pertenece al banco A–G.`);
      } else {
        if (!validOptions(item?.options, config.options)) return fail(`El ítem ${index + 1} requiere ${config.options} opciones ordenadas y completas.`);
        const optionTexts = (item.options as Option[]).map((option) => option.text.trim().toLocaleLowerCase("en"));
        if (new Set(optionTexts).size !== optionTexts.length) return fail(`Las opciones del ítem ${index + 1} deben tener textos distintos.`);
        if (!(item.options as Option[]).some((option) => option.key === answer)) return fail(`La respuesta del ítem ${index + 1} no coincide con sus opciones.`);
      }
      normalizedQuestions.push({
        english_part: part,
        question_format: config.format,
        stimulus_position: index + 1,
        question,
        options_json: part === 1 ? null : item.options,
        correct_answer: answer,
        difficulty,
        explanation,
        skill,
        question_metadata: { created_manually: true },
      });
    }

    if (part === 1 && new Set(normalizedQuestions.map((item) => item.correct_answer)).size !== 5) {
      return fail("Las cinco descripciones de la Parte 1 deben utilizar cinco respuestas distintas.");
    }

    if (part === 4 || part === 7) {
      const markers = [...stimulus.matchAll(/\[\[(\d+)\]\]/g)].map((match) => Number(match[1])).sort((a, b) => a - b);
      if (markers.length !== questions.length || markers.some((marker, index) => marker !== index + 1)) {
        return fail(`El texto cloze debe tener exactamente un marcador consecutivo por pregunta, desde [[1]] hasta [[${questions.length}]].`);
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceRoleKey) return fail("La configuración interna de la base de datos está incompleta.", 500);
    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: subjectRows, error: subjectError } = await admin
      .from("subjects").select("id,name").limit(100);
    if (subjectError) return fail("No se pudo comprobar la materia Inglés en la base de datos.", 500);
    const subject = (subjectRows ?? []).find((row) => String(row.name).trim().toLocaleLowerCase("es") === "inglés" || String(row.name).trim().toLocaleLowerCase("es") === "ingles");
    if (!subject) return fail("No se encontró la materia Inglés en la tabla de materias.", 400);

    const sets = [{
      stimulus: {
        stimulus_type: config.stimulus_type,
        content: stimulus,
        options_json: part === 1 ? wordBank : null,
        image_url: null,
        image_alt: null,
        metadata: { created_manually: true, created_by: user.id },
      },
      questions: normalizedQuestions,
    }];

    const { data, error } = await admin.rpc("save_english_question_sets_atomic", {
      p_subject_id: subject.id,
      p_session: 2,
      p_sets: sets,
    });
    if (error || !data?.success) {
      console.error("[PeakScore] No se pudo guardar el conjunto manual de Inglés.", { code: error?.code ?? "UNKNOWN", message: error?.message ?? "UNKNOWN" });
      return fail("No se pudo guardar el conjunto. Verifica que la estructura de Inglés esté activada en Supabase y que todos los campos sean válidos.", 500);
    }

    return NextResponse.json({
      success: true,
      stimulus_id: data.sets?.[0]?.stimulus_id ?? null,
      question_count: Number(data.question_count ?? questions.length),
      active: false,
      review_status: "pending",
    }, { status: 201 });
  } catch (error) {
    console.error("[PeakScore] Error interno en creación manual de Inglés.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return fail("Ocurrió un error inesperado al guardar el conjunto.", 500);
  }
}
