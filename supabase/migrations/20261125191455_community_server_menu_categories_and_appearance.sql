-- Founder-managed server categories and shared community canvas appearance.
begin;

alter table public.community_spaces
  add column if not exists background_color text not null default '#171c24';

alter table public.community_spaces
  drop constraint if exists community_spaces_background_color_check,
  add constraint community_spaces_background_color_check
    check (background_color ~ '^#[0-9A-Fa-f]{6}$');

create table if not exists public.community_channel_categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  name text not null,
  position integer not null default 100,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_channel_categories_name_length
    check (char_length(btrim(name)) between 2 and 40),
  constraint community_channel_categories_position_range
    check (position between 0 and 1000)
);

create unique index if not exists community_channel_categories_space_name_uidx
  on public.community_channel_categories (space_id, lower(btrim(name)))
  where is_archived = false;

create index if not exists community_channel_categories_space_order_idx
  on public.community_channel_categories (space_id, position, lower(name))
  where is_archived = false;

alter table public.community_channel_categories enable row level security;

drop policy if exists community_channel_categories_read_accessible
  on public.community_channel_categories;
create policy community_channel_categories_read_accessible
  on public.community_channel_categories
  for select to authenticated
  using (
    is_archived = false
    and private.can_access_community_space(space_id)
  );

revoke all on table public.community_channel_categories from public, anon, authenticated;
grant select on table public.community_channel_categories to authenticated;

insert into public.community_channel_categories (space_id, name, position)
select
  channel.space_id,
  btrim(channel.category),
  row_number() over (partition by channel.space_id order by min(channel.position), lower(btrim(channel.category))) * 10
from public.community_channels channel
where channel.is_archived = false
group by channel.space_id, btrim(channel.category)
on conflict (space_id, lower(btrim(name))) where is_archived = false do nothing;

create or replace function public.manage_community_channel_category(
  p_action text,
  p_category_id uuid,
  p_name text,
  p_position integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_space_id constant uuid := '00000000-0000-4000-8000-000000000001'::uuid;
  v_category_id uuid := p_category_id;
  v_old_name text;
  v_name text := nullif(btrim(p_name), '');
begin
  if auth.uid() is null or not private.is_community_founder() then
    raise exception 'Only the Founder can manage community categories' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.community_spaces
    where id = v_space_id and space_type = 'global' and is_enabled = true
  ) then
    raise exception 'The global community is unavailable' using errcode = '22023';
  end if;

  if p_action is null or p_action not in ('create','update','archive') then
    raise exception 'Invalid category action' using errcode = '22023';
  end if;

  if p_action = 'archive' then
    if v_category_id is null then
      raise exception 'A category id is required' using errcode = '22023';
    end if;

    select name into v_old_name
    from public.community_channel_categories
    where id = v_category_id and space_id = v_space_id and is_archived = false;

    if v_old_name is null then
      raise exception 'Category not found' using errcode = '22023';
    end if;

    if exists (
      select 1 from public.community_channels
      where space_id = v_space_id and category = v_old_name and is_archived = false
    ) then
      raise exception 'Move or archive the channels in this category before archiving it' using errcode = '22023';
    end if;

    update public.community_channel_categories
    set is_archived = true, updated_at = now()
    where id = v_category_id and space_id = v_space_id;

    insert into private.community_security_audit (actor_user_id, action_key, details)
    values (auth.uid(), 'community_channel_category_archived',
      jsonb_build_object('category_id', v_category_id, 'name', v_old_name));
    return v_category_id;
  end if;

  if v_name is null or char_length(v_name) not between 2 and 40
     or p_position is null or p_position not between 0 and 1000 then
    raise exception 'Invalid category name or position' using errcode = '22023';
  end if;

  if p_action = 'create' then
    insert into public.community_channel_categories (space_id, name, position, created_by)
    values (v_space_id, v_name, p_position, auth.uid())
    returning id into v_category_id;
  else
    if v_category_id is null then
      raise exception 'A category id is required' using errcode = '22023';
    end if;

    select name into v_old_name
    from public.community_channel_categories
    where id = v_category_id and space_id = v_space_id and is_archived = false;

    if v_old_name is null then
      raise exception 'Category not found' using errcode = '22023';
    end if;

    update public.community_channel_categories
    set name = v_name, position = p_position, updated_at = now()
    where id = v_category_id and space_id = v_space_id;

    update public.community_channels
    set category = v_name
    where space_id = v_space_id and category = v_old_name and is_archived = false;
  end if;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (auth.uid(), 'community_channel_category_' || p_action,
    jsonb_build_object('category_id', v_category_id, 'name', v_name, 'position', p_position));

  return v_category_id;
end;
$function$;

revoke all on function public.manage_community_channel_category(text,uuid,text,integer)
  from public, anon, authenticated;
grant execute on function public.manage_community_channel_category(text,uuid,text,integer)
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
  v_space_id constant uuid := '00000000-0000-4000-8000-000000000001'::uuid;
begin
  if auth.uid() is null or not private.is_community_founder() then
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
    where id = v_channel_id and space_id = v_space_id and is_archived = false;
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
     or p_category is null or char_length(btrim(p_category)) not between 2 and 40
     or (
       p_category not in ('COMUNIDAD','MATERIAS','PROFESORES','AULAS Y EVENTOS')
       and not exists (
         select 1 from public.community_channel_categories category
         where category.space_id = v_space_id
           and category.is_archived = false
           and lower(btrim(category.name)) = lower(btrim(p_category))
       )
     )
     or p_position is null or p_position not between 0 and 1000
     or p_channel_type is null or p_channel_type not in ('text','announcement')
     or p_icon_key is null or p_icon_key !~ '^[a-z][a-z0-9-]{1,31}$'
     or p_accent_color is null or p_accent_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Invalid channel configuration' using errcode = '22023';
  end if;

  if p_action = 'create' then
    insert into public.community_channels
      (space_id,slug,name,description,category,position,is_private,is_read_only,channel_type,icon_key,accent_color)
    values
      (v_space_id,p_slug,btrim(p_name),p_description,btrim(p_category),p_position,
       coalesce(p_is_private,false),coalesce(p_is_read_only,false),p_channel_type,p_icon_key,p_accent_color)
    returning id into v_channel_id;
  else
    if v_channel_id is null then
      raise exception 'A channel id is required' using errcode = '22023';
    end if;
    update public.community_channels
    set slug = p_slug,
        name = btrim(p_name),
        description = p_description,
        category = btrim(p_category),
        position = p_position,
        is_private = coalesce(p_is_private,false),
        is_read_only = coalesce(p_is_read_only,false),
        channel_type = p_channel_type,
        icon_key = p_icon_key,
        accent_color = p_accent_color
    where id = v_channel_id and space_id = v_space_id and is_archived = false;
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

create or replace function public.update_community_global_appearance(p_background_color text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not private.is_community_founder() then
    raise exception 'Only the Founder can change the global community appearance' using errcode = '42501';
  end if;

  if p_background_color is null or p_background_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Invalid community background color' using errcode = '22023';
  end if;

  update public.community_spaces
  set background_color = upper(p_background_color), updated_at = now()
  where id = '00000000-0000-4000-8000-000000000001'::uuid
    and space_type = 'global'
    and is_enabled = true;

  if not found then
    raise exception 'The global community is unavailable' using errcode = '22023';
  end if;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (auth.uid(), 'community_global_appearance_updated',
    jsonb_build_object('background_color', upper(p_background_color)));

  return true;
end;
$function$;

revoke all on function public.update_community_global_appearance(text) from public, anon, authenticated;
grant execute on function public.update_community_global_appearance(text) to authenticated;

commit;
