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
const sessionRoute = readFileSync(
  new URL("../app/api/games/archivo-oculto/session/route.ts", import.meta.url),
  "utf8",
);
const messagesRoute = readFileSync(
  new URL("../app/api/games/archivo-oculto/messages/route.ts", import.meta.url),
  "utf8",
);
const recordsRoute = readFileSync(
  new URL("../app/api/games/archivo-oculto/records/route.ts", import.meta.url),
  "utf8",
);
const caseCodeMigration = readFileSync(
  new URL("../supabase/migrations/20261119023200_archivo_oculto_stable_case_codes.sql", import.meta.url),
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

test("the bookshelf payload stays lean and the selected book loads its full dossier", () => {
  assert.match(libraryRoute, /\.select\("id,title,case_code"\)/);
  assert.match(libraryRoute, /questionIds/);
  assert.doesNotMatch(libraryRoute, /content_blocks|game_evidence_assets|game_reading_suspects|\.select\([^)]*options/);
  assert.match(sessionRoute, /\.from\("game_evidence_assets"\)/);
  assert.match(sessionRoute, /\.from\("game_reading_suspects"\)/);
  assert.match(sessionRoute, /return NextResponse\.json\(\{ sessionId: data\.id, readings, questions, suspects, source \}\)/);
});

test("each case has a stable sequential code stored on its published passage", () => {
  assert.match(caseCodeMigration, /add column if not exists case_code text/);
  assert.match(caseCodeMigration, /row_number\(\) over \(order by created_at asc, id asc\)/);
  assert.match(caseCodeMigration, /create unique index if not exists game_reading_passages_game_case_code_uidx/);
  assert.match(libraryRoute, /caseCode: passage\.case_code/);
  assert.match(game, /story\.id === activePassageId\)\?\.caseCode/);
});

test("progressive lore messages use a lightweight per-book endpoint", () => {
  assert.match(messagesRoute, /\.eq\("passage_id", passageId\)/);
  assert.match(messagesRoute, /\.eq\("record_type", "message"\)/);
  assert.match(messagesRoute, /\.limit\(100\)/);
  assert.doesNotMatch(messagesRoute, /game_evidence_assets|game_reading_suspects/);
  assert.match(game, /\/api\/games\/archivo-oculto\/messages\?passageId=/);
  assert.match(game, /"messages" in payload/);
});

test("PEAK OS orders evidence assets only by columns that exist on that table", () => {
  const evidenceQueryStart = recordsRoute.indexOf('.from("game_evidence_assets")');
  const evidenceQueryEnd = recordsRoute.indexOf(']),', evidenceQueryStart);
  assert.ok(evidenceQueryStart >= 0 && evidenceQueryEnd > evidenceQueryStart);
  const evidenceQuery = recordsRoute.slice(evidenceQueryStart, evidenceQueryEnd);
  assert.match(evidenceQuery, /display_after_paragraph/);
  assert.match(evidenceQuery, /created_at/);
  assert.doesNotMatch(evidenceQuery, /display_order/);
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
  assert.doesNotMatch(rain, /<mesh key=\{i\}/);
});

test("keyboard keycaps no longer create one shadow caster per key", () => {
  const start = library3D.indexOf('<group position={[0, -0.16, 0.28]}>');
  const end = library3D.indexOf("Custom sculpted mouse shell", start);
  assert.ok(start >= 0 && end > start);
  const keyboard = library3D.slice(start, end);
  assert.doesNotMatch(keyboard, /<mesh position=\{\[0, -0\.005, 0\]\} castShadow/);
  assert.doesNotMatch(keyboard, /position=\{\[0, 0\.018, 0\]\} castShadow receiveShadow/);
});

test("the desk mouse remains correctly oriented and has no oversized mousepad slab", () => {
  assert.match(library3D, /rotation=\{\[-0\.025, Math\.PI - 0\.08, 0\]\} scale=\{0\.46\}/);
  assert.doesNotMatch(library3D, /Premium stitched desk mat/);
});
