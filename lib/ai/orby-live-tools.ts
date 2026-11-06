import { Behavior, Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_orby_learning_knowledge",
        behavior: Behavior.BLOCKING,
        description: "Searches PeakScore’s published Saber 11 learning library and may add free public research only when the student asks for sources or external verification. MUST call this tool before answering each new substantive academic question that could benefit from published material: a new concept, exercise, reading or graph analysis, exam competency, misconception, or request to deepen an explanation. Resolve short follow-ups from the conversation and search only when they introduce a new concept or need evidence beyond the existing exchange. Do not call for greetings, confirmations, or a follow-up already fully answered in the current context. Send the complete contextualized question and current Saber 11 subject. If no relevant published material is found, continue teaching from reliable model knowledge without pretending the library contained evidence.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The complete current student question or exercise, with the specific concept and relevant details. Resolve references such as “eso”, “esto”, “ese dato”, “esa afirmación”, “ese tema”, “lo anterior” or “lo que explicaste” from the immediately preceding academic exchange and include the actual concept/topic in the query; for example, turn “dame fuentes de eso” into “fuentes científicas sobre la fotosíntesis” when the prior exchange was about photosynthesis. Do not send only a vague one-word topic or a pronoun without its academic referent.",
            },
            subject: {
              type: Type.STRING,
              description: "A Saber 11 subject, when known.",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];
