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
      console.error(
        "[PeakScore] Error buscando intento en progreso:",
        inProgressError
      );

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
      .select("*")
      .eq("user_id", user.id)
      .eq("simulation_id", simulationId)
      .not("completed_at", "is", null)
      .order("completed_at", {
        ascending: false,
      })
      .limit(1);

    if (completedError) {
      console.error(
        "[PeakScore] Error buscando intento finalizado:",
        completedError
      );

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
      console.error(
        "[PeakScore] Error obteniendo respuestas:",
        answersError
      );

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
    console.error(
      "[PeakScore] ERROR OBTENIENDO PROGRESO:",
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

    /* ========================================================
       BUSCAR INTENTO EXISTENTE
    ======================================================== */

    let attempt: SimulationAttempt | null = null;

    if (attempt_id) {
      const {
        data: existingAttempt,
        error: attemptError,
      } = await supabase
        .from("simulation_attempts")
        .select("*")
        .eq("id", attempt_id)
        .eq("user_id", user.id)
        .eq("simulation_id", simulationId)
        .is("completed_at", null)
        .maybeSingle();

      if (attemptError) {
        console.error(
          "[PeakScore] Error buscando intento:",
          attemptError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "No fue posible verificar el intento.",
          },
          { status: 500 }
        );
      }

      attempt = existingAttempt;
    }

    /* ========================================================
       SI NO EXISTE, CREAR INTENTO
    ======================================================== */

    if (!attempt) {
      const {
        data: newAttempt,
        error: createAttemptError,
      } = await supabase
        .from("simulation_attempts")
        .insert({
          user_id: user.id,
          simulation_id: simulationId,
          started_at:
            new Date().toISOString(),
          completed_at: null,
          score: 0,
          correct_answers: 0,
          incorrect_answers: 0,
          unanswered_answers: 0,
        })
        .select("*")
        .single();

      if (
        createAttemptError ||
        !newAttempt
      ) {
        console.error(
          "[PeakScore] Error creando intento:",
          createAttemptError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "No fue posible crear el intento.",
          },
          { status: 500 }
        );
      }

      attempt = newAttempt;
    }

    /* ========================================================
       ELIMINAR RESPUESTAS ANTERIORES
    ======================================================== */

    const {
      error: deleteError,
    } = await supabase
      .from("simulation_answers")
      .delete()
      .eq(
        "attempt_id",
        attempt.id
      );

    if (deleteError) {
      console.error(
        "[PeakScore] Error eliminando respuestas anteriores:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible actualizar las respuestas.",
        },
        { status: 500 }
      );
    }

    /* ========================================================
       FILTRAR RESPUESTAS VÁLIDAS
    ======================================================== */

    const validAnswers =
      answers.filter(
        (answer) =>
          answer &&
          typeof answer.question_id === "string" &&
          (answer.selected_answer === null ||
            ["A", "B", "C", "D"].includes(
              String(answer.selected_answer).trim().toUpperCase()
            ))
      );

    if (validAnswers.length > simulation.total_questions) {
      return NextResponse.json(
        { success: false, error: "Se enviaron demasiadas respuestas." },
        { status: 400 }
      );
    }

    const questionIds = validAnswers.map((answer) => answer.question_id);
    const uniqueQuestionIds = new Set(questionIds);

    if (uniqueQuestionIds.size !== questionIds.length) {
      return NextResponse.json(
        { success: false, error: "Se enviaron respuestas duplicadas." },
        { status: 400 }
      );
    }

    if (questionIds.length > 0) {
      const { data: validRelations, error: relationsError } = await supabase
        .from("simulation_questions")
        .select("question_id")
        .eq("simulation_id", simulationId)
        .in("question_id", questionIds);

      if (relationsError || (validRelations?.length ?? 0) !== questionIds.length) {
        return NextResponse.json(
          { success: false, error: "Una o más preguntas no pertenecen a este simulacro." },
          { status: 400 }
        );
      }
    }

    /* ========================================================
       PREPARAR RESPUESTAS
    ======================================================== */

    const simulationAnswers =
      validAnswers
        .filter(
          (answer) =>
            answer.selected_answer !==
            null
        )
        .map((answer) => ({
          attempt_id: attempt.id,
          question_id:
            answer.question_id,
          selected_answer:
            answer.selected_answer,
          is_correct: false,
          answered_at:
            new Date().toISOString(),
        }));

    /* ========================================================
       GUARDAR RESPUESTAS
    ======================================================== */

    if (
      simulationAnswers.length > 0
    ) {
      const {
        error: insertAnswersError,
      } = await supabase
        .from("simulation_answers")
        .insert(
          simulationAnswers
        );

      if (insertAnswersError) {
        console.error(
          "[PeakScore] Error guardando respuestas:",
          insertAnswersError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "No fue posible guardar las respuestas.",
          },
          { status: 500 }
        );
      }
    }

    /* ========================================================
       RESPUESTA
    ======================================================== */

    console.log(
      "[PeakScore] Progreso guardado:",
      {
        simulationId,
        attemptId: attempt.id,
        currentQuestion:
          current_question,
        timeLeft: time_left,
        answered:
          simulationAnswers.length,
      }
    );

    return NextResponse.json({
      success: true,
      status: "in_progress",
      attempt_id: attempt.id,
      current_question:
        current_question,
      time_left: time_left,
      answered:
        simulationAnswers.length,
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