import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLE = /^[a-z][a-z0-9_]{1,31}$/;

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
  const roleKey = typeof payload.role_key === "string" ? payload.role_key : null;
  if (!UUID.test(spaceId) || !UUID.test(targetUserId)
    || !["invite", "remove", "grant_role", "revoke_role"].includes(String(action))
    || ((action === "grant_role" || action === "revoke_role") && (!roleKey || !ROLE.test(roleKey)))) {
    return fail("El miembro, espacio o acción no son válidos.", 400);
  }
  if (!(await verifyCommunityFounder(user.id))) return fail("Solo el founder puede invitar miembros y asignar roles.", 403);

  const { data, error } = await supabase.rpc("manage_community_space_member", {
    p_space_id: spaceId,
    p_user_id: targetUserId,
    p_action: action,
    p_role_key: roleKey,
  });
  if (error || data !== true) {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    return fail(
      denied ? "No tienes permiso para cambiar la membresía de este espacio." :
        invalid ? "La asignación solicitada no es válida." :
          "No se pudo actualizar el acceso al espacio.",
      denied ? 403 : invalid ? 400 : 503,
    );
  }

  return NextResponse.json({ success: true, action, space_id: spaceId, user_id: targetUserId, role_key: roleKey }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
