alter table public.orby_knowledge_documents
  add column if not exists gemini_file_uri text,
  add column if not exists gemini_file_name text,
  add column if not exists gemini_file_expires_at timestamptz;

create index if not exists orby_knowledge_documents_next_review_idx
  on public.orby_knowledge_documents (next_review_at)
  where ingestion_status in ('queued','processing','attention_required');

