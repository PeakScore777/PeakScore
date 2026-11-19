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
const adminRecordsRoute = readFileSync(
  new URL("../app/api/admin/archivo-oculto/records/route.ts", import.meta.url),
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
  const evidenceQueryEnd = recordsRoute.indexOf('    ]);', evidenceQueryStart);
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

test("physical books cannot be picked up from the desk and return with a rigid curved animation", () => {
  assert.match(library3D, /userData=\{\{ archivoStoryId: isPhysical \? undefined : story\.id \}\}/);
  assert.match(library3D, /if \(isPhysical\) return/);
  assert.match(library3D, /returnElapsed\.current/);
  assert.match(library3D, /returnControlPosition\.set/);
  assert.match(library3D, /slerpQuaternions\(returnStartQuaternion, desiredQuaternion, eased\)/);
  assert.match(library3D, /setScalar\(THREE\.MathUtils\.lerp\(startScale, returnScale\.x, landingEase\)\)/);
});

test("books require the player to walk to the shelf before the pickup prompt appears", () => {
  assert.match(library3D, /instance\.near = 0\.12/);
  assert.match(library3D, /instance\.far = 2\.05/);
  assert.match(library3D, /raycaster\.intersectObjects\(bookRoots, true\)/);
  assert.match(library3D, /event\.code === "KeyR" && !carriedRef\.current && !placedRef\.current && targetId\.current/);
});

test("the center reticle triggers the same book lift animation as mouse hover", () => {
  assert.match(library3D, /!hovered && !targeted/);
  assert.match(library3D, /hovered \|\| targeted \? 0\.045 : 0/);
  assert.match(library3D, /hovered \|\| targeted \? -0\.025 : 0/);
});

test("suspect inspection keyboard hints stay in the lower-left corner, clear of the dossier text", () => {
  assert.match(game, /fixed bottom-5 left-5 z-40 max-w-\[min\(360px,calc\(100vw-2\.5rem\)\)\]/);
  assert.doesNotMatch(game, /fixed bottom-20 left-1\/2 -translate-x-1\/2/);
});

test("the suspect dossier occupies the marked clear center of the desk, away from the physical book", () => {
  assert.match(library3D, /position=\{\[0\.12, 1\.004, 2\.45\]\}/);
  assert.match(library3D, /target\.set\(1\.16, 1\.088, 2\.45\)/);
});

test("book spine textures and workstation mouse geometry stay lightweight", () => {
  assert.match(library3D, /canvas\.width = 128/);
  assert.match(library3D, /canvas\.height = 256/);
  assert.match(library3D, /texture\.anisotropy = 4/);
  assert.match(library3D, /new THREE\.SphereGeometry\(1, 24, 16\)/);
});

test("the suspect dossier is moved off the CRT and the library adapts to low-end hardware", () => {
  assert.match(library3D, /position=\{\[0\.12, 1\.004, 2\.45\]\}/);
  assert.match(library3D, /function getLibraryGraphicsProfile\(\)/);
  assert.match(library3D, /hardwareConcurrency/);
  assert.match(library3D, /deviceMemory/);
  assert.match(library3D, /dpr=\{graphicsProfile\.dpr\}/);
  assert.match(library3D, /shadows=\{graphicsProfile\.shadows\}/);
  assert.match(library3D, /gl\.shadowMap\.autoUpdate = graphicsProfile\.shadows/);
  assert.match(library3D, /renderProfile\.extraLights/);
});

test("the lock-screen wallpaper stays unobstructed by CSS mountains and keeps the monitor aspect ratio", () => {
  const wallpaperStart = library3D.indexOf("function MonitorWallpaper(");
  const wallpaperEnd = library3D.indexOf("function MonitorLockScreen(", wallpaperStart);
  assert.ok(wallpaperStart >= 0 && wallpaperEnd > wallpaperStart);
  const wallpaper = library3D.slice(wallpaperStart, wallpaperEnd);
  assert.doesNotMatch(wallpaper, /clipPath|polygon\(|mountain\(/);
  assert.match(wallpaper, /backgroundSize: "cover"/);
  assert.match(library3D, /<planeGeometry args=\{\[1\.16, 0\.652173913\]\}/);
  assert.match(library3D, /width: \(920 \* graphicsProfile\.monitorScale\) \+ "px"/);
  assert.match(library3D, /height: \(517\.5 \* graphicsProfile\.monitorScale\) \+ "px"/);
  assert.match(library3D, /surfaceWidth=\{920 \* monitorScale\}/);
  assert.match(library3D, /surfaceHeight=\{517\.5 \* monitorScale\}/);
  assert.match(library3D, /projectMonitorQuad\(points, surfaceWidth, surfaceHeight\)/);
  assert.match(library3D, /projectionSnapshotRef/);
  assert.match(library3D, /if \(!hasChanged\) return/);
});

test("lock screen displays unlocked email, messages and timeline clues and refreshes while open", () => {
  const lockStart = library3D.indexOf("function MonitorLockScreen(");
  const lockEnd = library3D.indexOf("function MonitorSignIn(", lockStart);
  assert.ok(lockStart >= 0 && lockEnd > lockStart);
  const lockScreen = library3D.slice(lockStart, lockEnd);
  assert.match(lockScreen, /\["email", "message", "timeline"\]/);
  assert.match(lockScreen, /setInterval\(\(\) => \{ void refresh\(\); \}, 4000\)/);
  assert.match(lockScreen, /evidence_title/);
  assert.match(lockScreen, /evidence_description/);
  assert.match(lockScreen, /notificationsLoaded/);
  assert.match(lockScreen, /evidenceRef\.current/);
  assert.match(lockScreen, /timelineRef\.current/);
  assert.match(lockScreen, /formatMonitorNotificationTime\(item\.occurred_at\)/);
  assert.match(library3D, /function formatMonitorNotificationTime\(value\?: string\)/);
  assert.match(lockScreen, /Notificaciones · \{notifications\.length\}/);
  assert.match(recordsRoute, /\.select\("id,record_type,occurred_at,title,body,source,sender,recipient,subject/);
  assert.match(adminRecordsRoute, /type RecordType\s*=\s*"timeline"\s*\|\s*"email"\s*\|\s*"message"/);
});

test("suspect inspection camera frames the complete folder and settles with a shorter smooth move", () => {
  const start = library3D.indexOf("function InspectionCamera(");
  const end = library3D.indexOf("function LibraryInteractionController(", start);
  assert.ok(start >= 0 && end > start);
  const camera = library3D.slice(start, end);
  assert.match(camera, /targetFov\.current = 54\.57/);
  assert.match(camera, /destination\.set\(0\.12, 2\.84, 2\.45\)/);
  assert.match(camera, /look\.set\(0\.12, 1\.004, 2\.45\)/);
  assert.match(camera, /Math\.exp\(-7\.5 \* Math\.min\(delta, 0\.04\)\)/);
});

test("control guides and PEAK OS scrolling stay browser-local and use a modern slim scrollbar", () => {
  const controls = readFileSync(new URL("../components/games/ArchivoOcultoControls.tsx", import.meta.url), "utf8");
  const desktop = readFileSync(new URL("../components/games/PeakOSDesktop.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(controls, /const PEAK_OS|Atajos de PEAK OS|ControlLeft|AltLeft/);
  assert.doesNotMatch(desktop, /event\.ctrlKey|event\.metaKey|event\.altKey/);
  assert.match(desktop, /\.peak-os-scroll::-webkit-scrollbar \{ width: 6px; height: 6px; \}/);
  assert.match(desktop, /border-radius: 999px; background: rgba\(160,166,176/);
  assert.match(controls, /\.peak-controls-scroll::-webkit-scrollbar \{ width: 6px/);
});

test("Peak OS stops the continuous WebGL loop after focus animation and lowers raster cost on modest PCs", () => {
  assert.match(library3D, /computerOpen \? "demand" : locked \? "always" : "demand"/);
  assert.match(library3D, /monitorScale: lowPower \? 2 : highPower \? 3 : 2\.5/);
  assert.match(library3D, /monitorScale\?: 2 \| 2\.5 \| 3/);
  assert.match(library3D, /surfaceWidth=\{920 \* monitorScale\}/);
  assert.match(library3D, /projectMonitorQuad\(points, surfaceWidth, surfaceHeight\)/);
});

test("the desk mouse is larger, wireless and has no oversized mousepad slab", () => {
  assert.match(library3D, /position=\{\[0\.86, -0\.165, 0\.25\]\} rotation=\{\[-0\.025, Math\.PI - 0\.08, 0\]\} scale=\{0\.86\}/);
  assert.doesNotMatch(library3D, /mouseCableGeometry|Premium stitched desk mat/);
});

test("the 3D library no longer shows the unwanted compatibility or fallback catalog screen", () => {
  assert.match(library3D, /class LibraryWebGLErrorBoundary extends Component/);
  assert.match(library3D, /<Canvas/);
  assert.match(library3D, /fallback=\{<div aria-hidden="true" className="pointer-events-none absolute inset-0" \/>\}/);
  assert.doesNotMatch(library3D, /LibraryWebGLFallback|Comprobando compatibilidad gráfica|Aceleración gráfica no disponible|canCreateLibraryWebGLContext|webglStatus/);
});

test("evidence magnifier follows the pointer without React state renders and evidence images preload eagerly", () => {
  const game = readFileSync(new URL("../components/games/ArchivoOcultoGame.tsx", import.meta.url), "utf8");
  const photoStart = game.indexOf("function InteractiveEvidencePhoto(");
  const photoEnd = game.indexOf("\nfunction ", photoStart + 10);
  const photo = game.slice(photoStart, photoEnd);
  assert.match(photo, /requestAnimationFrame/);
  assert.match(photo, /lens\.style\.transform = "translate3d\("/);
  assert.doesNotMatch(photo, /useState|setLens/);
  assert.match(photo, /loading="eager"/);
  assert.match(game, /evidenceImageCacheRef/);
  assert.match(game, /image\.decode\(\)/);
  assert.match(game, /image\.fetchPriority = index < 2 \? "high" : "low"/);
});
