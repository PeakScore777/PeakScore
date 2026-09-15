import { NextResponse } from "next/server";
import {
  generateAI,
  getSafeAIErrorMessage,
} from "@/lib/ai/router";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  isValidQuestionVisual,
} from "@/lib/visuals/validateVisualData";

import type {
  VisualData,
  VisualType,
} from "@/lib/visuals/types";

import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* =========================================================
   TIPOS
========================================================= */

type Difficulty = "Fácil" | "Media" | "Difícil" | "Mixta";
type Answer = "A" | "B" | "C" | "D";

interface GenerateRequest {
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
  skill: string | null;

  difficulty: string | null;

  structure_type: string | null;
  context_type: string | null;

  question: string;

  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;

  correct_answer: Answer;

  explanation: string | null;
  context_text: string | null;

  requires_visual: boolean;

  visual_type: VisualType | null;
  visual_description: string | null;
  /*
  * Datos estructurados para construir
  * gráficas, diagramas y otros visuales
  * de forma exacta.
  */
  visual_data: VisualData | null;
  image_url: string | null;
}

interface GenerationPlanItem {
  component: string | null;
  competence: string | null;
  skill: string | null;
  structure_type: string | null;
  context_type: string | null;
  requires_visual: boolean | null;
}

/* =========================================================
   PLANIFICADOR DE ARQUITECTURA DEL LOTE
========================================================= */

function buildGenerationPlan(
  amount: number,
  profiles: ReferenceProfile[]
): GenerationPlanItem[] {
  if (amount <= 0) {
    return [];
  }

  const candidates = profiles.filter(
    (profile) =>
      profile.component ||
      profile.competence ||
      profile.skill ||
      profile.structure_type ||
      profile.context_type
  );

  if (candidates.length === 0) {
    return Array.from(
      { length: amount },
      () => ({
        component: null,
        competence: null,
        skill: null,
        structure_type: null,
        context_type: null,
        requires_visual: null,
      })
    );
  }

  const selected: ReferenceProfile[] = [];

  for (let index = 0; index < amount; index++) {
    let bestCandidate: ReferenceProfile | null = null;
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      if (selected.includes(candidate)) {
        continue;
      }

      let score = 0;

      /*
       * Premiar componentes diferentes.
       */
      if (
        candidate.component &&
        !selected.some(
          (item) =>
            item.component === candidate.component
        )
      ) {
        score += 5;
      }

      /*
       * Premiar competencias diferentes.
       */
      if (
        candidate.competence &&
        !selected.some(
          (item) =>
            item.competence === candidate.competence
        )
      ) {
        score += 5;
      }

      /*
       * Premiar habilidades diferentes.
       */
      if (
        candidate.skill &&
        !selected.some(
          (item) =>
            item.skill === candidate.skill
        )
      ) {
        score += 4;
      }

      /*
       * Premiar estructuras diferentes.
       */
      if (
        candidate.structure_type &&
        !selected.some(
          (item) =>
            item.structure_type ===
            candidate.structure_type
        )
      ) {
        score += 6;
      }

      /*
       * Premiar contextos diferentes.
       */
      if (
        candidate.context_type &&
        !selected.some(
          (item) =>
            item.context_type ===
            candidate.context_type
        )
      ) {
        score += 3;
      }

      /*
       * Evitar repetir innecesariamente
       * el mismo tipo de visual.
       */
      if (
        candidate.requires_visual !== null &&
        !selected.some(
          (item) =>
            item.requires_visual ===
            candidate.requires_visual
        )
      ) {
        score += 2;
      }

      /*
       * Pequeña variación para no depender
       * siempre del primer perfil.
       */
      score +=
        (index + candidates.indexOf(candidate)) %
        3;

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    /*
     * Si ya utilizamos todos los perfiles,
     * permitimos reutilizarlos solamente
     * cuando la cantidad solicitada lo exige.
     */
    if (!bestCandidate) {
      bestCandidate =
        candidates[index % candidates.length];
    }

    selected.push(bestCandidate);
  }

  return selected.map((profile) => ({
    component: profile.component,
    competence: profile.competence,
    skill: profile.skill,
    structure_type:
      profile.structure_type,
    context_type:
      profile.context_type,
    requires_visual:
      profile.requires_visual,
  }));
}

interface ExistingQuestionForSimilarity {
  id: string;
  question: string;
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
   CONFIGURACIÓN DEL GENERADOR BÁSICO
========================================================= */

/*
 * Este NO es el generador masivo.
 *
 * Básico:
 * - Groq
 * - Máximo 100 preguntas
 * - Generación en pequeños bloques
 * - Si Groq devuelve menos preguntas,
 *   se solicitan las restantes.
 */

const REQUEST_BLOCK_SIZE = 3;
const MAX_AMOUNT = 100;

const MAX_BLOCK_ATTEMPTS = 2;
const MAX_TOTAL_ATTEMPTS = 40;
const MAX_NO_PROGRESS_ATTEMPTS = 3;

const RETRY_BASE_DELAY_MS = 1500;

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

function normalizeForSimilarity(
  value: unknown
): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSimilarityTokens(
  value: unknown
): Set<string> {
  const normalized =
    normalizeForSimilarity(value);

  const stopWords = new Set([
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "de",
    "del",
    "en",
    "por",
    "para",
    "con",
    "que",
    "se",
    "su",
    "sus",
    "y",
    "o",
    "a",
    "al",
    "es",
    "son",
    "como",
    "cual",
    "cuales",
    "cuál",
    "cuáles",
  ]);

  return new Set(
    normalized
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 3 &&
          !stopWords.has(token)
      )
  );
}

function jaccardSimilarity(
  a: Set<string>,
  b: Set<string>
): number {
  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const value of a) {
    if (b.has(value)) {
      intersection++;
    }
  }

  const union =
    a.size +
    b.size -
    intersection;

  return union === 0
    ? 0
    : intersection / union;
}

function getStructuralTokens(
  value: unknown
): Set<string> {
  const text = normalizeForSimilarity(value);

  const structuralTokens: string[] = [];

  const patterns: Array<[string, RegExp]> = [
    ["probabilidad", /\bprobabilidad|probable|azar\b/],
    ["proporcion", /\bproporcion|razon|relacion\b/],
    ["porcentaje", /\bporcentaje|por ciento\b/],
    ["promedio", /\bpromedio|media aritmetica\b/],
    ["mediana", /\bmediana\b/],
    ["moda", /\bmoda\b/],
    ["maximo", /\bmayor|maximo|maxima|maximiza\b/],
    ["minimo", /\bmenor|minimo|minima|minimiza\b/],
    ["comparacion", /\bcomparar|comparacion|respecto|diferencia\b/],
    ["variacion", /\baumenta|disminuye|incrementa|variacion|cambio\b/],
    ["funcion", /\bfuncion|funciones\b/],
    ["area", /\barea\b/],
    ["perimetro", /\bperimetro\b/],
    ["longitud", /\blongitud|distancia\b/],
    ["geometria", /\btriangulo|cuadrado|rectangulo|circulo|angulo\b/],
    ["tabla", /\btabla|tablas\b/],
    ["grafica", /\bgrafica|grafico|graficas|graficos\b/],
    ["diagrama", /\bdiagrama|diagramas\b/],
    ["mes", /\benero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|mes\b/],
    ["secuencia", /\bsecuencia|sucesion|patron\b/],
    ["causalidad", /\bcausa|causal|consecuencia|efecto\b/],
    ["evidencia", /\bevidencia|datos|resultado|resultados\b/],
    ["inferencia", /\binferir|inferencia|deducir|concluir|conclusion\b/],
    ["estrategia", /\bestrategia|procedimiento|metodo|metodologia\b/],
    ["error", /\berror|incorrecto|equivocado|fallo\b/],
  ];

  for (const [token, pattern] of patterns) {
    if (pattern.test(text)) {
      structuralTokens.push(token);
    }
  }

  return new Set(structuralTokens);
}

function buildQuestionFingerprint(
  question: string,
  contextText?: string | null
): string {
  return normalizeForSimilarity(
    `${question} ${contextText ?? ""}`
  );
}

