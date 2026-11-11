# Continuidad — Orby Live / rediseño inspirado en Studdy

Fecha de actualización: 2026-11-10  
Repositorio: PeakScore777/PeakScore  
Rama de trabajo y fuente de verdad: feat/founder-intro  
No trabajar sobre main salvo instrucción explícita.

## Objetivo vigente

Elevar Orby Live al nivel de acabado, claridad y fluidez de la referencia visual/vídeos de Studdy enviados por el usuario. No basta con retoques CSS aislados: revisar la experiencia completa desde la pantalla inicial hasta la clase Live terminada.

### Diseño solicitado
- Eliminar por completo los tonos crema/beige de la experiencia de estudio.
- Superficie limpia blanca con degradado pastel azul/lila/rosa muy sutil, como la referencia de Studdy.
- Inicio centrado, despejado, sin imágenes decorativas ni chips «Prueba con» que estorben.
- Quitar el botón redundante «+ Nueva clase» del menú lateral.
- Menú lateral ligero, natural y rápido: sin blur pesado, sin animaciones largas, sin saltos/reflows; estados hover, active, click y focus refinados.
- Mantener un lenguaje visual coherente en encabezado, controles, biblioteca, pizarra, subtítulos, errores y modales.
- Responsive real en escritorio, portátil, tablet y móvil; respetar safe areas, alturas dinámicas y scroll interno.
- Las imágenes/diagramas educativos de la clase deben tener calidad visual alta y aparecer solo cuando ayuden a enseñar; no añadir imágenes decorativas al home.
- Mantener el tablero de clase blanco, amplio, legible, con dibujo progresivo y título sincronizado.

### Flujo pedagógico esperado (no saltar etapas)
1. El alumno escribe el tema y elige intención/área si lo desea.
2. Al pulsar «Comenzar», verificar sesión, biblioteca, cuota, consentimiento y disponibilidad del proveedor antes de entrar.
3. Mostrar estado «Preparando la clase…» mientras se establece conexión.
4. No mostrar la clase como iniciada ni solicitar contenido/voz al tutor hasta recibir confirmación real de conexión (setupComplete).
5. Una vez conectado, entrar al aula, escribir/animar el título y luego comenzar la explicación oral.
6. La pizarra se dibuja por etapas cuando la explicación lo requiere; no forzar diagramas para cada respuesta.
7. Subtítulos parciales deben reemplazarse/actualizarse, no acumularse; sincronizar con el texto y audio del turno actual.
8. Un fallo de conexión debe dejar claro que no empezó la clase, detener/liberar micrófono y permitir reintentar explícitamente. Nunca fingir conexión ni saltar a un fallback de pago.

## Reglas que no se deben romper
- Presupuesto estricto: usar solo servicios/modelos que puedan funcionar sin coste dentro de cuotas gratuitas reales. No introducir APIs pagas, créditos facturables ni fallbacks que puedan generar cargos. Si se agota una cuota, degradar/pausar con aviso.
- Orby es tutor de contenido ICFES/Saber 11; no debe enseñar programación ni temas externos al currículo objetivo.
- Responder en español colombiano salvo ejercicios de inglés que lo requieran.
- No atribuir Orby a Google ni mencionar otros preICFES como recomendación/promoción. Mantener transparencia de privacidad y proveedores cuando corresponda.
- El material del Orby ICFES Lab fue eliminado intencionalmente por el usuario. No reconstruirlo ni tratarlo como error. No usar el antiguo conteo de 28 conceptos de Química.
- Las conversaciones antiguas de texto no deben confundirse con las clases Live actuales. No reintroducir historial de clases viejo como si fuera el flujo Live.
- No romper el tablero, persistencia de turnos, historial de mensajes, captions ni funciones de clase que ya funcionan.

## Estado técnico comprobado

### Base de datos / biblioteca
Proyecto Supabase: avmywztnsrnyjhvbaiio.

Verificación directa del 2026-11-10:
- public.orby_conversations.session_type existe, es text NOT NULL, default 'chat'.
- Migración 20261110222914_orby_live_class_sessions está aplicada.
- RLS de orby_conversations: usuario autenticado puede leer/insertar/actualizar/eliminar solo sus propias conversaciones.
- Grants verificados: authenticated tiene SELECT/INSERT/UPDATE/DELETE; service_role también conserva sus permisos.
- Conteo global consultado: 25 conversaciones tipo chat y 0 tipo live al momento de la revisión; no se detectaron filas Live fantasma.
- La URL de Supabase configurada en Vercel coincide con el proyecto consultado (avmywztnsrnyjhvbaiio). Las variables de Gemini Live y confirmación de cuota gratuita están limitadas al Preview de feat/founder-intro; producción permanece deshabilitada.
- El mensaje exacto «No se pudo verificar tu biblioteca de clases» procede del POST al fallar el count exact/head, no del GET inicial. Grants, RLS y columna session_type fueron verificados; todavía falta el código de error runtime para identificar el motivo real. Se añadió logging seguro del código al servidor.
- GET /api/orby/conversations consulta solo session_type = 'live', ordena por updated_at y limita a 50.
- POST asigna live solo si el body lo pide explícitamente; en otro caso chat. Cuenta por usuario y tipo y bloquea si alcanza 50.
- La columna ausente NO es la causa actual: no crear otra migración para volver a añadirla.
- El mensaje «No se pudo verificar tu biblioteca de clases» viene de la prevalidación en startWorkspaceClass() cuando GET no devuelve una lista válida; revisar respuesta HTTP/auth/cookies/errores de Supabase en la versión desplegada. No ocultar el error ni permitir iniciar si la verificación falla.

