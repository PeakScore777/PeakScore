# PeakScore — bloqueo de reconciliación de migraciones

**Fecha de verificación:** 25 de noviembre de 2026  
**Repositorio y rama:** `PeakScore777/PeakScore` · `feat/founder-intro`  
**Proyecto Supabase:** `avmywztnsrnyjhvbaiio`

## Conclusión ejecutiva

**No ejecutar `supabase db push` ni aplicar las cuatro migraciones nuevas en el proyecto conectado todavía.** El historial local y el ledger remoto no representan la misma secuencia de versiones. Un push directo podría intentar ejecutar otra vez cambios históricos o aplicar una migración sobre una estructura distinta de la esperada.

## Comparación observada

| Fuente | Registros |
|---|---:|
| Archivos `.sql` locales | 197 |
| Versiones locales únicas | 194 |
| Registros en el ledger remoto | 192 |
| Nombres de migración presentes en ambos lados | 133 |
| Nombres compartidos con timestamp distinto | 93 |
| Archivos locales sin nombre coincidente en el ledger | 64 |
| Registros remotos sin archivo local con el mismo nombre | 60 |

Tres timestamps están duplicados en el directorio local:

| Versión duplicada | Archivos |
|---|---|
| `20261121020000` | `community_founder_moderation_guardrails`, `community_independent_member_profiles` |
| `20261123010300` | `community_display_name_animation`, `community_display_name_entrance_animation` |
| `20261123011500` | `community_display_name_shuffle_animation`, `refine_community_fuzzy_text_typography` |

También existen migraciones con el mismo nombre en ambos lados, pero con versiones diferentes. Ejemplos:

| Archivo local | Versión remota registrada |
|---|---|
| `harden_questions_constraints` | `20261003202631` |
| `grant_service_role_simulation_crud` | `20261003213532` |
| `add_shared_image_to_english_question_sets` | `20261016194038` |
| `add_lesson_questions_editor` | `20261020213031` |
| `community_independent_member_profiles` | `20261121161520` |

Los timestamps anteriores se obtuvieron comparando el prefijo de cada archivo local con `version` del ledger remoto y emparejando por nombre de migración. No se debe renombrar un archivo aislado para “hacer coincidir” el ledger: eso no demuestra que el SQL local sea idéntico al que se ejecutó en producción.

## Estado del esquema remoto

La consulta de metadatos al proyecto conectado confirma que aún no existen:

- `public.community_spaces`
- `public.community_space_members`
- `public.community_space_member_roles`
- `community_channels.space_id`
- `community_live_sessions.space_id`

El proyecto sí conserva políticas RLS permisivas antiguas para mensajes, comentarios, reacciones y canales. Las nuevas migraciones agregan políticas restrictivas adicionales para protegerlas; esas políticas no están activas mientras la migración no se aplique.

## Migraciones de la nueva comunidad

El orden de dependencia de la implementación es:

1. `20261124230000_peakscore_community_authority_consolidated.sql`
2. `20261124230100_community_role_and_channel_control.sql`
3. `20261124230200_community_spaces_and_preicfes_isolation.sql`
4. `20261124230300_community_live_sessions_space_scope.sql`

La segunda depende de la primera; la tercera depende de las tablas y funciones de las dos anteriores; la cuarta depende de `community_spaces` y de las funciones de permisos por espacio.

## Procedimiento seguro antes de producción

1. Generar y conservar un backup verificable del proyecto Supabase.
2. Exportar el ledger remoto completo y el esquema actual; no basarse solo en el nombre de los archivos.
3. Recuperar del historial Git la versión exacta del SQL que se aplicó para cada una de las 133 migraciones con nombre coincidente y comparar contenido, no solo timestamps.
4. Identificar las migraciones remotas sin archivo local y las locales sin entrada remota; decidir individualmente si son cambios aplicados con otro nombre, cambios faltantes o archivos retirados.
5. Resolver las tres colisiones de versión local y corregir el historial en una rama de trabajo sin alterar el ledger remoto todavía.
6. Probar las cuatro migraciones nuevas, en ese orden, sobre una base aislada con la misma estructura que producción.
7. Aplicar en producción únicamente después de validar el plan de migración y la compatibilidad del esquema.

## Estado de la rama

La implementación de Founder, espacios PreICFES, roles contextuales, canales, moderación, archivos, menciones y Live está en GitHub. Los contratos de pruebas cubren el aislamiento por espacio y el acceso a canales privados, incluidas las políticas restrictivas que bloquean permisos heredados.

**Importante:** que los tests contractuales pasen no equivale a haber ejecutado las migraciones contra PostgreSQL ni prueba por sí solo el comportamiento real de RLS. La DB conectada sigue sin cambios por esta implementación.
