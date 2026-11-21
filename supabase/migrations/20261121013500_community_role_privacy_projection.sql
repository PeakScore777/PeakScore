-- Keep internal community role assignments private while exposing safe public badges.
-- Users retain SELECT access to their own roles so RLS policies for private
-- channels can continue to evaluate role membership without listing all staff.

create table if not exists public.community_public_role_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null references public.community_role_catalog(role_key) on delete cascade,
  label text not null,
  badge_color text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, role_key),
  constraint community_public_role_badges_color
    check (badge_color ~ '^#[0-9A-Fa-f]{6}$')
);

alter table public.community_public_role_badges enable row level security;

revoke all on public.community_public_role_badges from public, anon, authenticated;
grant select on public.community_public_role_badges to authenticated, service_role;

drop policy if exists community_public_role_badges_read_authenticated
  on public.community_public_role_badges;
create policy community_public_role_badges_read_authenticated
  on public.community_public_role_badges
  for select to authenticated
  using (true);

-- A role assignment is private metadata. A user may only inspect their own
-- assignments; public profile badges are served by the projection table above.
revoke all on public.community_member_roles from public, anon, authenticated;
grant select on public.community_member_roles to authenticated, service_role;
grant select on public.community_role_catalog to service_role;

drop policy if exists community_member_roles_read_authenticated
  on public.community_member_roles;
create policy community_member_roles_read_authenticated
  on public.community_member_roles
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.sync_community_public_role_badge_from_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_label text;
  v_badge_color text;
  v_display_as_badge boolean := false;
begin
  if tg_op = 'DELETE' then
    delete from public.community_public_role_badges
    where user_id = old.user_id
      and role_key = old.role_key;
    return old;
  end if;

  if tg_op = 'UPDATE'
     and (old.user_id, old.role_key) is distinct from (new.user_id, new.role_key) then
    delete from public.community_public_role_badges
    where user_id = old.user_id
      and role_key = old.role_key;
  end if;

  select c.label, c.badge_color, c.display_as_badge
    into v_label, v_badge_color, v_display_as_badge
  from public.community_role_catalog c
  where c.role_key = new.role_key;

  if not found or not coalesce(v_display_as_badge, false) then
    delete from public.community_public_role_badges
    where user_id = new.user_id
      and role_key = new.role_key;
    return new;
  end if;

  insert into public.community_public_role_badges (
    user_id, role_key, label, badge_color, updated_at
  )
  values (
    new.user_id, new.role_key, v_label, v_badge_color, now()
  )
  on conflict (user_id, role_key) do update
  set label = excluded.label,
      badge_color = excluded.badge_color,
      updated_at = excluded.updated_at;

  return new;
end;
$function$;

revoke all on function public.sync_community_public_role_badge_from_member()
  from public, anon, authenticated;

drop trigger if exists sync_community_public_role_badge_from_member_trigger
  on public.community_member_roles;
create trigger sync_community_public_role_badge_from_member_trigger
  after insert or update or delete on public.community_member_roles
  for each row
  execute function public.sync_community_public_role_badge_from_member();

create or replace function public.refresh_community_public_role_badges_from_catalog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' then
    delete from public.community_public_role_badges
    where role_key = old.role_key;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.role_key is distinct from new.role_key then
    delete from public.community_public_role_badges
    where role_key = old.role_key;
  end if;

  if coalesce(new.display_as_badge, false) then
    insert into public.community_public_role_badges (
      user_id, role_key, label, badge_color, updated_at
    )
    select
      mr.user_id, new.role_key, new.label, new.badge_color, now()
    from public.community_member_roles mr
    where mr.role_key = new.role_key
    on conflict (user_id, role_key) do update
    set label = excluded.label,
        badge_color = excluded.badge_color,
        updated_at = excluded.updated_at;
  else
    delete from public.community_public_role_badges
    where role_key = new.role_key;
  end if;

  return new;
end;
$function$;

revoke all on function public.refresh_community_public_role_badges_from_catalog()
  from public, anon, authenticated;

drop trigger if exists refresh_community_public_role_badges_from_catalog_trigger
  on public.community_role_catalog;
create trigger refresh_community_public_role_badges_from_catalog_trigger
  after insert or update or delete on public.community_role_catalog
  for each row
  execute function public.refresh_community_public_role_badges_from_catalog();

-- Reconcile existing rows and remove any badge that is no longer public.
insert into public.community_public_role_badges (
  user_id, role_key, label, badge_color, updated_at
)
select
  mr.user_id, mr.role_key, rc.label, rc.badge_color, now()
from public.community_member_roles mr
join public.community_role_catalog rc on rc.role_key = mr.role_key
where rc.display_as_badge = true
on conflict (user_id, role_key) do update
set label = excluded.label,
    badge_color = excluded.badge_color,
    updated_at = excluded.updated_at;

delete from public.community_public_role_badges badge
where not exists (
  select 1
  from public.community_member_roles mr
  join public.community_role_catalog rc on rc.role_key = mr.role_key
  where mr.user_id = badge.user_id
    and mr.role_key = badge.role_key
    and rc.display_as_badge = true
);

comment on table public.community_member_roles is
  'Private community role assignments. Authenticated users may read only their own assignments.';
comment on table public.community_public_role_badges is
  'Safe public projection of community badges. Contains only roles marked display_as_badge; no assigner or internal audit metadata.';
