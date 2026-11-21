-- Resolve persisted @mentions against the social identity, never the game profile.
create or replace function public.resolve_community_mention_members(
  p_channel_id uuid,
  p_user_ids uuid[]
)
returns table (
  user_id uuid,
  full_name text
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    member_profile.user_id,
    member_profile.display_name as full_name
  from public.community_member_profiles as member_profile
  join public.community_channels as channel
    on channel.id = p_channel_id
   and channel.is_archived = false
   and (
     channel.is_private = false
     or exists (
       select 1
       from public.community_member_roles as assigned_role
       where assigned_role.user_id = auth.uid()
         and assigned_role.role_key in ('profesor', 'moderador', 'administrador')
     )
   )
  where auth.uid() is not null
    and p_user_ids is not null
    and cardinality(p_user_ids) <= 80
    and member_profile.user_id = any(p_user_ids);
$function$;

revoke all on function public.resolve_community_mention_members(uuid, uuid[])
  from public, anon;
grant execute on function public.resolve_community_mention_members(uuid, uuid[])
  to authenticated;
