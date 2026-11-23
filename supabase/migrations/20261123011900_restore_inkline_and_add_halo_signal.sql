-- Restore the original Inkline preset and register Halo Signal separately.
-- The previous experimental migration reassigned Inkline rows to Signal Bloom;
-- reverse that unintended reassignment before dropping the temporary preset.
update public.community_member_profiles
set display_name_animation = 'inkline'
where display_name_animation = 'signal-bloom';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in (
    'decrypt',
    'signal-break',
    'fuzzy-text',
    'shuffle-blur',
    'shuffle-flip',
    'shuffle',
    'inkline',
    'halo-signal'
  ));
