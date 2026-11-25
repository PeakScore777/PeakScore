import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, theme, spacesStudio, verificationMigration, readMigration] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/peakscore-community-theme.module.css", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunitySpacesStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261125120000_community_space_verification.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261125121000_community_channel_reads.sql", import.meta.url), "utf8"),
]);

testCase("unread channel markers restore per-user reads and count messages from other members", () => {
  assert.match(page, /community_channel_reads/);
  assert.match(page, /markChannelRead/);
  assert.match(page, /requestCommunityVerification|requestCommunityVerification/);
  assert.match(page, /payload\.new/);
  assert.match(page, /row\.author_id === userId/);
  assert.match(page, /visibilitychange/);
  assert.match(page, /community-unread-count/);
  assert.match(page, /Math\.min\(99/);
  assert.match(readMigration, /create table if not exists public\.community_channel_reads/);
  assert.match(readMigration, /enable row level security/i);
  assert.match(readMigration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(readMigration, /community_channels channel/);
});

testCase("community appearance supports black, gray, white, custom color and a Chroma toggle", () => {
  assert.match(page, /appearanceMode === "black"/);
  assert.match(page, /appearanceMode === "gray"/);
  assert.match(page, /appearanceMode === "white"/);
  assert.match(page, /appearanceMode === "custom"/);
  assert.match(page, /community:appearance:/);
  assert.match(page, /community-appearance-swatch/);
  assert.match(page, /Fondo Chroma/);
  assert.match(page, /communityCanvasStyle/);
  assert.match(theme, /community-appearance-popover/);
  assert.match(theme, /community-appearance-custom/);
  assert.match(theme, /community-chroma-opacity/);
});

testCase("audio preferences use real browser devices and expose the microphone only to staff roles", () => {
  assert.match(page, /community-user-audio-controls/);
  assert.match(page, /Headphones/);
  assert.match(page, /canUseMicrophone/);
  assert.match(page, /getUserMedia/);
  assert.match(page, /enumerateDevices/);
  assert.match(page, /setSinkId/);
  assert.match(page, /track\.stop\(\)/);
  assert.match(page, /community-audio-popover/);
});

testCase("verification requests are member-scoped and founder review is audited server-side", () => {
  assert.match(page, /request_community_space_verification/);
  assert.match(page, /community-verification-request/);
  assert.match(page, /verification_status === "verified"/);
  assert.match(spacesStudio, /review_community_space_verification/);
  assert.match(spacesStudio, /Aprobar verificación/);
  assert.match(spacesStudio, /Rechazar solicitud/);
  assert.match(spacesStudio, /Retirar verificación/);
  assert.match(verificationMigration, /private\.is_community_founder\(\)/);
  assert.match(verificationMigration, /request_community_space_verification/);
  assert.match(verificationMigration, /review_community_space_verification/);
  assert.match(verificationMigration, /community_security_audit/);
  assert.match(verificationMigration, /verification_status in \('unverified','pending','verified','rejected'\)/);
});

testCase("the old community experience remains readable when new verification columns are not deployed", () => {
  assert.match(page, /PGRST204/);
  assert.match(page, /legacySpaces/);
  assert.match(spacesStudio, /legacySpaces/);
  assert.match(spacesStudio, /verification_status: "unverified"/);
});
