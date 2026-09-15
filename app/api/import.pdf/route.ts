import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateAI } from "@/lib/ai/router";
import { extractPdfPages } from "@/lib/pdf/extractPdfPages";
import crypto from "crypto";

export const runtime = "nodejs";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MAX_FILE_SIZE = 30 * 1024 * 1024;

const VALID_SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
] as const;

const VALID_DIFFICULTIES = [
  "Fácil",
  "Media",
  "Difícil",
] as const;

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
] as const;

const MAX_RETRIES_PER_MODEL = 2;

type Subject = (typeof VALID_SUBJECTS)[number];
type Difficulty = (typeof VALID_DIFFICULTIES)[number];

type DocumentMode =
  | "mixed"
  | "single_subject";

/* =========================================================
   TIPOS
========================================================= */

type DocumentValidation = {
  is_valid: boolean;
  detected_subject: Subject | null;
  detected_session: string | null;
  document_type: string;
  is_compatible: boolean;
  confidence: number;
  reason: string;
};

type GeminiAnalysis = {
  summary: string;
  difficulty_profile: string;
  topic_profile: string;
  competence_profile: string;
  reasoning_profile: string;
  structure_profile: string;
  context_profile: string;
  generation_guidelines: string;
};

type GeminiQuestionProfile = {
  question_number: number | null;
  subject: Subject;
  topic: string;
  component: string;
  competence: string;
  skill: string;
  difficulty: Difficulty;
  reasoning_type: string;
  structure_type: string;
  context_type: string;
  distractor_strategy: string;
  information_complexity: string;
  requires_visual: boolean;
  visual_description: string | null;
  analysis_notes: string;
};

type GeminiResult = {
  document_validation: DocumentValidation;
  analysis: GeminiAnalysis;
  questions: GeminiQuestionProfile[];
};

type GeminiQuestionDetectionResult = {
  document_validation: DocumentValidation;

  detected_question_numbers: number[];
};

/* =========================================================
   GEMINI
========================================================= */

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "ADVERTENCIA: GEMINI_API_KEY no está configurada."
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local."
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en .env.local."
    );
  }

  return createAdminClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/* =========================================================
   VALIDADORES
========================================================= */

function isValidSubject(
  value: unknown
): value is Subject {
  return (
    typeof value === "string" &&
    VALID_SUBJECTS.includes(value as Subject)
  );
}

function isValidDifficulty(
  value: unknown
): value is Difficulty {
  return (
    typeof value === "string" &&
    VALID_DIFFICULTIES.includes(
      value as Difficulty
    )
  );
}

function isValidDocumentMode(
  value: unknown
): value is DocumentMode {
  return (
    value === "mixed" ||
    value === "single_subject"
  );
}

function isValidConfidence(
  value: unknown
): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function normalizeSession(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (
    normalized === "1" ||
    normalized === "01" ||
    normalized === "primera" ||
    normalized === "primera sesion" ||
    normalized === "sesion 1" ||
    normalized === "sesion uno" ||
    normalized === "session 1" ||
    normalized === "first session"
  ) {
    return "1";
  }

  if (
    normalized === "2" ||
    normalized === "02" ||
    normalized === "segunda" ||
    normalized === "segunda sesion" ||
    normalized === "sesion 2" ||
    normalized === "sesion dos" ||
    normalized === "session 2" ||
    normalized === "second session"
  ) {
    return "2";
  }

  return null;
}

/* =========================================================
   ERRORES GEMINI
========================================================= */

function getErrorStatus(
  error: unknown
): number | null {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return null;
  }

  const possibleError = error as {
    status?: unknown;
    code?: unknown;
    response?: {
      status?: unknown;
    };
  };

  if (
    typeof possibleError.status === "number"
  ) {
    return possibleError.status;
  }

  if (
    typeof possibleError.code === "number"
  ) {
    return possibleError.code;
  }

  if (
    possibleError.response &&
    typeof possibleError.response.status ===
      "number"
  ) {
    return possibleError.response.status;
  }

  return null;
}

function isTemporaryGeminiError(
  error: unknown
): boolean {
  const status = getErrorStatus(error);

  if (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
}

function getGeminiErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Error desconocido al comunicarse con Gemini.";
}

function sleep(
  ms: number
): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function splitTextIntoChunks(
  text: string,
  maxChunkSize = 3000
): string[] {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  const chunks: string[] = [];

  let currentChunk = "";

  const paragraphs =
    normalizedText.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const cleanParagraph =
      paragraph.trim();

    if (!cleanParagraph) {
      continue;
    }

    /*
     * Si un párrafo individual supera el límite,
     * lo dividimos por longitud.
     */
    if (
      cleanParagraph.length >
      maxChunkSize
    ) {
      if (currentChunk.trim()) {
        chunks.push(
          currentChunk.trim()
        );

        currentChunk = "";
      }

      for (
        let start = 0;
        start < cleanParagraph.length;
        start += maxChunkSize
      ) {
        chunks.push(
          cleanParagraph
            .slice(
              start,
              start + maxChunkSize
            )
            .trim()
        );
      }

      continue;
    }

    const nextChunk =
      currentChunk
        ? `${currentChunk}\n\n${cleanParagraph}`
        : cleanParagraph;

    if (
      nextChunk.length >
      maxChunkSize
    ) {
      chunks.push(
        currentChunk.trim()
      );

      currentChunk =
        cleanParagraph;
    } else {
      currentChunk =
        nextChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(
      currentChunk.trim()
    );
  }

  return chunks;
}

/* =====================================================
   EXTRAER TEXTO LOCAL PARA UN LOTE DE PREGUNTAS
===================================================== */

function extractTextForQuestionBatch(
  extractedPdfText: string,
  questionNumbers: number[]
): string {
  if (!extractedPdfText.trim()) {
    return "";
  }

  if (questionNumbers.length === 0) {
    return "";
  }

  const sortedQuestions = [
    ...new Set(questionNumbers),
  ].sort((a, b) => a - b);

  const firstQuestion =
    sortedQuestions[0];

  const lastQuestion =
    sortedQuestions[
      sortedQuestions.length - 1
    ];

  /*
   * IMPORTANTE:
   *
   * extractPdfPages() normaliza el texto y reemplaza
   * los saltos de línea por espacios.
   *
   * Por eso NO podemos depender únicamente de:
   *
   * ^ o \n
   *
   * Buscamos números de pregunta después de cualquier
   * espacio o al inicio del documento.
   *
   * Formatos soportados:
   *
   * 51.
   * 51)
   * 51 -
   * 51:
   * Pregunta 51
   * Pregunta 51.
   */
  const questionPattern =
    /(?:^|\s)(?:pregunta\s+)?(\d{1,3})(?=\s*[.)\-:])/gim;

  const matches = [
    ...extractedPdfText.matchAll(
      questionPattern
    ),
  ];

  const allQuestionPositions =
    matches
      .map((match) => ({
        questionNumber:
          Number(match[1]),

        index:
          (match.index ?? 0) +
          match[0].indexOf(
            match[1]
          ),
      }))
      .filter(
        (item) =>
          Number.isFinite(
            item.questionNumber
          ) &&
          item.questionNumber > 0
      )
      .sort(
        (a, b) =>
          a.index - b.index
      );

  /*
   * Buscamos específicamente el inicio
   * de la primera pregunta del lote.
   */
  const firstMatch =
    allQuestionPositions.find(
      (item) =>
        item.questionNumber ===
        firstQuestion
    );

  if (!firstMatch) {
    console.warn(
      `[Batch Extractor] No se encontró el inicio de la pregunta ${firstQuestion}.`
    );

    console.warn(
      `[Batch Extractor] Lote solicitado: ${firstQuestion}-${lastQuestion}`
    );

    return "";
  }

  /*
   * Primero intentamos encontrar la pregunta
   * inmediatamente posterior al lote.
   *
   * Ejemplo:
   *
   * Lote 51-75
   * Buscamos la pregunta 76.
   *
   * Esto es mucho más seguro que buscar simplemente
   * cualquier número mayor, porque un PDF puede contener:
   *
   * años: 2024
   * cantidades
   * referencias numéricas
   * números dentro del enunciado
   */
  const expectedNextQuestion =
    lastQuestion + 1;

  let nextQuestion =
    allQuestionPositions.find(
      (item) =>
        item.index >
          firstMatch.index &&
        item.questionNumber ===
          expectedNextQuestion
    );

  /*
   * Si no encontramos exactamente la siguiente pregunta,
   * buscamos una pregunta razonablemente cercana.
   *
   * Esto protege contra PDFs donde Gemini detectó
   * preguntas faltantes o numeraciones irregulares.
   */
  if (!nextQuestion) {
    nextQuestion =
      allQuestionPositions.find(
        (item) =>
          item.index >
            firstMatch.index &&
          item.questionNumber >
            lastQuestion &&
          item.questionNumber <=
            lastQuestion + 10
      );
  }

  const endIndex =
    nextQuestion
      ? nextQuestion.index
      : extractedPdfText.length;

  const batchText =
    extractedPdfText
      .slice(
        firstMatch.index,
        endIndex
      )
      .trim();

  if (!batchText) {
    console.warn(
      `[Batch Extractor] El lote ${firstQuestion}-${lastQuestion} quedó vacío.`
    );

    return "";
  }

  console.log(
    `[Batch Extractor] Lote ${firstQuestion}-${lastQuestion}: ${batchText.length} caracteres.`
  );

  console.log(
    `[Batch Extractor] Inicio encontrado: pregunta ${firstQuestion}.`
  );

  if (nextQuestion) {
    console.log(
      `[Batch Extractor] Fin encontrado antes de la pregunta ${nextQuestion.questionNumber}.`
    );
  } else {
    console.log(
      `[Batch Extractor] No se encontró una pregunta posterior. Se utilizó el final del documento.`
    );
  }

  return batchText;
}