### Inicio de clase
En components/aprender/LessonAITutor.tsx, startWorkspaceClass():
- normaliza tema;
- bloquea doble submit con classStartInFlightRef;
- hace GET con credentials: same-origin, cache: no-store, timeout 8 s;
- no toca micrófono ni inicia si la biblioteca no valida o tiene 50 clases;
- luego prepara y llama toggleVoiceMode(true, true).
Revisar el flujo de estados alrededor de toggleVoiceMode, startRealtimeVoice, ensureVoiceConversation y handleInitialClassTitleComplete para garantizar la secuencia anterior.
Las clases Live se crean con session_type: live desde ensureVoiceConversation / createVoiceConversation.

### Últimos cambios guardados en GitHub (rama feat/founder-intro)
1. 1f55564c0e9b39cb8d8a02ae3108fa8cbce4db41 — Improve Orby Live class preflight and remove redundant new-class action
   - Añadió prevalidación de biblioteca antes de activar micrófono.
   - Quitó botón redundante «Nueva clase».
   - Eliminó blur del backdrop.
2. 0515d6dfcfaf83cc0865c2b7397d1f9af3fc8b51 — Polish Orby Live workspace styling and responsive lightweight drawer
   - Ajustes iniciales de drawer, duración y responsive.
3. 42a8cbbc6c7158ad9da56c3ff8ab93fee121bf70 — Remove distracting topic suggestions from Orby Live home
   - Eliminó la sección «Prueba con» de la pantalla inicial.
4. e352aea250af5acbe247fca4506f349059103792 — Replace cream Orby workspace theme with clean pastel blue
   - Primera corrección de la cascada de estilos crema.
5. 57098a1581b359da38bd775bc738eef2b7a60517 — Polish Orby Live pastel interface and responsive drawer
   - Añadió overrides finales para degradado pastel, drawer blanco, estados activos, microinteracciones y responsive.
6. 0524e8ebb94d0d83b2a39ebebfd4b6b668b28a55 — Make Orby class library preflight failures diagnosable
   - Detecta respuestas no JSON, informa status HTTP y diferencia payload inválido de errores HTTP; mantiene bloqueo fail-closed.
7. 9be1c2c6d8d0e40db0beae3178f4e7081dd869e4 — Add safe diagnostics to Orby class library endpoint
   - Registra nombre de excepción en fallo inesperado GET sin exponer contenido ni datos personales.
8. da66925e48c7b116a48581e0a139dcc90553df9b — Fix drawer utility selector escaping
   - Corrige el selector CSS escapado del texto del menú.
9. 926faca1ac10f34258160876d5e44a72dd41b630 — Remove remaining cream accents from Orby navigation
   - Cambia variables de superficie y bordes restantes; elimina beige del botón de menú y pie del drawer.
10. 08acc37098197791e5d056e7bc2153717bb17d6c — Prevent new Orby Live classes reusing stale conversation state
   - Evita reutilizar el state React antiguo al crear conversación; el ref síncrono es la fuente de verdad y el token Live recibe solo el ID activo.
11. c6e53a6d168e10ba3380c1cfb61d1c2bc1f619a5 — Create Orby Live class only after confirmed setup
   - La fila de clase se crea después del handshake setupComplete, no al recibir solo el token. Fallos de socket/timeout no dejan clases fantasma.
12. 901b45df12b79988a89f9f11bf2bb2b43c0c5960 — test: cover Orby Live class creation after setup
   - Añade regresión para el orden setupComplete → persistencia y prevención de ID viejo.
13. 11e913bb9fc3baa374f43d08f96f97a92b6954bb — Polish Live captions and classroom surfaces to clean Studdy palette
   - Quita tonos crema del gradiente de subtítulos, topbar, composer e ilustración; reduce entrada del drawer.
14. 82bfd4e92792567c188a55dcd0d07d60db244723 — Avoid stale conversation fallback during Live reconnect
   - La reanudación también usa exclusivamente activeConversationRef, sin fallback al state React viejo.
15. b08b16eed291a88ee63f33f6fad473b4f7562f59 — test: prevent stale class id on Live reconnect
   - Asegura que conexión inicial y reanudaciones usen solo el ID activo.
