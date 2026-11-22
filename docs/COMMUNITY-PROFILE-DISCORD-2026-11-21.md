# PeakScore Community — Discord-style profile and editor
**Last updated:** 2026-11-21  
**Working branch:** `feat/founder-intro`  
**Scope:** Public member profile, profile editor, responsive layout, visual QA notes.

## Design target

Use Discord as the interaction and information-hierarchy reference, not as a pixel-for-pixel brand copy. Preserve PeakScore / GameCode identity and typography while using Discord's dark community language:

- Near-black application surfaces and charcoal cards; avoid bright blue/purple panels as default surfaces.
- Clear separation between banner, avatar, identity/actions, presence, role badges, about section, and member metadata.
- Compact, deliberate borders and button states; hover and pressed feedback should feel immediate.
- The profile editor must behave as a real full-screen workspace. Controls and live preview must never overlap, clip, or collapse into a narrow strip.
- Keep community identity independent from academic progress and PeakStyle.

## Screenshot audit — 2026-11-21

The supplied editor screenshot showed a critical layout failure:

- The editor content occupied only a narrow strip on the left of a large black viewport.
- The preview card intruded into the controls column and text/sections were visibly overlapping.
- The editor's pending-migration notice remained visible, warning that visual appearance fields were not fully persisted in the connected Supabase database.

The public-profile reference screenshot is the target structure: wide dark modal, panoramic banner, avatar overlapping the banner/body boundary, action controls aligned to the right, display name and presence beneath, roles grouped as their own section, then About and member facts.

## Changes committed to `feat/founder-intro`

### Public member profile
- Refined the banner treatment with restrained metadata labels and a dark gradient overlay.
- Increased visual separation between banner and profile body.
- Tightened avatar, action, display-name, member-number, and presence hierarchy.
- Added a dedicated `ROLES DE COMUNIDAD` label around existing role badges.
- Refined About and member-facts surfaces using near-black/charcoal colors.
- Added restrained hover/pressed feedback to profile actions and a subtle banner image scale transition.
- Preserved existing profile data, role colors, status, member number, and existing close/mention/edit/copy behaviors.

### Profile editor — centered Discord-style modal
- Replaced the incorrect full-viewport editor with a centered modal mounted over the existing community page.
- Added a full-screen dimmed, lightly blurred backdrop so the community remains visible around the dialog.
- Desktop dialog is bounded to `min(1120px, calc(100vw - 56px))` wide and `min(790px, calc(100dvh - 56px))` high, with rounded corners, border and deep shadow.
- Rebuilt the modal interior as a 252px settings sidebar plus a flexible main editor column; the obsolete desktop rail is hidden so it cannot create an extra implicit grid row.
- Set the controls and preview grid columns to `minmax(0, ...)` to prevent intrinsic content from forcing overflow.
- At widths up to 980px, stack the preview after the controls instead of squeezing both columns.
- At widths up to 680px, use a near-full-screen mobile dialog with the desktop sidebar hidden and controls/preview stacked.
- At widths up to 760px, hide the desktop sidebar, let the editor use the full width, stack the controls, and keep the preview in normal document flow after them.
- Preserve the fixed save bar on narrow viewports and allow reduced-motion preferences to disable transitions.

### Contract test
- Updated `tests/community-profile-studio-contract.test.mjs` to assert the new full-width editor, main-column placement, stacked preview behavior, and mobile single-column layout.
- The test is a source-level contract check. It has not yet been executed in a local checkout during this task.

## Relevant files

- `app/comunidad/page.tsx` — public profile markup and community profile modal.
- `components/community/CommunityProfileStudio.tsx` — full-screen profile editor, inputs, uploads, live preview, appearance selectors, and save flow.
- `app/globals.css` — profile surfaces, editor layout, responsive rules, and interaction states.
- `tests/community-profile-studio-contract.test.mjs` — profile/editor source contracts.
- `supabase/migrations/20261121223000_community_profile_studio_appearance.sql` — banner, card color, nameplate, accent and avatar-frame fields plus banner bucket.
- `supabase/migrations/20261121225000_community_profile_member_number.sql` — stable public member number.
- `supabase/migrations/20261121235000_community_profile_cosmetics_and_status.sql` — avatar decorations, profile frames/effects and expiring status.

