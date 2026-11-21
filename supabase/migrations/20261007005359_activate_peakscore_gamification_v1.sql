-- PeakScore: gamificación funcional v1
-- Aditivo: no elimina ni reinicia datos existentes.

create table if not exists public.levels (
  level integer primary key,
  xp_required integer not null unique check (xp_required >= 0)
);

insert into public.levels (level, xp_required) values
  (1, 0),
  (2, 100),
  (3, 250),
  (4, 450),
  (5, 700),
  (6, 1000),
  (7, 1350),
  (8, 1750),
  (9, 2200),
  (10, 2700),
  (11, 3250),
  (12, 3850),
  (13, 4500),
  (14, 5200),
  (15, 5950),
  (16, 6750),
  (17, 7600),
  (18, 8500),
  (19, 9450),
  (20, 10450),
  (21, 11500),
  (22, 12600),
  (23, 13800),
  (24, 15100),
  (25, 16500)
on conflict (level) do update
set xp_required = excluded.xp_required;

create table if not exists public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  reference_id text not null,
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  coins_awarded integer not null default 0 check (coins_awarded >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, reference_id)
);

create index if not exists gamification_events_user_created_idx
  on public.gamification_events (user_id, created_at desc);

alter table public.levels enable row level security;
alter table public.gamification_events enable row level security;

drop policy if exists levels_select_authenticated on public.levels;
create policy levels_select_authenticated
  on public.levels
  for select
  to authenticated
  using (true);

drop policy if exists gamification_events_select_own on public.gamification_events;
create policy gamification_events_select_own
  on public.gamification_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- Protege también los campos de economía/progreso frente a escrituras directas.
create or replace function public.prevent_profile_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.id <> old.id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at
     or new.average_score is distinct from old.average_score
     or new.streak is distinct from old.streak
     or new.simulations is distinct from old.simulations
     or new.target_score is distinct from old.target_score
     or new.xp is distinct from old.xp
     or new.coins is distinct from old.coins
     or new.level is distinct from old.level
     or new.selected_character is distinct from old.selected_character then

    if auth.uid() = old.id
       and coalesce(current_setting('peakscore.internal_operation', true), '') in (
         'update_user_streak',
         'grant_gamification_reward',
         'purchase_character',
         'equip_character'
       ) then
      return new;
    end if;

    if auth.uid() = old.id then
      raise exception 'No tienes permiso para modificar campos protegidos del perfil';
    end if;
  end if;

  return new;
end;
$function$;

-- Comprar personajes exclusivamente mediante una operación server-side segura.
create or replace function public.purchase_character(p_character_id text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_price integer;
  v_coins integer;
  v_name text;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if p_character_id is null or length(trim(p_character_id)) = 0 then
    raise exception 'INVALID_CHARACTER';
  end if;

  perform 1
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select price_coins, name
    into v_price, v_name
  from public.characters
  where id = p_character_id
    and is_active = true;

  if v_price is null then
    raise exception 'CHARACTER_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.user_characters
    where user_id = v_user_id
      and character_id = p_character_id
  ) then
    raise exception 'CHARACTER_ALREADY_OWNED';
  end if;

  select coins into v_coins
  from public.profiles
  where id = v_user_id
  for update;

  if v_coins < v_price then
    raise exception 'INSUFFICIENT_COINS';
  end if;

  perform set_config('peakscore.internal_operation', 'purchase_character', true);

  update public.profiles
  set coins = coins - v_price
  where id = v_user_id;

  insert into public.user_characters (user_id, character_id)
  values (v_user_id, p_character_id);

  return jsonb_build_object(
    'characterId', p_character_id,
    'characterName', v_name,
    'spentCoins', v_price,
    'remainingCoins', v_coins - v_price
  );
end;
$function$;

