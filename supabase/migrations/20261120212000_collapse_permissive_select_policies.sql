-- Collapse overlapping SELECT policies into one per table while preserving
-- the original access conditions. Admins keep full access to their own review
-- workflows, and representatives keep access only to their own submissions.

drop policy if exists "Admins can view all verification documents"
  on public.institution_verification_documents;
drop policy if exists "Users can view their own verification documents"
  on public.institution_verification_documents;

create policy "Admins and representatives can view verification documents"
  on public.institution_verification_documents
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
    or exists (
      select 1
      from public.institution_verification_requests r
      where r.id = institution_verification_documents.verification_request_id
        and r.representative_user_id = (select auth.uid())
    )
  );

drop policy if exists "Admins can view all verification requests"
  on public.institution_verification_requests;
drop policy if exists "Users can view their own verification requests"
  on public.institution_verification_requests;

create policy "Admins and representatives can view verification requests"
  on public.institution_verification_requests
  for select to authenticated
  using (
    representative_user_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

-- An ALL policy also applies to SELECT and duplicates the published-question
-- reader policy. Split admin write access into explicit commands and combine
-- the two read conditions into one SELECT policy.
drop policy if exists "Admins manage lesson questions"
  on public.lesson_questions;
drop policy if exists "Authenticated users read published lesson questions"
  on public.lesson_questions;

create policy "Admins and students read lesson questions"
  on public.lesson_questions
  for select to authenticated
  using (
    is_published = true
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

create policy "Admins insert lesson questions"
  on public.lesson_questions
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

create policy "Admins update lesson questions"
  on public.lesson_questions
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

create policy "Admins delete lesson questions"
  on public.lesson_questions
  for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );
