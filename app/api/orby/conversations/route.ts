import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number, fallback: string) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : fallback;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para ver tus conversaciones." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orby_conversations")
    .select("id,title,subject,topic,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Orby Conversations] List failed.", { code: error.code });
    return NextResponse.json({ error: "No se pudo cargar el historial de Orby." }, { status: 503 });
  }

  return NextResponse.json({ conversations: data ?? [] }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 8_000) {
    return NextResponse.json({ error: "La solicitud supera el tamaño permitido." }, { status: 413 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para crear una conversación." }, { status: 401 });
  }

  const { data: limitData, error: limitError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
    p_user_id: user.id,
    p_bucket: "orby_conversation_create",
    p_max_requests: 10,
    p_window_seconds: 60,
  });
  if (limitError || !limitData || typeof limitData !== "object") {
    console.error("[Orby Conversations] Rate limiter unavailable.", { code: limitError?.code });
    return NextResponse.json({ error: "La creación de chats no está disponible temporalmente." }, { status: 503 });
  }
  const limit = limitData as { allowed?: boolean; retryAfter?: number };
  if (!limit.allowed) {
    return NextResponse.json({ error: "Has creado varios chats seguidos. Espera un momento y vuelve a intentarlo." }, {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.min(3600, Number(limit.retryAfter) || 60))) },
    });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  }

  const title = cleanText(body.title, 80, "Nueva conversación");
  const subject = cleanText(body.subject, 80, "Preparación Saber 11");
  const topic = cleanText(body.topic, 160, "Estudio general");

  const { data, error } = await supabase
    .from("orby_conversations")
    .insert({ user_id: user.id, title, subject, topic })
    .select("id,title,subject,topic,created_at,updated_at")
    .single();

  if (error || !data) {
    console.error("[Orby Conversations] Create failed.", { code: error?.code });
    return NextResponse.json({ error: "No se pudo crear la conversación." }, { status: 503 });
  }

  return NextResponse.json({ conversation: data }, { status: 201 });
}
