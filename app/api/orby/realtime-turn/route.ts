import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para guardar la conversación." }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });

    const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
    const userContent = typeof body.userContent === "string" ? body.userContent.trim().slice(0, 8000) : "";
    const assistantContent = typeof body.assistantContent === "string" ? body.assistantContent.trim().slice(0, 8000) : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId) || !userContent || !assistantContent) {
      return NextResponse.json({ error: "No se pudo validar el turno de voz." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("orby_save_turn", {
      p_user_id: user.id,
      p_conversation_id: conversationId,
      p_user_content: userContent,
      p_assistant_content: assistantContent,
      p_check_question: null,
      p_attachment_kind: null,
      p_attachment_label: null,
    });
    if (error || !data?.ok) {
      console.error("[Orby Realtime] Could not save voice turn.", { code: error?.code, reason: data?.code });
      return NextResponse.json({ error: "La conversación ocurrió, pero no se pudo guardar en el historial." }, { status: 503 });
    }
    return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el turno de voz." }, { status: 500 });
  }
}
