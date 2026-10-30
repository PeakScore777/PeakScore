import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ enabled: false, error: "Inicia sesión para comprobar el acceso de voz." }, {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("plan,status,expires_at,started_at")
      .eq("user_id", user.id)
      .eq("plan", "premium")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[Orby Voice] No se pudo comprobar la suscripción.", { code: error.code });
      return NextResponse.json({ enabled: false, error: "No se pudo comprobar el acceso Premium." }, {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const now = Date.now();
    const enabled = (subscriptions ?? []).some((subscription) => (
      subscription.plan === "premium"
      && subscription.status === "active"
      && (!subscription.expires_at || Date.parse(subscription.expires_at) > now)
    ));

    return NextResponse.json({ enabled }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[Orby Voice] Error inesperado comprobando el acceso.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ enabled: false, error: "No se pudo comprobar el acceso de voz." }, {
      status: 500,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
