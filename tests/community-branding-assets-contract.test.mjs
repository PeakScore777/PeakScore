import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, styles, assetsRoute, founderStudio, migration, sanitizer] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/peakscore-community-theme.module.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/spaces/assets/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityFounderStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261125123000_community_banner_gif_assets.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
]);

testCase("community header is a full-bleed banner with Discord-style identity and Founder-only edit control", () => {
  assert.match(page, /community-server-header relative isolate flex/);
  assert.match(page, /community-server-banner-image/);
  assert.match(page, /community-server-banner-shade/);
  assert.match(page, /community-server-name/);
  assert.match(page, /community-verified-badge/);
  assert.match(page, /\{isFounder && \(/);
  assert.match(page, /community-server-branding-edit/);
  assert.match(page, /setFounderStudioOpen\(true\)/);
  assert.match(styles, /\.root :global\(\.community-server-banner-image\)/);
  assert.match(styles, /\.root :global\(\.community-server-branding-edit\)/);
});

testCase("only the Founder can upload community branding, and only banners may be GIFs", () => {
  assert.match(assetsRoute, /verifyCommunityFounder\(user\.id\)/);
  assert.match(assetsRoute, /assetType === "banner" && file\.type === "image\/gif"/);
  assert.match(assetsRoute, /assetType === "icon"/);
  assert.match(assetsRoute, /PNG, JPG o WebP estáticos/);
  assert.match(assetsRoute, /PNG, JPG, WebP o GIF animado/);
  assert.match(assetsRoute, /MAX_IMAGE_BYTES = 5 \* 1024 \* 1024/);
});

testCase("the branding editor exposes GIF only on the banner picker", () => {
  assert.match(founderStudio, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(founderStudio, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.match(founderStudio, /uploadGlobalBrandingAsset\("icon", file\)/);
  assert.match(founderStudio, /uploadGlobalBrandingAsset\("banner", file\)/);
  assert.match(founderStudio, /hasta 60 fotogramas y 30 segundos/);
});

testCase("the database allows GIF on banner_path but keeps icon_path static", () => {
  assert.match(migration, /community_spaces_icon_path_format/);
  assert.match(migration, /community_spaces_banner_path_format/);
  assert.ok(migration.includes("(png|jpg|webp)$"));
  assert.ok(migration.includes("(png|jpg|webp|gif)$"));
  assert.ok(migration.includes("'image/gif'"));
  assert.match(migration, /private\.is_community_founder\(\)/);
  assert.match(migration, /revoke all on function public\.update_community_space_asset/);
  assert.match(migration, /grant execute on function public\.update_community_space_asset/);
});

testCase("animated GIF sanitation remains bounded", () => {
  assert.match(sanitizer, /declaredMime === "image\/gif"/);
  assert.match(sanitizer, /frameCount > 60/);
  assert.match(sanitizer, /totalDelayCentiseconds > 3000/);
  assert.match(sanitizer, /width > 1024 \|\| height > 1024/);
});
