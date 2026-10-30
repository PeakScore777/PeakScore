create table if not exists public.orby_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación'
    check (char_length(title) between 1 and 80),
  subject text not null default 'Preparación Saber 11'
    check (char_length(subject) between 1 and 80),
  topic text not null default 'Estudio general'
    check (char_length(topic) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists orby_conversations_user_updated_idx
  on public.orby_conversations (user_id, updated_at desc);

alter table public.orby_conversations enable row level security;
revoke all on public.orby_conversations from public, anon, authenticated;
grant select, insert, update, delete on public.orby_conversations to authenticated;

create policy "Users read their own Orby conversations"
  on public.orby_conversations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create their own Orby conversations"
  on public.orby_conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own Orby conversations"
  on public.orby_conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own Orby conversations"
  on public.orby_conversations for delete to authenticated
  using ((select auth.uid()) = user_id);


create table if not exists public.orby_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null
    check (char_length(content) between 1 and 8000),
  check_question text
    check (check_question is null or char_length(check_question) <= 500),
  attachment_kind text
    check (attachment_kind is null or attachment_kind in ('image', 'audio')),
  attachment_label text
    check (attachment_label is null or char_length(attachment_label) <= 120),
  created_at timestamptz not null default now(),
  constraint orby_messages_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.orby_conversations (id, user_id)
    on delete cascade
);

create index if not exists orby_messages_conversation_created_idx
  on public.orby_messages (conversation_id, created_at asc);

create index if not exists orby_messages_user_created_idx
  on public.orby_messages (user_id, created_at desc);

alter table public.orby_messages enable row level security;
revoke all on public.orby_messages from public, anon, authenticated;
grant select, insert, delete on public.orby_messages to authenticated;

create policy "Users read their own Orby messages"
  on public.orby_messages for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert their own Orby messages"
  on public.orby_messages for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.orby_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users delete their own Orby messages"
  on public.orby_messages for delete to authenticated
  using ((select auth.uid()) = user_id);
