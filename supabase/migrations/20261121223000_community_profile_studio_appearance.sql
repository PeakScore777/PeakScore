-- PeakScore Community identity studio appearance.
-- Additive only: preserves all current community identity rows.
-- Public reads are intentional for community profile images; all writes remain server-only.

alter table public.community_member_profiles
  add column if not exists banner_path text,
  add column if not exists card_color text not null default '#20242D',
  add column if not exists plate_style text not null default 'classic',
  add column if not exists accent_color text not null default '#3987FF',
  add column if not exists avatar_frame text not null default 'none';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_banner_path_check,
  drop constraint if exists community_member_profiles_card_color_check,
  drop constraint if exists community_member_profiles_plate_style_check,
  drop constraint if exists community_member_profiles_accent_color_check,
  drop constraint if exists community_member_profiles_avatar_frame_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_banner_path_check
    check (
      banner_path is null
      or (
        banner_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp)$'
        and split_part(banner_path, '/', 1) = user_id::text
      )
    ),
  add constraint community_member_profiles_card_color_check
    check (card_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint community_member_profiles_plate_style_check
    check (plate_style in ('classic', 'grid', 'arcade', 'signal')),
  add constraint community_member_profiles_accent_color_check
    check (upper(accent_color) in ('#3987FF', '#9A72F5', '#E75DA6', '#F16E65', '#E5B64C', '#52C7A4')),
  add constraint community_member_profiles_avatar_frame_check
    check (avatar_frame in ('none', 'solar', 'violet', 'cyan', 'ember'));

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
  'Sanitized community-owned profile banner. Server writes only.';
comment on column public.community_member_profiles.card_color is
  'Community profile card surface color, independent from academic identity and PeakStyle.';
comment on column public.community_member_profiles.plate_style is
  'Native community nameplate preset: classic, grid, arcade or signal.';
comment on column public.community_member_profiles.accent_color is
  'Whitelisted community identity studio accent color.';
comment on column public.community_member_profiles.avatar_frame is
  'Whitelisted native avatar frame preset in the community identity studio.';