16. 1a07ebf253c15bbffabeeeb87cdfcdd749060195 — docs: record caption polish and Live lifecycle audit
   - Actualiza la continuidad con resultados de grants, conteo de clases y limitaciones de subtítulos.
17. 50396ad42be18cbf9e8cf9ad8d9310afca4e8882 — Remove remaining beige surfaces across Orby study workspace
   - Elimina los últimos tokens crema detectados en el componente principal; los sustituye por blanco, azul frío y rosa pálido.
18. 92b9fa1f8c14c1d1cc621d9259f452dc78902dba — test: keep Orby workspace free of cream palette regressions
   - Añade prueba para evitar que reaparezcan los colores crema.
19. d19da3923041321ffa547455fb27587d218dc2ec — Make Orby study drawer keyboard accessible
   - Añade foco inicial, trampa de Tab, cierre con Escape y restauración del foco al botón de apertura.
20. bae19b891b8ed59fd2e765ec7a6736635279b61a — Add clear keyboard focus states to Orby drawer
   - Añade anillo de foco visible y optimización táctil del backdrop.
21. 500b909e55807dd2f33eb5e25cc84d2bf6a67ed1 — test: cover keyboard accessible Orby study drawer
   - Añade regresión para accesibilidad de teclado del menú lateral.
22. 17383a965fc2499cfedc4fbd2fe2c132fb5a2df8 — docs: record Orby drawer accessibility work
   - Registra el cambio de foco, Escape y prueba anti-regresión.
23. 84acee2e8c83b06683c0e3f01762bd186ec76211 — Close Orby study drawer before entering Live class
   - Cierra el menú lateral al comenzar una clase para que no quede superpuesto al aula.
24. 16e5fccccd50d8c1c493a2ba36f010d709300497 — test: close drawer before Orby Live class
   - Añade aserción para mantener cerrado el menú al entrar a clase.
25. 7cc2cb9c30d098f4573bebc0d1fad218f02e27f9 — Remove last warm paper colors from Orby review panel
   - Corrige los últimos tonos de papel beige en el cuaderno de preguntas falladas.
26. 290b466464438777742b53a6828a14e0b9242ca8 — test: guard review panel against warm paper palette
   - Amplía la prueba anti-regresión de paleta a los paneles de revisión.
27. 3fdf13d613f7d9f4fad9bfae7181741b26567077 — Log safe diagnostics for Orby class quota failures
   - Registra el código de error del count head y excepciones inesperadas del POST sin exponer datos personales.
28. df4cf221a60676a54928e71e8f1ba9932d13523f — test: require safe diagnostics for class library failures
   - Verifica que la ruta mantenga diagnóstico seguro del fallo de biblioteca.
29. b46d086d0020148985c605eba8926a8e94142bd2 — Fix voice image migration and make subject updates atomic with turn saves
   - Añade argumento opcional p_subject a la RPC para guardar selección de materia junto con el turno.
30. 0721185c87441d2fe85cc3e30745ced27f7e4871 — Persist Live subject selection atomically with voice turn
   - El endpoint deja de actualizar subject por separado; pasa p_subject en la misma RPC idempotente.
31. 76d948d72aac66d0683ea3e882b12504bfb88a84 — Fail closed on outdated voice RPC when changing subject
   - No recurre a una RPC antigua si hay cambio de materia pendiente.
32. b7d0d8d2fa9ddca1e012859253b88304148e06ff — Make Live voice persistence migration self-contained and fix SQL quoting
   - Incluye teaching_board y tabla de recibos en la migración de imágenes para no depender de migraciones omitidas.
33. 69399f898dbe653c8ad8fee8224f3e7795f504a5 — test: guard atomic Live turn and image persistence migration
   - Añade regresión de materia atómica, columnas, recibos y sintaxis SQL.
34. 95cc9ac526aff1facc112ac4ec7ef2b850c71807 — Add missing receipt constraints and make migration safely repeatable
   - Asegura índice único y FK compuesto incluso si la tabla de recibos ya existía.
35. bc65034e10e8e3f59c2729dcece6647e357b0259 — Fix all remaining dollar-quoted SQL blocks
   - Corrige delimitadores dollar-quoted del bloque DO y de la función de asociación de imágenes.
36. 4dc431e4f5710365cc8e33e7c18639275852136f — Clarify atomic subject persistence and log safe turn failures
   - Actualiza comentario y captura excepciones inesperadas con nombre/código seguro.
37. 4da6ae44d9815744e1cf817b43697e83406ccc82 — Refine Orby study home with compact privacy disclosure and topic suggestions
   - Añade temas de inicio rápido y deja el aviso de privacidad plegable, sin quitar la información esencial.
38. 1e7bb107854ccfd6c91eab6c7b52e1a2c8ca6c50 — Remove cream canvas from Orby workspace page
   - Cambia el contenedor de la página de inicio a blanco puro.
