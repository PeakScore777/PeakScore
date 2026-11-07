-- Allow both text-only (v1) and illustrated (v2) validated Orby boards.
-- Upgrade both atomic persistence RPCs without rewriting migration history.
create or replace function public.orby_save_turn_with_board(
  p_user_id uuid,
  p_conversation_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_check_question text default null,
  p_attachment_kind text default null,
  p_attachment_label text default null,
  p_teaching_board jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_now timestamptz := clock_timestamp();
begin
  if p_user_id is null
     or p_conversation_id is null
     or p_user_content is null
     or char_length(p_user_content) < 1
     or char_length(p_user_content) > 8000
     or p_assistant_content is null
     or char_length(p_assistant_content) < 1
     or char_length(p_assistant_content) > 8000
     or (p_check_question is not null and char_length(p_check_question) > 500)
     or (p_attachment_kind is not null and p_attachment_kind not in ('image', 'audio'))
     or (p_attachment_label is not null and char_length(p_attachment_label) > 120)
     or (p_teaching_board is not null and case
       when pg_catalog.jsonb_typeof(p_teaching_board) <> 'object' then true
       when coalesce(p_teaching_board->>'version', '') not in ('1', '2') then true
       when pg_catalog.jsonb_typeof(p_teaching_board->'blocks') is distinct from 'array' then true
       when pg_catalog.jsonb_array_length(p_teaching_board->'blocks') < 1 then true
       when pg_catalog.jsonb_array_length(p_teaching_board->'blocks') > 8 then true
       when p_teaching_board->>'version' = '1' and p_teaching_board ? 'visuals' then true
       when p_teaching_board->>'version' = '2'
         and pg_catalog.jsonb_typeof(p_teaching_board->'visuals') is distinct from 'array' then true
       when p_teaching_board->>'version' = '2'
         and pg_catalog.jsonb_array_length(p_teaching_board->'visuals') > 4 then true
       when pg_catalog.octet_length(p_teaching_board::text) > 24000 then true
       else false
     end) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  select c.title into v_title
  from public.orby_conversations c
  where c.id = p_conversation_id and c.user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'conversation_not_owned');
  end if;

  insert into public.orby_messages (
    conversation_id, user_id, role, content, attachment_kind, attachment_label, created_at
  ) values (
    p_conversation_id, p_user_id, 'user', p_user_content,
    p_attachment_kind, p_attachment_label, v_now
  );

  insert into public.orby_messages (
    conversation_id, user_id, role, content, check_question, teaching_board, created_at
  ) values (
    p_conversation_id, p_user_id, 'assistant', p_assistant_content,
    nullif(p_check_question, ''), p_teaching_board, v_now + interval '1 millisecond'
  );

  update public.orby_conversations
  set
    title = case when v_title = 'Nueva conversación'
      then left(pg_catalog.regexp_replace(p_user_content, '[[:space:]]+', ' ', 'g'), 72)
      else v_title end,
    updated_at = v_now + interval '1 millisecond'
  where id = p_conversation_id and user_id = p_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.orby_save_turn_with_board(uuid, uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.orby_save_turn_with_board(uuid, uuid, text, text, text, text, text, jsonb) to service_role;

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
       when coalesce(p_teaching_board->>'version', '') not in ('1', '2') then true
       when pg_catalog.jsonb_typeof(p_teaching_board->'blocks') is distinct from 'array' then true
       when pg_catalog.jsonb_array_length(p_teaching_board->'blocks') < 1 then true
       when pg_catalog.jsonb_array_length(p_teaching_board->'blocks') > 8 then true
       when p_teaching_board->>'version' = '1' and p_teaching_board ? 'visuals' then true
       when p_teaching_board->>'version' = '2'
         and pg_catalog.jsonb_typeof(p_teaching_board->'visuals') is distinct from 'array' then true
       when p_teaching_board->>'version' = '2'
         and pg_catalog.jsonb_array_length(p_teaching_board->'visuals') > 4 then true
       when pg_catalog.octet_length(p_teaching_board::text) > 24000 then true
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

  insert into public.orby_messages (
    conversation_id, user_id, role, content, created_at
  ) values (
    p_conversation_id, p_user_id, 'user', p_user_content, v_now
  );

  insert into public.orby_messages (
    conversation_id, user_id, role, content, teaching_board, created_at
  ) values (
    p_conversation_id, p_user_id, 'assistant', p_assistant_content, p_teaching_board, v_now + interval '1 millisecond'
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

revoke all on function public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb) to service_role;
