import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return error("Inicia sesión para guardar la ilustración.", 401);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return error("La solicitud no es válida.", 400);
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
    const turnId = typeof body.turnId === "string" ? body.turnId : "";
    const imagePath = typeof body.imagePath === "string" ? body.imagePath : "";
    if (!UUID.test(conversationId) || !UUID.test(turnId)
      || !imagePath.startsWith(user.id + "/") || imagePath.includes("..") || imagePath.length > 240) {
      return error("No se pudo validar la ilustración de esta clase.", 400);
    }

    const { data, error: rpcError } = await supabaseAdmin.rpc("orby_attach_voice_turn_image", {
      p_user_id: user.id,
      p_conversation_id: conversationId,
      p_turn_id: turnId,
      p_image_path: imagePath,
    });
    if (rpcError) {
      console.error("[Orby Realtime Image] Attach failed.", { code: rpcError.code });
      return error("La imagen quedó guardada, pero no se pudo vincular al turno. Comprueba que la migración de persistencia esté aplicada.", 503);
    }
    const result = data as { ok?: unknown; code?: unknown; already_attached?: unknown } | null;
    if (!result?.ok) {
      if (result?.code === "turn_not_saved_yet") {
        return NextResponse.json({ attached: false, pending: true }, {
          status: 202,
          headers: { "Cache-Control": "private, no-store" },
        });
      }
      return error("No se pudo asociar la ilustración con esta clase.", 409);
    }
    return NextResponse.json({ attached: true, alreadyAttached: result.already_attached === true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return error("No se pudo guardar la referencia de la ilustración.", 500);
  }
}
