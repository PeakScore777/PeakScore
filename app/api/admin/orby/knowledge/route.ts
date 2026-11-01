import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractPdfPages } from "@/lib/pdf/extractPdfPages";
import { splitOrbyText } from "@/lib/pdf/split-orby-text";
import { enqueueOrbyKnowledgeDocument } from "@/lib/ai/orby-knowledge-queue";
import type { IcfesSubject } from "@/lib/ai/orby-scope";
import { isOrbyKnowledgePublicationReady } from "@/lib/ai/orby-publication";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUCKET = "orby-knowledge";
const MAX_PDF_BYTES = 50_000_000;
const MAX_CHUNKS = 2000;
const MAX_CHUNK_CHARS = 2100;

type KnowledgeSubject = IcfesSubject | "Preparación Saber 11";
type ChunkDraft = { subject: KnowledgeSubject; topic: string; page_number: number; chunk_index: number; content: string };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function removePrivateUpload(path: string) {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) console.warn("[Orby Knowledge] Could not clean rejected upload.", { code: error.name });
}

async function getAdmin() {
  const owner = await getOrbyOwner();
  return { user: owner?.user ?? null };
}


export async function GET() {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);
  const { data, error } = await supabaseAdmin.from("orby_knowledge_documents")
    .select("id,title,original_name,subject,topic,page_count,chunk_count,status,embedded_chunk_count,knowledge_profile_status,knowledge_profile_version,knowledge_pipeline_version,concept_count,ingestion_status,coverage_percent,visual_pages_total,visual_pages_reviewed,auto_review_count,next_review_at,created_at,updated_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) {
    console.error("[Orby Knowledge] List failed.", { code: error.code });
    return jsonError("No se pudo cargar la biblioteca de Orby.", 503);
  }
  return NextResponse.json({ documents: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);

  const body = await request.json().catch(() => null);
  const documentId = typeof body?.documentId === "string" ? body.documentId : "";
  const originalName = typeof body?.fileName === "string" ? body.fileName.trim() : "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId)) {
    return jsonError("Identificador de carga no válido.", 400);
  }
  if (!originalName || originalName.length > 180 || !originalName.toLowerCase().endsWith(".pdf")) {
    return jsonError("Nombre de PDF no válido.", 400);
  }

  const storagePath = user.id + "/" + documentId + ".pdf";
  const { data: existing } = await supabaseAdmin
    .from("orby_knowledge_documents")
    .select("id,title,status,chunk_count")
    .eq("id", documentId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      document: existing,
      message: "Este PDF ya fue registrado. No se duplicó la biblioteca.",
      alreadyFinalized: true,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: file, error: downloadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(storagePath);
  if (downloadError || !file) {
    return jsonError("No se encontró el PDF subido. Vuelve a cargarlo e inténtalo de nuevo.", 404);
  }
  if (file.size < 8 || file.size > MAX_PDF_BYTES) {
    await removePrivateUpload(storagePath);
    return jsonError("El PDF debe pesar como máximo 50 MB.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return jsonError("El archivo no tiene una cabecera PDF válida.", 415);
  }

  const subject: KnowledgeSubject = "Preparación Saber 11";
  const title = originalName
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "Material general de estudio";
  const topic = "Material general de preparación Saber 11";

  let extracted: Awaited<ReturnType<typeof extractPdfPages>>;
  try {
    extracted = await extractPdfPages(buffer);
  } catch (error) {
    console.error("[Orby Knowledge] PDF extraction failed.", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message.slice(0, 250) : "unknown",
    });
    await removePrivateUpload(storagePath);
    return jsonError("No se pudo leer este PDF. Comprueba que no esté dañado o protegido.", 422);
  }
  if (extracted.totalPages < 1 || extracted.totalPages > 1000) {
    await removePrivateUpload(storagePath);
    return jsonError("Orby admite documentos de 1 a 1.000 páginas.", 413);
  }

  const drafts: Omit<ChunkDraft, "chunk_index">[] = [];
  for (const page of extracted.pages) {
    for (const content of splitOrbyText(page.text, MAX_CHUNK_CHARS)) {
      if (content.length >= 40) drafts.push({ subject, topic, page_number: page.pageNumber, content });
      if (drafts.length > MAX_CHUNKS) {
        await removePrivateUpload(storagePath);
        return jsonError("El documento supera el máximo seguro de 2.000 fragmentos. Divide el material en archivos más pequeños.", 413);
      }
    }
  }
  const sourceSha256 = createHash("sha256").update(buffer).digest("hex");
  const pageRows = extracted.pages.map((page) => ({
    document_id: documentId,
    page_number: page.pageNumber,
    text_char_count: page.text.length,
    page_text: page.text,
    has_selectable_text: page.text.trim().length >= 40,
    visual_status: "pending",
    coverage_score: 0,
    review_attempts: 0,
  }));

  const { data: document, error: documentError } = await supabaseAdmin.from("orby_knowledge_documents").insert({
    id: documentId,
    uploaded_by: user.id,
    title,
    original_name: originalName.slice(0, 180),
    subject,
    topic,
    storage_path: storagePath,
    source_sha256: sourceSha256,
    page_count: extracted.totalPages,
    chunk_count: drafts.length,
    status: "draft",
    ingestion_status: "queued",
    visual_pages_total: extracted.totalPages,
    visual_pages_reviewed: 0,
    coverage_percent: 0,
  }).select("id,title,subject,topic,page_count,chunk_count,status,created_at,ingestion_status,coverage_percent").single();

  if (documentError || !document) {
    console.error("[Orby Knowledge] Document record failed.", { code: documentError?.code });
    await removePrivateUpload(storagePath);
    return jsonError("No se pudo registrar el documento en la biblioteca.", 503);
  }

  const { error: pageError } = await supabaseAdmin
    .from("orby_knowledge_document_pages")
    .insert(pageRows);
  if (pageError) {
    await supabaseAdmin.from("orby_knowledge_documents").delete().eq("id", documentId);
    await removePrivateUpload(storagePath);
    console.error("[Orby Knowledge] Page manifest failed.", { code: pageError.code });
    return jsonError("No se pudo registrar la cobertura de páginas del documento.", 503);
  }

  const chunks = drafts.map((item, chunk_index) => ({
    ...item,
    document_id: documentId,
    chunk_index,
    content_origin: "text" as const,
  }));
  if (chunks.length) {
    const { error: chunkError } = await supabaseAdmin.from("orby_knowledge_chunks").insert(chunks);
    if (chunkError) {
      await supabaseAdmin.from("orby_knowledge_documents").delete().eq("id", documentId);
      await removePrivateUpload(storagePath);
      console.error("[Orby Knowledge] Chunk indexing failed.", { code: chunkError.code });
      return jsonError("No se pudo indexar el texto del PDF. El documento no se publicó.", 503);
    }
  }

  let enrichmentMessage = "PDF recibido: " + extracted.totalPages + " páginas, "
    + drafts.length + " fragmentos de texto y "
    + (extracted.totalPages - extracted.pages.filter((page) => page.text.trim().length >= 40).length)
    + " páginas que requieren lectura visual/OCR. ";
  try {
    const queued = await enqueueOrbyKnowledgeDocument(
      documentId,
      chunks.map((chunk) => ({
        chunk_index: chunk.chunk_index,
        page_number: chunk.page_number,
        content: chunk.content,
      }))
    );
    enrichmentMessage += queued.alreadyCurrent
      ? "El conocimiento ya está completo."
      : "Orby inició la lectura integral: texto, páginas visuales, conceptos, preguntas, métodos de solución y rutas de estudio. No necesitas encolar el documento manualmente.";
  } catch (queueError) {
    console.error("[Orby Knowledge] Could not enqueue uploaded document.", {
      name: queueError instanceof Error ? queueError.name : "UnknownError",
    });
    enrichmentMessage += "El PDF quedó guardado, pero no se pudo programar el aprendizaje automático. Revisa el estado del motor.";
  }

  return NextResponse.json({ document, message: enrichmentMessage }, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: Request) {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);
  const body = await request.json().catch(() => null);
  const id = body && typeof body.id === "string" ? body.id : "";
  const status = body?.status;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !["published","archived","draft"].includes(status)) {
    return jsonError("La solicitud de publicación no es válida.", 400);
  }
  const { data: existing, error: lookupError } = await supabaseAdmin.from("orby_knowledge_documents")
    .select("id,chunk_count,embedded_chunk_count,knowledge_profile_status,knowledge_profile_version,knowledge_pipeline_version,concept_count,ingestion_status,coverage_percent,visual_pages_total,visual_pages_reviewed").eq("id", id).maybeSingle();
  if (lookupError || !existing) return jsonError("No se encontró el documento.", 404);
  if (status === "published" && !isOrbyKnowledgePublicationReady(existing)) {
    return jsonError("No se puede publicar todavía. Completa la lectura multimodal v4, todos los embeddings, el perfil pedagógico, al menos un concepto y un 95% de cobertura visual antes de publicar el material para estudiantes.", 409);
  }
  const { data, error } = await supabaseAdmin.from("orby_knowledge_documents").update({
    status, updated_at: new Date().toISOString(),
  }).eq("id", id).select("id,status,updated_at").single();
  if (error) return jsonError("No se pudo cambiar el estado del documento.", 503);
  return NextResponse.json({ document: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);
  const body = await request.json().catch(() => null);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return jsonError("Documento no válido.", 400);
  const { data: document, error: lookupError } = await supabaseAdmin.from("orby_knowledge_documents")
    .select("storage_path").eq("id", id).maybeSingle();
  if (lookupError || !document) return jsonError("No se encontró el documento.", 404);
  if (document.storage_path) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([document.storage_path]);
    if (removeError) return jsonError("No se pudo eliminar el archivo privado.", 503);
  }
  const { error } = await supabaseAdmin.from("orby_knowledge_documents").delete().eq("id", id);
  if (error) return jsonError("No se pudo eliminar el documento.", 503);
  return NextResponse.json({ deleted: true });
}
