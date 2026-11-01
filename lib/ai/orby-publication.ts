export type OrbyKnowledgePublicationState = {
  chunk_count?: unknown;
  embedded_chunk_count?: unknown;
  knowledge_profile_status?: unknown;
  knowledge_profile_version?: unknown;
  knowledge_pipeline_version?: unknown;
  concept_count?: unknown;
};

/**
 * A document is publishable only after its complete v2 profile and semantic
 * index exist. Drafts remain editable/retryable until all stages succeed.
 */
export function isOrbyKnowledgePublicationReady(
  document: OrbyKnowledgePublicationState
): boolean {
  const chunks = Number(document.chunk_count);
  const embedded = Number(document.embedded_chunk_count);
  const profileVersion = Number(document.knowledge_profile_version);
  const pipelineVersion = Number(document.knowledge_pipeline_version);
  const conceptCount = Number(document.concept_count);

  return Number.isInteger(chunks)
    && chunks > 0
    && Number.isInteger(embedded)
    && embedded >= chunks
    && document.knowledge_profile_status === "ready"
    && Number.isInteger(profileVersion)
    && profileVersion >= 2
    && Number.isInteger(pipelineVersion)
    && pipelineVersion >= 3
    && Number.isInteger(conceptCount)
    && conceptCount > 0;
}
