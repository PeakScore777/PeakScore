import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  CloudflareWorkersAIError,
  generateWithCloudflareClassTurn,
  isCloudflareWorkersAIConfigured,
  transcribeWithCloudflare,
} from "@/lib/ai/cloudflare-workers-ai";
import {
  containsCookingInstruction,
  containsExplicitNonIcfesTopic,
  containsExternalPreIcfesPromotion,
  containsPlatformMarketingClaim,
  containsProgrammingInstruction,
  containsUnsupportedSpanishLanguage,
  hasFalseOrbyCreatorAttribution,
  isLikelyEnglishOnlyOrbyReply,
  normalizeOrbySpanishOutput,
  preflightOrbyRequest,
} from "@/lib/ai/orby-request-filter";
import { normalizeOrbyStudyTopic } from "@/lib/ai/orby-class-start";
import {
  arrangeOrbyBoardForTeaching,
  sanitizeOrbyBoard,
  type OrbyBoard,
} from "@/lib/ai/orby-board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 45;
const MAX_HISTORY_TURNS = 6;
const ALLOWED_SUBJECTS = new Set([
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
]);

type ClassTurn = { role: "user" | "assistant"; content: string };

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
      if (format !== 1 || channels < 1 || channels > 2
        || rate < 8_000 || rate > 48_000 || bits !== 16 || byteRate <= 0) return null;
    }
    if (tag === "data") dataBytes = size;
    offset = start + size + (size % 2);
  }
  if (!format || !byteRate || dataBytes <= 0) return null;
  const duration = dataBytes / byteRate;
  return Number.isFinite(duration) && duration > 0 ? duration : null;
}

function parseHistory(value: unknown): ClassTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_HISTORY_TURNS).flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    if ((item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string") return [];
    const content = item.content.trim().slice(0, 700);
    return content ? [{ role: item.role, content }] : [];
  });
}

function stripEmoji(text: string): string {
  return text.replace(/[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u200D\\uFE0F]/gu, "").trim();
}

