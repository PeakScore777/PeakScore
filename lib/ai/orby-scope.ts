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
  /\b(programar|programacion|programador|programadora|codigo fuente|escribir codigo|codificar|depurar codigo|debuggear|debugging|coding|programming)\b/i,
  /\b(python|javascript|typescript|java|c\+\+|c#|html|css|react|nextjs|node\.js|sql|postgresql|supabase|api rest|git|github|terminal|bash|powershell|framework|libreria de software)\b/i,
  /\b(crear|hacer|construir|desarrollar|diseñar)\s+(?:un|una|el|la)?\s*(?:sitio|pagina|página|web|app|aplicación|software|programa|videojuego|juego digital|bot|robot virtual)\b/i,
  /\b(ens[eé]ñame|enseñame|quiero aprender|ay[uú]dame a|expl[ií]came c[oó]mo)\b.{0,70}\b(crear|hacer|construir|desarrollar|programa|videojuego|pagina web|aplicaci[oó]n|app|bot|c[oó]digo)\b/i,
  /\b(variable|bucle|funci[oó]n en python|if\s*\(|for\s*\(|while\s*\(|algoritmo inform[aá]tico|base de datos|consulta sql)\b/i,
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
    || /\bwho\s+(?:created|made)\s+you\b/i.test(normalized)
    || (/\bpeak\s*score\b/i.test(normalized)
      && /\b(?:quien(?:es)?|que\s+es|que\s+son|de\s+que\s+trata|para\s+que\s+sirve)\b/i.test(normalized))    || (/\bpeak\s*score\b/i.test(normalized)
      && /\b(?:quien(?:es)?|que\s+es|que\s+son|de\s+que\s+trata|para\s+que\s+sirve)\b/i.test(normalized))
    // Correct false claims about Orby's creator, not only direct questions.
    || /\b(?:asistente|tutor|modelo|herramienta|chatbot|inteligencia artificial|ia)\b.{0,100}\bcread[oa]\s+por\s+[a-z0-9][a-z0-9._-]*/i.test(normalized)
    || /\b(?:eres|fuiste|estas)\b.{0,80}\bcread[oa]\s+por\s+[a-z0-9][a-z0-9._-]*/i.test(normalized)
    || /\b(?:te|lo)\s+(?:creo|hizo|desarrollo|entreno)\s+[a-z0-9][a-z0-9._-]*/i.test(normalized);
}

export const ORBY_IDENTITY_REPLY =
  "PeakScore es la plataforma educativa creada para apoyar a estudiantes en su preparación para las pruebas Saber 11. Yo soy Orby, su asistente educativo, y te acompaño con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.";

export function classifyOutOfScopeRequest(message: string): "programming" | "outside" | null {
  const normalized = message.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (PROGRAMMING_PATTERNS.some((pattern) => pattern.test(normalized))) return "programming";
  if (OUTSIDE_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))) return "outside";
  return null;
}

export function getOutOfScopeReply(kind: "programming" | "outside", message = ""): string {
  if (kind === "programming") {
    return "Soy Orby, el asistente educativo de PeakScore, especializado exclusivamente en la preparación para Saber 11. No enseño programación, desarrollo de software ni lenguajes de código. Sí puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés.";
  }
  const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO");
  if (/\b(cocina|cocinar|receta|recetas|hornear)\b/.test(normalized)) {
    return "No puedo enseñar cocina ni compartir recetas porque mi función es acompañarte en la preparación para Saber 11. Sí puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés.";
  }
  return "Esa solicitud está fuera del alcance educativo de Orby. Estoy especializado en la preparación para Saber 11 y puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés.";
}
