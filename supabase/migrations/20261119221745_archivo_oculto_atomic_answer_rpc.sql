create or replace function public.answer_archivo_oculto_question_atomic(
  p_user_id uuid,
  p_session_id uuid,
  p_question_id text,
  p_selected_option integer
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_session public.game_round_sessions%rowtype;
  v_correct_option integer;
  v_explanation text;
  v_is_correct boolean;
  v_saved_is_correct boolean;
  v_saved_option integer;
  v_already_answered boolean := false;
  v_correct_count integer := 0;
begin
  if p_user_id is null or p_session_id is null or p_question_id is null then
    raise exception 'ANSWER_INVALID';
  end if;

  if p_selected_option is null or p_selected_option < 0 or p_selected_option > 3 then
    raise exception 'ANSWER_INVALID';
  end if;

  select *
    into v_session
    from public.game_round_sessions
   where id = p_session_id
     and user_id = p_user_id
     and game_key = 'archivo-oculto'
   for update;

  if not found
     or v_session.expires_at <= now()
     or v_session.completed_at is not null then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  if not (p_question_id = any(v_session.question_ids))
     or not (v_session.answer_key ? p_question_id) then
    raise exception 'QUESTION_NOT_IN_SESSION';
  end if;

  if p_question_id like 'ao-%' then
    raise exception 'QUESTION_LEGACY';
  end if;

  select question.answer, question.explanation
    into v_correct_option, v_explanation
    from public.game_questions as question
   where question.id::text = p_question_id
     and question.game_key = 'archivo-oculto'
     and question.status = 'published';

  if not found then
    raise exception 'QUESTION_NOT_AVAILABLE';
  end if;

  if (v_session.answer_key ->> p_question_id)::integer <> v_correct_option then
    raise exception 'SESSION_ANSWER_KEY_MISMATCH';
  end if;

  v_is_correct := v_correct_option = p_selected_option;

  insert into public.game_round_answers (
    session_id, user_id, question_id, selected_option, is_correct
  )
  values (
    p_session_id, p_user_id, p_question_id, p_selected_option, v_is_correct
  )
  on conflict (session_id, question_id) do nothing
  returning is_correct, selected_option
       into v_saved_is_correct, v_saved_option;

  if not found then
    select answer.is_correct, answer.selected_option
      into v_saved_is_correct, v_saved_option
      from public.game_round_answers as answer
     where answer.session_id = p_session_id
       and answer.user_id = p_user_id
       and answer.question_id = p_question_id;

    if not found then
      raise exception 'ANSWER_SAVE_FAILED';
    end if;
    v_already_answered := true;
  end if;

  select count(*) filter (where answer.is_correct)
    into v_correct_count
    from public.game_round_answers as answer
   where answer.session_id = p_session_id
     and answer.user_id = p_user_id;

  return jsonb_build_object(
    'isCorrect', v_saved_is_correct,
    'correctOption', v_correct_option,
    'correctCount', coalesce(v_correct_count, 0),
    'alreadyAnswered', v_already_answered,
    'explanation', coalesce(v_explanation, '')
  );
end;
$function$;

revoke all on function public.answer_archivo_oculto_question_atomic(uuid, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.answer_archivo_oculto_question_atomic(uuid, uuid, text, integer)
  to service_role;

create index if not exists game_round_answers_user_id_idx
  on public.game_round_answers (user_id);
