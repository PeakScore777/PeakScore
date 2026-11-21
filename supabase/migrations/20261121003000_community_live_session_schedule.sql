-- Public community live-session schedule.
-- Only verified PeakScore creators can schedule sessions.
-- Actual provider room creation and lifecycle transitions are server-only.

create table if not exists public.community_live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  subject text not null default 'General',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  max_participants integer not null default 30,
  status text not null default 'scheduled',
  visibility text not null default 'community',
  provider_room_name text unique,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_live_sessions_title_length
    check (char_length(btrim(title)) between 5 and 100),
  constraint community_live_sessions_description_length
    check (char_length(description) <= 600),
  constraint community_live_sessions_subject_length
    check (char_length(btrim(subject)) between 2 and 40),
  constraint community_live_sessions_duration
    check (duration_minutes between 15 and 120),
  constraint community_live_sessions_max_participants
    check (max_participants between 2 and 30),
  constraint community_live_sessions_status
    check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  constraint community_live_sessions_visibility
    check (visibility in ('community')),
  constraint community_live_sessions_time_order
    check (ended_at is null or started_at is null or ended_at >= started_at)
);

create index if not exists community_live_sessions_status_schedule_idx
  on public.community_live_sessions (status, scheduled_at asc);
create index if not exists community_live_sessions_host_created_idx
  on public.community_live_sessions (host_id, created_at desc);

alter table public.community_live_sessions enable row level security;
revoke all on public.community_live_sessions from public, anon, authenticated;

grant select on public.community_live_sessions to authenticated;
grant insert (
  host_id, title, description, subject, scheduled_at, duration_minutes,
  max_participants, visibility
) on public.community_live_sessions to authenticated;
grant update (
  title, description, subject, scheduled_at, duration_minutes,
  max_participants
) on public.community_live_sessions to authenticated;
grant delete on public.community_live_sessions to authenticated;

drop policy if exists community_live_sessions_read on public.community_live_sessions;
create policy community_live_sessions_read
  on public.community_live_sessions for select to authenticated
  using (
    visibility = 'community'
    and status in ('scheduled', 'live')
  );

drop policy if exists community_live_sessions_insert_professor on public.community_live_sessions;
create policy community_live_sessions_insert_professor
  on public.community_live_sessions for insert to authenticated
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

drop policy if exists community_live_sessions_update_owner_scheduled on public.community_live_sessions;
create policy community_live_sessions_update_owner_scheduled
  on public.community_live_sessions for update to authenticated
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
  );

drop policy if exists community_live_sessions_delete_owner_scheduled on public.community_live_sessions;
create policy community_live_sessions_delete_owner_scheduled
  on public.community_live_sessions for delete to authenticated
  using (
    host_id = (select auth.uid())
    and status = 'scheduled'
    and exists (
      select 1
      from public.community_member_roles mr
      where mr.user_id = (select auth.uid())
        and mr.role_key = 'profesor'
    )
  );

comment on table public.community_live_sessions is
  'Community live-session schedule metadata. Provider credentials and room lifecycle are server-only.';
comment on column public.community_live_sessions.provider_room_name is
  'Internal provider room identifier; never contains a publish key or access token.';
