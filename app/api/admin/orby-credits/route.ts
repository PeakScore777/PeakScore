import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLOBAL_ADMIN_EMAIL = "aragonyostynsena07@gmail.com";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set(["eligible", "blocked", "review"]);

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    if (user.email?.toLowerCase() !== GLOBAL_ADMIN_EMAIL) {
      return NextResponse.json({ error: "No tienes permisos para gestionar créditos promocionales." }, { status: 403 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Orby Admin] No se pudo verificar el rol.", { code: profileError.code });
      return NextResponse.json({ error: "No fue posible verificar los permisos." }, { status: 500 });
    }
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "No tienes permisos administrativos." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const targetUserId = typeof input.targetUserId === "string" ? input.targetUserId.trim() : "";
    const status = typeof input.status === "string" ? input.status : "";
    const reason = typeof input.reason === "string" ? input.reason.normalize("NFC").replace(/\s+/g, " ").trim() : "";

    if (!UUID_PATTERN.test(targetUserId) || targetUserId === user.id) {
      return NextResponse.json({ error: "El usuario objetivo no es válido." }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Estado promocional no válido." }, { status: 400 });
    }
    if (reason.length < 10 || reason.length > 500) {
      return NextResponse.json({ error: "El motivo debe tener entre 10 y 500 caracteres." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("orby_set_promo_status", {
      p_target_user_id: targetUserId,
      p_admin_user_id: user.id,
      p_new_status: status,
      p_reason: reason,
    });

    if (error || !data || typeof data !== "object") {
      console.error("[Orby Admin] Falló la actualización del estado promocional.", { code: error?.code });
      return NextResponse.json({ error: "No se pudo actualizar el estado promocional." }, { status: 503 });
    }

    const result = data as { ok?: boolean; code?: string; oldStatus?: string; newStatus?: string };
    if (!result.ok) {
      const messages: Record<string, string> = {
        invalid_input: "Los datos de la revisión no son válidos.",
        account_not_found: "No existe una cuenta de créditos para ese usuario.",
      };
      const statusCode = result.code === "account_not_found" ? 404 : 400;
      return NextResponse.json({ error: messages[result.code ?? ""] ?? "No se pudo aplicar el cambio." }, { status: statusCode });
    }

    return NextResponse.json({ ok: true, oldStatus: result.oldStatus, status: result.newStatus });
  } catch (error) {
    console.error("[Orby Admin] Error inesperado.", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
  }
}
