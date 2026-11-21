import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, route, deleteRoute, migration, sanitizer, styles] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/attachments/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/messages/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121016000_community_channel_chat_messages.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
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

testCase("reactions update in realtime only for messages in the current chat page", () => {
  assert.match(page, /const messageIdsRef = useRef<Set<string>>\(new Set\(\)\)/);
  assert.match(page, /messageIdsRef\.current = new Set\(messages\.map\(\(message\) => message\.id\)\)/);
  assert.match(page, /table: "community_reactions"/);
  assert.match(page, /messageIdsRef\.current\.has\(changedMessageId\)/);
  assert.match(page, /removeChannel\(reactionSubscription\)/);
});
