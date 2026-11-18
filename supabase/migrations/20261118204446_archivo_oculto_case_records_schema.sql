create table if not exists public.game_case_records (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.game_reading_passages(id) on delete cascade,
  record_type text not null check (record_type in ('timeline','email','message')),
  occurred_at text not null default '',
  title text not null check (char_length(title) between 2 and 180),
  body text not null default '' check (char_length(body) <= 6000),
  source text not null default '' check (char_length(source) <= 300),
  sender text not null default '' check (char_length(sender) <= 160),
  recipient text not null default '' check (char_length(recipient) <= 160),
  subject text not null default '' check (char_length(subject) <= 180),
  suspect_id uuid references public.game_reading_suspects(id) on delete set null,
  evidence_asset_id uuid references public.game_evidence_assets(id) on delete set null,
  evidence_code text not null default '' check (char_length(evidence_code) <= 40),
  document_reference text not null default '' check (char_length(document_reference) <= 100),
  page_number text not null default '' check (char_length(page_number) <= 30),
  seal text not null default 'CONFIDENCIAL' check (char_length(seal) <= 60),
  signature_note text not null default '' check (char_length(signature_note) <= 240),
  classification text not null default 'RESERVADO' check (char_length(classification) <= 60),
  display_order integer not null default 0 check (display_order between 0 and 9999),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_case_records
  add column if not exists document_reference text not null default '',
  add column if not exists page_number text not null default '',
  add column if not exists seal text not null default 'CONFIDENCIAL',
  add column if not exists signature_note text not null default '',
  add column if not exists classification text not null default 'RESERVADO';

create index if not exists game_case_records_passage_type_order_idx
  on public.game_case_records(passage_id, record_type, display_order, occurred_at);
create index if not exists game_case_records_suspect_idx
  on public.game_case_records(suspect_id) where suspect_id is not null;
create index if not exists game_case_records_evidence_idx
  on public.game_case_records(evidence_asset_id) where evidence_asset_id is not null;

alter table public.game_case_records enable row level security;
grant select, insert, update, delete on public.game_case_records to authenticated;

drop policy if exists "published archivo oculto case records readable" on public.game_case_records;
create policy "published archivo oculto case records readable"
  on public.game_case_records for select to authenticated
  using (exists (
    select 1 from public.game_reading_passages p
    where p.id = game_case_records.passage_id
      and p.game_key = 'archivo-oculto' and p.status = 'published'
  ));

drop policy if exists "admins manage archivo oculto case records" on public.game_case_records;
create policy "admins manage archivo oculto case records"
  on public.game_case_records for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));
