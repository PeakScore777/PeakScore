create or replace function public.complete_archivo_oculto_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.game_round_sessions%rowtype;
  v_answered integer := 0;
  v_correct integer := 0;
  v_total integer := 0;
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

  v_total := cardinality(v_session.question_ids);
  if v_total not in (5, 10) then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  select
    count(*),
    count(*) filter (where is_correct = true)
    into v_answered, v_correct
    from public.game_round_answers
   where session_id = p_session_id
     and user_id = v_user_id;

  if v_answered <> v_total then
    raise exception 'SESSION_INCOMPLETE';
  end if;

  v_score := round((v_correct::numeric * 1000) / v_total)::integer;
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
    'totalQuestions', v_total,
    'score', v_score,
    'progress', jsonb_build_object(
      'best_score', coalesce(v_best_score, 0),
      'best_correct', coalesce(v_best_correct, 0),
      'games_completed', coalesce(v_games_completed, 0)
    )
  );
end;
$function$;

create or replace function public.claim_archivo_oculto_reward(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.game_round_sessions%rowtype;
  v_answered integer := 0;
  v_correct integer := 0;
  v_total integer := 0;
  v_required_correct integer := 0;
  v_event_id uuid;
  v_old_xp integer;
  v_new_xp integer;
  v_level integer;
  v_coins_total integer;
  v_xp constant integer := 25;
  v_coins constant integer := 10;
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

  v_total := cardinality(v_session.question_ids);
  if v_total not in (5, 10) then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  select
    count(*),
    count(*) filter (where is_correct = true)
    into v_answered, v_correct
    from public.game_round_answers
   where session_id = p_session_id
     and user_id = v_user_id;

  if v_answered <> v_total then
    raise exception 'SESSION_INCOMPLETE';
  end if;

  v_required_correct := ceil(v_total * 0.7)::integer;
  if v_correct < v_required_correct then
    return jsonb_build_object(
      'claimed', false,
      'eligible', false,
      'alreadyClaimed', false,
      'correct', v_correct,
      'totalQuestions', v_total,
      'requiredCorrect', v_required_correct,
      'xpAwarded', 0,
      'coinsAwarded', 0
    );
  end if;

  insert into public.gamification_events (
    user_id, event_type, reference_id, xp_awarded, coins_awarded, metadata
  )
  values (
    v_user_id,
    'game_reading',
    'archivo-oculto:expediente-001',
    v_xp,
    v_coins,
    jsonb_build_object(
      'game_key', 'archivo-oculto',
      'expedition', '001',
      'correct_answers', v_correct,
      'total_questions', v_total
    )
  )
  on conflict (user_id, event_type, reference_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object(
      'claimed', false,
      'eligible', true,
      'alreadyClaimed', true,
      'correct', v_correct,
      'totalQuestions', v_total,
      'requiredCorrect', v_required_correct,
      'xpAwarded', 0,
      'coinsAwarded', 0
    );
  end if;

  select xp
    into v_old_xp
    from public.profiles
   where id = v_user_id
   for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_new_xp := coalesce(v_old_xp, 0) + v_xp;

  select level
    into v_level
    from public.levels
   where xp_required <= v_new_xp
   order by level desc
   limit 1;

  v_level := coalesce(v_level, 1);

  perform pg_catalog.set_config(
    'peakscore.internal_operation',
    'grant_gamification_reward',
    true
  );

  update public.profiles
     set xp = v_new_xp,
         season_xp = coalesce(season_xp, 0) + v_xp,
         coins = coalesce(coins, 0) + v_coins,
         level = v_level
   where id = v_user_id
   returning coins into v_coins_total;

  return jsonb_build_object(
    'claimed', true,
    'eligible', true,
    'alreadyClaimed', false,
    'correct', v_correct,
    'totalQuestions', v_total,
    'requiredCorrect', v_required_correct,
    'xpAwarded', v_xp,
    'coinsAwarded', v_coins,
    'xpTotal', v_new_xp,
    'coinsTotal', v_coins_total
  );
end;
$function$;
