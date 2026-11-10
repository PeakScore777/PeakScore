const MAX_STUDY_TOPIC_LENGTH = 160;

/** Normalize a student-entered class topic before it becomes session context. */
export function normalizeOrbyStudyTopic(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_STUDY_TOPIC_LENGTH)
    .trim();
}

/**
 * The first Live turn is explicit so a new session starts like a guided lesson:
 * title on the board, first useful visual update, then spoken explanation.
 */
export function buildOrbyInitialClassPrompt(value: unknown): string {
  const topic = normalizeOrbyStudyTopic(value);
  if (!topic) return "";

  return [
    "Quiero estudiar: " + topic + ". Inicia la clase hablándome de inmediato, sin esperar a que yo haga otra pregunta. Salúdame brevemente, anuncia qué voy a aprender y empieza a explicar el primer concepto con voz natural en español colombiano. Al mismo tiempo, escribe el título progresivamente en la pizarra y dibuja el primer esquema educativo paso a paso. No te limites a mostrar el título: desarrolla la explicación oral y visual desde el primer turno, con ejemplos claros y una comprobación breve de comprensión.",
  ].join("\n");
}
