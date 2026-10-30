import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set(["audio/webm", "audio/ogg", "audio/wav", "audio/wave", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/aac", "audio/mp4", "audio/opus", "audio/m4a", "audio/x-m4a"]);

function hasValidSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === "audio/webm") {
    return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }
  if (mimeType === "audio/ogg") return bytes.length >= 4 && bytes.toString("ascii", 0, 4) === "OggS";
  if (mimeType === "audio/wav" || mimeType === "audio/wave" || mimeType === "audio/x-wav") {
    return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WAVE";
  }
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") {
    return bytes.length >= 3 && (
      bytes.toString("ascii", 0, 3) === "ID3"
      || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    );
  }
  if (mimeType === "audio/aac") return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  if (mimeType === "audio/mp4" || mimeType === "audio/m4a" || mimeType === "audio/x-m4a") return bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp";
  if (mimeType === "audio/opus") return bytes.toString("ascii").includes("OpusHead");
  return false;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES + 64_000) {
    return NextResponse.json({ error: "El audio supera el máximo permitido de 8 MB." }, { status: 413 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para enviar una nota de voz." }, { status: 401 });
  }

  const { data: limitData, error: limitError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
    p_user_id: user.id,
    p_bucket: "orby_audio_transcription",
    p_max_requests: 5,
    p_window_seconds: 60,
  });
  if (limitError || !limitData || typeof limitData !== "object") {
    console.error("[Orby Audio] Rate limiter unavailable.", { code: limitError?.code });
    return NextResponse.json({ error: "El servicio de audio no está disponible temporalmente." }, { status: 503 });
  }
  const limit = limitData as { allowed?: boolean; retryAfter?: number };
  if (!limit.allowed) {
    return NextResponse.json({ error: "Has enviado varias notas de voz. Espera un momento y vuelve a intentarlo." }, {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.min(3600, Number(limit.retryAfter) || 60))) },
    });
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const consent = form?.get("consent");

  if (consent !== "true") {
    return NextResponse.json({ error: "Confirma que autorizas el envío del audio a Google Gemini para transcribirlo." }, { status: 400 });
  }
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "No se recibió una grabación de audio válida." }, { status: 400 });
  }
  const declaredMimeType = audio.type.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(declaredMimeType)) {
    return NextResponse.json({ error: "Formato de audio no compatible. Usa la grabación desde Chrome o Edge." }, { status: 415 });
  }
  const mimeType = declaredMimeType === "audio/wave" || declaredMimeType === "audio/x-wav"
    ? "audio/wav"
    : declaredMimeType === "audio/x-m4a"
      ? "audio/m4a"
      : declaredMimeType;
  if (audio.size < 1_024 || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "La grabación debe pesar entre 1 KB y 8 MB." }, { status: 413 });
  }

  const bytes = Buffer.from(await audio.arrayBuffer());
  if (!hasValidSignature(mimeType, bytes)) {
    return NextResponse.json({ error: "El contenido de la grabación no coincide con su formato declarado." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "La transcripción por audio aún no está configurada en el servidor." }, { status: 503 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{
        role: "user",
        parts: [
          { text: "Transcribe literalmente esta nota de voz en español. Conserva nombres, cifras y términos académicos. No respondas la pregunta ni inventes palabras. Devuelve únicamente la transcripción." },
          { inlineData: { mimeType, data: bytes.toString("base64") } },
        ],
      }],
      config: { temperature: 0, httpOptions: { timeout: 45_000 } },
    });
    const transcript = typeof result.text === "string" ? result.text.trim().slice(0, 1200) : "";
    if (!transcript) return NextResponse.json({ error: "No se detectó una transcripción clara. Intenta grabar de nuevo." }, { status: 422 });
    return NextResponse.json({ transcript }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[Orby Audio] Transcription failed.", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "No se pudo transcribir el audio. Inténtalo de nuevo." }, { status: 503 });
  }
}
