import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  containsCookingInstruction,
  containsExplicitNonIcfesTopic,
  containsExternalPreIcfesPromotion,
  containsPlatformMarketingClaim,
  containsProgrammingInstruction,
  containsUnsupportedSpanishLanguage,
  isLikelyEnglishOnlyOrbyReply,
  normalizeOrbySpanishOutput,
} from "@/lib/ai/orby-request-filter";
import {
  CloudflareWorkersAIError,
  generateWithCloudflareTutor,
  isCloudflareWorkersAIConfigured,
  transcribeWithCloudflare,
} from "@/lib/ai/cloudflare-workers-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 60

function fail(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code, available: false }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function wavDurationSeconds(audio: Buffer): number | null {
  if (audio.length < 44 || audio.toString("ascii", 0, 4) !== "RIFF"
    || audio.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let byteRate = 0;
  let dataBytes = 0;
  let format = 0;
  while (offset + 8 <= audio.length) {
    const tag = audio.toString("ascii", offset, offset + 4);
    const size = audio.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (size > audio.length - start) return null;
    if (tag === "fmt " && size >= 16) {
      format = audio.readUInt16LE(start);
      const channels = audio.readUInt16LE(start + 2);
      const rate = audio.readUInt32LE(start + 4);
      byteRate = audio.readUInt32LE(start + 8);
      const bits = audio.readUInt16LE(start + 14);
      if (![1, 3].includes(format) || channels < 1 || channels > 2
        || rate < 8_000 || rate > 48_000 || ![16, 24, 32].includes(bits)
        || byteRate <= 0) return null;
    }
    if (tag === "data") dataBytes = size;
    offset = start + size + (size % 2);
  }
  if (!format || !byteRate || dataBytes <= 0) return null;
  const duration = dataBytes / byteRate;
  return Number.isFinite(duration) && duration > 0 ? duration : null;
}

function parseHistory(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length > 8_000) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-4).flatMap((item) => {
      if (!item || typeof item !== "object" || (item.role !== "user" && item.role !== "assistant")) return [];
      if (typeof item.content !== "string") return [];
      const content = item.content.trim().slice(0, 1_000);
      return content ? [{ role: item.role as "user" | "assistant", content }] : [];
    });
  } catch {
    return [];
  }
}

function field(form: FormData, key: string, max: number, fallback: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
}

function stripEmoji(value: string) {
  return value.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u200D\uFE0F]/gu, "").trim();
}

function parseReply(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.reply === "string") return parsed.reply.trim();
  } catch {
    // A plain text answer remains readable if the JSON wrapper is malformed.
  }
  return raw.trim();
}

function createPrompt(transcript: string, subject: string, topic: string, english: boolean, history: Array<{role:"user"|"assistant";content:string}>) {
  const conversation = history.map((item) => (item.role === "user" ? "ESTUDIANTE: " : "OMEGAX: ") + item.content).join("\n");
  return [
    "Eres OmegaX, el tutor de IA general de PeakScore. No eres personaje ni tienes lore de personaje. No menciones proveedores de modelos.",
    "Enseñas exclusivamente las cinco áreas de Saber 11: Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.",
    "Materia: " + subject + ". Tema activo: " + topic + ".",
    "No enseñes programación, no promociones otros preICFES, no digas que eres Gemini ni que fuiste creado por Google. No uses emojis, emoticonos ni símbolos decorativos.",
    english
      ? "Estamos en English Studio. Conversa principalmente en inglés natural A1-B2. Mantén turnos cortos y haz una pregunta de seguimiento. Corrige como máximo un error importante con frase original, versión natural y razón breve en español colombiano."
      : "Responde en español colombiano claro y cercano. Explica con un ejemplo Saber 11. Termina con una pregunta breve para comprobar comprensión.",
    "Contexto reciente:", conversation || "[Primera intervención]",
    "Transcripción del estudiante (ASR puede equivocarse; pregunta si no se entiende):", transcript,
    "Devuelve exclusivamente JSON válido: { \"reply\": \"respuesta para el estudiante\" }. Nada de Markdown ni texto exterior.",
  ].join("\n\n");
}

