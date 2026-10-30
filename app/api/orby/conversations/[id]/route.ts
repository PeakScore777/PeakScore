import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Inicia sesión para eliminar el chat." }, { status: 401 });

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "La conversación no es válida." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from("orby_conversations")
      .delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return NextResponse.json({ error: "No se pudo eliminar el chat." }, { status: 503 });
    if (!data) return NextResponse.json({ error: "La conversación no existe o no te pertenece." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el chat." }, { status: 500 });
  }
}
