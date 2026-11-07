export type OrbyBoardBlock =
  | { type: "heading" | "text"; text: string }
  | { type: "formula"; text: string }
  | { type: "step"; label: string; text: string }
  | { type: "callout"; text: string };

export type OrbyBoardPoint = { x: number; y: number; label?: string };
export type OrbyBoardVisual =
  | {
      type: "diagram";
      title: string;
      nodes: Array<{ id: string; label: string; x: number; y: number }>;
      edges: Array<{ from: string; to: string; label?: string }>;
    }
  | {
      type: "graph";
      title: string;
      xLabel: string;
      yLabel: string;
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      points: OrbyBoardPoint[];
      kind: "line" | "scatter";
    }
  | {
      type: "vectors";
      title: string;
      origin: { x: number; y: number };
      vectors: Array<{ label: string; dx: number; dy: number }>;
    }
  | { type: "table"; title: string; headers: string[]; rows: string[][] }
  | { type: "molecule"; title: string; atoms: Array<{ id: string; element: string; x: number; y: number; charge?: string }>; bonds: Array<{ from: string; to: string; order: 1 | 2 | 3 }> }
  | { type: "circuit"; title: string; components: Array<{ id: string; kind: "battery" | "resistor" | "lamp" | "switch"; x: number; y: number; label: string }>; connections: Array<{ from: string; to: string }> }
  | { type: "cell"; title: string; cellType: "animal" | "plant" | "prokaryotic"; organelles: Array<{ id: string; kind: "nucleus" | "mitochondrion" | "chloroplast" | "vacuole" | "membrane" | "cell-wall" | "ribosome" | "endoplasmic-reticulum" | "golgi" | "cytoplasm"; x: number; y: number; label: string }> }
  | { type: "dna"; title: string; pairs: Array<{ left: "A" | "T" | "C" | "G"; right: "A" | "T" | "C" | "G" }> }
  | { type: "punnett"; title: string; topAlleles: [string, string]; sideAlleles: [string, string] }
  | { type: "cell-division"; title: string; mode: "mitosis" | "meiosis"; phases: Array<{ name: string; detail: string }> }
  | { type: "organ-system"; title: string; system: "nervous" | "circulatory" | "respiratory" | "digestive" | "endocrine" | "urinary" | "skeletal" | "muscular"; structures: Array<{ id: string; name: string; x: number; y: number; role: string }> }
  | { type: "neuron"; title: string; parts: Array<{ id: string; name: string; role: string }> }
  | { type: "physiology-process"; title: string; process: "blood-flow" | "gas-exchange" | "digestion" | "nephron-filtration" | "muscle-contraction" | "synaptic-transmission"; stages: Array<{ name: string; detail: string; location: string }> }
  | {
      type: "timeline";
      title: string;
      events: Array<{ label: string; detail?: string; position: number }>;
    };

export type OrbyBoard = {
  version: 1 | 2;
  title: string;
  blocks: OrbyBoardBlock[];
  /** Exact short phrase that should be heard before this snapshot is shown in Live voice. */
  spokenCue?: string;
  visuals?: OrbyBoardVisual[];
};

const MAX_BLOCKS = 8;
const MAX_VISUALS = 4;
const MAX_TEXT = 240;

function safeText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function safeId(value: unknown): string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,24}$/.test(value) ? value : "";
}

function sanitizeVisual(value: unknown): OrbyBoardVisual | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.type === "diagram") {
    if (!Array.isArray(raw.nodes) || raw.nodes.length < 2 || raw.nodes.length > 12
      || !Array.isArray(raw.edges) || raw.edges.length > 20) return null;
    const nodes: Array<{ id: string; label: string; x: number; y: number }> = [];
    const ids = new Set<string>();
    for (const entry of raw.nodes) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const node = entry as Record<string, unknown>;
      const id = safeId(node.id);
      const label = safeText(node.label, 64);
      if (!id || ids.has(id) || !label || !finite(node.x, 5, 95) || !finite(node.y, 8, 92)) return null;
      ids.add(id);
      nodes.push({ id, label, x: node.x, y: node.y });
    }
    const edges: Array<{ from: string; to: string; label?: string }> = [];
    for (const entry of raw.edges) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const edge = entry as Record<string, unknown>;
      const from = safeId(edge.from);
      const to = safeId(edge.to);
      const label = safeText(edge.label, 48);
      if (!from || !to || from === to || !ids.has(from) || !ids.has(to)) return null;
      edges.push({ from, to, ...(label ? { label } : {}) });
    }
    return { type: "diagram", title: safeText(raw.title, 80), nodes, edges };
  }

  if (raw.type === "graph") {
    if (!Array.isArray(raw.points) || raw.points.length < 2 || raw.points.length > 24
      || !finite(raw.xMin, -1_000_000, 1_000_000) || !finite(raw.xMax, -1_000_000, 1_000_000)
      || !finite(raw.yMin, -1_000_000, 1_000_000) || !finite(raw.yMax, -1_000_000, 1_000_000)
      || raw.xMin >= raw.xMax || raw.yMin >= raw.yMax
      || (raw.kind !== "line" && raw.kind !== "scatter")) return null;
    const points: OrbyBoardPoint[] = [];
    for (const entry of raw.points) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const point = entry as Record<string, unknown>;
      if (!finite(point.x, raw.xMin, raw.xMax) || !finite(point.y, raw.yMin, raw.yMax)) return null;
      const label = safeText(point.label, 32);
      points.push({ x: point.x, y: point.y, ...(label ? { label } : {}) });
    }
    return {
      type: "graph",
      title: safeText(raw.title, 80),
      xLabel: safeText(raw.xLabel, 40),
      yLabel: safeText(raw.yLabel, 40),
      xMin: raw.xMin, xMax: raw.xMax, yMin: raw.yMin, yMax: raw.yMax,
      points, kind: raw.kind,
    };
  }

  if (raw.type === "vectors") {
    if (!raw.origin || typeof raw.origin !== "object" || Array.isArray(raw.origin)
      || !Array.isArray(raw.vectors) || raw.vectors.length < 1 || raw.vectors.length > 8) return null;
    const origin = raw.origin as Record<string, unknown>;
    if (!finite(origin.x, 10, 90) || !finite(origin.y, 10, 90)) return null;
    const vectors: Array<{ label: string; dx: number; dy: number }> = [];
    for (const entry of raw.vectors) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const vector = entry as Record<string, unknown>;
      const label = safeText(vector.label, 40);
      if (!label || !finite(vector.dx, -40, 40) || !finite(vector.dy, -40, 40)
        || (vector.dx === 0 && vector.dy === 0)) return null;
      vectors.push({ label, dx: vector.dx, dy: vector.dy });
    }
    return { type: "vectors", title: safeText(raw.title, 80), origin: { x: origin.x, y: origin.y }, vectors };
  }

  if (raw.type === "table") {
    if (!Array.isArray(raw.headers) || raw.headers.length < 2 || raw.headers.length > 5
      || !Array.isArray(raw.rows) || raw.rows.length < 1 || raw.rows.length > 8) return null;
    const headers = raw.headers.map((item) => safeText(item, 40));
    if (headers.some((item) => !item)) return null;
    const rows: string[][] = [];
    for (const row of raw.rows) {
      if (!Array.isArray(row) || row.length !== headers.length) return null;
      const cells = row.map((item) => safeText(item, 64));
      if (cells.some((item) => !item)) return null;
      rows.push(cells);
    }
    return { type: "table", title: safeText(raw.title, 80), headers, rows };
  }

  if (raw.type === "molecule") {
    if (!Array.isArray(raw.atoms) || raw.atoms.length < 2 || raw.atoms.length > 16
      || !Array.isArray(raw.bonds) || raw.bonds.length < 1 || raw.bonds.length > 24) return null;
    const atoms: Array<{ id: string; element: string; x: number; y: number; charge?: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.atoms) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const atom = entry as Record<string, unknown>;
      const id = safeId(atom.id);
      const element = safeText(atom.element, 2);
      const charge = safeText(atom.charge, 3);
      if (!id || ids.has(id) || !/^[A-Z][a-z]?$/.test(element)
        || !finite(atom.x, 8, 92) || !finite(atom.y, 8, 92)
        || (atom.charge !== undefined && !/^(?:[+-]|[1-9][+-])$/.test(charge))) return null;
      ids.add(id);
      atoms.push({ id, element, x: atom.x, y: atom.y, ...(charge ? { charge } : {}) });
    }
    const bonds: Array<{ from: string; to: string; order: 1 | 2 | 3 }> = [];
    const seenBonds = new Set<string>();
    for (const entry of raw.bonds) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const bond = entry as Record<string, unknown>;
      const from = safeId(bond.from);
      const to = safeId(bond.to);
      const key = [from, to].sort().join(":");
      if (!from || !to || from === to || !ids.has(from) || !ids.has(to)
        || seenBonds.has(key) || (bond.order !== 1 && bond.order !== 2 && bond.order !== 3)) return null;
      seenBonds.add(key);
      bonds.push({ from, to, order: bond.order });
    }
    return { type: "molecule", title: safeText(raw.title, 80), atoms, bonds };
  }

  if (raw.type === "circuit") {
    if (!Array.isArray(raw.components) || raw.components.length < 2 || raw.components.length > 12
      || !Array.isArray(raw.connections) || raw.connections.length < 1 || raw.connections.length > 20) return null;
    const components: Array<{ id: string; kind: "battery" | "resistor" | "lamp" | "switch"; x: number; y: number; label: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.components) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const component = entry as Record<string, unknown>;
      const id = safeId(component.id);
      const kind = component.kind;
      const label = safeText(component.label, 24);
      if (!id || ids.has(id) || !["battery", "resistor", "lamp", "switch"].includes(String(kind))
        || !label || !finite(component.x, 8, 92) || !finite(component.y, 8, 92)) return null;
      ids.add(id);
      components.push({ id, kind: kind as "battery" | "resistor" | "lamp" | "switch", x: component.x, y: component.y, label });
    }
    const connections: Array<{ from: string; to: string }> = [];
    const seenConnections = new Set<string>();
    for (const entry of raw.connections) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const connection = entry as Record<string, unknown>;
      const from = safeId(connection.from);
      const to = safeId(connection.to);
      const key = [from, to].sort().join(":");
      if (!from || !to || from === to || !ids.has(from) || !ids.has(to) || seenConnections.has(key)) return null;
      seenConnections.add(key);
      connections.push({ from, to });
    }
    return { type: "circuit", title: safeText(raw.title, 80), components, connections };
  }

  if (raw.type === "cell") {
    if (!["animal", "plant", "prokaryotic"].includes(String(raw.cellType))
      || !Array.isArray(raw.organelles) || raw.organelles.length < 2 || raw.organelles.length > 14) return null;
    const allowed = ["nucleus", "mitochondrion", "chloroplast", "vacuole", "membrane", "cell-wall", "ribosome", "endoplasmic-reticulum", "golgi", "cytoplasm"];
    const organelles: Array<{ id: string; kind: "nucleus" | "mitochondrion" | "chloroplast" | "vacuole" | "membrane" | "cell-wall" | "ribosome" | "endoplasmic-reticulum" | "golgi" | "cytoplasm"; x: number; y: number; label: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.organelles) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      const kind = item.kind;
      const label = safeText(item.label, 36);
      if (!id || ids.has(id) || !allowed.includes(String(kind)) || !label
        || !finite(item.x, 10, 90) || !finite(item.y, 10, 90)) return null;
      ids.add(id);
      organelles.push({ id, kind: kind as typeof organelles[number]["kind"], x: item.x, y: item.y, label });
    }
    if (raw.cellType === "animal" && organelles.some((item) => item.kind === "cell-wall" || item.kind === "chloroplast")) return null;
    if (raw.cellType === "plant" && !organelles.some((item) => item.kind === "cell-wall")) return null;
    if (raw.cellType === "prokaryotic" && organelles.some((item) => ["nucleus", "mitochondrion", "chloroplast", "endoplasmic-reticulum", "golgi"].includes(item.kind))) return null;
    return { type: "cell", title: safeText(raw.title, 80), cellType: raw.cellType as "animal" | "plant" | "prokaryotic", organelles };
  }

  if (raw.type === "dna") {
    if (!Array.isArray(raw.pairs) || raw.pairs.length < 2 || raw.pairs.length > 12) return null;
    const pairs: Array<{ left: "A" | "T" | "C" | "G"; right: "A" | "T" | "C" | "G" }> = [];
    for (const entry of raw.pairs) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const pair = entry as Record<string, unknown>;
      if (!["A", "T", "C", "G"].includes(String(pair.left)) || !["A", "T", "C", "G"].includes(String(pair.right))
        || !((pair.left === "A" && pair.right === "T") || (pair.left === "T" && pair.right === "A")
          || (pair.left === "C" && pair.right === "G") || (pair.left === "G" && pair.right === "C"))) return null;
      pairs.push({ left: pair.left as "A" | "T" | "C" | "G", right: pair.right as "A" | "T" | "C" | "G" });
    }
    return { type: "dna", title: safeText(raw.title, 80), pairs };
  }

  if (raw.type === "punnett") {
    if (!Array.isArray(raw.topAlleles) || raw.topAlleles.length !== 2
      || !Array.isArray(raw.sideAlleles) || raw.sideAlleles.length !== 2) return null;
    const validAllele = (value: unknown) => typeof value === "string" && /^[A-Za-z]$/.test(value);
    if (!raw.topAlleles.every(validAllele) || !raw.sideAlleles.every(validAllele)) return null;
    return {
      type: "punnett",
      title: safeText(raw.title, 80),
      topAlleles: raw.topAlleles as [string, string],
      sideAlleles: raw.sideAlleles as [string, string],
    };
  }

  if (raw.type === "cell-division") {
    const expected = raw.mode === "mitosis"
      ? ["Profase", "Metafase", "Anafase", "Telofase y citocinesis"]
      : ["Profase I", "Metafase I", "Anafase I", "Telofase I", "Profase II", "Metafase II", "Anafase II", "Telofase II"];
    if ((raw.mode !== "mitosis" && raw.mode !== "meiosis")
      || !Array.isArray(raw.phases) || raw.phases.length !== expected.length) return null;
    const phases: Array<{ name: string; detail: string }> = [];
    for (let index = 0; index < expected.length; index += 1) {
      const entry = raw.phases[index];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const phase = entry as Record<string, unknown>;
      const name = safeText(phase.name, 40);
      const detail = safeText(phase.detail, 120);
      if (name !== expected[index] || !detail) return null;
      phases.push({ name, detail });
    }
    return { type: "cell-division", title: safeText(raw.title, 80), mode: raw.mode, phases };
  }

  if (raw.type === "organ-system") {
    const allowed = ["nervous", "circulatory", "respiratory", "digestive", "endocrine", "urinary", "skeletal", "muscular"];
    if (!allowed.includes(String(raw.system)) || !Array.isArray(raw.structures)
      || raw.structures.length < 2 || raw.structures.length > 12) return null;
    const structures: Array<{ id: string; name: string; x: number; y: number; role: string }> = [];
    const ids = new Set<string>();
    for (const entry of raw.structures) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      const name = safeText(item.name, 48);
      const role = safeText(item.role, 100);
      if (!id || ids.has(id) || !name || !role || !finite(item.x, 10, 90) || !finite(item.y, 8, 92)) return null;
      ids.add(id);
      structures.push({ id, name, x: item.x, y: item.y, role });
    }
    return { type: "organ-system", title: safeText(raw.title, 80), system: raw.system as "nervous" | "circulatory" | "respiratory" | "digestive" | "endocrine" | "urinary" | "skeletal" | "muscular", structures };
  }

  if (raw.type === "neuron") {
    if (!Array.isArray(raw.parts) || raw.parts.length < 4 || raw.parts.length > 8) return null;
    const allowed = ["dendritas", "soma", "núcleo", "cono axónico", "axón", "mielina", "nodos de Ranvier", "terminales sinápticas"];
    const parts: Array<{ id: string; name: string; role: string }> = [];
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const entry of raw.parts) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const id = safeId(item.id);
      const name = safeText(item.name, 36);
      const role = safeText(item.role, 110);
      if (!id || ids.has(id) || !allowed.includes(name.toLocaleLowerCase("es")) || names.has(name.toLocaleLowerCase("es")) || !role) return null;
      ids.add(id);
      names.add(name.toLocaleLowerCase("es"));
      parts.push({ id, name, role });
    }
    if (!["dendritas", "soma", "axón", "terminales sinápticas"].every((name) => names.has(name))) return null;
    return { type: "neuron", title: safeText(raw.title, 80), parts };
  }

  if (raw.type === "physiology-process") {
    const sequences: Record<string, string[]> = {
      "blood-flow": ["Venas cavas", "Aurícula derecha", "Ventrículo derecho", "Arterias pulmonares", "Pulmones", "Venas pulmonares", "Aurícula izquierda", "Ventrículo izquierdo", "Aorta y cuerpo"],
      "gas-exchange": ["Aire llega al alvéolo", "Ventilación y difusión", "Oxígeno pasa a la sangre", "Dióxido de carbono pasa al alvéolo", "La sangre sale oxigenada"],
      digestion: ["Boca", "Esófago", "Estómago", "Intestino delgado", "Absorción de nutrientes", "Intestino grueso", "Eliminación"],
      "nephron-filtration": ["Glomérulo", "Cápsula de Bowman", "Túbulo proximal", "Asa de Henle", "Túbulo distal", "Conducto colector", "Orina hacia la pelvis renal"],
      "muscle-contraction": ["Impulso llega a la unión neuromuscular", "Se libera acetilcolina", "Se propaga el potencial muscular", "Retículo libera calcio", "Actina y miosina interactúan", "Sarcómero se acorta", "Calcio se retira y el músculo se relaja"],
      "synaptic-transmission": ["Potencial llega al terminal", "Entran iones calcio", "Vesículas liberan neurotransmisor", "Neurotransmisor cruza la hendidura", "Se une a receptores", "La célula postsináptica responde", "Neurotransmisor se elimina o recicla"],
    };
    const expected = sequences[String(raw.process)];
    if (!expected || !Array.isArray(raw.stages) || raw.stages.length !== expected.length) return null;
    const stages: Array<{ name: string; detail: string; location: string }> = [];
    for (let index = 0; index < expected.length; index += 1) {
      const entry = raw.stages[index];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const name = safeText(item.name, 64);
      const detail = safeText(item.detail, 140);
      const location = safeText(item.location, 64);
      if (name !== expected[index] || !detail || !location) return null;
      stages.push({ name, detail, location });
    }
    return { type: "physiology-process", title: safeText(raw.title, 80), process: raw.process as "blood-flow" | "gas-exchange" | "digestion" | "nephron-filtration" | "muscle-contraction" | "synaptic-transmission", stages };
  }

  if (raw.type === "timeline") {
    if (!Array.isArray(raw.events) || raw.events.length < 2 || raw.events.length > 8) return null;
    const events: Array<{ label: string; detail?: string; position: number }> = [];
    let previous = -1;
    for (const entry of raw.events) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const event = entry as Record<string, unknown>;
      const label = safeText(event.label, 48);
      const detail = safeText(event.detail, 80);
      if (!label || !finite(event.position, 0, 100) || event.position <= previous) return null;
      previous = event.position;
      events.push({ label, ...(detail ? { detail } : {}), position: event.position });
    }
    return { type: "timeline", title: safeText(raw.title, 80), events };
  }

  return null;
}

