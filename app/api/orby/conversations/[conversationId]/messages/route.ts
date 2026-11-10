import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

function isMissingColumn(error: { code?: string; message?: string; details?: string } | null, column: string) {
  if (!error) return false;
  const detail = [error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  const mentionsColumn = detail.includes(column.toLowerCase());
  return mentionsColumn && (
    error.code === "42703"
    || error.code === "PGRST204"
    || detail.includes("does not exist")
    || detail.includes("schema cache")
    || detail.includes("column")
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

  const withImagesAndBoard = await supabase.from("orby_messages")
    .select("id,role,content,check_question,teaching_board,generated_image_path,attachment_kind,attachment_label,created_at")
    .eq("conversation_id", conversationId).eq("user_id", user.id)
    .order("created_at", { ascending: true }).limit(200);
  let messages: Array<Record<string, unknown>> = [];
  let error = withImagesAndBoard.error;

  if (!error) {
    messages = (withImagesAndBoard.data ?? []) as unknown as Array<Record<string, unknown>>;
  } else if (isMissingColumn(error, "generated_image_path")) {
    // A project that has not applied the new image migration must still keep
    // loading its existing teaching boards from the previous schema.
    const withBoard = await supabase.from("orby_messages")
      .select("id,role,content,check_question,teaching_board,attachment_kind,attachment_label,created_at")
      .eq("conversation_id", conversationId).eq("user_id", user.id)
      .order("created_at", { ascending: true }).limit(200);
    error = withBoard.error;
    if (!error) {
      messages = (withBoard.data ?? []).map((item) => ({ ...item, generated_image_path: null })) as unknown as Array<Record<string, unknown>>;
    }
  }

  if (error && isMissingColumn(error, "teaching_board")) {
    console.warn("[Orby Messages] Teaching-board persistence is not in the current database schema; loading text-only history.");
    const legacy = await supabase.from("orby_messages")
      .select("id,role,content,check_question,attachment_kind,attachment_label,created_at")
      .eq("conversation_id", conversationId).eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(80);
    error = legacy.error;
    messages = (legacy.data ?? []).reverse().map((item) => ({ ...item, teaching_board: null, generated_image_path: null })) as unknown as Array<Record<string, unknown>>;
  }
  if (error) {
    console.error("[Orby Messages] History load failed.", { code: error.code });
    return NextResponse.json({ error: "No se pudo cargar el historial de mensajes." }, { status: 503 });
  }
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
