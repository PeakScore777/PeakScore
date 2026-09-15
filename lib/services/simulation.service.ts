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

  created_by: string | null;
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

  const questionIds = relations.map(
    (item) => item.question_id
  );

  const { data: questions, error: questionsError } =
    await supabase
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
    questions.map((question) => [
      question.id,
      question as Question,
    ])
  );

  return relations
    .map((relation) =>
      questionsMap.get(relation.question_id)
    )
    .filter(
      (question): question is Question =>
        Boolean(question)
    );
}

/* ================================
   CREAR SIMULACRO PERSONALIZADO
================================ */

interface CreateSimulationOptions {
  title: string;
  subject: string;
  session: number;
  totalQuestions: number;
  difficulty: string;
  duration: number;
}

export async function createCustomSimulation(
  options: CreateSimulationOptions
): Promise<Simulation | null> {
  /* ================================
     USUARIO ACTUAL
  ================================= */

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "No hay un usuario autenticado:",
      userError
    );

    throw new Error("Debes iniciar sesión para crear un simulacro.");
  }

  /* ================================
     BUSCAR PREGUNTAS DISPONIBLES
  ================================= */

  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .eq("subject", options.subject)
    .eq("session", options.session);

  /*
   * Si la dificultad es "Mixta",
   * no filtramos por dificultad.
   */

  if (options.difficulty !== "Mixta") {
    query = query.eq(
      "difficulty",
      options.difficulty
    );
  }

  const { data: questions, error: questionsError } =
    await query;

  if (questionsError) {
    console.error(
      "Error buscando preguntas:",
      JSON.stringify(questionsError, null, 2)
    );

    throw new Error("No fue posible obtener las preguntas.");
  }

  if (!questions || questions.length < options.totalQuestions) {
    throw new Error(
      `No hay suficientes preguntas disponibles. Se necesitan ${options.totalQuestions} y solo hay ${questions?.length ?? 0}.`
    );
  }

  /* ================================
     MEZCLAR PREGUNTAS
  ================================= */

  const shuffledQuestions = [...questions].sort(
    () => Math.random() - 0.5
  );

  const selectedQuestions = shuffledQuestions.slice(
    0,
    options.totalQuestions
  );

  /* ================================
     CREAR SIMULACRO
  ================================= */

  const { data: simulation, error: simulationError } =
    await supabase
      .from("simulations")
      .insert({
        title: options.title,
        type: "custom_simulation",
        total_questions: selectedQuestions.length,
        description:
          "Simulacro personalizado creado por el usuario.",
        subject: options.subject,
        duration: options.duration,
        difficulty: options.difficulty,
        color: "bg-blue-600",
        created_by: user.id,
      })
      .select("*")
      .single();

  if (simulationError || !simulation) {
    console.error(
      "Error creando simulacro:",
      JSON.stringify(simulationError, null, 2)
    );

    throw new Error("No fue posible crear el simulacro.");
  }

  /* ================================
     RELACIONAR PREGUNTAS
  ================================= */

  const simulationQuestions =
    selectedQuestions.map((question, index) => ({
      simulation_id: simulation.id,
      question_id: question.id,
      question_order: index + 1,
    }));

  const { error: relationsError } =
    await supabase
      .from("simulation_questions")
      .insert(simulationQuestions);

  if (relationsError) {
    console.error(
      "Error relacionando preguntas:",
      JSON.stringify(relationsError, null, 2)
    );

    /*
     * Si falla la relación,
     * eliminamos el simulacro recién creado.
     */

    await supabase
      .from("simulations")
      .delete()
      .eq("id", simulation.id);

    throw new Error(
      "No fue posible guardar las preguntas del simulacro."
    );
  }

  return simulation as Simulation;
}