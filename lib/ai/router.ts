import { GoogleGenAI } from "@google/genai";

/* =====================================================
   PROVEEDORES
===================================================== */

/**
 * Proveedores disponibles actualmente.
 *
 * IMPORTANTE:
 * No agregamos proveedores que todavía no estén
 * implementados realmente.
 *
 * Cuando PeakScore incorpore nuevas IA, se agregan aquí
 * y al registro correspondiente.
 */
export type AIProvider =
  | "gemini"
  | "groq";

/* =====================================================
   TAREAS DE INTELIGENCIA ARTIFICIAL
===================================================== */

/**
 * Las tareas representan QUÉ quiere hacer PeakScore.
 *
 * Los providers representan QUIÉN ejecuta la tarea.
 *
 * Esta separación permite cambiar o agregar proveedores
 * sin modificar toda la aplicación.
 */
export type AITask =
  | "question_generation"
  | "normal_simulation"
  | "mass_question_generation"
  | "complete_simulation"
  | "tutor"
  | "support"
  | "analysis";

/* =====================================================
   OPCIONES DE GENERACIÓN
===================================================== */

interface GenerateTextOptions {
  prompt: string;

  /**
   * Provider explícito.
   *
   * Si se especifica, será el provider principal.
   * Si useFallback está activo, todavía podrá utilizar
   * los providers alternativos si el principal falla.
   */
  provider?: AIProvider;

  /**
   * Tarea de PeakScore.
   *
   * Permite que el router determine automáticamente
   * el provider principal.
   */
  task?: AITask;

  /**
   * Activa el sistema automático de fallback.
   *
   * Por defecto queda ACTIVADO para que una caída,
   * límite o error temporal de una IA no llegue al usuario.
   */
  useFallback?: boolean;
}

/* =====================================================
   RESPUESTA GROQ
===================================================== */

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/* =====================================================
   ERROR INTERNO CONTROLADO
===================================================== */

/**
 * Error interno del servicio de IA.
 *
 * Este error NUNCA debe contener:
 *
 * - API keys
 * - respuestas completas de proveedores
 * - URLs internas
 * - códigos técnicos innecesarios
 * - información de rate limit del proveedor
 * - detalles de infraestructura
 *
 * El detalle real solamente se registra en el servidor.
 */
export class AIServiceError extends Error {
  public readonly code:
    | "AI_UNAVAILABLE"
    | "AI_CONFIGURATION"
    | "AI_INVALID_RESPONSE";

  public readonly publicMessage: string;

  constructor(
    code:
      | "AI_UNAVAILABLE"
      | "AI_CONFIGURATION"
      | "AI_INVALID_RESPONSE",
    publicMessage = "No pudimos completar esta operación en este momento."
  ) {
    super(publicMessage);

    this.name = "AIServiceError";
    this.code = code;
    this.publicMessage = publicMessage;
  }
}

/**
 * Mensaje seguro para enviar al frontend.
 *
 * Las API routes pueden utilizar esta función para
 * evitar que accidentalmente expongan errores internos.
 */
export function getSafeAIErrorMessage(
  error: unknown
): string {
  if (error instanceof AIServiceError) {
    return error.publicMessage;
  }

  return "No pudimos completar esta operación en este momento.";
}

/* =====================================================
   CONFIGURACIÓN CENTRAL DE TAREAS
===================================================== */

/**
 * Provider principal de cada tarea.
 *
 * MAPA ACTUAL:
 *
 * Pregunta individual
 *        ↓
 *      GROQ
 *
 * Simulacro normal
 *        ↓
 *      GROQ
 *
 * Generación masiva
 *        ↓
 *     GEMINI
 *
 * Simulacro completo
 *        ↓
 *     GEMINI
 *
 * Tutor
 *        ↓
 *     GEMINI
 *     FUTURO
 *
 * Soporte
 *        ↓
 *     GEMINI
 *     FUTURO
 *
 * Análisis
 *        ↓
 *     GEMINI
 */
const TASK_PROVIDERS: Record<
  AITask,
  AIProvider
> = {
  question_generation: "groq",

  normal_simulation: "groq",

  mass_question_generation: "gemini",

  complete_simulation: "gemini",

  tutor: "gemini",

  support: "gemini",

  analysis: "gemini",
};

/* =====================================================
   CADENAS DE FALLBACK
===================================================== */

