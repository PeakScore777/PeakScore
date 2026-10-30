import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

function takeRateLimit(userId: string) {
  const now = Date.now();
  const current = requestWindows.get(userId);
  if (!current || current.resetAt <= now) {
    requestWindows.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    if (requestWindows.size > 5000) {
      for (const [key, value] of requestWindows) {
        if (value.resetAt <= now) requestWindows.delete(key);
      }
    }
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Inicia sesión para usar el chat de voz de Orby." }, { status: 401 });
    }

    if (!takeRateLimit(user.id)) {
      return NextResponse.json({ error: "Has enviado varios audios muy rápido. Espera un momento." }, { status: 429 });
    }

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "No recibí un audio válido. Inténtalo de nuevo." }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "El audio supera el límite de 8 MB." }, { status: 413 });
    }

    const mimeType = (audio.type || "audio/webm").toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mimeType) && !mimeType.startsWith("audio/")) {
      return NextResponse.json({ error: "El formato de audio no es compatible." }, { status: 415 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[Orby Voice] Falta GROQ_API_KEY.");
      return NextResponse.json({ error: "El reconocimiento de voz no está configurado todavía." }, { status: 503 });
    }

    const payload = new FormData();
    payload.append("file", audio, "orby-voice.webm");
    payload.append("model", "whisper-large-v3-turbo");
    payload.append("language", "es");
    payload.append("response_format", "json");
    payload.append("temperature", "0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: payload,
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      console.error("[Orby Voice] Groq transcription failed.", { status: response.status });
      return NextResponse.json(
        { error: response.status === 429
          ? "El reconocimiento de voz alcanzó su límite temporal. Inténtalo en un momento."
          : "No pude reconocer el audio. Inténtalo de nuevo o escribe tu pregunta." },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const result = await response.json().catch(() => null) as { text?: unknown } | null;
    const transcript = typeof result?.text === "string" ? result.text.trim().slice(0, 1200) : "";
    if (!transcript) {
      return NextResponse.json({ error: "No logré detectar palabras claras en el audio." }, { status: 422 });
    }

    return NextResponse.json({ transcript });
  } catch (caught) {
    console.error("[Orby Voice] Transcription request failed.", {
      errorName: caught instanceof Error ? caught.name : "UnknownError",
    });
    return NextResponse.json({ error: "No se pudo procesar el audio. Inténtalo otra vez." }, { status: 503 });
  }
}
