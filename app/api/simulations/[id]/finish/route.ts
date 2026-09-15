import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FinishAnswer {
  question_id: string;
  selected_answer: string | null;
}

interface FinishSimulationBody {
  answers: FinishAnswer[];
}

interface Question {
  id: string;
  correct_answer: string | null;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    /* =====================================================
       OBTENER ID DEL SIMULACRO
    ====================================================== */

    const { id: simulationId } = await context.params;

    if (!simulationId) {
      return NextResponse.json(
        {
          success: false,
          error: "El ID del simulacro es obligatorio.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LEER BODY
    ====================================================== */

    const body =
      (await request.json()) as FinishSimulationBody;

    const answers = Array.isArray(body.answers)
      ? body.answers
      : [];

    /* =====================================================
       SUPABASE
    ====================================================== */

    const supabase = await createClient();

    /* =====================================================
       USUARIO ACTUAL
    ====================================================== */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Debes iniciar sesión para finalizar el simulacro.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       OBTENER SIMULACRO
    ====================================================== */

    const {
      data: simulation,
      error: simulationError,
    } = await supabase
      .from("simulations")
      .select(
        "id, title, type, total_questions, subject, duration"
      )
      .eq("id", simulationId)
      .single();

    if (simulationError || !simulation) {
      console.error(
        "[PeakScore] Error obteniendo simulacro:",
        simulationError
      );

      return NextResponse.json(
        {
          success: false,
          error: "El simulacro no existe.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       OBTENER PREGUNTAS DEL SIMULACRO
    ====================================================== */

    const {
      data: relations,
      error: relationsError,
    } = await supabase
      .from("simulation_questions")
      .select("question_id, question_order")
      .eq("simulation_id", simulationId)
      .order("question_order", {
        ascending: true,
      });

    if (relationsError) {
      console.error(
        "[PeakScore] Error obteniendo relaciones:",
        relationsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible obtener las preguntas del simulacro.",
        },
        { status: 500 }
      );
    }

    if (!relations || relations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este simulacro no tiene preguntas.",
        },
        { status: 400 }
      );
    }

    const questionIds = relations.map(
      (relation) => relation.question_id
    );

    /* =====================================================
       OBTENER RESPUESTAS CORRECTAS
    ====================================================== */

    const {
      data: questions,
      error: questionsError,
    } = await supabase
      .from("questions")
      .select("id, correct_answer")
      .in("id", questionIds);

    if (questionsError) {
      console.error(
        "[PeakScore] Error obteniendo respuestas correctas:",
        questionsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible verificar las respuestas.",
        },
        { status: 500 }
      );
    }

    const questionList =
      (questions ?? []) as Question[];

    const questionsMap = new Map(
      questionList.map((question) => [
        question.id,
        question,
      ])
    );

    /* =====================================================
       MAPA DE RESPUESTAS DEL USUARIO
    ====================================================== */

    const answersMap = new Map(
      answers
        .filter(
          (answer) =>
            answer &&
            typeof answer.question_id === "string"
        )
        .map((answer) => [
          answer.question_id,
          answer.selected_answer
            ?.trim()
            .toUpperCase() || null,
        ])
    );

    /* =====================================================
       CALCULAR RESULTADO EN SERVIDOR
    ====================================================== */

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unansweredAnswers = 0;

    const completedAt =
      new Date().toISOString();

    const simulationAnswers: {
      question_id: string;
      selected_answer: string;
      is_correct: boolean;
      answered_at: string;
    }[] = [];

    for (const relation of relations) {
      const question = questionsMap.get(
        relation.question_id
      );

      if (!question) {
        continue;
      }

      const selectedAnswer =
        answersMap.get(question.id);

      /* ================================
         SIN RESPONDER
      ================================= */

      if (!selectedAnswer) {
        unansweredAnswers++;
        continue;
      }

      const correctAnswer =
        question.correct_answer
          ?.trim()
          .toUpperCase() || "";

      const isCorrect =
        selectedAnswer === correctAnswer;

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      simulationAnswers.push({
        question_id: question.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        answered_at: completedAt,
      });
    }

    /* =====================================================
       TOTAL Y PORCENTAJE
    ====================================================== */

    const totalQuestions =
      relations.length;

    const percentage =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers /
              totalQuestions) *
              100
          )
        : 0;

    /* =====================================================
       CREAR INTENTO
    ====================================================== */

    const {
      data: attempt,
      error: attemptError,
    } = await supabase
      .from("simulation_attempts")
      .insert({
        user_id: user.id,
        simulation_id: simulationId,
        started_at: completedAt,
        completed_at: completedAt,
        score: percentage,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        unanswered_answers: unansweredAnswers,
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      console.error(
        "[PeakScore] Error creando intento:",
        attemptError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            attemptError?.message ||
            "No fue posible guardar el intento.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       GUARDAR RESPUESTAS
    ====================================================== */

    if (simulationAnswers.length > 0) {
      const answersToInsert =
        simulationAnswers.map(
          (answer) => ({
            attempt_id: attempt.id,
            question_id: answer.question_id,
            selected_answer:
              answer.selected_answer,
            is_correct: answer.is_correct,
            answered_at:
              answer.answered_at,
          })
        );

      const {
        error: answersError,
      } = await supabase
        .from("simulation_answers")
        .insert(answersToInsert);

      if (answersError) {
        console.error(
          "[PeakScore] Error guardando respuestas:",
          answersError
        );

        await supabase
          .from("simulation_attempts")
          .delete()
          .eq("id", attempt.id);

        return NextResponse.json(
          {
            success: false,
            error:
              answersError.message ||
              "No fue posible guardar las respuestas.",
          },
          { status: 500 }
        );
      }
    }

    /* =====================================================
       RESPUESTA
    ====================================================== */

    console.log(
      "[PeakScore] Simulacro finalizado:",
      simulationId
    );

    console.log(
      "[PeakScore] Usuario:",
      user.id
    );

    console.log(
      "[PeakScore] Correctas:",
      correctAnswers
    );

    console.log(
      "[PeakScore] Incorrectas:",
      incorrectAnswers
    );

    console.log(
      "[PeakScore] Sin responder:",
      unansweredAnswers
    );

    console.log(
      "[PeakScore] Porcentaje:",
      percentage
    );

    return NextResponse.json(
      {
        success: true,
        attempt: {
          id: attempt.id,
          simulation_id: simulationId,
        },
        result: {
          correctAnswers,
          incorrectAnswers,
          unansweredAnswers,
          totalQuestions,
          percentage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[PeakScore] ERROR FINALIZANDO SIMULACRO:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}