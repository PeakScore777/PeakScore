drop policy if exists "Authenticated users can view reference sources" on public.reference_sources;

alter policy "Users can read their own institution membership"
on public.institution_members
using ((select auth.uid()) = user_id);

alter policy "Users can view their own profile"
on public.profiles
using ((select auth.uid()) = id);

alter policy "Users can create their own reference analyses"
on public.reference_analyses
with check (user_id = (select auth.uid()));

alter policy "Users can view their own progress"
on public.student_progress
using (user_id = (select auth.uid()));

alter policy "Users can view their own subscription"
on public.subscriptions
using (user_id = (select auth.uid()));

alter policy "Users can view their own institution"
on public.institutions
using (
  exists (
    select 1
    from public.institution_members
    where institution_members.institution_id = institutions.id
      and institution_members.user_id = (select auth.uid())
  )
);

alter policy "Users can view their own simulation answers"
on public.simulation_answers
using (
  exists (
    select 1
    from public.simulation_attempts attempts
    where attempts.id = simulation_answers.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);
