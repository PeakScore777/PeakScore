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
- Referencias: commit `b67af93` y commit `392ca51`.

### Estado actual
- Corrección 1 aplicada en `main`.
- No se consideran corregidos los demás hallazgos de la auditoría.
- Siguiente bloque: revisar y definir la arquitectura de roles antes de tocar RLS, grants o Storage.
