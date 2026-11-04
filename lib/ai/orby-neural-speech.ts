import "server-only";

const GEMINI_TTS_MODEL = "gemini-3.8-flash-lite-tts";
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MAX_TTS_TEXT_LENGTH = 1_800;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export class OrbySpeechError extends Error {
  constructor(readonly code: string, readonly status?: number) {
    super(code);
    this.name = "OrbySpeechError";
  }
}

type OrbySpeechConfig = {
  voiceName: string;
  style: string;
};

type GeminiAudioPart = {
  type?: unknown;
  data?: unknown;
};

type GeminiInteractionResponse = {
  steps?: Array<{
    type?: unknown;
    content?: GeminiAudioPart[];
  }>;
  output_audio?: { data?: unknown };
  error?: { message?: unknown; status?: unknown };
};

/**
 * Short-form fallback for deterministic local replies or Live turns that
 * contain validated text but no audio. It uses Gemini's free-tier TTS model
 * and the same configured female voice as Gemini Live. It is never launched
 * while Live audio is already playing.
 */
export async function synthesizeOrbySpeech(
  text: string,
  config: OrbySpeechConfig,
): Promise<Buffer> {
  const normalized = text.replace(/\s+/g, " ").trim().slice(0, MAX_TTS_TEXT_LENGTH);
  if (!normalized) throw new OrbySpeechError("EMPTY_TTS_TEXT");

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new OrbySpeechError("GEMINI_NOT_CONFIGURED");

  let response: Response;
  const startedAt = performance.now();
  try {
    response = await fetch(GEMINI_INTERACTIONS_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMINI_TTS_MODEL,
        input: [{
          type: "user_input",
          content: [{
            type: "text",
            text: normalized,
            annotations: [{
              type: "speech_metadata",
              style: config.style,
            }],
          }],
        }],
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [{ voice: config.voiceName }],
        },
      }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (error) {
    console.warn("[Orby TTS] Gemini speech request failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      durationMs: Math.round(performance.now() - startedAt),
    });
    throw new OrbySpeechError("GEMINI_TTS_UNAVAILABLE");
  }

  const payload = await response.json().catch(() => null) as GeminiInteractionResponse | null;
  if (!response.ok || !payload) {
    const providerMessage = typeof payload?.error?.message === "string"
      ? payload.error.message.slice(0, 160)
      : "";
    const limited = response.status === 429 || /RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(providerMessage);
    console.warn("[Orby TTS] Gemini rejected the speech request.", {
      status: response.status,
      limited,
      durationMs: Math.round(performance.now() - startedAt),
    });
    throw new OrbySpeechError(limited ? "GEMINI_TTS_LIMITED" : "GEMINI_TTS_REJECTED", response.status);
  }

  const audioPart = payload.steps
    ?.flatMap((step) => step.content ?? [])
    .find((part) => part.type === "audio" && typeof part.data === "string");
  const encoded = typeof audioPart?.data === "string"
    ? audioPart.data
    : typeof payload.output_audio?.data === "string"
      ? payload.output_audio.data
      : "";

  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new OrbySpeechError("GEMINI_TTS_EMPTY_AUDIO");
  }

  const audio = Buffer.from(encoded, "base64");
  if (audio.byteLength < 256 || audio.byteLength > MAX_AUDIO_BYTES) {
    throw new OrbySpeechError("GEMINI_TTS_INVALID_SIZE");
  }
  if (audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") {
    throw new OrbySpeechError("GEMINI_TTS_INVALID_WAV");
  }

  console.info("[Orby TTS] Neural speech generated.", {
    durationMs: Math.round(performance.now() - startedAt),
    textLength: normalized.length,
    audioBytes: audio.byteLength,
    voice: config.voiceName,
  });
  return audio;
}
