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
- [ ] Leaked Password Protection: pendiente por disponibilidad del plan Free; disponible en Pro y superiores.

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
- CORREGIDO MANUALMENTE EN SUPABASE: las políticas RLS de questions para SELECT/INSERT/UPDATE/DELETE ahora verifican profiles.id = auth.uid() y profiles.role = 'admin'. Ya no dependen de institution_members para conceder privilegios sobre questions.
- CORREGIDO MANUALMENTE EN VSC: StatCard.tsx referencia /dashboard/racha-pixel.webp. Este cambio fue realizado manualmente por el usuario; no debe tratarse como una corrección de código realizada por el asistente. Mantenerlo al sincronizar VSC → GitHub.
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


## Supabase Auth — Leaked Password Protection
- Verificado en el dashboard actual del proyecto que la opción no aparece en el plan Free.
- Confirmado en la documentación oficial de Supabase que Leaked Password Protection está disponible en Pro y superiores.
- Estado: pendiente por disponibilidad del plan; no se realizará ningún cambio de plan por esta alerta.


### RLS questions — 2026-09-29
- Se verificaron las 4 políticas existentes de public.questions antes del cambio.
- Se reemplazaron manualmente en Supabase las políticas SELECT, INSERT, UPDATE y DELETE.
- Las cuatro ahora autorizan exclusivamente al dueño global mediante public.profiles (id = auth.uid() y role = 'admin').
- Se confirmó directamente en pg_policies que ninguna de las cuatro políticas usa institution_members.
- No se modificó institution_members ni se creó ninguna funcionalidad institucional.


## Auditoría de grants — 2026-09-29
- Se auditó directamente information_schema.role_table_grants, pg_class.relacl y pg_default_acl para las tablas públicas.
- Hallazgo importante: anon y authenticated conservan privilegios Dxtm (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) sobre múltiples tablas públicas. En varias tablas authenticated también conserva CRUD completo.
- RLS está habilitado en las 20 tablas públicas auditadas, pero RLS no controla operaciones de tabla completa como TRUNCATE ni REFERENCES; por tanto, esos privilegios no deben considerarse protegidos por las políticas RLS. PostgreSQL documenta que TRUNCATE y REFERENCES no están sujetos a RLS.
- Los privilegios amplios parecen provenir también de DEFAULT PRIVILEGES del rol postgres para tablas nuevas: anon= Dxtm y authenticated=Dxtm. Esto debe corregirse después de mapear las operaciones reales del código para no romper el producto.
- No se revocó ningún grant en esta ronda.
- Siguiente paso: mapear por tabla las operaciones reales usadas por PeakScore y reducir privilegios a mínimo necesario, incluyendo corregir DEFAULT PRIVILEGES para futuras tablas.


## Mapeo de uso de grants — 2026-09-29
- Se revisó el código actual del repositorio para mapear las tablas públicas antes de revocar permisos.
- profiles: acceso de navegador mediante lib/services/profile.service.ts y comprobaciones de rol; RLS limita SELECT al propio perfil. No requiere DML del cliente.
- questions: usado por question.service.ts para CRUD del banco administrativo y por servicios/API de simulacros; las rutas administrativas usan autorización de admin y algunas APIs usan service_role. RLS actual limita el acceso administrativo global a profiles.role='admin'.
- subjects: usado como catálogo de materias; la política actual permite SELECT a authenticated. No se observó necesidad de DML del cliente.
- simulations: leído desde el cliente y manipulado en APIs de servidor; la creación normal usa service_role después de autenticar al usuario. Las políticas actuales permiten al usuario ver/eliminar sus propios simulacros; no hay políticas de INSERT/UPDATE para usuarios.
- simulation_questions: leído por el flujo de simulacros; creación/eliminación se realiza en APIs/servicios privilegiados según el código revisado. La política cliente actual es SELECT condicionado al propietario del simulacro.
- simulation_attempts: el dashboard y flujo de simulacro leen intentos propios; el progreso/creación usa endpoints y RPCs. Las políticas actuales permiten INSERT/SELECT del propio usuario; otras escrituras directas no tienen políticas cliente equivalentes.
- simulation_answers: el cliente consulta respuestas propias para rendimiento; el guardado/actualización del progreso se realiza mediante RPC atómica. La política cliente visible es SELECT de respuestas pertenecientes a intentos propios.
- reference_sources: usado por importación PDF y procesamiento de referencia; la importación usa tanto cliente autenticado como service_role para operaciones administrativas internas. RLS limita el acceso a uploaded_by y el admin global.
- reference_questions: usado por importación/generación de referencia; INSERT está restringido por ownership del source y SELECT por ownership/admin. La limpieza masiva durante importación usa service_role.
- reference_analyses: INSERT/SELECT/UPDATE/DELETE para análisis propios; RLS limita user_id al usuario autenticado. Es un caso donde authenticated necesita CRUD, pero no privilegios de administración de tabla como TRUNCATE/REFERENCES/TRIGGER/MAINTAIN.
- reference_profiles/reference_sets/reference_set_questions: acceso principalmente de lectura condicionado por owner/admin y escritura interna/privilegiada según el flujo de importación. No hay necesidad demostrada de TRUNCATE/REFERENCES/TRIGGER/MAINTAIN para los roles de aplicación.
- student_progress: actualmente solo se observa SELECT para el propio usuario desde RLS; las escrituras se realizan mediante lógica/RPC/servidor según el código auditado. No se justifican privilegios de tabla amplios para anon/authenticated.
- subscriptions: RLS actual permite SELECT del propio user_id; no se observó necesidad de DML del cliente en el código auditado.
- institution_members/institutions: existen en la BD y tienen grants amplios, pero NO se desarrollará ni modificará el sistema institucional en esta auditoría. Se mantienen fuera del cambio hasta mapear dependencias históricas con precisión.
- user_roles: existe como estructura legacy/pendiente de mapeo; authenticated solo tiene UPDATE según ACL y RLS SELECT propio. No se modificará hasta decidir su futuro junto con sus referencias.
- Hallazgo transversal: los permisos Dxtm (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) de anon/authenticated son más amplios de lo necesario para la aplicación y no deben considerarse protegidos por RLS. Se revocarán solo después de cerrar el inventario de dependencias y confirmar que no existen operaciones que los requieran.
- También existen DEFAULT PRIVILEGES del rol postgres que conceden Dxtm a anon/authenticated para nuevas tablas; debe corregirse después de definir el modelo mínimo de grants.


## Auditoría global de seguridad — 2026-09-29 — reconocimiento sin correcciones

### Alcance
- Auditoría realizada contra el estado real de GitHub `main` y el proyecto Supabase activo de PeakScore.
- Se revisaron autenticación/autorización administrativa, RLS, Storage, SECURITY DEFINER, triggers, grants, DEFAULT PRIVILEGES, APIs sensibles, headers/CSP, estructura de instituciones y estado de migraciones.
- Esta fase es exclusivamente de reconocimiento/documentación. No se aplicaron correcciones de código ni cambios de esquema durante esta auditoría.
- El panel institucional creado localmente durante esta fecha NO está presente en el `main` auditado. Por tanto, su código local aún no puede considerarse auditado hasta que esté disponible para revisión.

