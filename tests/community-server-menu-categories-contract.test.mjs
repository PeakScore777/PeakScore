import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [
  page,
  theme,
  studio,
  channelRoute,
  categoryRoute,
  brandingRoute,
  migration,
] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/peakscore-community-theme.module.css", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityFounderStudio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/channels/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/categories/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/branding/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261125191455_community_server_menu_categories_and_appearance.sql", import.meta.url), "utf8"),
]);

testCase("server header uses a compact Discord-style name row and purple verified check", () => {
  assert.match(page, /community-server-menu-trigger/);
  assert.match(page, /community-server-menu-chevron/);
  assert.match(page, /community-verified-dot/);
  assert.doesNotMatch(page, /community-server-branding-edit/);
  assert.match(theme, /\.root :global\(\.community-verified-dot\)/);
  assert.match(theme, /background: #7657e8/);
  assert.match(theme, /\.root :global\(\.community-server-menu\)/);
});

testCase("the server dropdown exposes management actions only to the Founder", () => {
  assert.match(page, /\{isFounder \? \(/);
  assert.match(page, /Ajustes del servidor/);
  assert.match(page, /Crear canal/);
  assert.match(page, /Crear categoría/);
  assert.match(page, /openFounderStudio\("channels", "create-channel"\)/);
  assert.match(page, /openFounderStudio\("channels", "create-category"\)/);
  assert.match(page, /initialTab=\{founderStudioTab\}/);
  assert.match(page, /initialAction=\{founderStudioAction\}/);
});

testCase("Founder Studio saves durable categories, including categories without channels", () => {
  assert.match(studio, /community_channel_categories/);
  assert.match(studio, /function saveCategory/);
  assert.match(studio, /function archiveCategory/);
  assert.match(studio, /Las categorías vacías también se guardan/);
  assert.match(studio, /categoryOptions\.map/);
  assert.match(studio, /manage_community_channel_category|\/api\/community\/categories/);
});

testCase("category API and channel API require Founder and permit validated custom category names", () => {
  assert.match(categoryRoute, /verifyCommunityFounder\(user\.id\)/);
  assert.match(categoryRoute, /manage_community_channel_category/);
  assert.match(channelRoute, /verifyCommunityFounder\(user\.id\)/);
  assert.match(channelRoute, /category\.trim\(\)\.length < 2/);
  assert.match(channelRoute, /category\.trim\(\)\.length > 40/);
  assert.match(channelRoute, /CATEGORIES\.has\(rawCategory\.toUpperCase\(\)\)/);
});

testCase("the Founder can set a server-wide background while members can keep local overrides", () => {
  assert.match(studio, /Fondo predeterminado del servidor/);
  assert.match(studio, /background_color: globalBranding\.background_color/);
  assert.match(brandingRoute, /update_community_global_appearance/);
  assert.match(page, /appearanceMode === "server"/);
  assert.match(page, /id: "server", label: "Servidor"/);
  assert.match(migration, /update_community_global_appearance/);
  assert.match(migration, /community_spaces_background_color_check/);
});

testCase("new categories are visible under read-only RLS and can only be mutated by the Founder RPC", () => {
  assert.match(migration, /create table if not exists public\.community_channel_categories/);
  assert.match(migration, /alter table public\.community_channel_categories enable row level security/);
  assert.match(migration, /community_channel_categories_read_accessible/);
  assert.match(migration, /revoke all on table public\.community_channel_categories from public, anon, authenticated/);
  assert.match(migration, /Only the Founder can manage community categories/);
  assert.match(migration, /private\.is_community_founder\(\)/);
  assert.match(migration, /create unique index if not exists community_channel_categories_space_name_uidx/);
});
