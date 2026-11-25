import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9][a-z0-9-]{1,48}$/;
const ICON = /^[a-z][a-z0-9-]{1,31}$/;
const COLOR = /^#[0-9a-f]{6}$/i;
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

  const body = await readBodyWithinLimit(request, 8_192);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const action = payload.action;
  const spaceId = typeof payload.space_id === "string" ? payload.space_id : null;
  if (!["create", "update", "archive"].includes(String(action))) return fail("La acción del espacio no es válida.", 400);
  if (action !== "create" && (!spaceId || !UUID.test(spaceId))) return fail("El identificador del espacio no es válido.", 400);
  if (!(await verifyCommunityFounder(user.id))) return fail("Solo el founder puede administrar espacios.", 403);

  const slug = typeof payload.slug === "string" ? payload.slug.trim() : null;
  const name = typeof payload.name === "string" ? payload.name.trim() : null;
  const description = typeof payload.description === "string" ? payload.description : null;
  const visibility = typeof payload.visibility === "string" ? payload.visibility : null;
  const iconKey = typeof payload.icon_key === "string" ? payload.icon_key : null;
  const accentColor = typeof payload.accent_color === "string" ? payload.accent_color : null;

  if (action !== "archive" && (
    !slug || !SLUG.test(slug)
    || !name || name.length < 2 || name.length > 60
    || description === null || description.length > 500
    || !visibility || !["public", "private"].includes(visibility)
    || !iconKey || !ICON.test(iconKey)
    || !accentColor || !COLOR.test(accentColor)
  )) return fail("Revisa el identificador, nombre, descripción y apariencia del espacio.", 400);

  const { data, error } = await supabase.rpc("manage_community_space", {
    p_action: action,
    p_space_id: spaceId,
    p_slug: slug,
    p_name: name,
    p_description: description,
    p_visibility: visibility,
    p_icon_key: iconKey,
    p_accent_color: accentColor,
  });

  if (error || typeof data !== "string") {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    return fail(
      denied ? "No tienes permiso para administrar este espacio." :
        invalid ? "La configuración del espacio no es válida." :
          error?.code === "23505" ? "Ya existe un espacio con ese identificador." :
            "No se pudo guardar el espacio.",
      denied ? 403 : invalid ? 400 : 503,
    );
  }

  return NextResponse.json({ success: true, action, space_id: data }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
