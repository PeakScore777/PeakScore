-- Keep the previous mention RPC callable for older clients, but source
-- every displayed field from the independent social identity only.
create or replace function public.search_community_mention_members(
  p_channel_id uuid,
  p_query text,
  p_limit integer default 8
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  level integer
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    member_profile.user_id,
    member_profile.display_name as full_name,
    null::text as avatar_url,
    null::integer as level
  from public.community_channels as channel
  join public.community_member_profiles as member_profile on true
  where auth.uid() is not null
    and channel.id = p_channel_id
    and channel.is_archived = false
    and char_length(btrim(coalesce(p_query, ''))) between 1 and 32
    and strpos(lower(member_profile.display_name), lower(btrim(p_query))) > 0
    and (
      channel.is_private = false
      or exists (
        select 1
        from public.community_member_roles as target_role
        where target_role.user_id = member_profile.user_id
          and target_role.role_key in ('profesor', 'moderador', 'administrador')
      )
    )
  order by
    (lower(member_profile.display_name) = lower(btrim(p_query))) desc,
    member_profile.display_name asc
  limit greatest(1, least(coalesce(p_limit, 8), 8));
$function$;

revoke all on function public.search_community_mention_members(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.search_community_mention_members(uuid, text, integer)
  to authenticated;

comment on function public.search_community_mention_members(uuid, text, integer) is
  'Legacy-compatible @mention projection sourced exclusively from community_member_profiles; game level and avatar fields are never read.';
