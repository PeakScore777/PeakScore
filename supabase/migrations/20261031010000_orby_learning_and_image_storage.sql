-- Orby learning library and private image storage.
-- Images are private, scoped to the authenticated user, and limited to 20 per account.

create table if not exists public.orby_learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('note', 'topic')),
  title text not null check (char_length(title) between 1 and 120),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orby_learning_items_user_kind_created_idx
  on public.orby_learning_items (user_id, kind, created_at desc);

alter table public.orby_learning_items enable row level security;
revoke all on public.orby_learning_items from public, anon, authenticated;
grant select, insert, delete on public.orby_learning_items to authenticated;

drop policy if exists "Users read their own Orby learning items" on public.orby_learning_items;
create policy "Users read their own Orby learning items"
  on public.orby_learning_items for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own Orby learning items" on public.orby_learning_items;
create policy "Users create their own Orby learning items"
  on public.orby_learning_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own Orby learning items" on public.orby_learning_items;
create policy "Users delete their own Orby learning items"
  on public.orby_learning_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.orby_image_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 180),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 1048576),
  created_at timestamptz not null default now()
);

create index if not exists orby_image_assets_user_created_idx
  on public.orby_image_assets (user_id, created_at desc);

alter table public.orby_image_assets enable row level security;
revoke all on public.orby_image_assets from public, anon, authenticated;
grant select, insert, delete on public.orby_image_assets to authenticated;

drop policy if exists "Users read their own Orby images" on public.orby_image_assets;
create policy "Users read their own Orby images"
  on public.orby_image_assets for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users add their own Orby images" on public.orby_image_assets;
create policy "Users add their own Orby images"
  on public.orby_image_assets for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own Orby images" on public.orby_image_assets;
create policy "Users delete their own Orby images"
  on public.orby_image_assets for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Serialize inserts per user so simultaneous uploads cannot exceed the 20-image quota.
create or replace function public.enforce_orby_image_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));
  select count(*)::integer into current_count
  from public.orby_image_assets
  where user_id = new.user_id;

  if current_count >= 20 then
    raise exception 'ORBY_IMAGE_QUOTA_REACHED'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_orby_image_quota_before_insert on public.orby_image_assets;
create trigger enforce_orby_image_quota_before_insert
  before insert on public.orby_image_assets
  for each row execute function public.enforce_orby_image_quota();

-- Private bucket: images can only be accessed with authenticated, short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('orby-images', 'orby-images', false, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 1048576,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Users read their own Orby image objects" on storage.objects;
create policy "Users read their own Orby image objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'orby-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users upload their own Orby image objects" on storage.objects;
create policy "Users upload their own Orby image objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'orby-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete their own Orby image objects" on storage.objects;
create policy "Users delete their own Orby image objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'orby-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
