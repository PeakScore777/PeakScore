-- Founder-managed branding for the global PeakScore community.
-- The existing spaces branding flow is extended to the unique global space.

begin;

create or replace function public.update_community_space_asset(
  p_space_id uuid,
  p_asset_type text,
  p_asset_path text
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
    raise exception 'Only the founder can update community branding' using errcode = '42501';
  end if;

  if p_space_id is null or p_asset_type is null or p_asset_type not in ('icon','banner') or p_asset_path is null
     or p_asset_path !~ ('^spaces/' || p_space_id::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$') then
    raise exception 'Invalid community branding asset' using errcode = '22023';
  end if;

  select space.space_type into v_space_type
  from public.community_spaces space
  where space.id = p_space_id and space.is_enabled = true;

  if v_space_type is null or v_space_type not in ('preicfes','global') then
    raise exception 'Active community space not found' using errcode = '22023';
  end if;

  if v_space_type = 'global' and p_space_id <> '00000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'Invalid global community identity' using errcode = '22023';
  end if;

  if p_asset_type = 'icon' then
    update public.community_spaces
    set icon_path = p_asset_path, updated_at = now()
    where id = p_space_id;
  else
    update public.community_spaces
    set banner_path = p_asset_path, updated_at = now()
    where id = p_space_id;
  end if;

  insert into private.community_security_audit (actor_user_id,action_key,details)
  values (auth.uid(),'community_space_asset_updated',
    jsonb_build_object('space_id',p_space_id,'space_type',v_space_type,'asset_type',p_asset_type));

  return true;
end;
$function$;

revoke all on function public.update_community_space_asset(uuid,text,text) from public,anon,authenticated;
grant execute on function public.update_community_space_asset(uuid,text,text) to authenticated;

create or replace function public.update_community_global_branding(
  p_name text,
  p_description text,
  p_icon_key text,
  p_accent_color text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can manage global community branding' using errcode = '42501';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 2 and 60
     or p_description is null or char_length(p_description) > 500
     or p_icon_key is null or p_icon_key !~ '^[a-z][a-z0-9-]{1,31}$'
     or p_accent_color is null or p_accent_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Invalid global community branding' using errcode = '22023';
  end if;

  update public.community_spaces
  set name = btrim(p_name),
      description = p_description,
      icon_key = p_icon_key,
      accent_color = p_accent_color,
      updated_at = now()
  where id = '00000000-0000-4000-8000-000000000001'::uuid
    and space_type = 'global'
    and is_enabled = true;

  if not found then
    raise exception 'Global community space is unavailable' using errcode = '22023';
  end if;

  insert into private.community_security_audit (actor_user_id,action_key,details)
  values (auth.uid(),'community_global_branding_updated',
    jsonb_build_object('name',btrim(p_name),'icon_key',p_icon_key,'accent_color',p_accent_color));

  return true;
end;
$function$;

revoke all on function public.update_community_global_branding(text,text,text,text) from public,anon,authenticated;
grant execute on function public.update_community_global_branding(text,text,text,text) to authenticated;

commit;
