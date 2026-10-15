-- Structured manual authoring for the seven ICFES English parts.
-- Safe to apply more than once. This migration is committed to a feature branch only;
-- it is not applied to any Supabase project by this change.

create table if not exists public.english_question_sets (
  id uuid primary key default gen_random_uuid(),
  part smallint not null check (part between 1 and 7),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  shared_text text,
  instructions text,
  word_bank jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'rejected')),
  session smallint not null check (session in (1, 2)),
  created_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (shared_text is null or char_length(shared_text) <= 30000),
  check (instructions is null or char_length(instructions) <= 5000),
  check (word_bank is null or (jsonb_typeof(word_bank) = 'array' and jsonb_array_length(word_bank) between 3 and 20))
);

alter table public.questions
  add column if not exists english_part smallint,
  add column if not exists english_set_id uuid references public.english_question_sets(id) on delete cascade,
  add column if not exists english_position smallint,
  add column if not exists english_options jsonb;

alter table public.questions
  drop constraint if exists questions_english_part_valid,
  drop constraint if exists questions_english_position_valid,
  drop constraint if exists questions_english_options_valid;

alter table public.questions
  add constraint questions_english_part_valid
    check (english_part is null or english_part between 1 and 7),
  add constraint questions_english_position_valid
    check (english_position is null or english_position between 1 and 30),
  add constraint questions_english_options_valid
    check (
      english_options is null
      or (
        jsonb_typeof(english_options) = 'array'
        and jsonb_array_length(english_options) between 2 and 8
      )
    );

create index if not exists questions_english_set_idx
  on public.questions (english_set_id, english_position)
  where english_set_id is not null;

create index if not exists questions_english_part_active_idx
  on public.questions (english_part, is_active)
  where english_part is not null;

alter table public.english_question_sets enable row level security;

drop policy if exists english_question_sets_admin_select on public.english_question_sets;
create policy english_question_sets_admin_select
  on public.english_question_sets
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.email, '')) = 'aragonyostynsena07@gmail.com'
    )
  );

drop policy if exists english_question_sets_admin_insert on public.english_question_sets;
create policy english_question_sets_admin_insert
  on public.english_question_sets
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.email, '')) = 'aragonyostynsena07@gmail.com'
    )
  );

drop policy if exists english_question_sets_admin_update on public.english_question_sets;
create policy english_question_sets_admin_update
  on public.english_question_sets
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.email, '')) = 'aragonyostynsena07@gmail.com'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.email, '')) = 'aragonyostynsena07@gmail.com'
    )
  );

drop policy if exists english_question_sets_admin_delete on public.english_question_sets;
create policy english_question_sets_admin_delete
  on public.english_question_sets
  for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.email, '')) = 'aragonyostynsena07@gmail.com'
    )
  );

grant select, insert, update, delete on public.english_question_sets to authenticated;

-- Part 2 uses a shared A-G word bank (and may include H as an example).
-- Other existing question types keep their A-D answer contract.
alter table public.questions
  drop constraint if exists questions_correct_answer_valid;
alter table public.questions
  add constraint questions_correct_answer_valid
    check (
      (english_part = 2 and correct_answer in ('A','B','C','D','E','F','G','H'))
      or (coalesce(english_part, 0) <> 2 and correct_answer in ('A','B','C','D'))
    );
