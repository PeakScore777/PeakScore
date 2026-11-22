import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, studio, css, route, migration, memberNumberMigration, cosmeticsMigration, music, peakstyleManifest, nextConfig] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121223000_community_profile_studio_appearance.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121225000_community_profile_member_number.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121235000_community_profile_cosmetics_and_status.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/layout/PeakScoreMusicPlayer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/community/peakstyle/manifest.json", import.meta.url), "utf8"),
  readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
]);

test("Content Security Policy allows only the configured Supabase Realtime WebSocket origin", () => {
  assert.match(nextConfig, /const supabaseRealtimeOrigin = \(\(\) => \{/);
  assert.match(nextConfig, /return `wss:\/\/\$\{url\.host\}`/);
  assert.match(nextConfig, /supabaseOrigin,\s*supabaseRealtimeOrigin,\s*supabaseStorageOrigin/);
});

test("profile editor imports semantic Lucide icons for inline controls", () => {
  assert.match(studio, /import \{[\s\S]*?Camera[\s\S]*?Frame[\s\S]*?Palette[\s\S]*?Sparkles[\s\S]*?\} from "lucide-react"/);
  assert.match(studio, /<Frame size=\{14\}\/>/);
  assert.match(studio, /<Sparkles size=\{14\}\/>/);
});

test("music player scopes local fallback state to the selected track without setState effects", () => {
  assert.match(music, /const \[fallbackState, setFallbackState\]/);
  assert.match(music, /selectedTrack: TrackId/);
  assert.match(music, /const hasFallbackForSelectedTrack = fallbackState\.selectedTrack === selectedTrack/);
  assert.match(music, /const audioUnavailable = hasFallbackForSelectedTrack && fallbackState\.unavailable/);
  assert.match(music, /src=\{audioUnavailable \? undefined : currentTrack\.src\}/);
  assert.match(music, /fallbackTrack: selectedTrack === "classic" \? "study" : "pixel"/);
  assert.match(music, /setFallbackState\(\{\s*selectedTrack,\s*fallbackTrack,\s*unavailable: true/s);
  assert.doesNotMatch(music, /setFallbackTrack\(null\)|setAudioUnavailable\(false\)/);
  assert.doesNotMatch(music, /console\.error\(/);
  assert.match(music, /preload="none"/);
});

test("the profile editor opens as a centered bounded single-canvas modal", () => {
  assert.match(page, /CommunityProfileStudio/);
  assert.match(page, /selectedCommunityProfile\?\.isOwnProfile/);
  assert.match(studio, /createPortal\(/);
  assert.match(studio, /className="ps-community-editor-overlay"/);
  assert.match(studio, /role="dialog"/);
  assert.match(studio, /aria-modal="true"/);
  const latest = css.slice(css.lastIndexOf("single-canvas Discord-style profile editor"));
  assert.match(latest, /place-items: center !important/);
  assert.match(latest, /width: min\(1080px,calc\(100vw - 48px\)\)/);
  assert.match(latest, /height: min\(900px,calc\(100dvh - 48px\)\)/);
});

test("responsive modal keeps the profile canvas and inline settings usable on narrow screens", () => {
  const latest = css.slice(css.lastIndexOf("single-canvas Discord-style profile editor"));
  assert.match(latest, /@media \(max-width: 760px\)/);
  assert.match(latest, /\.ps-community-editor-preview-column/);
  assert.match(latest, /\.ps-community-editor-inline-settings/);
  assert.match(latest, /overflow-y: auto !important/);
  assert.match(latest, /safe-area-inset-bottom/);
  assert.match(latest, /\.ps-community-editor-savebar/);
});

test("the studio uses one central editable profile with no side settings or dashboard", () => {
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-inline-settings/);
  assert.doesNotMatch(studio, /ps-community-editor-controls|ps-community-editor-community-column|ps-community-editor-sidebar/);
  assert.doesNotMatch(studio, /Tu identidad social es independiente/);
});

test("editor exposes avatar upload and a color-only live banner picker", () => {
  assert.match(studio, /ps-community-editor-banner-color-anchor/);
  assert.match(studio, /Cambiar color del banner/);
  assert.match(studio, /handleAvatarFileSelection/);
  assert.match(studio, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.doesNotMatch(studio, /uploadAsset\("banner"/);
  assert.match(css, /\.ps-community-editor-banner-color-anchor/);
  assert.match(css, /\.ps-community-editor-preview-banner/);
});

test("profile status and cosmetics use clean Discord-like affordances with accessible motion states", () => {
  assert.doesNotMatch(studio, /STATUS_EMOJIS|ps-community-note-bubble-emoji|ps-community-status-emoji-group/);
  assert.match(studio, /ps-community-note-bubble-edit/);
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

test("desktop editor remains a centered, bounded single-canvas modal", () => {
  const latest = css.slice(css.lastIndexOf("single-canvas Discord-style profile editor"));
  assert.match(latest, /place-items: center !important/);
  assert.match(latest, /width: min\(1080px,calc\(100vw - 48px\)\)/);
  assert.match(latest, /height: min\(900px,calc\(100dvh - 48px\)\)/);
  assert.match(latest, /\.ps-community-editor-workspace \{/);
});

test("profile fields and cosmetics update in the same central live canvas", () => {
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-preview-name-input/);
  assert.match(studio, /ps-community-editor-preview-pronouns/);
  assert.match(studio, /ps-community-note-bubble/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.match(studio, /ps-community-editor-inline-settings/);
  assert.match(studio, /openAppearancePicker\("profileFrame"\)/);
  assert.match(studio, /openAppearancePicker\("profileEffect"\)/);
  assert.match(studio, /openAppearancePicker\("plate"\)/);
  assert.doesNotMatch(studio, /setControlsOpen|data-active-section|data-section="banner"/);
  assert.match(css, /\.ps-community-editor-inline-settings/);
});

test("public member profile uses a refined dark banner, community identity and grouped role hierarchy", () => {
  assert.match(page, /ps-community-profile-banner-meta/);
  assert.match(page, /PEAKSCORE <i\/> COMMUNITY/);
  assert.match(page, /ps-community-profile-roles-section/);
  assert.match(page, /ROLES DE COMUNIDAD/);
  assert.match(css, /Public member card refinement/);
  assert.match(css, /ps-community-profile-banner::after/);
  assert.match(css, /ps-community-profile-presence > i\.is-online/);
  assert.match(css, /@keyframes ps-community-presence-pulse/);
  assert.match(css, /ps-community-profile-avatar > i\.is-online::after/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?ps-community-presence-pulse/);
  assert.match(css, /ps-community-profile-actions button:active/);
  assert.match(css, /ps-community-profile-roles > span:hover/);
  assert.match(css, /@keyframes ps-community-banner-glint/);
  assert.match(css, /ps-community-profile-banner__fallback::after/);
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
  assert.doesNotMatch(studio, /data-section="accent"|Color de acento|setAccentColor\(accent\.value\)/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-preview-avatar/);
  assert.match(studio, /Guardar cambios/);
  assert.match(studio, /onSaved\(\)/);
  assert.match(studio, /\/api\/community\/profile\//);
});

test("avatar uploads and removal are owner-scoped, sanitized and rate-limited", () => {
  assert.match(studio, /uploadAsset\("avatar"/);
  assert.match(studio, /removeAsset\("avatar"\)/);
  assert.doesNotMatch(studio, /uploadAsset\("banner"|removeAsset\("banner"/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /userId !== user\.id/);
  assert.match(route, /sanitizeRasterImage/);
  assert.match(route, /consume_community_attachment_rate_limit/);
  assert.match(route, /upsert: false/);
  assert.match(route, /if \(kind !== "avatar"\)/);
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
  assert.match(studio, /Prototipos visuales/);
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
  assert.match(studio, /Prototipos visuales/);
});


test("final modal override keeps a Discord-like dark centered workspace", () => {
  const latest = css.slice(css.lastIndexOf("Corrected desktop composition: centered Discord-style modal"));
  assert.match(latest, /background: #111214 !important/);
  assert.match(latest, /background: #0b0c0f !important/);
  assert.match(latest, /border-radius: 12px !important/);
  assert.match(latest, /@media \(max-width: 560px\)/);
});

test("identity studio uses one central live profile canvas with inline settings", () => {
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-inline-settings/);
  assert.doesNotMatch(studio, /ps-community-editor-controls|ps-community-editor-community-column/);
  assert.doesNotMatch(studio, /Tu identidad social es independiente de tu progreso académico y de PeakStyle/);
});

test("profile image uploads are avatar-only; the card banner is a color setting", () => {
  assert.match(studio, /Cambiar color del banner/);
  assert.match(studio, /handleAvatarFileSelection/);
  assert.match(studio, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.doesNotMatch(studio, /Las fotografías se utilizan únicamente para tu avatar/);
  assert.doesNotMatch(studio, /uploadAsset\("banner"/);
  assert.match(route, /if \(kind !== "avatar"\)/);
  assert.match(route, /Solo puedes subir una imagen para tu avatar/);
  assert.match(route, /El banner se personaliza con color/);
  assert.match(route, /Solo puedes retirar la imagen de tu avatar/);
});

test("community profile banners render from the saved color, never from an uploaded image", () => {
  assert.doesNotMatch(page, /hoverCommunityProfile\.bannerUrl \?/);
  assert.doesNotMatch(page, /selectedCommunityProfile\.bannerUrl \?/);
  assert.match(page, /backgroundColor: \/\^#\[0-9a-f\]\{6\}\$\/i\.test\(selectedCommunityProfile\.cardColor/);
  assert.match(studio, /ps-community-editor-banner-color-anchor/);
  assert.match(route, /Solo puedes subir una imagen para tu avatar/);
});


test("profile status is an editable Discord-style bubble and cosmetics use meaningful icons", () => {
  assert.doesNotMatch(studio, /STATUS_EMOJIS|ps-community-status-emoji-group|EMOJI DE ESTADO/);
  assert.match(studio, /ps-community-status-bubble">\{statusDraft\}/);
  assert.match(studio, /statusDraft\.trim\(\) \?/);
  assert.match(studio, /setStatus\(statusDraft\.trim\(\)\)/);
  assert.doesNotMatch(studio, /<Orbit|<Activity|id: "orbit"/);
  assert.match(studio, /<Sparkles size=\{14\}\/> Decoración/);
  assert.match(studio, /<Frame size=\{14\}\/> Marco/);
});


test("profile editor has no dead mobile preview or banner upload state", () => {
  assert.doesNotMatch(studio, /previewMode|setPreviewMode|Smartphone/);
  assert.doesNotMatch(studio, /useState<"avatar" \| "banner"/);
  assert.match(studio, /useState<"avatar" \| null>/);
  assert.doesNotMatch(studio, /uploadAsset\("banner"|removeAsset\("banner"/);
});


test("Escape closes the topmost profile editor surface before the editor itself", () => {
  assert.match(studio, /if \(avatarCropUrl\) \{[\s\S]*?closeAvatarCrop\(\)/);
  assert.match(studio, /if \(statusEditorOpen\) \{[\s\S]*?setStatusEditorOpen\(false\)/);
  assert.match(studio, /if \(appearancePicker\) \{[\s\S]*?setAppearancePicker\(null\)/);
  assert.match(studio, /if \(colorPickerOpen\) \{[\s\S]*?setColorPickerOpen\(false\)/);
  assert.match(studio, /if \(avatarMenuOpen\) \{[\s\S]*?setAvatarMenuOpen\(false\)/);
});


test("banner color picker is attached to the live banner and updates the center card", () => {
  assert.match(studio, /ps-community-editor-banner-color-anchor/);
  assert.match(studio, /aria-label="Selector de color del banner"/);
  assert.match(studio, /aria-label="Tono"/);
  assert.match(studio, /backgroundColor: cardColor/);
  assert.match(studio, /setColorPickerOpen\(true\)/);
  assert.doesNotMatch(studio, /label: "Color de cartel"|<h2>Color de cartel/);
});


test("live banner hover menu opens the profile effect and frame pickers", () => {
  assert.match(studio, /bannerMenuOpen/);
  assert.match(studio, /className="ps-community-editor-preview-banner-shade"/);
  assert.match(studio, /className="ps-community-editor-live-banner-actions"/);
  assert.match(studio, /aria-label="Opciones del cartel"/);
  assert.match(studio, /openAppearancePicker\("profileEffect"\)/);
  assert.match(studio, /openAppearancePicker\("profileFrame"\)/);
  assert.match(css, /\.ps-community-editor-preview-banner:hover \.ps-community-editor-live-banner-actions/);
  assert.match(css, /\.ps-community-editor-banner-menu button:hover/);
});

test("clicking the live avatar opens its own change, decoration and remove actions", () => {
  assert.match(studio, /ps-community-editor-preview-avatar-trigger/);
  assert.match(studio, /aria-label="Cambiar avatar o decoración"/);
  assert.match(studio, /ps-community-editor-avatar-menu-preview/);
  assert.match(studio, /Cambiar avatar/);
  assert.match(studio, /Cambiar decoración de avatar/);
  assert.match(studio, /Eliminar avatar/);
  assert.match(css, /\.ps-community-editor-preview-avatar-trigger:hover/);
  assert.match(css, /\.ps-community-editor-avatar-menu-preview button:hover/);
});

test("profile card banner and body follow the live selected card color", () => {
  const latest = css.slice(css.lastIndexOf("single-canvas Discord-style profile editor"));
  assert.match(latest, /background-color: var\(--editor-card, #232428\) !important/);
  assert.match(latest, /\.ps-community-editor-preview-banner/);
  assert.match(latest, /\.ps-community-editor-preview-body/);
  assert.match(page, /backgroundColor: \/\^#\[0-9a-f\]\{6\}\$\/i\.test\(selectedCommunityProfile\.cardColor/);
});

test("profile editor removes the identity footnote and keeps all editable identity fields in the card", () => {
  assert.doesNotMatch(studio, /Tu identidad social es independiente de tu progreso académico y de PeakStyle/);
  assert.match(studio, /ps-community-editor-preview-name-input/);
  assert.match(studio, /ps-community-editor-preview-pronouns/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.match(studio, /ps-community-note-bubble/);
});


test("Escape dismisses the banner context menu before closing the profile editor", () => {
  assert.match(studio, /if \(bannerMenuOpen\) \{[\s\S]*?setBannerMenuOpen\(false\)/);
  assert.match(studio, /statusEditorOpen, avatarCropUrl, colorPickerOpen, avatarMenuOpen, bannerMenuOpen/);
});


test("banner color picker is visually attached to the banner with a full hue spectrum", () => {
  assert.doesNotMatch(studio, /ps-community-brand-wordmark/);
  assert.match(studio, /ps-community-editor-banner-color-anchor/);
  assert.match(studio, /ps-community-editor-preview-banner"[^\n]*style=\{\{ backgroundColor: cardColor \}\}/);
  const latest = css.slice(css.lastIndexOf("single-canvas Discord-style profile editor"));
  assert.match(latest, /\.ps-community-editor-banner-color-anchor \.ps-community-color-picker-hue/);
  assert.match(latest, /linear-gradient\(90deg,#ff0000 0%,#ffff00/);
});


test("the profile editor never requests the removed ArrowLeft Lucide module", () => {
  assert.doesNotMatch(studio, /ArrowLeft|arrow-left/);
  assert.match(studio, /ChevronRight/);
});

test("the live profile canvas edits name, pronouns, status and biography in place", () => {
  assert.doesNotMatch(studio, /ps-community-brand-wordmark">PeakScore/);
  assert.match(studio, /ps-community-editor-preview-banner-empty" aria-hidden="true"/);
  assert.match(studio, /value=\{displayName\} maxLength=\{32\}/);
  assert.match(studio, /value=\{pronouns\} maxLength=\{32\}/);
  assert.match(studio, /onClick=\{openStatusEditor\}/);
  assert.match(studio, /textarea value=\{about\}/);
});


test("profile popovers close on outside pointer interaction", () => {
  assert.match(studio, /cardColorControlRef/);
  assert.match(studio, /avatarMenuAnchorRef/);
  assert.match(studio, /bannerMenuAnchorRef/);
  assert.match(studio, /document\.addEventListener\("pointerdown", handleOutsidePointerDown, true\)/);
  assert.match(studio, /document\.removeEventListener\("pointerdown", handleOutsidePointerDown, true\)/);
  assert.match(studio, /if \(colorPickerOpen && !cardColorControlRef\.current\?\.contains\(target\)\)/);
  assert.match(studio, /if \(avatarMenuOpen && !avatarMenuAnchorRef\.current\?\.contains\(target\)\)/);
  assert.match(studio, /if \(bannerMenuOpen && !bannerMenuAnchorRef\.current\?\.contains\(target\)\)/);
  for (const overlay of ["ps-community-status-overlay", "ps-community-picker-overlay", "ps-community-avatar-crop-overlay"]) {
    assert.match(studio, new RegExp('className="' + overlay + '" onPointerDown'));
  }
});

test("banner color picker keeps its hue spectrum rainbow despite shared input styling", () => {
  const latest = css.slice(css.lastIndexOf("Discord-like member plate, tone picker and dismissible profile popovers."));
  assert.match(latest, /\.ps-community-color-picker-hue/);
  assert.match(latest, /linear-gradient\(90deg,[\s\S]*?#ff0000[\s\S]*?#ffff00[\s\S]*?#00ff00[\s\S]*?#00ffff[\s\S]*?#0000ff[\s\S]*?#ff00ff/);
  assert.match(latest, /::-webkit-slider-thumb/);
  assert.match(latest, /::-moz-range-thumb/);
});

test("member plate selector previews the actual avatar, display name and community role", () => {
  assert.match(studio, /ps-community-editor-member-row-preview/);
  assert.match(studio, /ps-community-picker-member-option/);
  assert.match(studio, /ps-community-picker-member-row/);
  assert.match(studio, /profile\.roles\[0\]\?\.label \?\? "Miembro"/);
  assert.match(studio, /draftPlate/);
  const latest = css.slice(css.lastIndexOf("Discord-like member plate, tone picker and dismissible profile popovers."));
  assert.match(latest, /\.ps-community-picker-member-list-heading/);
  assert.match(latest, /\.ps-community-picker-member-row/);
  assert.match(latest, /\.ps-community-picker-member-role/);
  assert.match(latest, /\.ps-community-picker-member-name\.is-plate-grid/);
});

test("status editor restores the active expiry, previews the status and supports Enter to save", () => {
  assert.match(studio, /function openStatusEditor\(\)/);
  assert.match(studio, /setStatusDuration\("30m"\)/);
  assert.match(studio, /setStatusDuration\("1h"\)/);
  assert.match(studio, /setStatusDuration\("4h"\)/);
  assert.equal((studio.match(/onClick=\{openStatusEditor\}/g) || []).length, 2);
  assert.match(studio, /¿Qué tienes en mente\?/);
  assert.match(studio, /event\.key === "Enter" && !event\.shiftKey/);
  assert.match(studio, /className="ps-community-status-overlay" onPointerDown/);
  assert.match(css, /\.ps-community-status-modal > footer \.is-save/);
});


test("community profile editor removes side dashboard widgets and keeps profile fields in the live card", async () => {
  assert.doesNotMatch(studio, /profileContentTab|setProfileContentTab|ps-community-editor-community-tabs/);
  assert.doesNotMatch(studio, /Juego favorito|Juegos que me gustan|Conecta un juego|Juegos en rotación|Quiero jugar|Conexiones de juego|Explorar actividad|Lista de deseos/);
  assert.doesNotMatch(studio, /ps-community-editor-community-column|aria-label="Tablero del perfil"/);
  assert.match(studio, /ps-community-editor-preview-name-input/);
  assert.match(studio, /ps-community-editor-preview-pronouns/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.match(studio, /ps-community-editor-inline-settings/);
  assert.match(css, /single-canvas Discord-style profile editor/);
});


test("profile studio uses one central live canvas on desktop and Discord-style vertical layout on mobile", () => {
  assert.match(studio, /ps-community-editor-preview-about[\s\S]*?textarea value=\{about\}/);
  assert.match(studio, /ps-community-editor-inline-settings/);
  assert.doesNotMatch(studio, /ps-community-editor-mobile-identity|ps-community-editor-controls|ps-community-editor-community-column/);
  assert.match(studio, /ps-community-editor-banner-color-anchor/);
  assert.match(css, /single-canvas Discord-style profile editor/);
  assert.match(css, /\.ps-community-editor-inline-settings/);
  assert.match(css, /\.ps-community-editor-preview-avatar-row > \.ps-community-note-bubble/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("PeakStyle manifest points to the existing first-party cosmetic catalogue", () => {
  const manifest = JSON.parse(peakstyleManifest);
  assert.equal(manifest.product, "PeakStyle");
  assert.equal(manifest.assetRoot, "/profile-cosmetics");
  assert.deepEqual(Object.keys(manifest.categories).sort(), ["avatarFrames", "nameplates", "profileBanners", "profileEffects", "profileThemes"]);
  const items = Object.values(manifest.categories).flatMap((category) => category.items);
  assert.equal(items.length, 9);
  assert.ok(items.every((item) => item.status));
  assert.ok(items.some((item) => item.id === "effect-starfall" && item.animated === false));
  assert.equal(manifest.rules.onlyFirstPartyAssets, true);
  assert.equal(manifest.rules.requireStaticFallbackForMotion, true);
  assert.equal(manifest.rules.animateGalleryThumbnails, false);
  assert.equal(manifest.rules.respectReducedMotion, true);
  assert.match(studio, /Prototipos visuales · arte final pendiente/);
});
