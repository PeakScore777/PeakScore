import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para crear una conversación." }, { status: 401 });
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