-- Equipar un personaje solo si el usuario realmente lo posee.
create or replace function public.equip_character(p_character_id text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if not exists (
    select 1
    from public.user_characters
    where user_id = v_user_id
      and character_id = p_character_id
  ) then
    raise exception 'CHARACTER_NOT_OWNED';
  end if;

  perform set_config('peakscore.internal_operation', 'equip_character', true);

  update public.profiles
  set selected_character = p_character_id
  where id = v_user_id;

  return jsonb_build_object(
    'selectedCharacter', p_character_id
  );
end;
$function$;

-- Recompensas de simulacros. Esta función es la base que después reutilizaremos
-- para niveles de aprendizaje, desafíos diarios y otras actividades.
create or replace function public.grant_simulation_rewards(
  p_user_id uuid,
  p_simulation_id uuid,
  p_attempt_id uuid,
  p_score integer
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_type text;
  v_total integer;
  v_base_xp integer := 0;
  v_base_coins integer := 0;
  v_xp_bonus integer := 0;
  v_coin_bonus integer := 0;
  v_xp integer := 0;
  v_coins integer := 0;
  v_old_xp integer := 0;
  v_new_xp integer := 0;
  v_old_level integer := 1;
  v_new_level integer := 1;
  v_selected_character text;
  v_event_id uuid;
  v_simple_count integer := 0;
  v_complete_count integer := 0;
  v_total_count integer := 0;
  v_perfect_complete_count integer := 0;
  v_badge record;
begin
  if p_user_id is null or p_attempt_id is null or p_simulation_id is null then
    raise exception 'INVALID_REWARD_CONTEXT';
  end if;

  select type, total_questions
    into v_type, v_total
  from public.simulations
  where id = p_simulation_id
    and created_by = p_user_id;

  if v_type is null then
    raise exception 'SIMULATION_NOT_FOUND';
  end if;

  -- Simple: custom_simulation. Completo: icfes_simulation.
  if v_type = 'custom_simulation' then
    v_base_xp := case v_total
      when 5 then 25
      when 10 then 40
      when 25 then 70
      when 50 then 100
      else greatest(25, least(150, v_total * 2))
    end;
    v_base_coins := 0;
  elsif v_type = 'icfes_simulation' then
    v_base_xp := 250;
    v_base_coins := 100;
  else
    -- Los tipos futuros no reciben recompensa accidentalmente.
    v_base_xp := 0;
    v_base_coins := 0;
  end if;

  select selected_character
    into v_selected_character
  from public.profiles
  where id = p_user_id
  for update;

  if v_selected_character is not null then
    select xp_bonus_percent, coin_bonus_percent
      into v_xp_bonus, v_coin_bonus
    from public.characters
    where id = v_selected_character
      and is_active = true;
  end if;

  v_xp := floor(v_base_xp * (100 + coalesce(v_xp_bonus, 0)) / 100.0);
  v_coins := floor(v_base_coins * (100 + coalesce(v_coin_bonus, 0)) / 100.0);

  insert into public.gamification_events (
    user_id, event_type, reference_id, xp_awarded, coins_awarded, metadata
  )
  values (
    p_user_id,
    'simulation',
    p_attempt_id::text,
    v_xp,
    v_coins,
    jsonb_build_object(
      'simulation_id', p_simulation_id,
      'simulation_type', v_type,
      'score', p_score,
      'character_id', v_selected_character
    )
  )
  on conflict (user_id, event_type, reference_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object(
      'xpAwarded', 0,
      'coinsAwarded', 0,
      'level', (select level from public.profiles where id = p_user_id),
      'alreadyRewarded', true
    );
  end if;

  select xp, level
    into v_old_xp, v_old_level
  from public.profiles
  where id = p_user_id
  for update;

  v_new_xp := v_old_xp + v_xp;

  select level
    into v_new_level
  from public.levels
  where xp_required <= v_new_xp
  order by level desc
  limit 1;

  v_new_level := coalesce(v_new_level, 1);

  perform set_config('peakscore.internal_operation', 'grant_gamification_reward', true);

  update public.profiles
  set xp = v_new_xp,
      coins = coins + v_coins,
      level = v_new_level,
      simulations = simulations + 1,
      average_score = coalesce((
        select round(avg(sa.score))::integer
        from public.simulation_attempts sa
        where sa.user_id = p_user_id
          and sa.completed_at is not null
      ), average_score)
  where id = p_user_id;

  -- Evaluamos insignias después de la simulación completada.
  select count(*) into v_total_count
  from public.simulation_attempts sa
  join public.simulations s on s.id = sa.simulation_id
  where sa.user_id = p_user_id
    and sa.completed_at is not null;

  select count(*) into v_simple_count
  from public.simulation_attempts sa
  join public.simulations s on s.id = sa.simulation_id
  where sa.user_id = p_user_id
    and sa.completed_at is not null
    and s.type = 'custom_simulation';

  select count(*) into v_complete_count
  from public.simulation_attempts sa
  join public.simulations s on s.id = sa.simulation_id
  where sa.user_id = p_user_id
    and sa.completed_at is not null
    and s.type = 'icfes_simulation';

  select count(*) into v_perfect_complete_count
  from public.simulation_attempts sa
  join public.simulations s on s.id = sa.simulation_id
  where sa.user_id = p_user_id
    and sa.completed_at is not null
    and s.type = 'icfes_simulation'
    and sa.score = 100;

  for v_badge in
    select id, requirement_type, requirement_target
    from public.badges
  loop
    if exists (
      select 1 from public.user_badges ub
      where ub.user_id = p_user_id
        and ub.badge_id = v_badge.id
    ) then
      continue;
    end if;

    if (
      (v_badge.requirement_type = 'simulations_completed' and v_total_count >= v_badge.requirement_target)
      or
      (v_badge.requirement_type = 'simple_completed' and v_simple_count >= v_badge.requirement_target)
      or
      (v_badge.requirement_type = 'complete_completed' and v_complete_count >= v_badge.requirement_target)
      or
      (v_badge.requirement_type = 'perfect_complete' and v_perfect_complete_count >= v_badge.requirement_target)
    ) then
      insert into public.user_badges (user_id, badge_id)
      values (p_user_id, v_badge.id)
      on conflict do nothing;
    end if;
  end loop;

  return jsonb_build_object(
    'xpAwarded', v_xp,
    'coinsAwarded', v_coins,
    'oldXp', v_old_xp,
    'newXp', v_new_xp,
    'oldLevel', v_old_level,
    'level', v_new_level,
    'levelUp', v_new_level > v_old_level,
    'alreadyRewarded', false
  );
end;
$function$;

-- Integra recompensas dentro del cierre atómico del simulacro.
create or replace function public.finish_simulation_atomic(
  p_simulation_id uuid,
  p_attempt_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_attempt_id uuid := p_attempt_id;
  v_started_at timestamptz;
  v_completed_at timestamptz := now();
  v_answer_count integer;
  v_distinct_count integer;
  v_valid_relation_count integer;
  v_correct integer;
  v_incorrect integer;
  v_unanswered integer;
  v_percentage integer;
  v_rewards jsonb;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if p_simulation_id is null or p_answers is null
     or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'INVALID_PAYLOAD';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_simulation_id::text, 0)
  );

  select total_questions
    into v_total
  from public.simulations
  where id = p_simulation_id
    and created_by = v_user_id
  for update;

  if v_total is null or v_total < 1 then
    raise exception 'SIMULATION_NOT_FOUND';
  end if;

  if p_attempt_id is null then
    select id
      into v_attempt_id
    from public.simulation_attempts
    where user_id = v_user_id
      and simulation_id = p_simulation_id
      and completed_at is null
    order by started_at desc
    limit 1
    for update;

    if v_attempt_id is null then
      v_started_at := v_completed_at;

      insert into public.simulation_attempts (
        user_id, simulation_id, started_at, completed_at,
        total_questions, score, correct_answers, incorrect_answers, unanswered_answers
      )
      values (
        v_user_id, p_simulation_id, v_started_at, null,
        v_total, 0, 0, 0, 0
      )
      returning id into v_attempt_id;
    end if;
  else
    select id, started_at
      into v_attempt_id, v_started_at
    from public.simulation_attempts
    where id = p_attempt_id
      and user_id = v_user_id
      and simulation_id = p_simulation_id
      and completed_at is null
    for update;

    if v_attempt_id is null then
      raise exception 'ATTEMPT_NOT_OPEN';
    end if;
  end if;

  select count(*), count(distinct question_id)
    into v_answer_count, v_distinct_count
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text);

  if v_answer_count <> v_total or v_distinct_count <> v_total then
    raise exception 'INVALID_ANSWERS';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers)
      as a(question_id uuid, selected_answer text)
    where a.selected_answer is not null
      and upper(trim(a.selected_answer)) not in ('A','B','C','D')
  ) then
    raise exception 'INVALID_ANSWERS';
  end if;

  select count(*)
    into v_valid_relation_count
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text)
  join public.simulation_questions sq
    on sq.simulation_id = p_simulation_id
   and sq.question_id = a.question_id;

  if v_valid_relation_count <> v_total then
    raise exception 'INVALID_ANSWERS';
  end if;

  select
    count(*) filter (
      where a.selected_answer is not null
        and upper(trim(a.selected_answer)) = upper(trim(q.correct_answer))
    ),
    count(*) filter (
      where a.selected_answer is not null
        and upper(trim(a.selected_answer)) <> upper(trim(q.correct_answer))
    ),
    count(*) filter (where a.selected_answer is null)
  into v_correct, v_incorrect, v_unanswered
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text)
  join public.simulation_questions sq
    on sq.simulation_id = p_simulation_id
   and sq.question_id = a.question_id
  join public.questions q
    on q.id = a.question_id;

  if (v_correct + v_incorrect + v_unanswered) <> v_total then
    raise exception 'QUESTIONS_NOT_AVAILABLE';
  end if;

  v_percentage := round((v_correct::numeric / v_total::numeric) * 100);

  delete from public.simulation_answers
  where attempt_id = v_attempt_id;

  insert into public.simulation_answers (
    attempt_id, question_id, selected_answer, is_correct, answered_at
  )
  select
    v_attempt_id,
    a.question_id,
    upper(trim(a.selected_answer)),
    (
      a.selected_answer is not null
      and upper(trim(a.selected_answer)) = upper(trim(q.correct_answer))
    ),
    v_completed_at
  from jsonb_to_recordset(p_answers)
    as a(question_id uuid, selected_answer text)
  join public.questions q on q.id = a.question_id
  where a.selected_answer is not null;

  update public.simulation_attempts
  set completed_at = v_completed_at,
      score = v_percentage,
      correct_answers = v_correct,
      incorrect_answers = v_incorrect,
      unanswered_answers = v_unanswered
  where id = v_attempt_id
    and user_id = v_user_id
    and simulation_id = p_simulation_id
    and completed_at is null;

  if not found then
    raise exception 'ATTEMPT_ALREADY_FINISHED';
  end if;

  v_rewards := public.grant_simulation_rewards(
    v_user_id,
    p_simulation_id,
    v_attempt_id,
    v_percentage
  );

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'correctAnswers', v_correct,
    'incorrectAnswers', v_incorrect,
    'unansweredAnswers', v_unanswered,
    'totalQuestions', v_total,
    'percentage', v_percentage,
    'rewards', v_rewards
  );
end;
$function$;

revoke all on function public.purchase_character(text) from public;
revoke all on function public.purchase_character(text) from anon;
grant execute on function public.purchase_character(text) to authenticated;

revoke all on function public.equip_character(text) from public;
revoke all on function public.equip_character(text) from anon;
grant execute on function public.equip_character(text) to authenticated;

revoke all on function public.grant_simulation_rewards(uuid,uuid,uuid,integer) from public;
revoke all on function public.grant_simulation_rewards(uuid,uuid,uuid,integer) from anon;
grant execute on function public.grant_simulation_rewards(uuid,uuid,uuid,integer) to authenticated;

revoke all on function public.finish_simulation_atomic(uuid,uuid,jsonb) from public;
revoke all on function public.finish_simulation_atomic(uuid,uuid,jsonb) from anon;
grant execute on function public.finish_simulation_atomic(uuid,uuid,jsonb) to authenticated;
