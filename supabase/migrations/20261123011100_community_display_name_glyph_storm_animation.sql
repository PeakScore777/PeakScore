begin;

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'none','typewriter','cascade','cinematic','orbit','magnetic',
    'spotlight','wave','bounce','fold','decrypt','signal-break','glyph-storm'
  ));

commit;
