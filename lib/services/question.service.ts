import { supabase } from "@/lib/supabase/browser";
import type {
  VisualData,
  VisualType,
} from "@/lib/visuals/types";

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

  return data as Question[];
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