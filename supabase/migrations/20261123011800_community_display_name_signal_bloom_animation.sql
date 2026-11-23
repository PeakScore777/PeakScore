-- Add Signal Bloom, an original sequential outline-to-fill name animation.
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
    'signal-bloom'
  ));

-- Migrate the previous experimental preset to the refined Signal Bloom effect.
update public.community_member_profiles
set display_name_animation = 'signal-bloom'
where display_name_animation = 'inkline';
