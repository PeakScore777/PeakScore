# PeakScore — Contexto técnico vivo

> Fuente de verdad del estado técnico del proyecto. Actualizar este archivo cuando cambie una decisión, arquitectura, seguridad o flujo importante.

## Proyecto
- Nombre: PeakScore.
- Plataforma: preparación PreICFES/ICFES para Colombia.
- Repositorio: PeakScore777/PeakScore.
- Rama principal: main.
- No reconstruir el proyecto desde cero.
- No inventar archivos, tablas, endpoints, funciones o componentes. Primero verificar el repositorio/BD.
- Preferencia de trabajo: cambios pequeños, verificables y reversibles.

## Stack confirmado
- Next.js 16.2.12, App Router.
- React 19.2.4.
- TypeScript.
- Tailwind CSS v4.
- Supabase SSR + PostgreSQL.
- Framer Motion.
- PostHog.
- Turnstile.
- OpenAI / Google GenAI para IA.
- Vercel para despliegue.

## Seguridad actual
- CSP y headers de seguridad configurados en next.config.ts.
- Service Role de Supabase solo en servidor.
- Login/register/recovery usan Turnstile.
- APIs sensibles validan usuario autenticado.
- Finalización de simulacros usa RPC atómico y calcula resultados en servidor.
- Las preguntas enviadas al cliente durante un simulacro excluyen correct_answer y explanation.
- Existe CodeQL y Dependabot.
- .env* está ignorado por Git.
- Supabase SSR ahora tiene proxy.ts + lib/supabase/proxy.ts para refresco de sesión.
- lib/ai/openai.ts usa server-only.
- El rate limiter ahora define los límites por bucket dentro de la función SECURITY DEFINER; los parámetros de límite/ventana enviados por el cliente ya no controlan la política efectiva.
- Todos los SECURITY DEFINER actuales usan search_path='' tras revisión de sus definiciones.
- No guardar secretos reales en este archivo.

## Auth / roles
- profiles.role: user | admin; admin representa exclusivamente al dueño global de la plataforma.
- institution_members.role: student | teacher | coordinator | rector | admin; este admin es institucional y NO concede privilegios globales de plataforma.
- user_roles: admin | student; actualmente sin filas confirmadas y pendiente de mapear usos antes de eliminar/unificar.
- profiles solo tiene SELECT para el propio usuario mediante RLS; no existe política RLS de INSERT/UPDATE/DELETE para usuarios autenticados.
- El trigger prevent_profile_privilege_changes() es SECURITY DEFINER, usa search_path='' y bloquea al propio usuario de modificar campos protegidos como role, email y métricas del perfil.
- Se verificó la definición de handle_new_user(); es SECURITY DEFINER con search_path='' y crea el perfil inicial sin asignar role=admin.
- Grants de profiles y user_roles para anon/authenticated fueron reducidos en Supabase: no se permite escritura directa ni privilegios administrativos innecesarios desde esos roles. El acceso SELECT queda sujeto a las políticas RLS existentes.

## Simulacros
- simulations, simulation_questions, simulation_attempts y simulation_answers existen.
- simulation_attempts ahora tiene total_questions, current_question y time_left para soportar el flujo de progreso/resume.
- Hay un índice único parcial para impedir más de un intento abierto por usuario/simulacro.
- /api/simulations/[id]/questions filtra campos sensibles.
- /api/simulations/[id]/finish usa finish_simulation_atomic.
- El RPC save_simulation_progress_atomic ahora persiste current_question/time_left y valida ownership, límites, estructura de respuestas, duplicados y pertenencia de preguntas.

## Reference / IA
- Existen reference_sources, reference_analyses, reference_profiles, reference_questions, reference_sets y reference_set_questions.
- El corpus de referencia está restringido por RLS al propietario y al dueño global de plataforma (profiles.role = admin). institution_members.role NO concede privilegios de plataforma.
- generate-questions y generate-question-batch son rutas administrativas.

## Storage
- question-images es público para lectura, pero solo el dueño global de plataforma (profiles.role = admin) puede subir.
- reference-pdfs es privado; solo el dueño global puede subir, leer y borrar. Bucket limitado a PDF y 30 MB.
- No cambiar URLs de imágenes/branding sin comprobar referencias.

## Recuperación de contraseña
- CORREGIDO: /forgot-password mantiene Turnstile, respuesta genérica para no revelar si una cuenta existe y ahora maneja excepciones sin exponer detalles de Auth.
- CORREGIDO: /update-password valida el flujo de recuperación antes de permitir cambiar la contraseña.
- El flujo soporta el código PKCE devuelto por Supabase mediante exchangeCodeForSession() y elimina el código de la URL después del intercambio.
- Se valida que exista una sesión recuperada antes de ejecutar updateUser({ password }).
- La nueva contraseña exige mínimo 15 caracteres, mayúscula, minúscula, número y símbolo.
- Después de un cambio correcto se revocan las sesiones globales y se obliga a iniciar sesión nuevamente.
- Los errores de enlace expirado/inválido se muestran de forma genérica y ofrecen solicitar otro enlace.
- Pendiente manual Supabase: revisar Auth URL Configuration para que /update-password esté en Redirect URLs y revisar expiración/configuración del correo de recuperación.

## Sesión SSR
- CORREGIDO: se añadió proxy.ts en la raíz y lib/supabase/proxy.ts.
- proxy.ts delega en updateSession().
- lib/supabase/proxy.ts crea el cliente SSR, sincroniza cookies request/response y ejecuta supabase.auth.getClaims() para refrescar/verificar la sesión.
- El matcher excluye recursos estáticos e imágenes comunes.
- El dashboard mantiene su comprobación server-side con getUser(); el proxy no reemplaza las autorizaciones de cada ruta.

## Pendientes prioritarios
- [ ] Resolver mapa definitivo de roles/usos de user_roles e institution_members.
- [x] Endurecer RLS/reference_*.
- [x] Endurecer Storage.
- [x] Corregir esquema/RPC base de progreso/resume de simulacros.
- [x] Endurecer rate limiter para ignorar límites elegibles por el cliente.
- [x] Endurecer search_path de todas las funciones SECURITY DEFINER revisadas.
- [ ] Revisar grants de anon/authenticated en el resto de tablas.
- [ ] Revisar índices FK según consultas reales.
- [ ] Completar auditoría histórica de secretos.
- [ ] Revisar protección de main/CI cuando el flujo de desarrollo lo permita.

## No tocar sin motivo
- Diseño/branding actual y logo peakscore-logo-transparente2.png.
- CSP/headers actuales salvo error comprobado.
- finish_simulation_atomic sin antes mapear dependencias.
- Parser/renderer matemático seguro.
- Estructura general existente.

## Regla de cambios
Antes de modificar:
1. Leer el archivo actual.
2. Buscar referencias.
3. Verificar BD si afecta Supabase.
4. Hacer el cambio mínimo.
5. Ejecutar/verificar build o checks disponibles.
6. Actualizar este archivo y PEAKSCORE_CHANGELOG.md con lo confirmado.


## Auditoría actual — rutas administrativas
- CORREGIDO: se añadieron layouts server-side para /dashboard/question-bank y /dashboard/import-pdf usando requireAdmin(). Esto protege todas sus subrutas antes de renderizar la UI.
- Las APIs /api/generate-questions, /api/generate-question-batch y /api/import.pdf ya validan profiles.role = admin server-side; no se sustituyeron.
- Detectado pendiente: questions RLS todavía usa institution_members.role = admin para SELECT/INSERT/UPDATE/DELETE. El modelo actual exige profiles.role = admin para el dueño global. Debe migrarse manualmente en Supabase después de sincronizar/verificar VSC.
- Pendiente de código en VSC: StatCard.tsx referencia /dashboard/racha-pixel.png, pero el archivo existente es /dashboard/racha-pixel.webp. No se aplicó ese cambio todavía.
- No crear paneles ni permisos institucionales; institution_members se trata como estructura futura/legacy hasta mapear dependencias.

- CORREGIDO: Sidebar ahora verifica el administrador global mediante profiles.role = admin, no institution_members.
- CORREGIDO: /dashboard/question-bank/page.tsx ahora usa profiles.role = admin para su comprobación client-side, consistente con el layout server-side y requireAdmin().
- CORREGIDO: enlace del Panel de administración a Importar PDF apuntaba a una ruta inexistente; ahora apunta a /dashboard/import-pdf.


## Advisor Supabase — 2026-09-29
- Security Advisor: 1 INFO esperado: api_rate_limits tiene RLS sin políticas porque debe ser accesible solo mediante la función SECURITY DEFINER de rate limit.
- Security Advisor: 6 WARN de funciones SECURITY DEFINER ejecutables por authenticated. Se consideran intencionales y protegidas internamente; no revocar EXECUTE sin refactorizar sus llamadas.
- Security Advisor: 1 WARN pendiente manual: Leaked Password Protection está desactivado en Supabase Auth.
- No se aplicó ningún cambio adicional a estas alertas en esta ronda.


## Estado de sincronización — 2026-09-29
- Punto de control: los cambios de seguridad documentados hasta la auditoría del 2026-09-29 están en `main`.
- Próximo paso operativo: sincronizar `main` con la copia local de VSC antes de realizar tareas manuales de Supabase o nuevos cambios de código.
- No se considera completada la sincronización local hasta verificarla en VSC.
