-- Community identity is deliberately independent from PeakScore learning/game profiles.
-- No reads from public.profiles are used for community display names or profile content.

create table if not exists public.community_member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Miembro',
  pronouns text not null default '',
  status_text text not null default '',
  about text not null default '',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint community_member_profiles_display_name_length
    check (char_length(btrim(display_name)) between 2 and 32),
  constraint community_member_profiles_pronouns_length
    check (char_length(pronouns) <= 32),
  constraint community_member_profiles_status_length
    check (char_length(status_text) <= 80),
  constraint community_member_profiles_about_length
    check (char_length(about) <= 280)
);

comment on table public.community_member_profiles is
  'Independent social identity for PeakScore Community. Never sourced from public.profiles.';

alter table public.community_member_profiles enable row level security;

drop policy if exists community_member_profiles_read_authenticated
  on public.community_member_profiles;
create policy community_member_profiles_read_authenticated
  on public.community_member_profiles
  for select to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists community_member_profiles_insert_self
  on public.community_member_profiles;
create policy community_member_profiles_insert_self
  on public.community_member_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists community_member_profiles_update_self
  on public.community_member_profiles;
create policy community_member_profiles_update_self
  on public.community_member_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.community_member_profiles from anon, public;
grant select, insert, update on public.community_member_profiles to authenticated;

create or replace function public.touch_community_member_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$function$;

revoke all on function public.touch_community_member_profile_updated_at()
  from public, anon, authenticated;

drop trigger if exists community_member_profiles_touch_updated_at
  on public.community_member_profiles;
create trigger community_member_profiles_touch_updated_at
  before update on public.community_member_profiles
  for each row execute function public.touch_community_member_profile_updated_at();

-- Bootstrap only from the authentication provider's own metadata, never from PeakScore profiles.
insert into public.community_member_profiles (user_id, display_name)
select
  users.id,
  left(
    coalesce(
      nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'user_name'), ''),
      'Miembro'
    ),
    32
  )
from auth.users as users
on conflict (user_id) do nothing;
