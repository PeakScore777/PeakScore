-- Founder identity has one canonical source: community_founder_config,
-- initialized only through the server-only bootstrap RPC in migration 20261121018000.
-- Never infer ownership from a mutable public profile role.

create table if not exists private.community_security_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid references public.profiles(id) on delete set null,
  action_key text not null,
  reason text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists community_security_audit_created_idx
  on private.community_security_audit (created_at desc);
create index if not exists community_security_audit_target_idx
  on private.community_security_audit (target_user_id, created_at desc);

alter table private.community_security_audit enable row level security;
revoke all on table private.community_security_audit from public, anon, authenticated;

create table if not exists private.community_member_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('kick', 'timeout')),
  reason text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revocation_reason text,
  constraint community_member_restrictions_expiry_check check (
    (restriction_type = 'kick' and expires_at is null)
    or (restriction_type = 'timeout' and expires_at is not null)
  )
);

alter table private.community_member_restrictions enable row level security;
revoke all on table private.community_member_restrictions from public, anon, authenticated;

create or replace function private.is_community_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select private.is_community_founder(auth.uid());
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
        and (restriction.expires_at is null or restriction.expires_at > now())
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
        and restriction.expires_at > now()
    );
$function$;

revoke all on function private.is_community_founder() from public, anon, authenticated;
revoke all on function private.is_community_admin() from public, anon, authenticated;
revoke all on function private.is_community_kicked() from public, anon, authenticated;
revoke all on function private.is_community_timed_out() from public, anon, authenticated;
grant execute on function private.is_community_founder() to authenticated;
grant execute on function private.is_community_admin() to authenticated;
grant execute on function private.is_community_kicked() to authenticated;
grant execute on function private.is_community_timed_out() to authenticated;

-- Founder is a protected display role. It is assigned only by this migration;
-- normal role RPCs explicitly refuse to grant or revoke it.
insert into public.community_role_catalog (role_key, label, description, badge_color, display_as_badge)
values ('fundador', 'Fundador', 'Propietario único de la comunidad PeakScore.', '#F2C14E', true)
on conflict (role_key) do update
set label = excluded.label,
    description = excluded.description,
    badge_color = excluded.badge_color,
    display_as_badge = true;

create unique index if not exists community_member_roles_user_role_unique
  on public.community_member_roles (user_id, role_key);

insert into public.community_member_roles (user_id, role_key, assigned_by)
select founder_user_id, 'fundador', founder_user_id
from private.community_founder_config
where singleton = true
on conflict (user_id, role_key) do nothing;

-- Role assignment/revocation is founder-only. The founder role itself is immutable
-- through the public API and can never be delegated.
create or replace function public.assign_community_role(
  p_user_id uuid,
  p_role_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_founder_id uuid;
begin
  if not private.is_community_founder() then
    raise exception 'Only the community founder can assign roles' using errcode = '42501';
  end if;
  if p_user_id is null or p_role_key is null or p_role_key = 'fundador' then
    raise exception 'Invalid or protected role assignment' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = p_user_id) then
    raise exception 'Target account does not exist' using errcode = '22023';
  end if;
  if not exists (select 1 from public.community_role_catalog catalog where catalog.role_key = p_role_key) then
    raise exception 'Role does not exist' using errcode = '22023';
  end if;

  select founder_user_id into v_founder_id
  from private.community_founder_config where singleton = true;

  insert into public.community_member_roles (user_id, role_key, assigned_by)
  values (p_user_id, p_role_key, v_founder_id)
  on conflict (user_id, role_key) do nothing;

  insert into private.community_security_audit (actor_user_id, target_user_id, action_key, reason, details)
  values (auth.uid(), p_user_id, 'founder_role_assigned', '', jsonb_build_object('role_key', p_role_key));

  return true;
end;
$function$;

