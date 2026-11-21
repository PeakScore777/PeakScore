-- Preserve the old private-channel mention target visibility rule while
-- resolving names from the independent community identity table.
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
  from public.community_channels as channel
  join public.community_member_profiles as member_profile
    on member_profile.user_id = any(p_user_ids)
  where auth.uid() is not null
    and channel.id = p_channel_id
    and channel.is_archived = false
    and p_user_ids is not null
    and cardinality(p_user_ids) between 1 and 80
    and (
      channel.is_private = false
      or exists (
        select 1
        from public.community_member_roles as target_role
        where target_role.user_id = member_profile.user_id
          and target_role.role_key in ('profesor', 'moderador', 'administrador')
      )
    )
  order by member_profile.display_name
  limit 80;
$function$;

revoke all on function public.resolve_community_mention_members(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.resolve_community_mention_members(uuid, uuid[])
  to authenticated;
