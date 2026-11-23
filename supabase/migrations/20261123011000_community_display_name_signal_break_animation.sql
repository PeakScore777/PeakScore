begin;

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

update public.community_member_profiles
set display_name_animation = 'signal-break'
where display_name_animation = 'glitch';

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'none','typewriter','cascade','cinematic','orbit','magnetic',
    'spotlight','wave','bounce','fold','decrypt','signal-break'
  ));

commit;
