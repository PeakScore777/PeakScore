import "server-only";

const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
const TUTOR_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const CLOUDFLARE_EMBEDDING_MODEL = "@cf/google/embeddinggemma-300m";

type CloudflareRunEnvelope<T> = {
  success?: boolean;
  result?: T;
  errors?: Array<{ code?: number; message?: string }>;
};

export class CloudflareWorkersAIError extends Error {
  readonly status?: number;
  readonly code: string;

  constructor(code: string, status?: number) {
    super("Cloudflare Workers AI request failed.");
    this.name = "CloudflareWorkersAIError";
    this.code = code;
    this.status = status;
  }
}

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() ?? "";
  if (!/^[a-f0-9]{32}$/i.test(accountId) || !apiToken) {
    throw new CloudflareWorkersAIError("NOT_CONFIGURED");
  }
  return { accountId, apiToken };
}

async function runModel<T>(
  model: string,
  input: Record<string, unknown>,
  timeoutMs: number,
): Promise<T> {
  const { accountId, apiToken } = getConfig();
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("[Orby Cloudflare] Connection failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw new CloudflareWorkersAIError("CONNECTION_FAILED");
  }

  const envelope = await response.json().catch(() => null) as CloudflareRunEnvelope<T> | null;
  if (!response.ok || !envelope || envelope.success === false || envelope.result === undefined) {
    const providerCode = envelope?.errors?.[0]?.code;
    const providerMessage = typeof envelope?.errors?.[0]?.message === "string"
      ? envelope.errors[0].message
      : "";
    // Cloudflare documents internal error 3036 as the exhausted daily
    // 10,000-neuron free allocation. Code 3040 is temporary capacity, not quota.
    const dailyQuotaExceeded = providerCode === 3036
      || /daily|quota|neurons|usage limit/i.test(providerMessage);
    console.error("[Orby Cloudflare] Inference request rejected.", {
      status: response.status,
      code: typeof providerCode === "number" ? providerCode : undefined,
      model,
      dailyQuotaExceeded,
    });
    throw new CloudflareWorkersAIError(
      response.status === 429
        ? dailyQuotaExceeded ? "QUOTA_EXCEEDED" : "RATE_LIMITED"
        : response.status === 401 || response.status === 403 ? "AUTH_FAILED" : "INFERENCE_FAILED",
      response.status,
    );
  }

  return envelope.result;
}

export async function createCloudflareEmbeddings(texts: string[]): Promise<number[][]> {
  const normalized = texts.map((text) => text.trim().slice(0, 6000)).filter(Boolean);
  if (!normalized.length || normalized.length !== texts.length || normalized.length > 16) {
    throw new CloudflareWorkersAIError("INVALID_EMBEDDING_INPUT");
  }

  const result = await runModel<{
    shape?: unknown;
    data?: unknown;
    embeddings?: unknown;
  }>(
    CLOUDFLARE_EMBEDDING_MODEL,
    { text: normalized },
    25_000,
  );

  const rawVectors = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.embeddings)
      ? result.embeddings
      : [];
  if (rawVectors.length !== normalized.length) {
    throw new CloudflareWorkersAIError("INVALID_EMBEDDING_RESPONSE");
  }

  return rawVectors.map((raw) => {
    if (!Array.isArray(raw) || raw.length !== 768 || !raw.every((value) => typeof value === "number" && Number.isFinite(value))) {
      throw new CloudflareWorkersAIError("INVALID_EMBEDDING_DIMENSIONS");
    }
    return raw as number[];
  });
}

export async function generateWithCloudflareImage(
  prompt: string,
  steps = 4,
): Promise<{ image: string }> {
  const normalized = prompt.trim().slice(0, 1800);
  if (!normalized) throw new CloudflareWorkersAIError("EMPTY_IMAGE_PROMPT");
  if (!Number.isInteger(steps) || steps < 4 || steps > 8) {
    throw new CloudflareWorkersAIError("INVALID_IMAGE_STEPS");
  }

  const result = await runModel<{ image?: unknown }>(
    "@cf/black-forest-labs/flux-1-schnell",
    { prompt: normalized, steps },
    45_000,
  );
  const image = typeof result.image === "string" ? result.image : "";
  if (!image || !/^[A-Za-z0-9+/]+={0,2}$/.test(image) || image.length > 12_000_000) {
    throw new CloudflareWorkersAIError("INVALID_IMAGE_RESPONSE");
  }
  return { image };
}

export async function synthesizeWithCloudflareSpeech(text: string): Promise<Buffer> {
  const normalized = text.replace(/\\s+/g, " ").trim().slice(0, 420);
  if (!normalized) throw new CloudflareWorkersAIError("EMPTY_TTS_TEXT");

  // Aura-2 Spanish is hosted by Cloudflare Workers AI. "celeste" is the
  // Colombian Spanish female voice. This shares the Workers Free neuron
  // allocation; it never calls Gemini, Deepgram's external API, or a paid API.
  const result = await runModel<{ audio?: unknown }>(
    "@cf/deepgram/aura-2-es",
    {
      text: normalized,
      speaker: "celeste",
      encoding: "mp3",
      container: "none",
    },
    18_000,
  );

  const encoded = typeof result.audio === "string" ? result.audio : "";
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new CloudflareWorkersAIError("INVALID_TTS_RESPONSE");
  }

  const audio = Buffer.from(encoded, "base64");
  if (audio.byteLength < 256 || audio.byteLength > 4 * 1024 * 1024) {
    throw new CloudflareWorkersAIError("INVALID_TTS_AUDIO_SIZE");
  }
  const hasId3Header = audio.toString("ascii", 0, 3) === "ID3";
  const hasMpegFrameHeader = audio.length > 1 && audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;
  if (!hasId3Header && !hasMpegFrameHeader) {
    throw new CloudflareWorkersAIError("INVALID_TTS_MP3");
  }
  return audio;
}

