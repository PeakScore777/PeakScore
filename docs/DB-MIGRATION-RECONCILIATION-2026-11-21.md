# PeakScore — Reconciliación de migraciones (2026-11-21)

## Alcance

- Repositorio: `PeakScore777/PeakScore`
- Rama de reparación: `repair/db-migration-reconciliation-2026-11-21`
- Proyecto Supabase: `avmywztnsrnyjhvbaiio`
- Rama base: `feat/founder-intro`

## Resultado de inventario verificado

| Comprobación | Resultado |
|---|---:|
| Archivos SQL de migración en GitHub | 208 |
| Registros de migración en Supabase | 181 |
| Pares versión + nombre alineados exactamente | 181 |
| Migraciones exclusivas de GitHub | 27 |
| Migraciones remotas sin archivo correspondiente | 0 |
| Versiones duplicadas en GitHub | 0 |
| Nombres duplicados en GitHub | 0 |
| Nombres duplicados en el historial remoto | 1 |

## Cambios realizados en esta rama

1. Se creó una rama aislada; no se modificó `main` ni `feat/founder-intro`.
2. Se alinearon 84 nombres de archivo con las versiones que Supabase ya registra para las mismas migraciones.
3. Se recuperaron desde `supabase_migrations.schema_migrations.statements` las 60 migraciones que inicialmente no tenían archivo local.
4. Se restauró también la segunda entrada histórica de `orby_knowledge_chunk_capacity` (`20261102215659`), porque Supabase conserva dos versiones distintas con el mismo nombre.
5. Se resolvió la colisión de versión de `community_independent_member_profiles`.
6. Se corrigió la familia de migraciones de autoridad comunitaria:
   - fuente única del fundador: `private.community_founder_config`;
   - helper de fundador delegado a la función canónica;
   - esquema común de restricciones y auditoría;
   - una sola definición de `moderate_community_member`;
   - duración de timeout consistente con la ruta API (hasta 28 días).

## Migraciones exclusivas de GitHub

Estas 27 migraciones no aparecen en el historial remoto y requieren comparación individual contra el esquema real antes de aplicar ninguna:

- `20261018130000_add_intro_onboarding_to_profiles.sql`
- `20261020160000_orby_credit_system.sql`
- `20261022200000_add_shared_lesson_media_admin_controls.sql`
- `20261023120000_add_game_progress.sql`
- `20261024140000_grant_service_role_game_tables.sql`
- `20261031130000_orby_icfes_scope_learning_and_admin_knowledge.sql`
- `20261101130000_orby_knowledge_brain_v3.sql`
- `20261107050000_orby_teaching_board_persistence.sql`
- `20261107060000_orby_voice_board_idempotency.sql`
- `20261107070000_orby_board_visual_persistence.sql`
- `20261108160000_expand_omegax_study_resource_types.sql`
- `20261109030000_orby_multipage_board_v3_persistence.sql`
- `20261109040000_cloudflare_ai_daily_neuron_budget.sql`
- `20261110010000_orby_voice_image_persistence.sql`
- `20261111020000_remove_orby_image_count_limit.sql`
- `20261113180000_orby_continuous_board_expansion.sql`
- `20261116023000_archivo_oculto_suspect_dossiers_pro.sql`
- `20261117120000_archivo_oculto_case_records.sql`
- `20261117143000_archivo_oculto_document_presentation.sql`
- `20261121013500_community_role_privacy_projection.sql`
- `20261121014000_harden_community_live_session_ownership_and_definer_paths.sql`
- `20261121015000_community_message_metrics_rpc.sql`
- `20261121017000_community_message_editing_and_mentions.sql`
- `20261121018000_community_founder_authority_and_moderation.sql`
- `20261121019000_peakstyle_profile_cosmetics.sql`
- `20261121020000_community_founder_moderation_guardrails.sql`
- `20261121028000_community_member_profile_banners.sql`

## Migraciones remotas sin archivo local

Ninguna. Todos los registros remotos tienen ahora un archivo con la misma versión y nombre.

## Duplicado histórico remoto

- `20261102215659_orby_knowledge_chunk_capacity`
- `20261106021730_orby_knowledge_chunk_capacity`

El historial contiene dos entradas `orby_knowledge_chunk_capacity` con versiones diferentes. Se conservan ambas porque corresponden a dos registros remotos reales, aunque su SQL tenga el mismo efecto.

## Validaciones

- Sin versiones duplicadas en el árbol local.
- Sin nombres duplicados en el árbol local.
- Los 181 registros remotos tienen archivos correspondientes por versión y nombre.
- Se recuperó el SQL desde el historial interno de Supabase; no se inventó ni se reconstruyó de memoria.
- Las migraciones comunitarias se sometieron a revisión estática.
- No se ejecutó ninguna migración en Supabase de producción durante esta reparación.

## Bloqueos antes de producción

