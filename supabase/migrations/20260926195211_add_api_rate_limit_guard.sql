create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  primary key (user_id, bucket)
);

alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  if v_user_id is null then
    return false;
  end if;

  if p_bucket is null or length(trim(p_bucket)) = 0
     or p_limit < 1 or p_limit > 20
     or p_window_seconds < 60 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.api_rate_limits(user_id, bucket, window_started_at, request_count)
  values (v_user_id, trim(p_bucket), v_now, 1)
  on conflict (user_id, bucket) do update
    set
      window_started_at = case
        when public.api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then v_now
        else public.api_rate_limits.window_started_at
      end,
      request_count = case
        when public.api_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then 1
        else public.api_rate_limits.request_count + 1
      end
  returning window_started_at, request_count
  into v_window_start, v_count;

  return v_count <= p_limit;
end;
$function$;

revoke execute on function public.consume_api_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to authenticated;