function cleanJson(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getExistingQuestionsForSimilarity(
  supabase: SupabaseClient,
  subject: string,
  session: number
): Promise<ExistingQuestionForSimilarity[]> {
  const pageSize = 1000;

  const allQuestions:
    ExistingQuestionForSimilarity[] = [];

  let from = 0;

  while (true) {
    const to =
      from + pageSize - 1;

    const {
      data,
      error,
    } = await supabase
      .from("questions")
      .select(`
        id,
        question,
        context_text
      `)
      .eq("subject", subject)
      .eq("session", session)
      .eq("is_active", true)
      .range(from, to);

    if (error) {
      console.error(
        "[PeakScore] Error consultando banco para anti-duplicados:",
        error
      );

      throw new Error(
        "No fue posible verificar la originalidad de las preguntas."
      );
    }

    if (
      !data ||
      data.length === 0
    ) {
      break;
    }

    allQuestions.push(
      ...(data as ExistingQuestionForSimilarity[])
    );

    if (
      data.length < pageSize
    ) {
      break;
    }

    from += pageSize;
  }

  console.log(
    `[PeakScore] Banco cargado para anti-duplicados: ${allQuestions.length} preguntas.`
  );

  return allQuestions;
}

function findSimilarQuestion(
  candidate: GeneratedQuestion,
  existingQuestions:
    ExistingQuestionForSimilarity[],
  generatedQuestions:
    GeneratedQuestion[]
): {
  isDuplicate: boolean;
  similarity: number;
  matchedQuestionId: string | null;
} {
  const candidateFingerprint =
    buildQuestionFingerprint(
      candidate.question,
      candidate.context_text
    );

  const candidateTokens =
    getSimilarityTokens(
      candidateFingerprint
    );

  const candidateStructuralTokens =
    getStructuralTokens(
      candidateFingerprint
    );

  for (
    const generated of generatedQuestions
  ) {
    const generatedFingerprint =
      buildQuestionFingerprint(
        generated.question,
        generated.context_text
      );

    if (
      candidateFingerprint ===
      generatedFingerprint
    ) {
      return {
        isDuplicate: true,
        similarity: 1,
        matchedQuestionId: null,
      };
    }

    const generatedTokens =
      getSimilarityTokens(
        generatedFingerprint
      );

    const similarity =
      jaccardSimilarity(
        candidateTokens,
        generatedTokens
      );

    if (
      similarity >= 0.82
    ) {
      return {
        isDuplicate: true,
        similarity,
        matchedQuestionId: null,
      };
    }

    const generatedStructuralTokens =
      getStructuralTokens(
        generatedFingerprint
      );

    const structuralSimilarity =
      jaccardSimilarity(
        candidateStructuralTokens,
        generatedStructuralTokens
      );

    if (
      candidateStructuralTokens.size >= 3 &&
      generatedStructuralTokens.size >= 3 &&
      structuralSimilarity >= 0.60
    ) {
      return {
        isDuplicate: true,
        similarity: structuralSimilarity,
        matchedQuestionId: null,
      };
    }
  }

  for (
    const existing of existingQuestions
  ) {
    const existingFingerprint =
      buildQuestionFingerprint(
        existing.question,
        existing.context_text
      );

    if (
      candidateFingerprint ===
      existingFingerprint
    ) {
      return {
        isDuplicate: true,
        similarity: 1,
        matchedQuestionId:
          existing.id,
      };
    }

    const existingTokens =
      getSimilarityTokens(
        existingFingerprint
      );

    const similarity =
      jaccardSimilarity(
        candidateTokens,
        existingTokens
      );

    if (
      similarity >= 0.82
    ) {
      return {
        isDuplicate: true,
        similarity,
        matchedQuestionId:
          existing.id,
      };
    }

    const existingStructuralTokens =
      getStructuralTokens(
        existingFingerprint
      );

    const structuralSimilarity =
      jaccardSimilarity(
        candidateStructuralTokens,
        existingStructuralTokens
      );

    if (
      candidateStructuralTokens.size >= 3 &&
      existingStructuralTokens.size >= 3 &&
      structuralSimilarity >= 0.60
    ) {
      return {
        isDuplicate: true,
        similarity: structuralSimilarity,
        matchedQuestionId:
          existing.id,
      };
    }
  }

  return {
    isDuplicate: false,
    similarity: 0,
    matchedQuestionId: null,
  };
}

/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  console.log("[PeakScore] ===============================");
  console.log("[PeakScore] SUPABASE ADMIN CONFIG");
  console.log("[PeakScore] URL:", url);
  console.log(
    "[PeakScore] Key encontrada:",
    true
  );
  console.log(
    "[PeakScore] Tipo de key:",
    key.startsWith("sb_secret_")
      ? "SECRET KEY (ADMIN)"
      : key.startsWith("eyJ")
        ? "LEGACY JWT"
        : key.startsWith("sb_publishable_")
          ? "ERROR: PUBLISHABLE KEY"
          : "TIPO DESCONOCIDO"
  );
  console.log("[PeakScore] ===============================");

  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "ERROR DE CONFIGURACIÓN: SUPABASE_SERVICE_ROLE_KEY contiene una Publishable Key. Debes usar la Secret Key (sb_secret_...)."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/* =========================================================
   CONTROL DE DIFICULTAD
========================================================= */

const GENERATED_DIFFICULTIES = [
  "Fácil",
  "Media",
  "Difícil",
] as const;

type GeneratedDifficulty =
  (typeof GENERATED_DIFFICULTIES)[number];

function normalizeDifficulty(
  value: unknown
): GeneratedDifficulty | null {
  const normalized = normalize(value);

  if (normalized === "facil") return "Fácil";
  if (normalized === "media") return "Media";
  if (normalized === "dificil") return "Difícil";

  return null;
}

function getMixedDifficultyTargets(
  amount: number
): Record<GeneratedDifficulty, number> {
  const raw = [
    {
      key: "Fácil" as const,
      value: amount * 0.30,
    },
    {
      key: "Media" as const,
      value: amount * 0.45,
    },
    {
      key: "Difícil" as const,
      value: amount * 0.25,
    },
  ];

  const targets = raw.map((item) => ({
    ...item,
    base: Math.floor(item.value),
    remainder:
      item.value - Math.floor(item.value),
  }));

  const assigned = targets.reduce(
    (sum, item) => sum + item.base,
    0
  );

  let remaining = amount - assigned;

  /*
   * Método de mayor residuo:
   *
   * 1. Se asignan primero las cantidades enteras.
   * 2. Los cupos restantes se entregan a los
   *    porcentajes con mayor parte decimal.
   *
   * Esto garantiza que:
   * - la suma sea exactamente igual a amount;
   * - la distribución se mantenga cercana a 30/45/25;
   * - no dependamos de un índice mutable para repartir cupos.
   */
  targets.sort(
    (a, b) => {
      if (b.remainder !== a.remainder) {
        return b.remainder - a.remainder;
      }

      /*
       * Desempate determinista:
       * Fácil → Media → Difícil
       */
      const order: Record<
        GeneratedDifficulty,
        number
      > = {
        Fácil: 0,
        Media: 1,
        Difícil: 2,
      };

      return order[a.key] - order[b.key];
    }
  );

  for (
    let index = 0;
    index < targets.length && remaining > 0;
    index++
  ) {
    targets[index].base++;
    remaining--;
  }

  return targets.reduce(
    (result, item) => {
      result[item.key] = item.base;
      return result;
    },
    {
      Fácil: 0,
      Media: 0,
      Difícil: 0,
    } as Record<GeneratedDifficulty, number>
  );
}

function isDifficultyAllowed(
  value: unknown,
  requested: Difficulty
): value is GeneratedDifficulty {
  const normalized = normalizeDifficulty(value);

  if (!normalized) return false;

  if (requested === "Mixta") return true;

  return normalized === requested;
}

function getDifficultyCounts(
  questions: GeneratedQuestion[]
): Record<GeneratedDifficulty, number> {
  return questions.reduce(
    (counts, question) => {
      const difficulty =
        normalizeDifficulty(question.difficulty);

      if (difficulty) {
        counts[difficulty]++;
      }

      return counts;
    },
    {
      Fácil: 0,
      Media: 0,
      Difícil: 0,
    } as Record<GeneratedDifficulty, number>
  );
}

/* =========================================================
   VALIDAR PREGUNTA
========================================================= */

function explicitlyReferencesVisual(
  item: GeneratedQuestion
): boolean {
  const text = normalize(
    `${item.context_text ?? ""} ${item.question}`
  );

  return /\b(tabla|tablas|grafico|grafica|graficos|graficas|diagrama|diagramas|figura|figuras|se muestra|mostrado|mostrada|representado|representada|representacion)\b/.test(
    text
  );
}

function isQuestionVisualCoherent(
  item: GeneratedQuestion
): boolean {
  if (!item.requires_visual) {
    return true;
  }

  const questionText = normalize(item.question);

  if (
    item.visual_type === "chart" &&
    item.visual_data &&
    typeof item.visual_data === "object" &&
    !Array.isArray(item.visual_data)
  ) {
    const chart = item.visual_data as {
      categories?: unknown;
      series?: unknown;
    };

    const categories = Array.isArray(chart.categories)
      ? chart.categories.filter(
          (value): value is string =>
            typeof value === "string"
        )
      : [];

    const series = Array.isArray(chart.series)
      ? chart.series
      : [];

    if (
      categories.length === 0 ||
      series.length === 0
    ) {
      return false;
    }

    const allValues = series.flatMap((currentSeries) => {
      if (
        !currentSeries ||
        typeof currentSeries !== "object" ||
        Array.isArray(currentSeries)
      ) {
        return [];
      }

      const values = (currentSeries as {
        values?: unknown;
      }).values;

      return Array.isArray(values)
        ? values.filter(
            (value): value is number =>
              typeof value === "number" &&
              Number.isFinite(value)
          )
        : [];
    });

    if (allValues.length === 0) {
      return false;
    }

    /*
     * Si la pregunta pide identificar un máximo o mínimo,
     * debe existir un valor extremo único.
     */
    if (
      /\bmayor\b|\bmaximo\b|\bmaxima\b|\bmas alto\b|\bmas alta\b/.test(
        questionText
      )
    ) {
      const maxValue = Math.max(...allValues);
      const maxCount = allValues.filter(
        (value) => value === maxValue
      ).length;

      if (maxCount !== 1) {
        return false;
      }
    }

    if (
      /\bmenor\b|\bminimo\b|\bminima\b|\bmas bajo\b|\bmas baja\b/.test(
        questionText
      )
    ) {
      const minValue = Math.min(...allValues);
      const minCount = allValues.filter(
        (value) => value === minValue
      ).length;

      if (minCount !== 1) {
        return false;
      }
    }
  }

  return true;
}

function isAnswerExplanationCoherent(
  item: GeneratedQuestion
): boolean {
  if (!item.explanation?.trim()) {
    return true;
  }

  const options: Record<Answer, string> = {
    A: item.option_a,
    B: item.option_b,
    C: item.option_c,
    D: item.option_d,
  };

  const correctOption =
    normalize(options[item.correct_answer]);

  const explanation =
    normalizeForSimilarity(item.explanation);

  if (!correctOption || !explanation) {
    return true;
  }

  /*
   * La explicación no debería afirmar explícitamente
   * que otra opción es la correcta.
   *
   * Esto detecta contradicciones evidentes sin intentar
   * resolver la pregunta mediante reglas matemáticas.
   */
  const answerLetters: Answer[] = [
    "A",
    "B",
    "C",
    "D",
  ];

  for (const letter of answerLetters) {
    if (letter === item.correct_answer) {
      continue;
    }

    const patterns = [
      new RegExp(
        `\\bopcion\\s+${letter.toLowerCase()}\\b.*\\bcorrect`,
        "i"
      ),
      new RegExp(
        `\\brespuesta\\s+${letter.toLowerCase()}\\b.*\\bcorrect`,
        "i"
      ),
      new RegExp(
        `\\b${letter.toLowerCase()}\\s+es\\s+la\\s+correcta\\b`,
        "i"
      ),
    ];

    if (
      patterns.some((pattern) =>
        pattern.test(explanation)
      )
    ) {
      return false;
    }
  }

  /*
   * Si la explicación menciona la opción correcta,
   * verificamos que no la esté negando explícitamente.
   */
  const correctLetter =
    item.correct_answer.toLowerCase();

  const negativePatterns = [
    new RegExp(
      `\\bopcion\\s+${correctLetter}\\b.*\\bno\\s+es\\s+correct`,
      "i"
    ),
    new RegExp(
      `\\brespuesta\\s+${correctLetter}\\b.*\\bno\\s+es\\s+correct`,
      "i"
    ),
    new RegExp(
      `\\b${correctLetter}\\s+no\\s+es\\s+la\\s+correcta\\b`,
      "i"
    ),
  ];

  if (
    negativePatterns.some((pattern) =>
      pattern.test(explanation)
    )
  ) {
    return false;
  }

  return true;
}

function diagnoseQuestionValidation(
  item: GeneratedQuestion,
  subject: string,
  session: number
): string[] {
  const failures: string[] = [];

  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    failures.push("item no es un objeto válido");
    return failures;
  }

  if (
    typeof item.subject !== "string" ||
    normalize(item.subject) !== normalize(subject)
  ) {
    failures.push("subject inválido");
  }

  if (
    !Number.isInteger(Number(item.session)) ||
    Number(item.session) !== session
  ) {
    failures.push("session inválida");
  }

  if (!normalizeDifficulty(item.difficulty)) {
    failures.push("difficulty inválida");
  }

  if (
    typeof item.question !== "string" ||
    !item.question.trim()
  ) {
    failures.push("question vacía");
  }

  const questionText =
    normalizeForSimilarity(item.question);

  const cognitivePatterns = [
    /\bcalcular\b/,
    /\bdeterminar\b/,
    /\bestimar\b/,
    /\bcomparar\b/,
    /\binterpretar\b/,
    /\binferir\b/,
    /\bdeducir\b/,
    /\bconcluir\b/,
    /\bexplicar\b/,
    /\bjustificar\b/,
    /\banalizar\b/,
    /\bevaluar\b/,
    /\bidentificar\b/,
    /\bpredecir\b/,
    /\bseleccionar\b/,
    /\bestablecer\b/,
    /\brelacionar\b/,
    /\bdescribir\b/,
    /\bcual\b/,
    /\bque\b/,
    /\bcomo\b/,
    /\bpor que\b/,
    /\bporque\b/,
    /\bcuanto\b/,
    /\bcuanta\b/,
    /\bcual es\b/,
  ];

  if (
    !cognitivePatterns.some(
      (pattern) => pattern.test(questionText)
    )
  ) {
    failures.push("sin señal cognitiva");
  }

  const options = [
    item.option_a,
    item.option_b,
    item.option_c,
    item.option_d,
  ];

  if (
    options.some(
      (option) =>
        typeof option !== "string" ||
        !option.trim()
    )
  ) {
    failures.push("opciones incompletas");
  }

  if (
    !["A", "B", "C", "D"].includes(
      item.correct_answer
    )
  ) {
    failures.push("correct_answer inválido");
  }

  const normalizedOptions = [
    item.option_a,
    item.option_b,
    item.option_c,
    item.option_d,
  ].map((option) =>
    typeof option === "string"
      ? normalize(option)
      : ""
  );

  for (let i = 0; i < normalizedOptions.length; i++) {
    for (
      let j = i + 1;
      j < normalizedOptions.length;
      j++
    ) {
      const similarity = jaccardSimilarity(
        getSimilarityTokens(normalizedOptions[i]),
        getSimilarityTokens(normalizedOptions[j])
      );

      if (similarity >= 0.85) {
        failures.push(
          `opciones ${String.fromCharCode(65 + i)} y ${String.fromCharCode(65 + j)} demasiado similares (${similarity.toFixed(2)})`
        );
      }
    }
  }

  const compactOptions = normalizedOptions.map(
    (option) =>
      option
        .replace(
          /\b(unidades?|estudiantes?|personas?|casos?|elementos?|metros?|cm|km|kg|g|ml|l|por ciento|%)\b/gi,
          ""
        )
        .replace(/\s+/g, " ")
        .trim()
  );

  for (let i = 0; i < compactOptions.length; i++) {
    for (
      let j = i + 1;
      j < compactOptions.length;
      j++
    ) {
      if (
        compactOptions[i].length >= 2 &&
        compactOptions[i] === compactOptions[j]
      ) {
        failures.push(
          `opciones ${String.fromCharCode(65 + i)} y ${String.fromCharCode(65 + j)} quedan iguales al normalizar unidades`
        );
      }
    }
  }

  if (
    new Set(normalizedOptions).size !== 4
  ) {
    failures.push(
      "las cuatro opciones no son únicas después de normalizar"
    );
  }

  const optionLengths = normalizedOptions.map(
    (option) => option.length
  );

  if (
    optionLengths.some(
      (length) => length < 1
    )
  ) {
    failures.push(
      "una o más opciones están vacías después de normalizar"
    );
  }

  const maxOptionLength =
    Math.max(...optionLengths);

  const minOptionLength =
    Math.min(...optionLengths);

  if (
    minOptionLength >= 10 &&
    maxOptionLength >=
      minOptionLength * 4
  ) {
    failures.push(
      `una opción es excesivamente larga frente a las demás (${maxOptionLength} vs ${minOptionLength})`
    );
  }

  if (
    typeof item.requires_visual !== "boolean"
  ) {
    failures.push("requires_visual no es boolean");
  }

  if (
    explicitlyReferencesVisual(item) &&
    item.requires_visual !== true
  ) {
    failures.push(
      "menciona un visual pero requires_visual=false"
    );
  }

  if (
    item.requires_visual === true
  ) {
    if (!item.visual_type) {
      failures.push("visual_type faltante");
    }

    if (!item.visual_description?.trim()) {
      failures.push(
        "visual_description faltante"
      );
    }

    if (!item.visual_data) {
      failures.push("visual_data faltante");
    }

    if (
      item.visual_data &&
      !isValidQuestionVisual({
        requires_visual: true,
        visual_type: item.visual_type,
        visual_description:
          item.visual_description,
        visual_data: item.visual_data,
      })
    ) {
      failures.push(
        "isValidQuestionVisual rechazó visual_data"
      );
    }

    if (
      !isQuestionVisualCoherent(item)
    ) {
      failures.push(
        "isQuestionVisualCoherent rechazó coherencia visual"
      );
    }
  }

        if (!isAnswerExplanationCoherent(item)) {
          failures.push(
            "explicación contradice la respuesta"
          );
        }

        return failures;
      }