1. Las 27 migraciones exclusivas de GitHub deben compararse con los objetos, funciones y políticas que ya existen en producción. Algunas pueden ser cambios no aplicados; otras podrían haberse aplicado manualmente.
2. Las migraciones de fundador/moderación deben probarse en una base aislada.
3. Alinear el historial de archivos no demuestra que sea seguro ejecutar `supabase db push`: primero debe comprobarse el efecto real de cada migración pendiente.

## Próximo paso seguro

Comparar las 27 migraciones locales exclusivas con el esquema actual, identificar dependencias y orden, y probar el conjunto validado en una base aislada antes de preparar un plan de producción.


## Auditoría de las 27 migraciones exclusivas contra el esquema vivo

La comparación siguiente fue de solo lectura sobre `information_schema`, `pg_class`, `pg_proc`, `pg_policies`, Storage y privilegios. No se aplicó DDL.

### Ya reflejadas total o parcialmente en producción

- Onboarding: `profiles.intro_completed_at` existe.
- Media compartida de lecciones: `lesson_media_assets`, bucket `lesson-atom-media` y políticas de Storage están presentes.
- Progreso de minijuegos: `game_progress` y sus tres políticas RLS están presentes.
- Permisos de servicio para juegos: `service_role` ya tiene CRUD en `game_round_sessions`, `game_round_answers`, `game_chest_claims` y `game_questions`.
- Orby ICFES: documentos, chunks, señales de aprendizaje y chat administrativo existen.
- Pizarra y voz: `orby_messages.teaching_board`, `generated_image_path`, `voice_turn_id`, `orby_voice_turn_receipts`, `orby_save_voice_turn_with_board` y `orby_attach_voice_turn_image` existen.
- Límite Cloudflare: el esquema usa `orby_cloudflare_neuron_budget` y `orby_reserve_cloudflare_neuron_budget`; no usa el nombre antiguo `orby_provider_daily_neuron_usage`.
- Archivo Oculto: `game_case_records`, sus índices y políticas están presentes; los campos de presentación documental también aparecen en la tabla.
- Comunidad: badges públicos, perfiles independientes, políticas de sesiones, métricas y RPCs de búsqueda/resolución de menciones existen.

### Migraciones antiguas o reemplazadas: no aplicar a ciegas

- La versión antigua del cerebro Orby v3 no coincide con la API actual: faltan algunas funciones con sufijo `_v3`, pero existen funciones de búsqueda y perfil más recientes (`orby_save_knowledge_profile`, `orby_search_knowledge_hybrid_multi_v3`, `orby_search_knowledge_concepts`, `orby_get_related_knowledge`).
- La RPC genérica `orby_save_turn_with_board` no existe; la variante específica de voz sí existe y es la que debe contrastarse con el flujo actual.
- El presupuesto Cloudflare usa una tabla con otro nombre y una RPC ya desplegada. No se debe crear una segunda tabla sin reconciliar el diseño.
- La migración antigua de conceptos v3 no debe ejecutarse hasta reconciliarla con las tablas de conceptos y las funciones posteriores que ya existen.

### Faltantes que sí tienen consumidores en el código actual



- **Orby Credits:** faltan `orby_credit_accounts`, `orby_credit_ledger`, `orby_credit_admin_audit`, `orby_get_credits` y `orby_set_promo_status`. Las rutas `app/api/orby-credits` y `app/api/admin/orby-credits` invocan esas RPC; actualmente su contrato no está satisfecho.
- **PeakStyle:** faltan columnas `profile_bio`, `profile_pronouns`, `profile_banner_url`; bucket `profile-assets`; tablas de cosméticos/equipamiento y funciones de actualización, compra y equipamiento. Las rutas `app/api/profile/assets`, `app/api/profile/cosmetics` y `app/api/profile/public/[userId]` llaman a esas funciones.
- **Comunidad — fundador/moderación:** faltan las tablas privadas `community_founder_config`, `community_lifecycle`, `community_member_restrictions`, `community_security_audit` y sus RPC. Las rutas de roles, moderación y ciclo de vida dependen de ellas.
- **Edición de mensajes:** `edit_community_message(uuid,text)` falta; las funciones de búsqueda y resolución de menciones sí existen.
- **Banners comunitarios:** falta `community_member_profiles.banner_path` y el bucket `community-profile-banners`. La ruta de perfil ya selecciona `banner_path`, por lo que la lectura/actualización del perfil puede fallar con el esquema actual.

Estos faltantes son evidencia de incompatibilidad funcional entre código y esquema; no autorizan aplicar las migraciones directamente en producción. Primero hay que probarlas en un entorno aislado y revisar el efecto completo de cada SQL, especialmente los cambios de permisos en `profiles` de PeakStyle.

## Estado de ejecución

- Recuperación de archivos: completada desde el SQL almacenado por Supabase.
- Alineación de historial: completada por versión y nombre para los 181 registros remotos.
- Auditoría estática de los 27 archivos locales exclusivos: completada a nivel de objetos principales y consumidores conocidos.
- Pruebas de ejecución aisladas: pendientes.
- Migraciones aplicadas a producción: ninguna.
