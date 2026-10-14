import {
  getEnglishFormat,
  getEnglishStimulusType,
  validateEnglishQuestionSet,
  type EnglishOption,
  type EnglishPart,
  type EnglishQuestionDefinition,
  type EnglishStimulus,
} from "@/lib/types/english-assessment";

export interface EnglishGeneratedSet {
  stimulus: EnglishStimulus;
  questions: EnglishQuestionDefinition[];
}

export interface EnglishGenerationResult {
  sets: EnglishGeneratedSet[];
  questionCount: number;
}

type RequestedDifficulty = "Fácil" | "Media" | "Difícil" | "Mixta";

function expectedSetCount(part: EnglishPart, amount: number): number | null {
  if (part === 1) return amount / 5;
  if (part === 2 || part === 3) return amount;
  // For reading and cloze parts, stimulus lengths vary by text.
  return null;
}

function expectedQuestionCountPerSet(part: EnglishPart): number | null {
  if (part === 1) return 5;
  if (part === 2 || part === 3) return 1;
  return null;
}

function getQuestionRangePerSet(part: EnglishPart): { min: number; max: number } | null {
  switch (part) {
    case 4:
      return { min: 4, max: 8 };
    case 5:
      return { min: 4, max: 7 };
    case 6:
      return { min: 2, max: 4 };
    case 7:
      return { min: 4, max: 8 };
    default:
      return null;
  }
}

export function validateEnglishGenerationRequest(
  part: EnglishPart,
  amount: number,
): string | null {
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return "La cantidad debe ser un entero entre 1 y 100.";
  }

  if (part === 1 && amount % 5 !== 0) {
    return "La Parte 1 requiere múltiplos de cinco para conservar cada banco A–G con sus cinco descripciones. Usa 5, 10, 15… preguntas.";
  }

  const groupRange = getQuestionRangePerSet(part);
  if (groupRange && amount < groupRange.min) {
    return `La Parte ${part} requiere al menos ${groupRange.min} preguntas para formar un conjunto de lectura/cloze completo.`;
  }

  return null;
}

