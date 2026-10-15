-- Extend the atomic finish RPC to accept A-G only for English Part 2.
-- All other questions remain restricted to A-D.
do $migration$
declare
  v_definition text;
  v_old text := $old$and upper(trim(a.selected_answer)) not in ('A','B','C','D')$old$;
  v_new text := $new$and (
        (exists (select 1 from public.questions q where q.id = a.question_id and q.english_part = 2)
          and upper(trim(a.selected_answer)) not in ('A','B','C','D','E','F','G'))
        or
        (not exists (select 1 from public.questions q where q.id = a.question_id and q.english_part = 2)
          and upper(trim(a.selected_answer)) not in ('A','B','C','D'))
      )$new$;
begin
  select pg_get_functiondef('public.finish_simulation_atomic(uuid,uuid,jsonb)'::regprocedure)
    into v_definition;
  if position(v_old in v_definition) = 0 then
    raise exception 'Could not locate expected answer validation in finish_simulation_atomic; no change applied';
  end if;
  v_definition := replace(v_definition, v_old, v_new);
  execute v_definition;
end
$migration$;
