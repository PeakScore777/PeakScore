-- The legacy public projection copied game-profile fields into Community.
-- Community now uses community_member_profiles exclusively. Stop syncing the
-- legacy projection and prevent authenticated clients from reading it.
drop trigger if exists sync_community_public_profile_trigger on public.profiles;

revoke all on function public.sync_community_public_profile()
  from public, anon, authenticated;
drop function if exists public.sync_community_public_profile();

revoke all on table public.community_public_profiles
  from public, anon, authenticated;

comment on table public.community_public_profiles is
  'Retired legacy projection of PeakScore game profiles. Community UI uses community_member_profiles; authenticated clients cannot read this table.';
