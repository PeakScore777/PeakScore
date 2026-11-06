import { Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_orby_learning_knowledge",
        description: "Searches PeakScore’s published Saber 11 learning library and may add free public research only when the student asks for sources or external verification. Use this tool when the student explicitly refers to a document or material stored in Orby Lab, asks what an uploaded source says, or needs external evidence. Do not call it for every ordinary academic question: answer those directly from reliable model knowledge, using the conversation context. Do not call for greetings or simple follow-ups already answered by the current context. If no relevant published material is found, return that honestly and continue teaching from reliable model knowledge; never pretend the library contained evidence.",
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
