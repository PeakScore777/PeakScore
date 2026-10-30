import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number, fallback: string) {
  return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para ver tus conversaciones." }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("orby_conversations")
      .select("id,title,subject,topic,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[Orby History] List failed.", { code: error.code });
      return NextResponse.json({ error: "No se pudo cargar el historial." }, { status: 503 });
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
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para crear una conversación." }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });

    const { data: existing, error: countError } = await supabaseAdmin
      .from("orby_conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (countError) return NextResponse.json({ error: "No se pudo verificar el historial." }, { status: 503 });
    void existing;
    const { data, error } = await supabaseAdmin.from("orby_conversations").insert({
      user_id: user.id,
      title: "Nuevo chat",
      subject: clean(body.subject, 80, "Preparación Saber 11"),
      topic: clean(body.topic, 160, "Estudio y aprendizaje"),
    }).select("id,title,subject,topic,created_at,updated_at").single();

    if (error || !data) {
      console.error("[Orby History] Create failed.", { code: error?.code });
      return NextResponse.json({ error: "No se pudo crear el chat." }, { status: 503 });
    }
    return NextResponse.json({ conversation: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el chat." }, { status: 500 });
  }
}
