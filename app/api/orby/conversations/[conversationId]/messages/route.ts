import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
    return NextResponse.json({ error: "La conversación no es válida." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para ver esta conversación." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orby_messages")
    .select("id,role,content,check_question,attachment_kind,attachment_label,created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[Orby Messages] History load failed.", { code: error.code });
    return NextResponse.json({ error: "No se pudo cargar el historial de mensajes." }, { status: 503 });
  }

  return NextResponse.json({ messages: data ?? [] }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
