import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, studio, css, route, migration, memberNumberMigration, cosmeticsMigration] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121223000_community_profile_studio_appearance.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121225000_community_profile_member_number.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121235000_community_profile_cosmetics_and_status.sql", import.meta.url), "utf8"),
]);

test("the profile editor opens as a centered modal over the visible community", () => {
  assert.match(page, /CommunityProfileStudio/);
  assert.match(page, /selectedCommunityProfile\?\.isOwnProfile/);
  assert.match(page, /setCommunityProfileStudioOpen\(true\)/);
  assert.match(studio, /createPortal\(/);
  assert.match(studio, /document\.body/);
  assert.match(studio, /className="ps-community-editor-overlay"/);
  assert.match(studio, /role="dialog"/);
  assert.match(studio, /aria-modal="true"/);
  assert.match(css, /\.ps-community-editor-overlay[\s\S]*?place-items: center !important;/);
  assert.match(css, /background: rgb\(0 0 0 \/ 72%\)/);
  assert.match(css, /width: min\(1120px, calc\(100vw - 56px\)\)/);
  assert.match(css, /height: min\(790px, calc\(100dvh - 56px\)\)/);
  assert.match(css, /grid-template-columns: 252px minmax\(0, 1fr\)/);
  assert.match(css, /\.ps-community-editor-rail \{ display: none !important; \}/);
});

test("responsive modal keeps the dialog bounded and stacks preview on smaller screens", () => {
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /width: 100% !important;[\s\S]*?min-height: calc\(100dvh - 20px\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) !important;/);
  assert.match(css, /\.ps-community-editor-preview-column[\s\S]*?order: 2 !important;/);
  assert.match(css, /\.ps-community-editor-savebar[\s\S]*?position: fixed !important;/);
});

