create or replace function public.update_user_streak()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_last_login date;
  v_streak integer;
  v_new_streak integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select streak, last_login_date
    into v_streak, v_last_login
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  v_streak := coalesce(v_streak, 0);

  if v_last_login = v_today then
    return v_streak;
  elsif v_last_login = v_today - 1 then
    v_new_streak := v_streak + 1;
  else
    v_new_streak := 1;
  end if;

  update public.profiles
  set streak = v_new_streak,
      last_login_date = v_today
  where id = v_user_id;

  return v_new_streak;
end;
$$;

revoke execute on function public.update_user_streak() from public, anon;
grant execute on function public.update_user_streak() to authenticated;

create or replace function public.get_subject_performance_for_attempts(
  p_attempt_ids uuid[]
)
returns table (
  subject text,
  total bigint,
  correct bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invalid_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_attempt_ids is null or cardinality(p_attempt_ids) = 0 then
    return;
  end if;

  select count(*)
    into v_invalid_count
  from unnest(p_attempt_ids) as requested(id)
  where not exists (
    select 1
    from public.simulation_attempts a
    where a.id = requested.id
      and a.user_id = v_user_id
  );

  if v_invalid_count > 0 then
    raise exception 'attempt_not_owned';
  end if;

  return query
  select
    q.subject::text,
    count(*)::bigint as total,
    count(*) filter (where sa.is_correct = true)::bigint as correct
  from public.simulation_answers sa
  join public.simulation_attempts a
    on a.id = sa.attempt_id
  join public.questions q
    on q.id = sa.question_id
  where a.id = any(p_attempt_ids)
    and a.user_id = v_user_id
    and a.completed_at is not null
  group by q.subject;
end;
$$;

revoke execute on function public.get_subject_performance_for_attempts(uuid[]) from public, anon;
grant execute on function public.get_subject_performance_for_attempts(uuid[]) to authenticated;
