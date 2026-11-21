create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  severity text not null default 'medium'
    check (severity in ('low','medium','high','critical')),
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  page_url text,
  user_agent text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_bug_reports_status_created_at
  on public.bug_reports (status, created_at desc);

create index if not exists idx_bug_reports_user_created_at
  on public.bug_reports (user_id, created_at desc);

alter table public.bug_reports enable row level security;

drop policy if exists "Users can create their own bug reports" on public.bug_reports;
create policy "Users can create their own bug reports"
on public.bug_reports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own bug reports" on public.bug_reports;
create policy "Users can view their own bug reports"
on public.bug_reports
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

drop policy if exists "Admins can update bug reports" on public.bug_reports;
create policy "Admins can update bug reports"
on public.bug_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

revoke all on public.bug_reports from anon;
grant select, insert on public.bug_reports to authenticated;
grant update on public.bug_reports to authenticated;
