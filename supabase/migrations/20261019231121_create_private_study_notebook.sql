create table if not exists public.study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_text text not null check (char_length(btrim(selected_text)) between 1 and 5000),
  note_text text not null default '' check (char_length(note_text) <= 5000),
  highlight_color text not null default 'yellow'
    check (highlight_color in ('yellow', 'cyan', 'purple', 'green')),
  source_title text not null default 'Lección',
  source_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_notes_user_created_idx
  on public.study_notes (user_id, created_at desc);

alter table public.study_notes enable row level security;

drop policy if exists "Users can view their own study notes" on public.study_notes;
create policy "Users can view their own study notes"
  on public.study_notes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own study notes" on public.study_notes;
create policy "Users can create their own study notes"
  on public.study_notes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own study notes" on public.study_notes;
create policy "Users can update their own study notes"
  on public.study_notes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own study notes" on public.study_notes;
create policy "Users can delete their own study notes"
  on public.study_notes for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.study_notes to authenticated;
revoke all on public.study_notes from anon;
