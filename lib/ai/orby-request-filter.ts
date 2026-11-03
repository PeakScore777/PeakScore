export type OrbyRequestCategory = "programming" | "outside" | "prompt_injection";

export type OrbyPreflightResult =
  | { allowed: true; category: null; reply: "" }
  | { allowed: false; category: OrbyRequestCategory; reply: string };

export function normalizeOrbyRequestText(value: string): string {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .trim();
}

const PROGRAMMING_REQUEST_PATTERNS = [
  // Match an explicit request to learn/use software tools, not a passing
  // mention of a programming term in a reading passage or scientific example.
  /\b(?:quiero aprender|ensename|ayudame a|explicame como|como puedo|como se usa|como usar|quiero usar|i want to learn|i would like to learn|i'd like to learn|teach me|help me|show me|how do i|how to|learn to)\b.{0,90}\b(?:programar|programacion|codificar|coding|programming|python|javascript|typescript|java|c\+\+|c#|html|css|react|next\.js|node\.js|sql|postgresql|supabase|git|github|powershell|bash|framework|api rest|crear una app|hacer una pagina web|write code|code)\b/i,
  /\b(?:programar|programacion|codificar|coding|programming|python|javascript|typescript|java|c\+\+|c#|html|css|react|next\.js|node\.js|sql|postgresql|supabase|git|github|powershell|bash|framework|api rest)\b.{0,90}\b(?:desde cero|tutorial|aprender|ensenar|ensename|ayudame|explicame|how to|teach me|learn|tutorial|build|create|debug|program)\b/i,
  /\b(?:teach me to code|learn to code|how to code|write code|coding tutorial|software development|web development|software engineering|app development|desarrollo de software|desarrollo web|escribir codigo|codigo fuente|depurar codigo|debuggear|debugging)\b/i,
  /\b(crear|hacer|construir|desarrollar|disenar|build|create|make|develop)\s+(?:un|una|el|la|a|an|the)?\s*(?:sitio|pagina|web|app|aplicacion|software|programa|videojuego|juego digital|bot|robot virtual|website|application|mobile app|software|game|bot)\b/i,
  /\b(?:como|how)\b.{0,55}\b(?:creo|crear|hago|hacer|construyo|construir|desarrollo|desarrollar|build|create|make|develop)\b.{0,45}\b(?:sitio|pagina|web|app|aplicacion|software|bot|website|application|programa)\b/i,
  /\b(mujhe|main|mai)\b.{0,50}\b(coding|programming|code|python|javascript)\b|\b(coding|programming|code|python)\b.{0,50}\b(sikhao|sikh[aou]|sikhna|karna|kaise)\b/i,
  /\b(apprendre a coder|apprendre a programmer|apprends?[- ]moi.{0,20}\b(?:a )?programmer|je veux apprendre a coder|je veux apprendre a programmer|coder|programmieren|programmierung|softwareentwicklung|webentwicklung|code schreiben|imparare a programmare|scrivere codice|sviluppo software|sviluppo web|ensina[- ]me.{0,20}(?:a programar|programacao)|quero aprender a programar|escrever codigo|desenvolvimento de software|desenvolvimento web)\b/i,
  /\b(bucle|funcion en python|algoritmo informatico|consulta sql|console\.log|print\s*\(|def\s+\w+|import\s+\w+)\b/i,
];

const OUTSIDE_SCOPE_PATTERNS = [
  // Cooking requests in Spanish, English and common Latin-script variants.
  /\b(receta|recetas|cocinar|cocina|hornear|gastronomia|cook|cooking|recipe|recipes|bake|baking|cuisine|food preparation|recette|recettes|cuisiner|cozinhar|receita|receitas|cucinare|ricetta|ricette|kochen|kocht|kochst|gekocht|rezept|rezepte)\b/i,
  /\b(khana banana|khana pakana|mujhe khana|recipe do|recipe batao|khana banane)\b/i,
  /\b(diagnostico medico|recetar medicamento|tratamiento medico|medicamentos|sintomas de enfermedad|medical diagnosis|prescribe medication|medical treatment)\b/i,
  /\b(invertir dinero|comprar acciones|criptomonedas|apuesta|apuestas|consejo legal|demanda judicial)\b/i,
  /\b(?:carros?|automoviles?|vehiculos?|llantas?|mantenimiento de vehiculos|mecanica automotriz|motos?|peliculas?|series de television|videojuegos?|chistes?|clima de manana|pronostico del tiempo)\b/i,
  /\b(?:cars?|automobiles?|vehicles?|tires?|tyres?|flat tire|car maintenance|car repair|motorcycles?)\b/i,
  /\b(?:movies?|films?|tv shows?|television series|video games?|gaming|jokes?|weather|forecast)\b/i,
  /\b(?:what should i eat|meal plan|restaurant|breakfast|lunch|dinner|snack)\b/i,
];

/**
 * Positive scope allowlist. A request must mention an ICFES area, an exam
 * competency, or a recognizable curricular concept. Unknown subjects fail
 * closed instead of being sent to a general-purpose model.
 */
const ICFES_EXAM_REFERENCE_PATTERN = /\b(?:saber\s*11|icfes|prueba de estado|examen de estado)\b/i;
const ICFES_EXAM_LEARNING_INTENT_PATTERN = /\b(?:pregunta|preguntas|ejercicio|ejercicios|contenido|contenidos|tema|temas|competencia|competencias|componente|componentes|simulacro|cuadernillo|estructura|formato|areas|preparar|preparacion|estudiar|estudio|aprender|repasar|practicar|practica|resolver|resuelve|explicar|explica|explicame|evaluar|evalua|evaluan|que es|que son|what is|what are|what does|assess|evaluate|prepare|preparation|study|learn|practice|question|questions|exercise|exercises|topics|competencies|structure|format)\b/i;

const ICFES_SCOPE_PATTERNS = [
  /\b(?:pregunta tipo icfes|simulacro(?: de saber\s*11| del icfes)?|cuadernillo de preguntas)\b/i,
  /\b(?:matematicas?|algebra|aritmetica|geometria|trigonometria|probabilidad|estadistica|ecuacion(?:es)?|inecuacion(?:es)?|fracciones?|porcentajes?|razones y proporciones|proporcionalidad|funcion lineal|funcion cuadratica|plano cartesiano|pendiente de una recta|polinomios?|logaritmos?|potencias?|raiz cuadrada|teorema de pitagoras|perimetro|area de un triangulo|volumen de un|media aritmetica|mediana|moda estadistica|secuencia numerica|sucesion numerica|variable independiente|variable dependiente)\b/i,
  /\b(?:lectura critica|comprension lectora|comprension de textos|texto argumentativo|intencion del autor|idea principal|tesis del texto|argumento central|inferir|inferencia|conclusion del texto|conectores logicos|parrafo|narrador|figura retorica|figura literaria|genero textual|proposito comunicativo|punto de vista del autor|postura del autor|analisis de texto)\b/i,
  /\b(?:sociales y ciudadanas|ciencias sociales|historia de colombia|historia universal|geografia|democracia|constitucion politica|derechos humanos|ciudadania|estado colombiano|ramas del poder|participacion politica|conflicto armado|guerra fria|independencia de colombia|colonizacion|revolucion francesa|revolucion industrial|globalizacion|oferta y demanda|desigualdad social|migracion|territorio colombiano|desarrollo sostenible|organizacion del estado|centralismo|federalismo|poder ejecutivo|poder legislativo|poder judicial|sistema politico)\b/i,
  /\b(?:ciencias naturales|fisica|quimica|biologia|celula|ecosistema|genetica|fotosintesis|respiracion celular|evolucion biologica|seleccion natural|reaccion quimica|atomo|molecula|tabla periodica|enlace quimico|energia|fuerza|densidad|termodinamica|materia|presion atmosferica|velocidad terminal|leyes de newton|circuito electrico|electricidad|magnetismo|ondas sonoras|acido|base|escala de ph|variable independiente|variable dependiente|variable de control|experimento|hipotesis|metodo cientifico|contaminacion|cambio climatico|biodiversidad|cadena alimentaria)\b/i,
  /\b(?:ingles|english|reading comprehension|vocabulary in context|grammar|present simple|past simple|past continuous|present perfect|modal verbs|phrasal verbs|verb tenses|part [1-7] of the icfes|parte [1-7] del examen de ingles|avisos? publicitarios?|dialogos en ingles|comprension de lectura en ingles)\b/i,
];

const ICFES_CURRICULUM_CONTEXT_PATTERNS = ICFES_SCOPE_PATTERNS.slice(1);

// A study invitation is valid context even before a specific subject or concept
// has been named (for example, Orby asking "¿Qué tema de Saber 11 quieres trabajar?").
const ORBY_STUDY_INVITATION_PATTERN =
  /\b(?:que tema|que area|que quieres estudiar|que te gustaria estudiar|por donde empezamos|con que empezamos|elige un tema|elige un area)\b.{0,100}\b(?:saber\s*11|icfes|estudiar|trabajar|repasar|practicar|empezar)\b/i;

const STUDY_GUIDANCE_FOLLOW_UP_PATTERNS = [
  /^(?:no se|no lo se|ni idea|no tengo claro|no se que (?:estudiar|tema|area)|ayudame a elegir|ayudame a decidir|por donde empiezo|no se por donde empezar|que me recomiendas para empezar|elige por mi)[.!? ]*$/i,
];

const SHORT_ACADEMIC_FOLLOW_UP_PATTERNS = [
  /^(?:y )?(?:por que|como asi|que significa|que quiere decir|explicame mas|explica mas|amplia la explicacion|no entiendo|no comprendi|puedes repetir|repite por favor|dame otro ejemplo|otro ejemplo|un ejemplo mas|continua|continua por favor|siguiente|sigamos|y eso|y ese|y esa|cual es la respuesta|la opcion [a-d]|opcion [a-d]|la [a-d]|respuesta [a-d]|el siguiente paso)[.!? ]*$/i,
  ...STUDY_GUIDANCE_FOLLOW_UP_PATTERNS,
  /^(?:si|no|ok|vale|listo|entiendo|de acuerdo)[.!? ]*$/i,
];

export const ORBY_ICFES_SCOPE_REPLY =
  "Esa solicitud no corresponde a los contenidos de Saber 11. Soy Orby, tutor de PeakScore, y solo puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés del ICFES. Elige un tema de una de esas áreas y seguimos.";

const EXTERNAL_PREICFES_REQUEST_PATTERNS = [
  /\bgrupo\s*500\b/i,
  /\bmilton\s+ochoa\b|\binstruimos\b|\bpreicfes\s*\.\s*net\b/i,
  /\b(?:otro|otra|otros|otras|mejor|mejores|recomiend[ae]|recomendar|compara|comparar|comparame|compare|opiniones|reseñas|precios|inscribirme|matricularme)\b.{0,70}\b(?:pre[\s-]?icfes|pre[\s-]?saber|academias?|institutos?|plataformas?|cursos?)\b/i,
  /\b(?:pre[\s-]?icfes|pre[\s-]?saber|academia|instituto|plataforma|curso)\b.{0,70}\b(?:recomiend[ae]|recomendar|mejor|mejores|compara|comparar|compare|opiniones|reseñas|precios|inscribirme|matricularme|promociona)\b/i,
];

export const ORBY_EXTERNAL_PREICFES_REPLY =
  "Orby se dedica exclusivamente a la preparación para Saber 11 dentro de PeakScore. No recomiendo, comparo ni promociono academias o plataformas externas. Puedo ayudarte a estudiar cualquiera de las cinco áreas del ICFES.";

export const ORBY_ICFES_ENGLISH_INTRO_REPLY =
  "¡Claro! Vamos a estudiar el componente de Inglés de Saber 11, no una conversación general en inglés. Practicaremos comprensión de textos, avisos y diálogos, vocabulario en contexto e interpretación de la intención comunicativa. Te explicaré en español y usaremos ejercicios originales tipo ICFES. ¿Empezamos con una pregunta de práctica?";

export const ORBY_GREETING_REPLY =
  "¡Aquí estoy! Soy Orby, tu tutor de PeakScore. ¿Qué tema de Saber 11 quieres trabajar?";

export const ORBY_STUDY_GUIDANCE_REPLY =
  "No pasa nada. Te recomiendo empezar por Ciencias Naturales con la fotosíntesis: es un tema visual y nos permite practicar cómo interpretar información y conceptos. También podemos hacer un diagnóstico corto para descubrir qué área necesitas reforzar. ¿Empezamos con fotosíntesis?";

export const ORBY_SPANISH_ONLY_REPLY =
  "No alcancé a reconocer tu frase en español. ¿Puedes repetirla, por favor?";

export const ORBY_SPANISH_OUTPUT_FALLBACK =
  "Quiero explicártelo correctamente en español. Repite tu pregunta en una frase breve y continuamos con tu preparación para Saber 11.";

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

export function isOrbyGreetingRequest(message: string): boolean {
  const normalized = normalizeOrbyRequestText(message).replace(/[¿?¡!.,;:]+/g, "").trim();
  if (!normalized || normalized.length > 48) return false;
  return /^(?:(?:oye|oe|ey|hey) )?orby(?: ai)?$/.test(normalized)
    || /^(?:hola|holi|buenas|buenos dias|buenas tardes|buenas noches|que mas|como estas|como vas|todo bien|saludos|hey|hello|hi)(?: bro| hermano| hermanito| orby)?$/.test(normalized);
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

function isScopeRefusalContext(value: string): boolean {
  return /\b(?:fuera del alcance|no corresponde a los contenidos|no puedo ayudarte con esa solicitud|no puedo trabajar ese tema|esa solicitud esta fuera)\b/i.test(
    normalizeOrbyRequestText(value),
  );
}

/**
 * The only non-explicit allowance is a short follow-up to a recent, clearly
 * curricular exchange. Greeting and identity turns remain deterministic UX
 * exceptions; conversation history can never turn an unrelated topic green.
 */
export function isIcfesScopedRequest(message: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(message)
    .replace(/^[¿¡\s]+/, "")
    .replace(/[?!.;:, \s]+$/, "")
    .trim();
  if (!normalized) return false;
  if (isOrbyGreetingRequest(message) || isGenericIcfesEnglishRequest(message)) return true;
  if (/^(?:quien eres|quien te creo|quien es tu creador|who created you|who made you)[.!? ]*$/i.test(normalized)) return true;
  if (ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;
  if (ICFES_EXAM_REFERENCE_PATTERN.test(normalized) && ICFES_EXAM_LEARNING_INTENT_PATTERN.test(normalized)) return true;

  const isShortFollowUp = normalized.length <= 90
    && SHORT_ACADEMIC_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalized));
  const isEducationalAsk = /^(?:que es|que son|define|explicame|como funciona|como se resuelve|por que|cual es|cuales son|diferencia entre|que significa|analiza|compara|resuelve|ayudame con|quiero entender|no entiendo|puedes explicar|me explicas)\b/i.test(normalized);
  if ((!isShortFollowUp && !isEducationalAsk) || !previousContext.trim() || isScopeRefusalContext(previousContext)) return false;
  const prior = normalizeOrbyRequestText(previousContext);
  const hasCurriculumContext = ICFES_CURRICULUM_CONTEXT_PATTERNS.some((pattern) => pattern.test(prior))
    || ORBY_STUDY_INVITATION_PATTERN.test(prior);
  return hasCurriculumContext;
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
const NON_ICFES_REQUEST_PATTERNS = [
  // A standalone topic or a direct unrelated request is out of scope.
  // A passing word inside a reading passage, graph, example or exam question
  // is not sufficient to block a valid ICFES exercise.
  /^(?:carros?|automoviles?|vehiculos?|llantas?|motos?|peliculas?|series|videojuegos?|juegos?|chistes?|clima|weather|forecast)[.!? ]*$/i,
  /\b(?:que te gustaria saber|que quieres saber|hablame de|cuentame sobre)\b.{0,80}\b(?:carros?|automoviles?|vehiculos?|motos?|peliculas?|series|videojuegos?)\b/i,
  /\b(?:que pelicula me recomiendas|recomiendame (?:una )?pelicula|que serie me recomiendas|cuentame un chiste|tell me a joke|what movie should i watch|which movie should i watch|what show should i watch|what should i watch)\b/i,
  /\b(?:recomiendame|recomiendas|recomiendes|recommend|which|what)\b.{0,60}\b(?:peliculas?|series|videojuegos?|juegos|movie|movies|film|films|show|shows|game|games|carros?|autos?|automoviles?|vehiculos?)\b/i,
  /\b(?:se me pincho|se pincho|mi carro|mi vehiculo|mi moto|cambiar|arreglar|reparar|comprar|elegir|que modelo|which car|what car|buy a car|flat tire|car repair|car maintenance|mantenimiento de)\b.{0,90}\b(?:llantas?|carros?|automoviles?|vehiculos?|motos?|tires?|tyres?|car|vehicle)\b|\b(?:which car|what car|what vehicle|what motorcycle)\b.{0,60}\b(?:buy|should|recommend|choose)\b/i,
  /\b(?:which car|what car|which vehicle|what vehicle|what motorcycle)\b.{0,90}\b(?:buy|should|recommend|choose)\b/i,
  /\b(?:dame|hazme|quiero|necesito|busco|comparte|comparteme|ensename|como preparo|como hago|como cocino|preparar|cocinar|hornear|give me|make me|share|teach me|how to cook|how do i make|what should i eat)\b.{0,90}\b(?:receta|recetas|arepa|arepas|pan|torta|pastel|pasta|comida|recipe|recipes|cake|food|meal|cook|cooking|bake|baking)\b|\b(?:recipe|receta|recetas)\b.{0,90}\b(?:para|for|de|of|cook|cocinar|prepare|hacer|preparar)\b/i,
  /\b(?:vogli(?:o|amo)|je veux|quero|quiero|ich mochte|ich möchte)\b.{0,50}\b(?:una? )?(?:ricetta|ricette|receita|receitas|recette|recettes|rezept|rezepte)\b|\b(?:voglio una ricetta|voulez une recette|quero uma receita)\b/i,
  /\b(?:what should i eat|what to eat|que debo comer|que deberia comer)\b/i,
  /\b(?:que hago|que puedo tomar|que medicamento|que deberia tomar|tengo fiebre|me duele|what should i do|what medicine|medical diagnosis|prescribe|my symptoms)\b.{0,90}\b(?:fiebre|dolor|sintomas?|medicamento|medicina|enfermedad|fever|pain|symptoms?|medicine|medication)\b|\b(?:fiebre|fever|pain|symptoms?)\b.{0,70}\b(?:what should i do|que hago|what medicine|que medicamento)\b/i,
  /\b(?:invertir dinero|donde invertir|que accion comprar|recomiendame acciones|criptomonedas|apuestas?|consejo legal|demanda judicial|contratar un abogado|how to invest|which stock|crypto advice|legal advice|file a lawsuit)\b/i,
  /\b(?:cual es el clima|clima de manana|pronostico del tiempo|que tiempo hara|weather today|weather tomorrow|how is the weather|what is the weather|what's the weather|weather on|forecast|will it rain)\b/i,
];

export function containsExplicitNonIcfesTopic(value: string): boolean {
  const normalized = normalizeOrbyRequestText(value);
  if (!normalized) return false;
  if (/\b(?:fuera del alcance|no corresponde a los contenidos|no puedo ayudarte con esa solicitud|no puedo trabajar ese tema|esa solicitud esta fuera|solo puedo ayudarte con las cinco areas|no puedo ensenar cocina|no puedo compartir recetas|no enseno cocina|no doy clases de cocina)\b/i.test(normalized)) {
    return false;
  }
  return NON_ICFES_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Previous assistant text is trusted as context only when the exchange itself
 * is anchored to a curriculum concept and is not a deterministic refusal. */
export function isIcfesScopedAssistantTurn(message: string, previousContext = ""): boolean {
  const normalized = normalizeOrbyRequestText(message);
  if (
    !normalized
    || isScopeRefusalContext(normalized)
    || containsExplicitNonIcfesTopic(normalized)
  ) return false;
  if (ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;
  const prior = normalizeOrbyRequestText(previousContext);
  return Boolean(prior) && ICFES_SCOPE_PATTERNS.some((pattern) => pattern.test(prior));
}

export function preflightOrbyRequest(message: string, previousContext = ""): OrbyPreflightResult {
  const normalized = normalizeOrbyRequestText(message);
  if (!normalized) return { allowed: true, category: null, reply: "" };

  if (containsOrbyPromptInjection(normalized)) {
    return {
      allowed: false,
      category: "prompt_injection",
      reply: "No puedo cambiar mis reglas ni revelar información interna. Puedo ayudarte con la preparación para Saber 11.",
    };
  }

  if (EXTERNAL_PREICFES_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "outside",
      reply: ORBY_EXTERNAL_PREICFES_REPLY,
    };
  }

  if (PROGRAMMING_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "programming",
      reply: "Ese tema no lo trabajo aquí; mi función es ayudarte con Saber 11. Podemos seguir con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés. ¿Cuál prefieres?",
    };
  }

  if (containsExplicitNonIcfesTopic(normalized)) {
    return {
      allowed: false,
      category: "outside",
      reply: ORBY_ICFES_SCOPE_REPLY,
    };
  }

  if (!isIcfesScopedRequest(normalized, previousContext)) {
    return { allowed: false, category: "outside", reply: ORBY_ICFES_SCOPE_REPLY };
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
export function containsProgrammingInstruction(text: string): boolean {
  const value = normalizeOrbyRequestText(text);
  if (!value) return false;

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

export function containsCookingInstruction(text: string): boolean {
  const value = normalizeOrbyRequestText(text);
  if (!value) return false;
  const explicitRefusal = /\b(?:no (?:puedo|voy a|debo) (?:ensenar|explicar|compartir|dar)|no enseno|no doy clases de|fuera del alcance|mi funcion es preparar|no puedo ayudarte con)\b.{0,100}\b(?:cocina|cocinar|receta|recetas|cooking|cook|recipe|recipes|baking)\b/i.test(value);
  if (explicitRefusal) return false;
  return /\b(?:aqui tienes|te comparto|te doy|puedes preparar|para preparar|prepara|cocina|cocinar|hornea|a recipe for|here is a recipe|how to cook|teach you to cook|share a recipe|je peux partager|ich zeige dir|voglio una ricetta|dammi una ricetta|give me a recipe|dame una receta)\b.{0,90}\b(?:receta|recetas|arepa|arepas|pan|torta|pastel|pasta|recipe|recipes|cake|food|meal|cook|cooking|bake|baking|kochen|gateau|ricetta|receita|recette|rezept)\b|\b(?:recipe for|a recipe|recette de|una receta de|ricetta per|ricetta di|ricetta|receita de|rezept fur)\b|\b(?:ich zeige dir|ich kann dir zeigen)\b.{0,70}\b(?:kochen|kocht|kochst|backen|backt)\b/i.test(value);
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
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/([,;:!?])(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "$1 ")
    .replace(/([.!?])(?=[A-ZÁÉÍÓÚÜÑ])/g, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}