async function getAccessError() {
  if (!isCloudflareWorkersAIConfigured()) {
    return fail(
      "La voz gratuita aún no está habilitada: falta confirmar en Cloudflare que la cuenta permanece en Workers Free y que las credenciales de Workers AI están configuradas. No se ha pedido acceso al micrófono ni se ha enviado audio.",
      "CLOUDFLARE_FREE_TIER_NOT_CONFIRMED",
      503,
    );
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return fail("Inicia sesión para usar el tutor de voz.", "UNAUTHORIZED", 401);
    const blocked = await getAccessError();
    if (blocked) return blocked;
    return NextResponse.json({
      available: true,
      provider: "cloudflare-workers-ai",
      mode: "segmented-wav-voice",
      maxAudioSeconds: MAX_AUDIO_SECONDS,
      outputVoice: "browser-speech-synthesis",
      audioStored: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("No se pudo comprobar la disponibilidad de voz.", "VOICE_PREFLIGHT_FAILED", 503);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Inicia sesión para hablar con OmegaX.", "UNAUTHORIZED", 401);
    const blocked = await getAccessError();
    if (blocked) return blocked;

    const rate = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "cloudflare_voice_turn",
      p_max_requests: 6,
      p_window_seconds: 60,
    });
    if (rate.error || !rate.data || typeof rate.data !== "object") {
      return fail("El control de uso de voz no está disponible. Inténtalo más tarde.", "RATE_LIMIT_UNAVAILABLE", 503);
    }
    if (!(rate.data as { allowed?: boolean }).allowed) {
      return NextResponse.json({ error: "Has realizado varias intervenciones seguidas. Espera un momento.", code: "VOICE_RATE_LIMITED", available: false }, {
        status: 429, headers: { "Retry-After": "10", "Cache-Control": "no-store" },
      });
    }

    const form = await request.formData();
    const entry = form.get("audio");
    if (!(entry instanceof File)) return fail("No llegó un segmento de audio válido.", "AUDIO_REQUIRED", 400);
    if (entry.size < 1_024 || entry.size > MAX_AUDIO_BYTES) return fail("El audio debe pesar entre 1 KB y 2 MB.", "AUDIO_SIZE_INVALID", 413);
    if (entry.type !== "audio/wav" && entry.type !== "audio/x-wav") return fail("El audio debe enviarse en WAV PCM para validar su duración real.", "AUDIO_FORMAT_UNSUPPORTED", 415);

    const audio = Buffer.from(await entry.arrayBuffer());
    const duration = wavDurationSeconds(audio);
    if (!duration || duration > MAX_AUDIO_SECONDS) return fail("Cada intervención debe durar como máximo 60 segundos. No se envió a la IA.", "AUDIO_DURATION_INVALID", 413);

    const english = field(form, "englishPractice", 5, "false") === "true";
    const subject = field(form, "subject", 80, "Preparación Saber 11");
    const topic = field(form, "topic", 140, "Estudio y aprendizaje");
    const history = parseHistory(form.get("history"));
    const transcript = await transcribeWithCloudflare(audio, english ? "en" : "es", Math.ceil(duration));
    if (!transcript.trim()) return fail("No se reconoció voz. Inténtalo otra vez.", "EMPTY_TRANSCRIPT", 422);

    const generated = await generateWithCloudflareTutor(
      createPrompt(transcript, subject, topic, english, history),
      { maxTokens: 500, promptChars: 8_000 },
    );
    let reply = stripEmoji(parseReply(generated.text));
    if (!reply) return fail("OmegaX no generó una respuesta válida. Puedes continuar por escrito.", "EMPTY_TUTOR_REPLY", 502);

    if (!english) {
      reply = normalizeOrbySpanishOutput(reply);
      const unsafe = containsProgrammingInstruction(reply)
        || containsCookingInstruction(reply)
        || containsExternalPreIcfesPromotion(reply)
        || containsPlatformMarketingClaim(reply)
        || containsExplicitNonIcfesTopic(reply)
        || containsUnsupportedSpanishLanguage(reply)
        || isLikelyEnglishOnlyOrbyReply(reply);
      if (unsafe) reply = "Puedo ayudarte con las cinco áreas de Saber 11. Dime qué concepto quieres revisar y lo trabajamos paso a paso.";
    }

    return NextResponse.json({
      transcript: stripEmoji(transcript).slice(0, 1_200),
      reply: stripEmoji(reply).slice(0, 4_000),
      language: english ? "en" : "es",
      provider: "cloudflare-workers-ai",
      audioStored: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CloudflareWorkersAIError) {
      if (error.code === "DAILY_BUDGET_NOT_READY") return fail("El límite diario global aún no está instalado. No se envió audio a Cloudflare.", "DAILY_BUDGET_NOT_READY", 503);
      if (error.code === "DAILY_BUDGET_EXCEEDED" || error.code === "QUOTA_EXCEEDED" || error.code === "PAID_PLAN_REQUIRED") {
        return fail("Se alcanzó el límite gratuito de IA. La voz se detuvo y no se cambiará a un plan de pago.", "CLOUDFLARE_FREE_QUOTA_STOP", 429);
      }
      if (error.code === "FREE_TIER_NOT_CONFIRMED") return fail("La cuota gratuita de Cloudflare aún no está confirmada. No se envió audio ni texto.", "CLOUDFLARE_FREE_TIER_NOT_CONFIRMED", 503);
      return fail("No se pudo completar el turno de voz gratuito. Puedes continuar por escrito.", "CLOUDFLARE_VOICE_TURN_FAILED", 503);
    }
    console.error("[OmegaX Cloudflare Voice] Turn failed.", { name: error instanceof Error ? error.name : "UnknownError" });
    return fail("No se pudo completar el turno de voz gratuito. Puedes continuar por escrito.", "CLOUDFLARE_VOICE_TURN_FAILED", 503);
  }
}
