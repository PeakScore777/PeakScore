import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}$/;
const ICON_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const CATEGORIES = new Set(["COMUNIDAD", "MATERIAS", "PROFESORES", "AULAS Y EVENTOS"]);

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

  const body = await readBodyWithinLimit(request, 6_144);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const action = payload.action;
  const channelId = typeof payload.channel_id === "string" ? payload.channel_id : null;
  const spaceId = typeof payload.space_id === "string" ? payload.space_id : null;
  if (spaceId && !UUID_PATTERN.test(spaceId)) return fail("El espacio no es válido.", 400);
  if (!["create", "update", "archive"].includes(String(action))) {
    return fail("La acción del canal no es válida.", 400);
  }
  if (action !== "create" && (!channelId || !UUID_PATTERN.test(channelId))) {
    return fail("El identificador del canal no es válido.", 400);
  }

  if (!(await verifyCommunityFounder(user.id))) {
    return fail("Solo el founder puede administrar canales.", 403);
  }

  const slug = typeof payload.slug === "string" ? payload.slug.trim() : null;
  const name = typeof payload.name === "string" ? payload.name.trim() : null;
  const description = typeof payload.description === "string" ? payload.description : null;
  const category = typeof payload.category === "string" ? payload.category : null;
  const position = Number.isInteger(payload.position) ? Number(payload.position) : null;
  const channelType = typeof payload.channel_type === "string" ? payload.channel_type : null;
  const iconKey = typeof payload.icon_key === "string" ? payload.icon_key : null;
  const accentColor = typeof payload.accent_color === "string" ? payload.accent_color : null;

  if (action !== "archive" && (
    !slug || !SLUG_PATTERN.test(slug)
    || !name || name.length < 2 || name.length > 60
    || description === null || description.length > 240
    || !category || category.trim().length < 2 || category.trim().length > 40
    || position === null || position < 0 || position > 1000
    || !channelType || !["text", "announcement"].includes(channelType)
    || !iconKey || !ICON_PATTERN.test(iconKey)
    || !accentColor || !HEX_COLOR.test(accentColor)
    || typeof payload.is_private !== "boolean"
    || typeof payload.is_read_only !== "boolean"
  )) {
    return fail("Revisa el nombre, categoría, visibilidad y apariencia del canal.", 400);
  }

  const channelArgs = {
    p_action: action,
    p_channel_id: channelId,
    p_slug: slug,
    p_name: name,
    p_description: description,
    p_category: category,
    p_position: position,
    p_is_private: typeof payload.is_private === "boolean" ? payload.is_private : null,
    p_is_read_only: typeof payload.is_read_only === "boolean" ? payload.is_read_only : null,
    p_channel_type: channelType,
    p_icon_key: iconKey,
    p_accent_color: accentColor,
  };
  const { data, error } = spaceId
    ? await supabase.rpc("manage_community_space_channel", { p_space_id: spaceId, ...channelArgs })
    : await supabase.rpc("manage_community_channel", channelArgs);

  if (error || typeof data !== "string") {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    return fail(
      denied ? "No tienes permiso para administrar este canal." :
        invalid ? "La configuración del canal no es válida." :
          error?.code === "23505" ? "Ya existe un canal con ese identificador." :
            "No se pudo guardar el canal.",
      denied ? 403 : invalid ? 400 : 503,
    );
  }

  return NextResponse.json(
    { success: true, action, channel_id: data },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