### 🟢 Correcto / controles confirmados
- Supabase reporta exactamente 1 perfil con `role='admin'`, y el correo de ese perfil coincide exactamente con `aragonyostynsena07@gmail.com`.
- Las políticas RLS actuales de `questions` para SELECT/INSERT/UPDATE/DELETE dependen de `profiles.id = auth.uid()` y `profiles.role='admin'`; no usan `institution_members.role`.
- Las tablas públicas auditadas tienen RLS habilitado.
- Las funciones SECURITY DEFINER existentes revisadas tienen `search_path=''\` y las funciones RPC de usuario verifican `auth.uid()`/ownership antes de operar.
- `handle_new_user()` crea perfiles sin asignar `role='admin'`.
- `prevent_profile_privilege_changes()` protege cambios directos de campos sensibles del perfil y el acceso RLS de `profiles` no concede escritura directa a usuarios autenticados.
- Las APIs administrativas revisadas comprueban autenticación y `profiles.role='admin'` en servidor; no dependen únicamente de la UI.
- Los headers/CSP de `next.config.ts` incluyen HSTS, nosniff, frame-ancestors/X-Frame-Options, Referrer-Policy, Permissions-Policy y CSP.

### 🟡 Riesgos / mejoras pendientes
1. **Admin canónico no aplicado como segunda barrera**
   - `lib/auth/admin.ts` autoriza mediante `profiles.role='admin'` pero no exige el correo canónico.
   - Las rutas `/api/generate-questions`, `/api/generate-question-batch` y `/api/import.pdf` también comprueban el role, pero no la identidad canónica.
   - Estado actual de datos: solo existe un admin y coincide con el correo canónico, por lo que no se observa una escalada activa; sin embargo, el modelo todavía no implementa la regla de doble condición exigida para el dueño global.
   - Corrección futura: una única comprobación server-side reutilizable que exija usuario autenticado + identidad canónica + `profiles.role='admin'`, y que también sea reflejada en las políticas RLS administrativas donde corresponda.

2. **Grants excesivos en PostgreSQL**
   - `anon` y `authenticated` conservan `TRUNCATE`, `REFERENCES` y `TRIGGER` sobre numerosas tablas públicas; en varias tablas `authenticated` conserva además CRUD completo.
   - Estos privilegios no deben considerarse protegidos por RLS: operaciones como TRUNCATE/REFERENCES no están gobernadas por las policies de filas.
   - Además, DEFAULT PRIVILEGES del rol `postgres` conceden `Dxtm` a `anon` y `authenticated` para tablas públicas nuevas.
   - Estado: **no corregir todavía**. Primero terminar el mapa de operaciones reales y dependencias, especialmente ahora que se está incorporando el sistema institucional.

3. **Institutional surface requiere auditoría específica**
   - La BD ya contiene `institutions` y `institution_members`; actualmente hay 1 institución y 1 miembro.
   - Las policies visibles actuales son conservadoras para lectura y no conceden DML directo mediante RLS a usuarios autenticados.
   - Sin embargo, los grants de tabla son amplios, por lo que el sistema institucional debe auditarse antes de habilitar operaciones de creación/edición/asignación de miembros.
   - El código del nuevo panel institucional local todavía no está en `main`; no se debe asumir que sus Server Actions/API/RPC están protegidos.

4. **Funciones SECURITY DEFINER expuestas**
   - Security Advisor mantiene 6 funciones ejecutables por `authenticated`.
   - No se consideran automáticamente vulnerables: las funciones revisadas validan autenticación/ownership y tienen `search_path=''\`.
   - Deben seguir auditándose cada vez que se agregue una RPC nueva, especialmente las relacionadas con instituciones y administración.

5. **Leaked Password Protection**
   - Sigue como WARN de Supabase Auth y pendiente por disponibilidad del plan actual.
   - No cambiar plan automáticamente.

### 🔴 No se confirmó una vulnerabilidad explotable durante esta fase
- No se encontró un segundo perfil con `role='admin'`.
- No se encontró evidencia, en las estructuras revisadas, de que `institution_members.role='admin'` esté concediendo actualmente administración global.
- No se encontró una función SECURITY DEFINER sin `search_path=''\` entre las funciones revisadas.
- Esto NO significa que PeakScore esté terminado: los grants excesivos y la ausencia de identidad canónica en la autorización global siguen siendo superficies que deben endurecerse.

### Prioridad siguiente
1. Auditar el código local no sincronizado del nuevo panel institucional.
2. Cerrar el modelo de autorización institucional: qué puede hacer student/teacher/coordinator/rector y qué nunca puede hacer respecto al sistema global.
3. Implementar después el blindaje de admin canónico con cambio mínimo.
4. Continuar con mínimo privilegio de grants y DEFAULT PRIVILEGES, verificando dependencias antes de revocar.
5. Repetir Security Advisor y pruebas negativas después de cada cambio.

### Regla operativa añadida
Toda nueva función, API, Server Action, RPC, policy o Storage policy debe evaluarse como si un atacante tuviera acceso directo a la URL/API/REST/RPC y conociera los IDs internos. Nunca considerar una página oculta o un botón deshabilitado como control de seguridad.

## Sincronización VSC ↔ GitHub — 2026-09-29

- Se verificó el estado real de `main` después de la sincronización.
- El commit local `7a6cf0d` se integró con los commits que estaban en GitHub mediante el merge `3134214f5b1bc235b7fb567a53d0f4e61d1beb50`.
- El merge se completó sin conflictos.
- El push posterior terminó correctamente con `main -> main`.
- Verificación actual en GitHub: `components/dashboard/StatCard.tsx` usa `/dashboard/racha-pixel.webp`.
- Estado: GitHub `main` contiene el cambio local y los cambios previos de seguridad/documentación.
- Antes de continuar con nuevas modificaciones, verificar primero el estado real de GitHub y VSC.

## Base de verificación institucional — verificada en Supabase

- Se crearon y verificaron `institution_verification_requests` e `institution_verification_documents` como base para la futura verificación institucional.
- `institution_verification_requests` permite estados `pending`, `under_review`, `approved`, `changes_requested` y `rejected`.
- Se creó un índice único parcial para impedir más de una solicitud activa por institución en estados `pending` o `under_review`.
- RLS está habilitado en ambas tablas.
- El flujo frontend de registro institucional todavía no está implementado.
- La creación sensible de solicitudes y datos institucionales debe pasar por backend/server-side con validación estricta antes de producción.
- El registro normal de usuarios permanece separado del registro institucional.
- No se debe asumir que las tablas de verificación por sí solas constituyen un sistema completo de registro institucional.

 
## Minijuego "¿Qué es esa vaina?" — rotación y generador IA (2026-10-24)
- Se detectó que el selector anterior ignoraba el historial cuando quedaban menos de 10 preguntas nuevas y retenía solo 30 IDs recientes.
- La rotación actualizada conserva hasta 1.000 IDs recientes y completa la ronda con las preguntas vistas menos recientemente cuando no quedan diez nuevas.
- La selección intenta distribuir preguntas entre materias y temas diferentes; los bancos local y publicado se combinan deduplicando por ID y por materia/enunciado normalizado.
- El generador de juegos incorpora guías por materia, selección explícita del nivel Saber 11 o profundización, validación de opciones únicas y comparación de similitud frente al banco local y los registros de Supabase.
- La generación se valida antes de insertar; si un lote sigue conteniendo duplicados o preguntas inválidas después de un reintento, se rechaza completo. Las preguntas aceptadas quedan como borradores.
- El editor se comparte entre la ruta de gestión de preguntas de juegos y la nueva ruta administrativa, ambas protegidas server-side con requireAdmin().
- Rama de trabajo: fix/game-rotation-admin-ai, derivada de feat/founder-intro. La rama main no se ha modificado.
- Pendiente de verificación: ejecutar lint/build en checkout local y verificar los cambios visualmente antes de fusionar.


## Orby Voice — Gemini Live + Cloudflare (2026-11-02)
- Decisión de pruebas: Gemini Live continúa como transporte conversacional de voz en tiempo real; Cloudflare Workers AI se incorpora como proveedor alternativo gratuito sujeto a la cuota diaria de la cuenta.
- Añadido `lib/ai/cloudflare-workers-ai.ts`, restringido al servidor mediante `server-only`. Lee exclusivamente `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN`; nunca expone el token al navegador.
- Respaldo de transcripción: `app/api/orby/audio/transcribe/route.ts` intenta Cloudflare Whisper Large V3 Turbo después de Gemini y Groq cuando están configurados. Se mantienen autenticación, rate limit, validación de MIME/firma, tamaño máximo y límite de transcripción.
- Respaldo de tutor: `app/api/lesson-tutor/route.ts` intenta Cloudflare Gemma 4 26B después de agotar el router existente (Groq/Gemini/LLM7). La salida sigue atravesando el mismo parser JSON, filtros de alcance, revisión académica disponible, controles de identidad y persistencia.
- Si Gemini Live se cae y ya existe una transcripción del turno, la respuesta de texto de respaldo se lee mediante SpeechSynthesis del navegador. La conversación continúa en modo de texto/audio por turnos; no se afirma que Cloudflare mantenga una sesión full-duplex de Gemini.
- Variables locales requeridas: `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN`. Ambas deben existir solo en `.env.local` / variables privadas del entorno; `.env*` permanece ignorado por Git.
- No se añadieron dependencias npm ni se modificaron `main`, Vercel, Supabase o migraciones.
- Pendiente de prueba local: confirmar las credenciales, el modelo Whisper y el modelo Llama en la cuenta Workers AI; probar fallos 401/403/429/timeout, la transcripción de audio WebM/Opus y la ruta completa de tutor. No declarar estable ni lanzar a estudiantes hasta ejecutar build, lint y pruebas manuales.


## Orby Voice + Knowledge Recovery — refinamiento 2026-11-02
- La rama continúa siendo `feat/founder-intro`. No se modificó `main` ni se hizo un despliegue de estudiantes.
- Gemini Live sigue siendo el transporte principal de voz en tiempo real. `LessonAITutor.tsx` ahora renderiza la transcripción progresivamente, libera fragmentos de audio a medida que se validan, mantiene bloqueada la cola hasta que termina la reproducción y usa SpeechSynthesis como alternativa si Gemini completa texto sin entregar audio.
- Se añadió cancelación controlada y un límite de seguridad para la síntesis del navegador. Las respuestas filtradas también intentan reproducirse por voz cuando se pierde la conexión Live.
- Las pruebas anteriores mostraron 39/39 tests de Orby aprobados en el PC del usuario antes de este último conjunto de cambios. Los nuevos tests se han ampliado, pero todavía deben ejecutarse localmente.
- Embeddings: Gemini `gemini-embedding-001` permanece como primer intento. Si su cuota falla, Cloudflare Workers AI puede usar `@cf/google/embeddinggemma-300m` (768 dimensiones). Cada fragmento conserva el campo `embedding_model`; no se comparan vectores de modelos diferentes.
- La búsqueda consulta todos los espacios vectoriales disponibles, calcula similitud dentro de cada modelo y fusiona resultados con la búsqueda léxica. Se añadió la migración `supabase/migrations/20261102230000_orby_model_aware_embedding_search.sql` (RPCs `orby_list_knowledge_embedding_models` y `orby_search_knowledge_hybrid_multi_v3`).
- Si Gemini y Cloudflare alcanzan realmente sus cuotas gratuitas de embeddings, el trabajo se estaciona hasta las 00:05 UTC del siguiente día, sin consumir todos los reintentos fallidos. La cuota de Workers AI Free documentada por Cloudflare es de 10.000 Neurons/día y las peticiones fallan al agotarla; no habilitar Workers Paid para estas pruebas.
- Cloudflare Whisper y Gemma 4 26B siguen como respaldo de transcripción y tutor, siempre del lado servidor. La voz alternativa de emergencia del navegador no es equivalente a voz full-duplex.
- Pendiente de validación local: aplicar la nueva migración SQL en Supabase; ejecutar `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npm run build`; probar el micrófono y los casos de interrupción/fallo real con Gemini; confirmar que Workers AI acepta el token y los modelos en esa cuenta.
- El último estado de Vercel observado fue `failure` por `build-rate-limit` del plan, no evidencia de un error de TypeScript. No declarar esto estable ni habilitarlo a estudiantes hasta completar pruebas locales y end-to-end.

- La entrada de micrófono Live usa paquetes PCM de 40 ms (antes 100 ms) para reducir el retardo de captura sin inundar el WebSocket.
- Se conserva la transcripción provisional del alumno para recuperar el mismo turno si Live se cierra antes de emitir la transcripción final; el control por turno evita añadir dos veces el mensaje del alumno.
- Se distingue la finalización normal de la cancelación de SpeechSynthesis para que cerrar/interrumpir el tutor no reactive indebidamente el estado de escucha.


## Orby Voice Spanish-first stabilization — 2026-11-02
- La voz principal continúa siendo Gemini Live; los filtros de alcance y la identidad pública de PeakScore se mantienen en la aplicación.
- El reconocimiento de audio Live se configura con la pista BCP-47 `es-ES`, modo `SMART` y vocabulario de dominio con “Oye Orby”, “Hey Orby”, “Orby AI”, PeakScore e ICFES.
- La síntesis de voz nativa se configura con `speechConfig.languageCode = "es"`; las instrucciones de sesión refuerzan español colombiano y alfabeto latino.
- Se agregó `containsUnsupportedSpanishScript` para bloquear escrituras incompatibles con español (incluida devanagari/hindi) en historial, transcripciones de entrada, transcripción de salida y la respuesta final del tutor escrito.
- Una transcripción final no española se sustituye por una petición breve de repetir en español. Las transcripciones provisionales con esas escrituras no se muestran ni se guardan.
- La reproducción de audio Live queda bloqueada hasta que exista transcripción aceptable en español. Para una respuesta determinista (saludo, rechazo de programación, identidad), el texto visible permanece canónico; el audio nativo solo se reproduce si su transcripción coincide con el texto aprobado. Si no coincide o la voz queda sin verificar, se descarta el audio y se usa SpeechSynthesis como respaldo.
- Si se cancela el audio validado, el flujo ahora comprueba el estado real del audio y no un contador histórico de fragmentos para decidir si necesita la voz alternativa.
- Los rechazos de programación se hacen breves y conversacionales: no se vuelve a presentar Orby ni se repite una explicación larga en cada turno.
- El prompt de voz exige ortografía, tildes, concordancia y puntuación correctas, sin abreviaturas de chat y sin muletillas repetidas.
- La suite `npm run test:orby` contiene ahora 44 pruebas automatizadas (41 anteriores + 3 nuevas de idioma/voz y aserciones ampliadas). Deben ejecutarse en el PC después de hacer pull; no se declara compilación ni prueba local aprobada hasta recibir ese resultado.
- No se modificó `main` ni se desplegó a estudiantes. Pendiente: confirmar que la versión local de `@google/genai 2.17.1` acepta toda la configuración, pasar tests/typecheck/lint/build y probar con micrófono real en Chrome/Edge.


- La transcripción del audio generado por Gemini Live ahora se configura también con idioma `es` y modo `SMART`; la síntesis nativa declara `speechConfig.languageCode: "es"`. El reconocimiento de entrada mantiene pista `es-ES` y vocabulario de PeakScore.
- Se corrigió la recuperación cuando solo llega un interim no español y nunca llega el evento final: Orby muestra un turno único `Audio no reconocido.`, solicita repetir en español y lo pronuncia, sin guardar devanagari.
- Las respuestas deterministas (saludo, identidad, rechazo) se mantienen canónicas en la burbuja; la salida de voz solo se acepta si la transcripción coincide progresivamente con ese texto. Una reformulación, presentación repetida o cambio de idioma activa voz alternativa para el texto aprobado.
- Se reforzó la negativa breve para programación y el prompt hablado contra repeticiones de marca, muletillas y faltas de ortografía.


## 2026-11-07 — currículo integral Orby Saber 11
- Documento de diseño curricular: `docs/ORBY-ICFES-CURRICULUM-PLAN.md`.
- Baseline académica: guía Icfes Saber 11 2026-2 + marcos de referencia oficiales para las cinco pruebas; materiales cargados por el propietario como apoyo y prerrequisitos.
- Separar siempre núcleo evaluado, refuerzo escolar y ampliación avanzada. No presentar temas universitarios como requisito Icfes.
- Inglés conserva su banco manual en siete partes. No generar preguntas de Inglés automáticamente sin nueva autorización.
- Restricción económica: solo modelos/servicios gratuitos reales dentro de cuota; al agotarse, pausar/degradar con aviso, sin fallback de pago.
- Esta especificación no supone que el corpus eliminado del Orby ICFES Lab deba reconstruirse ni que existan conteos/conceptos previos.
- Estado: documento y plan creados en `feat/founder-intro`; falta auditar implementación real antes de cambios funcionales. No Pull ni deploy hasta completar CI y pruebas de voz/tablero en navegador.


## 2026-11-07 — auditoría inicial y pizarra visual de voz
- Auditoría: `docs/ORBY-IMPLEMENTATION-AUDIT.md`.
- Currículo: `docs/ORBY-ICFES-CURRICULUM-PLAN.md`.
- Se corrigió el contrato de la herramienta Live para describir los catorce tipos visuales que ya acepta el sanitizador, con coordenadas alineadas a los rangos reales.
- El fallback por turnos de voz ahora solicita board versión 2 con bloques y visuales tipados; antes solo solicitaba versión 1 textual.
- Regresiones estáticas añadidas a `tests/orby-request-filter.test.mjs` para ambos contratos.
- Hallazgo pendiente: la cobertura curricular explícita del prompt es desigual (Ciencias Naturales tiene guía detallada; las otras áreas necesitan matriz equivalente y contexto selectivo desde el catálogo curricular).
- Hallazgo pendiente: la ruta de texto tiene `qualityStatus = not_required` y `reviewMs = 0`; las validaciones actuales no son un verificador semántico general. Reforzar con validadores deterministas acotados y coherencia board-respuesta, sin llamadas pagadas.
- Estado de validación: solo lectura estática; no se ejecutaron pruebas/TypeScript/ESLint/build ni Chrome Live. No afirmar que está probado.
- No hacer Pull ni desplegar hasta CI completa, pruebas reales de voz/tablero y verificación de migración de idempotencia de voz en entorno de prueba.


## 2026-11-07 — estándar obligatorio de Orby como tutor en vivo
- Especificación completa: docs/ORBY-LIVE-TUTOR-SPEC.md. El video compartido por el propietario es la referencia de experiencia: Orby habla mientras construye progresivamente la pizarra con trazos, flechas, fórmulas y etiquetas.
- La voz y la pizarra deben avanzar en paralelo; el tablero debe ser acumulativo, sincronizado con la narración real disponible e interrumpible sin mezclar generaciones.
- Auditoría estática: Live ya recibe snapshots de tablero, pero OrbyBoard.tsx los representa como SVG estático. Aún falta el motor de dibujo progresivo y el contrato de acciones visuales enlazadas a voz. No afirmar que ya se comporta como el video.
- Prioridad: acciones tipadas incrementales con ids/secuencia/generación, cancelación segura, accesibilidad reduced-motion y pruebas de sincronización. No inventar timestamps ni añadir llamadas/proveedores pagados.
- Solo trabajar en feat/founder-intro; no modificar main, desplegar ni ejecutar migraciones remotas sin autorización. No reconstruir material eliminado intencionalmente del Orby ICFES Lab.


## 2026-11-07 — primera animación de trazos de Orby
- OrbyBoard ahora marca conexiones, ejes, curvas, vectores, enlaces moleculares, circuitos y ADN para trazarse al montarse; nodos de diagramas aparecen suavemente.
- CSS incluye movimiento reducido sin animación. Prueba estática añadida para proteger el contrato visual.
- Es una primera capa de presentación para snapshots progresivos, no escritura manuscrita ni sincronización exacta con voz. El secuenciador de acciones y alineación con narración siguen pendientes.
- Relectura de GitHub completada; Node tests/TS/ESLint/build/navegador no ejecutados. La rama sigue divergente de main; no hacer Pull/merge/rebase.


## 2026-11-07 — revelación progresiva de bloques del tablero
- Títulos, fórmulas, pasos, llamadas, párrafos y visuales nuevos se revelan al montarse; etapas fisiológicas y eventos de línea de tiempo usan retrasos escalonados limitados.
- Claves de React basadas en tipo/contenido/posición conservan elementos previos cuando un snapshot acumulativo agrega elementos al final.
- Prueba estática añadida. Sigue siendo aparición de bloques completos, no escritura carácter a carácter ni sincronización exacta con voz. No declarar completo el comportamiento del video.
- Relectura GitHub sí; pruebas runtime/build/browser no ejecutadas.


## 2026-11-07 — tablero y subtítulos dentro de la llamada
- En el escenario de llamada se renderiza la pizarra del mensaje de voz activo y subtítulos en vivo desde la transcripción de salida de Live.
- El control de subtítulos permite mostrarlos/ocultarlos. Se reutiliza el mismo mensaje/tablero y no se agregan llamadas de IA ni proveedores.
- La transcripción depende del texto que Live emite; no hay alineación palabra-a-palabra con el audio. El tablero se actualiza al llegar la herramienta, sin sincronía exacta por trazo todavía.
- Fallback por turnos conserva su aviso y comportamiento degradado; no se fuerza voz adicional.
- Prueba estática añadida y archivos releídos en GitHub; navegador/micrófono/build/TS/ESLint no ejecutados.


## Especificación de experiencia voz + tablero
- Fuente de verdad funcional: docs/ORBY-VOICE-WHITEBOARD-SPEC.md. Define llamada con subtítulos en vivo y tablero simultáneo, continuidad al volver al chat, snapshots acumulativos, interrupciones seguras y QA.
- No declarar listo para Pull hasta validar con Chrome/micrófono y ejecutar Node tests, TypeScript, ESLint y build.


## 2026-11-07 — respuesta de voz visible en el chat
- El mensaje de Orby del turno de voz activo se identifica con estado EN VIVO y anuncia sus cambios de texto mediante aria-live polite; la pizarra permanece en la misma burbuja.
- Escenario de llamada y chat comparten el id del mismo mensaje. Prueba estática añadida; runtime/Chrome/build aún no ejecutados.


## 2026-11-07 — estado de preparación de pizarra
- Durante una pregunta activa sin visual recibido, la llamada muestra una superficie provisional de pizarra; al llegar el tablero validado del mensaje activo, se sustituye por OrbyBoard. Si no se requiere visual, el estado se retira al terminar el turno.
- No genera tablero ficticio ni llamada extra. Test estático añadido; ejecución runtime/build/browser pendiente.


## 2026-11-07 — voz más ágil
- El cierre automático de turno Live se ajustó de 500 a 400 ms en cliente y token efímero servidor, manteniendo configuración alineada.
- Prompt de voz actualizado para respuestas directas, sin relleno, seguimiento contextual y explicación por pasos cuando se necesite; no revela razonamiento interno ni salta filtros.
- 1 segundo es objetivo para primera señal útil, no garantía de respuesta completa. Medir p50/p95 y validar que 400 ms no corte frases.
- Test estático añadido; runtime, Chrome/micrófono, TS/ESLint/build no ejecutados.


## 2026-11-07 — medición de primer audio
- Se registra el tiempo desde la aceptación del turno hasta recibir el primer chunk de audio Live, aparte del momento en que se programa la reproducción audible.
- Métrica por turno, sin registrar texto ni audio. Prueba estática añadida; faltan datos reales p50/p95 y QA de navegador.


## 2026-11-07 — escucha continua manos libres
- La escucha se rearma después de terminar todos los fragmentos de audio de Orby; se mide el ciclo completo hasta quedar listo para la siguiente intervención (`fullConversationCycleMs`).
- Test estático añadido; falta probar en Chrome/micrófono que el estudiante pueda hablar naturalmente sin tocar el botón y sin que el micrófono capture la voz de Orby.


## 2026-11-08 — continuidad de clase en vivo Orby (leer antes de tocar código)
- Nueva bitácora de esta fecha: `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-08.md`.
- La bitácora del 7 conserva solo los registros hasta el 7: `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`.
- No empezar de cero: ya existían clase Live, pizarra teacher-only, board v2 espacial, snapshots acumulativos, sanitización, SVG progresivo, cola serial del lápiz, pausa/reanudación por interrupción, focus espacial, erase/replace, exportación e historial.
- En la tanda del 8 se añadieron `append-block` y `append-strokes` sobre el mismo board v2, con `turnGeneration`, `actionId`, `sequence`, dependencias y staging provisional controlado por sesión/actividad/expiración.
- Se corrigió una regresión de alcance de la guarda provisional y se añadió una prueba específica. Conteo estático al cierre de esta tanda: 229 definiciones de prueba con nombre, sin nombres duplicados ni pruebas vacías detectadas; no equivale a suite ejecutada.
- Pendiente: ejecutar Node tests, TypeScript, ESLint y QA real en Chrome/micrófono. Vercel sigue limitado por `build-rate-limit`; no forzar builds facturables.
- Continuar validando la capa existente antes de crear más arquitectura. No reconstruir material del Orby ICFES Lab eliminado intencionalmente. No tocar `main`, desplegar ni aplicar migraciones remotas.


## 2026-11-08 — fidelidad al video, pizarra lisa, materias y karaoke
- El video enviado por el propietario es la referencia de producto: una única hoja blanca lisa, escritura manuscrita, flechas, etiquetas y dibujo central progresivo. No papel punteado, cuadrícula de fondo ni tarjetas.
- Se quitó el patrón de puntos de `.orby-board-canvas` y de la hoja de clase Live. La pizarra dentro de la llamada queda lisa, sin borde/radio/sombra de panel ni rejilla de tarjetas. Test estático añadido.
- Estándar visual-first para las cinco áreas: Matemáticas (ecuaciones/gráficas/geometría/estadística), Lectura Crítica (subrayado/argumentos/inferencias sobre textos), Sociales y Ciudadanas (mapas/líneas de tiempo/actores/perspectivas/causalidad), Ciencias Naturales (mecanismos/estructuras/reacciones/fuerzas/experimentos) e Inglés (siete partes, vocabulario/contexto/diálogos/gramática/lectura).
- Plan curricular existente: `docs/ORBY-ICFES-CURRICULUM-PLAN.md`; fuente de verdad académica: guía oficial Saber 11 2026-2 y marcos de referencia Icfes. Ejemplos y preguntas deben ser originales, sin copiar cuadernillos protegidos.
- Orby Live ya está conectado al Lab mediante `search_orby_learning_knowledge` y `/api/orby/knowledge-search`, pero solo consulta material `published` (fragmentos, conceptos y relacionados). No presupone que el material eliminado del Lab exista.
- Se alineó la descripción de la herramienta Live para hacer una consulta no bloqueante en cada tema académico nuevo, más una segunda solo si hace falta; límite existente de dos por turno. La voz y la primera acción visual no esperan al Lab. Web pública solo para fuentes/actualidad/verificación.
- Subtítulos palabra-a-palabra siguen pendientes. La UI actual es transcripción normal. Gemini Live streaming no devuelve tiempos por palabra; solo marcas de enunciado. La transcripción de archivo puede aportar tiempos de palabra, pero no es Live y tiene limitaciones de precisión. No fingir sincronización ni añadir servicios de pago.
- Objetivo de respuesta: primera frase útil idealmente ~1 s tras cierre de voz, por medir p50/p95 en Chrome; no es una garantía. Mantener filtros de voz y respuesta.
- Nueva bitácora incluye detalles: `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-08.md`; especificación permanente: `docs/ORBY-LIVE-TUTOR-SPEC.md`.
- Tests estáticos nombrados: 229; no ejecutados. No se certifican TypeScript, ESLint, build ni QA de micrófono. Vercel sigue con `build-rate-limit`.
- No tocar `main`, producción ni Supabase; no ejecutar migraciones; no incorporar proveedores de pago. No reconstruir material del Lab eliminado intencionalmente.


## 2026-11-08 — cuotas y velocidad de Orby Live
- Se corrigió el error crítico que trataba cada HTTP 429/RESOURCE_EXHAUSTED de Gemini como agotamiento de cuota diaria y devolvía bloqueo de 3600 s. Ahora se distingue `quota_exhausted` de throttling RPM/TPM temporal con `GEMINI_LIVE_RATE_LIMITED` y Retry-After 2–30 s.
- Watchdog Live: aviso a 5 s sin progreso, fallback de la misma pregunta a texto a 15 s; se rearma con eventos nuevos, no corta respuestas que siguen avanzando.
- Respaldo TTS: `gemini-3.8-flash-lite-tts`, fragmentos cliente 880 caracteres y endpoint 900 (antes 480/500), máximo un reintento breve de throttling; no dejar al alumno esperando minutos.
- Conteo estático en `tests/orby-request-filter.test.mjs`: 230 tests nombrados, sin duplicados ni tests vacíos. No ejecutados.
- Cuotas reales: Gemini es gratis en Free Tier, pero RPM/TPM/RPD se miden por proyecto y se comparten entre todos los alumnos; consulta Google AI Studio para límites efectivos. Cloudflare comparte 10.000 neuronas/día entre tutor, embeddings y Whisper. No activar billing/plan pagado.
- Claude Free de claude.ai no es Claude API gratuito; la API de Console usa créditos prepagados. No usar como fallback de PeakScore.
- Sigue pendiente: medir p50/p95 en Chrome, revisar uso real de AI Studio/Cloudflare y ejecutar tests/TS/ESLint/build. No afirmar compilación verde.
- Archivos clave: `lib/ai/orby-tts-errors.ts`, `app/api/orby/realtime-session/route.ts`, `app/api/orby/voice-speech/route.ts`, `components/aprender/LessonAITutor.tsx`.


### Fuentes oficiales consultadas para esta actualización
- Gemini API — límites por RPM/TPM/RPD, límites por proyecto y reinicio de RPD: https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API — precios Free Tier de Gemini 3.8 Live y Flash-Lite TTS: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API — modelos de audio y TTS: https://ai.google.dev/gemini-api/docs/speech-generation
- Cloudflare Workers AI — asignación de 10.000 neuronas gratis al día y reinicio UTC: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Anthropic — facturación de la API de Claude mediante créditos prepagados: https://support.claude.com/es/articles/8977456-como-pago-mi-uso-de-la-api-de-claude
- Anthropic — límites variables del plan gratuito de Claude.ai y reinicio de cinco horas: https://support.claude.com/es/articles/8114491-comienza-con-claude

## 2026-11-08 — OmegaX English Studio
- Vista nueva de English Studio dentro del workspace general OmegaX: speaking de 60 segundos, repetición guiada con frase modelo y roleplays cotidianos ajustados a nivel A1–C1.
- La captura de audio requiere consentimiento explícito, máximo 60 segundos/8 MB y se procesa solo tras pulsar transcribir mediante la ruta ya existente de Cloudflare Workers AI gratuita. No se añaden APIs/proveedores ni fallbacks pagados.
- El feedback se remite al chat existente de OmegaX; se puede guardar solo la transcripción como recurso personal.
- Pronunciation practice informa solo coincidencia aproximada de palabras ASR. No simula una puntuación fonética, acento ni entonación.
- Documentación: docs/ORBY-LIVE-CLASS-UPDATE-2026-11-08.md. Prueba estática específica añadida a tests/orby-request-filter.test.mjs.
- Pendiente: ejecutar Node tests, TypeScript, ESLint, build y QA real de micrófono/navegador. No tocar main, producción ni Supabase remoto.


## 2026-11-08 — Live captions contrast correction
- In the white/live captions surface, normal karaoke words now use slate-800 and active words use orange-950 on orange-100 with orange underline. The old slate-100/amber-300 combination lacked contrast on white.
- Regression added to tests/orby-request-filter.test.mjs. Runtime Chrome verification/test execution remain pending; no claim of exact phoneme alignment.

## 2026-11-08 — Live subtitle contrast and assistant identity
- Live captions on the white teaching stage now use readable slate/orange contrast.
- The remaining user-facing workspace text for library ownership and Live resumption timeout uses `assistantLabel`, so OmegaX does not refer to itself as Orby; the specialized Orby identity still works when selected.
- Regression coverage added. 238 named test blocks were counted statically with no duplicate titles; they have not been run.
- Current CI limitation: Vercel build-rate-limit; no GitHub Actions workflow run associated with the current HEAD. Do not claim runtime/build/test success.

## 2026-11-08 — prevención de solapamientos del tablero
- `append-block` ahora rechaza nuevas cajas de texto que se superpongan con cualquier etapa de texto o visual existente en el layout 16:9. El contacto exacto de bordes se permite.
- El feedback de rechazo de la herramienta Live indica conflicto espacial/límite, no un falso problema de ID de tinta.
- Tests añadidos para intersección, borde adyacente y motivo de rechazo útil.
- Protección limitada a acciones incrementales nuevas; no se invalida el historial espacial v2 existente.
- Sigue pendiente ejecutar test runner, TypeScript, ESLint, build y QA real de Chrome/micrófono.

## 2026-11-08 — resultado validado del bloque tutor/pizarra
- En `feat/founder-intro`, `append-block` rechaza intersecciones espaciales con bloques y visuales existentes; el contacto exacto de bordes se permite. La herramienta Live devuelve una causa espacial clara.
- El prompt Live ahora diferencia intención/contexto de palabras sueltas; «sí», «no», «moda», «cocina» o «Python» no provocan rechazo automático.
- La identidad seleccionada gobierna textos y directivas de voz: OmegaX para asistente general, Orby para Ciencias Naturales. Se conserva la dirección de voz femenina suave, natural y con pronunciación colombiana ligera compartida.
- Se corrigió el cierre prematuro del `<style jsx global>` en `LessonAITutor.tsx`; el CSS del workspace claro vuelve a permanecer dentro del template literal.
- GitHub Actions SHA `69eebdcdacf94dd0403b1e7d01ab8e3f7d3135c9`: 239/239 tests, TypeScript, ESLint, audit y Next production build en verde. Run: https://github.com/PeakScore777/PeakScore/actions/runs/42519075898
- Pendiente de validar manualmente: audio/voz Gemini Live real, interrupciones con micrófono físico, render y lápiz de pizarra en Chrome, responsive y permisos/cuotas reales. El build automatizado no certifica estas pruebas.
- `main` permanece intacta; continuar desde `feat/founder-intro`.

## 2026-11-08 — English Studio roleplay de voz
- Al iniciar un roleplay, el CTA abre/reutiliza la llamada de voz de OmegaX y envía el escenario como primer turno. Si hay una sesión Live general activa, se renueva para aplicar el prompt de práctica bilingüe desde el inicio.
- El servidor solo acepta `englishPracticeMode` cuando el asistente es OmegaX. La excepción permite diálogo inglés con correcciones breves en español colombiano; Orby conserva español y Ciencias Naturales.
- La excepción no elimina filtros de programación, cocina, contenido dañino, promoción externa, privacidad ni prompt injection. El fallback gratuito por turnos usa el mismo flag restringido.
- CI del SHA `f1a08ccff8cf7c144d183af8d4acbaa9e259eb60`: 240/240 tests, TypeScript, ESLint, dependency audit y Next.js build aprobados. Run: https://github.com/PeakScore777/PeakScore/actions/runs/42519666204
- QA pendiente: Chrome/micrófono físico, ASR de inglés en tiempo real, barge-in durante inglés, audibilidad del fallback y cuotas reales. No afirmar evaluación fonética.

## 2026-11-08 — karaoke de voz ajustado por palabra
- El karaoke Live calcula el índice usando `getOrbyKaraokeWordIndexForText`, ponderando grupos vocálicos aproximados, longitud y puntuación. Se abandona el reparto uniforme que daba igual duración visual a palabras cortas y largas.
- La animación sigue el reloj real de Web Audio, usa `requestAnimationFrame`, mantiene el índice monotónico y no agrega llamadas al modelo ni temporizadores.
- Es una estimación visual, no alineación fonética ni timestamp palabra por palabra; Gemini Live no suministra esos datos.
- GitHub Actions SHA `8b8894928b5ccd96d010c5509b88338ebe56cb7f`: 240/240 tests, TypeScript, ESLint, dependency audit y Next.js production build aprobados. Run: https://github.com/PeakScore777/PeakScore/actions/runs/42520586985
- Próxima comprobación manual: voz Live real en Chrome, diferencias de ritmo, silencios, respuestas largas y crecimiento de transcripción durante playback.

## 2026-11-08 — sincronización de las etapas de pizarra SVG
- Se corrigió el desfase entre la transición de una etapa espacial y el dibujo de sus paths SVG: `animation-delay` en un grupo no se hereda, por lo que algunas líneas podían terminar antes de que apareciera la etapa.
- `getOrbyBoardProgressiveDelay(index)` centraliza el escalonado. El `startDelayMs` de layout ahora se propaga a diagramas, gráficas, vectores, moléculas, circuitos, células, ADN, anotaciones y procesos fisiológicos.
- Los trazos reales reciben `startDelayMs + stagger`; se eliminaron animaciones duplicadas en los nodos de diagrama y puntos de gráfica. Sketch conserva su cola SMIL/pausa existente.
- GitHub Actions run 42521925925: 241/241 tests, TypeScript, ESLint, dependency audit y Next.js production build aprobados. https://github.com/PeakScore777/PeakScore/actions/runs/42521925925
- QA manual pendiente: comparar en Chrome el comienzo de cada trazo con la voz Live real, pausas, interrupciones y reanudación. No declarar sincronía auditiva real a partir de CI.

## 2026-11-08 — perfil de movimiento natural para la escritura de OmegaX
- Se añadió `getOrbySketchMotionProfile(points)` en `lib/ai/orby-board.ts`: calcula un perfil temporal suave y adapta ligeramente la distribución del movimiento según los cambios de dirección del trazo.
- `components/aprender/OrbyBoard.tsx` aplica el mismo perfil spline al recorrido de la punta del lápiz y al revelado de la tinta, para mantenerlos sincronizados. Se conserva la cola serial, pausa/reanudación del reloj SVG, duración geométrica y staging acumulativo.
- Se añadió una regresión estática/funcional que compara trazos rectos y curvos y verifica que tinta y lápiz compartan la curva.
- Commits: `3be12f3` (helper), `e6f869c` (renderer), `8c7d72c` (prueba).
- Estado de validación: los commits están en `feat/founder-intro`; no se ha ejecutado localmente el test runner, TypeScript, ESLint ni build para esta tanda. No atribuirle la validación CI de commits anteriores. La comprobación visual con voz Live real en Chrome sigue pendiente.
- No se modificó transporte de voz, cuotas, proveedor IA, pizarra espacial, `main`, despliegue ni Supabase remoto.


## 2026-11-08 — movimiento de escritura, accesibilidad y derivaciones por etapas
- `components/aprender/OrbyBoard.tsx`: se añadió una regla real para `prefers-reduced-motion: reduce`. Desactiva animaciones de entrada, SMIL y trazado por dash; oculta el cursor móvil y deja visibles la tinta completa, los rótulos y los puntos finales. El contenido no desaparece al reducir movimiento.
- La tinta manuscrita y la punta del lápiz comparten ahora `getOrbySketchMotionProfile(points)`, con curvas spline suaves adaptadas de forma moderada a la curvatura del recorrido. No altera geometría ni pretende modelar escritura humana exacta.
- `app/api/orby/realtime-session/route.ts`: se reforzó la instrucción de enseñanza de Matemáticas, Física y Química para construir derivaciones una línea por evento incremental, conservar igualdades anteriores, explicar transformaciones y unidades y no adelantar resultados.
- `tests/orby-request-filter.test.mjs`: pruebas de regresión para movimiento reducido y derivaciones visibles. La suite aún requiere ejecución en el HEAD final.
- `docs/ORBY-LIVE-TUTOR-SPEC.md`: se corrigió un estado obsoleto que decía que el karaoke no existía. El estado real es resaltado aproximado por reloj de reproducción, no alineación fonética/word timestamps exactos; se añadió el contrato de movimiento reducido.
- Commits de esta tanda: `777b66a` (reduce motion), `e9174ae` (derivaciones por etapas), `d501f01` (regresiones), `7e77325` (especificación).
- Validación: ningún test runner, TypeScript, ESLint ni build fue ejecutado para estos commits. El Vercel build-rate-limit visto en el historial es un límite del servicio, no una validación del nuevo HEAD. Chrome/micrófono y preferencia OS siguen pendientes.
- Se mantiene `feat/founder-intro`; no se tocó `main`, Supabase remoto, proveedores ni despliegue.

- **Corrección adicional del perfil SMIL:** la versión inicial del easing declaraba cuatro keyTimes pese a que el trazo solo tiene los extremos implícitos. Se corrigió a un único intervalo válido `0;1`; `animateMotion` declara explícitamente `keyPoints="0;1"`. La spline se adapta dentro del intervalo sin inventar keyframes. Prueba ajustada para verificar la cardinalidad y el mismo perfil en tinta y lápiz. Commits: `3c18f41`, `f18ade7`, `d7cb8da`.


## 2026-11-08 — derivaciones por etapas también en tutor de respaldo
- Se encontró una diferencia de pedagogía: `app/api/orby/realtime-session/route.ts` exigía derivaciones incrementales, pero el prompt del tutor de respaldo `app/api/lesson-tutor/route.ts` solo pedía un tablero tipado genérico.
- Se sincronizó el fallback: en Matemáticas, Física y Química, cada transformación debe ir en un bloque `formula` o `step` independiente, conservar los pasos anteriores, explicar la operación, definir símbolos/unidades y comprobar el resultado. Se añadieron reglas equivalentes para voz y para seguimientos cortos que requieren varias operaciones; los saludos/respuestas simples no fuerzan pizarra.
- Se corrigieron las regresiones del perfil SMIL para probar el intervalo real `0;1`, el punto de recorrido `0;1` y los valores spline compartidos entre tinta y lápiz.
- Se añadieron regresiones para el fallback de voz/pizarra y la continuidad de las derivaciones. Inventario estático actual: 245 pruebas nombradas, sin títulos duplicados; no significa que se hayan ejecutado.
- Commits de continuidad: `4b5254a` (corrección de aserciones SMIL), `156159a` (fallback paso a paso), `056d33a` (seguimientos), `480164b` (prueba fallback), `da3a3a8` (prueba de seguimiento).
- Verificación de rama: `feat/founder-intro` figura divergente respecto a `main` (comparación: 3724 ahead / 9 behind en el comparador); no se hizo merge, rebase ni cambio de `main`.
- Validación pendiente: no se ha ejecutado `npm run test:orby`, TypeScript, ESLint ni `next build` para este HEAD. El status disponible de Vercel reporta `build-rate-limit`; el conector no expone ejecuciones push de GitHub Actions. El checkout local también falló por resolución DNS de github.com en este entorno. Sí se comprobó en Node el patrón regex corregido de la prueba SMIL, pero no sustituye la suite.
- No se añadieron proveedores, modelos, dependencias ni APIs facturables. Sin despliegue, sin migraciones remotas y sin acceso de escritura a `main`.

- **Compatibilidad de fórmulas con el renderer:** Live y tutor de respaldo ahora exigen notación matemática legible en texto plano para los bloques `formula`/`step` (sin comandos LaTeX, HTML ni Markdown complejo), porque `OrbyBoard` renderiza esos bloques como texto manuscrito. Se añadieron aserciones para ambas rutas. Commits: `36a3587`, `4f34a50`, `9625453`.


## 2026-11-08 — señalamiento exacto de un punto del dibujo
- Se amplió la acción docente `focus`: ahora admite `strokeId` y un `pointIndex` opcional, índice desde cero dentro de los puntos reales de ese trazo. Si se omite, el foco conserva el comportamiento anterior y apunta al punto medio. El foco por `elementId` sigue siendo de etapa completa y no admite `pointIndex`.
- `lib/ai/orby-board-actions.ts` valida tipo entero, rango permitido del contrato y luego comprueba contra la longitud real del trazo. Un índice que pase el schema pero no exista en la geometría es rechazado. La operación no cambia ni añade tinta.
- `components/aprender/OrbyBoard.tsx` muestra un foco localizado: anillo pulsante, punto central, línea guía y etiqueta; usa solamente coordenadas existentes. Con movimiento reducido se conserva el marcador en estado estático.
- `lib/ai/orby-live-tools.ts` expone `pointIndex`; el prompt de sesión Live explica cuándo usarlo y prohíbe inventar índices/coordenadas. El cliente devuelve un motivo específico cuando el punto no existe.
- Se añadieron regresiones para índice exacto, límite inválido, índice fuera del tamaño real, conservación de tinta y renderer/schema/prompt. Inventario estático actual se verificará al cerrar; no confundirlo con ejecución.
- Commits de esta mutación: `9abd98b`, `437422c`, `0c79237`, `08f3ee3`, `29e041e`, `0131870`, `39292bc`, `0276b71`, `7056c1b`, `e6f8990`, `3f14540`.
- Validación: no se ha ejecutado la suite completa, TypeScript, ESLint ni build para este HEAD. QA real de Chrome/Live y movimiento reducido permanece pendiente. Sin proveedores facturables, migraciones, despliegue, merge ni rebase de `main`.

- Cierre de inventario estático de regresiones: **246 pruebas nombradas, 0 nombres duplicados**. Es conteo/inspección del archivo, no ejecución; `npm run test:orby`, TypeScript, ESLint, build y QA Chrome siguen pendientes para este HEAD.


## 2026-11-08 — retirar el señalador sin borrar la pizarra
- Se añadió la acción docente `clear-focus` a `lib/ai/orby-board-actions.ts`. Requiere la generación actual y no acepta IDs, índice, etiqueta ni selección: solo retira `teacherFocus`.
- `applyOrbyBoardAction` devuelve una copia de la misma pizarra con `teacherFocus: undefined`. Conserva bloques, dibujos, IDs de trazos, geometría, layout y secuencias. No usa `erase`, no elimina tinta y no crea una operación de escritura.
- `lib/ai/orby-live-tools.ts` expone la operación en el enum de Gemini Live y documenta cuándo utilizarla; el schema conserva una única propiedad `strokeIds` para borrado selectivo.
- El prompt de `app/api/orby/realtime-session/route.ts` ordena retirar el foco al terminar de explicar el detalle o pasar a otra parte. Prohíbe usar `erase` para quitar un foco.
- `components/aprender/LessonAITutor.tsx` responde explícitamente que el indicador se retiró y que la tinta/contenido permanecen intactos.
- Se añadió la regresión `clear-focus retira solo el señalador y conserva intactos bloques, tinta y layout`, incluyendo rechazo de generación ausente y de targets adicionales.
- Inventario estático actual: **247 pruebas nombradas, sin títulos duplicados**. El conteo no significa que la suite se haya ejecutado.
- Commits de esta mutación: `1c6d8df` (acción), `c2d0f8e` (schema Live), `3c362d9` (schema sin propiedad duplicada), `4b89988` (directiva Live), `805e7bc` (confirmación del cliente), `e6ab60f` (regresión).
- Sin cambios a `main`, sin merge/rebase, despliegue, migración ni proveedor de pago. Pendientes: ejecutar tests, TypeScript, ESLint, build y QA real Chrome/Gemini Live. Vercel continúa con `build-rate-limit`.

- Sincronización final: la enumeración del prompt ahora incluye expresamente `clear-focus`; se corrigió también la expresión regular de la prueba de schema para reflejar el JSON real. Commits adicionales: `1b88395` (prompt) y `3e7d2f3` (aserción).
- Inventario estático tras añadir la prueba de clear-focus: **247 pruebas nombradas, 0 títulos duplicados**. No se han ejecutado.


## 2026-11-08 — señalamiento de subelementos dentro de visuales
- Se amplió `focus` con `targetId` opcional junto a `elementId`. El ID debe pertenecer al visual exacto del layout espacial; no son coordenadas libres. El servidor comprueba el tipo del visual y que el target exista exactamente una vez antes de guardar el foco.
- Tipos compatibles en esta iteración:
  - `diagram`: nodos (`nodes[].id`).
  - `molecule`: átomos (`atoms[].id`).
  - `cell`: orgánulos que el renderer dibuja como elemento independiente (`organelles[].id`); membrana y pared celular quedan excluidas porque hoy se pintan como contorno general.
  - `circuit`: componentes (`components[].id`).
  - `organ-system`: estructuras anatómicas (`structures[].id`).
- `components/aprender/OrbyBoard.tsx` muestra un anillo rojo, punto, línea guía y etiqueta en la geometría existente. Usa el mismo componente visual de foco en los cinco renderers, mantiene el escalado del SVG y respeta la configuración de movimiento reducido.
- No se habilitaron todavía flechas/conexiones de diagramas, enlaces moleculares, cables, puntos de gráficas/vectores, partes neuronales ni contornos de membrana/pared celular: no disponen de un target visual con ID/posición independiente adecuado en el renderer actual.
- Gemini Live expone `targetId` y recibe instrucciones para enviarlo solo junto al `elementId` correcto. El cliente devuelve una explicación cuando el ID no pertenece a ese visual.
- Se añadieron regresiones para los cinco tipos soportados, conservación del visual original, target inexistente, target dirigido a un bloque de texto, gráfica sin IDs y membrana no renderizada como objetivo separado.
- Inventario estático actual: **249 pruebas nombradas, 0 títulos duplicados**. Son pruebas escritas/contabilizadas, no ejecutadas.
- Commits de esta mutación: `b6e9849` (validación de targets), `bb305b8` (tipo teacherFocus), `c9eaaf9` (marcadores SVG), `e6853a8` (schema Live), `bfb8918` (prompt), `2061256` (respuesta de error/éxito), `3c2b6fa` (regresiones), `06536d7` (JSX de orgánulos), `f08e97a`, `73b0246`, `673bae6` y `9c06d2e` (robustez de pruebas y clear-focus).
- Pendiente: ejecutar `npm run test:orby`, TypeScript, ESLint, build y QA Chrome/Gemini Live. No se tocó `main`, no se hizo merge/rebase ni despliegue, y no se añadieron proveedores de pago.

- Cierre de prueba de renderer: se agregó una aserción explícita para el target de componentes de circuito (`currentId={component.id}`). Inventario estático final permanece en **249 pruebas nombradas, 0 duplicados**; no ejecutadas.


## 2026-11-08 — siguiente fase OmegaX: coreografía pedagógica de acciones
- La meta inmediata no es añadir más dibujos aislados: OmegaX debe coordinar una explicación como una secuencia pedagógica continua sobre un mismo tablero.
- Flujo objetivo: crear/actualizar un visual → señalar un subelemento existente → explicar su función → retirar únicamente el foco con `clear-focus` → señalar otro objetivo → comparar → añadir una relación nueva sin borrar el contexto previo.
- Cada acción debe pertenecer al `turnGeneration`/`activityGeneration` activo, conservar IDs estables y validar sus referencias contra el snapshot vigente. Una interrupción debe cancelar las acciones pendientes y descartar resultados tardíos.
- La secuencia debe ser incremental e idempotente: no duplicar dibujos, no reiniciar el tablero y no reproducir acciones ya confirmadas al reanudar.
- Prioridad de ampliación de targets: electrones/partículas y componentes internos de visuales existentes; después enlaces moleculares, flechas/aristas, cables y puntos de gráficas/vectores. Cada target necesita ID y coordenadas reales del renderer antes de habilitarse.
- No simular sincronía palabra-a-palabra. Usar el orden real de eventos y, si el proveedor aporta segmentos temporales fiables, vincularlos sin inferir timestamps.
- Criterios de cierre: pruebas ejecutadas (no solo inventariadas), TypeScript, ESLint, build y QA Chrome/Gemini Live con voz real, pausa, reanudación e interrupción. `main` permanece intacta.


## 2026-11-08 — OmegaX English Studio CEFR A1–C2 + método ICFES transversal
- Se confirmó que `components/aprender/OmegaXEnglishStudio.tsx` ya ofrecía speaking de 60 segundos, repetición guiada, grabación, transcripción, roleplays de voz con OmegaX y envío de feedback al chat. Se evolucionó ese flujo existente, sin crear un segundo tutor.
- El selector ofrece ahora A1, A2, B1, B2, C1 y C2 con descriptores pedagógicos y coaching de complejidad por nivel. El nivel es una meta elegida, no certificación ni clasificación automática.
- Los prompts de roleplay incluyen interacción de una pregunta por turno, correcciones limitadas y explicación de gramática en español con ejemplos en inglés. El feedback exige evidencia textual, hasta dos mejoras prioritarias, frase original/corrección/razón, modelo y mini-reto de reintento.
- Live y fallback incluyen un método de pizarra específico para las cinco áreas: Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés. Se reutilizan los perfiles ya presentes en `lib/ai/orby-scope.ts`.
- English Studio general A1–C2 queda separado de la preparación de Inglés Saber 11. La preparación de examen debe respetar las siete partes y el banco manual autorizado existente; no crear preguntas dentro del banco ni presentar ejercicios originales como oficiales. C1/C2 no son niveles oficiales de desempeño Saber 11.
- English Studio puede usar la pizarra para orden de palabras, contraste original/corrección, tiempos verbales, conectores, vocabulario, lectura anotada y estructuras de preguntas. La llamada Live y el fallback conservan los filtros y el flag limitado a OmegaX.
- Nueva especificación: `docs/OMEGAX-ACADEMIC-COACH-SPEC.md`, con ciclo hablar → feedback → reintento, ruta de inglés por habilidades, cinco métodos ICFES, estado real y roadmap.
- Inventario estático de `tests/orby-request-filter.test.mjs`: **252 pruebas nombradas y 0 duplicados**. Es un conteo del archivo, no ejecución. Para este HEAD siguen pendientes suite, TypeScript, ESLint, build y QA Chrome/micrófono.
- Sin proveedores ni cargos nuevos, sin migraciones remotas, sin despliegue y sin cambios a `main`.


- **Extensión del 2026-11-08:** los retos de speaking y frases modelo de repetición ahora tienen bancos propios por nivel A1–C2. El prompt cambia con el selector; el audio modelo pronuncia la frase dinámica del nivel y cambiar de nivel queda bloqueado mientras exista grabación/transcripción pendiente. No es certificación.
- Inventario estático actualizado tras esta regresión: **253 pruebas nombradas, 0 duplicados**; no ejecutadas.


- **Refactor de consistencia 2026-11-08:** el tutor de respaldo importa y reutiliza `buildIcfesPedagogyInstruction(normalizeIcfesSubject(...))` desde `lib/ai/orby-scope.ts`, de modo que Live y fallback comparten los perfiles curriculares en lugar de mantener una segunda lista paralela.
- Última regresión añadida: `Live y fallback enseñan inglés CEFR en pizarra y diferencian las cinco áreas ICFES`; inventario estático permanece en 253 tests nombrados, sin duplicados.
- Último commit de código/prueba consultado: `9c09a7e`. Status de Vercel: `build-rate-limit`; consulta de workflow runs no devolvió ejecuciones asociadas. Suite, TypeScript, ESLint, build y QA manual siguen pendientes.


## 2026-11-08 — English Studio: Listening, Reading y Writing
- Se ampliaron los modos del componente `OmegaXEnglishStudio` de `speaking/pronunciation` a cinco destrezas: `speaking`, `pronunciation`, `listening`, `reading`, `writing`.
- Listening: dos guiones/preguntas originales por cada nivel A1–C2; reproducción mediante voz TTS del navegador, controles de repetir/revelar transcripción y respuesta escrita. El UI informa que no es audio nativo de hablante.
- Reading: dos textos breves originales por nivel con preguntas y evidencia textual esperada.
- Writing: dos consignas por nivel, rango de palabras orientativo, checklist y editor con contador.
- Cada ejercicio envía a OmegaX contexto de tarea y respuesta; el prompt de feedback diferencia comprensión auditiva, lectura y producción escrita, valida paráfrasis y no inventa errores.
- Guardado: speaking/pronunciation permanece en grabaciones; respuestas de listening/reading/writing se guardan como notas.
- Se amplió el tipo Mode compartido y se reinicia el TTS cuando cambia nivel/actividad para evitar estados colgados.
- Nuevo inventario estático tras esta tanda: **255 pruebas nombradas, 0 duplicados**. No se ejecutaron localmente.
- Pendiente: ejecutar suite/TypeScript/ESLint/build y QA Chrome en los cinco modos. La reproducción de listening es TTS del navegador, no una grabación de acento nativo; hay un primer panel de observaciones por habilidad, pero aún no tendencias temporales deduplicadas ni revisión espaciada.

- Robustez UX: el selector de nivel queda desactivado mientras existe una respuesta de texto sin guardar o una grabación pendiente; la tarjeta ya activa se desactiva para no reiniciar accidentalmente el ejercicio. El cambio de nivel detiene el TTS y reinicia el estado de listening.


## 2026-11-08 — memoria de aprendizaje por destreza de English Studio
- El callback de feedback transmite el modo exacto a `sendMessage` y a `/api/lesson-tutor`: speaking, pronunciation, listening, reading o writing. El modo también viaja dentro de la cola de mensajes si la carga de historial retrasa el turno.
- El endpoint normaliza la destreza con allowlist y solo la acepta para OmegaX. Los mensajes de feedback con skill válido admiten hasta 7.000 caracteres para no truncar texto/pregunta/respuesta; el resto mantiene 1.200.
- Las señales se guardan en la tabla existente `orby_student_learning_signals`, con `subject = Inglés` y prefijo de tema `English Studio · <Skill> · <topic>`. No hubo migración ni cambio de columnas.
- El retrieval de feedback fuerza recuperación de aprendizaje, filtra por usuario, Inglés y la destreza exacta; la próxima práctica de esa misma destreza puede usar confusiones y teaching_hint anteriores. No mezcla señales entre habilidades.
- Se conserva el umbral de confianza >= 0.8, concepto no vacío y estado permitido. No hay puntaje automático ni certificación CEFR.
- El panel Progreso incluye tarjetas separadas para Speaking, Pronunciation, Listening, Reading y Writing; muestra recuentos de observaciones y proporción de estados guardados, aclarando que no es porcentaje de dominio.
- Estado Supabase comprobado: la tabla existe, RLS habilitado, 0 filas y 0 políticas en pg_policies. El endpoint GET usa supabaseAdmin con filtro explícito por user_id autenticado; no dar acceso directo desde navegador.
- Los roleplays Live no generan señales automáticamente aún: la señal se crea cuando el alumno envía una práctica desde English Studio para feedback.
- Suite, TypeScript, ESLint, build y QA de navegador siguen pendientes; Vercel reporta build-rate-limit.

- **Separación importante:** un `learningSkill` válido activa solo la memoria personal de señales de esa destreza; no fuerza por sí mismo búsqueda vectorial/grafo conceptual en Orby Lab. La búsqueda académica habitual conserva su detector independiente. Así, una corrección de Reading/Writing no provoca búsquedas de documentos del Lab sin necesidad.
- Si una consulta además requiere material académico por su propia intención, la búsqueda se limita a Inglés cuando la skill activa es de English Studio.
- Inventario estático actual: 257 tests nombrados, 0 duplicados; no ejecutados.

- El endpoint selecciona el prompt pedagógico completo cuando hay skill activa para que el feedback use la memoria previa; esto no habilita recuperación vectorial del Lab. La búsqueda documental y la memoria del alumno permanecen separadas.

- Tras recibir feedback de English Studio, el panel de progreso vuelve a leer `/api/orby/learning` y actualiza las señales sin otra llamada al modelo; un fallo de refresco no elimina ni bloquea la respuesta.


## Backlog acordado — siguiente evolución de OmegaX (pendiente, no implementado)

1. **Cerrar la base actual:** arreglar regresiones de tests detectadas por Vercel, ejecutar suite completa, TypeScript, ESLint, build y QA Chrome; obtener Preview READY del HEAD antes de presentarlo como actual.
2. **Perfil longitudinal por habilidad:** consolidar observaciones repetidas por usuario/materia/destreza/concepto con fechas y evidencia; diferenciar error aislado de patrón persistente, y medir recurrencia/retención sin fabricar porcentajes de dominio.
3. **Patrones y eficacia pedagógica:** detectar confusión conceptual, procedimiento, vocabulario o lectura de consigna; registrar si una estrategia fue seguida por mejora observable, sin atribución causal injustificada.
4. **Siguiente práctica recomendada:** escoger una actividad nueva según evidencia reciente, recurrencia, dificultad y objetivo del alumno; explicar el motivo, dejar descartarla y adaptar gradualmente A1–C2 sin etiquetar permanentemente.
5. **Revisión espaciada:** repreguntar conceptos en intervalos y evaluar transferencia con ejercicios diferentes, no con repetición literal.
6. **Live y roleplay:** guardar señales al final de turnos completos cuando haya transcripción/contexto suficientes, con idempotencia; no registrar fragmentos parciales ni fingir medición fonética/acústica desde texto.
7. **Pizarra integrada:** desarrollar secuencias didácticas para Writing, Reading, Listening y Speaking; mantener dibujo y voz sincronizados y acumulativos.
8. **Privacidad/control:** explicar señales, pausar personalización, borrar observaciones o reiniciar memoria personal; conservar aislamiento por usuario y revisar RLS antes de ampliar acceso.
9. **Cobertura ICFES:** trasladar el recomendador y la memoria a Matemáticas, Lectura Crítica, Sociales y Ciudadanas y Ciencias Naturales, manteniendo cinco áreas y las habilidades CEFR del inglés por separado.

Criterios: evidencia visible para cada recomendación; dos errores aislados no diagnostican patrón; destrezas no se mezclan; el alumno puede pausar/borrar memoria; nada de porcentajes de dominio ni certificaciones no validadas. Mantener presupuesto gratuito estricto: sin API/modelo pago, créditos facturados o fallback silencioso; agotada la cuota gratuita, avisar y degradar/pausar.


## Estado de preview y diagnóstico de Vercel — 2026-11-08 (reemplaza menciones anteriores a build-rate-limit)
- Deployment más reciente inspeccionado para `feat/founder-intro`: commit `a53918ddae0bf5b6b30802154f796c9f7727498f`, estado ERROR. Los logs de Vercel muestran que `npm run build` terminó con código 1 al ejecutar `tests/orby-request-filter.test.mjs`: una aserción antigua esperaba `disabled={recording || transcribing || Boolean(blob)}`, pero el componente ya añade la protección `Boolean(writtenResponse.trim())` para no perder respuestas sin guardar.
- Corrección registrada en el commit `b01c3e4f56169679e5a7f39652165ac9f920f759`: la prueba ahora exige la protección nueva. La rama `feat/founder-intro` continuó con commits de backlog y documentación posteriores; la URL anterior no corresponde a ninguno de esos HEAD.
- No existe todavía un deployment Preview asociado a ese HEAD. El intento de crear uno fue rechazado por Vercel con HTTP 402: límite `api-deployments-free-per-day`, más de 100 deployments API en el día y `retryAfter=86400`. No se hizo deploy a producción. No hay Vercel CLI ni checkout local disponible para usar el fallback CLI.
- Preview estable anterior disponible y comprobada HTTP 200: https://peak-score-5daaqgf8a-peak-score.vercel.app — corresponde al commit `3be12f33d4b2dc7d3fa527aad6b080e5de271cda`; es antigua y NO incluye los labs Listening/Reading/Writing ni la memoria adaptativa por destreza añadidos después. Compartirla solo como muestra del estado anterior, no como preview actual.
- Estado de pruebas: 257 bloques nombrados y sin duplicados en el inventario estático; la suite completa sigue sin confirmación de ejecución correcta tras la corrección. No declarar build verde, ni que el HEAD actual ya se puede probar desde Vercel.


## 2026-11-08 — English Studio: aclaración de inicio de llamada
- El bloque Real-life roleplay explica explícitamente que OmegaX inicia la llamada de voz al comenzar y envía el escenario como primer turno.
- La acción continúa conectada a `startOmegaXEnglishRoleplay`; no se añade una ruta paralela ni una llamada de IA adicional.
- El test local reportado por el usuario: 261/262; la única falla era una aserción estática que buscaba esta frase y no estaba visible en el componente. Se añadió el texto de ayuda para alinear interfaz y contrato.
- Pendiente volver a ejecutar `npm run test:orby`, TypeScript, ESLint y build en el checkout local. No se afirma validación completa ni QA de micrófono real.
- Sin cambios a `main`, Supabase remoto, despliegue ni proveedores de pago.


## 2026-11-09 — OmegaX Live: experiencia de clase manos libres
- Referencias visuales revisadas: tres grabaciones de Studdy/Studley y capturas de biblioteca, explorador, aplicaciones, resolutor y pricing. La referencia principal para la clase es Studdy: pizarra amplia, controles discretos en la parte inferior, profesor visual y explicación progresiva.
- Objetivo confirmado: al iniciar una sesión Gemini Live, el micrófono queda abierto y el alumno habla sin pulsar para cada turno; el control de micrófono solo silencia/reactiva. OmegaX responde en voz, permite interrupción (barge-in) y coordina sus acciones de pizarra con la explicación.
- La rama ya dispone de captura continua AudioWorklet, VAD/transcripción Live, interrupción de voz, snapshots acumulativos de pizarra, acciones docentes, foco de subelementos y animación de trazos. No reconstruir estas piezas como un segundo tutor.
- Mejora UX aplicada: el estado inicial de la pizarra ahora presenta una identidad visual de clase OmegaX, estado explícito de micrófono manos libres y copy diferenciado para Live frente al respaldo por turnos.
- El respaldo actual Whisper/Cloudflare sigue siendo por turnos y no debe presentarse como llamada manos libres. No introducir STT de pago ni servicios que puedan facturar.
- Pendiente: rediseño completo de la sala (pizarra central, presencia/voz de OmegaX, subtítulos y controles inferiores); probar Live manos libres, mute y barge-in en Chrome; sincronizar secuencias de pizarra con la explicación sin inventar timestamps; evaluar solo alternativas gratuitas compatibles con privacidad.
- Mantener identidad PeakScore/OmegaX original, sin copiar marcas ni assets. No tocar main, Supabase remoto ni producción. Sin proveedores de pago.


## 2026-11-08 — rediseño de OmegaX como profesor Live (referencias Studley/Studdy)
### Dirección de producto acordada
- OmegaX debe sentirse como una clase particular en directo, no como un chatbot con una pizarra decorativa.
- Referencias visuales y de interacción aportadas por el usuario: Studley (explorador de materiales, organización, tarjetas limpias, herramientas y espacios de estudio) y Studdy (escenario de pizarra amplio, navegación mínima, clase centrada en el contenido y acciones de estudio).
- No copiar marca, textos, ilustraciones ni identidad visual de esos productos. Crear una identidad PeakScore propia: fondo marfil/blanco, tinta carbón, acento naranja PeakScore, bordes suaves, tipografía clara, iconografía Lucide consistente y sin emojis decorativos.
### Contrato de llamada manos libres
- Al pulsar «Iniciar clase», solicitar permiso de micrófono y establecer la sesión Gemini Live; una vez conectada, el micrófono queda abierto automáticamente.
- El estudiante habla de forma natural sin pulsar para cada turno. El control de micrófono es exclusivamente silenciar/reactivar la entrada; no es un botón push-to-talk.
- La salida de voz debe poder interrumpirse por voz del estudiante (barge-in) y detener inmediatamente el audio pendiente, congelar la secuencia de pizarra y priorizar la nueva intervención.
- La llamada finaliza únicamente al usar «Salir/finalizar» o al perderse la sesión sin posibilidad de recuperación. El estado de silencio debe ser visible y accesible.
- No presentar el modo de respaldo por turnos como llamada continua. Si Live no está disponible o agota cuota gratuita, informar claramente y ofrecer el modo por turnos como alternativa explícita, sin proveedor/API facturable.
### Contrato de profesor y pizarra
- La voz y la pizarra deben compartir una única generación de turno y una secuencia pedagógica. Cada etapa visual debe estar asociada a la explicación que la introduce (spokenCue); evitar revelar toda la solución antes de explicarla.
- La pizarra docente debe ser grande, blanca, lisa y prioritaria. OmegaX escribe progresivamente: título/idea, dibujo o esquema, etiquetas, relaciones/flechas, ejemplo y conclusión. Mantener tinta previa y añadir solo los trazos nuevos, sin duplicados ni saltos.
- Al interrumpir, pausar la cola de trazos; al retomar, continuar desde el snapshot aceptado más reciente. Una pregunta nueva invalida las acciones tardías de la generación anterior.
- La explicación debe ser pedagógica, con ejemplos y comprobación de comprensión; no limitarse a leer el texto de la pizarra.
### Dirección de interfaz
- Workspace general: jerarquía visual similar a un producto educativo moderno; navegación lateral compacta para Chat, English Studio, Biblioteca, apuntes y progreso; historial y búsqueda ordenados; tarjetas sin emojis, sin exceso de bordes ni bloques apretados.
- Inicio de OmegaX: bienvenida breve, campo para elegir tema/materia/nivel y acciones de subir/pegar/grabar, sin llenar la pantalla de tarjetas redundantes.
- Clase Live: topbar discreta con materia/tema y estado real de conexión; lienzo docente ocupa la mayor parte del viewport; subtítulos opcionales y legibles; barra inferior centrada con controles de silencio, subtítulos y finalizar. Sin controles de grabación en la modalidad Live.
- Estados visuales diferenciados y honestos: conectando, Live escuchando, estudiante hablando, OmegaX respondiendo, OmegaX dibujando, interrumpido, micrófono silenciado, reconectando, fallback por turnos y finalizado.
- Responsive: escritorio prioriza pizarra; móvil reorganiza controles y navegación sin ocultar el estado del micrófono ni el botón de finalizar.
### Auditoría técnica inicial del 2026-11-08
- LessonAITutor.tsx ya contiene toggleVoiceMode, voiceMuted, voiceMuteGainRef, captura continua, interruptCurrentVoiceOutput, manejo de ACTIVITY_START/END, OrbyBoard y secuencias de acciones. La interfaz actual ya comunica «No necesitas pulsar el micrófono para intervenir» en el estado vacío Live y su botón principal se etiqueta como «Silenciar micrófono»/«Activar micrófono».
- Por tanto, no reimplementar captura de audio ni barge-in desde cero. El problema a resolver es verificar que el build que el usuario está viendo corresponde al HEAD actual y auditar la conexión real en Chrome; además, la interfaz debe hacer inequívoco que el micrófono es mute, no push-to-talk.
- OrbyBoard.tsx y orby-board-actions.ts ya implementan tablero SVG y acciones tipadas con generación/secuencia. Extender esa base en vez de crear otro motor de pizarra.
- Los videos aportados muestran la diferencia objetivo: la referencia Studdy desarrolla una clase en una hoja blanca con diagramas progresivos y explicaciones anotadas; el clip vertical muestra a una tutora escribiendo a mano mientras habla. La referencia actual de PeakScore muestra un workspace más denso y una experiencia de pizarra que aún no se percibe como clase guiada continua.
### Plan de implementación priorizado
1. Confirmar commit/branch de la app local que el usuario está probando; no asumir que un preview antiguo contiene el HEAD actual.
2. QA de manos libres: permiso inicial, audio entrante/saliente simultáneo, mute real, eco, detección de fin de voz, barge-in mientras OmegaX habla/dibuja, reanudación y fin de llamada.
3. Rediseñar el workspace general y la vista Live con componentes y estilos existentes, sin tocar las rutas de seguridad ni las políticas de materias.
4. Mejorar la coreografía de pizarra: snapshots acumulativos con spokenCue, escritura por etapas, pausa/reanudación robusta y estado de dibujo visible.
5. Añadir tests de regresión para mute, captura continua, interrupción, generación obsoleta y fallback claramente etiquetado.
6. Ejecutar npm run test:orby, npx tsc --noEmit, lint y build en checkout local; después QA manual de Chrome con micrófono real.
### Límites y no-regresiones
- No cambiar main, desplegar, fusionar ramas ni aplicar migraciones remotas en esta fase.
- No introducir servicios, modelos, créditos o fallbacks que puedan facturar. Respetar cuotas gratuitas y detener/degradar con aviso cuando se agoten.
- No reconstruir el material de Orby ICFES Lab eliminado intencionalmente.
- Mantener filtros de seguridad, alcance Saber 11, identidad OmegaX/Orby y excepción bilingüe limitada a OmegaX.


## 2026-11-08 — avance implementado: primer rediseño visual de OmegaX
### Rama y alcance
- Rama de trabajo: `feat/founder-intro`.
- Se modificaron el workspace y la escena Live en `components/aprender/LessonAITutor.tsx`, y los estilos globales en `app/globals.css`.
- Se mantuvo el motor de voz, la conexión Gemini Live, el fallback gratuito y el motor de pizarra existentes. No se reescribieron las rutas de sesión, filtros, audio worklet ni secuenciación SVG.
- No hubo cambios a `main`, despliegues, migraciones, Supabase remoto, dependencias o proveedores/modelos de pago.
### Cambios de interfaz implementados
- Pantalla inicial: ahora pregunta «¿Qué quieres aprender hoy?», muestra tres puntos de entrada principales (Aprender un tema, Preparar Saber 11, Resolver una duda), mantiene el acceso a Practicar en el estado no-workspace y añade el CTA «Iniciar clase en vivo» junto a «Escribir una pregunta».
- Los accesos iniciales usan iconos Lucide y descripciones breves; no se añadieron emojis decorativos ni assets de marca ajena.
- Sidebar: ancho de escritorio reducido de 292 px a 264 px; panel marfil claro, navegación compacta y bordes más suaves.
- Clase Live: encabezado ligero, estado visible «Micrófono abierto · manos libres»/«Micrófono silenciado»/«Modo por turnos», hoja blanca más protagonista y controles inferiores con etiquetas accesibles.
- El control de micrófono en Live sigue llamando a `toggleVoiceMute()` en modo Live; no es push-to-talk. En fallback por turnos el mismo espacio cambia explícitamente a grabar/detener, sin confundirlo con la llamada continua.
- El estado vacío comunica que el estudiante puede hablar e interrumpir sin pulsar el micrófono. El modo por turnos sigue explicado como alternativa que no es una llamada continua.
- La hoja de clase conserva el label accesible «Hoja de clase» requerido por la regresión existente.
- Se añadieron estilos para mayor espacio en el lienzo, tarjetas iniciales, estados de foco/hover, controles y ajustes responsive.
### Commits de código de esta tanda
- `7647753ae8bdfd2dbc047a3ceae5454eebe9d2d1` — rediseño de pantalla inicial, sidebar y escenario Live en `LessonAITutor.tsx`.
- `db59bd9a962c0f47a70bde290251c1c3707fb399` — estilos del workspace, lienzo blanco y controles Live en `app/globals.css`.
- `612361c956c7ee80aaeb5c4b83a9a208a2bcd644` — conserva «Hoja de clase» para accesibilidad y compatibilidad con test de regresión.
### Auditoría funcional del HEAD
- Ya estaban implementados: `toggleVoiceMode`, captura Live continua con `getUserMedia`/AudioWorklet, `voiceMuted`, `toggleVoiceMute`, `interruptCurrentVoiceOutput`, detección de interrupción por actividad/transcripción, invalidación de audio anterior y pausa del dibujo mediante `voiceBoardDrawingActive`.
- En `toggleVoiceMute`, el mute se aplica a las pistas de audio del stream (`track.enabled = !nextMuted`); el CTA Live no solicita una nueva grabación.
- En la vista Live, el CTA de micrófono llama a mute/unmute cuando `voiceFallbackMode` es falso. En fallback cambia a grabación por turnos, con texto que identifica la limitación.
- `OrbyBoard.tsx` ya renderiza snapshots acumulativos, tinta SVG progresiva, lápiz y pausa por `drawingActive`. `orby-board-actions.ts` ya valida secuencia, dependencias e identidad de generación.
- No se modificó esta lógica de núcleo para evitar introducir una regresión de audio o pizarra sin QA físico.
### Validación y limitaciones de esta sesión
- Se verificó en GitHub que los tres archivos de código existen en la rama y que los nuevos elementos de UI están presentes.
- Se revisó el test estático `la llamada de Orby prioriza la pizarra como una clase en vivo y conserva subtítulos` y la regresión `la clase de voz prioriza la hoja digital y mantiene controles accesibles`; se preservó el texto exacto «Hoja de clase» requerido.
- El test `OmegaX live classroom speaks first, hides student transcription and keeps captions optional` conserva sus invariantes previos: subtítulos opt-in, envío de audio Live, no mostrar transcripción del alumno y uso de la pizarra.
- **No se ejecutaron** `npm run test:orby`, `npx tsc --noEmit`, ESLint ni `npm run build`: esta sesión editó mediante GitHub y no dispone de un checkout local con dependencias para correrlos.
- **No hubo QA real de micrófono/altavoces en Chrome**. La interfaz está actualizada en la rama, pero el comportamiento real de manos libres, eco, VAD, interrupción y sincronización de voz/dibujo sigue pendiente de probar en el dispositivo.
- No asegurar que el Preview/Vercel ya refleje estos commits. Verificar qué commit despliega el usuario antes de sacar conclusiones.
### Siguiente sesión — empezar aquí
1. Traer `feat/founder-intro` y ejecutar `npm run test:orby`; corregir primero cualquier regresión real.
2. Ejecutar `npx tsc --noEmit`, `npm run lint` (o el script definido por package.json) y `npm run build` en local.
3. Verificar preview/commit exacto antes de valorar el diseño. Comparar escritorio y móvil con las referencias aportadas.
4. QA de llamada real: permiso inicial, micrófono abierto automáticamente al conectar, mute/unmute sin detener la sesión, hablar sin pulsar, interrupción de OmegaX mientras habla y dibuja, pausa del tablero, retoma desde el último snapshot y fin explícito de llamada.
5. Auditar si el estado «OmegaX está hablando/dibujando» se refleja con precisión y si la respuesta verbal y visual se perciben como una sola clase. No fingir sincronización palabra-a-palabra; usar solo cues/eventos disponibles.
6. Siguiente trabajo de diseño: refinar workspace/landing de OmegaX, contenido de biblioteca y navegación; pulir responsive de la pizarra (canvas 16:9 hoy puede requerir scroll horizontal en móvil por su min-width existente).
7. Siguiente trabajo pedagógico: coreografía de explicación en etapas con `spokenCue`, snapshots acumulativos y reanudación robusta tras barge-in, sin crear otro motor ni adelantar el contenido completo.
### Restricciones permanentes
- Solo servicios gratuitos reales y cuotas gratuitas; nunca cambiar silenciosamente a opciones facturables.
- No tocar `main`, producción o Supabase remoto sin instrucción explícita.
- No reconstruir material de Orby ICFES Lab eliminado intencionalmente.
- Conservar filtros de seguridad Saber 11, identidad diferenciada OmegaX/Orby y modo bilingüe restringido a OmegaX.


### Registro de validación anterior (no confundir con esta tanda)
- Antes del rediseño visual, el usuario reportó `npm run test:orby`: 261/262. La única falla era la aserción de English Studio que exigía el texto visible «OmegaX inicia la llamada de voz al comenzar».
- Ese texto se añadió al bloque Real-life roleplay en el commit `90e87c74f5cec687a18df3d8dfa5ff04c96273f6`; los MD quedaron registrados en commits `cb4802fec281a388be1b1ff6d168fb7e5dd73c16` y `0501896fe0c208e4526964bddc7410cc7e6ddec5`.
- **No se tiene resultado posterior del test runner** para el fix de English Studio ni para el rediseño visual descrito arriba. El siguiente chat debe ejecutar la suite sobre el HEAD actual; no reutilizar el 261/262 como si validara el código actual.
- La verificación realizada en esta sesión fue de presencia estática en GitHub: 11/11 comprobaciones de contenido/contrato pasaron (CTA, tres accesos, pizarra, label accesible, mute, fallback, subtítulos opcionales, responsive y existencia de las dos regresiones de aula). Esto no demuestra compilación, typecheck ni ejecución de los tests.


## 2026-11-08 — segundo bloque: responsive de pizarra Live y controles claros
### Trabajo implementado
- En `components/aprender/LessonAITutor.tsx`, dentro del breakpoint móvil de la sala Live, la pizarra espacial cambia a proporción 4:3, ancho 100%, `min-width:0`, sin scroll horizontal forzado y sin padding lateral extra del canvas. El objetivo es que se lea/visualice en teléfono sin obligar a desplazar una hoja de escritorio de 760 px.
- El escenario Live deja el fondo exterior oscuro y pasa a blanco continuo con texto carbón. El encabezado de clase conserva materia/tema y estado de sesión.
- Los controles Live dejan de tener anchura fija de 44 px: son `inline-flex`, mantienen un mínimo táctil de 44 px, se adaptan al texto en escritorio y conservan iconos compactos en móvil. Se actualizan estados hover, activo y silenciado con la paleta clara de PeakScore.
- La lógica del micrófono no cambia: en Gemini Live el control ejecuta mute/unmute sobre las pistas existentes; el fallback por turnos usa grabar/detener y sigue identificado como no continuo. «Finalizar clase» sigue cerrando la sesión.
### Tests añadidos
- `la pizarra Live se adapta a móvil sin forzar el ancho de escritorio`: protege el breakpoint móvil, la desaparición de scroll horizontal y el canvas responsive 4:3.
- `los controles de la clase Live son claros, táctiles y mantienen la sesión manos libres`: protege el escenario claro, targets mínimos, estado mute y separación Live/fallback.
- Estas pruebas fueron añadidas a `tests/orby-request-filter.test.mjs`; se inspeccionó su ubicación junto a las pruebas existentes de la pizarra y la llamada.
### Commits
- `ed5e935848f8e2069e711ca66fef076cc9c6b6ef` — canvas Live responsive para teléfono.
- `a7258e51ddf07cc7e3c22a16d92ec2a543354cdc` — regresión del canvas móvil.
- `c8c2e5084d33de6a7fa3e9518e2c8505d9a28d41` — fondo claro y controles adaptables de llamada.
- `87b5203b826a8d4b9b49e15034db407206c6625a` — regresión de controles Live/mute.
### Validación
- Se verificó leyendo de nuevo los cuatro archivos en `feat/founder-intro` que el código, estilos y tests añadidos están presentes.
- No se ha ejecutado `npm run test:orby`, TypeScript, ESLint, build ni QA físico de micrófono. Las pruebas nuevas son tests de regresión estáticos y aún requieren ejecución local.
- La proporción 4:3 mejora la adaptación de ancho, pero debe inspeccionarse con ejemplos reales de todos los visuales; algunos textos/diagramas pueden necesitar un segundo ajuste de escala en pantallas estrechas.
### Retomar en el próximo chat
1. Hacer pull de `feat/founder-intro` y confirmar que HEAD incluye `87b5203` y los commits de documentación.
2. Ejecutar `npm run test:orby`; corregir fallos concretos antes de seguir con más features.
3. Ejecutar typecheck, lint y build. Compartir salida de terminal si falla; no asumir que la inspección GitHub equivale a ejecución.
4. Comprobar teléfono real/DevTools (360, 390 y 430 px) con visual de sketch, diagrama, tabla, ecuación y texto largo. Confirmar que no hay scroll horizontal y que etiquetas no se cortan.
5. En escritorio validar que los botones «Chat», «Silenciar», «Subtítulos» y «Finalizar clase» caben sin solaparse; verificar que el topbar no se comprime.
6. Prueba de micrófono en Chrome: conectar, hablar sin pulsar el botón, silenciar/reactivar, hablar mientras OmegaX responde, comprobar barge-in y que pizarra/audio de generación anterior se detengan; terminar con «Finalizar clase».
7. No tocar el motor de audio ni la API de sesión hasta que las salidas de estas pruebas indiquen un defecto reproducible.
### Restricciones
- Solo modelos/proveedores de cuota gratuita real; ningún fallback facturable ni activación silenciosa de APIs de pago.
- No tocar `main`, producción, deploy ni Supabase remoto.
- No reconstruir el material de Orby ICFES Lab eliminado intencionalmente.
- Conservar alcance Saber 11, filtros de seguridad y excepción bilingüe exclusiva de OmegaX.


## 2026-11-08 — resultado local de test: contrato de cuota del fallback de voz
### Resultado aportado por el usuario
- El usuario ejecutó `npm run test:orby` después de sincronizar la rama.
- Resultado: **263/264 PASS, 1 FAIL** (tests 264; duración aprox. 2.02 s).
- Única falla: `el modo por turnos explica con precisión la cuota y el proveedor de voz` en `tests/orby-request-filter.test.mjs:4018`.
- La aserción fallaba porque esperaba encontrar `respetará las cuotas gratuitas disponibles` en `LessonAITutor.tsx`; la interfaz solo decía que se mantienen servicios gratuitos, sin indicar modelo, autorización de privacidad y tratamiento de agotamiento de cuota.
- Las otras 263 pruebas reportadas pasan, incluidas las pruebas nuevas de pizarra móvil y controles manos libres (`tests/orby-request-filter.test.mjs` cerca de 4969 y 4976, y pruebas de aula cercanas a 4050/4060).
### Corrección implementada en GitHub
- En el aviso de `voiceFallbackMode`, el copy ahora aclara: el respaldo no es llamada continua; la voz de respuesta usa Gemini 3.8 Flash TTS únicamente cuando el servidor confirma acceso gratuito y autorización de privacidad; respeta cuotas gratuitas; si se agota la cuota o el servicio no está habilitado, la respuesta queda escrita y no se usa otro proveedor ni una opción de pago.
- Se amplió el test para exigir el nombre del modelo, confirmación de plan/privacidad, respeto de cuotas y ausencia de proveedor/pago alternativo. Se mantienen las aserciones negativas previas.
- No se modificó la ruta API, la lógica de cuota, la generación de audio, el micrófono Live ni los filtros. Fue una corrección de texto de interfaz y contrato de test.
### Commits
- `69532ea4fa7b63c42c58908cde1624c2be498879` — explica proveedor gratuito, puerta de privacidad y cuota en el aviso de fallback.
- `e6abcaae7aabd8172f8cfa9856b5592def9c03b8` — refuerza el test del contrato de fallback.
### Verificación de esta sesión
- Se volvieron a leer desde GitHub `LessonAITutor.tsx` y `tests/orby-request-filter.test.mjs`; las cuatro frases/condiciones y las nuevas aserciones están presentes.
- No se ejecutó localmente el test runner desde la sesión GitHub. **263/264 es el resultado del checkout local anterior a esta corrección**, no el resultado después de los commits.
### Retomar
1. `git pull --ff-only origin feat/founder-intro`.
2. `npm run test:orby`. El objetivo es que la prueba del modo por turnos pase y la suite quede en 264/264, pero no afirmar éxito hasta recibir resultado real.
3. Si aparece otra falla, usar su salida concreta y no alterar pruebas para ocultar un defecto.
4. Ejecutar después `npx tsc --noEmit`, el script de lint definido por `package.json` y `npm run build`.
5. QA real en Chrome para Live hands-free/mute/barge-in continúa pendiente.
### Límites
- No cambiar `main`, desplegar ni tocar Supabase remoto.
- No agregar proveedores o servicios facturables ni usar otro proveedor cuando las cuotas gratuitas terminen.
- Conservar la diferencia entre llamada Live y fallback por turnos.


## 2026-11-08 — rediseño de clase Live a partir de los videos de PeakScore y Studdy
### Evidencia visual y objetivo
- Video del usuario: `20261109-0105-54.7347713.mp4` (PeakScore actual). La sesión abre, falla el establecimiento de Gemini Live y queda en la experiencia antigua de «Continuemos por turnos»/grabación por pregunta. No llega a sentirse como llamada conversacional continua.
- Video de referencia: `20261108-1744-16.9228074.mp4` (Studdy). El patrón visual observado es una hoja blanca continua, un título didáctico marcado en amarillo en la parte superior, una composición central que se dibuja progresivamente, anotaciones manuscritas y controles flotantes discretos. No es una tarjeta de chat con una pizarra adjunta.
- Objetivo de OmegaX: micrófono abierto al conectar Live, respuesta oral streaming, intervención del alumno sin pulsar para cada turno, barge-in real, voz y pizarra vinculadas al mismo turno. El botón de micrófono solo mutea/reactiva. Si Live cae, no presentar grabación por turnos como si fuera llamada: finalizar Live, conservar texto pendiente en el chat y explicar el error.
- No se copia marca, assets ni recursos propietarios de Studdy. Se adopta el patrón de hoja de clase, título marcador y herramientas discretas con identidad PeakScore.
### Diagnóstico de Vercel Preview (inspección sin revelar valores secretos)
- Proyecto conectado: `peak-score`; rama objetivo: `feat/founder-intro`.
- Se encontró `ORBY_GEMINI_LIVE_ENABLED=true` en Preview y presencia de `GEMINI_API_KEY` (no se leyó ni se mostró su valor).
- No aparecen configuradas en ese entorno Preview las variables `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED` ni `PEAKSCORE_GEMINI_DATA_USE_APPROVED`.
- `lib/ai/provider-free-tier.ts` exige ambas confirmaciones además de la clave. La ruta `app/api/orby/realtime-session/route.ts` devuelve `GEMINI_FREE_TIER_NOT_CONFIRMED` antes de crear el token Live cuando falta cualquiera. Esto explica el bloqueo de arranque observado en el video: la clave y el flag de feature por sí solos no habilitan el servicio.
- No activar ni crear esas dos variables automáticamente. La primera confirma que la cuenta se mantendrá en Free Tier; la segunda aprueba el tratamiento de datos aplicable a ese nivel. Requiere decisión explícita del propietario de la cuenta. No usar una cuenta con cobro habilitado ni cambiar silenciosamente a una alternativa facturable.
- La puerta de privacidad adicional en producción sigue separada: `ORBY_GEMINI_LIVE_ENABLED=true`. La salida de error del token ahora distingue el código de tier/privacidad para explicarlo en la UI.
### Investigación de APIs y tecnología de referencia
- **Gemini 3.8 Live**: es el modelo que ya integra PeakScore y es la opción correcta para voz-a-voz bidireccional de baja latencia; la documentación oficial indica audio streaming, llamadas a herramientas y barge-in. Modelo ID `gemini-3.8-live`; la documentación de modelos lo recomienda como Live por defecto para agentes de voz. La pizarra puede seguir siendo nuestra aplicación: Gemini llama a `render_orby_teaching_board` y `OrbyBoard.tsx` representa los datos tipados como SVG progresivo.
- **Free Tier de Gemini Live**: la tabla de precios actual de Google marca entrada/salida del modelo Live como Free of charge, pero marca «Used to improve our products: Yes». El nivel pago evita ese uso para mejorar productos, pero es de pago. Por eso la bandera de aprobación de datos es una decisión de privacidad y no debe marcarse sin consentimiento.
- **OpenAI Realtime / GPT-Realtime**: ofrece audio bidireccional y function calling, pero el modelo oficial muestra Free tier «Not supported» y precios por audio; no encaja con el límite de coste cero. No se agregó una API de OpenAI.
- **LiveKit Agents / Inference**: framework útil para WebRTC, orquestación, control de turnos e interrupciones, con varios proveedores detrás. No es por sí mismo un modelo de inferencia ilimitado y gratuito; LiveKit Cloud usa facturación/planes y cada combinación de modelo debe auditarse. No se introdujo como nueva dependencia.
- **Studdy**: su política pública (actualizada el 2 de noviembre de 2026) confirma que recopila contenido de sesiones, dibujos de pizarra, interacciones de voz, chats, fotos y videos, y menciona categorías generales de proveedores cloud/IT. No divulga el nombre del modelo conversacional, el API de voz ni la librería de dibujo. No existe evidencia pública suficiente para afirmar que usa OpenAI, Gemini, ElevenLabs u otro proveedor. La tecnología exacta de Studdy queda como «no confirmada públicamente».
- Fuentes revisadas:
  - Google Gemini Live API: https://ai.google.dev/gemini-api/docs/live-api
  - Google Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
  - Google Gemini 3.8 Live model: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
  - SDK JS ActivityHandling: https://googleapis.github.io/js-genai/release_docs/enums/types.ActivityHandling.html
  - OpenAI GPT-Realtime model/pricing: https://developers.openai.com/api/docs/models/gpt-realtime-2
  - LiveKit Agents: https://docs.livekit.io/agents/
  - Studdy Privacy Policy: https://studdyai.com/privacy-policy
### Implementación aplicada
- `app/api/orby/realtime-session/route.ts`: errores de configuración de tier y privacidad incluyen códigos explícitos `GEMINI_FREE_TIER_NOT_CONFIRMED` y `GEMINI_LIVE_PRIVACY_DISABLED`; mensajes explican que no se envió audio/texto cuando se bloquea por configuración.
- `components/aprender/LessonAITutor.tsx`:
  - Startup Live fallido ya no activa automáticamente `activateTurnBasedVoiceFallback`. Se libera el micrófono, se mantiene visible el aula, se asigna un estado «Llamada manos libres no conectada», se explica el motivo y aparece «Reintentar llamada Live».
  - Si una sesión Live activa se cae o no puede enviar/recibir voz, termina el canal de voz y devuelve la frase reconocida al chat escrito. No se simula una conversación continua mediante grabaciones por turnos.
  - La recuperación solo devuelve al composer un texto que realmente pertenece a un turno pendiente; no repite la última pregunta ya completada cuando el micrófono se desconecta más tarde.
  - Se corrigieron textos de reconexión para no prometer Whisper/Cloudflare por turnos si el comportamiento real es recuperación escrita.
- `lib/ai/orby-voice-echo.ts`: saludo independiente `hola` deja de clasificarse como eco de la bienvenida del tutor; una frase repetida más larga (`hola de nuevo`) conserva el filtro anti-eco.
- `tests/orby-request-filter.test.mjs`: tests actualizados para saludo, fallos de Live con recuperación escrita, pérdida de pista de micrófono, configuración de interrupciones y tablero hoja completa.
- `app/api/orby/realtime-session/route.ts`: se importa y configura explícitamente `ActivityHandling.START_OF_ACTIVITY_INTERRUPTS` en el realtime input config; se conserva VAD automático con 400 ms de silencio, micrófono streaming y AudioWorklet. La salida del tutor debe detenerse cuando inicia una intervención del alumno.
- `components/aprender/OrbyBoard.tsx`: encabezado de clase con título resaltado tipo marcador y exportación discreta.
- `app/globals.css`: pizarra 16:9 a todo el ancho, sin marco, bordes ni sombra de tarjeta; papel blanco liso, título marcador amarillo y adaptación responsive. En móvil se usa 4:3 para legibilidad.
### Commits de esta tanda
- `597b3407943c7050c16e9c5573aeb81075dd4f95` — códigos de error separados para free-tier/privacy.
- `a5e1c2ad8f7a4d33d1e3fa5c1630c074c592fab9` — `hola` puede interrumpir sin ser descartado como eco.
- `ced4093473684434b625d0bc239a42b903be69c2` — test de saludo/eco.
- `8d65551e666b492ab9c8f156560e7f3ae00f7cb5` — no convertir error de arranque Live a llamada por turnos.
- `bbe8fa8d0410bf9f8e6924533e2bd24141ba339b` — estado de conexión fallida + reintentar Live.
- `69f4e29d8e809b3bb057d6b70b6ce0129e7e0dbd` — título marcador y hoja de clase.
- `6f69b3516f54f2efa12ac7dbaf40743a52fff389` — papel continuo sin marco de tarjeta.
- `fddd600ed2edb1ce2167b8be8df341d3a11dd7fd` — Live caído vuelve a chat escrito en vez de push-to-talk.
- `a7fd6cdf17e935fddbb148997fdc44182cd0653e` — regresiones de Live-only y recuperación escrita.
- `cc74e396157cc11308cc8d2ea0585da7e21132cc` — solo restaura frase realmente pendiente.
- `b27cb8b86a2b820677dabfc2654bc757c22af078` — test de reconocimiento y recuperación actualizados.
- `583cbc8d29115c0e2b788ff625616a5045fd0676` — barge-in explícito en configuración Gemini Live.
- `7aa57e836fff2163d172c54aebb966a7e2da415a` — mensajes de recuperación sin referencias al fallback por turnos.
- `6f7c0abef5b0f9edc818d055b02f5b81bbd5ce85` — regresión de micrófono continuo y barge-in.
### Qué no está terminado / validación
- No se ha habilitado Gemini Live en el entorno hasta que el propietario confirme la autorización de Free Tier y uso de datos. Con las variables ausentes, el aula debe mostrar el bloqueo y botón de reintento; no puede comenzar una llamada Live real todavía.
- No se ejecutó `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` ni `npm run build` desde esta sesión. Solo se verificó lectura estática de los archivos en GitHub. El último test local aportado era 263/264 antes de estos cambios; no es el resultado de esta rama HEAD.
- No se hizo QA de voz en Chrome, micrófono/altavoces, eco, primera respuesta, interrupción mientras OmegaX dibuja, ni resume del audio en el navegador.
- El tablero comparte la disposición principal y el tratamiento de hoja de la referencia Studdy; no se puede afirmar identidad pixel-a-pixel. El motor de dibujo y los contenidos siguen siendo PeakScore.
### Retomar en el siguiente chat
1. Ejecutar `git pull --ff-only origin feat/founder-intro` y confirmar HEAD final.
2. Ejecutar `npm run test:orby`; corregir cualquier fallo real. Hay nuevos tests estáticos, pero aún no han corrido.
3. Ejecutar `npx tsc --noEmit`, `npm run lint` y `npm run build`.
4. Antes de activar Gemini Live: pedir confirmación explícita al propietario de que la cuenta de Google está en nivel gratuito (sin ruta facturable) y acepta que datos de Free Tier puedan usarse para mejorar productos de Google. Solo después configurar `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true` y `PEAKSCORE_GEMINI_DATA_USE_APPROVED=true` en Preview `feat/founder-intro`; no configurarlas por su cuenta ni pasar a Paid Tier.
5. Tras habilitación autorizada, QA Chrome: permiso, entrada automática al conectar, decir «hola» una vez, pregunta completa, pausa natural, interrupción al hablar OmegaX, que cese audio y tinta vieja, y que el siguiente turno retome correctamente; probar mic mute/unmute, desconexión del dispositivo y reconexión segura.
6. Comparar hoja y herramientas con el video Studdy; probar visuales de texto, fórmula, sketch, diagrama, tabla, química, biología, y tamaños 360/390/430 px.
7. Si el test o QA revela un defecto de barge-in, investigar el orden entre interim input transcription, `interruptCurrentVoiceOutput` y eventos server `interrupted`. Google documenta que un speech onset interrumpe la generación por defecto; mantener el control explícito en el config.
### Restricciones permanentes
- Solo cuotas Free Tier reales; no OpenAI Realtime ni APIs con cobro, crédito, prueba promocional o fallback facturable.
- No afirmar qué proveedor usa Studdy porque sus políticas públicas no lo revelan.
- No cambiar `main`, desplegar, tocar Supabase remoto o cambiar variables sensibles sin aprobación explícita.
- No reconstruir el material de Orby ICFES Lab eliminado intencionalmente.
- Mantener filtros de seguridad, alcance Saber 11, identidad OmegaX general/Orby Ciencias Naturales y el modo bilingüe limitado a OmegaX.


### Última revisión de CI/Preview tras el rediseño (2026-11-08)
- Se consultó el combined status en GitHub para el commit de regresión Live 6f7c0abef5b0f9edc818d055b02f5b81bbd5ce85: el check de Vercel aparece failure y apunta a build-rate-limit en Vercel. No se recibieron logs de compilación ni evidencia de que el código haya fallado; tratarlo como bloqueo/límite de despliegues hasta inspeccionar Vercel.
- Los commits posteriores de código y documentación se verificaron leyendo los blobs de feat/founder-intro en GitHub. Eso confirma persistencia, no compilación.
- No hay resultado actualizado de npm run test:orby, TypeScript, ESLint o build sobre el HEAD actual. El último resultado reportado por el usuario (263/264) corresponde a un checkout anterior a las correcciones de esta tanda.
- No dar por hecho que Vercel Preview ya despliega estos cambios. Primero comprobar el SHA del Preview; si Vercel sigue con build-rate-limit, correr el test localmente en el checkout o esperar a que el límite permita otra compilación. No lanzar despliegues repetidos para eludir límites.
- La rama feat/founder-intro continúa divergente de main; no fusionar, rebasear o hacer push a main en esta fase. main permanece intacta.


### Resultado de test:orby aportado por el usuario y correcciones (2026-11-08)
- Ejecución compartida: 267 tests, 261 pass, 6 fail, duración 1.86 s. No fue un fallo general de la suite.
- Los seis fallos identificados:
  1. Test de configuración de voz todavía exigía textos de fallback «Whisper y Cloudflare» / «Modo por turnos listo», incompatibles con la decisión nueva de no simular una llamada continua mediante push-to-talk.
  2. Test de detector de eco esperaba bloquear «hola de nuevo» aunque el audio reciente del tutor solo decía «hola». Corregida la expectativa: se permite la frase no pronunciada, pero se suprime cuando el tutor realmente pronunció la frase completa.
  3. Test de recuperación buscaba una variable antigua `pendingUserText = voiceUserTextRef.current.trim()`; ahora se deriva `recognizedText` y se conserva en el composer solo si existe un turno pendiente real.
  4. Test de flujo Live esperaba llamar `respondToVoiceLocally` para una respuesta de política después de caída; el nuevo contrato presenta la respuesta de política como texto en el chat, y el test verifica ese comportamiento.
  5. Test de rechazos de política mantenía la misma expectativa antigua de audio local, actualizada para validar el mensaje escrito autorizado.
  6. El test de exportación seguía buscando «Exportar PDF» después del rediseño que había acortado la etiqueta a «Exportar». La etiqueta visible se restauró a «Exportar PDF», manteniendo la función de imprimir.
- Correcciones guardadas:
  - `4d1e463e29f30625d03115a259ab830d8464e809` — tests alineados con llamada Live hands-free, eco y recuperación escrita.
  - `38f77db3a03cb3df46534b36efc4434bef6e3059` — etiqueta «Exportar PDF» restaurada.
- Los seis fallos se abordaron; todavía no hay una segunda ejecución de `npm run test:orby` que confirme 267/267. No afirmar que la suite ya pasa.
- No fue posible ejecutar el test desde este entorno porque el checkout local no está disponible y la red de shell no resuelve GitHub. El usuario debe hacer pull de `feat/founder-intro` y ejecutar otra vez; comparar el resultado nuevo antes de cerrar.


## Referencia Studdy y primer cambio de tablero de entrada — 2026-11-08
- Se inspeccionaron visualmente los tres videos adjuntos: el flujo de PeakScore termina en error de conexión; las referencias Studdy muestran entrada por intención y una clase con pizarra progresiva, diagramas y contenido acumulativo.
- La inspección fue visual por fotogramas; no se afirma transcripción ni validación acústica completa de los MP4. La escucha/QA de audio sigue pendiente.
- Nuevo documento: `docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md`, con patrones observados, estado real del código, prioridades, proveedores y criterios de aceptación.
- Cambio aplicado en `components/aprender/OmegaXStudyHome.tsx`: el inicio ahora permite elegir una intención de estudio (explicar tema, resolver pregunta, estudiar apuntes, preparar Saber 11) antes de entrar a la clase; la intención se pasa como contexto inicial cuando el estudiante no escribe un tema.
- No se cambió el proveedor de Live ni se relajaron las puertas de coste/privacidad. No se declara corregida la llamada ni verificada la compilación.
- Siguiente paso: reproducir y diagnosticar la etapa exacta del error de sesión Live; después cerrar la coreografía acumulativa de la pizarra en `LessonAITutor.tsx`/ `OrbyBoard.tsx`.


## Diagnóstico Gemini Live — corrección de versión de token efímero (2026-11-08)
- Hallazgo confirmado en código y documentación oficial: los tokens efímeros de Gemini Live solo admiten `v1beta`; la rama usaba `v1alpha` al emitirlos en servidor y al crear conexiones Live iniciales/reanudadas en navegador.
- También existía una prueba estática que exigía `v1alpha` y rechazaba `v1beta`, preservando la configuración incorrecta.
- Corrección aplicada en `app/api/orby/realtime-session/route.ts`, las dos instancias `GoogleGenAI` de `components/aprender/LessonAITutor.tsx` y el test de protocolo en `tests/orby-request-filter.test.mjs`.
- Se conserva `gemini-3.8-live`, modelo listado actualmente por Google; no se cambia de proveedor ni se relajan las puertas gratuitas/de privacidad.
- Los tres archivos se releen desde GitHub después del cambio. Pruebas runtime, suite completa, TypeScript, ESLint, build y Chrome/micrófono aún no ejecutados. No declarar la llamada corregida sin esas verificaciones.


### Aclaración de compatibilidad SDK Gemini Live (2026-11-08)
- La documentación JavaScript de Google muestra `authTokens.create({config: {liveConnectConstraints: {model: "gemini-3.8-live"}}})` con el ID simple. La implementación del SDK en PeakScore ahora usa `model` (sin prefijo `models/`) en esta restricción. La guía REST muestra `models/gemini-3.8-live`, pero ese formato no debe copiarse a ciegas al ejemplo SDK.
- Se corrigió una segunda aserción estática remanente que aún exigía `v1alpha`; se agregó aserción para el ID simple del modelo.
- La auditoría pública de Studdy se amplió con la lista de hechos divulgados y una arquitectura hipotética separada explícitamente de las tecnologías no confirmadas.
- Los cambios están guardados en `feat/founder-intro`; QA runtime, suite, TS, ESLint, build y Chrome/micrófono permanecen pendientes.


### Advertencia vigente: SDK vs API Gemini Live
- package-lock confirma @google/genai 2.17.1.
- La documentación oficial actual de API de Gemini usa v1beta para crear tokens efímeros y conectar Live.
- El SDK JS actual consultado sigue mostrando warning de que sus tokens efímeros están soportados/documentados en v1alpha únicamente; no aborta necesariamente, pero su combinación con v1beta no se considera validada.
- El cambio v1beta quedó guardado en server/client/tests como candidato conforme a la documentación actual de API. No declarar solucionada la llamada hasta probar token + WebSocket + setupComplete + audio en Chrome con el SDK bloqueado. Si falla, evaluar WebSocket nativo v1beta y evitar alternar versiones sin prueba.
- Ver docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md §10.2.


### Resolución de versión para Gemini Live con el SDK exacto (2026-11-08)
- Se inspeccionó la fuente etiquetada exactamente `googleapis/js-genai@v2.17.1` (misma versión que fija package-lock). `src/live.ts` emite warning explícito si el cliente que usa un token `auth_tokens/` no está en `v1alpha`; la clase `Tokens` del mismo SDK declara soporte v1alpha únicamente.
- Se restauró `v1alpha` en servidor, conexión inicial y reconexión de navegador; los tests estáticos están alineados con este contrato. La propuesta temporal de `v1beta` queda anulada para el SDK 2.17.1.
- El campo `liveConnectConstraints.model` usa el ID simple `gemini-3.8-live`, conforme al ejemplo JS del SDK.
- La documentación REST/websocket actual que menciona v1beta es otro flujo. Solo migrar a v1beta si se implementa WebSocket nativo separado del SDK y se prueba end-to-end.
- Esto resuelve la discrepancia documental SDK/API, no prueba que la llamada ya esté funcionando. Chrome/micrófono, token, handshake, setupComplete y audio siguen pendientes.
- Ver `docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md` §10.3.
