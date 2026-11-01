import { Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_orby_learning_knowledge",
        description: "Returns relevant published academic knowledge for a Saber 11 study query.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The current academic question or learning topic.",
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
