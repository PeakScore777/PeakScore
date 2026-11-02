import "server-only";

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { OrbyKnowledgeChunk } from "@/lib/ai/orby-knowledge";

export const ORBY_KNOWLEDGE_PIPELINE_VERSION = 7;

export type OrbyKnowledgeJob = {
  id: string;
  document_id: string;
  pipeline_version: number;
  content_hash: string;
  stage: "embeddings" | "profile" | "finalize";
  status: "queued" | "running" | "retrying" | "completed" | "failed";
  total_batches: number;
  next_batch_index: number;
  embedded_chunk_count: number;
  attempt_count: number;
  max_attempts: number;
  locked_by: string | null;
  lease_expires_at: string | null;
};

export function hashOrbyKnowledgeChunks(chunks: OrbyKnowledgeChunk[]): string {
  const canonical = [...chunks]
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .map((chunk) => [
      String(chunk.chunk_index),
      String(chunk.page_number),
      chunk.content.length + ":" + chunk.content,
    ].join("|"))
    .join("\n");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function hashOrbyKnowledgeDocumentContent(chunks: OrbyKnowledgeChunk[], sourceSha256: string | null | undefined): string {
  const chunkHash = hashOrbyKnowledgeChunks(chunks);
  if (!sourceSha256) return chunkHash;
  return createHash("sha256")
    .update(sourceSha256, "utf8")
    .update("|", "utf8")
    .update(chunkHash, "utf8")
    .digest("hex");
}

export async function loadOrbyKnowledgeChunks(documentId: string): Promise<OrbyKnowledgeChunk[]> {
  const { data, error } = await supabaseAdmin
    .from("orby_knowledge_chunks")
    .select("chunk_index,page_number,content,content_origin")
    .eq("document_id", documentId)
    .order("page_number", { ascending: true })
    .order("chunk_index", { ascending: true })
    .limit(5000);
  if (error) throw new Error("No se pudieron leer los fragmentos: " + error.code);
  return (data ?? []) as OrbyKnowledgeChunk[];
}

export async function enqueueNextPendingOrbyKnowledgeDocument(): Promise<boolean> {
  const { data: documents, error } = await supabaseAdmin
    .from("orby_knowledge_documents")
    .select("id,knowledge_pipeline_version,knowledge_profile_status,knowledge_profile_version,embedded_chunk_count,chunk_count,page_count,source_sha256,ingestion_status,concept_count,coverage_percent")
    .in("status", ["draft", "published"])
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error("No se pudieron detectar documentos pendientes: " + error.code);

  for (const document of documents ?? []) {
    const stale = document.ingestion_status !== "completed"
      || Number(document.knowledge_pipeline_version ?? 0) < ORBY_KNOWLEDGE_PIPELINE_VERSION
      || document.knowledge_profile_status !== "ready"
      || Number(document.knowledge_profile_version ?? 0) < 2
      || Number(document.embedded_chunk_count ?? 0) < Number(document.chunk_count ?? 0)
      || Number(document.concept_count ?? 0) < 1
      || Number(document.coverage_percent ?? 0) < 95;
    if (!stale) continue;

    const chunks = await loadOrbyKnowledgeChunks(document.id);
    if (!chunks.length && Number(document.page_count ?? 0) < 1) continue;
    const result = await enqueueOrbyKnowledgeDocument(document.id, chunks);
    if (result.job.status === "failed" || result.alreadyCurrent) continue;
    return true;
  }
  return false;
}

export async function enqueueOrbyKnowledgeDocument(
  documentId: string,
  chunks: OrbyKnowledgeChunk[],
  options: { retryFailed?: boolean } = {}
): Promise<{ job: OrbyKnowledgeJob; created: boolean; alreadyCurrent: boolean }> {

  const { data: document, error: documentError } = await supabaseAdmin
    .from("orby_knowledge_documents")
    .select("id,knowledge_pipeline_version,knowledge_profile_status,knowledge_profile_version,embedded_chunk_count,chunk_count,page_count,source_sha256,ingestion_status,concept_count,coverage_percent")
    .eq("id", documentId)
    .maybeSingle();
  if (documentError || !document) throw new Error("No se encontró el documento para programar su actualización.");
  if (!chunks.length && Number(document.page_count ?? 0) < 1) {
    throw new Error("El documento no contiene páginas que Orby pueda analizar.");
  }
  const contentHash = hashOrbyKnowledgeDocumentContent(chunks, document.source_sha256);

  if (
    Number(document.knowledge_pipeline_version ?? 0) >= ORBY_KNOWLEDGE_PIPELINE_VERSION
    && document.knowledge_profile_status === "ready"
    && Number(document.knowledge_profile_version ?? 0) >= 2
    && Number(document.embedded_chunk_count ?? 0) >= Number(document.chunk_count ?? 0)
    && Number(document.concept_count ?? 0) > 0
    && Number(document.coverage_percent ?? 0) >= 95
    && document.ingestion_status === "completed"
  ) {
    // The document's current content/profile versions are authoritative. A
    // completed queue row is not required for documents promoted from the
    // already-validated v2 index during the v3 orchestration rollout.
    return {
      job: {
        id: "current:" + documentId,
        document_id: documentId,
        pipeline_version: ORBY_KNOWLEDGE_PIPELINE_VERSION,
        content_hash: contentHash,
        stage: "finalize",
        status: "completed",
        total_batches: Math.max(1, Math.ceil(Number(document.page_count ?? 0) / 4)),
        next_batch_index: Math.max(1, Math.ceil(Number(document.page_count ?? 0) / 4)),
        embedded_chunk_count: Number(document.embedded_chunk_count ?? 0),
        attempt_count: 0,
        max_attempts: 8,
        locked_by: null,
        lease_expires_at: null,
      } as OrbyKnowledgeJob,
      created: false,
      alreadyCurrent: true,
    };
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("orby_knowledge_jobs")
    .select("*")
    .eq("document_id", documentId)
    .eq("pipeline_version", ORBY_KNOWLEDGE_PIPELINE_VERSION)
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (existingError) throw new Error("No se pudo consultar la cola de Orby: " + existingError.code);

  if (existing) {
    if (existing.status === "failed" && options.retryFailed) {
      const { data: retried, error } = await supabaseAdmin
        .from("orby_knowledge_jobs")
        .update({
          status: "queued",
          stage: Number(document.embedded_chunk_count ?? 0) < chunks.length ? "embeddings" : "profile",
          total_batches: Math.max(1, Math.ceil(Number(document.page_count ?? 0) / 4)),
          attempt_count: 0,
          next_batch_index: 0,
          available_at: new Date().toISOString(),
          locked_by: null,
          locked_at: null,
          lease_expires_at: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error || !retried) throw new Error("No se pudo reprogramar la tarea fallida.");
      return { job: retried as OrbyKnowledgeJob, created: false, alreadyCurrent: false };
    }

    return { job: existing as OrbyKnowledgeJob, created: false, alreadyCurrent: existing.status === "completed" };
  }

  const totalBatches = Math.max(1, Math.ceil(Number(document.page_count ?? 0) / 4));
  const initialStage = chunks.length > 0 && Number(document.embedded_chunk_count ?? 0) < chunks.length
    ? "embeddings"
    : "profile";
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("orby_knowledge_jobs")
    .insert({
      document_id: documentId,
      pipeline_version: ORBY_KNOWLEDGE_PIPELINE_VERSION,
      content_hash: contentHash,
      stage: initialStage,
      status: "queued",
      total_batches: totalBatches,
      next_batch_index: 0,
      embedded_chunk_count: Number(document.embedded_chunk_count ?? 0),
      available_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced } = await supabaseAdmin
        .from("orby_knowledge_jobs")
        .select("*")
        .eq("document_id", documentId)
        .eq("pipeline_version", ORBY_KNOWLEDGE_PIPELINE_VERSION)
        .eq("content_hash", contentHash)
        .single();
      if (raced) return { job: raced as OrbyKnowledgeJob, created: false, alreadyCurrent: raced.status === "completed" };
    }
    throw new Error("No se pudo añadir el documento a la cola: " + insertError.code);
  }

  return { job: inserted as OrbyKnowledgeJob, created: true, alreadyCurrent: false };
}
