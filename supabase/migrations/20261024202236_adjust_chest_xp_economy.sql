-- Sustainable progression: 5/10/15 XP per chest (30 XP total), preserving 3/5/7 Peak Coins.
-- One complete chest set per hour means at most 30 XP and 15 coins per hour from this game.
create or replace function public.claim_que_es_esa_vaina_chest(p_session_id uuid, p_chest_number integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.game_round_sessions%rowtype;
  v_state public.game_chest_reward_state%rowtype;
  v_score integer := 0;
  v_required integer;
  v_score_required integer;
  v_next_chest integer;
  v_xp integer;
  v_coins integer;
  v_claim_id uuid;
  v_event_id uuid;
  v_old_xp integer;
  v_new_xp integer;
  v_level integer;
  v_coins_total integer;
  v_claimed_count integer;
  v_replay boolean := false;
begin
  if v_user_id is null then raise exception 'UNAUTHORIZED'; end if;
  if p_chest_number not between 1 and 3 then raise exception 'INVALID_CHEST'; end if;

  insert into public.game_chest_reward_state(user_id, game_key)
  values (v_user_id, 'que-es-esa-vaina')
  on conflict (user_id, game_key) do nothing;

  select * into v_state
  from public.game_chest_reward_state
  where user_id = v_user_id and game_key = 'que-es-esa-vaina'
  for update;

  if v_state.cooldown_until is not null and v_state.cooldown_until > now() then
    raise exception 'CHEST_COOLDOWN:%', v_state.cooldown_until;
  end if;
  if v_state.cooldown_until is not null and v_state.cooldown_until <= now() then
    update public.game_chest_reward_state
    set cycle_number = cycle_number + 1, cycle_started_at = now(),
        cooldown_until = null, frozen_score = 0, updated_at = now()
    where user_id = v_user_id and game_key = 'que-es-esa-vaina'
    returning * into v_state;
  end if;

  select * into v_session
  from public.game_round_sessions
  where id = p_session_id and user_id = v_user_id and game_key = 'que-es-esa-vaina'
  for update;
  if not found or v_session.expires_at < now() then raise exception 'SESSION_INVALID_OR_EXPIRED'; end if;
  if v_session.created_at < v_state.cycle_started_at then raise exception 'SESSION_BEFORE_CYCLE'; end if;

  with recursive ordered_answers as (
    select row_number() over (order by a.answered_at, a.id) as rn, a.is_correct
    from public.game_round_answers a
    where a.session_id = p_session_id and a.user_id = v_user_id
  ), net_score as (
    select 0::bigint as rn, 0::bigint as score
    union all
    select a.rn, greatest(0::bigint, n.score + case when a.is_correct then 100 else -50 end)
    from net_score n join ordered_answers a on a.rn = n.rn + 1
  )
  select coalesce((select score from net_score order by rn desc limit 1), 0)::integer
  into v_score;

  v_required := case p_chest_number when 1 then 2 when 2 then 5 else 8 end;
  v_score_required := case p_chest_number when 1 then 200 when 2 then 500 else 800 end;
  if v_score < v_score_required then raise exception 'CHEST_LOCKED:%:%', v_score_required, v_score; end if;

  select min(s.n)::integer into v_next_chest
  from pg_catalog.generate_series(1, 3) as s(n)
  where not exists (
    select 1 from public.game_chest_cycle_claims c
    where c.user_id = v_user_id and c.game_key = 'que-es-esa-vaina'
      and c.cycle_number = v_state.cycle_number and c.chest_number = s.n
  );
  if v_next_chest is null then raise exception 'CHEST_SET_COMPLETE'; end if;
  if p_chest_number <> v_next_chest then raise exception 'CHEST_ORDER:%', v_next_chest; end if;

  v_replay := v_state.cycle_number = 1 and (
    exists (
      select 1 from public.gamification_events e
      where e.user_id = v_user_id and e.event_type = 'game_chest'
        and (
          e.reference_id in (
            'que-es-esa-vaina:' || p_chest_number::text,
            v_session.id::text || ':' || p_chest_number::text
          )
          or (
            e.metadata->>'game_key' = 'que-es-esa-vaina'
            and e.metadata->>'chest_number' = p_chest_number::text
          )
        )
    )
    or exists (
      select 1 from public.game_chest_claims c
      where c.user_id = v_user_id and c.game_key = 'que-es-esa-vaina'
        and c.chest_number = p_chest_number
    )
  );

  v_xp := case when v_replay then 0 else case p_chest_number when 1 then 5 when 2 then 10 else 15 end end;
  v_coins := case when v_replay then 0 else case p_chest_number when 1 then 3 when 2 then 5 else 7 end end;

  insert into public.game_chest_cycle_claims
    (user_id, session_id, game_key, cycle_number, chest_number, correct_required,
     score_required, score_at_claim, xp_awarded, coins_awarded, reward_granted)
  values
    (v_user_id, p_session_id, 'que-es-esa-vaina', v_state.cycle_number, p_chest_number,
     v_required, v_score_required, v_score, v_xp, v_coins, not v_replay)
  on conflict (user_id, game_key, cycle_number, chest_number) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
    return jsonb_build_object('claimed', false, 'alreadyClaimed', true, 'xpAwarded', 0, 'coinsAwarded', 0,
      'cycleNumber', v_state.cycle_number, 'cooldownUntil', v_state.cooldown_until, 'frozenScore', v_state.frozen_score);
  end if;

  if not v_replay then
    insert into public.gamification_events(user_id, event_type, reference_id, xp_awarded, coins_awarded, metadata)
    values (v_user_id, 'game_chest',
      'que-es-esa-vaina:cycle:' || v_state.cycle_number::text || ':chest:' || p_chest_number::text,
      v_xp, v_coins, jsonb_build_object('game_key','que-es-esa-vaina','chest_number',p_chest_number,
        'cycle_number',v_state.cycle_number,'score_required',v_score_required))
    on conflict (user_id, event_type, reference_id) do nothing
    returning id into v_event_id;
    if v_event_id is null then
      delete from public.game_chest_cycle_claims where id = v_claim_id;
      return jsonb_build_object('claimed', false, 'alreadyClaimed', true, 'xpAwarded', 0, 'coinsAwarded', 0,
        'cycleNumber', v_state.cycle_number, 'cooldownUntil', v_state.cooldown_until, 'frozenScore', v_state.frozen_score);
    end if;

    select xp into v_old_xp from public.profiles where id = v_user_id for update;
    if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
    v_new_xp := coalesce(v_old_xp, 0) + v_xp;
    select l.level into v_level from public.levels l where l.xp_required <= v_new_xp order by l.level desc limit 1;
    v_level := coalesce(v_level, 1);
    perform pg_catalog.set_config('peakscore.internal_operation', 'grant_gamification_reward', true);
    update public.profiles set xp = v_new_xp, season_xp = coalesce(season_xp, 0) + v_xp,
      coins = coalesce(coins, 0) + v_coins, level = v_level
    where id = v_user_id;
  end if;

  select xp, coins into v_new_xp, v_coins_total from public.profiles where id = v_user_id;
  select count(*)::integer into v_claimed_count
  from public.game_chest_cycle_claims c
  where c.user_id = v_user_id and c.game_key = 'que-es-esa-vaina'
    and c.cycle_number = v_state.cycle_number;

  if v_claimed_count >= 3 then
    update public.game_chest_reward_state
    set cooldown_until = now() + interval '1 hour', frozen_score = v_score, updated_at = now()
    where user_id = v_user_id and game_key = 'que-es-esa-vaina'
    returning * into v_state;
  end if;

  return jsonb_build_object('claimed', true, 'alreadyClaimed', v_replay, 'replay', v_replay,
    'chestNumber', p_chest_number, 'xpAwarded', v_xp, 'coinsAwarded', v_coins,
    'xpTotal', coalesce(v_new_xp, 0), 'coinsTotal', coalesce(v_coins_total, 0),
    'cycleNumber', v_state.cycle_number, 'cooldownUntil', v_state.cooldown_until,
    'frozenScore', v_state.frozen_score, 'scoreRequired', v_score_required, 'score', v_score);
end;
$function$;
