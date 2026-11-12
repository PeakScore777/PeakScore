import { Behavior, Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "render_orby_teaching_board",
        behavior: Behavior.NON_BLOCKING,
        description: "Builds the visual teaching board DURING a spoken Saber 11 lesson. At the opening of a class, FIRST speak one complete natural sentence that names the topic and states its central idea. Never make a board tool call the first model output or the first event of the lesson. AFTER that first spoken sentence, make the first board call immediately before the next longer explanation. Then make one new tool call at each meaningful teaching transition (new step, formula, worked calculation, comparison, or diagram), immediately before explaining that section. Then make one new tool call at each meaningful teaching transition (new step, formula, worked calculation, comparison, or diagram), immediately before explaining that section. Aim for 3–6 updates on a multi-step lesson, never more than 8 in one student turn. Send ONE call at a time; never bundle multiple board snapshots into the same functionCalls event. Every call must contain the FULL cumulative current board (all blocks and visuals that should remain visible), not just a fragment. Keep stable IDs for every existing sketch stroke; append only new strokes for each new teaching beat. The client animates only newly mounted strokes, so never regenerate IDs for existing ink. For spoken Live lessons, include spokenCue on every staged snapshot: an exact 3–12-word phrase copied verbatim from the assistant's spoken transcript, identifying the first words that should be heard before this visual stage is revealed. The client queues that cumulative snapshot until the audio-clock subtitle index reaches the cue; do not reveal the stage early. If no exact phrase is available, omit spokenCue and keep the snapshot immediate. Do not invent a cue or use approximate paraphrases. During the explanation, write only the key ideas the student must retain (short definitions, phases, causes, formulas, evidence and conclusions), one at a time as they are spoken; never paste the entire lecture at the beginning. At each key term or result, add the underline, circle or arrow as new strokes on the same cumulative sketch; do not create a separate card or annotation visual for every phrase. Keep the previous notes visible while adding the next point. Speak each label while drawing it, describe each arrow as it appears, and explain each new diagram part immediately after it appears. If a useful cue cannot be spoken verbatim, omit it rather than inventing timing. Keep the narration and visual sequence aligned: speak the label while writing it, describe each arrow as it is drawn, and explain each new diagram part immediately after it appears. Prefer version 2 for a focused lesson that fits on one sheet; use version 3 only when the explanation genuinely needs more space. The board must read as one continuous teaching surface, never as a grid or stack of content cards. For version 2, use one 16:9 layout with no pageCount/page fields. For version 3, set layout.pageCount from 2 to 4 and add a zero-based page index (0 to pageCount-1) to every layout element. Each sheet is 16:9 and holds at most 12 positioned elements; the whole class snapshot may contain up to 24 text blocks and 8 visual primitives. Stack sheets vertically in teaching order so the student scrolls through one continuous lesson instead of squeezing an entire class onto one screen. Keep each page composed like a real teacher board: heading near the top, concise notes on the left, the main drawing in the center, and explanation/callouts on the right. Keep positions and sizes inside 0–100; do not overlap unrelated content, and leave clear space around the main illustration. Every block and visual must be referenced exactly once across all pages. The layout is a complete snapshot just like blocks and visuals; preserve prior page assignments, element IDs and sequence values across cumulative updates, appending new stages only. If no useful spatial composition is possible, omit layout and use the compatible legacy rendering. For diagrams that benefit from a human teacher's hand-drawn look, use exactly ONE cumulative sketch visual per board so there is only one physical pen timeline. Never split a single drawing across multiple sketch visuals. Append new strokes to the same visual and preserve stable IDs for unchanged ink. Draw the outer shape first, then internal structures, arrows, and labels. Each snapshot should add only 2–5 new strokes, but include all prior strokes that should remain visible. Keep each update legible and lightweight; use 1–2 visual primitives per snapshot (absolute maximum four). For annotation: circle, underline, arrow or bracket. COMPOSICIÓN DIDÁCTICA Y TEORÍA: escribe como profesor en una pizarra real, no como página de apuntes ni interfaz de tarjetas. El título principal ya aparece en la parte superior de la hoja: no lo repitas en un bloque. Divide la teoría en 3–5 ideas breves y progresivas; cada bloque debe contener una sola idea, idealmente 6–16 palabras y nunca un párrafo largo. Usa heading para subtítulos de sección, step para una secuencia, formula para relaciones y text solo para una explicación breve; deja aire entre ideas sin aislarlas en cajas. Organiza la composición por proximidad semántica: explicación a la izquierda, un dibujo principal grande en el centro y 1–3 etiquetas/observaciones cercanas a la derecha. La ilustración principal debe ocupar aproximadamente 35–48% del ancho y 55–75% de la altura útil de la hoja; las notas deben quedar a su altura, no todas amontonadas en la franja superior. Aprovecha el centro y la mitad inferior del lienzo, con una distribución equilibrada y sin un enorme espacio vacío. Nunca uses mosaicos, miniaturas, paneles repetidos ni tarjetas independientes para explicar fases. Para mitosis/meiosis dibuja las fases conectadas dentro de una sola escena horizontal, con células grandes y flechas; no uses cuatro tarjetas. Para una idea simple dibuja una sola escena sketch progresiva; para células, organelos, tejidos, neuronas y anatomía interna usa una ilustración vectorial científica grande, con contornos reconocibles, componentes internos diferenciados, proporciones correctas, líneas guía y etiquetas conectadas. Nunca reduzcas una célula u organelo a círculos o manchas genéricas. Revela primero el contorno, luego las partes internas y al final las etiquetas; explica cada parte en voz mientras aparece. No inventes detalles para decorar: si el dibujo no mejora la comprensión, omítelo. Visuals available: sketch (natural freehand pen strokes with a 2–40 point curved path per stroke, 2–5 new strokes per update, stable IDs for unchanged strokes, labels drawn after their stroke; full cumulative set of all still-visible strokes), vector-illustration (AI-FIRST detailed scientific SVG scene graph, not a generic icon: normally 10–24 coordinated paths/circles/ellipses/lines/polygons with stable unique IDs and 3–8 concise Spanish labels; compose one recognizable subject with correct proportions and spatial relationships; use closed cubic Bézier contours for organic membranes, organs, cells and tissues, restrained layered fills for depth, differentiated internal structures and fine leader lines that point to the exact structure; use a clean whiteboard palette of black ink, scientific blue, restrained red and subtle natural tones; plan the whole illustration before emitting shapes; outer silhouette first, then major structures, internal details, shading and leader lines, labels last; make labels readable and avoid crossings/overlaps; build a coherent textbook plate with visual hierarchy, believable proportions, negative space and a clear focal structure; use varied contour geometry and meaningful internal detail rather than repeated circles, generic blobs or icon-like symbols; labels must name actual ICFES-relevant structures in concise Colombian Spanish and leader lines must terminate on the structure they identify; sequence shapes in the intended drawing order (silhouette, primary anatomy, secondary anatomy, details, leader lines, labels); never return raw SVG or HTML), diagram (nodes and directed edges), graph (explicit bounded axes and points), vectors (origin and labeled components), table (headers and rows), timeline (ordered events), molecule (atoms and single/double/triple covalent bonds), circuit (battery/resistor/lamp/switch components and wire connections), cell (animal/plant/prokaryotic cell with labeled organelles), dna (complementary base pairs), punnett (2×2 single-gene cross with two gametes per parent), cell-division (only for an explicit stage-by-stage comparison; render one integrated large process illustration with connected stages, never four isolated cards or a tiny tile grid), organ-system (human body system with labeled structures and physiological roles), neuron (dendrites, soma, axon, myelin, nodes and synaptic terminals), physiology-process (blood flow, alveolar gas exchange, digestion, nephron filtration, muscle contraction, synaptic transmission as fixed ordered stages). Use exact lowercase type names. AI-FIRST FALLBACK POLICY: prefer one cumulative sketch for simple conceptual teaching, mechanisms, arrows, cycles and emphasis because its strokes should look like a teacher's live pen. Use vector-illustration only when a scientifically detailed anatomical or microscopic drawing needs more structure; use graph, molecule, circuit or other typed visuals only when their exact semantics are needed. Do NOT request a bank key merely because the topic has one. Request a curated visualBankKeys entry only when you cannot confidently construct a scientifically correct, complete, legible scene with the available visual types, or when the concept is canonical and exact geometry is essential. Never request a bank key alongside a successful AI-generated illustration. If an AI scene fails validation, the client may replace it with the matching approved bank visual. A curated visual bank is available for that fallback: biology.plant-cell, biology.animal-cell, biology.dna-base-pairs, biology.photosynthesis, biology.mitosis, biology.punnett-monohybrid, biology.neuron, biology.blood-flow, chemistry.water-molecule, chemistry.atom-structure, chemistry.states-of-matter, chemistry.ph-scale, physics.simple-circuit, physics.vector-components, physics.motion-graph, math.linear-function, math.quadratic-function, math.pythagorean-theorem, math.probability-table, social.branches-of-power, social.supply-demand, social.history-timeline, reading.communication-model, english.sentence-connectors, reading.text-structure. For sketch, use a 100×100 canvas with x/y coordinates from 4 to 96, 2–40 points per stroke, 1–40 total cumulative strokes per sketch (subject to the 18 KB complete-board limit), tones ink (black)/blue/red/accent/muted/success, and width 0.6–2.4. Prefer ink for outlines and writing, blue for explanatory labels and internal structures, and red for emphasis, underlines and arrows. Use colors consistently. Shape strokes as a teacher would draw them: outline first, then internal lines/arrows, then labels; keep each update small and cumulative. Reuse the same stroke IDs for unchanged lines; omit obsolete strokes and replace corrected geometry with the same ID but updated points. Never fabricate fine detail that would be illegible at student viewing size. Coordinate ranges: diagram nodes 5–95; vector origin 10–90; every vector endpoint must remain inside 4–96 and components -40 to 40; graph points within declared axis bounds; molecule and circuit coordinates 8–92; cell organelles and organ-system structures 10–90. Keep biological and physiological stages in canonical order. Do not invent measurements, dates, formulas, labels, or experimental results. Use concise Spanish text; no HTML, SVG, Markdown, URLs, or code. Never wait until the end of the answer to draw. Omit the board for greetings or short replies.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            version: { type: Type.NUMBER, description: "1 for text-only, 2 for one spatial sheet, 3 for a multi-sheet lesson." },
            title: { type: Type.STRING, description: "Short Spanish title, at most 100 characters." },
            spokenCue: { type: Type.STRING, description: "Optional exact 3–12-word phrase copied verbatim from this assistant turn. The cumulative board snapshot is revealed only when the audio-clock subtitle index reaches the end of this phrase. Never paraphrase or invent it; omit when no exact spoken phrase is available." },
            blocks: {
              type: Type.ARRAY,
              description: "Ordered text blocks. v1/v2 allow up to 8; v3 allows up to 24 across all pages.",
              maxItems: "24",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "One of heading, text, formula, step, callout." },
                  text: { type: Type.STRING, description: "Concise Spanish content." },
                  label: { type: Type.STRING, description: "Short step label when type is step." },
                },
                required: ["type", "text"],
              },
            },
            layout: {
              type: Type.OBJECT,
              description: "Spatial composition for version 2 (one sheet) or version 3 (2–4 vertically chained 16:9 sheets). Every block and visual must be referenced exactly once across the whole class.",
              properties: {
                aspectRatio: { type: Type.STRING, format: "enum", enum: ["16:9"], description: "Must be exactly 16:9." },
                pageCount: { type: Type.NUMBER, format: "int32", minimum: 2, maximum: 4, description: "Required for version 3 only; number of consecutive 16:9 sheets in the vertical class canvas." },
                elements: {
                  type: Type.ARRAY,
                  minItems: "1",
                  maxItems: "32",
                  description: "Ordered spatial stages. Every block/visual appears once. v2 has one page; v3 uses page 0..pageCount-1, maximum 12 elements on each page, 32 elements total.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$", description: "Stable unique element ID, preserved across snapshots." },
                      sequence: { type: Type.NUMBER, format: "int32", minimum: 1, maximum: 1000, description: "Strictly increasing positive integer teaching order; preserve surviving values when a stage is removed and never renumber existing elements." },
                      kind: { type: Type.STRING, format: "enum", enum: ["block", "visual"], description: "Exactly block or visual." },
                      index: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 23, description: "Zero-based index into blocks[] or visuals[] according to kind." },
                      page: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 3, description: "Required for version 3 only; zero-based sheet this element belongs to." },
                      x: { type: Type.NUMBER, minimum: 0, maximum: 100, description: "Left position from 0 to 100." },
                      y: { type: Type.NUMBER, minimum: 0, maximum: 100, description: "Top position from 0 to 100." },
                      width: { type: Type.NUMBER, minimum: 8, maximum: 100, description: "Width from 8 to 100; x + width cannot exceed 100." },
                      height: { type: Type.NUMBER, minimum: 8, maximum: 100, description: "Height from 8 to 100; y + height cannot exceed 100." },
                    },
                    required: ["id", "sequence", "kind", "index", "x", "y", "width", "height"],
                  },
                },
              },
              required: ["aspectRatio", "elements"],
            },
            visualBankKeys: {
              type: Type.ARRAY,
              description: "Optional allowlisted reusable visuals for a known lesson topic. Request one or two exact keys only when a matching curated teaching visual improves this explanation; the client inserts the canonical validated primitive into the cumulative board.",
              maxItems: "2",
              items: {
                type: Type.STRING,
                format: "enum",
                enum: [
                  "biology.plant-cell", "biology.animal-cell", "biology.dna-base-pairs", "biology.photosynthesis",
                  "biology.mitosis", "biology.punnett-monohybrid", "biology.neuron", "biology.blood-flow",
                  "chemistry.water-molecule", "chemistry.atom-structure", "chemistry.states-of-matter", "chemistry.ph-scale",
                  "physics.simple-circuit", "physics.vector-components", "physics.motion-graph",
                  "math.linear-function", "math.quadratic-function", "math.pythagorean-theorem", "math.probability-table",
                  "social.branches-of-power", "social.supply-demand", "social.history-timeline",
                  "reading.communication-model", "english.sentence-connectors", "reading.text-structure",
                ],
              },
            },
            visuals: {
              type: Type.ARRAY,
              description: "Optional typed visual primitives. v1/v2 allow up to four; v3 allows up to eight across all pages. Include only when materially useful.",
              maxItems: "8",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Exact lowercase type: sketch | vector-illustration | annotation | diagram | graph | vectors | table | timeline | molecule | circuit | cell | dna | punnett | cell-division | organ-system | neuron | physiology-process. Do not author image visuals." },
                  title: { type: Type.STRING },
                  mark: { type: Type.STRING, description: "For annotation: circle, underline, arrow or bracket." },
                  tone: { type: Type.STRING, description: "For annotation: blue, red, accent, success or muted." },
                  label: { type: Type.STRING, description: "Optional concise annotation label." },
                  nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING }, label: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                  }, required: ["id", "label", "x", "y"] } },
                  edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                    from: { type: Type.STRING }, to: { type: Type.STRING }, label: { type: Type.STRING },
                  }, required: ["from", "to"] } },
                  xLabel: { type: Type.STRING }, yLabel: { type: Type.STRING },
                  xMin: { type: Type.NUMBER }, xMax: { type: Type.NUMBER },
                  yMin: { type: Type.NUMBER }, yMax: { type: Type.NUMBER },
                  points: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                    x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, label: { type: Type.STRING },
                  }, required: ["x", "y"] } },
                  kind: { type: Type.STRING, description: "line or scatter." },
                  origin: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ["x", "y"] },
                  vectors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                    label: { type: Type.STRING }, dx: { type: Type.NUMBER }, dy: { type: Type.NUMBER },
                  }, required: ["label", "dx", "dy"] } },
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                  events: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                    label: { type: Type.STRING }, detail: { type: Type.STRING }, position: { type: Type.NUMBER },
                  }, required: ["label", "position"] } },
                  shapes: { type: Type.ARRAY, maxItems: "40", description: "For vector-illustration: safe SVG scene graph rendered by PeakScore, never raw SVG/HTML. Use 1–40 shapes; prefer smooth cubic paths for organic scientific illustrations. Coordinates are 0–100. Kinds: path, circle, ellipse, line, polygon. Paths use commands M/L with x,y; C with x1,y1,x2,y2,x,y; Q with x1,y1,x,y; or Z. Fill is none or one of ink, blue, red, orange, green, yellow, teal, purple, muted, white. Stroke uses the same palette except none. Stroke width 0.35–4, opacity 0.1–1.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$", description: "Stable unique shape ID preserved in every cumulative snapshot." },
                    kind: { type: Type.STRING, enum: ["path", "circle", "ellipse", "line", "polygon"] },
                    commands: { type: Type.ARRAY, maxItems: "32", items: { type: Type.OBJECT, properties: {
                      op: { type: Type.STRING, enum: ["M", "L", "C", "Q", "Z"] },
                      x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                      x1: { type: Type.NUMBER }, y1: { type: Type.NUMBER },
                      x2: { type: Type.NUMBER }, y2: { type: Type.NUMBER },
                    }, required: ["op"] } },
                    cx: { type: Type.NUMBER }, cy: { type: Type.NUMBER }, r: { type: Type.NUMBER },
                    rx: { type: Type.NUMBER }, ry: { type: Type.NUMBER },
                    x1: { type: Type.NUMBER }, y1: { type: Type.NUMBER }, x2: { type: Type.NUMBER }, y2: { type: Type.NUMBER },
                    points: { type: Type.ARRAY, maxItems: "32", items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ["x", "y"] } },
                    fill: { type: Type.STRING, enum: ["none", "ink", "blue", "red", "orange", "green", "yellow", "teal", "purple", "muted", "white"] },
                    stroke: { type: Type.STRING, enum: ["ink", "blue", "red", "orange", "green", "yellow", "teal", "purple", "muted", "white"] },
                    strokeWidth: { type: Type.NUMBER }, opacity: { type: Type.NUMBER },
                  }, required: ["id", "kind"] } },
                  labels: { type: Type.ARRAY, maxItems: "18", description: "Optional short Spanish labels outside the illustration geometry; PeakScore renders them as real SVG text.", items: { type: Type.OBJECT, properties: {
                    x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, text: { type: Type.STRING },
                    tone: { type: Type.STRING, enum: ["ink", "blue", "red", "orange", "green", "yellow", "teal", "purple", "muted", "white"] },
                    anchor: { type: Type.STRING, enum: ["start", "middle", "end"] },
                  }, required: ["x", "y", "text"] } },
                  strokes: { type: Type.ARRAY, description: "Freehand sketch strokes. Use a short progressive subset per update and include the complete cumulative set that should remain visible.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING, description: "Stable unique stroke ID, reused when this stroke remains unchanged." },
                    points: { type: Type.ARRAY, description: "2–40 points in order on the 0–100 canvas, each coordinate between 4 and 96; keep curves simple and natural.", items: { type: Type.OBJECT, properties: {
                      x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                    }, required: ["x", "y"] } },
                    tone: { type: Type.STRING, description: "ink (black), blue, red, accent, muted or success." },
                    width: { type: Type.NUMBER, description: "Stroke width from 0.6 to 2.4." },
                    label: { type: Type.STRING, description: "Optional concise label; when present, both labelX and labelY are required and it appears after its stroke." },
                    labelX: { type: Type.NUMBER, description: "Required with label; x position from 4 to 96." },
                    labelY: { type: Type.NUMBER, description: "Required with label; y position from 4 to 96." },
                  }, required: ["id", "points"] } },

                  atoms: { type: Type.ARRAY, description: "Molecular atoms; element is a chemical symbol, coordinates 8–92.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING }, element: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, charge: { type: Type.STRING },
                  }, required: ["id", "element", "x", "y"] } },
                  bonds: { type: Type.ARRAY, description: "Covalent bonds between declared atom IDs; order 1, 2 or 3.", items: { type: Type.OBJECT, properties: {
                    from: { type: Type.STRING }, to: { type: Type.STRING }, order: { type: Type.NUMBER },
                  }, required: ["from", "to", "order"] } },
                  components: { type: Type.ARRAY, description: "Circuit components placed on the 0–100 canvas.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING }, kind: { type: Type.STRING, description: "battery, resistor, lamp or switch." }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, label: { type: Type.STRING },
                  }, required: ["id", "kind", "x", "y", "label"] } },
                  connections: { type: Type.ARRAY, description: "Wire connections between component IDs.", items: { type: Type.OBJECT, properties: {
                    from: { type: Type.STRING }, to: { type: Type.STRING },
                  }, required: ["from", "to"] } },
                  cellType: { type: Type.STRING, description: "animal, plant or prokaryotic." },
                  organelles: { type: Type.ARRAY, description: "Labeled organelles with positions 10–90 on the 2D cell canvas.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING }, kind: { type: Type.STRING, description: "nucleus, mitochondrion, chloroplast, vacuole, membrane, cell-wall, ribosome, endoplasmic-reticulum, golgi or cytoplasm." }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, label: { type: Type.STRING },
                  }, required: ["id", "kind", "x", "y", "label"] } },
                  pairs: { type: Type.ARRAY, description: "DNA base pairs using only complementary A–T and C–G pairs.", items: { type: Type.OBJECT, properties: {
                    left: { type: Type.STRING, description: "A, T, C or G." }, right: { type: Type.STRING, description: "Complementary base: A–T or C–G." },
                  }, required: ["left", "right"] } },
                  topAlleles: { type: Type.ARRAY, description: "Exactly two alleles contributed by one parent, in gamete order.", items: { type: Type.STRING } },
                  sideAlleles: { type: Type.ARRAY, description: "Exactly two alleles contributed by the other parent, in gamete order.", items: { type: Type.STRING } },
                  mode: { type: Type.STRING, description: "mitosis or meiosis." },
                  phases: { type: Type.ARRAY, description: "Ordered stages: four canonical mitosis stages or eight meiosis I/II stages.", items: { type: Type.OBJECT, properties: {
                    name: { type: Type.STRING }, detail: { type: Type.STRING },
                  }, required: ["name", "detail"] } },
                  system: { type: Type.STRING, description: "nervous, circulatory, respiratory, digestive, endocrine, urinary, skeletal or muscular." },
                  structures: { type: Type.ARRAY, description: "Labeled anatomical structures, schematic positions 10–90 and concise physiological role.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING }, name: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, role: { type: Type.STRING },
                  }, required: ["id", "name", "x", "y", "role"] } },
                  parts: { type: Type.ARRAY, description: "Neuron structures with concise functions; include dendritas, soma, axón and terminales sinápticas.", items: { type: Type.OBJECT, properties: {
                    id: { type: Type.STRING }, name: { type: Type.STRING }, role: { type: Type.STRING },
                  }, required: ["id", "name", "role"] } },
                  process: { type: Type.STRING, description: "blood-flow, gas-exchange, digestion, nephron-filtration, muscle-contraction or synaptic-transmission." },
                  stages: { type: Type.ARRAY, description: "Ordered physiological stages with accurate concise mechanism and anatomical location.", items: { type: Type.OBJECT, properties: {
                    name: { type: Type.STRING }, detail: { type: Type.STRING }, location: { type: Type.STRING },
                  }, required: ["name", "detail", "location"] } },
                },
                required: ["type"],
              },
            },
          },
          required: ["version", "title", "blocks"],
        },
      },
      {
        name: "apply_orby_board_action",
        behavior: Behavior.NON_BLOCKING,
        description: "Teacher-only incremental actions on the active cumulative board. EVERY operation must echo the exact turnGeneration returned by the current board snapshot; stale generations are rejected. Operations: focus (strokeId with optional pointIndex, or spatial elementId with optional targetId for a supported internal visual part), clear-focus (remove only the temporary teacher spotlight while preserving every block and stroke), erase (selected existing stroke IDs), and replace (same stroke ID with corrected geometry). Use clear-focus when the explanation moves on from a highlighted detail; never use erase to clear a spotlight. For exact focus, pointIndex is zero-based and must refer to an existing point in the selected stroke; omit it to focus the middle point. This only moves the teacher spotlight and never adds or changes ink. For audiovisual teaching synchronization, issue focus on the exact existing stroke or visual immediately before the spoken sentence that names/explains it, in the same Live response event; keep the focus visible while discussing that detail, then issue clear-focus before moving to the next board area. Do not use transcript phrase matching, timers, or guessed speech offsets to move the spotlight. Keep narration natural and never wait for the action response. For new writing/drawing, use append-block to write one validated heading/text/formula/step/callout at a position on a selected 16:9 sheet, or append-strokes to add 1–5 new freehand strokes to the existing sketch element. For a version 3 board, include page on append-block: use an existing page index, or page=pageCount to open the next sheet (only up to four total); never move old elements. EVERY operation, including focus, clear-focus, erase and replace, MUST include a stable actionId and strictly increasing integer sequence starting at 1 for this turn. This makes every operation idempotent and prevents delayed duplicate calls from replaying. Optional dependsOn IDs must already have been accepted. Append actions follow the same rule. Never reuse action IDs, skip ahead of an unaccepted dependency, or send old actions after interruption. Use one action per event. Keep existing content and IDs; never replace the entire board. All payloads are sanitized by the client. Narrate the writing/drawing naturally while it appears; never wait for the action response to continue speaking.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            operation: { type: Type.STRING, enum: ["focus", "clear-focus", "erase", "replace", "append-block", "append-strokes"], description: "Exact operation: focus, clear-focus, erase, replace, append-block or append-strokes." },
            turnGeneration: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 1000000, description: "Required for every teacher board action; echo the exact generation returned by the active board snapshot. Stale generations are rejected." },
            actionId: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$", description: "Required for EVERY operation; stable idempotency key unique in this turn, including focus, clear-focus, erase and replace." },
            sequence: { type: Type.NUMBER, format: "int32", minimum: 1, maximum: 1000, description: "Required for EVERY operation; strictly increasing integer action order within the active student turn, starting at 1." },
            dependsOn: { type: Type.ARRAY, maxItems: "5", description: "Optional previously accepted action IDs that must already exist before this action.", items: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$" } },
            elementId: { type: Type.STRING, description: "Existing layout element ID for focus or append-strokes; for append-block this is the new stage ID." },
            targetId: { type: Type.STRING, description: "Optional stable ID of an existing internal visual target inside the selected element: diagram node, molecule atom, cell organelle, circuit component or organ-system structure. Must belong to this exact visual element. Do not use with strokeId or pointIndex." },
            page: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 3, description: "For append-block on a version 3 board: zero-based destination sheet. Use an existing page, or exactly current pageCount to append a new sheet if fewer than four exist. Omit only for legacy version 2." },
            block: { type: Type.OBJECT, description: "For append-block: one block with type heading/text/formula/callout and text, or step with label and text.", properties: {
              type: { type: Type.STRING, format: "enum", enum: ["heading", "text", "formula", "step", "callout"] },
              text: { type: Type.STRING },
              label: { type: Type.STRING },
            }, required: ["type", "text"] },
            position: { type: Type.OBJECT, description: "For append-block: normalized 0–100 position and size on the selected 16:9 sheet.", properties: {
              x: { type: Type.NUMBER, minimum: 0, maximum: 100 },
              y: { type: Type.NUMBER, minimum: 0, maximum: 100 },
              width: { type: Type.NUMBER, minimum: 8, maximum: 100 },
              height: { type: Type.NUMBER, minimum: 8, maximum: 100 },
            }, required: ["x", "y", "width", "height"] },
            strokes: { type: Type.ARRAY, description: "For append-strokes: 1–5 NEW strokes to append to the existing single sketch visual; preserve all previous stroke IDs by not resending them.", minItems: "1", maxItems: "5", items: { type: Type.OBJECT, properties: {
              id: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$" },
              points: { type: Type.ARRAY, minItems: "2", maxItems: "40", items: { type: Type.OBJECT, properties: {
                x: { type: Type.NUMBER, minimum: 4, maximum: 96 }, y: { type: Type.NUMBER, minimum: 4, maximum: 96 },
              }, required: ["x", "y"] } },
              tone: { type: Type.STRING, format: "enum", enum: ["ink", "blue", "red", "accent", "muted", "success"] },
              width: { type: Type.NUMBER, minimum: 0.6, maximum: 2.4 },
              label: { type: Type.STRING, maxLength: "48" },
              labelX: { type: Type.NUMBER, minimum: 4, maximum: 96 },
              labelY: { type: Type.NUMBER, minimum: 4, maximum: 96 },
            }, required: ["id", "points"] } },
            strokeId: { type: Type.STRING, description: "Existing stroke ID for focus or replace. For focus, use either strokeId or elementId, never both." },
            pointIndex: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 39, description: "Optional zero-based point index for exact focus within an existing strokeId. Must be less than that stroke's actual point count. Omit to focus its middle point; do not send with elementId." },
            label: { type: Type.STRING, description: "Optional short Spanish focus label, maximum 48 characters." },
            strokeIds: { type: Type.ARRAY, description: "One to eight existing stroke IDs for selective erase.", items: { type: Type.STRING } },
            replacement: {
              type: Type.OBJECT,
              description: "Replacement geometry for the existing stroke. Keep its exact strokeId as id and preserve the teacher palette: ink (black), blue, red, accent, muted or success.",
              properties: {
                id: { type: Type.STRING },
                points: { type: Type.ARRAY, minItems: "2", maxItems: "40", items: { type: Type.OBJECT, properties: {
                  x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                }, required: ["x", "y"] } },
                tone: { type: Type.STRING, description: "ink (black), blue, red, accent, muted or success." }, width: { type: Type.NUMBER },
                label: { type: Type.STRING }, labelX: { type: Type.NUMBER }, labelY: { type: Type.NUMBER },
              },
              required: ["id", "points"],
            },
          },
          required: ["operation", "turnGeneration", "actionId", "sequence"],
        },
      },
      {
        name: "search_orby_learning_knowledge",
        behavior: Behavior.NON_BLOCKING,
        description: "OPTIONAL: use this tool only when searching the published learning library would materially improve a substantive Saber 11 explanation. For the opening of a live class, first speak the topic and its central idea, then begin the first useful board stage; do not call this tool before that first spoken explanation. When useful, launch the lookup in parallel without waiting for it. Do not call it for greetings, confirmations, routine definitions, repeated prompts, or follow-ups already answered by the current context. A second lookup is allowed only when the first Lab result reveals a specific unresolved prerequisite or a materially important new claim; the entire student turn is capped at two tool calls. Search only PeakScore's published Saber 11 learning library: published document fragments, the published concept graph and related published documents. Add public web research only when the student asks for sources, current facts or external verification. If no relevant published material exists, the Lab is unavailable or its free quota is exhausted, continue teaching from reliable academic knowledge without retries, without claiming that the Lab supplied evidence, and without implying deleted or unpublished Lab material exists. Never cite or claim retrieved content before receiving it. Resolve short follow-ups and send the complete contextualized question plus current Saber 11 subject.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The complete current student question or exercise, with the specific concept and relevant details. Resolve references such as “eso”, “esto”, “ese dato”, “esa afirmación”, “ese tema”, “lo anterior” or “lo que explicaste” from the immediately preceding academic exchange and include the actual concept/topic in the query; for example, turn “dame fuentes de eso” into “fuentes científicas sobre la fotosíntesis” when the prior exchange was about photosynthesis. Do not send only a vague one-word topic or a pronoun without its academic referent.",
            },
            subject: { type: Type.STRING, description: "A Saber 11 subject, when known." },
          },
          required: ["query"],
        },
      },
    ],
  },
];
