-- Scope community live sessions to the owning global or PreICFES space.
-- Existing sessions remain in the PeakScore global space.
-- Only global professors or space-assigned teachers may schedule within that space.

begin;

alter table public.community_live_sessions
  add column if not exists space_id uuid;

update public.community_live_sessions
set space_id = '00000000-0000-4000-8000-000000000001'::uuid
where space_id is null;

alter table public.community_live_sessions
  alter column space_id set default '00000000-0000-4000-8000-000000000001'::uuid,
  alter column space_id set not null;

alter table public.community_live_sessions
  drop constraint if exists community_live_sessions_space_id_fkey;
alter table public.community_live_sessions
  add constraint community_live_sessions_space_id_fkey
  foreign key (space_id) references public.community_spaces(id) on delete cascade;

create index if not exists community_live_sessions_space_schedule_idx
  on public.community_live_sessions (space_id,status,scheduled_at asc);

create or replace function private.can_host_community_live_session(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and private.is_community_founder() or (
      auth.uid() is not null
      and private.can_access_community_space(p_space_id)
      and not private.is_space_timed_out(p_space_id)
      and exists (
        select 1
        from public.community_spaces space
        where space.id = p_space_id
          and space.is_enabled = true
          and (
            (
              space.space_type = 'global'
              and exists (
                select 1
                from public.community_member_roles assignment
                where assignment.user_id = auth.uid()
                  and assignment.role_key = 'profesor'
              )
            )
            or (
              space.space_type = 'preicfes'
              and exists (
                select 1
                from public.community_space_member_roles assignment
                where assignment.space_id = p_space_id
                  and assignment.user_id = auth.uid()
                  and assignment.role_key in ('docente','profesor')
              )
            )
          )
      )
    );
$function$;

revoke all on function private.can_host_community_live_session(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_host_community_live_session(uuid) to authenticated;

drop policy if exists community_live_sessions_space_guard on public.community_live_sessions;
create policy community_live_sessions_space_guard
  on public.community_live_sessions as restrictive
  for all to authenticated
  using (private.can_access_community_space(space_id))
  with check (private.can_access_community_space(space_id));

drop policy if exists community_live_sessions_read on public.community_live_sessions;
create policy community_live_sessions_read
  on public.community_live_sessions
  for select to authenticated
  using (
    visibility = 'community'
    and status in ('scheduled','live')
    and private.has_space_permission(space_id,'view_channels')
  );

drop policy if exists community_live_sessions_insert_professor on public.community_live_sessions;
create policy community_live_sessions_insert_professor
  on public.community_live_sessions
  for insert to authenticated
  with check (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and provider_room_name is null
    and started_at is null
    and ended_at is null
    and visibility = 'community'
    and private.can_host_community_live_session(space_id)
  );

drop policy if exists community_live_sessions_update_owner_scheduled on public.community_live_sessions;
create policy community_live_sessions_update_owner_scheduled
  on public.community_live_sessions
  for update to authenticated
  using (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and private.can_host_community_live_session(space_id)
  )
  with check (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and provider_room_name is null
    and started_at is null
    and ended_at is null
    and visibility = 'community'
    and private.can_host_community_live_session(space_id)
  );

drop policy if exists community_live_sessions_delete_owner_scheduled on public.community_live_sessions;
create policy community_live_sessions_delete_owner_scheduled
  on public.community_live_sessions
  for delete to authenticated
  using (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and private.can_host_community_live_session(space_id)
  );

commit;
