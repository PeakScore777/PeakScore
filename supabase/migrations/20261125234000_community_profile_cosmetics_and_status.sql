-- PeakScore Community profile identity layers and expiring custom status.
-- Additive only. These are community identity cosmetics, not PeakStyle academic inventory.

alter table public.community_member_profiles
  add column if not exists avatar_decoration_id text not null default 'none',
  add column if not exists profile_frame_id text not null default 'none',
  add column if not exists profile_effect_id text not null default 'none',
  add column if not exists status_expires_at timestamptz;

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_accent_color_check,
  drop constraint if exists community_member_profiles_avatar_decoration_id_check,
  drop constraint if exists community_member_profiles_profile_frame_id_check,
  drop constraint if exists community_member_profiles_profile_effect_id_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_accent_color_check
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint community_member_profiles_avatar_decoration_id_check
    check (avatar_decoration_id in ('none', 'orbit', 'bloom', 'electric', 'glitch')),
  add constraint community_member_profiles_profile_frame_id_check
    check (profile_frame_id in ('none', 'obsidian', 'lunar', 'crimson', 'aurora')),
  add constraint community_member_profiles_profile_effect_id_check
    check (profile_effect_id in ('none', 'aurora', 'embers', 'starlight', 'scanline'));

comment on column public.community_member_profiles.avatar_decoration_id is
  'Community-owned avatar decoration layer; independent from the avatar image and profile frame.';
comment on column public.community_member_profiles.profile_frame_id is
  'Community profile-card frame layer; independent from avatar decoration and animated profile effects.';
comment on column public.community_member_profiles.profile_effect_id is
  'Community profile surface effect preset. Only whitelisted first-party CSS effects are allowed.';
comment on column public.community_member_profiles.status_expires_at is
  'Optional expiry timestamp for the public community custom status. Null means no expiry.';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_avatar_path_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_avatar_path_check
  check (
    avatar_path is null
    or (
      avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp|gif)$'
      and split_part(avatar_path, '/', 1) = user_id::text
    )
  );

update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
where id = 'community-profile-avatars';
