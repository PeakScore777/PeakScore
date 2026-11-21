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
