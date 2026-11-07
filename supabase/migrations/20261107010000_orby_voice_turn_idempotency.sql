-- Idempotent persistence for Gemini Live voice turns.
-- A stable client-generated turn UUID is reused for every retry.
create table if not exists public.orby_voice_turn_receipts (
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (conversation_id, user_id, turn_id),
  constraint orby_voice_turn_receipts_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.orby_conversations (id, user_id)
    on delete cascade
);

alter table public.orby_voice_turn_receipts enable row level security;
revoke all on public.orby_voice_turn_receipts from public, anon, authenticated;
grant all on public.orby_voice_turn_receipts to service_role;

create or replace function public.orby_save_voice_turn(
  p_user_id uuid,
  p_conversation_id uuid,
  p_turn_id uuid,
  p_user_content text,
  p_assistant_content text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_claimed_turn uuid;
begin
  if p_user_id is null
     or p_conversation_id is null
     or p_turn_id is null
     or p_user_content is null
     or char_length(p_user_content) < 1
     or char_length(p_user_content) > 8000
     or p_assistant_content is null
     or char_length(p_assistant_content) < 1
     or char_length(p_assistant_content) > 8000 then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  -- Serialize writes per conversation before claiming the idempotency key.
  perform 1
  from public.orby_conversations c
  where c.id = p_conversation_id
    and c.user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'conversation_not_owned');
  end if;

  insert into public.orby_voice_turn_receipts (conversation_id, user_id, turn_id)
  values (p_conversation_id, p_user_id, p_turn_id)
  on conflict (conversation_id, user_id, turn_id) do nothing
  returning turn_id into v_claimed_turn;

  if v_claimed_turn is null then
    return jsonb_build_object('ok', true, 'already_saved', true);
  end if;

  insert into public.orby_messages (
    conversation_id, user_id, role, content, created_at
  ) values (
    p_conversation_id, p_user_id, 'user', p_user_content, v_now
  );

  insert into public.orby_messages (
    conversation_id, user_id, role, content, created_at
  ) values (
    p_conversation_id, p_user_id, 'assistant', p_assistant_content, v_now + interval '1 millisecond'
  );

  update public.orby_conversations
  set
    title = case
      when title = 'Nueva conversación'
        then left(pg_catalog.regexp_replace(p_user_content, '[[:space:]]+', ' ', 'g'), 72)
      else title
    end,
    updated_at = v_now + interval '1 millisecond'
  where id = p_conversation_id
    and user_id = p_user_id;

  return jsonb_build_object('ok', true, 'already_saved', false);
end;
$$;

revoke all on function public.orby_save_voice_turn(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.orby_save_voice_turn(uuid, uuid, uuid, text, text) to service_role;
