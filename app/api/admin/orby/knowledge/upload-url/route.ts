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
  const requestedDocumentId = typeof body?.documentId === "string" ? body.documentId : "";

  if (!fileName || fileName.length > 180 || !fileName.toLowerCase().endsWith(".pdf")) {
    return jsonError("Selecciona un archivo PDF válido.", 400);
  }
  if (contentType !== "application/pdf") return jsonError("El archivo debe ser un PDF.", 415);
  if (!Number.isInteger(size) || size < 1 || size > MAX_PDF_BYTES) {
    return jsonError("El PDF debe pesar como máximo 50 MB.", 413);
  }

  const isValidDocumentId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedDocumentId);
  if (!isValidDocumentId) return jsonError("La sesión de carga no tiene un identificador válido.", 400);
  const documentId = requestedDocumentId;
  const path = owner.user.id + "/" + documentId + ".pdf";

  const { data: existingDocument, error: existingDocumentError } = await supabaseAdmin
    .from("orby_knowledge_documents")
    .select("id")
    .eq("id", documentId)
    .eq("uploaded_by", owner.user.id)
    .maybeSingle();
  if (existingDocumentError) return jsonError("No se pudo comprobar si el documento ya existe.", 503);
  if (existingDocument) return jsonError("Este PDF ya fue registrado. Actualiza la biblioteca; no se duplicó.", 409);
  const configuredStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredStorageUrl) return jsonError("El almacenamiento de Orby no está configurado.", 503);
  let tusEndpoint: string;
  try {
    const projectUrl = new URL(configuredStorageUrl);
    if (projectUrl.protocol !== "https:" || !projectUrl.hostname.endsWith(".supabase.co")) {
      return jsonError("El endpoint privado de almacenamiento no es válido.", 503);
    }
    const projectRef = projectUrl.hostname.split(".")[0];
    // Signed TUS uploads must use Supabase Storage's dedicated /sign route.
    // The regular /upload/resumable route ignores x-signature and evaluates the
    // anonymous role against storage.objects RLS, causing HTTP 403.
    tusEndpoint = "https://" + projectRef + ".storage.supabase.co/storage/v1/upload/resumable/sign";
  } catch {
    return jsonError("No se pudo preparar el endpoint de carga.", 503);
  }
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true });

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
