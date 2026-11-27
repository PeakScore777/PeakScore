import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, styles] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/community-member-profile-ui.css", import.meta.url), "utf8"),
]);

testCase("clicking a member or chat author opens the read-only profile dialog without a hover popout", () => {
  assert.match(page, /async function openCommunityProfile\(memberId: string\)/);
  assert.match(page, /void openCommunityProfile\(member\.id\)/);
  assert.match(page, /onClick=\{\(\) => message\.author && void openCommunityProfile\(message\.author\.id\)\}/);
  assert.match(page, /onClick=\{\(\) => void openCommunityProfile\(message\.author!\.id\)\}/);
  assert.match(page, /ps-community-profile-overlay/);
  assert.match(page, /ps-community-profile-dialog/);
  assert.doesNotMatch(page, /openMemberHoverPreview|hoverCommunityProfile|ps-community-member-popout/);
});

testCase("the full profile is read-only and only its owner can open the profile editor", () => {
  assert.match(page, /ps-community-profile-dialog/);
  assert.match(page, /ps-community-profile-live-readonly-body/);
  assert.match(page, /ps-community-profile-bio-readonly/);
  assert.match(
    page,
    /selectedCommunityProfile\.isOwnProfile\s*&&\s*\(\s*<button[^>]*className="ps-community-profile-editor-button"/,
  );
  assert.match(page, /Abrir editor de perfil/);
  assert.match(page, /setCommunityProfileStudioOpen\(true\)/);
  assert.match(page, /CommunityProfileStudio/);
});

testCase("the full profile shows banner, identity, roles, biography and membership details", () => {
  assert.match(page, /ps-community-editor-preview-banner/);
  assert.match(page, /selectedCommunityProfile\.bannerUrl \?/);
  assert.match(page, /ps-community-editor-preview-avatar/);
  assert.match(page, /ps-community-editor-presence-dot/);
  assert.match(page, /ps-community-editor-preview-name-static/);
  assert.match(page, /ps-community-profile-role-list/);
  assert.match(page, /ps-community-editor-preview-about/);
  assert.match(page, /ps-community-profile-bio-readonly/);
  assert.match(page, /ps-community-editor-preview-meta/);
  assert.match(page, /MIEMBRO DESDE/);
});

testCase("the profile dialog is responsive, accessible and respects reduced motion", () => {
  assert.match(page, /role="dialog"\s+aria-modal="true"/);
  assert.match(page, /aria-labelledby="ps-community-profile-title"/);
  assert.match(page, /aria-label="Cerrar perfil"/);
  assert.match(styles, /\.ps-community-profile-overlay\s*\{/);
  assert.match(styles, /\.ps-community-profile-dialog\s*\{/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
