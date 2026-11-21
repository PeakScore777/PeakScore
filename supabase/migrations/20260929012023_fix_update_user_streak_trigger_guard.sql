create or replace function public.prevent_profile_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.id <> old.id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at
     or new.average_score is distinct from old.average_score
     or new.streak is distinct from old.streak
     or new.simulations is distinct from old.simulations
     or new.target_score is distinct from old.target_score then

    if auth.uid() = old.id
       and coalesce(
         current_setting('peakscore.internal_operation', true),
         ''
       ) <> 'update_user_streak' then
      raise exception 'No tienes permiso para modificar campos protegidos del perfil';
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.update_user_streak()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
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

  perform set_config(
    'peakscore.internal_operation',
    'update_user_streak',
    true
  );

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
$function$;
