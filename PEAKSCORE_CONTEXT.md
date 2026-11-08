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
