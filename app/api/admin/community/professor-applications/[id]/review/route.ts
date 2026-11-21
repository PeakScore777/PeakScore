import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";

export const runtime = "nodejs";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "No se pudo verificar el rol administrativo." }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para revisar solicitudes." }, { status: 403 });
  }

  const rawBody = await readBodyWithinLimit(request, 8_000);
  if (rawBody === null) {
    return NextResponse.json({ error: "La solicitud supera el tamaño permitido o no se pudo leer." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const value = body as Record<string, unknown>;
  const action = value.action;
  const note = typeof value.note === "string"
    ? value.note.normalize("NFC").replace(/\s+/g, " ").trim()
    : "";

  if (action !== "approve" && action !== "reject" && action !== "request_changes") {
    return NextResponse.json({ error: "Acción no permitida." }, { status: 400 });
  }
  if (note.length > 1000 || (action !== "approve" && note.length < 10)) {
    return NextResponse.json({ error: "Para rechazar o solicitar cambios, escribe un motivo de entre 10 y 1.000 caracteres." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("review_community_professor_application", {
    p_application_id: id,
    p_admin_id: user.id,
    p_action: action,
    p_review_note: note || null,
  });

  if (error) {
    const status = error.code === "42501" ? 403
      : error.code === "P0002" ? 409
      : error.code === "22023" ? 400
      : 500;
    if (status === 500) {
      console.error("Community professor review failed.", { adminId: user.id, applicationId: id, errorCode: error.code });
    }
    return NextResponse.json(
      { error: status === 409
        ? "La solicitud ya fue revisada o no existe. Actualiza la bandeja."
        : status === 403
          ? "No tienes permisos para revisar esta solicitud."
          : status === 400
            ? "La acción o el motivo no son válidos."
            : "No se pudo completar la revisión." },
      { status },
    );
  }

  return NextResponse.json({ success: true, result: data });
}
