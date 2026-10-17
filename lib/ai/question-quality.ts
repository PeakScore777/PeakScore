/**
 * Quality controls for PeakScore AI-generated Saber 11 practice questions.
 * These rules calibrate original content; they do not reproduce official items.
 */

export type ReviewAnswer = "A" | "B" | "C" | "D";

export interface QualityQuestion {
  subject: string;
  session: number;
  component?: string | null;
  competence?: string | null;
  skill?: string | null;
  difficulty: string;
  structure_type?: string | null;
  context_type?: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: ReviewAnswer;
  explanation?: string | null;
  context_text?: string | null;
  requires_visual?: boolean;
  visual_type?: string | null;
  visual_description?: string | null;
  visual_data?: unknown;
}

export interface QualityPlanSlot {
  assessment_target?: string | null;
  task_family?: string | null;
  component?: string | null;
  competence?: string | null;
  skill?: string | null;
  difficulty?: string | null;
  structure_type?: string | null;
  context_type?: string | null;
}

export interface IndependentReview {
  index: number;
  verdict: "approve" | "reject";
  independent_answer: ReviewAnswer | "uncertain";
  key_matches: boolean;
  one_correct_answer: boolean;
  information_sufficient: boolean;
  subject_aligned: boolean;
  explanation_consistent: boolean;
  difficulty_appropriate: boolean;
  critical_issues: string[];
  warnings: string[];
}

export interface ParsedIndependentReview {
  reviews: IndependentReview[];
}

