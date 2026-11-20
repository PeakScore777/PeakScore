# PeakScore Community — Foundation

**Fecha:** 2026-11-20  
**Rama:** `feat/peakscore-community-foundation`  
**Repositorio:** `PeakScore777/PeakScore`

## Objetivo del primer lanzamiento

Construir una comunidad global estilo Discord integrada en la cuenta actual de PeakScore. Esta primera entrega se limita a canales de texto, mensajes, reacciones y presencia. No incluye todavía marketplace, pagos, Drive, videos ni streaming.

## Decisiones de producto

- Una comunidad global de PeakScore.
- Categorías iniciales: Comunidad, Materias, Profesores y Aulas y eventos.
- Los espacios privados de profesores se añadirán después como una extensión del mismo modelo.
- Los usuarios conservan su cuenta y perfil actual de PeakScore.
- El rol global actual de `profiles` no se modifica en esta fase.
- Los permisos de moderación avanzados se incorporarán con un sistema de roles propio, separado del perfil editable.

## Primera migración

`20261120183000_peakscore_community_foundation.sql`

Crea:
- `community_channels`: canales de la comunidad y sus categorías.
- `community_messages`: mensajes con autor, canal, fecha y límite de 2.000 caracteres.
- `community_reactions`: reacciones limitadas y únicas por usuario/mensaje.

Incluye índices, restricciones, grants mínimos, RLS en las tres tablas y canales iniciales. Los usuarios autenticados pueden leer canales activos, publicar en canales abiertos, borrar sus propios mensajes y gestionar sus propias reacciones. Los canales son de solo lectura para clientes; su administración se implementará en servidor con autorización verificada.

La migración incorpora mensajes y reacciones a la publicación `supabase_realtime` para habilitar la primera versión del chat en vivo. Antes de escalar a muchos miles de conexiones o mensajes por segundo, medir el uso y evaluar Realtime Broadcast privado.

## Seguridad que no se debe romper

- No usar `user_metadata` para decidir permisos.
- No exponer `service_role` ni claves secretas en el navegador.
- No permitir que el cliente se asigne roles de administrador o moderador.
- No confiar en el nombre/avatar enviados por el cliente; obtener identidad desde `auth.uid()` y unir con `profiles`.
- Toda tabla nueva en `public` debe tener RLS y grants explícitos.
- La moderación y la creación/edición de canales deben pasar por servidor y verificar permisos.
- Aplicar rate limiting a publicaciones antes de abrir la comunidad al público.

## Secuencia de implementación

1. Aplicar y verificar la migración en un entorno de desarrollo.
2. Construir `/comunidad` usando el cliente Supabase de navegador ya existente y la sesión autenticada.
3. Crear API de servidor para publicar mensajes con validación, límites y rate limiting.
4. Implementar suscripción Realtime, historial paginado, reacciones y estado de presencia.
5. Integrar el acceso a Comunidad en la navegación global existente.
6. Probar responsive en escritorio y móvil, RLS, usuarios anónimos, permisos y spam.
7. Ejecutar lint y build antes de integrar a `main`.

## Criterios de aceptación del MVP

- Solo usuarios autenticados pueden entrar y leer el chat.
- Canales agrupados por categoría y navegables en móvil y escritorio.
- Mensajes nuevos aparecen en tiempo real sin recargar.
- El historial se pagina; no descargar todos los mensajes.
- Un usuario solo puede borrar sus propios mensajes.
- Los usuarios no pueden escribir en canales archivados o de solo lectura.
- Los datos de perfil se muestran desde la tabla `profiles`, nunca desde payloads del cliente.
- Las tablas de comunidad están protegidas por RLS.
- No se modifica el sistema de autenticación ni el rol global existente.

## Estado

- [x] Rama de trabajo creada.
- [x] Migración inicial preparada en la rama.
- [ ] Migración aplicada a entorno de desarrollo.
- [ ] Interfaz de comunidad.
- [ ] Chat Realtime y presencia.
- [ ] Moderación y rate limiting.
- [ ] Pruebas de seguridad, móvil, lint y build.

**Importante:** la migración está versionada en esta rama, pero no se ha ejecutado contra la base de datos conectada. No aplicar directamente a producción sin probarla primero.