/* =========================================================
   PROMPT
========================================================= */

function buildQuestionDetectionPrompt(
  subject: string,
  session: string,
  documentMode: string
) {
  return `
Analiza cuidadosamente TODO el PDF proporcionado.

Tu tarea en esta fase es ÚNICAMENTE detectar todas las preguntas reales
correspondientes al material solicitado.

CONFIGURACIÓN SOLICITADA:

Materia:
${subject}

Sesión:
${session}

Tipo de documento:
${documentMode}

=========================================================
REGLAS IMPORTANTES
=========================================================

1. Debes revisar TODO el documento PDF, desde la primera hasta la última página.

2. Detecta TODAS las preguntas reales correspondientes a la materia y sesión
solicitadas.

3. NO limites la respuesta a 10, 20, 25 o cualquier otra cantidad.

4. Si el documento contiene 100, 200 o 290 preguntas correspondientes,
debes detectar TODOS sus números.

5. NO generes preguntas nuevas.

6. NO analices todavía:
   - topic
   - component
   - competence
   - skill
   - difficulty
   - reasoning_type
   - structure_type
   - context_type
   - perfiles pedagógicos

7. Tu única tarea es identificar los números de TODAS las preguntas válidas.

8. Ignora:
   - instrucciones generales
   - portadas
   - textos informativos
   - tablas de contenido
   - ejemplos que no sean preguntas reales

=========================================================
TIPO DE DOCUMENTO
=========================================================

Si documentMode es "mixed":

El PDF puede contener varias materias.

Detecta ÚNICAMENTE las preguntas correspondientes a:

Materia: ${subject}
Sesión: ${session}

Si documentMode es "single_subject":

El PDF corresponde exclusivamente a la materia:

${subject}

Debes detectar TODAS las preguntas reales del documento,
sin aplicar un límite fijo.

=========================================================
FORMATO DE RESPUESTA
=========================================================

Devuelve únicamente JSON válido siguiendo exactamente
el schema proporcionado.

La propiedad:

detected_question_numbers

debe contener TODOS los números de preguntas detectados.

Ejemplo:

{
  "document_validation": {
    "is_valid": true,
    "detected_subject": "${subject}",
    "detected_session": "${session}",
    "document_type": "${documentMode}",
    "is_compatible": true,
    "confidence": 0.95,
    "reason": "El documento corresponde al material solicitado."
  },
  "detected_question_numbers": [1, 2, 3, 4, 5]
}

IMPORTANTE:

No devuelvas solamente una muestra de preguntas.

Debes recorrer TODO el PDF antes de responder.
`;
}

function buildPrompt(
  subject: Subject,
  session: string,
  documentMode: DocumentMode,
  questionNumbers?: number[]
): string {
  const questionScope =
    questionNumbers &&
    questionNumbers.length > 0
      ? `
==================================================
PREGUNTAS ASIGNADAS PARA ESTE LOTE
==================================================

Debes analizar ÚNICAMENTE las preguntas cuyos números
aparezcan en la siguiente lista:

${questionNumbers.join(", ")}

IMPORTANTE:

- No analices preguntas fuera de esta lista.
- No inventes números de pregunta.
- Si alguno de estos números no corresponde a una pregunta
  real del PDF, no lo inventes.
- Devuelve perfiles únicamente para las preguntas reales
  que puedas identificar dentro de este lote.
`
      : `
==================================================
ALCANCE DEL ANÁLISIS
==================================================

No se proporcionó un lote específico de preguntas.

Analiza las preguntas correspondientes a la materia y sesión
seleccionadas según las reglas del documento.
`;

  return `
Eres el sistema de análisis pedagógico de PeakScore.

${questionScope}

PeakScore es una plataforma educativa colombiana
de preparación para las pruebas ICFES.

El PDF que recibes es ÚNICAMENTE MATERIAL DE REFERENCIA.

==================================================
REGLAS ABSOLUTAS
==================================================

NO conviertas las preguntas originales en contenido
público del banco de PeakScore.

NO copies preguntas.

NO parafrasees preguntas específicas.

NO reproduzcas preguntas completas.

NO reproduzcas opciones completas.

NO reproduzcas respuestas originales.

NO reproduzcas explicaciones originales.

NO reproduzcas textos largos del PDF.

NO describas cómo reconstruir una pregunta específica.

El objetivo es obtener características pedagógicas
generales para posteriormente generar preguntas
completamente nuevas y originales.

==================================================
DATOS ADMINISTRATIVOS
==================================================

Materia seleccionada por el administrador:

"${subject}"

Sesión seleccionada:

"${session}"

Tipo de documento seleccionado por el administrador:

"${documentMode}"

Significado del tipo de documento:

- "mixed":
  El PDF puede contener varias materias, secciones o bloques.
  Debes identificar y analizar ÚNICAMENTE las preguntas que
  correspondan a la materia seleccionada.

- "single_subject":
  El PDF corresponde exclusivamente a una sola materia.
  Debes identificar TODAS las preguntas reales de esa materia
  que aparezcan en el documento.

Materias permitidas:

- Matemáticas
- Lectura Crítica
- Sociales y Ciudadanas
- Ciencias Naturales
- Inglés

==================================================
FASE 1 — VALIDACIÓN DEL DOCUMENTO
==================================================

Antes de analizar preguntas debes determinar:

1. Qué tipo de documento es.
2. Qué prueba parece representar.
3. Qué materia contiene realmente.
4. Qué sesión contiene realmente, si puede determinarse.
5. Si es compatible con la materia seleccionada.
6. Si es compatible con la sesión seleccionada.
7. Qué nivel de confianza tienes.

IMPORTANTE:

La materia seleccionada por el administrador NO significa
que el PDF pertenezca automáticamente a esa materia.

Debes identificar la materia REAL del documento.

Si el documento pertenece claramente a otra materia,
is_compatible debe ser false.

Si no puedes determinar la materia con suficiente
confianza, is_compatible debe ser false.

Si no puedes determinar la sesión con suficiente confianza,
is_compatible debe ser false.

La sesión puede aparecer como "1", "2", "Primera Sesión",
"Segunda Sesión", "Sesión 1", "Sesión 2" u otra variante.

Debes normalizar conceptualmente esas variantes a "1" o "2".

No inventes información.

==================================================
FASE 2 — DETECCIÓN DE PREGUNTAS
==================================================

Identifica únicamente preguntas que realmente aparezcan
en el documento.

MUY IMPORTANTE:

El PDF puede contener una prueba completa, varias materias,
varias sesiones o contenido que NO corresponde a la selección
realizada en PeakScore.

El comportamiento depende estrictamente del tipo de documento
seleccionado por el administrador.

SI documentMode ES "mixed":

La lista "questions" debe contener ÚNICAMENTE las preguntas
que pertenezcan a:

1. la materia seleccionada: "${subject}"
2. la sesión seleccionada: "${session}"

Debes excluir preguntas pertenecientes a otras materias.

--------------------------------------------------

SI documentMode ES "single_subject":

El PDF representa exclusivamente la materia:

"${subject}"

Debes detectar TODAS las preguntas reales pertenecientes a
esa materia que aparezcan en TODO el PDF.

NO limites artificialmente la cantidad de preguntas.

Si el PDF contiene:

10 preguntas → detecta las 10.

25 preguntas → detecta las 25.

100 preguntas → detecta las 100.

290 preguntas → el objetivo es detectar las 290 preguntas
reales que aparezcan en el documento.

NO detengas el análisis en 25 preguntas.

NO asumas que un documento de referencia debe contener la
misma cantidad de preguntas que un simulacro ICFES.

La cantidad de preguntas almacenadas depende de las preguntas
reales detectadas en el PDF.

Si el PDF contiene preguntas de otras materias, EXCLÚYELAS.

Si el PDF contiene preguntas de otra sesión, EXCLÚYELAS.

Si el PDF contiene una prueba completa, debes localizar primero
la sección correspondiente a la materia y sesión seleccionadas
y analizar solamente esas preguntas.

No uses solamente el nombre del archivo para decidir esto.

Usa el contenido, encabezados, numeración, estructura y contexto
del documento.

Cuenta únicamente las preguntas que realmente pertenecen a la
materia Y sesión seleccionadas.

Si no puedes identificar de forma confiable la sección
correspondiente, devuelve "is_compatible": false y no inventes
preguntas.

Cada elemento de "questions" representa una pregunta real detectada
únicamente mediante su perfil pedagógico.

NO devuelvas el texto original de la pregunta.

NO devuelvas las opciones.

NO devuelvas la respuesta.

NO devuelvas explicaciones originales.

Puedes indicar el número de pregunta si es identificable.

==================================================
FASE 3 — ANÁLISIS PEDAGÓGICO
==================================================

Para cada pregunta identifica:

- materia
- tema
- componente
- competencia
- habilidad
- dificultad
- tipo de razonamiento
- estructura
- contexto
- estrategia de distractores
- complejidad de información
- necesidad de elementos visuales
- tipo de elemento visual
- características pedagógicas

La dificultad debe ser:

"Fácil"

"Media"

"Difícil"

==================================================
RAZONAMIENTO
==================================================

Considera patrones como:

- interpretación
- inferencia
- comparación
- cálculo
- modelación
- análisis
- evaluación
- argumentación
- resolución de problemas
- identificación
- aplicación
- razonamiento proporcional
- razonamiento probabilístico

==================================================
ESTRUCTURAS
==================================================

Considera:

- selección múltiple con contexto
- selección múltiple directa
- situación problema
- problema cuantitativo
- interpretación de gráfica
- análisis de texto
- experimento
- caso ciudadano
- comparación de información
- análisis de tabla
- análisis de datos

Describe estructuras de manera GENERAL.

==================================================
DISTRACTORES
==================================================

Analiza patrones generales como:

- error de cálculo
- confusión conceptual
- interpretación parcial
- lectura superficial
- inversión de relación
- aplicación incorrecta de fórmula
- conclusión plausible pero incorrecta
- confusión entre conceptos

NO copies opciones originales.

==================================================
CONTEXTO
==================================================

Identifica contextos generales:

- cotidiano
- científico
- académico
- social
- ciudadano
- ambiental
- económico
- histórico
- tecnológico

NO reproduzcas textos originales.

==================================================
ELEMENTOS VISUALES
==================================================

Determina si se utilizan:

- imágenes
- gráficas
- tablas
- mapas
- diagramas
- caricaturas
- esquemas
- figuras
- infografías

Describe solamente sus características generales.

==================================================
ANÁLISIS GENERAL
==================================================

Genera:

summary
difficulty_profile
topic_profile
competence_profile
reasoning_profile
structure_profile
context_profile
generation_guidelines

generation_guidelines debe explicar cómo crear
preguntas NUEVAS Y ORIGINALES basadas en los patrones
pedagógicos encontrados.

NO incluyas instrucciones para copiar o modificar
preguntas específicas.

==================================================
FORMATO
==================================================

Devuelve EXCLUSIVAMENTE JSON válido.

La estructura debe ser:

{
  "document_validation": {
    "is_valid": true,
    "detected_subject": "Matemáticas",
    "detected_session": "1",
    "document_type": "Prueba Saber 11",
    "is_compatible": true,
    "confidence": 0.95,
    "reason": "..."
  },

  "analysis": {
    "summary": "...",
    "difficulty_profile": "...",
    "topic_profile": "...",
    "competence_profile": "...",
    "reasoning_profile": "...",
    "structure_profile": "...",
    "context_profile": "...",
    "generation_guidelines": "..."
  },

  "questions": [
    {
      "question_number": 1,
      "subject": "Matemáticas",
      "topic": "...",
      "component": "...",
      "competence": "...",
      "skill": "...",
      "difficulty": "Media",
      "reasoning_type": "...",
      "structure_type": "...",
      "context_type": "...",
      "distractor_strategy": "...",
      "information_complexity": "...",
      "requires_visual": false,
      "visual_description": null,
      "analysis_notes": "..."
    }
  ]
}

IMPORTANTE:

Analiza TODO el PDF antes de responder.

No inventes preguntas.

No inventes números de pregunta.

No inventes materia.

No inventes sesión.

No reproduzcas contenido original.
`;
}

