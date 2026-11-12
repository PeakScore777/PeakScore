import "server-only";

export const ICFES_SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
] as const;

export type IcfesSubject = (typeof ICFES_SUBJECTS)[number];

export type IcfesPedagogyProfile = {
  subject: IcfesSubject;
  purpose: string;
  reasoningRoutine: readonly string[];
  boardPriorities: readonly string[];
  commonRisks: readonly string[];
  feedbackFocus: string;
};

/**
 * Subject-specific teaching contract grounded in the current ICFES Saber 11
 * orientation and subject reference frameworks. This is guidance, not a
 * fabricated exhaustive list of official evidences or question quotas.
 */
const ICFES_PEDAGOGY_PROFILES: Record<IcfesSubject, Omit<IcfesPedagogyProfile, "subject">> = {
  "Matemáticas": {
    purpose: "interpretar información, formular y ejecutar estrategias para resolver problemas, y justificar procedimientos matemáticos en contextos variados",
    reasoningRoutine: [
      "identificar contexto, datos, incógnita y restricciones",
      "traducir la situación a representaciones numéricas, algebraicas, geométricas, gráficas o tabulares",
      "seleccionar y justificar la estrategia; desarrollar operaciones mostrando pasos y unidades",
      "interpretar el resultado dentro del contexto y comprobar orden de magnitud, dominio y coherencia",
    ],
    boardPriorities: ["datos e incógnita", "representación y fórmula pertinente", "operaciones paso a paso", "gráfica con ejes y unidades", "comprobación contextual"],
    commonRisks: ["aplicar una fórmula sin justificar su pertinencia", "confundir variable independiente y dependiente", "leer escalas o unidades incorrectamente", "dar un resultado numérico sin interpretarlo"],
    feedbackFocus: "ubica el primer paso donde se rompe la estrategia, distingue error conceptual de aritmético y propone una pista antes de revelar toda la solución",
  },
  "Lectura Crítica": {
    purpose: "identificar y ubicar información local, relacionar e interpretar información, y evaluar y reflexionar sobre la forma y el contenido de textos continuos y discontinuos",
    reasoningRoutine: [
      "reconocer tipo de texto, situación comunicativa, tema y propósito",
      "localizar la evidencia textual exacta relevante",
      "inferir relaciones entre partes, voces, tesis, supuestos y conclusiones sin exceder lo que permite el texto",
      "evaluar la opción frente a la evidencia y explicar por qué los distractores agregan, contradicen o deforman información",
    ],
    boardPriorities: ["fragmento textual breve", "tesis o idea central", "evidencia subrayada", "relación entre afirmación e inferencia", "comparación de distractores"],
    commonRisks: ["responder desde opinión personal y no desde el texto", "confundir tema con tesis", "tratar una inferencia plausible como información explícita", "ignorar propósito, tono o estructura"],
    feedbackFocus: "pide justificar cada interpretación con una pista del texto y enseña a descartar opciones con evidencia, no por intuición",
  },
  "Sociales y Ciudadanas": {
    purpose: "comprender fenómenos sociales desde perspectivas de las ciencias sociales y analizar situaciones de ciudadanía, convivencia, participación y organización política",
    reasoningRoutine: [
      "ubicar actores, espacio, periodo y contexto sin anacronismos",
      "distinguir hechos, interpretaciones, intereses y fuentes",
      "relacionar causas, consecuencias, continuidades, cambios y escalas territoriales",
      "contrastar perspectivas y analizar derechos, principios constitucionales e instituciones cuando sean pertinentes",
      "sustentar la conclusión con información del caso y evitar juicios descontextualizados",
    ],
    boardPriorities: ["línea de tiempo o mapa conceptual", "actores e intereses", "cadena causal", "perspectivas contrastadas", "institución, derecho o principio pertinente"],
    commonRisks: ["anacronismo", "confundir causa con consecuencia", "generalizar un proceso a todos los territorios", "reducir conflictos a una sola perspectiva", "confundir opinión con evidencia"],
    feedbackFocus: "solicita contexto y perspectiva omitidos, y muestra cómo cambian las conclusiones según la evidencia disponible",
  },
  "Ciencias Naturales": {
    purpose: "usar conceptos científicos para explicar fenómenos, comprender sistemas vivos, físicos y químicos, e indagar a partir de observaciones, patrones y datos",
    reasoningRoutine: [
      "identificar fenómeno, sistema y pregunta investigable",
      "definir variables independiente, dependiente y de control cuando aplique",
      "conectar mecanismo o modelo científico con observaciones y datos",
      "leer tablas, gráficas, unidades y patrones; distinguir asociación de causalidad",
      "evaluar diseño experimental, limitaciones y conclusión respaldada por evidencia",
    ],
    boardPriorities: ["modelo o mecanismo", "variables y controles", "tabla/gráfica con unidades", "secuencia causal", "conclusión y límites de evidencia"],
    commonRisks: ["confundir correlación con causalidad", "alterar variables de control", "concluir más de lo que muestran los datos", "mezclar modelos esquemáticos con observaciones reales"],
    feedbackFocus: "separa conocimiento conceptual, lectura de datos y diseño experimental para localizar con precisión la dificultad",
  },
  "Inglés": {
    purpose: "comprender y usar inglés en contextos comunicativos; interpretar avisos, mensajes, diálogos y textos según propósito, vocabulario y contexto",
    reasoningRoutine: [
      "identificar situación, interlocutores, propósito y tipo de texto",
      "usar contexto y cognados con cautela para inferir vocabulario",
      "analizar referencias, conectores, estructuras gramaticales y coherencia",
      "contrastar cada opción con las pistas del texto o diálogo",
      "explicar la estrategia en español y conservar en inglés solo el material que el ejercicio requiera",
    ],
    boardPriorities: ["contexto comunicativo", "palabra o expresión en contexto", "conector/referencia", "pista textual", "razón para elegir la opción"],
    commonRisks: ["traducir palabra por palabra", "elegir por parecido léxico sin contexto", "confundir tiempo verbal con intención comunicativa", "responder sin revisar concordancia o cohesión"],
    feedbackFocus: "explica en español la pista que resuelve el ítem, ofrece una reformulación breve en inglés y adapta el vocabulario al nivel observado",
  },
};

export function getIcfesPedagogyProfile(value: unknown): IcfesPedagogyProfile | null {
  const subject = normalizeIcfesSubject(value);
  if (!subject) return null;
  const profile = ICFES_PEDAGOGY_PROFILES[subject];
  return { subject, ...profile };
}


export type IcfesLearningDiagnostic = {
  reviewed: number;
  priorityConcepts: string[];
  strengths: string[];
  repeatedMisconceptions: string[];
  recommendedApproach: "reteach" | "guided_practice" | "challenge" | "diagnose";
};

/** Summarize only high-confidence persisted signals; missing evidence is not mastery. */
export function summarizeIcfesLearningSignals(rawSignals: unknown, minimumConfidence = 0.8): IcfesLearningDiagnostic {
  if (!Array.isArray(rawSignals)) return { reviewed: 0, priorityConcepts: [], strengths: [], repeatedMisconceptions: [], recommendedApproach: "diagnose" };
  const valid = rawSignals.flatMap((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const concept = typeof item.concept === "string" ? item.concept.trim().slice(0, 140) : "";
    const state = typeof item.learning_state === "string" ? item.learning_state : "needs_review";
    const confidence = typeof item.confidence === "number" && Number.isFinite(item.confidence) ? item.confidence : 0;
    if (!concept || confidence < minimumConfidence || confidence > 1) return [];
    const misconception = typeof item.misconception === "string" ? item.misconception.trim().slice(0, 180) : "";
    return [{ concept, state, misconception }];
  });
  const priorityConcepts = [...new Set(valid.filter((item) => ["needs_review", "misunderstood", "developing"].includes(item.state)).map((item) => item.concept))].slice(0, 5);
  const strengths = [...new Set(valid.filter((item) => ["mastered", "secure", "understood"].includes(item.state)).map((item) => item.concept))].slice(0, 5);
  const counts = new Map<string, number>();
  for (const item of valid) if (item.misconception) counts.set(item.misconception, (counts.get(item.misconception) ?? 0) + 1);
  const repeatedMisconceptions = [...counts].filter(([, count]) => count >= 2).map(([text]) => text).slice(0, 3);
  const recommendedApproach = priorityConcepts.length ? "reteach" : strengths.length ? "challenge" : valid.length ? "guided_practice" : "diagnose";
  return { reviewed: valid.length, priorityConcepts, strengths, repeatedMisconceptions, recommendedApproach };
}


export function buildIcfesAdaptiveTeachingDirective(diagnostic: IcfesLearningDiagnostic): string {
  const priority = diagnostic.priorityConcepts.slice(0, 3);
  const strengths = diagnostic.strengths.slice(0, 3);
  const repeated = diagnostic.repeatedMisconceptions.slice(0, 2);
  if (!diagnostic.reviewed) return "";
  const lines = [
    "ADAPTACIÓN PEDAGÓGICA BASADA EN EVIDENCIA:",
    priority.length ? "Prioriza una comprobación breve y luego reenseña, con un ejemplo nuevo, estos conceptos: " + priority.join("; ") + "." : "",
    strengths.length ? "No repitas una explicación básica de lo que ya aparece como fortaleza; úsalo como punto de apoyo: " + strengths.join("; ") + "." : "",
    repeated.length ? "Comprueba con una pregunta diagnóstica si persiste esta confusión antes de corregirla: " + repeated.join("; ") + "." : "",
    diagnostic.recommendedApproach === "challenge" ? "Si el estudiante confirma dominio con una respuesta razonada, propón un reto de transferencia de dificultad moderadamente mayor." : "",
    diagnostic.recommendedApproach === "guided_practice" ? "Guía la práctica con una pista por vez y solicita que el estudiante explique el siguiente paso." : "",
    diagnostic.recommendedApproach === "reteach" ? "No reveles inmediatamente la solución completa: localiza el primer paso incorrecto, da una pista y vuelve a comprobar la comprensión con un ítem original." : "",
    "Estas señales son evidencia histórica parcial, no un diagnóstico infalible. Verifica la comprensión actual en la conversación; permite que el desempeño nuevo corrija la hipótesis y nunca afirmes que el estudiante domina o desconoce algo sin comprobarlo.",
  ];
  return lines.filter(Boolean).join(" ");
}

export function buildIcfesPedagogyInstruction(value: unknown): string {
  const profile = getIcfesPedagogyProfile(value);
  if (!profile) return "";
  return [
    `PERFIL PEDAGÓGICO ACTIVO — ${profile.subject}:`,
    `Propósito: ${profile.purpose}.`,
    `Secuencia de razonamiento: ${profile.reasoningRoutine.map((item, index) => `${index + 1}) ${item}`).join("; ")}.`,
    `Prioridades de pizarra: ${profile.boardPriorities.join("; ")}.`,
    `Errores frecuentes que debes vigilar: ${profile.commonRisks.join("; ")}.`,
    `Retroalimentación: ${profile.feedbackFocus}.`,
    "Selecciona solo los pasos pertinentes a la pregunta; no conviertas esta secuencia en una plantilla rígida. No inventes afirmaciones, evidencias, porcentajes ni distribuciones oficiales de preguntas. Si el estudiante cambia de materia, cambia también el perfil.",
    profile.subject === "Inglés" ? "Regla adicional: la explicación oral y la retroalimentación van en español colombiano; usa inglés para ejemplos, fragmentos y práctica cuando el ejercicio lo requiera." : "",
  ].filter(Boolean).join(" ");
}


