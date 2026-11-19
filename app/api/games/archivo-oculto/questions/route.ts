import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getArchivoOcultoShelfCatalog } from "@/lib/games/archivo-oculto-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  // Shared published metadata is cached across requests. Never put the
  // student's completion state in this cache key or shared cache payload.
  let catalog;
  try {
    catalog = await getArchivoOcultoShelfCatalog();
  } catch (cause) {
    console.error("[archivo-oculto] Could not load cached shelf catalog:", cause);
    return NextResponse.json({ error: "No se pudieron cargar las lecturas publicadas." }, { status: 500 });
  }

  if (!catalog.length) {
    return NextResponse.json({
      error: "Todavía no hay lecturas publicadas con cinco preguntas listas.",
    }, { status: 409 });
  }

  const passageIds = catalog.map((story) => story.id);
  const { data: completedPassages, error: progressError } = await supabaseAdmin
    .from("game_reading_passage_progress")
    .select("passage_id")
    .eq("user_id", user.id)
    .in("passage_id", passageIds);

  if (progressError) {
    console.warn("[archivo-oculto] Could not load completed book progress:", progressError.message);
  }

  const completedIds = new Set((completedPassages ?? []).map((row) => row.passage_id));
  const stories = catalog.map((story) => ({
    ...story,
    completed: completedIds.has(story.id),
  }));

  return NextResponse.json(
    { source: "database", stories },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Vary": "Cookie",
      },
    },
  );
}
