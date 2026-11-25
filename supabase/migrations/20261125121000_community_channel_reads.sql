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

commit;
