import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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


    /* =====================================================
       LEER BODY
    ====================================================== */

    let body: CreateSimulationBody;

    try {
      body = (await request.json()) as CreateSimulationBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la solicitud no es válido." },
        { status: 400 }
      );
    }

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

    const { data: rateAllowed, error: rateError } = await supabase.rpc("consume_api_rate_limit", {
      p_bucket: "create-simulation",
      p_limit: 20,
      p_window_seconds: 3600,
    });

    if (rateError) {
      console.error("[PeakScore] Error verificando límite de simulacros:", rateError);
      return NextResponse.json(
        { success: false, error: "No fue posible validar el límite de creación." },
        { status: 503 }
      );
    }

    if (rateAllowed !== true) {
      return NextResponse.json(
        { success: false, error: "Has alcanzado el límite temporal de creación de simulacros. Inténtalo más tarde." },
        { status: 429 }
      );
    }

    /* =====================================================
       BUSCAR PREGUNTAS
    ====================================================== */

    let query = adminSupabase
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
      await adminSupabase
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
        .select("id, title, type, total_questions, description, subject, duration, difficulty, color, created_by, created_at")
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
    } = await adminSupabase
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

      await adminSupabase
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