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
- Añadido `lib/supabase/proxy.ts` para gestionar la sesión SSR con `@supabase/ssr`.
- Añadido `proxy.ts` siguiendo la convención de Next.js 16.
- El proxy llama a `supabase.auth.getClaims()` y sincroniza cookies entre request y response.
- No se modificó la arquitectura del dashboard ni se reemplazaron sus comprobaciones de autorización.
- Referencias: commits `b67af93` y `392ca51`.

### Corrección 2 — Cliente OpenAI
- Añadido `import "server-only";` en `lib/ai/openai.ts`.
- El cliente OpenAI queda explícitamente restringido a código servidor, evitando imports accidentales desde componentes/rutas cliente.
- No se modificó la configuración de la API key ni la lógica de IA.

### Estado actual
- Correcciones 1 y 2 aplicadas en `main`.
- No se consideran corregidos los demás hallazgos de la auditoría.
- Siguiente bloque: terminar el mapa de roles y revisar RLS/grants antes de cambiar políticas.


### Corrección 3 — Rate limiting y progreso
- El rate limiter ahora fija los límites por bucket en la función SECURITY DEFINER y no confía en p_limit/p_window_seconds proporcionados por el cliente.
- `consume_api_rate_limit` y `save_simulation_progress_atomic` usan `search_path = ''`.
- `simulation_attempts` recibió `total_questions`, `current_question` y `time_left` para alinear BD, RPC y API.
- `save_simulation_progress_atomic` ahora persiste estado de progreso y mantiene las validaciones de ownership y respuestas.
- Verificado en Supabase que las tres columnas existen y las funciones corregidas tienen search_path vacío.
