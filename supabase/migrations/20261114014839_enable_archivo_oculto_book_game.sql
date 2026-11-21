-- El Archivo Oculto: habilita sesiones y progreso propios del libro interactivo.
-- Se preservan las claves vigentes de los juegos ya existentes.
alter table public.game_progress
  drop constraint if exists game_progress_game_key_check;

alter table public.game_progress
  add constraint game_progress_game_key_check
  check (game_key in ('que-es-esa-vaina', 'caso-cero', 'archivo-oculto'));

alter table public.game_round_sessions
  drop constraint if exists game_round_sessions_game_key_check;

alter table public.game_round_sessions
  add constraint game_round_sessions_game_key_check
  check (game_key in ('que-es-esa-vaina', 'caso-cero', 'archivo-oculto'));

create index if not exists game_round_sessions_user_game_created_idx
  on public.game_round_sessions(user_id, game_key, created_at desc);

-- Una sola recompensa especial de apertura por cuenta para el Expediente 001.
-- Las respuestas y el mínimo de aciertos se comprueban en Postgres.
create or replace function public.claim_archivo_oculto_reward(p_session_id uuid)
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

  select
    count(*),
    count(*) filter (where is_correct = true)
    into v_answered, v_correct
    from public.game_round_answers
   where session_id = p_session_id
     and user_id = v_user_id;

  if v_answered <> 10 then
    raise exception 'SESSION_INCOMPLETE';
  end if;

  if v_correct < 7 then
    return jsonb_build_object(
      'claimed', false,
      'eligible', false,
      'alreadyClaimed', false,
      'correct', v_correct,
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
      'total_questions', 10
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
    'xpAwarded', v_xp,
    'coinsAwarded', v_coins,
    'xpTotal', v_new_xp,
    'coinsTotal', v_coins_total
  );
end;
$function$;

revoke all on function public.claim_archivo_oculto_reward(uuid) from public, anon;
grant execute on function public.claim_archivo_oculto_reward(uuid) to authenticated;
