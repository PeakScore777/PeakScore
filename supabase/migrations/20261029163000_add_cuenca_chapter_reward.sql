-- Award Cuenca de los Ecos chapter XP once per account, only for a perfect server-checked challenge.
create table if not exists public.learning_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_key text not null,
  xp_awarded integer not null check (xp_awarded > 0),
  claimed_at timestamptz not null default now(),
  primary key (user_id, reward_key),
  constraint learning_reward_claims_reward_key_check
    check (reward_key in ('cuenca-de-los-ecos:chapter-01'))
);

alter table public.learning_reward_claims enable row level security;
revoke all on public.learning_reward_claims from public, anon, authenticated;
grant select, insert, update, delete on public.learning_reward_claims to service_role;

create or replace function public.claim_cuenca_chapter_one_reward(p_answers text[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_claimed_user uuid;
  v_season_id uuid;
  v_old_xp integer;
  v_new_xp integer;
  v_old_season_xp integer;
  v_new_season_xp integer;
  v_level integer;
  v_reward integer := 50;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_answers is null
    or not (
      p_answers = array['C', 'B', 'B']::text[]
      or p_answers = array['C', 'B', 'C']::text[]
    )
  then
    raise exception 'CHAPTER_CHALLENGE_NOT_PERFECT';
  end if;

  perform public.ensure_current_user_season();

  insert into public.learning_reward_claims (user_id, reward_key, xp_awarded)
  values (v_user_id, 'cuenca-de-los-ecos:chapter-01', v_reward)
  on conflict (user_id, reward_key) do nothing
  returning user_id into v_claimed_user;

  if v_claimed_user is null then
    select coalesce(p.xp, 0), coalesce(us.season_xp, 0)
      into v_new_xp, v_new_season_xp
    from public.profiles p
    left join public.seasons s on s.status = 'active'
    left join public.user_seasons us on us.user_id = p.id and us.season_id = s.id
    where p.id = v_user_id
    order by s.season_number desc
    limit 1;

    return jsonb_build_object(
      'completed', true,
      'granted', false,
      'alreadyClaimed', true,
      'xpAwarded', 0,
      'xpTotal', coalesce(v_new_xp, 0),
      'seasonXp', coalesce(v_new_season_xp, 0)
    );
  end if;

  select id into v_season_id
  from public.seasons
  where status = 'active'
  order by season_number desc
  limit 1;

  if v_season_id is null then
    raise exception 'NO_ACTIVE_SEASON';
  end if;

  select coalesce(xp, 0) into v_old_xp
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select coalesce(season_xp, 0) into v_old_season_xp
  from public.user_seasons
  where user_id = v_user_id and season_id = v_season_id
  for update;

  if not found then
    raise exception 'SEASON_PARTICIPATION_NOT_FOUND';
  end if;

  v_new_xp := v_old_xp + v_reward;
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
      season_xp = coalesce(season_xp, 0) + v_reward,
      level = v_level
  where id = v_user_id;

  update public.user_seasons
  set season_xp = v_new_season_xp
  where user_id = v_user_id and season_id = v_season_id;

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

revoke all on function public.claim_cuenca_chapter_one_reward(text[]) from public, anon;
grant execute on function public.claim_cuenca_chapter_one_reward(text[]) to authenticated;
