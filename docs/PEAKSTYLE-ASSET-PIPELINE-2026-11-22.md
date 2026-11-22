# PeakStyle — producción gradual de cosméticos de perfil

**Fecha:** 2026-11-22  
**Rama:** \`feat/founder-intro\`

## Objetivo

Construir un sistema de cosméticos original de PeakScore con calidad de acabado, respuesta y movimiento comparable a productos sociales maduros. No copiar arte, marcas, iconos, assets ni textos de Discord. La referencia es su nivel de pulido, no sus recursos protegidos.

## Arquitectura existente (no duplicar)

PeakScore ya tiene un catálogo funcional de cosméticos en \`public/profile-cosmetics/\`, la tienda \`/perfil/estilo\`, el perfil público \`/perfil/ver/[userId]\`, endpoints de catálogo/compra/equipamiento y migración \`20261121019000_peakstyle_profile_cosmetics.sql\`.

Los slots existentes son:
- \`avatar_frame\`
- \`profile_banner\`
- \`profile_effect\`
- \`nameplate\`
- \`profile_theme\`

El registro \`public/community/peakstyle/manifest.json\` apunta a los assets existentes. No crear una segunda tienda, una segunda tabla de inventario ni otro sistema de equipamiento para el editor de identidad comunitaria.

## Herramientas de producción

| Pieza | Herramienta sugerida | Export final |
|---|---|---|
| Arte vectorial, marcos y placas | Figma / Illustrator / Inkscape | SVG sanitizado + PNG/WebP poster |
| Movimiento vectorial e interacciones | Rive | archivo Rive + poster estático |
| Motion graphics y composición | After Effects | Lottie JSON revisado o WebM |
| Partículas y elementos 3D | Blender | WebM VP9 con alpha + poster |
| Optimización | Squoosh / herramientas locales | WebP / WebM optimizado |

No afirmamos conocer el pipeline privado de Discord. Esta es la cadena de producción elegida para PeakScore.

## Especificaciones por categoría

### Marcos de avatar
- Artboard de trabajo: 1024 × 1024 px, transparencia.
- Mantener una zona segura central para que el marco no tape cara ni avatar.
- Probar a 32, 40, 48, 64, 96 y 128 px.
- Exportar SVG o WebP estático; si hay movimiento, Rive/WebM separado y fallback.

### Banners
- Composición horizontal 3:1 o adaptada al tamaño real del perfil.
- No incrustar nombre, avatar ni controles en el arte.
- Movimiento de fondo sutil, sin desplazar texto ni botones.
- Usar poster estático y cargar el loop solo en perfil visible.

### Efectos de perfil
- Capa independiente del banner, avatar y contenido.
- Efectos de entrada cortos, con inicio y fin claros; no bucles intrusivos.
- Partículas detrás del texto; elementos delanteros deben tener máscara y límites.
- No ejecutar en filas, miniaturas ni listas de miembros.

### Nameplates
- Artboard de trabajo: 1200 × 240 px.
- El nombre real sigue siendo texto HTML accesible y seleccionable.
- Reservar una zona segura para nombres largos, acentos y distintos tamaños.

### Temas
- Usar tokens validados, no hojas CSS arbitrarias ni código subido por usuarios.
- Mantener contraste legible para texto, estados y controles.

## Cómo crear cada cosmético de forma gradual

1. Elegir una sola categoría y definir el concepto visual.
2. Crear el arte fuente y su versión estática final.
3. Revisar transparencias, bordes, recortes, contraste y legibilidad en el perfil real.
4. Crear movimiento solo si aporta valor; no añadir partículas por decorar.
5. Exportar poster y fallback de movimiento reducido.
6. Añadir el archivo a \`public/profile-cosmetics/<categoria>/\`.
7. Registrar metadatos en \`public/community/peakstyle/manifest.json\`.
8. Añadir el mismo ID a la migración/catálogo existente de PeakStyle.
9. Probar vista previa, compra con PeakCoins si aplica, equipar, quitar y perfil público.
10. Ejecutar pruebas y verificar Vercel antes de publicar.

## Composición de capas del perfil

1. Base y tema del perfil.
2. Banner.
3. Efecto de fondo.
4. Contenido e identidad.
5. Marco del avatar y avatar.
6. Nameplate y texto real.
7. Roles, estado y controles.

Los elementos decorativos no deben capturar clicks (\`pointer-events: none\`). Mantener los controles interactivos por encima de las capas visuales.

## Movimiento y sensación de vida

- Microinteracciones en hover, focus, pressed, selección y guardado.
- Transiciones breves de opacidad/transform; evitar animar layout.
- Efectos grandes solo en la vista principal y solo cuando está visible.
- Pausar al cerrar el modal, salir del viewport o esconder la pestaña.
- Respetar \`prefers-reduced-motion\` con poster/fallback estático.
- Evitar parpadeo, flashes, blur masivo y partículas ilimitadas.

## Seguridad y rendimiento

- Assets servidos desde el mismo origen y allowlist del catálogo.
- Nunca ejecutar scripts remotos ni SVG/Lottie arbitrarios subidos por usuarios.
- Sanitizar/revisar SVG y limitar tamaño, duración, dimensiones y complejidad.
- Lazy-load de animaciones; miniaturas siempre estáticas.
- Preferir transform y opacity para composición.
- Mantener inventario privado separado de equipamiento público.
- Conservar las verificaciones de ownership y RLS del sistema existente.

## Inventario visual existente al 22-11-2026

El repositorio ya contiene siete SVG originales estáticos:
- Marcos: Aurora Pixel, Forja legendaria.
- Banners: Grieta celestial, Circuito esmeralda.
- Efectos (actualmente estáticos): Lluvia estelar, Explosión de píxeles.
- Nameplate: Founder Tech.
- Temas definidos como tokens: Midnight Arcade, Ember Vault.

**Importante:** los siete SVG no contienen animación interna. Los dos efectos son prototipos estáticos; su movimiento real será una fase posterior. No anunciar animaciones hasta que existan exports animados y estén probados en runtime.

## Estado del editor de identidad comunitaria

El editor \`CommunityProfileStudio\` configura identidad y vista previa. PeakStyle es el sistema separado que gestiona el inventario visual. El editor no debe duplicar tienda, monedas o inventario.

La sustitución de widgets de videojuegos por identidad comunitaria es un cambio parcial del panel lateral, no una afirmación de que toda la experiencia ya iguala a Discord. El siguiente trabajo de producto debe validar la experiencia completa en navegador: modal, navegación, preview, estado, hover, teclado, responsive y perfil público.
