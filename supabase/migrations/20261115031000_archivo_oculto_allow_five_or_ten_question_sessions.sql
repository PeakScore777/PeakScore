alter table public.game_round_sessions
  drop constraint if exists game_round_sessions_question_ids_check;

alter table public.game_round_sessions
  add constraint game_round_sessions_question_ids_check
  check (cardinality(question_ids) in (5, 10));
