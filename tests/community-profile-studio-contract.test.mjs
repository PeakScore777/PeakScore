import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, studio, css, nameStyleCss, route, migration, memberNumberMigration, cosmeticsMigration, orbitRemovalMigration, displayNameStyleMigration, discordNameStyleMigration, prismColorsMigration, expandedNameCatalogueMigration, discordVideoEffectsMigration, discordVideoEffectsRepeatMigration, entranceAnimationMigration, entranceMotionMigration, entranceSignatureMigration, entranceSignatureWaveTwoMigration, compactAnimationCatalogueMigration, decryptedName, decryptedAnimationMigration, glitchName, glitchAnimationMigration, fuzzyText, fuzzySettings, threeAnimationCatalogueMigration, fuzzyAnimationMigration, fuzzySettingsMigration, music, peakstyleManifest, nextConfig] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/community-name-style.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121223000_community_profile_studio_appearance.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121225000_community_profile_member_number.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121235000_community_profile_cosmetics_and_status.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261122140000_remove_orbit_avatar_decoration.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261122230635_community_profile_display_name_style.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261122232700_community_discord_name_style_catalogue.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261122233450_community_display_name_prism_five_colors.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261122235200_community_display_name_expanded_catalogue.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010106_community_display_name_discord_video_effects.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010203_community_display_name_discord_video_effects.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010300_community_display_name_entrance_animation.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010400_community_display_name_motion_atelier.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010500_community_display_name_motion_signatures.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010600_community_display_name_motion_signatures_wave_two.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010700_community_display_name_restore_compact_animation_catalogue.sql", import.meta.url), "utf8"),


  readFile(new URL("../components/community/DecryptedDisplayName.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010800_community_display_name_decrypted_text_animation.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/community/SignalBreakDisplayName.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123010900_community_display_name_glitch_text_animation.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/community/FuzzyText.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/fuzzy-text-settings.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123011200_community_display_name_three_animation_catalogue.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123011300_community_display_name_fuzzy_text_animation.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261123011400_community_display_name_fuzzy_settings.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/layout/PeakScoreMusicPlayer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/community/peakstyle/manifest.json", import.meta.url), "utf8"),
  readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
]);

