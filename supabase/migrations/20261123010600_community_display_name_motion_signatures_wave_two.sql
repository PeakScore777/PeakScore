-- Extend PeakScore Motion Signatures with particle, echo, glass and ember entrances.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'none','typewriter','cascade','cinematic','orbit','magnetic','spotlight','wave','bounce','fold','glitch','wipe',
    'eclipse','mercury','supernova','prismforge','royalfoil','velvetbloom',
    'stardust','afterglow','obsidian','inferno'
  ));

comment on column public.community_member_profiles.display_name_animation is
  'PeakScore Motion Signatures: cinematic, fantasy, luxury, particle, glass, echo and ember entrances.';
