import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const candidate = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  if (typeof candidate.sessionId !== "string") {
    return NextResponse.json({ error: "La sesión de lectura no es válida." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("complete_archivo_oculto_session", {
    p_session_id: candidate.sessionId,
  });

  if (error) {
    const message = error.message.includes("SESSION_INCOMPLETE")
      ? "Debes responder las diez preguntas antes de cerrar el expediente."
      : error.message.includes("SESSION_INVALID_OR_EXPIRED")
        ? "La sesión expiró. Abre un expediente nuevo."
        : error.message.includes("UNAUTHORIZED")
          ? "Debes iniciar sesión para cerrar el expediente."
          : "No se pudo registrar el resultado de la lectura.";
    const status = error.message.includes("SESSION_INCOMPLETE") || error.message.includes("SESSION_INVALID_OR_EXPIRED")
      ? 409
      : error.message.includes("UNAUTHORIZED") ? 401 : 500;
    console.error("[archivo-oculto-complete] No se pudo cerrar el expediente:", error.message);
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ completion: data });
}
