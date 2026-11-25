import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [
  page,
  styles,
  assetsRoute,
  channelsRoute,
  founderStudio,
  brandingMigration,
  channelMigration,
  sanitizer,
] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/peakscore-community-theme.module.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/spaces/assets/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/channels/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityFounderStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261125183625_community_banner_gif_assets.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261124230100_community_role_and_channel_control.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
]);

testCase("community header is a full-bleed banner with a social-style verification check and Founder-only edit control", () => {
  assert.match(page, /community-server-header relative isolate flex/);
  assert.match(page, /community-server-banner-image/);
  assert.match(page, /community-server-banner-shade/);
  assert.match(page, /community-server-name/);
  assert.match(page, /BadgeCheck size=\{16\}/);
  assert.match(page, /community-verified-badge/);
  assert.match(page, /\{isFounder && \(/);
  assert.match(page, /community-server-branding-edit/);
  assert.match(page, /setFounderStudioOpen\(true\)/);
  assert.match(styles, /\.root :global\(\.community-server-banner-image\)/);
  assert.match(styles, /\.root :global\(\.community-server-branding-edit\)/);
  assert.match(styles, /ps-community-preview-verified/);
  assert.match(styles, /#69b1ff/);
});

testCase("only the Founder can upload community branding, and only banners may be GIFs", () => {
  assert.match(assetsRoute, /verifyCommunityFounder\(user\.id\)/);
  assert.match(assetsRoute, /assetType === "banner" && file\.type === "image\/gif"/);
  assert.match(assetsRoute, /assetType === "icon"/);
  assert.match(assetsRoute, /PNG, JPG o WebP estáticos/);
  assert.match(assetsRoute, /PNG, JPG, WebP o GIF animado/);
  assert.match(assetsRoute, /MAX_IMAGE_BYTES = 5 \* 1024 \* 1024/);
  assert.match(assetsRoute, /space\.id === "00000000-0000-4000-8000-000000000001"/);
  assert.match(assetsRoute, /Branding space lookup failed/);
});

testCase("the branding editor exposes GIF only on the banner picker and avoids a duplicated title", () => {
  assert.match(founderStudio, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(founderStudio, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.match(founderStudio, /uploadGlobalBrandingAsset\("icon", file\)/);
  assert.match(founderStudio, /uploadGlobalBrandingAsset\("banner", file\)/);
  assert.match(founderStudio, /hasta 60 fotogramas y 30 segundos/);
  const previewStart = founderStudio.indexOf("Vista previa del servidor");
  const previewEnd = founderStudio.indexOf("Nombre visible", previewStart);
  const preview = founderStudio.slice(previewStart, previewEnd);
  assert.ok(previewStart >= 0 && previewEnd > previewStart);
  assert.doesNotMatch(preview, /PEAKSCORE COMMUNITY/);
  assert.match(preview, /globalBranding\.name/);
});

testCase("only the Founder can administer text and PreICFES channels", () => {
  assert.match(channelsRoute, /verifyCommunityFounder\(user\.id\)/);
  assert.match(channelsRoute, /manage_community_channel/);
  assert.match(channelsRoute, /manage_community_space_channel/);
  assert.match(channelMigration, /Only the founder can manage community channels/);
  assert.match(channelMigration, /Only the founder can manage PreICFES channels/);
  assert.match(channelMigration, /private\.is_community_founder\(\)/);
});

testCase("the database allows GIF on banner_path but keeps icon_path static", () => {
  assert.match(brandingMigration, /community_spaces_icon_path_format/);
  assert.match(brandingMigration, /community_spaces_banner_path_format/);
  assert.ok(brandingMigration.includes("(png|jpg|webp)$"));
  assert.ok(brandingMigration.includes("(png|jpg|webp|gif)$"));
  assert.ok(brandingMigration.includes("'image/gif'"));
  assert.match(brandingMigration, /private\.is_community_founder\(\)/);
  assert.match(brandingMigration, /revoke all on function public\.update_community_space_asset/);
  assert.match(brandingMigration, /grant execute on function public\.update_community_space_asset/);
});

testCase("animated GIF sanitation remains bounded", () => {
  assert.match(sanitizer, /declaredMime === "image\/gif"/);
  assert.match(sanitizer, /frameCount > 60/);
  assert.match(sanitizer, /totalDelayCentiseconds > 3000/);
  assert.match(sanitizer, /width > 1024 \|\| height > 1024/);
});
