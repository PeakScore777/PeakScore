insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-atom-media', 'lesson-atom-media', true, 8388608, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

create table if not exists public.lesson_media_assets (
 asset_key text primary key,
 public_url text not null,
 storage_path text not null,
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.lesson_media_assets enable row level security;

create policy "lesson_media_assets_read_all"
on public.lesson_media_assets for select
using (true);

create policy "lesson_media_assets_admin_insert"
on public.lesson_media_assets for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "lesson_media_assets_admin_update"
on public.lesson_media_assets for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "lesson_media_assets_admin_delete"
on public.lesson_media_assets for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "lesson_atom_media_public_read"
on storage.objects for select
using (bucket_id = 'lesson-atom-media');

create policy "lesson_atom_media_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'lesson-atom-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "lesson_atom_media_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'lesson-atom-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (bucket_id = 'lesson-atom-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "lesson_atom_media_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'lesson-atom-media' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
