# PeakScore — Changelog técnico

## 2026-11-06 — Orby hybrid public research
- Added `lib/ai/orby-web-research.ts`, a keyless/free public-source adapter using the Wikimedia Spanish search API and OpenAlex works API. It enforces source-host allowlists, short timeouts, bounded results, deduplication, safe URL reconstruction, and treats excerpts as untrusted data.
- Text tutor now retrieves public sources for substantive academic turns in addition to Orby Lab's published chunks, concept graph, related material and pedagogical profiles. Public-source outages are non-fatal and never trigger another model provider.
- Text and VC research run the public-source lookup independently alongside Lab retrieval. If either evidence service is unavailable, successful results from the other remain available; public-source outages never block tutoring or trigger another model provider.
- The VC knowledge-search tool now returns the same public-source context alongside Orby Lab results; Gemini Live instructions explain how to use and qualify those results.
- The browser now forwards `public_sources` from the VC knowledge-search response into Gemini Live's function result; previously the endpoint could return sources while the client silently dropped that field.
- Text chat displays the source links separately from the answer, with publisher and publication year when available.
- Added regression tests for source allowlisting, deduplication, limits, excerpt sanitization, offline degradation, and integration in both channels.
- Scope note: this first iteration searches Wikimedia and OpenAlex only. It is not yet a general web search engine or a guarantee of official ICFES/government-source coverage. Results must be checked for relevance and quality; source presence alone is not proof that a claim is correct.

## 2026-11-06 — Orby text/voice subject routing
- Text tutor retrieval now gives the current student turn's detected Saber 11 subject priority over the conversation's previously active subject. This avoids sending an explicitly new-area question to the old subject's vector index.
- The shared voice knowledge-search endpoint applies the same current-query-first rule, so VC retrieval is not forced to remain on the prior conversation subject.
- Added regression assertions for both routes.
- This change affects retrieval routing only; it does not silently rewrite persisted conversation metadata based on incidental mentions. A deliberate subject switch remains the correct way to change the active conversation label.

## 2026-11-06 — Orby Live knowledge retrieval isolation
- Confirmed the VC path is connected to the published Orby Lab knowledge engine through Gemini Live function calling and `/api/orby/knowledge-search`.
- The retrieval endpoint searches published document chunks, the published concept graph, and related-document context; subject-scoped retrieval can fall back across published areas when the active subject has no matching chunks.
- Removed automatic concatenation of the component's live transcript buffer into the tool query. The model already sends the complete current question; appending a possibly stale interim/final transcript could contaminate retrieval with the previous topic.
- Added regression assertions for retrieval wiring, published visibility, concept/related retrieval, rate limiting, and stale-transcript isolation.
- This confirms the architecture is connected in code, not that every Live turn will always invoke the tool or that the current deployed database contains published material for every subject.

## 2026-11-06 — Orby long-response playback order
- Extracted speech chunking into the pure helper `lib/ai/orby-speech-chunks.ts` so the logic can be tested independently.
- Fixed a sentence-order regression: when a long sentence followed a short pending sentence, the old chunker could enqueue the later sentence before the earlier one. The new chunker flushes pending text first, preserves punctuation and word order, and enforces the endpoint character limit.
- Added regression tests for long multi-sentence answers, exact reconstruction, chunk-size limits, single-sentence answers, and empty input.
- This prevents a class of out-of-order speech playback bugs; it does not yet prove end-to-end audio continuity or provider reliability.

## 2026-11-06 — Orby Voice reliability: TTS configuration and subject persistence
- Gemini 3.8 Flash TTS now receives the documented voice-only `speech_config` shape. Removed the explicit `language` field because Gemini 3.8 TTS automatically detects the transcript language; Live ASR locale hints are not reused in TTS requests.
- Added a regression assertion for the supported TTS configuration. The selected female voice and existing speech style metadata remain unchanged.
- Voice subject selection now updates the owned conversation before persisting the message pair. If the subject update fails, the turn is not saved and the API returns `VOICE_SUBJECT_UPDATE_FAILED` instead of reporting a partially completed save.
- Added a regression assertion that protects this operation order.
- Changes are isolated to `feat/founder-intro`. No `main` changes, migrations, deployments, or provider changes.
- Validation still required in the user's local checkout: `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, followed by real Chrome/Edge playback tests and a real subject-switch test against Supabase.


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


