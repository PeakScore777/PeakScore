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
 
}

type CognitiveOperation =
  | "interpretar"
  | "inferir"
  | "comparar"
  | "relacionar"
  | "analizar"
  | "aplicar"
  | "calcular"
  | "justificar"
  | "evaluar"
  | "predecir";

interface GenerationPlanItem {
  component: string | null;
  competence: string | null;
  skill: string | null;
  difficulty: string | null;
  structure_type: string | null;
  context_type: string | null;
  requires_visual: boolean | null;
  cognitive_operation: CognitiveOperation | null;
  visual_type: VisualType | null;

  assessment_target: string | null;

  claim: string | null;
  evidences: string[] | null;
}

interface GenerationBlockResult {
  questions: GeneratedQuestion[];
  consumedPlanSlots: number;
}

/* =========================================================
   OPERACIÓN COGNITIVA
========================================================= */

function getCognitiveOperations(
  subject: string
): CognitiveOperation[] {
  const normalizedSubject = normalize(subject);

  if (normalizedSubject === "matematicas") {
    return [
      "interpretar",
      "comparar",
      "relacionar",
      "calcular",
      "analizar",
      "justificar",
    ];
  }

  if (normalizedSubject === "lectura critica") {
    return [
      "interpretar",
      "inferir",
      "relacionar",
      "comparar",
      "analizar",
      "evaluar",
    ];
  }

  if (normalizedSubject === "sociales y ciudadanas") {
    return [
      "interpretar",
      "relacionar",
      "comparar",
      "analizar",
      "evaluar",
      "justificar",
    ];
  }

  if (normalizedSubject === "ciencias naturales") {
    return [
      "interpretar",
      "relacionar",
      "analizar",
      "comparar",
      "predecir",
      "justificar",
    ];
  }

  if (normalizedSubject === "ingles") {
    return [
      "interpretar",
      "inferir",
      "relacionar",
      "comparar",
      "analizar",
      "aplicar",
    ];
  }

  return [
    "interpretar",
    "inferir",
    "comparar",
    "relacionar",
    "analizar",
    "aplicar",
  ];
}

/* =========================================================
   PLANIFICADOR VISUAL
========================================================= */

function getPlannedVisualType(
  subject: string,
  operation: CognitiveOperation | null,
  requiresVisual: boolean | null,
  structureType: string | null,
  topic: string | null
): VisualType | null {
  if (requiresVisual !== true) {
    return null;
  }

  const normalizedSubject = normalize(subject);

  const normalizedStructure = normalize(
    structureType ?? ""
  );

  const normalizedTopic = normalize(
    topic ?? ""
  );

    // Inferencia visual basada en la estructura de referencia.
  // Esto evita caer automáticamente en "table" cuando
  // todavía no existe una operación cognitiva planificada.

  if (
    normalizedStructure.includes("chart") ||
    normalizedStructure.includes("grafica") ||
    normalizedStructure.includes("gráfica") ||
    normalizedStructure.includes("grafico") ||
    normalizedStructure.includes("gráfico") ||
    normalizedStructure.includes("linea") ||
    normalizedStructure.includes("línea")
  ) {
    return "chart";
  }

  if (
    normalizedStructure.includes("table") ||
    normalizedStructure.includes("tabla")
  ) {
    return "table";
  }

  if (
    normalizedStructure.includes("math_graph") ||
    normalizedStructure.includes("math graph") ||
    normalizedStructure.includes("plano cartesiano") ||
    normalizedStructure.includes("funcion") ||
    normalizedStructure.includes("función")
  ) {
    return "math_graph";
  }

  if (
    normalizedStructure.includes("diagram") ||
    normalizedStructure.includes("diagrama") ||
    normalizedStructure.includes("proceso") ||
    normalizedStructure.includes("flujo")
  ) {
    return "diagram";
  }

  if (
    normalizedStructure.includes("geometr") ||
    normalizedTopic.includes("geometr") ||
    normalizedTopic.includes("area") ||
    normalizedTopic.includes("perimetro") ||
    normalizedTopic.includes("volumen")
  ) {
    return "geometry";
  }

  if (normalizedSubject === "matematicas") {
    if (
      operation === "calcular" ||
      operation === "relacionar"
    ) {
      return "math_graph";
    }

    if (
      operation === "interpretar" ||
      operation === "comparar" ||
      operation === "analizar"
    ) {
      return "chart";
    }

    if (
      operation === "aplicar" ||
      operation === "justificar"
    ) {
      return "geometry";
    }

    return "table";
  }

  if (normalizedSubject === "ciencias naturales") {
    if (
      operation === "interpretar" ||
      operation === "comparar" ||
      operation === "analizar"
    ) {
      return "chart";
    }

    if (operation === "predecir") {
      return "diagram";
    }

    if (
      operation === "relacionar" ||
      operation === "justificar"
    ) {
      return "diagram";
    }

    return "table";
  }

  if (normalizedSubject === "sociales y ciudadanas") {
    if (
      operation === "interpretar" ||
      operation === "comparar" ||
      operation === "analizar"
    ) {
      return "chart";
    }

    if (
      operation === "relacionar" ||
      operation === "evaluar"
    ) {
      return "table";
    }

    return "diagram";
  }

  if (normalizedSubject === "lectura critica") {
    if (
      operation === "interpretar" ||
      operation === "comparar"
    ) {
      return "table";
    }

    if (
      operation === "analizar" ||
      operation === "relacionar"
    ) {
      return "diagram";
    }

    return null;
  }

  if (normalizedSubject === "ingles") {
    if (
      operation === "interpretar" ||
      operation === "comparar"
    ) {
      return "table";
    }

    return null;
  }

  return "table";
}

/* =========================================================
   PLANIFICADOR DE ARQUITECTURA DEL LOTE
========================================================= */

interface BlueprintTarget {
  id: string;
  label: string;
  weight: number;

  claim?: string;

  evidences?: string[];
}

function getOfficialBlueprintTargets(
  subject: string
): BlueprintTarget[] {
  const normalizedSubject = normalize(subject);

  /*
   * =====================================================
   * MATEMÁTICAS
   * =====================================================
   */

  if (normalizedSubject === "matematicas") {
    return [
      {
        id: "math.interpretacion",
        label:
          "Interpretación y representación: comprender y transformar información matemática presentada en diferentes formatos.",
        weight: 34,

        claim:
          "Comprende y transforma la información cuantitativa y esquemática presentada en distintos formatos.",

        evidences: [
          "1.1 Da cuenta de las características básicas de la información presentada en diferentes formatos, como series, gráficas, tablas y esquemas.",
          "1.2 Transforma la representación de una o más piezas de información.",
        ],
      },

      {
        id: "math.formulacion_ejecucion",
        label:
          "Formulación y ejecución: plantear e implementar estrategias para resolver situaciones matemáticas.",
        weight: 43,

        claim:
          "Frente a un problema que involucre información cuantitativa, plantea e implementa estrategias que lleven a soluciones adecuadas.",

        evidences: [
          "2.1 Diseña planes para la solución de problemas que involucran información cuantitativa o esquemática.",
          "2.2 Ejecuta un plan de solución para un problema que involucra información cuantitativa o esquemática.",
          "2.3 Resuelve un problema que involucra información cuantitativa o esquemática.",
        ],
      },

      {
        id: "math.argumentacion",
        label:
          "Argumentación: validar o refutar procedimientos, estrategias, soluciones o interpretaciones mediante razonamiento matemático.",
        weight: 23,

        claim:
          "Valida procedimientos y estrategias matemáticas utilizadas para dar solución a problemas.",

        evidences: [
          "3.1 Plantea afirmaciones que sustentan o refutan una interpretación dada a la información disponible en el marco de la solución de un problema.",
          "3.2 Argumenta a favor o en contra de un procedimiento para resolver un problema a la luz de criterios presentados o establecidos.",
          "3.3 Establece la validez o pertinencia de una solución propuesta a un problema dado.",
        ],
      },
    ];
  }

  /*
   * =====================================================
   * LECTURA CRÍTICA
   * =====================================================
   */

  if (
    normalizedSubject === "lectura critica"
  ) {
    return [
      {
        id: "reading.local",
        label:
          "Sentido local: identificar y comprender contenidos locales que conforman el texto.",
        weight: 25,
      },
      {
        id: "reading.global",
        label:
          "Sentido global: comprender cómo se articulan las partes del texto para construir su sentido.",
        weight: 42,
      },
      {
        id: "reading.critical",
        label:
          "Reflexión y evaluación: reflexionar a partir del texto y evaluar su contenido.",
        weight: 33,
      },
    ];
  }

  /*
   * =====================================================
   * SOCIALES Y CIUDADANAS
   * =====================================================
   */

  if (
    normalizedSubject ===
    "sociales y ciudadanas"
  ) {
    return [
      {
        id: "social.pensamiento_social",
        label:
          "Pensamiento social: analizar situaciones utilizando conceptos y relaciones básicas de las ciencias sociales.",
        weight: 30,
      },
      {
        id: "social.perspectivas",
        label:
          "Interpretación y análisis de perspectivas: reconocer, comparar y evaluar perspectivas, intereses, argumentos y fuentes.",
        weight: 40,
      },
      {
        id: "social.sistemico",
        label:
          "Pensamiento reflexivo y sistémico: establecer relaciones entre dimensiones de una problemática y evaluar alternativas.",
        weight: 30,
      },
    ];
  }

  /*
   * =====================================================
   * CIENCIAS NATURALES
   * =====================================================
   */

  if (
    normalizedSubject ===
    "ciencias naturales"
  ) {
    return [
      {
        id: "science.use.bio",
        label:
          "Uso comprensivo del conocimiento científico × componente biológico.",
        weight: 9,
      },
      {
        id: "science.use.physics",
        label:
          "Uso comprensivo del conocimiento científico × componente físico.",
        weight: 9,
      },
      {
        id: "science.use.chemistry",
        label:
          "Uso comprensivo del conocimiento científico × componente químico.",
        weight: 9,
      },
      {
        id: "science.use.cts",
        label:
          "Uso comprensivo del conocimiento científico × Ciencia, Tecnología y Sociedad.",
        weight: 3,
      },

      {
        id: "science.explanation.bio",
        label:
          "Explicación de fenómenos × componente biológico.",
        weight: 9,
      },
      {
        id: "science.explanation.physics",
        label:
          "Explicación de fenómenos × componente físico.",
        weight: 9,
      },
      {
        id: "science.explanation.chemistry",
        label:
          "Explicación de fenómenos × componente químico.",
        weight: 9,
      },
      {
        id: "science.explanation.cts",
        label:
          "Explicación de fenómenos × Ciencia, Tecnología y Sociedad.",
        weight: 3,
      },

      {
        id: "science.inquiry.bio",
        label:
          "Indagación × componente biológico.",
        weight: 12,
      },
      {
        id: "science.inquiry.physics",
        label:
          "Indagación × componente físico.",
        weight: 12,
      },
      {
        id: "science.inquiry.chemistry",
        label:
          "Indagación × componente químico.",
        weight: 12,
      },
      {
        id: "science.inquiry.cts",
        label:
          "Indagación × Ciencia, Tecnología y Sociedad.",
        weight: 4,
      },
    ];
  }

  /*
   * =====================================================
   * INGLÉS
   * =====================================================
   */

  if (
    normalizedSubject === "ingles"
  ) {
    return [
      {
        id: "english.part1",
        label:
          "Inglés — Parte 1: conocimiento lexical.",
        weight: 11,
      },
      {
        id: "english.part2",
        label:
          "Inglés — Parte 2: conocimiento pragmático.",
        weight: 11,
      },
      {
        id: "english.part3",
        label:
          "Inglés — Parte 3: conocimiento comunicativo.",
        weight: 11,
      },
      {
        id: "english.part4",
        label:
          "Inglés — Parte 4: conocimiento gramatical en contexto.",
        weight: 18,
      },
      {
        id: "english.part5",
        label:
          "Inglés — Parte 5: comprensión de lectura literal.",
        weight: 16,
      },
      {
        id: "english.part6",
        label:
          "Inglés — Parte 6: lectura inferencial.",
        weight: 11,
      },
      {
        id: "english.part7",
        label:
          "Inglés — Parte 7: conocimiento gramatical y lexical en contexto.",
        weight: 22,
      },
    ];
  }

  return [];
}

function allocateBlueprintTargets(
  amount: number,
  targets: BlueprintTarget[]
): BlueprintTarget[] {
  if (
    amount <= 0 ||
    targets.length === 0
  ) {
    return [];
  }

  const totalWeight =
    targets.reduce(
      (sum, target) =>
        sum + target.weight,
      0
    );

  if (totalWeight <= 0) {
    return Array.from(
      { length: amount },
      (_, index) =>
        targets[
          index % targets.length
        ]
    );
  }

  const allocations = targets.map(
    (target, index) => {
      const exact =
        (amount * target.weight) /
        totalWeight;

      return {
        target,
        index,
        base: Math.floor(exact),
        remainder:
          exact - Math.floor(exact),
      };
    }
  );

  let assigned =
    allocations.reduce(
      (sum, item) =>
        sum + item.base,
      0
    );

  let remaining =
    amount - assigned;

  allocations.sort(
    (a, b) => {
      if (
        b.remainder !==
        a.remainder
      ) {
        return (
          b.remainder -
          a.remainder
        );
      }

      return (
        a.index -
        b.index
      );
    }
  );

  for (
    let index = 0;
    index < allocations.length &&
    remaining > 0;
    index++
  ) {
    allocations[index].base++;
    remaining--;
  }

  const expanded: BlueprintTarget[] = [];

  for (
    const allocation of allocations
  ) {
    for (
      let count = 0;
      count < allocation.base;
      count++
    ) {
      expanded.push(
        allocation.target
      );
    }
  }

  const result: BlueprintTarget[] = [];
  const remainingCounts =
    new Map<string, number>();

  for (
    const target of expanded
  ) {
    remainingCounts.set(
      target.id,
      (remainingCounts.get(
        target.id
      ) ?? 0) + 1
    );
  }

  while (
    result.length < amount
  ) {
    let addedThisRound = false;

    for (
      const target of targets
    ) {
      const count =
        remainingCounts.get(
          target.id
        ) ?? 0;

      if (count <= 0) {
        continue;
      }

      result.push(target);

      remainingCounts.set(
        target.id,
        count - 1
      );

      addedThisRound = true;

      if (
        result.length >= amount
      ) {
        break;
      }
    }

    if (!addedThisRound) {
      break;
    }
  }

  return result;
}

function buildGenerationPlan(
  subject: string,
  amount: number,
  profiles: ReferenceProfile[],
  requestedDifficulty: Difficulty
): GenerationPlanItem[] {
  if (amount <= 0) {
    return [];
  }

  const blueprintTargets =
    getOfficialBlueprintTargets(subject);

  const plannedTargets =
    allocateBlueprintTargets(
      amount,
      blueprintTargets
    );

  /*
   * =====================================================
   * FALLBACK
   * =====================================================
   *
   * Si no existe un blueprint específico para la materia,
   * mantenemos un plan seguro.
   */

  if (plannedTargets.length === 0) {
    return Array.from(
      { length: amount },
      (_, index) => ({
        component: null,
        competence: null,
        skill: null,

        difficulty:
          requestedDifficulty === "Mixta"
            ? (() => {
                const targets =
                  getMixedDifficultyTargets(
                    amount
                  );

                const easyEnd =
                  targets.Fácil;

                const mediumEnd =
                  easyEnd +
                  targets.Media;

                if (
                  index < easyEnd
                ) {
                  return "Fácil";
                }

                if (
                  index < mediumEnd
                ) {
                  return "Media";
                }

                return "Difícil";
              })()
            : requestedDifficulty,

        structure_type: null,
        context_type: null,

        /*
         * Generador básico:
         * nunca genera visuales.
         */
        requires_visual: false,

        cognitive_operation: null,
        visual_type: null,

        assessment_target: null,

        claim: null,
        evidences: null,
      })
    );
  }

  /*
   * =====================================================
   * PERFILES DE REFERENCIA
   * =====================================================
   *
   * Los perfiles NO determinan la distribución.
   *
   * El blueprint determina qué se evalúa.
   * Los perfiles solamente ayudan a calibrar:
   *
   * - competencia
   * - componente
   * - habilidad
   * - estructura
   * - contexto
   */

  const candidates =
    profiles.filter(
      (profile) =>
        profile.component ||
        profile.competence ||
        profile.skill ||
        profile.structure_type ||
        profile.context_type
    );

  /*
   * =====================================================
   * REGISTRO DEL BLUEPRINT
   * =====================================================
   */

  console.log(
    "[PeakScore] ====================================="
  );

  console.log(
    "[PeakScore] BLUEPRINT EVALUATIVO DEL LOTE"
  );

  console.log(
    `[PeakScore] Materia: ${subject}`
  );

  console.log(
    `[PeakScore] Preguntas: ${amount}`
  );

  plannedTargets.forEach(
    (target, index) => {
      console.log(
        `[PeakScore] Slot ${index + 1}: ${target.id}`
      );

      console.log(
        `[PeakScore] Objetivo: ${target.label}`
      );
    }
  );

  console.log(
    "[PeakScore] ====================================="
  );

  /*
   * =====================================================
   * CONTROL DE REUTILIZACIÓN DE PERFILES
   * =====================================================
   */

  const usedProfiles =
    new Set<ReferenceProfile>();

  /*
   * =====================================================
   * SELECCIÓN DEL PERFIL DE CALIBRACIÓN
   * =====================================================
   *
   * Importante:
   *
   * El perfil no puede cambiar el objetivo evaluativo.
   *
   * Ejemplo:
   *
   * si el slot exige Argumentación,
   * no lo convertimos en Interpretación
   * porque el perfil encontrado tenga otra etiqueta.
   */

  const selectProfileForTarget = (
    target: BlueprintTarget,
    slotIndex: number
  ): ReferenceProfile | null => {
    if (
      candidates.length === 0
    ) {
      return null;
    }

    let bestCandidate:
      | ReferenceProfile
      | null = null;

    let bestScore =
      -Infinity;

    const targetText =
      normalize(
        target.label
      );

    for (
      const candidate of candidates
    ) {
      let score = 0;

      const alreadyUsed =
        usedProfiles.has(
          candidate
        );

      /*
       * Preferir perfiles distintos.
       */
      if (!alreadyUsed) {
        score += 20;
      }

      /*
       * =================================================
       * COHERENCIA SEMÁNTICA
       * =================================================
       *
       * Solo sirve como señal de calibración.
       */

      const component =
        normalize(
          candidate.component ??
          ""
        );

      const competence =
        normalize(
          candidate.competence ??
          ""
        );

      const skill =
        normalize(
          candidate.skill ??
          ""
        );

      if (
        competence &&
        targetText.includes(
          competence
        )
      ) {
        score += 100;
      }

      if (
        component &&
        targetText.includes(
          component
        )
      ) {
        score += 8;
      }

      if (
        skill &&
        targetText.includes(
          skill
        )
      ) {
        score += 5;
      }

      /*
       * =================================================
       * DIVERSIDAD DE ESTRUCTURA
       * =================================================
       */

      if (
        candidate.structure_type &&
        !Array.from(
          usedProfiles
        ).some(
          (used) =>
            used.structure_type ===
            candidate.structure_type
        )
      ) {
        score += 4;
      }

      /*
       * =================================================
       * DIVERSIDAD DE CONTEXTO
       * =================================================
       */

      if (
        candidate.context_type &&
        !Array.from(
          usedProfiles
        ).some(
          (used) =>
            used.context_type ===
            candidate.context_type
        )
      ) {
        score += 3;
      }

      /*
       * Pequeño desempate determinista.
       */

      score +=
        (
          slotIndex +
          candidates.indexOf(
            candidate
          )
        ) % 3;

      if (
        score >
        bestScore
      ) {
        bestScore =
          score;

        bestCandidate =
          candidate;
      }
    }

    if (
      bestCandidate
    ) {
      usedProfiles.add(
        bestCandidate
      );
    }

    return bestCandidate;
  };

  /*
   * =====================================================
   * CONSTRUIR PLAN FINAL
   * =====================================================
   */

  const plan =
    plannedTargets.map(
      (target, index) => {
        const profile =
          selectProfileForTarget(
            target,
            index
          );

        /*
         * =================================================
         * DIFICULTAD INTERNA
         * =================================================
         *
         * Mantiene nuestra escala propia:
         *
         * Fácil / Media / Difícil
         *
         * NO pretende representar directamente
         * los niveles oficiales de desempeño del ICFES.
         */

        const difficulty =
          requestedDifficulty ===
          "Mixta"
            ? (() => {
                const targets =
                  getMixedDifficultyTargets(
                    amount
                  );

                const easyEnd =
                  targets.Fácil;

                const mediumEnd =
                  easyEnd +
                  targets.Media;

                if (
                  index <
                  easyEnd
                ) {
                  return "Fácil";
                }

                if (
                  index <
                  mediumEnd
                ) {
                  return "Media";
                }

                return "Difícil";
              })()
            : requestedDifficulty;

        /*
         * =================================================
         * OPERACIÓN COGNITIVA
         * =================================================
         *
         * Todavía no la hacemos obligatoria.
         *
         * Primero establecemos el blueprint evaluativo.
         * Después conectaremos:
         *
         * afirmación → evidencia → tarea → operación.
         */

        const cognitiveOperation:
          CognitiveOperation | null =
            null;

        return {
          component:
            profile?.component ??
            null,

          competence:
            profile?.competence &&
            normalize(target.label).includes(
              normalize(profile.competence)
            )
              ? profile.competence
              : null,

          skill:
            profile?.competence &&
            normalize(target.label).includes(
              normalize(profile.competence)
            )
              ? profile?.skill ?? null
              : null,

          difficulty,

          structure_type:
            profile?.structure_type ??
            null,

          context_type:
            profile?.context_type ??
            null,

          /*
           * Generador básico:
           * nunca produce visuales automáticamente.
           */
          requires_visual:
            false,

          cognitive_operation:
            cognitiveOperation,

          visual_type:
            null,

          /*
           * ESTE ES EL OBJETIVO EVALUATIVO
           * REAL DEL SLOT.
           *
           * No se guarda en la pregunta.
           * No se devuelve a la IA como campo de salida.
           */
          assessment_target:
            target.label,

          claim:
            target.claim ??
            null,

          evidences:
            target.evidences ??
            null,
        };
      }
    );

  /*
   * =====================================================
   * DIAGNÓSTICO FINAL DEL PLAN
   * =====================================================
   */

  console.log(
    "[PeakScore] Plan de generación construido:"
  );

  plan.forEach(
    (item, index) => {
      console.log(
        `[PeakScore] Slot ${index + 1}:`,
        {
          assessment_target:
            item.assessment_target,

          component:
            item.component,

          competence:
            item.competence,

          skill:
            item.skill,

          difficulty:
            item.difficulty,

          structure_type:
            item.structure_type,

          context_type:
            item.context_type,
        }
      );
    }
  );

  return plan;
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

const REQUEST_BLOCK_SIZE = 2;
const MAX_AMOUNT = 100;

const MAX_BLOCK_ATTEMPTS = 2;
const MAX_TOTAL_ATTEMPTS = 60;
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

function isLikelyMathExpression(
  value: unknown
): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const text = value.trim();

  if (!text) {
    return false;
  }

  /*
   * Expresiones matemáticas explícitas.
   *
   * Ejemplos:
   * 2000 + 15x
   * 3x / 2
   * 2x² + 5
   * f(x) = 3x + 1
   * x = 12
   */
  if (
    /[0-9]/.test(text) &&
    (
      /[+\-*/=<>^]/.test(text) ||
      /\b(?:x|y|f\(x\)|g\(x\))\b/i.test(text)
    )
  ) {
    return true;
  }

  /*
   * Valores cuantitativos.
   *
   * Evita falsos positivos cuando las opciones son
   * cantidades diferentes pero comparten la misma unidad.
   *
   * Ejemplos:
   * 56 cm²
   * 48 cm²
   * 64 cm²
   * 72 cm²
   * 15 m
   * 20 kg
   * 3,5 L
   */
  if (
    /^\s*-?\d+(?:[.,]\d+)?\s*(?:%|km|kilometro|kilometros|kilómetro|kilómetros|metros?|m|centimetros?|centímetros?|cm|milimetros?|milímetros?|mm|kilogramos?|kg|gramos?|g|miligramos?|mg|litros?|l|L|mililitros?|ml|segundos?|s|minutos?|min|horas?|h|°|°C|grados?|cm2|cm²|centimetros cuadrados|centímetros cuadrados|m2|m²|metros cuadrados|km2|km²|kilometros cuadrados|kilómetros cuadrados|cm3|cm³|centimetros cubicos|centímetros cúbicos|m3|m³|metros cubicos|metros cúbicos|km3|km³|kilometros cubicos|kilómetros cúbicos)\s*$/i.test(
      text
    )
  ) {
    return true;
  }

  return false;
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
  let cleaned = text
    .replace(/^\uFEFF/, "")
    .trim();

  // Quitar bloques Markdown de código si el proveedor los agregó.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Si ya es JSON válido, no tocarlo.
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Continuar con extracción tolerante.
  }

  /*
   * Algunos proveedores pueden devolver texto adicional
   * antes o después del JSON.
   *
   * Buscamos el primer objeto JSON balanceado y respetamos
   * correctamente strings, escapes y objetos/arreglos internos.
   */
  const firstObject = cleaned.indexOf("{");

  if (firstObject === -1) {
    return cleaned;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let i = firstObject;
    i < cleaned.length;
    i++
  ) {
    const char = cleaned[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth++;
      continue;
    }

    if (char === "}") {
      depth--;

      if (depth === 0) {
        const candidate = cleaned.slice(
          firstObject,
          i + 1
        );

        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // El primer objeto balanceado no era JSON válido.
          // Se devuelve el texto original para que el caller
          // lo rechace de forma segura.
          return cleaned;
        }
      }
    }
  }

  return cleaned;
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
      structuralSimilarity >= 0.80
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
      structuralSimilarity >= 0.80
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

function validateExplicitNumericAnswer(
  item: GeneratedQuestion
): boolean {
  if (
    !item ||
    !item.question ||
    !item.correct_answer
  ) {
    return true;
  }

  const options: Record<Answer, string> = {
    A: item.option_a ?? "",
    B: item.option_b ?? "",
    C: item.option_c ?? "",
    D: item.option_d ?? "",
  };

  const correctOption =
    options[item.correct_answer];

  if (!correctOption) {
    return true;
  }

  /*
   * Esta validación NO intenta resolver matemáticas.
   *
   * Su objetivo es mucho más específico:
   * detectar únicamente cuando la explicación
   * DECLARA EXPLÍCITAMENTE un resultado final
   * que coincide con una opción diferente a
   * correct_answer.
   *
   * No se consideran suficientes:
   * - números mencionados como datos;
   * - resultados intermedios;
   * - números usados para explicar distractores;
   * - números mencionados para negar un procedimiento;
   * - porcentajes o cantidades del contexto.
   */

  const numericPattern =
    /(?:\$?\s*)\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?(?:\s*%|\s*(?:m2|m²|cm2|cm²|km|m|cm|kg|g|usuarios?|personas?|pesos?))?/gi;

  const normalizeNumericToken = (
    value: string
  ): number | null => {
    let cleaned = value
      .replace(/\$/g, "")
      .replace(/%/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

    if (
      /^\d{1,3}(?:\.\d{3})+$/.test(cleaned)
    ) {
      cleaned = cleaned.replace(/\./g, "");
    } else if (
      /^\d{1,3}(?:,\d{3})+$/.test(cleaned)
    ) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(",", ".");
    }

    const number = Number(
      cleaned.replace(/[^0-9.-]/g, "")
    );

    return Number.isFinite(number)
      ? number
      : null;
  };

  const optionNumbers =
    Object.entries(options).map(
      ([letter, text]) => ({
        letter: letter as Answer,
        text,
        numbers:
          text.match(numericPattern) ?? [],
      })
    );

  const correctValues =
    optionNumbers
      .find(
        (option) =>
          option.letter ===
          item.correct_answer
      )
      ?.numbers
      .map(normalizeNumericToken)
      .filter(
        (value): value is number =>
          value !== null
      ) ?? [];

  /*
   * Buscamos SOLO expresiones que normalmente
   * introducen una conclusión o resultado final.
   */
  const finalAnswerPatterns = [
    /(?:por lo tanto|por tanto|por consiguiente|en consecuencia|finalmente)[^.!?]{0,100}?((?:\$?\s*)\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?(?:\s*%|\s*(?:m2|m²|cm2|cm²|km|m|cm|kg|g|usuarios?|personas?|pesos?))?)/i,

    /(?:la respuesta correcta es|la respuesta es|la respuesta corresponde a)[^.!?]{0,80}?((?:\$?\s*)\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?(?:\s*%|\s*(?:m2|m²|cm2|cm²|km|m|cm|kg|g|usuarios?|personas?|pesos?))?)/i,

    /(?:la respuesta final es|el resultado final es|el valor final es|el área solicitada es|el área que se debe pintar es|el área que debe pintarse es|el área que se debe cubrir es|el área que debe cubrirse es|la cantidad solicitada es)[^.!?]{0,80}?((?:\$?\s*)\d{1,3}(?:[.,]\d{3})*(?:\s*%|\s*(?:m2|m²|cm2|cm²|km|m|cm|kg|g|usuarios?|personas?|pesos?))?)/i,
  ];

  const explanation =
    item.explanation ?? "";

  /*
   * Si la explicación NO contiene una conclusión
   * numérica explícita, no intentamos juzgarla.
   */
  const explicitFinalValues: number[] = [];

  for (const pattern of finalAnswerPatterns) {
    const match =
      explanation.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const value =
      normalizeNumericToken(match[1]);

    if (value !== null) {
      explicitFinalValues.push(value);
    }
  }

  if (explicitFinalValues.length === 0) {
    return true;
  }

  /*
   * Ahora sí:
   *
   * Si la explicación declara explícitamente
   * un resultado final que NO coincide con la
   * opción marcada pero SÍ coincide con otra
   * opción, tenemos una inconsistencia fuerte.
   */
  for (const finalValue of explicitFinalValues) {
    const matchesCorrect =
      correctValues.some(
        (correctValue) =>
          Math.abs(
            correctValue - finalValue
          ) < 0.000001
      );

    if (matchesCorrect) {
      continue;
    }

    const conflictingOption =
      optionNumbers.find(
        (option) =>
          option.letter !==
            item.correct_answer &&
          option.numbers
            .map(normalizeNumericToken)
            .some(
              (optionValue) =>
                optionValue !== null &&
                Math.abs(
                  optionValue - finalValue
                ) < 0.000001
            )
      );

    if (conflictingOption) {
      console.warn(
        "[PeakScore] ❌ Inconsistencia numérica explícita detectada:",
        {
          correct_answer:
            item.correct_answer,
          explicit_final_value:
            finalValue,
          conflicting_option:
            conflictingOption.letter,
          correct_option:
            correctOption,
        }
      );

      return false;
    }
  }

  return true;
}

function validateGeometryNumericAnswer(
  item: GeneratedQuestion
): boolean {
  /*
   * Validación determinística de geometría.
   *
   * Actualmente validamos:
   * - rectángulos
   * - cuadrados
   * - preguntas de área/superficie
   *
   * La función debe poder reconocer dimensiones
   * aunque el visual las represente únicamente
   * como "5 m", "3 m", etc.
   */

  if (
    !item ||
    item.requires_visual !== true ||
    item.visual_type !== "geometry" ||
    !item.visual_data
  ) {
    return true;
  }

  const textToAnalyze = [
    item.question ?? "",
    item.explanation ?? "",
  ]
    .join(" ")
    .toLowerCase();

  /*
   * Solo aplicamos esta validación cuando realmente
   * se está preguntando por área o superficie.
   */
  if (
    !/\b(área|area|superficie)\b/i.test(
      textToAnalyze
    )
  ) {
    return true;
  }

  const visualData = item.visual_data;

  if (
    !("shape" in visualData) ||
    !("measurements" in visualData)
  ) {
    return true;
  }

  /*
   * Primera versión determinística:
   * rectángulos y cuadrados.
   */
  if (
    visualData.shape !== "rectangle" &&
    visualData.shape !== "square"
  ) {
    return true;
  }

  const parseNumber = (
    value: unknown
  ): number | null => {
    if (
      typeof value !== "string" &&
      typeof value !== "number"
    ) {
      return null;
    }

    const match = String(value)
      .replace(",", ".")
      .match(
        /-?\d+(?:\.\d+)?/
      );

    if (!match) {
      return null;
    }

    const number = Number(match[0]);

    return Number.isFinite(number)
      ? number
      : null;
  };

  /*
   * -------------------------------------------------------
   * DIMENSIONES EXTERIORES
   * -------------------------------------------------------
   *
   * Primero intentamos encontrar dimensiones mediante
   * etiquetas explícitas:
   *
   * ancho, base, alto, altura.
   *
   * Si no existen, usamos las etiquetas visuales simples
   * como "5 m" y "3 m".
   */

  let width: number | null = null;
  let height: number | null = null;

  const safeMeasurements =
    Array.isArray(
      visualData.measurements
    )
      ? visualData.measurements
      : [];

  /*
   * 1. Primero buscamos etiquetas semánticas.
   */
  for (
    const measurement of safeMeasurements
  ) {
    const label =
      typeof measurement?.label === "string"
        ? measurement.label
            .trim()
            .toLowerCase()
        : "";

    const value =
      parseNumber(
        measurement?.value
      );

    if (
      value === null ||
      value <= 0
    ) {
      continue;
    }

    const isCutoutMeasurement =
      /\b(ventana|recorte|puerta|hueco|abertura)\b/i.test(
        label
      );

    if (
      width === null &&
      !isCutoutMeasurement &&
      /\b(ancho|base|horizontal|longitud)\b/i.test(
        label
      )
    ) {
      width = value;
      continue;
    }

    if (
      height === null &&
      !isCutoutMeasurement &&
      /\b(alto|altura|vertical)\b/i.test(
        label
      )
    ) {
      height = value;
    }
  }

  /*
   * 2. Si no encontramos las dimensiones exteriores
   * mediante etiquetas semánticas, buscamos medidas
   * simples como:
   *
   * "5 m"
   * "3 m"
   *
   * ignorando explícitamente las medidas de ventanas,
   * recortes, puertas y otros elementos internos.
   */
  if (
    width === null ||
    height === null
  ) {
    const genericMeasurements =
      safeMeasurements
        .map((measurement) => {
          const label =
            typeof measurement?.label === "string"
              ? measurement.label
                  .trim()
                  .toLowerCase()
              : "";

          const value =
            parseNumber(
              measurement?.value
            );

          return {
            label,
            value,
          };
        })
        .filter(
          (
            measurement
          ) =>
            measurement.value !== null &&
            measurement.value > 0 &&
            !/\b(ventana|recorte|puerta|hueco|abertura)\b/i.test(
              measurement.label
            )
        );

    /*
     * Solo usamos esta estrategia cuando hay exactamente
     * dos medidas exteriores inequívocas.
     */
    if (
      genericMeasurements.length === 2
    ) {
      if (width === null) {
        width =
          genericMeasurements[0]
            .value;
      }

      if (height === null) {
        height =
          genericMeasurements[1]
            .value;
      }
    }
  }

  /*
   * 3. Último respaldo:
   *
   * Algunas geometrías guardan las dimensiones
   * directamente como labels visuales:
   *
   * labels: [
   *   { text: "5 m", position: "bottom" },
   *   { text: "3 m", position: "left" }
   * ]
   *
   * En ese caso podemos interpretar:
   *
   * bottom/top -> dimensión horizontal
   * left/right -> dimensión vertical
   */

  if (
    ("labels" in visualData) &&
    Array.isArray(
      visualData.labels
    )
  ) {
    const horizontalLabels: number[] = [];
    const verticalLabels: number[] = [];

    for (
      const label of visualData.labels
    ) {
      if (
        !label ||
        typeof label.text !== "string"
      ) {
        continue;
      }

      const value =
        parseNumber(label.text);

      if (
        value === null ||
        value <= 0
      ) {
        continue;
      }

      const position =
        typeof label.position === "string"
          ? label.position
              .toLowerCase()
          : "";

      if (
        position === "top" ||
        position === "bottom"
      ) {
        horizontalLabels.push(value);
      }

      if (
        position === "left" ||
        position === "right"
      ) {
        verticalLabels.push(value);
      }
    }

    if (
      width === null &&
      horizontalLabels.length === 1
    ) {
      width =
        horizontalLabels[0];
    }

    if (
      height === null &&
      verticalLabels.length === 1
    ) {
      height =
        verticalLabels[0];
    }
  }

  /*
   * Si todavía no tenemos las dos dimensiones,
   * no podemos verificar matemáticamente el área.
   *
   * En este punto NO inventamos dimensiones.
   */
  if (
    width === null ||
    height === null ||
    width <= 0 ||
    height <= 0
  ) {
    console.warn(
      "[PeakScore] ⚠️ No fue posible extraer las dimensiones exteriores de la geometría.",
      {
        width,
        height,
        shape: visualData.shape,
        question: item.question,
      }
    );

    return true;
  }

  /*
   * -------------------------------------------------------
   * ÁREA EXTERIOR
   * -------------------------------------------------------
   */

  let expectedArea =
    width * height;

  /*
   * -------------------------------------------------------
   * RECORTES / VENTANAS / HUECOS
   * -------------------------------------------------------
   */

  const cutouts =
    "cutouts" in visualData &&
    Array.isArray(
      visualData.cutouts
    )
      ? visualData.cutouts
      : [];

  for (
    const cutout of cutouts
  ) {
    if (
      !cutout ||
      cutout.removed !== true
    ) {
      continue;
    }

    if (
      cutout.type !== "rectangle"
    ) {
      /*
       * Todavía no calculamos automáticamente
       * otros tipos de recorte.
       */
      continue;
    }

    const cutoutWidth =
      parseNumber(
        cutout.width
      );

    const cutoutHeight =
      parseNumber(
        cutout.height
      );

    if (
      cutoutWidth === null ||
      cutoutHeight === null ||
      cutoutWidth <= 0 ||
      cutoutHeight <= 0
    ) {
      continue;
    }

    expectedArea -=
      cutoutWidth *
      cutoutHeight;
  }

  /*
   * Evitar resultados imposibles.
   */
  if (
    expectedArea <= 0
  ) {
    return false;
  }

  /*
   * -------------------------------------------------------
   * COMPARAR CON LAS OPCIONES
   * -------------------------------------------------------
   */

  const options: Array<{
    letter: "A" | "B" | "C" | "D";
    text: string;
  }> = [
    {
      letter: "A",
      text: item.option_a,
    },
    {
      letter: "B",
      text: item.option_b,
    },
    {
      letter: "C",
      text: item.option_c,
    },
    {
      letter: "D",
      text: item.option_d,
    },
  ];

  const normalizeNumericToken = (
    value: string
  ): number | null => {
    const match =
      value
        .replace(",", ".")
        .match(
          /-?\d+(?:\.\d+)?/
        );

    if (!match) {
      return null;
    }

    const number =
      Number(match[0]);

    return Number.isFinite(number)
      ? number
      : null;
  };

  const correctOption =
    options.find(
      (option) =>
        option.letter ===
        item.correct_answer
    );

  if (!correctOption) {
    return false;
  }

  const correctOptionValue =
    normalizeNumericToken(
      correctOption.text
    );

  if (
    correctOptionValue === null
  ) {
    return false;
  }

  /*
   * La opción correcta debe coincidir
   * exactamente con el área calculada.
   */
  if (
    Math.abs(
      correctOptionValue -
        expectedArea
    ) > 0.000001
  ) {
    console.warn(
      "[PeakScore] ❌ Respuesta matemática de geometría incorrecta.",
      {
        width,
        height,
        expectedArea,
        correct_answer:
          item.correct_answer,
        correct_option:
          correctOption.text,
      }
    );

    return false;
  }

  /*
   * Ninguna otra opción puede contener
   * el mismo resultado correcto.
   */
  for (
    const option of options
  ) {
    if (
      option.letter ===
      item.correct_answer
    ) {
      continue;
    }

    const optionValue =
      normalizeNumericToken(
        option.text
      );

    if (
      optionValue !== null &&
      Math.abs(
        optionValue -
          expectedArea
      ) < 0.000001
    ) {
      console.warn(
        "[PeakScore] ❌ Más de una opción coincide con el área correcta.",
        {
          expectedArea,
          conflicting_option:
            option.letter,
          correct_option:
            item.correct_answer,
        }
      );

      return false;
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

function validateQuestionSolvability(
  item: GeneratedQuestion
): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const context = normalize(
    item.context_text ?? ""
  );

  const question = normalize(
    item.question ?? ""
  );

  const explanation = normalize(
    item.explanation ?? ""
  );

  if (!question.trim()) {
    return false;
  }

  /*
   * =====================================================
   * 1. UN VISUAL INEXISTENTE NO PUEDE SER NECESARIO
   * =====================================================
   */

  if (item.requires_visual !== true) {
    const forbiddenVisualReferences = [
      /\bsegun la grafica\b/,
      /\bsegun el grafico\b/,
      /\bsegun la tabla\b/,
      /\bsegun las tablas\b/,
      /\bsegun la figura\b/,
      /\bsegun el diagrama\b/,
      /\bcomo se muestra\b/,
      /\bcomo se observa en la grafica\b/,
      /\bcomo se observa en el grafico\b/,
      /\bcomo se observa en la figura\b/,
      /\ben la grafica\b/,
      /\ben el grafico\b/,
      /\ben la tabla\b/,
      /\ben la figura\b/,
      /\ben el diagrama\b/,
      /\ben la imagen\b/,
      /\ben la figura anterior\b/,
      /\ben el grafico anterior\b/,
      /\ben la tabla anterior\b/,
    ];

    if (
      forbiddenVisualReferences.some(
        (pattern) =>
          pattern.test(question)
      )
    ) {
      return false;
    }
  }

  /*
   * =====================================================
   * 2. REFERENCIAS EXPLÍCITAS A UN TEXTO/CONTEXTO
   *    REQUIEREN QUE ESE TEXTO EXISTA
   * =====================================================
   *
   * IMPORTANTE:
   * No exigimos context_text para todas las preguntas.
   *
   * Una pregunta puede contener todos los datos
   * directamente en el enunciado.
   */

  const requiresContextPatterns = [
    /\bsegun el texto\b/,
    /\bsegun el contexto\b/,
    /\bde acuerdo con el texto\b/,
    /\bde acuerdo con el contexto\b/,
    /\btexto anterior\b/,
    /\bfragmento anterior\b/,
    /\bcaso anterior\b/,
    /\bsituacion anterior\b/,
    /\binformacion anterior\b/,
    /\bdato anterior\b/,
    /\bcomo se menciona anteriormente\b/,
    /\bcomo se indico anteriormente\b/,
  ];

  if (
    requiresContextPatterns.some(
      (pattern) =>
        pattern.test(question)
    ) &&
    !context.trim()
  ) {
    return false;
  }

  /*
   * =====================================================
   * 3. REFERENCIAS A INFORMACIÓN VISUAL
   *    TAMBIÉN DEBEN TENER VISUAL REAL
   * =====================================================
   */

  const visualReferencePatterns = [
    /\btabla\b/,
    /\bgrafica\b/,
    /\bgrafico\b/,
    /\bdiagrama\b/,
    /\bfigura\b/,
    /\bimagen\b/,
  ];

  if (
    item.requires_visual !== true &&
    visualReferencePatterns.some(
      (pattern) =>
        pattern.test(question)
    )
  ) {
    return false;
  }

  /*
   * =====================================================
   * 4. NO PERMITIR DEPENDENCIA EXPLÍCITA DE INFORMACIÓN
   *    QUE EL ENUNCIADO DICE QUE NO ESTÁ DISPONIBLE
   * =====================================================
   *
   * Solo rechazamos la pregunta cuando el PROPIO
   * ENUNCIADO declara que falta información.
   *
   * No analizamos la explicación para esto porque
   * una explicación puede decir legítimamente que una
   * afirmación no puede concluirse.
   */

  const missingInformationInQuestion = [
    /\bno se proporciona el dato\b/,
    /\bno se proporciona la informacion\b/,
    /\bno se proporcionan los datos\b/,
    /\bfalta el dato necesario\b/,
    /\bfaltan los datos necesarios\b/,
    /\bno se dispone de la informacion necesaria\b/,
    /\bno hay informacion suficiente\b/,
    /\bno hay datos suficientes\b/,
  ];

  if (
    missingInformationInQuestion.some(
      (pattern) =>
        pattern.test(question)
    )
  ) {
    return false;
  }

  /*
   * =====================================================
   * 5. SI LA PREGUNTA PIDE INFERIR/CONCLUIR,
   *    DEBE EXISTIR ALGUNA BASE INFORMACIONAL
   * =====================================================
   *
   * Puede estar en:
   * - context_text
   * - question
   *
   * Por eso NO exigimos context_text.
   */

  const inferencePattern =
    /\bse puede concluir\b|\bse puede inferir\b|\bse puede deducir\b|\bque se puede concluir\b|\bque se puede deducir\b/;

  if (
    inferencePattern.test(question) &&
    question.length < 40 &&
    !context.trim()
  ) {
    return false;
  }

  /*
   * =====================================================
   * 6. PREDICCIONES
   * =====================================================
   *
   * Igual que arriba:
   * no exigimos context_text obligatoriamente.
   *
   * El propio enunciado puede contener las condiciones.
   */

  const predictionPattern =
    /\bque ocurrira\b|\bque sucedera\b|\bse espera que\b|\bpredecir\b|\bpredeciria\b/;

  if (
    predictionPattern.test(question) &&
    question.length < 40 &&
    !context.trim()
  ) {
    return false;
  }

  /*
   * =====================================================
   * 7. EXPLICACIÓN
   * =====================================================
   *
   * NO usamos similitud textual para decidir si una
   * explicación es válida.
   *
   * Una explicación matemática puede tener poco
   * vocabulario compartido con la pregunta.
   */

  if (
    explanation.trim().length === 0
  ) {
    return false;
  }

  /*
   * =====================================================
   * 8. EVITAR EXPLICACIONES QUE DECLAREN UN ERROR
   *    ESTRUCTURAL IRRESOLUBLE
   *
   * Solo rechazamos frases muy explícitas que indiquen
   * que la pregunta fue construida sin los datos necesarios.
   *
   * NO rechazamos:
   * - "no se puede concluir que..."
   * - "la información no permite afirmar que..."
   * porque pueden formar parte de una respuesta correcta.
   */

  const malformedExplanationPatterns = [
    /\bla pregunta no puede resolverse\b/,
    /\besta pregunta no puede resolverse\b/,
    /\bno hay datos para responder\b/,
    /\bno existen datos para responder\b/,
    /\bfaltan datos para resolver la pregunta\b/,
    /\bfalta informacion para resolver la pregunta\b/,
    /\bno se puede resolver la pregunta\b/,
  ];

  if (
    malformedExplanationPatterns.some(
      (pattern) =>
        pattern.test(explanation)
    )
  ) {
    return false;
  }

  return true;
}

function validateFunctionComparisonAnswer(
  item: GeneratedQuestion
): boolean {
  const text = [
    item.context_text ?? "",
    item.question ?? "",
    item.option_a ?? "",
    item.option_b ?? "",
    item.option_c ?? "",
    item.option_d ?? "",
  ].join(" ");

  /*
   * Esta validación solamente se activa cuando
   * encontramos una comparación explícita entre:
   *
   * f(t) = a + bt
   * g(t) = c * r^t
   *
   * No intenta interpretar expresiones matemáticas
   * arbitrarias.
   */

  const linearMatch = text.match(
    /\bf\s*\(\s*t\s*\)\s*=\s*(-?\d+(?:[.,]\d+)?)\s*\+\s*(-?\d+(?:[.,]\d+)?)\s*t\b/i
  );

  const exponentialMatch = text.match(
    /\bg\s*\(\s*t\s*\)\s*=\s*(-?\d+(?:[.,]\d+)?)\s*\*\s*\(\s*(-?\d+(?:[.,]\d+)?)\s*\)\s*\^\s*t\b/i
  );

  if (!linearMatch || !exponentialMatch) {
    return true;
  }

  const linearA = Number(
    linearMatch[1].replace(",", ".")
  );

  const linearB = Number(
    linearMatch[2].replace(",", ".")
  );

  const exponentialA = Number(
    exponentialMatch[1].replace(",", ".")
  );

  const exponentialRate = Number(
    exponentialMatch[2].replace(",", ".")
  );

  if (
    ![
      linearA,
      linearB,
      exponentialA,
      exponentialRate,
    ].every(Number.isFinite)
  ) {
    return true;
  }

  /*
   * Detectar afirmaciones que comparan ambas funciones
   * en un instante concreto, por ejemplo:
   *
   * "en t=7"
   * "a t=7"
   * "para t=7"
   */

  const comparisonPattern =
    /\b(?:en|a|para)\s*t\s*=\s*(\d+(?:[.,]\d+)?)\b[\s\S]{0,180}?\b(supera|mayor|menor|inferior|superior)\b/i;

  const matches = [
    ...text.matchAll(
      /(?:en|a|para)\s*t\s*=\s*(\d+(?:[.,]\d+)?)/gi
    ),
  ];

  if (matches.length === 0) {
    return true;
  }

  const options: Record<Answer, string> = {
    A: item.option_a,
    B: item.option_b,
    C: item.option_c,
    D: item.option_d,
  };

  const correctOption =
    options[item.correct_answer];

  if (!correctOption) {
    return false;
  }

  /*
   * Verificamos afirmaciones concretas de cada opción.
   */
  for (const match of matches) {
    const t = Number(
      match[1].replace(",", ".")
    );

    if (!Number.isFinite(t)) {
      continue;
    }

    const linearValue =
      linearA + linearB * t;

    const exponentialValue =
      exponentialA *
      Math.pow(exponentialRate, t);

    if (
      !Number.isFinite(linearValue) ||
      !Number.isFinite(exponentialValue)
    ) {
      continue;
    }

    /*
     * Determinar cuál función es realmente mayor.
     */
    const exponentialIsGreater =
      exponentialValue > linearValue;

    /*
     * Buscar dentro de cada opción afirmaciones
     * explícitas sobre B frente a A.
     */
    for (const letter of [
      "A",
      "B",
      "C",
      "D",
    ] as Answer[]) {
      const optionText =
        options[letter];

      const normalizedOption =
        normalize(optionText);

      const saysBGreater =
        /\b(?:b|canal b)\b[\s\S]{0,80}?\b(supera|mayor|superior|mayor que)\b[\s\S]{0,80}?\b(?:a|canal a)\b/i.test(
          normalizedOption
        ) ||
        /\b(?:b|canal b)\b[\s\S]{0,80}?\b(supera|mayor|superior|mayor que)\b/i.test(
          normalizedOption
        );

      const saysALarger =
        /\b(?:a|canal a)\b[\s\S]{0,80}?\b(supera|mayor|superior|mayor que)\b[\s\S]{0,80}?\b(?:b|canal b)\b/i.test(
          normalizedOption
        ) ||
        /\b(?:a|canal a)\b[\s\S]{0,80}?\b(supera|mayor|superior|mayor que)\b/i.test(
          normalizedOption
        );

      if (saysBGreater && !exponentialIsGreater) {
        if (letter === item.correct_answer) {
          console.warn(
            "[PeakScore] ❌ Comparación de funciones incorrecta:",
            {
              t,
              linearValue,
              exponentialValue,
              correct_answer:
                item.correct_answer,
              conflicting_option:
                letter,
            }
          );

          return false;
        }
      }

      if (saysALarger && exponentialIsGreater) {
        if (letter === item.correct_answer) {
          console.warn(
            "[PeakScore] ❌ Comparación de funciones incorrecta:",
            {
              t,
              linearValue,
              exponentialValue,
              correct_answer:
                item.correct_answer,
              conflicting_option:
                letter,
            }
          );

          return false;
        }
      }
    }
  }

  /*
   * Caso específico frecuente:
   *
   * "durante el intervalo [0,10]"
   *
   * Verificamos algunos puntos del intervalo para
   * evitar que la IA declare que una función mantiene
   * ventaja cuando realmente no la mantiene.
   */
  const intervalMatch = text.match(
    /\[\s*(\d+(?:[.,]\d+)?)\s*,\s*(\d+(?:[.,]\d+)?)\s*\]/
  );

  if (intervalMatch) {
    const start = Number(
      intervalMatch[1].replace(",", ".")
    );

    const end = Number(
      intervalMatch[2].replace(",", ".")
    );

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end > start
    ) {
      const samplePoints = [
        start,
        start + (end - start) * 0.5,
        end,
      ];

      /*
       * Si la respuesta afirma que A mantiene
       * ventaja durante todo el intervalo, B no
       * puede ser mayor en ninguno de estos puntos.
       */
      const answerText =
        normalize(correctOption);

      const claimsAAlwaysGreater =
        /\b(?:a|canal a)\b[\s\S]{0,120}?\b(mayor|superior|ventaja)\b[\s\S]{0,120}?\b(?:todo|intervalo|periodo)\b/i.test(
          answerText
        );

      const claimsBAlwaysGreater =
        /\b(?:b|canal b)\b[\s\S]{0,120}?\b(mayor|superior|ventaja)\b[\s\S]{0,120}?\b(?:todo|intervalo|periodo)\b/i.test(
          answerText
        );

      if (claimsAAlwaysGreater) {
        const invalidPoint =
          samplePoints.find((t) => {
            const a =
              linearA + linearB * t;

            const b =
              exponentialA *
              Math.pow(
                exponentialRate,
                t
              );

            return b > a;
          });

        if (invalidPoint !== undefined) {
          console.warn(
            "[PeakScore] ❌ La respuesta afirma ventaja de A durante todo el intervalo, pero B la supera.",
            {
              invalidPoint,
              linearValue:
                linearA +
                linearB * invalidPoint,
              exponentialValue:
                exponentialA *
                Math.pow(
                  exponentialRate,
                  invalidPoint
                ),
            }
          );

          return false;
        }
      }

      if (claimsBAlwaysGreater) {
        const invalidPoint =
          samplePoints.find((t) => {
            const a =
              linearA + linearB * t;

            const b =
              exponentialA *
              Math.pow(
                exponentialRate,
                t
              );

            return a > b;
          });

        if (invalidPoint !== undefined) {
          console.warn(
            "[PeakScore] ❌ La respuesta afirma ventaja de B durante todo el intervalo, pero A la supera.",
            {
              invalidPoint,
              linearValue:
                linearA +
                linearB * invalidPoint,
              exponentialValue:
                exponentialA *
                Math.pow(
                  exponentialRate,
                  invalidPoint
                ),
            }
          );

          return false;
        }
      }
    }
  }

  /*
   * Si no encontramos una contradicción determinística,
   * dejamos continuar la pregunta.
   */
  return true;
}

function validatePercentageConsistency(
  item: GeneratedQuestion
): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const question = normalize(
    `${item.context_text ?? ""} ${item.question ?? ""}`
  );

  const explanation = normalize(
    item.explanation ?? ""
  );

  const options = [
    item.option_a ?? "",
    item.option_b ?? "",
    item.option_c ?? "",
    item.option_d ?? "",
  ].map((option) => normalize(option));

  /*
   * =====================================================
   * SOLO ACTIVAR EN PREGUNTAS QUE REALMENTE TRABAJEN
   * CON PORCENTAJES / PROPORCIONES
   * =====================================================
   */

  const isPercentageQuestion =
    /\bporcentaje\b|\bporcentual\b|\bproporcion\b|\bproporcional\b|\btasa\b|\bfraccion\b/.test(
      question
    );

  if (!isPercentageQuestion) {
    return true;
  }

  /*
   * =====================================================
   * EXTRAER EXPRESIONES DEL TIPO:
   *
   * 60 de 100
   * 30 de 100
   * 25 de 50
   *
   * También permite "60 entre 100".
   * =====================================================
   */

  const ratioPattern =
    /(\d+(?:[.,]\d+)?)\s+(?:de|entre)\s+(\d+(?:[.,]\d+)?)/g;

  const ratios: Array<{
    numerator: number;
    denominator: number;
    percentage: number;
  }> = [];

  let match: RegExpExecArray | null;

  while ((match = ratioPattern.exec(question)) !== null) {
    const numerator = Number(
      match[1].replace(",", ".")
    );

    const denominator = Number(
      match[2].replace(",", ".")
    );

    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator) ||
      denominator === 0
    ) {
      continue;
    }

    ratios.push({
      numerator,
      denominator,
      percentage:
        (numerator / denominator) * 100,
    });
  }

  /*
   * Si no encontramos una operación matemática explícita,
   * no intentamos adivinar.
   */

  if (ratios.length === 0) {
    return true;
  }

  /*
   * =====================================================
   * BUSCAR PORCENTAJES EXPLÍCITOS EN LA EXPLICACIÓN
   * =====================================================
   */

  const explanationPercentages =
    [...explanation.matchAll(
      /(\d+(?:[.,]\d+)?)\s*%/g
    )].map((match) =>
      Number(match[1].replace(",", "."))
    );

  /*
   * =====================================================
   * CADA PORCENTAJE EXPLÍCITO DE LA EXPLICACIÓN DEBE
   * SER COMPATIBLE CON ALGUNA OPERACIÓN DEL CONTEXTO.
   *
   * Ejemplo:
   *
   * 60 de 100 = 60%
   *
   * =====================================================
   */

  for (const percentage of explanationPercentages) {
    const matchesCalculatedValue = ratios.some(
      (ratio) =>
        Math.abs(
          ratio.percentage - percentage
        ) < 0.01
    );

    if (!matchesCalculatedValue) {
      return false;
    }
  }

  /*
   * =====================================================
   * SI LA EXPLICACIÓN COMPARA DOS PROPORCIONES,
   * COMPROBAR QUE LA RELACIÓN SEA CORRECTA.
   * =====================================================
   */

  if (
    ratios.length >= 2 &&
    /\bmayor\b|\bmenor\b|\bsuperior\b|\binferior\b|\bigual\b|\bmas alta\b|\bmas baja\b/.test(
      explanation
    )
  ) {
    const first = ratios[0].percentage;
    const second = ratios[1].percentage;

    if (
      /\bmayor\b|\bsuperior\b|\bmas alta\b/.test(
        explanation
      )
    ) {
      /*
       * La primera proporción debe ser mayor
       * solamente si la explicación está comparando
       * en ese sentido.
       *
       * Si ambas son iguales, no puede afirmar "mayor".
       */

      if (
        Math.abs(first - second) < 0.01
      ) {
        return false;
      }
    }

    if (
      /\bmenor\b|\binferior\b|\bmas baja\b/.test(
        explanation
      )
    ) {
      if (
        Math.abs(first - second) < 0.01
      ) {
        return false;
      }
    }
  }

  /*
   * =====================================================
   * EVITAR QUE UNA OPCIÓN NUMÉRICA SEA INCOMPATIBLE
   * CON EL RESULTADO CALCULADO.
   *
   * Solo hacemos esta comprobación cuando existe
   * exactamente un resultado porcentual inequívoco.
   * =====================================================
   */

  if (ratios.length === 1) {
    const expectedPercentage =
      ratios[0].percentage;

    const numericOptions = options.flatMap(
      (option) =>
        [...option.matchAll(
          /(\d+(?:[.,]\d+)?)\s*%/g
        )].map((match) =>
          Number(match[1].replace(",", "."))
        )
    );

    if (
      numericOptions.length > 0 &&
      !numericOptions.some(
        (value) =>
          Math.abs(
            value - expectedPercentage
          ) < 0.01
      )
    ) {
      return false;
    }
  }

  return true;
}

function validateWeightedPercentageProcedure(
  item: GeneratedQuestion
): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  /*
   * =====================================================
   * SOLO ACTIVAR EN PREGUNTAS DE MATEMÁTICAS QUE
   * PRESENTEN UN PROCEDIMIENTO Y PREGUNTEN POR SU ERROR.
   * =====================================================
   */

  if (
    normalize(item.subject) !== "matematicas"
  ) {
    return true;
  }

  const question = normalize(
    item.question ?? ""
  );

  const context = normalize(
    item.context_text ?? ""
  );

  const combinedText =
    `${context} ${question}`;

  const asksAboutProcedureError =
    /\bprocedimiento\b/.test(question) &&
    (
      /\bincorrecto\b/.test(question) ||
      /\berror\b/.test(question) ||
      /\bincorrecta\b/.test(question) ||
      /\bpor que\b.*\bincorrecto\b/.test(question)
    );

  if (!asksAboutProcedureError) {
    return true;
  }

  /*
   * =====================================================
   * 1. EXTRAER CANTIDAD TOTAL
   *
   * Ejemplo:
   * "200 usuarios"
   * "150 clientes"
   * =====================================================
   */

  const totalMatch = combinedText.match(
    /(\d+(?:[.,]\d+)?)\s+(?:usuarios?|clientes?|personas?|estudiantes?|socios?)/i
  );

  if (!totalMatch) {
    return true;
  }

  const total = Number(
    totalMatch[1].replace(/\./g, "").replace(",", ".")
  );

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return true;
  }

  /*
   * =====================================================
   * 2. BUSCAR EL PRIMER PORCENTAJE Y SU VALOR BASE
   *
   * Ejemplo:
   *
   * "el 50% de los usuarios paga una mensualidad
   *  de 100 mil pesos"
   *
   * => porcentaje = 50
   * => valor = 100000
   * =====================================================
   */

  const firstGroupMatch =
    combinedText.match(
      /(\d+(?:[.,]\d+)?)\s*%\s+(?:de\s+)?(?:los|las|un|una|usuarios?|clientes?|personas?|estudiantes?|socios?)[^.;:]*?(?:paga|pagan|tiene|tienen|cuesta|cuestan|corresponde|recibe|reciben)?[^.;:]*?(\$?\s*\d+(?:[.,]\d+)?(?:\s+mil|\s+millon(?:es)?|\s+millones?)?)/i
    );

  if (!firstGroupMatch) {
    return true;
  }

  const firstPercentage =
    Number(
      firstGroupMatch[1]
        .replace(",", ".")
    );

  if (
    !Number.isFinite(firstPercentage) ||
    firstPercentage <= 0 ||
    firstPercentage >= 100
  ) {
    return true;
  }

  const parseSpanishAmount = (
    raw: string
  ): number | null => {
    let value = raw
      .toLowerCase()
      .replace(/\$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const hasMil =
      /\bmil\b/.test(value);

    const hasMillion =
      /\bmillon(?:es)?\b|\bmillones\b/.test(
        value
      );

    value = value
      .replace(/\bmil\b/g, "")
      .replace(/\bmillon(?:es)?\b/g, "")
      .replace(/\bmillones\b/g, "")
      .trim();

    let number: number;

    /*
     * 100.000 -> 100000
     * 100,5 -> 100.5
     * 100000 -> 100000
     */

    if (
      /^\d{1,3}(?:\.\d{3})+$/.test(value)
    ) {
      number = Number(
        value.replace(/\./g, "")
      );
    } else if (
      /^\d{1,3}(?:,\d{3})+$/.test(value)
    ) {
      number = Number(
        value.replace(/,/g, "")
      );
    } else {
      number = Number(
        value.replace(",", ".")
      );
    }

    if (!Number.isFinite(number)) {
      return null;
    }

    if (hasMil) {
      number *= 1000;
    }

    if (hasMillion) {
      number *= 1_000_000;
    }

    return number;
  };

  const firstValue =
    parseSpanishAmount(
      firstGroupMatch[2]
    );

  if (
    firstValue === null ||
    firstValue <= 0
  ) {
    return true;
  }

  /*
   * =====================================================
   * 3. BUSCAR EL VALOR DEL SEGUNDO GRUPO
   *
   * Ejemplo:
   *
   * "el resto paga el 80% de ese valor"
   *
   * Entonces:
   *
   * segundo valor =
   * 100000 × 0.80
   * =====================================================
   */

  const secondPercentageMatch =
    combinedText.match(
      /\b(?:el\s+)?resto\b[^.;:]*?(\d+(?:[.,]\d+)?)\s*%\s+de\s+(?:ese|dicho|tal)\s+valor/i
    );

  if (!secondPercentageMatch) {
    return true;
  }

  const secondPercentage =
    Number(
      secondPercentageMatch[1]
        .replace(",", ".")
    );

  if (
    !Number.isFinite(secondPercentage) ||
    secondPercentage <= 0
  ) {
    return true;
  }

  /*
   * =====================================================
   * 4. CALCULAR EL RESULTADO CORRECTO DEL PROBLEMA
   * =====================================================
   */

  const firstCount =
    total *
    (firstPercentage / 100);

  const secondCount =
    total -
    firstCount;

  const secondValue =
    firstValue *
    (secondPercentage / 100);

  const expectedTotal =
    firstCount * firstValue +
    secondCount * secondValue;

  if (
    !Number.isFinite(expectedTotal)
  ) {
    return true;
  }

  /*
   * =====================================================
   * 5. BUSCAR EL PROCEDIMIENTO MATEMÁTICO ESCRITO
   *    EN LA PREGUNTA
   *
   * Ejemplo:
   *
   * (200 * 100000) * 0.5 +
   * (200 * 80000) * 0.5
   * =====================================================
   */

  const procedureMarker =
    question.match(
      /\b(?:asi|así|procedimiento|calcula(?:r)?\s+el\s+(?:ingreso|costo|total))\s*:\s*/i
    );

  if (!procedureMarker) {
    return true;
  }

  const markerIndex =
    procedureMarker.index;

  if (
    markerIndex === undefined
  ) {
    return true;
  }

  let procedureText =
    question.slice(
      markerIndex +
      procedureMarker[0].length
    );

  /*
   * La pregunta normalmente continúa con:
   *
   * "¿Por qué es incorrecto...?"
   *
   * No queremos interpretar esa parte.
   */

  procedureText =
    procedureText.split(
      /[¿?]\s*por\s+qu[eé]\b/i
    )[0];

  /*
   * Normalizar operadores.
   */

  procedureText =
    procedureText
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/,/g, ".")
      .replace(/\s+/g, " ")
      .trim();

  /*
   * =====================================================
   * 6. EVALUADOR ARITMÉTICO SEGURO
   *
   * NO usamos eval().
   * Solo permitimos:
   *
   * números
   * +
   * -
   * *
   * /
   * paréntesis
   * =====================================================
   */

  const evaluateArithmetic = (
    expression: string
  ): number | null => {
    const cleaned =
      expression
        .replace(/\s+/g, "")
        .replace(/(\d)\.(?=\d{3}(?:\D|$))/g, "$1");

    /*
     * Si aparecen letras o símbolos extraños,
     * no intentamos resolver.
     */

    if (
      !/^[0-9+\-*/().]+$/.test(
        cleaned
      )
    ) {
      return null;
    }

    let index = 0;

    const parseExpression =
      (): number | null => {
        let value =
          parseTerm();

        if (value === null) {
          return null;
        }

        while (
          index <
          cleaned.length
        ) {
          const operator =
            cleaned[index];

          if (
            operator !== "+" &&
            operator !== "-"
          ) {
            break;
          }

          index++;

          const right =
            parseTerm();

          if (right === null) {
            return null;
          }

          if (operator === "+") {
            value += right;
          } else {
            value -= right;
          }
        }

        return value;
      };

    const parseTerm =
      (): number | null => {
        let value =
          parseFactor();

        if (value === null) {
          return null;
        }

        while (
          index <
          cleaned.length
        ) {
          const operator =
            cleaned[index];

          if (
            operator !== "*" &&
            operator !== "/"
          ) {
            break;
          }

          index++;

          const right =
            parseFactor();

          if (right === null) {
            return null;
          }

          if (operator === "*") {
            value *= right;
          } else {
            if (right === 0) {
              return null;
            }

            value /= right;
          }
        }

        return value;
      };

    const parseFactor =
      (): number | null => {
        if (
          cleaned[index] === "("
        ) {
          index++;

          const value =
            parseExpression();

          if (
            cleaned[index] !== ")"
          ) {
            return null;
          }

          index++;

          return value;
        }

        const start =
          index;

        if (
          cleaned[index] === "+"
        ) {
          index++;
        } else if (
          cleaned[index] === "-"
        ) {
          index++;
        }

        while (
          index <
            cleaned.length &&
          /[0-9.]/.test(
            cleaned[index]
          )
        ) {
          index++;
        }

        if (
          start === index
        ) {
          return null;
        }

        const number =
          Number(
            cleaned.slice(
              start,
              index
            )
          );

        return Number.isFinite(
          number
        )
          ? number
          : null;
      };

    const result =
      parseExpression();

    if (
      result === null ||
      index !== cleaned.length ||
      !Number.isFinite(result)
    ) {
      return null;
    }

    return result;
  };

  const calculatedProcedure =
    evaluateArithmetic(
      procedureText
    );

  /*
   * Si no podemos interpretar de forma segura
   * el procedimiento, no rechazamos la pregunta.
   */

  if (
    calculatedProcedure === null
  ) {
    return true;
  }

  /*
   * =====================================================
   * 7. COMPARAR PROCEDIMIENTO VS RESULTADO CORRECTO
   * =====================================================
   */

  const tolerance =
    Math.max(
      0.01,
      Math.abs(expectedTotal) *
        0.000001
    );

  const procedureIsCorrect =
    Math.abs(
      calculatedProcedure -
        expectedTotal
    ) <= tolerance;

  if (!procedureIsCorrect) {
    return true;
  }

  /*
   * =====================================================
   * 8. SI EL PROCEDIMIENTO ES CORRECTO,
   *    UNA RESPUESTA MARCADA COMO "EL PROCEDIMIENTO
   *    ES INCORRECTO" NO PUEDE SER ACEPTADA.
   * =====================================================
   */

  const options: Record<
    Answer,
    string
  > = {
    A: normalize(item.option_a),
    B: normalize(item.option_b),
    C: normalize(item.option_c),
    D: normalize(item.option_d),
  };

  const selectedOption =
    options[item.correct_answer] ?? "";

  const saysProcedureCorrect =
    /\bprocedimiento\s+(?:es|esta)\s+correct[oa]\b/.test(
      selectedOption
    ) ||
    /\bno\s+hay\s+error\b/.test(
      selectedOption
    ) ||
    /\bel\s+procedimiento\s+es\s+correcto\b/.test(
      selectedOption
    );

  const saysProcedureIncorrect =
    /\bprocedimiento\s+(?:es|esta)\s+incorrect[oa]\b/.test(
      selectedOption
    ) ||
    /\bel\s+error\s+esta\b/.test(
      selectedOption
    ) ||
    /\bel\s+error\s+est[aá]\b/.test(
      selectedOption
    ) ||
    /\bporque\s+.*\berror\b/.test(
      selectedOption
    ) ||
    /\bporque\s+.*\bincorrect[oa]\b/.test(
      selectedOption
    );

  if (
    saysProcedureIncorrect &&
    !saysProcedureCorrect
  ) {
    console.warn(
      "[PeakScore] ❌ Procedimiento matemático correcto marcado como incorrecto.",
      {
        expectedTotal,
        calculatedProcedure,
        correct_answer:
          item.correct_answer,
        selectedOption:
          item[
            `option_${item.correct_answer.toLowerCase()}` as
              | "option_a"
              | "option_b"
              | "option_c"
              | "option_d"
          ],
      }
    );

    return false;
  }

  return true;
}

