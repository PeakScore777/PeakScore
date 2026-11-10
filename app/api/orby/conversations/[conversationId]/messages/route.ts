import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

function isMissingHistoryColumn(error: { code?: string; message?: string; details?: string } | null) {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const detail = [error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return ["teaching_board", "generated_image_path"].some((column) =>
    detail.includes(column) && (detail.includes("does not exist") || detail.includes("schema cache") || detail.includes("column")),
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
    return NextResponse.json({ error: "La conversación no es válida." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Inicia sesión para ver esta conversación." }, { status: 401 });

  const legacyQuery = () => supabase.from("orby_messages")
    .select("id,role,content,check_question,attachment_kind,attachment_label,created_at")
    .eq("conversation_id", conversationId).eq("user_id", user.id)
    .order("created_at", { ascending: false }).limit(80);
  const withBoard = await supabase.from("orby_messages")
    .select("id,role,content,check_question,teaching_board,generated_image_path,attachment_kind,attachment_label,created_at")
    .eq("conversation_id", conversationId).eq("user_id", user.id)
    .order("created_at", { ascending: true }).limit(200);

  let messages: Array<Record<string, unknown>> = [];
  let error = withBoard.error;
  if (withBoard.error && isMissingHistoryColumn(withBoard.error)) {
    console.warn("[Orby Messages] A teaching-board/image-history column is not in the current database schema; loading legacy history.");
    const legacy = await legacyQuery();
    error = legacy.error;
    messages = (legacy.data ?? []).reverse().map((item) => ({ ...item, teaching_board: null })) as Array<Record<string, unknown>>;
  } else if (!withBoard.error) {
    messages = (withBoard.data ?? []).reverse() as Array<Record<string, unknown>>;
  }
  if (error) {
    console.error("[Orby Messages] History load failed.", { code: error.code });
    return NextResponse.json({ error: "No se pudo cargar el historial de mensajes." }, { status: 503 });
  }
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
