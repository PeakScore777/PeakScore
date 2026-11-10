import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number, fallback: string) {
  return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para ver tus clases guardadas." }, { status: 401 });

    const { data, error } = await supabase
      .from("orby_conversations")
      .select("id,title,subject,topic,session_type,created_at,updated_at")
      .eq("user_id", user.id)
      .eq("session_type", "live")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[Orby History] List failed.", { code: error.code });
      return NextResponse.json({ error: "No se pudieron cargar tus clases." }, { status: 503 });
    }
    return NextResponse.json({ conversations: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el historial." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para guardar una clase." }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });

    const sessionType = body.session_type === "live" ? "live" : "chat";
    const { count, error: countError } = await supabase
      .from("orby_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("session_type", sessionType);
    if (countError) return NextResponse.json({ error: "No se pudo verificar tu biblioteca de clases." }, { status: 503 });
    if ((count ?? 0) >= 50) {
      return NextResponse.json({ error: "Has alcanzado el límite de 50 clases guardadas. Elimina una clase antigua para guardar otra." }, { status: 409 });
    }

    const selectedTopic = clean(body.topic, 160, "Estudio general");
    const { data, error } = await supabase.from("orby_conversations").insert({
      user_id: user.id,
      title: sessionType === "live" ? selectedTopic.slice(0, 80) : "Nueva conversación",
      subject: clean(body.subject, 80, "Preparación Saber 11"),
      topic: selectedTopic,
      session_type: sessionType,
    }).select("id,title,subject,topic,session_type,created_at,updated_at").single();

    if (error || !data) {
      console.error("[Orby History] Create failed.", { code: error?.code });
      return NextResponse.json({ error: "No se pudo guardar la clase." }, { status: 503 });
    }
    return NextResponse.json({ conversation: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el chat." }, { status: 500 });
  }
}
