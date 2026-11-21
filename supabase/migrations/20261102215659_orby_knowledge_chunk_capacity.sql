alter table public.orby_knowledge_documents
  drop constraint if exists orby_knowledge_documents_chunk_count_check;

alter table public.orby_knowledge_documents
  add constraint orby_knowledge_documents_chunk_count_check
  check (chunk_count >= 1 and chunk_count <= 2000);
