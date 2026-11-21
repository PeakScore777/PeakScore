import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, route, bannersMigration, colorMigration, plateMigration, studio] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121028000_community_member_profile_banners.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121210000_community_member_profile_card_color.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121220000_community_member_profile_plate_style.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
]);

test("community profile displays its own banner, card color and member plate", () => {
  assert.match(page, /community-profile-banner-image/);
  assert.match(page, /community-member-hover-cover-image/);
  assert.match(page, /community-profile-nameplate is-plate-/);
  assert.match(page, /community-card-color/);
  assert.match(bannersMigration, /community-profile-banners/);
  assert.match(colorMigration, /card_color/);
  assert.match(plateMigration, /plate_style/);
});

test("avatar and banner uploads are owner-only, bounded and sanitized", () => {
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /await supabase\.auth\.getUser\(\)/);
  assert.match(route, /userId !== user\.id/);
  assert.match(route, /kind !== "avatar" && kind !== "banner"/);
  assert.match(route, /sanitizeRasterImage/);
  assert.match(route, /MAX_AVATAR_BYTES = 5 \* 1024 \* 1024/);
  assert.match(route, /MAX_BANNER_BYTES = 8 \* 1024 \* 1024/);
  assert.match(route, /upsert: false/);
  assert.match(route, /consume_community_attachment_rate_limit/);
  assert.match(route, /community-profile-avatars/);
  assert.match(route, /community-profile-banners/);
});

test("image controls use the community identity API instead of PeakStyle assets", () => {
  assert.match(studio, /uploadAsset\("avatar"/);
  assert.match(studio, /uploadAsset\("banner"/);
  assert.match(studio, /\/api\/community\/profile\//);
  assert.doesNotMatch(studio, /\/api\/profile\/assets|\/api\/profile\/cosmetics|PeakStyle/);
  assert.doesNotMatch(route, /from\("profiles"\)|profile_banner_url|profile-assets/);
});
