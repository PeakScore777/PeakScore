import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para abrir el chat." }, { status: 401 });

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "La conversación no es válida." }, { status: 400 });
    }
    const { data: conversation, error: ownerError } = await supabaseAdmin
      .from("orby_conversations").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (ownerError) return NextResponse.json({ error: "No se pudo verificar el chat." }, { status: 503 });
    if (!conversation) return NextResponse.json({ error: "La conversación no existe o no te pertenece." }, { status: 404 });

    const { data, error } = await supabaseAdmin.from("orby_messages")
      .select("id,role,content,check_question,attachment_kind,attachment_label,created_at")
      .eq("conversation_id", id).eq("user_id", user.id)
      .order("created_at", { ascending: true }).limit(500);
    if (error) return NextResponse.json({ error: "No se pudieron cargar los mensajes." }, { status: 503 });
    return NextResponse.json({ messages: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar los mensajes." }, { status: 500 });
  }
}
