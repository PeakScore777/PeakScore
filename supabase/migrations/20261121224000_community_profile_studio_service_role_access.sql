-- Server-only access needed by the authenticated community profile API.
-- The browser's authenticated role remains read-only; ownership is checked in the API
-- before the server-only supabaseAdmin client performs profile appearance writes.
grant select, update on table public.community_member_profiles to service_role;
