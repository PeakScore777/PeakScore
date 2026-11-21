import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, migration] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121016000_community_channel_chat_messages.sql", import.meta.url), "utf8"),
]);

testCase("a reply is a normal community message in the same timeline", () => {
  assert.match(migration, /add column if not exists reply_to_message_id uuid/);
  assert.match(migration, /references public\.community_messages\(id\) on delete set null/i);
  assert.match(page, /reply_to_message_id\?: string/);
  assert.match(page, /if \(submittedReply\) insertPayload\.reply_to_message_id = submittedReply\.id/);
  assert.match(page, /visibleMessages\.map\(\(message, index\)/);
  assert.match(page, /message\.reply_to_message_id/);
  assert.match(page, /community-chat-reply-reference/);
});

testCase("the message timeline no longer reads nested comments for ordinary replies", () => {
  assert.doesNotMatch(page, /from\("community_message_comments"\)/);
  assert.doesNotMatch(page, /commentsFor|loadComments|sendComment|commentDraft|parent_comment_id/);
  assert.doesNotMatch(page, /community-chat-thread|community-chat-replies/);
});

testCase("reply target validation avoids recursive RLS and enforces same-channel visibility", () => {
  assert.match(migration, /create or replace function private\.can_reply_to_community_message/);
  assert.match(migration, /security definer[\s\S]*?set search_path = ''/);
  assert.match(migration, /parent\.channel_id = p_channel_id/);
  assert.match(migration, /channel\.is_archived = false/);
  assert.match(migration, /channel\.is_read_only = false/);
  assert.match(migration, /private\.can_reply_to_community_message\(reply_to_message_id, channel_id\)/);
});
