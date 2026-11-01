import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "orby-knowledge";
const MAX_PDF_BYTES = 50_000_000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getOrbyOwner();
  if (!owner?.user) return jsonError("Acceso reservado al administrador.", 403);

  const body = await request.json().catch(() => null);
  const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const size = Number(body?.size);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";

  if (!fileName || fileName.length > 180 || !fileName.toLowerCase().endsWith(".pdf")) {
    return jsonError("Selecciona un archivo PDF válido.", 400);
  }
  if (contentType !== "application/pdf") return jsonError("El archivo debe ser un PDF.", 415);
  if (!Number.isInteger(size) || size < 1 || size > MAX_PDF_BYTES) {
    return jsonError("El PDF debe pesar como máximo 50 MB.", 413);
  }

  const documentId = crypto.randomUUID();
  const path = owner.user.id + "/" + documentId + ".pdf";
  const configuredStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredStorageUrl) return jsonError("El almacenamiento de Orby no está configurado.", 503);
  let tusEndpoint: string;
  try {
    const projectUrl = new URL(configuredStorageUrl);
    if (projectUrl.protocol !== "https:" || !projectUrl.hostname.endsWith(".supabase.co")) {
      return jsonError("El endpoint privado de almacenamiento no es válido.", 503);
    }
    const projectRef = projectUrl.hostname.split(".")[0];
    tusEndpoint = "https://" + projectRef + ".storage.supabase.co/storage/v1/upload/resumable";
  } catch {
    return jsonError("No se pudo preparar el endpoint de carga.", 503);
  }
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data?.token) {
    console.error("[Orby Knowledge] Signed upload URL creation failed.", { message: error?.message });
    return jsonError("No se pudo preparar la subida privada del PDF.", 503);
  }

  return NextResponse.json({
    documentId,
    path,
    token: data.token,
    tusEndpoint,
    bucketName: BUCKET,
    message: "Conexión privada preparada. El archivo se enviará en bloques reanudables directamente a Supabase Storage.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
