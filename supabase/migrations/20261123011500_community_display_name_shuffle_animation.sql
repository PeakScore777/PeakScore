-- Add the React Bits-inspired Shuffle entrance animation to community names.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in ('decrypt', 'signal-break', 'fuzzy-text', 'shuffle'));
