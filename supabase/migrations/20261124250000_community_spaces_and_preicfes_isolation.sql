-- PeakScore Community: isolated community spaces (global + PreICFES).
-- Each PreICFES space has independent membership and collaborator authority.
-- This migration is intentionally not applied to the live project until the
-- migration ledger is reconciled and the RLS contract tests pass.

begin;

create table if not exists public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  space_type text not null default 'preicfes',
  visibility text not null default 'private',
  icon_key text not null default 'users',
  accent_color text not null default '#01C8EF',
  owner_id uuid not null references public.profiles(id) on delete restrict,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_spaces_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  constraint community_spaces_name_length check (char_length(btrim(name)) between 2 and 60),
  constraint community_spaces_description_length check (char_length(description) <= 500),
  constraint community_spaces_type_check check (space_type in ('global','preicfes')),
  constraint community_spaces_visibility_check check (visibility in ('public','private')),
  constraint community_spaces_icon_key_check check (icon_key ~ '^[a-z][a-z0-9-]{1,31}$'),
  constraint community_spaces_accent_color_check check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint community_spaces_global_public check (space_type <> 'global' or visibility = 'public')
);

create unique index if not exists community_spaces_single_global_idx
  on public.community_spaces (space_type)
  where space_type = 'global';
create index if not exists community_spaces_active_idx
  on public.community_spaces (is_enabled, space_type, created_at desc);

-- The global community keeps its current channels and messages. It is not recreated.
insert into public.community_spaces
  (id,slug,name,description,space_type,visibility,icon_key,accent_color,owner_id)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  'peakscore',
  'PeakScore Community',
  'Comunidad global de PeakScore.',
  'global',
  'public',
  'users',
  '#7FE05C',
  founder.founder_user_id
from private.community_founder_control founder
where founder.singleton = true
on conflict (id) do nothing;

create table if not exists public.community_space_members (
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (space_id,user_id)
);

create index if not exists community_space_members_user_idx
  on public.community_space_members (user_id,space_id);

create table if not exists public.community_space_member_roles (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  user_id uuid not null,
  role_key text not null references public.community_role_catalog(role_key) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  constraint community_space_member_roles_member_fk
    foreign key (space_id,user_id)
    references public.community_space_members(space_id,user_id)
    on delete cascade,
  constraint community_space_member_roles_unique
    unique (space_id,user_id,role_key)
);

create index if not exists community_space_roles_lookup_idx
  on public.community_space_member_roles (space_id,user_id,role_key);
create index if not exists community_space_roles_role_idx
  on public.community_space_member_roles (space_id,role_key,user_id);

create table if not exists private.community_space_restrictions (
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('kick','timeout')),
  reason text not null check (char_length(reason) between 3 and 500),
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  primary key (space_id,user_id),
  constraint community_space_restriction_expiry check (
    (restriction_type = 'kick' and expires_at is null)
    or (restriction_type = 'timeout' and expires_at is not null)
  ),
  constraint community_space_restriction_revocation check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create index if not exists community_space_restrictions_active_idx
  on private.community_space_restrictions (space_id,expires_at)
  where revoked_at is null;

alter table public.community_channels
  add column if not exists space_id uuid;

update public.community_channels
set space_id = '00000000-0000-4000-8000-000000000001'::uuid
where space_id is null;

alter table public.community_channels
  alter column space_id set default '00000000-0000-4000-8000-000000000001'::uuid,
  alter column space_id set not null;

alter table public.community_channels
  drop constraint if exists community_channels_space_id_fkey;
alter table public.community_channels
  add constraint community_channels_space_id_fkey
  foreign key (space_id) references public.community_spaces(id) on delete cascade;

-- Slugs such as #general can exist in multiple independent spaces.
alter table public.community_channels
  drop constraint if exists community_channels_slug_key;
create unique index if not exists community_channels_space_slug_unique
  on public.community_channels (space_id,slug);

-- The collaborator system role is assignable only inside a space, never globally.
insert into public.community_role_catalog
  (role_key,label,description,badge_color,display_as_badge,position,mentionable,hoist,is_system,permissions)
values
  ('colaborador','Colaborador PreICFES','Colaborador limitado a las comunidades PreICFES que le asigne el founder.','#E4B65C',true,50,false,true,true,
   '{"view_channels":true,"send_messages":true,"attach_files":true,"add_reactions":true}'::jsonb)
