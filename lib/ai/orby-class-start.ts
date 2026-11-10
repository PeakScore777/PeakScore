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
    "Quiero estudiar: " + topic + ". Empieza a hablar inmediatamente en español colombiano: tu primera frase debe decir el título del tema y explicar su idea central, sin saludo, presentación, relleno ni pedir otra pregunta. Di una primera frase breve y completa para que la voz pueda comenzar mientras construyes la pizarra en paralelo. Escribe ese mismo título progresivamente, letra a letra, dentro del margen superior izquierdo de una hoja blanca completa. No esperes a terminar la explicación ni a que una herramienta responda para hablar. Después desarrolla el primer concepto con explicación oral continua, ejemplos originales y una comprobación breve de comprensión; dibuja el esquema por etapas mientras nombras cada parte. No muestres únicamente el título ni entregues toda la clase de golpe.",
  ].join("\n");
}
