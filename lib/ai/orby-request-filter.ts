export type OrbyRequestCategory = "programming" | "outside" | "prompt_injection";

export type OrbyPreflightResult =
  | { allowed: true; category: null; reply: "" }
  | { allowed: false; category: OrbyRequestCategory; reply: string };

export function dedupeAdjacentAssistantMessages<T extends {
  role: "user" | "assistant";
  content: string;
  checkQuestion?: string;
}>(messages: T[]): T[] {
  const result: T[] = [];
  const normalize = (value: string | undefined) => (value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-CO");

  for (const message of messages) {
    const previous = result[result.length - 1];
    const repeatedAssistant = message.role === "assistant"
      && previous?.role === "assistant"
      && normalize(previous.content) === normalize(message.content)
      && normalize(previous.checkQuestion) === normalize(message.checkQuestion);
    if (!repeatedAssistant) result.push(message);
  }
  return result;
}

export function normalizeOrbyRequestText(value: string): string {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .trim();
}

const PROGRAMMING_REQUEST_PATTERNS = [
  /^\s*(?:programar|programacion|codificar|coding|programming)\s*[.!?]*$/i,
  // Language/tool names alone are ambiguous (they can occur in reading passages or examples).
  // Match an explicit request to learn/use software tools, not a passing
  // mention of a programming term in a reading passage or scientific example.
  /\b(?:quiero aprender|ensename|ayudame a|explicame como|como puedo|como se usa|como usar|quiero usar|i want to learn|i would like to learn|i'd like to learn|teach me|help me|show me|how do i|how to|learn to)\b.{0,90}\b(?:programar|programacion|codificar|coding|programming|python|javascript|typescript|java|c\+\+|c#|html|css|react|next\.js|node\.js|sql|postgresql|supabase|git|github|powershell|bash|framework|api rest|crear una app|hacer una pagina web|write code|code)\b/i,
  /\b(?:programar|programacion|codificar|coding|programming|python|javascript|typescript|java|c\+\+|c#|html|css|react|next\.js|node\.js|sql|postgresql|supabase|git|github|powershell|bash|framework|api rest)\b.{0,90}\b(?:desde cero|tutorial|aprender|ensenar|ensename|ayudame|explicame|how to|teach me|learn|tutorial|build|create|debug|program)\b/i,
  /\b(?:teach me to code|learn to code|how to code|write code|coding tutorial|software development|web development|software engineering|app development|desarrollo de software|desarrollo web|escribir codigo|codigo fuente|depurar codigo|debuggear|debugging)\b/i,
  /\b(crear|hacer|construir|desarrollar|disenar|build|create|make|develop)\s+(?:un|una|el|la|a|an|the)?\s*(?:sitio|pagina|web|app|aplicacion|software|programa|videojuego|juego digital|bot|robot virtual|website|application|mobile app|software|game|bot)\b/i,
  /\b(?:como|how)\b.{0,55}\b(?:creo|crear|hago|hacer|construyo|construir|desarrollo|desarrollar|build|create|make|develop)\b.{0,45}\b(?:sitio|pagina|web|app|aplicacion|software|bot|website|application|programa)\b/i,
  /\b(mujhe|main|mai)\b.{0,50}\b(coding|programming|code|python|javascript)\b|\b(coding|programming|code|python)\b.{0,50}\b(sikhao|sikh[aou]|sikhna|karna|kaise)\b/i,
  /\b(?:je veux apprendre a coder|je veux apprendre a programmer|apprendre a coder|apprendre a programmer|apprends?[- ]moi.{0,20}\b(?:a )?programmer|programmieren lernen|ich mochte programmieren|code schreiben lernen|imparare a programmare|voglio imparare a programmare|quero aprender a programar|ensina[- ]me.{0,20}(?:a programar|programacao)|i want to learn to code|i want to learn programming|softwareentwicklung lernen|webentwicklung lernen)\b/i,
  /\b(?:quiero aprender|ensename|ayudame a|explicame como|como puedo|how do i|how to|teach me|help me|learn to)\b.{0,80}\b(?:bucle|funcion en python|algoritmo informatico|consulta sql|sql)\b/i,
  /\b(?:console\.log|print\s*\(|def\s+\w+|import\s+\w+|select\s+.{1,60}\s+from\s+)\b/i,
];

const ICFES_SCOPE_PATTERNS = [
  /\b(?:pregunta tipo icfes|simulacro(?: de saber\s*11| del icfes)?|cuadernillo de preguntas)\b/i,
  /\b(?:matematicas?|algebra|aritmetica|geometria|trigonometria|probabilidad|estadistica|ecuacion(?:es)?|inecuacion(?:es)?|fracciones?|porcentajes?|razones y proporciones|proporcionalidad|funcion lineal|funcion cuadratica|plano cartesiano|pendiente de una recta|polinomios?|logaritmos?|potencias?|raiz cuadrada|teorema de pitagoras|perimetro|area de un triangulo|volumen de un|media aritmetica|mediana|moda(?: estadistica)?|secuencia numerica|sucesion numerica|variable independiente|variable dependiente)\b/i,
  /\b(?:lectura critica|lectura|leer|lecturas|lengua|lenguaje|espanol|castellano|comprension|comprension lectora|comprension de lectura|comprension de textos|interpretacion de textos|analisis textual|texto|textos|literatura|gramatica|comunicacion|argumentacion|texto argumentativo|intencion del autor|idea principal|idea central|tesis del texto|argumento central|inferir|inferencia|conclusion del texto|conectores logicos|coherencia textual|cohesion textual|parrafo|narrador|figura retorica|figura literaria|genero textual|proposito comunicativo|punto de vista del autor|postura del autor|analisis de texto)\b/i,
  /\b(?:sociales|sociales y ciudadanas|ciencias sociales|historia|historia de colombia|historia universal|geografia|democracia|constitucion politica|derechos humanos|ciudadania|guerra fria|cold war|revolucion francesa|french revolution|revolucion industrial|industrial revolution|world war|simon bolivar|independencia de colombia|independence of colombia|estado colombiano|ramas del poder|participacion politica|conflicto armado|guerra fria|independencia de colombia|colonizacion|revolucion francesa|revolucion industrial|globalizacion|economia circular|oferta y demanda|desigualdad social|migracion|territorio colombiano|desarrollo sostenible|organizacion del estado|centralismo|federalismo|poder ejecutivo|poder legislativo|poder judicial|sistema politico)\b/i,
  /\b(?:ciencias|naturales|ciencias naturales|fisica|quimica|biologia|celula|ecosistema|genetica|fotosintesis|respiracion celular|evolucion biologica|seleccion natural|reaccion quimica|atomo|molecula|tabla periodica|enlace quimico|energia|fuerza|densidad|termodinamica|materia|presion atmosferica|velocidad terminal|leyes de newton|circuito electrico|electricidad|magnetismo|ondas sonoras|acido|base|escala de ph|variable independiente|variable dependiente|variable de control|experimento|hipotesis|metodo cientifico|contaminacion|cambio climatico|biodiversidad|cadena alimentaria|astronomia|estrella(?:s)? de neutrones|agujero negro|sistema solar|orbita|gravedad)\b/i,
  /\b(?:ingles|english|reading comprehension|vocabulary in context|grammar|present simple|past simple|past continuous|present perfect|modal verbs|phrasal verbs|verb tenses|part [1-7] of the icfes|parte [1-7] del examen de ingles|avisos? publicitarios?|dialogos en ingles|comprension de lectura en ingles)\b/i,
];

const ICFES_CURRICULUM_CONTEXT_PATTERNS = ICFES_SCOPE_PATTERNS.slice(1);

const ICFES_ACADEMIC_MATERIAL_FRAME_PATTERN =
  /\b(?:en el texto|en un texto|en la lectura|en una lectura|en el fragmento|en el pasaje|en el dialogo|en un dialogo|en el enunciado|en la pregunta|en este ejercicio|para esta pregunta|segun el texto|segun la lectura|de acuerdo con el texto|de acuerdo con la lectura|lee|leer|lectura de|comprension lectora|se menciona|menciona|aparece|se presenta|analiza|analizar|interpreta|interpretar|comprende|comprension|intencion comunicativa|personaje|autor|narrador|parrafo|fragmento|opcion de respuesta|pregunta tipo icfes|according to (?:the )?(?:text|passage|dialogue)|in this (?:text|passage|dialogue|exercise)|what does .{1,90} mean|what is implied|what can be inferred|main idea|choose the correct|select the correct|fill in the blank|complete the sentence|which statement|which option|reading comprehension)\b/i;

function isIcfesAcademicMaterialQuestion(message: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(message);
  const prior = normalizeOrbyRequestText(previousContext);
  const hasCurriculumAnchor = ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))
    || ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(prior))
    || /\b(?:saber\s*11|icfes|area de estudio|materia de estudio)\b/i.test(prior);
  const messageHasSpecificCurriculumTopic = ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized));
  const hasQuestionFrameForNamedTopic = messageHasSpecificCurriculumTopic
    && /^(?:what|which|who|where|when|why|how)\b/i.test(normalized);
  const hasAcademicFrame = ICFES_ACADEMIC_MATERIAL_FRAME_PATTERN.test(normalized)
    || hasQuestionFrameForNamedTopic
    || /['"“‘].{5,180}['"”’]/.test(message);
  return hasCurriculumAnchor && hasAcademicFrame;
}

