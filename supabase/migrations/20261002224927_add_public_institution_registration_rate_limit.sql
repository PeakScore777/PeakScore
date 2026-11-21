create table if not exists public.institution_registration_rate_limits (
  rate_key text primary key
    check (rate_key ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
    check (request_count >= 0)
);

alter table public.institution_registration_rate_limits enable row level security;

revoke all on table public.institution_registration_rate_limits from anon, authenticated;

create or replace function public.consume_public_institution_registration_rate_limit(
  p_rate_key text
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  if p_rate_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  insert into public.institution_registration_rate_limits (
    rate_key,
    window_started_at,
    request_count
  )
  values (
    p_rate_key,
    v_now,
    1
  )
  on conflict (rate_key) do update
    set
      window_started_at = case
        when public.institution_registration_rate_limits.window_started_at
          <= v_now - interval '1 hour'
          then v_now
        else public.institution_registration_rate_limits.window_started_at
      end,
      request_count = case
        when public.institution_registration_rate_limits.window_started_at
          <= v_now - interval '1 hour'
          then 1
        else public.institution_registration_rate_limits.request_count + 1
      end
  returning request_count into v_count;

  return v_count <= 2;
end;
$function$;

revoke all on function public.consume_public_institution_registration_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_public_institution_registration_rate_limit(text) to service_role;
