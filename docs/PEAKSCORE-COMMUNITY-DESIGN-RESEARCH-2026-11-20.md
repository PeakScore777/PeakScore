# PeakScore Community — Design Research & UI Specification

Date: 2026-11-20  
Implementation branch: `feat/founder-intro`

## Primary visual reference: GameCode Community

Verified live page: https://gamecode.me/comunidad (resolves to https://gamecode.me/en/community)  
A representative page and the user's supplied screenshots were inspected on 2026-11-20.

Observed structure:
- Existing global navigation remains at the top.
- Community navigation is a separate left column.
- First group: Home, Leaderboard, Gallery, Monthly challenge.
- Channel groups below it: general channels and course/topic channels, with small post counts.
- Main column: channel heading and description; a dashed create-account/publish prompt; newest/top-post tabs; a compact view-mode toggle; a feed.
- Announcement cards use an IMPORTANT marker, author/avatar/date, pixel display title, large media region, concise excerpt, “Read more”, and reaction/share counts.
- Text posts use a denser card, author/avatar, level badge, channel badge, date, excerpt, comments and replies.
- The right rail contains an editorial team/news card and a community-rules card.
- A post detail view uses a main post panel and a separate comments panel with nested replies.

GameCode visual tokens extracted from the live community page's branding metadata:
- Canvas: `#0B1020`
- Deep surface: `#060916`
- Primary action green: `#7FE05C`
- Cyan accent: `#01C8EF`
- Muted copy: `#8B93B5`
- Muted links: `#5A6390`
- Typical radius: approximately 10px (component-specific).
- Primary buttons: green with a dark-green bottom shadow, approximately 5px.
- Typography: Pixel Grid for display headings; Inter/Poppins for body copy; JetBrains Mono for compact metadata.
- PeakScore implementation uses the existing locally configured pixel fonts and system sans/monospace stacks; it must not hotlink GameCode's proprietary logo or font assets.

## Discord patterns to borrow as product behavior

Official Discord guidance inspected:
- https://docs.discord.com/developers/game-development/how-to-create-a-community-for-your-game
- https://support.discord.com/hc/en-us/articles/11074987197975-Community-Onboarding-FAQ
- https://support.discord.com/hc/en-us/articles/6208479917079-Forum-Channels-FAQ
- https://support.discord.com/hc/en-us/articles/4421269296535-AutoMod-FAQ
- https://support.discord.com/hc/en-us/articles/214836687-Discord-Roles-and-Permissions

Product rules:
- Do not overwhelm new members with a wall of empty channels; create a small set of default channels and make topic-specific channels discoverable.
- Keep announcements read-only.
- Use regular text channels for fast, in-the-moment discussions.
- Use forum-style channels for durable questions/resources that benefit from tags and dedicated threads.
- Keep private staff/moderator spaces private by channel-level permissions.
- Role permissions and channel overrides are separate layers; a member may have multiple roles.
- Onboarding should let members pick their subjects/interests and receive the relevant channels/roles.
- Auto-moderation should check messages before publishing and log actions for moderators.

## PeakScore design guardrails — avoid generic AI UI

Do not use:
- A purple-to-blue gradient as the default brand treatment.
- Repeated giant rounded cards with glowing gradient borders.
- Random emoji decoration in navigation, headers or buttons.
- A wall of lucide icons where text hierarchy is enough.
- Generic “Welcome to your community” filler blocks that consume the feed.
- Fake member counts, online counts, post counts, sample comments or fabricated user profiles.
- Unrelated SaaS dashboard widgets, glassmorphism, oversized hero gradients or floating decorative blobs.
- Tiny pixel font for long body copy; reserve it for headings, category labels, compact badges and numbers.

Use instead:
- A clear 3-column information architecture: channel navigation, social feed, utility rail.
- Pixel display type only for channel titles, post headlines and small labels.
- Readable sans-serif body text with restrained line length.
- Dense but breathable post cards; one main action color (green), cyan for selected/focus state, amber for IMPORTANT labels.
- Square-ish card geometry and 1px blue-gray borders; minimal shadows.
- Real profile data, actual counts and explicit empty states.
- The existing PeakScore global header and assets; no cloned GameCode logo, copy, illustrations or font files.

## PeakScore-specific channel taxonomy

- COMMUNITY: general, memes, news, achievements.
- ICFES AREAS: mathematics, reading, social studies, natural sciences, English.
- TEACHERS: teacher room, class announcements.
- EVENTS: events and sessions.

Keep this first release intentionally small. Additional channels and teacher-owned spaces should be created only when the product has content and moderation capacity to support them.

## Security and data model

Existing community tables:
- `community_channels`
- `community_messages`
- `community_reactions`

Additional safe community profile surface:
- `community_public_profiles` exposes only id, display name, avatar URL, level and XP. It must never expose email, onboarding answers or account secrets.
- `community_get_stats()` returns aggregate member/post counts only.
- `community_message_comments` supports comments and one-level nested replies. RLS restricts insertion/deletion to the authenticated author and reading to active channels.

Never use client-editable metadata for authorization. Never let clients assign themselves moderator/admin roles. Keep message/comment payload length limits and apply rate limiting before opening community posting to the public.

## Acceptance checks

- Desktop shows the same visual hierarchy as the GameCode reference: left channel navigation, central feed, right editorial/rules rail.
- Mobile collapses the left channel navigation into a drawer, removes the right rail from the main flow, and keeps the compose control accessible.
- Newest/top tabs and list/grid toggles change the actual presentation/order.
- Post creation, reactions and comments are real Supabase operations, not decorative buttons.
- Only public-safe profile fields are displayed.
- Actual member/post counts come from the aggregate RPC; online count comes from Realtime Presence.
- All new tables have RLS, explicit grants and bounded fields.
- All work remains on `feat/founder-intro`.


## Final design / role decisions — 2026-11-21

- Ranking is not part of Community navigation. It remains a separate PeakScore destination.
- The channel formerly named `logros-y-rankings` is now `logros`; it is only for sharing learning achievements. It does not host the ranking.
- Removed inactive “Ranking”, “Galería” and “Reto del mes” placeholder rows from the initial Community sidebar. Community navigation now starts with Inicio and then real channels.
- The navigation displays a lock marker for private channels and a separate read-only marker.
- The scroll regions use a custom restrained scrollbar: thin, rounded slate thumb, dark track, cyan active state and no native arrow buttons. It is applied only inside Community scroll containers to avoid changing unrelated PeakScore pages.
- The main Community layout is locked to the available viewport below the existing global header. The feed and channel rail scroll independently and preserve the three-column desktop arrangement.

## Role model decision

- **Profesor PeakScore**: verified creator role for users who publish videos, courses or educational materials on the PeakScore creator platform.
- **Moderador** and **Administrador**: community governance roles.
- The existing account-wide `profiles.role` remains untouched.
- Institutional roles such as `docente`, `rector` and `padre_de_familia` are not created in this release. They belong to a later institutional product scope and will remain separate from `Profesor PeakScore`.
- Role assignments are not self-service. The current browser client can read safe role labels and public assignments, but cannot insert, update or delete assignments. A verified admin/server workflow must be built before granting the first Professor badge.
- `sala-de-profesores` is private at the database policy layer and visible to Professor PeakScore, Moderator and Administrator assignments only.

## Database follow-up

Migration `20261121001000_community_navigation_and_comment_policy_fix.sql`:
- Renames `logros-y-rankings` to `logros`.
- Corrects the nested-comment policy to reference the outer comment row explicitly, permitting replies to one-level parent comments without a self-referential comparison.