export function normalizeQualitySubject(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const TASK_FAMILIES: Record<string, Record<string, string[]>> = {
  "matematicas": {
    "interpretacion": [
      "Interpretar datos agrupados en una tabla pequeña y comparar grupos usando el denominador adecuado.",
      "Transformar una relación entre fracción, razón, porcentaje o tasa y determinar qué representación conserva el significado.",
      "Interpretar una tendencia o distribución de datos descritos explícitamente y evaluar una conclusión posible.",
      "Determinar cómo una conclusión cambia al cambiar una unidad, escala o representación cuantitativa."
    ],
    "formulacion": [
      "Modelar una relación algebraica que no sea cuota fija más tarifa por unidad.",
      "Resolver una situación de proporcionalidad y distinguir entre relación directa e inversa.",
      "Resolver una situación de conteo, probabilidad o conjuntos con un espacio muestral definido.",
      "Combinar medidas geométricas sin repetir el procedimiento de área rectangular menos ventanas o puertas.",
      "Convertir unidades o relacionar magnitudes antes de realizar una decisión cuantitativa.",
      "Resolver una situación de varios pasos donde haya que respetar una restricción explícita."
    ],
    "argumentacion": [
      "Identificar el primer paso inválido de un procedimiento y seleccionar una corrección coherente.",
      "Validar o refutar una afirmación usando los datos disponibles o un contraejemplo.",
      "Comparar dos estrategias y establecer cuál satisface las condiciones del problema.",
      "Evaluar una conclusión estadística diferenciando cantidad absoluta, proporción, tasa y denominador.",
      "Determinar si una solución satisface un conjunto de restricciones y justificar el veredicto."
    ]
  },
  "lectura critica": {
    "local": [
      "Inferir el significado de una expresión a partir del contexto inmediato y de pistas lingüísticas concretas.",
      "Reconocer la función de un conector, pronombre o referencia entre oraciones.",
      "Distinguir la información explícita de una paráfrasis que cambia un matiz importante."
    ],
    "global": [
      "Reconstruir la idea global a partir de la relación entre distintas partes del texto.",
      "Determinar la función de un párrafo, ejemplo u objeción dentro de la organización del texto.",
      "Inferir la relación lógica entre afirmaciones y establecer cómo contribuye al sentido total.",
      "Distinguir la tesis del autor de una objeción, una fuente citada o una idea secundaria."
    ],
    "critical": [
      "Evaluar si la evidencia del texto respalda la afirmación principal.",
      "Reconocer un supuesto, perspectiva o estrategia argumentativa y valorar su efecto.",
      "Comparar dos interpretaciones y seleccionar la sustentada por la evidencia textual.",
      "Determinar qué información adicional fortalecería o debilitaría el argumento."
    ]
  },
  "sociales y ciudadanas": {
    "pensamiento_social": [
      "Aplicar un concepto social, económico, histórico o constitucional a un caso descrito.",
      "Relacionar una institución, mecanismo de participación o derecho con su función en la situación.",
      "Explicar una relación causal histórica o social usando la evidencia suministrada."
    ],
    "perspectivas": [
      "Comparar los intereses, supuestos y argumentos de dos actores ante un mismo problema.",
      "Distinguir hechos, valoraciones e inferencias en una fuente o declaración.",
      "Identificar qué evidencia respalda una perspectiva sin asumir que una postura es correcta por sí misma.",
      "Reconocer un sesgo u omisión de una fuente y explicar cómo afecta su conclusión."
    ],
    "sistemico": [
      "Analizar consecuencias sociales, económicas, políticas y ambientales de una decisión pública.",
      "Comparar alternativas de solución según un conjunto explícito de objetivos y restricciones.",
      "Explicar cómo interactúan dos dimensiones de un problema colectivo.",
      "Determinar qué información falta para valorar los efectos y límites de una política."
    ]
  },
  "ciencias naturales": {
    "inquiry": [
      "Diseñar o criticar una indagación identificando variables, controles y condiciones constantes.",
      "Interpretar resultados experimentales y escoger la conclusión que no excede la evidencia.",
      "Identificar variables independiente y dependiente y los controles relevantes.",
      "Evaluar si un procedimiento permite responder una pregunta investigable y reconocer una limitación."
    ],
    "explanation": [
      "Explicar un fenómeno mediante un mecanismo causal o un modelo científico pertinente.",
      "Predecir cómo cambiaría un fenómeno al modificar una condición especificada.",
      "Comparar dos explicaciones de un fenómeno y seleccionar la coherente con las evidencias.",
      "Relacionar observaciones con un principio científico sin asumir datos no proporcionados."
    ],
    "use": [
      "Aplicar un concepto o modelo científico a una situación nueva y concreta.",
      "Relacionar variables o representaciones usando datos incluidos en el enunciado.",
      "Seleccionar el modelo científico que mejor explica las condiciones descritas.",
      "Interpretar medidas, unidades o datos y delimitar qué permiten afirmar."
    ]
  },
  "ingles": {
    "part1": ["Comprender vocabulario frecuente a partir de una descripción breve original en inglés."],
    "part2": ["Interpretar el propósito pragmático de un aviso o mensaje original en inglés."],
    "part3": ["Elegir una respuesta comunicativa adecuada para completar una interacción breve en inglés."],
    "part4": ["Completar un texto original en inglés usando gramática y cohesión en contexto."],
    "part5": ["Localizar e interpretar información explícita de un texto original en inglés."],
    "part6": ["Inferir una idea, referencia o conclusión razonable a partir de un texto original en inglés."],
    "part7": ["Elegir vocabulario o estructura gramatical dentro de un texto cloze original en inglés."]
  }
};

function getFamilyGroup(subject: string, targetId: string): string {
  const s = normalizeQualitySubject(subject);
  const id = normalizeQualitySubject(targetId);

  if (s === "matematicas") {
    if (id.includes("interpret")) return "interpretacion";
    if (id.includes("argument")) return "argumentacion";
    return "formulacion";
  }
  if (s === "lectura critica") {
    if (id.includes("local")) return "local";
    if (id.includes("global")) return "global";
    return "critical";
  }
  if (s === "sociales y ciudadanas") {
    if (id.includes("perspect")) return "perspectivas";
    if (id.includes("sistem") || id.includes("reflex")) return "sistemico";
    return "pensamiento_social";
  }
  if (s === "ciencias naturales") {
    if (id.includes("inquiry") || id.includes("indag")) return "inquiry";
    if (id.includes("explanation") || id.includes("explicacion")) return "explanation";
    return "use";
  }
  if (s === "ingles") {
    const match = id.match(/part\s*([1-7])/);
    return match ? "part" + match[1] : "part5";
  }
  return "general";
}

/** Selects a task-method instruction, attempting not to repeat it within a batch. */
export function chooseTaskFamily(
  subject: string,
  targetId: string,
  usedFamilies: Set<string>,
  slotIndex: number
): string {
  const s = normalizeQualitySubject(subject);
  const group = getFamilyGroup(s, targetId);
  const catalog = TASK_FAMILIES[s] ?? {};
  const candidates = catalog[group] ?? [
    "Resolver una tarea interpretativa nueva, autosuficiente y justificable con los datos proporcionados."
  ];
  const availableIndex = candidates.findIndex((candidate) => !usedFamilies.has(candidate));
  const index = availableIndex >= 0 ? availableIndex : ((slotIndex % candidates.length) + candidates.length) % candidates.length;
  const selected = candidates[index];
  usedFamilies.add(selected);
  return selected;
}

export function getSubjectQualityRules(subject: string): string {
  const s = normalizeQualitySubject(subject);

  if (s === "matematicas") {
    return [
      "CRITERIOS DISCIPLINARES — MATEMÁTICAS:",
      "- A lo largo del banco, cubre interpretación y representación, formulación y ejecución, y argumentación; los componentes incluyen numérico-variacional, geométrico-métrico y aleatorio.",
      "- Resuelve el ítem independientemente y comprueba operaciones, signos, unidades, conversiones, redondeo, tasas, denominadores y equivalencia algebraica.",
      "- Distingue cantidad absoluta, proporción dentro de un grupo, porcentaje del total, tasa y cantidad acumulada.",
      "- Cada distractor debe corresponder a un error matemático plausible. Recalcula el procedimiento descrito en cada opción cuando la opción incluya una explicación numérica.",
      "- No repitas en una tanda métodos equivalentes aunque cambien nombres, cifras o escenarios. Cambiar la cuota y el precio por unidad sigue siendo la misma familia algebraica.",
      "- Evita repetir problemas de área de un rectángulo/fachada/pared menos ventanas, puertas, pilares u otras áreas ocupadas.",
      "- Usa notación de texto plano compatible con el banco, sin delimitadores que se muestren literalmente.",
      "- Dificultad = razonamiento exigido; varias operaciones mecánicas o un texto largo no convierten por sí solos una pregunta en Difícil."
    ].join("\n");
  }

  if (s === "lectura critica") {
    return [
      "CRITERIOS DISCIPLINARES — LECTURA CRÍTICA:",
      "- Respeta el objetivo del slot: contenido local; articulación de partes y sentido global; o reflexión y evaluación del texto.",
      "- Toda clave debe sustentarse en evidencia localizada en el estímulo; no repares vacíos con conocimiento externo.",
      "- Distingue tesis del autor, voz de fuentes citadas, objeciones, ejemplos y datos secundarios.",
      "- Cuando preguntes por propósito, inferencia, función de una parte o fuerza de un argumento, el texto debe contener pistas suficientes para distinguir una única respuesta.",
      "- Las alternativas deben ser interpretaciones plausibles del texto, pero incompatibles con una evidencia o relación lógica concreta.",
      "- Evita repetir la misma tarea de tesis/idea principal con otro texto, así como preguntas de vocabulario aislado sin contexto."
    ].join("\n");
  }

  if (s === "sociales y ciudadanas") {
    return [
      "CRITERIOS DISCIPLINARES — SOCIALES Y CIUDADANAS:",
      "- Respeta pensamiento social, interpretación/análisis de perspectivas y pensamiento reflexivo/sistémico según el slot.",
      "- Construye casos originales y autosuficientes; incluye actores, intereses, fuente, datos o contexto cuando la tarea los requiera.",
      "- Distingue hechos, afirmaciones de actores e inferencias. No presentes opiniones controvertidas como hechos indiscutibles.",
      "- Comprueba las reglas de instituciones, ciudadanía, derechos y participación; no inventes competencias institucionales ni procedimientos legales.",
      "- Las alternativas deben evaluar causas, perspectivas, evidencia o consecuencias, no ser caricaturas morales ni estar sesgadas por partido político.",
      "- No infieras causalidad a partir de una mera correlación y explicita bases comparables al contrastar regiones, periodos o grupos.",
      "- Evita preguntas que se resuelvan solo por memorizar nombres, fechas o artículos cuando la tarea requiere interpretar la información del estímulo."
    ].join("\n");
  }

  if (s === "ciencias naturales") {
    return [
      "CRITERIOS DISCIPLINARES — CIENCIAS NATURALES:",
      "- Mantén cobertura de uso comprensivo del conocimiento científico, explicación de fenómenos e indagación, y diversidad entre biología, física, química y Ciencia, Tecnología y Sociedad a lo largo del banco.",
      "- Verifica la plausibilidad científica, los mecanismos, condiciones iniciales, signos, magnitudes, unidades y límites del modelo.",
      "- En experimentos identifica bien pregunta investigable, hipótesis, variable independiente, variable dependiente, controles y constantes; las conclusiones no deben exceder los datos.",
      "- Distingue observación, hipótesis, modelo, evidencia y conclusión; no confundas correlación con causalidad ni confundas un grupo de control con una variable.",
      "- En física comprueba dirección de fuerzas y condiciones del modelo; en química fórmulas y conservación de átomos/carga; en biología interacciones y mecanismos; en CTS beneficios, riesgos y límites basados en evidencia.",
      "- No menciones gráficas, tablas, figuras ni diagramas ausentes. Si la generación automática no admite visuales, incorpora los datos relevantes en el texto."
    ].join("\n");
  }

  if (s === "ingles") {
    return [
      "CRITERIOS DISCIPLINARES — INGLÉS:",
      "- Todo el contenido lingüístico que se evalúa debe estar en inglés natural y compatible con grado 11.",
      "- Diferencia vocabulario en contexto, propósito de avisos, función comunicativa en diálogos, gramática/cohesión en cloze y comprensión literal e inferencial.",
      "- En diálogos, cada opción debe responder lógicamente al turno previo. En cloze, verifica concordancia, tiempo verbal, preposición, cohesión y significado global.",
      "- Los distractores deben ser plausibles para un estudiante, pero fallar por una razón lingüística o pragmática clara; no debe haber dos opciones naturales.",
      "- Usa estímulos originales y evita traducciones literales del español, gramática descontextualizada y vocabulario innecesariamente especializado."
    ].join("\n");
  }

  return "CRITERIOS DE CALIDAD: ítem original, autosuficiente, una sola respuesta demostrable y tres distractores plausibles.";
}

export function buildIndependentReviewPrompt(
  subject: string,
  session: number,
  questions: QualityQuestion[],
  slots: QualityPlanSlot[]
): string {
  const s = normalizeQualitySubject(subject);
  const compactItems = questions.map((q, index) => {
    const slot = slots[index] ?? {};
    return {
      index: index + 1,
      planned_target: slot.assessment_target ?? null,
      planned_task_family: slot.task_family ?? null,
      planned_competence: slot.competence ?? null,
      planned_skill: slot.skill ?? null,
      planned_difficulty: slot.difficulty ?? q.difficulty,
      component: q.component ?? slot.component ?? null,
      competence: q.competence ?? slot.competence ?? null,
      skill: q.skill ?? slot.skill ?? null,
      difficulty: q.difficulty,
      structure_type: q.structure_type ?? null,
      context_type: q.context_type ?? null,
      context_text: q.context_text ?? null,
      question: q.question,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d
      },
      stated_correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      requires_visual: q.requires_visual ?? false,
      visual_type: q.visual_type ?? null,
      visual_description: q.visual_description ?? null,
      visual_data: q.visual_data ?? null
    };
  });

  const subjectReviewRules = getSubjectQualityRules(s);
  return [
    "Actúas como auditor disciplinar independiente de preguntas originales de PeakScore para el examen Saber 11.",
    "No redactes preguntas nuevas ni corrijas el contenido: resuelve y diagnostica. No asumas que la respuesta clave ni su explicación son correctas.",
    "Materia: " + subject,
    "Sesión: " + session,
    "Cantidad de ítems: " + questions.length,
    "",
    "CRITERIOS OBLIGATORIOS PARA RECHAZAR:",
    "- Respuesta marcada incorrecta, no demostrable, más de una opción defendible, ninguna correcta o información insuficiente.",
    "- Explicación que contradice la solución o utiliza operaciones, unidades o supuestos incorrectos.",
    "- Competencia/tarea no corresponde al slot o dificultad que depende solamente de longitud o cálculo mecánico.",
    "- Error científico, conceptual, lingüístico, causal, de fuente o de interpretación.",
    "- Dependencia de gráfica, tabla, imagen o diagrama que no esté incluido en el ítem.",
    "- Opciones duplicadas, absurdas, matemáticamente falsas de manera obvia o pistas involuntarias de la clave.",
    "- En Inglés: opción antinatural, incorrecta en inglés real o más de una respuesta admisible.",
    "- Redundancia metodológica en una tanda pequeña: rechaza la repetición posterior si solo cambia el contexto, los nombres o las cifras.",
    "",
    subjectReviewRules,
    "",
    "REVISIÓN INDEPENDIENTE:",
    "1. Resuelve/lee cada pregunta por tu cuenta antes de comparar con stated_correct_answer.",
    "2. Comprueba las cuatro opciones y considera si otra también podría ser correcta.",
    "3. Audita datos y explicación, no te fíes del razonamiento escrito por quien generó el ítem.",
    "4. Compara método y habilidad dentro de todo el lote, no solo similitud textual.",
    "5. Si existe incertidumbre real, devuelve independent_answer = uncertain y rechaza.",
    "6. Los warnings de estilo menores pueden coexistir con approve; errores de validez van en critical_issues.",
    "",
    "Devuelve únicamente JSON válido. Debe incluir cada índice del 1 al " + questions.length + " exactamente una vez. No uses markdown.",
    "Esquema por review: index (número), verdict (approve/reject), independent_answer (A/B/C/D/uncertain), key_matches, one_correct_answer, information_sufficient, subject_aligned, explanation_consistent, difficulty_appropriate (booleanos), critical_issues (strings[]) y warnings (strings[]).",
    "Para aprobar, todos los booleanos deben ser true, independent_answer debe coincidir con stated_correct_answer y critical_issues debe quedar vacío. No apruebes por cortesía.",
    "",
    "ÍTEMS PARA AUDITAR:",
    JSON.stringify(compactItems)
  ].join("\n");
}

export function parseIndependentReviewResponse(
  raw: string,
  expectedCount: number
): ParsedIndependentReview | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const reviews = (parsed as { reviews?: unknown }).reviews;
  if (!Array.isArray(reviews) || reviews.length !== expectedCount) return null;

  const indices = new Set<number>();
  const normalized: IndependentReview[] = [];
  const boolFields = [
    "key_matches",
    "one_correct_answer",
    "information_sufficient",
    "subject_aligned",
    "explanation_consistent",
    "difficulty_appropriate"
  ] as const;

  for (const entry of reviews) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const item = entry as Record<string, unknown>;
    const index = item.index;

    if (
      typeof index !== "number" ||
      !Number.isInteger(index) ||
      index < 1 ||
      index > expectedCount ||
      indices.has(index)
    ) return null;

    if (item.verdict !== "approve" && item.verdict !== "reject") return null;
    const answer = item.independent_answer;
    if (answer !== "A" && answer !== "B" && answer !== "C" && answer !== "D" && answer !== "uncertain") return null;
    if (boolFields.some((field) => typeof item[field] !== "boolean")) return null;

    const critical = item.critical_issues;
    const warnings = item.warnings;
    if (
      !Array.isArray(critical) ||
      critical.some((value) => typeof value !== "string") ||
      !Array.isArray(warnings) ||
      warnings.some((value) => typeof value !== "string")
    ) return null;

    const review: IndependentReview = {
      index,
      verdict: item.verdict,
      independent_answer: answer,
      key_matches: item.key_matches as boolean,
      one_correct_answer: item.one_correct_answer as boolean,
      information_sufficient: item.information_sufficient as boolean,
      subject_aligned: item.subject_aligned as boolean,
      explanation_consistent: item.explanation_consistent as boolean,
      difficulty_appropriate: item.difficulty_appropriate as boolean,
      critical_issues: critical as string[],
      warnings: warnings as string[]
    };

    if (
      review.independent_answer === "uncertain" ||
      !review.key_matches ||
      !review.one_correct_answer ||
      !review.information_sufficient ||
      !review.subject_aligned ||
      !review.explanation_consistent ||
      !review.difficulty_appropriate ||
      review.critical_issues.length > 0
    ) {
      review.verdict = "reject";
    }

    indices.add(index);
    normalized.push(review);
  }

  if (indices.size !== expectedCount) return null;
  normalized.sort((a, b) => a.index - b.index);
  return { reviews: normalized };
}
