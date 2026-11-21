-- Keep the legacy lesson media bucket limited to static raster formats.
-- Existing objects were audited and are all PNG at the time of this change.
update storage.buckets
set allowed_mime_types = array['image/png','image/jpeg','image/webp']::text[]
where id = 'lesson-atom-media';

-- Evaluate the authenticated UID once per statement in admin-only storage rules.
drop policy if exists lesson_atom_media_admin_insert on storage.objects;
create policy lesson_atom_media_admin_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

drop policy if exists lesson_atom_media_admin_update on storage.objects;
create policy lesson_atom_media_admin_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  )
  with check (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

drop policy if exists lesson_atom_media_admin_delete on storage.objects;
create policy lesson_atom_media_admin_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );
