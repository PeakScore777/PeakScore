-- Ensure the trusted server-side service-role client can access the private game tables.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.game_round_sessions to service_role;
grant select, insert, update, delete on public.game_round_answers to service_role;
grant select, insert, update, delete on public.game_chest_claims to service_role;
grant select, insert, update, delete on public.game_questions to service_role;
