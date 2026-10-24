import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_GAME_KEY = "que-es-esa-vaina";
const ALLOWED_GAME_KEYS = new Set([DEFAULT_GAME_KEY, "caso-cero"]);

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const requestedKey = new URL(request.url).searchParams.get("gameKey") ?? DEFAULT_GAME_KEY;
  const gameKey = ALLOWED_GAME_KEYS.has(requestedKey) ? requestedKey : DEFAULT_GAME_KEY;

  const { data, error } = await supabase
    .from("game_progress")
    .select("best_score,best_correct,games_completed,updated_at")
    .eq("user_id", user.id)
    .eq("game_key", gameKey)
    .maybeSingle();

  if (error) {
    console.error("[game-progress] Error leyendo progreso:", error.message);
    return NextResponse.json({ error: "No se pudo cargar el progreso." }, { status: 500 });
  }

  return NextResponse.json({
    progress: data ?? { best_score: 0, best_correct: 0, games_completed: 0, updated_at: null },
  });
}

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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const candidate = body as Record<string, unknown>;
  const requestedKey = candidate.gameKey === undefined ? DEFAULT_GAME_KEY : candidate.gameKey;
  if (typeof requestedKey !== "string" || !ALLOWED_GAME_KEYS.has(requestedKey)) {
    return NextResponse.json({ error: "Juego no disponible." }, { status: 400 });
  }
  const gameKey = requestedKey;
  const score = candidate.score;
  const correct = candidate.correct;

  if (
    !Number.isInteger(score) || (score as number) < 0 || (score as number) > 1000 ||
    !Number.isInteger(correct) || (correct as number) < 0 || (correct as number) > 10
  ) {
    return NextResponse.json({ error: "Puntuación fuera de los límites permitidos." }, { status: 400 });
  }

  // Solo guardamos estadísticas personales. Nunca otorgamos XP o monedas desde este endpoint.
  const { data: current, error: readError } = await supabase
    .from("game_progress")
    .select("best_score,best_correct,games_completed")
    .eq("user_id", user.id)
    .eq("game_key", gameKey)
    .maybeSingle();

  if (readError) {
    console.error("[game-progress] Error consultando progreso:", readError.message);
    return NextResponse.json({ error: "No se pudo guardar el progreso." }, { status: 500 });
  }

  const payload = {
    user_id: user.id,
    game_key: gameKey,
    best_score: Math.max(current?.best_score ?? 0, score as number),
    best_correct: Math.max(current?.best_correct ?? 0, correct as number),
    games_completed: (current?.games_completed ?? 0) + 1,
    updated_at: new Date().toISOString(),
  };

  const { error: saveError } = await supabase
    .from("game_progress")
    .upsert(payload, { onConflict: "user_id,game_key" });

  if (saveError) {
    console.error("[game-progress] Error guardando progreso:", saveError.message);
    return NextResponse.json({ error: "No se pudo guardar el progreso." }, { status: 500 });
  }

  return NextResponse.json({
    progress: {
      best_score: payload.best_score,
      best_correct: payload.best_correct,
      games_completed: payload.games_completed,
      updated_at: payload.updated_at,
    },
  });
}
