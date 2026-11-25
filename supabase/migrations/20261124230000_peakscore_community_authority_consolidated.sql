-- PeakScore Community authority baseline, consolidated.
-- This migration supersedes the two conflicting founder prototypes on this branch.
-- Apply only after reconciling the remote migration ledger and testing in an isolated database.

begin;

create schema if not exists private;

create table if not exists private.community_founder_control (
  singleton boolean primary key default true check (singleton = true),
  founder_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
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
  user_id uuid primary key references public.profiles(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('kick', 'timeout')),
  reason text not null check (char_length(reason) between 3 and 500),
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  constraint community_member_restriction_expiry_check check (
    (restriction_type = 'kick' and expires_at is null)
    or (restriction_type = 'timeout' and expires_at is not null)
  ),
  constraint community_member_restriction_revocation_check check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create table if not exists private.community_security_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid references public.profiles(id) on delete set null,
  action_key text not null,
  reason text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists community_security_audit_created_idx
  on private.community_security_audit (created_at desc);
create index if not exists community_security_audit_target_idx
  on private.community_security_audit (target_user_id, created_at desc);
create index if not exists community_restrictions_expiry_idx
  on private.community_member_restrictions (expires_at)
  where restriction_type = 'timeout' and revoked_at is null;

alter table private.community_founder_control enable row level security;
alter table private.community_lifecycle enable row level security;
alter table private.community_member_restrictions enable row level security;
alter table private.community_security_audit enable row level security;

revoke all on table private.community_founder_control from public, anon, authenticated, service_role;
revoke all on table private.community_lifecycle from public, anon, authenticated, service_role;
revoke all on table private.community_member_restrictions from public, anon, authenticated, service_role;
revoke all on table private.community_security_audit from public, anon, authenticated, service_role;

create or replace function private.is_community_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null and exists (
    select 1
    from private.community_founder_control founder
    where founder.singleton = true
      and founder.founder_user_id = auth.uid()
  );
$function$;

create or replace function private.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null and (
    private.is_community_founder()
    or exists (
      select 1
      from public.community_member_roles member_role
      where member_role.user_id = auth.uid()
        and member_role.role_key = 'administrador'
    )
  );
$function$;

create or replace function private.is_community_kicked()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and not private.is_community_founder()
    and exists (
      select 1
      from private.community_member_restrictions restriction
      where restriction.user_id = auth.uid()
        and restriction.restriction_type = 'kick'
        and restriction.revoked_at is null
    );
$function$;

create or replace function private.is_community_timed_out()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and not private.is_community_founder()
    and exists (
      select 1
      from private.community_member_restrictions restriction
      where restriction.user_id = auth.uid()
        and restriction.restriction_type = 'timeout'
        and restriction.revoked_at is null
        and restriction.expires_at > clock_timestamp()
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

revoke all on function private.is_community_founder() from public, anon, authenticated, service_role;
revoke all on function private.is_community_admin() from public, anon, authenticated, service_role;
revoke all on function private.is_community_kicked() from public, anon, authenticated, service_role;
revoke all on function private.is_community_timed_out() from public, anon, authenticated, service_role;
revoke all on function private.is_community_enabled() from public, anon, authenticated, service_role;
grant execute on function private.is_community_founder() to authenticated;
grant execute on function private.is_community_admin() to authenticated;
grant execute on function private.is_community_kicked() to authenticated;
grant execute on function private.is_community_timed_out() to authenticated;
grant execute on function private.is_community_enabled() to authenticated;

-- Founder bootstrap is service-role only and anchored to the single platform admin.
-- The identity is immutable once recorded.
create or replace function public.bootstrap_community_founder(p_founder_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin_count integer;
  v_platform_admin uuid;
  v_existing_founder uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     or p_founder_user_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select count(*) into v_admin_count
  from public.profiles profile
  where profile.role = 'admin';

  select profile.id into v_platform_admin
  from public.profiles profile
  where profile.role = 'admin'
  order by profile.id
  limit 1;

  if v_admin_count <> 1 or v_platform_admin is distinct from p_founder_user_id then
    raise exception 'Founder must match the only platform admin' using errcode = '42501';
  end if;

  insert into private.community_founder_control (singleton, founder_user_id)
  values (true, p_founder_user_id)
  on conflict (singleton) do nothing;

  select founder_user_id into v_existing_founder
  from private.community_founder_control
  where singleton = true;

  if v_existing_founder is distinct from p_founder_user_id then
    return false;
  end if;

  insert into public.community_role_catalog
    (role_key, label, description, badge_color, display_as_badge)
  values
    ('fundador', 'Founder', 'Propietario único de PeakScore Community.', '#7FE05C', true),
    ('docente', 'Docente', 'Docente que participa en espacios educativos; sin permisos de moderación.', '#39BDE0', true),
    ('estudiante', 'Estudiante', 'Miembro estudiante de PeakScore Community.', '#91A0AF', false)
  on conflict (role_key) do update
  set label = excluded.label,
      description = excluded.description,
      badge_color = excluded.badge_color,
      display_as_badge = excluded.display_as_badge;

  insert into public.community_member_roles (user_id, role_key, assigned_by)
  values (p_founder_user_id, 'fundador', p_founder_user_id)
  on conflict (user_id, role_key) do nothing;

  return true;
end;
$function$;

revoke all on function public.bootstrap_community_founder(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_community_founder(uuid) to service_role;

-- Founder alone assigns and revokes community roles. Founder itself is immutable.
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
  if v_actor is null or not private.is_community_founder() then
    raise exception 'Only the founder can manage community roles' using errcode = '42501';
  end if;
  if p_target_user_id is null or p_target_user_id = v_actor
     or p_role_key is null or p_role_key = 'fundador' then
    raise exception 'Invalid or protected role assignment' using errcode = '22023';
  end if;
  if p_action is null or p_action not in ('grant', 'revoke') then
    raise exception 'Invalid role action' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = p_target_user_id) then
    raise exception 'Target profile not found' using errcode = '22023';
  end if;
  if not exists (select 1 from public.community_role_catalog catalog where catalog.role_key = p_role_key) then
    raise exception 'Role not found' using errcode = '22023';
  end if;

  if p_action = 'grant' then
    insert into public.community_member_roles (user_id, role_key, assigned_by)
    values (p_target_user_id, p_role_key, v_actor)
    on conflict (user_id, role_key) do nothing;
  else
    delete from public.community_member_roles
    where user_id = p_target_user_id and role_key = p_role_key;
  end if;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (v_actor, p_target_user_id, 'role_' || p_action,
    jsonb_build_object('role_key', p_role_key));

  return true;
end;
$function$;

revoke all on function public.manage_community_member_role(uuid, text, text) from public, anon, authenticated;
grant execute on function public.manage_community_member_role(uuid, text, text) to authenticated;

-- Admins can kick or timeout ordinary members. They cannot remove the founder,
-- another administrator, or a moderator. Teachers and students do not moderate.
create or replace function public.moderate_community_member(
  p_target_user_id uuid,
  p_action text,
  p_reason text default '',
  p_duration_minutes integer default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_expires_at timestamptz;
begin
  if v_actor is null or not private.is_community_admin() then
    raise exception 'Only the founder or an administrator can moderate members' using errcode = '42501';
  end if;
  if p_target_user_id is null or p_target_user_id = v_actor then
    raise exception 'Invalid moderation target' using errcode = '22023';
  end if;
  if exists (
    select 1
    from private.community_founder_control founder
    where founder.singleton = true
      and founder.founder_user_id = p_target_user_id
  ) then
    raise exception 'The founder cannot be moderated' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.community_member_roles member_role
    where member_role.user_id = p_target_user_id
      and member_role.role_key in ('administrador', 'moderador')
  ) then
    raise exception 'Administrators cannot moderate privileged staff roles' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = p_target_user_id) then
    raise exception 'Target profile not found' using errcode = '22023';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'A moderation reason between 3 and 500 characters is required' using errcode = '22023';
  end if;

  if p_action = 'kick' then
    if p_duration_minutes is not null then
      raise exception 'Kick does not accept a duration' using errcode = '22023';
    end if;
    v_expires_at := null;
  elsif p_action = 'timeout' then
    if p_duration_minutes is null or p_duration_minutes < 1 or p_duration_minutes > 40320 then
      raise exception 'Timeout must last between 1 minute and 28 days' using errcode = '22023';
    end if;
    v_expires_at := clock_timestamp() + make_interval(mins => p_duration_minutes);
  else
    raise exception 'Unsupported moderation action' using errcode = '22023';
  end if;

  insert into private.community_member_restrictions
    (user_id, restriction_type, reason, issued_by, issued_at, expires_at, revoked_by, revoked_at, revocation_reason)
  values
    (p_target_user_id, p_action, v_reason, v_actor, clock_timestamp(), v_expires_at, null, null, null)
  on conflict (user_id) do update
  set restriction_type = excluded.restriction_type,
      reason = excluded.reason,
      issued_by = excluded.issued_by,
      issued_at = excluded.issued_at,
      expires_at = excluded.expires_at,
      revoked_by = null,
      revoked_at = null,
      revocation_reason = null;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, reason, details)
  values (
    v_actor, p_target_user_id,
    case when p_action = 'kick' then 'member_kicked' else 'member_timed_out' end,
    v_reason,
    jsonb_build_object('duration_minutes', p_duration_minutes, 'expires_at', v_expires_at)
  );

  return v_expires_at;
end;
$function$;

revoke all on function public.moderate_community_member(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.moderate_community_member(uuid, text, text, integer) to authenticated;

create or replace function public.restore_community_member(
  p_target_user_id uuid,
  p_reason text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can restore community access' using errcode = '42501';
  end if;
  if p_target_user_id is null or char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'A valid target and restoration reason are required' using errcode = '22023';
  end if;

  update private.community_member_restrictions
  set revoked_by = auth.uid(),
      revoked_at = clock_timestamp(),
      revocation_reason = v_reason
  where user_id = p_target_user_id and revoked_at is null;

  if found then
    insert into private.community_security_audit (actor_user_id, target_user_id, action_key, reason)
    values (auth.uid(), p_target_user_id, 'member_restriction_cleared', v_reason);
  end if;
  return true;
end;
$function$;

revoke all on function public.restore_community_member(uuid, text) from public, anon, authenticated;
grant execute on function public.restore_community_member(uuid, text) to authenticated;

create or replace function public.set_community_lifecycle(p_action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can change community lifecycle' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('disable', 'restore') then
    raise exception 'Invalid lifecycle action' using errcode = '22023';
  end if;

  update private.community_lifecycle
  set is_enabled = (p_action = 'restore'),
      disabled_at = case when p_action = 'disable' then clock_timestamp() else null end,
      updated_by = auth.uid(),
      updated_at = clock_timestamp()
  where singleton = true;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (auth.uid(), 'community_' || p_action, '{}'::jsonb);

  return true;
end;
$function$;

revoke all on function public.set_community_lifecycle(text) from public, anon, authenticated;
grant execute on function public.set_community_lifecycle(text) to authenticated;


-- Founder has explicit access to private staff channels without inheriting
-- the professor or administrator role.
drop policy if exists community_founder_read_channels on public.community_channels;
create policy community_founder_read_channels
  on public.community_channels
  for select to authenticated
  using (private.is_community_founder() and is_archived = false);

drop policy if exists community_founder_read_messages on public.community_messages;
create policy community_founder_read_messages
  on public.community_messages
  for select to authenticated
  using (
    private.is_community_founder()
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
    )
  );

drop policy if exists community_founder_insert_messages on public.community_messages;
create policy community_founder_insert_messages
  on public.community_messages
  for insert to authenticated
  with check (
    private.is_community_founder()
    and author_id = (select auth.uid())
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
    and (
      reply_to_message_id is null
      or exists (
        select 1 from public.community_messages parent
        where parent.id = community_messages.reply_to_message_id
          and parent.channel_id = community_messages.channel_id
      )
    )
  );

drop policy if exists community_founder_read_reactions on public.community_reactions;
create policy community_founder_read_reactions
  on public.community_reactions
  for select to authenticated
  using (
    private.is_community_founder()
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and channel.is_archived = false
    )
  );

drop policy if exists community_founder_insert_reactions on public.community_reactions;
create policy community_founder_insert_reactions
  on public.community_reactions
  for insert to authenticated
  with check (
    private.is_community_founder()
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
  );

drop policy if exists community_founder_read_comments on public.community_message_comments;
create policy community_founder_read_comments
  on public.community_message_comments
  for select to authenticated
  using (
    private.is_community_founder()
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and channel.is_archived = false
    )
  );

drop policy if exists community_founder_insert_comments on public.community_message_comments;
create policy community_founder_insert_comments
  on public.community_message_comments
  for insert to authenticated
  with check (
    private.is_community_founder()
    and author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
    and (
      parent_comment_id is null
      or exists (
        select 1
        from public.community_message_comments parent
        where parent.id = community_message_comments.parent_comment_id
          and parent.message_id = community_message_comments.message_id
          and parent.parent_comment_id is null
      )
    )
  );

-- A kicked account cannot inspect the community. A timed-out account can still
-- read, but cannot publish, react, or comment until the timeout expires.
drop policy if exists community_founder_guard_channels on public.community_channels;
create policy community_founder_guard_channels
  on public.community_channels as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_kicked()
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_kicked()
  );

drop policy if exists community_founder_guard_messages on public.community_messages;
create policy community_founder_guard_messages
  on public.community_messages as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_kicked()
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_kicked()
    and not private.is_community_timed_out()
  );

drop policy if exists community_founder_guard_reactions on public.community_reactions;
create policy community_founder_guard_reactions
  on public.community_reactions as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_kicked()
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_kicked()
    and not private.is_community_timed_out()
  );

drop policy if exists community_founder_guard_comments on public.community_message_comments;
create policy community_founder_guard_comments
  on public.community_message_comments as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_kicked()
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_kicked()
    and not private.is_community_timed_out()
  );

drop policy if exists community_founder_guard_live_sessions on public.community_live_sessions;
create policy community_founder_guard_live_sessions
  on public.community_live_sessions as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_kicked()
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_kicked()
    and not private.is_community_timed_out()
  );

commit;