/** Strictly validates model-produced board data; the client renders only known React/SVG primitives. */
export function sanitizeOrbyBoard(value: unknown): OrbyBoard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if ((raw.version !== 1 && raw.version !== 2) || !Array.isArray(raw.blocks)
    || raw.blocks.length === 0 || raw.blocks.length > MAX_BLOCKS) return null;
  const title = safeText(raw.title, 100);
  if (!title) return null;
  const spokenCue = raw.spokenCue === undefined ? "" : safeText(raw.spokenCue, 100);
  const spokenCueWords = spokenCue ? spokenCue.split(/\s+/).filter(Boolean).length : 0;
  if (raw.spokenCue !== undefined && (spokenCueWords < 3 || spokenCueWords > 12)) return null;

  const blocks: OrbyBoardBlock[] = [];
  for (const candidate of raw.blocks) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const item = candidate as Record<string, unknown>;
    const type = item.type;
    if (type === "heading" || type === "text" || type === "formula" || type === "callout") {
      const text = safeText(item.text);
      if (!text) return null;
      blocks.push({ type, text });
    } else if (type === "step") {
      const label = safeText(item.label, 48);
      const text = safeText(item.text);
      if (!label || !text) return null;
      blocks.push({ type, label, text });
    } else {
      return null;
    }
  }

  if (raw.version === 1) {
    if (raw.visuals !== undefined) return null;
    return { version: 1, title, blocks, ...(spokenCue ? { spokenCue } : {}) };
  }
  if (!Array.isArray(raw.visuals) || raw.visuals.length > MAX_VISUALS) return null;
  const visuals: OrbyBoardVisual[] = [];
  for (const candidate of raw.visuals) {
    const visual = sanitizeVisual(candidate);
    if (!visual) return null;
    visuals.push(visual);
  }
  return { version: 2, title, blocks, visuals, ...(spokenCue ? { spokenCue } : {}) };
}
