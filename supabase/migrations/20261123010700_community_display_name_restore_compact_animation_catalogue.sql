-- Return the animation picker and validation to the original 12 entrance options.
-- Keep existing profiles working by mapping experimental variants to the closest retained entrance.
update public.community_member_profiles
set display_name_animation = case display_name_animation
  when 'eclipse' then 'spotlight'
  when 'mercury' then 'fold'
  when 'supernova' then 'bounce'
  when 'prismforge' then 'orbit'
  when 'royalfoil' then 'spotlight'
  when 'velvetbloom' then 'cinematic'
  when 'stardust' then 'wave'
  when 'afterglow' then 'cinematic'
  when 'obsidian' then 'fold'
  when 'inferno' then 'bounce'
  else display_name_animation
end
where display_name_animation in (
  'eclipse','mercury','supernova','prismforge','royalfoil',
  'velvetbloom','stardust','afterglow','obsidian','inferno'
);

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'none','typewriter','cascade','cinematic','orbit','magnetic',
    'spotlight','wave','bounce','fold','glitch','wipe'
  ));

comment on column public.community_member_profiles.display_name_animation is
  'PeakScore original 12-option display-name entrance animation catalogue.';
