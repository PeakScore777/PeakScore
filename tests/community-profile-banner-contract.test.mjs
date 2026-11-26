import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, route, migration, cosmeticsMigration, bannerGifMigration, sanitizer, studio, globalCss, profileCss] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121223000_community_profile_studio_appearance.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121235000_community_profile_cosmetics_and_status.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261125234523_community_profile_banner_gif_uploads.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/community-member-profile-ui.css", import.meta.url), "utf8"),
]);
const css = globalCss + "\n" + profileCss;

test("community member summaries keep the banner dark and apply the selected two-color theme to the profile body", () => {
  for (const field of ["card_color", "plate_style", "accent_color", "avatar_frame", "avatar_decoration_id", "profile_frame_id", "profile_effect_id", "status_expires_at"]) {
    assert.match(page, new RegExp(field));
  }
  assert.match(page, /className=\{\"ps-community-editor-preview-banner\"/);
  assert.ok(page.includes('backgroundColor: "#20242D"'));
  assert.ok(page.includes('"--editor-theme-gradient": "linear-gradient(180deg, "'));
  assert.ok(page.includes("selectedCommunityProfile.cardColor"));
  assert.ok(page.includes("selectedCommunityProfile.themeColorSecondary"));
  assert.ok(page.includes("communityThemeText(selectedCommunityProfile.cardColor"));
  assert.match(page, /selectedCommunityProfile\.bannerUrl \?/);
  assert.match(page, /backgroundImage: \"url\(\" \+ selectedCommunityProfile\.bannerUrl/);
  assert.match(page, /is-plate-/);
  assert.match(page, /selectedCommunityProfile\.avatarFrame \?\? "none"/);
  assert.match(page, /frame-" \+ \(selectedCommunityProfile\.avatarFrame/);
  assert.match(css, /\.ps-community-editor-preview-banner/);
  assert.match(css, /\.ps-community-editor-preview-card/);
});

test("avatar and banner uploads enforce origin, ownership, per-asset size limits and GIF sanitization", () => {
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /await supabase\.auth\.getUser\(\)/);
  assert.match(route, /userId !== user\.id/);
  assert.match(route, /kind !== "avatar" && kind !== "banner"/);
  assert.match(route, /const isAvatar = kind === "avatar"/);
  assert.match(route, /const maxBytes = isAvatar \? MAX_AVATAR_BYTES : MAX_BANNER_BYTES/);
  assert.match(route, /const bucket = isAvatar \? "community-profile-avatars" : "community-profile-banners"/);
  assert.match(route, /\[ "image\/png", "image\/jpeg", "image\/webp", "image\/gif" \]/);
  assert.match(studio, /image\/gif/);
  assert.match(route, /sanitizeRasterImage/);
  assert.match(sanitizer, /function sanitizeGif/);
  assert.match(sanitizer, /validateGifLzw/);
  assert.match(sanitizer, /frameCount > 60/);
  assert.match(sanitizer, /totalDelayCentiseconds > 3000/);
  assert.match(route, /MAX_AVATAR_BYTES = 5 \* 1024 \* 1024/);
  assert.match(route, /MAX_BANNER_BYTES = 8 \* 1024 \* 1024/);
  assert.match(route, /upsert: false/);
  assert.match(route, /consume_community_attachment_rate_limit/);
  assert.match(route, /community-profile-avatars/);
  assert.match(route, /community-profile-banners/);
  assert.match(route, /supabaseAdmin\.from\("community_member_profiles"\)/);
  assert.match(bannerGifMigration, /community_member_profiles_banner_path_check/);
  assert.match(bannerGifMigration, /array\['image\/png', 'image\/jpeg', 'image\/webp', 'image\/gif'\]/);
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
  assert.match(studio, /AVATAR_DECORATIONS\.map/);
  assert.match(studio, /PROFILE_FRAMES\.map/);
  assert.match(studio, /PROFILE_EFFECTS\.map/);
  assert.match(studio, /const accentColor = DEFAULT_ACCENT/);
  assert.doesNotMatch(studio, /ACCENTS\.map|Color de acento/);
  assert.match(studio, /PLATES\.map/);
  assert.match(migration, /accent_color/);
  assert.match(migration, /avatar_frame/);
  assert.match(migration, /community-profile-banners/);
  assert.match(cosmeticsMigration, /avatar_decoration_id/);
  assert.match(cosmeticsMigration, /profile_frame_id/);
  assert.match(cosmeticsMigration, /profile_effect_id/);
  assert.match(cosmeticsMigration, /image\/gif/);
});
