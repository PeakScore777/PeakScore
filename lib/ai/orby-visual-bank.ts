import type { OrbyBoardVisual, OrbyBoard } from "@/lib/ai/orby-board";

export type OrbyVisualBankSubject =
  | "Biología"
  | "Química"
  | "Física"
  | "Matemáticas"
  | "Sociales"
  | "Lectura e Inglés";

export type OrbyVisualBankEntry = Readonly<{
  key: string;
  subject: OrbyVisualBankSubject;
  topic: string;
  tags: readonly string[];
  title: string;
  visual: OrbyBoardVisual;
}>;

const BANK: readonly OrbyVisualBankEntry[] = [
  {
    key: "biology.plant-cell",
    subject: "Biología",
    topic: "Célula vegetal",
    title: "Estructura de una célula vegetal",
    tags: ["célula", "organelos", "pared celular", "cloroplasto", "vacuola"],
    visual: {
      type: "cell",
      title: "Célula vegetal",
      cellType: "plant",
      organelles: [
        { id: "wall", kind: "cell-wall", x: 18, y: 50, label: "Pared celular" },
        { id: "membrane", kind: "membrane", x: 27, y: 50, label: "Membrana" },
        { id: "nucleus", kind: "nucleus", x: 43, y: 34, label: "Núcleo" },
        { id: "chloroplast", kind: "chloroplast", x: 70, y: 28, label: "Cloroplasto" },
        { id: "vacuole", kind: "vacuole", x: 62, y: 61, label: "Vacuola" },
        { id: "mitochondrion", kind: "mitochondrion", x: 38, y: 72, label: "Mitocondria" },
        { id: "ribosome", kind: "ribosome", x: 81, y: 70, label: "Ribosomas" },
        { id: "golgi", kind: "golgi", x: 48, y: 49, label: "Golgi" },
      ],
    },
  },
  {
    key: "biology.animal-cell",
    subject: "Biología",
    topic: "Célula animal",
    title: "Estructura de una célula animal",
    tags: ["célula", "organelos", "núcleo", "membrana", "mitocondria"],
    visual: {
      type: "cell",
      title: "Célula animal",
      cellType: "animal",
      organelles: [
        { id: "membrane", kind: "membrane", x: 18, y: 50, label: "Membrana" },
        { id: "nucleus", kind: "nucleus", x: 42, y: 38, label: "Núcleo" },
        { id: "mitochondrion-a", kind: "mitochondrion", x: 68, y: 27, label: "Mitocondria" },
        { id: "mitochondrion-b", kind: "mitochondrion", x: 70, y: 70, label: "Mitocondria" },
        { id: "er", kind: "endoplasmic-reticulum", x: 49, y: 65, label: "Retículo" },
        { id: "golgi", kind: "golgi", x: 82, y: 49, label: "Golgi" },
        { id: "ribosome", kind: "ribosome", x: 31, y: 75, label: "Ribosomas" },
        { id: "cytoplasm", kind: "cytoplasm", x: 23, y: 25, label: "Citoplasma" },
      ],
    },
  },
  {
    key: "biology.dna-base-pairs",
    subject: "Biología",
    topic: "ADN y complementariedad",
    title: "Emparejamiento de bases del ADN",
    tags: ["ADN", "nucleótidos", "bases nitrogenadas", "replicación"],
    visual: {
      type: "dna",
      title: "Bases complementarias",
      pairs: [
        { left: "A", right: "T" },
        { left: "C", right: "G" },
        { left: "T", right: "A" },
        { left: "G", right: "C" },
        { left: "A", right: "T" },
        { left: "C", right: "G" },
      ],
    },
  },
  {
    key: "biology.photosynthesis",
    subject: "Biología",
    topic: "Fotosíntesis",
    title: "Entradas y productos de la fotosíntesis",
    tags: ["fotosíntesis", "cloroplasto", "glucosa", "oxígeno", "energía solar"],
    visual: {
      type: "diagram",
      title: "Fotosíntesis",
      nodes: [
        { id: "light", label: "Luz", x: 18, y: 22 },
        { id: "water", label: "Agua", x: 18, y: 72 },
        { id: "carbon", label: "CO₂", x: 43, y: 48 },
        { id: "leaf", label: "Cloroplasto", x: 65, y: 48 },
        { id: "glucose", label: "Glucosa", x: 86, y: 28 },
        { id: "oxygen", label: "Oxígeno", x: 86, y: 72 },
      ],
      edges: [
        { from: "light", to: "leaf", label: "energía" },
        { from: "water", to: "leaf", label: "entrada" },
        { from: "carbon", to: "leaf", label: "entrada" },
        { from: "leaf", to: "glucose", label: "produce" },
        { from: "leaf", to: "oxygen", label: "libera" },
      ],
    },
  },
  {
    key: "biology.mitosis",
    subject: "Biología",
    topic: "Mitosis",
    title: "Secuencia general de la mitosis",
    tags: ["mitosis", "división celular", "profase", "metafase", "anafase", "telofase"],
    visual: {
      type: "cell-division",
      title: "Fases de la mitosis",
      mode: "mitosis",
      phases: [
        { name: "Profase", detail: "Los cromosomas se condensan y se organiza el huso." },
        { name: "Metafase", detail: "Los cromosomas se alinean en el ecuador celular." },
        { name: "Anafase", detail: "Las cromátidas hermanas se separan." },
        { name: "Telofase y citocinesis", detail: "Se reorganizan los núcleos y se divide el citoplasma." },
      ],
    },
  },
  {
    key: "biology.punnett-monohybrid",
    subject: "Biología",
    topic: "Cuadro de Punnett",
    title: "Cruce monohíbrido Aa × Aa",
    tags: ["genética", "herencia", "alelos", "dominante", "recesivo", "Punnett"],
    visual: { type: "punnett", title: "Cruce Aa × Aa", topAlleles: ["A", "a"], sideAlleles: ["A", "a"] },
  },
  {
    key: "biology.neuron",
    subject: "Biología",
    topic: "Neurona",
    title: "Partes funcionales de una neurona",
    tags: ["neurona", "sistema nervioso", "dendritas", "axón", "sinapsis"],
    visual: {
      type: "neuron",
      title: "Neurona",
      parts: [
        { id: "dendrites", name: "Dendritas", role: "Reciben señales de otras células." },
        { id: "soma", name: "soma", role: "Integra señales y contiene el núcleo." },
        { id: "nucleus", name: "Núcleo", role: "Contiene el material genético." },
        { id: "axon", name: "Axón", role: "Conduce el impulso nervioso." },
        { id: "myelin", name: "Mielina", role: "Aísla segmentos del axón." },
        { id: "nodes", name: "Nodos de Ranvier", role: "Permiten la conducción saltatoria." },
        { id: "terminal", name: "Terminales sinápticas", role: "Transmiten señales a otra célula." },
      ],
    },
  },
  {
    key: "biology.blood-flow",
    subject: "Biología",
    topic: "Circulación sanguínea",
    title: "Recorrido general de la sangre",
    tags: ["sistema circulatorio", "corazón", "pulmones", "arterias", "venas"],
    visual: {
      type: "physiology-process",
      title: "Circulación pulmonar y sistémica",
      process: "blood-flow",
      stages: [
        { name: "Venas cavas", detail: "Llevan sangre desoxigenada desde el cuerpo.", location: "Grandes venas sistémicas" },
        { name: "Aurícula derecha", detail: "Recibe la sangre que llega por las venas cavas.", location: "Corazón" },
        { name: "Ventrículo derecho", detail: "Impulsa la sangre hacia los pulmones.", location: "Corazón" },
        { name: "Arterias pulmonares", detail: "Transportan sangre hacia los pulmones.", location: "Circulación pulmonar" },
        { name: "Pulmones", detail: "Intercambian dióxido de carbono por oxígeno.", location: "Pulmones" },
        { name: "Venas pulmonares", detail: "Llevan sangre oxigenada al corazón.", location: "Circulación pulmonar" },
        { name: "Aurícula izquierda", detail: "Recibe sangre procedente de los pulmones.", location: "Corazón" },
        { name: "Ventrículo izquierdo", detail: "Impulsa sangre hacia la circulación sistémica.", location: "Corazón" },
        { name: "Aorta y cuerpo", detail: "Distribuye sangre a los tejidos del organismo.", location: "Circulación sistémica" },
      ],
    },
  },
  {
    key: "chemistry.water-molecule",
    subject: "Química",
    topic: "Molécula de agua",
    title: "Geometría simplificada del agua",
    tags: ["agua", "H₂O", "enlace covalente", "molécula", "polaridad"],
    visual: {
      type: "molecule",
      title: "Molécula H₂O",
      atoms: [
        { id: "oxygen", element: "O", x: 50, y: 34 },
        { id: "hydrogen-a", element: "H", x: 25, y: 68 },
        { id: "hydrogen-b", element: "H", x: 75, y: 68 },
      ],
      bonds: [
        { from: "oxygen", to: "hydrogen-a", order: 1 },
        { from: "oxygen", to: "hydrogen-b", order: 1 },
      ],
    },
  },
  {
    key: "chemistry.atom-structure",
    subject: "Química",
    topic: "Estructura del átomo",
    title: "Núcleo y región electrónica",
    tags: ["átomo", "protón", "neutrón", "electrón", "número atómico"],
    visual: {
      type: "diagram",
      title: "Modelo esquemático del átomo",
      nodes: [
        { id: "proton", label: "Protón (+)", x: 30, y: 42 },
        { id: "neutron", label: "Neutrón (0)", x: 30, y: 62 },
        { id: "nucleus", label: "Núcleo", x: 58, y: 52 },
        { id: "electron", label: "Electrón (−)", x: 83, y: 52 },
      ],
      edges: [
        { from: "proton", to: "nucleus" },
        { from: "neutron", to: "nucleus" },
        { from: "nucleus", to: "electron", label: "región externa" },
      ],
    },
  },
  {
    key: "chemistry.states-of-matter",
    subject: "Química",
    topic: "Estados de la materia",
    title: "Comparación de estados de agregación",
    tags: ["sólido", "líquido", "gas", "cambio de estado", "partículas"],
    visual: {
      type: "table",
      title: "Estados de la materia",
      headers: ["Estado", "Forma", "Volumen", "Partículas"],
      rows: [
        ["Sólido", "Definida", "Definido", "Muy próximas"],
        ["Líquido", "Variable", "Definido", "Próximas y móviles"],
        ["Gas", "Variable", "Variable", "Muy separadas"],
      ],
    },
  },
  {
    key: "chemistry.ph-scale",
    subject: "Química",
    topic: "Escala de pH",
    title: "Escala de pH idealizada a 25 °C",
    tags: ["pH", "ácido", "neutro", "base", "acidez"],
    visual: {
      type: "table",
      title: "Clasificación general del pH",
      headers: ["Intervalo", "Carácter"],
      rows: [
        ["pH < 7", "Ácido"],
        ["pH = 7", "Neutro"],
        ["pH > 7", "Básico"],
      ],
    },
  },
  {
    key: "physics.simple-circuit",
    subject: "Física",
    topic: "Circuito eléctrico simple",
    title: "Elementos de un circuito",
    tags: ["circuito", "corriente", "batería", "resistencia", "interruptor"],
    visual: {
      type: "circuit",
      title: "Circuito simple",
      components: [
        { id: "battery", kind: "battery", x: 18, y: 50, label: "Batería" },
        { id: "switch", kind: "switch", x: 43, y: 50, label: "Interruptor" },
        { id: "lamp", kind: "lamp", x: 69, y: 50, label: "Lámpara" },
        { id: "resistor", kind: "resistor", x: 69, y: 78, label: "Resistencia" },
      ],
      connections: [
        { from: "battery", to: "switch" },
        { from: "switch", to: "lamp" },
        { from: "lamp", to: "resistor" },
        { from: "resistor", to: "battery" },
      ],
    },
  },
  {
    key: "physics.vector-components",
    subject: "Física",
    topic: "Componentes de un vector",
    title: "Descomposición vectorial",
    tags: ["vector", "magnitud", "dirección", "componentes", "física"],
    visual: {
      type: "diagram",
      title: "Descomposición de un vector",
      nodes: [
        { id: "origin", label: "Origen", x: 18, y: 82 },
        { id: "x-end", label: "Ax", x: 72, y: 82 },
        { id: "y-end", label: "Ay", x: 18, y: 28 },
        { id: "vector-end", label: "A", x: 72, y: 28 },
      ],
      edges: [
        { from: "origin", to: "x-end", label: "Componente x" },
        { from: "origin", to: "y-end", label: "Componente y" },
        { from: "origin", to: "vector-end", label: "Vector A" },
        { from: "x-end", to: "vector-end" },
        { from: "y-end", to: "vector-end" },
      ],
    },
  },
  {
    key: "physics.motion-graph",
    subject: "Física",
    topic: "Movimiento rectilíneo",
    title: "Lectura de una gráfica posición-tiempo",
    tags: ["movimiento", "posición", "tiempo", "pendiente", "velocidad"],
    visual: {
      type: "graph",
      title: "Posición frente a tiempo",
      xLabel: "Tiempo (s)",
      yLabel: "Posición (m)",
      xMin: 0,
      xMax: 5,
      yMin: 0,
      yMax: 10,
      kind: "line",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
        { x: 4, y: 8 },
        { x: 5, y: 10 },
      ],
    },
  },
  {
    key: "math.linear-function",
    subject: "Matemáticas",
    topic: "Función lineal",
    title: "Gráfica de y = 2x + 1",
    tags: ["función lineal", "pendiente", "intercepto", "plano cartesiano"],
    visual: {
      type: "graph",
      title: "Función lineal y = 2x + 1",
      xLabel: "x",
      yLabel: "y",
      xMin: -2,
      xMax: 3,
      yMin: -3,
      yMax: 7,
      kind: "line",
      points: [
        { x: -1, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
      ],
    },
  },
  {
    key: "math.quadratic-function",
    subject: "Matemáticas",
    topic: "Función cuadrática",
    title: "Parábola y = x²",
    tags: ["parábola", "vértice", "función cuadrática", "raíces"],
    visual: {
      type: "graph",
      title: "Parábola y = x²",
      xLabel: "x",
      yLabel: "y",
      xMin: -3,
      xMax: 3,
      yMin: 0,
      yMax: 9,
      kind: "line",
      points: [
        { x: -3, y: 9 },
        { x: -2, y: 4 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
        { x: 3, y: 9 },
      ],
    },
  },
  {
    key: "math.pythagorean-theorem",
    subject: "Matemáticas",
    topic: "Teorema de Pitágoras",
    title: "Relación entre catetos e hipotenusa",
    tags: ["Pitágoras", "triángulo rectángulo", "catetos", "hipotenusa"],
    visual: {
      type: "diagram",
      title: "Triángulo rectángulo",
      nodes: [
        { id: "a", label: "Cateto a", x: 22, y: 78 },
        { id: "b", label: "Cateto b", x: 22, y: 24 },
        { id: "c", label: "Hipotenusa c", x: 73, y: 51 },
        { id: "formula", label: "a²+b²=c²", x: 73, y: 85 },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
        { from: "a", to: "c" },
      ],
    },
  },
  {
    key: "math.probability-table",
    subject: "Matemáticas",
    topic: "Probabilidad simple",
    title: "Espacio muestral de dos monedas",
    tags: ["probabilidad", "espacio muestral", "evento", "moneda"],
    visual: {
      type: "table",
      title: "Dos lanzamientos de moneda",
      headers: ["Resultado", "Caso"],
      rows: [
        ["Cara–Cara", "1"],
        ["Cara–Sello", "2"],
        ["Sello–Cara", "3"],
        ["Sello–Sello", "4"],
      ],
    },
  },
  {
    key: "social.branches-of-power",
    subject: "Sociales",
    topic: "Ramas del poder público",
    title: "Funciones generales de las ramas del poder",
    tags: ["Estado", "poder público", "legislativa", "ejecutiva", "judicial"],
    visual: {
      type: "diagram",
      title: "Ramas del poder público",
      nodes: [
        { id: "state", label: "Estado", x: 50, y: 16 },
        { id: "legislative", label: "Legislativa", x: 18, y: 68 },
        { id: "executive", label: "Ejecutiva", x: 50, y: 68 },
        { id: "judicial", label: "Judicial", x: 82, y: 68 },
      ],
      edges: [
        { from: "state", to: "legislative", label: "crea leyes" },
        { from: "state", to: "executive", label: "ejecuta políticas" },
        { from: "state", to: "judicial", label: "administra justicia" },
      ],
    },
  },
  {
    key: "social.supply-demand",
    subject: "Sociales",
    topic: "Oferta y demanda",
    title: "Relación conceptual entre precio y cantidad",
    tags: ["economía", "oferta", "demanda", "mercado", "precio"],
    visual: {
      type: "table",
      title: "Ley de oferta y demanda (ceteris paribus)",
      headers: ["Precio", "Cantidad ofrecida", "Cantidad demandada"],
      rows: [
        ["Bajo", "Menor", "Mayor"],
        ["Alto", "Mayor", "Menor"],
      ],
    },
  },
  {
    key: "social.history-timeline",
    subject: "Sociales",
    topic: "Lectura de procesos históricos",
    title: "Línea de tiempo para organizar un proceso",
    tags: ["historia", "cronología", "causa", "consecuencia", "periodización"],
    visual: {
      type: "timeline",
      title: "Organización de un proceso histórico",
      events: [
        { label: "Antecedentes", detail: "Condiciones previas", position: 8 },
        { label: "Inicio", detail: "Acontecimiento desencadenante", position: 30 },
        { label: "Desarrollo", detail: "Cambios y actores", position: 57 },
        { label: "Consecuencias", detail: "Efectos posteriores", position: 83 },
      ],
    },
  },
  {
    key: "reading.communication-model",
    subject: "Lectura e Inglés",
    topic: "Situación comunicativa",
    title: "Elementos de la comunicación",
    tags: ["emisor", "receptor", "mensaje", "canal", "contexto", "pragmática"],
    visual: {
      type: "diagram",
      title: "Situación comunicativa",
      nodes: [
        { id: "sender", label: "Emisor", x: 18, y: 48 },
        { id: "message", label: "Mensaje", x: 50, y: 48 },
        { id: "receiver", label: "Receptor", x: 82, y: 48 },
        { id: "context", label: "Contexto", x: 50, y: 82 },
      ],
      edges: [
        { from: "sender", to: "message", label: "codifica" },
        { from: "message", to: "receiver", label: "canal" },
        { from: "context", to: "message", label: "sitúa" },
      ],
    },
  },
  {
    key: "english.sentence-connectors",
    subject: "Lectura e Inglés",
    topic: "Conectores en inglés",
    title: "Conectores y relaciones lógicas",
    tags: ["conectores", "however", "because", "therefore", "although", "cohesión"],
    visual: {
      type: "table",
      title: "Conectores frecuentes",
      headers: ["Relación", "Conector", "Función"],
      rows: [
        ["Causa", "because", "Explica por qué"],
        ["Resultado", "therefore", "Presenta una consecuencia"],
        ["Contraste", "however", "Introduce una oposición"],
        ["Concesión", "although", "Admite una dificultad"],
      ],
    },
  },
  {
    key: "reading.text-structure",
    subject: "Lectura e Inglés",
    topic: "Estructura textual",
    title: "Organización de un texto argumentativo",
    tags: ["lectura crítica", "tesis", "argumento", "evidencia", "conclusión"],
    visual: {
      type: "diagram",
      title: "Estructura de un texto",
      nodes: [
        { id: "thesis", label: "Tesis", x: 18, y: 50 },
        { id: "argument", label: "Argumento", x: 48, y: 50 },
        { id: "evidence", label: "Evidencia", x: 78, y: 25 },
        { id: "conclusion", label: "Conclusión", x: 78, y: 75 },
      ],
      edges: [
        { from: "thesis", to: "argument" },
        { from: "argument", to: "evidence" },
        { from: "argument", to: "conclusion" },
      ],
    },
  },
];

const BANK_BY_KEY = new Map(BANK.map((entry) => [entry.key, entry]));
const MAX_BANK_KEYS_PER_SNAPSHOT = 2;

function cloneVisual(visual: OrbyBoardVisual): OrbyBoardVisual {
  return JSON.parse(JSON.stringify(visual)) as OrbyBoardVisual;
}

export function listOrbyVisualBankEntries(): readonly OrbyVisualBankEntry[] {
  return BANK;
}

export function getOrbyVisualBankEntry(key: string): OrbyVisualBankEntry | null {
  return BANK_BY_KEY.get(key) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Expands only allowlisted bank keys into known visual primitives before the
 * normal board sanitizer runs. Model-provided IDs, URLs, markup and raw SVG
 * are never accepted as bank content.
 */
export function expandOrbyVisualBankSnapshot(input: unknown): unknown {
  if (!isRecord(input) || !Array.isArray(input.visualBankKeys)) return input;
  const requested = input.visualBankKeys
    .filter((key): key is string => typeof key === "string")
    .slice(0, MAX_BANK_KEYS_PER_SNAPSHOT);
  if (requested.length === 0) return input;

  const existingVisuals = Array.isArray(input.visuals) ? input.visuals.filter(isRecord) : [];
  const knownTitles = new Set(existingVisuals.map((visual) => typeof visual.title === "string" ? visual.title : ""));
  const additions = requested
    .map((key) => BANK_BY_KEY.get(key))
    .filter((entry): entry is OrbyVisualBankEntry => Boolean(entry))
    .filter((entry) => !knownTitles.has(entry.visual.title))
    .map((entry) => cloneVisual(entry.visual));

  const cleanInput = { ...input };
  delete cleanInput.visualBankKeys;
  if (additions.length === 0) return cleanInput;

  const version = input.version;
  // Version 1 is intentionally text-only. Promote it to the compatible
  // single-sheet visual format whenever a curated visual is inserted.
  const targetVersion = version === 1 ? 2 : version;
  const maxVisuals = targetVersion === 3 ? 8 : 4;
  const visuals = [...existingVisuals, ...additions].slice(0, maxVisuals);
  const appendedCount = visuals.length - existingVisuals.length;
  if (appendedCount <= 0) return cleanInput;
  cleanInput.visuals = visuals;

  cleanInput.version = targetVersion;
  if (!isRecord(input.layout) || !Array.isArray(input.layout.elements)) {
    return cleanInput;
  }

  const rawLayout = input.layout as Record<string, unknown> & { elements: unknown[]; pageCount?: unknown };
  const elements: Array<Record<string, unknown>> = rawLayout.elements
    .filter((element): element is Record<string, unknown> => isRecord(element))
    .map((element) => ({ ...element }));
  if (version === 2) {
    const pageCount = 2;
    for (const element of elements) element.page = 0;
    const nextPage = 1;
    for (let index = 0; index < appendedCount; index += 1) {
      const col = index % 2;
      const row = Math.floor(index / 2);
      elements.push({
        id: "bank_" + (existingVisuals.length + index + 1),
        sequence: elements.reduce<number>((max: number, item: Record<string, unknown>) => typeof item.sequence === "number" ? Math.max(max, item.sequence) : max, 0) + 1,
        kind: "visual",
        index: existingVisuals.length + index,
        page: nextPage,
        x: 6 + col * 48,
        y: 12 + row * 42,
        width: 42,
        height: 34,
      });
    }
    cleanInput.version = 3;
    cleanInput.layout = { ...rawLayout, pageCount, elements };
    return cleanInput;
  }

  if (version === 3 && typeof rawLayout.pageCount === "number"
    && rawLayout.pageCount >= 2 && rawLayout.pageCount <= 4) {
    let pageCount = rawLayout.pageCount;
    const pages = new Map<number, number>();
    for (const element of elements) {
      if (typeof element.page === "number") pages.set(element.page, (pages.get(element.page) ?? 0) + 1);
    }
    let page = pageCount - 1;
    if ((pages.get(page) ?? 0) + appendedCount > 12) {
      if (pageCount >= 4) {
        cleanInput.visuals = existingVisuals;
        return cleanInput;
      }
      page = pageCount;
      pageCount += 1;
    }
    for (let index = 0; index < appendedCount; index += 1) {
      const col = index % 2;
      const row = Math.floor(index / 2);
      elements.push({
        id: "bank_" + (existingVisuals.length + index + 1),
        sequence: elements.reduce<number>((max: number, item: Record<string, unknown>) => typeof item.sequence === "number" ? Math.max(max, item.sequence) : max, 0) + 1,
        kind: "visual",
        index: existingVisuals.length + index,
        page,
        x: 6 + col * 48,
        y: 12 + row * 42,
        width: 42,
        height: 34,
      });
    }
    cleanInput.layout = { ...rawLayout, pageCount, elements };
    return cleanInput;
  }

  return cleanInput;
}