/* =========================================================
   SCHEMA GEMINI
========================================================= */

const responseSchema = {
  type: "object",

  properties: {
    document_validation: {
      type: "object",

      properties: {
        is_valid: {
          type: "boolean",
        },

        detected_subject: {
          type: "string",
          enum: [...VALID_SUBJECTS],
          nullable: true,
        },

        detected_session: {
          type: "string",
          nullable: true,
        },

        document_type: {
          type: "string",
        },

        is_compatible: {
          type: "boolean",
        },

        confidence: {
          type: "number",
        },

        reason: {
          type: "string",
        },
      },

      required: [
        "is_valid",
        "detected_subject",
        "detected_session",
        "document_type",
        "is_compatible",
        "confidence",
        "reason",
      ],
    },

    analysis: {
      type: "object",

      properties: {
        summary: {
          type: "string",
        },

        difficulty_profile: {
          type: "string",
        },

        topic_profile: {
          type: "string",
        },

        competence_profile: {
          type: "string",
        },

        reasoning_profile: {
          type: "string",
        },

        structure_profile: {
          type: "string",
        },

        context_profile: {
          type: "string",
        },

        generation_guidelines: {
          type: "string",
        },
      },

      required: [
        "summary",
        "difficulty_profile",
        "topic_profile",
        "competence_profile",
        "reasoning_profile",
        "structure_profile",
        "context_profile",
        "generation_guidelines",
      ],
    },

    questions: {
      type: "array",

      items: {
        type: "object",

        properties: {
          question_number: {
            type: "number",
            nullable: true,
          },

          subject: {
            type: "string",
            enum: [...VALID_SUBJECTS],
          },

          topic: {
            type: "string",
          },

          component: {
            type: "string",
          },

          competence: {
            type: "string",
          },

          skill: {
            type: "string",
          },

          difficulty: {
            type: "string",
            enum: [...VALID_DIFFICULTIES],
          },

          reasoning_type: {
            type: "string",
          },

          structure_type: {
            type: "string",
          },

          context_type: {
            type: "string",
          },

          distractor_strategy: {
            type: "string",
          },

          information_complexity: {
            type: "string",
          },

          requires_visual: {
            type: "boolean",
          },

          visual_description: {
            type: "string",
            nullable: true,
          },

          analysis_notes: {
            type: "string",
          },
        },

        required: [
          "question_number",
          "subject",
          "topic",
          "component",
          "competence",
          "skill",
          "difficulty",
          "reasoning_type",
          "structure_type",
          "context_type",
          "distractor_strategy",
          "information_complexity",
          "requires_visual",
          "visual_description",
          "analysis_notes",
        ],
      },
    },
  },

  required: [
    "document_validation",
    "analysis",
    "questions",
  ],
};

/* =========================================================
   SCHEMA GEMINI - DETECCIÓN DE PREGUNTAS
========================================================= */

const questionDetectionSchema = {
  type: "object",

  properties: {
    document_validation: {
      type: "object",

      properties: {
        is_valid: {
          type: "boolean",
        },

        detected_subject: {
          type: "string",
          enum: [...VALID_SUBJECTS],
          nullable: true,
        },

        detected_session: {
          type: "string",
          nullable: true,
        },

        document_type: {
          type: "string",
        },

        is_compatible: {
          type: "boolean",
        },

        confidence: {
          type: "number",
        },

        reason: {
          type: "string",
        },
      },

      required: [
        "is_valid",
        "detected_subject",
        "detected_session",
        "document_type",
        "is_compatible",
        "confidence",
        "reason",
      ],
    },

    detected_question_numbers: {
      type: "array",

      items: {
        type: "number",
      },
    },
  },

  required: [
    "document_validation",
    "detected_question_numbers",
  ],
};

/* =========================================================
   LLAMADA A GEMINI
========================================================= */

