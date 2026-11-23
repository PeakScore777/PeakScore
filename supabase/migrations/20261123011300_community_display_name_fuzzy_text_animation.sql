begin;

-- Replace GlyphStorm with React Bits FuzzyText.
-- Existing profiles using the removed option fall back to Hacking Decode.
update public.community_member_profiles
set display_name_animation = case
  when display_name_animation = 'signal-break' then 'signal-break'
  when display_name_animation = 'fuzzy-text' then 'fuzzy-text'
  else 'decrypt'
end
where display_name_animation is distinct from case
  when display_name_animation = 'signal-break' then 'signal-break'
  when display_name_animation = 'fuzzy-text' then 'fuzzy-text'
  else 'decrypt'
end;

alter table public.community_member_profiles
  alter column display_name_animation set default 'decrypt';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_animation_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_animation_check
  check (display_name_animation in ('decrypt', 'signal-break', 'fuzzy-text'));

commit;
