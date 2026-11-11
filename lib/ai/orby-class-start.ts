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
export type OrbyInitialClassIntent = "topic" | "exam" | "task";

export function buildOrbyInitialClassPrompt(value: unknown, intent: OrbyInitialClassIntent = "topic"): string {
  const topic = normalizeOrbyStudyTopic(value);
  if (!topic) return "";

  const intentGuidance = intent === "exam"
    ? "Enfoque de la sesión: preparación para Saber 11. Prioriza la competencia evaluada, las pistas del enunciado y el razonamiento que permite descartar distractores. Usa ejercicios originales contextualizados; no copies preguntas protegidas ni inventes material oficial."
    : intent === "task"
      ? "Enfoque de la sesión: acompañamiento de tarea. Guía al estudiante para resolverla por sí mismo, pide la consigna o el dato que falte, explica cada paso y comprueba comprensión. Mantén la ayuda dentro de contenidos y competencias de Saber 11; si la tarea no corresponde a ese alcance, dilo con claridad y ofrece volver a un tema ICFES relacionado."
      : "Enfoque de la sesión: aprender y comprender el tema desde sus fundamentos, con ejemplos originales y una comprobación breve de comprensión.";

  return [
    "Quiero estudiar: " + topic + ". " + intentGuidance + " Empieza inmediatamente en español colombiano natural: la primera frase debe nombrar el tema y explicar su idea central, sin saludo, presentación ni relleno. Di una frase breve y completa y continúa hablando mientras construyes la hoja; no esperes a ninguna herramienta. La interfaz ya escribe el título principal con su resaltado en el margen superior izquierdo; no lo repitas como bloque dentro de la pizarra. Mientras aparece, inicia de inmediato la explicación y construye la hoja a su lado. Después enseña el concepto con una secuencia real de profesor: pregunta guía o propósito, explicación en palabras sencillas pero rigurosas, mecanismo o razonamiento paso a paso, ejemplo original y conclusión breve. En la pizarra no transcribas el discurso: escribe solo encabezados y puntos clave cortos, bien redactados y sin errores ortográficos; organiza el contenido con aire, jerarquía y alineación, sin superponer elementos ni dejar bloques diminutos. Dibuja una ilustración principal grande, reconocible y científicamente correcta, con contornos limpios, proporciones coherentes, etiquetas legibles y flechas que expliquen relaciones reales. Para ilustraciones complejas, utiliza vector-illustration: una ilustración SVG científica detallada generada mediante shapes estructurados y validados con ID estable por forma (paths Bézier, círculos, elipses, líneas y polígonos); conserva los IDs y añade formas acumulativas, con contornos orgánicos, capas internas, sombreado suave y proporciones coherentes. Reserva sketch para escritura a mano y trazos progresivos; no conviertas una célula, órgano, tejido o mecanismo complejo en un puñado de líneas. Cuando exista una clave exacta en el banco visual curado, solicítala en lugar de improvisar anatomía. Mantén el dibujo legible y proporcionado; no uses emojis, iconos sustitutivos, garabatos, formas arbitrarias, diagramas genéricos ni símbolos decorativos para aparentar un dibujo. No escribas HTML, SVG ni código crudo: utiliza exclusivamente los visuales tipados y las acciones de pizarra admitidos por la interfaz. Si el renderer no permite representar un detalle con precisión, simplifícalo y dilo. Si no puedes representar un detalle con precisión, simplifícalo y dilo; nunca inventes estructuras o etiquetas. Construye el dibujo por etapas mientras nombras cada parte, conserva todo lo ya escrito y dibujado cuando el estudiante interrumpa y añade la respuesta a continuación. Antes de enviar cada texto, revisa tildes, concordancia, puntuación, nombres propios y terminología científica. No muestres únicamente el título ni entregues toda la clase de golpe.",
  ].join("\n");
}
