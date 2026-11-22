# PeakScore Community — audit of the supplied Discord videos

Date: 2026-11-22  
Target branch: `feat/founder-intro`  
Source material reviewed: both uploaded videos (26 seconds and 169 seconds) plus the supplied screenshots.

## Video 1 — profile editor and customization flow

The recording shows a full-window profile workspace over a dimmed Friends surface. It is not a settings card inside the normal PeakScore page. The editor has a narrow left settings rail, a real-time profile preview in the middle, and the profile board/activity/wishlist surface to the right.

Observed interactions:
- Profile banner: the pointer hover darkens the image and reveals two contextual actions (change and remove). The banner has no permanently visible button row.
- Profile color: opening the selected color chip presents a compact anchored color picker with a two-dimensional saturation/value plane, hue slider, hex field, recent colors and reset/confirm actions. This selects the profile-card color independently from the accent/swatch color.
- Avatar: clicking the avatar exposes a context menu with Change avatar, Change avatar decoration and Remove avatar. Static images are adjusted in a circular crop view before applying. GIF avatars retain motion.
- Avatar decoration: its own collection modal, with separately animated decorations and a live, large preview.
- Profile effect: its own collection modal, which previews an animated effect over the card surface. It is not an avatar frame.
- Profile frame: its own collection modal. This border encloses the profile card, not the avatar.
- Nameplate: a distinct selector for the name label shown in channel member lists and other community surfaces.
- Status: a short speech-bubble/cloud appears beside the avatar. It is edited in a modal and has an expiry choice.
- Save state: changes remain a draft and a sticky bottom bar offers Reset and Save. Selector-level Apply must not silently persist the whole profile.
- The Nitro preview is a commerce/entitlement feature in Discord. PeakScore must not pretend that Nitro, paid cosmetic inventory or purchasing exists until a real PeakScore store/entitlement system is built.

## Video 2 — channels, members and moderation surface

The recording moves through a live server/community view:
- Leftmost server rail and the server/channel navigation remain visible while content changes.
- Text and voice channel groups are distinguishable, categories can be expanded/collapsed, and channel rows expose their own context/settings actions.
- The main chat remains one chronological message stream; it is not a forum or nested comment wall.
- The right member rail groups members by assigned role. Member rows show avatar treatments, nameplates and online/offline presence. Hovering or opening a member gives a richer member preview/profile.
- The channel settings flow covers channel identity/details, channel type, privacy, channel-specific permissions, slow mode and other channel-level controls.
- The permissions experience is granular. It distinguishes role overrides from member overrides and uses three states: inherit/neutral, allow and deny. Explicit deny must win over allow at the same override scope; member-level overrides are applied after role overrides. The effective result also respects server-wide roles and baseline channel properties.
- Private-channel visibility and the ability to send messages are separate permissions. A member who cannot view a channel must not receive its content through direct API queries.
- Creating a channel is a real operation, not a mock dialog. Text and voice types have different supported capabilities; voice/video additionally requires a real realtime/RTC service, which PeakScore does not currently expose in this community module.

## Verified PeakScore state at the time of review

### Existing foundations
- `community_channels` contains `slug`, `name`, `description`, `category`, `position`, `is_read_only` and `is_archived`.
- A later migration adds `is_private`.
- Community role catalogue and member-role assignments exist; founder, administrator, moderator and professor capabilities are checked by database functions/RLS.
- Member list loading groups members into online/offline and displays their actual assigned community roles.
- Community profile identity is isolated in `community_member_profiles`.
- Chat is already implemented as a chronological message stream with server-side message/comment policies.

### Gaps verified
- No `community_channel_permission_overrides` table exists. The current private-room rule grants access to a fixed set of global roles. There is no allow/deny/inherit model per channel for each role/member.
- No `app/api/community/channels` route exists for creating/updating/archiving channels. The current client reads the channel table but cannot persist channel management controls.
- The channel schema has no type (text/voice/forum), no slow-mode field, and no channel-specific permissions UI.
- Current right member rail has online/offline sections and role labels, but channel role grouping, cosmetic nameplates and presence/profile presentation are not yet a complete Discord-equivalent member rail.
- Voice channels/calls are not backed by a realtime media/RTC system; a visual voice channel must not be marked functional until that infrastructure exists.

## Implemented profile improvements in this branch

The profile work now includes:
- Full-window, Discord-charcoal editor shell with the old left PeakScore editor rail removed.
- Dark charcoal/black surfaces and restrained Discord-style indigo primary action.
- Banner actions that appear on hover/focus under a dark overlay.
- Anchored SV/hue/HEX color picker with recent colors, copy, reset and done.
- Separate avatar decoration, profile-card frame, profile surface effect and nameplate selectors. They use first-party PeakScore presets rather than fake Nitro/shop inventory.
- Avatar context menu; static-image crop/zoom/position; GIF avatar support with strict GIF container/LZW validation and frame/size/duration bounds.
- Status bubble and persisted status expiry.
- Cosmetics and status fields projected through the community profile API and member surfaces.
- Regression tests were updated for the new editor contract.

## Required next implementation — real channel permissions

Do this in the following order, without exposing direct client writes to protected channel tables:

1. Add a database-backed override table keyed by channel + subject (everyone/role/member). Store allow and deny bitmasks or an enum-array of supported permission names. Validate masks and prevent overlapping allow/deny bits on one row.
2. Add a single server-side resolver: baseline user capabilities → everyone override → combined role overrides (deny wins within scope) → member override (final scope). Apply private-channel and read-only defaults as base permissions, not as UI-only checks.
3. Replace the current channel/message RLS policies with policies using the resolver for `view_channel`, `send_messages`, `read_message_history`, `manage_messages`, `manage_channel` and `manage_permissions`. Preserve founder authority invariants and restrictive lifecycle/restriction checks.
4. Add origin-checked, rate-limited server routes for create/edit/archive channel and permission override CRUD. Check permissions on every mutation using the authenticated user, not client-supplied role claims. Log permission changes.
5. Build the Discord-style channel settings modal: Overview, Permissions, Integrations/Invites as supported, and Delete/Archive. The permission grid must show neutral/allow/deny distinctly, support role and member targets, search, and a clear summary of the effective permission.
6. Add actual channel types and slow-mode metadata only after backend semantics exist. Do not expose voice join/call controls until a realtime media stack is integrated.
7. Test direct REST/RLS access as well as the UI; a hidden button is not authorization.

## Quality gate

Do not call this work done until the latest branch passes:
- community profile/banner/crop/GIF and cosmetic contract tests
- community chat, role privacy, moderation/founder authority and permission tests
- GIF sanitizer fixture tests for valid/invalid frames, excessive frame counts, malformed LZW and trailing data
- TypeScript, ESLint with zero warnings, and Next.js production build
- browser screenshots of editor at desktop and mobile sizes, plus actual hover, color, avatar, effect, frame, status and save flows
- Supabase migration applied in a test project and direct-RLS negative tests
