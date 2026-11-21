import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20261121014000_harden_community_live_session_ownership_and_definer_paths.sql", import.meta.url),
  "utf8",
);

testCase("live-session updates retain host ownership after the update", () => {
  assert.match(
    migration,
    /create policy community_live_sessions_update_owner_scheduled[\s\S]*?for update to authenticated[\s\S]*?using\s*\([\s\S]*?host_id\s*=\s*\(select auth\.uid\(\)\)[\s\S]*?with check\s*\([\s\S]*?host_id\s*=\s*\(select auth\.uid\(\)\)/i,
  );
  assert.match(
    migration,
    /with check\s*\([\s\S]*?role_key\s*=\s*'profesor'/i,
  );
  assert.match(
    migration,
    /host_id, status and provider_room_name remain non-updatable by clients/i,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+update\s+on\s+public\.community_live_sessions/i,
  );
});

testCase("SECURITY DEFINER functions use an empty execution search path", () => {
  assert.match(
    migration,
    /alter function public\.ensure_current_user_season\(\)\s+set search_path to ''/i,
  );
  assert.match(
    migration,
    /alter function public\.sync_community_public_profile\(\)\s+set search_path to ''/i,
  );
});
