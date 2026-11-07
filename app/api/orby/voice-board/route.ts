import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateWithCloudflareBoard, CloudflareWorkersAIError } from "@/lib/ai/cloudflare-workers-ai";
import { sanitizeOrbyBoard } from "@/lib/ai/orby-board";
import {
  containsOrbyPromptInjection,
  containsProgrammingInstruction,
  containsUnsupportedSpanishLanguage,
  preflightOrbyRequest,
} from "@/lib/ai/orby-request-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para preparar la pizarra de Orby." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "La solicitud de pizarra no es válida." }, { status: 400 });
    }

    const question = clean(body.question, 1200);
    const subject = clean(body.subject, 80) || "Preparación Saber 11";
    const topic = clean(body.topic, 160);
    const context = clean(body.context, 1000);
    if (question.length < 8) {
      return NextResponse.json({ error: "La pregunta es demasiado corta para construir una pizarra." }, { status: 400 });
    }
    if (containsOrbyPromptInjection(question) || containsUnsupportedSpanishLanguage(question)
      || containsProgrammingInstruction(question)) {
      return NextResponse.json({ error: "La solicitud no pasó la validación académica de Orby." }, { status: 400 });
    }
    const preflight = preflightOrbyRequest(question, [subject, topic, context].filter(Boolean).join("\n"));
    if (!preflight.allowed) {
      return NextResponse.json({ error: "La pizarra solo está disponible para contenidos de las áreas Saber 11." }, { status: 400 });
    }

    const { data: rateData, error: rateError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "orby_voice_board",
      p_max_requests: 5,
      p_window_seconds: 60,
    });
    if (rateError || !rateData || typeof rateData !== "object") {
      return NextResponse.json({ error: "No se pudo verificar el límite gratuito de la pizarra." }, { status: 503 });
    }
    const rate = rateData as { allowed?: boolean; retryAfter?: number };
    if (!rate.allowed) {
      return NextResponse.json({
        error: "La pizarra alcanzó su límite temporal gratuito. La conversación puede continuar por voz.",
        code: "ORBY_BOARD_RATE_LIMITED",
      }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.min(300, Number(rate.retryAfter) || 60))) } });
    }

    const prompt = [
      "Construye una hoja de apuntes manuscritos que acompañe la explicación oral de Orby. No redactes la explicación hablada.",
      "Devuelve exclusivamente JSON válido con esta forma: {\"board\":{\"version\":2,\"title\":\"\",\"blocks\":[...],\"visuals\":[...]}}.",
      "La pizarra debe ser concreta, correcta, legible y directamente pertinente a la pregunta. Usa español colombiano.",
      "Incluye un título, entre 2 y 4 bloques breves y al menos 1 visual. El visual debe ser una ilustración tipo apuntes de cuaderno, no una tarjeta de texto. Prefiere sketch con 6 a 14 trazos: contornos, flechas, círculos, subrayados y etiquetas manuscritas. Usa diagram, graph, table, timeline, molecule, cell, dna o vectors solo cuando sean más adecuados.",
      "No inventes valores, datos experimentales, unidades, fuentes ni relaciones. Si faltan datos numéricos, usa un ejemplo claramente rotulado como hipotético o un esquema conceptual.",
      "En Matemáticas muestra operaciones verificables; en Ciencias Naturales respeta secuencias y estructuras; en Sociales orden cronológico y causal; en Lectura Crítica relaciones entre tesis y evidencia; en Inglés pistas contextuales explicadas en español.",
      "Los bloques admitidos son heading, text, formula, step y callout. Cada visual debe cumplir exactamente el esquema del tablero Orby. Para sketch, cada trazo usa id, points, tone, width y, si incluye texto, label, labelX y labelY. Las coordenadas van de 4 a 96. No envíes visuales vacíos.",
      "No incluyas HTML, SVG, código, URLs, instrucciones al cliente, reply ni texto fuera del JSON.",
      "Pregunta del estudiante: " + question,
      "Área: " + subject,
      "Tema: " + (topic || "No especificado"),
      "Contexto adicional: " + (context || "Sin contexto adicional"),
    ].join("\n\n");

    const result = await generateWithCloudflareBoard(prompt);
    let parsed: { board?: unknown };
    try {
      const normalized = result.text.replace(/^\s*```json\s*/i, "").replace(/^\s*```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      parsed = JSON.parse(normalized) as { board?: unknown };
    } catch {
      return NextResponse.json({ error: "Orby no pudo estructurar el apoyo visual esta vez.", code: "ORBY_BOARD_INVALID_JSON" }, { status: 502 });
    }

    const board = sanitizeOrbyBoard(parsed.board);
    if (!board || (!board.blocks.length && !(board.visuals?.length))) {
      return NextResponse.json({ error: "El esquema generado no superó la validación visual.", code: "ORBY_BOARD_VALIDATION_FAILED" }, { status: 502 });
    }

    return NextResponse.json({ board, source: "cloudflare_free_fallback" }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const typed = error as { code?: unknown; status?: unknown };
    if (error instanceof CloudflareWorkersAIError) {
      const quota = error.code === "QUOTA_EXCEEDED" || error.code === "RATE_LIMITED";
      return NextResponse.json({
        error: quota
          ? "Se agotó temporalmente la cuota gratuita de la pizarra. Orby no activará ningún servicio de pago."
          : "El servicio gratuito de pizarra no está disponible ahora. La explicación oral puede continuar.",
        code: quota ? "ORBY_BOARD_FREE_QUOTA_EXCEEDED" : "ORBY_BOARD_UNAVAILABLE",
      }, { status: quota ? 429 : 503, headers: quota ? { "Retry-After": "3600" } : undefined });
    }
    console.error("[Orby Voice Board] Generation failed.", {
      code: typeof typed.code === "string" ? typed.code : undefined,
      status: typeof typed.status === "number" ? typed.status : undefined,
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "No se pudo preparar la pizarra de Orby." }, { status: 503 });
  }
}
