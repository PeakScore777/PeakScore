-- Additive idempotent voice-turn persistence that stores the optional teaching board.
-- Keep the existing RPC untouched for clients that do not send a board.
alter table public.orby_messages
  add column if not exists teaching_board jsonb;

create or replace function public.orby_save_voice_turn_with_board(
  p_user_id uuid,
  p_conversation_id uuid,
  p_turn_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_teaching_board jsonb default null
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
     or char_length(p_assistant_content) > 8000
     or (p_teaching_board is not null and case
       when pg_catalog.jsonb_typeof(p_teaching_board) <> 'object' then true
       when p_teaching_board->>'version' <> '1' then true
       when pg_catalog.jsonb_typeof(p_teaching_board->'blocks') <> 'array' then true
       when pg_catalog.jsonb_array_length(p_teaching_board->'blocks') < 1 then true
       when pg_catalog.jsonb_array_length(p_teaching_board->'blocks') > 8 then true
       when pg_catalog.octet_length(p_teaching_board::text) > 12000 then true
       else false
     end) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

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

  insert into public.orby_messages (conversation_id, user_id, role, content, created_at)
  values (p_conversation_id, p_user_id, 'user', p_user_content, v_now);

  insert into public.orby_messages (conversation_id, user_id, role, content, teaching_board, created_at)
  values (p_conversation_id, p_user_id, 'assistant', p_assistant_content, p_teaching_board, v_now + interval '1 millisecond');

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

revoke all on function public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb) to service_role;
