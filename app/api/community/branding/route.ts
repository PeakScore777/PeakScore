import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (!(await verifyCommunityFounder(user.id))) return fail("Solo el founder puede editar la comunidad global.", 403);

  const body = await readBodyWithinLimit(request, 2_048);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description = typeof payload.description === "string" ? payload.description : "";
  const iconKey = typeof payload.icon_key === "string" ? payload.icon_key : "";
  const accentColor = typeof payload.accent_color === "string" ? payload.accent_color : "";

  if (name.length < 2 || name.length > 60
      || description.length > 500
      || !/^[a-z][a-z0-9-]{1,31}$/.test(iconKey)
      || !/^#[0-9a-f]{6}$/i.test(accentColor)) {
    return fail("Revisa el nombre, descripción, icono y color de la comunidad.", 400);
  }

  const { data, error } = await supabase.rpc("update_community_global_branding", {
    p_name: name,
    p_description: description,
    p_icon_key: iconKey,
    p_accent_color: accentColor,
  });
  if (error || data !== true) {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    return fail(
      denied ? "No tienes permiso para editar esta comunidad." :
        invalid ? "La identidad de comunidad no es válida." :
          "No se pudo guardar la identidad global. Comprueba que la migración esté aplicada.",
      denied ? 403 : invalid ? 400 : 503,
    );
  }

  return NextResponse.json({ success: true }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
