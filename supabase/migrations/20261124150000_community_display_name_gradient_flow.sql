-- Add Gradient Flow and align the database whitelist with the active display-name animation catalogue.
-- Signal Break is intentionally retired; old profiles are normalized by the profile API.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

update public.community_member_profiles
set display_name_animation = 'decrypt'
where display_name_animation in ('signal-break', 'glitch');

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'decrypt',
    'fuzzy-text',
    'shuffle-blur',
    'shuffle-flip',
    'shuffle',
    'inkline',
    'halo-signal',
    'domino-flow',
    'mistfall',
    'depth-lift',
    'gradient-flow'
  ));
