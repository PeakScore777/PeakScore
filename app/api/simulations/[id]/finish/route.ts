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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRpcErrorResponse(message: string) {
  switch (message) {
    case "UNAUTHENTICATED":
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión para finalizar el simulacro." },
        { status: 401 }
      );
    case "SIMULATION_NOT_FOUND":
      return NextResponse.json(
        { success: false, error: "El simulacro no existe." },
        { status: 404 }
      );
    case "ATTEMPT_NOT_OPEN":
    case "ATTEMPT_ALREADY_FINISHED":
      return NextResponse.json(
        { success: false, error: "Este simulacro ya fue finalizado o el intento ya no está disponible." },
        { status: 409 }
      );
    case "INVALID_ANSWERS":
    case "QUESTIONS_NOT_AVAILABLE":
      return NextResponse.json(
        { success: false, error: "Las respuestas enviadas no son válidas." },
        { status: 400 }
      );
    case "INVALID_PAYLOAD":
      return NextResponse.json(
        { success: false, error: "La solicitud no es válida." },
        { status: 400 }
      );
    default:
      return NextResponse.json(
        { success: false, error: "No fue posible finalizar el simulacro." },
        { status: 500 }
      );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: simulationId } = await context.params;

    if (!UUID_RE.test(simulationId)) {
      return NextResponse.json(
        { success: false, error: "El ID del simulacro no es válido." },
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

    if (
      body.attempt_id !== undefined &&
      body.attempt_id !== null &&
      !UUID_RE.test(body.attempt_id)
    ) {
      return NextResponse.json(
        { success: false, error: "El intento no es válido." },
        { status: 400 }
      );
    }

    const seenQuestionIds = new Set<string>();

    for (const answer of body.answers) {
      if (
        !answer ||
        typeof answer.question_id !== "string" ||
        !UUID_RE.test(answer.question_id) ||
        seenQuestionIds.has(answer.question_id) ||
        !(
          answer.selected_answer === null ||
          (typeof answer.selected_answer === "string" &&
            ["A", "B", "C", "D"].includes(
              answer.selected_answer.trim().toUpperCase()
            ))
        )
      ) {
        return NextResponse.json(
          { success: false, error: "Una o más respuestas no son válidas." },
          { status: 400 }
        );
      }

      seenQuestionIds.add(answer.question_id);
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes iniciar sesión para finalizar el simulacro.",
        },
        { status: 401 }
      );
    }

    /*
     * La finalización completa se ejecuta dentro de una única
     * transacción en PostgreSQL. El RPC verifica propietario,
     * intento abierto, preguntas pertenecientes al simulacro,
     * respuestas válidas y calcula la calificación usando
     * questions.correct_answer en el servidor.
     *
     * Esto evita condiciones de carrera entre comprobar el intento,
     * calcular la nota y marcarlo como finalizado.
     */
    const { data: result, error: finishError } = await supabase.rpc(
      "finish_simulation_atomic",
      {
        p_simulation_id: simulationId,
        p_attempt_id: body.attempt_id ?? null,
        p_answers: body.answers.map((answer) => ({
          question_id: answer.question_id,
          selected_answer:
            answer.selected_answer === null
              ? null
              : answer.selected_answer.trim().toUpperCase(),
        })),
      }
    );

    if (finishError || !result) {
      console.error(
        "[PeakScore] Error finalizando simulacro atómicamente:",
        finishError
      );

      return getRpcErrorResponse(finishError?.message ?? "");
    }

    return NextResponse.json(
      {
        success: true,
        attempt: {
          id: result.attempt_id,
          simulation_id: simulationId,
        },
        result: {
          correctAnswers: result.correctAnswers,
          incorrectAnswers: result.incorrectAnswers,
          unansweredAnswers: result.unansweredAnswers,
          totalQuestions: result.totalQuestions,
          percentage: result.percentage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[PeakScore] ERROR FINALIZANDO SIMULACRO:",
      error
    );

    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
