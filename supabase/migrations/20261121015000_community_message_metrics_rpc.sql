-- Aggregate community engagement on the server without returning reaction user IDs.
-- SECURITY INVOKER preserves RLS on messages, reactions and comments.
create or replace function public.get_community_message_metrics(
  p_message_ids uuid[]
)
returns table (
  message_id uuid,
  reaction_count bigint,
  comment_count bigint,
  viewer_liked boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if p_message_ids is null or cardinality(p_message_ids) > 60 then
    raise exception 'Invalid message id batch'
      using errcode = '22023';
  end if;

  return query
  with requested_messages as (
    select distinct requested.id
    from unnest(p_message_ids) as requested(id)
  ),
  visible_messages as (
    select m.id
    from public.community_messages m
    join requested_messages requested on requested.id = m.id
  ),
  reaction_counts as (
    select
      r.message_id,
      count(*)::bigint as total,
      coalesce(bool_or(r.user_id = auth.uid() and r.reaction = 'like'), false) as viewer_liked
    from public.community_reactions r
    join visible_messages visible on visible.id = r.message_id
    group by r.message_id
  ),
  comment_counts as (
    select
      c.message_id,
      count(*)::bigint as total
    from public.community_message_comments c
    join visible_messages visible on visible.id = c.message_id
    group by c.message_id
  )
  select
    visible.id,
    coalesce(reactions.total, 0)::bigint,
    coalesce(comments.total, 0)::bigint,
    coalesce(reactions.viewer_liked, false)
  from visible_messages visible
  left join reaction_counts reactions on reactions.message_id = visible.id
  left join comment_counts comments on comments.message_id = visible.id
  order by visible.id;
end;
$function$;

revoke all on function public.get_community_message_metrics(uuid[])
  from public, anon, authenticated;
grant execute on function public.get_community_message_metrics(uuid[])
  to authenticated;

comment on function public.get_community_message_metrics(uuid[]) is
  'Returns RLS-filtered engagement counters and the caller''s like state for at most 60 visible community messages; never returns other users'' reaction identifiers.';
