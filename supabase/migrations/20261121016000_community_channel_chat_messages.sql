-- First-class Discord-style channel chat.
-- Replies are regular messages in the same channel, not nested comments.
-- Image attachments are private, raster-only and uploaded through a server sanitizer.

alter table public.community_messages
  add column if not exists reply_to_message_id uuid
    references public.community_messages(id) on delete set null,
  add column if not exists attachment_path text,
  add column if not exists attachment_alt text;

alter table public.community_messages
  drop constraint if exists community_messages_body_length,
  drop constraint if exists community_messages_body_or_attachment_check,
  drop constraint if exists community_messages_attachment_path_check,
  drop constraint if exists community_messages_attachment_alt_length;

alter table public.community_messages
  add constraint community_messages_body_or_attachment_check
    check (
      (char_length(btrim(body)) between 1 and 2000)
      or (attachment_path is not null and char_length(btrim(body)) = 0)
    ),
  add constraint community_messages_attachment_path_check
    check (
      attachment_path is null
      or (
        attachment_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$'
        and split_part(attachment_path, '/', 1) = author_id::text
      )
    ),
  add constraint community_messages_attachment_alt_length
    check (attachment_alt is null or char_length(attachment_alt) <= 240);

create index if not exists community_messages_reply_target_idx
  on public.community_messages (reply_to_message_id, created_at)
  where reply_to_message_id is not null;

-- A reply must point to a message in the same channel that the author can read.
-- The target SELECT is itself subject to community_messages RLS, including private-channel access.
drop policy if exists community_messages_insert_as_self on public.community_messages;
create policy community_messages_insert_as_self
  on public.community_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.community_channels c
      where c.id = channel_id
        and c.is_archived = false
        and c.is_read_only = false
        and (
          c.is_private = false
          or exists (
            select 1 from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
    and (
      reply_to_message_id is null
      or exists (
        select 1 from public.community_messages parent
        where parent.id = reply_to_message_id
          and parent.channel_id = channel_id
      )
    )
  );

-- Expand the reaction vocabulary from the old fixed buttons to a curated emoji set.
update public.community_reactions
set reaction = case reaction
  when 'like' then '👍'
  when 'heart' then '❤️'
  when 'laugh' then '😂'
  when 'wow' then '😮'
  when 'support' then '🙏'
  else reaction
end
where reaction in ('like', 'heart', 'laugh', 'wow', 'support');

alter table public.community_reactions
  drop constraint if exists community_reactions_allowed;
alter table public.community_reactions
  add constraint community_reactions_allowed
  check (reaction = any (array[
    '👍', '❤️', '😂', '😮', '🙏', '🔥', '🎉', '💯', '😭', '👀',
    '🧠', '🚀', '👏', '🤝', '💡'
  ]::text[]));

-- Keep chat images private. The only write path is the authenticated server endpoint,
-- which checks origin, rate limits, decodes and re-encodes PNG/JPEG/WebP raster data.
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'community-attachments',
  'community-attachments',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Private DB-backed attachment upload limit: 8 images per user per hour.
alter table private.community_rate_limits
  drop constraint if exists community_rate_limits_action_check;
alter table private.community_rate_limits
  add constraint community_rate_limits_action_check
  check (action_key in ('message', 'comment', 'reaction', 'attachment'));

create or replace function public.consume_community_attachment_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_window_start timestamptz;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / 3600) * 3600
  );

  insert into private.community_rate_limits (
    user_id, action_key, window_start, action_count
  )
  values (v_user_id, 'attachment', v_window_start, 1)
  on conflict (user_id, action_key, window_start)
  do update set action_count = private.community_rate_limits.action_count + 1
  returning action_count into v_count;

  return v_count <= 8;
end;
$function$;

revoke all on function public.consume_community_attachment_rate_limit()
  from public, anon, authenticated;
grant execute on function public.consume_community_attachment_rate_limit()
  to authenticated;

-- Replace the earlier metrics projection without exposing reaction user IDs.
-- Reactions are grouped by type, and replies are counted from the message stream.
drop function if exists public.get_community_message_metrics(uuid[]);

create function public.get_community_message_metrics(p_message_ids uuid[])
returns table (
  message_id uuid,
  reaction_count bigint,
  reply_count bigint,
  reaction_counts jsonb,
  viewer_reactions text[]
)
language plpgsql
stable
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_message_ids is null or cardinality(p_message_ids) > 60 then
    raise exception 'Invalid message id batch' using errcode = '22023';
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
  reaction_by_type as (
    select
      r.message_id,
      r.reaction,
      count(*)::integer as total,
      coalesce(bool_or(r.user_id = auth.uid()), false) as viewer_has
    from public.community_reactions r
    join visible_messages visible on visible.id = r.message_id
    group by r.message_id, r.reaction
  ),
  reaction_summary as (
    select
      grouped.message_id,
      sum(grouped.total)::bigint as total,
      jsonb_object_agg(grouped.reaction, grouped.total) as counts,
      coalesce(
        array_agg(grouped.reaction order by grouped.reaction)
          filter (where grouped.viewer_has),
        array[]::text[]
      ) as viewer_reactions
    from reaction_by_type grouped
    group by grouped.message_id
  ),
  reply_counts as (
    select
      reply.reply_to_message_id as message_id,
      count(*)::bigint as total
    from public.community_messages reply
    join visible_messages visible on visible.id = reply.reply_to_message_id
    group by reply.reply_to_message_id
  )
  select
    visible.id,
    coalesce(reactions.total, 0)::bigint,
    coalesce(replies.total, 0)::bigint,
    coalesce(reactions.counts, '{}'::jsonb),
    coalesce(reactions.viewer_reactions, array[]::text[])
  from visible_messages visible
  left join reaction_summary reactions on reactions.message_id = visible.id
  left join reply_counts replies on replies.message_id = visible.id
  order by visible.id;
end;
$function$;

revoke all on function public.get_community_message_metrics(uuid[])
  from public, anon, authenticated;
grant execute on function public.get_community_message_metrics(uuid[])
  to authenticated;

comment on function public.get_community_message_metrics(uuid[]) is
  'Returns RLS-filtered reaction aggregates, the caller''s reaction types and inline reply counts for up to 60 visible messages. Never returns reaction user identifiers.';


-- Signed image URLs are issued only when the parent message is visible under
-- community_messages RLS (including private-channel role rules).
drop policy if exists community_attachments_read_visible_messages on storage.objects;
create policy community_attachments_read_visible_messages
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'community-attachments'
    and exists (
      select 1
      from public.community_messages message
      where message.attachment_path = storage.objects.name
    )
  );

comment on column public.community_messages.reply_to_message_id is
  'Optional reply reference to another message in the same text channel. Replies remain first-class messages in the channel timeline.';
comment on column public.community_messages.attachment_path is
  'Private community-attachments object path, uploaded only through the server-side image sanitizer.';
