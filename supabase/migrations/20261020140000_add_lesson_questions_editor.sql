create table if not exists public.lesson_questions (
 id uuid primary key default gen_random_uuid(), lesson_slug text not null, position integer not null check(position between 1 and 20),
 difficulty text not null check(difficulty in ('Fácil','Media','Difícil')), competency text not null default '',
 context_text text not null default '', context_blocks jsonb not null default '[]'::jsonb, prompt text not null,
 options jsonb not null, correct_answer text not null check(correct_answer in ('A','B','C','D')), explanation text not null default '',
 is_published boolean not null default false, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null,
 unique(lesson_slug,position), check(char_length(btrim(prompt))>0), check(jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
 check(jsonb_typeof(context_blocks)='array')
);
alter table public.lesson_questions enable row level security;
drop policy if exists "Admins manage lesson questions" on public.lesson_questions;
create policy "Admins manage lesson questions" on public.lesson_questions for all to authenticated
using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "Authenticated users read published lesson questions" on public.lesson_questions;
create policy "Authenticated users read published lesson questions" on public.lesson_questions for select to authenticated using(is_published=true);