39. 23ab34fd89a77e377bd15c74c3474fbb9e17486e — Replace Orby study home with responsive Studdy-inspired cool palette
   - Reemplaza al final del CSS los estilos conflictivos por una sola capa visual azul/rosa fría, compacta y responsive.
40. ef93beebfded20320b9a6f1b8e1969987f6e3218 — test: cover responsive Studdy-inspired OmegaX study home
   - Añade regresión para paleta, avisos, sugerencias y breakpoints.

### Pantalla inicial OmegaX (revisión visual adicional 2026-11-10)
- La captura seguía mostrando la composición anterior porque el formulario se había estilizado mediante varios bloques CSS acumulados y el contenedor `OrbyWorkspacePage` aún usaba `#fffdfa`. No bastaba con cambiar tokens de color aislados.
- `OrbyWorkspacePage.tsx` ahora usa canvas blanco. Se añadió un único bloque final de overrides para la pantalla inicial: degradado frío azul/lila/rosa, título y acento naranja, selector de tres modalidades en fila, formulario blanco compacto, botones y controles con estados hover/focus y breakpoints de móvil/tablet/desktop.
- Se añadieron cuatro temas de inicio rápido que rellenan el campo y mantienen el mismo flujo `startWorkspaceClass`; no crean clases por su cuenta.
- El aviso extenso se convirtió en disclosure plegable «Privacidad y uso de voz». Se retiró el texto que afirmaba de forma genérica que Google puede usar el contenido para mejorar productos/revisores, sustituyéndolo por una descripción más corta del envío de audio a Gemini Live y una recomendación de no compartir datos sensibles. Verificar la redacción legal con los términos vigentes del proveedor antes de producción.
- Se agregó prueba de regresión para el canvas, el texto del consentimiento, las sugerencias y breakpoints. Todavía no se ha ejecutado `npm run test:orby` localmente ni validado visualmente en navegador; el equipo local tiene cambios sin commit en `tests/orby-request-filter.test.mjs`, por lo que no debe sobrescribirse con `git pull` hasta hacer backup/merge.

### Persistencia Live e imágenes (revisión adicional 2026-11-10)
- La migración `20261110010000_orby_voice_image_persistence.sql` se ejecutó directamente en el proyecto Supabase `avmywztnsrnyjhvbaiio` tras corregir sus bloques SQL. Verificación posterior confirma las columnas `teaching_board`, `generated_image_path`, `voice_turn_id`; tabla `orby_voice_turn_receipts`; RPC `orby_save_voice_turn_with_board(..., p_teaching_board jsonb, p_subject text)` y `orby_attach_voice_turn_image(...)`.
- La RPC de voz guarda el cambio de materia dentro de la misma transacción que reclama el UUID del turno e inserta los dos mensajes. El endpoint ya no hace un UPDATE separado de `subject`. Si el esquema es antiguo y el turno incluye cambio de materia, falla cerrado sin guardar un turno parcialmente actualizado.
- La migración es autocontenida respecto a `teaching_board` y la tabla de recibos; agrega índice único y FK compuesto si faltan. Se comprobó que los dos RPC solo tienen EXECUTE para `service_role` (además del owner postgres), y que no hay grants a `authenticated`.
- Bucket `orby-images` verificado privado, límite 1 MiB, MIME JPG/PNG/WebP; políticas SELECT/INSERT/DELETE acotadas a carpeta del usuario. No se expusieron objetos ni claves.
- La migración se aplicó mediante SQL directo; no se insertó manualmente una fila en `supabase_migrations.schema_migrations`. La migración del repo está diseñada para repetirse con `IF NOT EXISTS`/`CREATE OR REPLACE`; verificar historial remoto antes de usar `supabase db push`.
- Verificación posterior: existen las tres RPC (`orby_save_voice_turn`, `orby_save_voice_turn_with_board` con `p_subject`, `orby_attach_voice_turn_image`); columnas y tabla confirmadas. Recibos tienen PK compuesta y FK compuesta hacia conversación/propietario, sin filas huérfanas. No hay políticas ni grants para `authenticated` en la tabla de recibos; service_role tiene acceso.
- `orby-images` está privado (1 MiB, JPG/PNG/WebP) con políticas de Storage SELECT/INSERT/DELETE limitadas al directorio del usuario. No se modificaron datos de estudiantes.
- La prueba de sintaxis/contratos se añadió, pero aún no se ejecutó `npm run test:orby`, lint ni build. La verificación de esquema no sustituye una prueba real de guardado con usuario autenticado.

### Deploy / pruebas
- Los despliegues de los commits 1 y 2 quedaron READY en preview:
  - dpl_ehfC8kyXgUfezsHdRfYojeaCEbzq (commit 1f55564)
  - dpl_4m4Lm74KC6Mjnx9Aj9moy7u6reBu (commit 0515d6d)
