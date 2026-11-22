-- Remove the generic orbit cosmetic from community avatar decorations.
-- Existing selections are reset to the neutral avatar before the constraint changes.
update public.community_member_profiles
set avatar_decoration_id = 'none'
where avatar_decoration_id = 'orbit';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_avatar_decoration_id_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_avatar_decoration_id_check
  check (avatar_decoration_id in ('none', 'bloom', 'electric', 'glitch'));
