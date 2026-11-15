-- Admin-managed photo evidence for El Archivo Oculto.
-- Photos remain in the existing question-images Supabase Storage bucket.
create table if not exists public.game_evidence_assets (
  id uuid primary key default gen_random_uuid(),
  game_key text not null default 'archivo-oculto'
    check (game_key = 'archivo-oculto'),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  tag text not null default 'EVIDENCIA' check (char_length(tag) between 2 and 40),
  image_url text not null,
  storage_path text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_evidence_assets_game_updated_idx
  on public.game_evidence_assets(game_key, updated_at desc);

alter table public.game_evidence_assets enable row level security;
grant select, insert, update, delete on public.game_evidence_assets to authenticated;

drop policy if exists "admins manage archivo oculto evidence assets" on public.game_evidence_assets;
create policy "admins manage archivo oculto evidence assets"
  on public.game_evidence_assets for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );


-- Link each photograph to the reading that gives it meaning.
-- display_after_paragraph=0 places it before the first paragraph.
alter table public.game_evidence_assets
  add column if not exists passage_id uuid
    references public.game_reading_passages(id) on delete set null,
  add column if not exists display_after_paragraph integer not null default 1
    check (display_after_paragraph between 0 and 30),
  add column if not exists layout text not null default 'float'
    check (layout in ('float', 'wide'));

create index if not exists game_evidence_assets_passage_order_idx
  on public.game_evidence_assets(passage_id, display_after_paragraph, created_at)
  where passage_id is not null;

drop policy if exists "published archivo oculto evidence readable" on public.game_evidence_assets;
create policy "published archivo oculto evidence readable"
  on public.game_evidence_assets for select to authenticated
  using (
    passage_id is not null
    and exists (
      select 1 from public.game_reading_passages p
      where p.id = game_evidence_assets.passage_id
        and p.game_key = 'archivo-oculto'
        and p.status = 'published'
    )
  );
