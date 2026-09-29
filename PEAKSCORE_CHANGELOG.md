# PeakScore — Changelog técnico

## 2026-09-28

### Auditoría 3/3
- Se completó una auditoría cruzada de GitHub, Next.js, Auth, APIs, Supabase, RLS, RPC, Storage y frontend.
- Se confirmó que no existía proxy.ts ni middleware.ts.
- Se confirmó inconsistencia entre simulation_attempts y el flujo de progreso: faltan columnas que el código/RPC espera.
- Se confirmó una diferencia de fuente de autorización entre profiles.role e institution_members.role.
- Se detectó exposición autenticada amplia en varias tablas reference_*.
- Se detectó una superficie de escritura de Storage que requiere endurecimiento.
- Se detectaron grants amplios de anon/authenticated que deben revisarse.
- Se identificó código legado potencial en lib/services/simulation.service.ts; no se eliminó porque primero deben mapearse referencias.

### Corrección 1 — Sesión SSR
- Añadido lib/supabase/proxy.ts para gestionar la sesión SSR con @supabase/ssr.
- Añadido proxy.ts siguiendo la convención de Next.js 16.
- El proxy llama a supabase.auth.getClaims() y sincroniza cookies entre request y response.
- No se modificó la arquitectura del dashboard ni se reemplazaron sus comprobaciones de autorización.
- Referencias: commits b67af93 y 392ca51.

### Corrección 2 — Cliente OpenAI
- Añadido import "server-only" en lib/ai/openai.ts.
- El cliente OpenAI queda explícitamente restringido a código servidor.
- No se modificó la configuración de la API key ni la lógica de IA.

### Corrección 3 — Rate limiting y progreso
- El rate limiter ahora fija los límites por bucket en la función SECURITY DEFINER y no confía en p_limit/p_window_seconds proporcionados por el cliente.
- consume_api_rate_limit y save_simulation_progress_atomic usan search_path = ''.
- simulation_attempts recibió total_questions, current_question y time_left.
- save_simulation_progress_atomic ahora persiste estado de progreso y mantiene validaciones de ownership, límites, estructura de respuestas, duplicados y pertenencia de preguntas.
- Verificado en Supabase que las tres columnas existen y las funciones corregidas tienen search_path vacío.

### Corrección 4 — RLS del corpus de referencia
- Se confirmó que reference_profiles, reference_questions, reference_set_questions y reference_sets tenían SELECT demasiado amplio para cualquier usuario autenticado.
- Se reemplazó el acceso amplio por acceso del propietario y del dueño global de plataforma.
- Se eliminaron políticas SELECT duplicadas de reference_questions.
- Se eliminaron políticas INSERT duplicadas en reference_sources y reference_analyses.
- Verificado directamente en Supabase que las políticas resultantes ya no contienen USING (true) en esas cuatro tablas.

### Corrección 5 — Privilegios exclusivos del dueño de la plataforma
- Se aclaró la arquitectura: profiles.role = admin representa al dueño global de PeakScore; institution_members.role no concede privilegios de plataforma.
- Se ajustaron las políticas SELECT del corpus de referencia para usar exclusivamente profiles.role = admin como privilegio global, manteniendo acceso al propietario de sus propios recursos.
- Storage question-images: la escritura quedó restringida al dueño global de plataforma.
- Storage reference-pdfs: subida, lectura y borrado quedaron restringidos al dueño global; el bucket es privado y limitado a PDF de máximo 30 MB.
- Verificado directamente en Supabase después de las migraciones.

### Corrección 6 — Privilegios directos de perfiles y user_roles
- Se inspeccionó prevent_profile_privilege_changes(): es SECURITY DEFINER con search_path vacío y bloquea al propio usuario de cambiar role, email y otros campos protegidos.
- Se verificó handle_new_user(): es SECURITY DEFINER con search_path vacío y no asigna role=admin al crear perfiles.
- Se confirmó que profiles no tiene políticas RLS de INSERT/UPDATE/DELETE para usuarios autenticados; solo SELECT del propio perfil.
- En Supabase se revocaron a anon todos los privilegios sobre profiles y user_roles.
- En Supabase se revocaron a authenticated los privilegios de escritura y privilegios administrativos innecesarios sobre profiles y user_roles.
- La arquitectura mantiene profiles.role = admin exclusivamente para el dueño global de plataforma.
- Pendiente: mapear todos los usos de user_roles e institution_members antes de eliminar o unificar fuentes de roles.
