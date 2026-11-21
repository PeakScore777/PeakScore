-- Public community badges come only from community role assignments/catalog.
-- security_invoker preserves RLS on both source tables (Postgres 15+).
create or replace view public.community_public_role_badges
with (security_invoker = true)
as
select
  member_role.user_id,
  member_role.role_key,
  role_catalog.label,
  role_catalog.badge_color
from public.community_member_roles as member_role
join public.community_role_catalog as role_catalog
  on role_catalog.role_key = member_role.role_key
where role_catalog.display_as_badge = true;

revoke all on public.community_public_role_badges from public, anon;
grant select on public.community_public_role_badges to authenticated;
