import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ORBY_VOICE_NAME, ORBY_VOICE_STYLE } from "@/lib/ai/orby-voice-config";
import { normalizeGeminiTtsAudio } from "@/lib/ai/orby-tts-audio";
import { classifyGeminiTtsFailure } from "@/lib/ai/orby-tts-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gemini-3.8-flash-lite-tts";
const MAX_TEXT_LENGTH = 900;
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
        "La frase de voz debe contener entre 1 y 900 caracteres.",
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
    // Gemini 3.8 Flash TTS supports GenerateContent, not the Interactions API.
    // Calling interactions.create here returned provider errors for every
    // fallback utterance, leaving the student with text and no spoken answer.
    const generation = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        role: "user",
        parts: [{
          text,
          // speechMetadata is request metadata, not text to be read aloud.
          speechMetadata: { style: ORBY_VOICE_STYLE },
        } as never],
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: ORBY_VOICE_NAME } },
        },
      },
    });

    const audioPart = generation.candidates?.[0]?.content?.parts?.find(
      (part) => typeof part.inlineData?.data === "string" && part.inlineData.data.length > 0,
    );
    const audioBase64 = audioPart?.inlineData?.data;
    const audioMimeType = audioPart?.inlineData?.mimeType;
    if (typeof audioBase64 !== "string" || !audioBase64) {
      console.error("[Orby Gemini TTS] GenerateContent completed without inline audio.", {
        finishReason: generation.candidates?.[0]?.finishReason,
        promptFeedback: generation.promptFeedback?.blockReason,
      });
      return jsonError("Gemini no devolvió audio. La respuesta permanece disponible por escrito.", "TTS_EMPTY_AUDIO", 502);
    }

    // Unary Gemini 3.8 TTS returns a complete audio/wav RIFF file by default.
    // Preserve that header; only wrap raw audio/l16 PCM when explicitly indicated.
    const wav = normalizeGeminiTtsAudio(audioBase64, audioMimeType, MAX_AUDIO_BYTES);
    if (!wav) {
      console.error("[Orby Gemini TTS] Provider returned an unsupported or malformed audio payload.", {
        mimeType: audioMimeType,
        encodedLength: audioBase64.length,
        finishReason: generation.candidates?.[0]?.finishReason,
      });
      return jsonError("Gemini devolvió un audio con formato no válido.", "TTS_INVALID_AUDIO", 502);
    }
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
    const failureKind = classifyGeminiTtsFailure(error);
    if (failureKind === "quota_exhausted") {
      return jsonError(
        "Se agotó la cuota gratuita de Gemini TTS. La respuesta sigue visible y no se activará un servicio de pago.",
        "FREE_TIER_TTS_QUOTA_EXCEEDED",
        429,
      );
    }
    if (failureKind === "rate_limited") {
      return NextResponse.json({
        error: "Gemini TTS está recibiendo demasiadas solicitudes temporalmente. Espera un momento.",
        code: "RATE_LIMITED",
      }, {
        status: 429,
        headers: { "Retry-After": "15", "Cache-Control": "no-store" },
      });
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
