import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, route, assetRoute, sanitizer, publicRoute, editor, publicPage, charactersPage, styles, communityPage, assets] = await Promise.all([
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
  assert.match(editor, /Solo PeakCoins/);
  assert.match(editor, /\/images\/currency\/peakcoin\.webp/);
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
  assert.match(publicRoute, /UUID_PATTERN/);
});

testCase("PeakStyle editor has preview, categories, collection, profile fields and mobile layout", () => {
  assert.match(editor, /Diseña tu identidad/);
  assert.match(editor, /VISTA PREVIA/);
  assert.match(editor, /THE COLLECTION/);
  assert.match(editor, /updateProfile/);
  assert.match(editor, /activeCategory/);
  assert.match(editor, /mutateCosmetic/);
  assert.match(editor, /purchaseCandidate/);
  assert.match(editor, /peakstyle-purchase-dialog/);
  assert.match(styles, /\.peakstyle-grid/);
  assert.match(styles, /@media \(max-width: 540px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /community-chat-avatar-frame/);
  assert.match(styles, /community-chat-nameplate/);
});

testCase("public profile is linked from community chat and profile editor is reachable from character collection", () => {
  assert.match(communityPage, /community-chat-nameplate/);
  assert.match(communityPage, /get_peakstyle_member_cosmetics/);
  assert.match(communityPage, /community-chat-avatar-frame/);
  assert.match(communityPage, /\/perfil\/ver\//);
  assert.match(publicPage, /get_peakstyle_public_profile|\/api\/profile\/public\//);
  assert.match(charactersPage, /href="\/perfil\/estilo"/);
});

testCase("original PeakStyle SVG art exists for all seeded cosmetic visual assets", () => {
  assert.equal(assets.length, 7);
  for (const asset of assets) {
    assert.match(asset, /<svg/);
    assert.doesNotMatch(asset, /discord|nitro/i);
  }
});
