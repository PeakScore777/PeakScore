import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return { supabase, user: null, response: NextResponse.json({ error: "No tienes permisos de administración." }, { status: 403 }) };
  return { supabase, user, response: null };
}

function validOwnedImage(imageUrl: unknown, storagePath: unknown, userId: string) {
  if (typeof imageUrl !== "string" || typeof storagePath !== "string") return false;
  if (!storagePath.startsWith("archivo-oculto/" + userId + "/") || !/\.(jpg|png|webp)$/i.test(storagePath)) return false;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return false;
  try {
    const base = new URL(baseUrl);
    const candidate = new URL(imageUrl);
    return candidate.origin === base.origin
      && candidate.pathname === "/storage/v1/object/public/question-images/" + storagePath;
  } catch { return false; }
}

export async function GET() {
  const { supabase, response } = await adminContext();
  if (response) return response;
  const { data, error } = await supabase.from("archivo_oculto_wall_frames")
    .select("id,slot,title,image_url,storage_path,is_active,updated_at").order("slot");
  if (error) return NextResponse.json({ error: "No se pudieron cargar los cuadros." }, { status: 500 });
  return NextResponse.json({ frames: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await adminContext();
  if (response || !user) return response;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const slot = input.slot;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if ((slot !== "left" && slot !== "right") || title.length < 2 || title.length > 120
    || !validOwnedImage(input.imageUrl, input.storagePath, user.id)) {
    return NextResponse.json({ error: "Selecciona un cuadro y una imagen válida (PNG, JPG o WebP)." }, { status: 400 });
  }
  const { data, error } = await supabase.from("archivo_oculto_wall_frames").upsert({
    slot, title, image_url: input.imageUrl, storage_path: input.storagePath,
    is_active: true, created_by: user.id, updated_at: new Date().toISOString(),
  }, { onConflict: "slot" }).select("id,slot,title,image_url,storage_path,is_active,updated_at").single();
  if (error || !data) {
    console.error("[archivo-oculto-frames] Save failed:", error?.message);
    return NextResponse.json({ error: "No se pudo guardar el cuadro." }, { status: 500 });
  }
  return NextResponse.json({ frame: data });
}

export async function DELETE(request: Request) {
  const { supabase, response } = await adminContext();
  if (response) return response;
  const slot = new URL(request.url).searchParams.get("slot");
  if (slot !== "left" && slot !== "right") return NextResponse.json({ error: "Cuadro no válido." }, { status: 400 });
  const { error } = await supabase.from("archivo_oculto_wall_frames").delete().eq("slot", slot);
  if (error) return NextResponse.json({ error: "No se pudo quitar el cuadro." }, { status: 500 });
  return NextResponse.json({ success: true });
}
