-- PeakScore Community: Discord-style role catalogue and founder-owned channel control.
-- Depends on 20261124230000_peakscore_community_authority_consolidated.sql.
-- Does not create paid services or change existing user/profile records.

begin;

alter table public.community_role_catalog
  add column if not exists position integer not null default 100,
  add column if not exists mentionable boolean not null default false,
  add column if not exists hoist boolean not null default false,
  add column if not exists is_system boolean not null default false,
  add column if not exists permissions jsonb not null default
    '{"view_channels":true,"send_messages":true,"attach_files":true,"add_reactions":true}'::jsonb;

alter table public.community_role_catalog
  drop constraint if exists community_role_catalog_position_check;
alter table public.community_role_catalog
  add constraint community_role_catalog_position_check check (position between 0 and 1000);

alter table public.community_role_catalog
  drop constraint if exists community_role_catalog_permissions_object;
alter table public.community_role_catalog
  add constraint community_role_catalog_permissions_object
  check (jsonb_typeof(permissions) = 'object');

update public.community_role_catalog
set
  position = case role_key
    when 'fundador' then 0
    when 'administrador' then 10
    when 'moderador' then 20
    when 'profesor' then 30
    when 'docente' then 40
    when 'estudiante' then 100
    else position
  end,
  is_system = role_key in ('fundador','administrador','moderador','profesor','docente','estudiante'),
  permissions = case
    when role_key = 'estudiante' then '{"view_channels":true,"send_messages":true,"attach_files":true,"add_reactions":true}'::jsonb
    when role_key = 'docente' then '{"view_channels":true,"send_messages":true,"attach_files":true,"add_reactions":true}'::jsonb
    else '{"view_channels":true,"send_messages":true,"attach_files":true,"add_reactions":true}'::jsonb
  end;

alter table public.community_channels
  add column if not exists channel_type text not null default 'text',
  add column if not exists icon_key text not null default 'hash',
  add column if not exists accent_color text not null default '#01C8EF';

alter table public.community_channels
  drop constraint if exists community_channels_type_check;
alter table public.community_channels
  add constraint community_channels_type_check check (channel_type in ('text','announcement'));

alter table public.community_channels
  drop constraint if exists community_channels_icon_key_check;
alter table public.community_channels
  add constraint community_channels_icon_key_check check (icon_key ~ '^[a-z][a-z0-9-]{1,31}$');

alter table public.community_channels
  drop constraint if exists community_channels_accent_color_check;
alter table public.community_channels
  add constraint community_channels_accent_color_check check (accent_color ~ '^#[0-9A-Fa-f]{6}$');

create index if not exists community_role_catalog_position_idx
  on public.community_role_catalog (position, label);
create index if not exists community_channels_category_position_idx
  on public.community_channels (category, position)
  where is_archived = false;

