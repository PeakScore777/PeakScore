import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const founderId = process.env.COMMUNITY_FOUNDER_USER_ID;
  if (!founderId || founderId !== user.id) return fail("Solo el fundador puede cambiar el estado de la comunidad.", 403);

  const body = await readBodyWithinLimit(request, 1_024);
  if (body === null) return fail("La solicitud no es válida.", 400);
  let payload: { action?: unknown };
  try {
    payload = JSON.parse(body);
  } catch {
    return fail("El formato de la solicitud no es válido.", 400);
  }
  if (payload.action !== "disable" && payload.action !== "restore") {
    return fail("La acción no está permitida.", 400);
  }

  const { data: bootstrapped, error: bootstrapError } = await supabaseAdmin.rpc("bootstrap_community_founder", {
    p_founder_user_id: user.id,
  });
  if (bootstrapError || bootstrapped !== true) return fail("No se pudo verificar la identidad del fundador.", 503);

  const { data, error } = await supabase.rpc("set_community_lifecycle", { p_action: payload.action });
  if (error || data !== true) {
    return fail(error?.code === "42501" ? "No tienes autorización." : "No se pudo cambiar el estado de la comunidad.", error?.code === "42501" ? 403 : 503);
  }

  return NextResponse.json(
    { success: true, action: payload.action },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
