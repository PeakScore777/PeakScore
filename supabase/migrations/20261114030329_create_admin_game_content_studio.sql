-- Shared game content editor and image-backed reading passages.
-- A passage is visible to students only after publication; its questions publish with it.
create table if not exists public.game_reading_passages (
  id uuid primary key default gen_random_uuid(),
  game_key text not null default 'archivo-oculto'
    check (game_key = 'archivo-oculto'),
  title text not null check (char_length(title) between 3 and 180),
  reading_type text not null default 'Texto de práctica'
    check (char_length(reading_type) between 2 and 120),
  source_label text not null default 'Texto original de práctica · PeakScore'
    check (char_length(source_label) <= 180),
  content_blocks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(content_blocks) = 'array'),
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_reading_passages enable row level security;
grant select, insert, update, delete on public.game_reading_passages to authenticated;

drop policy if exists "published game reading passages are readable" on public.game_reading_passages;
create policy "published game reading passages are readable"
  on public.game_reading_passages for select to authenticated
  using (status = 'published');

drop policy if exists "admins manage game reading passages" on public.game_reading_passages;
create policy "admins manage game reading passages"
  on public.game_reading_passages for all to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin')
  );

alter table public.game_questions
  drop constraint if exists game_questions_game_key_check;
alter table public.game_questions
  add constraint game_questions_game_key_check
  check (game_key in (
    'que-es-esa-vaina', 'caso-cero', 'archivo-oculto',
    'operacion-rescate', 'mapa-de-decisiones', 'mision-global'
  ));

alter table public.game_questions
  drop constraint if exists game_questions_subject_check;
alter table public.game_questions
  add constraint game_questions_subject_check
  check (subject in (
    'Matemáticas','Química','Física','Biología','Historia','Inglés',
    'Lectura Crítica','Ciencias Naturales','Sociales y Ciudadanas','Mixto'
  ));

alter table public.game_questions
  add column if not exists passage_id uuid
    references public.game_reading_passages(id) on delete cascade;
alter table public.game_questions add column if not exists competency text;
alter table public.game_questions add column if not exists competency_short text;
alter table public.game_questions add column if not exists image_url text;

create index if not exists game_reading_passages_status_created_idx
  on public.game_reading_passages(status, created_at desc);
create index if not exists game_questions_game_status_created_idx
  on public.game_questions(game_key, status, created_at desc);
create index if not exists game_questions_passage_status_idx
  on public.game_questions(passage_id, status, created_at);

drop policy if exists "game questions admin all" on public.game_questions;
drop policy if exists "game questions admin role all" on public.game_questions;
create policy "game questions admin role all"
  on public.game_questions for all to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin')
  );
