import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const body = await readBodyWithinLimit(request, 4_096);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const spaceId = typeof payload.space_id === "string" ? payload.space_id : "";
  const targetUserId = typeof payload.user_id === "string" ? payload.user_id : "";
  const action = payload.action;
  const reason = typeof payload.reason === "string" ? payload.reason.trim().slice(0, 500) : "";
  const duration = payload.duration_minutes;

  if (!UUID.test(spaceId) || !UUID.test(targetUserId)
    || !["kick", "timeout", "restore"].includes(String(action))
    || reason.length < 3) {
    return fail("El espacio, miembro, acción o motivo no son válidos.", 400);
  }
  if (action === "timeout" && (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 10_080)) {
    return fail("El silencio debe durar entre 1 minuto y 7 días.", 400);
  }
  if (action !== "timeout" && duration !== undefined && duration !== null) {
    return fail("Esta acción no admite duración.", 400);
  }

  const { data, error } = await supabase.rpc("moderate_community_space_member", {
    p_space_id: spaceId,
    p_target_user_id: targetUserId,
    p_action: action,
    p_reason: reason,
    p_duration_minutes: action === "timeout" ? Number(duration) : null,
  });

  if (error) {
    const denied = error.code === "42501";
    const invalid = error.code === "22023";
    return fail(
      denied ? "No tienes autoridad para moderar este espacio." :
        invalid ? "La medida de moderación no es válida." :
          "No se pudo aplicar la medida.",
      denied ? 403 : invalid ? 400 : 503,
    );
  }

  return NextResponse.json({ success: true, action, expires_at: data }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
