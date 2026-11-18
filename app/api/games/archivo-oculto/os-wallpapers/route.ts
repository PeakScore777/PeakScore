import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  const { data, error: queryError } = await supabase.from("archivo_oculto_os_wallpapers")
    .select("id,slot,title,image_url,sort_order")
    .eq("is_active", true).order("sort_order").order("created_at");
  if (queryError) return NextResponse.json({ error: "No se pudieron cargar los fondos." }, { status: 500 });
  return NextResponse.json({ wallpapers: data ?? [] }, { headers: { "Cache-Control": "private, max-age=30" } });
}
