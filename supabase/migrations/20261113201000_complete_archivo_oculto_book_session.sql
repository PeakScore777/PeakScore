-- Cierre atómico de partidas de El Archivo Oculto.
-- El servidor calcula resultados desde game_round_answers y evita duplicar sesiones cerradas.
alter table public.game_round_sessions
  add column if not exists completed_at timestamptz;

create or replace function public.complete_archivo_oculto_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.game_round_sessions%rowtype;
  v_answered integer := 0;
  v_correct integer := 0;
  v_score integer := 0;
  v_best_score integer := 0;
  v_best_correct integer := 0;
  v_games_completed integer := 0;
  v_already_completed boolean := false;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_session_id is null then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  select *
    into v_session
    from public.game_round_sessions
   where id = p_session_id
     and user_id = v_user_id
     and game_key = 'archivo-oculto'
   for update;

  if not found or v_session.expires_at < now() then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  select
    count(*),
    count(*) filter (where is_correct = true)
    into v_answered, v_correct
    from public.game_round_answers
   where session_id = p_session_id
     and user_id = v_user_id;

  if v_answered <> 10 or cardinality(v_session.question_ids) <> 10 then
    raise exception 'SESSION_INCOMPLETE';
  end if;

  v_score := v_correct * 100;
  v_already_completed := v_session.completed_at is not null;

  if not v_already_completed then
    update public.game_round_sessions
       set completed_at = now()
     where id = p_session_id
       and user_id = v_user_id
       and game_key = 'archivo-oculto';

    insert into public.game_progress (
      user_id, game_key, best_score, best_correct, games_completed, updated_at
    )
    values (
      v_user_id, 'archivo-oculto', v_score, v_correct, 1, now()
    )
    on conflict (user_id, game_key) do update
      set best_score = greatest(game_progress.best_score, excluded.best_score),
          best_correct = greatest(game_progress.best_correct, excluded.best_correct),
          games_completed = game_progress.games_completed + 1,
          updated_at = now();
  end if;

  select best_score, best_correct, games_completed
    into v_best_score, v_best_correct, v_games_completed
    from public.game_progress
   where user_id = v_user_id
     and game_key = 'archivo-oculto';

  return jsonb_build_object(
    'completed', true,
    'alreadyCompleted', v_already_completed,
    'correct', v_correct,
    'score', v_score,
    'progress', jsonb_build_object(
      'best_score', coalesce(v_best_score, 0),
      'best_correct', coalesce(v_best_correct, 0),
      'games_completed', coalesce(v_games_completed, 0)
    )
  );
end;
$function$;

revoke all on function public.complete_archivo_oculto_session(uuid) from public, anon;
grant execute on function public.complete_archivo_oculto_session(uuid) to authenticated;
