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

### Corrección 7 — SECURITY DEFINER
- Se revisaron las ocho funciones SECURITY DEFINER existentes en public.
- Las cuatro que todavía tenían search_path=public fueron inspeccionadas antes del cambio: delete_user_simulation, finish_simulation_atomic, get_subject_performance_for_attempts y update_user_streak.
- Se confirmó que sus tablas están referenciadas como public.* y que no era necesario mantener public en search_path.
- Se cambió su configuración a search_path='' mediante migración.
- Verificado en Supabase: las ocho funciones SECURITY DEFINER actuales tienen search_path vacío.


### Corrección 8 — Recuperación de contraseña
- Se revisaron /forgot-password y /update-password y se reprodujo conceptualmente el fallo mostrado: la pantalla de nueva contraseña podía llegar sin una sesión de recuperación válida y mostrar errores genéricos de enlace.
- /update-password ahora soporta el flujo PKCE de Supabase mediante exchangeCodeForSession(code) cuando el enlace devuelve un código.
- El código de recuperación se elimina de la URL después del intercambio.
- Se comprueba una sesión válida antes de permitir updateUser({ password }).
- La contraseña de recuperación ahora exige mínimo 15 caracteres, mayúscula, minúscula, número y símbolo, manteniendo la política fuerte usada en el registro.
- Tras cambiar correctamente la contraseña se revocan las sesiones globales y se obliga a iniciar sesión nuevamente.
- /forgot-password ahora maneja excepciones inesperadas, mantiene respuesta genérica y consume/renueva el token de Turnstile.
- Pendiente manual: verificar en Supabase Auth URL Configuration que la URL de producción /update-password esté permitida y revisar la configuración de expiración/plantilla del correo de recuperación.
- Commits: aef92cdc3afca887c425cfd283db5e011ea94180 y 543f4ef67844bf3b40797ace781e0bfe91d13179.


### Corrección 9 — Protección de rutas administrativas
- Se detectó que varias páginas del Banco de Preguntas dependían de comprobaciones client-side o de RLS basado en institution_members.role, aunque el modelo actual de PeakScore define profiles.role = admin como único administrador global.
- Se añadieron layouts server-side en /dashboard/question-bank y /dashboard/import-pdf usando requireAdmin(). Esto protege todas las subrutas del banco y la página de importación antes de renderizar/ejecutar la UI.
- Las APIs sensibles ya tenían comprobación server-side de profiles.role = admin y no se reemplazaron.
- No se creó ni modificó ningún panel institucional.
- Pendiente: al sincronizar el código en VSC, cambiar StatCard.tsx de /dashboard/racha-pixel.png a /dashboard/racha-pixel.webp.
- Pendiente manual Supabase: migrar las políticas RLS de questions de institution_members.role = admin a profiles.role = admin, después de verificar que no existe una dependencia institucional actual.


### Corrección 10 — Consistencia del administrador global
- Sidebar: la visibilidad de las herramientas administrativas ahora usa profiles.role = admin.
- Question Bank: la comprobación client-side de acceso ahora usa profiles.role = admin, alineada con el nuevo layout server-side.
- Panel de administración: corregido el enlace roto de Importar PDF (/dashboard/question-bank/import-pdf → /dashboard/import-pdf).
- No se añadieron permisos institucionales ni se modificó el modelo de instituciones.


### Auditoría 2026-09-29 — Advisor y rutas administrativas
- Supabase Security Advisor sigue mostrando únicamente las 6 funciones SECURITY DEFINER intencionales, api_rate_limits sin políticas (INFO) y Leaked Password Protection desactivado (WARN).
- No se revocaron EXECUTE de las funciones porque son llamadas RPC legítimas del producto y hacerlo sin refactorizar rompería el flujo.
- Leaked Password Protection queda como tarea manual.


## 2026-09-29 — Punto de control para sincronización VSC
- Se registró que los cambios de seguridad documentados hasta esta fecha ya están en `main`.
- Antes de continuar con nuevas correcciones, se debe sincronizar `main` en la copia local de Visual Studio Code.
- No se aplicaron cambios de código en este punto de control.


### Corrección 11 — Asset de racha del dashboard
- Se verificó que `components/dashboard/StatCard.tsx` apuntaba a `/dashboard/racha-pixel.png`.
- Se corrigió únicamente esa referencia a `/dashboard/racha-pixel.webp`, correspondiente al asset existente.
- No se modificaron otras rutas de imágenes, branding ni estructura del dashboard.
- El cambio quedó guardado en GitHub antes de sincronizarlo con VSC.


### Corrección de registro — StatCard / racha
- Aclaración: el cambio de `/dashboard/racha-pixel.png` a `/dashboard/racha-pixel.webp` fue realizado manualmente por el usuario en VSC.
- No debe atribuirse como cambio de código realizado por el asistente.
- La referencia correcta ya está presente en la copia local de VSC y debe conservarse al subir los cambios locales a GitHub.
- No se realizó ninguna otra modificación de `StatCard.tsx`.


### Registro — Leaked Password Protection y plan Supabase
- Se verificó en el dashboard del proyecto que la opción de Leaked Password Protection no está disponible en el plan Free.
- Se contrastó con la documentación oficial actual de Supabase: Leaked Password Protection está disponible en Pro y superiores.
- No se cambió el plan ni otras opciones de autenticación por esta alerta.
- Estado: pendiente por disponibilidad del plan; se mantiene como WARN conocido de Supabase Security Advisor.


### Corrección — RLS de questions
- Se verificaron las políticas RLS existentes de public.questions antes del cambio.
- Se reemplazaron manualmente las cuatro políticas administrativas: SELECT, INSERT, UPDATE y DELETE.
- La autorización ahora se basa en public.profiles con id = auth.uid() y role = 'admin', consistente con el único administrador global actual de PeakScore.
- Verificación posterior en pg_policies: las cuatro políticas ya no dependen de institution_members.
- No se creó ni modificó ningún panel o sistema institucional.


### Auditoría — Grants de tablas públicas
- Se auditó directamente information_schema.role_table_grants, ACLs de pg_class y DEFAULT PRIVILEGES.
- Se detectó que anon y authenticated mantienen Dxtm (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) en múltiples tablas públicas; authenticated además conserva CRUD completo en varias tablas.
- RLS está habilitado en todas las tablas públicas auditadas, pero PostgreSQL especifica que operaciones como TRUNCATE y REFERENCES no están sujetas a RLS. Por ello estos privilegios requieren revisión independiente.
- Se detectó DEFAULT PRIVILEGES del rol postgres que asigna Dxtm a anon y authenticated para nuevas tablas públicas.
- No se revocaron grants todavía. Primero se mapearán las operaciones reales del código y las dependencias para aplicar mínimo privilegio sin romper PeakScore.
