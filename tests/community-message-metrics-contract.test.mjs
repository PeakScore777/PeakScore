import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, page] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261121016000_community_channel_chat_messages.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
]);

testCase("community metrics RPC is invoker-scoped, batch bounded and returns aggregate-only fields", () => {
  const start = migration.indexOf("create function public.get_community_message_metrics");
  const end = migration.indexOf("$function$;", start);
  assert.ok(start >= 0 && end > start, "Could not locate community metrics function.");
  const fn = migration.slice(start, end);
  assert.match(fn, /security invoker/i);
  assert.match(fn, /set search_path = ''/i);
  assert.match(fn, /auth\.uid\(\) is null/i);
  assert.match(fn, /cardinality\(p_message_ids\) > 60/i);
  assert.match(fn, /reaction_counts jsonb/i);
  assert.match(fn, /viewer_reactions text\[\]/i);
  assert.match(fn, /reply_count bigint/i);
  assert.match(fn, /jsonb_object_agg/);
  assert.doesNotMatch(fn, /security definer/i);
  assert.match(migration, /grant execute on function public\.get_community_message_metrics\(uuid\[\]\)\s+to authenticated/i);
});

testCase("community UI consumes emoji aggregates without exposing reaction identities", () => {
  assert.match(page, /rpc\("get_community_message_metrics", \{ p_message_ids: messageIds \}\)/);
  assert.match(page, /reaction_counts: itemMetrics\?\.reaction_counts/);
  assert.match(page, /viewer_reactions: itemMetrics\?\.viewer_reactions/);
  assert.match(page, /createSignedUrls\(attachmentPaths, 3600\)/);
  assert.doesNotMatch(page, /from\("community_reactions"\)\s*\.select\("id,message_id,user_id,reaction"\)/);
});
