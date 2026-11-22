# PeakStyle — asset creation and integration pipeline

**Date:** 2026-11-22  
**Branch:** \`feat/founder-intro\`

## First: what Discord's internal artists use is not publicly confirmed

We can reproduce the visible product behavior, but we cannot claim Discord uses a specific private art pipeline or tool. This document defines PeakScore's own production workflow.

## 1. Where to create the art

Use the right tool for each stage:

| Task | Recommended tool | Output |
|---|---|---|
| Shape, icon and vector design | Figma, Illustrator or Inkscape | SVG source and exported PNG/WebP |
| Looping vector motion | Rive or After Effects + Bodymovin/Lottie | \`.riv\` or Lottie \`.json\` |
| 3D object/particle rendering | Blender | Transparent render sequence / WebM |
| Compositing, glow and finishing | After Effects or DaVinci Resolve | WebM with alpha and static poster |
| Final optimization | Squoosh, ImageMagick or equivalent local tooling | WebP / optimized WebM |

The source project belongs in the design workspace; production exports belong under \`public/community/peakstyle/\`. Keep editable source files in a separate source-art directory or design repository, not in the runtime bundle.

## 2. Asset categories and artboards

### Avatar Decorations
- Canvas: 1024 × 1024 px, square, transparent background.
- Keep the avatar opening clear; draw the decoration around the safe zone, not over the face.
- Export static transparent WebP/PNG plus optional animated WebP or Rive/Lottie version.
- Test at 32, 40, 48, 64 and 96 px avatar sizes.
- Avoid thin details that disappear at chat size.

### Profile Frames
- Compose around the complete profile card, not just the avatar.
- Working artboard: 1200 × 1600 px, transparent; final aspect ratio must match the actual profile-card preview stage.
- Leave the card interior transparent. Include overflow-safe ornamental margins so corners and protruding elements are not clipped.
- Export transparent WebP/PNG and a static thumbnail.
- Test the same frame on editor preview, member popout and full profile.

### Profile Effects
- Working stage: 1200 × 1600 px, matching the card's composition.
- Animate background/foreground elements as a separate layer over the card; do not bake the avatar/name/banner into the effect.
- Preferred runtime export: VP9 WebM with alpha plus WebP poster; use Rive/Lottie for vector/shape motion where suitable.
- Keep loops seamless, usually 3–8 seconds; avoid high-frequency flashing, large full-screen blur and excessive particle counts.
- Render only when the profile is viewed. Never run all effects in every member row or gallery tile.

### Nameplates
- Working artboard: 1200 × 240 px (5:1).
- The foreground display name remains live HTML text. The art must be a background layer with a text-safe zone and strong contrast.
- Export transparent WebP/PNG; use subtle motion only if it remains legible in chat and member lists.
- Test long names, accented characters, high-contrast themes and small sizes.

## 3. File and manifest contract

Folder structure:

\`\`\`text
public/community/peakstyle/
  manifest.json
  avatar-decorations/
  profile-frames/
  profile-effects/
  nameplates/
  posters/
\`\`\`

Each catalog item should have:
- \`id\`: stable lowercase slug.
- \`category\`: one of the four categories.
- \`name\` and \`description\`.
- \`asset\`: first-party path under \`/community/peakstyle/\`.
- \`poster\`: static thumbnail path.
- \`format\`: webp, png, webm, rive or lottie.
- \`width\`, \`height\`, \`aspectRatio\`.
- \`animated\`, \`durationMs\`, \`loop\`.
- \`reducedMotionAsset\`: static fallback.
- \`version\` and \`accessibilityLabel\`.

The initial \`public/community/peakstyle/manifest.json\` is deliberately empty. Do not invent catalog entries or make CSS prototypes look like published cosmetics.

## 4. How a finished asset gets into PeakScore

1. Create the artwork in its native tool with transparent background and the correct artboard.
2. Export a static poster first.
3. Export the animated version if needed; keep the loop short and seamless.
4. Optimize file size and dimensions. Check alpha edges for halos, matte colors and jagged cutouts.
5. Add the export to its category directory and poster to \`posters/\`.
6. Add its metadata to \`manifest.json\`.
7. Add the stable ID to the server-side allowlist/database constraint before it can be equipped.
8. Connect the selector to the catalog entry and render it in the actual profile composition.
9. Verify reduced motion, low-end hardware, mobile scaling, loading/error fallback, ownership checks and cache behavior.
10. Only then publish it to users.

## 5. Runtime composition

The profile is composed from independent layers in a controlled stack:

1. Card base and banner color.
2. Profile Effect layer (behind readable content; optional foreground details may use a separate layer).
3. Profile Frame layer (outside the card silhouette; overflow allowed).
4. Avatar image.
5. Avatar Decoration layer.
6. Live display name and Nameplate background.
7. Status bubble, roles and profile text.

Use \`pointer-events: none\` on decorative art. Decorative animation must never intercept profile actions. All asset URLs are same-origin static assets; never load executable scripts or arbitrary remote animation code. Sanitize/validate any future SVG/Lottie ingestion and only publish reviewed assets.

## 6. Performance and accessibility

- Gallery tiles use static posters. Only the selected large preview may animate.
- Pause playback when the modal closes, the preview leaves the viewport or the page is hidden.
- Respect \`prefers-reduced-motion\` and use the static fallback.
- Lazy-load large WebM/Rive assets; do not download the full animation catalog on opening the editor.
- Cap dimensions, duration, file size and particle count in the asset review.
- Keep text contrast and safe areas measurable; verify with long names and different avatar aspect/crops.
- Avoid layout-affecting animations. Prefer transform and opacity.
- Provide accessible labels for controls; the art itself is decorative.

## 7. Current implementation boundary

The editor already has separate selector flows and persisted fields for avatar decoration, profile frame, profile effect, name design and status. The visible CSS motion samples are only interaction prototypes. They are not production artwork. The new asset library starts empty so the next design pass can create real art and wire each item into the catalog without changing the profile layout or rebuilding the editor architecture.

No Discord artwork, copied Shop items, fake price labels, Nitro references or non-functional purchase buttons belong in PeakScore.
