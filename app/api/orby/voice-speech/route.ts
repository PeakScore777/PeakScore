import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CloudflareWorkersAIError, isCloudflareWorkersAIConfigured, synthesizeWithCloudflareSpeech } from "@/lib/ai/cloudflare-workers-ai";
import { containsUnsupportedSpanishLanguage } from "@/lib/ai/orby-request-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 420;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 8_000) {
      return NextResponse.json({ error: "El texto supera el tamaño permitido." }, { status: 413 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para reproducir la voz de Orby." }, { status: 401 });
    }
    if (!isCloudflareWorkersAIConfigured()) {
      return NextResponse.json({
        error: "La voz natural de Orby no está configurada en Cloudflare.",
        code: "CLOUDFLARE_TTS_NOT_CONFIGURED",
      }, { status: 503 });
    }

    const { data: limitData, error: limitError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "orby_voice_tts",
      p_max_requests: 24,
      p_window_seconds: 60,
    });
    if (limitError || !limitData || typeof limitData !== "object") {
      return NextResponse.json({ error: "El servicio de voz no está disponible temporalmente." }, { status: 503 });
    }
    const limit = limitData as { allowed?: boolean; retryAfter?: number };
    if (!limit.allowed) {
      return NextResponse.json({ error: "La voz recibió demasiadas solicitudes. Espera unos segundos." }, {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.min(3600, Number(limit.retryAfter) || 30))) },
      });
    }

    const body = await request.json().catch(() => null);
    const text = body && typeof body === "object" && !Array.isArray(body) && typeof body.text === "string"
      ? body.text.replace(/\\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH)
      : "";
    if (!text) return NextResponse.json({ error: "No se recibió texto para reproducir." }, { status: 400 });
    if (containsUnsupportedSpanishLanguage(text)) {
      return NextResponse.json({ error: "El texto no pasó la validación de idioma de Orby." }, { status: 422 });
    }

    const audio = await synthesizeWithCloudflareSpeech(text);
    if (audio.byteLength < 256 || audio.byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "El audio generado no tiene un tamaño válido." }, { status: 502 });
    }

    const responseBody = new Uint8Array(audio.byteLength);
    responseBody.set(audio);
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(responseBody.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof CloudflareWorkersAIError && error.code === "QUOTA_EXCEEDED") {
      return NextResponse.json({
        error: "Se agotó la cuota gratuita diaria de voz de Cloudflare. No se usará Gemini ni ningún proveedor de pago; la respuesta sigue disponible y puede leerse con la voz del navegador.",
        code: "FREE_QUOTA_EXCEEDED",
      }, { status: 429, headers: { "Retry-After": "3600" } });
    }
    if (error instanceof CloudflareWorkersAIError && error.code === "RATE_LIMITED") {
      return NextResponse.json({
        error: "Cloudflare está temporalmente ocupado. Se usará la voz local sin enviar tu texto a otro proveedor.",
        code: "PROVIDER_TEMPORARILY_BUSY",
      }, { status: 429, headers: { "Retry-After": "30" } });
    }
    console.warn("[Orby Cloudflare TTS] Synthesis failed.", {
      code: error instanceof CloudflareWorkersAIError ? error.code : undefined,
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({
      error: "No se pudo generar la voz natural. La respuesta seguirá disponible y se intentará leer localmente.",
      code: "CLOUDFLARE_TTS_UNAVAILABLE",
    }, { status: 503 });
  }
}
