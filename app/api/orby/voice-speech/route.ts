import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "@cf/deepgram/aura-2-es";
const MAX_TEXT_LENGTH = 500;
const DAILY_QUOTA_ERROR_CODE = 3036;

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

    const body = await request.json().catch(() => null) as { text?: unknown } | null;
    const text = typeof body?.text === "string"
      ? body.text.replace(/\\s+/g, " ").trim()
      : "";
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return jsonError(
        "La frase de voz debe contener entre 1 y 500 caracteres.",
        "INVALID_TTS_INPUT",
        400,
      );
    }

    // Protect the shared free allocation from loops and accidental request bursts.
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

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() ?? "";
    if (!/^[a-f0-9]{32}$/i.test(accountId) || !apiToken) {
      return jsonError(
        "La voz española de Orby no está configurada. La respuesta seguirá disponible por escrito.",
        "TTS_NOT_CONFIGURED",
        503,
      );
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          speaker: "celeste",
          encoding: "mp3",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(18_000),
      },
    );

    if (!response.ok) {
      const providerPayload = await response.json().catch(() => null) as {
        errors?: Array<{ code?: number; message?: string }>;
      } | null;
      const providerCode = providerPayload?.errors?.[0]?.code;
      const providerMessage = providerPayload?.errors?.[0]?.message ?? "";

      if (providerCode === DAILY_QUOTA_ERROR_CODE) {
        return jsonError(
          "Orby ha alcanzado la cuota gratuita diaria de voz. La lectura se reanudará cuando Cloudflare restablezca la cuota; no se activará ningún servicio de pago.",
          "FREE_TIER_TTS_QUOTA_EXCEEDED",
          429,
        );
      }
      if (response.status === 429) {
        return jsonError(
          "Cloudflare no tiene capacidad de voz disponible en este momento. Tu respuesta sigue visible por escrito.",
          "TTS_TEMPORARILY_UNAVAILABLE",
          503,
        );
      }
      console.error("[Orby TTS] Cloudflare rejected the speech request.", {
        status: response.status,
        code: providerCode,
        message: providerMessage.slice(0, 180),
      });
      return jsonError(
        "No se pudo generar el audio gratuito. La respuesta sigue disponible por escrito.",
        "TTS_PROVIDER_ERROR",
        502,
      );
    }

    const audio = await response.arrayBuffer();
    if (audio.byteLength < 256 || audio.byteLength > 4 * 1024 * 1024) {
      return jsonError("Cloudflare devolvió un audio no válido.", "TTS_INVALID_AUDIO", 502);
    }

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type")?.includes("audio")
          ? response.headers.get("content-type")!
          : "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[Orby TTS] Speech generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      "La voz de Orby no respondió a tiempo. La respuesta permanece por escrito y no se usará otro proveedor.",
      "TTS_REQUEST_FAILED",
      503,
    );
  }
}
