import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FinishAnswer {
  question_id: string;
  selected_answer: string | null;
}

interface FinishSimulationBody {
  attempt_id?: string | null;
  answers: FinishAnswer[];
}

interface Question {
  id: string;
  correct_answer: string | null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "Configuración del servidor incompleta." },
        { status: 500 }
      );
    }

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { id: simulationId } = await context.params;

    if (!simulationId) {
      return NextResponse.json(
        { success: false, error: "El ID del simulacro es obligatorio." },
        { status: 400 }
      );
    }

    let body: FinishSimulationBody;

    try {
      body = (await request.json()) as FinishSimulationBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la solicitud no es válido." },
        { status: 400 }
      );
    }

    if (
      !body ||
      !Array.isArray(body.answers) ||
      body.answers.length > 500
    ) {
      return NextResponse.json(
        { success: false, error: "Las respuestas enviadas no son válidas." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión para finalizar el simulacro." },
        { status: 401 }
      );
    }

    const { data: simulation, error: simulationError } =
      await adminSupabase
        .from("simulations")
        .select("id, title, type, total_questions, subject, duration, created_by")
        .eq("id", simulationId)
        .maybeSingle();

    if (simulationError) {
      console.error("[PeakScore] Error obteniendo simulacro:", simulationError);
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

    const { data: relations, error: relationsError } =
      await adminSupabase
        .from("simulation_questions")
        .select("question_id, question_order")
        .eq("simulation_id", simulationId)
        .order("question_order", { ascending: true });

    if (relationsError) {
      console.error("[PeakScore] Error obteniendo relaciones:", relationsError);
      return NextResponse.json(
        { success: false, error: "No fue posible obtener las preguntas del simulacro." },
        { status: 500 }
      );
    }

    if (!relations?.length) {
      return NextResponse.json(
        { success: false, error: "Este simulacro no tiene preguntas." },
        { status: 409 }
      );
    }

    const questionIds = relations.map((relation) => relation.question_id);
    const expectedIds = new Set(questionIds);

    if (questionIds.length !== simulation.total_questions) {
      return NextResponse.json(
        { success: false, error: "La configuración del simulacro no pudo verificarse." },
        { status: 409 }
      );
    }

    const answers = body.answers;

    for (const answer of answers) {
      if (
        !answer ||
        typeof answer.question_id !== "string" ||
        !expectedIds.has(answer.question_id) ||
        !(
          answer.selected_answer === null ||
          ["A", "B", "C", "D"].includes(
            String(answer.selected_answer).trim().toUpperCase()
          )
        )
      ) {
        return NextResponse.json(
          { success: false, error: "Una o más respuestas no son válidas." },
          { status: 400 }
        );
      }
    }

    const answerIds = answers.map((answer) => answer.question_id);

    if (new Set(answerIds).size !== answerIds.length) {
      return NextResponse.json(
        { success: false, error: "Se enviaron preguntas duplicadas." },
        { status: 400 }
      );
    }

    if (answerIds.length !== questionIds.length) {
      return NextResponse.json(
        { success: false, error: "No se enviaron todas las preguntas del simulacro." },
        { status: 400 }
      );
    }

    const {
      data: questions,
      error: questionsError,
    } = await adminSupabase
      .from("questions")
      .select("id, correct_answer")
      .in("id", questionIds);

    if (questionsError) {
      console.error("[PeakScore] Error obteniendo respuestas correctas:", questionsError);
      return NextResponse.json(
        { success: false, error: "No fue posible verificar las respuestas." },
        { status: 500 }
      );
    }

    const questionList = (questions ?? []) as Question[];

    if (questionList.length !== questionIds.length) {
      return NextResponse.json(
        { success: false, error: "Las preguntas del simulacro no pudieron verificarse." },
        { status: 409 }
      );
    }

    const questionsMap = new Map(
      questionList.map((question) => [question.id, question])
    );

    const answersMap = new Map(
      answers.map((answer) => [
        answer.question_id,
        answer.selected_answer?.trim().toUpperCase() || null,
      ])
    );

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unansweredAnswers = 0;

    const completedAt = new Date().toISOString();

    const simulationAnswers: {
      question_id: string;
      selected_answer: string;
      is_correct: boolean;
      answered_at: string;
    }[] = [];

    for (const relation of relations) {
      const question = questionsMap.get(relation.question_id);
      const selectedAnswer = answersMap.get(relation.question_id);

      if (!question) {
        return NextResponse.json(
          { success: false, error: "Las preguntas del simulacro no pudieron verificarse." },
          { status: 409 }
        );
      }

      if (!selectedAnswer) {
        unansweredAnswers++;
        continue;
      }

      const correctAnswer =
        question.correct_answer?.trim().toUpperCase() || "";

      const isCorrect = selectedAnswer === correctAnswer;

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

    const totalQuestions = relations.length;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    let attemptId = body.attempt_id ?? null;

    if (attemptId) {
      const { data: existingAttempt, error: attemptLookupError } =
        await adminSupabase
          .from("simulation_attempts")
          .select("id, user_id, simulation_id, completed_at")
          .eq("id", attemptId)
          .maybeSingle();

      if (attemptLookupError) {
        console.error("[PeakScore] Error verificando intento:", attemptLookupError);
        return NextResponse.json(
          { success: false, error: "No fue posible verificar el intento." },
          { status: 500 }
        );
      }

      if (!existingAttempt || existingAttempt.user_id !== user.id || existingAttempt.simulation_id !== simulationId) {
        return NextResponse.json(
          { success: false, error: "El intento no es válido para este simulacro." },
          { status: 403 }
        );
      }

      if (existingAttempt.completed_at) {
        return NextResponse.json(
          { success: false, error: "Este simulacro ya fue finalizado." },
          { status: 409 }
        );
      }
    } else {
      const { data: openAttempts, error: openAttemptError } =
        await adminSupabase
          .from("simulation_attempts")
          .select("id")
          .eq("user_id", user.id)
          .eq("simulation_id", simulationId)
          .is("completed_at", null)
          .order("started_at", { ascending: false })
          .limit(1);

      if (openAttemptError) {
        console.error("[PeakScore] Error buscando intento abierto:", openAttemptError);
        return NextResponse.json(
          { success: false, error: "No fue posible verificar el intento." },
          { status: 500 }
        );
      }

      attemptId = openAttempts?.[0]?.id ?? null;
    }

    if (!attemptId) {
      const { data: newAttempt, error: createAttemptError } =
        await adminSupabase
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
          .select("id")
          .single();

      if (createAttemptError || !newAttempt) {
        console.error("[PeakScore] Error creando intento:", createAttemptError);
        return NextResponse.json(
          { success: false, error: "No fue posible guardar el intento." },
          { status: 500 }
        );
      }

      attemptId = newAttempt.id;
    } else {
      const { error: updateAttemptError } = await adminSupabase
        .from("simulation_attempts")
        .update({
          completed_at: completedAt,
          score: percentage,
          correct_answers: correctAnswers,
          incorrect_answers: incorrectAnswers,
          unanswered_answers: unansweredAnswers,
        })
        .eq("id", attemptId)
        .eq("user_id", user.id)
        .eq("simulation_id", simulationId)
        .is("completed_at", null);

      if (updateAttemptError) {
        console.error("[PeakScore] Error finalizando intento:", updateAttemptError);
        return NextResponse.json(
          { success: false, error: "No fue posible finalizar el intento." },
          { status: 500 }
        );
      }
    }

    if (simulationAnswers.length > 0) {
      const answersToInsert = simulationAnswers.map((answer) => ({
        attempt_id: attemptId,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        answered_at: answer.answered_at,
      }));

      const { error: answersError } = await adminSupabase
        .from("simulation_answers")
        .insert(answersToInsert);

      if (answersError) {
        console.error("[PeakScore] Error guardando respuestas:", answersError);

        await adminSupabase
          .from("simulation_attempts")
          .update({
            completed_at: null,
            score: 0,
            correct_answers: 0,
            incorrect_answers: 0,
            unanswered_answers: 0,
          })
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .eq("simulation_id", simulationId);

        return NextResponse.json(
          { success: false, error: "No fue posible guardar las respuestas." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        attempt: {
          id: attemptId,
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
    console.error("[PeakScore] ERROR FINALIZANDO SIMULACRO:", error);

    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