test("the studio retains its sidebar, main editor and preview inside the modal", () => {
  assert.match(studio, /ps-community-editor-rail/);
  assert.match(studio, /ps-community-editor-sidebar/);
  assert.match(studio, /ps-community-editor-workspace/);
  assert.match(studio, /ps-community-editor-controls/);
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.match(studio, /previewMode/);
  assert.match(css, /\.ps-community-editor-v2/);
  assert.match(css, /inset: 0 !important/);
  assert.match(css, /grid-template-columns: 252px minmax\(0, 1fr\)/);
  assert.match(css, /\.ps-community-editor-sidebar \{[\s\S]*?grid-column: 1 !important;/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(280px, 330px\)/);
});

test("editor uses Discord-style controls, centered live profile, and social tabs without duplicate preview cards", () => {
  assert.match(studio, /ps-community-editor-social-column/);
  assert.match(studio, /profileTab === "activity"/);
  assert.match(studio, /profileTab === "connections"/);
  assert.match(studio, /ps-community-editor-live-banner-actions/);
  assert.match(studio, /Cambiar banner/);
  assert.match(studio, /Eliminar banner/);
  assert.match(studio, /Añadir estado…/);
  assert.match(css, /grid-template-columns: 270px minmax\(330px, 410px\) minmax\(300px, 1fr\)/);
  assert.match(css, /\.ps-community-editor-social-tabs/);
  assert.match(css, /\.ps-community-editor-live-banner-actions/);
  assert.match(css, /\.ps-community-editor-preview-banner:hover \.ps-community-editor-live-banner-actions/);
  assert.match(css, /background: #111214 !important/);
  assert.match(css, /\.ps-community-editor-banner-panel \{ display: none !important; \}/);
  assert.match(css, /\.ps-community-editor-accent-options,\s*\.ps-community-editor-accent-caption \{ display: none !important; \}/);
});

test("profile status and cosmetics use Discord-like affordances with accessible Primer motion states", () => {
  assert.match(studio, /const STATUS_EMOJIS = \[/);
  assert.match(studio, /ps-community-note-bubble-emoji/);
  assert.match(studio, /ps-community-note-bubble-edit/);
  assert.match(studio, /ps-community-status-emoji-group/);
  assert.match(studio, /Borrar estado después de/);
  assert.match(studio, /statusDraft\.length}\/80/);
  assert.match(studio, /ps-community-editor-decoration-avatar/);
  assert.match(studio, /ps-community-picker-avatar-small/);
  assert.match(css, /height: min\(800px, calc\(100dvh - 48px\)\)/);
  assert.match(css, /min-height: 382px !important/);
  assert.match(css, /\.ps-community-note-bubble:hover/);
  assert.match(css, /:focus-visible[\s\S]*?outline: 2px solid #8ea1ff/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("profile editor follows compact Discord proportions instead of filling the browser", () => {
  const compactStart = css.lastIndexOf("/* 2026-11-21 — Corrected proportions from the supplied Discord references.");
  assert.ok(compactStart > 0);
  const compact = css.slice(compactStart);
  assert.match(compact, /width: min\(980px, calc\(100vw - 72px\)\)/);
  assert.match(compact, /height: min\(720px, calc\(100dvh - 56px\)\)/);
  assert.match(compact, /grid-template-columns: 218px minmax\(0, 1fr\)/);
  assert.match(compact, /width: min\(390px, 100%\)/);
  assert.match(compact, /\.ps-community-editor-controls:not\(\.is-open\)[\s\S]*?transform: translateX\(calc\(-100% - 12px\)\)/);
  assert.match(compact, /\.ps-community-editor-controls\.is-open[\s\S]*?transform: translateX\(0\)/);
  assert.match(compact, /@media \(max-width: 620px\)/);
});

test("profile editor keeps only Discord-style left navigation and one central live profile", () => {
  assert.match(studio, /setControlsOpen\(true\)/);
  assert.match(studio, /aria-expanded=\{activeSection === item\.id && controlsOpen\}/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.doesNotMatch(studio, /ps-community-editor-social-column|ps-community-editor-social-tabs|profileTab/);
  assert.match(css, /grid-template-columns: 260px minmax\(0, 1fr\)/);
  assert.match(css, /\.ps-community-editor-preview-column \{[\s\S]*?inset: 0 !important/);
  assert.match(css, /\.ps-community-editor-controls:not\(\.is-open\)/);
  assert.match(css, /\.ps-community-editor-controls\.is-open/);
  assert.match(css, /\.ps-community-editor-social-column,[\s\S]*?display: none !important/);
  assert.match(css, /width: min\(1600px, calc\(100vw - 48px\)\)/);
  assert.match(css, /@keyframes ps-editor-panel-in/);
  assert.match(css, /@keyframes ps-editor-profile-in/);
});

test("public member profile uses a refined dark banner, community identity and grouped role hierarchy", () => {
  assert.match(page, /ps-community-profile-banner-meta/);
  assert.match(page, /PEAKSCORE <i\/> COMMUNITY/);
  assert.match(page, /ps-community-profile-roles-section/);
  assert.match(page, /ROLES DE COMUNIDAD/);
  assert.match(css, /Public member card refinement/);
  assert.match(css, /ps-community-profile-banner::after/);
  assert.match(css, /ps-community-profile-presence > i\.is-online/);
  assert.match(css, /ps-community-profile-actions button:active/);
});

test("saved frames and accent colors render on the community member list, hover popout and full profile", () => {
  assert.match(page, /member\.avatar_frame \?\? "none"/);
  assert.match(page, /hoverCommunityProfile\.avatarFrame \?\? "none"/);
  assert.match(page, /selectedCommunityProfile\.avatarFrame \?\? "none"/);
  assert.match(page, /selectedCommunityProfile\.accentColor \?\? "#3987FF"/);
  assert.match(css, /ps-community-profile-avatar\.frame-solar/);
  assert.match(css, /ps-community-profile-dialog\.is-profile-frame-aurora/);
  assert.match(css, /ps-community-member-popout__status-bubble/);
  assert.match(css, /ps-community-member-popout__avatar\.frame-violet/);
  assert.match(css, /--community-accent/);
  assert.match(page, /ps-community-member-popout/);
  assert.match(page, /avatar_decoration_id/);
  assert.match(page, /profile_frame_id/);
  assert.match(page, /profile_effect_id/);
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
  assert.match(studio, /openAppearancePicker\("avatarDecoration"\)/);
  assert.match(studio, /openAppearancePicker\("profileFrame"\)/);
  assert.match(studio, /openAppearancePicker\("profileEffect"\)/);
  assert.match(studio, /openAppearancePicker\("plate"\)/);
  assert.match(studio, /confirmAvatarCrop/);
  assert.match(studio, /statusExpiresAt/);
  assert.match(studio, /statusDuration/);
  assert.match(studio, /ps-community-status-bubble/);
  assert.match(studio, /ps-community-color-picker-plane/);
  assert.match(studio, /ps-community-color-picker-hue/);
  assert.match(studio, /ps-community-color-picker-hex/);
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
  for (const column of ["avatar_decoration_id", "profile_frame_id", "profile_effect_id", "status_expires_at"]) {
    assert.match(cosmeticsMigration, new RegExp("add column if not exists " + column));
  }
  assert.match(cosmeticsMigration, /check \(avatar_decoration_id in/);
  assert.match(cosmeticsMigration, /check \(profile_frame_id in/);
  assert.match(cosmeticsMigration, /check \(profile_effect_id in/);
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

test("avatar frames have their own selector and are not confused with profile-card frames", () => {
  assert.match(studio, /type PickerKind = "avatarFrame"/);
  assert.match(studio, /openAppearancePicker\("avatarFrame"\)/);
  assert.match(studio, /FRAMES\.map/);
  assert.match(studio, /draftAvatarFrame/);
  assert.match(studio, /avatarFrame === item\.id \? "EQUIPADO"/);
  assert.match(studio, /Cambiar marco de avatar/);
});

test("appearance selectors open focused collection dialogs instead of rendering duplicate inline galleries", () => {
  assert.match(studio, /ps-community-picker-modal/);
  assert.match(studio, /openAppearancePicker\("avatarDecoration"\)/);
  assert.match(studio, /openAppearancePicker\("profileFrame"\)/);
  assert.match(studio, /openAppearancePicker\("profileEffect"\)/);
  assert.match(studio, /openAppearancePicker\("plate"\)/);
  assert.match(studio, /confirmAvatarCrop/);
  assert.match(studio, /statusExpiresAt/);
  assert.match(studio, /statusDuration/);
  assert.match(studio, /ps-community-color-picker-plane/);
  assert.match(studio, /ps-community-color-picker-hue/);
  assert.match(studio, /ps-community-color-picker-hex/);
  assert.doesNotMatch(studio, /ps-community-editor-frame-options/);
  assert.doesNotMatch(studio, /ps-community-editor-plate-options/);
  assert.doesNotMatch(studio, /ps-community-editor-preview-badges/);
  assert.match(studio, /VISTA PREVIA/);
  assert.match(studio, /Presets comunitarios/);
  assert.doesNotMatch(studio, /Nitro|Ir a la tienda|Tienda/);
  assert.doesNotMatch(studio, /ps-community-editor-preview-member-state[^\n]*EN LÍNEA/);
  assert.match(css, /ps-community-editor-choice-row/);
  assert.match(css, /ps-community-picker-modal/);
  assert.doesNotMatch(css, /^\.community-profile-dialog\s*\{/m);
  assert.doesNotMatch(css, /^\.community-profile-overlay\s*\{/m);
  assert.doesNotMatch(css, /community-member-hover-layer|community-member-hover-actions|ps-community-pop/);
  assert.doesNotMatch(css, /ps-community-editor-frame-options|ps-community-editor-plate-options/);
  assert.doesNotMatch(studio, /ps-community-editor-avatar-online|ps-community-editor-online|ps-community-editor-preview-online/);
  assert.doesNotMatch(studio, /Nitro|Ir a la tienda|Tienda/);
  assert.match(studio, /Presets comunitarios/);
});
