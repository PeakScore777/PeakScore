-- Upgrade name entrance effects to the PeakScore Motion Atelier preset family.
-- Preserve current user choices by mapping the earlier generic presets to their new counterparts.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

update public.community_member_profiles
set display_name_animation = case display_name_animation
  when 'rise' then 'cascade'
  when 'fade' then 'spotlight'
  when 'blur' then 'cinematic'
  when 'flip' then 'fold'
  else display_name_animation
end;

update public.community_member_profiles
set display_name_animation = 'none'
where display_name_animation not in ('none','typewriter','cascade','cinematic','orbit','magnetic','spotlight','wave','bounce','fold','glitch','wipe')
   or display_name_animation is null;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in ('none','typewriter','cascade','cinematic','orbit','magnetic','spotlight','wave','bounce','fold','glitch','wipe'));

comment on column public.community_member_profiles.display_name_animation is
  'PeakScore Motion Atelier one-shot display-name entrance preset, tuned for short and long names.';
