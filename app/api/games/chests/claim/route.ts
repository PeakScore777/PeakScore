import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const [{ data: stateData, error: stateError }, { data: profile, error: profileError }] = await Promise.all([
    supabaseAdmin.rpc("get_que_es_esa_vaina_chest_state", { p_user_id: user.id }),
    supabase.from("profiles").select("xp,coins").eq("id", user.id).maybeSingle(),
  ]);
  if (stateError) {
    console.error("[game-chest-state] No se pudo cargar el ciclo:", stateError.message);
    return NextResponse.json({ error: "No se pudo cargar el estado de las recompensas." }, { status: 500 });
  }
  const state = stateData && typeof stateData === "object" ? stateData as Record<string, unknown> : {};
  const claimed = Array.isArray(state.claimedChests) ? state.claimedChests : [];
  return NextResponse.json({
    claimedChests: claimed.filter((value): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 3),
    cycleNumber: Number.isInteger(state.cycleNumber) ? Number(state.cycleNumber) : 1,
    cycleStartedAt: typeof state.cycleStartedAt === "string" ? state.cycleStartedAt : null,
    cooldownUntil: typeof state.cooldownUntil === "string" ? state.cooldownUntil : null,
    frozenScore: Math.max(0, Math.min(1000, Number(state.frozenScore) || 0)),
    wallet: profileError || !profile ? null : { xp: profile.xp, coins: profile.coins },
  });
}

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
    const locked = claimError.message.match(/CHEST_LOCKED:(\d+):(\d+)/);
    const cooldown = claimError.message.match(/CHEST_COOLDOWN:([^\\s]+)/);
    const order = claimError.message.match(/CHEST_ORDER:(\d+)/);
    const message = locked ? `Necesitas ${locked[1]} puntos netos para este cofre. Tu puntuación validada es ${locked[2]}.`
      : cooldown ? `Los cofres están en recarga hasta ${new Date(cooldown[1]).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.`
      : order ? `Primero debes reclamar el cofre ${order[1]}.`
      : claimError.message.includes("SESSION_BEFORE_CYCLE") ? "La recarga terminó. Pulsa Jugar otra vez para empezar una partida nueva."
      : claimError.message.includes("CHEST_SET_COMPLETE") || claimError.message.includes("CHEST_COOLDOWN_NOT_STARTED") ? "Ya reclamaste los tres cofres de este ciclo."
      : claimError.message.includes("SESSION_INVALID_OR_EXPIRED") ? "La partida expiró. Inicia otra."
      : claimError.message.includes("UNAUTHORIZED") ? "Inicia sesión para reclamar recompensas."
      : "No se pudo reclamar el cofre. Inténtalo de nuevo.";
    const status = claimError.message.includes("CHEST_LOCKED") || claimError.message.includes("CHEST_COOLDOWN")
      || claimError.message.includes("CHEST_ORDER") || claimError.message.includes("SESSION_BEFORE_CYCLE")
      || claimError.message.includes("CHEST_SET_COMPLETE") ? 409 : 400;
    console.error("[game-chest-claim] Rechazo de reclamación:", claimError.message);
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ reward: data });
}