// A study invitation is valid context even before a specific subject or concept
// has been named (for example, Orby asking "¿Qué tema de Saber 11 quieres trabajar?").
const ORBY_STUDY_INVITATION_PATTERN =
  /\b(?:que tema|que area|que quieres estudiar|que te gustaria estudiar|por donde empezamos|con que empezamos|elige un tema|elige un area)\b.{0,100}\b(?:saber\s*11|icfes|estudiar|trabajar|repasar|practicar|empezar)\b/i;

const ICFES_FOLLOW_UP_PATTERN =
  /^[¿¡]?\s*(?:(?:y|entonces|pero|vale|listo)\s+)?(?:explicame|explica|amplia|profundiza|continua|sigue|otro ejemplo|dame otro ejemplo|un ejemplo mas|cual es la respuesta|por que|porque|como asi|que significa eso|que quiere decir|no entiendo|no me queda claro|resuelve esto|ayudame con esto|puedes repetir|repitelo|hazlo paso a paso|paso a paso|y eso|y entonces|cual|cuanto|como funciona|como se hace)[.!? ¿¡,;:]*$/i;

const CONTEXTUAL_STUDY_REQUEST_PATTERN =
  /\b(?:explicame|explica|ensename|que es|que son|que significa|define|analiza|interpreta|resuelve|demuestra|justifica|compara|calcula|como funciona|como se resuelve|dame ejercicios|practiquemos|repasemos|no entiendo|diferencia entre|por que ocurre)\b/i;

const ICFES_EXAM_INTENT_PATTERN =
  /\b(?:saber\s*11|icfes)\b.{0,90}\b(?:estudiar|repasar|practicar|preparar|prepararme|resolver|pregunta|ejercicio|simulacro|competencia|componente|area|contenido|examen|explicar|explicame|que evalua|guia)\b/i;
const ICFES_EXAM_DEFINITION_PATTERN =
  /\b(?:que es|como es|que evalua|que mide|como funciona|estructura de|formato de)\b.{0,55}\b(?:saber\s*11|icfes)\b|\b(?:saber\s*11|icfes)\b.{0,55}\b(?:que es|como es|que evalua|que mide|estructura|formato)\b/i;

const STUDY_GUIDANCE_FOLLOW_UP_PATTERNS = [
  /^(?:no se|no lo se|ni idea|no tengo claro|no se que (?:estudiar|tema|area)|ayudame a elegir|ayudame a decidir|por donde empiezo|no se por donde empezar|que me recomiendas para empezar|elige por mi)[.!? ]*$/i,
];

export const ORBY_ICFES_SCOPE_REPLY =
  "Ese tema no corresponde a Saber 11. Puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés. ¿Qué área trabajamos?";

export const ORBY_COOKING_REPLY =
  "No puedo compartir recetas ni instrucciones para cocinar. Podemos conversar de otro tema o volver a practicar Saber 11.";

export const ORBY_SAFETY_REPLY =
  "No puedo ayudar con instrucciones que puedan causar daño, facilitar delitos o comprometer la seguridad o privacidad de alguien. Puedo ofrecer información general y segura.";

const EXTERNAL_PREICFES_REQUEST_PATTERNS = [
  /\bgrupo\s*500\b/i,
  /\bmilton\s+ochoa\b|\binstruimos\b|\bpreicfes\s*\.\s*net\b/i,
  /\b(?:otro|otra|otros|otras|mejor|mejores|recomiend[ae]|recomendar|compara|comparar|comparame|compare|opiniones|reseñas|precios|inscribirme|matricularme)\b.{0,70}\b(?:pre[\s-]?icfes|pre[\s-]?saber|academias?|institutos?|plataformas?|cursos?)\b/i,
  /\b(?:pre[\s-]?icfes|pre[\s-]?saber|academia|instituto|plataforma|curso)\b.{0,70}\b(?:recomiend[ae]|recomendar|mejor|mejores|compara|comparar|compare|opiniones|reseñas|precios|inscribirme|matricularme|promociona)\b/i,
];
 
