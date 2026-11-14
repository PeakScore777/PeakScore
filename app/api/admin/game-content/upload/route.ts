import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para subir imágenes." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Usa PNG, JPG o WebP de máximo 10 MB." }, { status: 400 });
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = "archivo-oculto/" + user.id + "/" + crypto.randomUUID() + "." + extension;
  const { error } = await supabase.storage.from("question-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[admin-game-image] Upload failed:", error.message);
    return NextResponse.json({ error: "No se pudo subir la imagen. Comprueba los permisos del bucket question-images." }, { status: 500 });
  }

  const { data } = supabase.storage.from("question-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path }, { status: 201 });
}
