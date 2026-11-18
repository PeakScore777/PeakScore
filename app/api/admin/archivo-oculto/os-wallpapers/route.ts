import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    return candidate.origin === base.origin &&
      candidate.pathname === "/storage/v1/object/public/question-images/" + storagePath;
  } catch { return false; }
}

export async function GET() {
  const { supabase, response } = await adminContext();
  if (response) return response;
  const { data, error } = await supabase.from("archivo_oculto_os_wallpapers")
    .select("id,slot,title,image_url,storage_path,sort_order,is_active,created_at")
    .order("slot").order("sort_order").order("created_at");
  if (error) return NextResponse.json({ error: "No se pudieron cargar los fondos." }, { status: 500 });
  return NextResponse.json({ wallpapers: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await adminContext();
  if (response || !user) return response;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const slot = input.slot;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if ((slot !== "desktop" && slot !== "lock") || title.length < 2 || title.length > 120 ||
    !validOwnedImage(input.imageUrl, input.storagePath, user.id)) {
    return NextResponse.json({ error: "Selecciona una ubicación y una imagen válida." }, { status: 400 });
  }
  if (slot === "desktop") {
    const { error: deactivateError } = await supabase.from("archivo_oculto_os_wallpapers")
      .update({ is_active: false, updated_at: new Date().toISOString() }).eq("slot", "desktop");
    if (deactivateError) return NextResponse.json({ error: "No se pudo actualizar el fondo actual." }, { status: 500 });
  }
  const { data, error } = await supabase.from("archivo_oculto_os_wallpapers").insert({
    slot, title, image_url: input.imageUrl, storage_path: input.storagePath,
    sort_order: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    is_active: true, created_by: user.id,
  }).select("id,slot,title,image_url,storage_path,sort_order,is_active,created_at").single();
  if (error || !data) return NextResponse.json({ error: "No se pudo guardar el fondo." }, { status: 500 });
  return NextResponse.json({ wallpaper: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, response } = await adminContext();
  if (response) return response;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.id !== "string" || typeof input.isActive !== "boolean") return NextResponse.json({ error: "Selección inválida." }, { status: 400 });
  const { data: current } = await supabase.from("archivo_oculto_os_wallpapers").select("id,slot").eq("id", input.id).maybeSingle();
  if (!current) return NextResponse.json({ error: "No se encontró el fondo." }, { status: 404 });
  if (current.slot === "desktop" && input.isActive) {
    const { error: deactivateError } = await supabase.from("archivo_oculto_os_wallpapers")
      .update({ is_active: false, updated_at: new Date().toISOString() }).eq("slot", "desktop");
    if (deactivateError) return NextResponse.json({ error: "No se pudo cambiar el fondo." }, { status: 500 });
  }
  const { error } = await supabase.from("archivo_oculto_os_wallpapers")
    .update({ is_active: input.isActive, updated_at: new Date().toISOString() }).eq("id", input.id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar la selección." }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { supabase, response } = await adminContext();
  if (response) return response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Fondo no válido." }, { status: 400 });
  const { error } = await supabase.from("archivo_oculto_os_wallpapers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar el fondo." }, { status: 500 });
  return NextResponse.json({ success: true });
}
