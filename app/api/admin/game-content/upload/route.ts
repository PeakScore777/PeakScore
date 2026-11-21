import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRasterImage } from "@/lib/security/sanitize-raster-image";
import {
  consumeUserRateLimit,
  getContentLengthError,
  isSameOriginMutation,
} from "@/lib/security/request-guards";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_BYTES + 256 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return jsonError("La solicitud no es válida.", 403);
  }

  const sizeError = getContentLengthError(request, MAX_REQUEST_BYTES);
  if (sizeError) return jsonError(sizeError.message, sizeError.status);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonError("Debes iniciar sesión.", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return jsonError("No tienes permisos para subir imágenes.", 403);
  }

  const limit = await consumeUserRateLimit(supabase, "admin-game-image");
  if (limit.unavailable) {
    return jsonError("La protección de carga no está disponible. Inténtalo de nuevo.", 503);
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Has realizado demasiadas subidas. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return jsonError("Selecciona una imagen.", 400);
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return jsonError("Usa PNG, JPG o WebP de máximo 10 MB.", 413);
  }

  let sanitized;
  try {
    sanitized = await sanitizeRasterImage(
      new Uint8Array(await file.arrayBuffer()),
      file.type,
      MAX_BYTES,
    );
  } catch {
    return jsonError("La imagen no es válida o supera los límites de seguridad.", 415);
  }

  const path = "archivo-oculto/" + user.id + "/" + crypto.randomUUID() + "." + sanitized.extension;
  const { error } = await supabase.storage.from("question-images").upload(path, sanitized.buffer, {
    contentType: sanitized.contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[admin-game-image] Upload failed:", { code: error.name });
    return jsonError("No se pudo subir la imagen. Comprueba los permisos del bucket question-images.", 500);
  }

  const { data } = supabase.storage.from("question-images").getPublicUrl(path);
  return NextResponse.json(
    { url: data.publicUrl, path, width: sanitized.width, height: sanitized.height },
    { status: 201, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
