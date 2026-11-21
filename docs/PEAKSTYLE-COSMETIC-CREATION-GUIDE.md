# PeakStyle — guía de creación de cosméticos

PeakStyle es el sistema de identidad visual de la Comunidad PeakScore. Los cosméticos se crean como recursos originales de PeakScore; no se reutilizan nombres, marcas, ilustraciones ni archivos de Discord u otros juegos.

## Categorías y ranuras

Los valores de `category` y `slot` deben coincidir exactamente:

| Categoría | Uso | Recomendación de arte |
|---|---|---|
| `avatar_frame` | Marco que rodea el avatar | SVG transparente, lienzo cuadrado 512×512; el centro debe quedar vacío |
| `profile_banner` | Fondo horizontal del perfil | SVG 1200×400, composición legible en recortes centrales |
| `profile_effect` | Efecto breve al abrir el perfil | SVG overlay, sin scripts; duración y fallback en metadata |
| `nameplate` | Placa detrás o junto al nombre | SVG horizontal 900×220 |
| `profile_theme` | Paleta de superficies y acentos | Sin imagen obligatoria; metadata con colores hex validados |

## Estructura del catálogo

Cada cosmético se registra en `public.community_profile_cosmetics`:
- `id`: identificador estable, minúsculas y guiones.
- `name` y `description`: textos cortos de interfaz.
- `category`: una de las cinco ranuras anteriores.
- `asset_path` y `preview_path`: rutas bajo `/profile-cosmetics/`.
- `price_coins`: precio entero en PeakCoins.
- `rarity`: common, rare, epic o legendary.
- `metadata`: configuración visual declarativa, nunca código ejecutable.
- `is_active` y `is_limited`: publicación y disponibilidad.

## Flujo de creación

1. Diseñar arte original por categoría y guardarlo en su carpeta correspondiente.
2. Añadir el registro al catálogo mediante migración idempotente con `ON CONFLICT (id)`.
3. Definir rareza, descripción, precio y metadata.
4. Probar preview, recorte, contraste y modo móvil.
5. Comprobar que compra, inventario y equipamiento funcionen con las RPC existentes.
6. Publicar activando `is_active` solo después de revisión.

## Seguridad y economía

- Las compras usan exclusivamente `profiles.coins` (PeakCoins).
- El servidor no acepta precio, rareza ni categoría enviados por el navegador; lee el precio del catálogo y valida la ranura en PostgreSQL.
- La compra es transaccional, bloquea la fila de saldo, evita cobros duplicados y escribe el ledger privado.
- El navegador no puede insertar ni modificar inventario/equipamiento directamente.
- Los SVG del catálogo son archivos estáticos propios, revisados en el repositorio. No se aceptan SVG aportados por usuarios ni scripts, HTML embebido o referencias externas.
- Las animaciones deben respetar `prefers-reduced-motion` y tener fallback estático.
- No crear artículos con ventajas competitivas o funciones de pago real.

## Estado de implementación

La base de datos y las RPC de catálogo, compra, inventario y equipamiento ya están definidas en `20261121019000_peakstyle_profile_cosmetics.sql`. El editor consume catálogo/inventario/equipamiento y permite comprar, equipar y retirar los artículos por categoría. La vista previa aplica el marco de avatar y banner equipados.

Pendiente antes de producción: aplicar las migraciones correspondientes en Supabase, comprobar las dependencias de seguridad de la migración PeakStyle, ejecutar `npm run test:peakstyle`, lint y build, y revisar la vista pública para que renderice todas las ranuras equipadas (efectos, nameplates y temas además de marco/banner).
