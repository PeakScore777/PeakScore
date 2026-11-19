create table if not exists public.game_reading_passage_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  passage_id uuid not null references public.game_reading_passages(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, passage_id)
);

alter table public.game_reading_passage_progress enable row level security;
revoke all on public.game_reading_passage_progress from anon, authenticated;
grant select on public.game_reading_passage_progress to authenticated;
grant all on public.game_reading_passage_progress to service_role;

drop policy if exists "students read own completed archive books" on public.game_reading_passage_progress;
create policy "students read own completed archive books"
  on public.game_reading_passage_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.sync_archivo_oculto_passage_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.completed_at is not null
     or new.completed_at is null
     or new.game_key <> 'archivo-oculto' then
    return new;
  end if;

  insert into public.game_reading_passage_progress (
    user_id,
    passage_id,
    completed_at
  )
  select
    new.user_id,
    question.passage_id,
    new.completed_at
  from pg_catalog.unnest(new.question_ids) as session_question_id
  join public.game_questions as question
    on question.id::text = session_question_id
  where question.game_key = 'archivo-oculto'
    and question.status = 'published'
    and question.passage_id is not null
  group by question.passage_id
  on conflict (user_id, passage_id) do update
    set completed_at = greatest(
      public.game_reading_passage_progress.completed_at,
      excluded.completed_at
    );

  return new;
end;
$function$;

drop trigger if exists game_round_sessions_sync_archivo_progress on public.game_round_sessions;
create trigger game_round_sessions_sync_archivo_progress
  after update of completed_at on public.game_round_sessions
  for each row
  when (old.completed_at is distinct from new.completed_at and new.completed_at is not null)
  execute function public.sync_archivo_oculto_passage_progress();

insert into public.game_reading_passage_progress (
  user_id,
  passage_id,
  completed_at
)
select
  session.user_id,
  question.passage_id,
  max(session.completed_at)
from public.game_round_sessions as session
cross join lateral pg_catalog.unnest(session.question_ids) as session_question_id
join public.game_questions as question
  on question.id::text = session_question_id
where session.game_key = 'archivo-oculto'
  and session.completed_at is not null
  and question.game_key = 'archivo-oculto'
  and question.status = 'published'
  and question.passage_id is not null
group by session.user_id, question.passage_id
on conflict (user_id, passage_id) do update
  set completed_at = greatest(
    public.game_reading_passage_progress.completed_at,
    excluded.completed_at
  );

create or replace function public.complete_archivo_oculto_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.game_round_sessions%rowtype;
  v_expected integer := 0;
  v_answered integer := 0;
  v_correct integer := 0;
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

  v_expected := coalesce(pg_catalog.cardinality(v_session.question_ids), 0);
  if v_expected not in (5, 10) then
    raise exception 'SESSION_INVALID_OR_EXPIRED';
  end if;

  select
    count(*),
    count(*) filter (where is_correct = true)
    into v_answered, v_correct
    from public.game_round_answers
   where session_id = p_session_id
     and user_id = v_user_id;

  if v_answered <> v_expected then
    raise exception 'SESSION_INCOMPLETE';
  end if;

  v_score := pg_catalog.round((v_correct::numeric * 1000) / v_expected)::integer;
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
    'score', v_score,
    'progress', jsonb_build_object(
      'best_score', coalesce(v_best_score, 0),
      'best_correct', coalesce(v_best_correct, 0),
      'games_completed', coalesce(v_games_completed, 0)
    )
  );
end;
$function$;

revoke all on function public.sync_archivo_oculto_passage_progress() from public, anon, authenticated;
revoke all on function public.complete_archivo_oculto_session(uuid) from public, anon;
grant execute on function public.complete_archivo_oculto_session(uuid) to authenticated;
