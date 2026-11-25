import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const body = await readBodyWithinLimit(request, 8_192);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: { target_user_id?: unknown; action?: unknown; reason?: unknown; duration_minutes?: unknown };
  try {
    payload = JSON.parse(body);
  } catch {
    return fail("El formato de la solicitud no es válido.", 400);
  }

  const targetUserId = typeof payload.target_user_id === "string" ? payload.target_user_id : "";
  const action = payload.action;
  const reason = typeof payload.reason === "string" ? payload.reason.trim().slice(0, 500) : "";
  const duration = payload.duration_minutes;
  if (reason.length < 3) return fail("Indica el motivo de la medida para dejar constancia.", 400);
  if (!UUID_PATTERN.test(targetUserId) || (action !== "kick" && action !== "timeout" && action !== "restore")) {
    return fail("El usuario o la acción no son válidos.", 400);
  }
  if (action === "timeout" && (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 40_320)) {
    return fail("El silencio debe durar entre 1 minuto y 28 días.", 400);
  }
  if (action !== "timeout" && duration !== undefined && duration !== null) {
    return fail("Esta acción no admite una duración.", 400);
  }

  if (action === "restore") {
    const { data, error } = await supabase.rpc("restore_community_member", {
      p_target_user_id: targetUserId,
      p_reason: reason,
    });
    if (error || data !== true) {
      const denied = error?.code === "42501";
      const invalid = error?.code === "22023";
      return fail(
        denied ? "Solo el founder puede restaurar el acceso global." :
          invalid ? "El motivo o el usuario no son válidos." :
            "No se pudo restaurar el acceso.",
        denied ? 403 : invalid ? 400 : 503,
      );
    }
    return NextResponse.json(
      { success: true, action, target_user_id: targetUserId },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase.rpc("moderate_community_member", {
    p_target_user_id: targetUserId,
    p_action: action,
    p_reason: reason,
    p_duration_minutes: action === "timeout" ? Number(duration) : null,
  });
  if (error || typeof data !== "string") {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    return fail(
      denied ? "No tienes permisos para aplicar esta medida." : invalid ? "La medida o el usuario no son válidos." : "No se pudo aplicar la medida.",
      denied ? 403 : invalid ? 400 : 503,
    );
  }

  return NextResponse.json(
    { success: true, restriction_id: data, action },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
