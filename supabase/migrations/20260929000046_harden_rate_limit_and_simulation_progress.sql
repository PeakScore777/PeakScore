-- 1) Make simulation attempt progress state explicit.
alter table public.simulation_attempts
  add column if not exists total_questions integer,
  add column if not exists current_question integer,
  add column if not exists time_left integer;

update public.simulation_attempts sa
set total_questions = s.total_questions
from public.simulations s
where sa.simulation_id = s.id
  and sa.total_questions is null;

update public.simulation_attempts sa
set current_question = 0
where sa.current_question is null;

update public.simulation_attempts sa
set time_left = coalesce(s.duration, 0) * 60
from public.simulations s
where sa.simulation_id = s.id
  and sa.time_left is null;

alter table public.simulation_attempts
  alter column total_questions set not null;

alter table public.simulation_attempts
  alter column current_question set default 0;

alter table public.simulation_attempts
  alter column time_left set default 0;

-- 2) Rate limits are server-owned. The client-facing parameters remain in
-- the signature for compatibility, but their values no longer determine
-- the effective security policy.
create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
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
    else
      return false;
  end case;

  insert into public.api_rate_limits(
    user_id,
    bucket,
    window_started_at,
    request_count
  )
  values (
    v_user_id,
    v_bucket,
    v_now,
    1
  )
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

-- 3) Persist the progress state that the RPC already receives.
create or replace function public.save_simulation_progress_atomic(
  p_simulation_id uuid,
  p_current_question integer,
  p_time_left integer,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_sim public.simulations%rowtype;
  v_attempt_id uuid;
  v_total integer;
  v_duration integer;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'invalid_answers';
  end if;

  select *
    into v_sim
  from public.simulations
  where id = p_simulation_id
    and created_by = v_user_id
  for update;

  if not found then
    raise exception 'simulation_not_found';
  end if;

  v_total := v_sim.total_questions;
  v_duration := v_sim.duration;

  if p_current_question < 0 or p_current_question >= v_total then
    raise exception 'invalid_current_question';
  end if;

  if p_time_left < 0 then
    raise exception 'invalid_time_left';
  end if;

  if v_duration is not null and p_time_left > v_duration * 60 then
    raise exception 'invalid_time_left';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text || ':' || p_simulation_id::text,
      0
    )
  );

  select id
    into v_attempt_id
  from public.simulation_attempts
  where simulation_id = p_simulation_id
    and user_id = v_user_id
    and completed_at is null
  order by started_at desc
  limit 1
  for update;

  if v_attempt_id is null then
    insert into public.simulation_attempts (
      simulation_id,
      user_id,
      score,
      correct_answers,
      total_questions,
      completed_at,
      current_question,
      time_left
    )
    values (
      p_simulation_id,
      v_user_id,
      0,
      0,
      v_total,
      null,
      p_current_question,
      p_time_left
    )
    returning id into v_attempt_id;
  else
    update public.simulation_attempts
    set
      current_question = p_current_question,
      time_left = p_time_left,
      total_questions = v_total
    where id = v_attempt_id;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) a
    where jsonb_typeof(a) <> 'object'
      or (a ? 'question_id') = false
      or (a ? 'selected_answer') = false
  ) then
    raise exception 'invalid_answer_shape';
  end if;

  if exists (
    select 1
    from (
      select (a->>'question_id')::uuid as question_id
      from jsonb_array_elements(p_answers) a
    ) x
    group by question_id
    having count(*) > 1
  ) then
    raise exception 'duplicate_question';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) a
    where (a->>'selected_answer') not in ('A','B','C','D')
  ) then
    raise exception 'invalid_selected_answer';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) a
    where not exists (
      select 1
      from public.simulation_questions sq
      where sq.simulation_id = p_simulation_id
        and sq.question_id = (a->>'question_id')::uuid
    )
  ) then
    raise exception 'question_not_in_simulation';
  end if;

  delete from public.simulation_answers
  where attempt_id = v_attempt_id;

  insert into public.simulation_answers (
    attempt_id,
    question_id,
    selected_answer,
    is_correct
  )
  select
    v_attempt_id,
    (a->>'question_id')::uuid,
    a->>'selected_answer',
    false
  from jsonb_array_elements(p_answers) a;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'current_question', p_current_question,
    'time_left', p_time_left,
    'answered', jsonb_array_length(p_answers)
  );
end;
$function$;

revoke execute on function public.consume_api_rate_limit(text, integer, integer) from anon;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to authenticated;

revoke execute on function public.save_simulation_progress_atomic(uuid, integer, integer, jsonb) from anon;
grant execute on function public.save_simulation_progress_atomic(uuid, integer, integer, jsonb) to authenticated;