- Esos previews NO contienen los cambios posteriores 42a8cbb, e352aea ni 57098a1.
- Se intentó crear un preview para 57098a1, pero Vercel respondió HTTP 402: límite de despliegues API del plan gratuito superado (más de 100 en 24 h; retryAfter 86400). El estado de commit muestra fallo por build-rate-limit, no por error de código. No intentar sortear el límite ni actualizar plan automáticamente.
- Los commits 0524e8e, 9be1c2c, da66925, 926faca, 08acc37, c6e53a6, 901b45d, 11e913b, 82bfd4e, b08b16e, 1a07ebf, 50396ad, 92b9fa1, d19da39, bae19b8, 500b909, 17383a9, 84acee2, 16e5fcc, 7cc2cb9, 290b466, 3fdf13d, df4cf22, b46d086, 0721185, 76d948d, b7d0d8d, 69399f8, 95cc9ac, bc65034, 4dc431e, 4da6ae4, 1e7bb10, 23ab34f y ef93bee también están pendientes de despliegue y validación por el mismo límite.
- Runtime logs: ventana 50 min consultada sin logs de error de Orby; ventanas mayores no están disponibles por retención Hobby.
- Un despliegue anterior (af4eb23) falló en npm run test:orby por una aserción de test desactualizada sobre item.teaching_board. En la rama actual el test fue actualizado para exigir que el cliente no lea item.teaching_board directamente; comprobar de nuevo la suite al próximo build permitido.
- No afirmar que los últimos cambios están desplegados ni que todo está probado hasta tener build/checks verdes y prueba manual.

## Próximas tareas, por prioridad
1. Continuar auditoría del endpoint GET biblioteca y de autenticación/cookies; encontrar el origen del error visto por el usuario. La prevalidación de cliente ahora distingue HTTP no-JSON y payload inválido. En el ciclo Live, el ID se toma solo del ref activo; la fila se crea tras setupComplete. Añadir tests de ruta para GET: 200 lista vacía, 401 sin sesión, 503 ante error Supabase, filtro live y límite 50.
2. Revisar secuencia de inicio Live completa y asegurar que el aula solo aparece después de setupComplete; cubrir error, cancelación, permisos y reintento.
3. Ejecutar/revisar npm run test:orby, npm run lint, next build en el próximo despliegue permitido. No borrar ni debilitar tests para obtener verde.
4. Revisar subtítulos: chunks parciales, duplicados, orden, sincronización audio/transcripción, captions vacíos y cierre del turno. La lógica actual une chunks con solapamiento y el panel limita la ventana visible a 14 palabras/dos líneas; el índice es estimado por reloj PCM, no timestamp fonético exacto. Se quitó el gradiente crema del panel con commit 11e913b.
5. Auditar menú lateral completo: layout, scroll, focus trap si aplica, Escape, backdrop, touch, reducción de movimiento, evitar timers/animaciones y blur innecesarios. Se sustituyeron los últimos tokens beige del componente por una paleta blanca/azul/rosa y se añadió una prueba anti-regresión. El drawer ya atrapa el foco, cierra con Escape y restaura el foco al disparador; falta validación manual en móvil/teclado.
6. Auditar home y responsive en anchos representativos: 360, 390, 768, 1024, 1366, 1440 px y alturas pequeñas de portátil.
7. Revisar pipeline de ilustraciones: calidad, proporción, resolución, límites de payload, lazy loading, evitar re-render del tablero completo por cada trazo y no generar imágenes decorativas.
8. Probar clase real end-to-end con micrófono autorizado: tema → conexión → título → voz → pizarra → subtítulos → pausa/interrupción → persistencia → terminar. Añadida prueba estática de regresión para asegurar que el alta no preceda al handshake.
9. Mantener esta nota actualizada con commits, resultados de tests y bloqueos de despliegue.

## Instrucción para continuar en otro chat si fuera necesario
Leer este archivo primero y continuar desde el punto pendiente en feat/founder-intro. No repetir auditoría ni volver a preguntar por preferencias ya descritas. No modificar main, no recrear material eliminado del Orby Lab y no declarar terminado hasta validar biblioteca, inicio Live, captions, tablero y responsive.

