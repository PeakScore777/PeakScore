import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, studio, css, route, migration] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121220000_community_member_profile_plate_style.sql", import.meta.url), "utf8"),
]);

test("community member rail opens a hover identity popout and click opens the full profile", () => {
  assert.match(page, /openMemberHoverPreview\(member, event\)/);
  assert.match(page, /scheduleCloseMemberHoverPreview/);
  assert.match(page, /community-member-hover-layer/);
  assert.match(page, /Ver perfil completo/);
  assert.match(page, /openCommunityProfile\(member\.id\)/);
  assert.match(css, /\.community-member-hover-card/);
});

test("the community identity editor is separate from PeakStyle and academic progress", () => {
  assert.match(page, /CommunityProfileStudio/);
  assert.match(page, /setCommunityProfileStudioOpen\(true\)/);
  assert.match(studio, /\/api\/community\/profile\//);
  assert.doesNotMatch(studio, /\/api\/profile\/assets|\/api\/profile\/cosmetics|PeakCoins|selectedCharacter|profileEffectUrl|PeakStyle/);
  assert.doesNotMatch(route, /from\("profiles"\)|selected_character|coins|xp|user\.email/);
  assert.match(route, /community_member_profiles/);
});

test("editor contains functional profile, avatar, banner, color and plate sections", () => {
  for (const section of ["profile", "avatar", "banner", "color", "plate"]) {
    assert.ok(studio.includes('section === "' + section + '"'), "Missing editor section: " + section);
  }
  assert.match(studio, /VISTA PREVIA EN VIVO/);
  assert.match(studio, /Cambiar avatar/);
  assert.match(studio, /Subir banner/);
  assert.match(studio, /Guardar cambios/);
  assert.match(css, /\.ps-community-studio-plate-option/);
  assert.match(css, /prefers-reduced-motion/);
});

test("member nameplates use native community presets, not a shop cosmetics lookup", () => {
  assert.match(page, /community-member-nameplate is-plate-/);
  assert.match(page, /community-profile-nameplate is-plate-/);
  assert.doesNotMatch(page, /nameplateUrl|avatarFrameUrl|profileEffectUrl|\/api\/community\/member-cosmetics|\/api\/profile\/cosmetics/);
  assert.match(migration, /plate_style/);
  for (const style of ["classic", "grid", "arcade", "signal"]) assert.ok(migration.includes("'" + style + "'"));
});

test("profile request sequencing prevents an older response overwriting the selected member", () => {
  assert.match(page, /communityProfileRequestRef/);
  assert.match(page, /requestId !== communityProfileRequestRef\.current/);
  assert.match(page, /Se conserva la información disponible/);
});
