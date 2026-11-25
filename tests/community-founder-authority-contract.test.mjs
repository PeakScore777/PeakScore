import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, roleRoute, moderationRoute, lifecycleRoute, page, styles] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261124230000_peakscore_community_authority_consolidated.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/roles/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/moderation/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/lifecycle/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

testCase("founder identity is immutable and bootstrapped only by the unique platform admin", () => {
  assert.match(migration, /community_founder_control/);
  assert.match(migration, /on conflict \(singleton\) do nothing/i);
  assert.match(migration, /coalesce\(auth\.jwt\(\) ->> 'role', ''\) <> 'service_role'/i);
  assert.doesNotMatch(migration, /auth\.role\(\)/i);
  assert.match(migration, /where profile\.role = 'admin'/i);
  assert.match(roleRoute, /\.from\("profiles"\)/);
  assert.match(roleRoute, /\.eq\("role", "admin"\)/);
  assert.match(roleRoute, /bootstrap_community_founder/);
  assert.match(lifecycleRoute, /\.from\("profiles"\)/);
  assert.match(lifecycleRoute, /bootstrap_community_founder/);
  assert.doesNotMatch(roleRoute + lifecycleRoute, /COMMUNITY_FOUNDER_USER_ID/);
  assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)\s+on\s+private\.community_founder_control/i);
});

testCase("only the founder can grant or revoke roles, and the founder role cannot be reassigned", () => {
  assert.match(migration, /private\.is_community_founder\(\)/);
  assert.match(migration, /Only the founder can manage community roles/);
  assert.match(migration, /p_role_key = 'fundador'/);
  assert.match(migration, /revoke all on function public\.manage_community_member_role\(uuid, text, text\)[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.manage_community_member_role\(uuid, text, text\) to authenticated/i);
  assert.match(roleRoute, /manage_community_member_role/);
  assert.match(page, /setIsFounder\(platformProfile\?\.role === "admin"\)/);
  assert.match(page, /CommunityFounderStudio/);
});

testCase("founder can read and participate in private channels without receiving another staff role", () => {
  assert.match(migration, /community_founder_read_channels/);
  assert.match(migration, /community_founder_read_messages/);
  assert.match(migration, /community_founder_insert_messages/);
  assert.match(migration, /community_founder_read_reactions/);
  assert.match(migration, /community_founder_read_comments/);
  assert.match(migration, /revoke all on function private\.is_community_founder\(\)[\s\S]*?grant execute on function private\.is_community_founder\(\) to authenticated/i);
});

testCase("administrators can only kick or timeout; teacher and student roles do not grant moderation", () => {
  assert.match(migration, /member_role\.role_key = 'administrador'/);
  assert.match(migration, /p_action is null or p_action not in \('kick', 'timeout'\)/);
  assert.match(migration, /member_role\.role_key in \('administrador', 'moderador'\)/);
  assert.match(migration, /p_duration_minutes > 40320/);
  assert.match(migration, /char_length\(v_reason\) < 3/);
  assert.match(moderationRoute, /action !== "kick" && action !== "timeout"/);
  assert.doesNotMatch(moderationRoute, /manage_community_member_role|community_role_catalog/);
});

testCase("kick, timeout and lifecycle state are enforced by restrictive RLS, not only the UI", () => {
  for (const policy of ["channels", "messages", "reactions", "comments", "live_sessions"]) {
    assert.match(migration, new RegExp("community_founder_guard_" + policy));
  }
  assert.match(migration, /as restrictive[\s\S]*?private\.is_community_enabled\(\)[\s\S]*?private\.is_community_kicked\(\)/);
  assert.match(migration, /private\.is_community_timed_out\(\)/);
  assert.match(migration, /restriction\.expires_at > clock_timestamp\(\)/);
});

testCase("message-editing hardening already exists in the current community implementation", async () => {
  const messageEdit = await readFile(new URL("../supabase/migrations/20261121017000_community_message_editing_and_mentions.sql", import.meta.url), "utf8");
  assert.match(messageEdit, /create or replace function public\.edit_community_message/i);
  assert.match(messageEdit, /security definer[\s\S]*?auth\.uid\(\)/i);
  assert.match(moderationRoute, /reason\.length < 3/);
});

testCase("community disable is a founder-only reversible soft disable, never a physical data wipe", () => {
  assert.match(migration, /Only the founder can change community lifecycle/);
  assert.match(migration, /p_action is null or p_action not in \('disable', 'restore'\)/);
  assert.match(migration, /reversible soft stop/);
  assert.doesNotMatch(migration, /drop table public\.community_(channels|messages)/i);
  assert.match(lifecycleRoute, /set_community_lifecycle/);
});

testCase("founder control uses a scoped, non-generic dialog and the new community theme", async () => {
  const [studio, theme] = await Promise.all([
    readFile(new URL("../components/community/CommunityFounderStudio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/comunidad/peakscore-community-theme.module.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /communityTheme\.root/);
  assert.match(page, /aria-label="Abrir control central de founder"/);
  assert.match(studio, /tabButton\("members", "Miembros"/);
  assert.match(studio, /tabButton\("roles", "Roles"/);
  assert.match(studio, /manage_community_member_role|\/api\/community\/roles/);
  assert.match(studio, /fundador/);
  assert.match(theme, /#171c24/);
  assert.match(theme, /#01c8ef/);
  assert.match(theme, /#7fe05c/);
});

testCase("mobile community reserves the channel drawer and safe-area spacing", () => {
  assert.match(page, /community-mobile-menu/);
  assert.match(page, /community-sidebar-open/);
  assert.match(page, /setMobileChannelsOpen\(false\)/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(styles, /community-mobile-header-height/);
  assert.match(styles, /community-mobile-bottom-nav-height/);
  assert.match(styles, /env\(safe-area-inset-bottom/);
  assert.match(styles, /community-chat-composer-wrap/);
  assert.match(styles, /@media \(max-width: 700px\)/);
});
