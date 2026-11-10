import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "orby-images";
const MAX_IMAGE_BYTES = 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function getUserClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getUserClient();
    if (!supabase || !user) return jsonError("Inicia sesión para ver tus imágenes.", 401);

    // Message history stores only the private storage path. Resolve a fresh,
    // short-lived signed URL on every image request so history never expires.
    const requestedPath = new URL(request.url).searchParams.get("path");
    if (requestedPath) {
      if (!requestedPath.startsWith(user.id + "/") || requestedPath.includes("..") || requestedPath.length > 240) {
        return jsonError("La imagen seleccionada no es válida.", 400);
      }
      const { data: asset, error: lookupError } = await supabase
        .from("orby_image_assets")
        .select("storage_path")
        .eq("user_id", user.id)
        .eq("storage_path", requestedPath)
        .maybeSingle();
      if (lookupError) return jsonError("No se pudo verificar la imagen.", 503);
      if (!asset) return jsonError("La imagen no existe.", 404);
      const { data: signed, error: signedError } = await supabase.storage.from(BUCKET)
        .createSignedUrl(requestedPath, 10 * 60);
      if (signedError || !signed?.signedUrl) return jsonError("No se pudo preparar la imagen.", 503);
      return NextResponse.redirect(signed.signedUrl, {
        status: 302,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }

    const { data: assets, error } = await supabase
      .from("orby_image_assets")
      .select("storage_path,original_name,size_bytes,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("[Orby Images] List failed.", { code: error.code });
      return jsonError("No se pudo cargar el almacenamiento.", 503);
    }

    const rows = assets ?? [];
    const signed = rows.length
      ? await supabase.storage.from(BUCKET).createSignedUrls(rows.map((item) => item.storage_path), 60 * 30)
      : { data: [], error: null };
    if (signed.error) {
      console.error("[Orby Images] Signed URL creation failed.", { message: signed.error.message });
      return jsonError("No se pudieron preparar las vistas previas.", 503);
    }

    const signedByPath = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]));
    return NextResponse.json({
      images: rows.map((item) => ({
        path: item.storage_path,
        name: item.original_name,
        size: item.size_bytes,
        createdAt: item.created_at,
        signedUrl: signedByPath.get(item.storage_path) ?? null,
      })).filter((item) => item.signedUrl),
      limit: 20,
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return jsonError("No se pudo cargar el almacenamiento.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getUserClient();
    if (!supabase || !user) return jsonError("Inicia sesión para guardar imágenes.", 401);

    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return jsonError("Selecciona una imagen válida.", 400);
    if (!ALLOWED_TYPES.has(file.type)) return jsonError("Solo se permiten imágenes JPG, PNG o WebP.", 415);
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) return jsonError("La imagen debe pesar máximo 1 MB.", 413);

    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const path = user.id + "/" + crypto.randomUUID() + "." + extension;
    const originalName = file.name.replace(/[\u0000-\u001f\\/]/g, "_").slice(0, 180) || "imagen." + extension;

    const { error: metadataError } = await supabase.from("orby_image_assets").insert({
      user_id: user.id,
      storage_path: path,
      original_name: originalName,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (metadataError) {
      if (metadataError.code === "23514" || metadataError.message.includes("ORBY_IMAGE_QUOTA_REACHED")) {
        return jsonError("Almacenamiento lleno: tienes un máximo de 20 imágenes. Elimina una para continuar.", 409);
      }
      console.error("[Orby Images] Metadata insert failed.", { code: metadataError.code });
      return jsonError("No se pudo reservar espacio para la imagen.", 503);
    }

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "1800",
      upsert: false,
    });
    if (uploadError) {
      await supabase.from("orby_image_assets").delete().eq("user_id", user.id).eq("storage_path", path);
      console.error("[Orby Images] Upload failed.", { message: uploadError.message });
      return jsonError("No se pudo guardar la imagen. Inténtalo de nuevo.", 503);
    }

    return NextResponse.json({ saved: true, path }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("No se pudo guardar la imagen.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getUserClient();
    if (!supabase || !user) return jsonError("Inicia sesión para eliminar imágenes.", 401);

    const body = await request.json().catch(() => null);
    const path = body && typeof body.path === "string" ? body.path : "";
    if (!path.startsWith(user.id + "/") || path.includes("..") || path.length > 240) {
      return jsonError("La imagen seleccionada no es válida.", 400);
    }

    const { data: asset, error: lookupError } = await supabase
      .from("orby_image_assets")
      .select("storage_path")
      .eq("user_id", user.id)
      .eq("storage_path", path)
      .maybeSingle();
    if (lookupError) return jsonError("No se pudo verificar la imagen.", 503);
    if (!asset) return jsonError("La imagen no existe.", 404);

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeError) {
      console.error("[Orby Images] Storage delete failed.", { message: removeError.message });
      return jsonError("No se pudo eliminar el archivo. Inténtalo de nuevo.", 503);
    }

    const { error: metadataError } = await supabase.from("orby_image_assets").delete()
      .eq("user_id", user.id).eq("storage_path", path);
    if (metadataError) return jsonError("El archivo se eliminó, pero no se pudo actualizar el contador. Recarga el almacenamiento.", 503);

    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("No se pudo eliminar la imagen.", 500);
  }
}
