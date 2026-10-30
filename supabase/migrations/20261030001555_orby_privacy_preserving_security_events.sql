create table if not exists private.orby_security_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'prompt_injection',
    'suspicious_output',
    'invalid_image_payload',
    'invalid_request_payload'
  )),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 2048),
  created_at timestamptz not null default now()
);

create index if not exists orby_security_events_user_created_idx
  on private.orby_security_events (user_id, created_at desc);

alter table private.orby_security_events enable row level security;
revoke all on private.orby_security_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.orby_security_events to service_role;

create or replace function public.orby_record_security_event(
  p_user_id uuid,
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metadata jsonb;
begin
  if p_user_id is null or p_event_type not in (
    'prompt_injection',
    'suspicious_output',
    'invalid_image_payload',
    'invalid_request_payload'
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  v_metadata := case
    when jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) = 'object'
      and pg_column_size(p_metadata) <= 2048
    then coalesce(p_metadata, '{}'::jsonb)
    else '{}'::jsonb
  end;

  insert into private.orby_security_events (user_id, event_type, metadata)
  values (p_user_id, p_event_type, v_metadata);

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.orby_record_security_event(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.orby_record_security_event(uuid, text, jsonb) to service_role;