/**
 * Orden de fallback.
 *
 * Actualmente PeakScore solamente tiene:
 *
 * 1. Groq
 * 2. Gemini
 *
 * Por eso el fallback actual es:
 *
 * Groq → Gemini
 * Gemini → Groq
 *
 * MÁS ADELANTE:
 *
 * Groq
 *   ↓
 * Gemini
 *   ↓
 * Cerebras
 *   ↓
 * Mistral
 *   ↓
 * Chat Luna
 *
 * La arquitectura ya está preparada para eso.
 */
const FALLBACK_PROVIDERS: Record<
  AIProvider,
  AIProvider[]
> = {
  groq: [
    "gemini",
  ],

  gemini: [
    "groq",
  ],
};

/* =====================================================
   GEMINI
===================================================== */

function getGemini(): GoogleGenAI {
  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError(
      "AI_CONFIGURATION"
    );
  }

  return new GoogleGenAI({
    apiKey,
  });
}

/* =====================================================
   ESPERA
===================================================== */

function sleep(
  ms: number
): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

/* =====================================================
   GROQ
===================================================== */

const GROQ_QUESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    questions: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          subject: {
            type: "string",
          },

          session: {
            type: "integer",
          },

          component: {
            type: ["string", "null"],
          },

          competence: {
            type: ["string", "null"],
          },

          skill: {
            type: ["string", "null"],
          },

          difficulty: {
            type: "string",
            enum: [
              "Fácil",
              "Media",
              "Difícil",
            ],
          },

          structure_type: {
            type: ["string", "null"],
          },

          context_type: {
            type: ["string", "null"],
          },

          question: {
            type: "string",
          },

          option_a: {
            type: "string",
          },

          option_b: {
            type: "string",
          },

          option_c: {
            type: "string",
          },

          option_d: {
            type: "string",
          },

          correct_answer: {
            type: "string",
            enum: [
              "A",
              "B",
              "C",
              "D",
            ],
          },

          explanation: {
            type: "string",
          },

          context_text: {
            type: ["string", "null"],
          },

          requires_visual: {
            type: "boolean",
          },

          visual_type: {
            anyOf: [
              {
                type: "string",
                enum: [
                  "chart",
                  "table",
                  "math_graph",
                  "diagram",
                  "geometry",
                ],
              },
              {
                type: "null",
              },
            ],
          },

          visual_description: {
            type: ["string", "null"],
          },

          visual_data: {
            anyOf: [
              {
                type: "null",
              },

              /* =========================
                 CHART
              ========================== */

              {
                type: "object",
                additionalProperties: false,

                properties: {
                  chart_type: {
                    type: "string",
                    enum: [
                      "bar",
                      "line",
                      "pie",
                      "scatter",
                      "area",
                    ],
                  },

                  title: {
                    type: ["string", "null"],
                  },

                  x_label: {
                    type: ["string", "null"],
                  },

                  y_label: {
                    type: ["string", "null"],
                  },

                  categories: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },

                  series: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        name: {
                          type: "string",
                        },

                        values: {
                          type: "array",
                          items: {
                            type: "number",
                          },
                        },
                      },

                      required: [
                        "name",
                        "values",
                      ],
                    },
                  },

                  show_values: {
                    type: ["boolean", "null"],
                  },

                  show_legend: {
                    type: ["boolean", "null"],
                  },

                  show_grid: {
                    type: ["boolean", "null"],
                  },

                  y_min: {
                    type: ["number", "null"],
                  },

                  y_max: {
                    type: ["number", "null"],
                  },
                },

                required: [
                  "chart_type",
                  "title",
                  "x_label",
                  "y_label",
                  "categories",
                  "series",
                  "show_values",
                  "show_legend",
                  "show_grid",
                  "y_min",
                  "y_max",
                ],
              },

              /* =========================
                 TABLE
              ========================== */

              {
                type: "object",
                additionalProperties: false,

                properties: {
                  title: {
                    type: ["string", "null"],
                  },

                  headers: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },

                  rows: {
                    type: "array",

                    items: {
                      type: "array",

                      items: {
                        anyOf: [
                          {
                            type: "string",
                          },
                          {
                            type: "number",
                          },
                          {
                            type: "boolean",
                          },
                          {
                            type: "null",
                          },
                        ],
                      },
                    },
                  },

                  emphasize_first_column: {
                    type: ["boolean", "null"],
                  },

                  show_row_numbers: {
                    type: ["boolean", "null"],
                  },
                },

                required: [
                  "title",
                  "headers",
                  "rows",
                  "emphasize_first_column",
                  "show_row_numbers",
                ],
              },

              /* =========================
                 MATH GRAPH
              ========================== */

              {
                type: "object",
                additionalProperties: false,

                properties: {
                  graph_type: {
                    type: "string",
                    enum: [
                      "function",
                      "points",
                      "coordinate_plane",
                      "mixed",
                    ],
                  },

                  title: {
                    type: ["string", "null"],
                  },

                  x_label: {
                    type: ["string", "null"],
                  },

                  y_label: {
                    type: ["string", "null"],
                  },

                  x_range: {
                    type: "array",
                    items: {
                      type: "number",
                    },                    
                  },

                  y_range: {
                    type: "array",
                    items: {
                      type: "number",
                    },                  
                  },

                  points: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        x: {
                          type: "number",
                        },

                        y: {
                          type: "number",
                        },

                        label: {
                          type: ["string", "null"],
                        },

                        id: {
                          type: ["string", "null"],
                        },

                        show_label: {
                          type: ["boolean", "null"],
                        },
                      },

                      required: [
                        "x",
                        "y",
                        "label",
                        "id",
                        "show_label",
                      ],
                    },
                  },

                  functions: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        id: {
                          type: "string",
                        },

                        expression: {
                          type: "string",
                        },

                        label: {
                          type: "string",
                        },

                        domain: {
                          anyOf: [
                            {
                              type: "array",
                              items: {
                                type: "number",
                              },                              
                            },
                            {
                              type: "null",
                            },
                          ],
                        },

                        visible: {
                          type: ["boolean", "null"],
                        },
                      },

                      required: [
                        "id",
                        "expression",
                        "label",
                        "domain",
                        "visible",
                      ],
                    },
                  },

                  show_grid: {
                    type: ["boolean", "null"],
                  },

                  show_axis_numbers: {
                    type: ["boolean", "null"],
                  },

                  show_axes: {
                    type: ["boolean", "null"],
                  },

                  x_axis: {
                    anyOf: [
                      {
                        type: "object",
                        additionalProperties: false,

                        properties: {
                          min: {
                            type: "number",
                          },

                          max: {
                            type: "number",
                          },

                          step: {
                            type: ["number", "null"],
                          },
                        },

                        required: [
                          "min",
                          "max",
                          "step",
                        ],
                      },
                      {
                        type: "null",
                      },
                    ],
                  },

                  y_axis: {
                    anyOf: [
                      {
                        type: "object",
                        additionalProperties: false,

                        properties: {
                          min: {
                            type: "number",
                          },

                          max: {
                            type: "number",
                          },

                          step: {
                            type: ["number", "null"],
                          },
                        },

                        required: [
                          "min",
                          "max",
                          "step",
                        ],
                      },
                      {
                        type: "null",
                      },
                    ],
                  },
                },

                required: [
                  "graph_type",
                  "title",
                  "x_label",
                  "y_label",
                  "x_range",
                  "y_range",
                  "points",
                  "functions",
                  "show_grid",
                  "show_axis_numbers",
                  "show_axes",
                  "x_axis",
                  "y_axis",
                ],
              },

              /* =========================
                 GEOMETRY
              ========================== */

              {
                type: "object",
                additionalProperties: false,

                properties: {
                  title: {
                    type: ["string", "null"],
                  },

                  shape: {
                    type: "string",
                    enum: [
                      "triangle",
                      "rectangle",
                      "circle",
                      "polygon",
                    ],
                  },

                  labels: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        text: {
                          type: "string",
                        },

                        position: {
                          type: "string",
                          enum: [
                            "top",
                            "bottom",
                            "left",
                            "right",
                            "center",
                            "top_left",
                            "top_right",
                            "bottom_left",
                            "bottom_right",
                          ],
                        },

                        offset_x: {
                          type: ["number", "null"],
                        },

                        offset_y: {
                          type: ["number", "null"],
                        },
                      },

                      required: [
                        "text",
                        "position",
                        "offset_x",
                        "offset_y",
                      ],
                    },
                  },

                  measurements: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        label: {
                          type: "string",
                        },

                        value: {
                          type: "string",
                        },

                        position: {
                          anyOf: [
                            {
                              type: "string",
                              enum: [
                                "top",
                                "bottom",
                                "left",
                                "right",
                                "center",
                                "top_left",
                                "top_right",
                                "bottom_left",
                                "bottom_right",
                              ],
                            },
                            {
                              type: "null",
                            },
                          ],
                        },
                      },

                      required: [
                        "label",
                        "value",
                        "position",
                      ],
                    },
                  },

                  cutouts: {
                    type: ["array", "null"],

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        id: {
                          type: ["string", "null"],
                        },

                        type: {
                          type: "string",
                          enum: [
                            "semicircle",
                            "circle",
                            "rectangle",
                            "triangle",
                          ],
                        },

                        side: {
                          type: "string",
                          enum: [
                            "top",
                            "bottom",
                            "left",
                            "right",
                            "center",
                          ],
                        },

                        radius: {
                          type: ["number", "null"],
                        },

                        width: {
                          type: ["number", "null"],
                        },

                        height: {
                          type: ["number", "null"],
                        },

                        removed: {
                          type: ["boolean", "null"],
                        },
                      },

                      required: [
                        "id",
                        "type",
                        "side",
                        "radius",
                        "width",
                        "height",
                        "removed",
                      ],
                    },
                  },

                  points: {
                    type: ["array", "null"],

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        id: {
                          type: "string",
                        },

                        x: {
                          type: "number",
                        },

                        y: {
                          type: "number",
                        },

                        label: {
                          type: ["string", "null"],
                        },
                      },

                      required: [
                        "id",
                        "x",
                        "y",
                        "label",
                      ],
                    },
                  },

                  segments: {
                    type: ["array", "null"],

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        from: {
                          type: "string",
                        },

                        to: {
                          type: "string",
                        },

                        label: {
                          type: ["string", "null"],
                        },

                        measurement: {
                          type: ["string", "null"],
                        },
                      },

                      required: [
                        "from",
                        "to",
                        "label",
                        "measurement",
                      ],
                    },
                  },

                  preserve_aspect_ratio: {
                    type: ["boolean", "null"],
                  },

                  show_measurements: {
                    type: ["boolean", "null"],
                  },
                },

                required: [
                  "title",
                  "shape",
                  "labels",
                  "measurements",
                  "cutouts",
                  "points",
                  "segments",
                  "preserve_aspect_ratio",
                  "show_measurements",
                ],
              },

              /* =========================
                 DIAGRAM
              ========================== */

              {
                type: "object",
                additionalProperties: false,

                properties: {
                  title: {
                    type: ["string", "null"],
                  },

                  elements: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        id: {
                          type: "string",
                        },

                        label: {
                          type: "string",
                        },

                        type: {
                          anyOf: [
                            {
                              type: "string",
                              enum: [
                                "node",
                                "process",
                                "decision",
                                "input",
                                "output",
                                "group",
                              ],
                            },
                            {
                              type: "null",
                            },
                          ],
                        },

                        x: {
                          type: ["number", "null"],
                        },

                        y: {
                          type: ["number", "null"],
                        },

                        width: {
                          type: ["number", "null"],
                        },

                        height: {
                          type: ["number", "null"],
                        },
                      },

                      required: [
                        "id",
                        "label",
                        "type",
                        "x",
                        "y",
                        "width",
                        "height",
                      ],
                    },
                  },

                  connections: {
                    type: "array",

                    items: {
                      type: "object",
                      additionalProperties: false,

                      properties: {
                        from: {
                          type: "string",
                        },

                        to: {
                          type: "string",
                        },

                        label: {
                          type: ["string", "null"],
                        },

                        directional: {
                          type: ["boolean", "null"],
                        },
                      },

                      required: [
                        "from",
                        "to",
                        "label",
                        "directional",
                      ],
                    },
                  },

                  layout: {
                    anyOf: [
                      {
                        type: "string",
                        enum: [
                          "horizontal",
                          "vertical",
                          "free",
                        ],
                      },
                      {
                        type: "null",
                      },
                    ],
                  },
                },

                required: [
                  "title",
                  "elements",
                  "connections",
                  "layout",
                ],
              },
            ],
          },
        },

        required: [
          "subject",
          "session",
          "component",
          "competence",
          "skill",
          "difficulty",
          "structure_type",
          "context_type",
          "question",
          "option_a",
          "option_b",
          "option_c",
          "option_d",
          "correct_answer",
          "explanation",
          "context_text",
          "requires_visual",
          "visual_type",
          "visual_description",
          "visual_data",
        ],
      },
    },
  },

  required: [
    "questions",
  ],
};

