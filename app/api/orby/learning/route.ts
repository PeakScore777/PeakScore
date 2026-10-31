import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Inicia sesión para ver tu aprendizaje.", 401);

    const [itemsResult, signalsResult] = await Promise.all([
      supabase.from("orby_learning_items")
        .select("id,kind,title,content,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.from("orby_student_learning_signals")
        .select("id,subject,topic,concept,learning_state,misconception,teaching_hint,confidence,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (itemsResult.error) {
      console.error("[Orby Learning] List failed.", { code: itemsResult.error.code });
      return jsonError("No se pudo cargar tu aprendizaje.", 503);
    }
    if (signalsResult.error) {
      console.error("[Orby Learning] Adaptive progress lookup failed.", { code: signalsResult.error.code });
    }
    return NextResponse.json({
      items: itemsResult.data ?? [],
      signals: signalsResult.error ? [] : signalsResult.data ?? [],
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return jsonError("No se pudo cargar tu aprendizaje.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Inicia sesión para guardar contenido.", 401);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Solicitud no válida.", 400);
    const kind = body.kind === "topic" ? "topic" : body.kind === "note" ? "note" : null;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const content = typeof body.content === "string" ? body.content.trim().slice(0, 8000) : "";
    if (!kind || !title || !content) return jsonError("Completa el título y el contenido.", 400);

    const { count, error: countError } = await supabase.from("orby_learning_items")
      .select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (countError) return jsonError("No se pudo verificar tu biblioteca.", 503);
    if ((count ?? 0) >= 100) return jsonError("Tu biblioteca llegó al límite de 100 elementos. Elimina alguno para guardar más.", 409);

    const { data, error } = await supabase.from("orby_learning_items")
      .insert({ user_id: user.id, kind, title, content })
      .select("id,kind,title,content,created_at").single();
    if (error || !data) {
      console.error("[Orby Learning] Save failed.", { code: error?.code });
      return jsonError("No se pudo guardar el contenido.", 503);
    }
    return NextResponse.json({ item: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("No se pudo guardar el contenido.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Inicia sesión para eliminar contenido.", 401);

    const body = await request.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return jsonError("El elemento seleccionado no es válido.", 400);
    }
    const { data, error } = await supabase.from("orby_learning_items")
      .delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return jsonError("No se pudo eliminar el elemento.", 503);
    if (!data) return jsonError("El elemento no existe.", 404);
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("No se pudo eliminar el elemento.", 500);
  }
}
