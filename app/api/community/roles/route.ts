import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

async function verifyFounderBootstrap(userId: string) {
  const configuredFounderId = process.env.COMMUNITY_FOUNDER_USER_ID;
  if (!configuredFounderId || configuredFounderId !== userId) return false;

  const { data, error } = await supabaseAdmin.rpc("bootstrap_community_founder", {
    p_founder_user_id: userId,
  });
  return !error && data === true;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const body = await readBodyWithinLimit(request, 4_096);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: { target_user_id?: unknown; role_key?: unknown; action?: unknown };
  try {
    payload = JSON.parse(body);
  } catch {
    return fail("El formato de la solicitud no es válido.", 400);
  }

  const targetUserId = typeof payload.target_user_id === "string" ? payload.target_user_id : "";
  const roleKey = typeof payload.role_key === "string" ? payload.role_key.trim() : "";
  const action = payload.action;
  if (!UUID_PATTERN.test(targetUserId) || !/^[a-z][a-z0-9_]{1,31}$/.test(roleKey)) {
    return fail("El usuario o el rol no son válidos.", 400);
  }
  if (action !== "grant" && action !== "revoke") {
    return fail("La acción no está permitida.", 400);
  }

  if (!(await verifyFounderBootstrap(user.id))) {
    return fail("Solo el fundador puede asignar o retirar roles.", 403);
  }

  const { data, error } = await supabase.rpc("manage_community_member_role", {
    p_target_user_id: targetUserId,
    p_role_key: roleKey,
    p_action: action,
  });
  if (error || data !== true) {
    const denied = error?.code === "42501";
    return fail(denied ? "No tienes autorización para administrar roles." : "No se pudo actualizar el rol.", denied ? 403 : 503);
  }

  return NextResponse.json(
    { success: true, action, target_user_id: targetUserId, role_key: roleKey },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