/** Adds English equivalents for common Spanish ICFES grammar terms before Lab retrieval. */
export function expandIcfesEnglishSearchTerms(query: string): string {
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO");
  const aliases: Array<[RegExp, string]> = [
    [/\bpasado simple\b/g, "past simple simple past"],
    [/\bpresent[e]? simple\b/g, "present simple"],
    [/\bpast continuous\b|\bpasado continuo\b/g, "past continuous"],
    [/\bpresent continuous\b|\bpresente continuo\b/g, "present continuous"],
    [/\bpresent perfect\b|\bpresent[e]? perfecto\b/g, "present perfect"],
    [/\bpast perfect\b|\bpasado perfecto\b/g, "past perfect"],
    [/\bfuturo simple\b/g, "future simple simple future"],
    [/\bverbos? irregulares?\b/g, "irregular verbs"],
    [/\bverbos? regulares?\b/g, "regular verbs"],
    [/\bverbos? modales?\b/g, "modal verbs"],
    [/\bvoz pasiva\b/g, "passive voice"],
    [/\bestilo indirecto\b/g, "reported speech"],
    [/\bcondicional cero\b/g, "zero conditional"],
    [/\bprimer condicional\b/g, "first conditional"],
    [/\bsegundo condicional\b/g, "second conditional"],
    [/\btercer condicional\b/g, "third conditional"],
    [/\bverbos frasales\b/g, "phrasal verbs"],
  ];
  const expansions = aliases.filter(([pattern]) => pattern.test(normalized)).map(([, value]) => value);
  return expansions.length ? query + " " + [...new Set(expansions)].join(" ") : query;
}

