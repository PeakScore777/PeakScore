export const ORBY_LIVE_KNOWLEDGE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "search_orby_learning_knowledge",
        description: "Returns relevant published academic knowledge for a Saber 11 study query.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            query: {
              type: "STRING" as const,
              description: "The current academic question or learning topic.",
            },
            subject: {
              type: "STRING" as const,
              description: "A Saber 11 subject, when known.",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];
