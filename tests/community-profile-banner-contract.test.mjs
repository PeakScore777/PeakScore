import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, route, migration, studio, css] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121223000_community_profile_studio_appearance.sql", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("community member summaries load banner, card color, plate, accent and avatar frame", () => {
  for (const field of ["banner_path", "card_color", "plate_style", "accent_color", "avatar_frame"]) {
    assert.match(page, new RegExp(field));
  }
  assert.match(page, /ps-community-profile-banner__image/);
  assert.match(page, /ps-community-member-popout__banner-image/);
  assert.match(page, /is-plate-/);
  assert.match(page, /community-profile-banners/);
  assert.match(css, /ps-community-profile-banner__fallback/);
  assert.match(css, /\.ps-community-editor-preview-card/);
});

test("avatar and banner uploads enforce origin, ownership, size and image sanitization", () => {
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
  assert.match(route, /supabaseAdmin\.from\("community_member_profiles"\)/);
});

test("image removal clears only a generated storage path belonging to the authenticated owner", () => {
  const remove = route.slice(route.indexOf("export async function DELETE"));
  assert.match(remove, /userId !== user\.id/);
  assert.match(remove, /OWNED_OBJECT_PATH\.test\(previousPath\)/);
  assert.match(remove, /previousPath\.startsWith\(user\.id \+ "\/"\)/);
  assert.match(remove, /\.update\(\{ \[pathColumn\]: null \}\)/);
  assert.match(remove, /\.from\(bucket\)\.remove\(\[previousPath\]\)/);
});

test("all visual appearance settings are restricted to first-party presets", () => {
  assert.match(route, /ACCENT_COLORS/);
  assert.match(route, /AVATAR_FRAMES/);
  assert.match(route, /PLATE_STYLES/);
  assert.match(studio, /FRAMES\.map/);
  assert.match(studio, /ACCENTS\.map/);
  assert.match(studio, /PLATES\.map/);
  assert.match(migration, /accent_color/);
  assert.match(migration, /avatar_frame/);
  assert.match(migration, /community-profile-banners/);
});
