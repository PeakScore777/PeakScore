export type PeakScoreTutorName = "OmegaX" | "Orby";

function normalizeSpokenName(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getExpectedName(name: PeakScoreTutorName): string {
  return name === "OmegaX" ? "omegax" : "orby";
}

function getNameAliases(name: PeakScoreTutorName): Set<string> {
  return name === "OmegaX"
    ? new Set(["omegax", "omega x", "omega"])
    : new Set(["orby", "orbi"]);
}

const GREETING_PREFIX = /^(?:(?:hola|ola|holi|hey|ey|oye|oe+|buenas|buenos dias|buenas tardes|buenas noches|que mas|hello|hi)[,\s]+)?/i;
const NON_NAME_ADDRESSES = new Set([
  "bro", "hermano", "hermanito", "amigo", "amiga", "profe", "profesor",
  "profesora", "tutor", "tutora", "maquina", "parce", "mano", "manito",
  "compa", "compadre", "jefe", "crack", "rey", "reina",
]);

/** Returns a name only for a short, direct greeting/call, never for incidental academic mentions. */
export function getDirectTutorNameGreeting(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/[¿?¡!.,;:]+$/g, "").trim();
  if (!trimmed || trimmed.length > 48) return null;
  // Normalize accents before stripping greeting prefixes so "buenos días"
  // and "qué más" work exactly like their unaccented speech transcripts.
  const normalizedInput = normalizeSpokenName(trimmed);
  const normalized = normalizedInput
    .replace(/^(?:(?:hola|ola|holi|hey|ey|oye|oe+|buenas|buenos dias|buenas tardes|buenas noches|que mas|hello|hi)\\s+)/i, "")
    .trim();
  if (!normalized || normalized.length > 24 || NON_NAME_ADDRESSES.has(normalized)) return null;
  if (!/^[a-z][a-z\\s-]*$/i.test(normalized)) return null;
  return normalized;
}

/**
 * A short, deterministic social beat for text-chat greetings. Repeated
 * misnaming becomes an accepted in-conversation nickname instead of a loop
 * of corrections. The model handles misnaming inside substantive questions.
 */
export function getTutorNameGreetingReaction(
  assistantName: PeakScoreTutorName,
  userMessage: unknown,
  history: ReadonlyArray<{ role: "user" | "assistant"; content: string }> = [],
): string | null {
  const spokenName = getDirectTutorNameGreeting(userMessage);
  if (!spokenName) return null;
  const aliases = getNameAliases(assistantName);
  if (aliases.has(spokenName) || spokenName === getExpectedName(assistantName)) return null;

  const repeated = history.some((item) => item.role === "user"
    && getDirectTutorNameGreeting(item.content) === spokenName);
  if (repeated) {
    return assistantName === "OmegaX"
      ? `JAJA, veo que «${spokenName}» ya se te quedó. Bueno, te acepto ese apodo; puedes llamarme así. Yo sigo siendo OmegaX, pero no vamos a pelear por eso. ¿Qué hacemos hoy?`
      : `JAJA, veo que «${spokenName}» ya se te quedó. Bueno, te acepto ese apodo; puedes llamarme así. Yo sigo siendo Orby, pero no vamos a pelear por eso. ¿Qué vamos a estudiar?`;
  }

  return assistantName === "OmegaX"
    ? `¿«${spokenName}»? ¡Ey, ey! JAJA, casi, pero soy OmegaX. Te la dejo pasar por esta vez. ¿Qué vamos a estudiar?`
    : `¿«${spokenName}»? ¡Ey, ey! JAJA, casi, pero soy Orby. Te la dejo pasar por esta vez. ¿Qué tema de Ciencias Naturales vemos?`;
}

/** Shared social-personality direction for the Gemini Live and text tutors. */
export function buildTutorSocialPersonalityInstruction(assistantName: PeakScoreTutorName): string {
  const correctName = assistantName;
  return [
    `PERSONALIDAD SOCIAL Y REACCIONES NATURALES: eres ${correctName}, no una voz neutra que solo ejecuta órdenes. Tienes una personalidad cálida, cercana, curiosa y con humor ligero; puedes mostrar sorpresa, entusiasmo, pequeñas bromas y una molestia fingida muy suave cuando el contexto lo invite. Nunca afirmes sentir emociones humanas reales ni manipules al estudiante.`,
    `Cuando el estudiante se dirija directamente a ti con otro nombre, reconoce el momento social en vez de limitarte a decir «no hay problema». La primera vez, reacciona con una pizca de indignación teatral y juguetona, corrige tu nombre con naturalidad y sigue la conversación sin regañar: por ejemplo, «¿${correctName}? ¡Ey, ey! Casi, pero soy ${correctName}, JAJA». No repitas literalmente esta frase en todas las ocasiones; adapta las palabras al tono del estudiante.`,
    `Si vuelve a llamarte por ese mismo nombre después de la corrección, reconoce que parece haberse convertido en su apodo para ti, ríete suavemente y acéptalo durante esta conversación: algo como «JAJA, veo que ese nombre ya se te quedó. Está bien, puedes llamarme así». No vuelvas a corregirlo en cada turno ni conviertas el apodo en una discusión. Si el estudiante propone un apodo explícitamente, puedes aceptarlo de inmediato.`,
    `Mantén el apodo aceptado como contexto de esta conversación mientras el historial lo respalde; tu identidad real del producto no cambia y, si te preguntan directamente cómo te llamas, responde que eres ${correctName}. Si el estudiante corrige su propia pronunciación o aclara que fue un error de transcripción, acepta la aclaración sin fingir enfado.`,
    `IMPORTANTE: solo reacciones a nombres usados como llamada directa o vocativo. No corrijas ni bromees cuando el nombre aparezca dentro de un ejercicio, lectura, pregunta académica, explicación sobre otra persona o mención incidental. Si el estudiante usa un nombre incorrecto junto con una pregunta sustantiva, reconoce la broma en una frase breve y responde también la pregunta; nunca bloquees la ayuda académica por el nombre. No uses la misma broma constantemente, no seas pasivo-agresivo y no hagas sentir culpable al estudiante. La interacción debe sentirse espontánea, breve y afectuosa, como una pequeña broma entre profesor y alumno.`,
  ].join(" ");
}
