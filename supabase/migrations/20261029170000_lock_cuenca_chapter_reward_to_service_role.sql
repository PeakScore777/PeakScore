-- Keep the one-time Cuenca XP grant behind the authenticated server route.
drop function if exists public.claim_cuenca_chapter_one_reward(text[]);

create or replace function public.claim_cuenca_chapter_one_reward(
  p_user_id uuid,
  p_answers text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_claimed_user uuid;
  v_season_id uuid;
  v_old_xp integer;
  v_new_xp integer;
  v_old_profile_season_xp integer;
  v_new_profile_season_xp integer;
  v_old_season_xp integer;
  v_new_season_xp integer;
  v_level integer;
  v_reward integer := 50;
begin
  if p_user_id is null then
    raise exception 'USER_REQUIRED';
  end if;

  if p_answers is null
    or not (
      p_answers = array['C', 'B', 'B']::text[]
      or p_answers = array['C', 'B', 'C']::text[]
    )
  then
    raise exception 'CHAPTER_CHALLENGE_NOT_PERFECT';
  end if;

  select s.id into v_season_id
  from public.seasons s
  where s.status = 'active'
  order by s.season_number desc
  limit 1;

  if v_season_id is null then
    raise exception 'NO_ACTIVE_SEASON';
  end if;

  select coalesce(us.season_xp, 0) into v_old_season_xp
  from public.user_seasons us
  where us.user_id = p_user_id and us.season_id = v_season_id
  for update;

  if not found then
    raise exception 'SEASON_PARTICIPATION_NOT_FOUND';
  end if;

  insert into public.learning_reward_claims (user_id, reward_key, xp_awarded)
  values (p_user_id, 'cuenca-de-los-ecos:chapter-01', v_reward)
  on conflict (user_id, reward_key) do nothing
  returning user_id into v_claimed_user;

  if v_claimed_user is null then
    select coalesce(p.xp, 0), coalesce(p.season_xp, 0)
      into v_new_xp, v_new_profile_season_xp
    from public.profiles p
    where p.id = p_user_id;

    return jsonb_build_object(
      'completed', true,
      'granted', false,
      'alreadyClaimed', true,
      'xpAwarded', 0,
      'xpTotal', coalesce(v_new_xp, 0),
      'seasonXp', v_old_season_xp
    );
  end if;

  select coalesce(p.xp, 0), coalesce(p.season_xp, 0)
    into v_old_xp, v_old_profile_season_xp
  from public.profiles p
  where p.id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_new_xp := v_old_xp + v_reward;
  v_new_profile_season_xp := v_old_profile_season_xp + v_reward;
  v_new_season_xp := v_old_season_xp + v_reward;

  select l.level into v_level
  from public.levels l
  where l.xp_required <= v_new_xp
  order by l.level desc
  limit 1;
  v_level := coalesce(v_level, 1);

  perform pg_catalog.set_config('peakscore.internal_operation', 'grant_gamification_reward', true);

  update public.profiles
  set xp = v_new_xp,
      season_xp = v_new_profile_season_xp,
      level = v_level
  where id = p_user_id;

  update public.user_seasons
  set season_xp = v_new_season_xp
  where user_id = p_user_id and season_id = v_season_id;

  return jsonb_build_object(
    'completed', true,
    'granted', true,
    'alreadyClaimed', false,
    'xpAwarded', v_reward,
    'xpTotal', v_new_xp,
    'seasonXp', v_new_season_xp
  );
end;
$function$;

revoke all on function public.claim_cuenca_chapter_one_reward(uuid, text[]) from public, anon, authenticated;
grant execute on function public.claim_cuenca_chapter_one_reward(uuid, text[]) to service_role;
