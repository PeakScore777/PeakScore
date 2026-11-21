import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, communityPage] = await Promise.all([
  readFile(
    new URL("../supabase/migrations/20261121013500_community_role_privacy_projection.sql", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
]);

testCase("community role assignments are readable only by their owner", () => {
  assert.match(
    migration,
    /create policy community_member_roles_read_authenticated[\s\S]*?for select to authenticated[\s\S]*?using\s*\(\s*user_id\s*=\s*\(select auth\.uid\(\)\)\s*\)/i,
  );
  assert.doesNotMatch(
    migration,
    /create policy community_member_roles_read_authenticated[\s\S]*?using\s*\(\s*true\s*\)/i,
  );
});

testCase("public badges expose only the explicit badge projection", () => {
  assert.match(migration, /create table if not exists public\.community_public_role_badges/i);
  assert.match(migration, /grant select on public\.community_public_role_badges to authenticated/i);
  assert.match(migration, /create policy community_public_role_badges_read_authenticated[\s\S]*?using\s*\(true\)/i);
  assert.match(migration, /where rc\.display_as_badge = true/i);
  assert.match(migration, /revoke all on public\.community_public_role_badges from public, anon, authenticated/i);
});

testCase("clients cannot write role assignments or public badge projections", () => {
  assert.match(migration, /revoke all on public\.community_member_roles from public, anon, authenticated/i);
  assert.match(migration, /revoke all on public\.community_public_role_badges from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)\s+on\s+public\.community_(member_roles|public_role_badges)\s+to\s+(public|anon|authenticated)/i);
});

testCase("projection synchronization functions are not exposed as RPCs", () => {
  assert.equal((migration.match(/security definer/gi) ?? []).length, 2);
  assert.equal((migration.match(/set search_path = ''/gi) ?? []).length, 2);
  assert.match(migration, /revoke all on function public\.sync_community_public_role_badge_from_member\(\)[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /revoke all on function public\.refresh_community_public_role_badges_from_catalog\(\)[\s\S]*?from public, anon, authenticated/i);
});

testCase("community UI reads public badges, not other users' private assignments", () => {
  const loaderStart = communityPage.indexOf("const loadMessages = useCallback");
  const loaderEnd = communityPage.indexOf("const loadComments = useCallback", loaderStart);
  assert.ok(loaderStart >= 0 && loaderEnd > loaderStart, "Could not locate the message loader.");
  const loader = communityPage.slice(loaderStart, loaderEnd);
  assert.match(loader, /from\("community_public_role_badges"\)/);
  assert.doesNotMatch(loader, /from\("community_member_roles"\)/);

  assert.match(
    communityPage,
    /from\("community_member_roles"\)[\s\S]{0,180}eq\("user_id", user\.id\)/,
  );
});

testCase("trusted server-side role readers retain explicit SELECT while browser access stays owner-only", () => {
  assert.match(migration, /grant select on public\.community_member_roles to authenticated, service_role/i);
  assert.match(migration, /grant select on public\.community_role_catalog to service_role/i);
  assert.match(migration, /grant select on public\.community_public_role_badges to authenticated, service_role/i);
  assert.match(
    migration,
    /create policy community_member_roles_read_authenticated[\s\S]*?using\s*\(\s*user_id\s*=\s*\(select auth\.uid\(\)\)\s*\)/i,
  );
});
