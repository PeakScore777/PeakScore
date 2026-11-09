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
    "Quiero estudiar este tema: " + topic + ".",
    "Inicia ahora una clase particular guiada para este tema, en español colombiano y al nivel de un estudiante que se prepara para Saber 11.",
    "No me preguntes qué quiero estudiar: el tema ya está definido. Comienza enseñando de inmediato con una introducción breve y clara.",
    "PRIMERA ETAPA: antes o al inicio de tu primera explicación larga, llama a render_orby_teaching_board con una primera pizarra acumulativa. El título de la pizarra debe ser el nombre claro del tema (puedes añadir el subtema entre paréntesis), y el primer bloque visible debe repetir ese título. No esperes al final de la explicación para mostrar la pizarra.",
    "Después explica oralmente qué vamos a comprender y desarrolla el primer concepto paso a paso. La voz debe comenzar sin esperar recursos opcionales ni búsquedas. Añade ilustraciones y diagramas solo cuando aporten comprensión; mantén la pizarra acumulativa y señala el elemento exacto mientras lo explicas.",
    "Haz una clase natural e interactiva: no leas instrucciones técnicas, no describas la interfaz y no anuncies que estás generando la pizarra. Termina la primera etapa con una comprobación breve de comprensión.",
  ].join("\n");
}