async function detectQuestionsWithGemini(
  extractedPdfText: string,
  subject: string,
  session: string,
  documentMode: string
): Promise<{
  result: GeminiQuestionDetectionResult;
  model: string;
}> {
  if (!extractedPdfText.trim()) {
    throw new Error(
      "No hay texto extraíble disponible para detectar preguntas."
    );
  }

  const detectionPrompt =
    buildQuestionDetectionPrompt(
      subject,
      session,
      documentMode
    );

  const prompt = `
${detectionPrompt}

=========================================================
CONTENIDO EXTRAÍDO LOCALMENTE DEL PDF
=========================================================

A continuación recibirás el texto extraído localmente del PDF.

IMPORTANTE:

- Analiza únicamente el contenido proporcionado.
- Detecta TODOS los números de preguntas reales que puedas identificar.
- No inventes números de preguntas.
- No devuelvas una muestra.
- Ignora números que claramente correspondan a páginas,
  años, tablas, instrucciones u otros elementos que no sean
  preguntas.
- Devuelve únicamente JSON válido.
- Respeta exactamente la estructura solicitada.

=========================================================
TEXTO DEL DOCUMENTO
=========================================================

${extractedPdfText}
`;

  for (const model of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= MAX_RETRIES_PER_MODEL;
      attempt++
    ) {
      try {
        console.log(
          `Detección local → modelo=${model} intento=${attempt}/${MAX_RETRIES_PER_MODEL}`
        );

        const response =
          await ai.models.generateContent({
            model,

            contents: [
              {
                text: prompt,
              },
            ],

            config: {
              responseMimeType:
                "application/json",

              responseSchema:
                questionDetectionSchema,
            },
          });

        const text = response.text;

        if (!text) {
          throw new Error(
            "Gemini no devolvió ninguna respuesta durante la detección."
          );
        }

        let result:
          GeminiQuestionDetectionResult;

        try {
          result = JSON.parse(text);
        } catch {
          console.error(
            "Respuesta inválida durante detección:",
            text.slice(0, 2000)
          );

          throw new Error(
            "Gemini devolvió JSON inválido durante la detección."
          );
        }

        if (
          !result ||
          typeof result !== "object" ||
          !result.document_validation ||
          !Array.isArray(
            result.detected_question_numbers
          )
        ) {
          throw new Error(
            "Gemini no devolvió una estructura válida durante la detección."
          );
        }

        result.detected_question_numbers = [
          ...new Set(
            result.detected_question_numbers
              .filter(
                (questionNumber) =>
                  typeof questionNumber === "number" &&
                  Number.isFinite(questionNumber) &&
                  questionNumber > 0
              )
              .map(
                (questionNumber) =>
                  Math.floor(questionNumber)
              )
          ),
        ].sort((a, b) => a - b);

        console.log(
          `Detección completada usando ${model}.`
        );

        console.log(
          `Total detectado: ${result.detected_question_numbers.length}`
        );

        console.log(
          "Preguntas detectadas:",
          result.detected_question_numbers
        );

        return {
          result,
          model,
        };
      } catch (error) {
        console.error(
          `Detección error → modelo=${model} intento=${attempt}`,
          getGeminiErrorMessage(error)
        );

        if (
          !isTemporaryGeminiError(error)
        ) {
          throw error;
        }

        if (
          attempt <
          MAX_RETRIES_PER_MODEL
        ) {
          const delay =
            attempt === 1
              ? 3000
              : 7000;

          await sleep(delay);
        }
      }
    }
  }

  throw new Error(
    "El servicio de IA está temporalmente no disponible para detectar las preguntas."
  );
}

async function detectQuestionsWithGroq(
  extractedPdfText: string,
  subject: string,
  session: string,
  documentMode: string
): Promise<{
  result: GeminiQuestionDetectionResult;
  model: string;
}> {
  if (!extractedPdfText.trim()) {
    throw new Error(
      "No hay texto extraíble disponible para usar Groq durante la detección."
    );
  }

  console.log(
    "Groq fallback → iniciando detección de preguntas."
  );

  const chunks = splitTextIntoChunks(
    extractedPdfText,
    3000
  );

  if (chunks.length === 0) {
    throw new Error(
      "No fue posible dividir el texto del PDF para analizarlo con Groq."
    );
  }

  console.log(
    `Texto dividido en ${chunks.length} fragmentos para Groq.`
  );

  const allQuestionNumbers: number[] = [];

  let documentValidation:
    | GeminiQuestionDetectionResult["document_validation"]
    | null = null;

  const detectionPrompt = buildQuestionDetectionPrompt(
    subject,
    session,
    documentMode
  );

  for (
    let index = 0;
    index < chunks.length;
    index++
  ) {
    const chunk = chunks[index];

    console.log(
      `Groq → analizando fragmento ${index + 1}/${chunks.length}.`
    );

    const groqPrompt = `
${detectionPrompt}

=========================================================
FRAGMENTO DEL PDF
=========================================================

Estás analizando únicamente una parte del PDF completo.

Este es el fragmento:

${index + 1} de ${chunks.length}

IMPORTANTE:

- Analiza únicamente la información presente en este fragmento.
- Identifica números de preguntas reales que aparezcan aquí.
- NO inventes números.
- Si una pregunta parece continuar en otro fragmento, no inventes información.
- Es normal que algunos fragmentos no contengan preguntas.
- Devuelve únicamente JSON válido.
- Mantén exactamente la estructura JSON solicitada.

=========================================================
TEXTO DEL FRAGMENTO
=========================================================

${chunk}
`;

    try {
      const response = await generateAI({
        prompt: groqPrompt,
        provider: "groq",
        useFallback: false,
      });

      const text = response.text;

      if (!text) {
        console.warn(
          `Groq no devolvió respuesta para el fragmento ${index + 1}.`
        );

        continue;
      }

      let chunkResult: GeminiQuestionDetectionResult;

      try {
        chunkResult = JSON.parse(text);
      } catch {
        console.warn(
          `Groq devolvió JSON inválido en el fragmento ${index + 1}:`,
          text.slice(0, 1000)
        );

        continue;
      }

      if (
        !chunkResult ||
        typeof chunkResult !== "object"
      ) {
        continue;
      }

      if (
        !documentValidation &&
        chunkResult.document_validation
      ) {
        documentValidation =
          chunkResult.document_validation;
      }

      if (
        Array.isArray(
          chunkResult.detected_question_numbers
        )
      ) {
        const validNumbers =
          chunkResult.detected_question_numbers
            .filter(
              (questionNumber) =>
                typeof questionNumber === "number" &&
                Number.isFinite(questionNumber) &&
                questionNumber > 0
            )
            .map((questionNumber) =>
              Math.floor(questionNumber)
            );

        allQuestionNumbers.push(
          ...validNumbers
        );
      }

      console.log(
        `Fragmento ${index + 1} completado.`
      );
    } catch (error) {
      console.error(
        `Groq falló analizando el fragmento ${index + 1}:`,
        error
      );
    }
  }

  const detectedQuestionNumbers = [
    ...new Set(allQuestionNumbers),
  ].sort((a, b) => a - b);

  if (!documentValidation) {
    throw new Error(
      "Groq no pudo validar correctamente el documento."
    );
  }

  if (detectedQuestionNumbers.length === 0) {
    throw new Error(
      "Groq no pudo detectar preguntas válidas en el PDF."
    );
  }

  const result: GeminiQuestionDetectionResult = {
    document_validation: documentValidation,
    detected_question_numbers: detectedQuestionNumbers,
  };

  console.log(
    "Detección completada usando Groq."
  );

  console.log(
    `Total detectado: ${detectedQuestionNumbers.length}`
  );

  console.log(
    "Preguntas detectadas:",
    detectedQuestionNumbers
  );

  return {
    result,
    model: "openai/gpt-oss-20b",
  };
}

