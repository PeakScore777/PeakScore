import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para consultar tus créditos." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc("orby_get_credits", { p_user_id: user.id });
    if (error || !data || typeof data !== "object") {
      console.error("[Orby Credits] No se pudo consultar el saldo.", { code: error?.code });
      return NextResponse.json({ error: "No pudimos consultar tus créditos. Inténtalo de nuevo." }, { status: 503 });
    }

    const result = data as { ok?: boolean; code?: string; balance?: number; promoStatus?: string; messagesToday?: number; imagesToday?: number };
    if (!result.ok) {
      const message = result.code === "email_unverified"
        ? "Verifica tu correo electrónico para activar los créditos gratuitos de Orby."
        : "No pudimos consultar tus créditos.";
      return NextResponse.json({ error: message }, { status: result.code === "email_unverified" ? 403 : 400 });
    }

    return NextResponse.json({
      credits: result.promoStatus === "blocked" ? 0 : result.balance ?? 0,
      promoStatus: result.promoStatus ?? "eligible",
      messagesToday: result.messagesToday ?? 0,
      imagesToday: result.imagesToday ?? 0,
    });
  } catch (error) {
    console.error("[Orby Credits] Error inesperado.", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "No pudimos consultar tus créditos." }, { status: 503 });
  }
}
