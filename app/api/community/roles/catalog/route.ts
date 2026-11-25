import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_KEY = /^[a-z][a-z0-9_]{1,31}$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const ALLOWED_PERMISSIONS = new Set(["view_channels", "send_messages", "attach_files", "add_reactions"]);

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

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const action = payload.action;
  const roleKey = typeof payload.role_key === "string" ? payload.role_key.trim() : "";
  if (!["create", "update", "delete"].includes(String(action)) || !ROLE_KEY.test(roleKey)) {
    return fail("La acción o clave del rol no son válidas.", 400);
  }

  if (!(await verifyCommunityFounder(user.id))) {
    return fail("Solo el founder puede administrar el catálogo de roles.", 403);
  }

  const label = typeof payload.label === "string" ? payload.label.trim() : null;
  const description = typeof payload.description === "string" ? payload.description : null;
  const badgeColor = typeof payload.badge_color === "string" ? payload.badge_color : null;
  const position = Number.isInteger(payload.position) ? Number(payload.position) : null;
  const displayAsBadge = typeof payload.display_as_badge === "boolean" ? payload.display_as_badge : null;
  const mentionable = typeof payload.mentionable === "boolean" ? payload.mentionable : null;
  const hoist = typeof payload.hoist === "boolean" ? payload.hoist : null;
  const rawPermissions = payload.permissions;
  let permissions: Record<string, boolean> | null = null;

  if (rawPermissions !== null && typeof rawPermissions === "object" && !Array.isArray(rawPermissions)) {
    const entries = Object.entries(rawPermissions as Record<string, unknown>);
    if (entries.some(([key, value]) => !ALLOWED_PERMISSIONS.has(key) || typeof value !== "boolean")) {
      return fail("El rol contiene permisos no compatibles.", 400);
    }
    permissions = Object.fromEntries(entries) as Record<string, boolean>;
  } else if (rawPermissions !== undefined && rawPermissions !== null) {
    return fail("La configuración de permisos no es válida.", 400);
  }

  if (action !== "delete") {
    if (!label || label.length < 2 || label.length > 40
      || description === null || description.length > 240
      || !badgeColor || !HEX_COLOR.test(badgeColor)
      || position === null || position < 0 || position > 1000) {
      return fail("Revisa el nombre, descripción, color y posición del rol.", 400);
    }
    if (action === "create" && permissions === null) {
      return fail("Define los permisos del rol antes de crearlo.", 400);
    }
  }

  const { data, error } = await supabase.rpc("manage_community_role_catalog", {
    p_action: action,
    p_role_key: roleKey,
    p_label: label,
    p_description: description,
    p_badge_color: badgeColor,
    p_position: position,
    p_display_as_badge: displayAsBadge,
    p_mentionable: mentionable,
    p_hoist: hoist,
    p_permissions: permissions,
  });

  if (error || data !== true) {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    return fail(
      denied ? "No tienes permiso para modificar este rol." :
        invalid ? "La configuración del rol no es válida." :
          error?.code === "23505" ? "Ya existe un rol con esa clave." :
            error?.code === "23503" ? "No se puede eliminar un rol todavía asignado." :
              "No se pudo guardar el rol.",
      denied ? 403 : invalid ? 400 : error?.code === "23503" ? 409 : 503,
    );
  }

  return NextResponse.json(
    { success: true, action, role_key: roleKey },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
