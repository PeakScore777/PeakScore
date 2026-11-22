import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, styles, launcher, stylePage] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../components/layout/GlobalOrbyClassroomLauncher.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/perfil/estilo/page.tsx", import.meta.url), "utf8"),
]);

testCase("community keeps the Discord server rail, channel list and shared chat composer", () => {
  assert.match(page, /community-server-rail/);
  assert.match(page, /community-sidebar/);
  assert.match(page, /community-chat-column/);
  assert.match(page, /community-chat-header/);
  assert.match(page, /community-chat-scroll/);
  assert.match(page, /community-chat-composer/);
  assert.match(styles, /Discord-inspired live chat layout/);
  assert.match(styles, /PeakScore GameCode × Discord channel-chat interactions/);
  assert.match(styles, /--community-discord-bg:\s*#0b1020/);
  assert.match(styles, /community-server-mark[\s\S]*?var\(--font-silkscreen\)/);
  assert.match(styles, /PEAKSCORE COMMUNITY \/ GAMECODE SKIN/);
  assert.match(styles, /--ps-cyan:\s*#01c8ef/);
  assert.match(styles, /--ps-lime:\s*#7fe05c/);
  assert.match(styles, /--ps-gold:\s*#f6d64a/);
  assert.match(styles, /community-member-sidebar/);
  assert.match(styles, /community-chat-composer:focus-within/);
});

testCase("messages form one chronological stream, not forum cards or nested comments", () => {
  assert.match(page, /rows\.slice\(\)\.reverse\(\)\.map/);
  assert.match(page, /visibleMessages\.map\(\(message, index\)/);
  assert.match(page, /community-chat-message group/);
  assert.match(page, /community-date-divider/);
  assert.match(page, /groupedWithPrevious/);
  assert.doesNotMatch(page, /community-post-card|community-right-rail|community-feed-heading/);
  assert.doesNotMatch(page, /community-chat-thread|community-chat-replies|commentsFor/);
});

testCase("reply action sends a quoted first-class message instead of nesting a comment", () => {
  assert.match(page, /function beginReply\(message: Message\)/);
  assert.match(page, /if \(submittedReply\) insertPayload\.reply_to_message_id = submittedReply\.id/);
  assert.match(page, /community-chat-composer-replying/);
  assert.match(page, /community-chat-reply-reference/);
  assert.match(page, /onClick=\{\(\) => beginReply\(message\)\}/);
});

testCase("composer supports Enter, Shift+Enter, image picker and drag-and-drop", () => {
  assert.match(page, /event\.key === "Enter" && !event\.shiftKey/);
  assert.match(page, /event\.nativeEvent\.isComposing/);
  assert.match(page, /Shift \+ Enter para nueva línea/);
  assert.match(page, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(page, /onDrop=\{\(event\) =>/);
  assert.match(page, /fetch\("\/api\/community\/attachments"/);
});

testCase("message reactions use emoji chips and a multi-choice picker", () => {
  assert.match(page, /const CHAT_REACTIONS = \[/);
  assert.match(page, /community-chat-reaction-chip/);
  assert.match(page, /community-chat-reaction-picker/);
  assert.match(page, /toggleReaction\(message, emoji\)/);
});

testCase("OmegaX floating launcher is hidden only inside community routes", () => {
  assert.match(launcher, /"\/comunidad"/);
  assert.match(launcher, /global OmegaX pill on the bottom-right corner/);
});


testCase("community visual system uses Discord charcoal surfaces with GameCode type and responsive member/profile rails", () => {
  const skin = styles.slice(styles.lastIndexOf("PEAKSCORE COMMUNITY — DISCORD x GAMECODE VISUAL SYSTEM"));
  assert.ok(skin.length > 0);
  for (const token of ["#313338", "#2b2d31", "#1e1f22", "#383a40", "#20d8f2", "#23a55a"]) {
    assert.ok(skin.toLowerCase().includes(token.toLowerCase()), "Missing Discord/GameCode token: " + token);
  }
  assert.match(skin, /font-family: var\(--font-silkscreen\)/);
  assert.match(skin, /@media \(max-width: 760px\)/);
  assert.match(skin, /ps-community-profile-banner__fallback::before/);
  assert.match(skin, /community-chat-message-grouped/);
  assert.match(skin, /community-member-sidebar/);
  assert.match(skin, /--ps-discord-base:\s*#313338/);
});


testCase("community member profile uses a Discord-style popout and complete data-backed profile card", () => {
  assert.match(page, /openCommunityProfile\(memberId: string\)/);
  assert.match(page, /onClick=\{\(\) => void openCommunityProfile\(member\.id\)\}/);
  assert.match(page, /onClick=\{\(\) => message\.author && void openCommunityProfile\(message\.author\.id\)\}/);
  assert.match(page, /ps-community-member-popout/);
  assert.match(page, /ps-community-profile-dialog/);
  assert.match(page, /className="ps-community-profile-banner"/);
  assert.match(page, /className="ps-community-profile-banner" style=\{\{ backgroundColor: "#20242D" \}\}/);
  assert.doesNotMatch(page, /selectedCommunityProfile\.bannerUrl \?/);
  assert.match(page, /ps-community-profile-name-row/);
  assert.match(page, /ps-community-profile-about/);
  assert.match(page, /ps-community-profile-facts/);
  assert.match(page, /MIEMBRO DESDE/);
  assert.match(page, /Editar perfil/);
  assert.match(page, /Copiar identificador/);
  assert.match(page, /onlineMemberIds\.includes\(selectedCommunityProfile\.userId\)/);
  assert.match(page, /CommunityProfileStudio/);
  assert.doesNotMatch(page, /community-profile-tabs|Actividad|Mutuales|Lista de deseos/);
  assert.match(styles, /ps-community-member-popout__card/);
  assert.match(styles, /width: min\(820px, calc\(100vw - 40px\)\)/);
  assert.match(styles, /font: 12px\/1\.7 var\(--font-geist-sans\)/);
  assert.match(styles, /ps-community-profile-banner__fallback::before/);
  assert.match(styles, /ps-community-profile-avatar/);
});


testCase("member profiles open instantly from cached community data and enrich in the background", () => {
  assert.match(page, /communityProfileCacheRef/);
  assert.match(page, /const instantProfile: CommunityMemberProfile/);
  assert.match(page, /setSelectedCommunityProfile\(instantProfile\)/);
  assert.match(page, /setCommunityProfileLoading\(false\)/);
  assert.match(page, /setSelectedCommunityProfile\(\(current\) => current\?\.userId === memberId/);
  assert.doesNotMatch(page, /Cargando perfil comunitario\.\.\./);
  assert.match(page, /CommunityProfileStudio/);
});

testCase("new community profiles have a designed cover and safe avatar fallback", () => {
  assert.match(page, /ps-community-profile-banner__fallback/);
  assert.match(page, /initials\(selectedCommunityProfile\.displayName\)/);
  assert.match(styles, /ps-community-profile-banner__fallback/);
  assert.match(styles, /ps-community-profile-banner__fallback::before/);
});

testCase("PeakStyle categories open a collection and live-preview modal with PeakCoins actions", () => {
  assert.match(stylePage, /cosmeticModalOpen/);
  assert.match(stylePage, /peakstyle-picker-overlay/);
  assert.match(stylePage, /Tu equipamiento/);
  assert.match(stylePage, /Échale un vistazo a la tienda/);
  assert.match(stylePage, /selectedCosmeticPreviewId/);
  assert.match(stylePage, /peakstyle-picker-preview-card/);
  assert.doesNotMatch(stylePage, /[∅⌑]/u);
  assert.match(stylePage, /PeakCoins/);
  assert.match(styles, /peakstyle-picker-modal/);
  assert.match(styles, /peakstyle-picker-preview-stage/);
  assert.match(styles, /peakstyle-picker-preview-card/);
});

testCase("community profile popout uses real controls and contains no platform-profile shortcuts", () => {
  const profileMarkup = page.slice(page.indexOf("ps-community-member-popout"));
  assert.doesNotMatch(profileMarkup, /[🌟✨⭐]/u);
  assert.doesNotMatch(profileMarkup, /\/perfil\/estilo/);
  assert.doesNotMatch(profileMarkup, /PeakStyle|Tablero|Actividad|Lista de deseos/);
  assert.match(profileMarkup, /ps-community-member-popout__actions/);
  assert.match(profileMarkup, /ps-community-profile-actions/);
  assert.match(profileMarkup, /Mencionar/);
  assert.match(profileMarkup, /Copiar identificador/);
  assert.doesNotMatch(profileMarkup, /community-profile-tabs/);
});
