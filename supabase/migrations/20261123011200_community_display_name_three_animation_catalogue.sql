begin;

-- Keep only the three supported profile-name animations.
update public.community_member_profiles
set display_name_animation = case
  when display_name_animation in ('decrypt', 'signal-break', 'glyph-storm')
    then display_name_animation
  when display_name_animation = 'glitch'
    then 'signal-break'
  else 'decrypt'
end
where display_name_animation is distinct from case
  when display_name_animation in ('decrypt', 'signal-break', 'glyph-storm')
    then display_name_animation
  when display_name_animation = 'glitch'
    then 'signal-break'
  else 'decrypt'
end;

alter table public.community_member_profiles
  alter column display_name_animation set default 'decrypt';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in ('decrypt', 'signal-break', 'glyph-storm'));

commit;
