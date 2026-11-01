import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  combineOrbyKnowledgeProfileBatches,
  createOrbyEmbeddings,
  generateOrbyKnowledgeProfileBatch,
  saveOrbyKnowledgeProfile,
  type OrbyKnowledgeBatchProfile,
  type OrbyKnowledgeChunk,
} from "@/lib/ai/orby-knowledge";
import { extractOrbyChecklistRows } from "@/lib/pdf/extract-orby-checklist-rows";
import {
  hashOrbyKnowledgeChunks,
  loadOrbyKnowledgeChunks,
  type OrbyKnowledgeJob,
} from "@/lib/ai/orby-knowledge-queue";

const EMBEDDING_BATCH_SIZE = 16;

function hashBatch(chunks: OrbyKnowledgeChunk[]): string {
  const canonical = [...chunks]
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .map((chunk) => chunk.chunk_index + "|" + chunk.page_number + "|" + chunk.content.length + ":" + chunk.content)
    .join("\n");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

async function releaseJob(
  job: OrbyKnowledgeJob,
  workerId: string,
  values: {
    stage: OrbyKnowledgeJob["stage"];
    nextBatchIndex: number;
    embeddedChunkCount: number;
    totalBatches: number;
  }
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("orby_release_knowledge_job", {
    p_job_id: job.id,
    p_worker_id: workerId,
    p_stage: values.stage,
    p_next_batch_index: values.nextBatchIndex,
    p_embedded_chunk_count: values.embeddedChunkCount,
    p_total_batches: values.totalBatches,
  });
  if (error) throw new Error("No se pudo liberar la tarea: " + error.code);
}

export async function processNextOrbyKnowledgeJob(): Promise<{
  state: "idle" | "progress" | "completed" | "failed";
  jobId?: string;
  documentId?: string;
  documentTitle?: string;
  stage?: string;
  progress?: number;
  message?: string;
}> {
  const workerId = randomUUID();
  const { data: claimed, error: claimError } = await supabaseAdmin.rpc("orby_claim_knowledge_job", {
    p_worker_id: workerId,
    p_lease_seconds: 600,
  });
  if (claimError) throw new Error("No se pudo reclamar una tarea: " + claimError.code);
  if (!claimed || typeof claimed !== "object") return { state: "idle", message: "No hay tareas pendientes." };

  const job = claimed as unknown as OrbyKnowledgeJob;
  try {
    const [chunks, documentResult] = await Promise.all([
      loadOrbyKnowledgeChunks(job.document_id),
      supabaseAdmin.from("orby_knowledge_documents")
        .select("title")
        .eq("id", job.document_id)
        .single(),
    ]);
    if (!chunks.length) throw new Error("El documento ya no contiene fragmentos.");
    if (documentResult.error || !documentResult.data) throw new Error("No se encontró el documento de la tarea.");
    const documentTitle = documentResult.data.title as string;

    const currentHash = hashOrbyKnowledgeChunks(chunks);
    if (currentHash !== job.content_hash) {
      throw new Error("El contenido del documento cambió mientras se procesaba. Se requiere crear una nueva tarea.");
    }

    const totalBatches = Math.ceil(chunks.length / 2);

    if (job.stage === "embeddings") {
      const { data: missing, error: missingError } = await supabaseAdmin
        .from("orby_knowledge_chunks")
        .select("chunk_index")
        .eq("document_id", job.document_id)
        .is("embedding", null)
        .order("chunk_index", { ascending: true })
        .limit(EMBEDDING_BATCH_SIZE);
      if (missingError) throw new Error("No se pudieron consultar vectores pendientes: " + missingError.code);

      if (missing?.length) {
        const indexes = missing.map((item) => item.chunk_index);
        const batch = chunks.filter((chunk) => indexes.includes(chunk.chunk_index));
        await createOrbyEmbeddings(job.document_id, documentTitle, batch);
      }

      const [{ count: embeddedCount, error: countError }, { count: missingCount, error: pendingError }] = await Promise.all([
        supabaseAdmin.from("orby_knowledge_chunks")
          .select("chunk_index", { count: "exact", head: true })
          .eq("document_id", job.document_id)
          .not("embedding", "is", null),
        supabaseAdmin.from("orby_knowledge_chunks")
          .select("chunk_index", { count: "exact", head: true })
          .eq("document_id", job.document_id)
          .is("embedding", null),
      ]);
      if (countError || pendingError) throw new Error("No se pudo comprobar el avance de los embeddings.");
      const embedded = Number(embeddedCount ?? 0);
      const remaining = Number(missingCount ?? 0);

      const { error: updateError } = await supabaseAdmin
        .from("orby_knowledge_documents")
        .update({ embedded_chunk_count: embedded, updated_at: new Date().toISOString() })
        .eq("id", job.document_id);
      if (updateError) throw new Error("No se pudo actualizar el contador de embeddings.");

      const nextStage = remaining > 0 ? "embeddings" : "profile";
      await releaseJob(job, workerId, {
        stage: nextStage,
        nextBatchIndex: 0,
        embeddedChunkCount: embedded,
        totalBatches,
      });
      return {
        state: "progress",
        jobId: job.id,
        documentId: job.document_id,
        documentTitle,
        stage: nextStage,
        progress: embedded,
        message: remaining > 0
          ? documentTitle + ": " + embedded + "/" + chunks.length + " embeddings listos; quedan " + remaining + " fragmentos."
          : documentTitle + ": " + embedded + "/" + chunks.length + " embeddings listos. Comienza el perfilado académico.",
      };
    }

    if (job.stage === "profile") {
      if (job.next_batch_index >= totalBatches) {
        await releaseJob(job, workerId, {
          stage: "finalize",
          nextBatchIndex: totalBatches,
          embeddedChunkCount: job.embedded_chunk_count,
          totalBatches,
        });
        return { state: "progress", jobId: job.id, documentId: job.document_id, documentTitle, stage: "finalize", message: documentTitle + ": todos los lotes académicos están listos; falta consolidar el perfil." };
      }

      const batchIndex = job.next_batch_index;
      const batch = chunks.slice(batchIndex * 2, batchIndex * 2 + 2);
      if (!batch.length) throw new Error("El lote solicitado no contiene fragmentos.");
      const inputHash = hashBatch(batch);
      const { data: storedBatch, error: batchReadError } = await supabaseAdmin
        .from("orby_knowledge_job_batches")
        .select("input_hash,result")
        .eq("job_id", job.id)
        .eq("batch_index", batchIndex)
        .maybeSingle();
      if (batchReadError) throw new Error("No se pudo consultar el resultado del lote.");

      if (!storedBatch || storedBatch.input_hash !== inputHash) {
        const checklistRows = extractOrbyChecklistRows(chunks);
        const result = await generateOrbyKnowledgeProfileBatch(batch, batchIndex, totalBatches, checklistRows);
        const { error: saveBatchError } = await supabaseAdmin
          .from("orby_knowledge_job_batches")
          .upsert({
            job_id: job.id,
            batch_index: batchIndex,
            input_hash: inputHash,
            result,
          }, { onConflict: "job_id,batch_index" });
        if (saveBatchError) throw new Error("No se pudo guardar el resultado del lote: " + saveBatchError.code);
      }

      const nextIndex = batchIndex + 1;
      const nextStage = nextIndex >= totalBatches ? "finalize" : "profile";
      await releaseJob(job, workerId, {
        stage: nextStage,
        nextBatchIndex: nextIndex,
        embeddedChunkCount: job.embedded_chunk_count,
        totalBatches,
      });
      return {
        state: "progress",
        jobId: job.id,
        documentId: job.document_id,
        documentTitle,
        stage: nextStage,
        progress: nextIndex,
        message: documentTitle + ": lote académico " + nextIndex + "/" + totalBatches + " guardado.",
      };
    }

    if (job.stage === "finalize") {
      const { data: batches, error: batchesError } = await supabaseAdmin
        .from("orby_knowledge_job_batches")
        .select("batch_index,input_hash,result")
        .eq("job_id", job.id)
        .order("batch_index", { ascending: true });
      if (batchesError) throw new Error("No se pudieron recuperar los lotes del perfil.");
      if (!batches || batches.length !== totalBatches || batches.some((item, index) => item.batch_index !== index)) {
        throw new Error("El perfil todavía no tiene todos los lotes en orden: " + (batches?.length ?? 0) + "/" + totalBatches + ".");
      }

      const profile = combineOrbyKnowledgeProfileBatches(
        batches.map((item) => item.result as unknown as OrbyKnowledgeBatchProfile)
      );
      const concepts = await saveOrbyKnowledgeProfile(job.document_id, profile);
      const { error: documentUpdateError } = await supabaseAdmin
        .from("orby_knowledge_documents")
        .update({
          knowledge_pipeline_version: job.pipeline_version,
          embedded_chunk_count: chunks.length,
          concept_count: concepts,
          knowledge_profile_status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.document_id);
      if (documentUpdateError) throw new Error("Se guardó el perfil, pero no se pudo marcar el motor actualizado.");

      const { error: completeError } = await supabaseAdmin.rpc("orby_complete_knowledge_job", {
        p_job_id: job.id,
        p_worker_id: workerId,
      });
      if (completeError) throw new Error("No se pudo cerrar la tarea: " + completeError.code);

      return {
        state: "completed",
        jobId: job.id,
        documentId: job.document_id,
        documentTitle,
        stage: "completed",
        progress: concepts,
        message: documentTitle + ": perfil actualizado y validado con " + concepts + " conceptos.",
      };
    }

    throw new Error("Etapa de procesamiento desconocida.");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Error desconocido.";
    const { error: failError } = await supabaseAdmin.rpc("orby_fail_knowledge_job", {
      p_job_id: job.id,
      p_worker_id: workerId,
      p_error: reason,
    });
    if (failError) {
      console.error("[Orby Autopilot] Could not release failed job.", { jobId: job.id, code: failError.code });
    }
    console.error("[Orby Autopilot] Job batch failed.", { jobId: job.id, stage: job.stage, reason });
    return {
      state: "failed",
      jobId: job.id,
      documentId: job.document_id,
      documentTitle,
      stage: job.stage,
      message: documentTitle + ": " + reason.slice(0, 450),
    };
  }
}
