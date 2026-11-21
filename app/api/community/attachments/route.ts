import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage } from "@/lib/security/sanitize-raster-image";
import {
  getContentLengthError,
  isSameOriginMutation,
  readFormDataWithinLimit,
} from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 128 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);

  const sizeError = getContentLengthError(request, MAX_REQUEST_BYTES);
  if (sizeError) return fail(sizeError.message, sizeError.status);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const parsed = await readFormDataWithinLimit(request, MAX_REQUEST_BYTES);
  if (!parsed.ok) {
    return fail(
      parsed.reason === "too_large"
        ? "La imagen supera el tamaño permitido."
        : "El formulario de mensaje no es válido.",
      parsed.reason === "too_large" ? 413 : 400,
    );
  }

  const form = parsed.formData;
  const channelId = String(form.get("channel_id") ?? "");
  const body = String(form.get("body") ?? "").trim();
  const replyTo = String(form.get("reply_to_message_id") ?? "").trim() || null;
  const altText = String(form.get("attachment_alt") ?? "").trim() || null;
  const file = form.get("file");

  if (!UUID_PATTERN.test(channelId)) return fail("El canal no es válido.", 400);
  if (replyTo && !UUID_PATTERN.test(replyTo)) return fail("El mensaje citado no es válido.", 400);
  if (body.length > 2000) return fail("El mensaje supera los 2.000 caracteres.", 400);
  if (altText && altText.length > 240) return fail("La descripción de imagen supera los 240 caracteres.", 400);
  if (!(file instanceof File)) return fail("Selecciona una imagen.", 400);
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return fail("La imagen debe pesar máximo 8 MB.", 413);
  }
  if (!body && !file) return fail("Escribe un mensaje o adjunta una imagen.", 400);

  // Rate limits are enforced in PostgreSQL and cannot be bypassed by the browser.
  const { data: withinLimit, error: limitError } = await supabase.rpc(
    "consume_community_attachment_rate_limit",
  );
  if (limitError) {
    console.error("[community-attachment] Rate limit unavailable.", { code: limitError.code });
    return fail("La protección de carga no está disponible. Inténtalo de nuevo.", 503);
  }
  if (withinLimit !== true) {
    return NextResponse.json(
      { error: "Has subido demasiadas imágenes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
    );
  }

  let sanitized: Awaited<ReturnType<typeof sanitizeRasterImage>>;
  try {
    sanitized = await sanitizeRasterImage(
      new Uint8Array(await file.arrayBuffer()),
      file.type,
      MAX_IMAGE_BYTES,
    );
  } catch {
    return fail("Solo se permiten imágenes PNG, JPG o WebP válidas, estáticas y dentro de los límites.", 415);
  }

  const extension = sanitized.extension;
  const storagePath = user.id + "/" + crypto.randomUUID() + "." + extension;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("community-attachments")
    .upload(storagePath, sanitized.buffer, {
      contentType: sanitized.contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[community-attachment] Storage upload failed.", { code: uploadError.name });
    return fail("No se pudo guardar la imagen. Inténtalo de nuevo.", 503);
  }

  const { data: message, error: insertError } = await supabase
    .from("community_messages")
    .insert({
      channel_id: channelId,
      author_id: user.id,
      body,
      reply_to_message_id: replyTo,
      attachment_path: storagePath,
      attachment_alt: altText,
    })
    .select("id,channel_id,author_id,body,created_at,edited_at,reply_to_message_id,attachment_path,attachment_alt")
    .single();

  if (insertError || !message) {
    // Avoid orphaned private objects if the message insert fails RLS or validation.
    const { error: cleanupError } = await supabaseAdmin.storage
      .from("community-attachments")
      .remove([storagePath]);
    if (cleanupError) {
      console.error("[community-attachment] Failed to clean orphaned object.", { code: cleanupError.name });
    }
    const denied = insertError?.code === "42501";
    return fail(
      denied
        ? "No tienes permiso para publicar en este canal o responder a ese mensaje."
        : "No se pudo publicar el mensaje con la imagen.",
      denied ? 403 : 400,
    );
  }

  return NextResponse.json(
    {
      message,
      image: {
        width: sanitized.width,
        height: sanitized.height,
        contentType: sanitized.contentType,
        size: sanitized.buffer.length,
      },
    },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