### Ajuste completo del flujo Studdy y corrección de biblioteca (2026-11-10, continuación)
- El video de referencia dura 22.97 s. La secuencia observada es: pantalla inicial con únicamente tres modalidades; al elegir una se revela el formulario; el menú lateral abre como drawer; no hay texto introductorio bajo el título ni chips de sugerencias en la pantalla inicial.
- LessonAITutor.tsx: se eliminó el preflight GET duplicado de /api/orby/conversations. Antes se hacía un GET de biblioteca y luego un POST que volvía a consultar el cupo para crear la clase. Ahora startWorkspaceClass crea primero el registro Live mediante createVoiceConversation (POST con session_type=live), que aplica el límite en servidor; solo después intenta abrir Gemini Live. Si falla la creación, permanece en el formulario y no abre el micrófono. Se quitaron del encabezado el badge y subtítulo redundantes, y el texto auxiliar visible bajo el botón; el estado de preparación sigue disponible para lectores de pantalla.
- app/globals.css: se añadió una última capa de estilos para usar un único degradado compartido en header y canvas, quitar la línea divisoria del header, animar la revelación del formulario (240 ms), aligerar el drawer (180 ms), eliminar animación de entrada por tarjeta y desplazamientos en cada opción, y conservar breakpoints móvil/tablet/desktop y prefers-reduced-motion.
- Causa real del error de biblioteca identificada en logs de Supabase: el 2026-11-10 a las 22:21:54 UTC PostgREST devolvió SQLSTATE 42703, column orby_conversations.session_type does not exist, porque el código nuevo consultaba la columna antes de aplicar la migración. La migración orby_live_class_sessions se aplicó a las 22:29:14 UTC. Se verificó después que session_type existe en public.orby_conversations y no aparecen nuevos eventos de esa columna faltante después de la migración. No era un fallo del diseño ni de caché del navegador.
- Se añadieron pruebas estáticas para el flujo por etapas, eliminación de copy antiguo, uso del POST de creación como control de cuota y transiciones ligeras.
- Commits de esta continuación: ebb0279 (crear clase Live antes de abrir voz y quitar GET redundante), 2493a83 (limpiar encabezado y texto auxiliar), bc28455 (flujo visual y drawer ligeros), c87fce6 (pruebas de regresión).
- Pendiente de validación: no se pudo ejecutar la suite en un checkout local ni revisar la UI en navegador desde esta sesión. Vercel sigue marcando build-rate-limit; por tanto estos commits están en feat/founder-intro, pero no se afirma que estén desplegados. La captura del usuario puede seguir mostrando el build anterior hasta sincronizar el checkout y recuperar un deployment permitido.
### Siguiente ajuste: limpieza de clases Live fallidas (2026-11-10)
- Se detectó un segundo problema del ciclo de vida: startWorkspaceClass creaba la fila de biblioteca antes de llamar toggleVoiceMode, pero toggleVoiceMode captura internamente los errores de conexión y no los propaga. Por tanto, el catch externo no se ejecutaba y podía quedar una clase guardada aunque Gemini Live no hubiera conectado.
- Se añadió comprobación posterior a toggleVoiceMode: si voiceChannelRef.current no quedó establecido, se elimina la fila provisional con DELETE /api/orby/conversations/[conversationId]. La ruta DELETE valida UUID, autentica al usuario y filtra simultáneamente por id y user_id; no permite borrar clases de otra cuenta. Si la limpieza falla, se registra un warning sin ocultar el error original de conexión.
- Se añadió prueba estática para exigir el DELETE de la clase provisional cuando falla el handshake.
- Commit: 3d56290 (limpieza de fila provisional tras fallo de voz), 8af68fd (prueba de regresión).
- Sigue pendiente ejecutar npm run test:orby, lint, build y una prueba real del navegador; Vercel mantiene el check fallido build-rate-limit. No declarar deployment ni validación runtime hasta que esos checks se completen.


## 2026-11-11 — especificación consolidada Studdy + Studley (vídeos revisados)

### Referencias inspeccionadas directamente
- `studdy.mp4` (47,6 s): referencia principal de interfaz y comportamiento visual. Se observa una pantalla inicial amplia con fondo pastel frío azul/lila/rosa, navegación lateral fina, selección de intención/modalidad y formulario compacto. Al entrar en clase, el lienzo blanco ocupa casi toda la pantalla; el título aparece manuscrito y resaltado en el margen superior izquierdo. El contenido se revela por etapas: teoría manuscrita organizada, palabras destacadas, ilustraciones/diagramas junto al párrafo que explican, controles pequeños en los bordes y controles de voz discretos en la zona inferior. También se ve el panel lateral de conversación/herramientas en una fase posterior y el reinicio del lienzo al iniciar otro tema.
- `Grabación de pantalla 2026-11-07 165008.mp4` (15,7 s): referencia pedagógica Studley. La explicación se apoya en escritura/dibujo visible sobre una superficie digital: primero se plantea el concepto, luego se construye un esquema con círculos, flechas, etiquetas y relaciones; el dibujo se amplía y se anota progresivamente para explicar cada parte. La imagen no es decoración: cada trazo aporta significado y acompaña la teoría.

### Dirección de producto: separar los dos referentes
- **Studdy gobierna la experiencia visual**: composición, paleta, jerarquía, espacio de trabajo, navegación, botones, estados, microinteracciones, animaciones, transiciones, paneles y comportamiento responsive. La meta es una reproducción funcional muy cercana del patrón observado, conservando la identidad PeakScore/Orby y sin reutilizar marcas ni assets propietarios de terceros.
- **Studley gobierna la didáctica visual**: explicar con teoría y dibujo simultáneos. Cada dibujo debe representar una idea concreta del texto hablado/escrito, con partes etiquetadas, flechas, relaciones, secuencia o comparación; evitar ilustraciones genéricas sin función pedagógica.

### Guion obligatorio de una clase
1. Mostrar el título del tema en el margen superior izquierdo del lienzo, con escala manuscrita moderada y sin quedar oculto por la navegación.
2. Comenzar directamente con una idea central breve; sin saludo, relleno ni exposición de instrucciones internas.
3. Desarrollar la teoría en fragmentos cortos, progresivos y legibles.
4. A medida que se explica cada concepto, dibujar su representación: formas, partes, flechas, etiquetas, conexiones, procesos o comparaciones. Narración y trazos deben corresponderse; no dibujar todo por adelantado.
5. Explicar explícitamente qué representa cada parte del dibujo y cómo demuestra o aclara la teoría.
6. Integrar ejemplos guiados y, después, ejercicios/preguntas de comprobación.
7. Mantener el lienzo limpio y espacioso; conservar los apuntes previos mientras se añade contenido y evitar solapamientos.
8. Cerrar con síntesis y comprobación de comprensión, sin convertir la clase en una respuesta de chat larga.

### Requisitos de interacción y movimiento
- Replicar los estados y transiciones observables de Studdy: hover, focus, active, pressed, loading, disabled, apertura/cierre de paneles, cambio de modalidad, comienzo/preparación de clase, pausa/reanudación, interrupción y finalización.
- Los botones deben tener feedback inmediato y animaciones cortas, coherentes y no intrusivas; evitar saltos de layout, reflows, blur pesado y retardos que hagan parecer bloqueada la clase.
- La entrada de título, texto, diagramas, anotaciones e ilustraciones debe ser progresiva y sincronizada con la explicación; usar movimiento reducido cuando `prefers-reduced-motion` esté activo.
- La pizarra debe seguir siendo protagonista. Los controles se mantienen discretos en bordes; el panel lateral no debe tapar ni reducir innecesariamente el área didáctica.
- No exponer prompts internos, mensajes de sistema ni transcripciones parciales duplicadas. Los subtítulos, si están habilitados, deben seguir el turno actual y no acumular chunks antiguos.

### Arquitectura pedagógica de la pizarra
- Construir cada explicación como una secuencia de bloques vinculados: concepto/teoría → visual asociado → explicación de sus partes → ejemplo → comprobación.
- Cada elemento visual debe tener propósito didáctico, texto alternativo y etiquetas legibles; las imágenes generadas deben integrarse en el mismo lienzo cuando exista espacio seguro, nunca tapar apuntes ni sustituir la teoría.
- Preferir diagramas estructurados/editables para procesos, relaciones, ciclos, células, moléculas, circuitos y gráficas; reservar ilustraciones raster para aquello que realmente requiera detalle visual.
- Sincronizar cada etapa con su frase o segmento de explicación cuando exista una señal fiable; no presentar el reloj estimado de audio como sincronización fonética exacta.
- No forzar un dibujo en cada frase: dibujar cuando mejore la comprensión y explicar por qué se está dibujando.

### Alcance y restricciones
- Mantener el trabajo exclusivamente en `feat/founder-intro`; `main`, producción y despliegues quedan intactos salvo instrucción explícita posterior.
- No añadir proveedores, modelos, APIs, créditos ni fallbacks que puedan generar cobros. Solo servicios realmente gratuitos dentro de cuotas verificadas; al agotarse, pausar/degradar con aviso claro.
- Conservar la arquitectura de voz, permisos nativos de Chrome, consentimiento explícito y guardas de cuota existentes; no simular conexiones ni activar micrófono antes del estado correcto.
- OmegaX es el tutor general; Orby queda restringido a Ciencias Naturales. Mantener la separación de identidades y materias vigente en el contexto técnico.
- El material del Orby ICFES Lab fue eliminado intencionalmente: no reconstruirlo ni usar el antiguo conteo de 28 conceptos.

### Plan de implementación y validación
1. Hacer inventario del estado real de `LessonAITutor`, `OrbyWorkspacePage`, `OrbyBoard`, herramientas Live, estilos globales y pruebas antes de tocar código.
2. Comparar cada pantalla/estado con los dos vídeos y mapear componente, interacción, transición y prueba de regresión.
3. Implementar primero la paridad visual/funcional de Studdy; después integrar el patrón de enseñanza teoría+dibujo de Studley en el contrato de contenido y renderer de pizarra.
4. Verificar que título, audio, teoría, diagramas y subtítulos mantienen el orden y que la clase puede pausarse/interrumpirse sin perder sincronía ni duplicar trazos.
5. Ejecutar `npm run test:orby`, TypeScript, ESLint y build; realizar QA manual en Chrome con micrófono real, escritorio y móvil. Registrar resultados reales, no inferidos.
6. No declarar paridad completa mientras falte una prueba real de clase de principio a fin.

