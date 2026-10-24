import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const candidate = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof candidate.sessionId !== "string" || !Number.isInteger(candidate.chestNumber) || (candidate.chestNumber as number) < 1 || (candidate.chestNumber as number) > 3) {
    return NextResponse.json({ error: "Cofre inválido." }, { status: 400 });
  }
  const { data, error: claimError } = await supabase.rpc("claim_que_es_esa_vaina_chest", {
    p_session_id: candidate.sessionId, p_chest_number: candidate.chestNumber,
  });
  if (claimError) {
    const message = claimError.message.includes("CHEST_LOCKED") ? "Aún no has alcanzado los aciertos necesarios."
      : claimError.message.includes("SESSION_INVALID_OR_EXPIRED") ? "La partida expiró. Inicia otra."
      : claimError.message.includes("UNAUTHORIZED") ? "Inicia sesión para reclamar recompensas."
      : "No se pudo reclamar el cofre. Inténtalo de nuevo.";
    const status = claimError.message.includes("CHEST_LOCKED") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ reward: data });
}
