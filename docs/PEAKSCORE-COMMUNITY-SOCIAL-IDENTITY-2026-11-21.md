# PeakScore Community — independent social identity

**Date:** 2026-11-21  
**Branch:** `feat/founder-intro`  
**Visual reference:** Discord community shell + PeakScore GameCode visual language.

## Non-negotiable separation

Community identity is not the PeakScore learning/game profile.

- Community reads and writes `public.community_member_profiles` only.
- Learning/game level, XP, selected characters, PeakStyle cosmetics and learning profile routes are not shown in Community.
- The old `community_public_profiles` projection of `public.profiles` is retired from authenticated access. Its sync trigger and function are removed.
- Existing `public.profiles` remains the source for the learning/game product only.

## Community member profile

The community profile is opened in a modal from either the message author name or avatar, and from the signed-in member panel.

Fields:
- Independent display name (2–32 chars)
- Community avatar (PNG/JPEG/WebP, static raster only, 5 MB max)
- Pronouns
- Short custom status (80 chars max)
- About section (280 chars max)
- Community role badges from `community_member_roles` + `community_role_catalog`
- Live online/offline state from Supabase Realtime Presence
- Joined date

Only the owner can edit the profile. Avatar uploads are sanitized, rate-limited, uploaded by the server and stored in the dedicated `community-profile-avatars` bucket. The client cannot update `avatar_path` directly.

A member can open another member's profile and insert a real `@mention` token into the chat composer. The profile modal remains inside `/comunidad`; it does not navigate to `/perfil/ver/[userId]`.

## Community chat behavior

The channel chat remains one chronological stream:
- replies are first-class messages with a quote/reference in the composer, not nested forum comments;
- reactions are aggregate chips;
- image attachments remain sanitized and private;
- edit/delete actions remain owner-scoped;
- mentions search and resolve community display names only;
- member count and online presence remain separate.

Live session host names and avatars also come from `community_member_profiles`.

## Database changes applied

- `community_channel_chat_messages`
- `community_independent_member_profiles`
- `community_member_profile_mentions`
- `community_member_profile_mentions_resolution`
- `community_public_role_badges_view`
- `community_social_mention_compatibility`
- `community_private_mention_target_visibility`
- `community_mention_literal_search`
- `retire_legacy_game_profile_community_projection`

The database was checked after migration:
- 24 auth users and 24 community profiles
- 12 community channels
- legacy game-profile projection hidden from authenticated users
- old game-profile-to-community sync trigger removed
- social mention RPCs run as invoker under RLS
- dedicated public-read avatar bucket exists; upload writes remain server-only

## Deployment / validation note

The last Vercel build before the final UI corrections failed because a repository contract test still expected the previous mention RPC. The test was updated to assert the independent social identity implementation. A new Vercel deployment could not be started because the Vercel Hobby team reached its API deployment quota (`api-deployments-free-per-day`, retry after 24 hours). Do not claim the latest branch is deployed or browser-verified until a fresh build succeeds.


## GameCode visual reskin — 2026-11-21

The Discord-inspired shell now uses the GameCode visual language without changing the chat information architecture:

- Compact server rail and dedicated channel sidebar.
- Center chronological chat stream and right-side online/offline member list.
- Deep navy panels, thin blue borders, cyan active states, lime presence/success, and gold warning accents.
- Silkscreen pixel typography for channel titles, section labels, member labels, badges and microcopy; normal readable body text remains for chat.
- Styled hover/focus states, composer focus frame, message actions, reaction chips, attachment previews, date separators and profile dialog.
- Responsive layout keeps the server/channel drawer and member list usable on smaller screens.

Community avatar wrapper naming was changed to `community-chat-avatar-wrap`; the unused PeakStyle avatar-frame CSS was removed. The chat page has no PeakStyle cosmetics RPC, game-profile route, level/XP source or game avatar-frame class.

## Build failure diagnosis

The last available Vercel build logs showed the failure was a stale assertion in `tests/peakstyle-cosmetics-contract.test.mjs`: it expected the community chat to link to `/perfil/ver/` and expected the old avatar-frame naming. The test now verifies the opposite: Community opens `openCommunityProfile`, does not use the PeakStyle cosmetics RPC, does not contain the old frame class, and does not navigate to the game profile route.

Relevant contract checks were re-read against the current branch source and passed their source-level assertions. This is not a substitute for executing `npm test`, `npm run lint`, or a production build. Vercel currently reports its daily deployment API limit, so the latest branch cannot yet be confirmed through a fresh hosted build.
