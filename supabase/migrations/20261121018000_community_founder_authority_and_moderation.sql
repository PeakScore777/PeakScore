-- PeakScore Community authority boundary:
-- Founder owns irreversible/community-wide operations and role assignment.
-- Administrators may only kick or temporarily timeout ordinary members.
-- Moderators do not inherit administrator or founder capabilities.

create schema if not exists private;

create table if not exists private.community_founder_config (
  singleton boolean primary key default true check (singleton = true),
  founder_user_id uuid not null references public.profiles(id) on delete restrict,
  initialized_at timestamptz not null default clock_timestamp()
);

create table if not exists private.community_lifecycle (
  singleton boolean primary key default true check (singleton = true),
  is_enabled boolean not null default true,
  disabled_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default clock_timestamp()
);

insert into private.community_lifecycle (singleton, is_enabled)
values (true, true)
on conflict (singleton) do nothing;

create table if not exists private.community_member_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('kick', 'timeout')),
  reason text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz,
  revoked_at timestamptz,
  constraint community_member_restrictions_expiry_check
    check (
      (restriction_type = 'kick' and expires_at is null)
      or (restriction_type = 'timeout' and expires_at is not null)
    )
);

create unique index if not exists community_member_restrictions_one_active
  on private.community_member_restrictions (user_id)
  where revoked_at is null;

create index if not exists community_member_restrictions_active_lookup
  on private.community_member_restrictions (user_id, expires_at)
  where revoked_at is null;

create table if not exists private.community_security_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action_key text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists community_security_audit_created_idx
  on private.community_security_audit (created_at desc);

alter table private.community_founder_config enable row level security;
alter table private.community_lifecycle enable row level security;
alter table private.community_member_restrictions enable row level security;
alter table private.community_security_audit enable row level security;

revoke all on private.community_founder_config from public, anon, authenticated, service_role;
revoke all on private.community_lifecycle from public, anon, authenticated, service_role;
revoke all on private.community_member_restrictions from public, anon, authenticated, service_role;
revoke all on private.community_security_audit from public, anon, authenticated, service_role;

