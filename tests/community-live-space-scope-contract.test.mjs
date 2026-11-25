import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, page] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261124230300_community_live_sessions_space_scope.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/en-vivo/page.tsx", import.meta.url), "utf8"),
]);

testCase("existing live sessions remain in the global space and new rows require an owning space", () => {
  assert.match(migration, /add column if not exists space_id uuid/);
  assert.match(migration, /set space_id = '00000000-0000-4000-8000-000000000001'/);
  assert.match(migration, /space_id set not null/);
  assert.match(migration, /community_live_sessions_space_id_fkey/);
  assert.match(migration, /grant insert \(space_id\) on public\.community_live_sessions to authenticated/i);
});

testCase("only the founder or context-authorized teachers can host sessions in the matching space", () => {
  assert.match(migration, /create or replace function private\.can_host_community_live_session/);
  assert.match(migration, /private\.is_community_founder\(\)/);
  assert.match(migration, /space\.space_type = 'global'[\s\S]*?assignment\.role_key = 'profesor'/);
  assert.match(migration, /space\.space_type = 'preicfes'[\s\S]*?assignment\.role_key in \('docente','profesor'\)/);
  assert.match(migration, /not private\.is_space_timed_out\(p_space_id\)/);
  assert.doesNotMatch(migration, /role_key = 'colaborador'[\s\S]{0,250}can_host_community_live_session/);
});

testCase("live session SELECT, INSERT, UPDATE and DELETE policies enforce space membership and ownership", () => {
  assert.match(migration, /community_live_sessions_space_guard[\s\S]*?private\.can_access_community_space\(space_id\)/);
  assert.match(migration, /community_live_sessions_read[\s\S]*?private\.has_space_permission\(space_id,'view_channels'\)/);
  assert.match(migration, /community_live_sessions_insert_professor[\s\S]*?private\.can_host_community_live_session\(space_id\)/);
  assert.match(migration, /community_live_sessions_update_owner_scheduled[\s\S]*?host_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /community_live_sessions_delete_owner_scheduled[\s\S]*?host_id = \(select auth\.uid\(\)\)/);
});

testCase("the live calendar filters queries and Realtime refreshes to the active space", () => {
  assert.match(page, /activeSpace/);
  assert.match(page, /\.eq\("space_id", spaceId\)/);
  assert.match(page, /filter: "space_id=eq\." \+ spaceId/);
  assert.match(page, /space_id: activeSpace\.id/);
  assert.match(page, /loadSessions\(activeSpace\.id\)/);
  assert.match(page, /community_space_member_roles/);
  assert.match(page, /\["docente","profesor"\]/);
});

testCase("the global live calendar remains compatible until space_id is deployed without falling back for PreICFES", () => {
  assert.match(page, /activeSpace\.space_type === "global"/);
  assert.match(page, /\["42703","PGRST204","PGRST200"\]/);
  assert.match(page, /Before space_id is deployed, keep the original global scheduling path working/);
  assert.match(page, /activeSpace\.space_type === "preicfes"/);
});
