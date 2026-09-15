import { NextResponse } from "next/server";
import { generateAI } from "@/lib/ai/router";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Difficulty = "Fácil" | "Media" | "Difícil" | "Mixta";
type Answer = "A" | "B" | "C" | "D";

interface BatchRequest {
  subject: string;
  session: number;
  amount: number;
  difficulty?: Difficulty;
}

interface ReferenceProfile {
  subject: string | null;
  topic: string | null;
  component: string | null;
  competence: string | null;
  skill: string | null;
  difficulty: string | null;
  structure_type: string | null;
  context_type: string | null;
  requires_visual: boolean | null;
}

interface GeneratedQuestion {
  subject: string;
  session: number;
  component: string | null;
  competence: string | null;
  difficulty: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Answer;
  explanation: string | null;
  context_text: string | null;
}

/* =========================================================
   MATERIAS Y SESIONES
========================================================= */

const SUBJECT_SESSION_MAP: Record<string, number[]> = {
  matematicas: [1, 2],
  "lectura critica": [1],
  "sociales y ciudadanas": [1, 2],
  "ciencias naturales": [1, 2],
  ingles: [2],
};

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const BATCH_SIZE = 5;
const MAX_AMOUNT = 500;
const MAX_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 5000;

/* =========================================================
   UTILIDADES
========================================================= */

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function cleanJson(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* =========================================================
   VALIDAR PREGUNTA
========================================================= */

function isValidQuestion(
  item: GeneratedQuestion,
  subject: string,
  session: number
): boolean {
  return (
    !!item &&
    normalize(item.subject) === normalize(subject) &&
    Number(item.session) === session &&
    typeof item.question === "string" &&
    item.question.trim().length > 0 &&
    typeof item.option_a === "string" &&
    item.option_a.trim().length > 0 &&
    typeof item.option_b === "string" &&
    item.option_b.trim().length > 0 &&
    typeof item.option_c === "string" &&
    item.option_c.trim().length > 0 &&
    typeof item.option_d === "string" &&
    item.option_d.trim().length > 0 &&
    ["A", "B", "C", "D"].includes(
      item.correct_answer
    ) &&
    item.context_text !== undefined
  );
}

/* =========================================================
   OBTENER REFERENCIAS
========================================================= */

async function getProfiles(
  supabase: SupabaseClient,
  subject: string,
  session: number
): Promise<ReferenceProfile[]> {
  const normalizedSubject = normalize(subject);

  const { data: references } = await supabase
    .from("reference_questions")
    .select(`
      subject,
      topic,
      component,
      competence,
      skill,
      difficulty,
      structure_type,
      context_type,
      requires_visual
    `)
    .limit(300);

  const matchingReferences =
    (references ?? [])
      .filter(
        (item) =>
          normalize(item.subject) ===
          normalizedSubject
      )
      .slice(0, 8);

  if (matchingReferences.length > 0) {
    return matchingReferences as ReferenceProfile[];
  }

  const {
    data: questions,
    error,
  } = await supabase
    .from("questions")
    .select(`
      subject,
      session,
      component,
      competence,
      difficulty,
      context_text,
      image_url
    `)
    .eq("subject", subject)
    .eq("session", session)
    .limit(100);

  if (error) {
    throw new Error(
      `No se pudieron obtener referencias: ${error.message}`
    );
  }

  return (questions ?? [])
    .slice(0, 50)
    .map((q) => ({
      subject: q.subject ?? null,
      topic: null,
      component: q.component ?? null,
      competence: q.competence ?? null,
      skill: null,
      difficulty: q.difficulty ?? null,

      structure_type: q.context_text
        ? "contextual"
        : "direct",

      context_type: q.context_text
        ? "textual"
        : "none",

      requires_visual:
        Boolean(q.image_url),
    }));
}

/* =========================================================
   PROMPT
========================================================= */

function buildPrompt(
  subject: string,
  session: number,
  amount: number,
  difficulty: Difficulty,
  profiles: ReferenceProfile[]
): string {
  const difficultyRule =
    difficulty === "Mixta"
      ? "Distribuye la dificultad razonablemente entre Fácil, Media y Difícil."
      : `Todas deben tener dificultad "${difficulty}".`;

  const subjectRules: Record<string, string> = {
    matematicas:
      "Prioriza interpretación y representación, formulación y ejecución, y argumentación. Usa situaciones y datos suficientes para resolver cada problema.",

    "lectura critica":
      "Evalúa comprensión local, articulación del sentido global y reflexión/evaluación crítica. Usa textos originales cuando sean necesarios.",

    "sociales y ciudadanas":
      "Evalúa interpretación de situaciones, análisis de perspectivas, relaciones entre fenómenos y toma de decisiones fundamentadas.",

    "ciencias naturales":
      "Evalúa fenómenos, datos, evidencia y razonamiento científico. Usa componentes biológico, físico, químico o CTS cuando corresponda.",

    ingles:
      "Usa inglés natural apropiado para grado 11. Las opciones deben ser gramaticalmente plausibles y las tareas deben evaluar comprensión y uso del idioma.",
  };

  const normalizedSubject =
    normalize(subject);

  return `
Eres especialista en creación de preguntas educativas tipo ICFES para Colombia.

Genera exactamente ${amount} preguntas NUEVAS de ${subject}, sesión ${session}.

${difficultyRule}

REGLAS ESPECÍFICAS:

${
  subjectRules[normalizedSubject] ??
  "Evalúa comprensión, aplicación y razonamiento a nivel de grado 11."
}

REGLAS DE ORIGINALIDAD:

- Crea contenido completamente nuevo.
- No copies ni parafrasees preguntas, textos, opciones o respuestas existentes.
- Las referencias solo sirven para estudiar patrones pedagógicos y estructurales.
- Cada pregunta debe tener una única respuesta correcta.
- Las cuatro opciones deben ser plausibles.
- Los distractores deben representar errores razonables.
- No hagas preguntas resolubles únicamente por descarte superficial.
- No dependas de información que no esté incluida.

CONTEXTO:

Si la pregunta necesita una lectura, texto, diálogo, tabla, situación o información adicional, incluye TODO dentro de "context_text".

Si no necesita contexto, usa null.

FORMATO:

Devuelve únicamente JSON válido, sin Markdown:

{
  "questions": [
    {
      "subject": "${subject}",
      "session": ${session},
      "component": "string o null",
      "competence": "string o null",
      "difficulty": "Fácil | Media | Difícil",
      "question": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "correct_answer": "A | B | C | D",
      "explanation": "string",
      "context_text": "string o null"
    }
  ]
}

La respuesta debe contener exactamente ${amount} preguntas diferentes.

PERFILES DE REFERENCIA:

${JSON.stringify(profiles)}
`;
}

/* =========================================================
   GENERAR BLOQUE
========================================================= */

async function generateBlock(
  subject: string,
  session: number,
  amount: number,
  difficulty: Difficulty,
  profiles: ReferenceProfile[]
): Promise<GeneratedQuestion[]> {
  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {
    try {
      console.log(
        `[PeakScore] Gemini generando ${amount} preguntas. Intento ${attempt}/${MAX_ATTEMPTS}.`
      );

      const response = await generateAI({
        prompt: buildPrompt(
          subject,
          session,
          amount,
          difficulty,
          profiles
        ),
        provider: "groq",
      });

      const raw =
        response.text?.trim() ?? "";

      if (!raw) {
        throw new Error(
          "Gemini no devolvió contenido."
        );
      }

      let parsed: {
        questions?: GeneratedQuestion[];
      };

      try {
        parsed = JSON.parse(
          cleanJson(raw)
        );
      } catch (error) {
        console.error(
          "[PeakScore] Error parseando JSON de Gemini:",
          error
        );

        throw new Error(
          "Gemini devolvió JSON inválido."
        );
      }

      const generated =
        Array.isArray(parsed.questions)
          ? parsed.questions
          : [];

      const unique =
        new Set<string>();

      const valid =
        generated.filter(
          (item: GeneratedQuestion) => {
            if (
              !isValidQuestion(
                item,
                subject,
                session
              )
            ) {
              return false;
            }

            const key =
              normalize(item.question);

            if (
              !key ||
              unique.has(key)
            ) {
              return false;
            }

            unique.add(key);

            return true;
          }
        );

      if (valid.length === amount) {
        console.log(
          `[PeakScore] Bloque válido generado: ${valid.length}/${amount}.`
        );

        return valid;
      }

      lastError = new Error(
        `El bloque generado no es válido. Se obtuvieron ${valid.length}/${amount} preguntas válidas.`
      );

      console.warn(
        `[PeakScore] Bloque inválido: ${valid.length}/${amount}. Intento ${attempt}/${MAX_ATTEMPTS}.`
      );
    } catch (error) {
      lastError = error;

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `[PeakScore] Error generando bloque. Intento ${attempt}/${MAX_ATTEMPTS}:`,
        error
      );

      if (attempt >= MAX_ATTEMPTS) {
        break;
      }

      const delay =
        RETRY_BASE_DELAY_MS *
        Math.pow(2, attempt - 1);

      console.warn(
        `[PeakScore] Gemini falló: ${errorMessage}. Reintentando en ${delay / 1000}s...`
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, delay)
      );
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    `No fue posible generar un bloque válido de ${amount} preguntas.`
  );
}

