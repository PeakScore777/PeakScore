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
  const MAX_RETRIES = 1;

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
                "openai/gpt-oss-20b",

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
                12000,

              // Obliga a Groq a devolver JSON válido.
              // La validación detallada de la estructura
              // continúa en /api/generate-questions.
              response_format: {
                type: "json_object",
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
        console.warn(
          "[PeakScore AI] Groq devolvió 429. Se activa el fallback inmediatamente."
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
              rawText.slice(
                0,
                1000
              ),
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
       * Si ya es un error controlado de PeakScore,
       * lo dejamos pasar al router.
       */
      if (
        error instanceof
        AIServiceError
      ) {
        throw error;
      }

      /**
       * Error de red, timeout u otro problema.
       *
       * Nunca exponemos el error original.
       */
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

async function generateWithGemini(
  prompt: string
) {
  try {
    const gemini =
      getGemini();

    return await gemini.models.generateContent({
      model:
        "gemini-3.6-flash",

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
    /**
     * El error real solamente queda en el servidor.
     */
    console.error(
      "[PeakScore AI] Error interno de Gemini:",
      error
    );

    /*
     * Si ya es un error controlado de PeakScore,
     * conservamos su código interno.
     */
    if (error instanceof AIServiceError) {
      throw error;
    }

    /*
     * Cualquier otro error se convierte en un error
     * seguro para el sistema.
     */
    throw new AIServiceError(
      "AI_UNAVAILABLE"
    );
  }
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