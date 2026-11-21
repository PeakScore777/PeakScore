# PeakScore Community Identity Studio

**Date:** 2026-11-21  
**Branch:** \`feat/founder-intro\`

## Product surface

The community editor is a full-screen route-like surface mounted into \`document.body\`, below the existing 72px PeakScore global navigation. It replaces the old centered editor modal while open and restores the member profile popout when closed.

Layout:
- 68px compact community rail
- identity/settings sidebar
- central editing workspace
- sticky live preview with desktop/mobile width toggle

The editor keeps the global PeakScore navigation visible and avoids layering itself inside the previous profile overlay.

## Implemented controls

- Community display name, pronouns, custom status and about text
- Community avatar upload and removal
- Community banner upload and removal
- Five native avatar frame presets: none, solar, violet, cyan and ember
- Four native member nameplates: classic, grid, arcade and signal
- Six approved accent colors
- Existing member role badges and joined date in the live preview
- Discard local edits while preserving avatar/banner uploads that already succeeded
- Keyboard Escape, focus-visible controls, responsive layout and reduced-motion support

The editor does not expose unimplemented shop inventory, paid effects, PeakCoins, academic progress, game equipment, mutual friends or activity history. The member identifier is shown as pending because the current community schema does not yet define a public member-number field.

## API and data ownership

All identity data remains in \`public.community_member_profiles\`. The route never reads from \`public.profiles\` or account email to populate public profile content. PATCH validates the authenticated owner and updates the basic and visual profile fields in one server-side database operation.

Avatar and banner writes:
- same-origin mutation guard
- authenticated owner check
- PNG/JPEG/WebP static raster validation and re-encoding through \`sanitizeRasterImage\`
- 5 MB avatar and 8 MB banner limits
- existing community attachment rate-limit RPC
- generated UUID object paths beneath the owning user UUID
- server-only Storage uploads and deletion
- removal refuses paths that do not match the generated owned-object format

## Supabase schema and permissions

The additive migration \`20261121223000_community_profile_studio_appearance.sql\` adds:
- \`banner_path\`
- \`card_color\`
- \`plate_style\`
- \`accent_color\`
- \`avatar_frame\`
- dedicated public-read \`community-profile-banners\` bucket with 8 MB PNG/JPEG/WebP limit

The migration was applied to the connected Supabase project and verified. The existing 24 rows in \`community_member_profiles\` remained present.

A separate migration, \`20261121224000_community_profile_studio_service_role_access.sql\`, grants only SELECT and UPDATE on \`community_member_profiles\` to \`service_role\`. Verification confirmed:
- \`service_role\`: SELECT and UPDATE allowed
- \`authenticated\`: UPDATE denied
- browser writes remain routed through the authenticated owner-checked server API

The existing \`community-profile-avatars\` bucket remains unchanged.

## Verification status

Contract tests cover the full-screen layout, owner-scoped profile persistence, avatar/banner upload and removal, allowed presets and storage-path ownership. GitHub Actions and the Vercel preview must complete successfully before calling this version production-ready.