function parseModelJson(raw: string): Record<string, unknown> | null {
  const normalized = raw.trim().replace(/^\`\`\`(?:json)?\\s*/i, "").replace(/\\s*\`\`\`$/, "");
  try {
    const value: unknown = JSON.parse(normalized);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function mergeClassBoard(previous: OrbyBoard | null, delta: OrbyBoard, topic: string): OrbyBoard | null {
  const blocks = [...(previous?.blocks ?? []), ...delta.blocks].slice(-24);
  const visuals = [...(previous?.visuals ?? []), ...(delta.visuals ?? [])].slice(-8);
  if (!blocks.length && !visuals.length) return null;

  if (blocks.length <= 8 && visuals.length <= 4) {
    const candidate: OrbyBoard = {
      version: 2,
      title: topic,
      blocks,
      visuals,
    };
    const arranged = arrangeOrbyBoardForTeaching(candidate);
    return sanitizeOrbyBoard(arranged);
  }

  const pageCount = Math.max(2, Math.ceil(Math.max(blocks.length / 6, visuals.length / 2)));
  if (pageCount > 4) return null;
  const elements: NonNullable<OrbyBoard["layout"]>["elements"] = [];
  let sequence = 0;
  for (let page = 0; page < pageCount; page += 1) {
    const pageBlocks = blocks.slice(page * 6, page * 6 + 6);
    const pageVisuals = visuals.slice(page * 2, page * 2 + 2);
    const blockHeight = Math.max(8, Math.min(19, (84 - 2 * Math.max(0, pageBlocks.length - 1)) / Math.max(1, pageBlocks.length)));
    pageBlocks.forEach((_, localIndex) => {
      sequence += 1;
      elements.push({
        id: "class_block_" + (page * 6 + localIndex + 1),
        sequence,
        kind: "block",
        index: page * 6 + localIndex,
        page,
        x: 5,
        y: 7 + localIndex * (blockHeight + 2),
        width: pageVisuals.length ? 43 : 90,
        height: blockHeight,
      });
    });
    pageVisuals.forEach((_, localIndex) => {
      sequence += 1;
      elements.push({
        id: "class_visual_" + (page * 2 + localIndex + 1),
        sequence,
        kind: "visual",
        index: page * 2 + localIndex,
        page,
        x: 53,
        y: localIndex === 0 ? 8 : 52,
        width: 42,
        height: 40,
      });
    });
  }
  const candidate: OrbyBoard = {
    version: 3,
    title: topic,
    blocks,
    visuals,
    layout: { aspectRatio: "16:9", pageCount, elements },
  };
  const sanitized = sanitizeOrbyBoard(candidate);
  return sanitized ? sanitizeOrbyBoard(arrangeOrbyBoardForTeaching(sanitized)) : null;
}

function makePrompt(input: {
  subject: string;
  topic: string;
  intent: "topic" | "exam" | "task";
  message: string;
  previousBoard: OrbyBoard | null;
  history: ClassTurn[];
}) {
  const intent = input.intent === "exam"
    ? "Enfoque: preparar la competencia Saber 11 asociada al tema, con un ejemplo original y razonamiento para descartar distractores."
    : input.intent === "task"
      ? "Enfoque: acompañar una tarea relacionada con Saber 11 paso a paso, sin resolver a ciegas lo que no se haya proporcionado."
      : "Enfoque: comprender el concepto desde sus fundamentos, mecanismo, ejemplo original y conexión con Saber 11.";
  return [
    "ÁREA: " + input.subject,
    "TEMA FIJO DE LA CLASE: " + input.topic,
    intent,
    "INTERVENCIÓN DEL ESTUDIANTE: " + input.message,
    "TURNOS RECIENTES:\\n" + input.history.map((turn) => (turn.role === "user" ? "ESTUDIANTE: " : "ORBY: ") + turn.content).join("\\n"),
    "PIZARRA ACUMULATIVA ACTUAL (no repitas su contenido):\\n" + JSON.stringify(input.previousBoard),
    "Crea solo la siguiente etapa didáctica. La respuesta hablada debe contener entre 45 y 100 palabras, salvo que la intervención pida una respuesta muy concreta. La pizarra recibe únicamente apuntes clave nuevos, no una transcripción del discurso. Añade entre uno y tres bloques breves. Usa como máximo un visual cuando puedas representarlo con precisión. Los bloques admitidos son heading, text, formula, step y callout. Los visuales admitidos incluyen diagram, graph, vectors, table, molecule, circuit, cell, dna, punnett, cell-division, organ-system, neuron, physiology-process, timeline, sketch, vector-illustration y annotation; respeta la estructura estricta esperada por el esquema de la aplicación. Si el esquema requiere datos que no conoces con certeza, no generes ese visual. No devuelvas layout ni herramientas.",
    "Devuelve JSON estricto: {\"speech\":\"...\",\"board\":{\"version\":2,\"title\":\"" + input.topic.replace(/["\\\\]/g, "") + "\",\"blocks\":[{\"type\":\"text\",\"text\":\"...\"}],\"visuals\":[]}}.",
  ].join("\\n\\n");
}

async function getCloudflareAccessError() {
  if (process.env.PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED !== "true") {
    return fail("La modalidad gratuita de Cloudflare no está confirmada. La clase no iniciará inferencia.", "CLOUDFLARE_FREE_TIER_NOT_CONFIRMED", 503);
  }
  if (!isCloudflareWorkersAIConfigured()) {
    return fail("Workers AI no está disponible con la configuración gratuita confirmada. No se utilizará otro proveedor.", "CLOUDFLARE_FREE_TIER_NOT_CONFIRMED", 503);
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return fail("Inicia sesión para comenzar una clase.", "UNAUTHORIZED", 401);
    const blocked = await getCloudflareAccessError();
    if (blocked) return blocked;
    return NextResponse.json({ available: true, provider: "cloudflare-workers-ai", mode: "structured-class-turns" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return fail("No se pudo comprobar la disponibilidad de la clase.", "STUDDY_CLASS_PREFLIGHT_FAILED", 503);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Inicia sesión para comenzar una clase.", "UNAUTHORIZED", 401);

    const blocked = await getCloudflareAccessError();
    if (blocked) return blocked;

    const rate = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "studdy_class_turn",
      p_max_requests: 10,
      p_window_seconds: 60,
    });
    if (rate.error || !rate.data || typeof rate.data !== "object") {
      return fail("El control gratuito de uso no está disponible. Inténtalo más tarde.", "RATE_LIMIT_UNAVAILABLE", 503);
    }
    if (!(rate.data as { allowed?: boolean }).allowed) {
      return NextResponse.json({ error: "La clase alcanzó el límite temporal de intervenciones. Espera un momento.", code: "STUDDY_CLASS_RATE_LIMITED" }, {
        status: 429, headers: { "Retry-After": "10", "Cache-Control": "no-store" },
      });
    }

    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
    let body: Record<string, unknown>;
    let audioTranscript = "";
    if (isMultipart) {
      const form = await request.formData();
      const audio = form.get("audio");
      if (!(audio instanceof File) || audio.type !== "audio/wav" || audio.size < 1_024 || audio.size > MAX_AUDIO_BYTES) {
        return fail("El audio no tiene un formato WAV válido o supera 2 MB.", "AUDIO_INVALID", 413);
      }
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      const duration = wavDurationSeconds(audioBuffer);
      if (!duration || duration > MAX_AUDIO_SECONDS) {
        return fail("La intervención de voz debe durar como máximo 45 segundos.", "AUDIO_DURATION_INVALID", 413);
      }
      audioTranscript = await transcribeWithCloudflare(audioBuffer, "es", Math.ceil(duration));
      const parseJsonField = (key: string) => {
        const raw = form.get(key);
        if (typeof raw !== "string" || raw.length > 36_000) return null;
        try { return JSON.parse(raw) as unknown; } catch { return null; }
      };
      body = {
        subject: form.get("subject"),
        topic: form.get("topic"),
        intent: form.get("intent"),
        message: audioTranscript,
        board: parseJsonField("board"),
        history: parseJsonField("history"),
      };
    } else {
      const length = Number(request.headers.get("content-length") || 0);
      if (Number.isFinite(length) && length > 45_000) return fail("La intervención supera el tamaño permitido.", "REQUEST_TOO_LARGE", 413);
      const parsed = await request.json().catch(() => null);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("La intervención no es válida.", "INVALID_REQUEST", 400);
      body = parsed as Record<string, unknown>;
    }

    const topic = normalizeOrbyStudyTopic(body.topic);
    if (!topic) return fail("Escribe el tema que vas a estudiar.", "TOPIC_REQUIRED", 400);
    const rawSubject = typeof body.subject === "string" ? body.subject.trim() : "";
    const subject = ALLOWED_SUBJECTS.has(rawSubject) ? rawSubject : "Ciencias Naturales";
    const intent = body.intent === "exam" || body.intent === "task" ? body.intent : "topic";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1_200) : "";
    if (!message) return fail("Escribe o di qué quieres revisar en esta etapa.", "MESSAGE_REQUIRED", 400);

    let previousBoard: OrbyBoard | null = null;
    if (body.board !== undefined && body.board !== null) {
      previousBoard = sanitizeOrbyBoard(body.board);
      if (!previousBoard || previousBoard.title !== topic) return fail("La pizarra de esta clase no pasó la validación.", "BOARD_INVALID", 400);
    }
    const history = parseHistory(body.history);
    const priorContext = [
      subject,
      topic,
      "Preparación Saber 11",
      ...history.slice(-4).map((turn) => turn.content),
    ].join("\\n");
    const preflight = preflightOrbyRequest(message, priorContext);
    if (!preflight.allowed) {
      const reply = normalizeOrbySpanishOutput(preflight.reply);
      const safeDelta = sanitizeOrbyBoard({
        version: 2,
        title: topic,
        blocks: [{ type: "callout", text: reply.slice(0, 220) }],
        visuals: [],
      });
      if (!safeDelta) return fail("No se pudo preparar la nota de la clase.", "BOARD_INVALID", 500);
      const merged = mergeClassBoard(previousBoard, safeDelta, topic);
      if (!merged) return fail("La pizarra alcanzó su capacidad. Finaliza esta clase y abre otra para continuar.", "BOARD_CAPACITY", 409);
      return NextResponse.json({ speech: reply, board: merged, transcript: audioTranscript || null }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const prompt = makePrompt({ subject, topic, intent, message, previousBoard, history });
    const generated = await generateWithCloudflareClassTurn(prompt, { maxTokens: 1_400, promptChars: 14_000 });
    const parsed = parseModelJson(generated.text);
    if (!parsed || typeof parsed.speech !== "string") {
      return fail("Orby no pudo preparar una etapa de clase válida. Conservé tu pizarra; puedes volver a intentarlo.", "CLASS_RESPONSE_INVALID", 502);
    }
    const speech = normalizeOrbySpanishOutput(stripEmoji(parsed.speech)).slice(0, 1_600);
    const unsafe = !speech || containsProgrammingInstruction(speech)
      || containsCookingInstruction(speech)
      || containsExternalPreIcfesPromotion(speech)
      || containsPlatformMarketingClaim(speech)
      || containsExplicitNonIcfesTopic(speech)
      || containsUnsupportedSpanishLanguage(speech)
      || isLikelyEnglishOnlyOrbyReply(speech)
      || hasFalseOrbyCreatorAttribution(speech);
    if (unsafe) {
      return fail("La explicación no superó la revisión académica y no se mostrará. La pizarra anterior se conserva.", "CLASS_OUTPUT_REJECTED", 502);
    }

    let delta = sanitizeOrbyBoard(parsed.board);
    if (!delta || delta.version !== 2 || delta.title !== topic || delta.blocks.length > 3 || (delta.visuals?.length ?? 0) > 1) {
      delta = sanitizeOrbyBoard({
        version: 2,
        title: topic,
        blocks: [{ type: "text", text: speech.slice(0, 220) }],
        visuals: [],
      });
    }
    if (!delta) return fail("La pizarra no superó la validación. La clase anterior se conserva.", "BOARD_INVALID", 502);
    const mergedBoard = mergeClassBoard(previousBoard, delta, topic);
    if (!mergedBoard) return fail("La pizarra alcanzó su capacidad. Finaliza esta clase y abre otra para continuar.", "BOARD_CAPACITY", 409);

    return NextResponse.json({
      speech,
      board: mergedBoard,
      transcript: audioTranscript || null,
      provider: "cloudflare-workers-ai",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CloudflareWorkersAIError) {
      if (error.code === "DAILY_BUDGET_EXCEEDED" || error.code === "QUOTA_EXCEEDED" || error.code === "PAID_PLAN_REQUIRED") {
        return fail("Se agotó el límite gratuito de IA. La clase se detuvo y no cambiará a un proveedor de pago.", "CLOUDFLARE_FREE_QUOTA_STOP", 429);
      }
      if (error.code === "DAILY_BUDGET_NOT_READY") return fail("El presupuesto gratuito de IA no está disponible. La clase no enviará la solicitud.", error.code, 503);
      if (error.code === "FREE_TIER_NOT_CONFIRMED") return fail("La modalidad gratuita de Cloudflare no está confirmada. No se enviará la solicitud.", error.code, 503);
      return fail("No se pudo completar esta etapa con la cuota gratuita actual. Tu pizarra permanece abierta.", "CLASS_INFERENCE_FAILED", 503);
    }
    console.error("[Orby Studdy Class] Turn failed.", { name: error instanceof Error ? error.name : "UnknownError" });
    return fail("No se pudo completar esta etapa. Tu pizarra permanece abierta.", "CLASS_TURN_FAILED", 503);
  }
}
