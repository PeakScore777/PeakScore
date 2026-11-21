-- Reference corpus is internal/admin data. Keep owner access where the
-- source/set belongs to the authenticated user, and allow institutional
-- admins. Do not expose the corpus to every authenticated account.

drop policy if exists "Authenticated users can view reference profiles"
  on public.reference_profiles;

create policy "Owners and admins can view reference profiles"
on public.reference_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.reference_sources rs
    where rs.id = reference_profiles.reference_source_id
      and rs.uploaded_by = (select auth.uid())
  )
  or exists (
    select 1
    from public.institution_members im
    where im.user_id = (select auth.uid())
      and im.role = 'admin'
  )
);

drop policy if exists "Authenticated users can view reference questions"
  on public.reference_questions;

drop policy if exists "Users can view reference questions"
  on public.reference_questions;

create policy "Owners and admins can view reference questions"
on public.reference_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.reference_sources rs
    where rs.id = reference_questions.reference_source_id
      and rs.uploaded_by = (select auth.uid())
  )
  or exists (
    select 1
    from public.institution_members im
    where im.user_id = (select auth.uid())
      and im.role = 'admin'
  )
);

drop policy if exists "Authenticated users can view reference set questions"
  on public.reference_set_questions;

create policy "Owners and admins can view reference set questions"
on public.reference_set_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.reference_sets rs
    where rs.id = reference_set_questions.reference_set_id
      and rs.created_by = (select auth.uid())
  )
  or exists (
    select 1
    from public.institution_members im
    where im.user_id = (select auth.uid())
      and im.role = 'admin'
  )
);

drop policy if exists "Authenticated users can view reference sets"
  on public.reference_sets;

create policy "Owners and admins can view reference sets"
on public.reference_sets
for select
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1
    from public.institution_members im
    where im.user_id = (select auth.uid())
      and im.role = 'admin'
  )
);

-- Remove duplicate INSERT policies. One policy per intended rule is easier
-- to audit and avoids redundant permissive evaluation.
drop policy if exists "Authenticated users can insert reference sources"
  on public.reference_sources;

drop policy if exists "Users can insert their own reference analyses"
  on public.reference_analyses;

-- reference_questions already has a single ownership-constrained INSERT policy.
