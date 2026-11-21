drop policy if exists "Users can insert their own simulation answers" on public.simulation_answers;

create policy "Users can insert their own simulation answers"
on public.simulation_answers
for insert
to authenticated
with check (
  is_correct = false
  and selected_answer in ('A','B','C','D')
  and exists (
    select 1
    from public.simulation_attempts a
    join public.simulations s on s.id = a.simulation_id
    join public.simulation_questions sq
      on sq.simulation_id = s.id
     and sq.question_id = simulation_answers.question_id
    where a.id = simulation_answers.attempt_id
      and a.user_id = (select auth.uid())
      and s.created_by = (select auth.uid())
      and a.completed_at is null
  )
);
