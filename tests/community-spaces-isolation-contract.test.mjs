import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, spaceApi, memberApi, moderationApi, channelApi, studio, founderStudio, mainPage, attachmentApi] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261124230200_community_spaces_and_preicfes_isolation.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/spaces/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/spaces/members/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/spaces/moderation/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/channels/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunitySpacesStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityFounderStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/attachments/route.ts", import.meta.url), "utf8"),
]);

testCase("PreICFES spaces are first-class isolated spaces and the existing global community is preserved", () => {
  assert.match(migration, /create table if not exists public\.community_spaces/);
  assert.match(migration, /create table if not exists public\.community_space_members/);
  assert.match(migration, /create table if not exists public\.community_space_member_roles/);
  assert.match(migration, /00000000-0000-4000-8000-000000000001/);
  assert.match(migration, /update public\.community_channels[\s\S]*?set space_id = '00000000-0000-4000-8000-000000000001'/);
  assert.match(migration, /community_channels_space_slug_unique/);
  assert.doesNotMatch(migration, /delete from public\.community_messages/i);
});

testCase("space access and member capabilities are resolved by space id", () => {
  assert.match(migration, /create or replace function private\.can_access_community_space\(p_space_id uuid\)/);
  assert.match(migration, /create or replace function private\.has_space_permission\([\s\S]*?p_space_id uuid/);
  assert.match(migration, /create or replace function private\.is_space_collaborator\(p_space_id uuid\)/);
  assert.match(migration, /private\.has_space_permission\(channel\.space_id,'send_messages'\)/);
  assert.match(migration, /private\.has_space_permission\(channel\.space_id,'attach_files'\)/);
  assert.match(migration, /private\.has_space_permission\(channel\.space_id,'add_reactions'\)/);
});

testCase("PreICFES collaborator is scoped and cannot become a global staff role", () => {
  assert.match(migration, /'colaborador','Colaborador PreICFES'/);
  assert.match(migration, /new\.role_key = 'colaborador'/);
  assert.match(migration, /community_member_roles_reject_space_role/);
  assert.match(migration, /Only an active assigned collaborator can moderate this PreICFES space/);
  assert.match(migration, /Collaborators cannot moderate other staff accounts/);
  assert.match(migration, /The moderation target is not a member of this space/);
  assert.match(migration, /space\.space_type = 'preicfes'[\s\S]*?role_key in \('colaborador','docente','profesor'\)/);
  assert.match(migration, /private\.can_view_private_community_channel\(space_id\)/);
  const privateRelatedPolicies = migration.slice(
    migration.indexOf("drop policy if exists community_reactions_read"),
    migration.indexOf("-- SECURITY DEFINER message editing must enforce"),
  );
  assert.equal((privateRelatedPolicies.match(/private\\.can_view_private_community_channel\\(channel\\.space_id\\)/g) ?? []).length, 5);
  const mentionRpcs = migration.slice(
    migration.indexOf("create or replace function public.search_community_member_profiles("),
    migration.indexOf("commit;"),
  );
  assert.equal((mentionRpcs.match(/private\\.can_view_private_community_channel\\(channel\\.space_id\\)/g) ?? []).length, 2);
  assert.doesNotMatch(mentionRpcs, /target_role\\.user_id = member_profile\\.user_id/);
  assert.match(privateRelatedPolicies, /create or replace function public\\.can_attach_community_files\\([\\s\\S]*?private\\.can_view_private_community_channel\\(channel\\.space_id\\)/);
  assert.match(migration, /private\.can_view_private_community_channel\(channel\.space_id\)/);
  assert.doesNotMatch(migration, /grant execute on function public\.manage_community_space_member[\s\S]*?to service_role/i);
});

testCase("only founder can create spaces, manage membership and administer their channels", () => {
  for (const route of [spaceApi, memberApi, channelApi]) {
    assert.match(route, /isSameOriginMutation/);
    assert.match(route, /verifyCommunityFounder/);
  }
  assert.match(spaceApi, /manage_community_space/);
  assert.match(memberApi, /manage_community_space_member/);
  assert.match(channelApi, /manage_community_space_channel/);
  assert.match(moderationApi, /isSameOriginMutation/);
  assert.match(moderationApi, /readBodyWithinLimit/);
  assert.match(moderationApi, /moderate_community_space_member/);
  assert.match(migration, /Only the founder can manage community spaces/);
  assert.match(migration, /Only the founder can manage community space membership/);
  assert.match(migration, /Only the founder can manage PreICFES channels/);
});

testCase("a PreICFES collaborator can use private staff channels only in assigned spaces", () => {
  assert.match(migration, /create or replace function private\.can_view_private_community_channel\(p_space_id uuid\)/);
  assert.match(migration, /private\.is_space_collaborator\(channel\.space_id\)/);
  assert.match(migration, /community_space_guard_channels/);
  assert.match(migration, /community_space_guard_messages/);
  assert.match(migration, /community_space_guard_reactions/);
  assert.match(migration, /community_space_guard_comments/);
  assert.match(migration, /private\.can_access_community_space\(channel\.space_id\)/);
  assert.match(migration, /create or replace function public\.join_community_space\(p_space_id uuid\)/);
  assert.match(migration, /space\.visibility = 'public'/);
  assert.match(migration, /create or replace function private\.is_space_timed_out\(p_space_id uuid\)/);
  assert.match(migration, /restriction\.restriction_type = 'kick'[\s\S]*?restriction\.revoked_at is null/);
  assert.match(migration, /p_permission in \('send_messages','attach_files','add_reactions'\)[\s\S]*?private\.is_space_timed_out\(p_space_id\)/);
  assert.match(migration, /v_space_type = 'global'[\s\S]*?private\.is_community_timed_out\(\)/);
  assert.match(migration, /space\.space_type <> 'global' or not private\.is_community_kicked\(\)/);
  assert.match(migration, /Only an active assigned collaborator can moderate this PreICFES space/);
});

testCase("SECURITY DEFINER edit and mention functions cannot bypass PreICFES scope or timeout", () => {
  assert.match(migration, /create or replace function public\.edit_community_message\([\s\S]*?security definer/);
  assert.match(migration, /and private\.has_space_permission\(channel\.space_id,'send_messages'\)/);
  assert.match(migration, /and private\.can_access_community_space\(channel\.space_id\)/);
  const editRpc = migration.slice(migration.indexOf("create or replace function public.edit_community_message("), migration.indexOf("create or replace function public.search_community_member_profiles("));
  assert.match(editRpc, /private\.has_space_permission\(channel\.space_id,'send_messages'\)/);
  assert.doesNotMatch(editRpc, /private\.is_community_timed_out\(\)/);
  assert.match(migration, /create or replace function public\.search_community_member_profiles\([\s\S]*?community_space_members/);
  assert.match(migration, /create or replace function public\.resolve_community_mention_members\([\s\S]*?community_space_members/);
});

testCase("attachments are checked against their target channel space before Storage upload", () => {
  assert.match(migration, /create or replace function public\.can_attach_community_files\(p_channel_id uuid\)/);
  assert.match(attachmentApi, /can_attach_community_files/);
  assert.match(attachmentApi, /p_channel_id: channelId/);
  assert.ok(attachmentApi.indexOf("can_attach_community_files") < attachmentApi.indexOf("consume_community_attachment_rate_limit"));
  assert.ok(attachmentApi.indexOf("can_attach_community_files") < attachmentApi.indexOf(".upload(storagePath"));
});

testCase("founder console exposes isolated PreICFES settings, members, scoped roles and channels", () => {
  assert.match(founderStudio, /CommunitySpacesStudio/);
  assert.match(founderStudio, /tabButton\("spaces", "PreICFES"\)/);
  assert.match(studio, /COMUNIDADES PREICFES/);
  assert.match(studio, /Miembros y roles/);
  assert.match(studio, /Canales/);
  assert.match(studio, /Colaborador PreICFES/);
  assert.match(studio, /moderate_community_space_member|\/api\/community\/spaces\/moderation/);
  assert.match(studio, /Silenciar/);
  assert.match(studio, /Expulsar/);
  assert.match(studio, /Restaurar/);
  assert.match(studio, /manage_community_space|\/api\/community\/spaces/);
  assert.match(mainPage, /community_spaces/);
  assert.match(mainPage, /join_community_space/);
  assert.match(mainPage, /activeSpaceOnlineUsers/);
  assert.match(mainPage, /router\.push\("\/comunidad\?space="/);
});

testCase("global chat queries explicitly remain inside the PeakScore global community", () => {
  assert.match(mainPage, /GLOBAL_COMMUNITY_SPACE_ID/);
  assert.match(mainPage, /\.eq\("space_id", resolvedSpace\.id\)/);
  assert.match(mainPage, /id: GLOBAL_COMMUNITY_SPACE_ID/);
  assert.match(founderStudio, /\.eq\("space_id", GLOBAL_COMMUNITY_SPACE_ID\)/);
  assert.match(mainPage, /resolvedSpace\.space_type === "global"[\s\S]*?Never fall back to global channels from inside a private PreICFES route/);
});


testCase("PreICFES migration has one atomic channel/RLS definition set", () => {
  const count = (pattern) => (migration.match(pattern) ?? []).length;
  assert.equal(count(/^\s*begin;\s*$/gim), 1);
  assert.equal(count(/^\s*commit;\s*$/gim), 1);
  assert.equal(count(/create or replace function public\.manage_community_space_channel\(/gi), 1);
  assert.equal(count(/create or replace function public\.can_attach_community_files\(p_channel_id uuid\)/gi), 1);
  assert.equal(count(/create policy community_space_guard_channels/gi), 1);
  assert.equal(count(/create policy community_space_guard_messages/gi), 1);
  assert.equal(count(/create policy community_space_guard_reactions/gi), 1);
  assert.equal(count(/create policy community_space_guard_comments/gi), 1);
  assert.doesNotMatch(migration, /p_slug !~ '[^\n]*drop policy/i);
});

testCase("global and PreICFES timeouts do not leak across community boundaries", () => {
  assert.match(migration, /v_space_type = 'global'[\s\S]*?private\.is_community_timed_out\(\)/);
  assert.match(migration, /private\.is_space_timed_out\(p_space_id\)/);
  assert.equal((migration.match(/^\s*and not private\.is_community_timed_out\(\)\s*$/gm) ?? []).length, 0);
  const editRpc = migration.slice(
    migration.indexOf("create or replace function public.edit_community_message("),
    migration.indexOf("create or replace function public.search_community_member_profiles("),
  );
  assert.match(editRpc, /private\.has_space_permission\(channel\.space_id,'send_messages'\)/);
  assert.doesNotMatch(editRpc, /private\.is_community_timed_out\(\)/);
});
