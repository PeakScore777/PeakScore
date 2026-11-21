-- PeakScore Community profile banners.
-- Public read is intentional for profile display; uploads remain server-only
-- and are sanitized/re-encoded after authenticated ownership checks.

alter table public.community_member_profiles
  add column if not exists banner_path text;

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_banner_path_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_banner_path_check
  check (
    banner_path is null
    or (
      banner_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp)$'
      and split_part(banner_path, '/', 1) = user_id::text
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-profile-banners',
  'community-profile-banners',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

comment on column public.community_member_profiles.banner_path is
  'Optional sanitized public profile banner. Stored under the owning user UUID; only server routes can write.';