function isValidQuestion(
  item: GeneratedQuestion,
  subject: string,
  session: number
): boolean {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    return false;
  }

  if (
    typeof item.subject !== "string" ||
    normalize(item.subject) !==
      normalize(subject)
  ) {
    return false;
  }

  if (
    !Number.isInteger(Number(item.session)) ||
    Number(item.session) !== session
  ) {
    return false;
  }

  /*
   * La dificultad generada por la IA debe ser explícita y válida.
   * La comprobación de coincidencia con la solicitud se realiza
   * en generateBlock(), donde también podemos controlar Mixta.
   */
  if (!normalizeDifficulty(item.difficulty)) {
    return false;
  }

  if (
    typeof item.question !== "string" ||
    !item.question.trim()
  ) {
    return false;
  }

  /*
   * Una pregunta tipo ICFES debe plantear alguna
   * acción cognitiva: interpretar, comparar,
   * calcular, inferir, explicar, identificar una
   * relación, predecir, evaluar, etc.
   *
   * Es un filtro conservador: no exige una palabra
   * específica, solo evita preguntas excesivamente
   * vacías o puramente declarativas.
   */
  const questionText =
    normalizeForSimilarity(item.question);

  const cognitiveActionPatterns = [
    /\bcalcular\b/,
    /\bdeterminar\b/,
    /\bestimar\b/,
    /\bcomparar\b/,
    /\binterpretar\b/,
    /\binferir\b/,
    /\bdeducir\b/,
    /\bconcluir\b/,
    /\bexplicar\b/,
    /\bjustificar\b/,
    /\banalizar\b/,
    /\bevaluar\b/,
    /\bidentificar\b/,
    /\bpredecir\b/,
    /\bseleccionar\b/,
    /\bestablecer\b/,
    /\brelacionar\b/,
    /\bdescribir\b/,
    /\bcual\b/,
    /\bque\b/,
    /\bcomo\b/,
    /\bpor que\b/,
    /\bporque\b/,
    /\bcuanto\b/,
    /\bcuanta\b/,
    /\bcual es\b/,
  ];

  const hasCognitiveSignal =
    cognitiveActionPatterns.some(
      (pattern) => pattern.test(questionText)
    );

  if (!hasCognitiveSignal) {
    return false;
  }

  if (
    typeof item.option_a !== "string" ||
    !item.option_a.trim()
  ) {
    return false;
  }

  if (
    typeof item.option_b !== "string" ||
    !item.option_b.trim()
  ) {
    return false;
  }

  if (
    typeof item.option_c !== "string" ||
    !item.option_c.trim()
  ) {
    return false;
  }

  if (
    typeof item.option_d !== "string" ||
    !item.option_d.trim()
  ) {
    return false;
  }

  if (
    !["A", "B", "C", "D"].includes(
      item.correct_answer
    )
  ) {
    return false;
  }

  /*
   * Las cuatro opciones deben ser realmente diferentes.
   * Se normalizan para detectar duplicados aunque
   * cambien mayúsculas, espacios o acentos.
   */
  const normalizedOptions = [
    item.option_a,
    item.option_b,
    item.option_c,
    item.option_d,
  ].map((option) => normalize(option));

  /*
   * Evitar opciones prácticamente equivalentes.
   *
   * Dos opciones con una similitud textual muy alta
   * pueden funcionar como la misma respuesta aunque
   * tengan pequeñas diferencias de formato.
   */
  for (let i = 0; i < normalizedOptions.length; i++) {
    for (
      let j = i + 1;
      j < normalizedOptions.length;
      j++
    ) {
      const similarity =
        jaccardSimilarity(
          getSimilarityTokens(
            normalizedOptions[i]
          ),
          getSimilarityTokens(
            normalizedOptions[j]
          )
        );

      if (similarity >= 0.85) {
        return false;
      }
    }
  }

  /*
   * Evitar opciones que revelen la respuesta por
   * contener literalmente otra opción como unidad
   * principal de la respuesta.
   *
   * Se aplica únicamente a opciones suficientemente
   * cortas para evitar falsos positivos en preguntas
   * de lectura, ciencias y sociales.
   */
  const compactOptions = normalizedOptions.map(
    (option) =>
      option
        .replace(
          /\b(unidades?|estudiantes?|personas?|casos?|elementos?|metros?|cm|km|kg|g|ml|l|por ciento|%)\b/gi,
          ""
        )
        .replace(/\s+/g, " ")
        .trim()
  );

  for (let i = 0; i < compactOptions.length; i++) {
    for (
      let j = i + 1;
      j < compactOptions.length;
      j++
    ) {
      if (
        compactOptions[i].length >= 2 &&
        compactOptions[i] === compactOptions[j]
      ) {
        return false;
      }
    }
  }

  if (
    new Set(normalizedOptions).size !== 4
  ) {
    return false;
  }

  /*
   * Evitar opciones vacías o prácticamente idénticas
   * después de la normalización.
   */
  const optionLengths = normalizedOptions.map(
    (option) => option.length
  );

  if (
    optionLengths.some(
      (length) => length < 1
    )
  ) {
    return false;
  }

  /*
   * Una opción extremadamente dominante en longitud
   * puede revelar la respuesta sin resolver la pregunta.
   *
   * Se aplica solamente cuando las demás opciones son
   * relativamente cortas, evitando penalizar preguntas
   * de lectura o ciencias donde una explicación más larga
   * puede ser legítima.
   */
  const maxOptionLength =
    Math.max(...optionLengths);

  const minOptionLength =
    Math.min(...optionLengths);

  if (
    minOptionLength >= 10 &&
    maxOptionLength >=
      minOptionLength * 4
  ) {
    return false;
  }

  if (
    item.explanation !== null &&
    typeof item.explanation !== "string"
  ) {
    return false;
  }

  if (
    item.context_text !== null &&
    typeof item.context_text !== "string"
  ) {
    return false;
  }

  if (
    typeof item.requires_visual !== "boolean"
  ) {
    return false;
  }

  if (
    explicitlyReferencesVisual(item) &&
    item.requires_visual !== true
  ) {
    return false;
  }

  if (
    item.visual_type !== null &&
    typeof item.visual_type !== "string"
  ) {
    return false;
  }

  if (
    item.visual_description !== null &&
    typeof item.visual_description !== "string"
  ) {
    return false;
  }

  if (
    item.image_url !== null &&
    item.image_url !== undefined &&
    typeof item.image_url !== "string"
  ) {
    return false;
  }

  /*
   * VALIDACIÓN DE ELEMENTOS VISUALES
   *
   * El contrato es estricto:
   * - sin visual => todos los campos visuales son null;
   * - con visual => tipo, descripción y datos son obligatorios.
   */

  if (item.requires_visual === true) {
    if (
      !item.visual_type ||
      !item.visual_description?.trim() ||
      !item.visual_data ||
      typeof item.visual_data !== "object" ||
      Array.isArray(item.visual_data)
    ) {
      return false;
    }
  } else {
    if (
      item.visual_type !== null ||
      item.visual_description !== null ||
      item.visual_data !== null
    ) {
      return false;
    }
  }

  /*
   * Validar coherencia completa
   * de los datos visuales.
   */
  const visual = {
    requires_visual: item.requires_visual,
    visual_type: item.visual_type,
    visual_description: item.visual_description,
    visual_data: item.visual_data,
  };

  if (!isValidQuestionVisual(visual)) {
    return false;
  }

  if (!isQuestionVisualCoherent(item)) {
    return false;
  }

  if (!isAnswerExplanationCoherent(item)) {
    return false;
  }

  /*
   * Una gráfica generada debe contener datos realmente renderizables.
   * No basta con que visual_data sea un objeto válido.
   */
  if (item.requires_visual && item.visual_type === "chart") {
    const chart = item.visual_data;

    if (
      !chart ||
      typeof chart !== "object" ||
      Array.isArray(chart) ||
      !("categories" in chart) ||
      !("series" in chart)
    ) {
      return false;
    }

    const categories = chart.categories;
    const series = chart.series;

    if (!Array.isArray(categories) || !Array.isArray(series)) {
      return false;
    }

    if (categories.length === 0 || series.length === 0) {
      return false;
    }

    for (const category of categories) {
      if (typeof category !== "string" || !category.trim()) {
        return false;
      }
    }

    for (const currentSeries of series) {
      if (!currentSeries || typeof currentSeries !== "object" || Array.isArray(currentSeries)) {
        return false;
      }

      if (!("values" in currentSeries)) {
        return false;
      }

      const values = currentSeries.values;

      if (!Array.isArray(values) || values.length !== categories.length) {
        return false;
      }

      if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
        return false;
      }
    }
  }

  return true;
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

  const profiles: ReferenceProfile[] = [];

  /* =======================================================
     1. MATERIAL ICFES ANALIZADO
     reference_sources → reference_analyses → question_profiles
  ======================================================= */

  const {
    data: referenceSources,
    error: referenceSourcesError,
  } = await supabase
    .from("reference_sources")
    .select("id, subject, session")
    .eq("subject", subject)
    .eq("session", session);

  if (referenceSourcesError) {
    console.warn(
      "[PeakScore] No se pudieron consultar reference_sources:",
      referenceSourcesError.message
    );
  }

  const sourceIds =
    (referenceSources ?? [])
      .map((source) => source.id)
      .filter(Boolean);

  if (sourceIds.length > 0) {
    const {
      data: analyses,
      error: analysesError,
    } = await supabase
      .from("reference_analyses")
      .select(`
        reference_source_id,
        analysis
      `)
      .in(
        "reference_source_id",
        sourceIds
      );

    if (analysesError) {
      console.warn(
        "[PeakScore] No se pudieron consultar reference_analyses:",
        analysesError.message
      );
    } else {
      const analysisProfiles: ReferenceProfile[] =
        (analyses ?? [])
          .flatMap((item) => {
            const analysis =
              item.analysis &&
              typeof item.analysis === "object"
                ? item.analysis as {
                    question_profiles?: unknown;
                  }
                : null;

            const questionProfiles =
              Array.isArray(
                analysis?.question_profiles
              )
                ? analysis.question_profiles
                : [];

            return questionProfiles;
          })
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) &&
              typeof item === "object"
          )
          .filter(
            (item) =>
              normalize(item.subject) ===
              normalizedSubject
          )
          .map((item) => ({
            subject:
              typeof item.subject === "string"
                ? item.subject
                : null,

            topic:
              typeof item.topic === "string"
                ? item.topic
                : null,

            component:
              typeof item.component === "string"
                ? item.component
                : null,

            competence:
              typeof item.competence === "string"
                ? item.competence
                : null,

            skill:
              typeof item.skill === "string"
                ? item.skill
                : null,

            difficulty:
              typeof item.difficulty === "string"
                ? item.difficulty
                : null,

            structure_type:
              typeof item.structure_type === "string"
                ? item.structure_type
                : null,

            context_type:
              typeof item.context_type === "string"
                ? item.context_type
                : null,

            requires_visual:
              typeof item.requires_visual === "boolean"
                ? item.requires_visual
                : null,
          }))
          .slice(0, 12);

      profiles.push(
        ...analysisProfiles
      );

      console.log(
        `[PeakScore] Se encontraron ${analysisProfiles.length} perfiles del material ICFES analizado para ${subject}.`
      );
    }
  } else {
    console.log(
      `[PeakScore] No se encontraron PDFs de referencia para ${subject}, sesión ${session}.`
    );
  }

  /* =======================================================
     2. REFERENCE_QUESTIONS
  ======================================================= */

  const {
    data: references,
    error: referencesError,
  } = await supabase
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

  if (referencesError) {
    console.warn(
      "[PeakScore] No se pudieron consultar reference_questions:",
      referencesError.message
    );
  } else {
    const matchingReferences =
      (references ?? [])
        .filter(
          (item) =>
            normalize(item.subject) ===
            normalizedSubject
        )
        .slice(0, 8)
        .map((item) => ({
          subject:
            item.subject ?? null,

          topic:
            item.topic ?? null,

          component:
            item.component ?? null,

          competence:
            item.competence ?? null,

          skill:
            item.skill ?? null,

          difficulty:
            item.difficulty ?? null,

          structure_type:
            item.structure_type ?? null,

          context_type:
            item.context_type ?? null,

          requires_visual:
            item.requires_visual ?? null,
        }));

    profiles.push(
      ...matchingReferences
    );

    console.log(
      `[PeakScore] Se encontraron ${matchingReferences.length} perfiles en reference_questions para ${subject}.`
    );
  }

  /* =======================================================
     3. BANCO DE PREGUNTAS EXISTENTE
  ======================================================= */

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select(`
      subject,
      session,
      component,
      competence,
      difficulty,
      context_text,
      image_url,
      requires_visual
    `)
    .eq("subject", subject)
    .eq("session", session)
    .limit(50);

  if (questionsError) {
    console.warn(
      "[PeakScore] No se pudieron consultar preguntas existentes:",
      questionsError.message
    );
  } else {
    const bankProfiles =
      (questions ?? [])
        .slice(0, 8)
        .map((q) => ({
          subject:
            q.subject ?? null,

          topic: null,

          component:
            q.component ?? null,

          competence:
            q.competence ?? null,

          skill: null,

          difficulty:
            q.difficulty ?? null,

          structure_type:
            q.context_text
              ? "contextual"
              : "direct",

          context_type:
            q.context_text
              ? "textual"
              : "none",

          requires_visual:
            typeof q.requires_visual === "boolean"
              ? q.requires_visual
              : Boolean(q.image_url),
        }));

    profiles.push(
      ...bankProfiles
    );

    console.log(
      `[PeakScore] Se encontraron ${bankProfiles.length} perfiles del banco de preguntas para ${subject}.`
    );
  }

  /* =======================================================
     RESULTADO FINAL
  ======================================================= */

  console.log(
    `[PeakScore] Total de perfiles disponibles para Groq: ${profiles.length}.`
  );

  return profiles;
}

/* =========================================================
   PROMPT
========================================================= */