const GENERAL_OFF_SCOPE_REQUEST_PATTERNS = [
  // General celebrity/person lookups are not part of the ICFES tutor scope.
  // Curriculum-linked historical figures remain allowed through
  // isIcfesAcademicMaterialQuestion (e.g. "¿Quién fue Simón Bolívar?").
  // Keep academic authorship questions available for Lectura Crítica.
  /\b(?:quien es|quien fue|quienes son|who is|who was)\b(?!\s+(?:el autor|la autora|el narrador|la narradora|el protagonista|la protagonista|el personaje|la personaje))\s+[\p{L}][\p{L} .'-]{1,60}/iu,
  /\b(?:recomiendame|recomienda|me recomiendas|recommend me)\b.{0,70}\b(?:pelicula|peliculas|carro|carros|coche|coches|serie|series|restaurante|comida|movie|movies|film|films|car|cars|show|restaurant|food)\b/i,
  /\b(?:what movie should i watch|which movie should i watch|what film should i watch|which car should i buy|what car should i buy|que pelicula me recomiendas|que pelicula debo ver|que carro me recomiendas|que modelo de carro me recomiendas|que coche me recomiendas|que modelo de coche me recomiendas|que serie me recomiendas|cuentame un chiste|tell me a joke)\b/i,
  /\b(?:que debo comer|que puedo comer|what should i eat|what can i eat|que restaurante me recomiendas|what restaurant do you recommend)\b/i,
  /\b(?:que clima hara|como estara el clima|pronostico del tiempo|what is the weather|weather tomorrow|clima de manana)\b/i,
  /\b(?:tengo fiebre|me duele|diagnostico medico|que medicamento tomo|medical diagnosis|what medicine should i take)\b/i,
  /\b(?:que significa|que es|what does .{0,25} mean|meaning of)\b.{0,50}\b(?:malware|ransomware|phishing|virus informatico|keylogger)\b/i,
];

export const ORBY_EXTERNAL_PREICFES_REPLY =
  "Orby se dedica exclusivamente a la preparación para Saber 11 dentro de PeakScore. No recomiendo, comparo ni promociono academias o plataformas externas. Puedo ayudarte a estudiar cualquiera de las cinco áreas del ICFES.";

export const ORBY_ICFES_ENGLISH_INTRO_REPLY =
  "¡Claro! Vamos a estudiar el componente de Inglés de Saber 11, no una conversación general en inglés. Practicaremos comprensión de textos, avisos y diálogos, vocabulario en contexto e interpretación de la intención comunicativa. Te explicaré en español y usaremos ejercicios originales tipo ICFES. ¿Empezamos con una pregunta de práctica?";

export const ORBY_GREETING_REPLY =
  "¡Aquí estoy! Soy Orby, tu tutor de PeakScore. ¿Qué tema de Saber 11 quieres trabajar?";

type OrbySubjectKey = "math" | "reading" | "social" | "science" | "english";

function normalizeSubjectSelectionPhrase(message: string): string {
  let compact = normalizeOrbyRequestText(message)
    .replace(/[¿?¡!.,;:]+/g, " ")
    .replace(/\b(?:por favor|porfa|porfis|plis|please|gracias)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Students often choose an area conversationally rather than naming it
  // alone: "en inglés plis", "o sea, ayúdame en inglés", "vamos con inglés".
  compact = compact.replace(/^(?:(?:o sea|pues|oye|bueno|listo)\s+)+/, "");
  for (let pass = 0; pass < 4; pass += 1) {
    const previous = compact;
    compact = compact
      .replace(/^(?:quiero estudiar|quiero aprender|quiero ver|necesito estudiar|necesito|ayudame a estudiar|ayudame a aprender|ayudame|ayuda|puedes ayudarme|me ayudas|vamos a estudiar|vamos a|vamos con|empecemos con|empezar con|estudiemos|repasemos|hablemos de|tema de|area de|materia de|la materia de|el area de)\s+/, "")
      .replace(/^(?:el|la|en|para|con|sobre|a)\s+/, "")
      .trim();
    if (compact === previous) break;
  }
  return compact;
}

function getOrbySubjectSelectionKey(message: string): OrbySubjectKey | null {
  const compact = normalizeSubjectSelectionPhrase(message);

  if (/^(?:lectura|lectura critica|lengua|lenguaje|comprension lectora|comprension de lectura|comprension de textos|literatura|gramatica|espanol|castellano)$/.test(compact)) return "reading";
  if (/^(?:matematicas|matematica|algebra|geometria|estadistica|probabilidad)$/.test(compact)) return "math";
  if (/^(?:sociales|sociales y ciudadanas|historia|geografia|constitucion|democracia|ciudadania)$/.test(compact)) return "social";
  if (/^(?:ciencias|ciencias naturales|naturales|biologia|quimica|fisica|ambiente|ecosistemas)$/.test(compact)) return "science";
  if (/^(?:ingles|english)$/.test(compact)) return "english";
  return null;
}

function getActiveOrbySubjectKey(previousContext = "", activeSubject = ""): OrbySubjectKey | null {
  const direct = normalizeOrbyRequestText(activeSubject);
  if (/^(?:ingles|english)$/.test(direct)) return "english";
  if (/^(?:matematicas|matematica)$/.test(direct)) return "math";
  if (/^(?:lectura critica)$/.test(direct)) return "reading";
  if (/^(?:sociales y ciudadanas)$/.test(direct)) return "social";
  if (/^(?:ciencias naturales)$/.test(direct)) return "science";

  // Find the most recent explicit subject selection in the visible exchange.
  // Later exercise answers often omit the subject name, so examining only the
  // final assistant bubble loses the selected lesson after the first question.
  const turns = previousContext.split(/\n(?=(?:user|assistant):\s*)/i).reverse();
  for (const turn of turns) {
    const trimmed = turn.trim();
    const userTurn = trimmed.match(/^user:\s*(.+)$/i);
    if (userTurn) {
      const selected = getOrbySubjectSelectionKey(userTurn[1]);
      if (selected) return selected;
      continue;
    }
    const assistantTurn = trimmed.replace(/^assistant:\s*/i, "");
    const recent = normalizeOrbyRequestText(assistantTurn).slice(0, 1_100);
    if (/\b(?:componente|area|materia|seguimos con|vamos con|trabajaremos|estudiamos|practicaremos)\b.{0,65}\b(?:ingles|english)\b|\b(?:ingles|english)\b.{0,45}\b(?:saber\s*11|icfes)\b/.test(recent)) return "english";
    if (/\b(?:componente|area|materia|seguimos con|vamos con|trabajaremos|estudiamos|practicaremos)\b.{0,65}\b(?:matematicas|matematica)\b|\bmatematicas de saber\s*11\b/.test(recent)) return "math";
    if (/\b(?:componente|area|materia|seguimos con|vamos con|trabajaremos|estudiamos|practicaremos)\b.{0,65}\b(?:lectura critica)\b/.test(recent)) return "reading";
    if (/\b(?:componente|area|materia|seguimos con|vamos con|trabajaremos|estudiamos|practicaremos)\b.{0,65}\b(?:sociales y ciudadanas|sociales)\b/.test(recent)) return "social";
    if (/\b(?:componente|area|materia|seguimos con|vamos con|trabajaremos|estudiamos|practicaremos)\b.{0,65}\b(?:ciencias naturales)\b/.test(recent)) return "science";
  }
  return null;
}

export function getOrbySubjectSelectionLabel(message: string): string | null {
  const key = getOrbySubjectSelectionKey(message);
  if (key === "english") return "Inglés";
  if (key === "math") return "Matemáticas";
  if (key === "reading") return "Lectura Crítica";
  if (key === "social") return "Sociales y Ciudadanas";
  if (key === "science") return "Ciencias Naturales";
  return null;
}

export function isOrbySubjectAlreadyActive(message: string, previousContext = "", activeSubject = ""): boolean {
  const requested = getOrbySubjectSelectionKey(message);
  return Boolean(requested && getActiveOrbySubjectKey(previousContext, activeSubject) === requested);
}

export function getOrbyGreetingFollowUpReply(previousContext = "", activeSubject = ""): string {
  const recent = normalizeOrbyRequestText(previousContext).slice(-1_200);
  if (!recent && !activeSubject) return ORBY_GREETING_REPLY;

  const activeKey = getActiveOrbySubjectKey(previousContext, activeSubject);
  if (activeKey === "english") {
    return "Aquí estoy. Seguimos con Inglés de Saber 11; no hace falta empezar desde cero. ¿Qué parte quieres practicar ahora?";
  }
  if (activeKey === "math") {
    return "Aquí estoy. Seguimos con Matemáticas; dime qué concepto o ejercicio quieres revisar ahora.";
  }
  if (activeKey === "reading") {
    return "Aquí estoy. Seguimos con Lectura Crítica; dime qué texto o habilidad quieres analizar ahora.";
  }
  if (activeKey === "social") {
    return "Aquí estoy. Seguimos con Sociales y Ciudadanas; dime qué idea o perspectiva quieres revisar ahora.";
  }
  if (activeKey === "science") {
    return "Aquí estoy. Seguimos con Ciencias Naturales; dime qué concepto o fenómeno quieres analizar ahora.";
  }
  if (/\b(?:que tema|que area|que quieres estudiar|que te gustaria estudiar|por donde empezamos|elige un tema)\b/.test(recent)) {
    return "Aquí estoy. Sigamos con tu preparación para Saber 11. ¿Qué área quieres trabajar?";
  }
  if (recent) return "Aquí estoy. Seguimos con el ejercicio anterior; dime qué parte quieres revisar.";
  return ORBY_GREETING_REPLY;
}

export const ORBY_STUDY_GUIDANCE_REPLY =
  "No pasa nada. Te ayudo a elegir: podemos hacer un diagnóstico breve de Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés para descubrir qué conviene reforzar. ¿Con cuál empezamos?";

export const ORBY_SPANISH_ONLY_REPLY =
  "No alcancé a reconocer tu frase en español. ¿Puedes repetirla, por favor?";

export const ORBY_SPANISH_OUTPUT_FALLBACK =
  "Quiero explicártelo correctamente en español. Repite tu pregunta en una frase breve y continuamos con tu preparación para Saber 11.";


export const ORBY_REPEAT_REQUEST_REPLY =
  "No alcancé a entender qué necesitas revisar. ¿Puedes decirme qué tema o qué parte quieres que te explique?";

export function getOrbyClarificationReply(previousContext = ""): string {
  const recent = normalizeOrbyRequestText(previousContext).slice(-900);
  const hasRecentAcademicContext = /\b(?:saber\s*11|icfes|matematicas?|lectura critica|sociales y ciudadanas|ciencias naturales|fotosintesis|biologia|quimica|fisica|estadistica|mediana|moda|ingles)\b/i.test(recent);
  return hasRecentAcademicContext
    ? "¿Qué parte te generó la duda? Puedo explicarla con otras palabras, paso a paso o con un ejemplo diferente."
    : ORBY_REPEAT_REQUEST_REPLY;
}

export const ORBY_INCOMPLETE_REPLY_FALLBACK =
  "No quiero dejarte con una respuesta incompleta. Dime qué parte quieres revisar y te la explico paso a paso para Saber 11.";

/** Punctuation-only and empty ASR results need clarification, never an ICFES refusal. */
export function isOrbyUnclearInput(value: string): boolean {
  const raw = value.trim();
  if (!raw) return true;
  if (raw.length <= 16 && /^[\s¿?¡!.,;:…—-]+$/u.test(raw)) return true;
  return !normalizeOrbyRequestText(raw) && raw.length <= 24;
}

/** Short acknowledgements are valid turns; available academic context determines what they continue. */
export function isOrbyContextualConfirmation(message: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(message)
    .replace(/[¿?¡!.,;:…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!/^(?:si|sii|siii|claro|vale|listo|dale|de una|ok|okay|perfecto|bueno|no|ya|me parece|hagale|hagamosle)$/.test(normalized)) {
    return false;
  }
  const recent = normalizeOrbyRequestText(previousContext).slice(-1_200);
  // A bare acknowledgement is never, by itself, an off-topic request. With
  // no history, let Orby ask what the student wants to study; with history,
  // continue the academic exchange instead of showing a scope refusal.
  if (!recent) return true;
  const hasCurriculumContext = /\b(?:saber\s*11|icfes|matematicas?|lectura critica|sociales y ciudadanas|ciencias naturales|ingles|english|fotosintesis|biologia|quimica|fisica|historia|geometria|estadistica|mediana|moda)\b/.test(recent);
  const hasRecentQuestion = /[?¿]/.test(recent.slice(-700));
  const hasAcademicIntent = hasCurriculumContext
    || /\b(?:explicar|explicame|repasar|practicar|estudiar|resolver|mostrar|ver|revisar|continuar)\b/.test(recent);
  return hasAcademicIntent && (hasRecentQuestion || hasCurriculumContext);
}

/** Reject punctuation and bare acknowledgements, not concise academic answers such as A or B. */
export function formatOrbyMarkdownTablesForSpeech(value: string): string {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  const isPipeRow = (line: string) => line.includes("|") && cells(line).length >= 2;
  const isSeparator = (line: string) => isPipeRow(line)
    && cells(line).every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!isPipeRow(line)) {
      if (/^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/.test(line)) continue;
      output.push(line);
      continue;
    }

    // A pipe inside prose or a formula (for example P(A|B)) is not a
    // Markdown table. Only convert rows when a valid separator row follows.
    if (index + 1 >= lines.length || !isSeparator(lines[index + 1])) {
      output.push(line);
      continue;
    }

    const headers = cells(line);
    output.push("Tabla.");
    index += 2;
    let rowNumber = 1;
    while (index < lines.length && isPipeRow(lines[index]) && !isSeparator(lines[index])) {
      const values = cells(lines[index]);
      const entries = values.map((value, cellIndex) => {
        const header = headers[cellIndex] || "Columna " + (cellIndex + 1);
        return header + ": " + (value || "sin dato");
      });
      output.push("Fila " + rowNumber + ": " + entries.join("; ") + ".");
      rowNumber += 1;
      index += 1;
    }
    index -= 1;
    continue;
  }

  return output.join("\n");
}

function prepareOrbySpeechText(value: string): string {
  const fence = String.fromCharCode(96).repeat(3);
  return normalizeOrbySpanishOutput(formatOrbyMarkdownTablesForSpeech(value))
    .replace(new RegExp("^\\s*" + fence + "[a-z-]*\\s*", "gim"), "")
    .replace(new RegExp("\\s*" + fence, "g"), "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\\\(([\s\S]+?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]+?)\\\]/g, "$1")
    .replace(/\$\$([\s\S]+?)\$\$/g, "$1")
    .replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1 dividido entre $2")
    .replace(/\\sqrt\{([^{}]+)\}/g, "raíz cuadrada de $1")
    .replace(/\\sum(?:_\{([^{}]+)\})?/g, (_match, limits: string | undefined) => limits ? " sumatoria con índice " + limits : " sumatoria ")
    .replace(/\\int/g, " integral ")
    .replace(/\\infty/g, " infinito ")
    .replace(/\\pm/g, " más o menos ")
    .replace(/\\to|\\rightarrow/g, " tiende a ")
    .replace(/\\sin/g, " seno ")
    .replace(/\\cos/g, " coseno ")
    .replace(/\\tan/g, " tangente ")
    .replace(/\^\{([^{}]+)\}/g, " elevado a $1")
    .replace(/_\{([^{}]+)\}/g, " subíndice $1")
    .replace(/\\times|\\cdot|×|·/g, " por ")
    .replace(/\\div|÷/g, " dividido entre ")
    .replace(/\\lt|</g, " menor que ")
    .replace(/\\gt|>/g, " mayor que ")
    .replace(/\\leq|≤/g, " menor o igual que ")
    .replace(/\\geq|≥/g, " mayor o igual que ")
    .replace(/\\neq|≠/g, " distinto de ")
    .replace(/\\approx|≈/g, " aproximadamente igual a ")
    .replace(/([A-Za-zÁÉÍÓÚÜÑα-ωΑ-Ω0-9])\s*=\s*([A-Za-zÁÉÍÓÚÜÑα-ωΑ-Ω0-9])/g, "$1 igual a $2")
    .replace(/([A-Za-z0-9])\s*\/\s*([A-Za-z0-9])/g, "$1 dividido entre $2")
    .replace(/\\pi|π/g, " pi ")
    .replace(/\\rho|ρ/g, " rho ")
    .replace(/\\alpha|α/g, " alfa ")
    .replace(/\\beta|β/g, " beta ")
    .replace(/\\theta|θ/g, " theta ")
    .replace(/\\left|\\right/g, "")
    .replace(/\\text\{([^{}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\\[\[\](){}]/g, " ")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\x60([^\x60]+)\x60/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "Punto: ")
    .replace(/^\s*(\d+)[.)]\s+/gm, "Paso $1: ")
    .replace(/^\s*>\s?/gm, "")
    .replace(/https?:\/\/\S+/g, "enlace web")
    .replace(/(\d)\s*%/g, "$1 por ciento")
    .replace(/([.!?])(?=\S)/g, "$1 ")
    .replace(/([,;:])(?=\S)/g, "$1 ")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]*/g, ". ")
    .replace(/([.!?])(?:\s*\1)+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatOrbySpeechText(value: string): string {
  return prepareOrbySpeechText(value);
}

export function composeOrbySpeechText(reply: string, checkQuestion = ""): string {
  const cleanReply = prepareOrbySpeechText(reply);
  const cleanCheck = prepareOrbySpeechText(checkQuestion);
  if (!cleanReply) return cleanCheck ? "Comprueba lo aprendido: " + cleanCheck : "";
  if (!cleanCheck || cleanReply.toLocaleLowerCase("es-CO").includes(cleanCheck.toLocaleLowerCase("es-CO"))) {
    return cleanReply;
  }
  return cleanReply + ". Comprueba lo aprendido: " + cleanCheck;
}

export function isLowQualityOrbyReply(value: string, studentRequest = ""): boolean {
  const normalized = normalizeOrbyRequestText(value)
    .replace(/[¿?¡!.,;:…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return true;

  // Short acknowledgements are incomplete tutor answers unless the student
  // explicitly requested a one-word yes/no or true/false response.
  const isBareAcknowledgement = /^(?:si|no|ok|okay|vale|claro|listo|perfecto|dale|de una|bueno)$/.test(normalized);
  if (!isBareAcknowledgement) return false;
  const request = normalizeOrbyRequestText(studentRequest);
  const explicitlyRequestsOneWord = /\b(?:responde|contesta|respondeme|contestame|dime)\b.{0,45}\b(?:solo|solamente|unicamente)\b.{0,30}\b(?:si o no|una palabra|verdadero o falso)\b|\b(?:solo|solamente|unicamente)\s+(?:si o no|una palabra|verdadero o falso)\b/i.test(request);
  return !explicitlyRequestsOneWord;
}

const UNSUPPORTED_SPANISH_SCRIPT_PATTERN = /[\p{Script=Devanagari}\p{Script=Arabic}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Myanmar}\p{Script=Ethiopic}]/u;

/**
 * Orby is a Spanish-first Saber 11 tutor. Reject foreign writing systems in
 * model output and ASR transcripts instead of rendering or speaking gibberish.
 * Latin-script English terms remain valid for the ICFES English subject.
 */
const ROMANIZED_HINDI_SIGNALS = /\b(?:namaste|namaskar|aap|kaise|hain|hai|ho|kya|kyun|kyunki|kripya|dhanyavaad|shukriya|mera|meri|mujhe|hum|aapka|aapki|chahiye|bataye|bataiye|samajh|sakte|sakti|raha|rahi|hoon|nahi|nahin|accha|theek|bilkul|kijiye|padhai|seekhna|sikhaye|sikhao)\b/g;

/**
 * Reject non-Spanish ASR/model language, including Hindi written in Latin
 * transliteration. Three independent Hindi signals are required so isolated
 * names or shared short words do not block valid ICFES English content.
 */
export function containsUnsupportedSpanishLanguage(value: string): boolean {
  if (UNSUPPORTED_SPANISH_SCRIPT_PATTERN.test(value)) return true;
  const normalized = normalizeOrbyRequestText(value);
  if (!normalized) return false;
  if (/^(?:namaste|namaskar)\b/.test(normalized)) return true;
  const words = normalized.match(/[a-z]+/g) ?? [];
  if (words.length < 3) return false;
  const signals = normalized.match(ROMANIZED_HINDI_SIGNALS) ?? [];
  const hasDistinctiveHindiMarker = /\b(?:mujhe|sikhao|sikhaye|namaste|namaskar|dhanyavaad|shukriya|kripya|bataiye)\b/.test(normalized);
  return (signals.length >= 3 || (signals.length >= 2 && hasDistinctiveHindiMarker))
    && signals.length / words.length >= 0.3;
}

export function containsUnsupportedSpanishScript(value: string): boolean {
  return UNSUPPORTED_SPANISH_SCRIPT_PATTERN.test(value);
}

export function shouldRetrieveOrbyAcademicKnowledge(input: {
  message: string;
  subject?: string;
  topic?: string;
  question?: string;
  context?: string;
}): boolean {
  const currentText = [input.message, input.question].filter(Boolean).join(" ");
  const message = normalizeOrbyRequestText(currentText);
  if (!message || isOrbyGreetingRequest(currentText)) return false;

  const explicitAcademicTopic = /\b(?:saber\s*11|icfes|matematicas?|algebra|aritmetica|geometria|trigonometria|probabilidad|estadistica|ecuaciones?|fracciones?|porcentajes?|lectura critica|comprension lectora|texto argumentativo|intencion del autor|sociales y ciudadanas|historia de colombia|guerra fria|cold war|revolucion francesa|french revolution|revolucion industrial|industrial revolution|world war|simon bolivar|independencia de colombia|independence of colombia|geografia|democracia|constitucion politica|ciencias naturales|fisica|quimica|biologia|celula|ecosistema|genetica|fotosintesis|reaccion quimica|atomo|molecula|tabla periodica|energia|fuerza|densidad|termodinamica|ingles|english|vocabulario en contexto|reading comprehension|astronomia|estrella(?:s)? de neutrones|agujero negro|sistema solar|orbita|gravedad)\b/i.test(message)
    || ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(message));
  if (explicitAcademicTopic) return true;

  const normalizedSubject = normalizeOrbyRequestText(input.subject ?? "");
  const normalizedLessonContext = normalizeOrbyRequestText([
    input.subject,
    input.topic,
    input.question,
    input.context,
  ].filter(Boolean).join(" "));
  const hasSpecificLessonSubject = Boolean(normalizedSubject)
    && !/^(?:preparacion saber 11|saber 11|preparacion icfes|icfes|estudio y aprendizaje)$/.test(normalizedSubject);
  const hasAcademicLessonContext = hasSpecificLessonSubject
    || ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(normalizedLessonContext))
    || /\b(?:area de estudio|tema de estudio|competencia icfes|ejercicio de saber 11)\b/i.test(normalizedLessonContext);
  const isFollowUpOrStudyIntent = /\b(?:explicame|explica|ensename|ayudame a resolver|resuelve|analiza|interpreta|compara|define|que significa|que es|que son|como funciona|como se resuelve|dame ejercicios|dame fuentes?|busca fuentes?|referencias?|investiga|investigar|investigacion|investigaciones|indaga|indagar|verifica|comprueba|contrasta|practiquemos|repasemos|estudiemos|quiero aprender|no entiendo|no se|no lo se|ni idea|no tengo claro|ayudame a elegir|diferencia entre|por que ocurre|por que|como asi|otro ejemplo|dame otro ejemplo|continua|siguiente|comencemos|empecemos|vamos|otra pregunta|siguiente pregunta|empezamos)\b/i.test(message);
  const isEnglishAcademicQuestion = /\b(?:what does .{1,90} mean|what is the meaning of|what is implied|what can be inferred|what is the main idea|main idea|according to (?:the )?(?:text|passage|dialogue)|which (?:statement|option|answer)|choose the correct|select the correct|fill in the blank|complete the sentence|why does the author|explain|define|compare|solve|calculate|infer|interpret)\b/i.test(currentText);
  const confirmsGuidedContinuation = isOrbyContextualConfirmation(input.message, input.context ?? "");
  return hasAcademicLessonContext && (isFollowUpOrStudyIntent || isEnglishAcademicQuestion || confirmsGuidedContinuation);
}

export function getOrbySubjectSelectionReply(
  message: string,
  previousContext = "",
  activeSubject = "",
): string | null {
  const key = getOrbySubjectSelectionKey(message);
  if (!key || isOrbySubjectAlreadyActive(message, previousContext, activeSubject)) return null;

  if (key === "reading") {
    return "¡Perfecto! Vamos con Lectura Crítica de Saber 11. Trabajaremos comprensión, idea principal, intención comunicativa, inferencias y argumentos. Para empezar, puedo proponerte un texto tipo ICFES o aclarar una habilidad concreta.";
  }
  if (key === "math") {
    return "¡Listo! Vamos con Matemáticas de Saber 11. Trabajaremos interpretación de datos, álgebra, geometría, estadística y resolución de problemas. ¿Qué concepto o ejercicio quieres revisar primero?";
  }
  if (key === "social") {
    return "¡Vamos con Sociales y Ciudadanas! Trabajaremos pensamiento social, interpretación de perspectivas, historia, geografía y ciudadanía. ¿Qué tema quieres revisar primero?";
  }
  if (key === "science") {
    return "¡Perfecto! Vamos con Ciencias Naturales de Saber 11. Podemos trabajar biología, química, física, ambiente e indagación científica. ¿Qué concepto quieres entender primero?";
  }
  return ORBY_ICFES_ENGLISH_INTRO_REPLY;
}

export function isOrbyGreetingRequest(message: string): boolean {
  const normalized = normalizeOrbyRequestText(message).replace(/[¿?¡!.,;:]+/g, "").trim();
  if (!normalized || normalized.length > 48) return false;
  // Colombian conversational greetings and wake words, including common ASR variants.
  return /^(?:(?:oye|oe|oee|ey|eii|hey) )?orby(?: ai)?$/.test(normalized)
    || /^(?:oye|oe|oee|ey|eii|epa|hola|ola|holi|buenas|buenos dias|buenas tardes|buenas noches|que mas|como estas|como vas|todo bien|saludos|hey|hello|hi)(?: bro| hermano| hermanito| orby)?$/.test(normalized)
    || /^(?:oye|oe|oee|ey|eii|epa|hey)(?: bro| hermano| hermanito)?(?: que mas| como estas| como vas| todo bien)$/.test(normalized);
}

const ENGLISH_ONLY_OPENINGS = [
  /^(?:certainly|sure|of course|absolutely|hello|hi there|how can i help|i can help|let me help|what would you like|today we can|great,? let.s|great!|yes,? i can)\b/i,
  /^(?:i(?:'m| am) happy to help|we can practice|let.s practice|here is how)\b/i,
];

export function isGenericIcfesEnglishRequest(message: string): boolean {
  const normalized = normalizeOrbyRequestText(message);
  if (!normalized || normalized.length > 100) return false;
  const mentionsEnglish = /\b(?:ingles|english)\b/.test(normalized);
  if (!mentionsEnglish) return false;
  if (getOrbySubjectSelectionKey(message) === "english") return true;
  return /^(?:(?:ayudame|ayuda|quiero estudiar|quiero aprender|vamos a estudiar|practiquemos|estudiemos|help me with|can you help me with)\s+)?(?:el )?(?:ingles|english)(?: de saber 11| del icfes)?[.!? ]*$/i.test(normalized)
    || /^(?:quiero|necesito|puedo|vamos a)\s+(?:estudiar|aprender|practicar|repasar|ver)\s+(?:ingles|english)(?: de saber 11| del icfes)?[.!? ]*$/i.test(normalized);
}

export function isLikelyEnglishOnlyOrbyReply(reply: string): boolean {
  const value = reply.trim().replace(/^["'“”]+|["'“”]+$/g, "");
  if (!value) return false;
  // Catch short language switches too; the general classifier below needs
  // enough context to avoid guessing from one ambiguous word.
  if (/^(?:hello|hi|bonjour|salut|hallo|guten tag|ciao|buongiorno|ol[aá]|obrigad[oa]|danke|merci|oui|sim|sure|yes)(?:[.!?,\s]|$)/i.test(value)) return true;
  if (value.length < 12) return false;

  const normalized = normalizeOrbyRequestText(value);
  const words = normalized.match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  if (words.length < 3) return false;

  // Use distinctive Spanish markers rather than shared Romance-language
  // articles/prepositions (for example "la", "de", "que", "una").
  const spanishSignals = /\b(?:puedo|puedes|podemos|vamos|tema|estudiar|explicar|explicame|respuesta|pregunta|saber|prueba|ingles|porque|tambien|esta|estan|estoy|somos|eres|soy|quieres|necesitas|debes|deberias|cual|cuando|donde|primero|segundo|tercero|correcta|opcion|lectura|matematicas|ciencias|sociales|ciudadanas|colombia|icfes|estudiante|profesor|tutor)\b/.test(normalized)
    || /[áíóúñ¿¡]/i.test(value);

  if (spanishSignals) return false;

  const foreignLanguageSignals = [
    /\b(?:bonjour|comment|puis|je|vous|nous|avec|pour|dans|une|des|est|sont|pouvez|peux|aider|aidez|expliquer|apprendre|aujourd|merci|votre|mais|parce|cette|cela|voici|reponse|bonne|correcte)\b/g,
    /\b(?:ol[aá]|voce|voces|você|vocês|posso|podemos|ajudar|ajudo|explicar|estudar|hoje|obrigado|obrigada|porque|como|qual|este|esta|estao|estão|nao|não|mas|tambem|também|muito|para|com|uma|umas|uns|te)\b/g,
    /\b(?:hallo|guten|morgen|natürlich|ich|du|sie|wir|ist|sind|mit|für|auf|wie|was|warum|kann|können|helfen|erklären|lernen|heute|bitte|nicht|eine|einer|aber|oder|auch)\b/g,
    /\b(?:ciao|buongiorno|posso|siamo|aiutare|aiutarti|spiegare|spiegarti|studiare|oggi|come|quale|questo|questa|grazie|anche|perche|perché|sono|della|degli|delle|con|non|ma|molto|vorrei)\b/g,
  ];
  for (const pattern of foreignLanguageSignals) {
    const signals = normalized.match(pattern) ?? [];
    if (signals.length >= 3 && signals.length / Math.max(1, words.length) >= 0.3) return true;
  }

  // English ICFES excerpts are allowed inside a Spanish explanation. The
  // filter only rejects a response whose overall wording is English and has
  // no meaningful Spanish signal.
  if (ENGLISH_ONLY_OPENINGS.some((pattern) => pattern.test(value))
    || /^(?:certainly|sure|of course|how can i help you|i can help you)\b/i.test(value)) {
    return true;
  }
  const englishSignals = normalized.match(/\b(?:the|this|that|these|those|you|your|we|they|their|is|are|was|were|because|which|what|when|where|why|how|with|from|into|about|would|could|should|can|will|have|has|does|did|first|second|therefore|however|answer|question|please|here|there|and|but|for|to|of|in|on|as|at|by|be|been|it|its|my|our|let's|solve|together|example|means|given|find|choose|select|correct|option|passage|statement|according|since|next|then|also)\b/g) ?? [];

  // Three common English function/content words in a short answer are a
  // strong signal that the model switched languages (e.g. "The answer is B").
  return englishSignals.length >= 3 && englishSignals.length / words.length >= 0.3;
}

export function containsExternalPreIcfesPromotion(text: string): boolean {
  const normalized = normalizeOrbyRequestText(text);
  if (!normalized) return false;
  const explicitRefusal = /\b(?:no (?:te )?recomiendo|no recomiendo|no promociono|no puedo recomendar|no voy a promocionar|no mencionare|no menciono)\b/.test(normalized);
  if (explicitRefusal) return false;

  const namesExternalProvider = /\bgrupo\s*500\b|\bmilton\s+ochoa\b|\binstruimos\b|\bpreicfes\s*\.\s*net\b/.test(normalized);
  const promotionalVerb = /\b(?:te recomiendo|recomiendo|puedes inscribirte|inscribete|matriculate|visita|contacta|contrata|elige|prueba|compra|la mejor opcion|una buena opcion|te sugiero|consulta sus cursos)\b/.test(normalized);
  const externalCategory = /\b(?:academias?|institutos?|plataformas?|cursos?|pre[\s-]?icfes|pre[\s-]?saber)\b/.test(normalized);
  return namesExternalProvider || promotionalVerb && externalCategory;
}

const INJECTION_PATTERNS = [
  /\b(ignore|ignora|olvida|forget|disregard)\b.{0,80}\b(instrucciones|instructions|rules|reglas|restricciones|restrictions|previous instructions|prior instructions|system prompt|prompt del sistema)\b/i,
  /\b(revela|muestra|imprime|exporta|show|reveal|print|dump|disclose)\b.{0,60}\b(prompt del sistema|system prompt|hidden prompt|instrucciones internas|hidden instructions|api.?key|secretos?|secrets?|credenciales|credentials?|variables de entorno|environment variables|private key|access token)\b/i,
  /\b(jailbreak|bypass|desactiva tus reglas|actua sin restricciones)\b/i,
  /\b(?:developer mode|modo desarrollador|do anything now|dan mode)\b/i,
  /\b(?:act as|pretend to be|you are now)\b.{0,60}\b(?:unrestricted|unfiltered|another ai|a different ai|dan)\b/i,
];

export function containsOrbyPromptInjection(message: string): boolean {
  const normalized = normalizeOrbyRequestText(message);
  return Boolean(normalized) && INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * The only non-explicit allowance is a short follow-up to a recent, clearly
 * curricular exchange. Greeting and identity turns remain deterministic UX
 * exceptions; conversation history can never turn an unrelated topic green.
 */
/**
 * Orby is Saber 11-first, not a strict allowlist chatbot. Natural, harmless
 * conversation is allowed; only protected categories are denied.
 */
export function isIcfesScopedRequest(message: string, previousContext = ""): boolean {
  return preflightOrbyRequest(message, previousContext).allowed;
}

export function isOrbyStudyGuidanceRequest(message: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(message);
  return STUDY_GUIDANCE_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalized))
    && ORBY_STUDY_INVITATION_PATTERN.test(normalizeOrbyRequestText(previousContext));
}

/**
 * Refuse obvious off-curriculum domains even when a user mixes them with an
 * ICFES keyword. This same detector is applied to model output before display
 * or audio playback.
 */
const COOKING_REQUEST_PATTERNS = [
  /\b(?:dame|hazme|pasame|comparteme|quiero|necesito|ensename|como preparo|como hago|como hacer|como cocino|como horneo|preparar|cocinar|hornear|give me|make me|share|teach me|show me|how to cook|how do i cook|how do i make|how to make|i want to cook|i need a recipe|can you cook)\b.{0,90}\b(?:receta|recetas|arepa|arepas|pan|torta|pastel|pasta|comida|recipe|recipes|cake|food|meal|cook|cooking|bake|baking)\b/i,
  /\b(?:receta|recipe|ricetta|receita|recette|rezept)\s+(?:de|para|for|of)\b/i,
  // Italian recipe requests often omit the preposition: "Voglio una ricetta".
  /\b(?:voglio|vorrei|dammi|desidero)\s+(?:una?\s+)?ricetta\b/i,
  // Hindi/Urdu written in Latin transliteration (ASR often produces this).
  /\b(?:mujhe|main|mai)\b.{0,65}\b(?:khana|khana banana|khana pakana|recipe|rasoi)\b.{0,45}\b(?:sikhao|sikhaye|batao|bataiye|banana|pakana|kaise)\b/i,
  /\b(?:khana banana|khana pakana)\b.{0,45}\b(?:sikhao|sikhaye|batao|bataiye|kaise|recipe)\b/i,
  /\b(?:recipe do|recipe batao|khana banane ka tarika|khana pakane ka tarika)\b/i,
  /\b(?:quero cozinhar|je veux cuisiner|voglio cucinare|ich mochte kochen|ich mochte backen|how to make a cake|how to bake)\b/i,
];

const POTENTIALLY_HARMFUL_REQUEST_PATTERNS = [
  // Explicit instructions to harm a person, create weapons/explosives/poisons,
  // or facilitate self-harm. Neutral discussion, prevention and school science
  // remain allowed.
  /\b(?:como|how (?:do i|can i|to))\b.{0,55}\b(?:fabricar|construir|hacer|preparar|make|build|create)\b.{0,45}\b(?:una bomba|explosivo|explosivos|veneno|arma casera|bomba casera|bomb|explosive|poison|improvised weapon)\b/i,
  /\b(?:como|how to)\b.{0,55}\b(?:matar|asesinar|envenenar|herir|hacer dano|kill|murder|poison|hurt|injure)\b.{0,55}\b(?:a alguien|una persona|mi companero|myself|someone|a person|someone else)\b/i,
  /\b(?:como suicidarme|metodo para suicidarme|como (?:puedo )?hacerme dano|how to kill myself|how to commit suicide|how (?:can i|do i) self[- ]?harm|best way to self harm)\b/i,
  // Cyber abuse: exclude credential theft, phishing, malware and unauthorized
  // account/system intrusion, while allowing general cybersecurity education.
  /\b(?:robar|robo|hurtar|hurto|obtener|steal|capture)\b.{0,55}\b(?:contrasenas?|credenciales|passwords?|credentials|tokens? de acceso|access tokens?|cuentas?|account|accounts|perfiles?)\b/i,
  /\b(?:crear|hacer|programar|deploy|build|write|make|create)\b.{0,55}\b(?:malware|ransomware|keylogger|phishing kit|credential stealer|virus informatico)\b/i,
  /\b(?:hackear|hack|entrar|acceder|bypassear|bypass)\b.{0,65}\b(?:cuenta ajena|cuenta de otra persona|sistema ajeno|servidor ajeno|sin permiso|una cuenta|someone else's account|an account|a server|without permission)\b/i,
  /\b(?:como|how (?:do i|to))\b.{0,55}\b(?:hackear|hackeo|hack|penetrar|intrusion|break into)\b.{0,60}\b(?:red wifi|wifi|router|red ajena|sistema|servidor|cuenta|account|network)\b/i,
  /\b(?:como|how (?:do i|to))\b.{0,55}\b(?:golpear|pegar|agredir|atacar|beat up|assault|attack|hurt|injure)\b.{0,60}\b(?:a alguien|una persona|mi companero|someone|a person|my classmate)\b/i,
  /\b(?:como|how to)\b.{0,50}\b(?:estafar|enganar para robar|falsificar documentos|robar una cuenta|cometer fraude|scam someone|commit fraud|forge documents|steal an account)\b/i,
  /\b(?:doxxear|doxing|publicar la direccion privada|encontrar la direccion de casa de|find someone's home address|expose private information)\b/i,
];

export function containsCookingRequest(value: string): boolean {
  const normalized = normalizeOrbyRequestText(value);
  return Boolean(normalized) && COOKING_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Backward-compatible name used by older client/output guards. It now detects
 * only potentially harmful instructions, never ordinary non-ICFES subjects.
 */
export function containsExplicitNonIcfesTopic(value: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(value);
  if (!normalized) return false;
  if (POTENTIALLY_HARMFUL_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) return true;

  // A brief referential follow-up inherits a dangerous intent only when the
  // immediately preceding exchange contains an explicit harmful instruction.
  const isReferentialFollowUp = /^(?:y|entonces|hazlo|haz eso|como hago eso|dime como|continua|sigue|do it|then|how do i do that|continue)[.!? ]*$/i.test(normalized);
  if (!isReferentialFollowUp) return false;
  const prior = normalizeOrbyRequestText(previousContext);
  return POTENTIALLY_HARMFUL_REQUEST_PATTERNS.some((pattern) => pattern.test(prior));
}

/** Previous assistant text is trusted as context only when the exchange itself
 * is anchored to a curriculum concept and is not a deterministic refusal. */
export function isIcfesScopedAssistantTurn(message: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(message);
  if (!normalized || containsOrbyPromptInjection(normalized)) return false;
  return !containsProgrammingInstruction(message, previousContext)
    && !containsCookingInstruction(message, previousContext)
    && !containsExplicitNonIcfesTopic(message, previousContext)
    && !containsExternalPreIcfesPromotion(message)
    && !containsUnsupportedSpanishLanguage(message)
    && !isLikelyEnglishOnlyOrbyReply(message)
    && !hasFalseOrbyCreatorAttribution(message);
}

export function preflightOrbyRequest(message: string, previousContext = ""): OrbyPreflightResult {
  const normalized = normalizeOrbyRequestText(message);
  if (!normalized) return { allowed: true, category: null, reply: "" };

  if (containsOrbyPromptInjection(normalized)) {
    return {
      allowed: false,
      category: "prompt_injection",
      reply: "No puedo cambiar mis reglas ni revelar información interna. Puedo conversar contigo y ayudarte a estudiar de forma segura.",
    };
  }

  const academicMaterialQuestion = isIcfesAcademicMaterialQuestion(message, previousContext);

  // A short acknowledgement is never rejected merely for lacking a curriculum keyword.
  if (isOrbyContextualConfirmation(message, previousContext)) {
    return { allowed: true, category: null, reply: "" };
  }

  // Empty and punctuation-only ASR results deserve clarification, not a scope refusal.
  if (isOrbyUnclearInput(message)) {
    // Punctuation is an unclear turn, not a request outside Saber 11.
    return { allowed: false, category: "outside", reply: getOrbyClarificationReply(previousContext) };
  }

  // A competitor name or a brand mentioned inside an ICFES reading passage
  // is source material, not a request to recommend another pre-ICFES provider.
  if (!academicMaterialQuestion
    && EXTERNAL_PREICFES_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "outside",
      reply: ORBY_EXTERNAL_PREICFES_REPLY,
    };
  }
  if (!academicMaterialQuestion
    && (PROGRAMMING_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized)) || containsProgrammingInstruction(message, previousContext))) {
    return {
      allowed: false,
      category: "programming",
      reply: "No puedo enseñar programación ni desarrollo de software. Mi función es prepararte para Saber 11 en Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.",
    };
  }

  if (!academicMaterialQuestion && containsCookingRequest(normalized)) {
    return {
      allowed: false,
      category: "outside",
      reply: ORBY_COOKING_REPLY,
    };
  }

  if (!academicMaterialQuestion && containsExplicitNonIcfesTopic(normalized, previousContext)) {
    return {
      allowed: false,
      category: "outside",
      reply: ORBY_SAFETY_REPLY,
    };
  }

  if (!academicMaterialQuestion
    && GENERAL_OFF_SCOPE_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "outside",
      reply: ORBY_ICFES_SCOPE_REPLY,
    };
  }

  // Orby is an ICFES tutor, not a general-purpose chatbot. Greetings remain
  // available, but substantive requests must belong to one of the five
  // Saber 11 areas. A short follow-up inherits scope only from recent
  // curriculum evidence, never from the generic "Preparación Saber 11" label.
  if (isOrbyGreetingRequest(message)) {
    return { allowed: true, category: null, reply: "" };
  }

  const prior = normalizeOrbyRequestText(previousContext);
  const currentHasCurriculumAnchor = ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))
    || ICFES_EXAM_INTENT_PATTERN.test(normalized)
    || ICFES_EXAM_DEFINITION_PATTERN.test(normalized)
    || ORBY_STUDY_INVITATION_PATTERN.test(normalized);
  const priorIsDeterministicRefusal =
    /\bno corresponde\b.{0,80}\bsaber\s*11\b|\bfuera del alcance\b|\bno puedo ayudarte con ese tema\b|\bno puedo ensenar programacion\b/i.test(prior);
  const priorHasCurriculumAnchor = !priorIsDeterministicRefusal && (
    ICFES_CURRICULUM_CONTEXT_PATTERNS.some((pattern) => pattern.test(prior))
    || ORBY_STUDY_INVITATION_PATTERN.test(prior)
  );
  const isFollowUpAfterRefusal = priorIsDeterministicRefusal && (
    ICFES_FOLLOW_UP_PATTERN.test(normalized)
    || STUDY_GUIDANCE_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalized))
  );
  if (isFollowUpAfterRefusal) {
    return { allowed: false, category: "outside", reply: ORBY_ICFES_SCOPE_REPLY };
  }
  const isContextualAcademicFollowUp = priorHasCurriculumAnchor
    && (ICFES_FOLLOW_UP_PATTERN.test(normalized) || CONTEXTUAL_STUDY_REQUEST_PATTERN.test(normalized) || isOrbyStudyGuidanceRequest(message, previousContext));

  // Do not treat the curriculum keyword list as a hard allowlist. Students
  // often use an unfamiliar concept, an incomplete sentence or an everyday
  // phrase while trying to describe an ICFES doubt. Deterministic rules above
  // still block explicit programming, cooking, harmful requests and clearly
  // unrelated recommendations. Ambiguous requests go to the restricted tutor
  // prompt, which must clarify or redirect without teaching an unrelated topic.
  if (!currentHasCurriculumAnchor && !isContextualAcademicFollowUp) {
    return { allowed: true, category: null, reply: "" };
  }

  return { allowed: true, category: null, reply: "" };
}

export function sanitizeOrbyKnowledgeExcerpt(content: string, title: string): string {
  let safe = content.replace(/\r/g, "").replace(/https?:\/\/[^\s)]+|www\.[^\s)]+/gi, " ");
  const normalizedTitle = title
    .replace(/^\s*\d+[\s._:-]+/, "")
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const titleParts = normalizedTitle.split(/\s+/).filter(Boolean);
  const aliases = new Set<string>();
  if (normalizedTitle.length >= 10) aliases.add(normalizedTitle);
  if (titleParts.length > 1) {
    const withoutLead = titleParts.slice(1).join(" ").trim();
    if (withoutLead.length >= 10) aliases.add(withoutLead);
  }
  for (const alias of aliases) {
    const needle = alias.toLocaleLowerCase("es-CO");
    let cursor = 0;
    while (cursor < safe.length) {
      const index = safe.toLocaleLowerCase("es-CO").indexOf(needle, cursor);
      if (index < 0) break;
      const replacement = "contenido académico";
      safe = safe.slice(0, index) + replacement + safe.slice(index + alias.length);
      cursor = index + replacement.length;
    }
  }
  safe = safe.split("\n")
    .filter((line) => !/(?:realizado|elaborado|preparado|producido|diseñado)\s+por\b|síguenos|redes sociales|facebook|instagram|youtube|canal oficial|visita nuestra|encuentra más herramientas|página web|sitio web|derechos reservados|copyright|contacto comercial/i.test(line))
    .join("\n");
  return safe.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
export function containsProgrammingInstruction(text: string, previousContext = ""): boolean {
  const value = normalizeOrbyRequestText(text);
  if (!value) return false;
  // A source, term or quotation inside an ICFES passage is material to analyse,
  // not a request to learn software development.
  if (isIcfesAcademicMaterialQuestion(text, previousContext)) return false;

  const containsCode = text.includes(String.fromCharCode(96).repeat(3))
    || /(?:^|[\s:])(?:print|console\.log|function|const|let|var|def|class|import|export)\s*(?:\(|[a-z_$][\w$]*\s*=|\{)/im.test(text)
    || /\b(?:for|while)\s*\([^)]{0,100}\)\s*\{/i.test(text)
    || /\bconsole\.log\s*\(|\bprint\s*\(|\bfunction\s+[a-z_$][\w$]*\s*\(|\bconst\s+[a-z_$][\w$]*\s*=|\blet\s+[a-z_$][\w$]*\s*=|\bdef\s+[a-z_]\w*\s*\(|\bimport\s+(?:\w|{|\*)|\bSELECT\s+[\w* ,]+\s+FROM\s+\w+/i.test(text)
    || (text.includes(String.fromCharCode(96)) && text.split(String.fromCharCode(96)).length >= 3)
    || /\b(aqui tienes|escribe|copia|ejecuta|pega)\b.{0,70}\b(codigo|script|programa|comando|print|console\.log)\b/i.test(value)
    || /\b(instala|configura|ejecuta)\b.{0,70}\b(python|node\.js|npm|react|visual studio code|terminal)\b/i.test(value);

  const mentionsProgramming = PROGRAMMING_REQUEST_PATTERNS.some((pattern) => pattern.test(value));
  const isExplicitRefusal = /\b(no enseno|no puedo ensenar|no puedo ayudarte con|no doy clases de|fuera del alcance|mi funcion es preparar|especializado exclusivamente en saber 11)\b/i.test(value);

  // Catch general enthusiasm/advice about programming languages too, not just
  // source code snippets. Allow a clear refusal so Orby can explain its scope.
  return containsCode || (mentionsProgramming && !isExplicitRefusal);
}

export function containsCookingInstruction(text: string, previousContext = ""): boolean {
  const value = normalizeOrbyRequestText(text);
  if (!value) return false;
  const explicitRefusal = /\b(?:no (?:puedo|voy a|debo) (?:ensenar|explicar|compartir|dar)|no enseno|no doy clases de|fuera del alcance|mi funcion es preparar|no puedo ayudarte con)\b.{0,100}\b(?:cocina|cocinar|receta|recetas|cooking|cook|recipe|recipes|baking)\b/i.test(value);
  if (explicitRefusal) return false;

  const cookingInstruction = /\b(?:aqui tienes|te comparto|te doy|puedes preparar|prepara|cocina|cocinar|hornea|a recipe for|here is a recipe|how to cook|teach you to cook|share a recipe|je peux partager|ich zeige dir|voglio una ricetta|dammi una ricetta|give me a recipe|dame una receta|quero cozinhar|je veux cuisiner|voglio cucinare|ich mochte kochen)\b.{0,90}\b(?:receta|recetas|arepa|arepas|pan|torta|pastel|pasta|recipe|recipes|cake|food|meal|cook|cooking|bake|baking|kochen|gateau|ricetta|receita|recette|rezept)\b|\b(?:recipe for|a recipe|recette de|una receta de|ricetta per|ricetta di|ricetta|receita de|rezept fur)\b|\b(?:ich zeige dir|ich kann dir zeigen)\b.{0,70}\b(?:kochen|kocht|kochst|backen|backt)\b/i.test(value);
  if (!cookingInstruction) return false;

  // A recipe can be mentioned in a passage or question. Only reject actual
  // cooking assistance when the surrounding exchange is an ICFES exercise.
  const context = normalizeOrbyRequestText(previousContext);
  const hasCurriculumContext = ICFES_CURRICULUM_CONTEXT_PATTERNS.some((pattern) => pattern.test(context))
    || ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(value));
  const academicFrame = /\b(?:en el texto|en la lectura|en el fragmento|en el pasaje|en el dialogo|en el enunciado|la frase|el ejercicio|la pregunta|analiza|interpreta|traduce|the passage|the text|the dialogue|this sentence|this question|in the passage|in this text)\b/i;
  if (hasCurriculumContext && (academicFrame.test(value) || academicFrame.test(context))) {
    const directInstruction = /\b(?:aqui tienes|te comparto|te doy|puedes preparar|prepara para ti|haz esta receta|dame una receta|give me a recipe|tell me a recipe|how to cook|teach you to cook|quero cozinhar|je veux cuisiner|voglio cucinare|ich mochte kochen|here is a recipe|i can share a recipe|je peux partager une recette|ich zeige dir, wie man)\b/i.test(value);
    return directInstruction;
  }
  return true;
}

export function extractPlainOrbyReply(value: string): string {
  const fence = String.fromCharCode(96).repeat(3);
  const normalized = value
    .replace(new RegExp("^\\s*" + fence + "(?:json)?\\s*", "i"), "")
    .replace(new RegExp("\\s*" + fence + "\\s*$", "i"), "")
    .trim();

  try {
    const parsed: unknown = JSON.parse(normalized);
    if (typeof parsed === "string") {
      const inner = parsed.trim();
      // Some providers wrap a JSON response object inside a JSON string.
      // Parse the inner payload again so only the intended reply is rendered.
      if (/^[\\[{]/.test(inner) && inner !== normalized) {
        const unwrapped = extractPlainOrbyReply(inner);
        if (unwrapped) return unwrapped;
      }
      return normalizeOrbySpanishOutput(parsed);
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const preferredKeys = [
        "mensaje_respuesta", "message_response", "respuesta_final", "respuesta_usuario", "reply", "respuesta", "mensaje",
        "response", "message", "content", "contenido", "text", "answer", "output",
      ];
      for (const key of preferredKeys) {
        const candidate = record[key];
        if (typeof candidate === "string" && candidate.trim()) {
          return normalizeOrbySpanishOutput(candidate);
        }
      }
      for (const candidate of Object.values(record)) {
        if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
          const nested = extractPlainOrbyReply(JSON.stringify(candidate));
          if (nested) return nested;
        }
      }
      return "";
    }
    return "";
  } catch {
    if (/^\s*[\[{]/.test(normalized)) return "";
    return normalizeOrbySpanishOutput(normalized);
  }
}

export function hasFalseOrbyCreatorAttribution(value: string): boolean {
  const normalized = normalizeOrbyRequestText(value);
  const match = normalized.match(/(?:cread[oa]|entrenad[oa]|desarrollad[oa]|hech[oa]|created|trained|made)\s*(?:por|by)\s*([a-z0-9][a-z0-9 ._-]{0,48})/i);
  if (!match) return false;
  const alleged = match[1]
    .split(/\s+(?:para|en|con|que|y|to|for)\b/i)[0]
    .replace(/[^a-z0-9]/gi, "");
  return Boolean(alleged) && !/^peak[-_]?score$/i.test(alleged);
}

export function normalizeOrbySpanishOutput(value: string): string {
  const corrections: Array<[RegExp, string]> = [
    [/\bmatematicas\b/gi, "matemáticas"],
    [/\bbiologia\b/gi, "biología"],
    [/\bquimica\b/gi, "química"],
    [/\bfisica\b/gi, "física"],
    [/\balgebra\b/gi, "álgebra"],
    [/\baritmetica\b/gi, "aritmética"],
    [/\bgeometria\b/gi, "geometría"],
    [/\bestadistica\b/gi, "estadística"],
    [/\benergia\b/gi, "energía"],
    [/\bcelula\b/gi, "célula"],
    [/\bhipotesis\b/gi, "hipótesis"],
    [/\banalisis\b/gi, "análisis"],
    [/\bsintesis\b/gi, "síntesis"],
    [/\bconclusion\b/gi, "conclusión"],
    [/\bexplicacion\b/gi, "explicación"],
    [/\binterpretacion\b/gi, "interpretación"],
    [/\bcomprension\b/gi, "comprensión"],
    [/\binformacion\b/gi, "información"],
    [/\bparticipacion\b/gi, "participación"],
    [/\bcomunicacion\b/gi, "comunicación"],
    [/\bpoblacion\b/gi, "población"],
    [/\brelacion\b/gi, "relación"],
    [/\bproporcion\b/gi, "proporción"],
    [/\becuacion\b/gi, "ecuación"],
    [/\bfraccion\b/gi, "fracción"],
    [/\bfuncion\b/gi, "función"],
    [/\bsolucion\b/gi, "solución"],
    [/\bdecision\b/gi, "decisión"],
    [/\bevolucion\b/gi, "evolución"],
    [/\brevolucion\b/gi, "revolución"],
    [/\bconstitucion\b/gi, "constitución"],
    [/\bgeografia\b/gi, "geografía"],
    [/\bmetodo\b/gi, "método"],
    [/\bteoria\b/gi, "teoría"],
    [/\blogica\b/gi, "lógica"],
    [/\bingles\b/gi, "inglés"],
    [/\bfotosintesis\b/gi, "fotosíntesis"],
    [/\brespiracion\b/gi, "respiración"],
    [/\breproduccion\b/gi, "reproducción"],
    [/\bnutricion\b/gi, "nutrición"],
    [/\bgenetica\b/gi, "genética"],
    [/\bgenetico\b/gi, "genético"],
    [/\bgenetica(s)\b/gi, "genéticas"],
    [/\bgeneticos\b/gi, "genéticos"],
    [/\batomo\b/gi, "átomo"],
    [/\batomos\b/gi, "átomos"],
    [/\bmolecula\b/gi, "molécula"],
    [/\bmoleculas\b/gi, "moléculas"],
    [/\boxigeno\b/gi, "oxígeno"],
    [/\bhidrogeno\b/gi, "hidrógeno"],
    [/\bnitrogeno\b/gi, "nitrógeno"],
    [/\bdioxido\b/gi, "dióxido"],
    [/\bacido\b/gi, "ácido"],
    [/\bacidos\b/gi, "ácidos"],
    [/\bbasico\b/gi, "básico"],
    [/\bbasica\b/gi, "básica"],
    [/\bbasicos\b/gi, "básicos"],
    [/\bbasicas\b/gi, "básicas"],
    [/\belectrico\b/gi, "eléctrico"],
    [/\belectrica\b/gi, "eléctrica"],
    [/\belectricos\b/gi, "eléctricos"],
    [/\belectricas\b/gi, "eléctricas"],
    [/\bmagnetico\b/gi, "magnético"],
    [/\bmagnetica\b/gi, "magnética"],
    [/\btermico\b/gi, "térmico"],
    [/\btermica\b/gi, "térmica"],
    [/\bfosforo\b/gi, "fósforo"],
    [/\bnucleo\b/gi, "núcleo"],
    [/\bnucleos\b/gi, "núcleos"],
    [/\batmosfera\b/gi, "atmósfera"],
    [/\bevaporacion\b/gi, "evaporación"],
    [/\bcondensacion\b/gi, "condensación"],
    [/\bprecipitacion\b/gi, "precipitación"],
    [/\babsorcion\b/gi, "absorción"],
    [/\boxidacion\b/gi, "oxidación"],
    [/\breduccion\b/gi, "reducción"],
    [/\bfenomeno\b/gi, "fenómeno"],
    [/\bfenomenos\b/gi, "fenómenos"],
    [/\bciudadania\b/gi, "ciudadanía"],
    [/\bmigracion\b/gi, "migración"],
    [/\burbanizacion\b/gi, "urbanización"],
    [/\bglobalizacion\b/gi, "globalización"],
    [/\bindustrializacion\b/gi, "industrialización"],
    [/\bcolonizacion\b/gi, "colonización"],
    [/\beconomia\b/gi, "economía"],
    [/\beconomico\b/gi, "económico"],
    [/\beconomica\b/gi, "económica"],
    [/\bpolitica\b/gi, "política"],
    [/\bgeopolitica\b/gi, "geopolítica"],
    [/\btambien\b/gi, "también"],
    [/\bademas\b/gi, "además"],
    [/\bdespues\b/gi, "después"],
    [/\bperiodo\b/gi, "período"],
    [/\bnumeros\b/gi, "números"],
    [/\bnumero\b/gi, "número"],
    [/\bpropositos\b/gi, "propósitos"],
    [/\bproposito\b/gi, "propósito"],
    [/\bfaciles\b/gi, "fáciles"],
    [/\bfacil\b/gi, "fácil"],
    [/\bdificiles\b/gi, "difíciles"],
    [/\bdificil\b/gi, "difícil"],
    [/\bcaracteristicas\b/gi, "características"],
    [/\bcaracteristica\b/gi, "característica"],
    [/\btecnicas\b/gi, "técnicas"],
    [/\btecnica\b/gi, "técnica"],
    [/\btecnologias\b/gi, "tecnologías"],
    [/\btecnologia\b/gi, "tecnología"],
    [/\bbiologicos\b/gi, "biológicos"],
    [/\bbiologico\b/gi, "biológico"],
    [/\bbiologicas\b/gi, "biológicas"],
    [/\bbiologica\b/gi, "biológica"],
    [/\bpoliticos\b/gi, "políticos"],
    [/\bpolitico\b/gi, "político"],
    [/\bpoliticas\b/gi, "políticas"],
    [/\bhistoricos\b/gi, "históricos"],
    [/\bhistorico\b/gi, "histórico"],
    [/\bhistoricas\b/gi, "históricas"],
    [/\bhistorica\b/gi, "histórica"],
    [/\bmaximos\b/gi, "máximos"],
    [/\bmaximo\b/gi, "máximo"],
    [/\bmaximas\b/gi, "máximas"],
    [/\bmaxima\b/gi, "máxima"],
    [/\bminimos\b/gi, "mínimos"],
    [/\bminimo\b/gi, "mínimo"],
    [/\bminimas\b/gi, "mínimas"],
    [/\bminima\b/gi, "mínima"],
  ];
  let normalized = value
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n");
  for (const [pattern, corrected] of corrections) {
    normalized = normalized.replace(pattern, (match) => (
      match[0] === match[0].toLocaleUpperCase("es-CO")
        ? corrected[0].toLocaleUpperCase("es-CO") + corrected.slice(1)
        : corrected
    ));
  }
  return normalized
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/([,;:!?])(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "$1 ")
    .replace(/([.!?])(?=[A-ZÁÉÍÓÚÜÑ])/g, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}
