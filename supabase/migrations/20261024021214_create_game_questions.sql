create table if not exists public.game_questions (
  id uuid primary key default gen_random_uuid(),
  game_key text not null default 'que-es-esa-vaina' check (game_key = 'que-es-esa-vaina'),
  subject text not null check (subject in ('Matemáticas','Química','Física','Biología','Historia','Inglés')),
  topic text not null check (char_length(topic) between 2 and 140),
  difficulty text not null check (difficulty in ('facil','media','dificil')),
  clue text not null check (char_length(clue) between 10 and 1200),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer integer not null check (answer between 0 and 3),
  explanation text not null check (char_length(explanation) between 5 and 1800),
  hint text not null check (char_length(hint) between 3 and 500),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_questions_game_status_idx on public.game_questions(game_key, status, subject, difficulty);
alter table public.game_questions enable row level security;
drop policy if exists "game questions admin all" on public.game_questions;
create policy "game questions admin all" on public.game_questions for all to authenticated
using ((auth.jwt() ->> 'email') = 'aragonyostynsena07@gmail.com')
with check ((auth.jwt() ->> 'email') = 'aragonyostynsena07@gmail.com');
drop policy if exists "game questions published read" on public.game_questions;
create policy "game questions published read" on public.game_questions for select to authenticated
using (status = 'published');
grant select, insert, update, delete on public.game_questions to authenticated;
