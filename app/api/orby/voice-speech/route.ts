import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ORBY_VOICE_NAME, ORBY_VOICE_STYLE } from "@/lib/ai/orby-voice-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gemini-3.8-flash-tts";
const SAMPLE_RATE = 24_000;
const MAX_TEXT_LENGTH = 500;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

function jsonError(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function pcm16ToWav(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcm.byteLength;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return Buffer.concat([header, pcm]);
}

function isFreeTierQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const detail = error as { status?: unknown; code?: unknown; message?: unknown };
  const message = typeof detail.message === "string" ? detail.message : "";
  return detail.status === 429
    || detail.code === "RESOURCE_EXHAUSTED"
    || /RESOURCE_EXHAUSTED|quota exceeded|free tier.*quota|rate limit/i.test(message);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonError("Inicia sesión para escuchar a Orby.", "UNAUTHORIZED", 401);
    }

    // Free-tier Gemini requests may be used to improve Google's products.
    // Reuse the project's explicit production privacy approval for Live audio.
    if (process.env.NODE_ENV === "production" && process.env.ORBY_GEMINI_LIVE_ENABLED !== "true") {
      return jsonError(
        "La voz alternativa está desactivada mientras terminamos la configuración de privacidad de Gemini.",
        "TTS_PRIVACY_NOT_APPROVED",
        503,
      );
    }

    // TTS shares Gemini Live's explicit Preview opt-in. Production remains
    // closed unless its existing privacy flag is enabled. Google enforces
    // the model's free-tier quota and returns 429 when that quota is exhausted.

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return jsonError("La voz gratuita de Orby no está configurada.", "TTS_NOT_CONFIGURED", 503);
    }

    const body = await request.json().catch(() => null) as { text?: unknown } | null;
    const text = typeof body?.text === "string"
      ? body.text.replace(/\s+/g, " ").trim()
      : "";
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return jsonError(
        "La frase de voz debe contener entre 1 y 500 caracteres.",
        "INVALID_TTS_INPUT",
        400,
      );
    }

    const { data: limitData, error: limitError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "orby_voice_speech",
      p_max_requests: 20,
      p_window_seconds: 60,
    });
    if (limitError || !limitData || typeof limitData !== "object") {
      return jsonError("La voz de Orby no está disponible temporalmente.", "RATE_LIMIT_UNAVAILABLE", 503);
    }
    const limit = limitData as { allowed?: boolean; retryAfter?: number };
    if (!limit.allowed) {
      return NextResponse.json({
        error: "Orby necesita una pausa breve antes de seguir leyendo.",
        code: "RATE_LIMITED",
      }, {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.max(1, Math.min(3600, Number(limit.retryAfter) || 60))),
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1beta" } });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        parts: [{
          text: [
            "Lee únicamente el contenido indicado al final. No leas estas instrucciones ni agregues saludos, explicaciones o comentarios.",
            "Voz femenina, suave y natural, en español latinoamericano con acento colombiano ligero. Ritmo conversacional medio, pausas naturales y dicción clara.",
            "Estilo de Orby: " + ORBY_VOICE_STYLE,
            "Texto exacto que debes decir: " + text,
          ].join("\n\n"),
        }],
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          languageCode: "es-US",
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: ORBY_VOICE_NAME },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.find((part) => typeof part.inlineData?.data === "string")?.inlineData?.data;
    if (typeof audioBase64 !== "string" || !audioBase64) {
      return jsonError("Gemini no devolvió audio. La respuesta permanece disponible por escrito.", "TTS_EMPTY_AUDIO", 502);
    }

    const pcm = Buffer.from(audioBase64, "base64");
    if (pcm.byteLength < 256 || pcm.byteLength > MAX_AUDIO_BYTES || pcm.byteLength % 2 !== 0) {
      return jsonError("Gemini devolvió audio con un tamaño o formato no válido.", "TTS_INVALID_AUDIO", 502);
    }
    const wav = pcm16ToWav(pcm);
    return new Response(new Uint8Array(wav), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (isFreeTierQuotaError(error)) {
      return jsonError(
        "Se agotó la cuota gratuita de Gemini TTS. La respuesta sigue visible y no se activará un servicio de pago.",
        "FREE_TIER_TTS_QUOTA_EXCEEDED",
        429,
      );
    }
    console.error("[Orby Gemini TTS] Speech generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      status: error && typeof error === "object" && "status" in error
        ? (error as { status?: unknown }).status
        : undefined,
    });
    return jsonError(
      "No se pudo generar el audio gratuito. La respuesta sigue disponible por escrito y no se usará otro proveedor.",
      "TTS_PROVIDER_ERROR",
      503,
    );
  }
}
