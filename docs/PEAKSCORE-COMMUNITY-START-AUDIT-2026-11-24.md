# PeakScore Community — inicio de reconstrucción y auditoría

**Fecha:** 24 de noviembre de 2026  
**Rama auditada:** `feat/founder-intro`  
**Repositorio:** `PeakScore777/PeakScore`  
**Proyecto Supabase:** `PeakScore` (`avmywztnsrnyjhvbaiio`)

## Alcance de esta entrega

- Se añade una capa visual específica para `/comunidad`, aislada mediante CSS Modules.
- No se modifican mensajes, perfiles, canales ni datos de usuarios.
- No se ejecutan migraciones contra la base de datos conectada.
- No se habilitan controles administrativos que dependan de RPC ausentes.

## Auditoría de Supabase

Lectura realizada sobre el proyecto conectado:

| Métrica | Observado | Cuota Free actual |
|---|---:|---:|
| Tamaño de la base de datos | 159 MB | 500 MB |
| Objetos de Storage (suma de metadata) | 1.153 GB aprox. | 1 GB |
| Usuarios registrados en Auth | 24 | 50.000 MAU |
| Mensajes mensuales de Realtime | No expuesto por la consulta SQL usada | 2 millones |
| Conexiones pico de Postgres Changes | No expuesto por la consulta SQL usada | 200 |
| Egress mensual | No verificado | 5 GB |
| Logs ingeridos | No verificado | 1 GB |

La suma de objetos por bucket fue:

- `reference-pdfs`: 778.6 MB
- `orby-knowledge`: 235.6 MB
- `question-images`: 77.5 MB
- `lesson-atom-media`: 61.3 MB
- `bug-report-screenshots`: 0.33 MB
- Los buckets de comunidad consultados no tienen objetos.

**Diagnóstico:** el exceso más probable es Storage (aprox. 153 MB por encima de 1 GB, según el tamaño de metadata de los objetos). No es una medición del contador de facturación del panel. La base de datos está por debajo de su cuota. No se debe eliminar contenido de `reference-pdfs` ni `orby-knowledge` sin revisar referencias, uso y copias.

La tabla de precios oficial consultada el 24-11-2026: https://supabase.com/pricing

## Estado real del modelo de comunidad

- `community_channels`: 12 canales globales, sin `community_id` ni `channel_type`.
- `community_role_catalog`: roles `administrador`, `moderador` y `profesor`.
- `community_member_roles`: 0 asignaciones.
- No existen `private.community_founder_config`, `private.community_founder_control` ni `private.community_member_restrictions`.
- No existen los RPC remotos `bootstrap_community_founder`, `manage_community_member_role` ni `moderate_community_member` que las rutas actuales esperan.
- El único perfil con `profiles.role = 'admin'` es un dato agregado de control; no se usa en el cliente como autorización.

## Bloqueo de Founder

La ruta actual `app/api/community/roles/route.ts` exige `COMMUNITY_FOUNDER_USER_ID` y llama a `bootstrap_community_founder`. Esa variable no aparece en el listado de variables de `peak-score` consultado sin descifrar valores. El RPC tampoco existe actualmente en el proyecto remoto.

Por tanto, la asignación de roles no está lista para producción y el código actual falla cerrado. No debe mostrarse una consola de founder operativa hasta reparar el modelo y validar la identidad del fundador de forma segura en PostgreSQL.

## Historial de migraciones

- El árbol de `feat/founder-intro` contiene 193 archivos SQL.
- El proyecto remoto devuelve 192 registros de migración.
- Hay diferencias entre los timestamps de archivos locales y los registros remotos (aunque varios nombres de migración coinciden).
- El branch contiene tres pares de archivos con el mismo prefijo de versión: `20261121020000`, `20261123010300` y `20261123011500`.
- Las migraciones de autoridad del founder y guardrails no están instaladas en el proyecto remoto.
- La migración de founder inicial y la de guardrails crean estructuras distintas para `private.community_member_restrictions`; no se deben aplicar secuencialmente sin consolidar el diseño.

**Decisión:** no ejecutar `supabase db push` ni aplicar DDL manual sobre el proyecto activo hasta reconciliar versiones y dependencias. No existe una rama de base de datos de desarrollo en el proyecto Free consultado.

## Modelo objetivo

### Autoridad global

- **Founder:** única autoridad sobre el sistema; asigna y retira roles, crea y configura canales globales y espacios PreICFES.
- **Administrador:** moderación de la comunidad global; expulsar y aplicar timeout con motivo y duración. Sin permisos para roles, canales, fondos ni configuración.
- **Docente:** participa, publica material en espacios habilitados y puede ser anfitrión de clases según permisos de canal. Sin moderación ni administración global.
- **Estudiante:** participa y asiste; sin administración.
- **Colaborador PreICFES:** puede expulsar y aplicar timeout únicamente en la comunidad PreICFES asignada; no puede administrar otras comunidades.