test("Content Security Policy allows only the configured Supabase Realtime WebSocket origin", () => {
  assert.match(nextConfig, /const supabaseRealtimeOrigin = \(\(\) => \{/);
  assert.match(nextConfig, /return `wss:\/\/\$\{url\.host\}`/);
  assert.match(nextConfig, /supabaseOrigin,\s*supabaseRealtimeOrigin,\s*supabaseStorageOrigin/);
});

test("obsolete orbit avatar decoration is removed from the UI, API and persisted profiles", () => {
  assert.doesNotMatch(studio, /id: "orbit"|<Orbit/);
  assert.doesNotMatch(studio, /avatarDecorationId === "orbit"/);
  assert.doesNotMatch(studio, /AVATAR_DECORATIONS.*orbit/);
  assert.doesNotMatch(css, /is-decoration-orbit|ps-community-orbit/);
  assert.doesNotMatch(page, /"none" \| "orbit"/);
  assert.doesNotMatch(route, /"none", "orbit"/);
  assert.match(orbitRemovalMigration, /set avatar_decoration_id = 'none'[\s\S]*where avatar_decoration_id = 'orbit'/);
  assert.match(orbitRemovalMigration, /check \(avatar_decoration_id in \('none', 'bloom', 'electric', 'glitch'\)\)/);
});

test("profile editor imports semantic Lucide icons for inline controls", () => {
  assert.match(studio, /import \{[\s\S]*?Camera[\s\S]*?ImagePlus[\s\S]*?Palette[\s\S]*?\} from "lucide-react"/);
  assert.doesNotMatch(studio, /<Frame size=\{13\}\/>/);
  assert.match(studio, /<ImagePlus size=\{15\}\/>/);
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

test("the profile editor opens as a centered Discord-like modal with a settings rail and live profile", () => {
  assert.match(page, /CommunityProfileStudio/);
  assert.match(studio, /createPortal\(/);
  assert.match(studio, /className="ps-community-editor-overlay"/);
  assert.match(studio, /role="dialog"/);
  assert.match(studio, /aria-modal="true"/);
  const latest = css.slice(css.lastIndexOf("Editor shell sizing"));
  assert.match(latest, /width: min\(920px,calc\(100vw - 48px\)\)/);
  assert.match(latest, /grid-template-columns: 220px minmax\(0,1fr\)/);
  assert.match(latest, /height: min\(840px,calc\(100dvh - 36px\)\)/);
  assert.match(latest, /width: min\(700px,calc\(100vw - 48px\)\)/);
});

test("responsive modal stacks the live profile above settings on mobile", () => {
  const latest = css.slice(css.lastIndexOf("Discord profile editor composition: settings rail"));
  assert.match(latest, /@media \(max-width: 760px\)/);
  assert.match(latest, /\.ps-community-editor-preview-column/);
  assert.match(latest, /\.ps-community-editor-settings-sidebar/);
  assert.match(latest, /grid-template-areas: "profile" "settings"/);
  assert.match(latest, /overflow-y: auto !important/);
  assert.match(latest, /safe-area-inset-bottom/);
  assert.match(latest, /\.ps-community-editor-savebar/);
});

test("the studio uses the requested left appearance rail and center editable profile with no right dashboard", () => {
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.match(studio, /Placa de identificación/);
  assert.match(studio, /Avatar y decoración/);
  assert.match(studio, /Tema de perfil/);
  assert.match(studio, /Marcos y efectos de perfil/);
  assert.match(studio, /Estilo de nombre de visualización/);
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.doesNotMatch(studio, /ps-community-editor-community-column|aria-label="Tablero del perfil"/);
  const latest = css.slice(css.lastIndexOf("Discord profile editor composition: settings rail"));
  assert.match(latest, /grid-template-columns: 232px minmax\(0,1fr\)/);
  assert.doesNotMatch(studio, /Tu identidad social es independiente/);
});

test("editor exposes avatar upload and the banner color picker in the left appearance rail", () => {
  assert.match(studio, /ps-community-editor-theme-picker-anchor/);
  assert.match(studio, /Tema de perfil/);
  assert.match(studio, /Editar primer color del tema/);
  assert.match(studio, /handleAvatarFileSelection/);
  assert.match(studio, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.doesNotMatch(studio, /uploadAsset\("banner"/);
  assert.match(css, /\.ps-community-editor-sidebar-color-picker/);
  assert.match(css, /\.ps-community-editor-preview-banner/);
});

test("profile status and cosmetics use clean Discord-like affordances with accessible motion states", () => {
  assert.doesNotMatch(studio, /STATUS_EMOJIS|ps-community-note-bubble-emoji|ps-community-status-emoji-group/);
  assert.match(studio, /ps-community-note-bubble-edit/);
  assert.match(studio, /Borrar estado después de/);
  assert.match(studio, /statusDraft\.length}\/80/);
  assert.match(studio, /ps-community-editor-decoration-tile-preview/);
  assert.match(studio, /ps-community-picker-avatar-small/);
  assert.match(css, /height: min\(800px, calc\(100dvh - 48px\)\)/);
  assert.match(css, /min-height: 382px !important/);
  assert.match(css, /\.ps-community-note-bubble:hover/);
  assert.match(css, /:focus-visible[\s\S]*?outline: 2px solid #8ea1ff/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("desktop editor is a centered two-column modal with a profile settings rail", () => {
  const latest = css.slice(css.lastIndexOf("Discord profile editor composition: settings rail"));
  assert.match(latest, /width: min\(1240px,calc\(100vw - 48px\)\)/);
  assert.match(latest, /grid-template-columns: 232px minmax\(0,1fr\)/);
  assert.match(latest, /height: min\(900px,calc\(100dvh - 48px\)\)/);
  assert.match(latest, /\.ps-community-editor-settings-sidebar/);
  assert.match(latest, /\.ps-community-editor-preview-column/);
});

test("profile fields and cosmetics update in the center while the left rail controls appearance", () => {
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-preview-name-static/);
  assert.doesNotMatch(studio, /aria-label="Nombre público"/);
  assert.match(studio, /ps-community-editor-preview-pronouns/);
  assert.match(studio, /ps-community-note-bubble/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.match(studio, /openAppearancePicker\("profileFrame"\)/);
  assert.match(studio, /openAppearancePicker\("profileEffect"\)/);
  assert.match(studio, /openAppearancePicker\("plate"\)/);
  assert.doesNotMatch(studio, /setControlsOpen|data-active-section|data-section="banner"/);
  assert.match(css, /\.ps-community-editor-settings-sidebar/);
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

test("identity values render and persist while profile name stays read-only in this editor", () => {
  for (const key of ["displayName", "pronouns", "statusText", "about", "cardColor", "plateStyle", "accentColor", "avatarFrame"]) {
    assert.ok(studio.includes(key), "Missing editor state: " + key);
  }
  assert.match(studio, /ps-community-editor-preview-name-static/);
  assert.doesNotMatch(studio, /setDisplayName\(event\.target\.value\)/);
  assert.doesNotMatch(studio, /aria-label="Nombre público"/);
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

test("avatar decoration is the only visible avatar cosmetic control; the duplicate frame option is removed", () => {
  assert.doesNotMatch(studio, /openAppearancePicker\("avatarFrame"\)/);
  assert.doesNotMatch(studio, /Marco de avatar|Cambiar marco de avatar/);
  assert.match(studio, /openAppearancePicker\("avatarDecoration"\)/);
  assert.match(studio, /Cambiar decoración de avatar/);
  assert.match(studio, /ps-community-editor-decoration-tile/);
});

test("appearance selectors open focused collection dialogs for each identity layer", () => {
  assert.match(studio, /ps-community-picker-modal/);
  for (const kind of ["avatarDecoration", "profileFrame", "profileEffect", "plate", "nameStyle"]) {
    assert.match(studio, new RegExp('openAppearancePicker\\("' + kind + '"\\)'));
  }
  assert.match(studio, /confirmAvatarCrop/);
  assert.match(studio, /statusExpiresAt/);
  assert.match(studio, /statusDuration/);
  assert.match(studio, /ps-community-color-picker-plane/);
  assert.match(studio, /ps-community-color-picker-hue/);
  assert.match(studio, /ps-community-color-picker-hex/);
  assert.match(studio, /VISTA PREVIA/);
  assert.match(studio, /Opciones disponibles/);
  assert.doesNotMatch(studio, /Nitro|Ir a la tienda|Tienda|🌟|✨|⭐|💫/);
  assert.doesNotMatch(studio, /ps-community-editor-community-column|aria-label="Tablero del perfil"/);
  assert.match(css, /ps-community-picker-modal/);
});


test("final modal override keeps a Discord-like dark centered workspace", () => {
  const latest = css.slice(css.lastIndexOf("Corrected desktop composition: centered Discord-style modal"));
  assert.match(latest, /background: #111214 !important/);
  assert.match(latest, /background: #0b0c0f !important/);
  assert.match(latest, /border-radius: 12px !important/);
  assert.match(latest, /@media \(max-width: 560px\)/);
});

test("identity studio uses a left appearance rail and a central live profile canvas", () => {
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.match(studio, /ps-community-editor-preview-card/);
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.doesNotMatch(studio, /ps-community-editor-community-column/);
  assert.match(css, /Discord profile editor composition: settings rail/);
  assert.doesNotMatch(studio, /Tu identidad social es independiente de tu progreso académico y de PeakStyle/);
});

test("profile image uploads are avatar-only; the card banner is a color setting", () => {
  assert.match(studio, /Tema de perfil/);
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
  assert.match(page, /backgroundColor: "#20242D"/);
  assert.match(studio, /ps-community-editor-theme-picker-anchor/);
  assert.match(route, /Solo puedes subir una imagen para tu avatar/);
});


test("profile status is an editable Discord-style bubble and cosmetics use meaningful icons", () => {
  assert.doesNotMatch(studio, /STATUS_EMOJIS|ps-community-status-emoji-group|EMOJI DE ESTADO/);
  assert.match(studio, /ps-community-status-bubble">\{statusDraft\}/);
  assert.match(studio, /statusDraft\.trim\(\) \?/);
  assert.match(studio, /setStatus\(statusDraft\.trim\(\)\)/);
  assert.doesNotMatch(studio, /<Orbit|<Activity|id: "orbit"/);
  assert.match(studio, /<ImagePlus size=\{15\}\/> Cambiar decoración de avatar/);
  assert.doesNotMatch(studio, /<Frame size=\{13\}\/> Marco/);
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


test("banner color picker is attached to the appearance rail and updates the center card", () => {
  assert.match(studio, /ps-community-editor-theme-picker-anchor/);
  assert.match(studio, /aria-label="Editar primer color del tema"/);
  assert.match(studio, /aria-label="Tono"/);
  assert.match(studio, /backgroundColor: cardColor/);
  assert.match(studio, /openThemeColorPicker\("top"\)/);
  assert.match(studio, /updateActiveThemeColor/);
  assert.match(studio, /Tema de perfil/);
});


test("profile frame and effect controls live in the left rail, not a banner popover", () => {
  assert.doesNotMatch(studio, /bannerMenuOpen|ps-community-editor-live-banner-actions|Opciones del cartel/);
  assert.match(studio, /openAppearancePicker\("profileEffect"\)/);
  assert.match(studio, /openAppearancePicker\("profileFrame"\)/);
  assert.match(studio, /ps-community-editor-cosmetic-tiles/);
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

test("profile theme colors the lower card, leaves the banner separate and tints the avatar ring", () => {
  const latest = css.slice(css.lastIndexOf("Theme belongs to the profile card body"));
  assert.match(studio, /--editor-theme-gradient/);
  assert.match(studio, /: \{ backgroundColor: "#20242D" \}/);
  assert.match(latest, /\.ps-community-editor-preview-card > \.ps-community-editor-preview-body \{[\s\S]*?background: var\(--editor-theme-gradient/);
  assert.match(latest, /\.ps-community-editor-preview-card > \.ps-community-editor-banner-anchor > \.ps-community-editor-preview-banner \{[\s\S]*?background-color: var\(--editor-banner-background/);
  assert.match(css, /border-color: var\(--editor-card, #B7D7C3\) !important/);
  assert.match(page, /backgroundColor: "#20242D"/);
});
test("status text uses a comic thought bubble with a dotted tail, not a generic pill", () => {
  const latest = css.slice(css.lastIndexOf("Profile card refinements: banner-only color"));
  assert.match(studio, /ps-community-note-bubble/);
  assert.match(latest, /border-radius: 17px 17px 17px 8px/);
  assert.match(latest, /ps-community-editor-preview-avatar-row > \.ps-community-note-bubble::before[\s\S]*?border-radius: 50%/);
  assert.match(latest, /ps-community-editor-preview-avatar-row > \.ps-community-note-bubble::after[\s\S]*?border-radius: 50%/);
});

test("profile frame and effect tiles show the real profile and animate on hover", () => {
  assert.match(studio, /ps-community-editor-cosmetic-live-preview is-frame/);
  assert.match(studio, /ps-community-editor-cosmetic-live-preview is-effect/);
  assert.match(studio, /ps-community-editor-cosmetic-preview-avatar/);
  assert.match(studio, /ps-community-picker-mini-profile is-profile-frame-/);
  assert.match(studio, /ps-community-picker-mini-profile is-effect/);
  assert.match(studio, /function updateProfileHoverPreview/);
  assert.ok(studio.includes('updateProfileHoverPreview(event.currentTarget, "frame", item.id, true)'));
  assert.ok(studio.includes('updateProfileHoverPreview(event.currentTarget, "effect", item.id, true)'));
  assert.ok(studio.includes("is-hover-preview"));
  assert.match(css, /\.ps-community-editor-cosmetic-tile:hover \.ps-community-editor-cosmetic-live-preview\.is-frame::after/);
  assert.match(css, /\.ps-community-editor-cosmetic-tile:hover \.ps-community-editor-cosmetic-preview-art/);
  assert.match(css, /\.ps-community-picker-item:hover \.ps-community-picker-mini-art/);
  assert.match(css, /ps-community-profile-frame-glint/);
  assert.match(css, /ps-community-profile-effect-reveal/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("profile editor removes the identity footnote and keeps all editable identity fields in the card", () => {
  assert.doesNotMatch(studio, /Tu identidad social es independiente de tu progreso académico y de PeakStyle/);
  assert.match(studio, /ps-community-editor-preview-name-static/);
  assert.doesNotMatch(studio, /aria-label="Nombre público"/);
  assert.match(studio, /ps-community-editor-preview-pronouns/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.match(studio, /ps-community-note-bubble/);
});


test("Escape closes the active profile child surface before the editor", () => {
  assert.match(studio, /if \(avatarCropUrl\) \{[\s\S]*?closeAvatarCrop\(\)/);
  assert.match(studio, /if \(statusEditorOpen\) \{[\s\S]*?setStatusEditorOpen\(false\)/);
  assert.match(studio, /if \(appearancePicker\) \{[\s\S]*?setAppearancePicker\(null\)/);
  assert.match(studio, /if \(colorPickerOpen\) \{[\s\S]*?setColorPickerOpen\(false\)/);
});


test("profile theme exposes two independent color stops with an accessible hue spectrum", () => {
  assert.match(studio, /ps-community-editor-theme-stop-list/);
  assert.match(studio, /openThemeColorPicker\("top"\)/);
  assert.match(studio, /openThemeColorPicker\("bottom"\)/);
  assert.match(studio, /updateActiveThemeColor\(hsvToHex\(cardHue, saturation, value\)\)/);
  assert.match(studio, /aria-label="Tono"/);
  assert.match(css, /\.ps-community-color-picker-hue::-webkit-slider-runnable-track/);
  assert.match(css, /\.ps-community-color-picker-hue::-moz-range-track/);
  assert.match(css, /linear-gradient\(90deg,#ff0000 0%,#ffff00/);
});


test("the editor keeps the settings rail permanently visible without collapse controls", () => {
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.doesNotMatch(studio, /ChevronLeft|ChevronRight|ps-community-editor-sidebar-toggle|settingsCollapsed/);
});

test("the live profile canvas edits name, pronouns, status and biography in place", () => {
  assert.doesNotMatch(studio, /ps-community-brand-wordmark">PeakScore/);
  assert.match(studio, /ps-community-editor-preview-banner-empty" aria-hidden="true"/);
  assert.match(studio, /ps-community-editor-preview-name-static[\s\S]*?\{displayName \|\| "Tu nombre"\}/);
  assert.doesNotMatch(studio, /aria-label="Nombre público"/);
  assert.ok(studio.includes("value={pronouns}"));
  assert.ok(studio.includes("maxLength={24}"));
  assert.match(studio, /onClick=\{openStatusEditor\}/);
  assert.match(studio, /className="ps-community-editor-bio-inline is-editing"[\s\S]*?value=\{about\}/);
});


test("profile popovers close on outside pointer interaction", () => {
  assert.match(studio, /cardColorControlRef/);
  assert.match(studio, /avatarMenuAnchorRef/);
  assert.match(studio, /document\.addEventListener\("pointerdown", handleOutsidePointerDown, true\)/);
  assert.match(studio, /document\.removeEventListener\("pointerdown", handleOutsidePointerDown, true\)/);
  assert.match(studio, /if \(colorPickerOpen && !cardColorControlRef\.current\?\.contains\(target\)\)/);
  assert.match(studio, /if \(avatarMenuOpen && !avatarMenuAnchorRef\.current\?\.contains\(target\)\)/);
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
  assert.match(studio, /ps-community-picker-items is-plates/);
  assert.match(studio, /ps-community-picker-item is-plate-item/);
  assert.match(studio, /ps-community-picker-member-option is-plate-/);
  assert.match(studio, /ps-community-picker-member-avatar/);
  assert.match(studio, /ps-community-picker-member-copy/);
  assert.match(studio, /ps-community-picker-member-name is-plate-/);
  assert.match(studio, /profile\.roles\[0\]\?\.label \?\? "Miembro"/);
  assert.match(studio, /draftPlate/);
});

test("status editor restores the active expiry, previews the status and supports Enter to save", () => {
  assert.match(studio, /function openStatusEditor\(\)/);
  assert.match(studio, /setStatusDuration\("30m"\)/);
  assert.match(studio, /setStatusDuration\("1h"\)/);
  assert.match(studio, /setStatusDuration\("4h"\)/);
  assert.equal((studio.match(/onClick=\{openStatusEditor\}/g) || []).length, 1);
  assert.match(studio, /¿Qué ganas de\.\.\./);
  assert.match(studio, /event\.key === "Enter" && !event\.shiftKey/);
  assert.match(studio, /className="ps-community-status-overlay" onPointerDown/);
  assert.match(css, /\.ps-community-status-modal > footer \.is-save/);
});


test("community profile editor has no right dashboard and keeps editable details in the center profile", async () => {
  assert.doesNotMatch(studio, /profileContentTab|setProfileContentTab|ps-community-editor-community-tabs/);
  assert.doesNotMatch(studio, /Juego favorito|Juegos que me gustan|Conecta un juego|Juegos en rotación|Quiero jugar|Conexiones de juego|Explorar actividad|Lista de deseos/);
  assert.doesNotMatch(studio, /ps-community-editor-community-column|aria-label="Tablero del perfil"/);
  assert.match(studio, /ps-community-editor-preview-name-static/);
  assert.doesNotMatch(studio, /aria-label="Nombre público"/);
  assert.match(studio, /ps-community-editor-preview-pronouns/);
  assert.match(studio, /ps-community-editor-preview-about/);
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.match(css, /Discord profile editor composition: settings rail/);
});


test("profile studio uses the Discord left rail and central canvas on desktop, with stacked mobile layout", () => {
  assert.match(studio, /ps-community-editor-preview-about[\s\S]*?ps-community-editor-bio-inline is-editing[\s\S]*?value=\{about\}/);
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.match(studio, /ps-community-editor-preview-column/);
  assert.doesNotMatch(studio, /ps-community-editor-community-column|aria-label="Tablero del perfil"/);
  assert.match(studio, /ps-community-editor-theme-picker-anchor/);
  assert.match(css, /Discord profile editor composition: settings rail/);
  assert.match(css, /grid-template-columns: 220px minmax\(0,1fr\)/);
  assert.match(css, /grid-template-areas: "profile" "settings"/);
  assert.match(css, /\.ps-community-editor-preview-avatar-row > \.ps-community-note-bubble/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});


test("profile settings rail remains visible at a stable width", () => {
  assert.match(studio, /ps-community-editor-settings-sidebar/);
  assert.doesNotMatch(studio, /ps-community-editor-sidebar-toggle|settingsCollapsed|is-sidebar-collapsed/);
  assert.match(css, /grid-template-columns: 232px minmax\(0,1fr\)/);
});

test("editor save and reset bar is centered below the live profile", () => {
  const latest = css.slice(css.lastIndexOf("Editor shell sizing"));
  assert.match(latest, /\.ps-community-editor-savebar[\s\S]*?left: 50% !important/);
  assert.match(latest, /transform: translateX\(-50%\) !important/);
  assert.match(latest, /bottom: 10px !important/);
});

test("profile main name is read-only while pronouns remain inline editable", () => {
  assert.match(studio, /ps-community-editor-preview-name-static/);
  assert.doesNotMatch(studio, /aria-label="Nombre público"/);
  assert.match(studio, /aria-label="Editar pronombres"/);
  assert.match(studio, /value=\{pronouns\}[\s\S]{0,120}maxLength=\{24\}/);
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
  assert.match(studio, /Opciones disponibles/);
});


test("the editor receives realtime presence and anchors its status indicator over the avatar", () => {
  assert.match(studio, /isOnline: boolean/);
  assert.match(studio, /ps-community-editor-presence-dot/);
  assert.match(page, /isOnline=\{onlineMemberIds\.includes\(selectedCommunityProfile\.userId\)\}/);
  const latest = css.slice(css.lastIndexOf("profile polish: anchored presence"));
  assert.match(latest, /\.ps-community-editor-preview-avatar > \.ps-community-editor-presence-dot/);
  assert.match(latest, /\.ps-community-profile-avatar > i,[\s\S]*?position: absolute !important/);
  assert.match(latest, /\.ps-community-profile-avatar > i\.is-online/);
});

test("the profile editor uses member labels and live profile miniatures instead of generic cosmetic glyphs", () => {
  assert.match(studio, /Miembro nuevo/);
  assert.match(studio, /Miembro /);
  assert.doesNotMatch(studio, /avatarDecorationId === "orbit"/);
  assert.match(studio, /ps-community-editor-cosmetic-live-preview is-frame/);
  assert.match(studio, /ps-community-editor-cosmetic-live-preview is-effect/);
  assert.match(studio, /ps-community-picker-mini-profile is-profile-frame-/);
  assert.match(studio, /ps-community-picker-mini-profile is-effect/);
});

test("mobile cosmetic selectors retain their live preview and the banner hue control has a rendered rainbow track", () => {
  assert.match(css, /\.ps-community-picker-preview \{[\s\S]*?display: flex !important/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?grid-template-columns: minmax\(0,1fr\)/);
  assert.match(css, /\.ps-community-color-picker-hue::-webkit-slider-runnable-track/);
  assert.match(css, /\.ps-community-color-picker-hue::-moz-range-track/);
  assert.match(css, /linear-gradient\(90deg,#ff0000 0%,#ffff00/);
});


test("display name typography has its own separate saved field from the nameplate", () => {
  assert.match(studio, /type DisplayNameStyle = "classic" \| "tempo" \| "sakura"/);
  assert.match(studio, /openAppearancePicker\("nameStyle"\)/);
  assert.match(studio, /draftDisplayNameStyle/);
  assert.match(studio, /displayNameStyle/);
  assert.match(studio, /type DisplayNameEffect = "plain" \| "gradient" \| "neon"/);
  assert.match(studio, /type DisplayNameColor = "default" \| "pink" \| "green"/);
  assert.match(studio, /ps-community-name-font-grid/);
  assert.match(studio, /ps-community-name-effect-grid/);
  assert.match(studio, /ps-community-name-color-grid/);
  assert.doesNotMatch(studio, /ps-community-name-preview-tabs/);
  assert.match(studio, /className="ps-community-name-context-label">PERFIL/);
  assert.match(studio, /className="ps-community-name-context-label">MIEMBROS DE LA COMUNIDAD/);
  assert.match(studio, /className="ps-community-name-context-label">CHAT/);
  assert.doesNotMatch(studio, /namePreviewTab/);
  assert.match(studio, /ps-community-name-preview-profile-view/);
  assert.match(studio, /ps-community-name-preview-members-view/);
  assert.match(studio, /ps-community-name-preview-chat-view/);
  assert.match(route, /display_name_style: displayNameStyle/);
  assert.match(route, /display_name_effect: displayNameEffect/);
  assert.match(route, /display_name_color: displayNameColor/);
  assert.match(studio, /DISPLAY_NAME_GRADIENT_PRESETS/);
  assert.match(studio, /ps-community-name-preset-grid/);
  assert.match(studio, /Color inicial/);
  assert.match(studio, /Color final/);
  assert.match(studio, /ps-community-editor-preview-card is-plate-/);
  assert.match(studio, /ps-community-name-prism-editor/);
  assert.match(studio, /draftDisplayNamePrismColors/);
  assert.match(route, /display_name_prism_colors: displayNamePrismColors/);
  assert.match(page, /display_name_prism_colors/);
  assert.match(prismColorsMigration, /cardinality\(display_name_prism_colors\) = 5/);
  assert.match(route, /display_name_gradient_start: displayNameGradientStart/);
  assert.match(route, /display_name_gradient_end: displayNameGradientEnd/);
  assert.match(page, /display_name_gradient_start/);
  assert.match(page, /community-chat-author-link is-name-style-/);
  assert.match(page, /display_name_gradient_end/);
  assert.doesNotMatch(studio, /namePreviewLight|setNamePreviewLight/);
  assert.match(studio, /ps-community-name-gradient-editor/);
  assert.match(studio, /displayNameGradientStart/);
  assert.match(studio, /displayNameGradientEnd/);
  assert.match(studio, /ps-community-editor-preview-card is-plate-/);
  assert.doesNotMatch(studio, /namePreviewLight|setNamePreviewLight/);
  assert.match(route, /display_name_gradient_start: displayNameGradientStart/);
  assert.match(route, /display_name_gradient_end: displayNameGradientEnd/);
  assert.match(page, /display_name_gradient_start/);
  assert.match(route, /displayNameStyle: DISPLAY_NAME_STYLES\.has\(data\.display_name_style/);
  assert.match(page, /is-name-style-/);
  assert.match(nameStyleCss, /scrollbar-width:none !important/);
  assert.match(discordNameStyleMigration, /display_name_style in \('classic'/);
  assert.match(discordNameStyleMigration, /toon.*gummy/);
  assert.match(displayNameStyleMigration, /display_name_style/);
});


test("profile display name is immutable while typography remains customizable", () => {
  assert.match(studio, /const displayName = profile\.displayName \?\? initialProfile\.displayName/);
  assert.ok(!studio.includes("const [displayName, setDisplayName]"));
  assert.ok(!studio.includes("setDisplayName("));
  assert.ok(!studio.includes("displayName: displayName.trim()"));
  const patchRoute = route.slice(route.indexOf("export async function PATCH"));
  assert.doesNotMatch(patchRoute, /display_name\s*:/);
  assert.match(studio, /openAppearancePicker\("nameStyle"\)/);
  assert.match(route, /display_name: profileResult\.data\.display_name|displayName: profileResult\.data\.display_name/);
});

test("profile theme swatches preview and independently edit their colors", () => {
  assert.match(studio, /ps-community-editor-theme-stop-list/);
  assert.match(studio, /backgroundColor: cardColor/);
  assert.match(studio, /backgroundColor: themeColorSecondary/);
  assert.match(studio, /openThemeColorPicker\("top"\)/);
  assert.match(studio, /openThemeColorPicker\("bottom"\)/);
  assert.match(studio, /updateActiveThemeColor\(hsvToHex\(cardHue, saturation, value\)\)/);
});
test("reset stays silent and editor scrolling remains native without visible scrollbars", () => {
  assert.match(studio, /function discardChanges\(\)/);
  assert.doesNotMatch(studio, /Cambios locales descartados/);
  assert.match(studio, /setNotice\("".*\);/);
  assert.doesNotMatch(studio, /settingsCollapsed|ps-community-editor-sidebar-toggle/);
  assert.match(css, /scrollbar-width: none !important/);
  assert.match(css, /\.ps-community-editor-preview-column::-webkit-scrollbar/);
});

test("display-name style picker uses one live profile surface, synchronized member/chat names and expanded real fonts/effects", () => {
  assert.match(studio, /ps-community-status-profile-preview ps-community-name-style-profile-preview/);
  assert.match(studio, /--status-theme-secondary/);
  assert.match(studio, /profile\.bannerUrl/);
  assert.match(studio, /profile\.avatarUrl/);
  assert.doesNotMatch(studio.slice(studio.indexOf('ps-community-name-preview-stage'), studio.indexOf('{appearancePicker !== "nameStyle"')), /ps-community-status-preview-bubble-wrap|ps-community-note-bubble|ps-community-name-profile-about|ps-community-name-profile-joined|memberTag\(profile\.memberNumber\)/);
  assert.match(studio, /is-name-style-" \+ draftDisplayNameStyle \+ " effect-" \+ draftDisplayNameEffect \+ " color-" \+ draftDisplayNameColor/);
  assert.match(studio, /"editorial"/);
  assert.match(studio, /label: "Cromo"/);
  assert.match(route, /"editorial"/);
  assert.match(route, /"toon"/);
  assert.match(expandedNameCatalogueMigration, /community_member_profiles_display_name_style_check/);
  assert.match(expandedNameCatalogueMigration, /community_member_profiles_display_name_effect_check/);
  assert.match(nameStyleCss, /--font-name-sakura/);
  assert.match(nameStyleCss, /effect-gummy/);
  assert.match(nameStyleCss, /effect-toon/);
});

test("display-name effects match Discord video with seven animated finishes", () => {
  assert.match(studio, /label: "Gloss"/);
  assert.match(studio, /label: "Cromo"/);
  assert.match(studio, /"Prisma"/);
  assert.match(route, /"gummy"/);
  assert.match(route, /"toon"/);
  assert.match(route, /"prism"/);
  assert.match(nameStyleCss, /effect-gummy/);
  assert.match(nameStyleCss, /effect-toon/);
  assert.match(nameStyleCss, /effect-prism/);
  assert.match(studio, /Elige un efecto/);
});

test("effect samples inherit the custom gradient and prism colors selected in the editor", () => {
  assert.match(studio, /ps-community-name-effect-sample is-name-style-" \+ draftDisplayNameStyle \+ " effect-/);
  assert.match(studio, /"--name-gradient-start": draftDisplayNameGradientStart/);
  assert.match(studio, /"--name-prism-gradient": "linear-gradient\(90deg," \+ draftDisplayNamePrismColors/);
  assert.match(studio, /DISPLAY_NAME_GRADIENT_PRESETS/);
});

test("display-name studio offers a premium seven-finish catalogue and accessible motion", () => {
  for (const label of ["Tinta","Aurora","Neón","Cromo","Rebote","Gloss","Prisma"]) assert.ok(studio.includes('label: "' + label + '"'));
  for (const animation of ["ps-atelier-aurora","ps-atelier-neon-breathe","ps-atelier-chrome","ps-atelier-bounce","ps-atelier-gloss","ps-atelier-prism","ps-atelier-card-light"]) assert.ok(nameStyleCss.includes(animation));
  assert.match(nameStyleCss, /prefers-reduced-motion/);
  assert.match(route, /"plain", "gradient", "neon", "toon", "pop", "gummy", "prism"/);
  assert.match(discordVideoEffectsMigration, /'plain','gradient','neon','toon','pop','gummy','prism'/);
  assert.match(discordVideoEffectsRepeatMigration, /'plain','gradient','neon','toon','pop','gummy','prism'/);
});

test("Discord reference color controls offer two-stop gradients, multicolor palettes and custom color", () => {
  assert.match(studio, /DISPLAY_NAME_GRADIENT_PRESETS/);
  assert.match(studio, /DISPLAY_NAME_SPECTRUM_PRESETS/);
  assert.match(studio, /Elegir color personalizado/);
  assert.match(studio, /Pipette/);
  assert.match(studio, /setDraftDisplayNameGradientStart\(preset.start\)/);
  assert.match(studio, /setDraftDisplayNameGradientEnd\(preset.end\)/);
  assert.match(studio, /setDraftDisplayNamePrismColors\(preset.colors.slice\(\)\)/);
});

test("default display-name typeface is self-hosted and applied consistently", () => {
  assert.match(nameStyleCss, /font-family:var\(--font-name-classic\)/);
});

test("display-name entrance picker saves only the compact original catalogue and keeps adaptive typography", () => {
  for (const preset of ["decrypt","signal-break","fuzzy-text"]) {
    assert.ok(studio.includes('id: "' + preset + '"') || preset === "none");
  }
  assert.match(studio, /IntlWithSegmenter\.Segmenter/);
  assert.match(studio, /displayNameCharacterDelay\(index, characters\.length, animation\)/);
  assert.match(studio, /tag === "h2"/);
  assert.match(studio, /Animación de entrada/);
  assert.match(studio, /AL ABRIR EL PERFIL/);
  assert.match(studio, /displayNameAnimation !== safeDisplayNameAnimation\(savedSnapshot\.displayNameAnimation\)/);
  assert.match(studio, /animation=\{item\.id\}/);
  assert.match(studio, /animateOn=\{isGalleryDemo \? "mount" : "view"\}/);
  assert.match(studio, /loop=\{isGalleryDemo\}/);
  assert.match(page, /animateOn="view"/);
  assert.match(page, /revealDirection="random"/);
  assert.match(page, /communityNameCharacterDelay\(index, characters\.length, animation\)/);
  assert.match(page, /CommunityAnimatedName key=\{selectedCommunityProfile\.userId\} tag="h2"/);
  assert.match(page, /CommunityAnimatedName key=\{hoverCommunityProfile\.userId\} tag="h3"/);
  assert.match(route, /display_name_animation: displayNameAnimation/);
  assert.match(route, /displayNameAnimation: DISPLAY_NAME_ANIMATIONS/);
  assert.match(entranceMotionMigration, /display_name_animation in/);
  assert.match(studio, /if \(animation === "signal-break"\)/);
  assert.match(studio, /if \(animation === "fuzzy-text"\)/);
  assert.match(nameStyleCss, /\.ps-fuzzy-text-canvas/);
  assert.match(nameStyleCss, /prefers-reduced-motion:reduce/);
});



test("name entrance gallery renders as a uniform three-column card grid with separated labels and timings", () => {
  assert.match(nameStyleCss, /\.ps-community-name-style-group > \.ps-community-name-animation-grid\s*\{[\s\S]*?display:grid !important/);
  assert.match(nameStyleCss, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\) !important/);
  assert.match(nameStyleCss, /\.ps-community-name-animation-option > strong\s*\{[\s\S]*?display:flex !important/);
  assert.match(nameStyleCss, /\.ps-community-name-animation-option > small\s*\{[\s\S]*?border-radius:999px !important/);
  assert.match(nameStyleCss, /width:100% !important/);
  assert.match(nameStyleCss, /overflow-wrap:anywhere !important/);
  assert.match(nameStyleCss, /@media \(max-width:560px\)/);
});


test("motion gallery previews use the exact renderer for each selected animation", () => {
  const catalogue = studio.slice(studio.indexOf("const DISPLAY_NAME_ANIMATIONS:"), studio.indexOf("const DISPLAY_NAME_COLORS:"));
  assert.match(studio, /<AnimatedDisplayName[\\s\\S]*?animation=\\{item\\.id\\}[\\s\\S]*?ps-community-name-animation-sample/);
  assert.match(studio, /ps-name-motion-demo/);
  assert.match(studio, /tag="span"/);
  assert.match(catalogue, /id: "fuzzy-text", label: "Noise Reveal"/);
  for (const preset of ["decrypt", "signal-break", "fuzzy-text"]) {
    assert.ok(catalogue.includes('id: "' + preset + '"'));
  }
  assert.equal(['id: "decrypt", label:', 'id: "signal-break", label:', 'id: "fuzzy-text", label:'].filter((entry) => catalogue.includes(entry)).length, 3);
  assert.ok(studio.includes("<DecryptedDisplayName"));
  assert.ok(studio.includes("<SignalBreakDisplayName"));
  assert.ok(studio.includes("<FuzzyText"));
  assert.ok(decryptedName.includes('DEFAULT_GLYPHS = "0123456789ABCDEF"'));
  assert.ok(glitchName.includes("requestAnimationFrame(frame)"));
  assert.ok(fuzzyText.includes("getContext('2d'"));
});


test("display-name animation catalogue contains only Hacking Decode, Signal Break and Noise Reveal", () => {
  const expected = ["decrypt","signal-break","fuzzy-text"];
  const catalogue = studio.slice(studio.indexOf("const DISPLAY_NAME_ANIMATIONS:"), studio.indexOf("const DISPLAY_NAME_COLORS:"));
  for (const preset of expected) assert.ok(catalogue.includes('id: "' + preset + '"'));
  assert.equal(["id: \"decrypt\", label:", "id: \"signal-break\", label:", "id: \"fuzzy-text\", label:"].filter((entry) => catalogue.includes(entry)).length, 3);
  for (const removed of ["eclipse","mercury","supernova","prismforge","royalfoil","velvetbloom","stardust","afterglow","obsidian","inferno"]) {
    assert.ok(!catalogue.includes('id: "' + removed + '"'));
    assert.ok(!route.includes('"' + removed + '"'));
  }
  assert.match(nameStyleCss, /prefers-reduced-motion:reduce/);
  assert.match(route, /"decrypt","signal-break","fuzzy-text"/);
  assert.match(studio, /animation=\{item\.id\}/);
});

test("final animation migration replaces GlyphStorm with Noise Reveal and normalizes stored values", () => {
  assert.match(threeAnimationCatalogueMigration, /'decrypt', 'signal-break', 'glyph-storm'/);
  assert.match(fuzzyAnimationMigration, /when display_name_animation = 'signal-break'/);
  assert.match(fuzzyAnimationMigration, /when display_name_animation = 'fuzzy-text'/);
  assert.match(fuzzyAnimationMigration, /set default 'decrypt'/);
  assert.match(fuzzyAnimationMigration, /display_name_animation in/);
  const allowedConstraint = fuzzyAnimationMigration.split("check (display_name_animation in (")[1] ?? "";
  assert.ok(allowedConstraint.length > 0);
  assert.match(allowedConstraint, /'decrypt', 'signal-break', 'fuzzy-text'/);
  assert.doesNotMatch(allowedConstraint, /'glyph-storm'|'none'|'typewriter'|'cascade'|'cinematic'|'orbit'|'magnetic'|'spotlight'|'wave'|'bounce'|'fold'/);
});


test("Hacking Decode replaces Signal with a real sequential hexadecimal decrypt component", () => {
  assert.match(studio, /id: "decrypt", label: "Hacking Decode"/);
  assert.match(studio, /<DecryptedDisplayName/);
  assert.match(page, /<DecryptedDisplayName/);
  assert.match(route, /"decrypt"/);
  assert.match(decryptedName, /speed = 40/);
  assert.match(decryptedName, /durationMs = 2200/);
  assert.match(decryptedName, /elapsed \/ safeDuration/);
  assert.match(decryptedName, /scheduledCount = Math\.floor\(progress \* order\.length\)/);
  assert.match(studio, /durationMs=\{2400\}/);
  assert.match(page, /durationMs=\{2400\}/);
  assert.match(decryptedName, /sequential = true/);
  assert.match(decryptedName, /revealDirection = "random"/);
  assert.match(decryptedName, /scrambleColor = "#2bb673"/);
  assert.match(decryptedName, /animateOn === "mount"/);
  assert.match(decryptedName, /hasPlayedRef\.current = false/);
  assert.match(studio, /loop=\{isGalleryDemo\}/);
  assert.match(studio, /scrambleColor="#2bb673"/);
  assert.match(decryptedName, /prefers-reduced-motion/);
  assert.match(nameStyleCss, /\.ps-decrypted-glyph/);
  assert.match(decryptedAnimationMigration, /where display_name_animation = 'glitch'/);
  assert.match(decryptedAnimationMigration, /set display_name_animation = 'decrypt'/);
});


test("Signal Break is a branded animated profile renderer with slices, RGB, scan and noise modes", () => {
  const catalogue = studio.slice(studio.indexOf("const DISPLAY_NAME_ANIMATIONS:"), studio.indexOf("const DISPLAY_NAME_COLORS:"));
  assert.match(catalogue, /id: "signal-break", label: "Signal Break"/);
  assert.equal(["id: \"decrypt\", label:", "id: \"signal-break\", label:", "id: \"fuzzy-text\", label:"].filter((entry) => catalogue.includes(entry)).length, 3);
  assert.match(studio, /<SignalBreakDisplayName/);
  assert.match(page, /<SignalBreakDisplayName/);
  assert.match(route, /"decrypt","signal-break"/);
  assert.ok(glitchName.includes('safeMode === "rgb"'));
  assert.match(glitchName, /requestAnimationFrame\(frame\)/);
  assert.match(glitchName, /prefers-reduced-motion/);
  assert.match(studio, /mode="slices"/);
  assert.match(studio, /speed=\{1\}/);
  assert.match(studio, /offset=\{10\}/);
  assert.match(studio, /shadowColors=\{\["#ff0000", "#00ffff"\]\}/);
  assert.match(studio, /trigger="always"/);
  assert.match(studio, /burstDuration=\{0\.6\}/);
  assert.ok(glitchName.includes('safeMode === "rgb"'));
  assert.ok(glitchName.includes('safeMode === "scan"'));
  assert.ok(glitchName.includes('safeMode === "noise"'));
  assert.match(nameStyleCss, /\.ps-glitch-slice--a/);
  assert.match(nameStyleCss, /\.ps-glitch-name--rgb/);
  assert.match(nameStyleCss, /\.ps-glitch-name--noise/);
  assert.match(glitchAnimationMigration, /where display_name_animation = 'wipe'/);
  assert.match(glitchAnimationMigration, /set display_name_animation = 'glitch'/);
});


test("Noise Reveal uses the React Bits canvas renderer with its curated motion preset", () => {
  const catalogue = studio.slice(studio.indexOf("const DISPLAY_NAME_ANIMATIONS:"), studio.indexOf("const DISPLAY_NAME_COLORS:"));
  assert.match(catalogue, /id: "fuzzy-text", label: "Noise Reveal"/);
  assert.equal(["id: \"decrypt\", label:", "id: \"signal-break\", label:", "id: \"fuzzy-text\", label:"].filter((entry) => catalogue.includes(entry)).length, 3);
  assert.match(studio, /<FuzzyText/);
  assert.match(page, /<FuzzyText/);
  assert.match(route, /"decrypt","signal-break","fuzzy-text"/);
  const expectedProps = [
    'colorSplit={fuzzySettings.colorSplit}', 'trigger={fuzzySettings.trigger}', 'direction={fuzzySettings.direction}',
    'baseIntensity={fuzzySettings.baseIntensity}', 'hoverIntensity={fuzzySettings.hoverIntensity}', 'fuzzRange={fuzzySettings.fuzzRange}',
    'sliceSize={fuzzySettings.sliceSize}', 'fps={fuzzySettings.fps}', 'transitionDuration={fuzzySettings.transitionDuration}', 'intro={fuzzySettings.intro}',
    'introDuration={fuzzySettings.introDuration}', 'letterSpacing={fuzzySettings.letterSpacing}', 'enableHover={fuzzySettings.enableHover}',
    'clickEffect={fuzzySettings.clickEffect}', 'glitchMode={fuzzySettings.glitchMode}', 'glitchInterval={fuzzySettings.glitchInterval}',
    'glitchDuration={fuzzySettings.glitchDuration}'
  ];
  for (const prop of expectedProps) {
    assert.ok(studio.includes(prop), 'Missing FuzzyText setting in editor: ' + prop);
    assert.ok(page.includes(prop), 'Missing FuzzyText setting in community renderer: ' + prop);
  }
  assert.match(fuzzyText, /getContext\('2d'/);
  assert.match(fuzzyText, /requestAnimationFrame\(tick\)/);
  assert.match(fuzzyText, /prefers-reduced-motion/);
  assert.match(fuzzyText, /IntersectionObserver/);
  assert.match(fuzzyAnimationMigration, /'decrypt', 'signal-break', 'fuzzy-text'/);
  assert.match(fuzzyAnimationMigration, /drop constraint if exists community_member_profiles_display_name_animation_check/);
  assert.doesNotMatch(studio + page + route + nameStyleCss, /glyph-storm|GlyphStorm/);
});


test("Noise Reveal is continuous, preset-driven and has no user-facing technical controls", () => {
  assert.doesNotMatch(studio, /Color Split|Base Intensity|Hover Intensity|Fuzz Range|Slice Size|FPS|Transition Duration|Intro Duration|Glitch Interval|Glitch Duration|Fuzzy Text/);
  assert.match(nameStyleCss, /\\.ps-community-picker-modal\\.is-name-style-modal \\.ps-community-fuzzy-customizer \\{ display:none !important; \\}/);
  assert.doesNotMatch(studio, /data-preview-animation=\\{item\\.id\\}/);
  assert.doesNotMatch(nameStyleCss, /ps-name-decode-preview|ps-name-signal-preview|ps-name-fuzzy-preview/);
  assert.match(studio, /resolveFuzzyTextAppearance/);
  assert.match(page, /resolveFuzzyTextAppearance/);
  assert.match(fuzzyText, /const wake = \\(\\) =>/);
  assert.match(fuzzyText, /interactionActive/);
  assert.match(fuzzySettings, /trigger: "always"/);
  assert.match(fuzzySettings, /enableHover: false/);
  assert.match(fuzzySettings, /intro: true/);
  assert.match(fuzzySettings, /resolveFuzzyTextAppearance/);
  assert.match(studio, /draftDisplayNameFuzzySettings/);
  assert.match(studio, /displayNameFuzzySettings,/);
  assert.match(page, /fuzzySettings=\\{normalizeFuzzyTextSettings\\(selectedCommunityProfile\\.displayNameFuzzySettings\\)\\}/);
  assert.match(page, /community-member-name-render/);
  assert.match(page, /community-chat-name-render/);
  assert.match(route, /display_name_fuzzy_settings: displayNameFuzzySettings/);
  assert.match(route, /normalizeFuzzyTextSettings\\(payload\\.displayNameFuzzySettings\\)/);
  assert.match(fuzzySettingsMigration, /add column if not exists display_name_fuzzy_settings jsonb/);
  assert.match(fuzzySettingsMigration, /baseIntensity/);
  assert.match(nameStyleCss, /prefers-reduced-motion:reduce/);
});
