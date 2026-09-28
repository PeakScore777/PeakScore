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
- No guardar secretos reales en este archivo.

## Auth / roles — estado pendiente
Existen tres conceptos actualmente:
1. profiles.role: user | admin.
2. institution_members.role: student | teacher | coordinator | rector | admin.
3. user_roles: admin | student; actualmente sin filas confirmadas.
No unificar/eliminar ninguna fuente hasta mapear todos sus usos.

## Simulacros
- simulations, simulation_questions, simulation_attempts y simulation_answers existen.
- Hay un índice único parcial para impedir más de un intento abierto por usuario/simulacro.
- /api/simulations/[id]/questions filtra campos sensibles.
- /api/simulations/[id]/finish usa finish_simulation_atomic.
- Existe un problema confirmado: simulation_attempts no tiene current_question, time_left ni total_questions, mientras progress/route.ts y save_simulation_progress_atomic esperan/usan parte de esos datos. Debe corregirse coordinando BD + RPC + API + frontend; no parchear una sola capa.

## Reference / IA
- Existen reference_sources, reference_analyses, reference_profiles, reference_questions, reference_sets y reference_set_questions.
- Algunas políticas actuales permiten lectura autenticada demasiado amplia. Revisar antes de exponer corpus interno a estudiantes.
- generate-questions y generate-question-batch son rutas administrativas.

## Storage
- question-images es público para lectura y actualmente tiene superficie de escritura autenticada que debe revisarse/restringirse.
- reference-pdfs es privado, pero sus límites de tamaño/MIME de bucket deben endurecerse.
- No cambiar URLs de imágenes/branding sin comprobar referencias.

## Sesión SSR
- Actualmente no existe proxy.ts ni middleware.ts.
- Siguiente corrección iniciada: añadir proxy.ts y lib/supabase/proxy.ts para refresco de sesión SSR con @supabase/ssr.

## Pendientes prioritarios
- [ ] Añadir proxy SSR.
- [ ] Resolver arquitectura definitiva de roles.
- [ ] Endurecer RLS/reference_*.
- [ ] Endurecer Storage.
- [ ] Corregir progreso/resume de simulacros.
- [ ] Revisar SECURITY DEFINER y search_path.
- [ ] Revisar rate limiting para que los límites no sean elegibles libremente por el cliente.
- [ ] Revisar grants de anon/authenticated.
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
