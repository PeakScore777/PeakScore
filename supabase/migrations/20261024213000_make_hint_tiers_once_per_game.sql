-- Each hint tier can be purchased once per game session, not once per question.
alter table public.game_hint_uses
  drop constraint if exists game_hint_uses_session_question_hint_key;
alter table public.game_hint_uses
  add constraint game_hint_uses_session_hint_key unique (session_id, hint_number);

create or replace function public.use_que_es_esa_vaina_hint(
  p_user_id uuid,
  p_session_id uuid,
  p_question_id text,
  p_hint_number integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := p_user_id;
  v_session public.game_round_sessions%rowtype;
  v_hint_id uuid;
  v_used_question_id text;
  v_coins integer;
  v_coins_total integer;
  v_cost integer;
begin
  if v_user_id is null then raise exception 'UNAUTHORIZED'; end if;
  if p_session_id is null or p_question_id is null or p_hint_number not between 1 and 3 then
    raise exception 'QUESTION_INVALID';
  end if;

  v_cost := case p_hint_number when 1 then 5 when 2 then 10 else 15 end;

  select * into v_session
  from public.game_round_sessions
  where id = p_session_id
    and user_id = v_user_id
    and game_key = 'que-es-esa-vaina'
  for update;
  if not found or v_session.expires_at < now() then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  if not (p_question_id = any(v_session.question_ids))
     or not (v_session.answer_key ? p_question_id) then
    raise exception 'QUESTION_INVALID';
  end if;

  if exists (
    select 1 from public.game_round_answers
    where session_id = p_session_id
      and user_id = v_user_id
      and question_id = p_question_id
  ) then
    raise exception 'QUESTION_ALREADY_ANSWERED';
  end if;

  select coins into v_coins
  from public.profiles
  where id = v_user_id
  for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  select id, question_id into v_hint_id, v_used_question_id
  from public.game_hint_uses
  where session_id = p_session_id
    and hint_number = p_hint_number;

  if found then
    if v_used_question_id is distinct from p_question_id then
      raise exception 'HINT_ALREADY_USED_THIS_SESSION';
    end if;
    return jsonb_build_object(
      'alreadyUsed', true,
      'hintNumber', p_hint_number,
      'hintCost', v_cost,
      'coinsSpent', 0,
      'coinsTotal', coalesce(v_coins, 0)
    );
  end if;

  if coalesce(v_coins, 0) < v_cost then
    raise exception 'COINS_INSUFFICIENT:%', v_cost;
  end if;

  insert into public.game_hint_uses(user_id, session_id, game_key, question_id, hint_number, coins_spent)
  values (v_user_id, p_session_id, 'que-es-esa-vaina', p_question_id, p_hint_number, v_cost)
  on conflict (session_id, hint_number) do nothing
  returning id into v_hint_id;

  if v_hint_id is null then
    select question_id into v_used_question_id
    from public.game_hint_uses
    where session_id = p_session_id and hint_number = p_hint_number;
    if v_used_question_id is distinct from p_question_id then
      raise exception 'HINT_ALREADY_USED_THIS_SESSION';
    end if;
    select coins into v_coins_total from public.profiles where id = v_user_id;
    return jsonb_build_object(
      'alreadyUsed', true,
      'hintNumber', p_hint_number,
      'hintCost', v_cost,
      'coinsSpent', 0,
      'coinsTotal', coalesce(v_coins_total, 0)
    );
  end if;

  perform pg_catalog.set_config('peakscore.internal_operation', 'grant_gamification_reward', true);
  update public.profiles
  set coins = coalesce(coins, 0) - v_cost
  where id = v_user_id and coalesce(coins, 0) >= v_cost
  returning coins into v_coins_total;
  if not found then raise exception 'COINS_INSUFFICIENT:%', v_cost; end if;

  return jsonb_build_object(
    'alreadyUsed', false,
    'hintNumber', p_hint_number,
    'hintCost', v_cost,
    'coinsSpent', v_cost,
    'coinsTotal', v_coins_total
  );
end;
$function$;
