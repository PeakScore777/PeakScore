import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261119015112_archivo_oculto_per_passage_progress_and_five_question_completion.sql", import.meta.url),
  "utf8",
);
const libraryRoute = readFileSync(
  new URL("../app/api/games/archivo-oculto/questions/route.ts", import.meta.url),
  "utf8",
);
const game = readFileSync(
  new URL("../components/games/ArchivoOcultoGame.tsx", import.meta.url),
  "utf8",
);

test("session completion accepts both five-question books and ten-question mixed sessions", () => {
  assert.match(migration, /v_expected not in \(5, 10\)/);
  assert.match(migration, /if v_answered <> v_expected then/);
  assert.match(migration, /v_score := pg_catalog\.round\(\(v_correct::numeric \* 1000\) \/ v_expected\)::integer/);
});

test("book progress is indexed and scoped to one authenticated user and passage", () => {
  assert.match(migration, /primary key \(user_id, passage_id\)/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(libraryRoute, /\.from\("game_reading_passage_progress"\)/);
  assert.match(libraryRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(libraryRoute, /\.in\("passage_id", passageIds\)/);
  assert.doesNotMatch(libraryRoute, /\.from\("game_round_sessions"\)/);
});

test("completed sessions update the per-passage progress summary atomically", () => {
  assert.match(migration, /create trigger game_round_sessions_sync_archivo_progress/);
  assert.match(migration, /after update of completed_at on public\.game_round_sessions/);
  assert.match(migration, /new\.user_id,[\s\S]*?question\.passage_id,[\s\S]*?new\.completed_at/);
  assert.match(migration, /on conflict \(user_id, passage_id\) do update/);
});

test("Lore, message state and completion are bound to the selected passage ID", () => {
  assert.match(game, /\[activePassageId, setActivePassageId\]/);
  assert.match(game, /setActivePassageId\(story\.id\)/);
  assert.match(game, /story\.id === activePassageId \? \{ \.\.\.story, completed: true \}/);
  assert.match(game, /caseMessagesPassageId !== activePassageId/);
});
