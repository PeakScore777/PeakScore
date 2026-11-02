import "server-only";
import { isOrbyKnowledgePublicationReady, shouldAutomaticallyPublishOrbyKnowledge } from "@/lib/ai/orby-publication";

import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  combineOrbyKnowledgePageBatches,
  createOrbyEmbeddings,
  generateOrbyKnowledgePageBatch,
  saveOrbyKnowledgeProfile,
  type OrbyKnowledgeChunk,
  type OrbyKnowledgePageBatchProfile,
  type OrbyKnowledgePageInput,
  type OrbyPedagogicalKnowledge,
} from "@/lib/ai/orby-knowledge";
import {
  hashOrbyKnowledgeDocumentContent,
  loadOrbyKnowledgeChunks,
  type OrbyKnowledgeJob,
} from "@/lib/ai/orby-knowledge-queue";
import { ensureOrbyGeminiDocumentFile, deleteOrbyGeminiDocumentFile } from "@/lib/ai/orby-gemini-file";
import { splitOrbyText } from "@/lib/pdf/split-orby-text";

const EMBEDDING_BATCH_SIZE = 16;
const PAGE_BATCH_SIZE = 4;
const MAX_PAGE_REVIEWS = 10;
const REVIEW_THRESHOLD = 0.85;

function hashPageBatch(
  pages: OrbyKnowledgePageInput[],
  sourceSha256: string,
  contextPages: OrbyKnowledgePageInput[] = []
): string {
  return createHash("sha256")
    .update(sourceSha256, "utf8")
    .update(JSON.stringify({
      context_pages: contextPages.map((page) => ({
        page_number: page.page_number,
        page_text: page.page_text,
      })),
      pages: pages.map((page) => ({
        page_number: page.page_number,
        page_text: page.page_text,
        has_selectable_text: page.has_selectable_text,
        review_attempts: page.review_attempts,
      })),
    }), "utf8")
    .digest("hex");
}

function numberList(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number" && Number.isInteger(item) && item > 0)
    : [];
}

function makePageArtifacts(
  pedagogical: OrbyPedagogicalKnowledge,
  pageNumber: number
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, values] of Object.entries(pedagogical)) {
    output[key] = values.filter((item) => numberList(item.evidence_pages).includes(pageNumber));
  }
  return output;
}

function makePageSearchContent(
  pageNumber: number,
  visualSummary: string,
  pageConcepts: string[],
  pagePatterns: string[]
): string {
  return [
    "Representación visual académica de la página " + pageNumber + ".",
    visualSummary.trim(),
    pageConcepts.length ? "Conceptos identificados: " + pageConcepts.join("; ") + "." : "",
    pagePatterns.length ? "Patrones abstractos de pregunta: " + pagePatterns.join("; ") + "." : "",
  ].filter(Boolean).join("\n").slice(0, 2100);
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
  if (error) throw new Error("No se pudo liberar la tarea de Orby: " + error.code);
}

