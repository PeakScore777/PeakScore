# PeakScore Community — Roles and navigation decision

Date: 2026-11-20  
Branch: `feat/founder-intro`

## Community role model for this release

- `profesor` / **Profesor PeakScore**: reserved for verified creators who publish educational videos, courses, and materials on the PeakScore platform.
- `moderador`: community moderation permission.
- `administrador`: community administration permission.
- Ordinary members have no explicit creator role; they participate as members.
- Role assignment is trusted/server-side only. Authenticated clients may read role labels and public assignments, but cannot grant or revoke roles.
- No `docente`, `rector`, `padre_de_familia` or institution-specific role is created in this release. Institutional identities and permissions will live in a separate future institutional scope and must not be conflated with Profesor PeakScore.

## Private teacher channel

`sala-de-profesores` is private. Only members assigned `profesor`, `moderador` or `administrador` can discover it, read messages, publish, react, or comment. RLS enforces the restriction server-side; hiding the channel in the UI is not the security boundary.

## Navigation

- Remove Ranking from the Community sidebar. Ranking remains a separate PeakScore destination, outside the Community.
- Keep the Community focused on channels, feed, member interaction and creator spaces.
- Do not show disabled decorative links as if they were working pages.

## Visual refinement

The next iteration uses the GameCode structural reference but a more restrained PeakScore visual system:
- Existing global PeakScore header is retained.
- Dedicated compact community sidebar, central publishing feed and editorial right rail.
- No ranking shortcut in the Community.
- Pixel font only for compact section labels and display titles; body text stays readable.
- High contrast navy surfaces, controlled cyan focus/selection, restrained green action buttons.
- Post cards have a clear author line, role badge, level, channel, body and compact action row.
- Custom scrollbar: thin dark rail with a calm blue-gray thumb and cyan hover/focus state; no loud native arrows or glowing gradients.
- No decorative emoji, fake counters, invented posts or generic empty dashboard widgets.

## Data and authorization

Migration `20261120235500_community_creator_roles_and_private_channel_access.sql`:
- Creates `community_role_catalog` and `community_member_roles`.
- Adds RLS SELECT-only access for authenticated users.
- Revokes all client write privileges to role catalogue and assignments; assignment must be performed by a trusted server/admin process.
- Adds `community_channels.is_private`.
- Makes `sala-de-profesores` private and enforces role checks through RLS on channels, messages, reactions and comments.
- Constrains comment replies to one level.

The existing `profiles.role` is not modified. It is not used as a substitute for the community creator role.
