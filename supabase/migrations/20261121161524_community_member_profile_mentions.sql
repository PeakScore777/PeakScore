-- Mention lookup is based only on independent social identities.
create or replace function public.search_community_member_profiles(
  p_channel_id uuid,
  p_query text,
  p_limit integer default 8
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  status_text text
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
    member_profile.status_text
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
    and char_length(btrim(coalesce(p_query, ''))) between 1 and 40
    and member_profile.display_name ilike
      '%' || replace(replace(replace(btrim(p_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%'
  order by member_profile.display_name
  limit greatest(1, least(coalesce(p_limit, 8), 8));
$function$;

revoke all on function public.search_community_member_profiles(uuid, text, integer)
  from public, anon;
grant execute on function public.search_community_member_profiles(uuid, text, integer)
  to authenticated;
