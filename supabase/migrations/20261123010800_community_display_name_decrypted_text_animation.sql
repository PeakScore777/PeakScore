-- Replace the old generic Signal/Glitch entrance with the supplied Decrypted Text behavior.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

update public.community_member_profiles
set display_name_animation = 'decrypt'
where display_name_animation = 'glitch';

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'none','typewriter','cascade','cinematic','orbit','magnetic',
    'spotlight','wave','bounce','fold','decrypt','wipe'
  ));

comment on column public.community_member_profiles.display_name_animation is
  'PeakScore original 12-option display-name entrance catalogue, including hexadecimal Decrypted Text.';
