-- Separate real-time tutor classes from the legacy written-chat history.
-- Existing rows remain "chat"; only sessions explicitly created by Live are listed as classes.
alter table public.orby_conversations
  add column if not exists session_type text not null default 'chat'
  check (session_type in ('chat', 'live'));

create index if not exists orby_live_classes_user_updated_idx
  on public.orby_conversations (user_id, updated_at desc)
  where session_type = 'live';
