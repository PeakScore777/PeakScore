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

    /* ========================================================
       BUSCAR ÚLTIMO INTENTO EN PROGRESO
    ======================================================== */

    const {
      data: inProgressAttempts,
      error: inProgressError,
    } = await supabase
      .from("simulation_attempts")
      .select("*")
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

    const body =
      (await request.json()) as ProgressBody;

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

    /* ========================================================
       BUSCAR INTENTO EXISTENTE
    ======================================================== */

    let attempt: any = null;

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
              createAttemptError?.message ||
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
          typeof answer.question_id ===
            "string" &&
          (
            answer.selected_answer ===
              null ||
            ["A", "B", "C", "D"].includes(
              answer.selected_answer
            )
          )
      );

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