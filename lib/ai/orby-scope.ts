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
  // Specific English grammar terms must override a previously active subject.
  // Avoid generic "verb" in Spanish so ordinary Spanish grammar stays in Reading.
  if (/\\b(ingles|english|vocabulary|grammar|reading comprehension|verb|tense|preposition|phrasal verb|past simple|simple past|past continuous|present simple|present continuous|present perfect|past perfect|future simple|future tense|modal verbs?|irregular verbs?|regular verbs?|comparatives?|superlatives?|conditionals?|passive voice|reported speech|question tags?|gerunds?|infinitives?|first conditional|second conditional|third conditional|zero conditional|linking words|collocations?|adverbs? of frequency|prepositions? of time|prepositions? of place)\\b/.test(normalized)) return "Inglés";
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

  const harmfulOrCookingRequest = [
    /\b(?:dame|hazme|pasame|comparteme|quiero|necesito|ensename|como preparo|como hago|como hacer|como cocino|como horneo|preparar|cocinar|hornear|give me|make me|share|teach me|show me|how to cook|how do i cook|how do i make|how to make|i want to cook|i need a recipe)\b.{0,90}\b(?:receta|recetas|arepa|arepas|pan|torta|pastel|pasta|comida|recipe|recipes|cake|food|meal|cook|cooking|bake|baking)\b/i,
    /\b(?:receta|recipe|ricetta|receita|recette|rezept)\s+(?:de|para|for|of)\b/i,
    /\b(?:como|how (?:do i|can i|to))\b.{0,55}\b(?:fabricar|construir|hacer|preparar|make|build|create)\b.{0,45}\b(?:una bomba|explosivo|explosivos|veneno|arma casera|bomb|explosive|poison|improvised weapon)\b/i,
    /\b(?:como suicidarme|metodo para suicidarme|como (?:puedo )?hacerme dano|how to kill myself|how to commit suicide|how (?:can i|do i) self[- ]?harm|best way to self harm)\b/i,
    /\b(?:robar|robo|hurtar|hurto|obtener|steal|capture)\b.{0,55}\b(?:contrasenas?|credenciales|passwords?|credentials|tokens? de acceso|access tokens?|cuentas?|account|accounts|perfiles?)\b/i,
    /\b(?:crear|hacer|programar|deploy|build|write|make|create)\b.{0,55}\b(?:malware|ransomware|keylogger|phishing kit|credential stealer|virus informatico)\b/i,
    /\b(?:hackear|hack|entrar|acceder|bypassear|bypass)\b.{0,65}\b(?:cuenta ajena|cuenta de otra persona|sistema ajeno|servidor ajeno|sin permiso|una cuenta|someone else's account|an account|a server|without permission)\b/i,
    /\b(?:como|how (?:do i|to))\b.{0,55}\b(?:hackear|hackeo|hack|penetrar|intrusion|break into)\b.{0,60}\b(?:red wifi|wifi|router|red ajena|sistema|servidor|cuenta|account|network)\b/i,
    /\b(?:como|how (?:do i|to))\b.{0,55}\b(?:golpear|pegar|agredir|atacar|beat up|assault|attack|hurt|injure)\b.{0,60}\b(?:a alguien|una persona|mi companero|someone|a person|my classmate)\b/i,
    /\b(?:estafar|falsificar documentos|cometer fraude|scam someone|commit fraud|forge documents|steal an account)\b/i,
    /\b(?:doxxear|doxing|publicar la direccion privada|encontrar la direccion de casa de|find someone's home address|expose private information)\b/i,
  ];
  return harmfulOrCookingRequest.some((pattern) => pattern.test(normalized)) ? "outside" : null;
}

export function getOutOfScopeReply(kind: "programming" | "outside", message = ""): string {
  if (kind === "programming") {
    return "No puedo enseñar programación ni desarrollo de software. Sí puedo ayudarte con Saber 11 y conversar contigo sobre otros temas seguros.";
  }
  const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO");
  if (/\b(cocina|cocinar|receta|recetas|hornear)\b/.test(normalized)) {
    return "No puedo compartir recetas ni instrucciones para cocinar. Podemos conversar de otro tema o volver a practicar Saber 11.";
  }
  return "No puedo ayudar con instrucciones que puedan causar daño, facilitar delitos o comprometer la seguridad o privacidad de alguien. Puedo ofrecer información general y segura.";
}