### Estado de esta actualización
- Se revisaron ambos vídeos directamente y se consolidó la especificación visual y pedagógica en este documento.
- Esta actualización es documental; no afirma que la implementación de código ya esté terminada, que la voz esté validada ni que exista un nuevo deployment.


### Continuación de implementación (2026-11-11)
- Se reforzó `lib/ai/orby-class-start.ts`: separa explícitamente la dirección visual Studdy de la metodología didáctica Studley, exige la secuencia idea central → apunte → dibujo relacionado → explicación de partes → ejemplo → síntesis/comprobación, y distingue la ruta de voz por turnos de la sincronización fonética Live. Se corrigió el separador del prompt para que cada instrucción llegue como párrafo real (`\n`), no como los dos caracteres literales `\\n`.
- Se reforzó el prompt real de voz en `app/api/lesson-tutor/route.ts`, que es el contrato utilizado por el flujo Cloudflare Workers AI + voz local del aula: composición de lienzo Studdy, docencia simultánea teoría+dibujo Studley, secuencia de clase, calidad científica y límites de sincronización. No se incorporaron proveedores ni modelos nuevos.
- En `lib/ai/orby-live-tools.ts` se añadió el campo opcional `spokenCue` al esquema de la herramienta Live y una instrucción de frase literal de 3–12 palabras. En `app/api/orby/realtime-session/route.ts` se alineó la instrucción Live con la cola de snapshots ya existente: solo se revela una etapa al alcanzar el cue con el reloj de audio/subtítulos; sin cue exacto, se conserva el comportamiento inmediato.
- En `components/aprender/OrbyBoard.tsx`, las hojas v3 pasan de una cuadrícula horizontal de dos columnas a una secuencia vertical de hojas 16:9, en orden de enseñanza y a ancho completo. Se actualizó la prueba correspondiente.
- Se ampliaron pruebas en `tests/orby-request-filter.test.mjs` para el esquema spokenCue, el contrato de voz Studdy/Studley, los párrafos reales del prompt inicial y el apilado vertical de hojas. No se han debilitado pruebas existentes.
- Commits de esta continuación: `35e0e135` prompt inicial Studdy/Studley; `9957a5a` regresión pedagógica; `54b05f7` separadores de prompt; `a4fc081` schema spokenCue Live; `40894d5` hojas verticales; `02885ca` instrucción de sincronía Live; `3cd6340` regresiones de sincronía y layout; `a02ff99` regresión de saltos de párrafo; `b389bd0` contrato real del tutor de voz; `1b7100a` diferencia Live vs voz por turnos; `50a6ded` regresión del contrato de voz.
- Validación pendiente y bloqueada por entorno: no hay DNS de salida hacia github.com desde el contenedor; Vercel Sandbox API devolvió 400 al intentar crear un entorno y el contexto del proyecto ya registra el límite de deployments del plan Hobby. No se ha ejecutado localmente `npm run test:orby`, `npm run lint`, TypeScript ni `next build`; tampoco se ha realizado QA visual/voz en Chrome. GitHub no reportó workflows para los commits consultados. No afirmar que los cambios están desplegados ni que pasan builds hasta obtener resultados reales.
- Próxima ejecución: sincronizar esta rama en un entorno con checkout real y correr, en orden, `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npx next build`. Resolver fallos sin borrar/debilitar pruebas; después probar clase real, pausas/interrupciones, voz local, subtítulos, persistencia y responsive antes de declarar entrega.


### Validación adicional de Vercel (2026-11-11)
- Se pudo inspeccionar el build del deployment `dpl_4kM4yrv2JA1UBkrTidwzuzPn3apf` (commit `02885ca`). El pipeline sí inició `npm run build` y ejecutó `npm run test:orby`; no fue un error de compilación de Next. La suite detectó aserciones antiguas que todavía esperaban el texto previo de `orby-class-start.ts` y una prueba nueva con una frase no idéntica al prompt actualizado. Se corrigieron esas aserciones en commits posteriores (`6d1419a`, `b85de4d`, `3167b43`), además de alinear un test que esperaba que la herramienta no declarara `spokenCue`.
- El build del commit `02885ca` no es una validación verde: falló en `test:orby` antes de llegar a ESLint/Next build. Los commits posteriores no tienen deployment asociado; el check Vercel informa `build-rate-limit`. No se ha podido confirmar todavía que las correcciones de tests pasen.
- Últimos commits posteriores a la actualización anterior: `b389bd0`, `1b7100a`, `50a6ded`, `6d1419a`, `b85de4d`, `3167b43`. Próximo paso: cuando Vercel permita un build de Preview, volver a ejecutar toda la cadena; no marcar como verde por inferencia.
