# PEAK OS — Field Archive Design Doctrine

**Status:** visual direction and implementation contract  
**Branch:** `feat/founder-intro`  
**Scope:** desktop shell projected inside the 3D archive workstation  
**Product principle:** a believable investigative workstation, not a generic SaaS dashboard and not a Windows skin.

## 1. Product identity

PeakOS is the operating environment of a fictional field-investigation terminal used to inspect one case file. It should feel like a carefully maintained late-1990s evidence workstation that has received a restrained modern engineering upgrade.

The visual language combines archive paper (warm ivory, file-card green, muted ink, provenance stamps), hardware (petrol-blue title bars, dark graphite taskbar, brass details, tactile but restrained bevels), and modern clarity (direct search, clear navigation, predictable window controls, legible type and responsive layouts). Evidence codes, people, sources, timestamps, seals and record status are first-class content—not decorative filler.

This is a proposed PeakScore identity. Microsoft Fluent is a source of interaction and hierarchy lessons, not a brand to copy.

## 2. Research translated into design decisions

### What Windows 11 does well

Microsoft's guidance describes a coherent system built around clarity, familiarity, craft, predictable navigation and controls that behave consistently. Mica is an opaque base surface intended for long-lived windows; Acrylic is a transient frosted material for menus/popovers; Smoke dims content under blocking dialogs. Material has a job—it is not decoration.

Microsoft's Start-menu redesign emphasizes pinned apps, discoverable all-apps views, relevant recent activity, personalization and using available screen area appropriately. Its NavigationView guidance recommends top navigation for five or fewer equally important categories when content space matters, and left navigation for larger sets. Command-bar guidance says the most important actions should stay visible and less important actions can move into overflow.

### What to avoid from generic AI interfaces

Do not fall back to the recognizable “AI dashboard” recipe:
- Purple/blue glow backgrounds, neon edges, floating glass panels and excessive blur.
- A card for every item, nested cards, repeated statistics, fake “insights”, invented activity or placeholder content.
- Same radius and soft shadow on every control, pill-shaped buttons everywhere, and large empty hero areas.
- Decorative charts, progress bars, badges or separators that do not help the user complete a task.
- Tiny pale-gray text, vague search boxes, icon-only actions with no accessible name, and controls that look interactive but do nothing.
- Unmotivated animation, repeated pulsing, and transitions that make users wait before reading.

The remedy is product-specific structure: real records, real metadata, purposeful commands, consistent navigation, and visible cause/effect.

## 3. Visual tokens

These are PeakOS proposal tokens, not Microsoft brand values.

| Token | Value | Use |
|---|---|---|
| Terminal night | `#101E27` | Desktop background |
| Petrol blue | `#24455E` | Active window chrome |
| Deep petrol | `#1C3442` | Taskbar base |
| Archive paper | `#F0EEE6` | Reading surfaces |
| Pale file | `#E2E7E8` | Main application canvas |
| Field sage | `#B7C2AD` | Selected folders / calm state |
| Archive green | `#334C43` | Primary action and confirmed state |
| Brass | `#986B43` | Focus, evidence marker, active trim |
| Ink | `#202B34` | Main text |
| Muted ink | `#566875` | Secondary text |
| Record line | `#AAB7BB` | Rules and field boundaries |
| Alert red | `#873B32` | Restricted warnings / destructive action only |

### Shape and elevation
- Window frame: 6 px corner radius; one structural border.
- Command controls: 3–4 px radius; visible pressed/disabled/focus states.
- Dossier/document preview: near-square corners and paper-like rules.
- Use bevels only on physical-looking controls such as the Start key and dock buttons.
- Use shadows to separate a window from the projected desktop, not to decorate every row.
- Never put a border, panel or card around a region unless it marks a real boundary or action.

### Typography
- Product UI: Segoe UI/system sans-serif, with a restrained, consistent type ramp.
- Main reading text: 12–14 CSS px at the screen-overlay coordinate system, regular weight and comfortable line height.
- Labels: 10–11 px only for secondary metadata, never for important instructions.
- Monospace: evidence codes, timestamps, file IDs and copyable references only.
- Serif: document facsimiles and formal dossier pages only.
- Long text stays left aligned. Do not use uppercase letterspacing for every label.

## 4. Shell and navigation

### Desktop
Keep the desktop surface visually quiet so app windows remain the focus. Shortcuts remain transparent (no vertical black tile/container). Their selected state is a subtle selection field, not a permanent box. Every shortcut has a clear name, tooltip, keyboard action and identical icon grammar. Avoid glow and moving wallpaper effects; the case room is already the visual environment.

### Start / Peak menu
The menu is a compact command centre, not a promotional dashboard:
1. Search field.
2. Pinned case tools, in a predictable grid or compact list.
3. Real recent activity from unlocked email/messages and recently accessed records.
4. Power action, separated from everyday navigation.

The search indexes app names and available case records. Selecting a result opens the correct application and selects the matching record/folder. Never fabricate “recent” content.

### Taskbar / dock
- Dark petrol hardware strip with one Start control, a real search field, five consistent app launchers, notification count and clock.
- The active app gets a small brass/cream indicator; unread communications get a separate blue-gray dot/count.
- No visible horizontal scrollbar. If space is constrained, reduce gaps or collapse labels before introducing scrolling.
- Hover and focus states are restrained; the bar should feel like an instrument panel, not a floating SaaS pill.

### Window chrome
- Product-specific title (Explorador, Correo, Mensajería, Cronología forense, Centro de seguridad).
- Case title in secondary position.
- Minimize, maximize/restore and close controls in standard order.
- Menu actions must work. Disabled commands should visibly look disabled.
- Windows should not blur their own text or content during focus changes.

## 5. Application contracts

### Explorador
- The main list is the primary surface and gets the available width.
- Sidebar contains only real suspect/person folders and counts. Remove static destinations that do not navigate.
- Toolbar contains list/grid, back/forward, search and sort.
- Search scope is visible in the placeholder: name, evidence code or person.
- Columns: document, classification/type, state.
- One click selects and exposes details; Enter/double-click opens the record.
- Detail pane appears only after selection; otherwise the list expands.
- Empty results explain whether the folder is empty or the search found no match.

### Correo
- Two-pane layout: compact message index and readable message.
- Search includes subject, sender, recipient, body, evidence code and document reference.
- Filters (all / with evidence / with reference) visibly indicate the active state.
- Selecting a message changes only the reading pane—no blur or rescaling of the projected screen.
- Provenance and attachments stay attached to the relevant message.

### Mensajería
- Conversation list left; selected thread right.
- Search includes person, message body, evidence code and document reference.
- Distinguish “no conversations” from “records sealed until progress” with explicit, truthful copy.
- Do not create send/reply controls unless there is a real messaging workflow.

### Cronología forense
- Use an ordered event ledger, not a wall of identical cards.
- Time is easy to scan; event is the visual focus; record type, person, source and evidence code are subordinate metadata.
- Search spans event, source, person and evidence code; person selector filters the same underlying dataset.
- “Consultar evidencia” appears only when a valid record can be opened.
- Preserve the distinction between testimony, registration, finding and verified fact.

### Centro de seguridad
- Show actual evidence count, source, scope, reference and state.
- Explain data limitations instead of filling empty space with fabricated status indicators.
- Use stronger emphasis only for warnings, restricted items and missing provenance.

### Notifications
- Compact, readable, non-blocking panel.
- Each item says whether it is email or message, who/what it concerns, when it arrived and where it opens.
- Mark-read is actionable. A notification must not cover the document list or main content unnecessarily.

## 6. Interaction and accessibility

- Every visible control has a real action or is rendered as non-interactive text.
- Search fields filter the records shown in the same app; Enter opens the first result only when a result exists.
- Preserve keyboard navigation, visible focus, tooltips/accessible names and predictable Esc behavior.
- Standard text contrast target: at least 4.5:1; large text at least 3:1.
- Respect `prefers-reduced-motion`.
- Keep body text readable. Use muted text for secondary metadata, not content the learner must understand.
- Use Spanish labels consistently and prefer verbs for commands: “Abrir”, “Consultar”, “Volver”, “Marcar leído”.

## 7. 3D screen and performance

The 3D room and the projected app are separate quality budgets.
- Keep the HTML screen projection sharp; do not apply CSS blur to the screen surface or app content.
- Recompute the projective CSS transform only when the camera/monitor transform changes.
- Keep the WebGL pixel ratio bounded and render demand-driven while stationary; render continuously only during pointer-locked movement or a real animation.
- Do not add perpetual shimmer, pulsing or particle layers to the desktop.
- Use brief CSS transitions for state feedback; disable them for reduced-motion users.
- Reuse static geometries and textures; dispose custom geometries on unmount.
- Mouse target proportions: approximately 72 mm wide × 120 mm long, with a continuously rounded palm shell, distinct left/right click panels, a front-centred recessed scroll wheel, subtle side buttons, a small status LED and a cable. No brand mark. The model must read as a mouse at the workstation's actual camera distance.

## 8. Review checklist before merging

- [ ] Each app shows its actual data and a truthful empty/error state.
- [ ] All search fields filter their own dataset.
- [ ] No static navigation item remains unless it changes the view.
- [ ] No meaningless cards, progress bars, badges, separators or “recommended” content.
- [ ] Selected, hover, focus, active, disabled and unread states are distinct.
- [ ] Text stays crisp in the monitor projection at the intended camera distance.
- [ ] The taskbar has no scrollbar and its controls fit at supported view sizes.
- [ ] Mouse proportions look credible from the player camera, not just in source geometry.
- [ ] Pointer-locked movement remains smooth; desktop interaction does not trigger continuous 3D rendering.
- [ ] Build, lint and archive-3D tests pass before claiming completion.

## 9. Research references

**Primary Microsoft design sources**
- [Mica material — Windows apps](https://learn.microsoft.com/en-us/windows/apps/design/style/mica): long-lived opaque backdrop, focus hierarchy, performance and fallback behaviour.
- [Material — Fluent 2](https://fluent2.microsoft.design/material): solid, Mica, Acrylic and Smoke use cases.
- [Windows 11 design principles + tenets — Microsoft Design](https://microsoft.design/articles/windows-11-design-principles-tenets/): simplicity, coherence, craft, familiarity, intentional change and personalization.
- [Redesigning the Windows Start menu — Microsoft Design](https://microsoft.design/articles/start-fresh-redesigning-windows-start-menu/): pinned apps, all-apps discovery, relevant activity and adaptable use of screen space.
- [NavigationView — Windows apps](https://learn.microsoft.com/en-us/windows/apps/design/controls/navigationview): when top vs left navigation is appropriate and how layouts adapt.
- [Command bar — Windows apps](https://learn.microsoft.com/en-us/windows/apps/design/controls/command-bar): priority order, persistent actions and overflow.
- [Typography — Fluent 2](https://fluent2.microsoft.design/typography/): typographic hierarchy, Segoe/system stack and contrast guidance.

**Anti-generic UI references**
- [NN/g — Prompt to Design Interfaces](https://www.nngroup.com/articles/vague-prototyping/): vague prompts lead to clutter, repeated elements, illogical flows and oversized low-value containers.
- [Paralect — Signs of AI slop in design](https://www.paralect.com/blog/signs-of-ai-slop-in-design): overused cards, glass, low contrast, meaningless motion and generic visual defaults.

These sources inform the design decisions above; they do not establish that PeakOS is a Windows implementation or that it has been usability-tested. The proposed tokens and PeakOS-specific component rules are original product decisions.