function diagnoseQuestionValidation(
  item: GeneratedQuestion,
  subject: string,
  session: number,
  plannedOperation: CognitiveOperation | null = null,
  plannedVisualType: VisualType | null = null
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

  // =====================================================
  // GENERADOR BÁSICO SIN VISUALES
  // =====================================================
  // La generación automática no crea visuales.
  // Las imágenes se agregarán posteriormente desde
  // el editor de preguntas.

  if (item.requires_visual === true) {
    failures.push(
      "el generador básico no permite visuales generados por IA"
    );
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

  const cognitiveOperationPatterns: Record<
    CognitiveOperation,
    RegExp[]
  > = {
    interpretar: [
      /\binterpret/i,
      /\bsegún (?:la|el|los|las)\b/i,
      /\bde acuerdo con\b/i,
      /\bqué información\b/i,
      /\bqué representa\b/i,
      /\bqué significa\b/i,
    ],

    inferir: [
      /\binfer/i,
      /\bdeduc/i,
      /\bconcluir/i,
      /\bse puede concluir\b/i,
      /\bse puede inferir\b/i,
      /\bqué se puede deducir\b/i,
    ],

    comparar: [
      /\bcompar/i,
      /\bdiferencia/i,
      /\bsimilitud/i,
      /\bsemejanza/i,
      /\bmayor que\b/i,
      /\bmenor que\b/i,
      /\bentre .* y\b/i,
    ],

    relacionar: [
      /\brelacion/i,
      /\brelación\b/i,
      /\bcorrespond/i,
      /\bvincul/i,
      /\bconectar/i,
      /\bentre .* y\b/i,
    ],

    analizar: [
      /\banaliz/i,
      /\bpatrón/i,
      /\bcausa/i,
      /\bconsecuencia/i,
      /\brelación entre\b/i,
      /\bevidencia/i,
      /\bcomportamiento/i,
    ],

    aplicar: [
      /\baplic/i,
      /\butiliz/i,
      /\busando\b/i,
      /\bempleando\b/i,
      /\bprocedimiento\b/i,
      /\bprincipio\b/i,
      /\bpropiedad\b/i,
    ],

    calcular: [
      /\bcalcul/i,
      /\boperación\b/i,
      /\bresultado\b/i,
      /\bcuánto\b/i,
      /\bcuánto se obtiene\b/i,
      /\bvalor\b/i,

      /*
       * Formas frecuentes de preguntas cuantitativas
       * que implican cálculo aunque no utilicen
       * literalmente la palabra "calcular".
       */
      /\bcu[aá]l es el [áa]rea\b/i,
      /\bcu[aá]l es el [áa]rea total\b/i,
      /\bcu[aá]l es la medida\b/i,
      /\bcu[aá]l es el per[ií]metro\b/i,
      /\bcu[aá]l es el volumen\b/i,
      /\bcu[aá]l es la cantidad\b/i,
      /\bcu[aá]nto mide\b/i,
      /\bcu[aá]ntos\b/i,
      /\bporcentaje\b/i,
      /\btotal\b/i,
    ],

    justificar: [
      /\bjustific/i,
      /\bsustent/i,
      /\bfundament/i,
      /\bevidencia\b/i,
      /\brazón\b/i,
      /\bargument/i,
    ],

    evaluar: [
      /\bevalu/i,
      /\bvalidez\b/i,
      /\bválid/i,
      /\bcorrect[oa]\b/i,
      /\badecuad[oa]\b/i,
      /\bpertinente\b/i,
      /\bmejor explicación\b/i,
    ],

    predecir: [
      /\bpredic/i,
      /\bpredec/i,
      /\besper/i,
      /\bse espera\b/i,
      /\bqué ocurrirá\b/i,
      /\bqué sucederá\b/i,
      /\bcomportará\b/i,
    ],
  };

  if (plannedOperation) {
    const operationPatterns =
      cognitiveOperationPatterns[plannedOperation];

    const operationDetected =
      operationPatterns.some(
        (pattern) =>
          pattern.test(questionText)
      );

    if (!operationDetected) {
      failures.push(
        `la pregunta no cumple la operación cognitiva planificada: ${plannedOperation}`
      );
    }
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
      /*
       * Las expresiones matemáticas no deben compararse
       * mediante Jaccard textual porque ese algoritmo
       * ignora operadores y estructura.
       */
      if (
        isLikelyMathExpression(
          normalizedOptions[i]
        ) &&
        isLikelyMathExpression(
          normalizedOptions[j]
        )
      ) {
        continue;
      }

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
    item.explanation !== null &&
    typeof item.explanation !== "string"
  ) {
    failures.push("explanation inválida");
  }

  if (
    item.context_text !== null &&
    typeof item.context_text !== "string"
  ) {
    failures.push("context_text inválido");
  }

  if (
    item.visual_type !== null &&
    typeof item.visual_type !== "string"
  ) {
    failures.push("visual_type inválido");
  }

  if (
    item.visual_description !== null &&
    typeof item.visual_description !== "string"
  ) {
    failures.push("visual_description inválida");
  }

  if (item.requires_visual === true) {
    if (!item.visual_type) {
      failures.push("visual_type faltante");
    }

    if (!item.visual_description?.trim()) {
      failures.push(
        "visual_description faltante"
      );
    }

    // El generador básico NO construye visual_data.
    // El visual se añadirá posteriormente desde el editor.
  }
  
  if (plannedVisualType !== null) {
    if (item.requires_visual !== true) {
      failures.push(
        `requires_visual no coincide con el plan: se esperaba true y se recibió ${item.requires_visual}`
      );
    }

    if (
      item.requires_visual === true &&
      item.visual_type !== plannedVisualType
    ) {
      failures.push(
        `visual_type no coincide con el plan: se esperaba ${plannedVisualType} y se recibió ${item.visual_type ?? "null"}`
      );
    }
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

  if (!validateQuestionSolvability(item)) {
    failures.push(
      "la pregunta no es completamente resoluble con la información proporcionada"
    );
  }

  if (!validatePercentageConsistency(item)) {
    failures.push(
      "inconsistencia matemática en porcentajes o proporciones"
    );
  }

  if (!validateFunctionComparisonAnswer(item)) {
    failures.push(
      "respuesta matemática inconsistente en comparación de funciones"
    );
  }

  if (!validateWeightedPercentageProcedure(item)) {
    failures.push(
      "procedimiento matemático inconsistente con los datos"
    );
  }

  if (!validateExplicitNumericAnswer(item)) {
    failures.push(
      "respuesta numérica inconsistente"
    );
  }

  if (!validateGeometryNumericAnswer(item)) {
  failures.push(
    "respuesta matemática de geometría incorrecta"
  );
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
  session: number,
  plannedOperation: CognitiveOperation | null = null,
  plannedVisualType: VisualType | null = null
): boolean {
  const failures =
    diagnoseQuestionValidation(
      item,
      subject,
      session,
      plannedOperation,
      plannedVisualType
    );

  return failures.length === 0;
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

  let referenceQuestionsQuery = supabase
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
    `);

  if (sourceIds.length > 0) {
    referenceQuestionsQuery =
      referenceQuestionsQuery
        .in(
          "reference_source_id",
          sourceIds
        )
        .limit(300);
  } else {
    referenceQuestionsQuery =
      referenceQuestionsQuery.limit(0);
  }

  const {
    data: references,
    error: referencesError,
  } =
    await referenceQuestionsQuery;

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
  const normalizedSubject = normalize(subject);

  /* =========================================================
     DIFICULTAD
     ========================================================= */

  const mixedTargets = getMixedDifficultyTargets(totalRequested);

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
  DIFICULTAD DEL LOTE:

  Total solicitado: ${totalRequested}.

  Distribución objetivo:
  - Fácil: ${mixedTargets.Fácil}
  - Media: ${mixedTargets.Media}
  - Difícil: ${mixedTargets.Difícil}

  Ya generadas:
  - Fácil: ${currentDifficultyCounts.Fácil}
  - Media: ${currentDifficultyCounts.Media}
  - Difícil: ${currentDifficultyCounts.Difícil}

  Cupos restantes:
  - Fácil: ${remainingDifficultyTargets.Fácil}
  - Media: ${remainingDifficultyTargets.Media}
  - Difícil: ${remainingDifficultyTargets.Difícil}

  Cada slot del PLAN DE ARQUITECTURA tiene una dificultad asignada.
  Respeta exactamente la dificultad de su slot.

  CRITERIOS:

  FÁCIL:
  Razonamiento directo, interpretación clara o procedimiento sencillo.
  Los datos relevantes están disponibles y la solución no exige combinar
  múltiples condiciones.

  MEDIA:
  Requiere relacionar información, interpretar una representación,
  realizar varios pasos o descartar alternativas plausibles.
  La relación necesaria no debe ser inmediata.

  DIFÍCIL:
  Requiere integrar varias condiciones, evidencias, representaciones
  o pasos de razonamiento. Puede exigir inferir, comparar, analizar,
  evaluar o combinar información. Debe seguir siendo completamente
  resoluble con los datos proporcionados.

  REGLAS:
  - La dificultad depende del razonamiento, no de la longitud del texto.
  - No uses números grandes, cálculos innecesarios, vocabulario rebuscado
    ni datos irrelevantes para simular dificultad.
  - Varias operaciones mecánicas no convierten una pregunta en difícil.
  - Una pregunta puede ser difícil con números sencillos si exige
    interpretar, relacionar, inferir, analizar o evaluar.
  - Una pregunta puede ser fácil aunque tenga una operación matemática
    si los datos y procedimiento son directos.
  - La dificultad debe ser coherente con competencia, habilidad,
    operación cognitiva, estructura, contexto y tarea.
  - Si una pregunta no cumple la dificultad de su slot, descártala
    y genera otra.

  VERIFICACIÓN INTERNA:
  Antes de devolver cada pregunta, comprueba que la dificultad planificada
  corresponda realmente al razonamiento requerido y que los datos sean
  suficientes. No alteres artificialmente la dificultad para completar
  la distribución.
  `
      : `
  DIFICULTAD PLANIFICADA:

  Todas las preguntas deben tener exactamente la dificultad "${difficulty}".

  CRITERIOS:
  - Fácil: razonamiento directo, interpretación clara o procedimiento sencillo.
  - Media: relación de información, varios pasos o interpretación no inmediata.
  - Difícil: integración de condiciones, evidencias o relaciones; puede exigir
    inferencia, comparación, análisis o evaluación.

  REGLAS:
  - La dificultad depende del razonamiento, no de la longitud.
  - No uses números grandes, cálculos innecesarios, vocabulario artificialmente
    complejo ni información irrelevante para simular dificultad.
  - Varias operaciones mecánicas no equivalen a mayor dificultad.
  - La pregunta debe ser completamente resoluble con la información proporcionada.
  - Si no cumple realmente la dificultad "${difficulty}", descártala y genera otra.
  `;

  /* =========================================================
     PLAN DE ARQUITECTURA
     ========================================================= */

  const compactGenerationPlan = generationPlan
    .slice(0, amount)
    .map((item, index) => ({
      n: index + 1,
      component: item.component,
      competence: item.competence,
      skill: item.skill,
      difficulty: item.difficulty,
      structure_type: item.structure_type,
      context_type: item.context_type,

      assessment_target:
        item.assessment_target,
      
      claim:
        item.claim,

      evidences:
        item.evidences,
      
      requires_visual: item.requires_visual,
      cognitive_operation:
        item.cognitive_operation,
      visual_type:
        item.visual_type,
    }));

  /* =========================================================
     CALIBRACIÓN DE REFERENCIAS
     ========================================================= */

  const referenceComponents = Array.from(
    new Set(
      profiles
        .map((profile) => profile.component)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
    )
  );

  const referenceCompetences = Array.from(
    new Set(
      profiles
        .map((profile) => profile.competence)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
    )
  );

  const compactReferenceProfiles = profiles.slice(0, 4).map((profile) => ({
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
REFERENCIAS DE PEAKSCORE:
Componentes observados: ${
          referenceComponents.length
            ? referenceComponents.join(" | ")
            : "ninguno"
        }
Competencias observadas: ${
          referenceCompetences.length
            ? referenceCompetences.join(" | ")
            : "ninguna"
        }
Perfiles:
${JSON.stringify(compactReferenceProfiles)}

Úsalos SOLO para calibrar patrones pedagógicos. No copies textos, preguntas, opciones, números, nombres ni escenarios.
`
      : `
REFERENCIAS:
No hay perfiles específicos. Usa el blueprint de la materia.
`;

  /* =========================================================
     PREGUNTAS YA GENERADAS
     ========================================================= */

  const compactExistingQuestions = existingQuestions
    .slice(-6)
    .map((question, index) => {
      const normalized = question.replace(/\s+/g, " ").trim();
      return `${index + 1}. ${normalized.slice(0, 100)}`;
    });

  const excludedSection =
    existingQuestions.length > 0
      ? `
PREGUNTAS YA GENERADAS:
${compactExistingQuestions.join("\n")}

No las repitas ni las parafrasees. Cambia razonamiento, contexto, datos y distractores.
`
      : `
PREGUNTAS PREVIAS:
No hay. Aun así, todas las preguntas del bloque deben ser genuinamente diferentes.
`;

  /* =========================================================
     BLUEPRINT POR MATERIA
     ========================================================= */

  const subjectBlueprints: Record<string, string> = {
    matematicas: `
MATEMÁTICAS
Competencias: Interpretación y representación; Formulación y ejecución; Argumentación.
Componentes: Numérico-variacional; Geométrico-métrico; Aleatorio.
Prioriza situaciones con datos, porcentajes, proporciones, variación, modelación, geometría, medición, probabilidad y análisis de información.
Evita operaciones aisladas, memoria de fórmulas y ejercicios mecánicos.
Cuando uses cálculos, deben apoyar una decisión o interpretación.
`,
    "lectura critica": `
LECTURA CRÍTICA
Competencias: sentido local; sentido global; reflexión y evaluación.
Usa textos argumentativos, expositivos, informativos, narrativos, ensayísticos, divulgativos u opinión.
Evalúa inferencia, relaciones entre partes, propósito, supuestos, posturas, perspectivas y fuerza de argumentos.
El context_text debe contener todo el texto necesario. La respuesta debe sustentarse en el texto.
Evita vocabulario aislado, memoria y repetir preguntas sobre idea principal.
`,
    "sociales y ciudadanas": `
SOCIALES Y CIUDADANAS
Ejes: pensamiento social; análisis de perspectivas; pensamiento reflexivo y sistémico.
Usa situaciones políticas, económicas, históricas, ambientales, ciudadanas, institucionales y de problemas públicos.
Evalúa perspectivas, relaciones causales/históricas, consecuencias y decisiones fundamentadas.
Evita memorizar fechas/nombres/artículos, cultura general, sesgos partidistas o respuestas basadas solo en una opinión moral.
`,
    "ciencias naturales": `
CIENCIAS NATURALES
Áreas: Biología, Física, Química y Ciencia-Tecnología-Sociedad.
Prioriza fenómenos, datos, experimentos, variables, hipótesis, evidencia, predicción, representaciones y comparación de explicaciones.
Si incluyes un experimento, entrega información suficiente para razonar.
Evita definiciones aisladas y conocimiento universitario innecesario.
`,
    ingles: `
INGLÉS
Evalúa competencia comunicativa. El material lingüístico evaluado debe estar en inglés.
Usa avisos, mensajes, conversaciones y textos informativos; comprensión global/local, inferencia, vocabulario o gramática en contexto.
Usa inglés natural de grado 11 y distractores lingüísticamente plausibles.
Evita traducciones directas, reglas gramaticales aisladas y vocabulario innecesariamente especializado.
`,
  };

  const blueprint =
    subjectBlueprints[normalizedSubject] ??
    `
MATERIA
Evalúa conocimientos y habilidades de grado 11 mediante situaciones que exijan interpretar, aplicar, analizar evidencia, establecer relaciones y justificar una respuesta.
`;

  /* =========================================================
     REGLAS DE RAZONAMIENTO Y ESTRUCTURA
     ========================================================= */

  const hasPlannedCognitiveOperation =
    generationPlan.some(
      (plan) =>
        plan.cognitive_operation !== null
    );

  const structureRules = `
  ESTRUCTURA:

  Cada pregunta debe mantener coherencia entre:

  competencia → habilidad → tarea → estímulo → opciones → respuesta → explicación.

  La tarea debe evaluar realmente la habilidad prevista.
  No uses preguntas cuya dificultad provenga únicamente de texto largo,
  vocabulario complejo o cambios superficiales de contexto.

  VARIACIÓN:

  Alterna, cuando sea compatible con la tarea:

  - situaciones contextuales;
  - interpretación de datos;
  - tablas;
  - gráficas;
  - representaciones matemáticas;
  - experimentos;
  - procedimientos;
  - relaciones entre variables;
  - textos;
  - evidencias;
  - comparación de alternativas;
  - análisis de situaciones;
  - problemas de varios pasos.

  El contexto debe aportar información necesaria para resolver la pregunta.
  Evita información decorativa, estructuras repetitivas y conocimiento
  externo innecesario.

  PLAN INTERNO:

  Respeta estrictamente los campos del PLAN DE ARQUITECTURA.

  ${hasPlannedCognitiveOperation ? `
  OPERACIÓN COGNITIVA:

  La operación indicada en el plan debe manifestarse realmente en la tarea.

  - interpretar: comprender información o representaciones.
  - inferir: obtener conclusiones no explícitas.
  - comparar: establecer diferencias, semejanzas o condiciones.
  - relacionar: conectar variables, ideas, datos o condiciones.
  - analizar: identificar relaciones, patrones, causas o evidencias.
  - aplicar: utilizar procedimientos, principios o propiedades.
  - calcular: realizar cálculos necesarios para resolver la tarea.
  - justificar: sustentar una respuesta mediante evidencia o razonamiento.
  - evaluar: valorar afirmaciones, procedimientos o evidencias mediante criterios.
  - predecir: determinar resultados a partir de datos, condiciones o patrones.

  No sustituyas una operación por otra más sencilla.
  Si la tarea no exige realmente la operación planificada, descarta la pregunta.

  ` : `
  La operación cognitiva todavía no está asignada por el plan.
  No inventes una operación ni agregues un campo cognitive_operation al JSON.
  `}

  La estructura, contexto, opciones y explicación deben ser coherentes
  con el razonamiento requerido.

  No incluyas cognitive_operation en el JSON final.
  `;

  /* =========================================================
     OPCIONES
     ========================================================= */

  const optionRules = `
  OPCIONES:

  Cada pregunta debe tener exactamente cuatro opciones: A, B, C y D,
  con una sola respuesta correcta.

  REGLAS:

  - Las opciones deben ser materialmente diferentes.
  - No repitas una respuesta cambiando únicamente unidades, signos,
    palabras o formato.
  - Cada distractor debe ser plausible y representar un error,
    interpretación o razonamiento diferente.
  - En Matemáticas, los distractores deben derivarse de errores
    matemáticos plausibles.
  - La respuesta correcta no debe destacar por longitud, precisión,
    vocabulario, detalle o cantidad de información.
  - Evita pistas involuntarias que permitan identificar la respuesta
    sin resolver la tarea.
  - Evita opciones absurdas o claramente descartables.
  - Cuando el bloque lo permita, distribuye la posición de la respuesta
    correcta entre A, B, C y D.

  VERIFICACIÓN INTERNA:

  Antes de devolver cada pregunta:

  1. Resuelve la tarea.
  2. Determina la única respuesta correcta.
  3. Construye tres distractores plausibles.
  4. Comprueba que A, B, C y D sean diferentes.
  5. Comprueba que ninguna otra opción pueda ser correcta.
  6. Comprueba que la explicación sea coherente con la opción marcada.

  Si existe ambigüedad o más de una opción puede defenderse correctamente,
  descarta la pregunta y genera otra.
  `;

  /* =========================================================
     CALIDAD
     ========================================================= */

  const qualityRules = `
  CALIDAD Y VALIDEZ:

  Cada pregunta debe ser clara, precisa, autocontenida y resoluble con la
  información proporcionada.

  - Debe existir una relación directa entre competencia, habilidad, tarea,
    estímulo, opciones y respuesta correcta.
  - No dependas de información externa innecesaria.
  - Evita ambigüedades, datos contradictorios, supuestos ocultos y
    información insuficiente.
  - El contexto debe aportar información útil para resolver la pregunta.
  - Evita contenido decorativo o texto innecesariamente largo.
  - La pregunta debe evaluar razonamiento y no depender de pistas formales.
  - La respuesta correcta debe estar respaldada por el estímulo, los datos
    o el procedimiento planteado.
  - La explicación debe justificar por qué la respuesta correcta es correcta
    y, cuando sea pertinente, mostrar el razonamiento necesario.
  - No introduzcas errores conceptuales, matemáticos, científicos,
    lingüísticos o de interpretación.

  - En Matemáticas, identifica primero exactamente qué magnitud solicita la pregunta:
  tasa, cantidad total, valor de una variable, expresión, porcentaje, proporción,
  área, perímetro, longitud, volumen, probabilidad u otra.
  - Distingue siempre entre una tasa y una cantidad acumulada.
  - Comprueba que las unidades de la respuesta correspondan exactamente a la magnitud solicitada.
  - Si interviene una variable, verifica que su presencia tenga sentido en la magnitud pedida
    y no la incluyas simplemente porque aparece en los datos.
  - Si existe una conversión de unidades, realiza la conversión completa antes de construir
    las opciones.
  - La opción marcada como correcta debe representar exactamente el resultado de resolver
    la tarea solicitada, no una cantidad relacionada pero diferente.
  - Antes de devolver una pregunta matemática, resuélvela de principio a fin y comprueba:
    datos → operación → unidades → resultado → opción correcta → explicación.
  - Si el resultado correcto no coincide exactamente con una de las cuatro opciones,
    DESCARTA la pregunta y genera otra.

  ANTES DE ENTREGAR:

  Comprueba internamente:

  1. La pregunta puede resolverse con la información disponible.
  2. Existe una única respuesta correcta.
  3. La respuesta marcada coincide con la solución.
  4. Las opciones y la explicación son coherentes.
  5. No existen contradicciones internas.
  6. La dificultad corresponde al nivel solicitado.

  Si alguna condición falla, descarta la pregunta y genera otra.
  `;

  /* =========================================================
     VISUALES
     ========================================================= */

  const plannedVisualTypes = Array.from(
    new Set(
      generationPlan
        .map((item) => item.visual_type)
        .filter(
          (value): value is VisualType =>
            value !== null
        )
    )
  );

   const visualContracts: string[] = [];

  if (plannedVisualTypes.includes("chart")) {
    visualContracts.push(`
  CHART:

  - Úsalo para datos, tendencias, distribuciones o comparaciones.
  - chart_type: bar | line | pie | scatter | area.
  - categories y values deben tener longitudes coherentes.
  - Todos los valores deben ser numéricos finitos.
  - Los datos deben coincidir exactamente con contexto, pregunta y solución.
  - No generes gráficos decorativos.
  - x_label es obligatorio y debe identificar claramente el eje horizontal.
  - y_label es obligatorio y debe identificar claramente el eje vertical.

  CONTRATO ESTRUCTURAL:

  visual_data DEBE incluir:
  - title
  - chart_type
  - categories
  - series

  No omitas "title".
  "title" debe ser string o null.
  `);
  }

  if (plannedVisualTypes.includes("table")) {
    visualContracts.push(`
  TABLE:

  - Úsala solo cuando los datos tabulares sean necesarios.
  - headers y rows deben ser coherentes.
  - Cada fila debe tener exactamente headers.length columnas.
  - No agregues columnas no declaradas.
  - La tabla debe coincidir con contexto, pregunta, opciones,
    respuesta y explicación.
  - No generes tablas decorativas.

  CONTRATO ESTRUCTURAL:

  visual_data DEBE incluir:
  - title
  - headers
  - rows

  No omitas "title".
  "title" debe ser string o null.
  `);
  }

  if (plannedVisualTypes.includes("math_graph")) {
    visualContracts.push(`
  MATH_GRAPH:

  - Úsalo para funciones, puntos, coordenadas o relaciones entre variables.
  - graph_type: function | points | coordinate_plane | mixed.
  - x_range e y_range deben ser pares numéricos válidos.
  - Las funciones deben usar expresiones matemáticas válidas.
  - Los puntos deben ser coherentes con funciones, coordenadas y datos.
  - El gráfico debe aportar información necesaria para resolver o interpretar.
  - No generes gráficos decorativos.

  CONTRATO ESTRUCTURAL:

  visual_data DEBE incluir:
  - title
  - graph_type
  - x_range
  - y_range
  - points

  No omitas "title".
  "title" debe ser string o null.
  `);
  }

  if (plannedVisualTypes.includes("geometry")) {
    visualContracts.push(`
  GEOMETRY:

  La geometría debe representar UNA SOLA FIGURA PRINCIPAL.

  SHAPES PERMITIDOS:

  - triangle
  - rectangle
  - circle
  - polygon

  Para cuadrados:
  - usa shape="rectangle"
  - incluye la medida correspondiente del lado.

  No uses:
  - square
  - semicircle
  - trapezoid
  - parallelogram
  - rhombus
  - composite

  No inventes propiedades para representar figuras
  que el contrato no soporte.

  CONTRATO ESTRUCTURAL OBLIGATORIO:

  visual_data DEBE incluir SIEMPRE:

  {
    "title": string | null,
    "shape": "...",
    "labels": [],
    "measurements": []
  }

  MUY IMPORTANTE:

  - "title" es OBLIGATORIO.
  - Aunque no necesites un título visible para resolver
    la pregunta, DEBES enviar la propiedad.
  - Si no necesitas título descriptivo, usa:
    "title": null
  - NUNCA omitas la propiedad "title".

  LABELS:

  Cada label debe tener:

  {
    "text": "string",
    "position":
      "top | bottom | left | right | center |
       top_left | top_right | bottom_left | bottom_right"
  }

  MEASUREMENTS:

  Cada measurement debe tener:

  {
    "label": "string",
    "value": "string"
  }

  No uses "unit" como propiedad separada.

  CUTOUTS:

  Los cutouts permitidos por el contrato actual son:

  - semicircle
  - circle
  - rectangle
  - triangle

  Los lados permitidos son:

  - top
  - bottom
  - left
  - right
  - center

  Para un recorte rectangular:

  {
    "type": "rectangle",
    "side": "center",
    "width": number,
    "height": number,
    "removed": true
  }

  Para un recorte circular:

  {
    "type": "circle",
    "side": "center",
    "radius": number,
    "removed": true
  }

  Para un recorte semicircular:

  {
    "type": "semicircle",
    "side": "top | bottom | left | right",
    "radius": number,
    "removed": true
  }

  Para un recorte triangular:

  {
    "type": "triangle",
    "side": "top | bottom | left | right | center",
    "removed": true
  }

  No inventes propiedades adicionales.

  INTEGRIDAD MATEMÁTICA OBLIGATORIA:

  Si la pregunta solicita calcular área, superficie,
  perímetro, longitud, volumen u otra magnitud geométrica:

  1. Calcula internamente el resultado antes de construir
     las opciones.

  2. La respuesta correcta debe coincidir exactamente
     con ese cálculo.

  3. La explicación debe mostrar un procedimiento matemático
     coherente con los datos del visual.

  4. Si existen recortes, ventanas, puertas, agujeros
     u otras partes removidas, debes incorporarlos
     correctamente al cálculo.

  5. Para un rectángulo con recortes rectangulares:

     área válida =
     área exterior -
     suma de las áreas removidas.

  6. Ejemplo:

     figura exterior:
     6 m × 4 m

     área exterior:
     24 m²

     recorte:
     2 m × 1.5 m

     área removida:
     3 m²

     área restante:
     21 m²

     Por lo tanto:

     - si la pregunta pide el área restante,
       la respuesta correcta debe ser 21 m².
     - NO marques 24 m² como respuesta correcta.

  7. Nunca declares en la explicación un resultado final
     diferente de la opción marcada como correcta.

  8. Comprueba esta cadena completa:

     visual_data
        ↓
     measurements
        ↓
     cálculo
        ↓
     opciones
        ↓
     correct_answer
        ↓
     explanation

  9. Todos deben representar exactamente el mismo resultado.

  10. Si no puedes garantizar la consistencia matemática,
      DESCARTA esa pregunta y genera otra.

  11. No generes Geometry únicamente porque el perfil
      de referencia sea visual.

  12. El visual debe ser realmente necesario para resolver
      o interpretar la pregunta.

  REGLA DE SEGURIDAD:

  Si para construir una geometría correcta necesitas
  inventar una propiedad, una estructura o una shape
  que no está permitida por este contrato:

  NO la generes.

  Genera otra pregunta compatible.
  `);
  }

  if (plannedVisualTypes.includes("diagram")) {
    visualContracts.push(`
  DIAGRAM:

  - Úsalo para procesos, sistemas, relaciones o flujos.
  - Los ids de nodos deben ser únicos.
  - from y to deben referenciar nodos existentes.
  - layout: horizontal | vertical | free.
  - Las relaciones deben coincidir exactamente con el contexto
    y la pregunta.
  - No agregues nodos o conexiones decorativas.

  CONTRATO ESTRUCTURAL:

  visual_data DEBE incluir:
  - title
  - elements
  - connections

  No omitas "title".
  "title" debe ser string o null.
  `);
  }

  const visualRules = `
REGLA DE VISUALES — GENERADOR BÁSICO:

ESTE GENERADOR NO GENERA VISUALES.

Para TODAS las preguntas debes devolver exactamente:

- requires_visual = false
- visual_type = null
- visual_description = null
- visual_data = null

NO generes:
- gráficas
- tablas visuales
- diagramas
- figuras geométricas estructuradas
- planos cartesianos
- coordenadas visuales
- objetos chart
- objetos geometry
- objetos diagram
- visual_data
- imágenes

La pregunta debe contener en su propio texto todos los datos
necesarios para resolverla.

Si una referencia original contiene una gráfica, tabla, figura,
diagrama o imagen, NO la reproduzcas como visual.

En ese caso, transforma la idea evaluativa en una pregunta
completamente resoluble mediante texto, números, datos,
descripciones y opciones.

Las imágenes serán añadidas posteriormente de forma manual
desde el editor de preguntas de PeakScore.

IMPORTANTE:
Nunca devuelvas requires_visual=true.
Nunca devuelvas visual_type distinto de null.
Nunca devuelvas visual_description distinto de null.
Nunca devuelvas visual_data distinto de null.
`;
  /* =========================================================
     INSTRUCCIONES ADAPTATIVAS
     ========================================================= */

  const isFirstBlock = profiles.length > 0;

  const calibration = `
CALIBRACIÓN:

Usa las referencias únicamente para calibrar:
- competencia;
- habilidad;
- dificultad;
- estructura;
- contexto;
- tipo de razonamiento;
- uso de visuales.

NO copies preguntas, textos, números, nombres, escenarios ni estructuras
superficiales de las referencias.

La dificultad debe surgir del razonamiento requerido, no de la longitud,
el vocabulario, números grandes o texto innecesario.

VERIFICACIÓN INTERNA:

Antes de entregar cada pregunta comprueba que:
1. la dificultad corresponda al razonamiento requerido;
2. competencia y habilidad sean coherentes con la tarea;
3. el contexto aporte información necesaria;
4. exista una única respuesta correcta;
5. el visual, si existe, sea necesario y coherente;
6. la explicación justifique la respuesta marcada.

Si alguna condición falla, descarta la pregunta y genera otra.
`;

  /* =========================================================
     PROMPT FINAL
     ========================================================= */
  console.log("[PeakScore] 📊 Tamaño de secciones del prompt:", {
    difficultyRule: difficultyRule.length,
    generationPlan: JSON.stringify(compactGenerationPlan).length,
    referenceSection: referenceSection.length,
    excludedSection: excludedSection.length,
    structureRules: structureRules.length,
    optionRules: optionRules.length,
    qualityRules: qualityRules.length,
    visualRules: visualRules.length,
    blueprint: blueprint.length,
    calibration: calibration.length,
  });
     
  return `
Eres especialista senior en evaluación educativa para estudiantes colombianos de grado 11.
Crea preguntas NUEVAS para PeakScore, compatibles con el enfoque pedagógico del Saber 11°.
No copies preguntas oficiales ni material protegido.

SOLICITUD:
Genera exactamente ${amount} preguntas.
Materia: ${subject}
Sesión: ${session}

${blueprint}

${calibration}

PLAN DE ARQUITECTURA OBLIGATORIO:
${JSON.stringify(compactGenerationPlan)}

CORRESPONDENCIA OBLIGATORIA ENTRE EL PLAN Y LA SALIDA:

- assessment_target es un objetivo evaluativo interno del slot.
- La pregunta DEBE construirse para medir específicamente ese objetivo.
- Usa assessment_target para orientar la tarea, el estímulo y el razonamiento requerido.
- NO devuelvas assessment_target en el JSON final.
- NO inventes ni sustituyas un objetivo evaluativo diferente para completar el slot.

- claim representa la afirmación evaluativa que debe sustentar la pregunta.
- La tarea debe permitir obtener evidencia observable relacionada con esa afirmación.
- evidences contiene evidencias evaluativas de referencia para el slot.
- Selecciona una de las evidencias proporcionadas y diseña la pregunta para obtenerla de manera clara.
- NO mezcles evidencias de diferentes slots.
- NO inventes una afirmación o evidencia que contradiga el slot.
- claim y evidences son instrucciones internas y NO deben aparecer como campos en el JSON final.

- La pregunta 1 del array "questions" debe cumplir exactamente el slot cuyo "n" sea 1.
- La pregunta 2 debe cumplir exactamente el slot cuyo "n" sea 2.
- La pregunta 3 debe cumplir exactamente el slot cuyo "n" sea 3.
- Continúa de la misma manera para todas las preguntas solicitadas.
- NO intercambies los slots entre preguntas.
- NO conviertas una pregunta visual planificada en una pregunta sin visual.
- NO conviertas una operación cognitiva planificada en otra diferente.
- Respeta simultáneamente component, competence, skill, difficulty,
  structure_type, context_type, requires_visual, cognitive_operation
  y visual_type del slot correspondiente.
- Si una idea de pregunta no cumple el slot asignado, DESCÁRTALA y crea otra.
- Antes de devolver cada pregunta, verifica mentalmente que cumple su slot
  correspondiente completo.

${difficultyRule}

${structureRules}

${optionRules}

${qualityRules}

${visualRules}

${referenceSection}

${excludedSection}

REGLAS ADICIONALES:
- Usa español natural, excepto Inglés, cuyo material evaluado debe estar en inglés.
- Proporciona todos los datos necesarios para resolver la pregunta.
- Evalúa razonamiento, no memoria literal cuando pueda evaluarse aplicación o interpretación.
- Mantén coherencia entre subject, session, component, competence, skill, structure_type,
  context_type, dificultad, contexto, pregunta, opciones, respuesta, explicación y visual.
- La competencia y el componente deben corresponder realmente a la tarea.
- No dependas de acontecimientos recientes.
- No uses nombres de instituciones reales innecesariamente.
- Las preguntas del mismo bloque deben ser genuinamente diferentes.

FORMATO:
Devuelve únicamente JSON válido. No escribas texto fuera del JSON.

La respuesta debe tener esta estructura raíz:

{
  "questions": [
    {
      "subject": "string",
      "session": 1,
      "component": "string o null",
      "competence": "string o null",
      "skill": "string o null",
      "difficulty": "Fácil, Media o Difícil",
      "structure_type": "string o null",
      "context_type": "string o null",
      "question": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "correct_answer": "A, B, C o D",
      "explanation": "string",
      "context_text": "string o null",
      "requires_visual": false,
      "visual_type": null,
      "visual_description": null,
      "visual_data": null     
    }
  ]
}

Siempre:

requires_visual=false
visual_type=null
visual_description=null
visual_data=null

Devuelve JSON válido y únicamente JSON.
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
  existingBankQuestions: ExistingQuestionForSimilarity[],
  existingGeneratedQuestions: GeneratedQuestion[],
  existingDifficulties: GeneratedDifficulty[],
  totalRequested: number,
  generationPlan: GenerationPlanItem[]
): Promise<GenerationBlockResult> {
  let lastError: unknown = null;

  const acceptedQuestions: GeneratedQuestion[] = [];
  let planAssignmentCursor = 0;

  for (
    let attempt = 1;
    attempt <= MAX_BLOCK_ATTEMPTS;
    attempt++
  ) {
    const remainingAmount =
      amount - acceptedQuestions.length;

    if (remainingAmount <= 0) {
      return {
        questions: acceptedQuestions,
        consumedPlanSlots: Math.min(
          planAssignmentCursor,
          generationPlan.length
        ),
      };
    }

    try {
      console.log(
        `[PeakScore] Groq solicitando ${remainingAmount} preguntas. Intento ${attempt}/${MAX_BLOCK_ATTEMPTS}.`
      );

      const response = await generateAI({
        provider: "groq",
        
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
            planAssignmentCursor,
            Math.min(
              planAssignmentCursor +
                remainingAmount,
              generationPlan.length
            )
          )
        ),

        task: "question_generation",

        useFallback: 
          attempt === MAX_BLOCK_ATTEMPTS,
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

      const similarityAcceptedQuestions: GeneratedQuestion[] = [];

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
      
      const planBaseCursor =
        planAssignmentCursor;

      let lastContiguousCandidateIndex =
        -1;
      
      const valid =
        generated.filter(
          (
            item: GeneratedQuestion,
            generatedIndex
          ) => {
            if (acceptedQuestions.length >= amount) {
              return false;
            }

            const difficultyValid =
              isDifficultyAllowed(
                item.difficulty,
                difficulty
              );

            if (
              planAssignmentCursor >=
              generationPlan.length
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: no quedan slots disponibles en el plan de generación.`
              );

              return false;
            }

            const candidatePlanIndex =
              planBaseCursor + generatedIndex;

            const plannedDifficulty =
              generationPlan[
                candidatePlanIndex
              ]?.difficulty ?? null;

            const plannedOperation =
              generationPlan[
                candidatePlanIndex
              ]?.cognitive_operation ?? null;

            const plannedVisualType: VisualType | null = null;

            const plannedCompetence =
              generationPlan[
                candidatePlanIndex
              ]?.competence ?? null;

            const plannedSkill =
              generationPlan[
                candidatePlanIndex
              ]?.skill ?? null;

            if (
              plannedSkill &&
              normalize(item.skill) !==
                normalize(plannedSkill)
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: habilidad no coincide con el slot del plan.`,
                {
                  plannedSkill,
                  generatedSkill:
                    item.skill,
                }
              );

              return false;
            }

            const plannedStructureType =
              generationPlan[
                candidatePlanIndex
              ]?.structure_type ?? null;

            if (
              plannedStructureType &&
              !item.structure_type?.trim()
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: structure_type faltante para el slot del plan.`,
                {
                  plannedStructureType,
                }
              );

              return false;
            }

            const plannedContextType =
              generationPlan[
                candidatePlanIndex
              ]?.context_type ?? null;

            if (
              plannedContextType &&
              !item.context_type?.trim()
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: context_type faltante para el slot del plan.`,
                {
                  plannedContextType,
                }
              );

              return false;
            }

            if (
              plannedCompetence &&
              normalize(item.competence) !==
                normalize(plannedCompetence)
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: competencia no coincide con el slot del plan.`,
                {
                  plannedCompetence,
                  generatedCompetence:
                    item.competence,
                }
              );

              return false;
            }

            if (
              difficulty === "Mixta" &&
              normalizeDifficulty(item.difficulty) !==
                normalizeDifficulty(plannedDifficulty)
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: dificultad no coincide con el slot del plan.`,
                {
                  plannedDifficulty,
                  generatedDifficulty:
                    item.difficulty,
                }
              );

              return false;
            }

            const questionValid =
              isValidQuestion(
                item,
                subject,
                session,
                plannedOperation,
                plannedVisualType
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
                  session,
                  plannedOperation,
                  plannedVisualType
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

            if (
              acceptedQuestions.some(
                (accepted) =>
                  normalize(accepted.question) === key
              )
            ) {
              console.warn(
                `[PeakScore] ❌ Candidato ${generated.indexOf(item) + 1}: la pregunta ya fue aceptada en un intento anterior del mismo bloque.`
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

            const similarityResult =
              findSimilarQuestion(
                item,
                existingBankQuestions,
                [
                  ...existingGeneratedQuestions,
                  ...acceptedQuestions,
                  ...similarityAcceptedQuestions,
                ]
              );

            if (similarityResult.isDuplicate) {
              console.warn(
                "[PeakScore] ❌ Candidato descartado por similitud antes de consumir slot del plan.",
                {
                  similarity:
                    similarityResult.similarity,
                  matchedQuestionId:
                    similarityResult.matchedQuestionId,
                }
              );

              return false;
            }

            if (
              generatedIndex !==
              lastContiguousCandidateIndex + 1
            ) {
              console.warn(
                `[PeakScore] ⚠️ Candidato ${generatedIndex + 1} fue validado para el slot ${candidatePlanIndex + 1}, pero no se consumirá porque existe un slot anterior pendiente.`
              );

              return false;
            }

            lastContiguousCandidateIndex =
              generatedIndex;
            
            similarityAcceptedQuestions.push(item);
            unique.add(key);
            planAssignmentCursor++;

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
          return {
            questions: acceptedQuestions.slice(0, amount),
            consumedPlanSlots: Math.min(
              planAssignmentCursor,
              generationPlan.length
            ),
          };
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
        continue;
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
    return {
      questions: acceptedQuestions.slice(0, amount),
      consumedPlanSlots: Math.min(
        planAssignmentCursor,
        generationPlan.length
      ),
    };
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
        subject,
        amount,
        profiles,
        difficulty
      );

    let totalAttempts = 0;
    let noProgressAttempts = 0;

    /*
     * Seguimos generando hasta completar
     * exactamente la cantidad solicitada.
     */

    let generationPlanCursor = 0;
    
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

      if (
        generationPlanCursor >=
          generationPlan.length
      ) {
        throw new Error(
          `El plan de generación se agotó antes de completar las ${amount} preguntas. Se obtuvieron ${generatedQuestions.length}.`
        );
      }

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

      const blockResult =
        await generateBlock(
          subject,
          session,
          generationRequestAmount,
          difficulty,
          profiles,
          existingQuestions,
          existingBankQuestions,
          generatedQuestions,
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
            generationPlanCursor,
            Math.min(
              generationPlanCursor + generationRequestAmount,
              generationPlan.length
            )
          )
        );

      const block = blockResult.questions;

      /*
       * El cursor del plan NO avanza todavía.
       *
       * Primero debemos comprobar qué preguntas del bloque
       * sobreviven la validación final de similitud y realmente
       * entran en generatedQuestions.
       */

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

      /*
       * El bloque ya terminó su asignación de plan.
       *
       * Avanzamos según los slots realmente recorridos
       * por generateBlock(), NO según las preguntas que
       * sobrevivieron la validación final de similitud.
       */
      generationPlanCursor +=
        blockResult.consumedPlanSlots;

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