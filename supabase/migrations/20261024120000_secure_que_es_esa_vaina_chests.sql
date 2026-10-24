-- Secure reward claims for ¿Qué es esa vaina?
-- Answers and rewards are verified server-side; clients cannot write session answer keys or claim rows.
create table if not exists public.game_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key = 'que-es-esa-vaina'),
  best_score integer not null default 0 check (best_score >= 0),
  best_correct integer not null default 0 check (best_correct between 0 and 10),
  games_completed integer not null default 0 check (games_completed >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_key)
);
alter table public.game_progress enable row level security;
drop policy if exists "Users can read own game progress" on public.game_progress;
create policy "Users can read own game progress" on public.game_progress for select to authenticated using (auth.uid() = user_id);
grant select on public.game_progress to authenticated;

create table if not exists public.game_round_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null default 'que-es-esa-vaina' check (game_key = 'que-es-esa-vaina'),
  question_ids text[] not null check (cardinality(question_ids) = 10),
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);
create index if not exists game_round_sessions_user_created_idx on public.game_round_sessions(user_id, created_at desc);
alter table public.game_round_sessions enable row level security;
revoke all on public.game_round_sessions from anon, authenticated;

create table if not exists public.game_round_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_round_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  selected_option integer not null check (selected_option between 0 and 3),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id)
);
create index if not exists game_round_answers_session_correct_idx on public.game_round_answers(session_id, is_correct);
alter table public.game_round_answers enable row level security;
revoke all on public.game_round_answers from anon, authenticated;

create table if not exists public.game_chest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.game_round_sessions(id) on delete cascade,
  game_key text not null default 'que-es-esa-vaina' check (game_key = 'que-es-esa-vaina'),
  chest_number integer not null check (chest_number between 1 and 3),
  correct_required integer not null check (correct_required in (2,5,8)),
  xp_awarded integer not null check (xp_awarded > 0),
  coins_awarded integer not null check (coins_awarded > 0),
  created_at timestamptz not null default now(),
  unique (session_id, chest_number)
);
create index if not exists game_chest_claims_user_created_idx on public.game_chest_claims(user_id, created_at desc);
alter table public.game_chest_claims enable row level security;
drop policy if exists "Users can read own game chest claims" on public.game_chest_claims;
create policy "Users can read own game chest claims" on public.game_chest_claims for select to authenticated using (auth.uid() = user_id);
grant select on public.game_chest_claims to authenticated;

create or replace function public.claim_que_es_esa_vaina_chest(p_session_id uuid, p_chest_number integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.game_round_sessions%rowtype;
  v_correct integer := 0;
  v_required integer;
  v_xp integer;
  v_coins integer;
  v_event_id uuid;
  v_old_xp integer;
  v_new_xp integer;
  v_level integer;
begin
  if v_user_id is null then raise exception 'UNAUTHORIZED'; end if;
  if p_chest_number not between 1 and 3 then raise exception 'INVALID_CHEST'; end if;

  select * into v_session
  from public.game_round_sessions
  where id = p_session_id and user_id = v_user_id and game_key = 'que-es-esa-vaina'
  for update;
  if not found or v_session.expires_at < now() then raise exception 'SESSION_INVALID_OR_EXPIRED'; end if;

  v_required := case p_chest_number when 1 then 2 when 2 then 5 else 8 end;
  select count(*) into v_correct
  from public.game_round_answers
  where session_id = p_session_id and user_id = v_user_id and is_correct = true;

  if v_correct < v_required then raise exception 'CHEST_LOCKED'; end if;

  v_xp := case p_chest_number when 1 then 10 when 2 then 20 else 30 end;
  v_coins := case p_chest_number when 1 then 5 when 2 then 10 else 15 end;

  insert into public.game_chest_claims(user_id, session_id, chest_number, correct_required, xp_awarded, coins_awarded)
  values (v_user_id, p_session_id, p_chest_number, v_required, v_xp, v_coins)
  on conflict (session_id, chest_number) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('claimed', false, 'alreadyClaimed', true, 'xpAwarded', 0, 'coinsAwarded', 0);
  end if;

  insert into public.gamification_events(user_id, event_type, reference_id, xp_awarded, coins_awarded, metadata)
  values (v_user_id, 'game_chest', p_session_id::text || ':' || p_chest_number::text, v_xp, v_coins,
          jsonb_build_object('game_key','que-es-esa-vaina','chest_number',p_chest_number,'correct_required',v_required))
  on conflict (user_id, event_type, reference_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    delete from public.game_chest_claims where session_id = p_session_id and chest_number = p_chest_number and user_id = v_user_id;
    return jsonb_build_object('claimed', false, 'alreadyClaimed', true, 'xpAwarded', 0, 'coinsAwarded', 0);
  end if;

  select xp into v_old_xp from public.profiles where id = v_user_id for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  v_new_xp := coalesce(v_old_xp,0) + v_xp;
  select l.level into v_level from public.levels l where l.xp_required <= v_new_xp order by l.level desc limit 1;
  v_level := coalesce(v_level,1);

  perform pg_catalog.set_config('peakscore.internal_operation', 'grant_gamification_reward', true);
  update public.profiles
    set xp = v_new_xp, season_xp = coalesce(season_xp,0) + v_xp, coins = coalesce(coins,0) + v_coins, level = v_level
    where id = v_user_id;

  return jsonb_build_object('claimed', true, 'alreadyClaimed', false, 'chestNumber',p_chest_number,'xpAwarded',v_xp,'coinsAwarded',v_coins,'xpTotal',v_new_xp,'coinsTotal',(select coins from public.profiles where id=v_user_id));
end;
$function$;

revoke all on function public.claim_que_es_esa_vaina_chest(uuid, integer) from public, anon;
grant execute on function public.claim_que_es_esa_vaina_chest(uuid, integer) to authenticated;
