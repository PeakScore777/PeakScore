-- Persist CapCut-style name entrance presets separately from the visual finish.
alter table public.community_member_profiles
  add column if not exists display_name_animation text not null default 'none';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in ('none','typewriter','rise','fade','blur','bounce','flip','wipe','glitch','wave'));

comment on column public.community_member_profiles.display_name_animation is
  'One-shot display-name entrance preset played when a profile surface is mounted.';
