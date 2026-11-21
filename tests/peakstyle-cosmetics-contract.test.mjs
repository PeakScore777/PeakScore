import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, route, assetRoute, sanitizer, publicRoute, editor, publicPage, charactersPage, styles, communityPage, communityStudio, assets] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261121019000_peakstyle_profile_cosmetics.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/api/profile/cosmetics/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/profile/assets/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/profile/public/[userId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/perfil/estilo/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/perfil/ver/[userId]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/perfil/personajes/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  Promise.all([
    "../public/profile-cosmetics/frames/aurora-pixel.svg",
    "../public/profile-cosmetics/frames/legendary-forge.svg",
    "../public/profile-cosmetics/banners/celestial-rift.svg",
    "../public/profile-cosmetics/banners/emerald-circuit.svg",
    "../public/profile-cosmetics/effects/starfall.svg",
    "../public/profile-cosmetics/effects/pixel-burst.svg",
    "../public/profile-cosmetics/nameplates/founder-tech.svg",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8"))),
]);

testCase("PeakStyle uses the existing profiles.coins wallet and never adds a real-money payment path", () => {
  assert.match(migration, /coins = coins - v_cosmetic\.price_coins/);
  assert.match(migration, /purchase_profile_cosmetic/);
  assert.doesNotMatch(migration, /stripe|paypal|checkout_session|payment_intent/i);
  assert.match(editor, /PeakCoins|mutateCosmetic/);
});

testCase("cosmetic ownership and public equipment are separated with owner-scoped RLS", () => {
  assert.match(migration, /user_profile_cosmetics_own_read[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(migration, /user_profile_cosmetic_equipment_public_read[\s\S]*?using \(true\)/i);
  assert.match(migration, /revoke all on public\.user_profile_cosmetics from public, anon, authenticated, service_role/i);
  assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)\s+on\s+public\.user_profile_cosmetics\s+to\s+authenticated/i);
});

testCase("PeakCoin purchases lock the wallet, are idempotent and ledger the resulting balance", () => {
  const start = migration.indexOf("create or replace function public.purchase_profile_cosmetic");
  const end = migration.indexOf("$function$;", start);
  const purchase = migration.slice(start, end);
  assert.match(purchase, /for update/);
  assert.ok(purchase.indexOf("for update") < purchase.indexOf("if exists"));
  assert.match(purchase, /if exists[\s\S]*?return query select false/);
  assert.match(purchase, /insert into private\.peakcoin_cosmetic_ledger/);
  assert.match(migration, /amount integer not null check \(amount >= 0\)/);
  assert.match(migration, /unique \(user_id, cosmetic_id\)/);
});

testCase("equip RPC verifies ownership and exact slot match; users cannot write equipment tables directly", () => {
  const start = migration.indexOf("create or replace function public.equip_profile_cosmetic");
  const end = migration.indexOf("$function$;", start);
  const equip = migration.slice(start, end);
  assert.match(equip, /v_category <> p_slot/);
  assert.match(equip, /user_profile_cosmetics[\s\S]*?user_id = v_user_id and cosmetic_id = p_cosmetic_id/);
  assert.match(equip, /on conflict \(user_id, slot\) do update/);
  assert.match(migration, /revoke all on public\.user_profile_cosmetic_equipment from public, anon, authenticated, service_role/i);
});

testCase("profile text is validated in PostgreSQL and can only be updated by auth.uid()", () => {
  assert.match(migration, /update_my_peakstyle_profile/);
  assert.match(migration, /revoke update on table public\.profiles from anon, authenticated/i);
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(migration, /char_length\(v_display_name\) < 2/);
  assert.match(migration, /char_length\(v_bio\) > 160/);
  assert.match(migration, /v_display_name ~ '\[<>\]' or v_bio ~ '\[<>\]'/);
  assert.match(migration, /where id = v_user_id/);
});

testCase("profile mutation endpoint rejects cross-origin writes and calls only bounded RPCs", () => {
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /readBodyWithinLimit\(request, 4_096\)/);
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /purchase_profile_cosmetic/);
  assert.match(route, /equip_profile_cosmetic/);
  assert.match(route, /update_my_peakstyle_profile/);
  assert.doesNotMatch(route, /\.from\("profiles"\)\s*\.update/);
});

