import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ProgressAnswer {
  question_id: string;
  selected_answer: string | null;
}

interface ProgressBody {
  attempt_id?: string | null;
  current_question: number;
  time_left: number;
  answers: ProgressAnswer[];
}

interface SimulationAttempt {
  id: string;
  user_id: string;
  simulation_id: string;
  started_at: string;
  completed_at: string | null;
  score: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  current_question: number;
  time_left: number;
}

/* ============================================================
   GET — OBTENER PROGRESO DEL SIMULACRO
============================================================ */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: simulationId } = await context.params;

    if (!simulationId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID del simulacro no válido.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    /* ========================================================
       USUARIO
    ======================================================== */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    const { data: simulation, error: simulationError } = await supabase
      .from("simulations")
      .select("id, created_by, total_questions, duration")
      .eq("id", simulationId)
      .maybeSingle();

    if (simulationError) {
      console.error("[PeakScore] Error verificando simulacro.", { errorCode: simulationError.code ?? "UNKNOWN" });
      return NextResponse.json(
        { success: false, error: "No fue posible verificar el simulacro." },
        { status: 500 }
      );
    }

    if (!simulation) {
      return NextResponse.json(
        { success: false, error: "El simulacro no existe." },
        { status: 404 }
      );
    }

    if (simulation.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "No tienes acceso a este simulacro." },
        { status: 403 }
      );
    }

    /* ========================================================
       BUSCAR ÚLTIMO INTENTO EN PROGRESO
    ======================================================== */

    const {
      data: inProgressAttempts,
      error: inProgressError,
    } = await supabase
      .from("simulation_attempts")
      .select("id, user_id, simulation_id, started_at, completed_at, score, correct_answers, incorrect_answers, unanswered_answers")
      .eq("user_id", user.id)
      .eq("simulation_id", simulationId)
      .is("completed_at", null)
      .order("started_at", {
        ascending: false,
      })
      .limit(1);

    if (inProgressError) {
      console.error("[PeakScore] Error buscando intento en progreso.", { errorCode: inProgressError.code ?? "UNKNOWN" });

      return NextResponse.json(
        {
          success: false,
          error: "No fue posible obtener el progreso.",
        },
        { status: 500 }
      );
    }

    const inProgressAttempt =
      inProgressAttempts?.[0] ?? null;

    /* ========================================================
       BUSCAR ÚLTIMO INTENTO FINALIZADO
    ======================================================== */

    const {
      data: completedAttempts,
      error: completedError,
    } = await supabase
      .from("simulation_attempts")
      .select("id, user_id, simulation_id, started_at, completed_at, score, correct_answers, incorrect_answers, unanswered_answers, current_question, time_left")
      .eq("user_id", user.id)
      .eq("simulation_id", simulationId)
      .not("completed_at", "is", null)
      .order("completed_at", {
        ascending: false,
      })
      .limit(1);

    if (completedError) {
      console.error("[PeakScore] Error buscando intento finalizado.", { errorCode: completedError.code ?? "UNKNOWN" });

      return NextResponse.json(
        {
          success: false,
          error: "No fue posible obtener el resultado.",
        },
        { status: 500 }
      );
    }

    const completedAttempt =
      completedAttempts?.[0] ?? null;

    /* ========================================================
       SI NO EXISTE INTENTO EN PROGRESO
    ======================================================== */

    if (!inProgressAttempt) {
      return NextResponse.json({
        success: true,
        status: completedAttempt
          ? "completed"
          : "not_started",
        inProgress: false,
        completed: Boolean(completedAttempt),
        attempt: completedAttempt,
        lastCompletedAttempt:
          completedAttempt,
        answers: [],
      });
    }

    /* ========================================================
       OBTENER RESPUESTAS GUARDADAS
    ======================================================== */

    const {
      data: answers,
      error: answersError,
    } = await supabase
      .from("simulation_answers")
      .select(
        "question_id, selected_answer"
      )
      .eq(
        "attempt_id",
        inProgressAttempt.id
      );

    if (answersError) {
      console.error("[PeakScore] Error obteniendo respuestas.", { errorCode: answersError.code ?? "UNKNOWN" });

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible obtener las respuestas guardadas.",
        },
        { status: 500 }
      );
    }

    /* ========================================================
       SIMULACRO EN PROGRESO
    ======================================================== */

    console.log(
      "[PeakScore] Progreso encontrado:",
      {
        simulationId,
        attemptId: inProgressAttempt.id,
        answered: answers?.length ?? 0,
      }
    );

    return NextResponse.json({
      success: true,

      status: "in_progress",

      inProgress: true,

      completed: false,

      attempt: inProgressAttempt,

      answers: answers ?? [],

      lastCompletedAttempt:
        completedAttempt ?? null,
    });
  } catch (error) {
    console.error("[PeakScore] Error interno obteniendo progreso.", { errorName: error instanceof Error ? error.name : "UnknownError" });

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — GUARDAR PROGRESO
============================================================ */

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: simulationId } =
      await context.params;

    if (!simulationId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID del simulacro no válido.",
        },
        { status: 400 }
      );
    }

    let body: ProgressBody;

    try {
      body = (await request.json()) as ProgressBody;
    } catch {
      return NextResponse.json({ success: false, error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const {
      attempt_id,
      current_question,
      time_left,
      answers,
    } = body;

    /* ========================================================
       VALIDAR PREGUNTA ACTUAL
    ======================================================== */

    if (
      !Number.isInteger(current_question) ||
      current_question < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La pregunta actual no es válida.",
        },
        { status: 400 }
      );
    }

    if (current_question >= 500) {
      return NextResponse.json(
        { success: false, error: "La pregunta actual no es válida." },
        { status: 400 }
      );
    }

    /* ========================================================
       VALIDAR TIEMPO
    ======================================================== */

    if (
      !Number.isFinite(time_left) ||
      time_left < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El tiempo restante no es válido.",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       VALIDAR RESPUESTAS
    ======================================================== */

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          error: "Las respuestas no son válidas.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    /* ========================================================
       USUARIO
    ======================================================== */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    const { data: simulation, error: simulationError } = await supabase
      .from("simulations")
      .select("id, created_by, total_questions, duration")
      .eq("id", simulationId)
      .maybeSingle();

    if (simulationError) {
      console.error("[PeakScore] Error verificando simulacro:", simulationError);
      return NextResponse.json(
        { success: false, error: "No fue posible verificar el simulacro." },
        { status: 500 }
      );
    }

    if (!simulation) {
      return NextResponse.json(
        { success: false, error: "El simulacro no existe." },
        { status: 404 }
      );
    }

    if (simulation.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "No tienes acceso a este simulacro." },
        { status: 403 }
      );
    }

    if (current_question >= simulation.total_questions) {
      return NextResponse.json(
        { success: false, error: "La pregunta actual no es válida." },
        { status: 400 }
      );
    }

    const maxTime = Number(simulation.duration ?? 0) * 60;
    if (maxTime > 0 && time_left > maxTime) {
      return NextResponse.json(
        { success: false, error: "El tiempo restante no es válido." },
        { status: 400 }
      );
    }

    if (answers.length > simulation.total_questions) {
      return NextResponse.json(
        { success: false, error: "Se enviaron demasiadas respuestas." },
        { status: 400 }
      );
    }

    const invalidAnswer = answers.some(
      (answer) =>
        !answer ||
        typeof answer.question_id !== "string" ||
        !(answer.selected_answer === null ||
          ["A", "B", "C", "D"].includes(
            String(answer.selected_answer).trim().toUpperCase()
          ))
    );

    if (invalidAnswer) {
      return NextResponse.json(
        { success: false, error: "Una o más respuestas no son válidas." },
        { status: 400 }
      );
    }

    const answerIds = answers.map((answer) => answer.question_id);
    if (new Set(answerIds).size !== answerIds.length) {
      return NextResponse.json(
        { success: false, error: "Se enviaron respuestas duplicadas." },
        { status: 400 }
      );
    }

    if (answerIds.length > 0) {
      const { data: relations, error: relationsError } = await supabase
        .from("simulation_questions")
        .select("question_id")
        .eq("simulation_id", simulationId)
        .in("question_id", answerIds);

      if (relationsError || (relations?.length ?? 0) !== answerIds.length) {
        return NextResponse.json(
          { success: false, error: "Una o más preguntas no pertenecen a este simulacro." },
          { status: 400 }
        );
      }
    }

    const validAnswers: ProgressAnswer[] = answers.map((answer) => ({
      question_id: answer.question_id,
      selected_answer:
        answer.selected_answer === null
          ? null
          : String(answer.selected_answer).trim().toUpperCase(),
    }));

    /* ========================================================
       GUARDADO ATÓMICO EN SUPABASE
       El RPC valida propiedad, preguntas, tiempo y respuestas,
       crea/bloquea el intento y reemplaza sus respuestas dentro
       de una sola transacción.
    ======================================================== */

    const progressAnswers = validAnswers
      .filter((answer) => answer.selected_answer !== null)
      .map((answer) => ({
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
      }));

    const { data: progress, error: progressError } = await supabase.rpc(
      "save_simulation_progress_atomic",
      {
        p_simulation_id: simulationId,
        p_current_question: current_question,
        p_time_left: Math.floor(time_left),
        p_answers: progressAnswers,
      }
    );

    if (progressError || !progress) {
      console.error("[PeakScore] Error guardando progreso atómicamente.", { errorCode: progressError?.code ?? "UNKNOWN" });

      return NextResponse.json(
        {
          success: false,
          error: "No fue posible guardar el progreso.",
        },
        { status: 500 }
      );
    }

    /* ========================================================
       RESPUESTA
    ======================================================== */

    console.log(
      "[PeakScore] Progreso guardado:",
      {
        simulationId,
        attemptId: progress.attempt_id,
        currentQuestion: progress.current_question,
        timeLeft: progress.time_left,
        answered: progress.answered,
      }
    );

    return NextResponse.json({
      success: true,
      status: "in_progress",
      attempt_id: progress.attempt_id,
      current_question: progress.current_question,
      time_left: progress.time_left,
      answered: progress.answered,
    });
  } catch (error) {
    console.error(
      "[PeakScore] ERROR GUARDANDO PROGRESO:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}