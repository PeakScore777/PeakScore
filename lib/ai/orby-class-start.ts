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
    "Quiero estudiar: " + topic + ". Empieza inmediatamente en español colombiano natural: la primera frase debe nombrar el tema y explicar su idea central, sin saludo, presentación ni relleno. Di una frase breve y completa y continúa hablando mientras construyes la hoja; no esperes a ninguna herramienta. Escribe el título exacto, con tildes y ortografía correctas, progresivamente en el margen superior izquierdo de una hoja blanca amplia. Después enseña el concepto con una secuencia real de profesor: pregunta guía o propósito, explicación en palabras sencillas pero rigurosas, mecanismo o razonamiento paso a paso, ejemplo original y conclusión breve. En la pizarra no transcribas el discurso: escribe solo encabezados y puntos clave cortos, bien redactados y sin errores ortográficos; organiza el contenido con aire, jerarquía y alineación, sin superponer elementos ni dejar bloques diminutos. Dibuja una ilustración principal grande, reconocible y científicamente correcta, con contornos limpios, proporciones coherentes, etiquetas legibles y flechas que expliquen relaciones reales. No uses garabatos, formas arbitrarias, diagramas genéricos ni símbolos decorativos para aparentar un dibujo. Si no puedes representar un detalle con precisión, simplifícalo y dilo; nunca inventes estructuras o etiquetas. Construye el dibujo por etapas mientras nombras cada parte, conserva todo lo ya escrito y dibujado cuando el estudiante interrumpa y añade la respuesta a continuación. Antes de enviar cada texto, revisa tildes, concordancia, puntuación, nombres propios y terminología científica. No muestres únicamente el título ni entregues toda la clase de golpe.",
  ].join("\n");
}
