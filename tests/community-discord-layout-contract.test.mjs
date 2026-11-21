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
  assert.match(page, /insertPayload\.reply_to_message_id = replyingTo\.id/);
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
  assert.match(skin, /community-profile-cover::after/);
  assert.match(skin, /community-chat-message-grouped/);
  assert.match(skin, /community-member-sidebar/);
  assert.match(skin, /--ps-discord-base:\s*#313338/);
});


testCase("community member profile is a Discord-style single card, separate from platform identity", () => {
  assert.match(page, /openCommunityProfile\(memberId: string\)/);
  assert.match(page, /onClick=\{\(\) => void openCommunityProfile\(member\.id\)\}/);
  assert.match(page, /onClick=\{\(\) => message\.author && void openCommunityProfile\(message\.author\.id\)\}/);
  assert.match(page, /community-profile-dialog-discord/);
  assert.match(page, /community-profile-card-cover/);
  assert.match(page, /community-profile-card-identity/);
  assert.match(page, /community-profile-card-section/);
  assert.match(page, /MIEMBRO DESDE/);
  assert.match(page, /Cambiar foto/);
  assert.match(page, /Editar perfil/);
  assert.doesNotMatch(page, /Cambiar banner|Tablero|Lista de deseos|Desconectado|community-profile-tabs/);
  assert.match(styles, /Community member popout — GameCode pixel typography/);
  assert.match(styles, /width: min\(760px, calc\(100vw - 48px\)\)/);
  assert.match(styles, /font: 15px\/1\.75 var\(--font-geist-sans\)/);
  assert.match(styles, /community-profile-cover-wordmark/);
  assert.match(styles, /community-profile-default-monogram/);
  assert.match(styles, /background: #1d1f24 !important/);
  assert.doesNotMatch(page, /PEAKSCORE COMMUNITY|PERFIL DE MIEMBRO|Cargando perfil comunitario/);
});


testCase("member profiles open instantly from cached community data and enrich in the background", () => {
  assert.match(page, /communityProfileCacheRef/);
  assert.match(page, /const instantProfile: CommunityMemberProfile/);
  assert.match(page, /setSelectedCommunityProfile\(instantProfile\)/);
  assert.match(page, /setCommunityProfileLoading\(false\)/);
  assert.match(page, /setSelectedCommunityProfile\(\(current\) => current\?\.userId === memberId/);
  assert.doesNotMatch(page, /Cargando perfil comunitario\.\.\./);
  assert.match(page, /communityAvatarUploading/);
});

testCase("new community accounts receive a branded visual avatar and a non-empty designed cover", () => {
  assert.match(page, /community-profile-default-monogram/);
  assert.match(page, /PEAK<span>SCORE<\/span>/);
  assert.match(styles, /community-profile-card-cover::before/);
  assert.match(styles, /community-profile-cover-orbit-one/);
  assert.match(styles, /community-profile-default-monogram::after/);
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

testCase("community profile popout contains no decorative emoji controls or platform-profile navigation", () => {
  const profileMarkup = page.slice(page.indexOf("community-profile-dialog-discord"));
  assert.doesNotMatch(profileMarkup, /[🌟✨⭐]/u);
  assert.doesNotMatch(profileMarkup, /\/perfil\/estilo/);
  assert.doesNotMatch(profileMarkup, /Cambiar banner|PeakStyle|Desconectado|Tablero|Actividad|Lista de deseos/);
  assert.match(profileMarkup, /community-profile-card-button/);
  assert.match(profileMarkup, /community-profile-card-section/);
});