/* =========================================================
   CONVERTIR A FILAS
========================================================= */

function toRows(
  questions: GeneratedQuestion[],
  subject: string,
  session: number,
  difficulty: Difficulty
) {
  return questions.map((q) => ({
    subject,
    session,

    component:
      q.component?.trim() || null,

    competence:
      q.competence?.trim() || null,

    difficulty:
      q.difficulty === "Fácil" ||
      q.difficulty === "Media" ||
      q.difficulty === "Difícil"
        ? q.difficulty
        : difficulty === "Mixta"
          ? "Media"
          : difficulty,

    question:
      q.question.trim(),

    option_a:
      q.option_a.trim(),

    option_b:
      q.option_b.trim(),

    option_c:
      q.option_c.trim(),

    option_d:
      q.option_d.trim(),

    correct_answer:
      q.correct_answer,

    explanation:
      q.explanation?.trim() ||
      null,

    context_text:
      q.context_text?.trim() ||
      null,

    source:
      "AI_GENERATED",

    is_active:
      true,
  }));
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  let savedTotal = 0;

  try {
    /* =====================================================
       SEGURIDAD
       SOLO ADMINISTRADORES
    ===================================================== */

    const authSupabase =
      await createServerClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    // No hay usuario autenticado
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No estás autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    // Obtener rol real desde profiles
    const {
      data: profile,
      error: profileError,
    } = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "[PeakScore] Error verificando rol:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudieron verificar tus permisos.",
        },
        {
          status: 500,
        }
      );
    }

    // Usuario autenticado pero no administrador
    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error:
            "No tienes permisos para realizar generación masiva.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       LEER REQUEST
    ===================================================== */

    const body =
      (await request.json()) as Partial<BatchRequest>;

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const session =
      Number(body.session);

    const amount =
      Number(body.amount);

    const difficulty: Difficulty =
      body.difficulty === "Fácil" ||
      body.difficulty === "Media" ||
      body.difficulty === "Difícil" ||
      body.difficulty === "Mixta"
        ? body.difficulty
        : "Mixta";

    /* =====================================================
       VALIDAR MATERIA
    ===================================================== */

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Debes seleccionar una materia.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDAR SESIÓN
    ===================================================== */

    if (!Number.isInteger(session)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La sesión debe ser un número entero.",
        },
        {
          status: 400,
        }
      );
    }

    const allowed =
      SUBJECT_SESSION_MAP[
        normalize(subject)
      ];

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            `La materia "${subject}" no es válida.`,
        },
        {
          status: 400,
        }
      );
    }

    if (!allowed.includes(session)) {
      return NextResponse.json(
        {
          success: false,
          error:
            `${subject} no pertenece a la Sesión ${session}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDAR CANTIDAD
    ===================================================== */

    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > MAX_AMOUNT
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `La cantidad debe estar entre 1 y ${MAX_AMOUNT}.`,
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      `[PeakScore] Admin generando ${amount} preguntas de ${subject}, sesión ${session}.`
    );

    /* =====================================================
       CLIENTES
    ===================================================== */

    const supabase =
      getSupabase();

    /* =====================================================
       REFERENCIAS
    ===================================================== */

    const profiles =
      await getProfiles(
        supabase,
        subject,
        session
      );

    /* =====================================================
       GENERACIÓN
    ===================================================== */

    const generatedKeys =
      new Set<string>();

    const savedQuestions:
      unknown[] = [];

    for (
      let remaining = amount;
      remaining > 0;
      remaining -= Math.min(
        BATCH_SIZE,
        remaining
      )
    ) {
      const blockSize =
        Math.min(
          BATCH_SIZE,
          remaining
        );

      console.log(
        `[PeakScore] Generando bloque ${blockSize}. Progreso: ${savedTotal}/${amount}.`
      );

      let block =
        await generateBlock(
          subject,
          session,
          blockSize,
          difficulty,
          profiles
        );

      /* ===================================================
         EVITAR REPETICIONES ENTRE BLOQUES
      =================================================== */

      let uniqueBlock: GeneratedQuestion[] = [];
      let replacementAttempts = 0;

      while (
        uniqueBlock.length < blockSize &&
        replacementAttempts < MAX_ATTEMPTS
      ) {
        const newQuestions = block.filter(
          (q) => {
            const key =
              normalize(q.question);

            if (
              !key ||
              generatedKeys.has(key)
            ) {
              return false;
            }

            return true;
          }
        );

        for (const question of newQuestions) {
          if (uniqueBlock.length >= blockSize) {
            break;
          }

          const key =
            normalize(question.question);

          if (
            !key ||
            generatedKeys.has(key)
          ) {
            continue;
          }

          generatedKeys.add(key);
          uniqueBlock.push(question);
        }

        if (uniqueBlock.length < blockSize) {
          const missing =
            blockSize - uniqueBlock.length;

          replacementAttempts++;

          console.log(
            `[PeakScore] Faltan ${missing} preguntas nuevas. Generando reemplazos. Intento ${replacementAttempts}/${MAX_ATTEMPTS}.`
          );

          block =
            await generateBlock(
              subject,
              session,
              missing,
              difficulty,
              profiles
            );
        }
      }

      if (
        uniqueBlock.length !==
        blockSize
      ) {
        throw new Error(
          `No fue posible completar el bloque con preguntas nuevas. Se obtuvieron ${uniqueBlock.length} de ${blockSize}.`
        );
      }

      block = uniqueBlock;

      /* ===================================================
         GUARDAR
      =================================================== */

      const {
        data,
        error,
      } = await supabase
        .from("questions")
        .insert(
          toRows(
            block,
            subject,
            session,
            difficulty
          )
        )
        .select(`
          id,
          subject,
          session,
          component,
          competence,
          difficulty,
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          context_text,
          source,
          is_active,
          created_at
        `);

      if (error) {
        throw new Error(
          `No se pudo guardar el bloque: ${error.message}`
        );
      }

      const saved =
        data?.length ?? 0;

      if (
        saved !== blockSize
      ) {
        throw new Error(
          `Supabase guardó ${saved} preguntas y se esperaban ${blockSize}.`
        );
      }

      savedTotal += saved;

      savedQuestions.push(
        ...(data ?? [])
      );

      console.log(
        `[PeakScore] Bloque guardado. ${savedTotal}/${amount}.`
      );
    }

    /* =====================================================
       RESPUESTA EXITOSA
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "Generación masiva completada correctamente.",

      data: {
        subject,
        session,

        requested:
          amount,

        generated:
          savedTotal,

        saved:
          savedTotal,

        batch_size:
          BATCH_SIZE,

        difficulty,

        questions:
          savedQuestions,
      },
    });
  } catch (error) {
    console.error(
      "[PeakScore] Error en generación masiva:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido en la generación masiva.";

    return NextResponse.json(
      {
        success: false,
        error: message,
        saved: savedTotal,
        partial:
          savedTotal > 0,
      },
      {
        status: 500,
      }
    );
  }
}