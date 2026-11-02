-- OCR and visual-page analysis can add derived chunks after the initial text split.
-- Keep a generous document cap instead of failing at 300 chunks during real ingestion.
alter table public.orby_knowledge_documents
  drop constraint if exists orby_knowledge_documents_chunk_count_check;

alter table public.orby_knowledge_documents
  add constraint orby_knowledge_documents_chunk_count_check
  check (chunk_count >= 1 and chunk_count <= 2000);
