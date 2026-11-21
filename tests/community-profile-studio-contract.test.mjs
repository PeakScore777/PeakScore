import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [community, studio, css, cosmeticsApi, profileApi] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/member-cosmetics/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
]);

testCase("community member rail opens a hover identity popout and click opens full profile", () => {
  assert.match(community, /onMouseEnter=\{\(event\) => openMemberHoverPreview\(member, event\)\}/);
  assert.match(community, /onMouseLeave=\{scheduleCloseMemberHoverPreview\}/);
  assert.match(community, /community-member-hover-layer/);
  assert.match(community, /Ver perfil completo/);
  assert.match(community, /openCommunityProfile\(member\.id\)/);
  assert.match(css, /\.community-member-hover-card/);
  assert.match(css, /\.community-member-hover-actions/);
});

testCase("member nameplates render in the right rail from one bounded public lookup", () => {
  assert.match(community, /community-member-nameplate-art/);
  assert.match(community, /\/api\/community\/member-cosmetics/);
  assert.match(cosmeticsApi, /slice\(0, 100\)/);
  assert.match(cosmeticsApi, /slot: item\.category/);
  assert.match(cosmeticsApi, /item\.slot === "nameplate"/);
  assert.match(css, /\.community-member-nameplate/);
});

testCase("profile identity studio provides a Discord-like sidebar, live preview and independent cosmetic picker", () => {
  for (const text of ["Placa de identificación","Avatar y decoración","Cartel de perfil","ESTILO DE NOMBRE DE VISUALIZACIÓN","Efectos de perfil","Color de cartel","VISTA PREVIA EN VIVO","Cambiar","Ninguno","Ir a la tienda"]) {
    assert.ok(studio.includes(text), "Missing profile studio feature: " + text);
  }
  assert.match(community, /CommunityProfileStudio/);
  assert.match(community, /setCommunityProfileStudioOpen\(true\)/);
  assert.match(studio, /ps-studio-picker-backdrop/);
  assert.match(studio, /selected===item\.id/);
  assert.match(studio, /mutate\("purchase",chosen\)/);
  assert.match(studio, /mutate\("equip",chosen\)/);
  assert.match(css, /\.ps-studio-layout/);
  assert.match(css, /\.ps-studio-nav:hover/);
  assert.match(css, /\.ps-studio-save:hover/);
});

testCase("profile studio synchronizes avatar, banner, profile details and community status through guarded APIs", () => {
  assert.match(studio, /\/api\/profile\/assets/);
  assert.match(studio, /\/api\/community\/profile\//);
  assert.match(studio, /\/api\/profile\/cosmetics/);
  assert.match(studio, /asset_type/);
  assert.match(studio, /communityForm\.set\("kind","avatar"\)/);
  assert.match(studio, /statusText:status/);
  assert.match(profileApi, /isSameOriginMutation\(request\)/);
  assert.match(profileApi, /sanitizeRasterImage/);
  assert.match(profileApi, /userId !== user\.id/);
});

testCase("public profile data exposes equipped appearance without exposing inventory or private notes", () => {
  assert.match(profileApi, /profile_banner_url/);
  assert.match(profileApi, /avatarFrameUrl/);
  assert.match(profileApi, /nameplateUrl/);
  assert.match(profileApi, /profileEffectUrl/);
  assert.match(profileApi, /isOwnProfile/);
  assert.doesNotMatch(profileApi, /coins|inventory|private_note|email/);
});
