import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, communityPage] = await Promise.all([
  readFile(
    new URL("../supabase/migrations/20261121015000_community_message_metrics_rpc.sql", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
]);

testCase("community metrics RPC is read-only, invoker-scoped and batch bounded", () => {
  assert.match(migration, /security invoker/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /auth\.uid\(\) is null/i);
  assert.match(migration, /cardinality\(p_message_ids\) > 60/i);
  assert.match(migration, /join requested_messages requested on requested\.id = m\.id/i);
  assert.match(migration, /public\.community_reactions/i);
  assert.match(migration, /public\.community_message_comments/i);
  assert.match(migration, /grant execute on function public\.get_community_message_metrics\(uuid\[\]\)\s+to authenticated/i);
  assert.match(migration, /revoke all on function public\.get_community_message_metrics\(uuid\[\]\)\s+from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /security definer/i);
});

testCase("community UI uses aggregate metrics rather than downloading reaction identities", () => {
  assert.match(communityPage, /rpc\("get_community_message_metrics", \{ p_message_ids: messageIds \}\)/);
  assert.match(communityPage, /reaction_count: itemMetrics\?\.reaction_count/);
  assert.match(communityPage, /viewer_liked: itemMetrics\?\.viewer_liked/);
  assert.doesNotMatch(
    communityPage,
    /from\("community_reactions"\)\s*\.select\("id,message_id,user_id,reaction"\)/,
  );
  assert.doesNotMatch(communityPage, /message\.reactions/);
});