function buildPrompt(
  subject: string,
  session: number,
  amount: number,
  difficulty: Difficulty,
  profiles: ReferenceProfile[],
  existingQuestions: string[],
  existingDifficulties: GeneratedDifficulty[] = [],
  totalRequested: number = amount,
  generationPlan: GenerationPlanItem[]
): string {
  const mixedTargets =
    getMixedDifficultyTargets(totalRequested);

  const currentDifficultyCounts =
    existingDifficulties.reduce(
      (counts, current) => {
        counts[current]++;
        return counts;
      },
      {
        Fácil: 0,
        Media: 0,
        Difícil: 0,
      } as Record<GeneratedDifficulty, number>
    );

  const remainingDifficultyTargets = {
    Fácil: Math.max(
      0,
      mixedTargets.Fácil - currentDifficultyCounts.Fácil
    ),
    Media: Math.max(
      0,
      mixedTargets.Media - currentDifficultyCounts.Media
    ),
    Difícil: Math.max(
      0,
      mixedTargets.Difícil - currentDifficultyCounts.Difícil
    ),
  };

  const difficultyRule =
    difficulty === "Mixta"
      ? `
  DISTRIBUCIÓN DE DIFICULTAD OBLIGATORIA:

  Para este lote completo de ${totalRequested} preguntas, utiliza exactamente esta distribución objetivo:
  - ${mixedTargets.Fácil} Fácil.
  - ${mixedTargets.Media} Media.
  - ${mixedTargets.Difícil} Difícil.

  Ya se han generado:
  - ${currentDifficultyCounts.Fácil} Fácil.
  - ${currentDifficultyCounts.Media} Media.
  - ${currentDifficultyCounts.Difícil} Difícil.

  Para las preguntas que estás generando AHORA, prioriza las siguientes cantidades restantes:
  - ${remainingDifficultyTargets.Fácil} Fácil.
  - ${remainingDifficultyTargets.Media} Media.
  - ${remainingDifficultyTargets.Difícil} Difícil.

  CALIBRACIÓN OBLIGATORIA DE DIFICULTAD:

  Cada pregunta debe ser clasificada por la complejidad REAL del razonamiento necesario para resolverla.

  FÁCIL:
  - Puede resolverse mediante una idea matemática o conceptual directa.
  - Normalmente requiere un solo paso de razonamiento.
  - La información relevante es clara.
  - No requiere combinar varias evidencias.
  - No requiere comparar estrategias complejas.
  - No debe tener trampas artificiales.
  - Ejemplos de dificultad adecuada: cálculo directo, lectura simple de una tabla, identificación inmediata de una relación o aplicación directa de un procedimiento conocido.

  MEDIA:
  - DEBE requerir más que una operación o identificación directa.
  - Debe exigir al menos dos pasos de razonamiento relacionados, o una interpretación no inmediata de la información.
  - Debe existir una decisión, comparación, transformación o relación entre varios datos.
  - El estudiante debe procesar la información antes de llegar a la respuesta.
  - Una pregunta que pueda resolverse leyendo directamente un dato o aplicando una única operación sencilla NO debe clasificarse como Media.
  - Una pregunta como "25 - 16 y dividir entre 5 - 2" sin ningún razonamiento adicional es demasiado sencilla para Media.
  - Los números grandes, los textos largos o muchas operaciones NO convierten una pregunta Fácil en Media.

  DIFÍCIL:
  - Debe exigir razonamiento de varios pasos o una inferencia no evidente.
  - Debe integrar dos o más ideas, representaciones, condiciones o evidencias.
  - Puede requerir comparar estrategias, analizar restricciones, detectar una relación implícita, interpretar una representación compleja o justificar una conclusión.
  - Los distractores deben corresponder a errores de razonamiento plausibles.
  - La respuesta no debe ser evidente después de una sola operación o lectura superficial.
  - NO hagas una pregunta Difícil simplemente aumentando los números o agregando operaciones innecesarias.

  REGLA CRÍTICA:
  Antes de asignar la etiqueta de dificultad, resuelve mentalmente cada pregunta y determina cuál es el nivel mínimo de razonamiento necesario para obtener la respuesta correcta.

  Si una pregunta inicialmente parece Media pero puede resolverse mediante una sola operación directa, DEBES clasificarla como Fácil o modificar la pregunta para aumentar legítimamente el razonamiento.

  Si una pregunta inicialmente parece Difícil pero puede resolverse mediante una operación directa o una lectura evidente, NO puede ser Difícil.

  No inventes ni cambies la etiqueta de dificultad únicamente para cumplir la distribución. La etiqueta debe corresponder al razonamiento real de la pregunta.

  `
      : `
  DIFICULTAD SOLICITADA:
  Todas las preguntas deben tener dificultad "${difficulty}".

  CALIBRACIÓN OBLIGATORIA DE DIFICULTAD:

  FÁCIL:
  - Puede resolverse mediante una idea matemática o conceptual directa.
  - Normalmente requiere un solo paso de razonamiento.
  - La información relevante es clara.
  - No requiere combinar varias evidencias.

  MEDIA:
  - DEBE requerir más que una operación o identificación directa.
  - Debe exigir al menos dos pasos de razonamiento relacionados, o una interpretación no inmediata.
  - Debe implicar comparar, relacionar, transformar o analizar información.
  - Una pregunta que pueda resolverse leyendo directamente un dato o aplicando una única operación sencilla NO es suficientemente difícil para Media.
  - No uses números grandes, textos largos ni operaciones innecesarias para aparentar dificultad.

  DIFÍCIL:
  - Debe exigir razonamiento de varios pasos o una inferencia no evidente.
  - Debe integrar dos o más ideas, condiciones, representaciones o evidencias.
  - Puede requerir comparar estrategias, analizar restricciones, interpretar información compleja o justificar una conclusión.
  - No debe poder resolverse mediante una sola operación o lectura superficial.
  - No hagas que "Difícil" signifique simplemente hacer cálculos más largos.

  REGLA CRÍTICA:
  Antes de asignar la etiqueta de dificultad, resuelve mentalmente cada pregunta y determina cuál es el nivel mínimo de razonamiento necesario.

  Si la pregunta puede resolverse mediante una sola operación directa, NO la clasifiques como Media ni Difícil.

  Si una pregunta no alcanza realmente el nivel "${difficulty}", debes modificar su estructura para que el razonamiento corresponda al nivel solicitado.

  La dificultad debe surgir del razonamiento, no del tamaño de los números, la longitud del texto ni operaciones artificiales.
  `;
  const compactGenerationPlan =
    generationPlan.slice(0, amount).map(
      (item, index) => ({
        question_number: index + 1,
        component: item.component,
        competence: item.competence,
        skill: item.skill,
        structure_type:
          item.structure_type,
        context_type:
          item.context_type,
        requires_visual:
          item.requires_visual,
      })
    );
  
  const normalizedSubject = normalize(subject);

  const referenceComponents = Array.from(
    new Set(
      profiles
        .map((profile) => profile.component)
        .filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
    )
  );

  const referenceCompetences = Array.from(
    new Set(
      profiles
        .map((profile) => profile.competence)
        .filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
    )
  );

  const referenceCalibrationSection =
    referenceComponents.length > 0 ||
    referenceCompetences.length > 0
      ? `
  =========================================================
  CALIBRACIÓN ESTRUCTURAL A PARTIR DEL MATERIAL DE REFERENCIA
  =========================================================

  Componentes observados en el material de referencia:
  ${
    referenceComponents.length > 0
    ? referenceComponents.join(" | ")
    : "No disponibles"
  }

  Competencias observadas en el material de referencia:
  ${
    referenceCompetences.length > 0
      ? referenceCompetences.join(" | ")
      : "No disponibles"
  }

  REGLAS:

  - Utiliza estos elementos para orientar la variedad de las preguntas.
  - No repitas innecesariamente el mismo componente.
  - No repitas innecesariamente la misma competencia.
  - Cuando la cantidad solicitada lo permita, distribuye las preguntas
    entre diferentes componentes y competencias.
  - Mantén siempre la coherencia con la materia y sesión solicitadas.
  - No inventes nombres de competencias o componentes que no estén
    respaldados por el blueprint de la materia.
  - Estos datos sirven para calibrar la estructura pedagógica,
    NO para copiar preguntas del material de referencia.
  `
      : `
  =========================================================
  CALIBRACIÓN ESTRUCTURAL
  =========================================================

  No hay suficientes perfiles de referencia para establecer una
  distribución específica.

  Utiliza el blueprint de la materia y rota las competencias,
  componentes y tipos de razonamiento cuando la cantidad solicitada
  lo permita.
  `;

  const diversitySection = `
  =========================================================
  DIVERSIDAD OBLIGATORIA DE ESTRUCTURAS
  =========================================================

  No generes todas las preguntas usando el mismo patrón de
  razonamiento.

  Para el lote actual, distribuye las preguntas entre diferentes
  estructuras cuando la cantidad solicitada lo permita.

  Alterna entre estructuras como:

  1. Interpretación de información.
  2. Comparación de datos o situaciones.
  3. Aplicación de un procedimiento a una situación.
  4. Inferencia a partir de información.
  5. Predicción de un resultado.
  6. Evaluación de una afirmación o conclusión.
  7. Validación de un procedimiento.
  8. Relación entre diferentes representaciones.
  9. Selección o justificación de una estrategia.
  10. Análisis de una relación, cambio o tendencia.

  REGLAS:

  - No uses la misma estructura de razonamiento en preguntas
    consecutivas salvo que el contexto pedagógico lo justifique.
  - Cambiar únicamente números, nombres, meses o escenarios NO
    cuenta como una estructura diferente.
  - Si dos preguntas utilizan una gráfica, procura que no ambas
    pidan simplemente identificar el mayor o menor valor.
  - Si dos preguntas utilizan una tabla, procura que exijan
    operaciones o interpretaciones diferentes.
  - Los cambios deben afectar el razonamiento requerido, no solo
    la apariencia superficial de la pregunta.
  - Mantén siempre coherencia con la competencia, componente,
    dificultad y blueprint de la materia.
  `;

    /* =========================================================
       DIVERSIDAD VISUAL POR MATERIA
    ========================================================= */

    const visualDiversityRules = `
  =========================================================
  SELECCIÓN Y DIVERSIDAD DE VISUALES POR MATERIA
  =========================================================

  El visual NO debe elegirse al azar.

  Primero determina qué representación permite evaluar mejor
  la habilidad de la pregunta y después selecciona el tipo visual
  más apropiado.

  MATEMÁTICAS
  - chart → datos estadísticos, tendencias y comparaciones.
  - table → organización y análisis de datos.
  - math_graph → funciones, relaciones, variación y coordenadas.
  - geometry → propiedades, medidas y relaciones espaciales.
  - diagram → procesos, relaciones o representaciones matemáticas.

  No conviertas todas las preguntas estadísticas en gráficas
  del mismo tipo.

  CIENCIAS NATURALES
  - chart → resultados experimentales, variables y tendencias.
  - table → mediciones, observaciones y resultados experimentales.
  - diagram → procesos, sistemas y relaciones causales.
  - math_graph → relaciones cuantitativas cuando una gráfica
    cartesiana sea realmente necesaria.
  - geometry → modelos espaciales o representaciones físicas
    cuando las medidas sean relevantes.

  Una pregunta científica no debe convertirse automáticamente
  en una gráfica.

  LECTURA CRÍTICA
  Utiliza visuales solamente cuando formen parte real del
  material que debe interpretarse.

  Prioriza:
  - diagram → relación entre elementos.
  - table → comparación organizada de información.
  - chart → datos explícitos que deban interpretarse.

  No agregues un visual solamente para decorar.

  SOCIALES Y CIUDADANAS
  - chart → estadísticas y tendencias sociales.
  - table → comparación de datos.
  - diagram → relaciones institucionales, procesos o estructuras.
  - geometry → solamente cuando exista una representación espacial
    o cuantitativa pertinente.

  No conviertas automáticamente un fenómeno histórico o político
  en una gráfica.

  INGLÉS
  - table → horarios, precios, información organizada
    o comparaciones.
  - diagram → relaciones o secuencias simples.
  - chart → datos explícitos que formen parte del contexto.

  No utilices visuales cuando el texto por sí solo sea suficiente.

  REGLAS DE DIVERSIDAD VISUAL
  - No repitas el mismo visual_type en todas las preguntas del lote.
  - Si varias representaciones son igualmente válidas, procura
    alternar el tipo visual.
  - No cambies el visual únicamente para aparentar diversidad.
  - El visual debe seguir siendo necesario para resolver la pregunta.
  - La estructura de la pregunta y el visual pueden variar
    independientemente cuando sea pedagógicamente apropiado.
  - Un mismo tipo visual puede repetirse si el contenido realmente
    lo exige.
  - Nunca fuerces un visual que no corresponda con la competencia.

  PRIORIDAD:
  1. Coherencia con la competencia.
  2. Utilidad para resolver la pregunta.
  3. Fidelidad al estímulo.
  4. Diversidad.
  5. Apariencia profesional.

  No escribas estas reglas en el JSON final.
  Úsalas internamente para decidir el visual.
  `;

  /* =========================================================
     PERFIL DE EVALUACIÓN POR MATERIA
  ========================================================= */

  const subjectBlueprints: Record<string, string> = {
    matematicas: `
=========================================================
MATEMÁTICAS — BLUEPRINT
=========================================================

PROPÓSITO:
Evalúa la capacidad del estudiante para interpretar información,
resolver situaciones utilizando herramientas matemáticas y
justificar decisiones o procedimientos.

COMPETENCIAS PRINCIPALES:
1. Interpretación y representación.
2. Formulación y ejecución.
3. Argumentación.

COMPONENTES QUE DEBES ROTAR:
- Numérico-variacional.
- Geométrico-métrico.
- Aleatorio.

TIPOS DE SITUACIÓN:
- Situaciones de la vida cotidiana.
- Datos estadísticos.
- Tablas.
- Gráficas.
- Porcentajes.
- Proporciones.
- Variación.
- Modelación.
- Geometría.
- Medición.
- Probabilidad.
- Análisis de información.
- Situaciones financieras o sociales cuando sean apropiadas.

REGLAS:
- No conviertas la pregunta en un ejercicio escolar mecánico.
- Evita preguntas del tipo "resuelve X" sin contexto cuando el contexto sea pertinente.
- Prioriza interpretar una situación y tomar una decisión matemática.
- Cuando uses cálculos, debe existir una razón para realizarlos.
- Puedes incluir tablas o datos de apoyo dentro de context_text cuando sean parte del estímulo.
- Si la pregunta depende de interpretar una gráfica, DEBES generar el visual estructurado correspondiente. No reemplaces una gráfica necesaria por una simple descripción textual o una tabla.
- Incluye distractores asociados a errores matemáticos plausibles.
- Una opción no puede ser incorrecta simplemente porque contiene un número absurdo.
- Algunas preguntas deben exigir dos o más pasos de razonamiento.
- Algunas deben exigir comparar estrategias.
- Algunas deben exigir interpretar una representación.
- Algunas deben exigir justificar por qué un procedimiento es válido o inválido.

EJEMPLOS DE ESTRUCTURA, NO PARA COPIAR:
- Una situación presenta datos y el estudiante debe identificar qué representación permite responder una pregunta.
- Una situación presenta dos procedimientos y el estudiante debe determinar cuál es correcto.
- Una situación presenta una variación y el estudiante debe inferir qué ocurrirá bajo una condición diferente.
- Una situación presenta información estadística y el estudiante debe evaluar una conclusión.
- Una situación geométrica exige relacionar medidas, propiedades y representación.

EVITA:
- Operaciones aisladas.
- Preguntas de memoria de fórmulas.
- "¿Cuánto es 5 + 7?" disfrazado de contexto.
- Procedimientos sin interpretación.
`,

    "lectura critica": `
=========================================================
LECTURA CRÍTICA — BLUEPRINT
=========================================================

PROPÓSITO:
Evalúa la capacidad de comprender, interpretar y evaluar textos
de ámbitos cotidianos y académicos no especializados.

COMPETENCIAS:
1. Comprender el sentido local de los componentes del texto.
2. Comprender cómo se articulan las partes para construir el sentido global.
3. Reflexionar y evaluar el contenido y la forma del texto.

TIPOS DE TEXTO:
- Argumentativo.
- Expositivo.
- Informativo.
- Narrativo.
- Ensayístico.
- Divulgativo.
- Texto de opinión.
- Fragmentos de textos académicos no especializados.

TIPOS DE TAREA:
- Identificar una idea explícita relevante.
- Inferir información.
- Relacionar partes del texto.
- Identificar función de una expresión.
- Reconstruir relaciones lógicas.
- Determinar propósito.
- Evaluar una afirmación.
- Analizar una postura.
- Identificar supuestos.
- Contrastar perspectivas.
- Evaluar la fuerza de un argumento.

REGLAS:
- El contexto_text debe contener el texto completo necesario para responder.
- No dependas de conocimiento externo.
- La respuesta debe obtenerse mediante lectura y razonamiento sobre el texto.
- Las cuatro opciones deben parecer posibles para alguien que haya leído superficialmente.
- Los distractores deben representar interpretaciones plausibles pero incorrectas.
- No hagas preguntas de vocabulario aislado salvo que la palabra sea relevante para el sentido del texto.
- No preguntes simplemente "¿de qué trata?" repetidamente.
- Varía la posición de la respuesta correcta.
- Alterna preguntas locales, globales y críticas.

EVITA:
- Preguntas de memoria.
- Preguntas cuya respuesta no esté sustentada por el texto.
- Opciones obviamente absurdas.
- Textos excesivamente simples.
- Preguntas repetitivas sobre la idea principal.
`,

    "sociales y ciudadanas": `
=========================================================
SOCIALES Y CIUDADANAS — BLUEPRINT
=========================================================

PROPÓSITO:
Evalúa conocimientos y habilidades para comprender fenómenos
sociales y utilizar esa comprensión para analizar situaciones
relacionadas con la ciudadanía.

EJES DE RAZONAMIENTO:
- Pensamiento social.
- Interpretación y análisis de perspectivas.
- Pensamiento reflexivo y sistémico.

TIPOS DE CONTEXTO:
- Situaciones políticas.
- Situaciones económicas.
- Situaciones históricas.
- Conflictos sociales.
- Problemas ambientales.
- Participación ciudadana.
- Derechos y deberes.
- Instituciones.
- Relaciones de poder.
- Cambios históricos.
- Problemas públicos.
- Situaciones donde existan perspectivas enfrentadas.

REGLAS:
- No conviertas la pregunta en memorización de fechas, nombres o artículos.
- El conocimiento disciplinar debe utilizarse para interpretar una situación.
- Presenta información suficiente para razonar.
- Cuando existan perspectivas diferentes, representa correctamente las posiciones.
- Las opciones incorrectas deben ser interpretaciones plausibles.
- Algunas preguntas deben exigir identificar una perspectiva.
- Algunas deben exigir explicar una relación causal o histórica.
- Algunas deben exigir evaluar una decisión.
- Algunas deben exigir analizar consecuencias de una acción.
- Algunas deben exigir integrar diferentes elementos de una situación.

EVITA:
- "¿En qué año ocurrió...?" como pregunta aislada.
- Preguntas de cultura general.
- Preguntas donde la opción correcta sea simplemente la opinión moralmente más atractiva.
- Preguntas partidistas o ideológicamente sesgadas.
`,

    "ciencias naturales": `
=========================================================
CIENCIAS NATURALES — BLUEPRINT
=========================================================

PROPÓSITO:
Evalúa la capacidad para comprender y utilizar conceptos y
teorías de las ciencias naturales en situaciones y problemas,
así como interpretar evidencia y razonar científicamente.

ÁREAS QUE DEBEN ROTARSE:
- Biología.
- Física.
- Química.
- Ciencia, tecnología y sociedad.

TIPOS DE TAREA:
- Explicar un fenómeno.
- Interpretar datos.
- Analizar resultados experimentales.
- Identificar una variable.
- Evaluar una hipótesis.
- Relacionar evidencia con una conclusión.
- Predecir un resultado bajo determinadas condiciones.
- Analizar una representación.
- Comparar explicaciones.
- Evaluar la validez de una conclusión.

REGLAS:
- Prioriza razonamiento científico sobre memorización.
- Si incluyes un experimento, proporciona la información necesaria.
- Las preguntas experimentales deben permitir identificar variables,
  controles, resultados o conclusiones.
- Los distractores deben corresponder a errores científicos plausibles.
- No utilices información científica innecesariamente avanzada para grado 11.
- Integra conceptos cuando el contexto lo permita.
- Algunas preguntas deben exigir interpretar datos antes de responder.
- Algunas deben exigir conectar evidencia y explicación.

EVITA:
- Definiciones aisladas.
- Preguntas de memoria sin aplicación.
- Datos insuficientes.
- Explicaciones que dependan de conocimiento universitario especializado.
`,

    ingles: `
=========================================================
INGLÉS — BLUEPRINT
=========================================================

PROPÓSITO:
Evalúa la competencia comunicativa en lengua inglesa.

REGLAS GENERALES:
- Todo el material lingüístico evaluado debe estar en inglés.
- Utiliza inglés natural y apropiado para estudiantes de grado 11.
- No introduzcas vocabulario innecesariamente raro.
- Las opciones incorrectas deben ser lingüísticamente plausibles.
- Evita que la respuesta correcta destaque por longitud o gramática.

TIPOS DE TAREA:
- Comprensión de avisos y textos breves.
- Comprensión de conversaciones.
- Comprensión de mensajes.
- Comprensión de textos informativos.
- Vocabulario en contexto.
- Gramática en contexto.
- Relaciones entre información.
- Comprensión global.
- Inferencia.

REGLAS:
- El contexto debe ser suficiente para resolver la pregunta.
- No conviertas la prueba en una lista de reglas gramaticales.
- Prioriza comunicación y comprensión.
- Alterna contextos cotidianos y académicos apropiados.
- Las opciones deben mantener coherencia gramatical con el contexto.
- Si evalúas una palabra, su significado debe depender del contexto.

EVITA:
- Traducciones directas al español.
- Preguntas de gramática completamente aisladas.
- Vocabulario extremadamente especializado.
- Opciones obviamente incorrectas.
`,
  };

  const blueprint =
    subjectBlueprints[normalizedSubject] ??
    `
=========================================================
MATERIA — BLUEPRINT GENERAL
=========================================================

Evalúa conocimientos y habilidades de grado 11 mediante situaciones
que exijan interpretar información, aplicar conocimientos, analizar
evidencia, establecer relaciones y justificar una respuesta.

No generes ejercicios mecánicos ni preguntas de memorización
cuando puedan sustituirse por una situación de aplicación.
`;

  /* =========================================================
     DISTRIBUCIÓN DE ESTRUCTURAS
  ========================================================= */

  const structureRules = `
=========================================================
VARIACIÓN OBLIGATORIA DE ESTRUCTURAS
=========================================================

No generes ${amount} preguntas con la misma plantilla.

Debes variar entre estructuras como:

1. Situación + pregunta directa.
2. Situación + interpretación de datos.
3. Texto/estímulo + inferencia.
4. Texto/estímulo + análisis de una afirmación.
5. Tabla + conclusión.
6. Datos + predicción.
7. Problema + selección de estrategia.
8. Situación + comparación de alternativas.
9. Evidencia + explicación.
10. Situación + evaluación de una decisión.
11. Dos perspectivas + análisis.
12. Procedimiento + identificación del error.
13. Modelo o representación + interpretación.
14. Situación + consecuencia de modificar una condición.

NO significa que debas usar todas en cada lote.

Significa que debes evitar que todas las preguntas tengan
exactamente la misma arquitectura.

No empieces todas las preguntas con:
- "Un estudiante..."
- "Una empresa..."
- "En una escuela..."
- "¿Cuál de las siguientes...?"

Varía los escenarios y la redacción.
`;

  /* =========================================================
     REGLAS DE ESTÍMULOS
  ========================================================= */

  const stimulusRules = `
=========================================================
ESTÍMULOS Y CONTEXTO
=========================================================

Una pregunta tipo ICFES puede partir de un estímulo.

Cuando sea útil, utiliza:
- textos,
- tablas,
- datos,
- descripciones de gráficas,
- diálogos,
- experimentos,
- situaciones sociales,
- escenarios matemáticos,
- fragmentos informativos.

El estímulo debe tener una función real.

NO agregues contexto únicamente para hacer la pregunta más larga.

Si context_text no es necesario:
"context_text": null

Si es necesario:
"context_text" debe contener TODO el material que el estudiante
necesita para responder.

La pregunta no debe depender de información externa que no aparezca
en el estímulo o que no corresponda razonablemente al conocimiento
esperado de grado 11.
`;

  /* =========================================================
     REGLAS DE OPCIONES
  ========================================================= */

  const optionRules = `
=========================================================
OPCIONES DE RESPUESTA
=========================================================

Cada pregunta tiene EXACTAMENTE cuatro opciones:
A, B, C y D.

Debe existir UNA ÚNICA respuesta correcta.

=========================================================
DIFERENCIACIÓN OBLIGATORIA DE LAS OPCIONES
=========================================================

Las cuatro opciones DEBEN ser materialmente diferentes entre sí.

Antes de entregar cada pregunta, verifica internamente que:

- A, B, C y D no sean iguales.
- A, B, C y D no sean prácticamente iguales.
- No repitas la misma respuesta cambiando únicamente unidades,
  signos, palabras menores o formato.
- No copies una opción dentro de otra.
- No generes cuatro opciones que expresen exactamente la misma idea.
- Cada distractor debe representar un razonamiento o error diferente.
- Debe existir una sola opción que pueda defenderse como correcta.

EJEMPLO INCORRECTO:

A: "20"
B: "20"
C: "20"
D: "20"

EJEMPLO INCORRECTO:

A: "50 estudiantes"
B: "50 estudiantes"
C: "50 estudiantes"
D: "50 estudiantes"

EJEMPLO INCORRECTO:

A: "12 m"
B: "12 metros"
C: "12 metros de longitud"
D: "12 m de longitud"

Estas opciones representan esencialmente la misma respuesta y NO deben generarse.

EJEMPLO CORRECTO:

A: "12 m"
B: "15 m"
C: "18 m"
D: "20 m"

=========================================================
DISTRACTORES
=========================================================

Los distractores deben representar errores o razonamientos
plausibles y DIFERENTES entre sí.

Pueden representar:

- una interpretación parcial,
- un error de procedimiento,
- una confusión conceptual,
- una inferencia incorrecta,
- una lectura superficial,
- una aplicación incorrecta de una regla,
- una conclusión que parece razonable pero no está sustentada.

Para preguntas matemáticas:

- Los distractores deben provenir de errores matemáticos plausibles.
- No generes cuatro resultados iguales.
- No generes resultados equivalentes expresados de otra manera.
- Si una opción representa un error de cálculo, las demás deben
  representar errores diferentes.
- Comprueba internamente el resultado correcto antes de construir
  las opciones.

NO utilices distractores absurdos.

=========================================================
RESPUESTA CORRECTA
=========================================================

NO hagas que la respuesta correcta:

- sea siempre la más larga,
- sea siempre la más específica,
- tenga más información,
- utilice vocabulario más sofisticado,
- sea siempre B o C.

Distribuye A, B, C y D como respuesta correcta.

=========================================================
VERIFICACIÓN OBLIGATORIA ANTES DEL JSON
=========================================================

Antes de entregar cada pregunta:

1. Resuelve la pregunta internamente.
2. Determina cuál es la única respuesta correcta.
3. Construye tres distractores plausibles basados en errores diferentes.
4. Compara A, B, C y D.
5. Si dos opciones son iguales o prácticamente equivalentes,
   DESCARTA esas opciones y crea distractores nuevos.
6. Verifica nuevamente que exista UNA SOLA respuesta correcta.
7. Solo después entrega la pregunta en el JSON.

Las cuatro opciones deben tener una longitud razonablemente
comparable cuando la naturaleza de la pregunta lo permita.
`;

  /* =========================================================
     RAZONAMIENTO ICFES
  ========================================================= */

  const icfesReasoningRules = `
=========================================================
ESTILO DE RAZONAMIENTO
=========================================================

La pregunta debe evaluar una HABILIDAD.

Antes de crear cada pregunta determina internamente:

1. ¿Qué competencia se está evaluando?
2. ¿Qué conocimiento o recurso necesita el estudiante?
3. ¿Qué operación cognitiva debe realizar?
4. ¿Qué evidencia demuestra que eligió correctamente?
5. ¿Por qué cada distractor resulta plausible?
6. ¿Qué hace que esta pregunta no sea simplemente memorística?

NO escribas esas respuestas en el JSON.

Úsalas para construir la pregunta.

PRIORIZA:
- interpretación,
- inferencia,
- análisis,
- aplicación,
- comparación,
- evaluación,
- argumentación,
- relación entre variables,
- uso de evidencia,
- toma de decisiones fundamentada.

REDUCE:
- memoria literal,
- definiciones,
- operaciones mecánicas,
- preguntas de una sola palabra,
- preguntas resolubles por eliminación superficial.
`;

  /* =========================================================
     CONTROL DE CALIDAD
  ========================================================= */

  const qualityRules = `
=========================================================
CONTROL DE CALIDAD ANTES DE RESPONDER
=========================================================

Antes de entregar el JSON revisa internamente CADA pregunta.

DESCARTA Y REEMPLAZA cualquier pregunta que:

- sea demasiado básica para grado 11;
- sea una pregunta escolar mecánica sin razonamiento;
- tenga más de una respuesta defendible;
- no tenga información suficiente;
- dependa de información externa innecesaria;
- tenga una opción obviamente correcta;
- tenga distractores absurdos;
- repita la estructura de otra pregunta;
- sea prácticamente una paráfrasis de otra;
- tenga una respuesta correcta inconsistente con el contexto;
- utilice un concepto fuera del nivel esperado;
- dependa de ambigüedad lingüística accidental;
- evalúe otra competencia diferente a la declarada;
- use un contexto artificial únicamente para disfrazar un ejercicio simple.

Una pregunta de calidad debe poder defenderse pedagógicamente:
debe existir una razón clara por la cual la respuesta correcta
es correcta y las otras tres son incorrectas.

VERIFICACIÓN MATEMÁTICA OBLIGATORIA:

Cuando la pregunta implique cálculos, fórmulas, relaciones numéricas,
probabilidad, porcentajes, proporciones, geometría, funciones, datos
estadísticos o interpretación cuantitativa:

- Resuelve internamente la pregunta antes de construir el JSON.
- Comprueba nuevamente el procedimiento y el resultado.
- Comprueba que la opción indicada en "correct_answer" coincide exactamente
  con el resultado obtenido.
- Comprueba que ninguna otra opción también pueda ser correcta.
- Si utilizas porcentajes, razones o proporciones, verifica las operaciones.
- Si utilizas geometría, verifica las medidas y las relaciones geométricas.
- Si utilizas tablas o gráficas, verifica que los datos del visual coincidan
  exactamente con la pregunta y con la respuesta correcta.
- Si utilizas una función, ecuación o expresión algebraica, verifica que
  los valores utilizados sean consistentes con ella.
- Los distractores matemáticos deben provenir de errores plausibles,
  no de resultados aleatorios.
- Si detectas una inconsistencia entre el enunciado, los datos, las opciones,
  la respuesta correcta o el visual, DESCARTA esa pregunta y créala de nuevo.

La respuesta correcta nunca debe depender de un cálculo incorrecto,
un dato contradictorio o una interpretación matemática ambigua.

No expliques este proceso en la respuesta.
`;

  /* =========================================================
     DIFICULTAD
  ========================================================= */

  const difficultyInstructions = `
=========================================================
DIFICULTAD
=========================================================

${difficultyRule}

Para aumentar dificultad puedes modificar:

- cantidad de información relevante;
- necesidad de integrar varias evidencias;
- cantidad de pasos razonables;
- relación entre diferentes representaciones;
- presencia de información distractora pertinente;
- necesidad de comparar alternativas;
- nivel de inferencia;
- complejidad del razonamiento.

NO aumentes dificultad simplemente:
- haciendo números enormes;
- haciendo textos innecesariamente largos;
- utilizando palabras raras;
- agregando operaciones sin propósito.
`;

  /* =========================================================
     ORIGINALIDAD
  ========================================================= */

  const compactExistingQuestions =
    existingQuestions.slice(-12).map((question, index) => {
      const normalized = question
        .replace(/\s+/g, " ")
        .trim();

      return `${index + 1}. ${normalized.slice(0, 140)}`;
    });
  
  const excludedSection =
    existingQuestions.length > 0
      ? `
=========================================================
PREGUNTAS YA GENERADAS
=========================================================

Estas preguntas ya fueron generadas en esta misma solicitud:

${compactExistingQuestions.join("\n")}

REGLAS:

- NO repitas ninguna pregunta.
- NO parafrasees ninguna pregunta.
- NO reutilices el mismo escenario cambiando únicamente números.
- NO reutilices la misma estructura con palabras diferentes.
- Cambia el contexto.
- Cambia la habilidad evaluada cuando sea posible.
- Cambia los datos.
- Cambia el razonamiento necesario.
- Cambia los distractores.

La nueva pregunta debe ser genuinamente diferente.
`
      : `
=========================================================
PREGUNTAS PREVIAS
=========================================================

No existen preguntas previas en este lote.

Aun así, todas las preguntas deben ser diferentes entre sí.
`;

  /* =========================================================
     REFERENCIAS
  ========================================================= */

  const compactReferenceProfiles = profiles
    .slice(0, 8)
    .map((profile) => ({
      component: profile.component,
      competence: profile.competence,
      skill: profile.skill,
      difficulty: profile.difficulty,
      structure_type: profile.structure_type,
      context_type: profile.context_type,
      requires_visual: profile.requires_visual,
    }));
  
  const referenceSection =
    profiles.length > 0
      ? `
=========================================================
PERFILES DE REFERENCIA DE PEAKSCORE
=========================================================

Los siguientes perfiles provienen de preguntas/perfiles existentes
en PeakScore.

UTILÍZALOS PARA CALIBRAR:
- componente,
- competencia,
- dificultad,
- tipo de contexto,
- estructura,
- necesidad de recursos visuales.

IMPORTANTE:

Las referencias NO deben copiarse.

NO reproduzcas:
- textos,
- preguntas,
- opciones,
- números,
- nombres,
- escenarios específicos.

Solo estudia sus patrones pedagógicos.

PERFILES:

${JSON.stringify(compactReferenceProfiles)}
`
      : `
=========================================================
REFERENCIAS
=========================================================

No hay perfiles específicos disponibles.

Utiliza el blueprint de la materia y las reglas de evaluación
proporcionadas en este prompt.
`;

  const isCalibrationBlock = profiles.length > 0;

  const adaptivePromptSections = isCalibrationBlock
    ? `
    ${referenceCalibrationSection}

    ${diversitySection}

    ${visualDiversityRules}

    ${difficultyInstructions}

    ${referenceSection}

    ${excludedSection}
    `
    : `
    =========================================================
    BLOQUE POSTERIOR — MANTENER CALIDAD Y VARIAR
    =========================================================

    La calibración estructural ya fue realizada en el primer bloque.

    Mantén estas reglas obligatorias:

    - Genera preguntas genuinamente nuevas.
    - No repitas ni parafrasees preguntas anteriores.
    - Cambia el razonamiento requerido.
    - Cambia contexto, datos y distractores.
    - Mantén coherencia con ${subject} y la sesión ${session}.
    - Respeta la dificultad solicitada.
    - Utiliza visuales solamente cuando sean necesarios.
    - Mantén coherencia entre pregunta, visual, respuesta y explicación.
    - Evita reutilizar el mismo patrón de razonamiento.
    - Devuelve exactamente ${amount} preguntas.

    ${excludedSection}
    `;

  /* =========================================================
     PROMPT FINAL
  ========================================================= */

  return `
Eres un especialista senior en evaluación educativa y diseño de
preguntas para estudiantes colombianos de grado 11.

Tu tarea es crear preguntas NUEVAS para PeakScore, una plataforma
de preparación para el examen Saber 11°.

El objetivo NO es producir ejercicios escolares genéricos.

El objetivo es producir preguntas de selección múltiple con única
respuesta que exijan razonamiento, interpretación, aplicación,
análisis o evaluación, siguiendo una estructura pedagógica
compatible con el enfoque de evaluación del ICFES.

=========================================================
SOLICITUD
=========================================================

Genera EXACTAMENTE ${amount} preguntas nuevas.

Materia:
${subject}

Sesión:
${session}

${isCalibrationBlock
  ? blueprint
  : `
BLUEPRINT YA CALIBRADO

Mantén estrictamente la materia "${subject}" y la sesión ${session}.

Conserva la coherencia con los componentes, competencias,
habilidades y tipos de razonamiento definidos para esta materia.

No inventes componentes ni competencias fuera del blueprint
ya establecido.
`}

${adaptivePromptSections}

=========================================================
PLAN DE ARQUITECTURA DEL BLOQUE
=========================================================

Cada pregunta debe seguir la arquitectura indicada para su posición.

${JSON.stringify(compactGenerationPlan)}

No copies literalmente los perfiles.
Utilízalos únicamente para determinar:

- componente
- competencia
- habilidad
- estructura de pregunta
- tipo de contexto
- necesidad de visual

La arquitectura debe guiar el razonamiento de cada pregunta,
pero el contenido debe ser completamente nuevo.

=========================================================
REGLAS GENERALES
=========================================================

1. Todas las preguntas deben corresponder a "${subject}".

2. Todas deben corresponder a la sesión ${session}.

3. Cada pregunta debe tener una única respuesta correcta.

4. Las preguntas deben ser apropiadas para estudiantes de grado 11
   en Colombia.

5. Utiliza español natural y claro, excepto en la prueba de Inglés,
   donde el material evaluado debe estar en inglés.

6. No copies preguntas oficiales del ICFES.

7. No reproduzcas material protegido.

8. No inventes datos externos necesarios para resolver la pregunta.

9. Cuando una pregunta necesite datos, proporciona esos datos.

10. Cuando utilices un texto, el texto debe ser original.

11. No utilices nombres de instituciones reales de manera innecesaria.

12. No dependas de acontecimientos recientes que puedan quedar
    desactualizados.

13. No generes preguntas triviales.

14. No hagas todas las preguntas difíciles.

15. No hagas todas las preguntas con contexto.

16. No hagas todas las preguntas sin contexto.

17. No hagas todas las preguntas con la misma estructura.

18. Varía la posición de la respuesta correcta entre A, B, C y D.

19. Cada pregunta debe evaluar una habilidad o razonamiento concreto.

20. Las opciones deben ser plausibles.

21. Los distractores deben tener una justificación pedagógica.

22. Evita pistas involuntarias en la redacción.

23. No pongas la respuesta correcta dentro del contexto.

24. La explicación debe justificar por qué la respuesta correcta es
    correcta y, cuando sea útil, explicar el error conceptual principal
    de los distractores.

25. No incluyas comentarios fuera del JSON.

=========================================================
REGLAS SOBRE COMPONENTE Y COMPETENCIA
=========================================================

El campo "component" debe representar el componente correspondiente
a la materia.

El campo "competence" debe representar la competencia realmente
evaluada por la pregunta.

No asignes componentes o competencias aleatoriamente.

La combinación debe tener sentido pedagógico.

Si la pregunta evalúa principalmente interpretación y representación,
no la etiquetes como argumentación.

Si evalúa análisis de perspectivas, no la etiquetes como simple
recuerdo de conocimiento histórico.

Si evalúa evidencia científica, la competencia debe reflejar esa
naturaleza.

=========================================================
REGLAS SOBRE DISEÑO CENTRADO EN EVIDENCIAS
=========================================================

Construye internamente cada pregunta siguiendo esta lógica:

DOMINIO
→ COMPETENCIA
→ LO QUE EL ESTUDIANTE DEBE PODER HACER
→ TAREA
→ ESTÍMULO
→ OPCIONES
→ EVIDENCIA DE RESPUESTA

No debes imprimir esta cadena.

Solo debe reflejarse en la calidad final de la pregunta.

=========================================================
REGLAS SOBRE CONTEXTO
=========================================================

No confundas "contextualizada" con "larga".

Un contexto es bueno cuando aporta información necesaria para
resolver la tarea.

Un contexto es malo cuando solo añade palabras.

Por lo tanto:

- Contexto breve cuando sea suficiente.
- Contexto más elaborado cuando la competencia lo requiera.
- Datos estructurados cuando faciliten el análisis.
- Texto cuando la lectura sea el objeto de evaluación.
- Situación experimental cuando se evalúe razonamiento científico.
- Situación matemática cuando la aplicación matemática sea central.

=========================================================
CONTRATO VISUAL PEAKSCORE
=========================================================

Los visuales forman parte del razonamiento cuando sean necesarios.
NO los uses como decoración.

TIPOS PERMITIDOS:
- chart
- table
- math_graph
- geometry
- diagram

NO generes map, illustration, infographic ni image_context.

REGLA GENERAL:

Si requires_visual === false:
- visual_type = null
- visual_description = null
- visual_data = null

Si requires_visual === true:
- visual_type debe ser uno de los tipos permitidos.
- visual_description debe describir el visual de forma breve.
- visual_data debe contener únicamente datos necesarios para construirlo.
- Los datos deben ser coherentes con el contexto, pregunta, opciones y respuesta.
- Nunca generes un visual que contradiga el enunciado.

---------------------------------------------------------
CHART
---------------------------------------------------------

Para barras, líneas, circular, dispersión o área.

visual_data:

{
  "chart_type": "bar | line | pie | scatter | area",
  "title": "string | null",
  "x_label": "string | null",
  "y_label": "string | null",
  "categories": ["string"],
  "series": [
    {
      "name": "string",
      "values": [number]
    }
  ]
}

Opcionales:
show_values, show_legend, show_grid, y_min, y_max.

Regla:
categories.length debe coincidir con values.length de cada serie.
Todos los valores deben ser números finitos.

---------------------------------------------------------
TABLE
---------------------------------------------------------

Úsala cuando la información tabular sea necesaria para resolver
o interpretar la pregunta.

visual_data:

{
  "title": "string | null",
  "headers": ["string"],
  "rows": [["string | number | boolean | null"]]
}

Opcionales:
emphasize_first_column, show_row_numbers.

Regla:
cada fila debe tener exactamente headers.length columnas.

---------------------------------------------------------
MATH_GRAPH
---------------------------------------------------------

Para planos cartesianos, funciones, puntos y relaciones entre
variables.

visual_data:

{
  "graph_type": "function | points | coordinate_plane | mixed",
  "title": "string | null",
  "x_label": "string | null",
  "y_label": "string | null",
  "x_range": [number, number],
  "y_range": [number, number],
  "points": [],
  "functions": []
}

Los puntos pueden contener:
x, y, label, id, show_label.

Las funciones pueden contener:
id, expression, label, domain, visible.

Las expresiones deben ser matemáticamente válidas.

Opcionales:
show_grid, show_axis_numbers, show_axes, x_axis, y_axis.

---------------------------------------------------------
GEOMETRY
---------------------------------------------------------

Para figuras geométricas que el renderer actual puede representar.

Shapes permitidas:
- triangle
- rectangle
- circle
- polygon

Para cuadrados usa "rectangle".

NO uses como shape:
- square
- semicircle
- trapezoid
- parallelogram
- rhombus
- composite

visual_data DEBE tener esta estructura:

{
  "title": "string | null",
  "shape": "triangle | rectangle | circle | polygon",
  "labels": [
    {
      "text": "string",
      "position": "top | bottom | left | right | center | top_left | top_right | bottom_left | bottom_right"
      - USA ÚNICAMENTE las posiciones indicadas arriba.
      - NO inventes ni uses posiciones como "bottom_center", "top_center", "middle_left", "middle_right" u otras variantes.
    }
  ],
  "measurements": [
    {
      "label": "string",
      "value": "string"
    }
  ]
}

REGLAS OBLIGATORIAS PARA "labels":

- "labels" SIEMPRE debe ser un arreglo.
- Cada elemento de "labels" DEBE ser un objeto.
- Cada objeto DEBE tener:
  - "text": string
  - "position": una de las posiciones permitidas.
- NO uses strings directamente dentro de "labels".
- INCORRECTO:
  "labels": ["Fachada"]
- CORRECTO:
  "labels": [
    {
      "text": "Fachada",
      "position": "center"
    }
  ]

REGLAS OBLIGATORIAS PARA "measurements":

- "measurements" SIEMPRE debe ser un arreglo.
- Cada elemento DEBE ser un objeto.
- Cada objeto DEBE tener:
  - "label": string
  - "value": string
- "value" DEBE ser string aunque represente un número.
- Si necesitas expresar una unidad, inclúyela dentro de "value".
- INCORRECTO:
  {
    "label": "Ancho",
    "value": 12,
    "unit": "m"
  }
- CORRECTO:
  {
    "label": "Ancho",
    "value": "12 m"
  }

NO agregues "unit" como propiedad separada.

Las etiquetas deben describir elementos relevantes de la figura
y utilizar posiciones válidas.

Las medidas deben corresponder realmente a dimensiones,
longitudes, radios u otras cantidades representadas en la figura.

Puede incluir opcionalmente:

- points
- segments
- preserve_aspect_ratio
- show_measurements

Si utilizas "points":

- Cada punto debe tener un "id" único.
- "x" debe ser numérico.
- "y" debe ser numérico.
- Los puntos deben corresponder a la figura.

Si utilizas "segments":

- "from" debe referenciar el "id" de un punto existente.
- "to" debe referenciar el "id" de un punto existente.
- No referencias puntos inexistentes.

Las medidas, etiquetas, puntos y segmentos deben ser
coherentes entre sí y con la figura.

Nunca generes propiedades inventadas para Geometry.

IMPORTANTE:
El JSON generado debe respetar exactamente este contrato.
No simplifiques "labels" ni "measurements".

IMPORTANTE SOBRE CUTOUTS:

El renderer actual de PeakScore representa de forma nativa
recortes semicirculares en geometría.

Por lo tanto, cuando una figura requiera un recorte:

{
  "cutouts": [
    {
      "type": "semicircle",
      "side": "top | bottom | left | right",
      "radius": number,
      "removed": true
    }
  ]
}

NO generes cutouts de tipo:
- rectangle
- triangle
- circle

aunque esos tipos puedan existir en definiciones internas
de compatibilidad.

Para puertas, ventanas, huecos rectangulares u otras regiones
internas que no puedan representarse como recorte semicircular,
NO uses cutouts.

En ese caso, utiliza una figura geométrica cuya información
necesaria pueda representarse mediante:
- shape
- labels
- measurements
- points
- segments

Nunca generes datos visuales que el renderer no pueda representar.

---------------------------------------------------------
DIAGRAM
---------------------------------------------------------

Para procesos, experimentos, relaciones, sistemas y flujos.

visual_data:

{
  "title": "string | null",
  "elements": [
    {
      "id": "string",
      "label": "string"
    }
  ],
  "connections": [
    {
      "from": "id existente",
      "to": "id existente",
      "label": "string | null"
    }
  ]
}

Los ids deben ser únicos.
Toda conexión debe apuntar a elementos existentes.

Opcionales:
type, x, y, width, height, directional, layout.

layout:
horizontal | vertical | free

---------------------------------------------------------
CALIDAD VISUAL
---------------------------------------------------------

El visual debe parecer material educativo profesional.

Prioriza:
- claridad
- exactitud
- proporciones coherentes
- etiquetas legibles
- simplicidad
- utilidad para resolver la pregunta

Evita:
- decoración innecesaria
- datos ambiguos
- colores o elementos irrelevantes
- gráficos imposibles de interpretar
- complejidad sin propósito

REGLA CRÍTICA:

El estudiante debe necesitar la información visual para resolver
la tarea cuando requires_visual sea true.

El visual, la pregunta, las opciones, la respuesta correcta y la
explicación deben describir exactamente la misma situación.

=========================================================
FORMATO DE SALIDA
=========================================================

Devuelve ÚNICAMENTE JSON válido.

NO uses Markdown.

NO uses bloques \`\`\`.

NO escribas explicaciones antes ni después del JSON.

La estructura EXACTA debe ser:

{
  "questions": [
    {
      "subject": "${subject}",
      "session": ${session},
      "component": "string o null",
      "competence": "string o null",
      "skill": "string o null",
      "difficulty": "Fácil | Media | Difícil",
      "structure_type": "string o null",
      "context_type": "string o null",
      "question": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "correct_answer": "A | B | C | D",
      "explanation": "string",
      "context_text": "string o null",
      "requires_visual": true | false,
      "visual_type": "chart | table | math_graph | diagram | geometry | null",
      "visual_description": "string o null",
      "visual_data": "object o null"
    }
  ]
}

La respuesta DEBE contener exactamente ${amount} objetos dentro de
"questions".

No agregues propiedades adicionales.

=========================================================
VALIDACIÓN FINAL INTERNA
=========================================================

Antes de responder, verifica internamente:

- Exactamente ${amount} preguntas.
- Todas pertenecen a ${subject}, sesión ${session} y dificultad solicitada.
- Cada pregunta tiene A, B, C y D y una única respuesta correcta.
- La respuesta correcta coincide con el razonamiento.
- Los distractores son plausibles y no contienen pistas.
- La competencia y el componente corresponden a la tarea evaluada.
- No hay duplicados ni paráfrasis entre preguntas.
- Cada pregunta exige razonamiento apropiado al nivel solicitado.
- El contexto, estímulo, visual, opciones, respuesta y explicación
  son coherentes entre sí.
- Si existe visual, sus datos son válidos y necesarios.
- El JSON cumple exactamente el esquema solicitado.

Si una pregunta falla una comprobación, reemplázala antes de responder.

No informes las comprobaciones.
Devuelve únicamente el JSON.
`;
}

/* =========================================================
   GENERAR UN BLOQUE CON GROQ
========================================================= */

async function generateBlock(
  subject: string,
  session: number,
  amount: number,
  difficulty: Difficulty,
  profiles: ReferenceProfile[],
  existingQuestions: string[],
  existingDifficulties: GeneratedDifficulty[],
  totalRequested: number,
  generationPlan: GenerationPlanItem[]
): Promise<GeneratedQuestion[]> {
  let lastError: unknown = null;

  const acceptedQuestions: GeneratedQuestion[] = [];

  for (
    let attempt = 1;
    attempt <= MAX_BLOCK_ATTEMPTS;
    attempt++
  ) {
    const remainingAmount =
      amount - acceptedQuestions.length;

    if (remainingAmount <= 0) {
      return acceptedQuestions;
    }

    try {
      console.log(
        `[PeakScore] Groq solicitando ${remainingAmount} preguntas. Intento ${attempt}/${MAX_BLOCK_ATTEMPTS}.`
      );

      const response = await generateAI({
        prompt: buildPrompt(
          subject,
          session,
          remainingAmount,
          difficulty,
          profiles,
          [
            ...existingQuestions,
            ...acceptedQuestions.map(
              (question) => question.question
            ),
          ],
          [
            ...existingDifficulties,
            ...acceptedQuestions
              .map(
                (question) =>
                  normalizeDifficulty(
                    question.difficulty
                  )
              )
              .filter(
                (value): value is GeneratedDifficulty =>
                  value !== null
              ),
          ],
          totalRequested,
          generationPlan.slice(
            acceptedQuestions.length,
            Math.min(
              acceptedQuestions.length +
                remainingAmount,
              generationPlan.length
            )
          )
        ),

        task: "question_generation",

        useFallback: true,
      });

      const raw =
        response.text?.trim() ?? "";

      if (!raw) {
        throw new Error(
          "Groq no devolvió contenido."
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
          "[PeakScore] Error parseando JSON de Groq:",
          error
        );

        throw new Error(
          "Groq devolvió JSON inválido."
        );
      }

      const generated =
        Array.isArray(parsed.questions)
          ? parsed.questions
          : [];

      const unique =
        new Set<string>();

      const excluded =
        new Set(
          existingQuestions.map(
            (question) =>
              normalize(question)
          )
        );

      console.log(
        `[PeakScore] Groq generó ${generated.length} preguntas antes de validación.`
      );

      generated.forEach((item, index) => {
        console.log(
          `[PeakScore] Candidato ${index + 1}:`,
          {
            difficulty: item?.difficulty,
            requires_visual: item?.requires_visual,
            visual_type: item?.visual_type,
            question: item?.question?.slice(0, 160),
          }
        );
      });
      
        const valid =
        generated.filter(
          (item: GeneratedQuestion) => {
            const difficultyValid =
              isDifficultyAllowed(
                item.difficulty,
                difficulty
              );

            const questionValid =
              isValidQuestion(
                item,
                subject,
                session
              );

            if (!difficultyValid || !questionValid) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1} rechazado:`,
              {
                  difficulty: item.difficulty,
                  difficultyValid,
                  questionValid,
                  requires_visual: item.requires_visual,
                  visual_type: item.visual_type,
                  has_visual_data: Boolean(item.visual_data),

                  question: item.question?.slice(0, 200),

                  option_a: item.option_a,
                  option_b: item.option_b,
                  option_c: item.option_c,
                  option_d: item.option_d,
              }
            );

              const diagnostics =
                diagnoseQuestionValidation(
                  item,
                  subject,
                  session
                );

              console.warn(
                `[PeakScore] 🔬 Motivos de rechazo candidato ${generated.indexOf(item) + 1}:`,
                diagnostics
              );

              if (item.requires_visual) {
                console.warn(
                  `[PeakScore] 🔎 Diagnóstico visual:`,
                  {
                    visual_type: item.visual_type,
                    visual_description:
                      item.visual_description,
                  }
                );

                console.dir(
                  item.visual_data,
                  { depth: null }
                );
              }

              return false;
            }

            const key =
              normalize(item.question);

            if (!key) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: pregunta vacía después de normalizar.`
              );

              return false;
            }

            /*
             * Evitar duplicados dentro
             * de la misma respuesta.
             */
            if (unique.has(key)) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: duplicado dentro del lote.`
              );

              return false;
            }

            /*
             * Evitar repetir preguntas
             * generadas anteriormente.
             */
            if (excluded.has(key)) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: ya existe en preguntas anteriores.`
              );

              return false;
            }

            if (difficulty === "Mixta") {
              const candidateDifficulty =
                normalizeDifficulty(item.difficulty);

              if (!candidateDifficulty) {
                return false;
              }

              const mixedTargets =
                getMixedDifficultyTargets(
                  totalRequested
                );

              const currentCount =
                [
                  ...existingDifficulties,
                  ...acceptedQuestions
                    .map((question) =>
                      normalizeDifficulty(
                        question.difficulty
                      )
                    )
                    .filter(
                      (value): value is GeneratedDifficulty =>
                        value !== null
                    ),
                ].filter(
                  (current) =>
                    current === candidateDifficulty
                ).length;

              const acceptedInResponse =
                Array.from(unique).filter(
                  (existingKey) => {
                    const candidate =
                      generated.find(
                        (currentItem) =>
                           normalize(currentItem.question) ===
                           existingKey
                      );

                    return (
                      candidate &&
                      normalizeDifficulty(
                        candidate.difficulty
                      ) === candidateDifficulty
                    );
                  }
                ).length;

              if (
                currentCount +
                  acceptedInResponse >=
                mixedTargets[candidateDifficulty]
              ) {
                console.warn(
                  `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: excede el cupo de dificultad Mixta.`,
                  {
                    candidateDifficulty,
                    currentCount,
                    acceptedInResponse,
                    target:
                      mixedTargets[candidateDifficulty],
                  }
                );

                return false;
              }
            }

            unique.add(key);

            return true;
          }
          
        );

      console.log(
        `[PeakScore] Groq devolvió ${valid.length}/${amount} preguntas válidas.`
      );

      /*
       * IMPORTANTE:
       *
       * Aquí NO exigimos que Groq devuelva
       * exactamente la cantidad solicitada.
       *
       * Si pedimos 5 y devuelve 2,
       * devolvemos esas 2 para que el
       * proceso principal solicite las 3
       * restantes.
       */

      if (valid.length > 0) {
        for (const question of valid) {
          const key = normalize(question.question);

          if (
            !acceptedQuestions.some(
              (accepted) =>
                normalize(accepted.question) === key
            )
          ) {
            acceptedQuestions.push(question);
          }
        }

        if (
          acceptedQuestions.length >= amount
        ) {
          return acceptedQuestions.slice(0, amount);
        }

        console.log(
          `[PeakScore] Bloque aportó ${valid.length} válidas. Acumuladas: ${acceptedQuestions.length}/${amount}.`
        );

        continue;
      }

      lastError = new Error(
        `Groq no devolvió preguntas válidas.`
      );

      console.warn(
        `[PeakScore] Bloque sin preguntas válidas. Intento ${attempt}/${MAX_BLOCK_ATTEMPTS}.`
      );

      /*
       * No repetir inmediatamente el mismo bloque cuando
       * Groq sí respondió pero todas las candidatas fueron
       * rechazadas por nuestra validación.
       *
       * El generador principal será quien decida si necesita
       * solicitar otro bloque.
       */
      continue;
    } catch (error) {
      lastError = error;

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `[PeakScore] Error generando bloque con Groq. Intento ${attempt}/${MAX_BLOCK_ATTEMPTS}:`,
        error
      );

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "AI_UNAVAILABLE"
      ) {
        break;
      }

      const delay =
        RETRY_BASE_DELAY_MS *
        Math.pow(2, attempt - 1);

      console.warn(
        `[PeakScore] Groq falló: ${message}. Reintentando en ${delay / 1000}s...`
      );

      await sleep(delay);
    }
  }

  if (acceptedQuestions.length > 0) {
    return acceptedQuestions.slice(0, amount);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    `No fue posible generar preguntas con Groq.`
  );
}

/* =========================================================
   CONVERTIR A FILAS
========================================================= */


function toRows(
  questions: GeneratedQuestion[],
  subject: string,
  subjectId: string,
  session: number,
  difficulty: Difficulty
) {
  return questions.map((q) => ({
    subject,

    subject_id: subjectId,

    session,

    component:
      q.component?.trim() || null,

    competence:
      q.competence?.trim() || null,

    difficulty:
      normalizeDifficulty(q.difficulty) ??
      (difficulty === "Mixta"
        ? "Media"
        : difficulty),

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

    /*
     * URL de imagen.
     */
    image_url:
      typeof q.image_url === "string"
        ? q.image_url.trim() || null
        : null,

    /* =====================================================
       SISTEMA VISUAL NUEVO
    ===================================================== */

    requires_visual:
      q.requires_visual === true,

    visual_type:
      q.requires_visual === true
        ? q.visual_type
        : null,

    visual_description:
      q.requires_visual === true
        ? q.visual_description?.trim() || null
        : null,

    visual_data:
      q.requires_visual === true
        ? q.visual_data
        : null,

    /* =====================================================
       COMPATIBILIDAD TEMPORAL CON CHART_DATA
    ===================================================== */

    chart_data:
      q.requires_visual === true &&
      (
        q.visual_type === "chart" ||
        q.visual_type === "math_graph"
      )
        ? q.visual_data
        : null,

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
  try {
    /* =====================================================
       SEGURIDAD
       SOLO ADMINISTRADORES
    ====================================================== */

    const authSupabase =
      await createServerClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No estás autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       VERIFICAR ROL
    ====================================================== */

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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error:
            "No tienes permisos para generar preguntas.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       LEER REQUEST
    ====================================================== */

    let body: Partial<GenerateRequest>;

    try {
      const parsedBody = await request.json();

      if (
        !parsedBody ||
        typeof parsedBody !== "object" ||
        Array.isArray(parsedBody)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "El cuerpo de la solicitud no es válido.",
          },
          {
            status: 400,
          }
        );
      }

      body =
        parsedBody as Partial<GenerateRequest>;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "El cuerpo de la solicitud contiene JSON inválido.",
        },
        {
          status: 400,
        }
      );
    }

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
    ====================================================== */

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
    ====================================================== */

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
    ====================================================== */

    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > MAX_AMOUNT
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `La cantidad debe estar entre 1 y ${MAX_AMOUNT} preguntas.`,
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "======================================"
    );

    console.log(
      "PEAKSCORE - GENERADOR BÁSICO IA"
    );

    console.log(
      "======================================"
    );

    console.log(
      `[PeakScore] Proveedor: Groq`
    );

    console.log(
      `[PeakScore] Materia: ${subject}`
    );

    console.log(
      `[PeakScore] Sesión: ${session}`
    );

    console.log(
      `[PeakScore] Cantidad solicitada: ${amount}`
    );

    console.log(
      `[PeakScore] Dificultad: ${difficulty}`
    );

    /* =====================================================
       SUPABASE ADMIN
    ====================================================== */

    const supabase =
      getSupabase();

    /* =====================================================
       OBTENER SUBJECT_ID
    ===================================================== */

    const {
      data: subjects,
      error: subjectError,
    } = await supabase
      .from("subjects")
      .select("id, name");

    if (subjectError) {
      throw new Error(
        `No se pudo obtener la materia: ${subjectError.message}`
      );
    }

    const matchedSubject = subjects?.find(
      (item) =>
        normalize(item.name) === normalize(subject)
    );

    if (!matchedSubject) {
      throw new Error(
        `No se encontró la materia "${subject}" en la tabla subjects.`
      );
    }

    const subjectId = matchedSubject.id;

    /* =====================================================
       REFERENCIAS
    ====================================================== */

    const profiles =
      await getProfiles(
        supabase,
        subject,
        session
      );

    const existingBankQuestions =
      await getExistingQuestionsForSimilarity(
        supabase,
        subject,
        session
      );

    /* =====================================================
       GENERACIÓN
    ====================================================== */

    const generatedQuestions:
      GeneratedQuestion[] = [];

    const generatedKeys =
      new Set<string>();

    const generationPlan =
      buildGenerationPlan(
        amount,
        profiles
      );

    let totalAttempts = 0;
    let noProgressAttempts = 0;

    /*
     * Seguimos generando hasta completar
     * exactamente la cantidad solicitada.
     */

    while (
      generatedQuestions.length <
      amount
    ) {
      totalAttempts++;

      if (
        totalAttempts >
        MAX_TOTAL_ATTEMPTS
      ) {
        throw new Error(
          `No fue posible completar las ${amount} preguntas. Se obtuvieron ${generatedQuestions.length}.`
        );
      }

      const remaining =
        amount -
        generatedQuestions.length;

      const requestedBlock =
        Math.min(
          REQUEST_BLOCK_SIZE,
          remaining
        );

      const generationRequestAmount =
        requestedBlock;

      console.log(
        `[PeakScore] Progreso: ${generatedQuestions.length}/${amount}. Faltan ${remaining}.`
      );

      console.log(
        `[PeakScore] Solicitando bloque de ${generationRequestAmount} candidatas a Groq para obtener ${remaining} preguntas válidas.`
      );

      const existingQuestions =
        generatedQuestions.map(
          (question) =>
            question.question
        );

      const block =
        await generateBlock(
          subject,
          session,
          generationRequestAmount,
          difficulty,
          generatedQuestions.length === 0
            ? profiles.slice(0, 5)
            : [],
          existingQuestions,
          generatedQuestions
            .map(
              (question) =>
                normalizeDifficulty(
                  question.difficulty
                )
            )
            .filter(
              (value): value is GeneratedDifficulty =>
                value !== null
            ),
          amount,
          generationPlan.slice(
            generatedQuestions.length,
            Math.min(
              generatedQuestions.length + generationRequestAmount,
              generationPlan.length
            )
          )
        );

      /*
       * Filtrar duplicados nuevamente
       * antes de agregar al total.
       */

      let added = 0;

      for (const question of block) {
        const key =
          normalize(
            question.question
          );

        if (!key) {
          continue;
        }

        if (
          generatedKeys.has(key)
        ) {
          console.warn(
            "[PeakScore] Pregunta duplicada dentro del lote. Se descarta."
          );

          continue;
        }

        const similarityResult =
          findSimilarQuestion(
            question,
            existingBankQuestions,
            generatedQuestions
          );

        if (
          similarityResult.isDuplicate
        ) {
          console.warn(
            "[PeakScore] Pregunta descartada por similitud:",
            {
              similarity:
                similarityResult.similarity,
              matchedQuestionId:
                similarityResult.matchedQuestionId,
            }
          );

          continue;
        }

        if (
          generatedQuestions.length >=
          amount
        ) {
          break;
        }

        generatedKeys.add(key);

        generatedQuestions.push(
          question
        );

        added++;
      }

      console.log(
        `[PeakScore] Groq aportó ${added} preguntas nuevas. Total: ${generatedQuestions.length}/${amount}.`
      );

      if (added === 0) {
        noProgressAttempts++;

      console.warn(
        `[PeakScore] El bloque no aportó ninguna pregunta nueva. Progreso estancado ${noProgressAttempts}/${MAX_NO_PROGRESS_ATTEMPTS}.`
      );

      if (
        noProgressAttempts >=
        MAX_NO_PROGRESS_ATTEMPTS
      ) {
        throw new Error(
          `No fue posible generar más preguntas nuevas. Se obtuvieron ${generatedQuestions.length} de ${amount}.`
        );
      }
    } else {
      noProgressAttempts = 0;

      if (added < requestedBlock) {
        console.log(
          `[PeakScore] Groq devolvió ${added}/${requestedBlock} preguntas nuevas. Se solicitarán las restantes.`
        );
      }
     }
    }

    /* =====================================================
       VALIDACIÓN FINAL
    ====================================================== */

    const finalDifficultyCounts =
      getDifficultyCounts(
        generatedQuestions
      );

    if (difficulty !== "Mixta") {
      const invalidDifficultyCount =
        generatedQuestions.filter(
          (question) =>
            normalizeDifficulty(
              question.difficulty
            ) !== difficulty
        ).length;

      if (invalidDifficultyCount > 0) {
        throw new Error(
          "La generación produjo preguntas con una dificultad diferente a la solicitada."
        );
      }
    } else {
      const mixedTargets =
        getMixedDifficultyTargets(amount);

      const distributionIsExact =
        finalDifficultyCounts.Fácil === mixedTargets.Fácil &&
        finalDifficultyCounts.Media === mixedTargets.Media &&
        finalDifficultyCounts.Difícil === mixedTargets.Difícil;

      if (!distributionIsExact) {
        throw new Error(
          `La distribución de dificultad no coincide con el objetivo. Obtenido: Fácil ${finalDifficultyCounts.Fácil}, Media ${finalDifficultyCounts.Media}, Difícil ${finalDifficultyCounts.Difícil}.`
        );
      }
    }

    if (
      generatedQuestions.length !==
      amount
    ) {
      throw new Error(
        `La IA generó ${generatedQuestions.length} preguntas y se esperaban ${amount}.`
      );
    }

    console.log(
      `[PeakScore] Generación completada: ${generatedQuestions.length}/${amount}.`
    );

    /* =====================================================
       ÚLTIMA VERIFICACIÓN CONTRA EL BANCO
    ===================================================== */

    const latestBankQuestions =
      await getExistingQuestionsForSimilarity(
        supabase,
        subject,
        session
      );

    for (
      const question of generatedQuestions
    ) {
      const similarityResult =
        findSimilarQuestion(
          question,
          latestBankQuestions,
          []
        );

      if (
        similarityResult.isDuplicate
      ) {
        console.error(
          "[PeakScore] Se detectó una colisión de originalidad antes del INSERT.",
          {
            similarity:
              similarityResult.similarity,
            matchedQuestionId:
              similarityResult.matchedQuestionId,
          }
        );

        throw new Error(
          "Una o más preguntas dejaron de cumplir la validación de originalidad."
        );
      }
    }
 
    /* =====================================================
       GUARDAR EN SUPABASE
    ====================================================== */

    const rows =
      toRows(
        generatedQuestions,
        subject,
        subjectId,
        session,
        difficulty
      );

    const {
      data,
      error,
    } = await supabase
      .from("questions")
      .insert(rows)
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

        requires_visual,
        visual_type,
        visual_description,
        visual_data,
        chart_data,

        source,
        is_active,
        created_at
      `);

    if (error) {
      throw new Error(
        `No se pudieron guardar las preguntas: ${error.message}`
      );
    }

    const saved =
      data?.length ?? 0;

    if (saved !== amount) {
      throw new Error(
        `Supabase guardó ${saved} preguntas y se esperaban ${amount}.`
      );
    }

    /* =====================================================
       RESPUESTA
    ====================================================== */

    return NextResponse.json({
      success: true,

      message:
        "Generación de preguntas completada correctamente.",

      data: {
        provider:
          "groq",

        subject,

        session,

        requested:
          amount,

        generated:
          generatedQuestions.length,

        saved,

        difficulty,

        questions:
          data,
      },
    });
  
    } catch (error) {
    /*
     * =====================================================
     * ERROR INTERNO
     * =====================================================
     *
     * El error técnico solamente queda en el servidor.
     *
     * NUNCA enviamos:
     * - error.message original
     * - stack trace
     * - proveedor de IA
     * - detalles de API
     * - respuestas de Groq/Gemini
     * - información de infraestructura
     */

    console.error(
      "[PeakScore] Error interno en generación de preguntas:",
      error
    );

    /*
     * Mensaje seguro para el frontend.
     */
    const safeMessage =
      getSafeAIErrorMessage(error);

    /*
     * =====================================================
     * RESPUESTA PÚBLICA CONTROLADA
     * =====================================================
     *
     * El frontend recibe solamente información necesaria
     * para mostrar una experiencia de error.
     *
     * Los detalles técnicos permanecen exclusivamente
     * en el servidor.
     */

    return NextResponse.json(
      {
        success: false,

        error: safeMessage,

        code: "AI_UNAVAILABLE",
      },
      {
        status: 503,
      }
    );
  }
}