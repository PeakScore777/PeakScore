-- Independent second stop for the member profile body theme gradient.
alter table public.community_member_profiles
  add column if not exists theme_color_secondary text not null default '#174D35';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_theme_color_secondary_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_theme_color_secondary_check
  check (theme_color_secondary ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.community_member_profiles.theme_color_secondary is
  'Second color stop for the community profile body theme gradient; does not affect the banner.';
