import { Behavior, Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "render_orby_teaching_board",
        behavior: Behavior.NON_BLOCKING,
        description: "Builds the visual teaching board DURING a spoken Saber 11 lesson. For a substantial explanation, make the first call as soon as teaching starts and BEFORE the first long spoken section. Then make one new tool call at each meaningful teaching transition (new step, formula, worked calculation, comparison, or diagram), immediately before explaining that section. Aim for 3–6 updates on a multi-step lesson, never more than 8 in one student turn. Send ONE call at a time; never bundle multiple board snapshots into the same functionCalls event. Every call must contain the FULL cumulative current board (all blocks and visuals that should remain visible), not just a fragment. Keep stable IDs for every existing sketch stroke; append only new strokes for each new teaching beat. The client animates only newly mounted strokes, so never regenerate IDs for existing ink. Every valid snapshot is rendered immediately; do not synchronize drawing to transcript phrase matching. Speak each label while drawing it, describe each arrow as it appears, and explain each new diagram part immediately after it appears. If a useful cue cannot be spoken verbatim, omit it rather than inventing timing. Keep the narration and visual sequence aligned: speak the label while writing it, describe each arrow as it is drawn, and explain each new diagram part immediately after it appears. Use version 1 for text-only boards and version 2 when visuals are included. For every new version 2 class, include the optional spatial layout: one shared 16:9 canvas where each block and visual is placed exactly once by a stable element ID and zero-based index. Order elements with a strictly increasing sequence. Use the composition of a real teacher board: heading near the top, concise notes on the left, the main drawing in the center, and explanation/callouts on the right. Keep positions and sizes inside 0–100; do not overlap unrelated content, and leave clear space around the main illustration. Every block and visual must be referenced exactly once. The layout is a complete snapshot just like blocks and visuals; preserve prior element IDs and sequence values across cumulative updates, appending new stages only. If no useful spatial composition is possible, omit layout and use the compatible legacy rendering. For diagrams that benefit from a human teacher's hand-drawn look, use exactly ONE cumulative sketch visual per board so there is only one physical pen timeline. Never split a single drawing across multiple sketch visuals. Append new strokes to the same visual and preserve stable IDs for unchanged ink. Draw the outer shape first, then internal structures, arrows, and labels. Each snapshot should add only 2–5 new strokes, but include all prior strokes that should remain visible. Keep each update legible and lightweight; use 1–2 visual primitives per snapshot (absolute maximum four). Visuals available: sketch (natural freehand pen strokes with a 2–40 point curved path per stroke, 2–5 new strokes per update, stable IDs for unchanged strokes, labels drawn after their stroke; full cumulative set of all still-visible strokes), diagram (nodes and directed edges), graph (explicit bounded axes and points), vectors (origin and labeled components), table (headers and rows), timeline (ordered events), molecule (atoms and single/double/triple covalent bonds), circuit (battery/resistor/lamp/switch components and wire connections), cell (animal/plant/prokaryotic cell with labeled organelles), dna (complementary base pairs), punnett (2×2 single-gene cross with two gametes per parent), cell-division (canonical mitosis or meiosis stages in order), organ-system (human body system with labeled structures and physiological roles), neuron (dendrites, soma, axon, myelin, nodes and synaptic terminals), physiology-process (blood flow, alveolar gas exchange, digestion, nephron filtration, muscle contraction, synaptic transmission as fixed ordered stages). Use exact lowercase type names. For sketch, use a 100×100 canvas with x/y coordinates from 4 to 96, 2–40 points per stroke, 1–40 total cumulative strokes per sketch (subject to the 18 KB complete-board limit), tones ink (black)/blue/red/accent/muted/success, and width 0.6–2.4. Prefer ink for outlines and writing, blue for explanatory labels and internal structures, and red for emphasis, underlines and arrows. Use colors consistently. Shape strokes as a teacher would draw them: outline first, then internal lines/arrows, then labels; keep each update small and cumulative. Reuse the same stroke IDs for unchanged lines; omit obsolete strokes and replace corrected geometry with the same ID but updated points. Never fabricate fine detail that would be illegible at student viewing size. Coordinate ranges: diagram nodes 5–95; vector origin 10–90 and components -40 to 40; graph points within declared axis bounds; molecule and circuit coordinates 8–92; cell organelles and organ-system structures 10–90. Keep biological and physiological stages in canonical order. Do not invent measurements, dates, formulas, labels, or experimental results. Use concise Spanish text; no HTML, SVG, Markdown, URLs, or code. Never wait until the end of the answer to draw. Omit the board for greetings or short replies.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            version: { type: Type.NUMBER, description: "1 for text-only, 2 when visuals are present." },
            title: { type: Type.STRING, description: "Short Spanish title, at most 100 characters." },
            blocks: {
              type: Type.ARRAY,
              description: "One to eight ordered teaching blocks.",
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
              description: "Optional spatial composition for version 2. When present, every block and every visual must be referenced exactly once. Use a single 16:9 canvas and append new ordered stages in cumulative snapshots.",
              properties: {
                aspectRatio: { type: Type.STRING, format: "enum", enum: ["16:9"], description: "Must be exactly 16:9." },
                elements: {
                  type: Type.ARRAY,
                  minItems: "1",
                  maxItems: "12",
                  description: "Ordered spatial teaching stages. Each entry references one block or visual by its zero-based index and defines a normalized position and size inside the shared 0–100 canvas.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$", description: "Stable unique element ID, preserved across snapshots." },
                      sequence: { type: Type.NUMBER, format: "int32", minimum: 1, maximum: 1000, description: "Strictly increasing positive integer teaching order; preserve surviving values when a stage is removed and never renumber existing elements." },
                      kind: { type: Type.STRING, format: "enum", enum: ["block", "visual"], description: "Exactly block or visual." },
                      index: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 11, description: "Zero-based index into blocks[] or visuals[] according to kind." },
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
            visuals: {
              type: Type.ARRAY,
              description: "Optional, up to four typed visual primitives. Include only when materially useful.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Exact lowercase type: sketch | annotation | diagram | graph | vectors | table | timeline | molecule | circuit | cell | dna | punnett | cell-division | organ-system | neuron | physiology-process." },
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
        description: "Teacher-only incremental actions on the active cumulative board. EVERY operation must echo the exact turnGeneration returned by the current board snapshot; stale generations are rejected. Legacy operations remain available: focus (strokeId or spatial elementId), erase (existing stroke IDs), and replace (same stroke ID with corrected geometry). For new writing/drawing, use append-block to write one validated heading/text/formula/step/callout at a position on the existing 16:9 canvas, or append-strokes to add 1–5 new freehand strokes to the existing sketch element. Every new append action also MUST include a stable actionId, a strictly increasing integer sequence starting at 1 for this turn, and optional dependsOn action IDs that have already been accepted. Never reuse action IDs, skip ahead of an unaccepted dependency, or send old actions after interruption. Use one action per event. Keep existing content and IDs; never replace the entire board. All payloads are sanitized by the client. Narrate the writing/drawing naturally while it appears; never wait for the action response to continue speaking.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            operation: { type: Type.STRING, enum: ["focus", "erase", "replace", "append-block", "append-strokes"], description: "Exact operation: focus, erase, replace, append-block or append-strokes." },
            turnGeneration: { type: Type.NUMBER, format: "int32", minimum: 0, maximum: 1000000, description: "Required for append operations; echo the exact generation returned by the active board snapshot. Stale generations are rejected." },
            actionId: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$", description: "Required for append operations; stable idempotency key unique in this turn." },
            sequence: { type: Type.NUMBER, format: "int32", minimum: 1, maximum: 1000, description: "Required for append operations; strictly increasing action order within the active student turn." },
            dependsOn: { type: Type.ARRAY, maxItems: "5", description: "Optional previously accepted action IDs that must already exist before this action.", items: { type: Type.STRING, minLength: "1", maxLength: "24", pattern: "^[a-zA-Z0-9_-]+$" } },
            elementId: { type: Type.STRING, description: "Existing layout element ID for focus or append-strokes; for append-block this is the new stage ID." },
            block: { type: Type.OBJECT, description: "For append-block: one block with type heading/text/formula/callout and text, or step with label and text.", properties: {
              type: { type: Type.STRING, format: "enum", enum: ["heading", "text", "formula", "step", "callout"] },
              text: { type: Type.STRING },
              label: { type: Type.STRING },
            }, required: ["type", "text"] },
            position: { type: Type.OBJECT, description: "For append-block: normalized 0–100 position and size in the shared 16:9 canvas.", properties: {
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
            elementId: { type: Type.STRING, description: "Existing layout element ID for focus only. Use the exact ID from the active board layout; do not invent one." },
            label: { type: Type.STRING, description: "Optional short Spanish focus label, maximum 48 characters." },
            strokeIds: { type: Type.ARRAY, description: "One to eight existing stroke IDs for selective erase.", items: { type: Type.STRING } },
            replacement: {
              type: Type.OBJECT,
              description: "Replacement geometry for the existing stroke. Keep its exact strokeId as id and preserve the teacher palette: ink (black), blue, red, accent, muted or success.",
              properties: {
                id: { type: Type.STRING },
                points: { type: Type.ARRAY, minItems: 2, maxItems: 40, items: { type: Type.OBJECT, properties: {
                  x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                }, required: ["x", "y"] } },
                tone: { type: Type.STRING, description: "ink (black), blue, red, accent, muted or success." }, width: { type: Type.NUMBER },
                label: { type: Type.STRING }, labelX: { type: Type.NUMBER }, labelY: { type: Type.NUMBER },
              },
              required: ["id", "points"],
            },
          },
          required: ["operation", "turnGeneration"],
        },
      },
      {
        name: "search_orby_learning_knowledge",
        behavior: Behavior.NON_BLOCKING,
        description: "Searches PeakScore’s published Saber 11 learning library and may add free public research only when the student asks for sources or external verification. This tool is OPTIONAL and must never gate, delay, or interrupt teaching. Do NOT call it for every new academic question. Teach directly from reliable academic knowledge and start the spoken explanation immediately. Call this tool only when the student explicitly requests sources, current information, external verification, or asks what published PeakScore material says; it may also be used when a specific claim genuinely requires checking the published library. If the library is empty, unavailable, or returns no relevant material, continue the lesson without waiting for retries and without implying that deleted or unpublished Lab content exists. Never cite or claim retrieved content before receiving it. Resolve short follow-ups from the conversation; do not search for greetings, confirmations, or a follow-up already fully answered in the current context. Send the complete contextualized question and current Saber 11 subject. If no relevant published material is found, continue teaching from reliable model knowledge without pretending the library contained evidence.",
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
