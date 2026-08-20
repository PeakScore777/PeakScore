import { supabase } from "@/lib/supabase/browser";
import type { Question } from "./question.service";

export interface Simulation {
  id: string;
  title: string;
  type: string;
  total_questions: number;
  created_at: string;

  description: string | null;
  subject: string | null;
  duration: number | null;
  difficulty: string | null;
  color: string | null;
}

export interface SimulationQuestion {
  id: string;
  simulation_id: string;
  question_id: string;
  question_order: number;
}

/* ================================
   OBTENER TODOS LOS SIMULACROS
================================ */

export async function getSimulations(): Promise<Simulation[]> {
  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Error obteniendo simulacros:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return data as Simulation[];
}

/* ================================
   OBTENER UN SIMULACRO
================================ */

export async function getSimulationById(
  id: string
): Promise<Simulation | null> {
  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(
      "Error obteniendo simulacro:",
      JSON.stringify(error, null, 2)
    );

    return null;
  }

  return data as Simulation;
}

/* ================================
   OBTENER PREGUNTAS DE UN SIMULACRO
================================ */

export async function getSimulationQuestions(
  simulationId: string
): Promise<Question[]> {
  const { data: relations, error: relationsError } = await supabase
    .from("simulation_questions")
    .select("question_id, question_order")
    .eq("simulation_id", simulationId)
    .order("question_order", { ascending: true });

  if (relationsError) {
    console.error(
      "Error obteniendo preguntas del simulacro:",
      JSON.stringify(relationsError, null, 2)
    );

    return [];
  }

  if (!relations || relations.length === 0) {
    return [];
  }

  const questionIds = relations.map((item) => item.question_id);

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  if (questionsError) {
    console.error(
      "Error obteniendo preguntas:",
      JSON.stringify(questionsError, null, 2)
    );

    return [];
  }

  if (!questions) {
    return [];
  }

  const questionsMap = new Map(
    questions.map((question) => [question.id, question as Question])
  );

  return relations
    .map((relation) => questionsMap.get(relation.question_id))
    .filter((question): question is Question => Boolean(question));
}