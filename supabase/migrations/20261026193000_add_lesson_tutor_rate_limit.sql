-- Dedicated per-user hourly limit for Orby lesson-tutor requests.
-- Reuses the existing api_rate_limits table and keeps the limit check atomic.

create or replace function public.consume_lesson_tutor_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := pg_catalog.now();
  v_count integer;
begin
  if v_user_id is null then
    return false;
  end if;

  insert into public.api_rate_limits as existing (
    user_id,
    bucket,
    window_started_at,
    request_count
  )
  values (
    v_user_id,
    'lesson-tutor',
    v_now,
    1
  )
  on conflict (user_id, bucket) do update
    set
      window_started_at = case
        when existing.window_started_at <= v_now - interval '1 hour'
          then v_now
        else existing.window_started_at
      end,
      request_count = case
        when existing.window_started_at <= v_now - interval '1 hour'
          then 1
        else existing.request_count + 1
      end
  returning request_count into v_count;

  return v_count <= 8;
end;
$function$;

revoke all on function public.consume_lesson_tutor_rate_limit() from public;
revoke all on function public.consume_lesson_tutor_rate_limit() from anon;
grant execute on function public.consume_lesson_tutor_rate_limit() to authenticated;
