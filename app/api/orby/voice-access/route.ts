import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Beta temporal: el chat de voz está habilitado para cualquier usuario autenticado.
// La restricción Premium se reactivará después de validar la experiencia completa.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ enabled: false, error: "Inicia sesión para conversar con Orby." }, {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    return NextResponse.json({ enabled: true, beta: true }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ enabled: false, error: "No se pudo comprobar el acceso de voz." }, {
      status: 500,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
