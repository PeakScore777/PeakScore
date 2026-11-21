import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, studio, css, route, migration, memberNumberMigration] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121223000_community_profile_studio_appearance.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121225000_community_profile_member_number.sql", import.meta.url), "utf8"),
]);

test("the profile editor is opened only for the signed-in member and uses a body portal", () => {
  assert.match(page, /CommunityProfileStudio/);
  assert.match(page, /selectedCommunityProfile\?\.isOwnProfile/);
  assert.match(page, /setCommunityProfileStudioOpen\(true\)/);
  assert.match(studio, /createPortal\(/);
  assert.match(studio, /document\.body/);
  assert.match(css, /inset:72px 0 0/);
});

test("the studio matches the full-screen three-zone layout and retains the global navbar", () => {
  assert.match(studio, /ps-community-editor-rail/);
  assert.match(studio, /ps-community-editor-sidebar/);
  assert.match(studio, /ps-community-editor-workspace/);
  assert.match(studio, /ps-community-editor-controls/);
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.match(studio, /previewMode/);
  assert.match(css, /\.ps-community-editor-v2/);
  assert.match(css, /grid-template-columns:68px 258px minmax\(0,1fr\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) minmax\(318px,370px\)/);
});

test("saved frames and accent colors render on the community member list, hover popout and full profile", () => {
  assert.match(page, /member\.avatar_frame \?\? "none"/);
  assert.match(page, /hoverCommunityProfile\.avatarFrame \?\? "none"/);
  assert.match(page, /selectedCommunityProfile\.avatarFrame \?\? "none"/);
  assert.match(page, /selectedCommunityProfile\.accentColor \?\? "#3987FF"/);
  assert.match(css, /ps-community-profile-avatar\.frame-solar/);
  assert.match(css, /ps-community-member-popout__avatar\.frame-violet/);
  assert.match(css, /--community-accent/);
  assert.match(page, /ps-community-member-popout/);
  assert.match(page, /ps-community-profile-dialog/);
  assert.match(page, /onlineMemberIds\.includes\(selectedCommunityProfile\.userId\)/);
  assert.match(route, /Optional profile appearance unavailable/);
  assert.match(route, /Optional public role badges unavailable/);
});

test("all identity controls feed the live preview and are submitted to the community API", () => {
  for (const key of ["displayName", "pronouns", "statusText", "about", "cardColor", "plateStyle", "accentColor", "avatarFrame"]) {
    assert.ok(studio.includes(key), "Missing editor state: " + key);
  }
  assert.match(studio, /setDisplayName\(event\.target\.value\)/);
  assert.match(studio, /openAppearancePicker\("frame", frame\.id\)/);
  assert.match(studio, /openAppearancePicker\("plate", plate\.id\)/);
  assert.match(studio, /ps-community-picker-modal/);
  assert.match(studio, /applyAppearancePicker/);
  assert.match(studio, /Cancelar/);
  assert.match(studio, /Aplicar/);
  assert.match(studio, /setAccentColor\(accent\.value\)/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-preview-avatar/);
  assert.match(studio, /Guardar cambios/);
  assert.match(studio, /onSaved\(\)/);
  assert.match(studio, /\/api\/community\/profile\//);
});

test("banner and avatar uploads can be changed and removed without exposing privileged credentials", () => {
  assert.match(studio, /uploadAsset\("avatar"/);
  assert.match(studio, /uploadAsset\("banner"/);
  assert.match(studio, /removeAsset\("avatar"\)/);
  assert.match(studio, /removeAsset\("banner"\)/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /userId !== user\.id/);
  assert.match(route, /sanitizeRasterImage/);
  assert.match(route, /consume_community_attachment_rate_limit/);
  assert.match(route, /upsert: false/);
  assert.doesNotMatch(studio, /SUPABASE_SERVICE_ROLE_KEY|service_role/);
});

test("the community identity migration is additive and constrains native presets", () => {
  for (const column of ["banner_path", "card_color", "plate_style", "accent_color", "avatar_frame"]) {
    assert.match(migration, new RegExp("add column if not exists " + column));
  }
  for (const style of ["classic", "grid", "arcade", "signal"]) assert.ok(migration.includes("'" + style + "'"));
  for (const frame of ["none", "solar", "violet", "cyan", "ember"]) assert.ok(migration.includes("'" + frame + "'"));
  assert.match(migration, /community-profile-banners/);
  assert.match(route, /community_member_profiles/);
  assert.doesNotMatch(route, /from\("profiles"\)|selected_character|\bcoins\b|\bxp\b|user\.email/);
});

test("the old education/game cosmetics store does not own community identity", () => {
  assert.doesNotMatch(studio, /\/api\/profile\/cosmetics|PeakCoins|selectedCharacter|profileEffectUrl/);
  assert.doesNotMatch(page, /nameplateUrl|avatarFrameUrl|profileEffectUrl/);
  assert.match(page, /avatar_frame/);
  assert.match(page, /accent_color/);
});

test("community member numbers are stable, unique, positive public identifiers", () => {
  assert.match(page, /memberNumber: member\?\.member_number \?\? null/);
  assert.match(page, /member_number: member\.member_number/);

  assert.match(memberNumberMigration, /add column if not exists member_number bigint generated by default as identity/i);
  assert.match(memberNumberMigration, /create unique index if not exists community_member_profiles_member_number_uidx/);
  assert.match(memberNumberMigration, /check \(member_number > 0\)/);
  assert.match(route, /member_number,display_name/);
  assert.match(route, /memberNumber: profileResult\.data\.member_number/);
  assert.match(route, /memberNumber: data\.member_number/);
  assert.match(studio, /memberTag\(profile\.memberNumber\)/);
});

test("profile update is atomic and owner-scoped", () => {
  const patch = route.slice(route.indexOf("export async function PATCH"), route.indexOf("export async function POST"));
  assert.match(patch, /userId !== user\.id/);
  assert.match(patch, /supabaseAdmin\.from\("community_member_profiles"\)/);
  assert.match(patch, /display_name: displayName/);
  assert.match(patch, /avatar_frame: avatarFrame/);
  assert.match(patch, /accent_color: accentColor/);
  assert.doesNotMatch(patch, /appearanceUpdate|appearanceSaved =/);
});

test("appearance selectors open focused collection dialogs instead of rendering duplicate inline galleries", () => {
  assert.match(studio, /ps-community-picker-modal/);
  assert.match(studio, /openAppearancePicker\("frame"\)/);
  assert.match(studio, /openAppearancePicker\("plate"\)/);
  assert.doesNotMatch(studio, /ps-community-editor-frame-options/);
  assert.doesNotMatch(studio, /ps-community-editor-plate-options/);
  assert.doesNotMatch(studio, /ps-community-editor-preview-badges/);
  assert.match(studio, /VISTA PREVIA/);
  assert.doesNotMatch(studio, /ps-community-editor-preview-member-state[^\n]*EN LÍNEA/);
  assert.match(css, /ps-community-editor-choice-row/);
  assert.match(css, /ps-community-picker-modal/);
  assert.doesNotMatch(css, /\.community-profile-dialog\s*\{/);
  assert.doesNotMatch(css, /\.community-profile-overlay\s*\{/);
});
