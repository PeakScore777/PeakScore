-- Founder-managed PreICFES server branding. Public read, server-only writes.
alter table public.community_spaces
  add column if not exists icon_path text,
  add column if not exists banner_path text;

alter table public.community_spaces
  drop constraint if exists community_spaces_icon_path_format,
  add constraint community_spaces_icon_path_format check (
    icon_path is null or icon_path ~ ('^spaces/' || id::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$')
  ),
  drop constraint if exists community_spaces_banner_path_format,
  add constraint community_spaces_banner_path_format check (
    banner_path is null or banner_path ~ ('^spaces/' || id::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$')
  );

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('community-profile-avatars','community-profile-avatars',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

create or replace function public.update_community_space_asset(p_space_id uuid,p_asset_type text,p_asset_path text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_community_founder() then
    raise exception 'Only the founder can update community branding' using errcode = '42501';
  end if;
  if p_space_id is null or p_asset_type not in ('icon','banner') or p_asset_path is null
     or p_asset_path !~ ('^spaces/' || p_space_id::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$') then
    raise exception 'Invalid community branding asset' using errcode = '22023';
  end if;
  if not exists (select 1 from public.community_spaces where id = p_space_id and space_type = 'preicfes' and is_enabled = true) then
    raise exception 'Active PreICFES space not found' using errcode = '22023';
  end if;
  if p_asset_type = 'icon' then
    update public.community_spaces set icon_path = p_asset_path, updated_at = now() where id = p_space_id;
  else
    update public.community_spaces set banner_path = p_asset_path, updated_at = now() where id = p_space_id;
  end if;
  insert into private.community_security_audit (actor_user_id,action_key,details)
  values (auth.uid(),'community_space_asset_updated',jsonb_build_object('space_id',p_space_id,'asset_type',p_asset_type));
  return true;
end;
$function$;

revoke all on function public.update_community_space_asset(uuid,text,text) from public,anon,authenticated;
grant execute on function public.update_community_space_asset(uuid,text,text) to authenticated;
