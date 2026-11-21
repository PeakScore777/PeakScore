-- Community abuse controls and private-channel policy consistency.
-- The limiter runs inside Postgres so it cannot be bypassed by changing the browser client.

create table if not exists private.community_rate_limits (
  user_id uuid not null,
  action_key text not null,
  window_start timestamptz not null,
  action_count integer not null default 0,
  primary key (user_id, action_key, window_start),
  constraint community_rate_limits_action_check
    check (action_key in ('message', 'comment', 'reaction')),
  constraint community_rate_limits_count_check
    check (action_count >= 0)
);

alter table private.community_rate_limits enable row level security;
revoke all on private.community_rate_limits from public, anon, authenticated;

create or replace function private.enforce_community_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_action text;
  v_limit integer;
  v_window_start timestamptz;
  v_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if tg_table_name = 'community_messages' then
    v_action := 'message';
    v_limit := 5;
    if new.author_id <> v_user_id then
      raise exception 'Invalid community author'
        using errcode = '42501';
    end if;
  elsif tg_table_name = 'community_message_comments' then
    v_action := 'comment';
    v_limit := 10;
    if new.author_id <> v_user_id then
      raise exception 'Invalid community author'
        using errcode = '42501';
    end if;
  elsif tg_table_name = 'community_reactions' then
    v_action := 'reaction';
    v_limit := 30;
    if new.user_id <> v_user_id then
      raise exception 'Invalid community author'
        using errcode = '42501';
    end if;
  else
    raise exception 'Unsupported community action'
      using errcode = '22023';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / 60) * 60
  );

  insert into private.community_rate_limits (
    user_id, action_key, window_start, action_count
  )
  values (v_user_id, v_action, v_window_start, 1)
  on conflict (user_id, action_key, window_start)
  do update set action_count = private.community_rate_limits.action_count + 1
  returning action_count into v_count;

  if v_count > v_limit then
    raise exception 'Community rate limit reached. Try again in a minute.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_community_rate_limit() from public, anon, authenticated;

drop trigger if exists community_messages_rate_limit on public.community_messages;
create trigger community_messages_rate_limit
  before insert on public.community_messages
  for each row execute function private.enforce_community_rate_limit();

drop trigger if exists community_comments_rate_limit on public.community_message_comments;
create trigger community_comments_rate_limit
  before insert on public.community_message_comments
  for each row execute function private.enforce_community_rate_limit();

drop trigger if exists community_reactions_rate_limit on public.community_reactions;
create trigger community_reactions_rate_limit
  before insert on public.community_reactions
  for each row execute function private.enforce_community_rate_limit();

-- Reactions must obey the same private-channel check as reading channel content.
drop policy if exists community_reactions_insert_as_self on public.community_reactions;
create policy community_reactions_insert_as_self
  on public.community_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_reactions_delete_own on public.community_reactions;
create policy community_reactions_delete_own
  on public.community_reactions for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_comments_delete_own on public.community_message_comments;
create policy community_comments_delete_own
  on public.community_message_comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = community_message_comments.message_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_messages_delete_own on public.community_messages;
create policy community_messages_delete_own
  on public.community_messages for delete to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_channels c
      where c.id = community_messages.channel_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );
