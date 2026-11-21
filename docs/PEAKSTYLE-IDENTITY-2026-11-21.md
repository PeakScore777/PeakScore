# PeakStyle — Profile identity & cosmetics

**Date:** 2026-11-21  
**Branch:** `feat/founder-intro`  
**Visual direction:** GameCode identity + Discord profile ergonomics.  
**Currency:** existing `profiles.coins` (PeakCoins), earned in PeakScore.

## Delivery priority: profile design first

The current delivery is intentionally limited to the profile experience. The cosmetics shop, PeakCoin purchases, profile effects, animated frames, and catalogue browsing are deferred to a later phase.

The first delivery deliberately does not invent gameplay history, ICFES scores, recent activity, attendance, win rates, streak records or achievements. Those modules require trustworthy underlying records and will only be added after the relevant data model and ownership rules are confirmed.

The first delivery includes:
- A Discord-inspired public profile layout: wide banner, overlapping avatar, display name, pronouns, member label and an "About me" section.
- A GameCode-inspired visual language: dark navy surfaces, cyan details, lime highlights, existing PeakScore pixel typography and compact technical labels.
- A responsive profile editor with an immediate preview.
- Personal avatar and banner upload.
- Editable display name, short bio and pronouns.
- A public profile page showing only existing game information: level, XP and selected character.
- A real companion spotlight using the selected character's existing art and lore (Nova, Nox, Zyra or Orby).
- A profile-completion checklist based only on the actual fields the player has filled in.
- A public-profile link that can be copied directly from the editor.
- Links from the character collection to the editor and from community member names to public profiles.

The goal is to make the profile layout and navigation feel complete before adding any decorative motion or store functionality.

## Deferred phase: cosmetics and PeakCoins

The database and service layer for cosmetic ownership, catalogue, frames, banners, effects, nameplates, themes and PeakCoin purchases have been scaffolded for later use. They are not exposed in the first-delivery profile UI. No cosmetics shop or purchase controls should be rendered until the profile design is accepted and the user asks to continue with that phase.

## Custom avatar and banner uploads

The profile editor accepts PNG, JPEG and WebP only, up to 8 MB. Animated GIF/APNG/WebP and SVG uploads are rejected deliberately. Animation is provided through PeakScore's original profile effects rather than untrusted uploaded animation files.

Every upload:
1. Requires an authenticated session and same-origin POST.
2. Is limited to ten uploads per user per asset type per rolling hour in PostgreSQL.
3. Is decoded and re-encoded with the server-side raster sanitizer; the original file name is ignored.
4. Is checked for EXIF/GPS, XMP/IPTC, comments and other removable metadata after re-encoding.
5. Is written by the server-only service-role client to the public-read `profile-assets` bucket, with a random UUID path.
6. Updates the current user's profile URL through a service-role-only database function. The database accepts only a URL under `profile-assets/<that-user-id>/<uuid>.(png|jpg|webp)`.
7. Removes the previous image only when it is a prior PeakStyle object under the same user's storage folder. External or existing OAuth avatar URLs are not deleted.

The bucket is public-read because profile images are visible in the community. It is not client-writeable; uploads use the server endpoint.

## Personal avatar and banner uploads

The editor also supports personal avatar and banner uploads, independent of the cosmetic shop. They are free to use. The accepted input formats are PNG, JPEG and WebP, up to 8 MB. GIF, APNG, animated WebP and SVG uploads are intentionally rejected; short profile motion is supplied by PeakScore's own profile effects instead.

Uploads use `POST /api/profile/assets`, a same-origin authenticated route. It applies a per-user rate limit of ten uploads per asset type per hour, decodes and re-encodes the raster using the existing sanitizer, verifies that EXIF/GPS/XMP/IPTC/comment metadata has been removed, and writes a random UUID object through the server-only service-role client. Profile URLs are set through a service-role-only RPC which validates that the URL belongs to the authenticated user's storage folder. Previous images are removed only when they are prior PeakStyle objects owned by that same user.

The `profile-assets` bucket is public-read so profiles can display avatars and banners. Restrictive Storage RLS policies block browser-role INSERT, UPDATE and DELETE access to that bucket. Only the server upload route can write there.

## Security and economics

- The browser cannot write the wallet, inventory or equipment tables directly.
- `purchase_profile_cosmetic` locks the user's `profiles` row before checking the inventory and debiting `profiles.coins`; the balance update, ownership insert, private ledger and security audit happen in one database transaction.
- A second purchase of an already-owned item does not charge again.
- `equip_profile_cosmetic` verifies the exact slot and the user's ownership.
- Inventory and purchase prices are private; only equipped cosmetics are exposed through explicit public projections.
- Public profile RPCs expose an allowlisted set of fields; they do not return email, phone, or other account-private data.
- Theme colour values are validated as six-digit hex colours before becoming CSS custom properties.
- React renders profile text as text, not HTML.
- The UI has reduced-motion fallbacks. No untrusted script, SVG upload or arbitrary animation is accepted.

## UI routes and files

- `/perfil/estilo`: responsive profile editor and live Discord-style preview; no shop UI in this phase.
- `/perfil/ver/[userId]`: public profile showcase.
- `POST /api/profile/cosmetics`: purchase/equip/unequip and basic profile text.
- `POST /api/profile/assets`: sanitized avatar and banner uploads.
- `GET /api/profile/cosmetics`: own profile identity and game summary only; cosmetic catalogue is deferred from this UI.
- `GET /api/profile/public/[userId]`: authenticated safe public profile projection.

The character collection includes a PeakStyle entry point. Community member names open their public profile. Cosmetic frames and nameplates remain deferred and are not loaded by the community message view in this phase.

## Database migration

Apply `supabase/migrations/20261121019000_peakstyle_profile_cosmetics.sql` after `20261121018000_community_founder_authority_and_moderation.sql`.

The migration creates the cosmetics catalogue, inventory, equipment table, private PeakCoin ledger, private upload rate-limit table, public profile projections and server-only asset URL update function. It adds `profiles.profile_bio`, `profiles.profile_pronouns` and `profiles.profile_banner_url`.

## Verification

Run:
```bash
npm run test:peakstyle
npm test
npm run lint
npm run build
```

The PeakStyle contract test checks profile text validation, the allowlisted public profile projection, sanitized avatar/banner uploads, restrictive Storage write rules, public community profile routing and the deferred cosmetics service security contracts.

**Deployment status:** this change is on `feat/founder-intro`. Supabase has not been migrated and production has not been changed. A Vercel build-rate-limit response was observed on the branch; verify the newest commit's preview build and test suite before merge.
