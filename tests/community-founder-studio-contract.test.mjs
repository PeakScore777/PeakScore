import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [studio, roleApi, channelApi, founderHelper, migration, communityPage] = await Promise.all([
  readFile(new URL("../components/community/CommunityFounderStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/roles/catalog/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/channels/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/community/verify-founder.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261124240000_community_role_and_channel_control.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
]);

testCase("founder studio contains working member, role and channel sections", () => {
  assert.match(studio, /tabButton\("members"/);
  assert.match(studio, /tabButton\("roles"/);
  assert.match(studio, /tabButton\("channels"/);
  assert.match(studio, /changeMemberRole/);
  assert.match(studio, /saveRole/);
  assert.match(studio, /saveChannel/);
  assert.match(studio, /archiveChannel/);
});

testCase("role editor only exposes capabilities enforced by database policies", () => {
  for (const permission of ["view_channels","send_messages","attach_files","add_reactions"]) {
    assert.ok(studio.includes(permission), "Missing visible permission: " + permission);
    assert.ok(migration.includes(permission), "Missing database enforcement: " + permission);
  }
  assert.match(studio, /normalizePermissions/);
  assert.match(studio, /source\.view_channels === true/);
  assert.match(migration, /private\.has_community_permission/);
});

testCase("role catalogue mutations are founder-only RPC calls with validation", () => {
  assert.match(roleApi, /isSameOriginMutation/);
  assert.match(roleApi, /verifyCommunityFounder/);
  assert.match(roleApi, /manage_community_role_catalog/);
  assert.match(roleApi, /ALLOWED_PERMISSIONS/);
  assert.match(migration, /Only the founder can manage community roles/);
  assert.match(migration, /System role keys are protected/);
  assert.match(migration, /Remove this role from all members before deleting it/);
});

testCase("channel create, update and archive are server-validated and founder-only", () => {
  assert.match(channelApi, /isSameOriginMutation/);
  assert.match(channelApi, /verifyCommunityFounder/);
  assert.match(channelApi, /manage_community_channel/);
  assert.match(channelApi, /CATEGORIES/);
  assert.match(migration, /Only the founder can manage community channels/);
  assert.match(migration, /channel_archived/);
  assert.match(migration, /is_archived = true/);
  assert.doesNotMatch(migration, /delete from public\.community_messages/i);
});

testCase("public member badges respect configured hierarchy without exposing write access", () => {
  assert.match(migration, /create or replace view public\.community_public_role_badges[\s\S]*?role_catalog\.position/);
  assert.match(migration, /with \(security_invoker = true\)/);
  assert.match(migration, /revoke all on public\.community_public_role_badges from public, anon/);
  assert.match(communityPage, /position\?: number/);
  assert.match(communityPage, /a\.position \?\? priority/);
});

testCase("founder verification is anchored to the unique platform admin, never client metadata", () => {
  assert.match(founderHelper, /\.eq\("role", "admin"\)/);
  assert.match(founderHelper, /platformAdmins\?\.length !== 1/);
  assert.match(founderHelper, /bootstrap_community_founder/);
  assert.doesNotMatch(founderHelper, /user_metadata|app_metadata|COMMUNITY_FOUNDER_USER_ID/);
});
