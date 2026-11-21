drop policy if exists "Owners and admins can view reference profiles" on public.reference_profiles;
create policy "Platform owner can view reference profiles" on public.reference_profiles for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reference_sources rs where rs.id = reference_profiles.reference_source_id and rs.uploaded_by = (select auth.uid()))
);

drop policy if exists "Owners and admins can view reference questions" on public.reference_questions;
create policy "Platform owner can view reference questions" on public.reference_questions for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reference_sources rs where rs.id = reference_questions.reference_source_id and rs.uploaded_by = (select auth.uid()))
);

drop policy if exists "Owners and admins can view reference set questions" on public.reference_set_questions;
create policy "Platform owner can view reference set questions" on public.reference_set_questions for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reference_sets rs where rs.id = reference_set_questions.reference_set_id and rs.created_by = (select auth.uid()))
);

drop policy if exists "Owners and admins can view reference sets" on public.reference_sets;
create policy "Platform owner can view reference sets" on public.reference_sets for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or created_by = (select auth.uid())
);
