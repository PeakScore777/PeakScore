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
  /\b(programar|programacion|programador|programadora|codificar|coding|programming|desarrollo de software|desarrollo web)\b/i,
  /\b(python|javascript|typescript|java|c\+\+|c#|html|css|react|next\.js|node\.js|sql|postgresql|supabase|git|github|terminal|powershell|bash|framework|api rest|codigo fuente|escribir codigo|depurar codigo|debuggear)\b/i,
  /\b(aprender|estudiar|ensename|ayudame|explicame|quiero aprender|me ensenas|me ayudas)\b.{0,80}\b(programar|programacion|python|javascript|typescript|java|codificar|crear una app|hacer una pagina web)\b/i,
  /\b(crear|hacer|construir|desarrollar|disenar)\s+(?:un|una|el|la)?\s*(?:sitio|pagina|web|app|aplicacion|software|programa|videojuego|juego digital|bot|robot virtual)\b/i,
  /\b(bucle|funcion en python|algoritmo informatico|consulta sql|console\.log|print\s*\(|def\s+\w+|import\s+\w+)\b/i,
];

const OUTSIDE_SCOPE_PATTERNS = [
  /\b(receta|recetas|cocinar|cocina|hornear|gastronomia)\b/i,
  /\b(diagnostico medico|recetar medicamento|tratamiento medico|medicamentos|sintomas de enfermedad)\b/i,
  /\b(invertir dinero|comprar acciones|criptomonedas|apuesta|apuestas|consejo legal|demanda judicial)\b/i,
];

const INJECTION_PATTERNS = [
  /\b(ignore|ignora|olvida)\b.{0,60}\b(instrucciones|reglas|restricciones|previous instructions|system prompt)\b/i,
  /\b(revela|muestra|imprime|exporta)\b.{0,60}\b(prompt del sistema|instrucciones internas|api.?key|secretos|credenciales|variables de entorno)\b/i,
  /\b(jailbreak|bypass|desactiva tus reglas|actua sin restricciones)\b/i,
];

export function preflightOrbyRequest(message: string): OrbyPreflightResult {
  const normalized = normalizeOrbyRequestText(message);
  if (!normalized) return { allowed: true, category: null, reply: "" };

  if (INJECTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "prompt_injection",
      reply: "No puedo cambiar mis reglas ni revelar información interna. Puedo ayudarte con la preparación para Saber 11.",
    };
  }

  if (PROGRAMMING_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      category: "programming",
      reply: "Soy Orby, el tutor de PeakScore especializado exclusivamente en Saber 11. No enseño programación ni desarrollo de software. Puedo ayudarte con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales o Inglés.",
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
