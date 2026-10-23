import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const { data, error } = await supabase
    .from("game_questions")
    .select("id,subject,topic,difficulty,clue,options,answer,explanation,hint")
    .eq("game_key", "que-es-esa-vaina")
    .eq("status", "published")
    .limit(500);

  if (error) {
    // El juego mantiene el banco local mientras se aplica la migración o se configura Supabase.
    console.error("[game-questions] No se pudo leer el banco publicado:", error.message);
    return NextResponse.json({ questions: [], source: "fallback" });
  }

  return NextResponse.json({ questions: data ?? [], source: "database" });
}
