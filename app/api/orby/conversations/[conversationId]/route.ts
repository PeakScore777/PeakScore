import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
    return NextResponse.json({ error: "La conversación no es válida." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para eliminar la conversación." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orby_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[Orby Conversations] Delete failed.", { code: error.code });
    return NextResponse.json({ error: "No se pudo eliminar la conversación." }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: "La conversación no existe." }, { status: 404 });

  return NextResponse.json({ deleted: true, id: data.id });
}
