-- Defense in depth for live-session ownership and SECURITY DEFINER search paths.
-- authenticated currently has no UPDATE table grant on community_live_sessions;
-- keep that grant closed. This policy check protects future server-reviewed
-- permission changes from accidentally enabling host reassignment.

drop policy if exists community_live_sessions_update_owner_scheduled
  on public.community_live_sessions;

create policy community_live_sessions_update_owner_scheduled
  on public.community_live_sessions
  for update to authenticated
  using (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and exists (
      select 1
      from public.community_member_roles mr
      where mr.user_id = (select auth.uid())
        and mr.role_key = 'profesor'
    )
  )
  with check (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and provider_room_name is null
    and started_at is null
    and ended_at is null
    and visibility = 'community'
    and exists (
      select 1
      from public.community_member_roles mr
      where mr.user_id = (select auth.uid())
        and mr.role_key = 'profesor'
    )
  );

-- Both functions qualify their application objects explicitly, so no writable
-- schema needs to be present in the SECURITY DEFINER execution search path.
alter function public.ensure_current_user_season()
  set search_path to '';

alter function public.sync_community_public_profile()
  set search_path to '';
