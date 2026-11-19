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
const library3D = readFileSync(
  new URL("../components/games/ArchivoOcultoLibrary3D.tsx", import.meta.url),
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

test("first-person controls are disabled as soon as the computer focus transition starts", () => {
  assert.match(library3D, /disabled=\{disabled \|\| controlsOpen \|\| computerOpen\}/);
  assert.match(library3D, /<ComputerFocusCamera active=\{computerOpen\} screenRef=\{screenRef\} \/>/);
  assert.match(library3D, /invalidate\(\)/);
});

test("3D rain uses instancing instead of dozens of individual meshes", () => {
  const start = library3D.indexOf("function RainStreaks(");
  const end = library3D.indexOf("function WindowAssembly(", start);
  assert.ok(start >= 0 && end > start);
  const rain = library3D.slice(start, end);
  assert.match(rain, /<instancedMesh/);
  assert.equal(rain.includes("Array.from({length:34}"), false);
});

test("keyboard keycaps no longer create one shadow caster per key", () => {
  const start = library3D.indexOf('<group position={[0, -0.16, 0.28]}>');
  const end = library3D.indexOf("function WindowAssembly(", start);
  assert.ok(start >= 0 && end > start);
  const keyboard = library3D.slice(start, end);
  assert.doesNotMatch(keyboard, /<mesh position=\{\[0, -0\.005, 0\]\} castShadow/);
  assert.doesNotMatch(keyboard, /position=\{\[0, 0\.018, 0\]\} castShadow receiveShadow/);
});

test("the desk mouse remains correctly oriented and has no oversized mousepad slab", () => {
  assert.match(library3D, /rotation=\{\[-0\.025, Math\.PI - 0\.08, 0\]\} scale=\{0\.46\}/);
  assert.doesNotMatch(library3D, /Premium stitched desk mat/);
});
