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
  // Spanish, English and common transliterated requests. Foreign scripts are
  // rejected separately; these patterns cover users who transliterate them.
  /\b(programar|programacion|programador|programadora|codificar|coding|programming|desarrollo de software|desarrollo web|software development|web development|software engineering|programming language|learn to code|teach me to code|how to code|write code|coding tutorial|app development)\b/i,
  /\b(python|javascript|typescript|java|c\+\+|c#|html|css|react|next\.js|node\.js|sql|postgresql|supabase|git|github|powershell|bash|framework|api rest|codigo fuente|escribir codigo|depurar codigo|debuggear)\b/i,
  /\b(aprender|estudiar|ensename|ayudame|explicame|quiero aprender|me ensenas|me ayudas|teach me|learn|show me|help me)\b.{0,80}\b(programar|programacion|python|javascript|typescript|java|codificar|coding|programming|code|crear una app|hacer una pagina web)\b/i,
  /\b(crear|hacer|construir|desarrollar|disenar|build|create|make|develop)\s+(?:un|una|el|la|a|an|the)?\s*(?:sitio|pagina|web|app|aplicacion|software|programa|videojuego|juego digital|bot|robot virtual|website|application|mobile app|software|game|bot)\b/i,
  /\b(mujhe|main|mai)\b.{0,50}\b(coding|programming|code|python|javascript)\b|\b(coding|programming|code|python)\b.{0,50}\b(sikhao|sikh[aou]|sikhna|karna|kaise)\b/i,
  // French, Portuguese, German and Italian variants. Accents are removed
  // before matching by normalizeOrbyRequestText.
  /\b(apprendre a coder|apprendre a programmer|coder|programmieren|programmierung|softwareentwicklung|webentwicklung|code schreiben|imparare a programmare|scrivere codice|sviluppo software|sviluppo web|ensina me a programar|ensina me programacao|quero aprender a programar|escrever codigo|desenvolvimento de software|desenvolvimento web)\b/i,
  /\b(bucle|funcion en python|algoritmo informatico|consulta sql|console\.log|print\s*\(|def\s+\w+|import\s+\w+)\b/i,
];

const OUTSIDE_SCOPE_PATTERNS = [
  // Cooking requests in Spanish, English and common Latin-script variants.
  /\b(receta|recetas|cocinar|cocina|hornear|gastronomia|cook|cooking|recipe|recipes|bake|baking|cuisine|food preparation|recette|recettes|cuisiner|cozinhar|receita|receitas|cucinare|ricetta|ricette|kochen|rezept|rezepte)\b/i,
  /\b(khana banana|khana pakana|mujhe khana|recipe do|recipe batao|khana banane)\b/i,
  /\b(diagnostico medico|recetar medicamento|tratamiento medico|medicamentos|sintomas de enfermedad|medical diagnosis|prescribe medication|medical treatment)\b/i,
  /\b(invertir dinero|comprar acciones|criptomonedas|apuesta|apuestas|consejo legal|demanda judicial)\b/i,
];

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
  if (!value || value.length < 12) return false;

  const normalized = normalizeOrbyRequestText(value);
  const words = normalized.match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  if (words.length < 3) return false;

  // Use distinctive Spanish markers rather than shared Romance-language
  // articles/prepositions (for example "la", "de", "que", "una").
  const spanishSignals = /\b(?:puedo|puedes|podemos|vamos|tema|estudiar|explicar|explicame|respuesta|pregunta|saber|prueba|ingles|porque|tambien|esta|estan|estoy|somos|eres|soy|quieres|necesitas|debes|deberias|cual|cuando|donde|primero|segundo|tercero|correcta|opcion|lectura|matematicas|ciencias|sociales|ciudadanas|colombia|icfes|estudiante|profesor|tutor)\b/.test(normalized)
    || /[áíóúñ¿¡]/i.test(value);

  if (spanishSignals) return false;

  const foreignLanguageSignals = [
    /\b(?:bonjour|comment|puis|je|vous|nous|avec|pour|dans|une|des|est|sont|pouvez|aider|expliquer|apprendre|aujourd|merci|votre|mais|parce|cette|cela|voici)\b/g,
    /\b(?:ol[aá]|voce|voces|você|vocês|posso|podemos|ajudar|explicar|estudar|hoje|obrigado|obrigada|porque|como|qual|este|esta|estao|estão|nao|não|mas|tambem|também|muito|para|com|uma|umas|uns)\b/g,
    /\b(?:hallo|guten|morgen|natürlich|ich|du|sie|wir|ist|sind|mit|für|auf|wie|was|warum|kann|können|helfen|erklären|lernen|heute|bitte|nicht|eine|einer|aber|oder|auch)\b/g,
    /\b(?:ciao|buongiorno|posso|siamo|aiutare|spiegare|studiare|oggi|come|quale|questo|questa|grazie|anche|perche|perché|sono|della|degli|delle|con|non|ma|molto|vorrei)\b/g,
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

export function preflightOrbyRequest(message: string): OrbyPreflightResult {
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

  if (OUTSIDE_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "outside",
      reply: "Esa solicitud está fuera del alcance de Orby. Mi función es acompañarte en la preparación para Saber 11. Podemos trabajar Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés.",
    };
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
  const explicitRefusal = /\b(?:no (?:puedo|voy a|debo) (?:ensenar|explicar|compartir|dar)|no enseno|no doy clases de|fuera del alcance|mi funcion es preparar|no puedo ayudarte con)\b.{0,80}\b(?:cocina|cocinar|receta|recetas|cooking|cook|recipe|recipes|baking)\b/i.test(value);
  if (explicitRefusal) return false;
  return OUTSIDE_SCOPE_PATTERNS[0].test(value);
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
