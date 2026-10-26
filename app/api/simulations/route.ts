import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getEnglishDifficulty, getEnglishPartQuestionCount } from "@/lib/simulations/english-difficulty";
import { createClient } from "@/lib/supabase/server";

interface CreateSimulationBody {
  type: "normal";
  subject: string;
  amount: number | null;
  difficulty: string;
  englishFormat?: "historical" | "saber11_2026" | null;
  englishPart?: string | null;
}

interface Question {
  id: string;
  subject: string;
  difficulty: string;
  is_active: boolean;
  english_part?: number | null;
  english_set_id?: string | null;
  english_position?: number | null;
  question_number?: number | null;
}

interface EnglishQuestionSet {
  id: string;
  title: string;
  part: number;
  booklet_format: string;
  status: string;
}

const ENGLISH_PARTS: Record<string, readonly string[]> = {
  historical: ["1", "2", "3", "4A", "4B", "5", "6", "7"],
  saber11_2026: ["1", "2", "3", "4", "5", "6", "7A", "7B"],
};

function getNumericEnglishPart(part: string): number {
  return Number(part.replace(/[AB]$/i, ""));
}

function matchesEnglishVariant(
  set: EnglishQuestionSet,
  format: "historical" | "saber11_2026",
  selectedPart: string,
): boolean {
  const title = (set.title ?? "").trim();

  if (selectedPart === "4A") return /\b4A\b/i.test(title);
  if (selectedPart === "4B") return /\b4B\b/i.test(title);
  if (selectedPart === "7A") return /\b7A\b/i.test(title);
  if (selectedPart === "7B") return /\b7B\b/i.test(title);

  if (format === "saber11_2026" && selectedPart === "4") {
    return !/\b4[AB]\b/i.test(title);
  }

  if (format === "historical" && selectedPart === "7") {
    return !/\b7[AB]\b/i.test(title);
  }

  return true;
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
     AUTENTICACIÓN PRIMERO
  ====================================================== */

  const supabase = await createClient();

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
     CLIENTE PRIVILEGIADO SOLO DESPUÉS DE AUTENTICAR
  ====================================================== */

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.error(
      "[PeakScore] Configuración interna de Supabase incompleta."
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "No fue posible completar la solicitud.",
      },
      { status: 500 }
    );
  }

  const adminSupabase = createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

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
      englishFormat,
      englishPart,
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

    let questionAmount = subject === "Inglés" ? 0 : Number(amount);

    if (
      subject !== "Inglés" &&
      (!Number.isInteger(questionAmount) ||
        !QUESTION_AMOUNTS.includes(questionAmount))
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

    const { data: rateAllowed, error: rateError } = await supabase.rpc("consume_api_rate_limit", {
      p_bucket: "create-simulation",
      p_limit: 20,
      p_window_seconds: 3600,
    });

    if (rateError) {
      console.error(
        "[PeakScore] Falló la validación del límite de simulacros.",
        { code: rateError.code ?? "UNKNOWN" }
      );
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
        "id, subject, difficulty, is_active, english_part, english_set_id, english_position, question_number"
      )
      .eq("subject", subject)
      .eq("is_active", true);

    let selectedEnglishFormat: "historical" | "saber11_2026" | null = null;
    let selectedEnglishPart: string | null = null;
    let effectiveDifficulty = difficulty;

    if (subject === "Inglés") {
      const requestedPart =
        typeof englishPart === "string"
          ? englishPart.toUpperCase()
          : "";

      if (
        (englishFormat !== "historical" &&
          englishFormat !== "saber11_2026") ||
        !ENGLISH_PARTS[englishFormat].includes(requestedPart)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Selecciona un formato y una parte válidos para Inglés.",
          },
          { status: 400 }
        );
      }

      selectedEnglishFormat = englishFormat;
      selectedEnglishPart = requestedPart;
      effectiveDifficulty = getEnglishDifficulty(requestedPart);

      // Historical format reuses the 2026 sets for the shared parts 1, 2, 3, 5 and 6.
      const sharedHistoricalPart =
        selectedEnglishFormat === "historical" &&
        ["1", "2", "3", "5", "6"].includes(requestedPart);
      const candidateFormats = sharedHistoricalPart
        ? ["historical", "saber11_2026"]
        : [selectedEnglishFormat];

      const { data: sets, error: setsError } = await adminSupabase
        .from("english_question_sets")
        .select("id,title,part,booklet_format,status")
        .in("booklet_format", candidateFormats)
        .eq("part", getNumericEnglishPart(requestedPart));

      if (setsError) {
        // Keep diagnostics in server logs; only show them in local development.
        console.error("[PeakScore] No fue posible consultar conjuntos de Inglés.", {
          code: setsError.code ?? "UNKNOWN",
          message: setsError.message ?? "Unknown Supabase query error",
          details: setsError.details ?? null,
          hint: setsError.hint ?? null,
          format: selectedEnglishFormat,
          part: requestedPart,
        });
        const developmentDetails =
          process.env.NODE_ENV === "development"
            ? ` [${setsError.code ?? "UNKNOWN"}] ${setsError.message ?? "Error de consulta"}`
            : "";
        return NextResponse.json(
          {
            success: false,
            error: `No fue posible revisar la disponibilidad de esta parte de Inglés.${developmentDetails}`,
          },
          { status: 500 }
        );
      }

      const eligibleSets = ((sets ?? []) as EnglishQuestionSet[])
        .filter((set) => set.status === "published")
        .filter((set) => matchesEnglishVariant(set, selectedEnglishFormat!, requestedPart));

      // Respect the selected format if its own section is published.
      // Reuse the 2026 set only when a historical shared part has no published historical set.
      const preferredSetIds = eligibleSets
        .filter((set) => set.booklet_format === selectedEnglishFormat)
        .map((set) => set.id);
      const shared2026SetIds = eligibleSets
        .filter((set) => set.booklet_format === "saber11_2026")
        .map((set) => set.id);
      const matchingSetIds = preferredSetIds.length > 0
        ? preferredSetIds
        : sharedHistoricalPart
          ? shared2026SetIds
          : [];

      if (matchingSetIds.length === 0) {
        const partLabel =
          requestedPart.startsWith("4") || requestedPart.startsWith("7")
            ? `Parte ${requestedPart}`
            : `Parte ${requestedPart}`;

        return NextResponse.json(
          {
            success: false,
            error: `${partLabel} del ${selectedEnglishFormat === "historical" ? "formato histórico" : "Saber 11 · 2026 Cal A"} todavía no tiene conjuntos publicados. Revisa el banco de Inglés y publica un conjunto revisado para poder practicarlo.`,
          },
          { status: 400 }
        );
      }

      query = query
        .in("english_set_id", matchingSetIds)
        .eq("english_part", getNumericEnglishPart(requestedPart));

      const expectedQuestionCount = getEnglishPartQuestionCount(
        selectedEnglishFormat,
        requestedPart,
      );

      if (expectedQuestionCount === null) {
        return NextResponse.json(
          { success: false, error: "No encontramos la cantidad de preguntas definida para esta parte." },
          { status: 400 },
        );
      }
    }

    /*
     * Mixta = no filtramos dificultad.
     */

    if (subject !== "Inglés" && effectiveDifficulty !== "Mixta") {
      query = query.eq(
        "difficulty",
        effectiveDifficulty
      );
    }

    const {
      data: questions,
      error: questionsError,
    } = await query;

    if (questionsError) {
      console.error(
        "[PeakScore] Falló la consulta interna de preguntas.",
        { code: questionsError.code ?? "UNKNOWN" }
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

    let availableQuestions = (questions ?? []) as Question[];

    if (subject === "Inglés") {
      // Una práctica de Inglés es una sección completa de un solo conjunto,
      // no una mezcla de sesiones ni una cantidad recortada por el usuario.
      const questionsBySet = new Map<string, Question[]>();

      for (const candidate of availableQuestions) {
        if (!candidate.english_set_id) continue;
        const group = questionsBySet.get(candidate.english_set_id) ?? [];
        group.push(candidate);
        questionsBySet.set(candidate.english_set_id, group);
      }

      const completeSections = [...questionsBySet.values()].filter(
        (section) => section.length > 0,
      );

      if (completeSections.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `La Parte ${selectedEnglishPart} de ${selectedEnglishFormat === "historical" ? "formato histórico" : "Saber 11 · 2026 Cal A"} todavía no tiene preguntas activas en un conjunto publicado. Revisa, publica y activa la sección completa en el banco de Inglés.`,
          },
          { status: 400 },
        );
      }

      const chosenSection = completeSections[
        Math.floor(Math.random() * completeSections.length)
      ];

      availableQuestions = [...chosenSection].sort((a, b) => {
        const positionA = a.english_position ?? a.question_number ?? 0;
        const positionB = b.english_position ?? b.question_number ?? 0;
        return positionA - positionB;
      });
      questionAmount = availableQuestions.length;
    } else {
      /* =====================================================
         COMPROBAR CANTIDAD PARA OTRAS MATERIAS
      ====================================================== */
      if (availableQuestions.length < questionAmount) {
        return NextResponse.json(
          {
            success: false,
            error: `Hay ${availableQuestions.length} preguntas activas disponibles para ${subject}, pero seleccionaste ${questionAmount}. Publica más preguntas revisadas o elige una cantidad menor.`,
          },
          { status: 400 },
        );
      }
    }

    /* =====================================================
       SELECCIONAR PREGUNTAS
       Inglés conserva el orden original de la sección completa.
    ====================================================== */

    const selectedQuestions =
      subject === "Inglés"
        ? availableQuestions
        : shuffle(availableQuestions).slice(0, questionAmount);

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
          title:
            subject === "Inglés" && selectedEnglishFormat && selectedEnglishPart
              ? `Práctica de Inglés · ${selectedEnglishFormat === "historical" ? "Histórico" : "Saber 11 · 2026 Cal A"} · Parte ${selectedEnglishPart}`
              : `Práctica de ${subject}`,
          type: "custom_simulation",
          total_questions:
            selectedQuestions.length,
          description:
            subject === "Inglés" && selectedEnglishFormat && selectedEnglishPart
              ? `Simulacro personalizado de Inglés. Formato: ${selectedEnglishFormat}; parte: ${selectedEnglishPart}.`
              : "Simulacro personalizado creado por el usuario.",
          subject,
          duration,
          difficulty: effectiveDifficulty,
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
        "[PeakScore] Falló la creación interna del simulacro.",
        { code: simulationError?.code ?? "UNKNOWN" }
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
        "[PeakScore] Falló el guardado interno de preguntas.",
        { code: relationsError.code ?? "UNKNOWN" }
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
      `[PeakScore] Dificultad: ${effectiveDifficulty}`
    );

    if (selectedEnglishFormat && selectedEnglishPart) {
      console.log(
        `[PeakScore] Inglés: ${selectedEnglishFormat} · Parte ${selectedEnglishPart}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        simulation,
        questions: questionAmount,
        englishFormat: selectedEnglishFormat,
        englishPart: selectedEnglishPart,
        difficulty: effectiveDifficulty,
      },
      { status: 201 }
    );
  } catch {
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