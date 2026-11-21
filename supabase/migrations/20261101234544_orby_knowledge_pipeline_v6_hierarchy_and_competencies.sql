-- Pipeline v6 fixes subject-boundary detection, preserves syllabus hierarchy,
-- and reads explicit competency tables with their question counts.
-- Reprocess only active jobs; preserve source PDFs, text and existing embeddings.
with active_jobs as (
  select id, document_id
  from public.orby_knowledge_jobs
  where pipeline_version < 6
    and status in ('queued','running','retrying')
)
delete from public.orby_knowledge_job_batches b
using active_jobs a
where b.job_id = a.id;

update public.orby_knowledge_document_pages p
set visual_status = 'pending',
    coverage_score = 0,
    visual_summary = '',
    ocr_text = '',
    unresolved_items = '[]'::jsonb,
    pedagogical_artifacts = '{}'::jsonb,
    concept_count = 0,
    question_pattern_count = 0,
    review_attempts = 0,
    last_reviewed_at = null,
    updated_at = now()
where exists (
  select 1
  from public.orby_knowledge_jobs j
  where j.document_id = p.document_id
    and j.pipeline_version < 6
    and j.status in ('queued','running','retrying')
);

update public.orby_knowledge_jobs j
set pipeline_version = 6,
    stage = case
      when d.embedded_chunk_count < d.chunk_count then 'embeddings'
      else 'profile'
    end,
    status = 'queued',
    total_batches = greatest(1, ceil(d.page_count::numeric / 4)::integer),
    next_batch_index = 0,
    attempt_count = 0,
    max_attempts = 10,
    available_at = now(),
    locked_by = null,
    locked_at = null,
    lease_expires_at = null,
    last_error = null,
    updated_at = now()
from public.orby_knowledge_documents d
where d.id = j.document_id
  and j.pipeline_version < 6
  and j.status in ('queued','running','retrying');

update public.orby_knowledge_documents d
set knowledge_pipeline_version = 0,
    knowledge_profile_status = 'pending',
    concept_count = 0,
    visual_pages_reviewed = 0,
    coverage_percent = 0,
    next_review_at = null,
    ingestion_status = 'processing',
    updated_at = now()
where exists (
  select 1
  from public.orby_knowledge_jobs j
  where j.document_id = d.id
    and j.pipeline_version = 6
    and j.status = 'queued'
);
