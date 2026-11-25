-- Allow user-owned profile banners to use the same strictly sanitized GIF
-- container supported by the upload API. No external GIF catalogue is exposed.
begin;

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_banner_path_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_banner_path_check
  check (
    banner_path is null
    or (
      banner_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp|gif)$'
      and split_part(banner_path, '/', 1) = user_id::text
    )
  );

update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    file_size_limit = 8388608
where id = 'community-profile-banners';

commit;
