import { Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_orby_learning_knowledge",
        description: "Searches PeakScore’s published Saber 11 learning library and adds free public research results from Wikimedia and OpenAlex when available. MUST call this before answering a new substantive academic question about a concrete concept, formula, exercise, graph, table, reading passage, competency, or named historical/scientific topic—especially when the student changes subject or refers to uploaded study material. Do not call for greetings, identity questions, simple yes/no follow-ups already answered by the current context, or out-of-scope requests. If no published material is found, say so implicitly by answering from reliable general academic knowledge; never pretend the library contained evidence.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The complete current student question or exercise, with the specific concept and relevant details. Do not send only a vague one-word topic when the student asked a concrete question.",
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
