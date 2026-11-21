create or replace function public.consume_api_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_count integer;
  v_bucket text := trim(coalesce(p_bucket, ''));
  v_limit integer;
  v_window_seconds integer;
begin
  if v_user_id is null then
    return false;
  end if;

  case v_bucket
    when 'generate-questions' then
      v_limit := 10;
      v_window_seconds := 3600;
    when 'generate-question-batch' then
      v_limit := 3;
      v_window_seconds := 3600;
    when 'import-pdf' then
      v_limit := 2;
      v_window_seconds := 3600;
    when 'create-simulation' then
      v_limit := 20;
      v_window_seconds := 3600;
    when 'institution-register' then
      v_limit := 2;
      v_window_seconds := 3600;
    when 'community-professor-application' then
      v_limit := 2;
      v_window_seconds := 3600;
    else
      return false;
  end case;

  insert into public.api_rate_limits (
    user_id, bucket, window_started_at, request_count
  )
  values (v_user_id, v_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
  set
    window_started_at = case
      when public.api_rate_limits.window_started_at
        <= v_now - make_interval(secs => v_window_seconds)
        then v_now
      else public.api_rate_limits.window_started_at
    end,
    request_count = case
      when public.api_rate_limits.window_started_at
        <= v_now - make_interval(secs => v_window_seconds)
        then 1
      else public.api_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  return v_count <= v_limit;
end;
$function$;
