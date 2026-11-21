DO $migration$
DECLARE
  v_definition text;
  v_old text := $old$
  if exists (
    select 1
    from jsonb_to_recordset(p_answers)
      as a(question_id uuid, selected_answer text)
    where a.selected_answer is not null
      and (
        (exists (select 1 from public.questions q where q.id = a.question_id and q.english_part = 2)
          and upper(trim(a.selected_answer)) not in ('A','B','C','D','E','F','G'))
        or
        (not exists (select 1 from public.questions q where q.id = a.question_id and q.english_part = 2)
          and upper(trim(a.selected_answer)) not in ('A','B','C','D'))
      )
  ) then
    raise exception 'INVALID_ANSWERS';
  end if;
$old$;
  v_new text := $new$
  if exists (
    select 1
    from jsonb_to_recordset(p_answers)
      as a(question_id uuid, selected_answer text)
    join public.questions q on q.id = a.question_id
    where a.selected_answer is not null
      and (
        (q.english_part = 1 and upper(trim(a.selected_answer)) not in ('A','B','C','D','E','F','G'))
        or (q.english_part = 2 and upper(trim(a.selected_answer)) not in ('A','B','C'))
        or (q.english_part in (3,4,5) and upper(trim(a.selected_answer)) not in ('A','B','C'))
        or (q.english_part in (6,7) and upper(trim(a.selected_answer)) not in ('A','B','C','D'))
        or (q.english_part is null and upper(trim(a.selected_answer)) not in ('A','B','C','D'))
      )
  ) then
    raise exception 'INVALID_ANSWERS';
  end if;
$new$;
BEGIN
  v_definition := pg_get_functiondef('public.finish_simulation_atomic(uuid,uuid,jsonb)'::regprocedure);
  IF position(v_old in v_definition) = 0 THEN
    RAISE EXCEPTION 'Expected answer-validation block not found; migration aborted without changes';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);
  EXECUTE v_definition;
END
$migration$;
