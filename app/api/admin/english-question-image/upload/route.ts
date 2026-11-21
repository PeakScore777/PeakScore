import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage } from "@/lib/security/sanitize-raster-image";
import {
  consumeUserRateLimit,
  getContentLengthError,
  isSameOriginMutation,
} from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 256 * 1024;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);

  const sizeError = getContentLengthError(request, MAX_REQUEST_BYTES);
  if (sizeError) return fail(sizeError.message, sizeError.status);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return fail("No tienes permisos de administración.", 403);
  }

  const limit = await consumeUserRateLimit(supabase, "english-question-image");
  if (limit.unavailable) {
    return fail("La protección de imágenes no está disponible. Inténtalo de nuevo.", 503);
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Has realizado demasiadas subidas de imágenes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Selecciona una imagen.", 400);
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return fail("La imagen debe pesar máximo 8 MB.", 413);
  }

  let sanitized: Awaited<ReturnType<typeof sanitizeRasterImage>>;
  try {
    sanitized = await sanitizeRasterImage(
      new Uint8Array(await file.arrayBuffer()),
      file.type,
      MAX_IMAGE_BYTES,
    );
  } catch {
    return fail("La imagen debe ser PNG, JPG o WebP válido y no animado.", 415);
  }

  const storagePath =
    "english/" + user.id + "/" + crypto.randomUUID() + "." + sanitized.extension;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("question-images")
    .upload(storagePath, sanitized.buffer, {
      contentType: sanitized.contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("[english-question-image] Upload failed.", { code: uploadError.name });
    return fail("No se pudo guardar la imagen. Inténtalo de nuevo.", 503);
  }

  const { data } = supabaseAdmin.storage.from("question-images").getPublicUrl(storagePath);
  return NextResponse.json(
    {
      url: data.publicUrl,
      path: storagePath,
      width: sanitized.width,
      height: sanitized.height,
      contentType: sanitized.contentType,
    },
    { status: 201, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
