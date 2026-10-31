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
  /\b(variable|bucle|funcion en python|algoritmo informatico|consulta sql|console\.log|print\s*\(|def\s+\w+|import\s+\w+)\b/i,
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

  return text.includes(String.fromCharCode(96).repeat(3))
    || /\bconsole\.log\s*\(|\bfunction\s+[a-z_$][\w$]*\s*\(|\bconst\s+[a-z_$][\w$]*\s*=|\blet\s+[a-z_$][\w$]*\s*=|\bdef\s+[a-z_]\w*\s*\(|\bimport\s+(?:\w|{|\*)|\bSELECT\s+[\w* ,]+\s+FROM\s+\w+/i.test(text)
    || /\b(aqui tienes|escribe|copia|ejecuta|pega)\b.{0,70}\b(codigo|script|programa|comando)\b/i.test(value)
    || /\b(instala|configura|ejecuta)\b.{0,70}\b(python|node\.js|npm|react|visual studio code|terminal)\b/i.test(value);
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
