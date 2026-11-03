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

function normalizeOrbyIdentityText(message: string): string {
  return message.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasFalseOrbyCreatorAttribution(message: string): boolean {
  const normalized = normalizeOrbyIdentityText(message);
  // Accept missing spaces because speech transcripts sometimes concatenate words.
  const attribution = normalized.match(/(?:cread[oa]|entrenad[oa]|desarrollad[oa]|hech[oa]|created|trained|made)\s*(?:por|by)\s*([a-z0-9][a-z0-9._-]{0,40})/i);
  if (!attribution) return false;

  const allegedCreator = attribution[1].replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "");
  return Boolean(allegedCreator) && !/^peak[-_]?score$/i.test(allegedCreator);
}

export function isOrbyIdentityQuestion(message: string): boolean {
  const normalized = normalizeOrbyIdentityText(message);
  return /\b(?:quien|qn)\b.{0,48}\b(?:te\s+)?(?:creo|crearon|hizo|hicieron|desarrollo|programo)\b/i.test(normalized)
    || /\b(?:quien|qn)\s+eres\b/i.test(normalized)
    || /\b(?:quien|qn)\s+(?:es|fue)\s+(?:tu\s+)?(?:creador|creadora|autor|autora)\b/i.test(normalized)
    || /\bwho\s+(?:created|made)\s+you\b/i.test(normalized)
    || /\bcliente\s+creo\b/i.test(normalized)
    || (/\bpeak\s*score\b/i.test(normalized)
      && /\b(?:quien(?:es)?|que\s+es|que\s+son|de\s+que\s+trata|para\s+que\s+sirve)\b/i.test(normalized))
    || hasFalseOrbyCreatorAttribution(normalized);
}
export const ORBY_IDENTITY_REPLY =
  "PeakScore es la plataforma educativa creada para apoyar a estudiantes en su preparación para las pruebas Saber 11. Yo soy Orby, su asistente educativo, y te acompaño con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.";

export function classifyOutOfScopeRequest(message: string): "programming" | "outside" | null {
  const normalized = message.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const explicitProgrammingRequest = [
    /\b(?:ensename|quiero aprender|quiero programar|ayudame a|explicame como|como puedo|how do i|how to|teach me|help me|learn to)\b.{0,90}\b(?:programar|programacion|codificar|coding|programming|python|javascript|typescript|java|c\+\+|c#|html|css|react|node\.js|sql|crear una app|hacer una pagina web|code)\b/i,
    /\b(?:crear|hacer|construir|desarrollar|build|create|make|develop)\s+(?:un|una|el|la|a|an|the)?\s*(?:sitio|pagina|web|app|aplicacion|software|programa|website|application|mobile app|bot)\b/i,
    /\b(?:como|how)\b.{0,55}\b(?:creo|crear|hago|hacer|construyo|construir|desarrollo|desarrollar|build|create|make|develop)\b.{0,45}\b(?:sitio|pagina|web|app|aplicacion|software|bot|website|application|programa)\b/i,
  ];
  if (explicitProgrammingRequest.some((pattern) => pattern.test(normalized))) return "programming";

  const explicitOutsideRequest = [
    /^(?:receta|cocina|cocinar|pelicula|peliculas|carro|carros|vehiculo|vehiculos|clima|chiste|chistes)[.!? ]*$/i,
    /\b(?:dame|hazme|quiero|necesito|comparte|ensename|como preparo|como cocino|give me|teach me|how to cook|voglio una ricetta|quero uma receita|je veux une recette)\b.{0,80}\b(?:receta|recetas|arepa|pan|pasta|recipe|cake|food|cook|cooking|ricetta|receita|recette|rezept)\b/i,
    /\b(?:recomiendame|que pelicula me recomiendas|what movie should i watch|which movie should i watch|which car should i buy|what car should i buy|what should i eat|how is the weather|what is the weather|que hago si tengo fiebre|que medicamento)\b/i,
  ];
  return explicitOutsideRequest.some((pattern) => pattern.test(normalized)) ? "outside" : null;
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
