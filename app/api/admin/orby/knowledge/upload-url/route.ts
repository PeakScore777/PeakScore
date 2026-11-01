import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "orby-knowledge";
const MAX_PDF_BYTES = 20 * 1024 * 1024;

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
    return jsonError("El PDF debe pesar como máximo 20 MB.", 413);
  }

  const documentId = crypto.randomUUID();
  const path = owner.user.id + "/" + documentId + ".pdf";
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
    message: "Conexión privada preparada. El archivo se enviará directamente a Supabase Storage.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