async function analyzePdfWithGemini(
  batchText: string,
  subject: Subject,
  session: string,
  documentMode: DocumentMode,
  questionNumbers?: number[]
): Promise<{
  result: GeminiResult;
  model: string;
}> {
  if (!batchText.trim()) {
    throw new Error(
      "No hay texto disponible para analizar este lote."
    );
  }

  const basePrompt = buildPrompt(
    subject,
    session,
    documentMode,
    questionNumbers
  );

  const prompt = `
${basePrompt}

=========================================================
CONTENIDO DEL LOTE EXTRAÍDO LOCALMENTE
=========================================================

A continuación recibirás únicamente el contenido textual
correspondiente al lote de preguntas solicitado.

IMPORTANTE:

- Analiza únicamente las preguntas solicitadas.
- No inventes preguntas ni información.
- Si alguna pregunta solicitada no está presente o no puede
  reconstruirse correctamente con el texto recibido, no la inventes.
- Respeta los números originales de las preguntas.
- Devuelve únicamente la estructura JSON solicitada.

=========================================================
TEXTO DEL LOTE
=========================================================

${batchText}
`;

  for (const model of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= MAX_RETRIES_PER_MODEL;
      attempt++
    ) {
      try {
        console.log(
          `Gemini → modelo=${model} intento=${attempt}/${MAX_RETRIES_PER_MODEL}`
        );

        const response =
          await ai.models.generateContent({
            model,

            contents: [
              {
                text: prompt,
              },
            ],

            config: {
              responseMimeType:
                "application/json",

              responseSchema,
            },
          });

        const text =
          response.text;

        if (!text) {
          throw new Error(
            "Gemini no devolvió ninguna respuesta."
          );
        }

        let result: GeminiResult;

        try {
          result = JSON.parse(text);
        } catch {
          console.error(
            "Respuesta inválida de Gemini:",
            text.slice(0, 2000)
          );

          throw new Error(
            "Gemini devolvió JSON inválido."
          );
        }

        if (
          !result ||
          typeof result !== "object" ||
          !result.document_validation ||
          !result.analysis ||
          !Array.isArray(result.questions)
        ) {
          throw new Error(
            "Gemini no devolvió una estructura válida."
          );
        }

        console.log(
          `Gemini respondió correctamente usando ${model}.`
        );

        return {
          result,
          model,
        };
      } catch (error) {
        console.error(
          `Gemini error → modelo=${model} intento=${attempt}`,
          getGeminiErrorMessage(error)
        );

        if (
          !isTemporaryGeminiError(error)
        ) {
          throw error;
        }

        if (
          attempt < MAX_RETRIES_PER_MODEL
        ) {
          const delay =
            attempt === 1
              ? 3000
              : 7000;

          await sleep(delay);
        }
      }
    }
  }

  throw new Error(
    "El servicio de IA está temporalmente no disponible."
  );
}

async function analyzePdfWithGroq(
  extractedPdfText: string,
  subject: Subject,
  session: string,
  documentMode: DocumentMode,
  questionNumbers: number[]
): Promise<{
  result: GeminiResult;
  model: string;
}> {
  if (!extractedPdfText.trim()) {
    throw new Error(
      "No hay texto extraíble disponible para usar Groq como fallback."
    );
  }

  const prompt = buildPrompt(
    subject,
    session,
    documentMode,
    questionNumbers
  );

  const groqPrompt = `
${prompt}

==================================================
CONTENIDO EXTRAÍDO DEL PDF
==================================================

A continuación recibirás el texto extraído del PDF
de referencia.

Analiza ÚNICAMENTE las preguntas cuyos números están
incluidos en el lote solicitado.

IMPORTANTE:

No inventes preguntas.

No inventes números.

No analices preguntas fuera del lote.

NÚMEROS DEL LOTE:

${questionNumbers.join(", ")}

==================================================
TEXTO DEL PDF
==================================================

${extractedPdfText}
`;

  console.log(
    `Groq fallback → analizando ${questionNumbers.length} preguntas.`
  );

  const response = await generateAI({
    prompt: groqPrompt,
    provider: "groq",
    useFallback: false,
  });

  const text = response.text;

  if (!text) {
    throw new Error(
      "Groq no devolvió ninguna respuesta."
    );
  }

  let result: GeminiResult;

  try {
    result = JSON.parse(text);
  } catch {
    console.error(
      "Respuesta inválida de Groq:",
      text.slice(0, 2000)
    );

    throw new Error(
      "Groq devolvió JSON inválido."
    );
  }

  if (
    !result ||
    typeof result !== "object" ||
    !result.document_validation ||
    !result.analysis ||
    !Array.isArray(result.questions)
  ) {
    throw new Error(
      "Groq no devolvió una estructura válida."
    );
  }

  console.log(
    "Groq respondió correctamente."
  );

  return {
    result,
    model: "openai/gpt-oss-20b",
  };
}

/* =========================================================
   VALIDAR RESPUESTA
========================================================= */

