-- Community member profile card color.
-- This is community-only presentation data; it is intentionally independent
-- from public.profiles and the future PeakStyle cosmetics catalog.

alter table public.community_member_profiles
  add column if not exists card_color text not null default '#24252a';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_card_color_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_card_color_check
  check (card_color ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.community_member_profiles.card_color is
  'User-selected charcoal card color for the community member identity popout; unrelated to the platform profile.';