export function buildEnglishGenerationPrompt(
  part: EnglishPart,
  amount: number,
  difficulty: RequestedDifficulty,
): string {
  const format = getEnglishFormat(part);
  const stimulusType = getEnglishStimulusType(part);
  const setCount = expectedSetCount(part, amount);
  const itemCount = expectedQuestionCountPerSet(part);
  const questionRange = getQuestionRangePerSet(part);
  const setInstructions = setCount === null
    ? `La cantidad de conjuntos es flexible. Crea tantos estímulos completos como necesites; cada conjunto debe tener entre ${questionRange?.min} y ${questionRange?.max} preguntas y la suma de todos debe ser exactamente ${amount}.`
    : `Devuelve exactamente ${setCount} conjuntos, con ${itemCount} ítem(s) por conjunto.`;

  const structure = {
    1: "Cada conjunto debe tener un banco compartido de exactamente siete palabras/opciones A-G y exactamente cinco descripciones en inglés. Cada descripción es un ítem puntuable independiente. Dos palabras del banco no se usan. No incluyas opciones individuales en las preguntas.",
    2: "Genera un aviso o señal breve y natural (el estímulo se representará como texto accesible en esta primera fase) y una pregunta que pida identificar el lugar donde podría aparecer. Incluye exactamente tres opciones A-C.",
    3: "Genera una conversación breve y natural con un turno faltante y una pregunta que pida escoger la intervención adecuada. Incluye exactamente tres opciones A-C.",
    4: "Genera un texto cloze coherente en inglés con un marcador por espacio, escrito exactamente como [[1]], [[2]], etc. Cada marcador tiene un ítem puntuable y tres opciones A-C. No elimines el marcador del texto compartido.",
    5: "Genera un texto en inglés y preguntas de comprensión literal cuya respuesta esté explícitamente respaldada por el texto, formulada como paráfrasis. Cada pregunta tiene tres opciones A-C.",
    6: "Genera un texto en inglés y preguntas de comprensión inferencial sobre intención, propósito, relaciones o ideas generales/particulares que requieran inferir. Cada pregunta tiene cuatro opciones A-D.",
    7: "Genera un texto cloze coherente en inglés que evalúe gramática y vocabulario en contexto. Incluye un marcador por espacio, exactamente como [[1]], [[2]], etc. Cada marcador tiene un ítem puntuable y cuatro opciones A-D.",
  }[part];

  const optionRules = part === 1
    ? 'El estímulo debe tener "options_json": [{"key":"A","text":"..."}, ... {"key":"G","text":"..."}]. Cada pregunta debe tener "options_json": null y "correct_answer" A-G.'
    : `Cada pregunta debe tener "options_json" con exactamente ${part >= 6 ? 4 : 3} opciones, ordenadas y etiquetadas ${part >= 6 ? "A, B, C, D" : "A, B, C"}. La clave "correct_answer" debe ser una de esas letras.`;

  return `
Eres editor experto en evaluación de inglés para estudiantes colombianos que preparan Saber 11. Crea contenido ORIGINAL; no copies preguntas oficiales, textos protegidos ni ejercicios publicados.

Parte ICFES: ${part}
Formato interno obligatorio: ${format}
Tipo de estímulo: ${stimulusType}
Cantidad total solicitada: ${amount} ítems puntuables.
Conjuntos de estímulo que debes devolver: ${setCount}.
Regla de agrupación: ${setInstructions}
Ítems por conjunto fijo: ${itemCount ?? "variable según el texto, con rangos editoriales por parte"}.
Dificultad solicitada: ${difficulty}. Si es Mixta, distribuye Fácil, Media y Difícil de manera razonable. Si es Fácil, Media o Difícil, todas las preguntas deben usar exactamente esa dificultad.

TAREA DE ESTA PARTE:
${structure}

REGLAS PEDAGÓGICAS:
- El texto de la pregunta, el estímulo y las opciones deben estar en inglés cuando corresponda al examen. La explicación editorial puede estar en español, clara y específica.
- Debe haber exactamente una respuesta correcta, plausible pero inequívoca.
- Las opciones incorrectas deben ser verosímiles, no absurdas, y no revelar la respuesta por longitud o gramática accidental.
- No inventes datos que contradigan el estímulo.
- Evita duplicar ideas, frases o respuestas entre ítems del mismo conjunto.
- No generes URLs, enlaces ni imágenes falsas. "image_url" e "image_alt" deben ser null en esta fase textual. En una fase posterior, un flujo separado generará y revisará imágenes originales para avisos/señales de la Parte 2 y, cuando aporten valor pedagógico, escenas de apoyo para conversaciones; nunca inventes rutas de archivos ni asignes imágenes que aún no existan.
- Incluye la habilidad concreta evaluada en "skill".
- Incluye explicación suficiente para justificar la respuesta correcta.
- Las posiciones empiezan en 1 y son consecutivas dentro de cada estímulo.
- En Parte 1, los cinco ítems deben tener claves A-G válidas y dos opciones del banco deben quedar sin usar.
- En Partes 4 y 7, los marcadores del texto deben ser consecutivos desde [[1]] y el número de marcadores debe ser igual al número de preguntas del conjunto.
- ${optionRules}
- Devuelve JSON válido, sin markdown, sin comentarios y sin texto fuera del objeto.
- No añadas claves que no estén descritas en el esquema.

ESQUEMA EXACTO:
{
  "sets": [
    {
      "stimulus": {
        "stimulus_type": "${stimulusType}",
        "content": "Texto completo del estímulo, con marcadores cloze si corresponde",
        "options_json": ${part === 1 ? '[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."},{"key":"E","text":"..."},{"key":"F","text":"..."},{"key":"G","text":"..."}]' : "null"},
        "image_url": null,
        "image_alt": null,
        "metadata": {}
      },
      "questions": [
        {
          "stimulus_position": 1,
          "question": "Descripción/pregunta/instrucción específica del ítem",
          "options_json": ${part === 1 ? "null" : '[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."}]'},
          "correct_answer": "A",
          "difficulty": "Media",
          "explanation": "Explicación clara en español",
          "skill": "Habilidad concreta",
          "question_metadata": {}
        }
      ]
    }
  ]
}

${setCount === null ? "Devuelve tantos conjuntos como sean necesarios, respetando la cantidad de preguntas por estímulo indicada arriba." : `Devuelve exactamente ${setCount} conjuntos.`} Devuelve exactamente ${amount} ítems puntuables en total. No reduzcas cantidades.
`.trim();
}

function parseOptions(value: unknown): EnglishOption[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value.map((item) => {
    const option = item as { key?: unknown; text?: unknown };
    return {
      key: typeof option?.key === "string" ? option.key.toUpperCase() as EnglishOption["key"] : "A",
      text: typeof option?.text === "string" ? option.text : "",
    };
  });
}

function cleanJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`$/i);
  return fenced?.[1] ?? trimmed;
}

export function parseAndValidateEnglishGeneration(
  raw: string,
  part: EnglishPart,
  amount: number,
): { result: EnglishGenerationResult | null; errors: string[] } {
  const requestError = validateEnglishGenerationRequest(part, amount);
  if (requestError) return { result: null, errors: [requestError] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(raw));
  } catch {
    return { result: null, errors: ["La IA no devolvió JSON válido."] };
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { sets?: unknown }).sets)) {
    return { result: null, errors: ["La respuesta debe contener un arreglo sets."] };
  }

  const rawSets = (parsed as { sets: unknown[] }).sets;
  const expectedSets = expectedSetCount(part, amount);
  const expectedPerSet = expectedQuestionCountPerSet(part);
  const questionRange = getQuestionRangePerSet(part);
  const errors: string[] = [];
  const sets: EnglishGeneratedSet[] = [];
  let totalQuestions = 0;

  if (expectedSets !== null && rawSets.length !== expectedSets) {
    errors.push(`Se esperaban ${expectedSets} conjuntos y se recibieron ${rawSets.length}.`);
  }

  rawSets.forEach((rawSet, setIndex) => {
    if (!rawSet || typeof rawSet !== "object") {
      errors.push(`El conjunto ${setIndex + 1} no es un objeto válido.`);
      return;
    }

    const item = rawSet as {
      stimulus?: Record<string, unknown>;
      questions?: unknown;
    };

    if (!item.stimulus || typeof item.stimulus !== "object" || !Array.isArray(item.questions)) {
      errors.push(`El conjunto ${setIndex + 1} debe tener stimulus y questions.`);
      return;
    }

    if (expectedPerSet !== null && item.questions.length !== expectedPerSet) {
      errors.push(`El conjunto ${setIndex + 1} debe contener ${expectedPerSet} ítems.`);
      return;
    }

    if (
      expectedPerSet === null &&
      questionRange &&
      (item.questions.length < questionRange.min || item.questions.length > questionRange.max)
    ) {
      errors.push(
        `El conjunto ${setIndex + 1} de la Parte ${part} debe contener entre ${questionRange.min} y ${questionRange.max} ítems para mantener un estímulo completo.`,
      );
      return;
    }

    const stimulus: EnglishStimulus = {
      id: `pending-stimulus-${setIndex + 1}`,
      type: getEnglishStimulusType(part),
      content: typeof item.stimulus.content === "string" ? item.stimulus.content : "",
      options: parseOptions(item.stimulus.options_json),
      imageUrl: null,
      imageAlt: null,
      metadata: item.stimulus.metadata && typeof item.stimulus.metadata === "object"
        ? item.stimulus.metadata as Record<string, unknown>
        : {},
    };

    if (item.stimulus.stimulus_type !== stimulus.type) {
      errors.push(`El tipo de estímulo del conjunto ${setIndex + 1} no coincide con la Parte ${part}.`);
    }

    const questions: EnglishQuestionDefinition[] = item.questions.map((rawQuestion, questionIndex) => {
      const question = rawQuestion && typeof rawQuestion === "object"
        ? rawQuestion as Record<string, unknown>
        : {};
      return {
        partNumber: part,
        format: getEnglishFormat(part),
        prompt: typeof question.question === "string" ? question.question : "",
        options: parseOptions(question.options_json),
        correctAnswer: typeof question.correct_answer === "string"
          ? question.correct_answer.toUpperCase() as EnglishQuestionDefinition["correctAnswer"]
          : "A",
        stimulusId: stimulus.id,
        stimulusPosition: Number(question.stimulus_position ?? questionIndex + 1),
        difficulty: question.difficulty === "Fácil" || question.difficulty === "Media" || question.difficulty === "Difícil"
          ? question.difficulty
          : "Media",
        explanation: typeof question.explanation === "string" ? question.explanation : "",
        skill: typeof question.skill === "string" ? question.skill : "",
        questionMetadata: question.question_metadata && typeof question.question_metadata === "object"
          ? question.question_metadata as Record<string, unknown>
          : {},
      };
    });

    const validationErrors = validateEnglishQuestionSet(stimulus, questions, part);
    errors.push(...validationErrors.map((message) => `Conjunto ${setIndex + 1}: ${message}`));

    totalQuestions += questions.length;
    sets.push({ stimulus, questions });
  });

  if (totalQuestions !== amount) {
    errors.push(`Se esperaban ${amount} ítems puntuables y se recibieron ${totalQuestions}.`);
  }

  return errors.length > 0
    ? { result: null, errors: [...new Set(errors)] }
    : { result: { sets, questionCount: totalQuestions }, errors: [] };
}