function validateGeminiResult(
  result: GeminiResult,
  selectedSubject: Subject,
  selectedSession: string
): {
  validQuestions: GeminiQuestionProfile[];
  invalidQuestions: number;
} {
  const validation =
    result.document_validation;

  if (
    !validation ||
    typeof validation !== "object"
  ) {
    throw new Error(
      "Gemini no devolvió la validación del documento."
    );
  }

  if (
    typeof validation.is_valid !==
    "boolean"
  ) {
    throw new Error(
      "La validación del documento es inválida."
    );
  }

  if (
    !isValidConfidence(
      validation.confidence
    )
  ) {
    throw new Error(
      "La confianza del análisis de Gemini es inválida."
    );
  }

  if (
    !validation.is_valid ||
    !validation.is_compatible
  ) {
    throw new Error(
      `PDF incompatible.

Materia seleccionada:
${selectedSubject}

Sesión seleccionada:
${selectedSession}

Materia detectada:
${validation.detected_subject ?? "No determinada"}

Sesión detectada:
${validation.detected_session ?? "No determinada"}

Motivo:
${validation.reason}`
    );
  }

  if (
    validation.detected_subject !==
    selectedSubject
  ) {
    throw new Error(
      `La materia detectada no coincide.

Seleccionada:
${selectedSubject}

Detectada:
${validation.detected_subject ?? "No determinada"}`
    );
  }

  const normalizedSelectedSession =
    normalizeSession(
      selectedSession
    );

  const normalizedDetectedSession =
    normalizeSession(
      validation.detected_session
    );

  if (!normalizedSelectedSession) {
    throw new Error(
      `La sesión seleccionada no es válida: ${selectedSession}`
    );
  }

  if (!normalizedDetectedSession) {
    throw new Error(
      `No se pudo determinar con suficiente confianza la sesión del PDF.

Seleccionada:
${selectedSession}

Detectada:
${validation.detected_session ?? "No determinada"}`
    );
  }

  if (
    normalizedDetectedSession !==
    normalizedSelectedSession
  ) {
    throw new Error(
      `La sesión detectada no coincide.

Seleccionada:
${selectedSession}

Detectada:
${validation.detected_session}`
    );
  }

  const requiredAnalysisFields = [
    "summary",
    "difficulty_profile",
    "topic_profile",
    "competence_profile",
    "reasoning_profile",
    "structure_profile",
    "context_profile",
    "generation_guidelines",
  ] as const;

  for (
    const field of requiredAnalysisFields
  ) {
    if (
      typeof result.analysis[field] !==
        "string" ||
      !result.analysis[field].trim()
    ) {
      throw new Error(
        `El análisis no contiene "${field}" correctamente.`
      );
    }
  }

  let invalidQuestions = 0;

  const validQuestions =
    result.questions.filter(
      (
        question
      ): question is GeminiQuestionProfile => {
        if (
          !question ||
          typeof question !== "object"
        ) {
          invalidQuestions++;
          return false;
        }

        if (
          !isValidSubject(
            question.subject
          )
        ) {
          invalidQuestions++;
          return false;
        }

        if (
          !isValidDifficulty(
            question.difficulty
          )
        ) {
          invalidQuestions++;
          return false;
        }

        if (
          question.subject !==
          selectedSubject
        ) {
          invalidQuestions++;
          return false;
        }

        const requiredFields = [
          "topic",
          "component",
          "competence",
          "skill",
          "reasoning_type",
          "structure_type",
          "context_type",
          "distractor_strategy",
          "information_complexity",
          "analysis_notes",
        ] as const;

        for (
          const field of requiredFields
        ) {
          if (
            typeof question[field] !==
              "string" ||
            !question[field].trim()
          ) {
            invalidQuestions++;
            return false;
          }
        }

        if (
          typeof question.requires_visual !==
          "boolean"
        ) {
          invalidQuestions++;
          return false;
        }

        if (
          question.requires_visual &&
          (
            typeof question.visual_description !==
              "string" ||
            !question.visual_description.trim()
          )
        ) {
          invalidQuestions++;
          return false;
        }

        return true;
      }
    );

  return {
    validQuestions,
    invalidQuestions,
  };
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  req: Request
) {
  let supabase:
    | Awaited<
        ReturnType<typeof createServerClient>
      >
    | null = null;

  let referenceSourceId:
    | string
    | null = null;

  let storagePath:
    | string
    | null = null;

  try {
    /* =====================================================
       1. SUPABASE
    ===================================================== */

    supabase =
      await createServerClient();

    /* =====================================================
       2. AUTENTICACIÓN
    ===================================================== */

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       3. VERIFICAR ADMIN
    ===================================================== */

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Error verificando rol:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudieron verificar tus permisos.",
        },
        { status: 500 }
      );
    }

    if (
      profile?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No tienes permisos para importar PDFs.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       4. GEMINI KEY
    ===================================================== */

    if (
      !process.env.GEMINI_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No está configurada la GEMINI_API_KEY en .env.local",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       5. FORM DATA
    ===================================================== */

    const formData =
      await req.formData();

    const file =
      formData.get("file");

    const subject =
      formData.get("subject");

    const session =
      formData.get("session");

    const documentMode =
      formData.get("documentMode");

    /* =====================================================
       6. VALIDACIONES
    ===================================================== */

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se recibió un archivo válido.",
        },
        { status: 400 }
      );
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El archivo debe ser un PDF.",
        },
        { status: 400 }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El PDF no puede superar los 30 MB.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidSubject(subject)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Materia no válida.",
        },
        { status: 400 }
      );
    }

    if (
      session !== "1" &&
      session !== "2"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sesión no válida.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidDocumentMode(documentMode)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de documento no válido.",
        },
        { status: 400 }
      );
    }

    const selectedSubject =
      subject;

    const selectedSession =
      session;

    const selectedDocumentMode =
      documentMode;

    /* =====================================================
       7. LOG
    ===================================================== */

    console.log(
      "=========================================="
    );

    console.log(
      "PEAKSCORE PDF REFERENCE IMPORT"
    );

    console.log(
      "Usuario:",
      user.id
    );

    console.log(
      "Archivo:",
      file.name
    );

    console.log(
      "Materia:",
      selectedSubject
    );

    console.log(
      "Sesión:",
      selectedSession
    );

    /* =====================================================
       8. CONVERTIR PDF
    ===================================================== */

    const arrayBuffer =
      await file.arrayBuffer();

    const base64Pdf =
      Buffer.from(
        arrayBuffer
      ).toString("base64");

    const pdfBuffer =
      Buffer.from(arrayBuffer);

    /* =====================================================
       8.0 IDENTIFICAR PDF POR HASH
    ===================================================== */

    const fileHash =
      crypto
        .createHash("sha256")
        .update(pdfBuffer)
        .digest("hex");

    console.log(
      `[Import PDF] Hash SHA-256: ${fileHash}`
    );

    const {
      data: existingReferenceSource,
      error: existingReferenceSourceError,
    } =
      await supabase
        .from("reference_sources")
        .select(
          `
            id,
            file_name,
            storage_path,
            status,
            total_questions
          `
        )
        .eq(
          "file_hash",
          fileHash
        )
        .maybeSingle();

    if (
      existingReferenceSourceError
    ) {
      throw new Error(
        `No se pudo verificar si este PDF ya fue importado: ${existingReferenceSourceError.message}`
      );
    }

    /* =====================================================
       PDF YA ANALIZADO
    ===================================================== */

    if (
      existingReferenceSource &&
      existingReferenceSource.status ===
        "analyzed"
    ) {
      return NextResponse.json({
        success: true,

        already_processed: true,

        message:
          "Este PDF ya fue procesado anteriormente. No se volvió a analizar para evitar duplicados.",

        data: {
          reference_source_id:
            existingReferenceSource.id,

          file_name:
            existingReferenceSource.file_name,

          status:
            existingReferenceSource.status,

          total_questions:
            existingReferenceSource.total_questions,
        },
      });
    }

    /* =====================================================
       PDF EN PROCESAMIENTO
    ===================================================== */

    if (
      existingReferenceSource &&
      existingReferenceSource.status ===
        "processing"
    ) {
      return NextResponse.json(
        {
          success: false,

          already_processing: true,

          error:
            "Este PDF ya tiene un procesamiento en curso. Espera a que termine antes de volver a intentarlo.",

          data: {
            reference_source_id:
              existingReferenceSource.id,

            file_name:
              existingReferenceSource.file_name,

            status:
              existingReferenceSource.status,
          },
        },
        {
          status: 409,
        }
      );
    }


    /* =====================================================
       8.1 EXTRACCIÓN LOCAL POR PÁGINAS
    ===================================================== */

    const pdfExtraction =
      await extractPdfPages(pdfBuffer);

    console.log(
      `[Import PDF] PDF analizado localmente: ${pdfExtraction.totalPages} páginas.`
    );

    console.log(
      `[Import PDF] Caracteres extraídos: ${pdfExtraction.totalCharacters}`
    );

    console.log(
      `[Import PDF] Tiene texto extraíble: ${pdfExtraction.hasExtractableText}`
    );

    for (const page of pdfExtraction.pages) {
      console.log(
        `[Import PDF] Página ${page.pageNumber}: ${page.text.length} caracteres`
      );
    }

    /* =====================================================
       CONSTRUIR TEXTO EXTRAÍDO DEL DOCUMENTO
    ===================================================== */

    const extractedPdfText =
      pdfExtraction.pages
        .map((page) => {
          if (!page.text.trim()) {
            return "";
          }

          return `
    [PÁGINA ${page.pageNumber}]

    ${page.text}
    `;
        })
        .filter(Boolean)
        .join("\n")
        .trim();

    console.log(
      `[Import PDF] Texto consolidado: ${extractedPdfText.length} caracteres.`
    );
    /* =====================================================
       9. NOMBRE SEGURO
    ===================================================== */

    const safeFileName =
      file.name
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-zA-Z0-9.-]/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        );

    storagePath =
      `${user.id}/${Date.now()}-${safeFileName}`;

    /* =====================================================
       10. REUTILIZAR O SUBIR PDF
    ===================================================== */

    if (
      existingReferenceSource &&
      existingReferenceSource.status ===
        "failed"
    ) {
      console.log(
        `[Import PDF] Reintentando PDF fallido: ${existingReferenceSource.id}`
      );

      const {
        data: retriedReferenceSource,
        error: retryError,
      } =
        await supabase
          .from("reference_sources")
          .update({
            status:
              "processing",
          })
          .eq(
            "id",
            existingReferenceSource.id
          )
          .select("*")
          .single();

      if (
        retryError ||
        !retriedReferenceSource
      ) {
        throw new Error(
          retryError?.message ||
            "No se pudo reiniciar el procesamiento del PDF."
        );
      }

      referenceSourceId =
        retriedReferenceSource.id;

      storagePath =
        retriedReferenceSource.storage_path;

      console.log(
        `[Import PDF] Reutilizando Reference Source: ${referenceSourceId}`
      );
    } else {
      /* =====================================================
         10.1 SUBIR PDF NUEVO
      ===================================================== */

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("reference-pdfs")
          .upload(
            storagePath,
            file,
            {
              contentType:
                "application/pdf",
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `No se pudo guardar el PDF: ${uploadError.message}`
        );
      }

      /* =====================================================
         11. CREAR REFERENCE SOURCE
      ===================================================== */

      const {
        data: referenceSource,
        error:
          referenceSourceError,
      } =
        await supabase
          .from("reference_sources")
          .insert({
            file_name:
              file.name,

            file_hash:
              fileHash,

            storage_path:
              storagePath,

            subject:
              selectedSubject,

            session:
              selectedSession,

            uploaded_by:
              user.id,

            status:
              "processing",

            total_questions:
              0,
          })
          .select("*")
          .single();

      if (
        referenceSourceError ||
        !referenceSource
      ) {
        await supabase.storage
          .from("reference-pdfs")
          .remove([
            storagePath,
          ]);

        throw new Error(
          referenceSourceError?.message ||
            "No se pudo crear la fuente de referencia."
        );
      }

      referenceSourceId =
        referenceSource.id;
    }

    /* =====================================================
       12. ANALIZAR CON GEMINI
    ===================================================== */
    
    let questionDetection: GeminiQuestionDetectionResult;
    let detectionModel: string;

    try {
      const detection =
        await detectQuestionsWithGemini(
          extractedPdfText,
          selectedSubject,
          selectedSession,
          selectedDocumentMode
        );

      questionDetection =
        detection.result;

      detectionModel =
        detection.model;
    } catch (geminiError) {
      console.error(
        "Gemini falló durante la detección. Intentando Groq:",
        getGeminiErrorMessage(geminiError)
      );

      const detection =
        await detectQuestionsWithGroq(
          extractedPdfText,
          selectedSubject,
          selectedSession,
          selectedDocumentMode
        );

      questionDetection =
        detection.result;

      detectionModel =
        detection.model;
    }

    const detectedQuestionNumbers =
      questionDetection.detected_question_numbers;

    if (
      detectedQuestionNumbers.length === 0
    ) {
      throw new Error(
        "No se detectaron preguntas válidas en el PDF."
      );
    }

    const QUESTIONS_PER_BATCH = 25;

    const questionBatches: number[][] = [];

    for (
      let i = 0;
      i < detectedQuestionNumbers.length;
      i += QUESTIONS_PER_BATCH
    ) {
      questionBatches.push(
        detectedQuestionNumbers.slice(
          i,
          i + QUESTIONS_PER_BATCH
        )
      );
    }

    console.log(
      `Se procesarán ${detectedQuestionNumbers.length} preguntas en ${questionBatches.length} lotes.`
    );

    console.log(
      `Detección completada: ${detectedQuestionNumbers.length} preguntas encontradas usando ${detectionModel}.`
    );

    const batchResults: GeminiResult[] = [];

    const batchModels: string[] = [];

    for (
      let batchIndex = 0;
      batchIndex < questionBatches.length;
      batchIndex++
    ) {
      const currentBatch =
        questionBatches[batchIndex];

      console.log(
        `Analizando lote ${batchIndex + 1}/${questionBatches.length}:`,
        currentBatch
      );

      const batchText =
        extractTextForQuestionBatch(
          extractedPdfText,
          currentBatch
        );

      if (!batchText.trim()) {
        throw new Error(
          `No se pudo extraer texto para el lote ${batchIndex + 1}.`
        );
      }

      console.log(
        `[Import PDF] Lote ${batchIndex + 1}: ${batchText.length} caracteres extraídos localmente.`
      );

      let batchResult: GeminiResult;

      let batchModel: string;

      try {
        const geminiResponse =
          await analyzePdfWithGemini(
            batchText,
            selectedSubject,
            selectedSession,
            selectedDocumentMode,
            currentBatch
          );

        batchResult =
          geminiResponse.result;

        batchModel =
          geminiResponse.model;
      } catch (error) {
        const errorMessage =
          getGeminiErrorMessage(error);

        const shouldUseGroqFallback =
          isTemporaryGeminiError(error) ||
          errorMessage.includes(
            "temporalmente no disponible"
          );

        if (!shouldUseGroqFallback) {
          throw error;
        }

        console.warn(
          `Gemini falló en el lote ${batchIndex + 1}. Intentando fallback con Groq...`,
          errorMessage
        );

        const groqResponse =
          await analyzePdfWithGroq(
            batchText,
            selectedSubject,
            selectedSession,
            selectedDocumentMode,
            currentBatch
          );

        batchResult =
          groqResponse.result;

        batchModel =
          groqResponse.model;
      }

      const invalidBatchQuestions =
        batchResult.questions.filter(
          (question) =>
            typeof question.question_number !==
              "number" ||
            !currentBatch.includes(
              question.question_number
            )
        );

      if (
        invalidBatchQuestions.length > 0
      ) {
        console.warn(
          `[Import PDF] ${batchModel} devolvió preguntas fuera del lote ${batchIndex + 1}. Se eliminarán del resultado.`,
          {
            expectedQuestions:
              currentBatch,

            invalidQuestions:
              invalidBatchQuestions.map(
                (question) =>
                  question.question_number
              ),
          }
        );

        batchResult.questions =
          batchResult.questions.filter(
            (question) =>
              typeof question.question_number ===
                "number" &&
              currentBatch.includes(
                question.question_number
              )
          );
      }

      const returnedQuestionNumbers =
        batchResult.questions
          .map(
            (question) =>
              question.question_number
          )
          .filter(
            (
              questionNumber
            ): questionNumber is number =>
              typeof questionNumber ===
              "number"
          );

      const missingBatchQuestions =
        currentBatch.filter(
          (questionNumber) =>
            !returnedQuestionNumbers.includes(
              questionNumber
            )
        );

      if (
        missingBatchQuestions.length > 0
      ) {
        console.warn(
          `[Import PDF] Faltan ${missingBatchQuestions.length} preguntas en el lote ${batchIndex + 1}. Intentando recuperarlas...`,
          missingBatchQuestions
        );

        const missingBatchText =
          extractTextForQuestionBatch(
            extractedPdfText,
            missingBatchQuestions
          );

        if (
          !missingBatchText.trim()
        ) {
          throw new Error(
            `No se pudo extraer texto para recuperar las preguntas faltantes del lote ${batchIndex + 1}: ${missingBatchQuestions.join(", ")}`
          );
        }

        let recoveryResult:
          GeminiResult;

        let recoveryModel:
          string;

        try {
          const geminiRecovery =
            await analyzePdfWithGemini(
              missingBatchText,
              selectedSubject,
              selectedSession,
              selectedDocumentMode,
              missingBatchQuestions
            );

          recoveryResult =
            geminiRecovery.result;

          recoveryModel =
            geminiRecovery.model;
        } catch (error) {
          const errorMessage =
            getGeminiErrorMessage(error);

          console.warn(
            `[Import PDF] Gemini falló recuperando preguntas faltantes del lote ${batchIndex + 1}. Intentando Groq...`,
            errorMessage
          );

          const groqRecovery =
            await analyzePdfWithGroq(
              missingBatchText,
              selectedSubject,
              selectedSession,
              selectedDocumentMode,
              missingBatchQuestions
            );

          recoveryResult =
            groqRecovery.result;

          recoveryModel =
            groqRecovery.model;
        }

        const validRecoveredQuestions =
          recoveryResult.questions.filter(
            (question) =>
              typeof question.question_number ===
                "number" &&
              missingBatchQuestions.includes(
                question.question_number
              )
          );

        const recoveredNumbers =
          validRecoveredQuestions.map(
            (question) =>
              question.question_number
          );

        const stillMissingQuestions =
          missingBatchQuestions.filter(
            (questionNumber) =>
              !recoveredNumbers.includes(
                questionNumber
              )
          );

        if (
          stillMissingQuestions.length > 0
        ) {
          throw new Error(
            `${recoveryModel} no pudo recuperar todas las preguntas faltantes del lote ${batchIndex + 1}. Siguen faltando: ${stillMissingQuestions.join(", ")}`
          );
        }

        console.log(
          `[Import PDF] Recuperadas correctamente ${validRecoveredQuestions.length} preguntas faltantes usando ${recoveryModel}.`
        );

        batchResult.questions.push(
          ...validRecoveredQuestions
        );

        batchModels.push(
          recoveryModel
        );
      }

      batchResult.questions.sort(
        (a, b) => {
          const aNumber =
            typeof a.question_number === "number"
              ? a.question_number
              : Number.MAX_SAFE_INTEGER;

          const bNumber =
            typeof b.question_number === "number"
              ? b.question_number
              : Number.MAX_SAFE_INTEGER;

          return aNumber - bNumber;
        }
      );

      batchResults.push(
        batchResult
      );

      batchModels.push(
        batchModel
      );
    } 
    
    if (
      batchResults.length !==
      questionBatches.length
    ) {
      throw new Error(
        `El análisis quedó incompleto. Se procesaron ${batchResults.length} de ${questionBatches.length} lotes.`
      );
    }

    const result: GeminiResult = {
      document_validation:
        batchResults[0].document_validation,

      analysis:
        batchResults[0].analysis,

      questions:
        batchResults.flatMap(
          (batchResult) =>
            batchResult.questions
        ),
    };

    const model =
      [...new Set(batchModels)].join(", ");

    console.log(
      `Análisis por lotes completado. Preguntas recibidas: ${result.questions.length}`
    );

    /* =====================================================
       13. VALIDAR RESULTADO
    ===================================================== */

    const {
      validQuestions,
      invalidQuestions,
    } =
      validateGeminiResult(
        result,
        selectedSubject,
        selectedSession
      );

    if (
      validQuestions.length === 0
    ) {
      throw new Error(
        "Gemini no detectó preguntas válidas en el PDF."
      );
    }

    /* =====================================================
       14. VALIDAR NÚMEROS
    ===================================================== */

    const questionNumbers =
      validQuestions
        .map(
          (question) =>
            question.question_number
        )
        .filter(
          (
            value
          ): value is number =>
            typeof value ===
            "number"
        );

    const uniqueQuestionNumbers =
      new Set(
        questionNumbers
      );

    if (
      questionNumbers.length !==
      uniqueQuestionNumbers.size
    ) {
      throw new Error(
        "Gemini devolvió números de pregunta duplicados."
      );
    }

    /* =====================================================
       14.1 VALIDAR DETECCIÓN VS ANÁLISIS
    ===================================================== */

    const detectedQuestionNumberSet =
      new Set(
        detectedQuestionNumbers
      );

    const analyzedQuestionNumberSet =
      new Set(
        questionNumbers
      );

    const missingQuestionNumbers =
      detectedQuestionNumbers.filter(
        (questionNumber) =>
          !analyzedQuestionNumberSet.has(
            questionNumber
          )
      );

    const unexpectedQuestionNumbers =
      questionNumbers.filter(
        (questionNumber) =>
          !detectedQuestionNumberSet.has(
            questionNumber
          )
      );

    if (
      missingQuestionNumbers.length > 0
    ) {
      console.warn(
        "Preguntas detectadas pero no analizadas:",
        missingQuestionNumbers
      );
    }

    if (
      unexpectedQuestionNumbers.length > 0
    ) {
      console.warn(
        "Preguntas analizadas que no fueron detectadas inicialmente:",
        unexpectedQuestionNumbers
      );
    }

    console.log(
      "Validación detección/análisis completada:",
      {
        detected:
          detectedQuestionNumbers.length,

        analyzed:
          questionNumbers.length,

        missing:
          missingQuestionNumbers.length,

        unexpected:
          unexpectedQuestionNumbers.length,
      }
    );

    /* =====================================================
       15. PREPARAR ANÁLISIS
    ===================================================== */

    const analysisToSave = {
      ...result.analysis,

      document_validation: {
        ...result.document_validation,
      },

      reference_metadata: {
        subject:
          selectedSubject,

        session:
          selectedSession,

        document_mode:
          selectedDocumentMode,

        detected_questions:
          detectedQuestionNumbers.length,

        detected_question_numbers:
          detectedQuestionNumbers,

        detection_model:
          detectionModel,

        analyzed_questions:
          result.questions.length,

        analyzed_question_numbers:
          questionNumbers,

        valid_questions:
          validQuestions.length,

        invalid_questions:
          invalidQuestions,

        missing_question_numbers:
          missingQuestionNumbers,

        unexpected_question_numbers:
          unexpectedQuestionNumbers,

        ai_model:
          model,
      },

      question_profiles:
        validQuestions.map(
          (question) => ({
            question_number:
              typeof question.question_number ===
              "number"
                ? question.question_number
                : null,

            subject:
              question.subject,

            topic:
              question.topic.trim(),

            component:
              question.component.trim(),

            competence:
              question.competence.trim(),

            skill:
              question.skill.trim(),

            difficulty:
              question.difficulty,

            reasoning_type:
              question.reasoning_type.trim(),

            structure_type:
              question.structure_type.trim(),

            context_type:
              question.context_type.trim(),

            distractor_strategy:
              question.distractor_strategy.trim(),

            information_complexity:
              question.information_complexity.trim(),

            requires_visual:
              question.requires_visual,

            visual_description:
              typeof question.visual_description ===
                "string" &&
              question.visual_description.trim()
                ? question.visual_description.trim()
                : null,

            analysis_notes:
              question.analysis_notes.trim(),
          })
        ),
    };

    /* =====================================================
       16. GUARDAR ANÁLISIS
    ===================================================== */

    const {
      data: savedAnalysis,
      error:
        analysisError,
    } =
      await supabase
        .from("reference_analyses")
        .insert({
          reference_source_id:
            referenceSourceId,

          user_id:
            user.id,

          analysis:
            analysisToSave,
        })
        .select("*")
        .single();

    if (
      analysisError ||
      !savedAnalysis
    ) {
      throw new Error(
        analysisError?.message ||
          "No se pudo guardar el análisis de referencia."
      );
    }

    /* =====================================================
       17. GUARDAR PERFILES
    ===================================================== */

    /* =====================================================
       17.0 LIMPIAR PERFILES ANTERIORES DEL SOURCE
    ===================================================== */

    const supabaseAdmin =
      getSupabaseAdmin();

    const {
      error: deletePreviousProfilesError,
    } =
      await supabaseAdmin
        .from("reference_questions")
        .delete()
        .eq(
          "reference_source_id",
          referenceSourceId
        );

    if (
      deletePreviousProfilesError
    ) {
      throw new Error(
        `No se pudieron limpiar los perfiles anteriores: ${deletePreviousProfilesError.message}`
      );
    }

    console.log(
      `[Import PDF] Perfiles anteriores limpiados para source ${referenceSourceId}.`
    );

    const referenceQuestionRows =
      validQuestions.map(
        (question) => ({
          reference_source_id:
            referenceSourceId,

          question_text:
            `[Perfil pedagógico de referencia${
              typeof question.question_number ===
              "number"
                ? ` #${question.question_number}`
                : ""
            }]`,

          question_number:
            typeof question.question_number ===
            "number"
              ? question.question_number
              : null,

          subject:
            question.subject,

          topic:
            question.topic.trim(),

          component:
            question.component.trim(),

          competence:
            question.competence.trim(),

          skill:
            question.skill.trim(),

          difficulty:
            question.difficulty,

          reasoning_type:
            question.reasoning_type.trim(),

          structure_type:
            question.structure_type.trim(),

          context_type:
            question.context_type.trim(),

          distractor_strategy:
            question.distractor_strategy.trim(),

          information_complexity:
            question.information_complexity.trim(),

          requires_visual:
            question.requires_visual,

          visual_description:
            typeof question.visual_description ===
              "string" &&
            question.visual_description.trim()
              ? question.visual_description.trim()
              : null,

          analysis_notes:
            question.analysis_notes.trim(),
        })
      );

    let insertedReferenceQuestions:
      any[] = [];

    if (
      referenceQuestionRows.length >
      0
    ) {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "reference_questions"
          )
          .insert(
            referenceQuestionRows
          )
          .select("*");

      if (error) {
        throw new Error(
          `No se pudieron guardar los perfiles de referencia: ${error.message}`
        );
      }

      insertedReferenceQuestions =
        data ?? [];
    }

    /* =====================================================
       18. ESTADÍSTICAS
    ===================================================== */

    const subjectCounts:
      Record<string, number> = {};

    const difficultyCounts:
      Record<string, number> = {};

    let visualQuestions = 0;

    for (
      const question of validQuestions
    ) {
      subjectCounts[
        question.subject
      ] =
        (
          subjectCounts[
            question.subject
          ] || 0
        ) + 1;

      difficultyCounts[
        question.difficulty
      ] =
        (
          difficultyCounts[
            question.difficulty
          ] || 0
        ) + 1;

      if (
        question.requires_visual
      ) {
        visualQuestions++;
      }
    }

    /* =====================================================
       19. ACTUALIZAR SOURCE
    ===================================================== */

    const {
      error:
        updateSourceError,
    } =
      await supabase
        .from(
          "reference_sources"
        )
        .update({
          status:
            "analyzed",

          total_questions:
            validQuestions.length,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          referenceSourceId
        );

    if (
      updateSourceError
    ) {
      throw new Error(
        `No se pudo actualizar la fuente de referencia: ${updateSourceError.message}`
      );
    }

    /* =====================================================
       20. RESPUESTA
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "PDF analizado correctamente.",

      data: {
        reference_source_id:
          referenceSourceId,

        analysis_id:
          savedAnalysis.id,

        file_name:
          file.name,

        subject:
          selectedSubject,

        session:
          selectedSession,

        detected_subject:
          result
            .document_validation
            .detected_subject,

        detected_session:
          result
            .document_validation
            .detected_session,

        document_type:
          result
            .document_validation
            .document_type,

        confidence:
          result
            .document_validation
            .confidence,

        total_questions:
          result.questions.length,

        valid_questions:
          validQuestions.length,

        invalid_questions:
          invalidQuestions,

        visual_questions:
          visualQuestions,

        subject_counts:
          subjectCounts,

        difficulty_counts:
          difficultyCounts,

        reference_questions_saved:
          insertedReferenceQuestions.length,
      },
    });
  } catch (error) {
    console.error(
      "ERROR IMPORTANDO PDF:",
      getGeminiErrorMessage(error)
    );

    /* =====================================================
       MARCAR SOURCE COMO ERROR
    ===================================================== */

    if (
      supabase &&
      referenceSourceId
    ) {
      try {
        await supabase
          .from(
            "reference_sources"
          )
          .update({
            status: "failed",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            referenceSourceId
          );
      } catch (
        updateError
      ) {
        console.error(
          "No se pudo marcar reference_source como error:",
          updateError
        );
      }
    }

    /* =====================================================
       ELIMINAR PDF SI FALLÓ ANTES DE CREAR SOURCE
    ===================================================== */

    if (
      supabase &&
      storagePath &&
      !referenceSourceId
    ) {
      try {
        await supabase.storage
          .from(
            "reference-pdfs"
          )
          .remove([
            storagePath,
          ]);
      } catch (
        storageError
      ) {
        console.error(
          "No se pudo eliminar el PDF:",
          storageError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido al importar el PDF.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}