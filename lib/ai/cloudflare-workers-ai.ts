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
    console.error("[Orby Cloudflare] Inference request rejected.", {
      status: response.status,
      code: typeof providerCode === "number" ? providerCode : undefined,
      model,
    });
    throw new CloudflareWorkersAIError(
      response.status === 429 ? "RATE_LIMITED" : response.status === 401 || response.status === 403 ? "AUTH_FAILED" : "INFERENCE_FAILED",
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

export async function generateWithCloudflareTutor(prompt: string): Promise<{ text: string }> {
  const result = await runModel<{ response?: unknown; text?: unknown }>(
    TUTOR_MODEL,
    {
      messages: [
        {
          role: "system",
          content: "Eres Orby, tutor de PeakScore para Saber 11. Obedece el formato solicitado por el mensaje del usuario. Responde siempre en español colombiano. Tu alcance se limita a Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés. Nunca enseñes programación.",
        },
        { role: "user", content: prompt.slice(0, 24_000) },
      ],
      temperature: 0.2,
      max_tokens: 2200,
      stream: false,
    },
    35_000,
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
