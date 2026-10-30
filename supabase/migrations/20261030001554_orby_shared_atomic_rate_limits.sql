create schema if not exists private;

create table if not exists private.orby_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  request_count integer not null default 0 check (request_count >= 0),
  window_ends_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

alter table private.orby_rate_limits enable row level security;
revoke all on private.orby_rate_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.orby_rate_limits to service_role;

create or replace function public.orby_take_rate_limit(
  p_user_id uuid,
  p_bucket text,
  p_max_requests integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_ends timestamptz;
  v_now timestamptz := clock_timestamp();
  v_allowed boolean;
  v_retry integer;
begin
  if p_user_id is null
     or p_bucket is null
     or char_length(p_bucket) < 1
     or char_length(p_bucket) > 80
     or p_max_requests < 1
     or p_max_requests > 1000
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    return jsonb_build_object('allowed', false, 'retryAfter', 60, 'code', 'invalid_input');
  end if;

  insert into private.orby_rate_limits as limits
    (user_id, bucket, request_count, window_ends_at, updated_at)
  values
    (p_user_id, p_bucket, 1, v_now + make_interval(secs => p_window_seconds), v_now)
  on conflict (user_id, bucket) do update
    set request_count = case
          when limits.window_ends_at <= v_now then 1
          else least(limits.request_count + 1, p_max_requests + 1)
        end,
        window_ends_at = case
          when limits.window_ends_at <= v_now then v_now + make_interval(secs => p_window_seconds)
          else limits.window_ends_at
        end,
        updated_at = v_now
  returning request_count, window_ends_at into v_count, v_ends;

  v_allowed := v_count <= p_max_requests;
  v_retry := greatest(1, ceil(extract(epoch from (v_ends - v_now)))::integer);

  return jsonb_build_object(
    'allowed', v_allowed,
    'retryAfter', case when v_allowed then 0 else v_retry end,
    'remaining', greatest(0, p_max_requests - v_count)
  );
end;
$$;

revoke all on function public.orby_take_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.orby_take_rate_limit(uuid, text, integer, integer) to service_role;
