import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, route, deleteRoute, migration, sanitizer, styles, editMigration, socialMentionSearch, socialMentionResolution, socialProfiles, socialMentionCompatibility, privateMentionResolution, profileRoute, roleBadgesView, livePage, communityStyles, legacyProjection] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/attachments/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/messages/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121016000_community_channel_chat_messages.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121017000_community_message_editing_and_mentions.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121021000_community_member_profile_mentions.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121022000_community_member_profile_mentions_resolution.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121020000_community_independent_member_profiles.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121024000_community_social_mention_compatibility.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121025000_community_private_mention_target_visibility.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121023000_community_public_role_badges_view.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/en-vivo/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121027000_retire_legacy_game_profile_community_projection.sql", import.meta.url), "utf8"),
]);

testCase("channel replies are first-class messages and target checks preserve channel isolation", () => {
  assert.match(migration, /reply_to_message_id uuid/);
  assert.match(migration, /private\.can_reply_to_community_message\(reply_to_message_id, channel_id\)/);
  assert.match(migration, /grant usage on schema private to authenticated/i);
  assert.match(migration, /revoke all on function private\.can_reply_to_community_message\(uuid, uuid\)[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function private\.can_reply_to_community_message\(uuid, uuid\)[\s\S]*?to authenticated/i);
  assert.match(route, /reply_to_message_id: replyTo/);
  assert.match(page, /community-chat-reply-reference/);
  assert.doesNotMatch(page, /from\("community_message_comments"\)|commentsFor|sendComment/);
});

testCase("reaction aggregates return emoji totals and viewer state without member identities", () => {
  assert.match(migration, /reaction_counts jsonb/);
  assert.match(migration, /viewer_reactions text\[\]/);
  assert.match(migration, /jsonb_object_agg/);
  assert.match(page, /Object\.entries\(message\.reaction_counts\)/);
  assert.match(page, /message\.viewer_reactions\.includes\(emoji\)/);
  assert.doesNotMatch(page, /\.select\("id,message_id,user_id,reaction"\)/);
});

testCase("community attachments are private and only accept sanitized raster images", () => {
  assert.match(migration, /'community-attachments'[\s\S]{0,160}false[\s\S]{0,100}8388608/);
  assert.match(migration, /array\['image\/png', 'image\/jpeg', 'image\/webp'\]/);
  assert.match(migration, /community_attachments_read_visible_messages/);
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /readFormDataWithinLimit\(request, MAX_REQUEST_BYTES\)/);
  assert.match(route, /sanitizeRasterImage\(/);
  assert.match(route, /consume_community_attachment_rate_limit/);
  assert.match(route, /\.from\("community-attachments"\)\s*\.upload/);
  assert.match(route, /\.remove\(\[storagePath\]\)/);
  assert.match(sanitizer, /rejectAnimatedPng/);
  assert.match(sanitizer, /No se permiten imágenes animadas/);
  assert.match(sanitizer, /createCanvas/);
  assert.match(page, /createSignedUrls\(attachmentPaths, 3600\)/);
});

testCase("the GameCode chat surface styles replies, emoji chips and image previews", () => {
  assert.match(styles, /community-chat-reply-reference/);
  assert.match(styles, /community-chat-reaction-chip/);
  assert.match(styles, /community-chat-attachment-image/);
  assert.match(styles, /community-chat-composer-replying/);
});

testCase("deleting an owned message removes its private attachment after the RLS-checked delete", () => {
  assert.match(deleteRoute, /isSameOriginMutation\(request\)/);
  assert.match(deleteRoute, /supabase\.auth\.getUser\(\)/);
  assert.match(deleteRoute, /message\.author_id !== user\.id/);
  assert.match(deleteRoute, /\.from\("community_messages"\)\s*\.delete\(\)/);
  assert.match(deleteRoute, /attachmentPath\.startsWith\(user\.id \+ "\/"\)/);
  assert.match(deleteRoute, /\.from\("community-attachments"\)\s*\.remove\(\[attachmentPath\]\)/);
  assert.match(page, /fetch\("\/api\/community\/messages\?message_id="/);
  assert.match(page, /setAttachmentFile\(null\);[\s\S]*?setReplyingTo\(null\)/);
});

testCase("reactions use aggregate RPC data and do not stream raw member identities", () => {
  assert.match(page, /rpc\("get_community_message_metrics", \{ p_message_ids: messageIds \}\)/);
  assert.match(page, /Object\.entries\(message\.reaction_counts\)/);
  assert.doesNotMatch(page, /table: "community_reactions"/);
  assert.doesNotMatch(page, /from\("community_reactions"\)\.select/);
});


testCase("message editing is owner-scoped, server-timestamped and cannot change immutable message fields", () => {
  assert.match(editMigration, /revoke update on table public\.community_messages from authenticated/i);
  assert.match(editMigration, /revoke update \(body, edited_at\) on table public\.community_messages from authenticated/i);
  assert.match(editMigration, /create or replace function public\.edit_community_message/);
  assert.match(editMigration, /security definer[\s\S]*?set search_path = ''/i);
  assert.match(editMigration, /message\.author_id = v_user_id/);
  assert.match(editMigration, /channel\.is_archived = false/);
  assert.match(editMigration, /channel\.is_read_only = false/);
  assert.match(editMigration, /edited_at = clock_timestamp\(\)/);
  assert.match(page, /rpc\("edit_community_message"/);
  assert.match(page, /beginEdit\(message\)/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /community-chat-edited-label/);
});

testCase("mention autocomplete and persisted mention labels use independent social identities", () => {
  assert.match(socialProfiles, /create table if not exists public\.community_member_profiles/);
  assert.match(socialMentionSearch, /create or replace function public\.search_community_member_profiles/);
  assert.match(socialMentionSearch, /security invoker/);
  assert.match(socialMentionSearch, /member_profile\.display_name/);
  assert.match(socialMentionSearch, /community_member_profiles/);
  assert.doesNotMatch(socialMentionSearch, /public\.profiles|community_public_profiles/);
  assert.match(socialMentionResolution, /create or replace function public\.resolve_community_mention_members/);
  assert.match(socialMentionResolution, /security invoker/);
  assert.match(socialMentionResolution, /community_member_profiles/);
  assert.doesNotMatch(socialMentionResolution, /public\.profiles|community_public_profiles/);
  assert.match(socialMentionCompatibility, /community_member_profiles/);
  assert.doesNotMatch(socialMentionCompatibility, /public\.profiles|community_public_profiles/);
  assert.match(privateMentionResolution, /channel\.is_private = false/);
  assert.match(privateMentionResolution, /target_role\.user_id = member_profile\.user_id/);
  assert.match(page, /rpc\("search_community_member_profiles"/);
  assert.match(page, /rpc\("resolve_community_mention_members"/);
  assert.match(page, /p_channel_id: activeChannelId/);
  assert.match(page, /@\{/);
  assert.match(page, /setMentionDisplayNames\(canonicalMentionNames\)/);
  assert.match(page, /renderMessageBody\(message\.body, userId, mentionDisplayNames\)/);
  assert.match(page, /community-chat-mention-suggestions/);
  assert.match(styles, /community-chat-mention-self/);
  assert.doesNotMatch(page, /community_public_profiles|\/perfil\/ver\//);
  assert.match(page, /openCommunityProfile/);
  assert.match(page, /community-profile-overlay/);
  assert.match(page, /community-profile-edit-form/);
  assert.match(page, /community-profile-mention-button/);
  assert.match(page, /insertMention\(\{/);
  assert.match(page, /community-profile-roles/);
  assert.match(page, /onlineMemberIds/);
  assert.match(page, /community-profile-presence/);
  assert.match(page, /presence\.presenceState\(\)/);
  assert.match(profileRoute, /community_member_profiles/);
  assert.match(profileRoute, /isSameOriginMutation\(request\)/);
  assert.match(profileRoute, /sanitizeRasterImage\(/);
  assert.match(profileRoute, /consume_community_attachment_rate_limit/);
  assert.match(profileRoute, /userId !== user\.id/);
  assert.doesNotMatch(profileRoute, /from\("profiles"\)|community_public_profiles/);
  assert.match(roleBadgesView, /with \(security_invoker = true\)/);
  assert.match(roleBadgesView, /community_member_roles/);
  assert.match(livePage, /from\("community_member_profiles"\)/);
  assert.doesNotMatch(livePage, /community_public_profiles/);
  assert.match(communityStyles, /\.community-profile-overlay/);
  assert.match(communityStyles, /\.community-profile-dialog/);
  assert.match(communityStyles, /\.community-profile-mention-button/);
  assert.match(communityStyles, /\.community-profile-presence\.is-online/);
  assert.match(legacyProjection, /drop trigger if exists sync_community_public_profile_trigger/);
  assert.match(legacyProjection, /drop function if exists public\.sync_community_public_profile/);
  assert.match(legacyProjection, /revoke all on table public\.community_public_profiles/);
});


testCase("chat actions are optimistic and do not wait for full timeline hydration", () => {
  const sendStart = page.indexOf("async function sendMessage(");
  const reactionStart = page.indexOf("function applyLocalReaction(");
  const replyStart = page.indexOf("function beginReply(");
  assert.ok(sendStart >= 0 && reactionStart > sendStart && replyStart > reactionStart);

  const sendBlock = page.slice(sendStart, reactionStart);
  assert.ok(sendBlock.includes('const pendingId = "pending-" + crypto.randomUUID();'));
  assert.match(sendBlock, /setMessages\(\(current\) => \[\.\.\.current\.filter\([\s\S]*?pendingMessage/);
  assert.match(sendBlock, /\.select\("id,channel_id,author_id,body,created_at,edited_at"\)\s*\.single\(\)/);
  assert.doesNotMatch(sendBlock, /await loadMessages\(/);
  assert.doesNotMatch(sendBlock, /await refreshStats\(/);

  const reactionBlock = page.slice(reactionStart, replyStart);
  assert.match(reactionBlock, /pendingReactionKeysRef\.current\.has/);
  assert.match(reactionBlock, /applyLocalReaction\(message\.id, reaction, !alreadyReacted\)/);
  assert.match(reactionBlock, /p_message_ids: \[message\.id\]/);
  assert.doesNotMatch(reactionBlock, /await loadMessages\(/);

  const editStart = page.indexOf("async function saveMessageEdit(");
  const deleteStart = page.indexOf("async function deleteMessage(");
  const shareStart = page.indexOf("async function shareMessage(");
  assert.doesNotMatch(page.slice(editStart, page.indexOf("async function sendMessage(", editStart)), /await loadMessages\(/);
  assert.doesNotMatch(page.slice(deleteStart, shareStart), /await loadMessages\(/);
});

testCase("realtime subscriptions are coalesced and presence is channel-independent", () => {
  assert.match(page, /realtimeRefreshTimeoutRef\.current = window\.setTimeout/);
  assert.match(page, /\}, 120\);/);
  const channelEffectStart = page.indexOf("if (!activeChannelId || !userId) return;");
  const presenceEffectStart = page.indexOf("// Presence is global to the community");
  const visibleMessagesStart = page.indexOf("const visibleMessages = useMemo");
  assert.ok(channelEffectStart >= 0 && presenceEffectStart > channelEffectStart && visibleMessagesStart > presenceEffectStart);
  const channelEffect = page.slice(channelEffectStart, presenceEffectStart);
  const presenceEffect = page.slice(presenceEffectStart, visibleMessagesStart);
  assert.doesNotMatch(channelEffect, /refreshStats\(/);
  assert.match(presenceEffect, /presence\.track/);
  assert.match(presenceEffect, /\}, \[userId\]\);/);
  assert.match(page, /requestId !== messageLoadRequestRef\.current \|\| activeChannelIdRef\.current !== channelId/);
});

testCase("the final Community skin uses GameCode palette and reserves pixel type for compact display UI", () => {
  const finalSkin = styles.slice(styles.lastIndexOf("PEAKSCORE × GAMECODE — final token and typography pass"));
  assert.ok(finalSkin.length > 0);
  for (const token of ["#0B1020", "#060916", "#0B1024", "#232836", "#01C8EF", "#7FE05C", "#8B93B5"]) {
    assert.ok(finalSkin.toLowerCase().includes(token.toLowerCase()), "Missing GameCode design token: " + token);
  }
  assert.match(finalSkin, /font-family: var\(--font-silkscreen\), monospace/);
  assert.match(finalSkin, /community-chat-message-pending/);
  assert.match(finalSkin, /background-image: none !important/);
  assert.match(page, /community-chat-pending-label/);
});
