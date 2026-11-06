import { Type, type Tool } from "@google/genai";

export const ORBY_LIVE_KNOWLEDGE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_orby_learning_knowledge",
        description: "Searches PeakScore’s published Saber 11 learning library. It adds free public research results from Wikimedia and OpenAlex ONLY when the current question asks for sources/studies, needs current facts, or requests external verification. MUST call this tool before answering a new substantive academic question about a concrete concept, formula, exercise, graph, table, reading passage, competency, or named historical/scientific topic so Orby Lab can enrich the answer. Do NOT imply that Internet research was done for ordinary explanations: public_sources will be empty unless external research is genuinely needed. Do not call for greetings, identity questions, simple yes/no follow-ups already answered by the current context, or out-of-scope requests. If no published Lab material is found, answer from reliable model knowledge; never pretend the library contained evidence.",
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
