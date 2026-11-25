-- Allow animated GIFs for community banners only.
-- Icons remain static PNG/JPG/WebP. Uploads are sanitized server-side and
-- community branding writes remain restricted to the platform Founder.

begin;

alter table public.community_spaces
  drop constraint if exists community_spaces_icon_path_format,
  add constraint community_spaces_icon_path_format
    check (icon_path is null or icon_path ~ ('^spaces/' || id::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$')),
  drop constraint if exists community_spaces_banner_path_format,
  add constraint community_spaces_banner_path_format
    check (banner_path is null or banner_path ~ ('^spaces/' || id::text || '/[0-9a-f-]{36}[.](png|jpg|webp|gif)$'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-profile-avatars',
  'community-profile-avatars',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

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
  if auth.uid() is null or not private.is_community_founder() then
    raise exception 'Only the Founder can update community branding' using errcode = '42501';
  end if;

  if p_space_id is null
     or p_asset_type is null
     or p_asset_type not in ('icon','banner')
     or p_asset_path is null then
    raise exception 'Invalid community branding asset' using errcode = '22023';
  end if;

  if p_asset_type = 'icon'
     and p_asset_path !~ ('^spaces/' || p_space_id::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$') then
    raise exception 'Community icons must be static PNG, JPG or WebP files' using errcode = '22023';
  end if;

  if p_asset_type = 'banner'
     and p_asset_path !~ ('^spaces/' || p_space_id::text || '/[0-9a-f-]{36}[.](png|jpg|webp|gif)$') then
    raise exception 'Community banners must be PNG, JPG, WebP or GIF files' using errcode = '22023';
  end if;

  select space.space_type into v_space_type
  from public.community_spaces space
  where space.id = p_space_id and space.is_enabled = true;

  if v_space_type is null or v_space_type not in ('preicfes','global') then
    raise exception 'Active community space not found' using errcode = '22023';
  end if;

  if v_space_type = 'global'
     and p_space_id <> '00000000-0000-4000-8000-000000000001'::uuid then
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

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (
    auth.uid(),
    'community_space_asset_updated',
    jsonb_build_object(
      'space_id', p_space_id,
      'space_type', v_space_type,
      'asset_type', p_asset_type,
      'file_extension', split_part(p_asset_path, '.', 2)
    )
  );

  return true;
end;
$function$;

revoke all on function public.update_community_space_asset(uuid,text,text) from public, anon, authenticated;
grant execute on function public.update_community_space_asset(uuid,text,text) to authenticated;

commit;
