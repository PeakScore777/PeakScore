/**
 * Contrato compartido para los siete formatos de Inglés de PeakScore.
 *
 * Este archivo define tipos y validaciones puras. No modifica el modelo
 * actual de preguntas A-D ni activa por sí solo los formatos en producción.
 */

export type EnglishPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AnswerLetter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G";

export type EnglishQuestionFormat =
  | "english_matching"
  | "english_notice"
  | "english_conversation"
  | "english_grammar_cloze"
  | "english_literal_reading"
  | "english_inferential_reading"
  | "english_lexical_cloze";

export type EnglishStimulusType =
  | "word_bank"
  | "notice"
  | "conversation"
  | "reading_text"
  | "cloze_text";

export interface EnglishOption {
  key: AnswerLetter;
  text: string;
}

export interface EnglishStimulus {
  /** ID persistente del estímulo compartido por varias preguntas. */
  id: string;
  type: EnglishStimulusType;
  content: string;
  /** Banco compartido de palabras; se utiliza especialmente en la Parte 1. */
  options?: EnglishOption[];
  imageUrl?: string | null;
  imageAlt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EnglishQuestionDefinition {
  id?: string;
  partNumber: EnglishPart;
  format: EnglishQuestionFormat;
  /** Enunciado o instrucción específica de este ítem. */
  prompt: string;
  /** Se omite cuando las opciones proceden del banco compartido del estímulo. */
  options?: EnglishOption[];
  /** Letra de la opción correcta; la Parte 1 puede utilizar A-G. */
  correctAnswer: AnswerLetter;
  stimulusId: string;
  stimulusPosition: number;
  difficulty: "Fácil" | "Media" | "Difícil";
  explanation: string;
  skill: string;
  questionMetadata?: Record<string, unknown>;
}

const FORMAT_BY_PART: Record<EnglishPart, EnglishQuestionFormat> = {
  1: "english_matching",
  2: "english_notice",
  3: "english_conversation",
  4: "english_grammar_cloze",
  5: "english_literal_reading",
  6: "english_inferential_reading",
  7: "english_lexical_cloze",
};

const STIMULUS_BY_PART: Record<EnglishPart, EnglishStimulusType> = {
  1: "word_bank",
  2: "notice",
  3: "conversation",
  4: "cloze_text",
  5: "reading_text",
  6: "reading_text",
  7: "cloze_text",
};

const OPTION_COUNT_BY_PART: Record<EnglishPart, number> = {
  1: 7,
  2: 3,
  3: 3,
  4: 3,
  5: 3,
  6: 4,
  7: 4,
};

export function isEnglishPart(value: unknown): value is EnglishPart {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

export function getEnglishFormat(part: EnglishPart): EnglishQuestionFormat {
  return FORMAT_BY_PART[part];
}

export function getEnglishStimulusType(
  part: EnglishPart,
): EnglishStimulusType {
  return STIMULUS_BY_PART[part];
}

export function getEnglishOptionCount(part: EnglishPart): number {
  return OPTION_COUNT_BY_PART[part];
}

export function getEnglishOptionKeys(part: EnglishPart): AnswerLetter[] {
  return Array.from(
    { length: getEnglishOptionCount(part) },
    (_, index) => String.fromCharCode(65 + index) as AnswerLetter,
  );
}

/**
 * Valida la estructura de las opciones para una pregunta individual.
 * La Parte 1 valida su banco compartido con validateEnglishStimulus().
 */
export function validateEnglishQuestion(
  question: EnglishQuestionDefinition,
): string[] {
  const errors: string[] = [];

  if (question.format !== getEnglishFormat(question.partNumber)) {
    errors.push("El formato no corresponde al número de parte.");
  }

  if (!question.prompt.trim()) {
    errors.push("El enunciado no puede estar vacío.");
  }

  if (!question.stimulusId.trim()) {
    errors.push("La pregunta debe referenciar un estímulo.");
  }

  if (!Number.isInteger(question.stimulusPosition) || question.stimulusPosition < 1) {
    errors.push("La posición del ítem dentro del estímulo debe ser un entero positivo.");
  }

  if (!question.skill.trim()) {
    errors.push("Debe especificarse la habilidad evaluada.");
  }

  if (!question.explanation.trim()) {
    errors.push("Debe incluirse una explicación de la respuesta.");
  }

  const expectedKeys = getEnglishOptionKeys(question.partNumber);

  if (question.partNumber === 1) {
    if (question.options && question.options.length > 0) {
      errors.push(
        "La Parte 1 debe utilizar el banco de palabras compartido del estímulo.",
      );
    }
  } else {
    if (!question.options) {
      errors.push("La pregunta debe incluir sus opciones.");
    } else {
      const actualKeys = question.options.map((option) => option.key);

      if (question.options.length !== expectedKeys.length) {
        errors.push(
          `La Parte ${question.partNumber} requiere ${expectedKeys.length} opciones.`,
        );
      }

      if (new Set(actualKeys).size !== actualKeys.length) {
        errors.push("Las letras de las opciones no pueden repetirse.");
      }

      if (actualKeys.some((key, index) => key !== expectedKeys[index])) {
        errors.push(
          `Las opciones deben estar ordenadas como ${expectedKeys.join(", ")}.`,
        );
      }

      if (question.options.some((option) => !option.text.trim())) {
        errors.push("Las opciones no pueden estar vacías.");
      }
    }
  }

  if (!expectedKeys.includes(question.correctAnswer)) {
    errors.push("La respuesta correcta no pertenece a las opciones permitidas.");
  }

  return errors;
}

/**
 * Valida un conjunto completo antes de publicarlo en el banco.
 * Se valida el grupo, no solo cada pregunta individual, para evitar
 * ítems sin contexto o espacios cloze sin pregunta asociada.
 */
export function validateEnglishQuestionSet(
  stimulus: EnglishStimulus,
  questions: EnglishQuestionDefinition[],
  part: EnglishPart,
): string[] {
  const errors = validateEnglishStimulus(stimulus, part);

  if (questions.length === 0) {
    errors.push("El estímulo debe tener al menos una pregunta asociada.");
    return errors;
  }

  if (questions.some((question) => question.partNumber !== part)) {
    errors.push("Todas las preguntas del conjunto deben pertenecer a la misma parte.");
  }

  if (questions.some((question) => question.stimulusId !== stimulus.id)) {
    errors.push("Todas las preguntas deben referenciar el estímulo de este conjunto.");
  }

  for (const question of questions) {
    errors.push(...validateEnglishQuestion(question));
  }

  const positions = questions.map((question) => question.stimulusPosition);
  if (new Set(positions).size !== positions.length) {
    errors.push("Las posiciones de las preguntas dentro del estímulo no pueden repetirse.");
  }

  if (part === 1 && questions.length !== 5) {
    errors.push("La Parte 1 debe tener cinco descripciones para el banco de siete palabras.");
  }

  if (part === 2 || part === 3) {
    if (questions.length !== 1) {
      errors.push(`La Parte ${part} debe asociar un solo ítem puntuable a cada aviso o conversación.`);
    }
  }

  if (part === 4 || part === 7) {
    const markerMatches = [...stimulus.content.matchAll(/\[\[(\d+)\]\]/g)];
    const markers = markerMatches.map((match) => Number(match[1])).sort((a, b) => a - b);
    const expected = Array.from({ length: markers.length }, (_, index) => index + 1);

    if (markers.length === 0) {
      errors.push("El texto cloze debe incluir marcadores explícitos como [[1]] y [[2]].");
    }

    if (markers.some((marker, index) => marker !== expected[index])) {
      errors.push("Los marcadores cloze deben ser consecutivos desde [[1]], sin duplicados.");
    }

    if (markers.length !== questions.length) {
      errors.push("Debe existir exactamente una pregunta puntuable por cada espacio cloze.");
    }

    const questionPositions = [...positions].sort((a, b) => a - b);
    if (
      questionPositions.length !== expected.length ||
      questionPositions.some((position, index) => position !== expected[index])
    ) {
      errors.push("Las posiciones de los ítems deben coincidir con los espacios del texto cloze.");
    }
  }

  return [...new Set(errors)];
}

export function validateEnglishStimulus(
  stimulus: EnglishStimulus,
  part: EnglishPart,
): string[] {
  const errors: string[] = [];

  if (stimulus.type !== getEnglishStimulusType(part)) {
    errors.push("El tipo de estímulo no corresponde a la parte.");
  }

  if (!stimulus.content.trim()) {
    errors.push("El contenido del estímulo no puede estar vacío.");
  }

  if (part === 1) {
    const options = stimulus.options ?? [];
    const expectedKeys = getEnglishOptionKeys(1);
    const actualKeys = options.map((option) => option.key);

    if (options.length !== expectedKeys.length) {
      errors.push("El banco de palabras de la Parte 1 debe contener siete opciones.");
    }

    if (new Set(actualKeys).size !== actualKeys.length) {
      errors.push("Las letras del banco de palabras no pueden repetirse.");
    }

    if (actualKeys.some((key, index) => key !== expectedKeys[index])) {
      errors.push("El banco de palabras debe estar ordenado de A a G.");
    }

    if (options.some((option) => !option.text.trim())) {
      errors.push("Las palabras del banco no pueden estar vacías.");
    }
  }

  return errors;
}