testCase("avatar and banner uploads are authenticated, rate-limited and re-encoded before public storage", () => {
  assert.match(migration, /profile-assets/);
  assert.match(migration, /allowed_mime_types = array\[\x27image\/png\x27,\x27image\/jpeg\x27,\x27image\/webp\x27\]/);
  assert.match(migration, /consume_peakstyle_asset_rate_limit/);
  assert.match(migration, /return v_count <= 10/);
  assert.match(migration, /coalesce\(auth\.jwt\(\) ->> 'role', ''\) <> 'service_role'/i);
  assert.doesNotMatch(migration, /auth\.role\(\)/i);
  assert.match(migration, /update_my_peakstyle_asset\(uuid, text, text\) to service_role/);
  assert.ok(migration.includes("peakstyle_profile_assets_block_client_insert"));
  assert.ok(migration.includes("peakstyle_profile_assets_block_client_update"));
  assert.ok(migration.includes("peakstyle_profile_assets_block_client_delete"));
  assert.match(assetRoute, /isSameOriginMutation\(request\)/);
  assert.match(assetRoute, /readFormDataWithinLimit\(request, MAX_REQUEST_BYTES\)/);
  assert.match(assetRoute, /sanitizeRasterImage\(/);
  assert.match(assetRoute, /supabaseAdmin\.storage[\s\S]*?\.upload\(/);
  assert.match(assetRoute, /supabaseAdmin\.rpc\("update_my_peakstyle_asset"/);
  assert.match(assetRoute, /getOwnedProfileAssetPath/);
  assert.match(sanitizer, /canvas\.encode\("png"\)/);
  assert.match(sanitizer, /hasPersonalMetadata\(output, declaredMime\)/);
  assert.match(sanitizer, /No se permiten imágenes animadas/);
  assert.match(sanitizer, /chunkType === "ANIM" \|\| chunkType === "ANMF"/);
  assert.match(sanitizer, /bytes\[dataOffset\] & 0x02/);
  assert.match(editor, /uploadAsset\("avatar"/);
  assert.match(editor, /uploadAsset\("banner"/);
});

testCase("public profile RPC returns an explicit safe projection and equipped public cosmetics", () => {
  assert.match(migration, /get_peakstyle_public_profile/);
  assert.match(migration, /get_peakstyle_member_cosmetics/);
  assert.match(migration, /profile\.profile_bio/);
  assert.match(migration, /profile\.profile_pronouns/);
  assert.match(migration, /jsonb_build_object\([\s\S]*?'assetPath'/);
  assert.doesNotMatch(migration.slice(migration.indexOf("create or replace function public.get_peakstyle_public_profile"), migration.indexOf("$function$;", migration.indexOf("create or replace function public.get_peakstyle_public_profile"))), /profile\.email|profile\.phone|profile\.password/i);
  assert.match(publicRoute, /get_peakstyle_public_profile/);
  assert.match(publicRoute, /community_public_role_badges/);
  assert.match(route, /community_public_role_badges/);
  assert.match(publicPage, /profile\.roleBadges/);
  assert.match(editor, /profile\?\.roleBadges/);
  assert.match(publicRoute, /badgeColor: badge\.badge_color/);
  assert.match(publicRoute, /UUID_PATTERN/);
});

testCase("community identity editor is a native full-screen studio, separate from PeakStyle inventory", () => {
  assert.match(communityPage, /Personalizar perfil/);
  assert.match(communityPage, /CommunityProfileStudio/);
  assert.match(communityPage, /!communityProfileStudioOpen && \\(selectedCommunityProfile/);
  assert.match(communityPage, /setCommunityProfileStudioOpen\\(true\\)/);
  assert.match(communityStudio, /Editar perfil/);
  assert.match(communityStudio, /Vista previa/);
  assert.match(communityStudio, /Marcos/);
  assert.match(communityStudio, /Banner/);
  assert.match(communityStudio, /Guardar cambios/);
  assert.match(communityStudio, /createPortal\\(/);
  assert.doesNotMatch(communityStudio, /PeakStyle|PeakCoins|selectedCharacter|mutateCosmetic|activeCosmeticTab|profileEffectUrl/);
  assert.match(editor, /PeakCoins|mutateCosmetic/);
  assert.match(styles, /\\.ps-community-editor-preview-card/);
});
testCase("community chat identity stays separate from PeakStyle cosmetics and game profiles", () => {
  assert.doesNotMatch(communityPage, /get_peakstyle_member_cosmetics|community-chat-nameplate|community-chat-avatar-frame|community-chat-avatar-frame-wrap/);
  assert.match(communityPage, /openCommunityProfile/);
  assert.match(communityPage, /CommunityProfileStudio/);
  assert.match(communityPage, /setCommunityProfileStudioOpen\\(true\\)/);
  assert.doesNotMatch(communityPage, /router\.push\("\/perfil\/estilo"\)/);
  assert.doesNotMatch(communityPage, /\/perfil\/ver\//);
  assert.match(publicPage, /get_peakstyle_public_profile|\/api\/profile\/public\//);
  assert.match(charactersPage, /href="\/perfil\/estilo"/);
});


testCase("PeakStyle editor loads catalogue, inventory and equipment and supports buy/equip/unequip", () => {
  assert.match(route, /community_profile_cosmetics/);
  assert.match(route, /user_profile_cosmetics/);
  assert.match(route, /user_profile_cosmetic_equipment/);
  assert.match(route, /action === "purchase"/);
  assert.match(route, /action === "equip"/);
  assert.match(route, /action === "unequip"/);
  assert.match(route, /action !== "unequip"/);
  assert.match(editor, /activeCosmeticTab/);
  assert.match(editor, /mutateCosmetic\("purchase"/);
  assert.match(editor, /mutateCosmetic\("equip"/);
  assert.match(editor, /mutateCosmetic\("unequip"/);
  assert.match(editor, /peakstyle-loadout/);
});

testCase("public profile renders all equipped PeakStyle slots without exposing private inventory", () => {
  assert.match(publicPage, /equippedCosmetics: EquippedCosmetic\[\]/);
  assert.match(publicPage, /equipped\.avatar_frame/);
  assert.match(publicPage, /equipped\.profile_banner/);
  assert.match(publicPage, /equipped\.profile_effect/);
  assert.match(publicPage, /equipped\.nameplate/);
  assert.match(publicPage, /equipped\.profile_theme/);
  assert.match(publicPage, /peak-public-equipped-frame/);
  assert.match(publicPage, /peak-public-profile-effect/);
  assert.match(publicPage, /peak-public-nameplate-art/);
  assert.match(styles, /peak-public-equipped-frame/);
  assert.match(styles, /peak-public-profile-effect/);
  assert.match(styles, /has-peakstyle-theme/);
  assert.doesNotMatch(publicRoute, /user_profile_cosmetics/);
});

testCase("original PeakStyle SVG art exists for all seeded cosmetic visual assets", () => {
  assert.equal(assets.length, 7);
  for (const asset of assets) {
    assert.match(asset, /<svg/);
    assert.doesNotMatch(asset, /discord|nitro/i);
  }
});
