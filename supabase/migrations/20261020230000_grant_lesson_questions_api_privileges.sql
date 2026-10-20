-- Allow authenticated sessions to query and submit lesson questions through PostgREST.
-- Row-level security still limits reads to published questions and writes to admins.
grant select, insert, update on table public.lesson_questions to authenticated;
