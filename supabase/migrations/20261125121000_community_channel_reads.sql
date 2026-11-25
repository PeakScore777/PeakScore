-- Per-member channel read markers for multi-device unread indicators.

begin;

create table if not exists public.community_channel_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create index if not exists community_channel_reads_channel_time_idx
  on public.community_channel_reads (channel_id, last_read_at desc);

alter table public.community_channel_reads enable row level security;

revoke all on public.community_channel_reads from public, anon;
grant select, insert, update on public.community_channel_reads to authenticated;

drop policy if exists community_channel_reads_select_own on public.community_channel_reads;
create policy community_channel_reads_select_own
  on public.community_channel_reads for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists community_channel_reads_insert_own on public.community_channel_reads;
create policy community_channel_reads_insert_own
  on public.community_channel_reads for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.community_channels channel
      where channel.id = channel_id
        and channel.is_archived = false
    )
  );

drop policy if exists community_channel_reads_update_own on public.community_channel_reads;
create policy community_channel_reads_update_own
  on public.community_channel_reads for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.community_channels channel
      where channel.id = channel_id
        and channel.is_archived = false
    )
  );

create index if not exists community_messages_unread_channel_created_idx
  on public.community_messages (channel_id, created_at);

create or replace function public.get_community_unread_counts(p_channel_ids uuid[])
returns table (channel_id uuid, unread_count bigint)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    message.channel_id,
    count(*)::bigint as unread_count
  from public.community_messages message
  join public.community_channel_reads marker
    on marker.channel_id = message.channel_id
   and marker.user_id = auth.uid()
  where message.channel_id = any(coalesce(p_channel_ids, '{}'::uuid[]))
    and message.author_id <> auth.uid()
    and message.created_at > marker.last_read_at
  group by message.channel_id;
$function$;

revoke all on function public.get_community_unread_counts(uuid[]) from public, anon;
grant execute on function public.get_community_unread_counts(uuid[]) to authenticated;

commit;
