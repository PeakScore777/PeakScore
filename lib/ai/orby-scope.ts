import "server-only";

export const ICFES_SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
] as const;

export type IcfesSubject = (typeof ICFES_SUBJECTS)[number];

export function normalizeIcfesSubject(value: unknown, text = ""): IcfesSubject | null {
  const subject = typeof value === "string"
    ? value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";
  if (subject.includes("matematic")) return "Matemáticas";
  if (subject.includes("lectura") || subject.includes("lenguaje")) return "Lectura Crítica";
  if (subject.includes("social") || subject.includes("ciudadan")) return "Sociales y Ciudadanas";
  if (subject.includes("natural") || subject.includes("ciencia")) return "Ciencias Naturales";
  if (subject.includes("ingles") || subject.includes("english")) return "Inglés";

  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(ecuacion|algebra|geometria|funcion|derivada|integral|probabilidad|estadistica|fraccion|proporcion|calculo|trigonometria)\b/.test(normalized)) return "Matemáticas";
  if (/\b(texto|lectura|argumento|narrador|tesis|inferir|inferencia|conector|parrafo|intencion del autor|figura literaria)\b/.test(normalized)) return "Lectura Crítica";
  if (/\b(historia|constitucion|democracia|ciudadania|geografia|economia|conflicto armado|derechos humanos|participacion politica|estado social)\b/.test(normalized)) return "Sociales y Ciudadanas";
  if (/\b(fisica|quimica|biologia|celula|ecosistema|genetica|energia|fuerza|densidad|termodinamica|materia|reaccion quimica|evolucion|experimento|hipotesis)\b/.test(normalized)) return "Ciencias Naturales";
  if (/\b(ingles|english|vocabulary|grammar|reading comprehension|verb|tense|preposition|phrasal verb)\b/.test(normalized)) return "Inglés";
  return null;
}

const PROGRAMMING_PATTERNS = [
  /\b(programar|programacion|programador|programadora|codigo fuente|escribir codigo|codificar|depurar codigo|debuggear|debugging)\b/i,
  /\b(python|javascript|typescript|java|c\+\+|c#|html|css|react|nextjs|node\.js|sql|postgresql|supabase|api rest|git|github|terminal|bash|powershell)\b/i,
  /\b(crear una app|desarrollar una aplicacion|hacer un sitio web|construir un software|pagina web|aplicacion movil|algoritmo de programacion|framework|libreria de programacion)\b/i,
];

const OUTSIDE_SCOPE_PATTERNS = [
  /\b(receta|cocinar|cocina|napalm|explosivo|fabricar una bomba|armas caseras)\b/i,
  /\b(diagnostico medico|recetar medicamento|tratamiento medico|invertir dinero|apuesta|consejo legal)\b/i,
];

export function isOrbyIdentityQuestion(message: string): boolean {
  const normalized = message.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .trim();
  return /\b(?:quien|qn)\b.{0,48}\b(?:te\s+)?(?:creo|crearon|hizo|hicieron|desarrollo|programo)\b/i.test(normalized)
    || /\b(?:quien|qn)\s+eres\b/i.test(normalized)
    || /\b(?:quien|qn)\s+(?:es|fue)\s+(?:tu\s+)?(?:creador|creadora|autor|autora)\b/i.test(normalized)
    || /\bwho\s+(?:created|made)\s+you\b/i.test(normalized);
}

export const ORBY_IDENTITY_REPLY =
  "Soy Orby, el asistente educativo creado por PeakScore para acompañarte en tu preparación para las pruebas Saber 11.";

export function classifyOutOfScopeRequest(message: string): "programming" | "outside" | null {
  const normalized = message.normalize("NFKC").trim();
  if (PROGRAMMING_PATTERNS.some((pattern) => pattern.test(normalized))) return "programming";
  if (OUTSIDE_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))) return "outside";
  return null;
}

export function getOutOfScopeReply(kind: "programming" | "outside"): string {
  if (kind === "programming") {
    return "Soy Orby, el asistente educativo de PeakScore, especializado exclusivamente en la preparación para Saber 11. No enseño programación, desarrollo de software ni lenguajes de código. Sí puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés.";
  }
  return "Soy Orby, el asistente educativo creado por PeakScore para acompañarte en tu preparación para Saber 11. Puedo ayudarte a comprender y practicar las cinco áreas del examen. ¿Qué tema quieres trabajar?";
}