export function normalizeIcfesSubject(value: unknown, text = ""): IcfesSubject | null {
  const normalize = (input: string) => input.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .trim();
  const subject = typeof value === "string" ? normalize(value) : "";
  // Explicit course/area selection always wins over incidental words in an exercise.
  if (subject.includes("matematic")) return "Matemáticas";
  if (subject.includes("lectura") || subject.includes("lenguaje")) return "Lectura Crítica";
  if (subject.includes("social") || subject.includes("ciudadan")) return "Sociales y Ciudadanas";
  if (subject.includes("natural") || subject.includes("ciencia")) return "Ciencias Naturales";
  if (subject.includes("ingles") || subject.includes("english")) return "Inglés";

  const normalized = normalize(text);
  if (!normalized) return null;

  // Resolve distinctive English curriculum concepts before Spanish cross-subject vocabulary.
  if (/\b(ingles|english|vocabulary|vocabulario en ingles|grammar|gramatica inglesa|reading comprehension|verb tenses|tiempos verbales|past simple|simple past|pasado simple|past continuous|pasado continuo|present simple|presente simple|present continuous|presente continuo|present perfect|presente perfecto|present perfect continuous|past perfect|pasado perfecto|future simple|futuro simple|future with will|going to|modal verbs?|verbos? modales?|irregular verbs?|verbos? irregulares?|regular verbs?|verbos? regulares?|comparatives?|comparativos?|superlatives?|superlativos?|conditionals?|condicional(?:es)?(?: cero|es? primero|es? segundo|es? tercero)?|passive voice|voz pasiva|reported speech|estilo indirecto|question tags?|gerunds?|gerundios?|infinitives?|infinitivos?|phrasal verbs?|verbos frasales|linking words|conectores en ingles|collocations?|adverbs? of frequency|adverbios de frecuencia|prepositions? of time|prepositions? of place|preposiciones? de tiempo|preposiciones? de lugar|word formation|formacion de palabras|synonym|sinonimos? en ingles|antonym|antonimos? en ingles|notices?|advertisements?|dialogues? in english|part [1-7] of (?:the )?(?:icfes|english))\b/.test(normalized)) return "Inglés";

  if (/\b(matematicas?|algebra|aritmetica|geometria|trigonometria|probabilidad|estadistica|ecuaciones?|inecuaciones?|fracciones?|porcentajes?|razones y proporciones|proporcionalidad|funcion(?:es)? lineales?|funcion(?:es)? cuadraticas?|plano cartesiano|pendiente de una recta|polinomios?|logaritmos?|potencias?|raiz cuadrada|teorema de pitagoras|perimetro|area de (?:un|una)|volumen|media aritmetica|mediana|moda estadistica|secuencia numerica|sucesion numerica|variable independiente|variable dependiente|sistema de ecuaciones|expresion algebraica|numeros reales|numeros racionales|notacion cientifica|conversion de unidades|razon de cambio|interes simple|interes compuesto|funcion exponencial|funcion logaritmica|permutaciones?|combinaciones?|diagrama de arbol|desviacion estandar|rango intercuartil)\b/.test(normalized)) return "Matemáticas";

  if (/\b(lectura critica|comprension lectora|comprension de lectura|comprension de textos|interpretacion de textos|analisis textual|texto argumentativo|intencion comunicativa|intencion del autor|idea principal|idea central|tesis del texto|argumento central|inferencias?|conclusion del texto|conectores logicos|coherencia textual|cohesion textual|parrafos?|narrador|figuras? retoricas?|figuras? literarias?|genero textual|proposito comunicativo|punto de vista del autor|postura del autor|tipologia textual|estructura del texto|recursos literarios|relacion entre textos|voz del narrador|lenguaje figurado|significado contextual|intertextualidad|falacias argumentativas|texto discontinuo|caricatura|infografia|publicidad|proposito del autor|registro linguistico|enunciacion|argumentacion)\b/.test(normalized)) return "Lectura Crítica";

  if (/\b(sociales y ciudadanas|ciencias sociales|historia de colombia|historia universal|geografia|democracia|constitucion politica|derechos humanos|ciudadania|guerra fria|cold war|revolucion francesa|french revolution|revolucion industrial|industrial revolution|world war|simon bolivar|independencia de colombia|estado colombiano|ramas del poder|participacion politica|conflicto armado|colonizacion|globalizacion|economia circular|oferta y demanda|desigualdad social|migracion|territorio colombiano|desarrollo sostenible|organizacion del estado|centralismo|federalismo|poder ejecutivo|poder legislativo|poder judicial|sistema politico|modelos economicos|movimientos sociales|derecho internacional|soberania|constitucion de 1991|violencia en colombia|revolucion rusa|imperialismo|urbanizacion|estado social de derecho|mecanismos de participacion|control politico|pluralismo|multiculturalismo|ordenamiento territorial|fronteras|sectores economicos|indicadores economicos|inflacion|desempleo|conflicto social|memoria historica|justicia transicional|derecho internacional humanitario)\b/.test(normalized)) return "Sociales y Ciudadanas";

  if (/\b(ciencias naturales|fisica|quimica|biologia|celulas?|ecosistemas?|genetica|fotosintesis|respiracion celular|evolucion biologica|seleccion natural|reacciones? quimicas?|atomos?|moleculas?|tabla periodica|enlaces? quimicos?|energia|fuerzas?|densidad|termodinamica|materia|presion atmosferica|velocidad|leyes de newton|circuitos? electricos?|electricidad|magnetismo|ondas? sonoras?|acidos?|bases?|escala de ph|variables? independientes?|variables? dependientes?|variable de control|experimentos?|hipotesis|metodo cientifico|contaminacion|cambio climatico|biodiversidad|cadena alimentaria|astronomia|estrellas? de neutrones|agujeros? negros?|sistema solar|orbitas?|gravedad|mitosis|meiosis|adn|arn|herencia|poblacion biologica|comunidades biologicas|ley de conservacion|recurso renovable|recurso no renovable|cambio de estado|soluciones quimicas|concentracion molar|cinematica|dinamica|electromagnetismo|circuitos en serie|circuitos en paralelo|ley de ohm|energia cinetica|energia potencial|trabajo mecanico|calor especifico|equilibrio termico|velocidad de reaccion|estequiometria|isotopos?|ph|osmosis|difusion|ecosistema acuatico|ecosistema terrestre|ciclo del carbono|ciclo del agua|biotecnologia|mutaciones?|seleccion artificial|adaptacion biologica)\b/.test(normalized)) return "Ciencias Naturales";

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
      && /\b(?:quien(?:es)?|qn|qien|kien|que\s+es|que\s+son|de\s+que\s+trata|para\s+que\s+sirve)\b/i.test(normalized))
    || /\b(?:quien|qn|qien|kien)\s+(?:es|fue)\s+(?:peak\s*score|orby)\b/i.test(normalized)
    || /\bq\s+y\s+es\s+(?:peak\s*score|orby)\b/i.test(normalized)
    || hasFalseOrbyCreatorAttribution(normalized);
}
export const ORBY_IDENTITY_REPLY =
  "PeakScore es la plataforma educativa creada para apoyar a estudiantes en su preparación para las pruebas Saber 11. Yo soy OmegaX, su asistente educativo, y te acompaño con Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.";

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