create or replace function private.has_community_permission(p_permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or private.is_community_kicked() then
    return false;
  end if;

  if private.is_community_founder() then
    return true;
  end if;

  if p_permission not in ('view_channels','send_messages','attach_files','add_reactions') then
    return false;
  end if;

  if exists (
    select 1
    from public.community_member_roles assignment
    join public.community_role_catalog role_catalog
      on role_catalog.role_key = assignment.role_key
    where assignment.user_id = v_user_id
      and coalesce((role_catalog.permissions ->> p_permission)::boolean, false)
  ) then
    return true;
  end if;

  -- Existing authenticated members without an explicit role keep the same
  -- baseline participation they have today; this does not grant staff powers.
  return not exists (
    select 1 from public.community_member_roles assignment
    where assignment.user_id = v_user_id
  ) and p_permission in ('view_channels','send_messages','attach_files','add_reactions');
exception
  when invalid_text_representation then
    return false;
end;
$function$;

revoke all on function private.has_community_permission(text) from public, anon, authenticated, service_role;
grant execute on function private.has_community_permission(text) to authenticated;

-- Client can continue reading the role catalogue but only founder RPCs can write it.
revoke insert, update, delete on public.community_role_catalog from anon, authenticated;
grant select on public.community_role_catalog to authenticated;

create or replace function public.manage_community_role_catalog(
  p_action text,
  p_role_key text,
  p_label text,
  p_description text,
  p_badge_color text,
  p_position integer,
  p_display_as_badge boolean,
  p_mentionable boolean,
  p_hoist boolean,
  p_permissions jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_permission_key text;
  v_permission_value jsonb;
  v_is_system boolean;
  v_assignment_count integer;
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can manage community roles' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('create','update','delete') then
    raise exception 'Invalid role catalogue action' using errcode = '22023';
  end if;
  if p_role_key is null or p_role_key !~ '^[a-z][a-z0-9_]{1,31}$' then
    raise exception 'Invalid role key' using errcode = '22023';
  end if;

  if p_action = 'create' and p_role_key in
    ('fundador','administrador','moderador','profesor','docente','estudiante') then
    raise exception 'System role keys are protected' using errcode = '42501';
  end if;

  select coalesce(bool_or(role_catalog.is_system), false)
    into v_is_system
  from public.community_role_catalog role_catalog
  where role_catalog.role_key = p_role_key;

  if p_action in ('update','delete') and not exists (
    select 1 from public.community_role_catalog role_catalog
    where role_catalog.role_key = p_role_key
  ) then
    raise exception 'Role not found' using errcode = '22023';
  end if;

  if p_action = 'delete' then
    if v_is_system then
      raise exception 'System roles cannot be deleted' using errcode = '42501';
    end if;
    select count(*) into v_assignment_count
    from public.community_member_roles assignment
    where assignment.role_key = p_role_key;
    if v_assignment_count > 0 then
      raise exception 'Remove this role from all members before deleting it' using errcode = '23503';
    end if;
    delete from public.community_role_catalog where role_key = p_role_key;
    insert into private.community_security_audit (actor_user_id, action_key, details)
    values (auth.uid(), 'role_catalog_deleted', jsonb_build_object('role_key', p_role_key));
    return true;
  end if;

  if v_is_system and p_action = 'update' then
    -- System-role names and keys remain reserved. Their badge appearance can be
    -- adjusted by the founder, while their capabilities are never broadened here.
    if p_label is null or char_length(btrim(p_label)) not between 2 and 40
       or p_description is null or char_length(p_description) > 240
       or p_badge_color is null or p_badge_color !~ '^#[0-9A-Fa-f]{6}$'
       or p_position is null or p_position not between 0 and 1000 then
      raise exception 'Invalid system role presentation' using errcode = '22023';
    end if;
    update public.community_role_catalog
    set label = btrim(p_label),
        description = p_description,
        badge_color = p_badge_color,
        position = p_position,
        display_as_badge = coalesce(p_display_as_badge, false),
        mentionable = coalesce(p_mentionable, false),
        hoist = coalesce(p_hoist, false)
    where role_key = p_role_key;
  else
    if p_label is null or char_length(btrim(p_label)) not between 2 and 40
       or p_description is null or char_length(p_description) > 240
       or p_badge_color is null or p_badge_color !~ '^#[0-9A-Fa-f]{6}$'
       or p_position is null or p_position not between 0 and 1000
       or p_permissions is null or jsonb_typeof(p_permissions) <> 'object' then
      raise exception 'Invalid custom role configuration' using errcode = '22023';
    end if;

    for v_permission_key, v_permission_value in
      select key, value from jsonb_each(p_permissions)
    loop
      if v_permission_key not in ('view_channels','send_messages','attach_files','add_reactions')
         or jsonb_typeof(v_permission_value) <> 'boolean' then
        raise exception 'Unsupported role permission: %', v_permission_key using errcode = '22023';
      end if;
    end loop;

    if p_action = 'create' then
      insert into public.community_role_catalog
        (role_key,label,description,badge_color,display_as_badge,position,mentionable,hoist,is_system,permissions)
      values
        (p_role_key,btrim(p_label),p_description,p_badge_color,coalesce(p_display_as_badge,false),
         p_position,coalesce(p_mentionable,false),coalesce(p_hoist,false),false,p_permissions);
    else
      update public.community_role_catalog
      set label = btrim(p_label),
          description = p_description,
          badge_color = p_badge_color,
          display_as_badge = coalesce(p_display_as_badge,false),
          position = p_position,
          mentionable = coalesce(p_mentionable,false),
          hoist = coalesce(p_hoist,false),
          permissions = p_permissions
      where role_key = p_role_key and is_system = false;
    end if;
  end if;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (auth.uid(), 'role_catalog_' || p_action,
    jsonb_build_object('role_key',p_role_key,'position',p_position));
  return true;
end;
$function$;

revoke all on function public.manage_community_role_catalog(text,text,text,text,text,integer,boolean,boolean,boolean,jsonb)
  from public, anon, authenticated;
grant execute on function public.manage_community_role_catalog(text,text,text,text,text,integer,boolean,boolean,boolean,jsonb)
  to authenticated;

create or replace function public.manage_community_channel(
  p_action text,
  p_channel_id uuid,
  p_slug text,
  p_name text,
  p_description text,
  p_category text,
  p_position integer,
  p_is_private boolean,
  p_is_read_only boolean,
  p_channel_type text,
  p_icon_key text,
  p_accent_color text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_channel_id uuid := p_channel_id;
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can manage community channels' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('create','update','archive') then
    raise exception 'Invalid channel action' using errcode = '22023';
  end if;

  if p_action = 'archive' then
    if v_channel_id is null then
      raise exception 'A channel id is required' using errcode = '22023';
    end if;
    update public.community_channels
    set is_archived = true
    where id = v_channel_id and is_archived = false;
    if not found then
      raise exception 'Channel not found or already archived' using errcode = '22023';
    end if;
    insert into private.community_security_audit (actor_user_id, action_key, details)
    values (auth.uid(),'channel_archived',jsonb_build_object('channel_id',v_channel_id));
    return v_channel_id;
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}$'
     or p_name is null or char_length(btrim(p_name)) not between 2 and 60
     or p_description is null or char_length(p_description) > 240
     or p_category is null or p_category not in ('COMUNIDAD','MATERIAS','PROFESORES','AULAS Y EVENTOS')
     or p_position is null or p_position not between 0 and 1000
     or p_channel_type is null or p_channel_type not in ('text','announcement')
     or p_icon_key is null or p_icon_key !~ '^[a-z][a-z0-9-]{1,31}$'
     or p_accent_color is null or p_accent_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Invalid channel configuration' using errcode = '22023';
  end if;

  if p_action = 'create' then
    insert into public.community_channels
      (slug,name,description,category,position,is_private,is_read_only,channel_type,icon_key,accent_color)
    values
      (p_slug,btrim(p_name),p_description,p_category,p_position,coalesce(p_is_private,false),
       coalesce(p_is_read_only,false),p_channel_type,p_icon_key,p_accent_color)
    returning id into v_channel_id;
  else
    if v_channel_id is null then
      raise exception 'A channel id is required' using errcode = '22023';
    end if;
    update public.community_channels
    set slug = p_slug,
        name = btrim(p_name),
        description = p_description,
        category = p_category,
        position = p_position,
        is_private = coalesce(p_is_private,false),
        is_read_only = coalesce(p_is_read_only,false),
        channel_type = p_channel_type,
        icon_key = p_icon_key,
        accent_color = p_accent_color
    where id = v_channel_id and is_archived = false;
    if not found then
      raise exception 'Channel not found or archived' using errcode = '22023';
    end if;
  end if;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (auth.uid(),'channel_' || p_action,
    jsonb_build_object('channel_id',v_channel_id,'slug',p_slug,'category',p_category));
  return v_channel_id;
end;
$function$;

revoke all on function public.manage_community_channel(text,uuid,text,text,text,text,integer,boolean,boolean,text,text,text)
  from public, anon, authenticated;
grant execute on function public.manage_community_channel(text,uuid,text,text,text,text,integer,boolean,boolean,text,text,text)
  to authenticated;

-- Channel reads and message writes now consult explicit role capabilities.
-- Accounts without assigned community roles retain the existing member baseline.
drop policy if exists community_channels_read_active on public.community_channels;
create policy community_channels_read_active
  on public.community_channels
  for select to authenticated
  using (
    is_archived = false
    and private.has_community_permission('view_channels')
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

drop policy if exists community_messages_read_active_channel on public.community_messages;
create policy community_messages_read_active_channel
  on public.community_messages
  for select to authenticated
  using (
    private.has_community_permission('view_channels')
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
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
    and private.has_community_permission('send_messages')
    and not private.is_community_timed_out()
    and exists (
      select 1 from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
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
      or private.can_reply_to_community_message(reply_to_message_id, channel_id)
    )
  );

drop policy if exists community_reactions_insert_as_self on public.community_reactions;
create policy community_reactions_insert_as_self
  on public.community_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.has_community_permission('add_reactions')
    and not private.is_community_timed_out()
    and exists (
      select 1 from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = community_reactions.message_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
  );

drop policy if exists community_comments_insert_as_self on public.community_message_comments;
create policy community_comments_insert_as_self
  on public.community_message_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.has_community_permission('send_messages')
    and not private.is_community_timed_out()
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

-- Keep public role badges compatible with custom hierarchy and role mention metadata.
create or replace view public.community_public_role_badges
with (security_invoker = true)
as
select
  member_role.user_id,
  member_role.role_key,
  role_catalog.label,
  role_catalog.badge_color,
  role_catalog.position,
  role_catalog.mentionable,
  role_catalog.hoist
from public.community_member_roles as member_role
join public.community_role_catalog as role_catalog
  on role_catalog.role_key = member_role.role_key
where role_catalog.display_as_badge = true;

revoke all on public.community_public_role_badges from public, anon;
grant select on public.community_public_role_badges to authenticated;

commit;