export async function transcribeWithCloudflare(audio: Buffer): Promise<string> {
  if (audio.length < 1024 || audio.length > 8 * 1024 * 1024) {
    throw new CloudflareWorkersAIError("INVALID_AUDIO");
  }

  const result = await runModel<{ text?: unknown }>(
    WHISPER_MODEL,
    {
      audio: audio.toString("base64"),
      task: "transcribe",
      language: "es",
      vad_filter: true,
      initial_prompt: "Español colombiano. Transcribe literalmente. Conserva PeakScore, Orby, Saber 11, ICFES, nombres, cifras y términos académicos. No respondas la pregunta.",
      condition_on_previous_text: false,
    },
    45_000,
  );

  const transcript = typeof result.text === "string" ? result.text.trim().slice(0, 1200) : "";
  if (!transcript) throw new CloudflareWorkersAIError("EMPTY_TRANSCRIPT");
  return transcript;
}

export async function generateWithCloudflareAnalysis(prompt: string): Promise<{ text: string }> {
  const result = await runModel<{ response?: unknown; text?: unknown }>(
    TUTOR_MODEL,
    {
      messages: [
        {
          role: "system",
          content: "Eres el analista académico de Orby, el tutor de PeakScore especializado exclusivamente en el currículo Saber 11. Analiza únicamente evidencia de Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés. Respeta exactamente el esquema y las instrucciones del mensaje; devuelve JSON válido cuando se solicite, sin Markdown ni texto exterior. No inventes contenidos, competencias, oficialidad, vigencia, pesos ni evidencias ausentes. Distingue conceptos, alias equivalentes y conceptos relacionados pero diferentes. Usa español colombiano claro y ortografía impecable.",
        },
        { role: "user", content: prompt.slice(0, 24_000) },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      chat_template_kwargs: { enable_thinking: false },
      stream: false,
    },
    25_000,
  );

  const text = typeof result.response === "string"
    ? result.response.trim()
    : typeof result.text === "string"
      ? result.text.trim()
      : "";
  if (!text) throw new CloudflareWorkersAIError("EMPTY_RESPONSE");
  return { text };
}

export async function generateWithCloudflareTutor(prompt: string): Promise<{ text: string }> {
  const result = await runModel<{ response?: unknown; text?: unknown }>(
    TUTOR_MODEL,
    {
      messages: [
        {
          role: "system",
          content: "Eres Orby, la tutora académica de PeakScore especializada exclusivamente en la preparación para Saber 11 en Colombia. Reconoce nombres cotidianos de áreas: lectura/lengua/lenguaje/español/literatura = Lectura Crítica; sociales/historia = Sociales y Ciudadanas; ciencias/naturales/física/química/biología = Ciencias Naturales; números/álgebra/geometría = Matemáticas; inglés/English = Inglés Saber 11. No exijas el nombre formal. Atiende únicamente solicitudes académicas relacionadas con las cinco áreas del examen. Si la solicitud es realmente ajena al currículo Saber 11, responde con una redirección breve y amable; no te conviertas en asistente general. Los saludos y llamadas breves se resuelven antes de invocar el modelo. No enseñes programación ni desarrollo de software, ni proporciones instrucciones dañinas o ilícitas. Distingue la intención real de las palabras que aparecen en una lectura, contexto, gráfica o ejemplo académico: nunca bloquees un concepto por una coincidencia de palabras. Explica con rigor pedagógico, paso a paso cuando se necesite, usando español colombiano natural y ortografía impecable. Antes de emitir la respuesta, comprueba internamente tildes, concordancia, cifras, unidades, operaciones y coherencia académica; corrige cualquier error. Sé directa, cálida y precisa, sin introducciones largas. Devuelve exclusivamente el JSON exigido por la solicitud, con reply, checkQuestion y learningSignal; no añadas Markdown ni texto exterior.",
        },
        { role: "user", content: prompt.slice(0, 24_000) },
      ],
      temperature: 0.2,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      chat_template_kwargs: { enable_thinking: false },
      stream: false,
    },
    18_000,
  );

  const text = typeof result.response === "string"
    ? result.response.trim()
    : typeof result.text === "string"
      ? result.text.trim()
      : "";
  if (!text) throw new CloudflareWorkersAIError("EMPTY_RESPONSE");
  return { text };
}

export function isCloudflareWorkersAIConfigured(): boolean {
  return Boolean(
    /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "")
    && process.env.CLOUDFLARE_API_TOKEN?.trim(),
  );
}
