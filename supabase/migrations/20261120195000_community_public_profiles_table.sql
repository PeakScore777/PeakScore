-- Replace the SECURITY DEFINER community view and stats RPC with a
-- read-only public projection table. Community clients can see only display
-- fields; private profiles data stays behind the existing profiles RLS.

drop function if exists public.community_get_stats();
drop view if exists public.community_public_profiles;

create table if not exists public.community_public_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null default 'Estudiante',
  avatar_url text,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now()
);

alter table public.community_public_profiles enable row level security;
revoke all on public.community_public_profiles from anon, authenticated;
grant select on public.community_public_profiles to authenticated;

drop policy if exists community_public_profiles_read_authenticated
  on public.community_public_profiles;
create policy community_public_profiles_read_authenticated
  on public.community_public_profiles
  for select to authenticated
  using (true);

create or replace function public.sync_community_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.community_public_profiles (
    id, full_name, avatar_url, level, xp, updated_at
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.full_name), ''), 'Estudiante'),
    new.avatar_url,
    greatest(coalesce(new.level, 1), 1),
    greatest(coalesce(new.xp, 0), 0),
    now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    level = excluded.level,
    xp = excluded.xp,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_community_public_profile() from public, anon, authenticated;

drop trigger if exists sync_community_public_profile_trigger on public.profiles;
create trigger sync_community_public_profile_trigger
  after insert or update of full_name, avatar_url, level, xp
  on public.profiles
  for each row
  execute function public.sync_community_public_profile();

insert into public.community_public_profiles (
  id, full_name, avatar_url, level, xp, updated_at
)
select
  p.id,
  coalesce(nullif(btrim(p.full_name), ''), 'Estudiante'),
  p.avatar_url,
  greatest(coalesce(p.level, 1), 1),
  greatest(coalesce(p.xp, 0), 0),
  now()
from public.profiles p
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  level = excluded.level,
  xp = excluded.xp,
  updated_at = now();
