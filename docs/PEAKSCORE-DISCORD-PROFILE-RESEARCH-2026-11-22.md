# PeakScore — Discord Profile Research & Design Spec

Date: 2026-11-22
Branch: feat/founder-intro
Reference: user's 2:11 Discord desktop recording and supplied screenshots.

This document separates official Discord behavior from observed UI and recommended PeakScore implementation choices. PeakStyle artwork has not been created yet. Do not present placeholder designs as real cosmetics, do not fake a store or ownership.

## 1. Taxonomy: never merge these systems

- Avatar: the main circular user image.
- Avatar Decoration: transparent art layered around the circular avatar.
- Profile Effect: large animation rendered over the profile surface when someone views it.
- Profile Frame: decorative border around the entire profile card/popout.
- Nameplate: horizontal design behind the actual display-name text; appears in DMs, group chats, member lists and settings bar. It is not a member badge and not the profile frame.
- Banner / Profile Theme: banner image or primary/accent profile colors.
- Display Name Style: font, color and animated name treatment; a different control system from Nameplate.
- Custom Status / Thought Bubble: short text with optional emoji and expiry.
- Server Tag: server-owned 4-character identifier plus icon, set by server admins and optionally used by members.
- Profile Board Widgets: manually curated modules.
- Activity: actual connected/current activity.
- Wishlist: saved Shop items with public/private visibility.

## 2. Observations from the user's recording

The recording shows a dimmed Discord app behind a large profile editor. Settings remain in a compact left column while the live profile stays visible in the middle/right. Sidebar rows use monochrome icon tiles, title, helper copy, chevron, and a restrained active surface with a narrow accent rail.

The central preview contains banner/header, avatar overlapping the header/body boundary, name, thought bubble, role/name labels, actions and profile details. Clicking banner/avatar opens anchored menus. Color opens a floating picker with a large 2D color plane, rainbow hue strip, hex field, preset/recent swatches, reset and apply. Decoration, effect, frame and nameplate each open a distinct picker with a collection area and larger live preview. The user expects Apply/Cancel semantics and an unsaved-changes bar. Outside click closes the top child layer, not the parent editor; Escape closes the topmost layer first.

The recording establishes desktop appearance and interaction order. It does not reveal Discord's internal CSS, easing curves, backend, or all responsive/mobile behavior.

## 3. Required PeakScore composition — corrected from the user's latest screenshot, 2026-11-22

Use **two columns on desktop**, matching the supplied Discord editor reference:

- **Left settings rail (about 220–240 px):** compact editable controls for Nameplate, Avatar / Decoration, Banner Color, Profile Frame, Profile Effect and Display Name Style. Each row has its own selected-state preview and opens the proper selector or popover.
- **Center live profile:** the banner, overlapping avatar and presence dot, the status thought bubble, display name, pronouns, roles, biography and member metadata. Name, pronouns, status and biography are edited in place; edits update the preview immediately.
- **No right-hand social/widgets panel:** the editor must not show Board, Activity, Wishlist or empty/fake widget cards. The center profile gets the remaining width.
- **Banner color:** edited from the left rail's color swatch, not from a floating pencil action on the banner. The swatch opens the full color plane, rainbow hue rail, HEX value, recents and reset/listo controls.
- **Separate identity systems:** Nameplate stays separate from Display Name Style. Avatar Decoration, Avatar Frame, Profile Frame and Profile Effect are separate controls. Do not use hashtag placeholders, generic emoji, sparkle glyphs or an orbital/heartbeat placeholder as cosmetic UI.
- **Mobile:** full-screen, vertically scrollable layout. Show the live profile first, then stack the same settings controls underneath. Keep the color picker and cosmetic previews usable, and pin the save bar above the safe-area inset.
- Keep the avatar's online/offline indicator visibly attached to the avatar edge. It must render above the banner and card layers.

The latest screenshot corrects the prior interpretation: the left rail is required for appearance editing; only the right-hand dashboard is rejected.

Target dark neutral surfaces: #111214, #1e1f22, #232428, #2b2d31; dividers #34363d; primary text #f2f3f5; secondary #b5bac1 / #949ba4. These are PeakScore implementation estimates, not Discord's official tokens. Use restrained monochrome icons, not generic emoji, hashtag or star placeholders.

### Latest UI corrections committed on 2026-11-22

- The profile studio now receives the live community presence state and renders the avatar status dot as a positioned overlay.
- Public member-number labels use “Miembro 0000” wording instead of a hash-prefixed placeholder.
- Profile-frame and profile-effect choices use semantic frame/sparkle iconography instead of three decorative dots.
- The mobile cosmetic picker keeps its live preview below the collection; the banner hue slider has an explicit rainbow track for WebKit and Firefox.
- The profile editor uses a left appearance rail and a center live profile, without a right dashboard.
- Display Name Style is a separate persisted profile field and is not merged with Nameplate.

## 4. Component specifications

### Profile / identity
Display name, pronouns, status and About Me; clear labels, helper text and counters. Update the live profile preview as the draft changes. Joined date and member ID are metadata, not decoration.

### Banner and color
Keep image upload distinct from solid color theme. The solid-color picker needs a two-axis saturation/value plane, horizontal rainbow hue rail, HEX input, copy, swatches, reset and Apply/Done. Live-update the banner preview; invalid HEX must not silently overwrite the previous color. Apply updates the local editor draft; Save persists.

### Avatar
Clicking the avatar opens an anchored menu: Change Avatar, Change Decoration, Remove Avatar (when one exists). Upload opens a real crop/position/zoom preview with Apply/Cancel. Recent avatars can be shown as circular thumbnails. Decorations are separate transparent layers and must never clip the avatar.

### Avatar Decorations
Dedicated modal. Collection of transparent artwork thumbnails on dark tiles, with a large preview composited around the user's real avatar. States: none, owned, selected, equipped, unavailable, loading and failed asset. Selecting updates preview immediately; Apply changes the draft; Save persists. Collection is fed from PeakStyle inventory only.

### Profile Effects
Dedicated modal with a large full-profile preview stage. Effects render across/over the card surface, not as an avatar border. Animate only the selected large preview, not every gallery thumbnail. Stop/pause when modal closes or leaves the viewport; respect reduced motion and provide a static poster fallback. In the public profile, play when the profile is viewed, not in every member list row.

### Profile Frames
Dedicated modal separate from Profile Effects. Preview the entire card/profile silhouette inside a transparent frame. Artwork may extend above/below the card, so the preview stage must permit overflow. Show the actual user's avatar, banner color and name inside the frame. Never crop ornamental parts.

### Nameplates
A Nameplate is a wide text-safe background behind the actual display name. Recommended design ratio 4:1–6:1 with safe space left/right. Preview the real username in the design and show it in a member-row/DM context. Render consistently anywhere the name is shown, including member lists and DMs. Never render it as a shield icon or as a frame around the profile card.

### Display Name Styles (optional separate system)
If PeakScore adopts this feature, build separate Font / Color / Effect controls with live preview. Use a controlled font and animation set; preserve contrast and avoid row layout shifts. Never merge this with Nameplate.

### Custom Status / thought bubble
Click bubble opens a compact composer with optional emoji, text, Clear After duration and live preview. Empty/saved/hover/editing/saving/error states. When populated, offer edit and clear. Discord defaults status to one day; PeakScore should choose its own clear-after options and document them.

### Board / Activity / Wishlist
Board widgets documented by Discord include Favorite Game, Currently Playing (up to 5 games), Want to Play (up to 20), Games I've Played (up to 20) and supported Game Stats. Users add widgets, reorder by drag/drop, remove individual games and remove whole widgets via overflow + confirmation. These widgets are manually curated; they are not real-time game activity.
Activity is a distinct surface for linked/current activity. Wishlist is a distinct list of saved Shop items with public/private visibility. PeakScore should not show fake widget cards as functional content: add a real catalog and persistence first, show a truthful empty state otherwise.

### Save / Reset
Dirty state only when values differ from the saved snapshot. Apply in child picker updates the local draft; Cancel restores pre-picker draft. Save shows pending and prevents double submit; errors keep draft intact. Reset restores last saved values, not arbitrary defaults.

## 5. Motion recommendations (PeakScore implementation choices, not Discord source measurements)

