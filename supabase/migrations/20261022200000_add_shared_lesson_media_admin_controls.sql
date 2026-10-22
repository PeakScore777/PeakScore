-- PeakScore: shared lesson media, with admin-only writes and public reads.
-- Apply this migration in the Supabase project before using the lesson image editor.

create table if not exists public.lesson_media_assets (
  asset_key text primary key check (char_length(asset_key) between 1 and 180),
  public_url text not null,
  storage_path text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint lesson_media_assets_public_url_nonempty check (char_length(btrim(public_url)) > 0),
  constraint lesson_media_assets_storage_path_nonempty check (char_length(btrim(storage_path)) > 0)
);

alter table public.lesson_media_assets enable row level security;

drop policy if exists "Anyone can read lesson media assets" on public.lesson_media_assets;
drop policy if exists "lesson_media_assets_read_all" on public.lesson_media_assets;
create policy "lesson_media_assets_read_all"
  on public.lesson_media_assets for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage lesson media assets" on public.lesson_media_assets;
drop policy if exists "lesson_media_assets_admin_insert" on public.lesson_media_assets;
drop policy if exists "lesson_media_assets_admin_update" on public.lesson_media_assets;
drop policy if exists "lesson_media_assets_admin_delete" on public.lesson_media_assets;

create policy "lesson_media_assets_admin_insert"
  on public.lesson_media_assets for insert to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create policy "lesson_media_assets_admin_update"
  on public.lesson_media_assets for update to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create policy "lesson_media_assets_admin_delete"
  on public.lesson_media_assets for delete to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

grant select on public.lesson_media_assets to anon, authenticated;
grant insert, update, delete on public.lesson_media_assets to authenticated;

-- A public bucket lets every learner display the selected image URL.
-- Writes remain restricted by the storage.objects RLS policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-atom-media', 'lesson-atom-media', true, 8388608,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view shared lesson atom media" on storage.objects;
create policy "Anyone can view shared lesson atom media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'lesson-atom-media');

drop policy if exists "Admins upload shared lesson atom media" on storage.objects;
drop policy if exists "lesson_atom_media_admin_insert" on storage.objects;
create policy "lesson_atom_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "Admins update shared lesson atom media" on storage.objects;
drop policy if exists "lesson_atom_media_admin_update" on storage.objects;
create policy "lesson_atom_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "Admins delete shared lesson atom media" on storage.objects;
drop policy if exists "lesson_atom_media_admin_delete" on storage.objects;
create policy "lesson_atom_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lesson-atom-media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );
