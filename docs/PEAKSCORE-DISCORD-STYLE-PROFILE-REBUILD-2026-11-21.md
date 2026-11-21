# PeakScore Community — Discord-style member profile rebuild

Date: 2026-11-21
Target branch: `feat/founder-intro`

## Audit findings

The current implementation has a valid independent social identity foundation in `community_member_profiles`, owner-scoped avatar/banner upload APIs and a single identity editor. Preserve those boundaries. Do not merge the divergent profile branches wholesale: `feat/community-member-profile-2026-11-21` and `feat/discord-style-profile-system-2026-11-21` share an old merge base with `feat/founder-intro` and contain many unrelated commits.

The current visual and interaction gap is not solved by changing colors:
- The member hover preview is a small banner/avatar/name/roles card and only offers “Ver perfil completo” + mention.
- The full profile is a narrow 440px dialog, containing only one “Personalizar perfil” or “Mencionar” action, identity, optional status, roles, About and joined date. It has no Discord-style quick action cluster, no card navigation, and no data-backed activity/mutual/badge surfaces.
- The custom profile dialog has three different base CSS definitions plus a Discord variant, with later rules overriding earlier rules. Consolidate this cascade rather than append another competing skin.
- The editor has six sections and a right preview, but its selection interactions are mostly inline option controls. It has no collection-style selector modal with preview/apply/cancel; no distinct avatar decoration or profile effect categories; and no functional social links/privacy section.
- User recordings expose an unhelpful “No se pueden cargar partes del perfil” state when a profile detail request fails. Preserve a working snapshot, identify which data is optional, and show a small recoverable message only when necessary; do not make the entire card look broken.
- The hover card is based on a manually positioned fixed layer with limited contents; profile request races/cache state must not show another member's data after hover changes.

## Product model: Discord interaction patterns, PeakScore identity

Borrow interaction and information architecture from Discord, not its logos, artwork or proprietary UI assets. Keep the PeakScore/GameCode design language: dark graphite/navy surfaces, clear cyan/electric-blue focus, restrained lime presence, pixel font only for compact section labels, readable sans-serif for names and body. Do not use purple-blue SaaS gradients, glowing borders around every card, emoji as navigation icons, fake counters, dummy users or empty tabs.

### Member profile surfaces

1. **Member preview / hover card**: quick popout with user banner, overlapping avatar with frame/decoration, online presence, display name + member ID, custom status, actual assigned community role badges, concise About preview, joined date and actions. Actions should match real capabilities:
   - Own profile: Edit profile.
   - Other members: Message (open/create an actual DM only when the capability exists), Add friend (only after a real friend system exists), More (report/block only if implemented); mention is available from the community composer and should remain one action where useful.
   - Hover should never be the sole way to open a profile; click/keyboard support remains.
2. **Full profile overlay**: larger profile card with banner and avatar overlap, username and ID, actions, role/nameplate badges and tabs. Tabs must be data-backed: Profile/About is always available; Activity appears only when a real community activity source exists; Mutual servers/channels only when actual membership data exists; Badges only when there are actual public badge records. Do not render inert tabs or placeholder sample content.
3. **Profile loading**: render cached/list snapshot immediately. Hydrate extended fields in the background. If extended fields fail, keep the snapshot, log a sanitized error code, and offer retry; do not put a large warning panel inside the profile. Ignore stale responses by request ID. Repeated openings should use the cache with a short TTL or invalidation after save.
4. **Interaction quality**: opening/closing profile uses a short opacity/scale transition; hover card enters with a small translate/scale and exits without flicker. Use Escape to dismiss, backdrop click, focus management, focus-visible, and prefers-reduced-motion. Button hover/press/loading/disabled states must be consistent.

### Identity editor

Retain the working full-screen three-zone editor (community rail, settings sidebar, workspace + sticky live preview). Do not duplicate it inside a new modal. Improve its behavior:
- Use section navigation for real supported data only: Profile, Banner, Avatar, Nameplate, Avatar frame, accent color. Add Effects, Featured badges, Social links or Privacy only together with their persisted schema, API, privacy constraints and tests; do not create decorative dead controls.
- A selector such as avatar frame/decoration, nameplate or profile effect opens a Discord-like selection modal: “None”, items actually owned/available, store entry if a real store exists, detail panel with large preview, selected-state marker, Cancel and Apply. Apply changes the draft/live preview; top-level Save commits the complete draft. Do not claim shop items are purchasable if no store/payment flow exists.
- Avatar decoration and avatar frame are separate data and render layers. Profile effect is a separate animated surface layer. Nameplate decorates the display name. Never collapse these categories into one “frame”.
- Banner: large real image preview; upload/change/remove; sensible crop guidance; persistent upload size/type constraints. Keep a designed empty state that is not a checkerboard grid.
- Avatar: large circular preview; change/remove; frame/decoration preview around it with correct sizing.
- About: live character count and safe formatting rules; profile ID is immutable/read-only and copyable.
- Status: a compact Discord-like status editor with text, optional symbol only if supported, duration options (30 min, 1 hour, 4 hours, today, never) and clear status. Persist expiry rather than leaving stale status forever; if expiry is not supported by DB/API, don't offer durations.
- Unsaved state: sticky discard/save bar only when dirty; show saving, saved, and recoverable error states. `Apply` inside a selector is draft-only; global Save persists it.
- Preview mirrors the member popout and full profile, not an unrelated static card. Desktop/mobile toggle must actually change a responsive card layout.

## Visual hierarchy

- Profile overlay: Discord-inspired surface, graphite #23252b / near-black, hairline #3a3d46; banner full width, avatar 96–120px crossing the banner/body boundary; compact identity line; role badges as grounded badges; clear quick-action buttons; tabs as underline/indicator navigation; body with About, Joined, ID and supported sections.
- Editor: 3-column shell with no redundant inner top bar. Side navigation is compact and stateful. Central sections use restrained bordered panels, not nested giant cards. Right preview is sticky. The profile banner and preview are high-value visual anchors.
- Microinteraction: CSS transforms of 1–2px for button press/hover; 120–180ms opacity/transform/border transitions; subtle animated focus ring, modal entry scale .985→1, list item hover. Respect prefers-reduced-motion.

## Data and security boundaries

Keep all community identity isolated in `community_member_profiles`, public community role badge view and dedicated community storage buckets. Do not pull email, academic profile, levels, XP, game inventory, PeakStyle cosmetics or academic activity into this surface. Every edit remains owner-scoped; upload routes keep server-side sanitization, size/MIME checks, rate limits, same-origin mutation guard and UUID-owned object paths. Do not let clients assign roles, social connections or member permissions.

Do not reuse `user_profile_cosmetic_equipment` as community profile inventory. If PeakScore later builds community cosmetics, create community-owned inventory/equipment and explicit ownership rules, and persist separate fields for avatar decoration, avatar frame, profile effect, nameplate, banner and theme.

## Required tests

- Profile data can load from cache and hydrate; failed details preserve usable base profile, with retry and no stale member cross-contamination.
- Popout shows only real actions and supported profile sections; no inert tabs, fake activity, fake mutuals or synthetic online state.
- Hover card and profile modal keyboard/mouse dismissal, responsive and reduced-motion.
- Selector modals support selected item, none, cancel, apply-draft and save-persist separately.
- Separate appearance categories persist and render in their own surfaces.
- Upload sanitation/owner/path/rate-limit regressions remain covered.
- Existing independent social identity and chat contracts continue passing.
- Full typecheck, lint, tests, build, GitHub Actions, Vercel preview and browser interaction checks must pass before production-ready status.