import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, route, migration, logo] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121023000_community_member_profile_banners.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/PeakScoreLogo.tsx", import.meta.url), "utf8"),
]);

testCase("new community profiles use the official PeakScore symbol on a green avatar and a plain green banner", () => {
  assert.match(page, /community-profile-default-logo/);
  assert.match(page, /\/images\/branding\/peakscore-logo-transparente2\.png/);
  assert.match(page, /community-profile-cover/);
  assert.match(page, /bannerUrl/);
  assert.match(logo, /peakscore-logo-transparente2\.png/);
});

testCase("member profile only exposes the About information panel, not social activity/friends/server tabs", () => {
  const profileMarkup = page.slice(page.indexOf('className="community-profile-overlay"'));
  assert.match(profileMarkup, /SOBRE MÍ/);
  assert.doesNotMatch(profileMarkup, />\s*(Actividad|Amigos|Servidores)\s*</);
});

testCase("only the profile owner can upload avatar/banner and uploads are sanitized raster images", () => {
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /await supabase\.auth\.getUser\(\)/);
  assert.match(route, /userId !== user\.id/);
  assert.match(route, /kind !== "avatar" && kind !== "banner"/);
  assert.match(route, /sanitizeRasterImage/);
  assert.match(route, /MAX_AVATAR_BYTES = 5 \* 1024 \* 1024/);
  assert.match(route, /MAX_BANNER_BYTES = 8 \* 1024 \* 1024/);
  assert.match(route, /community-profile-banners/);
  assert.match(route, /upsert: false/);
});

testCase("banner storage is scoped to the owning user and only server-side routes write files", () => {
  assert.match(migration, /banner_path text/);
  assert.match(migration, /split_part\(banner_path, '\/', 1\) = user_id::text/);
  assert.match(migration, /'community-profile-banners'/);
  assert.match(migration, /server-only/);
});
