-- Additional archival presentation metadata for PEAK OS case documents.
alter table public.game_case_records
  add column if not exists document_reference text not null default '' check (char_length(document_reference) <= 100),
  add column if not exists page_number text not null default '' check (char_length(page_number) <= 30),
  add column if not exists seal text not null default 'CONFIDENCIAL' check (char_length(seal) <= 60),
  add column if not exists signature_note text not null default '' check (char_length(signature_note) <= 240),
  add column if not exists classification text not null default 'RESERVADO' check (char_length(classification) <= 60);