### Mapeo — Uso de tablas y grants antes de hardening
- Se revisaron servicios y rutas actuales para determinar qué tablas usa PeakScore y desde qué capa.
- Se identificó que varias operaciones sensibles de simulacros/importación se ejecutan desde APIs con service_role después de autenticar al usuario, mientras que algunas lecturas y operaciones propias usan el rol authenticated con RLS.
- Se confirmó que profiles/subjects/subscriptions y varias tablas de referencia tienen acceso cliente limitado por RLS; reference_analyses es el principal caso donde authenticated necesita CRUD propio.
- Se confirmó que los permisos Dxtm (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) no están justificados por los usos de aplicación observados y deben tratarse como exceso de privilegios, pero todavía no se revocan para evitar romper dependencias no mapeadas.
- institution_members/institutions y user_roles quedan fuera de cambios funcionales: se preservan hasta completar su trazabilidad histórica.
- Próximo paso: preparar una migración de mínimo privilegio, empezando por retirar privilegios innecesarios de tabla y corrigiendo DEFAULT PRIVILEGES, con verificación posterior.


## 2026-09-29 — Auditoría global de seguridad (fase de reconocimiento)

### Resultado
- Se auditó el estado real de `main` y Supabase sin aplicar correcciones.
- Confirmado: existe exactamente 1 perfil `admin` y su correo es `aragonyostynsena07@gmail.com`.
- Confirmado: RLS de `questions` usa `profiles.role='admin'` y no `institution_members`.
- Confirmado: las funciones SECURITY DEFINER revisadas usan `search_path=''\` y las RPC de usuario contienen controles de autenticación/ownership.
- Confirmado: headers/CSP de Next.js tienen una base sólida de hardening.
- Hallazgo 🟡: `requireAdmin()` y las APIs administrativas siguen confiando únicamente en `profiles.role='admin'`; todavía no exigen la identidad canónica del propietario.
- Hallazgo 🟡: persisten grants `TRUNCATE/REFERENCES/TRIGGER` y, en algunas tablas, CRUD amplio para `anon/authenticated`. También existen DEFAULT PRIVILEGES amplios para futuras tablas.
- Hallazgo 🟡: `institutions` e `institution_members` ya existen en Supabase; el nuevo panel institucional local creado durante esta fecha aún no está en `main`, por lo que su código no ha sido auditado.
- No se modificó código, RLS, grants ni esquema durante esta fase.
- Próximo paso: auditar el código local del panel institucional cuando esté disponible y luego endurecer autorización con el principio de mínimo privilegio.

## 2026-09-29 — Sincronización VSC → GitHub completada

- Se protegió el cambio local del usuario mediante el commit `7a6cf0d`.
- GitHub `main` tenía commits que no estaban en la copia local.
- Se ejecutó `git fetch origin` y posteriormente `git merge origin/main`.
- El merge se completó sin conflictos mediante el commit `3134214f5b1bc235b7fb567a53d0f4e61d1beb50`.
- Se realizó `git push origin main`.
- GitHub confirmó el push de `main -> main`.
- Verificación posterior: `components/dashboard/StatCard.tsx` mantiene la referencia `/dashboard/racha-pixel.webp`.
- Estado: la copia local y GitHub quedaron sincronizados respecto a este flujo.

### Base institucional — verificación preliminar en Supabase

- Se crearon las tablas `institution_verification_requests` e `institution_verification_documents`.
- Se habilitó RLS en ambas tablas.
- Se configuraron políticas para que el representante autenticado pueda consultar/crear sus propios registros y el administrador global pueda revisar/actualizar las solicitudes y documentos.
- Se creó un índice único parcial para impedir solicitudes activas duplicadas por institución.
- Esta fase establece únicamente la base de verificación.
- El registro institucional completo todavía no está implementado.
- Antes de habilitar el flujo se debe mover la creación sensible a backend/server-side y validar estrictamente los campos y archivos.
- También debe revisarse el aislamiento entre instituciones, Storage y autorización institucional antes de producción.
- El registro normal de PeakScore no se modifica; el flujo institucional permanece separado después de la autenticación.

 
## 2026-10-24 — Rotación de preguntas y generador IA de juegos
- Se mejora la selección de "¿Qué es esa vaina?" para reducir el reuso prematuro de preguntas y favorecer variedad por materia/tema.
- Se combinan preguntas publicadas y locales deduplicando IDs y enunciados normalizados.
- Se amplía el historial de 30 a 1.000 IDs recientes y se rellenan rondas con las preguntas menos recientes cuando se agota el conjunto no visto.
- El generador incorpora reglas pedagógicas por materia, nivel seleccionable, comparación de similitud contra preguntas existentes y validación de lotes con un reintento.
- Se añade "Juegos" al panel administrativo, con rutas server-side protegidas.
- La generación no publica automáticamente: todo lote aprobado por las validaciones queda en estado borrador para revisión del administrador.
- Validación pendiente: no se ha ejecutado npm run lint ni npm run build en un checkout local de esta rama.

## 2026-11-02 — Orby Autopilot: 100 ciclos por 7 horas y frecuencia de 3 minutos
- Se amplía el presupuesto automático de 10 a 100 ciclos por ventana móvil de siete horas.
- El cron protegido de Supabase pasa de ejecutarse cada cinco a cada tres minutos.
- Cada ciclo continúa reclamando como máximo una tarea/etapa; en la etapa de perfilado visual se procesan cuatro páginas por lote.
- Al terminar un lote, la cola lo deja inmediatamente disponible; el siguiente tick del cron (cada tres minutos) lo recoge sin añadir una segunda espera. La telemetría de revisión sigue mostrando una ventana de tres minutos.
- Las ejecuciones manuales siguen sin consumir el presupuesto automático.
- Se conserva el contador y el estado actual del motor; esta actualización no activa ni pausa el Autopilot.
- La publicación automática continúa sujeta a los controles de calidad existentes.

## 2026-11-02 — Orby: carriles manual y automático en paralelo
- Se separan los bloqueos de ejecución manual y automática; ambos trabajadores pueden avanzar simultáneamente sobre documentos distintos.
- La reclamación de tareas bloquea también la fila del documento y evita que dos trabajadores procesen el mismo documento a la vez, aunque existan trabajos con huellas de contenido diferentes.
- Los dos carriles comparten la misma cola, fragmentos, embeddings, perfiles académicos y biblioteca; las actualizaciones manuales quedan disponibles al Autopilot sin copiar ni duplicar el conocimiento.
- Cuando una ejecución manual termina un borrador que cumple todos los criterios de calidad, deja una revisión final reservada al trabajador automático. El Autopilot consume un ciclo de su presupuesto para verificar y publicar si vuelve a superar los controles.
- Las tareas pendientes de revisión automática no pueden ser reclamadas por el carril manual.
- El carril manual sigue siendo ilimitado y no consume los 100 ciclos automáticos por ventana móvil de siete horas.

### Refinamiento — prioridad del lote manual y sincronización con Autopilot
- Al pulsar "Procesar un lote ahora", la cola reserva temporalmente el trabajo seleccionado para el carril manual; el automático no puede adelantarse ni reclamar esa misma tarea.
- Al terminar el lote, la prioridad manual se retira y la tarea vuelve a la cola compartida para que el Autopilot continúe desde la etapa y los datos persistidos.
- Los lotes manuales no consumen el presupuesto de 100 ciclos automáticos por ventana móvil de siete horas.
- Se añaden pruebas de regresión para los carriles independientes, el lease documental y la prioridad manual.
- El Autopilot permanece habilitado; el cron cada tres minutos recoge los trabajos compartidos mientras el administrador sigue pudiendo ejecutar lotes manuales.


## 2026-11-02 — Orby Voice: primer respaldo Cloudflare
- Añadido adaptador server-only para Workers AI con Whisper Large V3 Turbo (transcripción) y Gemma 4 26B (respaldo de tutor).
- La ruta de transcripción conserva Gemini → Groq y añade Cloudflare como tercer intento cuando las credenciales están configuradas.
- La ruta del tutor conserva el router actual y recurre a Cloudflare únicamente cuando fallan los proveedores anteriores. El texto de Cloudflare no evita los controles de seguridad y calidad existentes.
- Si Gemini Live se interrumpe tras recibir una transcripción, la respuesta de respaldo se puede leer con la síntesis del navegador.
- No se creó clave ni integración de OpenRouter; no se añadieron pagos ni dependencias npm.
- Commits: `53283bc`, `3adc805`, `ec7b201`, `7bd6cda`.
- Pendiente: ejecutar validaciones en el entorno local de la rama y pruebas de extremo a extremo con audio real. No habilitar para estudiantes ni desplegar a producción todavía.


## 2026-11-02 — Sincronización de voz y búsqueda multi-modelo
- Gemini Live entrega la transcripción al chat de forma progresiva y los fragmentos de audio se reproducen conforme llegan después de validar el contenido parcial.
- El turno de voz permanece ocupado hasta terminar la reproducción; la siguiente pregunta no se drena antes de tiempo.
- Cuando falta audio en un turno Live, se usa voz del navegador; las respuestas filtradas también tienen lectura alternativa al interrumpirse la conexión.
- Se reforzó cancelación y watchdog de SpeechSynthesis para evitar que una reproducción colgada bloquee el compositor.
- Cloudflare EmbeddingGemma se añade como respaldo de embeddings de Gemini; cada vector conserva su modelo y la búsqueda consulta/fusiona solo espacios compatibles junto con recuperación léxica.
- Si los motores gratuitos agotan cuota, el worker estaciona el trabajo hasta las 00:05 UTC siguiente sin agotar el contador de reintentos.
- Nueva migración requerida: `supabase/migrations/20261102230000_orby_model_aware_embedding_search.sql`.
- No tocar `main`, no desplegar a estudiantes. Aún faltan las pruebas locales de typecheck/lint/build y pruebas end-to-end de voz y búsqueda semántica.


### Ajuste de cuota gratuita
- Se selecciona `@cf/google/gemma-4-26b-a4b-it` como respaldo de tutor en Cloudflare, en lugar de Llama 3.3 70B, para consumir menos Neurons por respuesta.


### Ajustes finales de tiempo de respuesta y robustez
- Se reduce el buffer de captura PCM de micrófono de 100 ms a 40 ms.
- El watchdog de respuesta se renueva con cada fragmento de texto/audio de Gemini Live; una respuesta larga activa no se corta por el timeout inicial.
- Se conserva el texto provisional del alumno para reintentar el mismo turno ante desconexiones antes de la transcripción final, con un indicador explícito de si el mensaje ya fue añadido al historial.
- Se separa cancelación de síntesis de voz frente a finalización correcta para no reactivar la escucha al cerrar o interrumpir.
- Se evita guardar como pregunta del alumno el eco de la voz local de Orby.


### Orby Voice — 2026-11-02: Spanish-first and conversational refusals
- Added BCP-47 Spanish ASR hint (`es-ES`), SMART transcription mode and custom vocabulary for Orby wake phrases and ICFES terms.
- Configured native Live speech synthesis with language code `es` and strengthened Colombian Spanish/Latin-script instructions.
- Added Unicode script guard to prevent Devanagari/Hindi and other unsupported writing systems from appearing in the student chat, persisted history or played audio.
- Buffered Live audio until the transcript is validated; for deterministic greetings/refusals, keep the approved text canonical and accept native audio only when its transcript matches that text. Otherwise discard it and use the browser voice fallback.
- Fixed fallback selection after cancelled/blocked audio by checking whether the output was validated, rather than trusting a historical chunk count.
- Improved short programming refusals and voice prompting for spelling, accents, grammar and non-repetitive conversation.
- Added regression coverage for wake phrases, Spanish ASR hints, unsupported scripts, exact policy speech, and audio fallback. Current suite has 44 tests; local execution/typecheck/build remain pending.


### Refinamiento de voz — recuperación de ASR y salida SMART
- La transcripción del audio generado se limita a español (`es`) y modo SMART; la voz nativa declara el idioma español.
- Se añadió un único turno de recuperación cuando hay transcripción provisional en escritura no española y falta la final: `Audio no reconocido.` + petición de repetir en español.
- Las respuestas locales (saludo, identidad, programación) mantienen un texto canónico; el audio Live solo pasa si la transcripción coincide con la frase aprobada. En otro caso, TTS lee la frase segura.
- El prompt de voz ahora prioriza ortografía colombiana, tildes, concordancia, naturalidad y negativas breves sin repetir la presentación.