## Supabase deployment requirement

The editor is rendered through a body portal inside a centered modal and currently checks `appearanceReady`. If the database has not received the community appearance migrations, it displays a warning and the visual settings cannot be guaranteed to persist. The migration files exist in this branch, but this task did **not** execute them against the user's Supabase project.

Before calling appearance persistence complete:
1. Confirm the Supabase project linked to this deployment is the intended project.
2. Review the three migrations listed above in order.
3. Apply the migrations through the project's approved Supabase migration workflow.
4. Re-open the editor, change a harmless visual setting, save, reload the profile, and verify the value survives a fresh API read.
5. Confirm storage upload and delete flows for avatar and banner.

Do not claim database persistence is fixed until that round-trip succeeds.

## Validation and deployment status

- GitHub writes were made to `feat/founder-intro`.
- The previous Vercel status observed for this branch reported `build-rate-limit`; that is a provider/build quota failure, not proof of a source-code failure.
- No successful Vercel build or live browser verification is claimed in this change log.
- Run `npm run test:community-profile-studio`, `npm run lint`, and `npm run build` when the build quota is available. Note that `npm run build` already runs the repository test and lint pipeline before `next build`.

## Acceptance checklist

- [ ] Editor opens as a centered, bounded Discord-style modal with the community visible around it.
- [ ] Modal sidebar and main workspace have distinct, stable columns.
- [ ] Controls and preview never overlap at desktop, tablet, or mobile widths.
- [ ] On narrow widths, controls appear first and preview follows below.
- [ ] Banner/avatar upload, remove, crop, and preview continue working.
- [ ] Save and reload preserves name, status, about, accent, avatar frame, profile frame, effect, and nameplate.
- [ ] Supabase migrations are applied to the correct project and round-trip verified.
- [ ] Community profile contract tests, lint, and production build pass.
- [ ] Compare the live profile against the supplied Discord reference: banner/avatar overlap, action alignment, identity/presence hierarchy, role group, and About/member facts.


## 2026-11-21 — Discord-style identity editor refactor

- Rebuilt the editor interior into three columns: identity controls on the left, the live profile preview in the center, and profile tabs/content on the right.
- Removed the duplicate standalone banner editor card; banner actions now appear over the actual banner on hover/focus, with change and remove actions.
- Replaced the generic preview bubble with an editable status bubble on the actual preview.
- Added right-side profile, activity, and connections tabs to mirror the structure visible in the supplied Discord references.
- Removed redundant accent swatches from the color section; retained the direct color picker and hexadecimal input.
- Kept the existing avatar upload/crop, avatar decoration, profile frame/effect, member plate, profile fields, and save/reset behavior.
- Darkened the surfaces to Discord-like near-black layers and reduced card borders, radii, and generic panel styling.


## 2026-11-21 — Corrección estructural tras revisión visual

- Se elimina del JSX el panel permanente de Actividad/Conexiones; no se renderizan pestañas ni una columna social vacía.
- La estructura principal queda en dos columnas: navegación de identidad a la izquierda y vista previa real del perfil en el centro.
- Se elimina la columna permanente de controles. Los controles de cada categoría se abren como un panel contextual superpuesto solo al pulsar la categoría izquierda; al cerrar, queda el perfil como protagonista.
- Todas las categorías (incluido Banner) abren el mismo panel contextual. Ya no se intenta hacer scroll hacia un banner oculto.
- El perfil central se amplía y se centra; se ajustan el banner, avatar, tarjeta y espacios para aprovechar mejor el modal.
- Se añaden transiciones breves para apertura de controles, entrada del perfil, hover del banner y estados activos/pulsados de botones.
- Se añadió una prueba de contrato que exige dos columnas, ausencia de Actividad/Conexiones y apertura contextual de controles.
- La comprobación del estado de CI sigue mostrando el bloqueo de Vercel por build-rate-limit; no se afirma que el build ni la vista en navegador hayan pasado.


