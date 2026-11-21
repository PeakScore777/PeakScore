import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, route, deleteRoute, migration, sanitizer, styles, editMigration] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/attachments/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/messages/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121016000_community_channel_chat_messages.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121017000_community_message_editing_and_mentions.sql", import.meta.url), "utf8"),
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

testCase("mention autocomplete is scoped to the active channel and renders selected members as safe tokens", () => {
  assert.match(editMigration, /create or replace function public\.search_community_mention_members/);
  assert.match(editMigration, /profile\.id <> auth\.uid\(\)/);
  assert.match(editMigration, /char_length\(btrim\(coalesce\(p_query, ''\)\)\) between 1 and 32/);
  assert.match(editMigration, /limit greatest\(1, least\(coalesce\(p_limit, 8\), 8\)\)/);
  assert.match(page, /rpc\("search_community_mention_members"/);
  assert.match(page, /p_channel_id: activeChannelId/);
  assert.match(page, /@\{/);
  assert.match(editMigration, /target_role\.user_id = profile\.id/);
  assert.match(editMigration, /create or replace function public\.resolve_community_mention_members/);
  assert.match(editMigration, /cardinality\(p_user_ids\) between 1 and 80/);
  assert.match(page, /rpc\("resolve_community_mention_members"/);
  assert.match(page, /setMentionDisplayNames\(canonicalMentionNames\)/);
  assert.match(page, /renderMessageBody\(message\.body, userId, mentionDisplayNames\)/);
  assert.match(page, /community-chat-mention-suggestions/);
  assert.match(styles, /community-chat-mention-self/);
});
