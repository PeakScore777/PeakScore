import { Behavior, Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "render_orby_teaching_board",
        behavior: Behavior.NON_BLOCKING,
        description: "Builds the visual teaching board DURING a spoken Saber 11 lesson. For a substantial explanation, make the first call as soon as teaching starts and BEFORE the first long spoken section. Then make one new tool call at each meaningful teaching transition (new step, formula, worked calculation, comparison, or diagram), immediately before explaining that section. Aim for 3–6 updates on a multi-step lesson, never more than 8 in one student turn. Send ONE call at a time; never bundle multiple board snapshots into the same functionCalls event. Every call must contain the FULL cumulative current board (all blocks and visuals that should remain visible), not just a fragment. The newest snapshot is authoritative: omit anything that should be removed and replace corrected content in place. This makes each update render while the next spoken section is being produced. Use version 1 for text-only boards and version 2 when visuals are included. Keep 1–2 useful visual primitives per snapshot (absolute maximum four). Visuals available: diagram (nodes and directed edges), graph (explicit bounded axes and points), vectors (origin and labeled components), table (headers and rows), timeline (ordered events), molecule (atoms and single/double/triple covalent bonds), circuit (battery/resistor/lamp/switch components and wire connections), cell (animal/plant/prokaryotic cell with labeled organelles), dna (complementary base pairs), punnett (2×2 single-gene cross with two gametes per parent), cell-division (canonical mitosis or meiosis stages in order), organ-system (human body system with labeled structures and physiological roles), neuron (dendrites, soma, axon, myelin, nodes and synaptic terminals), physiology-process (blood flow, alveolar gas exchange, digestion, nephron filtration, muscle contraction, synaptic transmission as fixed ordered stages). Use exact lowercase type names. Coordinate ranges: diagram nodes 5–95; vector origin 10–90 and components -40 to 40; graph points within declared axis bounds; molecule and circuit coordinates 8–92; cell organelles and organ-system structures 10–90. Keep biological and physiological stages in canonical order. Do not invent measurements, dates, formulas, labels, or experimental results. Use concise Spanish text; no HTML, SVG, Markdown, URLs, or code. Never wait until the end of the answer to draw. Omit the board for greetings or short replies.",
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
            visuals: {
              type: Type.ARRAY,
              description: "Optional, up to four typed visual primitives. Include only when materially useful.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Exact lowercase type: diagram | graph | vectors | table | timeline | molecule | circuit | cell | dna | punnett | cell-division | organ-system | neuron | physiology-process." },
                  title: { type: Type.STRING },
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
        name: "search_orby_learning_knowledge",
        behavior: Behavior.NON_BLOCKING,
        description: "Searches PeakScore’s published Saber 11 learning library and may add free public research only when the student asks for sources or external verification. MUST call this tool before answering each new substantive academic question that could benefit from published material: a new concept, exercise, reading or graph analysis, exam competency, misconception, or request to deepen an explanation. Resolve short follow-ups from the conversation and search only when they introduce a new concept or need evidence beyond the existing exchange. Do not call for greetings, confirmations, or a follow-up already fully answered in the current context. Send the complete contextualized question and current Saber 11 subject. If no relevant published material is found, continue teaching from reliable model knowledge without pretending the library contained evidence.",
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