async function generateWithGroq(
  prompt: string
): Promise<string> {
  const apiKey =
    process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AIServiceError(
      "AI_CONFIGURATION"
    );
  }

  /**
   * Reintentos internos.
   *
   * Esto ocurre ANTES de pasar al siguiente provider.
   *
   * Ejemplo:
   *
   * Groq falla temporalmente
   *      ↓
   * espera
   *      ↓
   * reintenta
   *      ↓
   * si sigue fallando
   *      ↓
   * router → Gemini
   */
  const MAX_RETRIES = 2;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      
      console.log(
        "[PeakScore AI] Prompt length:",
        prompt.length
      );

      console.log(
        "[PeakScore AI] Approx prompt tokens:",
        Math.ceil(prompt.length / 4)
      );
      
      const response =
        await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",

            signal: AbortSignal.timeout(60000),

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${apiKey}`,
            },

            body: JSON.stringify({
              model:
                "qwen/qwen3.8-27b",

              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],

              temperature: 0.2,

              include_reasoning: false,

              // La generación de preguntas puede incluir
              // explanation + visual_data, por lo que 4096
              // tokens puede truncar el JSON antes de cerrarlo.
              max_completion_tokens:
                7000,

              // Obliga a Groq a devolver JSON válido.
              // La validación detallada de la estructura
              // continúa en /api/generate-questions.          

              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "peakscore_questions",
                  strict: true,
                  schema: GROQ_QUESTION_SCHEMA,
                },
              },
            }),
          }
        );

      const rawText =
        await response.text();

      let responseMeta: {
        finishReason?: string | null;
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      } = {};

      try {
        const preview = JSON.parse(rawText) as GroqResponse;
        responseMeta = {
          finishReason:
            preview.choices?.[0]?.finish_reason,
          promptTokens:
            preview.usage?.prompt_tokens,
          completionTokens:
            preview.usage?.completion_tokens,
          totalTokens:
            preview.usage?.total_tokens,
        };
      } catch {
        // El parseo detallado se maneja abajo.
      }

      console.error("[PeakScore AI] Groq response metadata:", {
        status: response.status,
        statusText: response.statusText,
        outputLength: rawText.length,
        ...responseMeta,
      });

      /* =================================================
         RATE LIMIT
      ================================================== */

      if (response.status === 429) {
        const retryAfterHeader =
          response.headers.get(
            "retry-after"
          );

        const resetTokensHeader =
          response.headers.get(
            "x-ratelimit-reset-tokens"
          );

        const resetRequestsHeader =
          response.headers.get(
            "x-ratelimit-reset-requests"
          );

        const parseDurationMs = (
          value: string | null
        ): number | null => {
          if (!value) {
            return null;
          }

          const trimmed =
            value.trim();

          const seconds =
            Number(trimmed);

          if (
            Number.isFinite(seconds) &&
            seconds > 0
          ) {
            return seconds * 1000;
          } 

          const match =
            trimmed.match(
              /^(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/i
            );

          if (!match) {
            return null;
          }

          const minutes =
            Number(match[1] ?? 0);

          const secondsPart =
            Number(match[2] ?? 0);

          const totalMs =
            (minutes * 60 +
              secondsPart) *
            1000;

          return totalMs > 0
            ? totalMs
            : null;
        };

        const retryAfterMs =
          parseDurationMs(
            retryAfterHeader
          );

        const resetTokensMs =
          parseDurationMs(
            resetTokensHeader
          );

        const resetRequestsMs =
          parseDurationMs(
            resetRequestsHeader
          );

        const providerWaitMs = Math.min(
          Math.max(
            retryAfterMs ?? 0,
            resetTokensMs ?? 0,
            resetRequestsMs ?? 0,
            3000
          ),
          15000
        );

        const jitterMs =
          Math.floor(
            Math.random() * 500
          );

        const waitMs =
          providerWaitMs +
          jitterMs;

        if (attempt < MAX_RETRIES) {
          console.warn(
            `[PeakScore AI] Groq devolvió 429. Esperando ${waitMs}ms según los headers de rate limit antes de reintentar.`
          );

          await sleep(
            waitMs
          );

          continue;
        }

        console.warn(
          "[PeakScore AI] Groq continúa limitado después del reintento. Se activa el fallback."
        );

        throw new AIServiceError(
          "AI_UNAVAILABLE"
        );
      }

      /* =================================================
         OTROS ERRORES HTTP
      ================================================== */

      if (!response.ok) {
        /**
         * El detalle técnico queda SOLO en el servidor.
         */
        console.error(
          "[PeakScore AI] Error interno de Groq:",
          {
            status:
              response.status,
            response:
              rawText,
          }
        );

        throw new AIServiceError(
          "AI_UNAVAILABLE"
        );
      }

      /* =================================================
         PARSEAR RESPUESTA
      ================================================== */

      let data: GroqResponse;

      try {
        data =
          JSON.parse(
            rawText
          ) as GroqResponse;
      } catch {
        console.error(
          "[PeakScore AI] Groq devolvió JSON inválido."
        );

        throw new AIServiceError(
          "AI_INVALID_RESPONSE"
        );
      }

      const content =
        data.choices?.[0]
          ?.message
          ?.content;

      if (!content) {
        console.error(
          "[PeakScore AI] Groq no devolvió contenido."
        );

        throw new AIServiceError(
          "AI_INVALID_RESPONSE"
        );
      }

      return content;
        } catch (error) {
      /**
       * Los errores de configuración no deben reintentarse.
       */
      if (
        error instanceof AIServiceError &&
        error.code === "AI_CONFIGURATION"
      ) {
        throw error;
      }

      /**
       * Si todavía quedan reintentos,
       * esperamos y volvemos a intentar Groq
       * antes de activar el fallback.
       */
      if (attempt < MAX_RETRIES) {
        console.warn(
          `[PeakScore AI] Groq falló en el intento ${attempt}/${MAX_RETRIES}. Reintentando...`
        );

        await sleep(
          1500 * attempt
        );

        continue;
      }

      /**
       * Se agotaron los reintentos.
       * El router superior decidirá si activa
       * el siguiente provider.
       */
      if (error instanceof AIServiceError) {
        throw error;
      }

      console.error(
        "[PeakScore AI] Error de comunicación con Groq:",
        error
      );

      throw new AIServiceError(
        "AI_UNAVAILABLE"
      );
    }
  }

  throw new AIServiceError(
    "AI_UNAVAILABLE"
  );
}

/* =====================================================
   GEMINI
===================================================== */

 function getHttpStatus(
   error: unknown
 ): number | null {
   if (
     typeof error !== "object" ||
     error === null
   ) {
     return null;
   }

   const status =
     (error as {
       status?: unknown;
     }).status;

   const numericStatus =
     Number(status);

   if (
     !Number.isInteger(
       numericStatus
     )
   ) {
     return null;
   }

   return numericStatus;
 }

 function isTransientAIError(
   status: number | null,
   error?: unknown
 ): boolean {
   if (
     status === 408 ||
     status === 429 ||
     (
       status !== null &&
       status >= 500 &&
       status <= 599
     )
   ) {
     return true;
   }

   if (
     error &&
     typeof error === "object"
   ) {
     const candidate =
       error as {
         name?: unknown;
         code?: unknown;
         message?: unknown;
       };

     const name =
       String(
         candidate.name ?? ""
       ).toLowerCase();

     const message =
       String(
         candidate.message ?? ""
       ).toLowerCase();

     const code =
       Number(
         candidate.code
       );

     if (
       name === "aborterror" ||
       code === 20 ||
       message.includes("aborted") ||
       message.includes("timeout")
     ) {
       return true;
     }
   }

   return false;
 }

 async function generateWithGemini(
   prompt: string
 ) {
   const MAX_GEMINI_RETRIES = 2;

   for (
     let attempt = 0;
     attempt <= MAX_GEMINI_RETRIES;
     attempt++
   ) {
     try {
       const gemini =
         getGemini();

       return await gemini.models.generateContent({
         model:
           "gemini-3.1-flash-lite",

         contents:
           prompt,

         config: {
           responseMimeType:
             "application/json",

           httpOptions: {
             timeout: 60000,
           },
         },
       });
     } catch (error) {
       console.error(
         `[PeakScore AI] Error interno de Gemini. Intento ${attempt + 1}/${MAX_GEMINI_RETRIES + 1}:`,
         error
       );

       /*
        * Los errores internos de PeakScore
        * no deben volver a intentarse aquí.
        */
       if (
         error instanceof AIServiceError
       ) {
        throw error;
       }

       /*
        * Detectar código HTTP del proveedor.
        */
       const status =
         getHttpStatus(error);

       /*
        * Solamente son reintentables
        * los errores transitorios:
        *
        * 408 → timeout
        * 429 → rate limit
        * 5xx → error temporal del servidor
        */
       const transient =
         isTransientAIError(
           status,
           error
         );

       /*
        * Si el error NO es transitorio,
        * no tiene sentido volver a llamar
        * a Gemini.
        *
        * Ejemplo:
        * 404 → modelo/recurso inexistente
        * 400 → solicitud inválida
        * 403 → permisos
        */
       if (!transient) {
         console.error(
           "[PeakScore AI] Gemini devolvió un error no transitorio. No se reintentará.",
           {
             status,
           }
         );

         throw new AIServiceError(
           "AI_UNAVAILABLE"
         );
       }

       /*
        * Si todavía quedan reintentos,
        * aplicar backoff exponencial + jitter.
        */
       if (
         attempt <
         MAX_GEMINI_RETRIES
       ) {
         const waitMs =
           Math.min(
             2000 *
               Math.pow(
                 2,
                 attempt
               ),
             10000
           ) +
           Math.floor(
             Math.random() * 500
           );

         console.warn(
           `[PeakScore AI] Gemini devolvió un error transitorio (${status}). Esperando ${waitMs}ms antes de reintentar.`
         );

         await sleep(
           waitMs
         );

         continue;
       }

       /*
        * Se agotaron los reintentos.
        */
       throw new AIServiceError(
         "AI_UNAVAILABLE"
       );
     }
   }

  throw new AIServiceError(
    "AI_UNAVAILABLE"
  );
}

/* =====================================================
   GENERAR CON UN PROVIDER
===================================================== */

/**
 * Ejecuta exclusivamente el provider recibido.
 *
 * Esta función NO decide fallback.
 *
 * El router superior se encarga de eso.
 */
async function generateWithProvider(
  provider: AIProvider,
  prompt: string
) {
  switch (provider) {
    /* ===============================================
       GEMINI
    ================================================ */

    case "gemini": {
      return await generateWithGemini(
        prompt
      );
    }

    /* ===============================================
       GROQ
    ================================================ */

    case "groq": {
      const content =
        await generateWithGroq(
          prompt
        );

      return {
        text: content,
      };
    }

    /* ===============================================
       PROVIDER NO SOPORTADO
    ================================================ */

    default: {
      console.error(
        "[PeakScore AI] Provider no soportado."
      );

      throw new AIServiceError(
        "AI_UNAVAILABLE"
      );
    }
  }
}

/* =====================================================
   OBTENER PROVIDER DE UNA TAREA
===================================================== */

/**
 * Determina qué IA es la principal para una tarea.
 */
export function getProviderForTask(
  task: AITask
): AIProvider {
  return TASK_PROVIDERS[task];
}

/* =====================================================
   OBTENER FALLBACK
===================================================== */

/**
 * Devuelve los providers alternativos disponibles.
 */
export function getFallbackProviders(
  provider: AIProvider
): AIProvider[] {
  return (
    FALLBACK_PROVIDERS[
      provider
    ] ?? []
  );
}

/* =====================================================
   CONSTRUIR CADENA DE PROVIDERS
===================================================== */

/**
 * Construye la cadena completa que se utilizará.
 *
 * Ejemplo:
 *
 * provider = groq
 * useFallback = true
 *
 * Resultado:
 *
 * [
 *   "groq",
 *   "gemini"
 * ]
 *
 * Más adelante:
 *
 * [
 *   "groq",
 *   "gemini",
 *   "cerebras",
 *   "mistral",
 *   "chat-luna"
 * ]
 */
function buildProviderChain(
  primaryProvider: AIProvider,
  useFallback: boolean
): AIProvider[] {
  const providers = useFallback
    ? [
        primaryProvider,
        ...getFallbackProviders(
          primaryProvider
        ),
      ]
    : [
        primaryProvider,
      ];

  return Array.from(
    new Set(providers)
  );
}

/* =====================================================
   ROUTER CENTRAL DE IA
===================================================== */

/**
 * Router central de inteligencia artificial
 * de PeakScore.
 *
 * =====================================================
 *
 * MAPA ACTUAL
 *
 * Pregunta individual
 *      ↓
 *    GROQ
 *      ↓
 *   GEMINI
 *
 * Simulacro normal
 *      ↓
 *    GROQ
 *      ↓
 *   GEMINI
 *
 * Generación masiva
 *      ↓
 *   GEMINI
 *      ↓
 *    GROQ
 *
 * Simulacro completo
 *      ↓
 *   GEMINI
 *      ↓
 *    GROQ
 *
 * Tutor
 *      ↓
 *   GEMINI
 *   FUTURO
 *
 * Soporte
 *      ↓
 *   GEMINI
 *   FUTURO
 *
 * =====================================================
 *
 * IMPORTANTE:
 *
 * El simulacro normal REALMENTE no necesita IA
 * para seleccionar preguntas del banco.
 *
 * Esta tarea solamente queda registrada en el router
 * para mantener una arquitectura uniforme y permitir
 * futuras funciones de IA relacionadas con simulacros.
 *
 * =====================================================
 *
 * SEGURIDAD:
 *
 * Si todas las IA fallan:
 *
 * - NO se devuelve 429
 * - NO se devuelve el nombre de Groq
 * - NO se devuelve el nombre de Gemini
 * - NO se devuelve la respuesta de la API
 * - NO se devuelve la API key
 * - NO se devuelve el stack trace
 *
 * Solamente se lanza AIServiceError.
 *
 * La API route deberá convertirlo posteriormente
 * en una respuesta segura para el frontend.
 */
export async function generateAI({
  prompt,
  provider,
  task,
  useFallback = true,
}: GenerateTextOptions) {
  /* ===================================================
     VALIDAR PROMPT
  ================================================== */

  if (
    !prompt ||
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new AIServiceError(
      "AI_INVALID_RESPONSE",
      "No fue posible procesar la solicitud."
    );
  }

  /* ===================================================
     DETERMINAR PROVIDER PRINCIPAL
  ================================================== */

  const primaryProvider =
    provider ??
    (task
      ? getProviderForTask(task)
      : "gemini");

  /* ===================================================
     CONSTRUIR CADENA
  ================================================== */

  const providersToTry =
    buildProviderChain(
      primaryProvider,
      useFallback
    );

  /* ===================================================
     LOG INTERNO
  ================================================== */

  console.log(
    `[PeakScore AI] Tarea: ${
      task ?? "sin tarea"
    }`
  );

  console.log(
    `[PeakScore AI] Provider principal: ${primaryProvider}`
  );

  console.log(
    `[PeakScore AI] Providers disponibles: ${providersToTry.join(
      " → "
    )}`
  );

  /* ===================================================
     INTENTAR PROVIDERS
  ================================================== */

  let lastError:
    | AIServiceError
    | null = null;

  for (
    let index = 0;
    index <
    providersToTry.length;
    index++
  ) {
    const currentProvider =
      providersToTry[index];

    try {
      console.log(
        `[PeakScore AI] Intentando provider ${index + 1}/${providersToTry.length}: ${currentProvider}`
      );

      const result =
        await generateWithProvider(
          currentProvider,
          prompt
        );

      console.log(
        `[PeakScore AI] Provider respondió correctamente: ${currentProvider}`
      );

      return result;
    } catch (error) {
      /**
       * Convertimos cualquier error inesperado
       * en un error seguro.
       */
      const safeError =
        error instanceof
        AIServiceError
          ? error
          : new AIServiceError(
              "AI_UNAVAILABLE"
            );

      lastError =
        safeError;

      /**
       * Log interno.
       *
       * Nunca se manda al frontend.
       */
      console.error(
        `[PeakScore AI] Falló provider: ${currentProvider}`,
        {
          code:
            safeError.code,
          task,
        }
      );

      /* ===============================================
         SI HAY SIGUIENTE PROVIDER
      ================================================ */

      const hasNextProvider =
        index <
        providersToTry.length - 1;

      if (
        hasNextProvider
      ) {
        const nextProvider =
          providersToTry[
            index + 1
          ];

        console.warn(
          `[PeakScore AI] Activando fallback: ${currentProvider} → ${nextProvider}`
        );

        continue;
      }

      /* ===============================================
         NO HAY MÁS PROVIDERS
      ================================================ */

      console.error(
        "[PeakScore AI] Todos los providers disponibles fallaron."
      );
    }
  }

  /* ===================================================
     TODOS FALLARON
  ================================================== */

  /**
   * IMPORTANTE:
   *
   * Aunque lastError exista, NO devolvemos su mensaje
   * técnico directamente.
   *
   * La aplicación recibirá únicamente AIServiceError.
   */
  if (lastError) {
    throw new AIServiceError(
      lastError.code
    );
  }

  throw new AIServiceError(
    "AI_UNAVAILABLE"
  );
}