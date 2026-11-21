import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, route] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
]);

testCase("community popout keeps cosmetics out of the profile and only exposes avatar upload", () => {
  const profileMarkup = page.slice(page.indexOf('className="community-profile-overlay"'));
  assert.match(profileMarkup, /community-profile-card/);
  assert.match(profileMarkup, /Cambiar foto/);
  assert.match(profileMarkup, /Editar perfil/);
  assert.match(profileMarkup, /Sobre mí|SOBRE MÍ/);
  assert.doesNotMatch(profileMarkup, /Cambiar banner|profile_banner|PeakStyle/);
  assert.match(profileMarkup, /selectedCommunityProfile\.bannerUrl/);
  assert.doesNotMatch(profileMarkup, /Tablero|Actividad|Lista de deseos|Desconectado/);
});

testCase("community avatar upload is owner-only and accepts sanitized static raster images", () => {
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /await supabase\.auth\.getUser\(\)/);
  assert.match(route, /userId !== user\.id/);
  assert.match(route, /kind") !== "avatar"/);
  assert.match(route, /sanitizeRasterImage/);
  assert.match(route, /MAX_AVATAR_BYTES = 5 \* 1024 \* 1024/);
  assert.match(route, /upsert: false/);
  assert.doesNotMatch(route, /MAX_BANNER_BYTES|community-profile-banners|banner_path/);
});
