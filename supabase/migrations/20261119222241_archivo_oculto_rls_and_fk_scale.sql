-- Merge duplicate permissive SELECT policies while preserving existing admin CRUD
-- and the same published/active student read visibility.

drop policy if exists "admins manage archivo oculto wall frames" on public.archivo_oculto_wall_frames;
drop policy if exists "students read active archivo oculto wall frames" on public.archivo_oculto_wall_frames;
create policy "archivo wall frames readable by admins or students"
  on public.archivo_oculto_wall_frames for select to authenticated
  using (is_active = true or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins insert archivo wall frames" on public.archivo_oculto_wall_frames for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins update archivo wall frames" on public.archivo_oculto_wall_frames for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins delete archivo wall frames" on public.archivo_oculto_wall_frames for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "admins manage archivo oculto os wallpapers" on public.archivo_oculto_os_wallpapers;
drop policy if exists "students read active archivo oculto os wallpapers" on public.archivo_oculto_os_wallpapers;
create policy "archivo wallpapers readable by admins or students"
  on public.archivo_oculto_os_wallpapers for select to authenticated
  using (is_active = true or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins insert archivo wallpapers" on public.archivo_oculto_os_wallpapers for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins update archivo wallpapers" on public.archivo_oculto_os_wallpapers for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins delete archivo wallpapers" on public.archivo_oculto_os_wallpapers for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "admins manage archivo oculto case records" on public.game_case_records;
drop policy if exists "published archivo oculto case records readable" on public.game_case_records;
create policy "archivo case records readable by admins or students"
  on public.game_case_records for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    or exists (select 1 from public.game_reading_passages p where p.id = game_case_records.passage_id and p.game_key = 'archivo-oculto' and p.status = 'published')
  );
create policy "admins insert archivo case records" on public.game_case_records for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins update archivo case records" on public.game_case_records for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins delete archivo case records" on public.game_case_records for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "game questions admin role all" on public.game_questions;
drop policy if exists "game questions published read" on public.game_questions;
create policy "game questions readable by admins or published students"
  on public.game_questions for select to authenticated
  using (status = 'published' or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins insert game questions" on public.game_questions for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins update game questions" on public.game_questions for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins delete game questions" on public.game_questions for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "admins manage game reading passages" on public.game_reading_passages;
drop policy if exists "published game reading passages are readable" on public.game_reading_passages;
create policy "game reading passages readable by admins or published students"
  on public.game_reading_passages for select to authenticated
  using (status = 'published' or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins insert game reading passages" on public.game_reading_passages for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins update game reading passages" on public.game_reading_passages for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins delete game reading passages" on public.game_reading_passages for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "admins manage reading suspects" on public.game_reading_suspects;
drop policy if exists "students read suspects for published readings" on public.game_reading_suspects;
create policy "reading suspects readable by admins or students"
  on public.game_reading_suspects for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    or exists (select 1 from public.game_reading_passages p where p.id = game_reading_suspects.passage_id and p.status = 'published')
  );
create policy "admins insert reading suspects" on public.game_reading_suspects for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins update reading suspects" on public.game_reading_suspects for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "admins delete reading suspects" on public.game_reading_suspects for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create index if not exists archivo_wall_frames_created_by_idx
  on public.archivo_oculto_wall_frames(created_by) where created_by is not null;
create index if not exists archivo_os_wallpapers_created_by_idx
  on public.archivo_oculto_os_wallpapers(created_by) where created_by is not null;
create index if not exists game_case_records_created_by_idx
  on public.game_case_records(created_by) where created_by is not null;
create index if not exists game_questions_created_by_idx
  on public.game_questions(created_by) where created_by is not null;
create index if not exists game_reading_passages_created_by_idx
  on public.game_reading_passages(created_by) where created_by is not null;