- Main editor open: 160–190 ms fade + 4–8 px rise / slight scale.
- Main editor close: 120–150 ms fade / slight scale.
- Picker open: 140–170 ms fade + translateY(6px) + scale(.99).
- Small popover: 100–130 ms fade + translateY(4px).
- Sidebar hover: 120–150 ms background/border transition.
- Selected tile: 120–160 ms border/background with very slight lift.
- Button press: 80–110 ms scale(.98).
- Color plane: immediate marker feedback; don't ease behind pointer.
- Preview art switch: 130–180 ms crossfade.
- Widget drag: pointer-follow, subtle lift, 120–160 ms settle.

Animate transform/opacity instead of layout dimensions or large blur. Do not animate every thumbnail simultaneously. Pause out-of-view animations; respect prefers-reduced-motion. Every animated cosmetic should have a static poster/fallback.

## 6. Popover, modal and keyboard behavior

Maintain a layer stack for status, avatar menu, banner menu, color picker, cropper and cosmetic pickers. Outside pointer handling must recognize both the trigger anchor and portal content. Outside click closes only the topmost child layer. Escape closes child menu -> child modal -> parent editor. Focus enters a blocking dialog and returns to the trigger on close. Apply/Save must never be treated as an outside click. Touch surfaces must expose actions without hover.

## 7. PeakStyle asset production checklist

Original assets are a separate design task and have not been generated yet:
- Avatar decoration: transparent square layer, clear safe zone around avatar, static and animated variant.
- Profile Effect: full-card animation layer, large preview stage, lightweight poster.
- Profile Frame: transparent complete-card composition, overflow-safe artwork, clear card interior.
- Nameplate: horizontal text-safe artwork with foreground text contrast/safe zone.
- Metadata: id, category, title, description, asset URL, poster URL, dimensions, aspect ratio, animation type/duration/loop, reduced-motion fallback, ownership/equip state, preview composition, accessibility label.
- Backend is authoritative for ownership/equipped state; don't trust client-supplied ownership flags.

## 8. Current PeakScore baseline and gaps

The existing Identity Studio note (2026-11-21) documents current native presets for avatar frame/nameplate, identity fields, avatar/banner uploads, card color and accent. It explicitly avoids fake shop inventory, paid effects, PeakCoins and activity history.

Next work:
1. Correct terminology and rendering: Nameplate behind display name, separate from Profile Frame.
2. Replace mock presets with original PeakStyle asset-backed collections after designs exist.
3. Build real dedicated pickers with large live preview for each cosmetic category.
4. Finish the thought-bubble status editor and robust outside-click layer stack.
5. Build actual Board widgets only with real data, add/remove/reorder and persistence.
6. Add Activity/Wishlist only when the supporting integrations/catalog exist.
7. Keep the visual system dark neutral and remove generic emoji-like placeholders.

## 9. Official sources

- Custom Profiles: https://support.discord.com/hc/en-us/articles/4403147417623-Custom-Profiles
- Shop FAQ: https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ
- Avatar Decorations: https://support.discord.com/hc/en-us/articles/13410113109911-Avatar-Decorations-FAQ
- Profile Effects: https://support.discord.com/hc/en-us/articles/17828465914263-Profile-Effects
- Profile Frames: https://support.discord.com/hc/en-us/articles/40775065582615-Profile-Frames-FAQ
- Nameplates: https://support.discord.com/hc/en-us/articles/30408457944215-Nameplates-FAQ
- Display Name Styles: https://support.discord.com/hc/en-us/articles/33833879643927-Discord-Display-Name-Styles-FAQ
- Custom Status: https://support.discord.com/hc/en-us/articles/360035407531-Custom-Status
- Profile Widgets: https://support.discord.com/hc/en-us/articles/35344672307607-Profile-Widgets-FAQ
- Wishlist: https://support.discord.com/hc/en-us/articles/36288192746903-Wishlist-FAQ
- Server Tags: https://support.discord.com/hc/en-us/articles/31444248479639-Server-Tags
- Per-Server Profiles: https://support.discord.com/hc/en-us/articles/4409388345495-Per-Server-Profiles
- Reduced Motion: https://support.discord.com/hc/en-us/articles/360040613412-Reduced-Motion-Setting
- Discord Blog, Nameplates: https://discord.com/blog/nameplates-land-in-the-shop
- Discord Blog, Profile customization: https://discord.com/blog/how-to-customize-your-discord-profile
