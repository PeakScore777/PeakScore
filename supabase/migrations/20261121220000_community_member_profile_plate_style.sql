-- Community member nameplate preset.
-- Banner and card_color are added by the earlier community appearance migrations.
-- No dependency on PeakStyle, academic profiles or game progression.

alter table public.community_member_profiles
  add column if not exists plate_style text not null default 'classic';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_plate_style_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_plate_style_check
  check (plate_style in ('classic', 'grid', 'arcade', 'signal'));

comment on column public.community_member_profiles.plate_style is
  'First-party community member nameplate preset: classic, grid, arcade or signal.';
