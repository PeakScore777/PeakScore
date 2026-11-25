-- The attachment limiter was still using the old three-column conflict target
-- after community_rate_limits was compacted to PRIMARY KEY (user_id, action_key).
-- Keep the eight-upload hourly limit, reset the counter on a new hour, and
-- expose the RPC only to authenticated server callers.
create or replace function public.consume_community_attachment_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_window_start timestamptz;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / 3600) * 3600
  );

  insert into private.community_rate_limits (
    user_id, action_key, window_start, action_count
  )
  values (v_user_id, 'attachment', v_window_start, 1)
  on conflict (user_id, action_key)
  do update set
    action_count = case
      when private.community_rate_limits.window_start = excluded.window_start
        then private.community_rate_limits.action_count + 1
      else 1
    end,
    window_start = excluded.window_start
  returning action_count into v_count;

  return v_count <= 8;
end;
$function$;

revoke all on function public.consume_community_attachment_rate_limit() from public, anon;
grant execute on function public.consume_community_attachment_rate_limit() to authenticated, service_role;