create or replace function public.revoke_community_role(
  p_user_id uuid,
  p_role_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_community_founder() then
    raise exception 'Only the community founder can revoke roles' using errcode = '42501';
  end if;
  if p_user_id is null or p_role_key is null or p_role_key = 'fundador' then
    raise exception 'The founder role is protected' using errcode = '22023';
  end if;

  delete from public.community_member_roles
  where user_id = p_user_id and role_key = p_role_key;

  if found then
    insert into private.community_security_audit (actor_user_id, target_user_id, action_key, reason, details)
    values (auth.uid(), p_user_id, 'founder_role_revoked', '', jsonb_build_object('role_key', p_role_key));
  end if;
  return true;
end;
$function$;

-- Admins can only kick or apply a temporary timeout. They cannot ban permanently
-- through the UI, assign roles, alter permissions, or remove another administrator.
-- A kick blocks community access until the founder explicitly restores the account.
-- The canonical moderation RPC is defined once in migration 20261121018000
-- with the stable signature (uuid, text, text, integer). Avoid an overloaded
-- PostgREST endpoint with ambiguous named arguments.

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
    raise exception 'Only the community founder can restore a kicked or restricted member' using errcode = '42501';
  end if;
  if p_target_user_id is null or char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'A valid target and restoration reason are required' using errcode = '22023';
  end if;

  update private.community_member_restrictions
  set revoked_by = auth.uid(),
      revoked_at = now(),
      revocation_reason = v_reason
  where user_id = p_target_user_id
    and revoked_at is null;

  if found then
    insert into private.community_security_audit (actor_user_id, target_user_id, action_key, reason)
    values (auth.uid(), p_target_user_id, 'member_restriction_cleared', v_reason);
  end if;
  return true;
end;
$function$;

revoke all on function public.assign_community_role(uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_community_role(uuid, text) from public, anon, authenticated;
revoke all on function public.moderate_community_member(uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.restore_community_member(uuid, text) from public, anon, authenticated;
grant execute on function public.assign_community_role(uuid, text) to authenticated;
grant execute on function public.revoke_community_role(uuid, text) to authenticated;
grant execute on function public.moderate_community_member(uuid, text, integer, text) to authenticated;
grant execute on function public.restore_community_member(uuid, text) to authenticated;

-- Remove community access for kicked accounts and write access for timed-out accounts.
drop policy if exists community_channels_read_active on public.community_channels;
create policy community_channels_read_active
  on public.community_channels
  for select to authenticated
  using (
    is_archived = false
    and (select private.is_community_kicked()) = false
    and (
      is_private = false
      or exists (
        select 1 from public.community_member_roles member_role
        where member_role.user_id = (select auth.uid())
          and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
      )
    )
  );

drop policy if exists community_messages_read_active_channel on public.community_messages;
create policy community_messages_read_active_channel
  on public.community_messages
  for select to authenticated
  using (
    (select private.is_community_kicked()) = false
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_messages_insert_as_self on public.community_messages;
create policy community_messages_insert_as_self
  on public.community_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and (select private.is_community_timed_out()) = false
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_messages_delete_own on public.community_messages;
create policy community_messages_delete_own
  on public.community_messages
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_comments_read_active on public.community_message_comments;
create policy community_comments_read_active
  on public.community_message_comments
  for select to authenticated
  using (
    (select private.is_community_kicked()) = false
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_comments_insert_as_self on public.community_message_comments;
create policy community_comments_insert_as_self
  on public.community_message_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and (select private.is_community_timed_out()) = false
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and channel.is_archived = false
        and channel.is_read_only = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
        and (
          parent_comment_id is null
          or exists (
            select 1 from public.community_message_comments parent
            where parent.id = community_message_comments.parent_comment_id
              and parent.message_id = community_message_comments.message_id
              and parent.parent_comment_id is null
          )
        )
    )
  );

drop policy if exists community_comments_delete_own on public.community_message_comments;
create policy community_comments_delete_own
  on public.community_message_comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_reactions_read on public.community_reactions;
create policy community_reactions_read
  on public.community_reactions
  for select to authenticated
  using (
    (select private.is_community_kicked()) = false
    and exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_reactions_insert_as_self on public.community_reactions;
create policy community_reactions_insert_as_self
  on public.community_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and (select private.is_community_timed_out()) = false
    and exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

drop policy if exists community_reactions_delete_own on public.community_reactions;
create policy community_reactions_delete_own
  on public.community_reactions
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and channel.is_archived = false
        and (
          channel.is_private = false
          or exists (
            select 1 from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador', 'fundador')
          )
        )
    )
  );

-- Kicked accounts must not continue accessing public live community sessions.
drop policy if exists community_live_sessions_read on public.community_live_sessions;
create policy community_live_sessions_read
  on public.community_live_sessions
  for select to authenticated
  using (
    (select private.is_community_kicked()) = false
    and visibility = 'community'
    and status = any (array['scheduled', 'live'])
  );

drop policy if exists community_live_sessions_insert_professor on public.community_live_sessions;
create policy community_live_sessions_insert_professor
  on public.community_live_sessions
  for insert to authenticated
  with check (
    host_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and (select private.is_community_timed_out()) = false
    and status = 'scheduled'
    and provider_room_name is null
    and started_at is null
    and ended_at is null
    and visibility = 'community'
    and exists (
      select 1 from public.community_member_roles member_role
      where member_role.user_id = (select auth.uid())
        and member_role.role_key = 'profesor'
    )
  );

drop policy if exists community_live_sessions_delete_owner_scheduled on public.community_live_sessions;
create policy community_live_sessions_delete_owner_scheduled
  on public.community_live_sessions
  for delete to authenticated
  using (
    host_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and status = 'scheduled'
    and exists (
      select 1 from public.community_member_roles member_role
      where member_role.user_id = (select auth.uid())
        and member_role.role_key = 'profesor'
    )
  );

drop policy if exists community_live_sessions_update_owner_scheduled on public.community_live_sessions;
create policy community_live_sessions_update_owner_scheduled
  on public.community_live_sessions
  for update to authenticated
  using (
    host_id = (select auth.uid())
    and (select private.is_community_kicked()) = false
    and status = 'scheduled'
    and exists (
      select 1 from public.community_member_roles member_role
      where member_role.user_id = (select auth.uid())
        and member_role.role_key = 'profesor'
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

comment on table private.community_founder_config is
  'Single immutable community owner. Role assignment and moderation authority is derived from this server-bootstrapped record, never from client input.';
comment on table private.community_member_restrictions is
  'Current community kick/timeout state. Kick persists until founder restoration; timeout expires automatically.';
comment on table private.community_security_audit is
  'Append-only audit trail for founder role changes and community moderation actions.';
