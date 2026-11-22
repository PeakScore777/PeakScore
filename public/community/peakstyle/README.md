# PeakStyle — biblioteca de arte

**La fuente real de los cosméticos visuales es \`public/profile-cosmetics/\`.** Este registro describe esos archivos y permite agregar diseños nuevos sin inventar una segunda tienda o catálogo.

## Carpetas reales

- \`public/profile-cosmetics/frames/\`: marcos de avatar.
- \`public/profile-cosmetics/banners/\`: fondos del perfil.
- \`public/profile-cosmetics/effects/\`: efectos visuales del perfil.
- \`public/profile-cosmetics/nameplates/\`: placas detrás del nombre.
- Los temas de perfil se definen mediante tokens en la migración de PeakStyle.

El registro central está en \`public/community/peakstyle/manifest.json\`, pero sus rutas de arte apuntan al catálogo real de \`public/profile-cosmetics/\`.

## Cómo agregar un diseño

1. Crear el original y conservar el archivo fuente editable fuera del runtime.
2. Exportar una versión estática optimizada.
3. Si lleva movimiento, producir el archivo animado y una alternativa estática.
4. Guardar los exports en la carpeta real correspondiente.
5. Registrar el ID, categoría, ruta, poster, formato y fallback en el manifest.
6. Agregar el item a la migración/catálogo de PeakStyle con el mismo ID y slot.
7. Verificar ownership, preview, equipar/quitar, perfil público y pruebas de contrato.
8. Publicarlo solo cuando la pieza visual esté revisada.

Los assets SVG sembrados actualmente son estáticos. Los efectos llamados “Lluvia estelar” y “Explosión de píxeles” todavía son prototipos estáticos; no se deben anunciar como animaciones terminadas.
