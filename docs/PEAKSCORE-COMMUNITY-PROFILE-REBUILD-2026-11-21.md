# PeakScore Community — profile identity rebuild

**Date:** 2026-11-21  
**Branch:** \`feat/founder-intro\`

## Rebuilt interaction model

The member experience has two separate surfaces:

1. **Member hover popout:** lightweight identity preview, status, roles, joined date, mention action and an explicit route to the full profile.
2. **Full member profile:** read-only social identity with community banner, avatar, status, badges, about section and joined date. The owner gets one action, \`Personalizar perfil\`, which opens the identity studio.

The duplicate inline editor and duplicate avatar-upload control have been removed. All owner edits now live in one editor with a live preview and independent sections for profile basics, avatar, banner, card color and member plate. Escape and backdrop dismissal remain available.

## Community-owned identity

The social profile uses \`community_member_profiles\` and the public role-badge projection. It does not read from \`public.profiles\`, email, academic progress, XP, levels, game characters or PeakStyle cosmetics. A missing first-party profile is seeded only from editable auth user metadata for the authenticated account.

Member nameplates are native CSS presets (\`classic\`, \`grid\`, \`arcade\`, \`signal\`), not purchased assets. The user-selected card color is applied to the full profile body. Banner images are rendered as image elements over the existing GameCode cover, rather than relying on a background declaration that can be overridden by the legacy CSS.

## Upload and API security

- Avatar: PNG/JPEG/WebP raster, maximum 5 MB.
- Banner: PNG/JPEG/WebP raster, maximum 8 MB.
- Both are re-encoded by \`sanitizeRasterImage\`, rate limited and protected by same-origin and authenticated-owner checks.
- Uploads use dedicated community buckets and server-side writes; object names are random UUIDs beneath the authenticated user's UUID.
- Old images are deleted only when their path matches the generated UUID filename format and belongs to the same user.
- Browser requests cannot choose another member's user ID for writes.

## Database and deployment status

The branch already contains the banner and card-color migrations:
- \`20261121028000_community_member_profile_banners.sql\`
- \`20261121210000_community_member_profile_card_color.sql\`

This change adds \`20261121220000_community_member_profile_plate_style.sql\`. These migrations are versioned in Git. **None was applied to the connected Supabase project or to production during this work.** The API tolerates missing optional appearance columns so profile basics remain available until a development database receives the migrations in order.

## Verification

The profile and banner contract tests now describe the actual first-party community flow. GitHub Actions must confirm the branch's full test, lint and build results; no passing CI run is claimed before it runs.