on conflict (role_key) do update
set label = excluded.label,
    description = excluded.description,
    badge_color = excluded.badge_color,
    position = excluded.position,
    display_as_badge = excluded.display_as_badge,
    is_system = true,
    permissions = excluded.permissions;

create or replace function private.can_access_community_space(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and p_space_id is not null
    and not private.is_community_kicked()
    and exists (
      select 1
      from public.community_spaces space
      where space.id = p_space_id
        and space.is_enabled = true
        and (
          space.visibility = 'public'
          or private.is_community_founder()
          or exists (
            select 1
            from public.community_space_members membership
            where membership.space_id = space.id
              and membership.user_id = auth.uid()
          )
        )
    )
    and not exists (
      select 1
      from private.community_space_restrictions restriction
      where restriction.space_id = p_space_id
        and restriction.user_id = auth.uid()
        and restriction.revoked_at is null
        and (
          restriction.restriction_type = 'kick'
          or restriction.expires_at > now()
        )
    );
$function$;

create or replace function private.has_space_permission(
  p_space_id uuid,
  p_permission text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_space_type text;
  v_has_any_role boolean;
begin
  if not private.can_access_community_space(p_space_id) then
    return false;
  end if;

  if private.is_community_founder() then
    return true;
  end if;

  select space.space_type into v_space_type
  from public.community_spaces space
  where space.id = p_space_id and space.is_enabled = true;

  if v_space_type = 'global' then
    return private.has_community_permission(p_permission);
  end if;

  if p_permission not in ('view_channels','send_messages','attach_files','add_reactions') then
    return false;
  end if;

  select exists (
    select 1
    from public.community_space_member_roles assignment
    where assignment.space_id = p_space_id
      and assignment.user_id = auth.uid()
  ) into v_has_any_role;

  if not v_has_any_role then
    -- Space members without a special role retain ordinary member capabilities.
    return p_permission in ('view_channels','send_messages','attach_files','add_reactions');
  end if;

  return exists (
    select 1
    from public.community_space_member_roles assignment
    join public.community_role_catalog role_catalog
      on role_catalog.role_key = assignment.role_key
    where assignment.space_id = p_space_id
      and assignment.user_id = auth.uid()
      and coalesce((role_catalog.permissions ->> p_permission)::boolean,false)
  );
exception
  when invalid_text_representation then
    return false;
end;
$function$;

create or replace function private.is_space_collaborator(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select private.is_community_founder()
    or exists (
      select 1
      from public.community_space_member_roles assignment
      where assignment.space_id = p_space_id
        and assignment.user_id = auth.uid()
        and assignment.role_key = 'colaborador'
    );
$function$;

revoke all on function private.can_access_community_space(uuid) from public,anon,authenticated,service_role;
revoke all on function private.has_space_permission(uuid,text) from public,anon,authenticated,service_role;
revoke all on function private.is_space_collaborator(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_access_community_space(uuid) to authenticated;
grant execute on function private.has_space_permission(uuid,text) to authenticated;
grant execute on function private.is_space_collaborator(uuid) to authenticated;

alter table public.community_spaces enable row level security;
alter table public.community_space_members enable row level security;
alter table public.community_space_member_roles enable row level security;
alter table private.community_space_restrictions enable row level security;

revoke all on public.community_spaces from public,anon,authenticated;
revoke all on public.community_space_members from public,anon,authenticated;
revoke all on public.community_space_member_roles from public,anon,authenticated;
revoke all on private.community_space_restrictions from public,anon,authenticated,service_role;

grant select on public.community_spaces to authenticated;
grant select on public.community_space_members to authenticated;
grant select on public.community_space_member_roles to authenticated;

drop policy if exists community_spaces_read_accessible on public.community_spaces;
create policy community_spaces_read_accessible
  on public.community_spaces
  for select to authenticated
  using (private.can_access_community_space(id));

drop policy if exists community_space_members_read_accessible on public.community_space_members;
create policy community_space_members_read_accessible
  on public.community_space_members
  for select to authenticated
  using (private.can_access_community_space(space_id));

drop policy if exists community_space_roles_read_accessible on public.community_space_member_roles;
create policy community_space_roles_read_accessible
  on public.community_space_member_roles
  for select to authenticated
  using (private.can_access_community_space(space_id));

create or replace function public.manage_community_space(
  p_action text,
  p_space_id uuid,
  p_slug text,
  p_name text,
  p_description text,
  p_visibility text,
  p_icon_key text,
  p_accent_color text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_space_id uuid := p_space_id;
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can manage community spaces' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('create','update','archive') then
    raise exception 'Invalid space action' using errcode = '22023';
  end if;

  if p_action = 'archive' then
    if v_space_id is null then
      raise exception 'Space id is required' using errcode = '22023';
    end if;
    update public.community_spaces
    set is_enabled = false, updated_at = now()
    where id = v_space_id and space_type = 'preicfes' and is_enabled = true;
    if not found then
      raise exception 'Only an active PreICFES space can be archived' using errcode = '22023';
    end if;
    insert into private.community_security_audit (actor_user_id,action_key,details)
    values (auth.uid(),'community_space_archived',jsonb_build_object('space_id',v_space_id));
    return v_space_id;
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}$'
     or p_name is null or char_length(btrim(p_name)) not between 2 and 60
     or p_description is null or char_length(p_description) > 500
     or p_visibility is null or p_visibility not in ('public','private')
     or p_icon_key is null or p_icon_key !~ '^[a-z][a-z0-9-]{1,31}$'
     or p_accent_color is null or p_accent_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Invalid space configuration' using errcode = '22023';
  end if;

  if p_action = 'create' then
    insert into public.community_spaces
      (slug,name,description,space_type,visibility,icon_key,accent_color,owner_id)
    values
      (p_slug,btrim(p_name),p_description,'preicfes',p_visibility,p_icon_key,p_accent_color,auth.uid())
    returning id into v_space_id;
  else
    if v_space_id is null then
      raise exception 'Space id is required' using errcode = '22023';
    end if;
    update public.community_spaces
    set slug = p_slug,
        name = btrim(p_name),
        description = p_description,
        visibility = p_visibility,
        icon_key = p_icon_key,
        accent_color = p_accent_color,
        updated_at = now()
    where id = v_space_id and space_type = 'preicfes' and is_enabled = true;
    if not found then
      raise exception 'Only an active PreICFES space can be edited' using errcode = '22023';
    end if;
  end if;

  insert into public.community_space_members (space_id,user_id,invited_by)
  values (v_space_id,auth.uid(),auth.uid())
  on conflict (space_id,user_id) do nothing;

  insert into private.community_security_audit (actor_user_id,action_key,details)
  values (auth.uid(),'community_space_' || p_action,
    jsonb_build_object('space_id',v_space_id,'slug',p_slug));
  return v_space_id;
end;
$function$;

revoke all on function public.manage_community_space(text,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.manage_community_space(text,uuid,text,text,text,text,text,text) to authenticated;

create or replace function public.manage_community_space_member(
  p_space_id uuid,
  p_user_id uuid,
  p_action text,
  p_role_key text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_space_type text;
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can manage community space membership' using errcode = '42501';
  end if;
  if p_space_id is null or p_user_id is null
     or p_action is null
     or p_action not in ('invite','remove','grant_role','revoke_role') then
    raise exception 'Invalid space member action' using errcode = '22023';
  end if;

  select space.space_type into v_space_type
  from public.community_spaces space
  where space.id = p_space_id and space.is_enabled = true;
  if v_space_type is distinct from 'preicfes' then
    raise exception 'Membership changes are only supported for PreICFES spaces' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = p_user_id) then
    raise exception 'Member profile not found' using errcode = '22023';
  end if;
  if p_user_id = (select founder_user_id from private.community_founder_control where singleton = true) then
    raise exception 'Founder membership is protected' using errcode = '42501';
  end if;

  if p_action = 'invite' then
    insert into public.community_space_members (space_id,user_id,invited_by)
    values (p_space_id,p_user_id,auth.uid())
    on conflict (space_id,user_id) do nothing;
  elsif p_action = 'remove' then
    delete from public.community_space_members
    where space_id = p_space_id and user_id = p_user_id;
  elsif p_action = 'grant_role' then
    if p_role_key is null or p_role_key in ('fundador','administrador','moderador','profesor')
       or not exists (select 1 from public.community_role_catalog catalog where catalog.role_key = p_role_key) then
      raise exception 'This role cannot be assigned inside a PreICFES space' using errcode = '42501';
    end if;
    insert into public.community_space_members (space_id,user_id,invited_by)
    values (p_space_id,p_user_id,auth.uid())
    on conflict (space_id,user_id) do nothing;
    insert into public.community_space_member_roles (space_id,user_id,role_key,assigned_by)
    values (p_space_id,p_user_id,p_role_key,auth.uid())
    on conflict (space_id,user_id,role_key) do nothing;
  else
    if p_role_key is null then
      raise exception 'Role key is required' using errcode = '22023';
    end if;
    delete from public.community_space_member_roles
    where space_id = p_space_id and user_id = p_user_id and role_key = p_role_key;
  end if;

  insert into private.community_security_audit (actor_user_id,target_user_id,action_key,details)
  values (auth.uid(),p_user_id,'community_space_member_' || p_action,
    jsonb_build_object('space_id',p_space_id,'role_key',p_role_key));
  return true;
end;
$function$;

revoke all on function public.manage_community_space_member(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.manage_community_space_member(uuid,uuid,text,text) to authenticated;

create or replace function public.moderate_community_space_member(
  p_space_id uuid,
  p_target_user_id uuid,
  p_action text,
  p_reason text,
  p_duration_minutes integer default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason,''));
  v_is_founder boolean := private.is_community_founder();
  v_expiry timestamptz;
begin
  if v_actor is null or p_space_id is null or p_target_user_id is null
     or p_target_user_id = v_actor then
    raise exception 'Invalid PreICFES moderation target' using errcode = '22023';
  end if;
  if not private.can_access_community_space(p_space_id) then
    raise exception 'You do not belong to this community' using errcode = '42501';
  end if;
  if not v_is_founder and not private.is_space_collaborator(p_space_id) then
    raise exception 'Only an assigned collaborator can moderate this PreICFES space' using errcode = '42501';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'A moderation reason between 3 and 500 characters is required' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.community_space_member_roles role_assignment
    where role_assignment.space_id = p_space_id
      and role_assignment.user_id = p_target_user_id
      and role_assignment.role_key = 'colaborador'
  ) and not v_is_founder then
    raise exception 'Collaborators cannot moderate other collaborators' using errcode = '42501';
  end if;

  if p_action = 'restore' then
    if not v_is_founder then
      raise exception 'Only the founder can restore space access' using errcode = '42501';
    end if;
    update private.community_space_restrictions
    set revoked_by = v_actor, revoked_at = now(), revocation_reason = v_reason
    where space_id = p_space_id and user_id = p_target_user_id and revoked_at is null;
    if found then
      insert into private.community_security_audit (actor_user_id,target_user_id,action_key,details)
      values (v_actor,p_target_user_id,'community_space_restriction_restored',
        jsonb_build_object('space_id',p_space_id,'reason',v_reason));
    end if;
    return null;
  end if;

  if p_action = 'kick' then
    if p_duration_minutes is not null then
      raise exception 'A kick does not accept a duration' using errcode = '22023';
    end if;
    v_expiry := null;
  elsif p_action = 'timeout' then
    if p_duration_minutes is null or p_duration_minutes < 1 or p_duration_minutes > 10080 then
      raise exception 'Timeout must last between 1 minute and 7 days' using errcode = '22023';
    end if;
    v_expiry := now() + make_interval(mins => p_duration_minutes);
  else
    raise exception 'Unsupported space moderation action' using errcode = '22023';
  end if;

  insert into private.community_space_restrictions
    (space_id,user_id,restriction_type,reason,issued_by,expires_at,revoked_by,revoked_at,revocation_reason)
  values
    (p_space_id,p_target_user_id,p_action,v_reason,v_actor,v_expiry,null,null,null)
  on conflict (space_id,user_id) do update
  set restriction_type = excluded.restriction_type,
      reason = excluded.reason,
      issued_by = excluded.issued_by,
      issued_at = now(),
      expires_at = excluded.expires_at,
      revoked_by = null,
      revoked_at = null,
      revocation_reason = null;

  insert into private.community_security_audit (actor_user_id,target_user_id,action_key,details)
  values (v_actor,p_target_user_id,'community_space_member_' || p_action,
    jsonb_build_object('space_id',p_space_id,'duration_minutes',p_duration_minutes,'reason',v_reason));
  return v_expiry;
end;
$function$;

revoke all on function public.moderate_community_space_member(uuid,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.moderate_community_space_member(uuid,uuid,text,text,integer) to authenticated;

-- Prevent PreICFES-only collaborators from being granted as global roles.
create or replace function private.reject_global_space_only_role()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.role_key = 'colaborador' then
    raise exception 'Colaborador roles are scoped to a PreICFES space' using errcode = '42501';
  end if;
  return new;
end;
$function$;

revoke all on function private.reject_global_space_only_role() from public,anon,authenticated,service_role;

drop trigger if exists community_member_roles_reject_space_role on public.community_member_roles;
create trigger community_member_roles_reject_space_role
before insert or update of role_key on public.community_member_roles
for each row execute function private.reject_global_space_only_role();

-- Restrict every read/write path through the channel's owning space.
drop policy if exists community_space_guard_channels on public.community_channels;
create policy community_space_guard_channels
  on public.community_channels as restrictive
  for all to authenticated
  using (private.can_access_community_space(space_id))
  with check (private.can_access_community_space(space_id));

drop policy if exists community_channels_read_active on public.community_channels;
create policy community_channels_read_active
  on public.community_channels
  for select to authenticated
  using (
    is_archived = false
    and private.has_space_permission(space_id,'view_channels')
    and (
      is_private = false
      or private.is_community_founder()
      or exists (
        select 1 from public.community_member_roles assignment
        where assignment.user_id = (select auth.uid())
          and assignment.role_key in ('profesor','moderador','administrador')
      )
    )
  );

drop policy if exists community_space_guard_messages on public.community_messages;
create policy community_space_guard_messages
  on public.community_messages as restrictive
  for all to authenticated
  using (
    exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and private.can_access_community_space(channel.space_id)
    )
  )
  with check (
    exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and private.can_access_community_space(channel.space_id)
    )
  );

drop policy if exists community_messages_read_active_channel on public.community_messages;
create policy community_messages_read_active_channel
  on public.community_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and not channel.is_archived
        and private.has_space_permission(channel.space_id,'view_channels')
        and (
          channel.is_private = false
          or private.is_community_founder()
          or exists (
            select 1 from public.community_member_roles assignment
            where assignment.user_id = (select auth.uid())
              and assignment.role_key in ('profesor','moderador','administrador')
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
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and not channel.is_archived
        and not channel.is_read_only
        and private.has_space_permission(channel.space_id,'send_messages')
        and (attachment_path is null or private.has_space_permission(channel.space_id,'attach_files'))
        and not private.is_community_timed_out()
        and (
          channel.is_private = false
          or private.is_community_founder()
          or exists (
            select 1 from public.community_member_roles assignment
            where assignment.user_id = (select auth.uid())
              and assignment.role_key in ('profesor','moderador','administrador')
          )
        )
    )
    and (
      reply_to_message_id is null
      or exists (
        select 1 from public.community_messages parent
        where parent.id = reply_to_message_id
          and parent.channel_id = channel_id
      )
    )
  );

drop policy if exists community_space_guard_reactions on public.community_reactions;
create policy community_space_guard_reactions
  on public.community_reactions as restrictive
  for all to authenticated
  using (
    exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and private.can_access_community_space(channel.space_id)
    )
  )
  with check (
    exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and private.can_access_community_space(channel.space_id)
    )
  );

drop policy if exists community_reactions_read on public.community_reactions;
create policy community_reactions_read
  on public.community_reactions
  for select to authenticated
  using (
    exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and private.has_space_permission(channel.space_id,'view_channels')
    )
  );