### Comunidades y canales

El esquema actual modela una única comunidad global. Para habilitar PreICFES independientes hace falta un identificador de espacio y membresía por espacio. La implementación debe incorporar:

- `community_spaces`: comunidad global y espacios PreICFES.
- `community_space_members`: miembros y rol contextual por espacio.
- `community_channels.space_id`: pertenencia de canal a un espacio.
- `community_channel_permission_overrides`: allow/deny por rol o miembro.
- `channel_type`: texto, anuncios, foro, multimedia, voz, escenario y clase.
- Apariencia por canal: icono, banner/fondo, color de acento y descripción.
- Registro de auditoría de asignaciones, expulsiones, timeout, cambios de canal y fondos.

La autorización debe vivir en funciones SQL/RLS y APIs de servidor. Ocultar botones no es una barrera de seguridad. Un colaborador no puede obtener permisos globales por tener un rol en un espacio PreICFES.

## Próximos hitos técnicos

1. Consolidar una sola fuente de verdad para fundador y restricciones; corregir migraciones duplicadas y firmar el historial remoto.
2. Probar RLS y permisos de founder/admin/docente/estudiante en un entorno aislado.
3. Añadir comunidades PreICFES y roles con alcance por espacio.
4. Añadir el centro visual de administración: miembros, roles, permisos, canales, categorías y personalización.
5. Incorporar foros, hilos, anuncios, eventos y funciones de búsqueda.
6. Evaluar voz/video/compartir pantalla con un SFU y cuotas gratuitas verificadas antes de elegir proveedor.
7. Ejecutar pruebas de seguridad, carga, accesibilidad, móvil, lint y build.

## Criterios de seguridad

- Founder no puede ser removido ni moderado por otros roles.
- Admin no puede moderar otros administradores, docentes con privilegios o founder.
- Colaborador sólo opera dentro del espacio que tiene asignado.
- Docentes y estudiantes no reciben permisos de moderación ni gestión.
- Los permisos se verifican en PostgreSQL/API, no en estado del navegador ni `user_metadata`.
- Toda acción sensible requiere motivo y genera auditoría.
- Archivos y fondos de canal usan rutas privadas o URLs firmadas y límites de tamaño.
- Nada se borra de Storage para resolver la cuota sin un análisis de referencias.


## Actualización de implementación — 24 de noviembre de 2026

La rama `feat/founder-intro` contiene ahora una primera implementación de:
- Panel de founder con pestañas para miembros, roles, canales y espacios PreICFES.
- Catálogo de roles con jerarquía, insignia, color, separación de miembros y capacidades limitadas a lectura, escritura, adjuntos y reacciones.
- Administración de canales globales y por espacio: crear, editar, archivar, categoría, orden, tipo, icono, color, privacidad y solo lectura.
- Espacios PreICFES con membresía propia y roles contextuales, incluido `colaborador` que no se puede asignar como rol global.
- Moderación limitada al espacio: timeout, kick y restauración; el timeout conserva lectura pero bloquea escritura, adjuntos y reacciones.
- Navegación lateral de espacios disponibles, contadores/listados de miembros por espacio y enlaces que conservan el espacio.
- Sesiones en vivo con `space_id`: global para Profesor PeakScore y PreICFES para docentes asignados.
- Edición de mensajes y búsqueda/resolución de menciones limitadas al espacio.

Migraciones nuevas (todavía no aplicadas):
1. `20261124230000_peakscore_community_authority_consolidated.sql`
2. `20261124230100_community_role_and_channel_control.sql`
3. `20261124230200_community_spaces_and_preicfes_isolation.sql`
4. `20261124230300_community_live_sessions_space_scope.sql`

Pruebas contractuales añadidas al script `npm test`:
- `community-founder-studio`
- `community-spaces`
- `community-live-spaces`

**Estado de validación:** el último intento de build disponible llegó a ejecutar la suite existente y falló en una aserción de texto del panel Founder; esa aserción se corrigió. Vercel está limitando nuevos builds y no hay aún un build posterior que confirme lint/TypeScript y las nuevas pruebas. No afirmar compilación correcta hasta obtener un despliegue verificable.

**No se ha cambiado producción:** las tablas, políticas, RPC ni los datos remotos de Supabase permanecen en el estado auditado arriba. Antes de aplicar estas migraciones hay que reconciliar el ledger de versiones y probar en una base aislada.
