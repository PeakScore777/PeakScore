import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeIcfesSubject } from "@/lib/ai/orby-scope";
import { getOrbySubjectSelectionReply } from "@/lib/ai/orby-request-filter";

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

    // A fetch can time out after the database commit succeeded. Before
    // retrying, detect the exact same most-recent user/assistant pair so a
    // retry never creates duplicate bubbles in the conversation history.
    const { data: latestMessages, error: recentReadError } = await supabaseAdmin
      .from("orby_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(2);
    const alreadySaved = !recentReadError
      && Array.isArray(latestMessages)
      && latestMessages.length === 2
      && latestMessages[0]?.role === "assistant"
      && latestMessages[0]?.content === assistantContent
      && latestMessages[1]?.role === "user"
      && latestMessages[1]?.content === userContent;

    if (!alreadySaved) {
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
        return NextResponse.json({
          error: "La conversación ocurrió, pero no se pudo guardar en el historial. Puedes reintentar sin duplicar la respuesta.",
          code: error ? "SAVE_TURN_DATABASE_ERROR" : (typeof data?.code === "string" ? data.code : "SAVE_TURN_REJECTED"),
        }, { status: 503 });
      }
    }

    // Voice subject selections use the same deterministic classifier as text.
    // Only a standalone recognized area can change the stored subject; an
    // incidental mention inside an exercise or passage cannot switch it.
    if (getOrbySubjectSelectionReply(userContent)) {
      const selectedSubject = normalizeIcfesSubject(userContent, userContent);
      if (selectedSubject) {
        const { data: updatedConversation, error: subjectError } = await supabaseAdmin
          .from("orby_conversations")
          .update({ subject: selectedSubject })
          .eq("id", conversationId)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle();
        if (subjectError || !updatedConversation) {
          console.error("[Orby Realtime] Voice turn saved but active subject could not be updated.", {
            code: subjectError?.code,
          });
          return NextResponse.json({
            error: "El turno se guardó, pero no se pudo actualizar la materia activa. Vuelve a seleccionarla antes de continuar.",
          }, { status: 503 });
        }
      }
    }

    return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el turno de voz." }, { status: 500 });
  }
}
