import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateSimulationBody {
  type: "normal";
  subject: string;
  amount: number;
  difficulty: string;
}

interface Question {
  id: string;
  subject: string;
  difficulty: string;
  is_active: boolean;
}

const SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
];

const QUESTION_AMOUNTS = [5, 10, 25, 50];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

export async function POST(request: Request) {
  try {
    /* =====================================================
       LEER BODY
    ====================================================== */

    const body =
      (await request.json()) as CreateSimulationBody;

    const {
      type,
      subject,
      amount,
      difficulty,
    } = body;

    /* =====================================================
       VALIDAR TIPO
    ====================================================== */

    if (type !== "normal") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este endpoint actualmente solo crea simulacros normales.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDAR MATERIA
    ====================================================== */

    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json(
        {
          success: false,
          error: "La materia seleccionada no es válida.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDAR CANTIDAD
    ====================================================== */

    const questionAmount = Number(amount);

    if (
      !Number.isInteger(questionAmount) ||
      !QUESTION_AMOUNTS.includes(questionAmount)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La cantidad de preguntas debe ser 5, 10, 25 o 50.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDAR DIFICULTAD
    ====================================================== */

    const validDifficulties = [
      "Mixta",
      "Fácil",
      "Media",
      "Difícil",
    ];

    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        {
          success: false,
          error: "La dificultad seleccionada no es válida.",
        },
        { status: 400 }
      );
    }

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
            "Debes iniciar sesión para crear un simulacro.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       BUSCAR PREGUNTAS
    ====================================================== */

    let query = supabase
      .from("questions")
      .select(
        "id, subject, difficulty, is_active"
      )
      .eq("subject", subject)
      .eq("is_active", true);

    /*
     * Mixta = no filtramos dificultad.
     */

    if (difficulty !== "Mixta") {
      query = query.eq(
        "difficulty",
        difficulty
      );
    }

    const {
      data: questions,
      error: questionsError,
    } = await query;

    if (questionsError) {
      console.error(
        "[PeakScore] Error obteniendo preguntas:",
        questionsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible obtener las preguntas disponibles.",
        },
        { status: 500 }
      );
    }

    const availableQuestions =
      (questions ?? []) as Question[];

    /* =====================================================
       COMPROBAR CANTIDAD
    ====================================================== */

    if (
      availableQuestions.length <
      questionAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `No hay suficientes preguntas disponibles para ${subject}. Disponibles: ${availableQuestions.length}. Necesarias: ${questionAmount}.`,
        },
        { status: 400 }
      );
    }

    /* =====================================================
       SELECCIONAR PREGUNTAS ALEATORIAS
    ====================================================== */

    const selectedQuestions = shuffle(
      availableQuestions
    ).slice(0, questionAmount);

    /* =====================================================
       DURACIÓN
    ====================================================== */

    const duration = Math.max(
      10,
      Math.ceil(questionAmount * 1.5)
    );

    /* =====================================================
       CREAR SIMULACRO
    ====================================================== */

    const { data: simulation, error: simulationError } =
      await supabase
        .from("simulations")
        .insert({
          title: `Práctica de ${subject}`,
          type: "custom_simulation",
          total_questions:
            selectedQuestions.length,
          description:
            "Simulacro personalizado creado por el usuario.",
          subject,
          duration,
          difficulty,
          color: "bg-blue-600",
          created_by: user.id,
        })
        .select("*")
        .single();

    if (
      simulationError ||
      !simulation
    ) {
      console.error(
        "[PeakScore] Error creando simulacro:",
        simulationError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible crear el simulacro.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       CREAR RELACIONES
    ====================================================== */

    const simulationQuestions =
      selectedQuestions.map(
        (question, index) => ({
          simulation_id: simulation.id,
          question_id: question.id,
          question_order: index + 1,
        })
      );

    const {
      error: relationsError,
    } = await supabase
      .from("simulation_questions")
      .insert(simulationQuestions);

    /* =====================================================
       SI FALLA LA RELACIÓN, ELIMINAR SIMULACRO
    ====================================================== */

    if (relationsError) {
      console.error(
        "[PeakScore] Error guardando preguntas:",
        relationsError
      );

      await supabase
        .from("simulations")
        .delete()
        .eq("id", simulation.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible guardar las preguntas del simulacro.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       RESPUESTA
    ====================================================== */

    console.log(
      `[PeakScore] Simulacro normal creado: ${simulation.id}`
    );

    console.log(
      `[PeakScore] Materia: ${subject}`
    );

    console.log(
      `[PeakScore] Preguntas: ${questionAmount}`
    );

    console.log(
      `[PeakScore] Dificultad: ${difficulty}`
    );

    return NextResponse.json(
      {
        success: true,
        simulation,
        questions: questionAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[PeakScore] ERROR CREANDO SIMULACRO:",
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