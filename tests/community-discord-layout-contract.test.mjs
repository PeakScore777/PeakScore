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


testCase("member profile modal mirrors Discord profile structure with PeakScore-owned identity", () => {
  assert.match(page, /community-profile-dialog-discord/);
  assert.match(page, /community-profile-workspace/);
  assert.match(page, /community-profile-customize-sidebar/);
  assert.match(page, /community-profile-cover-discord/);
  assert.match(page, /community-profile-tabs/);
  assert.match(page, /Tablero/);
  assert.match(page, /Actividad/);
  assert.match(page, /Lista de deseos/);
  assert.match(page, /Cambiar avatar/);
  assert.match(page, /Cambiar banner/);
  assert.match(page, /Abrir PeakStyle/);
  assert.match(styles, /community-profile-dialog-discord/);
  assert.match(styles, /community-profile-workspace/);
  assert.match(styles, /community-profile-cover-default/);
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

testCase("profile editor uses full desktop width and Discord's three-pane layout", () => {
  assert.match(page, /community-profile-workspace .*is-own-profile/);
  assert.match(page, /community-profile-details/);
  const profileMarkup = page.slice(page.indexOf("community-profile-dialog-discord"));
  assert.doesNotMatch(profileMarkup, /[🌟✨⭐]/u);
  assert.match(styles, /width: min\(1120px, calc\(100vw - 64px\)\)/);
  assert.match(styles, /grid-template-columns: 224px minmax\(320px, 370px\) minmax\(340px, 1fr\)/);
  assert.match(styles, /community-profile-workspace\.is-public-profile/);
  assert.match(styles, /community-profile-content \.community-profile-about/);
});
