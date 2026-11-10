-- Keep generated Orby Live illustrations in private storage and attach them to the exact idempotent voice turn.
-- No data URLs or image bytes are persisted in Postgres.
-- Earlier voice/board migrations may not have been applied to every database.
-- Make this migration self-contained for all columns and the idempotency receipt
-- table required by the Live voice persistence RPC.
alter table public.orby_messages
  add column if not exists teaching_board jsonb,
  add column if not exists generated_image_path text,
  add column if not exists voice_turn_id uuid;

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

create unique index if not exists orby_messages_voice_turn_id_unique
  on public.orby_messages (conversation_id, user_id, voice_turn_id)
  where role = 'assistant' and voice_turn_id is not null;

-- The selected subject and the turn pair must commit or roll back together.
-- Drop the previous six-argument overload so PostgREST never sees ambiguous defaults.
drop function if exists public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb);

create function public.orby_save_voice_turn_with_board(
  p_user_id uuid,
  p_conversation_id uuid,
  p_turn_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_teaching_board jsonb default null,
  p_subject text default null
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
       when coalesce(p_teaching_board->>'version', '') not in ('1', '2', '3') then true
       when pg_catalog.jsonb_typeof(p_teaching_board->'blocks') is distinct from 'array' then true
       when p_teaching_board->>'version' in ('1', '2')
         and pg_catalog.jsonb_array_length(p_teaching_board->'blocks') < 1 then true
       when p_teaching_board->>'version' in ('1', '2')
         and pg_catalog.jsonb_array_length(p_teaching_board->'blocks') > 8 then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_array_length(p_teaching_board->'blocks') > 24 then true
       when p_teaching_board->>'version' = '1' and p_teaching_board ? 'visuals' then true
       when p_teaching_board->>'version' in ('2', '3')
         and pg_catalog.jsonb_typeof(p_teaching_board->'visuals') is distinct from 'array' then true
       when p_teaching_board->>'version' = '2'
         and pg_catalog.jsonb_array_length(p_teaching_board->'visuals') > 4 then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_array_length(p_teaching_board->'visuals') > 8 then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_array_length(p_teaching_board->'blocks') = 0
         and pg_catalog.jsonb_array_length(p_teaching_board->'visuals') = 0 then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_typeof(p_teaching_board->'layout') is distinct from 'object' then true
       when p_teaching_board->>'version' = '3'
         and p_teaching_board->'layout'->>'aspectRatio' is distinct from '16:9' then true
       when p_teaching_board->>'version' = '3'
         and coalesce(p_teaching_board->'layout'->'pageCount', 'null'::jsonb)
           not in ('2'::jsonb, '3'::jsonb, '4'::jsonb) then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_typeof(p_teaching_board->'layout'->'elements') is distinct from 'array' then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_array_length(p_teaching_board->'layout'->'elements') < 1 then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_array_length(p_teaching_board->'layout'->'elements') > 32 then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.jsonb_array_length(p_teaching_board->'layout'->'elements')
           <> pg_catalog.jsonb_array_length(p_teaching_board->'blocks')
             + pg_catalog.jsonb_array_length(p_teaching_board->'visuals') then true
       when p_teaching_board->>'version' = '3'
         and exists (
           select 1
           from pg_catalog.jsonb_array_elements(p_teaching_board->'layout'->'elements') as board_element(value)
           where coalesce(board_element.value->'page', 'null'::jsonb)
               not in ('0'::jsonb, '1'::jsonb, '2'::jsonb, '3'::jsonb)
             or (p_teaching_board->'layout'->'pageCount' = '2'::jsonb
               and board_element.value->'page' not in ('0'::jsonb, '1'::jsonb))
             or (p_teaching_board->'layout'->'pageCount' = '3'::jsonb
               and board_element.value->'page' = '3'::jsonb)
         ) then true
       when p_teaching_board->>'version' = '3'
         and exists (
           select 1
           from pg_catalog.generate_series(
             0,
             (p_teaching_board->'layout'->>'pageCount')::integer - 1
           ) as page_index(value)
           where (
             select pg_catalog.count(*)
             from pg_catalog.jsonb_array_elements(p_teaching_board->'layout'->'elements') as board_element(value)
             where board_element.value->'page' = pg_catalog.to_jsonb(page_index.value)
           ) > 12
           or not exists (
             select 1
             from pg_catalog.jsonb_array_elements(p_teaching_board->'layout'->'elements') as board_element(value)
             where board_element.value->'page' = pg_catalog.to_jsonb(page_index.value)
           )
         ) then true
       when p_teaching_board->>'version' = '3'
         and pg_catalog.octet_length(p_teaching_board::text) > 36000 then true
       when p_teaching_board->>'version' <> '3'
         and pg_catalog.octet_length(p_teaching_board::text) > 24000 then true
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
    conversation_id, user_id, role, content, teaching_board, voice_turn_id, created_at
  ) values (
    p_conversation_id, p_user_id, 'assistant', p_assistant_content, p_teaching_board, p_turn_id, v_now + interval '1 millisecond'
  );

  update public.orby_conversations
  set
    subject = coalesce(nullif(pg_catalog.btrim(p_subject), ''), subject),
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

revoke all on function public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.orby_save_voice_turn_with_board(uuid, uuid, uuid, text, text, jsonb, text) to service_role;

create or replace function public.orby_attach_voice_turn_image(
  p_user_id uuid,
  p_conversation_id uuid,
  p_turn_id uuid,
  p_image_path text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $
declare
  v_message_id uuid;
begin
  if p_user_id is null
     or p_conversation_id is null
     or p_turn_id is null
     or p_image_path is null
     or char_length(p_image_path) > 240
     or p_image_path like '%..%'
     or p_image_path not like p_user_id::text || '/%' then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  if not exists (
    select 1 from public.orby_conversations c
    where c.id = p_conversation_id and c.user_id = p_user_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'conversation_not_owned');
  end if;

  if not exists (
    select 1 from public.orby_image_assets a
    where a.user_id = p_user_id and a.storage_path = p_image_path
  ) then
    return jsonb_build_object('ok', false, 'code', 'image_not_owned');
  end if;

  update public.orby_messages
  set generated_image_path = p_image_path
  where conversation_id = p_conversation_id
    and user_id = p_user_id
    and role = 'assistant'
    and voice_turn_id = p_turn_id
    and (generated_image_path is null or generated_image_path = p_image_path)
  returning id into v_message_id;

  if v_message_id is null then
    if exists (
      select 1 from public.orby_messages m
      where m.conversation_id = p_conversation_id
        and m.user_id = p_user_id
        and m.role = 'assistant'
        and m.voice_turn_id = p_turn_id
        and m.generated_image_path = p_image_path
    ) then
      return jsonb_build_object('ok', true, 'already_attached', true);
    end if;
    return jsonb_build_object('ok', false, 'code', 'turn_not_saved_yet');
  end if;

  return jsonb_build_object('ok', true, 'already_attached', false);
end;
$;

revoke all on function public.orby_attach_voice_turn_image(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.orby_attach_voice_turn_image(uuid, uuid, uuid, text) to service_role;


