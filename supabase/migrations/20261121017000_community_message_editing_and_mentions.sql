-- Discord-style message editing and channel-scoped @mention suggestions.
-- Editing changes only the body and edited_at; channel, author, reply and
-- attachment metadata are not writable by authenticated clients.

revoke update on table public.community_messages from authenticated;
grant update (body, edited_at) on table public.community_messages to authenticated;

drop policy if exists community_messages_update_own_body on public.community_messages;
create policy community_messages_update_own_body
  on public.community_messages
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
        and (
          channel.is_private = false
          or exists (
            select 1
            from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  )
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_channels channel
      where channel.id = community_messages.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
        and (
          channel.is_private = false
          or exists (
            select 1
            from public.community_member_roles member_role
            where member_role.user_id = (select auth.uid())
              and member_role.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

create or replace function public.edit_community_message(
  p_message_id uuid,
  p_body text
)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_edited_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_body is null or char_length(btrim(p_body)) < 1 or char_length(btrim(p_body)) > 2000 then
    raise exception 'Message body must contain between 1 and 2000 characters'
      using errcode = '22023';
  end if;

  update public.community_messages message
  set body = btrim(p_body),
      edited_at = clock_timestamp()
  where message.id = p_message_id
    and message.author_id = auth.uid()
  returning message.edited_at into v_edited_at;

  if v_edited_at is null then
    raise exception 'Message not found or editing is not allowed'
      using errcode = '42501';
  end if;

  return v_edited_at;
end;
$function$;

revoke all on function public.edit_community_message(uuid, text)
  from public, anon, authenticated;
grant execute on function public.edit_community_message(uuid, text)
  to authenticated;

-- Mention suggestions are a local-completion data source. Return only a small
-- projection and only for people who can view the selected, active channel.
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
    profile.id,
    profile.full_name,
    profile.avatar_url,
    profile.level
  from public.community_channels channel
  join public.community_public_profiles profile on true
  where auth.uid() is not null
    and channel.id = p_channel_id
    and channel.is_archived = false
    and char_length(btrim(coalesce(p_query, ''))) between 1 and 32
    and profile.id <> auth.uid()
    and strpos(lower(profile.full_name), lower(btrim(p_query))) > 0
    and (
      channel.is_private = false
      or exists (
        select 1
        from public.community_member_roles member_role
        where member_role.user_id = auth.uid()
          and member_role.role_key in ('profesor', 'moderador', 'administrador')
      )
    )
  order by
    (lower(profile.full_name) = lower(btrim(p_query))) desc,
    profile.full_name asc
  limit greatest(1, least(coalesce(p_limit, 8), 8));
$function$;

revoke all on function public.search_community_mention_members(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.search_community_mention_members(uuid, text, integer)
  to authenticated;

comment on function public.edit_community_message(uuid, text) is
  'Edits only a message body owned by auth.uid() in an active writable channel. Column grants prohibit changing identity, channel, reply or attachment fields.';
comment on function public.search_community_mention_members(uuid, text, integer) is
  'Returns up to eight public profile projections matching a local @mention query, scoped to users who can view the requested active channel.';
