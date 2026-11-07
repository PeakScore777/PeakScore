import { Behavior, Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "render_orby_teaching_board",
        behavior: Behavior.NON_BLOCKING,
        description: "Builds the current visual teaching board DURING a spoken Saber 11 lesson. Call repeatedly as the explanation progresses, not only at the end. Send a cumulative snapshot with the current blocks and up to four visual primitives. Use version 1 for text-only boards; use version 2 when visuals are included. Visuals available: diagram (nodes and directed edges), graph (explicit bounded axes and points), vectors (origin and labeled components), table (headers and rows), timeline (ordered events). Coordinates for diagrams/vectors use a 0-100 canvas; diagram nodes should be between 5 and 95. Graph values must lie within declared axis bounds. Do not invent measurements, dates, formulas, labels or experimental results. Use concise Spanish text; no HTML, SVG, Markdown, URLs or code. Keep updates synchronized with the spoken explanation. Omit the board for greetings or short replies.",
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
                  type: { type: Type.STRING, description: "diagram | graph | vectors | table | timeline" },
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
