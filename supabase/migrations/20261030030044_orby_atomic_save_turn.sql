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
     or (p_attachment_label is not null and char_length(p_attachment_label) > 120) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  select c.title into v_title
  from public.orby_conversations c
  where c.id = p_conversation_id
    and c.user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'conversation_not_owned');
  end if;

  insert into public.orby_messages (
    conversation_id, user_id, role, content, attachment_kind, attachment_label, created_at
  ) values (
    p_conversation_id,
    p_user_id,
    'user',
    p_user_content,
    p_attachment_kind,
    p_attachment_label,
    v_now
  );

  insert into public.orby_messages (
    conversation_id, user_id, role, content, check_question, created_at
  ) values (
    p_conversation_id,
    p_user_id,
    'assistant',
    p_assistant_content,
    nullif(p_check_question, ''),
    v_now + interval '1 millisecond'
  );

  update public.orby_conversations
  set
    title = case
      when v_title = 'Nueva conversación'
        then left(pg_catalog.regexp_replace(p_user_content, '\s+', ' ', 'g'), 72)
      else v_title
    end,
    updated_at = v_now + interval '1 millisecond'
  where id = p_conversation_id
    and user_id = p_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.orby_save_turn(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.orby_save_turn(uuid, uuid, text, text, text, text, text) to service_role;
