-- Format-aware answer validation for English question formats.
-- Preserves the original ownership, attempt-locking, completeness and scoring logic.
-- This migration must run after 20261014180000_add_english_assessment_contract.

CREATE OR REPLACE FUNCTION public.save_simulation_progress_atomic(p_simulation_id uuid, p_current_question integer, p_time_left integer, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    where (a->>'selected_answer') is not null
      and not exists (
        select 1
        from public.questions q
        left join public.question_stimuli st on st.id = q.stimulus_id
        where q.id = (a->>'question_id')::uuid
          and (
            (
              coalesce(q.options_json, st.options_json) is null
              and upper(trim(a->>'selected_answer')) in ('A','B','C','D')
            )
            or exists (
              select 1
              from jsonb_array_elements(
                coalesce(q.options_json, st.options_json, '[]'::jsonb)
              ) opt
              where upper(trim(opt->>'key')) = upper(trim(a->>'selected_answer'))
            )
          )
      )
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
$function$
;

CREATE OR REPLACE FUNCTION public.finish_simulation_atomic(p_simulation_id uuid, p_attempt_id uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_attempt_id uuid := p_attempt_id;
  v_started_at timestamptz;
  v_completed_at timestamptz := now();
  v_answer_count integer;
  v_distinct_count integer;
  v_valid_relation_count integer;
  v_correct integer;
  v_incorrect integer;
  v_unanswered integer;
  v_percentage integer;
  v_rewards jsonb;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if p_simulation_id is null or p_answers is null
     or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'INVALID_PAYLOAD';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_simulation_id::text, 0)
  );

  select total_questions
    into v_total
  from public.simulations
  where id = p_simulation_id
    and created_by = v_user_id
  for update;

  if v_total is null or v_total < 1 then
    raise exception 'SIMULATION_NOT_FOUND';
  end if;

  if p_attempt_id is null then
    select id
      into v_attempt_id
    from public.simulation_attempts
    where user_id = v_user_id
      and simulation_id = p_simulation_id
      and completed_at is null
    order by started_at desc
    limit 1
    for update;

    if v_attempt_id is null then
      v_started_at := v_completed_at;

      insert into public.simulation_attempts (
        user_id, simulation_id, started_at, completed_at,
        total_questions, score, correct_answers, incorrect_answers, unanswered_answers
      )
      values (
        v_user_id, p_simulation_id, v_started_at, null,
        v_total, 0, 0, 0, 0
      )
      returning id into v_attempt_id;
    end if;
  else
    select id, started_at
      into v_attempt_id, v_started_at
    from public.simulation_attempts
    where id = p_attempt_id
      and user_id = v_user_id
      and simulation_id = p_simulation_id
      and completed_at is null
    for update;

    if v_attempt_id is null then
      raise exception 'ATTEMPT_NOT_OPEN';
    end if;
  end if;

  select count(*), count(distinct question_id)
    into v_answer_count, v_distinct_count
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text);

  if v_answer_count <> v_total or v_distinct_count <> v_total then
    raise exception 'INVALID_ANSWERS';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers)
      as a(question_id uuid, selected_answer text)
    where a.selected_answer is not null
      and not exists (
        select 1
        from public.questions q
        left join public.question_stimuli st on st.id = q.stimulus_id
        where q.id = a.question_id
          and (
            (
              coalesce(q.options_json, st.options_json) is null
              and upper(trim(a.selected_answer)) in ('A','B','C','D')
            )
            or exists (
              select 1
              from jsonb_array_elements(
                coalesce(q.options_json, st.options_json, '[]'::jsonb)
              ) opt
              where upper(trim(opt->>'key')) = upper(trim(a.selected_answer))
            )
          )
      )
  ) then
    raise exception 'INVALID_ANSWERS';
  end if;

  select count(*)
    into v_valid_relation_count
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text)
  join public.simulation_questions sq
    on sq.simulation_id = p_simulation_id
   and sq.question_id = a.question_id;

  if v_valid_relation_count <> v_total then
    raise exception 'INVALID_ANSWERS';
  end if;

  -- Part 1 is a matching task: a word from the shared A-G bank cannot be
  -- assigned to more than one description in the same stimulus set.
  if exists (
    select 1
    from jsonb_to_recordset(p_answers)
      as a(question_id uuid, selected_answer text)
    join public.simulation_questions sq
      on sq.simulation_id = p_simulation_id
     and sq.question_id = a.question_id
    join public.questions q
      on q.id = a.question_id
    where q.english_part = 1
      and q.stimulus_id is not null
      and a.selected_answer is not null
    group by q.stimulus_id, upper(trim(a.selected_answer))
    having count(*) > 1
  ) then
    raise exception 'DUPLICATE_ENGLISH_MATCHING_ANSWER';
  end if;

  select
    count(*) filter (
      where a.selected_answer is not null
        and upper(trim(a.selected_answer)) = upper(trim(q.correct_answer))
    ),
    count(*) filter (
      where a.selected_answer is not null
        and upper(trim(a.selected_answer)) <> upper(trim(q.correct_answer))
    ),
    count(*) filter (where a.selected_answer is null)
  into v_correct, v_incorrect, v_unanswered
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text)
  join public.simulation_questions sq
    on sq.simulation_id = p_simulation_id
   and sq.question_id = a.question_id
  join public.questions q
    on q.id = a.question_id;

  if (v_correct + v_incorrect + v_unanswered) <> v_total then
    raise exception 'QUESTIONS_NOT_AVAILABLE';
  end if;

  v_percentage := round((v_correct::numeric / v_total::numeric) * 100);

  delete from public.simulation_answers
  where attempt_id = v_attempt_id;

  insert into public.simulation_answers (
    attempt_id, question_id, selected_answer, is_correct, answered_at
  )
  select
    v_attempt_id,
    a.question_id,
    upper(trim(a.selected_answer)),
    (
      a.selected_answer is not null
      and upper(trim(a.selected_answer)) = upper(trim(q.correct_answer))
    ),
    v_completed_at
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text)
  join public.questions q on q.id = a.question_id
  where a.selected_answer is not null;

  update public.simulation_attempts
  set completed_at = v_completed_at,
      score = v_percentage,
      correct_answers = v_correct,
      incorrect_answers = v_incorrect,
      unanswered_answers = v_unanswered
  where id = v_attempt_id
    and user_id = v_user_id
    and simulation_id = p_simulation_id
    and completed_at is null;

  if not found then
    raise exception 'ATTEMPT_ALREADY_FINISHED';
  end if;

  v_rewards := public.grant_simulation_rewards(
    v_user_id,
    p_simulation_id,
    v_attempt_id,
    v_percentage
  );

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'correctAnswers', v_correct,
    'incorrectAnswers', v_incorrect,
    'unansweredAnswers', v_unanswered,
    'totalQuestions', v_total,
    'percentage', v_percentage,
    'rewards', v_rewards
  );
end;
$function$
;
