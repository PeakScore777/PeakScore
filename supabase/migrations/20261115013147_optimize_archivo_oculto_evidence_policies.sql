-- Keep one SELECT policy for published evidence and administrators.
-- Separate write policies keep editor access restricted to administrators.
drop policy if exists "admins manage archivo oculto evidence assets" on public.game_evidence_assets;
drop policy if exists "published archivo oculto evidence readable" on public.game_evidence_assets;

create policy "admins and published readers view archivo oculto evidence"
  on public.game_evidence_assets
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
    or exists (
      select 1 from public.game_reading_passages passage
      where passage.id = game_evidence_assets.passage_id
        and passage.game_key = 'archivo-oculto'
        and passage.status = 'published'
    )
  );

create policy "admins insert archivo oculto evidence"
  on public.game_evidence_assets
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins update archivo oculto evidence"
  on public.game_evidence_assets
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins delete archivo oculto evidence"
  on public.game_evidence_assets
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create index if not exists game_evidence_assets_created_by_idx
  on public.game_evidence_assets(created_by);