async function refreshDocumentContentHash(
  job: OrbyKnowledgeJob,
  workerId: string,
  sourceSha256: string,
  chunks: OrbyKnowledgeChunk[]
): Promise<string> {
  const contentHash = hashOrbyKnowledgeDocumentContent(chunks, sourceSha256);
  const { error } = await supabaseAdmin
    .from("orby_knowledge_jobs")
    .update({ content_hash: contentHash, updated_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("locked_by", workerId)
    .eq("status", "running");
  if (error) throw new Error("No se pudo actualizar la huella del contenido aprendido.");
  return contentHash;
}

async function getChunkCounts(documentId: string): Promise<{ total: number; embedded: number; missing: number }> {
  const [total, embedded, missing] = await Promise.all([
    supabaseAdmin.from("orby_knowledge_chunks").select("id", { count: "exact", head: true }).eq("document_id", documentId),
    supabaseAdmin.from("orby_knowledge_chunks").select("id", { count: "exact", head: true }).eq("document_id", documentId).not("embedding", "is", null),
    supabaseAdmin.from("orby_knowledge_chunks").select("id", { count: "exact", head: true }).eq("document_id", documentId).is("embedding", null),
  ]);
  if (total.error || embedded.error || missing.error) throw new Error("No se pudo consultar la cobertura semántica del documento.");
  return {
    total: total.count ?? 0,
    embedded: embedded.count ?? 0,
    missing: missing.count ?? 0,
  };
}

async function upsertDerivedPageChunks(
  documentId: string,
  pageResult: { page_number: number; ocr_text: string; visual_summary: string },
  documentChunks: OrbyKnowledgeChunk[],
  concepts: Array<{ name: string; evidence_pages: number[] }>,
  patterns: Array<{ archetype: string; evidence_pages: number[] }>
): Promise<OrbyKnowledgeChunk[]> {
  const pageNumber = pageResult.page_number;
  const pageConcepts = concepts.filter((item) => item.evidence_pages.includes(pageNumber)).map((item) => item.name);
  const pagePatterns = patterns.filter((item) => item.evidence_pages.includes(pageNumber)).map((item) => item.archetype);
  const drafts: Array<{ content: string; content_origin: "ocr" | "visual" }> = [];

  for (const content of splitOrbyText(pageResult.ocr_text, 2000)) {
    if (content.trim().length >= 40) drafts.push({ content, content_origin: "ocr" });
  }

  const visualContent = makePageSearchContent(pageNumber, pageResult.visual_summary, pageConcepts, pagePatterns);
  if (visualContent.length >= 80) drafts.push({ content: visualContent, content_origin: "visual" });

  const { error: deleteError } = await supabaseAdmin
    .from("orby_knowledge_chunks")
    .delete()
    .eq("document_id", documentId)
    .eq("page_number", pageNumber)
    .in("content_origin", ["ocr", "visual"]);
  if (deleteError) throw new Error("No se pudo reemplazar la representación visual anterior de la página " + pageNumber + ".");

  if (!drafts.length) {
    return documentChunks.filter((chunk) =>
      !(chunk.page_number === pageNumber && (chunk.content_origin === "ocr" || chunk.content_origin === "visual"))
    );
  }

  const maxIndex = documentChunks.reduce((max, chunk) => Math.max(max, chunk.chunk_index), -1);
  const inserts = drafts.map((draft, index) => ({
    document_id: documentId,
    page_number: pageNumber,
    subject: "Preparación Saber 11",
    topic: "Lectura multimodal de página",
    chunk_index: maxIndex + index + 1,
    content: draft.content,
    content_origin: draft.content_origin,
  }));
  const { error: insertError } = await supabaseAdmin.from("orby_knowledge_chunks").insert(inserts);
  if (insertError) throw new Error("No se pudo guardar el texto visual de la página " + pageNumber + ": " + insertError.code);

  const retained = documentChunks.filter((chunk) =>
    !(chunk.page_number === pageNumber && (chunk.content_origin === "ocr" || chunk.content_origin === "visual"))
  );
  return [
    ...retained,
    ...inserts.map((item) => ({
      chunk_index: item.chunk_index,
      page_number: item.page_number,
      content: item.content,
      content_origin: item.content_origin,
    })),
  ].sort((a, b) => a.chunk_index - b.chunk_index);
}

export async function processNextOrbyKnowledgeJob(options: {
  origin: "automatic" | "manual";
}): Promise<{
  state: "idle" | "progress" | "completed" | "failed";
  jobId?: string;
  documentId?: string;
  documentTitle?: string;
  stage?: string;
  progress?: number;
  message?: string;
}> {
  const workerId = randomUUID();
  const countsTowardAutomaticBudget = options.origin === "automatic";
  const { data: claimed, error: claimError } = await supabaseAdmin.rpc("orby_claim_knowledge_job", {
    p_worker_id: workerId,
    p_lease_seconds: 600,
    p_count_toward_auto_budget: countsTowardAutomaticBudget,
  });
  if (claimError) throw new Error("No se pudo reclamar una tarea: " + claimError.code);
  if (!claimed || typeof claimed !== "object") {
    return {
      state: "idle",
      message: countsTowardAutomaticBudget
        ? "No hay tareas disponibles o se alcanzó el límite de 100 ciclos automáticos de la ventana móvil de 7 horas."
        : "No hay tareas manuales disponibles para procesar.",
    };
  }

  const job = claimed as unknown as OrbyKnowledgeJob;
  let documentTitle = job.document_id;
  let cachedGeminiFileName: string | null = null;

  try {
    const [chunks, documentResult] = await Promise.all([
      loadOrbyKnowledgeChunks(job.document_id),
      supabaseAdmin.from("orby_knowledge_documents")
        .select("id,title,status,storage_path,page_count,visual_pages_total,source_sha256,embedded_chunk_count,chunk_count,ingestion_status,gemini_file_name")
        .eq("id", job.document_id)
        .single(),
    ]);
    if (documentResult.error || !documentResult.data) throw new Error("No se encontró el documento de la tarea.");
    const document = documentResult.data;
    documentTitle = document.title as string;
    const totalBatches = Math.max(1, Math.ceil(Number(document.page_count ?? 0) / PAGE_BATCH_SIZE));
    const currentHash = hashOrbyKnowledgeDocumentContent(chunks, document.source_sha256);
    if (currentHash !== job.content_hash) {
      throw new Error("El PDF o sus fragmentos cambiaron durante el aprendizaje. Se requiere crear una nueva tarea.");
    }

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
        if (!batch.length) throw new Error("Los fragmentos pendientes de embedding no están disponibles.");
        await createOrbyEmbeddings(job.document_id, documentTitle, batch);
      }

      const counts = await getChunkCounts(job.document_id);
      const nextStage = counts.missing > 0
        ? "embeddings"
        : job.next_batch_index >= totalBatches ? "finalize" : "profile";
      const { error: countUpdateError } = await supabaseAdmin.from("orby_knowledge_documents")
        .update({
          embedded_chunk_count: counts.embedded,
          chunk_count: counts.total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.document_id);
      if (countUpdateError) throw new Error("No se pudo actualizar el contador de embeddings.");

      await releaseJob(job, workerId, {
        stage: nextStage,
        nextBatchIndex: job.next_batch_index >= totalBatches ? totalBatches : 0,
        embeddedChunkCount: counts.embedded,
        totalBatches,
      });

      return {
        state: "progress",
        jobId: job.id,
        documentId: job.document_id,
        documentTitle,
        stage: nextStage,
        progress: counts.embedded,
        message: counts.missing > 0
          ? documentTitle + ": " + counts.embedded + "/" + counts.total + " vectores listos; quedan " + counts.missing + "."
          : documentTitle + ": embeddings completos; continúa la lectura visual y el perfilado académico.",
      };
    }

    if (job.stage === "profile") {
      const reviewOnly = job.next_batch_index > totalBatches;
      const batchIndex = reviewOnly ? job.next_batch_index - totalBatches - 1 : job.next_batch_index;
      if (!reviewOnly && batchIndex >= totalBatches) {
        await releaseJob(job, workerId, {
          stage: "finalize",
          nextBatchIndex: totalBatches,
          embeddedChunkCount: job.embedded_chunk_count,
          totalBatches,
        });
        return { state: "progress", jobId: job.id, documentId: job.document_id, documentTitle, stage: "finalize", message: documentTitle + ": terminó la primera lectura de páginas; verificando cobertura." };
      }
      if (batchIndex < 0 || batchIndex >= totalBatches) throw new Error("Índice de lote visual inválido.");

      const pageStart = batchIndex * PAGE_BATCH_SIZE + 1;
      const pageEnd = Math.min(Number(document.page_count), pageStart + PAGE_BATCH_SIZE - 1);
      const { data: storedPages, error: pagesError } = await supabaseAdmin
        .from("orby_knowledge_document_pages")
        .select("page_number,page_text,has_selectable_text,review_attempts,visual_status,coverage_score,unresolved_items")
        .eq("document_id", job.document_id)
        .gte("page_number", pageStart)
        .lte("page_number", pageEnd)
        .order("page_number", { ascending: true });
      if (pagesError) throw new Error("No se pudo recuperar el manifiesto de páginas.");
      let pageRows = storedPages ?? [];
      if (reviewOnly) {
        pageRows = pageRows.filter((page) => {
          const unresolved = Array.isArray(page.unresolved_items) ? page.unresolved_items.length > 0 : false;
          return Number(page.review_attempts ?? 0) < MAX_PAGE_REVIEWS
            && (page.visual_status !== "reviewed" || Number(page.coverage_score ?? 0) < REVIEW_THRESHOLD || unresolved);
        });
      }
      if (!pageRows.length) {
        await releaseJob(job, workerId, {
          stage: "finalize",
          nextBatchIndex: totalBatches,
          embeddedChunkCount: job.embedded_chunk_count,
          totalBatches,
        });
        return { state: "progress", jobId: job.id, documentId: job.document_id, documentTitle, stage: "finalize", message: documentTitle + ": no quedan páginas que revisar en ese lote." };
      }

      const file = await ensureOrbyGeminiDocumentFile(job.document_id, document.storage_path as string);
      cachedGeminiFileName = file.name;
      const pageInputs: OrbyKnowledgePageInput[] = pageRows.map((page) => ({
        page_number: page.page_number,
        page_text: typeof page.page_text === "string" ? page.page_text : "",
        has_selectable_text: Boolean(page.has_selectable_text),
        review_attempts: Number(page.review_attempts ?? 0),
      }));
      const firstInputPage = pageInputs[0]?.page_number ?? pageStart;
      const contextStart = Math.max(1, firstInputPage - PAGE_BATCH_SIZE);
      const { data: contextRows, error: contextError } = await supabaseAdmin
        .from("orby_knowledge_document_pages")
        .select("page_number,page_text,has_selectable_text,review_attempts")
        .eq("document_id", job.document_id)
        .gte("page_number", contextStart)
        .lt("page_number", firstInputPage)
        .order("page_number", { ascending: true });
      if (contextError) throw new Error("No se pudo recuperar el contexto de continuidad de las páginas anteriores.");
      const contextInputs: OrbyKnowledgePageInput[] = (contextRows ?? []).map((page) => ({
        page_number: page.page_number,
        page_text: typeof page.page_text === "string" ? page.page_text : "",
        has_selectable_text: Boolean(page.has_selectable_text),
        review_attempts: Number(page.review_attempts ?? 0),
      }));
      const result = await generateOrbyKnowledgePageBatch(
        file.uri,
        pageInputs,
        batchIndex,
        totalBatches,
        contextInputs
      );

      const inputHash = hashPageBatch(pageInputs, document.source_sha256 ?? "", contextInputs);
      const { data: previousBatch, error: previousBatchError } = await supabaseAdmin
        .from("orby_knowledge_job_batches")
        .select("result")
        .eq("job_id", job.id)
        .eq("batch_index", batchIndex)
        .maybeSingle();
      if (previousBatchError) throw new Error("No se pudo recuperar la memoria parcial del lote.");
      let mergedBatch = result;
      if (previousBatch?.result && typeof previousBatch.result === "object") {
        mergedBatch = combineOrbyKnowledgePageBatches([
          previousBatch.result as unknown as OrbyKnowledgePageBatchProfile,
          result,
        ]);
      }

      for (const pageResult of result.page_results) {
        const originalPage = pageRows.find((page) => page.page_number === pageResult.page_number);
        if (!originalPage) continue;
        const attempts = Number(originalPage.review_attempts ?? 0) + 1;
        const unresolved = pageResult.unresolved_items;
        const reviewed = pageResult.coverage_score >= REVIEW_THRESHOLD && unresolved.length === 0;
        const { error: pageUpdateError } = await supabaseAdmin
          .from("orby_knowledge_document_pages")
          .update({
            ocr_text: pageResult.ocr_text,
            visual_summary: pageResult.visual_summary,
            coverage_score: pageResult.coverage_score,
            unresolved_items: unresolved,
            visual_status: reviewed ? "reviewed" : "needs_review",
            review_attempts: attempts,
            concept_count: result.concepts.filter((concept) => concept.evidence_pages.includes(pageResult.page_number)).length,
            question_pattern_count: result.pedagogical_knowledge.question_patterns.filter((pattern) =>
              numberList(pattern.evidence_pages).includes(pageResult.page_number)
            ).length,
            pedagogical_artifacts: makePageArtifacts(result.pedagogical_knowledge, pageResult.page_number),
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("document_id", job.document_id)
          .eq("page_number", pageResult.page_number);
        if (pageUpdateError) throw new Error("No se pudo guardar la revisión visual de la página " + pageResult.page_number + ".");

        chunks.splice(0, chunks.length, ...await upsertDerivedPageChunks(
          job.document_id,
          pageResult,
          chunks,
          result.concepts,
          result.pedagogical_knowledge.question_patterns as Array<{ archetype: string; evidence_pages: number[] }>
        ));
      }

      const counts = await getChunkCounts(job.document_id);
      const { count: reviewedCount, error: reviewedError } = await supabaseAdmin
        .from("orby_knowledge_document_pages")
        .select("page_number", { count: "exact", head: true })
        .eq("document_id", job.document_id)
        .eq("visual_status", "reviewed");
      if (reviewedError) throw new Error("No se pudo calcular la cobertura visual del documento.");
      const coveragePercent = Number(document.page_count) > 0
        ? Number(((Number(reviewedCount ?? 0) / Number(document.page_count)) * 100).toFixed(2))
        : 0;
      const { error: docUpdateError } = await supabaseAdmin.from("orby_knowledge_documents")
        .update({
          chunk_count: counts.total,
          embedded_chunk_count: counts.embedded,
          visual_pages_reviewed: reviewedCount ?? 0,
          coverage_percent: coveragePercent,
          ingestion_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.document_id);
      if (docUpdateError) throw new Error("No se pudo actualizar la cobertura de aprendizaje del documento.");

      await supabaseAdmin.from("orby_knowledge_job_batches")
        .upsert({
          job_id: job.id,
          batch_index: batchIndex,
          input_hash: inputHash,
          result: mergedBatch,
        }, { onConflict: "job_id,batch_index" });

      const updatedChunks = await loadOrbyKnowledgeChunks(job.document_id);
      await refreshDocumentContentHash(job, workerId, document.source_sha256 ?? "", updatedChunks);

      const nextStage = reviewOnly
        ? counts.missing > 0 ? "embeddings" : "finalize"
        : batchIndex + 1 >= totalBatches
          ? counts.missing > 0 ? "embeddings" : "finalize"
          : "profile";
      const nextIndex = reviewOnly || batchIndex + 1 >= totalBatches
        ? totalBatches
        : batchIndex + 1;
      await releaseJob(job, workerId, {
        stage: nextStage,
        nextBatchIndex: nextIndex,
        embeddedChunkCount: counts.embedded,
        totalBatches,
      });

      return {
        state: "progress",
        jobId: job.id,
        documentId: job.document_id,
        documentTitle,
        stage: nextStage,
        progress: batchIndex + 1,
        message: reviewOnly
          ? documentTitle + ": relectura de páginas " + pageStart + "–" + pageEnd + " guardada; cobertura " + coveragePercent + "%."
          : documentTitle + ": páginas " + pageStart + "–" + pageEnd + " analizadas; cobertura " + coveragePercent + "%.",
      };
    }

    if (job.stage === "finalize") {
      const { data: allPages, error: allPagesError } = await supabaseAdmin
        .from("orby_knowledge_document_pages")
        .select("page_number,page_text,visual_status,coverage_score,unresolved_items,review_attempts")
        .eq("document_id", job.document_id)
        .order("page_number", { ascending: true });
      if (allPagesError) throw new Error("No se pudo comprobar la cobertura completa por página.");
      const weakPages = (allPages ?? []).filter((page) => {
        const unresolved = Array.isArray(page.unresolved_items) ? page.unresolved_items.length > 0 : false;
        return Number(page.review_attempts ?? 0) < MAX_PAGE_REVIEWS
          && (page.visual_status !== "reviewed" || Number(page.coverage_score ?? 0) < REVIEW_THRESHOLD || unresolved);
      });

      if (weakPages.length) {
        const targetGroup = Math.floor((weakPages[0].page_number - 1) / PAGE_BATCH_SIZE);
        await releaseJob(job, workerId, {
          stage: "profile",
          nextBatchIndex: totalBatches + 1 + targetGroup,
          embeddedChunkCount: job.embedded_chunk_count,
          totalBatches,
        });
        return {
          state: "progress",
          jobId: job.id,
          documentId: job.document_id,
          documentTitle,
          stage: "profile",
          progress: Number((allPages ?? []).filter((page) => page.visual_status === "reviewed").length),
          message: documentTitle + ": detecté " + weakPages.length + " páginas que necesitan una revisión adicional. Releyendo la página " + weakPages[0].page_number + ".",
        };
      }

      const counts = await getChunkCounts(job.document_id);
      if (counts.missing > 0) {
        await releaseJob(job, workerId, {
          stage: "embeddings",
          nextBatchIndex: totalBatches,
          embeddedChunkCount: counts.embedded,
          totalBatches,
        });
        return {
          state: "progress",
          jobId: job.id,
          documentId: job.document_id,
          documentTitle,
          stage: "embeddings",
          progress: counts.embedded,
          message: documentTitle + ": el análisis visual generó " + counts.missing + " fragmentos nuevos para indexar.",
        };
      }

      const { data: batches, error: batchesError } = await supabaseAdmin
        .from("orby_knowledge_job_batches")
        .select("batch_index,result")
        .eq("job_id", job.id)
        .order("batch_index", { ascending: true });
      if (batchesError) throw new Error("No se pudieron recuperar los perfiles pedagógicos guardados.");
      const initialBatches = (batches ?? []).filter((item) => item.batch_index >= 0 && item.batch_index < totalBatches);
      if (initialBatches.length !== totalBatches || initialBatches.some((item, index) => item.batch_index !== index)) {
        throw new Error("El perfil todavía no contiene todos los lotes de páginas: " + initialBatches.length + "/" + totalBatches + ".");
      }

      const sourcePages = (allPages ?? []).map((page) => ({
        page_number: Number(page.page_number),
        content: typeof page.page_text === "string" ? page.page_text : "",
      }));
      const profile = combineOrbyKnowledgePageBatches(
        initialBatches.map((item) => item.result as unknown as OrbyKnowledgePageBatchProfile),
        sourcePages
      );
      const conceptCount = await saveOrbyKnowledgeProfile(job.document_id, profile);
      const coverage = Number((allPages ?? []).filter((page) => page.visual_status === "reviewed").length)
        / Math.max(1, Number(document.page_count)) * 100;
      const ingestionStatus = coverage >= 95 && conceptCount > 0 ? "completed" : "attention_required";
      const reviewedPages = (allPages ?? []).filter((page) => page.visual_status === "reviewed").length;
      const publicationState = {
        chunk_count: counts.total,
        embedded_chunk_count: counts.embedded,
        knowledge_profile_status: "ready",
        knowledge_profile_version: 2,
        knowledge_pipeline_version: job.pipeline_version,
        concept_count: conceptCount,
        ingestion_status: ingestionStatus,
        coverage_percent: Number(coverage.toFixed(2)),
        visual_pages_total: Number(document.visual_pages_total ?? document.page_count),
        visual_pages_reviewed: reviewedPages,
      };
      const publicationReady = shouldAutomaticallyPublishOrbyKnowledge({
        origin: options.origin,
        currentStatus: document.status,
        document: publicationState,
      });
      // A manually completed, quality-ready draft is handed to the automatic
      // lane for its final publish gate. The manual lane never publishes.
      const awaitingAutomaticReview = options.origin === "manual"
        && document.status === "draft"
        && isOrbyKnowledgePublicationReady(publicationState);
      const { error: documentUpdateError } = await supabaseAdmin
        .from("orby_knowledge_documents")
        .update({
          knowledge_pipeline_version: job.pipeline_version,
          knowledge_profile_version: 2,
          embedded_chunk_count: counts.embedded,
          chunk_count: counts.total,
          concept_count: conceptCount,
          knowledge_profile_status: "ready",
          visual_pages_reviewed: reviewedPages,
          coverage_percent: Number(coverage.toFixed(2)),
          ingestion_status: ingestionStatus,
          next_review_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.document_id);
      if (documentUpdateError) throw new Error("Se guardó el perfil, pero no se pudo cerrar el estado del documento.");

      const { data: completionResult, error: completeError } = await supabaseAdmin.rpc("orby_complete_knowledge_job", {
        p_job_id: job.id,
        p_worker_id: workerId,
        p_publish_if_ready: publicationReady,
        p_require_automatic_review: awaitingAutomaticReview,
      });
      if (completeError) throw new Error("No se pudo completar el ciclo de aprendizaje: " + completeError.code);
      const completion = completionResult && typeof completionResult === "object"
        ? completionResult as { completed?: unknown; published?: unknown; awaiting_automatic_review?: unknown }
        : null;
      if (!completion || completion.completed !== true) {
        throw new Error("El trabajador perdió la propiedad de la tarea antes de confirmar su finalización.");
      }
      const automaticallyPublished = completion.published === true;
      const handedToAutomaticReview = completion.awaiting_automatic_review === true;

      const { error: clearFileError } = await supabaseAdmin.from("orby_knowledge_documents")
        .update({
          gemini_file_uri: null,
          gemini_file_name: null,
          gemini_file_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.document_id);
      if (clearFileError) console.warn("[Orby Knowledge] Could not clear the temporary Gemini file reference.");

      try { await deleteOrbyGeminiDocumentFile(cachedGeminiFileName ?? document.gemini_file_name); } catch { /* best effort */ }

      return {
        state: "completed",
        jobId: job.id,
        documentId: job.document_id,
        documentTitle,
        stage: "completed",
        progress: conceptCount,
        message: automaticallyPublished
          ? documentTitle + ": aprendizaje completo. " + conceptCount + " conceptos indexados; cobertura visual " + coverage.toFixed(1) + "%. Publicado automáticamente para el alumnado."
          : handedToAutomaticReview
            ? documentTitle + ": lote manual completo y sincronizado con la biblioteca compartida. El Autopilot hará la validación final y publicará el material si supera todos los controles."
            : ingestionStatus === "completed"
              ? documentTitle + ": aprendizaje completo. " + conceptCount + " conceptos indexados; cobertura visual " + coverage.toFixed(1) + "%. Sigue como borrador para revisión administrativa."
              : documentTitle + ": llegó al límite de revisiones con " + conceptCount + " conceptos, pero quedó con atención requerida (" + coverage.toFixed(1) + "%). Revisa las páginas pendientes antes de publicar.",
      };
    }

    throw new Error("Etapa de aprendizaje desconocida.");
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
    console.error("[Orby Autopilot] Job cycle failed.", { jobId: job.id, stage: job.stage, reason });
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
