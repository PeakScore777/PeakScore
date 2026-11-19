create index if not exists game_round_sessions_question_ids_gin_idx
  on public.game_round_sessions using gin (question_ids);

create index if not exists game_round_sessions_completed_lookup_idx
  on public.game_round_sessions (user_id, game_key)
  where completed_at is not null;
