create table if not exists public.orby_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nuevo chat' check (char_length(title) between 1 and 120),
  subject text not null default 'Preparación Saber 11' check (char_length(subject) <= 80),
  topic text not null default 'Estudio y aprendizaje' check (char_length(topic) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orby_conversations_user_updated_idx
  on public.orby_conversations (user_id, updated_at desc);

create table if not exists public.orby_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.orby_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 7000),
  check_question text,
  attachment_kind text check (attachment_kind in ('image', 'audio')),
  attachment_label text check (attachment_label is null or char_length(attachment_label) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists orby_messages_conversation_created_idx
  on public.orby_messages (conversation_id, created_at asc);

alter table public.orby_conversations enable row level security;
alter table public.orby_messages enable row level security;
revoke all on public.orby_conversations, public.orby_messages from public, anon, authenticated;
grant select, insert, update, delete on public.orby_conversations, public.orby_messages to service_role;

create or replace function public.orby_save_turn(
  p_user_id uuid,
  p_conversation_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_check_question text default null,
  p_attachment_kind text default null,
  p_attachment_label text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  if p_user_id is null or p_conversation_id is null
     or p_user_content is null or char_length(p_user_content) > 1200
     or p_assistant_content is null or char_length(p_assistant_content) > 7000
     or (p_attachment_kind is not null and p_attachment_kind not in ('image', 'audio'))
     or (p_attachment_label is not null and char_length(p_attachment_label) > 120) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  select user_id into v_owner
  from public.orby_conversations
  where id = p_conversation_id
  for update;

  if v_owner is distinct from p_user_id then
    return jsonb_build_object('ok', false, 'code', 'not_owner');
  end if;

  insert into public.orby_messages
    (conversation_id, user_id, role, content, attachment_kind, attachment_label)
  values
    (p_conversation_id, p_user_id, 'user', p_user_content, p_attachment_kind, p_attachment_label);

  insert into public.orby_messages
    (conversation_id, user_id, role, content, check_question)
  values
    (p_conversation_id, p_user_id, 'assistant', p_assistant_content, nullif(left(coalesce(p_check_question, ''), 500), ''));

  update public.orby_conversations
  set title = case
        when title = 'Nuevo chat' then left(regexp_replace(p_user_content, '\s+', ' ', 'g'), 72)
        else title
      end,
      updated_at = now()
  where id = p_conversation_id and user_id = p_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.orby_save_turn(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.orby_save_turn(uuid, uuid, text, text, text, text, text) to service_role;
