-- Bound rate-limit storage to one compact row per user/action.
-- The previous time-bucket key was correct for enforcement but could accumulate
-- rows indefinitely; one row with a moving minute window is sufficient.

delete from private.community_rate_limits;

alter table private.community_rate_limits
  drop constraint if exists community_rate_limits_pkey;
alter table private.community_rate_limits
  add constraint community_rate_limits_pkey primary key (user_id, action_key);

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
  on conflict (user_id, action_key)
  do update set
    action_count = case
      when private.community_rate_limits.window_start = excluded.window_start
        then private.community_rate_limits.action_count + 1
      else 1
    end,
    window_start = excluded.window_start
  returning action_count into v_count;

  if v_count > v_limit then
    raise exception 'Community rate limit reached. Try again in a minute.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_community_rate_limit() from public, anon, authenticated;
