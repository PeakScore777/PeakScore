-- The server-side simulation API uses the Supabase service role to read
-- English booklet metadata after authenticating the current user.
-- Do not grant this access to anon or authenticated; RLS remains enabled.

grant select
on table public.english_question_sets
to service_role;
