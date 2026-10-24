-- Paid hints for ¿Qué es esa vaina? One hint per question/session, charged atomically on the server.
create table if not exists public.game_hint_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.game_round_sessions(id) on delete cascade,
  game_key text not null default 'que-es-esa-vaina' check (game_key = 'que-es-esa-vaina'),
  question_id text not null,
  coins_spent integer not null default 5 check (coins_spent = 5),
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);
create index if not exists game_hint_uses_user_created_idx on public.game_hint_uses(user_id, created_at desc);
alter table public.game_hint_uses enable row level security;
revoke all on public.game_hint_uses from public, anon, authenticated;
grant select, insert, update, delete on public.game_hint_uses to service_role;

create or replace function public.use_que_es_esa_vaina_hint(p_user_id uuid, p_session_id uuid, p_question_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_user_id uuid := p_user_id;
  v_session public.game_round_sessions%rowtype;
  v_hint_id uuid;
  v_coins integer;
  v_coins_total integer;
  v_cost constant integer := 5;
begin
  if v_user_id is null then raise exception 'UNAUTHORIZED'; end if;
  if p_question_id is null or p_session_id is null then raise exception 'QUESTION_INVALID'; end if;
  select * into v_session from public.game_round_sessions
  where id = p_session_id and user_id = v_user_id and game_key = 'que-es-esa-vaina' for update;
  if not found or v_session.expires_at < now() then raise exception 'SESSION_INVALID_OR_EXPIRED'; end if;
  if not (p_question_id = any(v_session.question_ids)) or not (v_session.answer_key ? p_question_id) then
    raise exception 'QUESTION_INVALID';
  end if;
  if exists (select 1 from public.game_round_answers where session_id = p_session_id and user_id = v_user_id and question_id = p_question_id) then
    raise exception 'QUESTION_ALREADY_ANSWERED';
  end if;
  select coins into v_coins from public.profiles where id = v_user_id for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  select id into v_hint_id from public.game_hint_uses where session_id = p_session_id and question_id = p_question_id;
  if found then return jsonb_build_object('alreadyUsed', true, 'coinsSpent', 0, 'coinsTotal', coalesce(v_coins, 0)); end if;
  if coalesce(v_coins, 0) < v_cost then raise exception 'COINS_INSUFFICIENT'; end if;
  insert into public.game_hint_uses(user_id, session_id, game_key, question_id, coins_spent)
  values (v_user_id, p_session_id, 'que-es-esa-vaina', p_question_id, v_cost)
  on conflict (session_id, question_id) do nothing returning id into v_hint_id;
  if v_hint_id is null then
    select coins into v_coins_total from public.profiles where id = v_user_id;
    return jsonb_build_object('alreadyUsed', true, 'coinsSpent', 0, 'coinsTotal', coalesce(v_coins_total, 0));
  end if;
  perform pg_catalog.set_config('peakscore.internal_operation', 'grant_gamification_reward', true);
  update public.profiles set coins = coalesce(coins, 0) - v_cost
  where id = v_user_id and coalesce(coins, 0) >= v_cost returning coins into v_coins_total;
  if not found then raise exception 'COINS_INSUFFICIENT'; end if;
  return jsonb_build_object('alreadyUsed', false, 'coinsSpent', v_cost, 'coinsTotal', v_coins_total);
end;
$function$;
revoke all on function public.use_que_es_esa_vaina_hint(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.use_que_es_esa_vaina_hint(uuid, uuid, text) to service_role;
