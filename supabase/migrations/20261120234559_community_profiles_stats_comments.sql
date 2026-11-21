-- PeakScore Community: public-safe author metadata, aggregate stats and nested comments.
-- Profiles remain private. Community clients only receive these explicitly selected fields.

create or replace view public.community_public_profiles
with (security_invoker = false)
as
select
  p.id,
  coalesce(nullif(btrim(p.full_name), ''), 'Estudiante') as full_name,
  p.avatar_url,
  coalesce(p.level, 1) as level,
  coalesce(p.xp, 0) as xp
from public.profiles p;

revoke all on public.community_public_profiles from anon, authenticated;
grant select on public.community_public_profiles to authenticated;

create or replace function public.community_get_stats()
returns table(member_count bigint, post_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::bigint from public.profiles) as member_count,
    (
      select count(*)::bigint
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where c.is_archived = false
    ) as post_count;
$$;

revoke all on function public.community_get_stats() from public, anon;
grant execute on function public.community_get_stats() to authenticated;

create table if not exists public.community_message_comments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages(id) on delete cascade,
  parent_comment_id uuid references public.community_message_comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint community_message_comments_body_length
    check (char_length(btrim(body)) between 1 and 1200),
  constraint community_message_comments_parent_not_self
    check (parent_comment_id is null or parent_comment_id <> id)
);

create index if not exists community_message_comments_message_created_idx
  on public.community_message_comments (message_id, created_at asc);
create index if not exists community_message_comments_parent_idx
  on public.community_message_comments (parent_comment_id);

alter table public.community_message_comments enable row level security;
revoke all on public.community_message_comments from anon, authenticated;
grant select, insert, delete on public.community_message_comments to authenticated;

drop policy if exists community_comments_read_active on public.community_message_comments;
create policy community_comments_read_active
  on public.community_message_comments for select to authenticated
  using (
    exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id and c.is_archived = false
    )
  );

drop policy if exists community_comments_insert_as_self on public.community_message_comments;
create policy community_comments_insert_as_self
  on public.community_message_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id
        and c.is_archived = false
        and c.is_read_only = false
    )
    and (
      parent_comment_id is null
      or exists (
        select 1
        from public.community_message_comments parent
        where parent.id = parent_comment_id
          and parent.message_id = message_id
      )
    )
  );

drop policy if exists community_comments_delete_own on public.community_message_comments;
create policy community_comments_delete_own
  on public.community_message_comments for delete to authenticated
  using (author_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_message_comments'
  ) then
    alter publication supabase_realtime add table public.community_message_comments;
  end if;
end
$$;
