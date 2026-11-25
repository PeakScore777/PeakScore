import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, styles] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/community-member-profile-ui.css", import.meta.url), "utf8"),
]);

testCase("clicking a member opens a contextual card instead of auto-opening on hover", () => {
  assert.match(page, /onClick=\{\(event\) => \{/);
  assert.match(page, /openMemberHoverPreview\(member, \{/);
  assert.doesNotMatch(page, /onMouseEnter=\{\(event\) => openMemberHoverPreview\(member, event\)\}/);
  assert.match(page, /ps-community-member-popout/);
  assert.match(page, /memberPopoutRef/);
  assert.match(page, /handleOutsidePointer/);
  assert.match(page, /event\.key === "Escape"/);
});

testCase("the compact profile menu opens the full member profile and offers useful actions", () => {
  assert.match(page, /ps-community-member-popout__menu/);
  assert.match(page, /Ver perfil completo/);
  assert.match(page, /openCommunityProfile\(hoverCommunityProfile\.userId\)/);
  assert.match(page, /Mencionar/);
  assert.match(page, /Copiar nombre/);
  assert.match(page, /ps-community-member-popout__banner-image/);
  assert.match(page, /ps-community-member-popout__roles/);
  assert.match(page, /ps-community-member-popout__about/);
});

testCase("the full profile view uses the member banner, identity, roles, bio and membership facts", () => {
  assert.match(page, /ps-community-profile-overlay/);
  assert.match(page, /ps-community-profile-dialog/);
  assert.match(page, /ps-community-profile-banner-image/);
  assert.match(page, /ps-community-profile-avatar/);
  assert.match(page, /ps-community-profile-roles/);
  assert.match(page, /ps-community-profile-about/);
  assert.match(page, /ps-community-profile-facts/);
  assert.match(page, /MIEMBRO DESDE/);
});

testCase("profile UI is responsive, accessible and no generic online heading is rendered above roles", () => {
  assert.match(page, /aria-haspopup="menu"/);
  assert.match(page, /aria-expanded=\{memberProfileMenuOpen\}/);
  assert.doesNotMatch(page, /community-member-online-heading/);
  assert.match(styles, /\.ps-community-member-popout \{/);
  assert.match(styles, /\.ps-community-member-popout__menu \{/);
  assert.match(styles, /\.ps-community-profile-overlay \{/);
  assert.match(styles, /\.ps-community-profile-dialog \{/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