-- Founder identity is bootstrapped once through a server-only service-role call.
-- The application route additionally requires COMMUNITY_FOUNDER_USER_ID to match
-- the signed-in user. ON CONFLICT DO NOTHING prevents identity replacement.
create or replace function public.bootstrap_community_founder(p_founder_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_existing_founder uuid;
  v_inserted_rows integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' or p_founder_user_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_founder_user_id) then
    raise exception 'Founder profile not found' using errcode = '22023';
  end if;

  insert into private.community_founder_config (singleton, founder_user_id)
  values (true, p_founder_user_id)
  on conflict (singleton) do nothing;
  get diagnostics v_inserted_rows = row_count;

  select founder_user_id
    into v_existing_founder
  from private.community_founder_config
  where singleton = true;

  if v_existing_founder is distinct from p_founder_user_id then
    return false;
  end if;

  insert into public.community_role_catalog
    (role_key, label, description, badge_color, display_as_badge)
  values
    ('fundador', 'Fundador', 'Propietario único de la comunidad PeakScore.', '#E9B949', true)
  on conflict (role_key) do update set
    label = excluded.label,
    description = excluded.description,
    badge_color = excluded.badge_color,
    display_as_badge = true;

  insert into public.community_member_roles (user_id, role_key, assigned_by)
  values (p_founder_user_id, 'fundador', p_founder_user_id)
  on conflict (user_id, role_key) do nothing;

  if v_inserted_rows > 0 then
    insert into private.community_security_audit
      (actor_user_id, target_user_id, action_key, details)
    values
      (p_founder_user_id, p_founder_user_id, 'founder_bootstrapped', jsonb_build_object('source', 'server_allowlist'));
  end if;

  return true;
end;
$function$;

revoke all on function public.bootstrap_community_founder(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_community_founder(uuid) to service_role;

create or replace function private.is_community_founder(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id is not null and exists (
    select 1
    from private.community_founder_config founder
    where founder.singleton = true
      and founder.founder_user_id = p_user_id
  );
$function$;

create or replace function private.is_community_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce((
    select lifecycle.is_enabled
    from private.community_lifecycle lifecycle
    where lifecycle.singleton = true
  ), false);
$function$;

create or replace function private.is_community_user_restricted(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id is not null and exists (
    select 1
    from private.community_member_restrictions restriction
    where restriction.user_id = p_user_id
      and restriction.revoked_at is null
      and (
        restriction.restriction_type = 'kick'
        or restriction.expires_at > now()
      )
  );
$function$;

revoke all on function private.is_community_founder(uuid) from public, anon, authenticated, service_role;
revoke all on function private.is_community_enabled() from public, anon, authenticated, service_role;
revoke all on function private.is_community_user_restricted(uuid) from public, anon, authenticated, service_role;

-- This RPC is callable by authenticated clients, but every action is checked
-- against the immutable founder identity stored in the private singleton.
create or replace function public.manage_community_member_role(
  p_target_user_id uuid,
  p_role_key text,
  p_action text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.is_community_founder(v_actor) then
    raise exception 'Only the founder can manage community roles' using errcode = '42501';
  end if;

  if p_target_user_id is null or p_target_user_id = v_actor
     and p_role_key = 'fundador' then
    raise exception 'Invalid role target' using errcode = '22023';
  end if;

  if p_role_key is null or p_role_key = 'fundador' then
    raise exception 'The founder role is immutable' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('grant', 'revoke') then
    raise exception 'Invalid role action' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_target_user_id) then
    raise exception 'Target profile not found' using errcode = '22023';
  end if;

  if not exists (select 1 from public.community_role_catalog role_catalog where role_catalog.role_key = p_role_key) then
    raise exception 'Unknown community role' using errcode = '22023';
  end if;

  if p_action = 'grant' then
    insert into public.community_member_roles (user_id, role_key, assigned_by)
    values (p_target_user_id, p_role_key, v_actor)
    on conflict (user_id, role_key) do nothing;
  else
    delete from public.community_member_roles
    where user_id = p_target_user_id
      and role_key = p_role_key;
  end if;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (
    v_actor,
    p_target_user_id,
    'role_' || p_action,
    jsonb_build_object('role_key', p_role_key)
  );

  return true;
end;
$function$;

revoke all on function public.manage_community_member_role(uuid, text, text) from public, anon, authenticated;
grant execute on function public.manage_community_member_role(uuid, text, text) to authenticated;

-- Administrators are allowed to kick or timeout ordinary members only.
-- They cannot act on the founder, admins, moderators or teachers.
create or replace function public.moderate_community_member(
  p_target_user_id uuid,
  p_action text,
  p_reason text default '',
  p_duration_minutes integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_is_founder boolean;
  v_is_admin boolean;
  v_restriction_id uuid;
begin
  if v_actor is null or p_target_user_id is null or p_target_user_id = v_actor then
    raise exception 'Invalid moderation target' using errcode = '22023';
  end if;

  v_is_founder := private.is_community_founder(v_actor);
  select exists (
    select 1 from public.community_member_roles role_assignment
    where role_assignment.user_id = v_actor
      and role_assignment.role_key = 'administrador'
  ) into v_is_admin;

  if not v_is_founder and not v_is_admin then
    raise exception 'Only the founder or an administrator can moderate members' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('kick', 'timeout') then
    raise exception 'Administrators may only kick or timeout members' using errcode = '42501';
  end if;

  if p_action = 'timeout'
     and (p_duration_minutes is null or p_duration_minutes < 1 or p_duration_minutes > 40320) then
    raise exception 'Timeout duration must be between 1 minute and 28 days' using errcode = '22023';
  end if;

  if p_action = 'kick' and p_duration_minutes is not null then
    raise exception 'Kick does not accept a duration' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_target_user_id) then
    raise exception 'Target profile not found' using errcode = '22023';
  end if;

  if not v_is_founder and exists (
    select 1 from public.community_member_roles protected_role
    where protected_role.user_id = p_target_user_id
      and protected_role.role_key in ('fundador', 'administrador', 'moderador', 'profesor')
  ) then
    raise exception 'Administrators cannot moderate privileged community roles' using errcode = '42501';
  end if;

  update private.community_member_restrictions
  set revoked_at = clock_timestamp()
  where user_id = p_target_user_id
    and revoked_at is null;

  insert into private.community_member_restrictions
    (user_id, restriction_type, reason, created_by, expires_at)
  values (
    p_target_user_id,
    p_action,
    left(coalesce(p_reason, ''), 500),
    v_actor,
    case when p_action = 'timeout'
      then clock_timestamp() + make_interval(mins => p_duration_minutes)
      else null
    end
  )
  returning id into v_restriction_id;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (
    v_actor,
    p_target_user_id,
    'member_' || p_action,
    jsonb_build_object(
      'restriction_id', v_restriction_id,
      'duration_minutes', p_duration_minutes,
      'reason', left(coalesce(p_reason, ''), 500)
    )
  );

  return v_restriction_id;
end;
$function$;

revoke all on function public.moderate_community_member(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.moderate_community_member(uuid, text, text, integer) to authenticated;

-- A community deletion is a reversible soft-disable. Physical deletion of
-- channels, messages and evidence is intentionally not exposed as an RPC.
create or replace function public.set_community_lifecycle(p_action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.is_community_founder(v_actor) then
    raise exception 'Only the founder can change community lifecycle' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('disable', 'restore') then
    raise exception 'Invalid community lifecycle action' using errcode = '22023';
  end if;

  update private.community_lifecycle
  set is_enabled = (p_action = 'restore'),
      disabled_at = case when p_action = 'disable' then clock_timestamp() else null end,
      updated_by = v_actor,
      updated_at = clock_timestamp()
  where singleton = true;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (v_actor, null, 'community_' || p_action, '{}'::jsonb);

  return true;
end;
$function$;

revoke all on function public.set_community_lifecycle(text) from public, anon, authenticated;
grant execute on function public.set_community_lifecycle(text) to authenticated;

-- Restrictive policies are ANDed with existing permissive RLS policies.
-- They apply to every route and direct Supabase request, not just the UI.
drop policy if exists community_lifecycle_guard_channels on public.community_channels;
create policy community_lifecycle_guard_channels
  on public.community_channels as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_messages on public.community_messages;
create policy community_lifecycle_guard_messages
  on public.community_messages as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_reactions on public.community_reactions;
create policy community_lifecycle_guard_reactions
  on public.community_reactions as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_comments on public.community_message_comments;
create policy community_lifecycle_guard_comments
  on public.community_message_comments as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_live_sessions on public.community_live_sessions;
create policy community_lifecycle_guard_live_sessions
  on public.community_live_sessions as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

-- The helpers are used only from RLS policies and SECURITY DEFINER functions.
-- Grant schema usage for policy expression resolution; function execution is
-- explicitly restricted to the authenticated role.
grant usage on schema private to authenticated;
grant execute on function private.is_community_enabled() to authenticated;
grant execute on function private.is_community_user_restricted(uuid) to authenticated;


-- SECURITY DEFINER message-edit RPCs bypass table RLS by design, so mirror
-- the global community lifecycle and timeout checks inside the function.
create or replace function public.edit_community_message(
  p_message_id uuid,
  p_body text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_edited_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not private.is_community_enabled()
     or private.is_community_user_restricted(v_user_id) then
    raise exception 'Community access is restricted' using errcode = '42501';
  end if;

  if p_body is null or char_length(btrim(p_body)) < 1 or char_length(btrim(p_body)) > 2000 then
    raise exception 'Message body must contain between 1 and 2000 characters'
      using errcode = '22023';
  end if;

  update public.community_messages message
  set body = btrim(p_body),
      edited_at = clock_timestamp()
  where message.id = p_message_id
    and message.author_id = v_user_id
    and exists (
      select 1
      from public.community_channels channel
      where channel.id = message.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
        and (
          channel.is_private = false
          or exists (
            select 1
            from public.community_member_roles member_role
            where member_role.user_id = v_user_id
              and member_role.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  returning message.edited_at into v_edited_at;

  if v_edited_at is null then
    raise exception 'Message not found or editing is not allowed'
      using errcode = '42501';
  end if;

  return v_edited_at;
end;
$function$;

revoke all on function public.edit_community_message(uuid, text)
  from public, anon, authenticated;
grant execute on function public.edit_community_message(uuid, text)
  to authenticated;
