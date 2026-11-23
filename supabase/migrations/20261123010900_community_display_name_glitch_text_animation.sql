-- Replace Silk Reveal with the original Glitch Text animation.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

update public.community_member_profiles
set display_name_animation = 'glitch'
where display_name_animation = 'wipe';

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'none','typewriter','cascade','cinematic','orbit','magnetic',
    'spotlight','wave','bounce','fold','decrypt','glitch'
  ));

comment on column public.community_member_profiles.display_name_animation is
  'PeakScore original 12-option display-name entrance catalogue, including animated Glitch Text.';