drop policy if exists community_reactions_insert_as_self on public.community_reactions;
create policy community_reactions_insert_as_self
  on public.community_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and not channel.is_archived
        and not channel.is_read_only
        and private.has_space_permission(channel.space_id,'add_reactions')
        and not private.is_community_timed_out()
    )
  );

drop policy if exists community_space_guard_comments on public.community_message_comments;
create policy community_space_guard_comments
  on public.community_message_comments as restrictive
  for all to authenticated
  using (
    exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and private.can_access_community_space(channel.space_id)
    )
  )
  with check (
    exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and private.can_access_community_space(channel.space_id)
    )
  );

drop policy if exists community_comments_read_active on public.community_message_comments;
create policy community_comments_read_active
  on public.community_message_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and private.has_space_permission(channel.space_id,'view_channels')
    )
  );

drop policy if exists community_comments_insert_as_self on public.community_message_comments;
create policy community_comments_insert_as_self
  on public.community_message_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_message_comments.message_id
        and not channel.is_archived
        and not channel.is_read_only
        and private.has_space_permission(channel.space_id,'send_messages')
        and not private.is_community_timed_out()
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

-- The collaborator has no global powers; even a direct global role assignment is rejected.
-- Global channel/message policies remain otherwise unchanged for the main PeakScore space.

commit;
