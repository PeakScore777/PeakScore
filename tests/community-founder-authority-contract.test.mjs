import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, roleRoute, moderationRoute, lifecycleRoute, page, styles] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261121018000_community_founder_authority_and_moderation.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/roles/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/moderation/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/lifecycle/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

testCase("founder identity is immutable and bootstrapped only through the server allowlist", () => {
  assert.match(migration, /community_founder_config/);
  assert.match(migration, /on conflict \(singleton\) do nothing/i);
  assert.match(migration, /auth\.role\(\) <> 'service_role'/i);
  assert.match(roleRoute, /process\.env\.COMMUNITY_FOUNDER_USER_ID/);
  assert.match(roleRoute, /configuredFounderId !== userId/);
  assert.match(lifecycleRoute, /process\.env\.COMMUNITY_FOUNDER_USER_ID/);
  assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)\s+on\s+private\.community_founder_config/i);
});

testCase("only the founder can grant or revoke roles, and the founder role cannot be reassigned", () => {
  assert.match(migration, /private\.is_community_founder\(v_actor\)/);
  assert.match(migration, /Only the founder can manage community roles/);
  assert.match(migration, /p_role_key = 'fundador'/);
  assert.match(migration, /revoke all on function public\.manage_community_member_role\(uuid, text, text\)[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.manage_community_member_role\(uuid, text, text\) to authenticated/i);
  assert.match(roleRoute, /manage_community_member_role/);
});

testCase("administrators can only kick or timeout ordinary members", () => {
  assert.match(migration, /role_assignment\.role_key = 'administrador'/);
  assert.match(migration, /p_action not in \('kick', 'timeout'\)/);
  assert.match(migration, /protected_role\.role_key in \('fundador', 'administrador', 'moderador', 'profesor'\)/);
  assert.match(migration, /p_duration_minutes > 40320/);
  assert.match(moderationRoute, /action !== "kick" && action !== "timeout"/);
  assert.doesNotMatch(moderationRoute, /manage_community_member_role|community_role_catalog/);
});

testCase("kick, timeout and lifecycle state are enforced by restrictive RLS, not only the UI", () => {
  for (const policy of ["channels", "messages", "reactions", "comments", "live_sessions"]) {
    assert.match(migration, new RegExp("community_lifecycle_guard_" + policy));
  }
  assert.match(migration, /as restrictive[\s\S]*?private\.is_community_enabled\(\)[\s\S]*?private\.is_community_user_restricted/);
  assert.match(migration, /restriction\.restriction_type = 'kick'[\s\S]*?restriction\.expires_at > now\(\)/);
});

testCase("community disable is a founder-only reversible soft delete, never a physical data wipe", () => {
  assert.match(migration, /Only the founder can change community lifecycle/);
  assert.match(migration, /p_action not in \('disable', 'restore'\)/);
  assert.match(migration, /A community deletion is a reversible soft-disable/);
  assert.doesNotMatch(migration, /drop table public\.community_(channels|messages)/i);
  assert.match(lifecycleRoute, /set_community_lifecycle/);
});

testCase("mobile community reserves the GameCode navigation, uses a channel drawer and safe-area spacing", () => {
  assert.match(page, /community-mobile-menu/);
  assert.match(page, /community-sidebar-open/);
  assert.match(page, /setMobileChannelsOpen\(false\)/);
  assert.match(styles, /community-mobile-header-height/);
  assert.match(styles, /community-mobile-bottom-nav-height/);
  assert.match(styles, /env\(safe-area-inset-bottom/);
  assert.match(styles, /community-chat-composer-wrap/);
  assert.match(styles, /@media \(max-width: 700px\)/);
});