## 2026-11-21 — Segunda corrección visual: proporciones compactas

Revisión basada en las capturas adjuntas del editor de Discord, en particular las vistas del modal de edición, selector de avatar, selector de decoración y selector de marco.

- El modal de escritorio queda limitado a 980 × 720 px como máximo, con márgenes visibles alrededor; deja de crecer hasta ocupar casi todo el navegador.
- La navegación izquierda queda en 218 px.
- La tarjeta de perfil central queda limitada a 390 px, con banner de 142 px y avatar de 84 px. Se elimina el perfil exageradamente ancho.
- Se conserva la estructura de dos columnas: navegación y perfil. No se reintroducen Actividad ni Conexiones.
- Los controles contextuales se mantienen ocultos fuera de pantalla hasta seleccionar una categoría y entran como panel superpuesto.
- En pantallas pequeñas el editor pasa a ocupar el viewport para conservar usabilidad móvil.
- Se añadió una prueba de contrato que verifica los límites de ancho/alto, el ancho de la tarjeta y el comportamiento del panel contextual.
- Las referencias oficiales de Discord describen la edición por campos (avatar, decoración, efecto, banner, Sobre mí y tema) y selectores separados para aplicar cada personalización; el diseño de PeakScore conserva esa organización sin copiar marca ni elementos exclusivos de Nitro.


## 2026-11-21 — Pulido de perfil, estado personalizado y microinteracciones

### Referencias investigadas
- Discord Custom Profiles: https://support.discord.com/hc/en-us/articles/4403147417623-Custom-Profiles
- Discord Profile Effects: https://support.discord.com/hc/en-us/articles/17828465914263-Profile-Effects
- Discord Avatar Decorations FAQ: https://support.discord.com/hc/en-us/articles/13410113109911-Avatar-Decorations-FAQ
- GitHub Primer Button Guidelines: https://primer.style/product/components/button/guidelines/
- GitHub Primer Tooltip: https://primer.style/product/components/tooltip/
- GitHub Primer motion tokens: https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md

### Cambios de UI
- Se amplía la altura de escritorio del modal a un máximo de 800 px, manteniendo su ancho máximo de 980 px y el menú lateral estrecho.
- La tarjeta de perfil central conserva un ancho máximo de 390 px, pero gana altura vertical, banner de 156 px y cuerpo de 382 px para una composición más cercana a las proporciones verticales de Discord.
- El estado personalizado ahora se presenta como una burbuja editable junto al avatar, con puntero, texto recortado con ellipsis y lápiz visible en hover/foco.
- El editor de estado ahora presenta la identidad del usuario, una previsualización en vivo, campo con contador 0–80, selección rápida de emoji y duración del estado (30 min, 1 h, 4 h, hoy o nunca).
- Las vistas previas de decoraciones usan el avatar real y capas CSS animadas; las tarjetas de marcos y efectos usan miniaturas gráficas, no glifos genéricos como # o una estrella.
- Botones y controles incorporan hover, active, focus-visible y disabled; se respeta prefers-reduced-motion.
- Se conserva la marca y los nombres de cosméticos de PeakScore; se reproducen patrones de interacción y jerarquía, no los assets propietarios ni la identidad gráfica de Discord.

### Verificación
- Se añadieron pruebas de contrato para el estado personalizado, selector de emoji, contador, duración, previsualización de cosméticos, dimensión vertical y accesibilidad de botones.
- Las pruebas se añadieron al repositorio, pero no se ejecutaron en un entorno local de compilación en esta sesión.
- El estado de Vercel debe consultarse para el último commit; no se declara build ni validación visual en navegador hasta obtener evidencia.
