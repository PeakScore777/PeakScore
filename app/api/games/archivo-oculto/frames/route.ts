import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  const { data, error } = await supabase.from("archivo_oculto_wall_frames")
    .select("slot,title,image_url").eq("is_active", true);
  if (error) return NextResponse.json({ error: "No se pudieron cargar los cuadros." }, { status: 500 });
  return NextResponse.json({ frames: data ?? [] }, { headers: { "Cache-Control": "private, max-age=60" } });
}
