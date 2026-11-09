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
    "Quiero estudiar: " + topic + ". Comienza la clase escribiendo el título del tema en la pizarra y explícame el primer concepto paso a paso. Habla mientras construyes la pizarra.",
  ].join("\n");
}
