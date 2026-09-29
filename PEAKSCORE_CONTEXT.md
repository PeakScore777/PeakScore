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
- Los SECURITY DEFINER corregidos usan search_path vacío en consume_api_rate_limit y save_simulation_progress_atomic.
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
- [x] Endurecer search_path de las dos funciones SECURITY DEFINER modificadas.
- [ ] Revisar SECURITY DEFINER restantes y search_path.
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
