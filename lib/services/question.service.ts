import { supabase } from "@/lib/supabase/browser";
import type {
  VisualData,
  VisualType,
} from "@/lib/visuals/types";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;

  subject: string;
  subject_id: string | null;

  session: number;

  component: string | null;
  competence: string | null;
  difficulty: string | null;

  /*
   * Texto de contexto asociado a la pregunta.
   * Puede ser NULL porque no todas las preguntas
   * necesariamente tienen un texto de lectura.
   */
  context_text: string | null;

  question: string;

  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;

  correct_answer: string;

  /** Campos aditivos para formatos de pregunta no legacy. */
  question_format?: string;
  english_part?: number | null;
  stimulus_id?: string | null;
  stimulus_position?: number | null;
  options_json?: QuestionOption[] | null;
  stimulus_content?: string | null;
  stimulus_options_json?: QuestionOption[] | null;
  stimulus_image_url?: string | null;
  stimulus_image_alt?: string | null;
  stimulus_type?: string | null;

  explanation: string | null;
  image_url: string | null;

  /* =================================
     SISTEMA DE VISUALES
  ================================= */

  requires_visual: boolean;

  visual_type: VisualType | null;

  visual_description: string | null;

  visual_data: VisualData | null;

  /*
  * Compatibilidad temporal con el
  * sistema anterior de gráficas.
  */
  chart_data: unknown | null;

  year: number | null;
  source: string | null;

  question_number: number | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

/* ================================
   OBTENER PREGUNTAS
================================ */

export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Error obteniendo preguntas.",
      { errorCode: error.code ?? "UNKNOWN" }
    );

    return [];
  }

  const questions = data as Question[];
  const stimulusIds = [
    ...new Set(
      questions
        .map((question) => question.stimulus_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ];

  if (stimulusIds.length === 0) {
    return questions;
  }

  const { data: stimuli, error: stimuliError } = await supabase
    .from("question_stimuli")
    .select("id, content, options_json, image_url, image_alt, stimulus_type")
    .in("id", stimulusIds);

  if (stimuliError || !stimuli) {
    console.error(
      "Error obteniendo estímulos compartidos de Inglés.",
      { errorCode: stimuliError?.code ?? "UNKNOWN" }
    );
    return [];
  }

  const stimulusMap = new Map(
    stimuli.map((stimulus) => [stimulus.id, stimulus])
  );

  return questions.map((question) => {
    const stimulus = question.stimulus_id
      ? stimulusMap.get(question.stimulus_id)
      : null;

    return {
      ...question,
      stimulus_content: stimulus?.content ?? null,
      stimulus_options_json: stimulus?.options_json ?? null,
      stimulus_image_url: stimulus?.image_url ?? null,
      stimulus_image_alt: stimulus?.image_alt ?? null,
      stimulus_type: stimulus?.stimulus_type ?? null,
    };
  });
}

/* ================================
   OBTENER UNA PREGUNTA POR ID
================================ */

export async function getQuestionById(
  id: string
): Promise<Question | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(
      "Error obteniendo pregunta.",
      { errorCode: error.code ?? "UNKNOWN" }
    );

    return null;
  }

  return data as Question;
}

/* ================================
   CREAR PREGUNTA
================================ */

export async function createQuestion(
  question: Omit<Question, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("questions")
    .insert(question)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Error creando pregunta.",
      { errorCode: error.code ?? "UNKNOWN" }
    );

    throw error;
  }

  return data as Question;
}

/* ================================
   ELIMINAR PREGUNTA
================================ */

export async function deleteQuestion(id: string) {
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Error eliminando pregunta.",
      { errorCode: error.code ?? "UNKNOWN" }
    );
    throw error;
  }
}

/* ================================
   ACTUALIZAR PREGUNTA
================================ */

export async function updateQuestion(
  id: string,
  values: Partial<Question>
) {
  const { data, error } = await supabase
    .from("questions")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Error actualizando pregunta.",
      { errorCode: error.code ?? "UNKNOWN" }
    );
    throw error;
  }

  return data as Question;
}