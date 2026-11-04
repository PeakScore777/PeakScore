import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { synthesizeOrbySpeech, OrbySpeechError } from "@/lib/ai/orby-neural-speech";
import { ORBY_VOICE_NAME, ORBY_VOICE_STYLE } from "@/lib/ai/orby-voice-config";
import { containsUnsupportedSpanishLanguage } from "@/lib/ai/orby-request-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 1_800;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 16_000) {
      return NextResponse.json({ error: "El texto supera el tamaño permitido." }, { status: 413 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para reproducir la voz de Orby." }, { status: 401 });
    }

    // Match the same explicit privacy opt-in used by Gemini Live production VC.
    if (process.env.NODE_ENV === "production" && process.env.ORBY_GEMINI_LIVE_ENABLED !== "true") {
      return NextResponse.json({
        error: "La voz neural está desactivada mientras terminamos su configuración de privacidad.",
      }, { status: 503 });
    }
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json({ error: "La voz neural de Orby no está configurada." }, { status: 503 });
    }

    const { data: limitData, error: limitError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "orby_voice_tts",
      p_max_requests: 8,
      p_window_seconds: 60,
    });
    if (limitError || !limitData || typeof limitData !== "object") {
      return NextResponse.json({ error: "El servicio de voz no está disponible temporalmente." }, { status: 503 });
    }
    const limit = limitData as { allowed?: boolean; retryAfter?: number };
    if (!limit.allowed) {
      return NextResponse.json({ error: "La voz ha recibido demasiadas solicitudes. Espera un momento." }, {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.min(3600, Number(limit.retryAfter) || 60))) },
      });
    }

    const body = await request.json().catch(() => null);
    const text = body && typeof body === "object" && !Array.isArray(body) && typeof body.text === "string"
      ? body.text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH)
      : "";
    if (!text) return NextResponse.json({ error: "No se recibió texto para reproducir." }, { status: 400 });
    if (containsUnsupportedSpanishLanguage(text)) {
      return NextResponse.json({ error: "El texto no pasó la validación de idioma de Orby." }, { status: 422 });
    }

    const audio = await synthesizeOrbySpeech(text, {
      voiceName: ORBY_VOICE_NAME,
      style: ORBY_VOICE_STYLE,
    });
    if (audio.byteLength < 256 || audio.byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "El audio generado no tiene un tamaño válido." }, { status: 502 });
    }

    const responseBody = new Uint8Array(audio.byteLength);
    responseBody.set(audio);
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(responseBody.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof OrbySpeechError && error.code === "GEMINI_TTS_LIMITED") {
      return NextResponse.json({
        error: "Se alcanzó el límite gratuito de voz de Gemini por ahora. No se activará otro proveedor de pago; la respuesta permanece disponible por escrito.",
        code: "GEMINI_TTS_FREE_QUOTA_EXCEEDED",
      }, { status: 429, headers: { "Retry-After": "60" } });
    }
    console.warn("[Orby Neural Voice] Synthesis failed.", {
      code: error instanceof OrbySpeechError ? error.code : undefined,
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({
      error: "No se pudo generar la voz neural. La respuesta permanece disponible por escrito.",
      code: "GEMINI_TTS_UNAVAILABLE",
    }, { status: 503 });
  }
}
