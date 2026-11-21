alter table public.orby_knowledge_chunks
  drop constraint if exists orby_knowledge_chunks_content_origin_check;

alter table public.orby_knowledge_chunks
  add constraint orby_knowledge_chunks_content_origin_check
  check (content_origin in ('text','ocr','visual','visual_placeholder'));
