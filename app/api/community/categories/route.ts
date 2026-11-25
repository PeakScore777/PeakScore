import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";
import { verifyCommunityFounder } from "@/lib/community/verify-founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (!(await verifyCommunityFounder(user.id))) {
    return fail("Solo el Founder puede administrar las categorías.", 403);
  }

  const body = await readBodyWithinLimit(request, 2_048);
  if (body === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body) as Record<string, unknown>; }
  catch { return fail("El formato de la solicitud no es válido.", 400); }

  const action = payload.action;
  const categoryId = typeof payload.category_id === "string" ? payload.category_id : null;
  const name = typeof payload.name === "string" ? payload.name.trim() : null;
  const position = Number.isInteger(payload.position) ? Number(payload.position) : 100;

  if (!["create", "update", "archive"].includes(String(action))) {
    return fail("La acción de categoría no es válida.", 400);
  }
  if (action !== "create" && (!categoryId || !UUID_PATTERN.test(categoryId))) {
    return fail("El identificador de categoría no es válido.", 400);
  }
  if (action !== "archive" && (!name || name.length < 2 || name.length > 40 || position < 0 || position > 1000)) {
    return fail("El nombre de categoría debe tener entre 2 y 40 caracteres.", 400);
  }

  const { data, error } = await supabase.rpc("manage_community_channel_category", {
    p_action: action,
    p_category_id: categoryId,
    p_name: name,
    p_position: position,
  });

  if (error || typeof data !== "string") {
    const denied = error?.code === "42501";
    const invalid = error?.code === "22023";
    const duplicate = error?.code === "23505";
    return fail(
      denied ? "Solo el Founder puede administrar las categorías." :
        duplicate ? "Ya existe una categoría con ese nombre." :
          invalid ? error?.message ?? "La categoría no se puede modificar." :
            "No se pudo guardar la categoría.",
      denied ? 403 : invalid || duplicate ? 400 : 503,
    );
  }

  return NextResponse.json({ success: true, action, category_id: data }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
