# Discord-style profile implementation status

Date: 2026-11-21
Branch: `feat/founder-intro`

## Verified baseline

- The target branch head was `8e4b7f162b9f44ae4516d926bffe5f19ad5c8500` at audit start.
- `CommunityProfileStudio` exists and owns one full-screen editor portal below the global PeakScore navigation.
- Community profile storage is first-party and isolated from the academic/game profile.
- Community profile uploads use server-side routes, owner checks, raster sanitization and per-user storage paths.
- Existing appearance fields: banner path, card color, plate style, accent color and avatar frame.
- Hover card and full profile modal exist, but are materially below the user-supplied Discord reference in structure, functionality and microinteraction.
- The CSS contains multiple successive definitions for `.community-profile-dialog` and a later `.community-profile-dialog-discord` variant. This is a cascade-maintenance risk and creates visual drift.

## Known gaps requiring implementation

- The full profile should use a compact Discord-like action row, structured profile body and meaningful tab state.
- The popout should use the full available identity data and not have a blank/empty generic warning state.
- The member profile request should preserve snapshot data on failures, with accessible retry.
- Appearance selectors need focused picker/preview/apply flows; a flat grid of choices isn't enough.
- Current schema does not support separate avatar decoration, profile effect, external social links, public featured badges, privacy preferences, activity timeline or mutual members. Don't display those as controls until the complete data/API/privacy path exists.
- Current nameplate and avatar-frame choices are native local CSS presets, not inventory-backed store assets. Do not label them as purchasable or owned shop items.
- There is a separate legacy `/api/community/member-cosmetics` endpoint that reads legacy cosmetic equipment tables; it must not be used as the source for the community identity editor unless a separate community-owned cosmetics model is designed and reviewed.

## Discord design behaviours verified from official documentation

- Profile Frames appear both in the full profile and the profile popout. They are not the same as profile effects. Source: https://support.discord.com/hc/en-us/articles/40775065582615-Profile-Frames-FAQ
- Avatar Decorations have their own selector and Apply/Save flow. Source: https://support.discord.com/hc/en-us/articles/13410113109911-Avatar-Decorations-FAQ
- Profile Effects are animated effects that render on the profile surface and have their own selector/Apply/Save flow. Source: https://support.discord.com/hc/en-us/articles/17828465914263-Profile-Effects
- Nameplates style the display name across server lists, DMs and chats; they have their own selector and Apply/Save flow. Source: https://support.discord.com/hc/en-us/articles/30408457944215-Nameplates-FAQ
- The Discord custom profile includes avatar, avatar decorations, effects, about, pronouns, banner and profile theme; preview and Save Changes are part of the flow. Source: https://support.discord.com/hc/en-us/articles/4403147417623-Custom-Profiles
- Discord profile widgets are real data-backed profile-board sections (favorite game, currently playing, want to play, games played, supported stats) that can be added/reordered/removed. These should not be imitated with fake activity cards. Source: https://support.discord.com/hc/en-us/articles/35344672307607-Profile-Widgets-FAQ
- Discord profile privacy controls visibility of status, pronouns, badges, connections, bio and widgets; a PeakScore privacy setting needs real persisted access-control semantics, not a superficial toggle. Source: https://support.discord.com/hc/en-us/articles/38859942749463-Profile-Privacy-Setting-on-Discord

## Important branch safety

The branches `feat/community-member-profile-2026-11-21` and `feat/discord-style-profile-system-2026-11-21` diverge from `feat/founder-intro` at old shared history and contain many unrelated changes. They must not be merged wholesale. Cherry-pick only specific community-profile changes after a file-by-file review and migration reconciliation.