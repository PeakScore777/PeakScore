import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, styles] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

testCase("community renders a Discord-like server rail, channel list and chat surface", () => {
  assert.match(page, /community-server-rail/);
  assert.match(page, /community-sidebar/);
  assert.match(page, /community-chat-column/);
  assert.match(page, /community-chat-header/);
  assert.match(page, /community-chat-scroll/);
  assert.match(page, /community-chat-composer/);
  assert.match(styles, /Discord-inspired live chat layout/);
  assert.match(styles, /\.community-server-rail\s*\{[\s\S]*?width:\s*72px/);
  assert.match(styles, /\.community-chat-composer\s*\{[\s\S]*?background:\s*#383a40/);
});

testCase("community uses chronological message rows instead of forum post cards", () => {
  assert.match(page, /rows\.slice\(\)\.reverse\(\)\.map/);
  assert.match(page, /community-chat-message group/);
  assert.match(page, /community-date-divider/);
  assert.doesNotMatch(page, /community-post-card|community-right-rail|community-feed-heading/);
});

testCase("chat composer sends on Enter and preserves Shift+Enter line breaks", () => {
  assert.match(page, /event\.key === "Enter" && !event\.shiftKey/);
  assert.match(page, /event\.nativeEvent\.isComposing/);
  assert.match(page, /if \(draft\.trim\(\) && !sending\) void sendMessage\(\)/);
  assert.match(page, /Shift \+ Enter para nueva línea/);
});

testCase("channel navigation and message actions remain connected", () => {
  assert.match(page, /onClick=\{\(\) => void selectChannel\(channel\)\}/);
  assert.match(page, /onClick=\{\(\) => void toggleReaction\(message\)\}/);
  assert.match(page, /onClick=\{\(\) => void openComments\(message\.id\)\}/);
  assert.match(page, /onClick=\{\(\) => void shareMessage\(message\)\}/);
  assert.match(page, /onSubmit=\{\(event\) => void sendMessage\(event\)\}/);
});

testCase("missing optional community schemas do not hide loaded messages", () => {
  assert.match(pageSource, /Optional profile\/badge\/metrics data is unavailable/);
  assert.match(pageSource, /badgeError \? \[\] : publicRoleBadges/);
  assert.match(pageSource, /metricsError \? \[\] : metrics/);
  assert.doesNotMatch(
    pageSource,
    /if \(authorsError \|\| badgeError \|\| metricsError\)[\s\S]{0,120}return/,
  );
});

testCase("PeakScore community combines Discord chat structure with GameCode styling", () => {
  assert.match(styles, /--community-discord-bg:\s*#0b1020/);
  assert.match(styles, /community-chat-messages[\s\S]*?linear-gradient\(rgb\(75 111 153 \/ 2\.4%\)/);
  assert.match(styles, /community-server-mark[\s\S]*?var\(--font-silkscreen\)/);
  assert.match(pageSource, /groupedWithPrevious/);
  assert.match(pageSource, /community-chat-message-grouped/);
});

testCase("floating OmegaX launcher does not cover the community chat composer", async () => {
  const launcher = await readFile(
    new URL("../components/layout/GlobalOrbyClassroomLauncher.tsx", import.meta.url),
    "utf8",
  );
  assert.match(launcher, /"\/comunidad"/);
  assert.match(launcher, /global OmegaX pill on the bottom-right corner/);
});
