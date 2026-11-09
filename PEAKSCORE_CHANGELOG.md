
## Acciones docentes idempotentes — 2026-11-09

- Se endureció `evaluateOrbyBoardActionSequence`: ahora rechaza con `missing_action_identity` cualquier acción Live sin `actionId` y `sequence`, además de comprobar generación, duplicados, orden y dependencias.
- El contrato de `apply_orby_board_action` exige `actionId` y `sequence` para TODAS las operaciones: `focus`, `clear-focus`, `erase`, `replace`, `append-block` y `append-strokes`.
- Se alineó la instrucción de Gemini Live: cada acción debe llevar ID único y secuencia creciente desde 1; `clear-focus` ya no se describe como una operación que solo envía `turnGeneration`.
- Se mantiene compatibilidad de lectura/sanitización de payloads legacy para historial y pruebas, pero el dispatcher Live no ejecuta una acción sin identidad idempotente.
- Se añadieron regresiones para replay duplicado de `focus`, rechazo de focus/clear-focus/erase/replace legacy en el evaluator y contrato de schema/prompt.
- Commits: `f4436246` (evaluator), `40568959` (tool schema), `d64b6918` (prompt), `56cacdd7` (compatibilidad del parser) y `39487484` + `cfe427c7` (pruebas).
- CI del commit `cfe427c7e057918733a3708e91cfde4423909d86`, run `42630407494` (#3310): pruebas Orby y TypeScript aprobados; ESLint y build de producción en ejecución al registrar esta nota. No declarar CI completa hasta que ambos terminen.
- Sin cambios a proveedor/modelo, coste, flags de privacidad, migraciones, Supabase remoto, despliegue ni `main`.
## 2026-11-09 — validación CI de zoom/pan y contexto actualizado
- Run `42629282026` (run #3300), commit `7e5a376b27134d662ef4849e3aa0873c6a256204`: **success**. 273/273 pruebas Orby, TypeScript, ESLint y Next.js production build aprobados.
- Run `42629331555` (run #3301), HEAD documental `e3123d7e63ace6200dd941aa40f35a5ffd5a6ceb`: **success**. Confirma el pipeline del HEAD que incluye la actualización del contexto técnico.
- Esto valida regresiones automatizadas y compilación; no sustituye QA manual de zoom, gesto de arrastre, teclado, trackpad/táctil ni exportación PDF en Chrome.
- La iteración de viewport sigue limitada a 2–4 hojas 16:9 apiladas verticalmente; no se declara infinite canvas.
- Sin cambios a `main`, despliegue, Supabase remoto, proveedores ni flags de coste/privacidad.

## 2026-11-09 — zoom y desplazamiento accesible de la pizarra OmegaX
- Se añadió zoom 60–200 % en pasos del 10 %, controles de acercar/alejar y ajuste al 100 %.
- El zoom conserva el centro visible de forma aproximada y solo escala el contenedor de presentación; no modifica coordenadas, IDs, secuencias ni snapshots guardados.
- Se añadió modo explícito de movimiento por arrastre y arrastre con botón central. Las interacciones con botones/campos no inician el gesto.
- La región de pizarra ahora acepta desplazamiento por flechas y PageUp/PageDown cuando tiene foco.
- El observador de hoja activa usa el viewport desplazable como raíz. Se excluyen los controles en impresión y se fuerza la hoja al ancho de página al exportar.
- Se añadieron regresiones estáticas para límites de zoom, controles accesibles, pointer capture, teclado, reduced motion, observer y estilos de impresión.
- Commits: `58591ced` (funcionalidad), `6da8392` (estilos), `0bd5a8b` (pruebas).
- Pendiente: CI del HEAD, QA real en Chrome/móvil, trackpad y PDF. No declarar el hito cerrado hasta verificar esos puntos.
- No se tocó `main`, Supabase remoto, despliegue, proveedores ni flags de privacidad/coste.
## 2026-11-09 — CI verde de persistencia multipágina v3
- CI run `42556891812` del commit `5d090884d7b62c9693d6fd7269e562c02f1db219`: 272/272 tests Orby correctos; TypeScript, ESLint, build de Next.js y auditoría de dependencias correctos.
- Esta ejecución incluye el test que verifica las dos RPC SQL de persistencia v3 y sus límites. La migración conserva la ruta idempotente de voz.
- La migración `20261109030000_orby_multipage_board_v3_persistence.sql` sigue sin aplicarse al proyecto Supabase remoto. La CI no es ejecución SQL ni prueba de base de datos real.
- Pendiente para el despliegue: aplicar migración en el proyecto correcto y verificar que una conversación escrita y un turno de voz recuperan el board v3 al reabrir historial.
- No se alteró `main`, producción, credenciales o flags Free Tier/privacy.

## 2026-11-09 — persistencia multipágina v3 en historial escrito y voz
- Se detectó que el renderer/sanitizador aceptaba v3 pero las RPC Supabase de historial todavía rechazaban v3 y solo admitían v1/v2 (8 bloques, 4 visuales, 24 KB). En Live, el endpoint podía recurrir al guardado de texto sin board; una clase multipágina se veía en sesión pero no se conservaba al volver al historial.
- Se creó `supabase/migrations/20261109030000_orby_multipage_board_v3_persistence.sql` para actualizar ambas RPC atómicas: `orby_save_turn_with_board` y `orby_save_voice_turn_with_board`.
- Nuevos límites v3: 2–4 hojas 16:9, máximo 12 elementos por página, hasta 24 bloques + 8 visuales / 32 elementos totales / 36 KB. La función valida que cada hoja esté poblada, que el page index sea válido, que el recuento del layout coincida con blocks + visuals y mantiene los límites v1/v2.
- La RPC de voz conserva el recibo idempotente y `ON CONFLICT DO NOTHING`; el reintento no debe duplicar los mensajes.
- Se añadió una regresión estática de migración v3 para verificar ambas RPC y sus límites. CI del commit `5d090884d7b62c9693d6fd7269e562c02f1db219` terminó verde: 272/272 tests, TypeScript, ESLint, Next.js build y auditoría de dependencias.
- La migración solo se guardó en GitHub. **No se ha aplicado a Supabase remoto**; aplicar la migración en el proyecto Supabase del entorno antes de esperar persistencia de tableros v3. El endpoint mantiene un fallback seguro de texto si el entorno no tiene todavía el esquema actualizado.
- Ver `docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md` §10.11.
 
## 2026-11-09 — navegación de hojas y alineación de Gemini Live v3
- Se agregó un navegador compacto de hojas en la pizarra multipágina: salto directo, hoja activa sincronizada por IntersectionObserver, etiquetas accesibles, foco de teclado y reduced motion.
- El observer ahora conserva los ratios de todas las hojas actualmente visibles y escoge la hoja con mayor intersección (desempate por índice), evitando que la navegación dependa solo de las entradas que cambiaron en el último callback.
- Se alineó el systemInstruction de Gemini Live: ahora conoce version 2 de una hoja y version 3 de 2–4 hojas, límites por página y el campo `page` de append-block para abrir la página siguiente. El tutor por turnos ya conocía v3; ambos caminos quedan alineados.
- La primera CI del navegador detectó un lint por reset de estado síncrono en useEffect; se eliminó el reset redundante. El estado inicial es página 0 y el observer sincroniza el indicador. Commit correctivo: `5fe12863b3d0378363b9e4741d7700fca591d97e`.
- Añadidas regresiones para prompt Live multipágina, botón de cada hoja, página activa, scroll, observer y estilos de accesibilidad.
- Estado de validación al registrar esta nota: CI del commit correctivo en curso. No declarar el navegador aprobado hasta que pasen tests, TypeScript, ESLint y Next.js build.
- Pendiente QA real visual/móvil/teclado y una llamada Live autorizada que enseñe más de una hoja. No se alteraron las puertas de privacidad ni de coste.
- Ver `docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md` §10.10.

## 2026-11-09 — diagnóstico Live y tablero docente multipágina v3
- Fotograma de la grabación de PeakScore (~17 s): Gemini Live está bloqueado por falta de confirmación del nivel gratuito y aprobación explícita del uso de datos de Free Tier; el mensaje confirma que no se envió audio ni texto. Es una puerta de privacidad/coste anterior al token, no un error demostrado de WebSocket.
- No se activaron variables de entorno ni se envió contenido a Google. Live seguirá bloqueado hasta que el dueño confirme por separado que la cuenta no producirá cargos y apruebe el tratamiento de datos; producción también requiere `ORBY_GEMINI_LIVE_ENABLED=true`.
- Se amplió la auditoría pública de Studdy: widget con `apiKey/mode/context`, Whiteboard Tutor anunciado como infinite canvas y categorías de datos recogidas por su política. No se atribuye proveedor privado de modelo, STT/TTS, DB vectorial ni frontend sin evidencia pública.
- Se añadió evidencia App Store: el historial de versiones registra Whiteboard Tutor en 3.6.3; la etiqueta de privacidad del desarrollador, no verificada por Apple, enumera datos de audio en funcionalidad, personalización y analítica. La ficha no identifica proveedores ni SDK.
- La ruta real de inicio es `/orby → OrbyWorkspacePage → LessonAITutor`; el experimento en `OmegaXStudyHome.tsx` fue revertido porque no está montado en esa ruta. Los starters activos de `LessonAITutor` son chips compactos.
- **Pizarra v3 añadida:** clases de 2–4 hojas 16:9 encadenadas verticalmente, máximo 12 etapas por hoja, hasta 24 bloques + 8 visuales / 32 elementos / 36 KB por snapshot. IDs y secuencia globales; el renderer muestra hojas consecutivas; Gemini recibe instrucciones para distribuir el contenido; append-block puede abrir la siguiente hoja sin modificar las anteriores. v1/v2 permanecen compatibles.
- **Límite:** es un canvas vertical paginado y acotado, no un infinite canvas libre con zoom/pan ni páginas ilimitadas.
- CI del commit `fb8b655a35260cfdf1a84fdc423e31aeac5d7ae7`: 270/270 tests Orby, TypeScript, ESLint y build Next.js pasaron; auditoría de dependencias correcta.
- Pendiente: QA real en Chrome/micrófono, verificar que Gemini produzca una lección v3 multipágina durante voz real, continuidad de audio/pizarra al cambiar de hoja y persistencia al superar cuatro hojas. La pista de audio de los MP4 de Studdy no está transcrita ni validada acústicamente.
- Ver `docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md` §§10.5–10.8.

## 2026-11-09 — inicio Studdy-like y fallback de voz explícito
- La pantalla real `/orby` se confirmó como `OrbyWorkspacePage → LessonAITutor`. Se revirtió el experimento en `OmegaXStudyHome.tsx`, que no estaba montado en esa ruta.
- `LessonAITutor.tsx`: los tres iniciadores de clase del inicio pasan de tarjetas grandes a chips compactos; permanece el CTA de llamada Live y el acceso a pregunta por texto.
- Se añadió una opción manual «Continuar por turnos» cuando falla Live. Nunca se activa automáticamente: el estudiante elige reintentar manos libres o usar el modo alternativo, que se identifica claramente como no continuo.
- Se corrigió el tipo del payload del endpoint de sesión para declarar `model`, `systemInstruction` y `voiceName`.
- CI en commit `8515f711158906671326f2ed5de3c4db620e6223`: 267/267 tests Orby, TypeScript, ESLint, Next.js build y auditoría de dependencias exitosos.
- El HEAD posterior ha restaurado `OmegaXStudyHome.tsx` sin cambios y añade actualización de documentación. Esperar la CI de ese HEAD para declarar finalizada esta tanda.
- La llamada real en Chrome/micrófono sigue pendiente; no se afirma que Live ya conecte con el entorno de producción.

## 2026-11-08 — revisión de puertas de privacidad para Gemini Live
- Se confirmó que el ejemplo de entorno deja apagadas las confirmaciones de plan gratuito y uso de datos Gemini Free Tier, y que producción exige una activación adicional de Live.
- La ausencia de esas variables produce un bloqueo controlado antes de enviar audio; no es un fallo de handshake.
- No se habilitaron variables ni se relajaron condiciones: el Free Tier de Google puede usar datos de solicitudes para mejorar productos y se requiere aprobación expresa.
- Se documentó cómo distinguir estos códigos del fallo de transporte: docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md §10.4.

## 2026-11-08 — Gemini Live: versión de token fijada al SDK exacto
- Se verificó `@google/genai@2.17.1` contra su código fuente etiquetado en GitHub. `live.connect` indica explícitamente soporte v1alpha para tokens `auth_tokens/` y construye `BidiGenerateContentConstrained?access_token=...` según esa versión.
- Se restauró `v1alpha` en la emisión del token y en las dos conexiones del navegador (inicio/reconexión); los tests se actualizaron para fijar el contrato v1alpha. El cambio candidato anterior v1beta queda supersedido para el SDK 2.17.1.
- Se conserva el model ID simple `gemini-3.8-live` en el campo `liveConnectConstraints.model`.
- La API REST/WebSocket nativa actual documenta v1beta, pero no se mezclará con el SDK encapsulado. Evaluar migración nativa por separado solo con spike de handshake y pruebas completas.
- No se han ejecutado test:orby, TypeScript, ESLint, build ni QA Chrome/micrófono desde esta sesión; no declarar llamada corregida.
- Referencia: docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md §10.3.

## 2026-11-08 — advertencia de compatibilidad SDK/API para Gemini Live
- Google documenta actualmente los tokens efímeros de Live y su endpoint WebSocket en v1beta.
- La documentación/código público de @google/genai todavía conserva una advertencia de que el manejo de token efímero por el SDK está soportado/documentado solo en v1alpha; el SDK construye la ruta según la versión configurada, pero muestra el warning si se elige v1beta.
- El lockfile de PeakScore fija @google/genai 2.17.1. Por eso v1beta se mantiene como candidato conforme a la documentación actual de la API, no como corrección comprobada.
- La siguiente verificación obligatoria es crear token con SDK 2.17.1, conectar en Chrome, recibir setupComplete, enviar PCM y confirmar audio de retorno. Si falla, comparar el endpoint real y el source exacto del SDK antes de decidir entre v1alpha o WebSocket nativo v1beta.
- La investigación ampliada de Studdy y el mapa de tecnologías/hipótesis están en docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md. No se atribuye un proveedor privado no divulgado.

## 2026-11-08 — corrección de protocolo Gemini Live y token efímero
- Hallazgo: la implementación usaba v1alpha para emitir el token efímero y para conectar el cliente, aunque Google documenta la creación y el uso de estos tokens en v1beta.
- Se alinearon la emisión del token, la conexión inicial y la reconexión con v1beta.
- Se corrigieron las dos aserciones estáticas que exigían v1alpha; se agregó una regresión para el campo model en las restricciones del token.
- El endpoint de token se construye con el ID simple de modelo en el SDK JavaScript (`gemini-3.8-live`), conforme al ejemplo JS oficial. La API REST muestra el nombre de recurso `models/gemini-3.8-live`; no mezclar ambas representaciones al usar el SDK.
- Se conserva la puerta de plan gratuito y el consentimiento de privacidad para datos de Gemini Free Tier. No se introducen proveedores adicionales ni facturables.
- El modelo gemini-3.8-live figura como opción estable de Live API en el catálogo actual de Google.
- Pendiente QA: suite Orby, TypeScript, ESLint, build, Chrome real con micrófono, setupComplete, envío y recepción de audio, interrupciones y llamadas a herramientas. No se declara corregida la llamada antes de estas pruebas.
- Se amplió la investigación pública de Studdy: se documentaron comportamientos de producto y categorías de datos/proveedores descritas en su política; no se encontró atribución pública verificable de su proveedor privado LLM/STT/TTS, stack de pizarra o transporte.
- Referencia: docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md.

## 2026-11-08 — referencia Studdy y entrada por intención en OmegaX
- Se inspeccionaron visualmente los tres videos adjuntos. Se identificaron dos patrones de referencia: entrada por intención de estudio y aula con pizarra amplia que incorpora notas/diagramas progresivamente.
- La grabación de PeakScore muestra un fallo al conectar la llamada. La causa exacta aún no está confirmada.
- Se añadió `docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md` con diagnóstico, prioridades P0–P3, evaluación de proveedores y checklist de QA.
- `OmegaXStudyHome.tsx`: añadido selector de intención (explicar tema, resolver pregunta, estudiar apuntes, preparar Saber 11); la intención se envía como contexto inicial si el alumno no escribe un tema.
- La inspección de video fue visual por fotogramas; la escucha y validación acústica completa quedan pendientes. No afirmar que se ha escuchado/transcrito el audio de los videos.
- No se cambió Gemini Live, no se habilitó ningún proveedor, no se relajaron las puertas de coste/privacidad, no se ejecutaron migraciones ni se modificó `main`.
- Pendiente: reproducir la llamada real en Chrome y corregir el primer punto de fallo; cerrar la secuencia de enseñanza progresiva de pizarra; ejecutar tests, TypeScript, ESLint y build en el checkout real.

## 2026-11-08 — espacio de estudio profesional y voz audio-first

- Se documentó `docs/OMEGAX-STUDY-WORKSPACE-UX.md` con el lenguaje visual inspirado en la claridad de Studdy/Studley sin copiar sus marcas ni pantallas.
- `LessonAITutor.tsx`: la burbuja visible «Tú · transcribiendo» se retiró del aula en vivo. La transcripción de entrada se mantiene solo internamente para el protocolo actual de Live, validación de seguridad y persistencia del turno.
- Los subtítulos de OmegaX quedan desactivados por defecto y se activan voluntariamente desde los controles de llamada.
- El espacio de estudio usa tipografía sans serif legible; las fuentes pixel quedan reservadas a experiencias de juego. Se sustituyeron los símbolos genéricos de estrella/cuaderno por iconos semánticos de Lucide.
- English Studio prioriza llamada directa para Speaking y Pronunciation según tarea y nivel A1–C2. Grabación y reconocimiento de texto quedan dentro de una sección opcional de revisión.
- Se añadieron dos regresiones para el CTA de llamada, prompts A1–C2, audio en vivo y ausencia de transcripción visible. Inventario estático: 262 tests declarados; ejecución automatizada del HEAD pendiente.
- Live ya usa transmisión de audio y respuesta hablada. No se desactivan sus controles de seguridad para forzar salida anticipada; tampoco se promete latencia cero. El modo alternativo por turnos debe anunciarse como más lento y no puede salir de los proveedores confirmados sin coste.
- Pendiente QA real con Chrome/micrófono, interrupciones y roleplays con audio. Sin pruebas con estudiantes, cambios a `main`, deploy, migraciones remotas ni cambios a las puertas de proveedor.

## 2026-11-08 — auditoría transversal y puertas de coste/privacidad de inferencia
- Se auditó el flujo de inferencia de OmegaX/Orby en chat, voz, visión, embeddings, lectura de PDFs, TTS, administración, worker y cron.
- Se añadieron confirmaciones fail-closed para Gemini, Groq, LLM7 y Cloudflare Workers AI. Una API key por sí sola ya no habilita llamadas; los flags de cuenta sin coste quedan en false por defecto.
- Gemini exige además aprobación separada para el uso de datos del nivel gratuito; mantenerla apagada si no existe una decisión explícita de privacidad.
- Se protegió el cliente Gemini directo de importación PDF y se deshabilitó el cliente OpenAI legacy. El endpoint LLM7 se fija al host aprobado.
- Se corrigió el estrechamiento TypeScript del foco de pizarra, el reloj de speaking (inicio en MediaRecorder.onstart y reloj monotónico) y el sanitizador de etiquetas focus.
- Se añadieron regresiones para las puertas de proveedor, privacidad, importación PDF y preservación de etiquetas académicas.
- Validación completa (260 tests, TypeScript, ESLint, build y auditoría de dependencias): run 42537054107, SHA 4a7e212. Ajuste posterior de orden auth/admin en importación PDF pendiente de CI final.
- Riesgo pendiente: Cloudflare anuncia retirada de `@cf/google/embeddinggemma-300m` el 20 de noviembre de 2026; el índice actual usa 768 dimensiones. No sustituir/reindexar sin validar dimensiones y búsqueda.
- QA manual de Live, voz, navegador, cuotas reales y privacidad sigue pendiente. Sin cambios a `main`, sin deploy ni migraciones remotas.

## 2026-11-08 — OmegaX English Studio A1–C2 y feedback con reintento
- Se amplió el selector de English Studio de A1–C1 a A1–C2, con descriptor y pauta pedagógica específica por nivel.
- Se adaptaron los prompts de roleplay para conversar una pregunta por vez, corregir hasta dos aspectos y guiar un reintento. El nivel elegido es una meta didáctica, no una certificación.
- Se reformuló el feedback de speaking/repetición: evidencia textual, fortaleza, máximo dos mejoras, frase original → reformulación → razón → modelo → mini-reto de 30–60 segundos.
- No se atribuyen puntuaciones fonéticas ni evaluación de acento/entonación a una transcripción de texto.

## 2026-11-08 — pizarra pedagógica transversal de OmegaX
- Live y fallback reciben instrucciones visuales diferenciadas para las cinco áreas ICFES, reutilizando `orby-scope.ts` y sus perfiles existentes.
- English Studio usa el tablero para orden de palabras, corrección de frases, estructuras, tiempos verbales, conectores, vocabulario y pistas de lectura cuando sean pedagógicamente útiles.
- Se separó explícitamente inglés general MCER A1–C2 de Inglés Saber 11: conservar las siete partes y el banco manual, sin generar preguntas dentro de ese banco ni confundir C1/C2 con la escala oficial del examen.
- Se creó `docs/OMEGAX-ACADEMIC-COACH-SPEC.md` para preservar arquitectura, estado implementado, brechas y próximos pasos.
- Se añadieron tres regresiones; inventario estático actual: 252 tests nombrados sin duplicados. No significa que estén ejecutados.
- Validación pendiente para el HEAD: suite, TypeScript, ESLint, build y QA real de voz/pizarra. Sin cambios a main, sin despliegue, sin migraciones y sin proveedores facturables.

## 2026-11-08 — siguiente hito documentado: coreografía de enseñanza OmegaX
- Se definió el siguiente objetivo de producto a partir de las referencias Studdy/Studley: una explicación completa debe sentirse como una clase continua, no como una sucesión de comandos visuales independientes.
- Secuencia objetivo: dibujar/actualizar → enfocar una pieza existente → explicar → limpiar solo el foco → enfocar otra pieza → comparar → añadir una relación conservando el tablero.
- Requisitos técnicos: IDs estables, referencias validadas contra el snapshot activo, generación/actividad vigente, cola cancelable, acciones idempotentes y preservación del contenido ante interrupciones.
- Próximos targets candidatos: electrones/partículas, enlaces moleculares, aristas/flechas, cables y puntos de gráficas/vectores. No se declaran implementados en este registro.
- Este commit registra alcance y criterios; no afirma cambios de runtime ni pruebas ejecutadas. `main` sin cambios.

# PeakScore — Changelog técnico

## 2026-11-07 — escucha continua manos libres
- Métrica del ciclo completo de conversación y verificación del rearme del micrófono únicamente después del último fragmento de voz de Orby.
- Prueba estática añadida; pendiente QA real de micrófono/eco y conversación sin pulsar de nuevo.


## 2026-11-07 — instrumentación de latencia de voz
- Se añadió medición del primer chunk de audio recibido, independiente de la primera reproducción audible, reiniciada por turno.
- Test estático añadido; falta medir p50/p95 con sesiones reales. No se declara cumplido el objetivo de 1 segundo.


## 2026-11-07 — ajuste de respuesta continua de voz
- Live endpointing reducido de 500 a 400 ms en cliente y servidor para acortar la pausa tras terminar de hablar.
- Instrucción de voz prioriza respuesta directa, sin relleno y con continuidad contextual, manteniendo filtros y precisión.
- 1 s se trata como objetivo de primera señal, no como SLA de respuesta completa. Requiere medir p50/p95 y validar que no haya cortes de voz.
- Test estático añadido; no se ejecutaron pruebas runtime/Chrome/micrófono/TS/ESLint/build.


## 2026-11-07 — estado de preparación del tablero en llamada
- La llamada reserva una superficie de pizarra mientras el turno está pendiente y aún no hay visual validado; se reemplaza por el tablero real cuando llega.
- No se muestra un dibujo ficticio ni se genera una petición adicional. Test estático añadido; runtime/Chrome/TS/ESLint/build pendientes.


## 2026-11-07 — continuidad del tutor de voz dentro del chat
- La respuesta de voz activa muestra estado EN VIVO en su burbuja y el texto incremental usa aria-live polite para accesibilidad.
- El tablero permanece debajo del mismo mensaje y conserva el id compartido con el escenario de llamada.
- Test estático añadido; no ejecutados runtime/Chrome/micrófono/TS/ESLint/build.


## 2026-11-07 — especificación de voz, pizarra y subtítulos
- Nuevo docs/ORBY-VOICE-WHITEBOARD-SPEC.md: experiencia esperada, contrato de eventos, reglas pedagógicas y checklist de aceptación.
- Separa estado implementado/parcial/pendiente y bloquea la declaración de listo hasta QA real en Chrome/micrófono y checks técnicos.


## 2026-11-07 — tablero y subtítulos durante llamada de Orby
- El escenario de voz muestra la pizarra del turno activo con OrbyBoard y subtítulos incrementales desde outputTranscription de Live.
- Control para mostrar/ocultar subtítulos; sin nuevas llamadas de IA ni proveedores.
- Limitación: texto según transcripción disponible, sin alineación exacta palabra-a-palabra; pizarra al llegar la herramienta, no sincronía temporal garantizada por trazo. Fallback sigue degradado sin inventar voz.
- Prueba estática añadida. Archivos verificados en GitHub; no se ejecutaron browser/mic/TS/ESLint/build.


## 2026-11-07 — revelación de bloques y etapas de Orby
- Bloques pedagógicos y visuales nuevos aparecen suavemente; procesos fisiológicos y líneas de tiempo se revelan con retrasos escalonados acotados.
- Claves estables para snapshots acumulativos que anexan contenido y test estático de regresión.
- No es escritura carácter por carácter ni sincronía exacta con narración. Pruebas runtime/build/browser no ejecutadas.


## 2026-11-07 — primera capa de trazos progresivos de Orby
- OrbyBoard: trazado SVG progresivo para conexiones, gráficas, vectores, enlaces moleculares, circuitos y ADN; aparición suave de nodos.
- CSS: animaciones accesibles con respeto a prefers-reduced-motion.
- Tests: regresión estática para renderer y movimiento reducido.
- Límite: todavía no hay escritura manuscrita de texto, secuenciador incremental ni sincronía por segmentos de voz. No afirmar que iguala el video todavía.
- Relectura GitHub sí; ejecución de pruebas/compilación/navegador no disponible en esta tanda. Rama divergente frente a main; no Pull.


## 2026-11-07 — Orby Live Tutor: especificación de pizarra sincronizada
- Inspección adicional de audio: Gemini Live agenda chunks PCM16 con Web Audio, pero el flujo revisado no vincula cada chunk a frases/palabras del transcript; no puede afirmarse sincronía exacta por palabra todavía.
- Creado docs/ORBY-LIVE-TUTOR-SPEC.md con visión, comportamiento obligatorio, secuencia pedagógica, contrato incremental recomendado, criterios de aceptación y matriz de pruebas basada en el video de referencia del propietario.
- La auditoría confirmó que Live puede actualizar snapshots acumulativos, pero OrbyBoard.tsx renderiza SVG estático; no hay evidencia todavía de trazos progresivos ni sincronización por segmentos reales de voz. Se registra como brecha abierta, no como funcionalidad terminada.
- Actualizados PEAKSCORE_CONTEXT.md y docs/ORBY-IMPLEMENTATION-AUDIT.md para conservar la referencia y evitar regresiones de alcance.
- Sin cambios a main, despliegue ni migraciones remotas. No se ejecutaron build/tests/browser en esta tanda.


## 2026-11-06 — Orby hybrid public research
- Added `lib/ai/orby-web-research.ts`, a keyless/free public-source adapter using the Wikimedia Spanish search API and OpenAlex works API. It enforces source-host allowlists, short timeouts, bounded results, deduplication, safe URL reconstruction, and treats excerpts as untrusted data.
- General model knowledge remains the default teaching capability: ordinary definitions, explanations and routine exercises do not trigger Internet searches. Text and VC still consult Orby Lab for relevant published material; public search activates only when the student asks for sources/research, requests current or recent facts, or asks to verify/contrast external evidence.
- When external research is requested, text and VC run the public-source lookup independently from Lab retrieval. A request for sources about an already-discussed topic can still search the web even if a new Lab lookup is not needed. If either evidence service is unavailable, successful results from the other remain available; public-source outages never block tutoring or trigger another model provider.
- The VC knowledge-search tool now returns the same public-source context alongside Orby Lab results; Gemini Live instructions explain how to use and qualify those results.
- The browser now forwards `public_sources` from the VC knowledge-search response into Gemini Live's function result; previously the endpoint could return sources while the client silently dropped that field.
- Text chat displays only sources explicitly cited by the final model answer, preserves their original citation numbers, and embeds safe Markdown citation links in the saved assistant text so references remain clickable after conversation history reloads.
- VC transcripts now attach validated public-source links when the Live knowledge tool returns them. The source list is rendered below the voice reply and its Markdown links are appended to the persisted transcript, while raw audio playback continues to use the answer without URLs.
- Voice citation handling now retains only references explicitly cited by the Live transcript, preserves the original citation numbers and clears source state between turns. Follow-up requests instruct Live to resolve pronouns from the immediately preceding academic exchange; text chat uses the same recent academic context only for those follow-ups. The shared citation reconciler replaces any model-supplied Markdown URL with the verified URL from the returned source, preventing fabricated destinations.
- Research relevance ranking ignores request-intent words (such as “fuentes”, “investiga” and “recientes”) and scores the actual academic topic against source titles and abstracts, preventing the wording of a source request from hiding relevant results.
- The source-request detector distinguishes bibliography requests from curricular concepts such as “fuentes de energía”, so ordinary Natural Sciences questions do not trigger public search. Spanish topic keywords are also expanded to common English equivalents when matching international abstracts and titles. Explicit academic-reference qualifiers still activate research even when the underlying concept is an energy source.
- Contextual source and verification follow-ups such as “dame fuentes de eso” or “verifica esto” reuse only the recent academic context, then reduce it to a small, privacy-scrubbed keyword query. Live tool instructions likewise require resolving pronouns to the actual topic instead of searching for “eso”.
- Citation links are rendered only for the approved HTTPS hosts (Spanish Wikipedia, DOI and OpenAlex); text-to-speech removes the Markdown destination and does not read out a raw URL.
- Added regression tests for source allowlisting, relevance filtering, deduplication, limits, excerpt sanitization, offline degradation, selective web-search triggers, Lab follow-ups requesting sources, citation reconciliation, persistent citation links, and integration in both channels.
- Model routing remains as implemented: the text tutor uses Cloudflare Workers AI with Gemma 4, while the live voice channel uses Gemini Live. Both can answer from model knowledge; the public-source adapter supplements rather than replaces either model.
- Public API requests receive only normalized academic keywords from the current request and lesson metadata; the full conversation history is not forwarded. Emails, URLs, phone-like numbers, and generic personal-context words are removed before search.
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


## 2026-11-07 — especificación curricular integral de Orby
- Se añadió `docs/ORBY-ICFES-CURRICULUM-PLAN.md` con un mapa inicial de las cinco pruebas Saber 11, competencias, componentes, progresión pedagógica, política de precisión y plan de implementación.
- La especificación toma como referencia principal la guía Icfes Saber 11 2026-2 y los marcos de referencia oficiales; los materiales aportados por el propietario son insumos complementarios, no sustituyen la estructura oficial del examen.
- Se separan contenidos núcleo Saber 11, prerrequisitos/refuerzo y ampliaciones académicas para no presentar cálculo universitario, números complejos u otros temas avanzados como foco obligatorio del examen.
- Se preserva la creación/revisión manual del banco de Inglés en sus siete partes y la restricción de presupuesto: no introducir proveedores, modelos ni fallbacks con riesgo de cobro.
- Esta entrega es documentación y diseño; no implica que el código del tutor ya implemente toda la cobertura. No se modificó `main`, no se desplegó ni se debe hacer Pull todavía.
- Fuentes oficiales consultadas: guía de orientación 2026-2, página de marcos de referencia Saber 11 y caja de herramientas «¿Qué se evalúa?» del Icfes.


## 2026-11-07 — tablero visual en voz y auditoría inicial de implementación
- Se amplió la descripción de `render_orby_teaching_board`: ahora declara los catorce tipos visuales que ya acepta `sanitizeOrbyBoard`, y alinea los rangos de coordenadas con el validador.
- Se actualizó el prompt de fallback de voz de `app/api/lesson-tutor/route.ts`: ahora puede producir tableros versión 2 con bloques y visuales tipados, en lugar de limitarse a bloques textuales versión 1.
- Se añadieron regresiones estáticas para el contrato visual de Live y el tablero del fallback de voz.
- Se añadió `docs/ORBY-IMPLEMENTATION-AUDIT.md` con arquitectura confirmada, brechas curriculares, validación semántica pendiente y plan de pruebas.
- No se ejecutaron localmente pruebas, TypeScript, ESLint ni build; no se declara CI aprobada ni prueba real de Chrome/micrófono.
- No se tocó `main`, no se desplegó y no se aplicaron migraciones remotas. No hacer Pull hasta validar CI, voz/tablero y la migración de idempotencia de voz en un entorno de prueba.


## 2026-11-07 — etapas de pizarra ligadas a la frase hablada
- El contrato de la herramienta Live incluye `spokenCue` opcional para asociar cada snapshot acumulativo con una frase exacta de la explicación.
- LessonAITutor retiene las etapas hasta que la transcripción de salida validada contiene esa frase; valida generación/sesión y descarta etapas antiguas.
- No añade llamadas de IA ni servicios; conserva compatibilidad para snapshots sin cue y respeta los filtros existentes.
- Es sincronización aproximada por frase, no alineación temporal exacta con el audio. Falta QA real y ejecución de tests/build.


## 2026-11-08 — clase Orby: revelado progresivo de etapas
- La hoja digital ahora revela bloques y apoyos visuales con un orden progresivo y retrasos acotados, conservando el contenido acumulado.
- Cada etapa expone un índice de diagnóstico para pruebas y futuras métricas de interacción visual.
- Se añadió una prueba estática de regresión y se documentó la mutación en `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`.
- El cambio mejora el ritmo visual del contenido recibido; no sustituye la generación de dibujos ni garantiza alineación exacta con el audio.
- Pendiente de CI completa y QA en navegador. Sin nuevas dependencias, consumo de IA, proveedores de pago, cambios a `main` o despliegues.


## 2026-11-08 — pizarra exclusiva de Orby
- Se eliminó la capa interactiva de tinta del estudiante y sus herramientas de lápiz, resaltador, borrador, deshacer y rehacer.
- Se retiró la persistencia local de anotaciones personales de la clase y el resumen de esa tinta en apuntes; se mantienen los apuntes del contenido didáctico generado por Orby.
- La pizarra ahora usa una superficie blanca lisa, sin cuadrícula ni tarjetas visuales decorativas.
- Se muestra una banda informativa con las capacidades del profesor: dibujar, señalar y borrar. No son controles interactivos del alumno.
- Se conservan los trazos SVG y la punta de lápiz animada generados por Orby.
- La banda de herramientas es visual; el puntero independiente y el borrado controlado por eventos de Orby quedan pendientes. CI y QA de navegador aún requeridos.
- Cambios en `feat/founder-intro`; sin dependencias nuevas, sin APIs de pago, sin cambios a `main` ni despliegues.
- Especificación detallada: `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`.


## 2026-11-07 — clase manuscrita y puntero de profesor
- Se retiró la banda ficticia de herramientas; el estudiante no recibe controles de escritura.
- Se reforzó el puntero de lápiz que recorre cada trazo SVG de Orby, con etapas manuscritas progresivas.
- La pizarra gana superficie amplia, lisa y texto complementario con tipografía manuscrita.
- Gemini Live recibe instrucciones para construir cada explicación en snapshots acumulativos: contorno, estructuras, flechas y etiquetas, priorizando sketch sobre tarjetas.
- Se actualizan pruebas y la mutación queda documentada en `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`.
- Pendiente de CI y QA real; sin servicios ni APIs de pago y sin tocar `main`.


## 2026-11-08 — contrato único de dibujo progresivo
- Se unificó en 2–5 el máximo de trazos nuevos por snapshot en el schema de Live y el prompt de sesión.
- Orby recibe una instrucción más clara de conservar IDs y añadir solo el siguiente paso, evitando redibujar elementos ya presentes.
- Se refuerza la secuenciación visual para evitar ráfagas simultáneas.
- Se agregaron pruebas estáticas de consistencia entre schema y prompt.
- Se documentó el plan inmediato: validar CI completa, QA de cuatro snapshots, cursor que desaparece al terminar, señalamiento contextual y rendimiento.
- Pendiente de CI/QA visual; sin consumo adicional de IA, proveedores de pago, cambios a `main` ni despliegues.


## 2026-11-08 — consistencia del dibujo progresivo y limpieza ESLint
- Schema y prompt de Live alineados a 2–5 trazos nuevos por snapshot; se refuerza conservar IDs y no redibujar tinta existente.
- Se ajustaron regresiones estáticas obsoletas. En CI, 190 pruebas y TypeScript pasaron; ESLint detectó dos constantes no utilizadas.
- Se retiraron `showVoiceTranscript` y `voiceBoardActive` sin alterar la lógica de clase. Pendiente nueva CI y build.
- QA manual de voz/pizarra/PDF continúa pendiente. Sin dependencias o APIs de pago; no se toca `main` ni producción.
- Detalle: `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`.


## 2026-11-08 — evolución del workspace Orby con herramientas de estudio
- Se documentó la transformación del workspace Orby existente: conservar navbar PeakScore, identidad oscura y chat central; convertir la columna izquierda en navegación funcional para Flashcards, Anotaciones, Grabaciones, Resúmenes, Cuestionarios, Material de estudio e Historial.
- El modo Live Tutor conserva un tablero docente blanco/liso independiente, con dibujo progresivo, voz y subtítulos; las anotaciones del estudiante viven en un editor personal separado y no reactivan herramientas de escritura sobre la pizarra del profesor.
- Se aplaza el Atlas de anatomía humana 3D y cualquier recurso que requiera Blender/render pesado por limitación del PC actual. Se mantienen esquemas ligeros 2D ya existentes.
- Se revisaron `app/orby/page.tsx`, `components/aprender/OrbyWorkspacePage.tsx` y la estructura de `LessonAITutor.tsx`; se confirma el shell workspace actual y la necesidad de auditar funcionalidades existentes antes de duplicarlas.
- Esta entrada es documentación/plan de implementación; no afirma que las herramientas laterales estén construidas. Sin cambios de código funcional, base de datos, proveedores, dependencias, `main` o despliegue.


## 2026-11-08 — primer rediseño real del workspace Orby: herramientas a la izquierda y tema claro
- El usuario aclaró que quiere transformar la interfaz actual, no crear una página separada: chats e instrumentos de estudio en la columna izquierda y toda la experiencia en modo claro.
- Se actualizó `LessonAITutor.tsx`: navegación lateral clara con Chat con Orby, Anotaciones, Temas guardados, Progreso, Biblioteca e Historial buscable; cabecera, compositor y footer claros.
- Se cambió el fondo exterior de `OrbyWorkspacePage.tsx` a claro.
- Las herramientas nuevas que todavía no tienen flujo funcional no se marcan como completadas. Falta terminar el tema claro de todas las vistas, QA de navegador y la implementación de Flashcards/Grabaciones/Resúmenes/Cuestionarios.
- Commits en `feat/founder-intro`; sin cambios a `main`, Supabase remoto o despliegue. CI/Vercel pendiente.


## 2026-11-08 — OmegaX English Studio
- Added English Studio to the OmegaX workspace: 60-second speaking prompts, guided pronunciation repetition and level-aware real-life roleplays.
- Audio capture is permission-based, capped at 60 seconds/8 MB, and transcribed only on explicit request through the existing Cloudflare Workers AI free-only endpoint.
- Students may send the transcript to the existing OmegaX chat for grammar/vocabulary/clarity feedback or save only the transcript to their learning library.
- Pronunciation comparison is explicitly approximate ASR word matching, not phoneme/accent/intonation scoring.
- Added static regression coverage and updated continuity docs. Tests, TypeScript, ESLint, production build and real microphone QA are not certified; Vercel reports build-rate-limit.

## 2026-11-08 — live captions contrast
- Fixed the live karaoke subtitle palette for the light teaching stage: regular words now use slate-800; the active word uses orange-950 on orange-100 with orange underline.
- Added a static regression to prevent low-contrast slate-100 subtitle spans from returning.
- Browser visual verification and test execution remain pending.

## 2026-11-08 — live subtitle and selected-assistant identity fixes
- Improved word-level karaoke subtitle contrast on the light live stage.
- Replaced two remaining user-facing hardcoded Orby strings in the general workspace with the selected assistant label, preserving Orby when that tutor is active.
- Added regression assertions. Static inventory: 238 named tests, 0 duplicate titles; this is not a test execution result.
- CI remains unavailable for this HEAD: Vercel reports build-rate-limit; no associated GitHub Actions workflow run was returned.

## 2026-11-08 — prevent overlapping incremental teaching blocks
- `applyOrbyBoardAction(append-block)` now rejects new text stages whose rectangles intersect existing text or visual layout elements; edge-touching without overlap remains valid.
- Live tool rejection feedback now distinguishes spatial/limit conflicts from missing IDs.
- Added regression coverage for intersection rejection, adjacent edge acceptance and the explanatory Live error.
- Scope is limited to new incremental append actions; saved historical snapshots and the v2 layout sanitizer are not retroactively tightened.
- Tests, TypeScript, ESLint, build and browser QA remain unexecuted.

## 2026-11-08 — CI verde del tutor y la pizarra
- Cerrado el solapamiento espacial de `append-block` y actualizado el feedback de rechazo de herramientas Live.
- Alineadas regresiones con identidad dinámica OmegaX/Orby y validación del desbloqueo de AudioContext de la sesión Live.
- Restauradas reglas Live de desambiguación por contexto y voz compartida femenina/natural con pronunciación colombiana ligera.
- Reparado el cierre del template literal CSS de `LessonAITutor.tsx`, que hacía que el CSS del workspace claro quedara fuera de `<style jsx global>`.
- GitHub Actions 42519075898: 239/239 tests, TypeScript, ESLint, dependency audit y `next build` aprobados.
- La validación automatizada no sustituye pruebas de micrófono físico, Gemini Live real ni QA visual manual.

## 2026-11-08 — English Studio roleplay por voz
- El CTA de roleplay inicia/reutiliza la clase Live de OmegaX y abre el escenario como primer turno; la sesión general se renueva si hace falta para aplicar instrucciones de idioma específicas.
- Añadido `englishPracticeMode` con validación en servidor limitada a OmegaX. Orby mantiene su política exclusivamente en español.
- Los diálogos de roleplay permiten inglés natural y correcciones breves en español colombiano. El fallback gratuito por turnos conserva el mismo modo.
- Los filtros de seguridad permanecen activos; solo se permite la respuesta predominantemente inglesa en la sesión explícita de English Studio.
- CI run 42519666204: 240/240 tests, TypeScript, ESLint, audit y production build aprobados. QA real de micrófono/voz y cuotas sigue pendiente.

## 2026-11-08 — sincronización karaoke de subtítulos
- El resaltado Live usa ponderación estimada por longitud/grupos vocálicos y pausas de puntuación, en vez de repartir el audio por igual entre las palabras.
- Se conserva el reloj de Web Audio y el avance monotónico durante transcripción incremental; no se añaden timers ni llamadas de modelo.
- La ponderación es aproximada, no alineación fonética.
- CI run 42520586985: 240/240 tests, TypeScript, ESLint, dependency audit y `next build` aprobados.

## 2026-11-08 — progressive SVG board stage timing
- Fixed a visual timing defect: CSS animation-delay on SVG wrapper groups does not cascade to child paths/lines. Several strokes could finish while their spatial stage was still hidden by its entry animation.
- Added `getOrbyBoardProgressiveDelay` and propagated the spatial `startDelayMs` into diagram, graph, vector, molecule, circuit, cell, DNA and physiology-process visuals.
- Actual SVG paths/lines now receive the stage offset plus per-item stagger. Removed redundant nested appear animations for diagram nodes and graph points.
- Preserved the freehand Sketch SMIL queue and pause/resume behavior.
- CI run 42521925925: 241/241 tests, TypeScript, ESLint, dependency audit and Next.js production build passed. Manual Chrome/Live voice synchronization QA remains pending.

## 2026-11-08 — perfil de movimiento natural para la escritura de OmegaX
- Se añadió `getOrbySketchMotionProfile(points)` en `lib/ai/orby-board.ts`: calcula un perfil temporal suave y adapta ligeramente la distribución del movimiento según los cambios de dirección del trazo.
- `components/aprender/OrbyBoard.tsx` aplica el mismo perfil spline al recorrido de la punta del lápiz y al revelado de la tinta, para mantenerlos sincronizados. Se conserva la cola serial, pausa/reanudación del reloj SVG, duración geométrica y staging acumulativo.
- Se añadió una regresión estática/funcional que compara trazos rectos y curvos y verifica que tinta y lápiz compartan la curva.
- Commits: `3be12f3` (helper), `e6f869c` (renderer), `8c7d72c` (prueba).
- Estado de validación: los commits están en `feat/founder-intro`; no se ha ejecutado localmente el test runner, TypeScript, ESLint ni build para esta tanda. No atribuirle la validación CI de commits anteriores. La comprobación visual con voz Live real en Chrome sigue pendiente.
- No se modificó transporte de voz, cuotas, proveedor IA, pizarra espacial, `main`, despliegue ni Supabase remoto.


## 2026-11-08 — handwriting accessibility and stepwise derivations
- Added a shared spline motion profile for the ink reveal and moving pen, so both tracks follow the same path timing.
- Added a static final-state mode for `prefers-reduced-motion`: all marks/labels stay visible, SMIL and entrance animation are disabled, and the moving pen/focus animation is hidden.
- Strengthened Live teacher instructions so maths/physics/chemistry derivations are written one transformation per incremental block, with aligned equality signs, explanations and unit checks.
- Added regression assertions for the accessibility and teaching prompt. The test suite, TypeScript, ESLint and production build have **not** been run for this HEAD.
- Corrected stale tutor specification text: current karaoke is a weighted playback-clock estimate, not exact word-level alignment.
- Commits: `777b66a`, `e9174ae`, `d501f01`, `7e77325`. Manual Chrome/microphone/OS reduced-motion QA remains pending. No paid providers, migrations, production deployment or main-branch changes.

- **SMIL fix:** corrected an invalid multi-keyframe spline on a two-endpoint stroke. Ink now uses one `0;1` interval and pen motion explicitly uses `keyPoints="0;1"`; regression asserts one valid spline interval and a curvature-sensitive curve. Commits: `3c18f41`, `f18ade7`, `d7cb8da`. Still not run on this HEAD.


## 2026-11-08 — derivaciones matemáticas consistentes en Live y fallback
- Extendida la directiva de Live para que Matemáticas, Física y Química presenten una transformación por etapa incremental.
- El endpoint de respaldo `/api/lesson-tutor` aplica ahora la misma regla en los prompts académico, voz y seguimientos: bloques `formula`/`step` independientes, pasos acumulativos, símbolos/unidades explicados y verificación antes del resultado final.
- Se corrigió la prueba de spline para comprobar el intervalo SMIL de dos extremos `0;1` y los mismos parámetros en tinta y `animateMotion`; se añadieron pruebas del fallback y de preguntas de seguimiento.
- Recuento estático del archivo de regresiones: 245 pruebas con nombre, sin nombres duplicados. **No ejecutadas** para este HEAD.
- Commits: `4b5254a`, `156159a`, `056d33a`, `480164b`, `da3a3a8`.
- La rama continúa divergente de `main`; no se hizo merge/rebase. Vercel devuelve `build-rate-limit`; no equivale a un resultado de build. Sin proveedores pagados ni despliegue.

- Fórmulas de pizarra Live y fallback restringidas a notación matemática legible en texto plano; no usar comandos LaTeX, HTML ni Markdown complejo en bloques `formula`/`step`. Regresiones de contrato añadidas. Commits: `36a3587`, `4f34a50`, `9625453`.


## 2026-11-08 — señalamiento puntual de la tinta del profesor
- La operación de profesor `focus` acepta un `pointIndex` opcional al señalar un `strokeId`. El índice es base cero y debe existir dentro de la geometría actual; sin índice apunta al centro del trazo. No se aceptan índices con `elementId` ni coordenadas libres.
- El renderer dibuja un marcador puntual (anillo, punto, línea guía y etiqueta) sobre el punto elegido; no crea, borra ni modifica trazos. La preferencia de movimiento reducido conserva un marcador estático.
- Gemini Live recibe el nuevo contrato y el cliente explica específicamente un índice inválido. Se añadieron pruebas de límites, existencia real del punto y conservación de la tinta.
- Estado: código y pruebas añadidas en `feat/founder-intro`; tests, TypeScript, ESLint, build y QA de navegador todavía no ejecutados para este HEAD.

- Inventario estático tras la mutación: **246 pruebas con nombre, sin duplicados**; no se ejecutaron.


## 2026-11-08 — clear-focus: retirar el resaltado sin tocar el contenido
- Nueva operación `clear-focus` para finalizar un señalamiento docente. A diferencia de `erase`, elimina solamente el estado temporal de atención (`teacherFocus`).
- Mantiene intactos bloques, visuales, trazos, puntos, IDs, posiciones espaciales y secuencias.
- Gemini Live conoce el comando y debe usarlo al terminar de explicar el detalle o cambiar de zona. Nunca debe borrar tinta para quitar un halo.
- El cliente confirma: «Señalador retirado. Todo el contenido y la tinta permanecen intactos».
- Prueba específica añadida para conservar todo el tablero y rechazar payloads con targets adicionales. Inventario estático: 247 tests nombrados, sin duplicados; no ejecutados.
- Validación completa y QA Chrome siguen pendientes; Vercel sigue reportando `build-rate-limit`.

- Sincronización final de prompt/schema y aserción: `1b88395` (Live) y `3e7d2f3 (test).
- Inventario estático actualizado: 247 pruebas nombradas, no ejecutadas.


## 2026-11-08 — señalador interno para diagramas y piezas anatómicas/científicas
- `focus` ahora admite `targetId` para seleccionar un subelemento estable dentro de un `elementId` visual: nodos de diagramas, átomos, orgánulos dibujados, componentes de circuitos y estructuras de sistemas anatómicos.
- El validador comprueba que `elementId` apunte a un visual, que el tipo esté soportado y que el `targetId` exista en ese visual exacto. No permite IDs inventados, IDs de otro visual, targets en bloques de texto ni mezclar `targetId` con `strokeId`/`pointIndex`.
- El renderer usa un marcador puntual reutilizable (anillo, punto, guía y rótulo) en la geometría SVG existente. No cambia datos ni redibuja el visual.
- Se excluyen intencionalmente flechas/conexiones, enlaces de moléculas, cables, puntos de gráficas/vectores, partes neuronales y membrana/pared celular: en el estado actual no tienen un subelemento posicionado con ID estable en el renderer.
- Nuevas pruebas cubren los cinco tipos compatibles y los casos no soportados/ambiguos. Inventario estático: 249 tests nombrados, sin duplicados; no ejecutados.
- QA completo (suite, TypeScript, ESLint, build y Chrome/Gemini Live) sigue pendiente.

- Aserción de renderer ampliada para comprobar también `currentId={component.id}` del circuito. Inventario: 249 pruebas nombradas, 0 duplicados; sin ejecución local/CI confirmada.
## 2026-11-08 — retos y frases modelo adaptados al nivel CEFR
- Los 60-second speaking challenges ahora cambian de tema según A1, A2, B1, B2, C1 o C2; ya no comparten un único banco genérico de temas.
- Las frases del ejercicio de repetición también se adaptan al nivel, y la voz de referencia lee la frase seleccionada.
- Al cambiar de nivel se reinician los índices de actividad y el selector se bloquea durante grabación, transcripción o audio pendiente para no asociar una práctica con el nivel equivocado.
- Añadida regresión estática del comportamiento. Inventario: 253 tests nombrados, sin duplicados; no ejecutados.

## 2026-11-08 — perfiles pedagógicos compartidos también en fallback
- El tutor por turnos reutiliza `buildIcfesPedagogyInstruction` y `normalizeIcfesSubject` de `lib/ai/orby-scope.ts`, alineando sus directivas con los perfiles que ya consume Live.
- Se evita mantener un segundo mapa de pedagogía por área. Orby obtiene el perfil de Ciencias Naturales; OmegaX usa el área seleccionada/inferida dentro de las cinco pruebas.
- Regresión actualizada para verificar el contrato compartido. Inventario estático: 253 tests nombrados, 0 duplicados; no ejecutados.
## 2026-11-08 — English Studio incorpora Listening, Reading y Writing A1–C2
- Se agregaron bancos de dos actividades originales por nivel para Listening (guion, audio TTS, pregunta, pista y evidencia), Reading (pasaje, pregunta y evidencia) y Writing (consigna, extensión orientativa y checklist).
- Se agregaron controles dedicados: reproducir audio, revelar transcripción, cambiar ejercicio, escribir respuesta, contar palabras, pedir feedback y guardar.
- OmegaX ahora recibe feedback diferenciado para comprensión auditiva, lectura basada en evidencia y producción escrita; acepta paráfrasis válidas y prioriza hasta dos mejoras.
- Los textos de listening/reading/writing se guardan como notas; las grabaciones/transcripciones de speaking/pronunciation siguen en grabaciones.
- TTS es voz del navegador, no grabación nativa ni evaluación de acento. No se añadió proveedor ni coste externo.
- Inventario estático: 255 tests nombrados y sin duplicados; no ejecutados. Validación completa pendiente.

- Robustez adicional: se evita perder respuestas de texto sin guardar al cambiar nivel y se impide que la tarjeta activa reinicie accidentalmente la actividad. El TTS se detiene al cambiar de nivel.
## 2026-11-08 — memoria de aprendizaje segmentada por destreza
- English Studio propaga el modo de práctica al tutor y conserva ese metadato aunque el mensaje pase por la cola de envío.
- Las señales se etiquetan como `English Studio · Speaking/Pronunciation/Listening/Reading/Writing · ...` dentro de la tabla ya existente de señales; `subject` es Inglés.
- El tutor recupera observaciones solo de la destreza actual y del usuario autenticado, para que el siguiente feedback pueda adaptar la práctica sin mezclar habilidades.
- El límite de mensaje se amplía a 7.000 caracteres solo en feedback con una skill válida, evitando truncar lectura/escritura; el límite normal no cambia.
- El panel Progreso ahora separa las cinco destrezas, con recuentos y señales observadas; no representa certificación ni porcentaje de dominio.
- Umbral conservado: no persistir señales sin concepto, estado permitido y confianza >= 0.8.
- Supabase verificado: tabla existente, RLS habilitado, 0 filas y 0 políticas registradas. El acceso sigue server-side con filtro por user_id; no se cambió esquema ni se agregó migración.
- Los roleplays Live sin solicitud explícita de feedback todavía no escriben señales automáticamente. Pruebas añadidas; ejecución completa y build pendientes por build-rate-limit.

- Se aisló la memoria personal de señales frente a la recuperación del Lab: el modo de English Studio por sí solo consulta solo señales del alumno por destreza y no fuerza búsquedas vectoriales/graph del Lab. Las búsquedas académicas usan su detector habitual.
- Inventario estático al cierre de esta tanda: 257 tests nombrados, cero duplicados; no ejecutados.

- El feedback con skill válida utiliza el prompt pedagógico completo para recibir la memoria previa y las rúbricas específicas, sin obligar a buscar documentos vectoriales.

- El panel de progreso refresca las señales después del feedback de una habilidad, sin generar otra llamada de IA. Si la lectura falla, la respuesta se conserva y aparece un aviso no bloqueante.


## Backlog reservado — evolución del perfil adaptativo de OmegaX (pendiente)
- Cerrar regresiones del build, ejecutar tests/TypeScript/ESLint/build y QA Chrome; Preview READY del HEAD antes de compartir una URL como actualizada.
- Agregar memoria longitudinal deduplicada por usuario/materia/destreza/concepto, tendencias con evidencia y detección de patrones repetidos sin diagnosticar por un error aislado.
- Medir respuesta a estrategias de enseñanza con cautela, introducir revisión espaciada y recomendar la siguiente actividad explicando la evidencia que la motiva.
- Integrar señales de roleplays Live al finalizar turnos completos, con idempotencia y límites honestos sobre pronunciación acústica.
- Conectar las cinco habilidades de inglés con pizarra progresiva y después extender la memoria/recomendación a las cinco materias de Saber 11.
- Añadir controles de transparencia, pausa, consulta y borrado de la memoria personal; revisar RLS antes de cualquier acceso nuevo.
- Presupuesto obligatorio: servicios gratuitos reales dentro de cuota, sin APIs/modelos pagos, créditos facturados ni fallback silencioso.


## 2026-11-08 — diagnóstico preciso de preview/build (corrección de estado anterior)
- El último build ejecutado para el commit `a53918ddae0bf5b6b30802154f796c9f7727498f` no falló por `build-rate-limit`: Vercel ejecutó `npm run build` y terminó con 1 por una aserción obsoleta del selector de nivel en `tests/orby-request-filter.test.mjs`.
- Se corrigió esa aserción en `b01c3e4f56169679e5a7f39652165ac9f920f759` para exigir el guard que protege respuestas de texto sin guardar.
- No hay aún un deployment Preview para el HEAD actual. La creación manual fue rechazada por Vercel HTTP 402, recurso `api-deployments-free-per-day`, límite de más de 100 deployments API gratuitos diarios, reintento tras 24 h. No se desplegó producción.
- Preview READY anterior (HTTP 200), commit `3be12f33d4b2dc7d3fa527aad6b080e5de271cda`: https://peak-score-5daaqgf8a-peak-score.vercel.app. Es solo una muestra desactualizada; no incluye Listening/Reading/Writing ni memoria de aprendizaje por destreza.
- Inventario estático: 257 tests nombrados, cero duplicados. Suite, TypeScript, ESLint y build del HEAD actual siguen sin certificarse.


## 2026-11-08 — English Studio: claridad del CTA de roleplay
- Se añadió una explicación breve junto al CTA: OmegaX inicia la llamada al comenzar y envía el escenario como primer turno.
- Se conserva el callback existente `onStartRoleplay` y la sesión bilingüe limitada a OmegaX; no se amplían filtros ni permisos de idioma.
- Motivo: el test `English Studio inicia una sesión bilingüe acotada a OmegaX y conserva los filtros de seguridad` esperaba la frase de inicio en el componente, pero la UI solo mostraba el CTA. Resultado local aportado: 261/262; la suite aún debe repetirse tras este ajuste.


## 2026-11-09 — OmegaX: primer pulido de la sala de clase
- Se reemplazó el estado vacío genérico de la pizarra por una presentación de clase con presencia visual de OmegaX, señal de micrófono activo y mensaje manos libres.
- El texto distingue Live (hablar naturalmente; micrófono activo hasta silenciar o salir) del respaldo por turnos (grabación por intervención). No se oculta la limitación del fallback.
- Se ajustó la cabecera para mostrar identidad de profesor y estado real de la sesión.
- Próxima fase: rediseñar la sala completa, comprobar voz/interrupción en Chrome y sincronía pizarra-audio. Sin merge, despliegue, migraciones ni servicios de pago.


## 2026-11-08 — especificación de rediseño OmegaX Live
- Se documentó la dirección visual basada en las referencias Studley/Studdy: workspace limpio y editorial, navegación compacta, pizarra amplia y clase centrada en el contenido; sin copiar sus marcas ni usar emojis decorativos.
- Se fijó el contrato de manos libres: el micrófono queda abierto al conectar; el control es mute/unmute, no push-to-talk; barge-in detiene voz y dibujo; la llamada se cierra explícitamente.
- Se auditó el HEAD de feat/founder-intro: ya existen captura continua, mute, interrupción, estados Live y fallback, pizarra SVG y secuencias tipadas. No duplicar estos motores; verificar primero que el usuario prueba el HEAD correcto.
- Se registraron QA y prioridades: conexión/eco/mute/barge-in, diseño del workspace y escenario Live, sincronización voz-pizarra, regresiones automatizadas y validación local completa.
- Sin cambios a main, despliegue, migraciones remotas, servicios de pago ni modificación de filtros.


## 2026-11-08 — primer rediseño implementado de OmegaX
- Pantalla inicial renovada con CTA de clase Live, escritura de pregunta y tres tarjetas de acceso al estudio; sidebar reducido a 264 px.
- Escena Live refinada: encabezado discreto, estados de manos libres/mute/fallback claros, lienzo blanco más amplio y controles inferiores etiquetados (Chat, Silenciar/Activar micro, Subtítulos, Finalizar clase).
- El botón del micrófono continúa siendo mute/unmute en Gemini Live; push-to-talk solo existe en el fallback por turnos, que se identifica expresamente como no continuo.
- Se conservaron los motores existentes de Live, interrupción y OrbyBoard; no se reimplementaron ni se tocaron filtros/servidor.
- Commits: `7647753` (UI), `db59bd9` (CSS), `612361c` (label accesible de Hoja de clase).
- QA de micrófono real, tests, TypeScript, ESLint y build aún no ejecutados en esta sesión. No afirmar que la rama esté certificada ni que el Preview actual incluya estos cambios.
- Sin cambios a `main`, despliegue, Supabase remoto, migraciones, dependencias o proveedores de pago.


## 2026-11-08 — responsive Live y controles de llamada
- La hoja de pizarra se adapta a móvil (canvas 4:3, ancho 100%, sin min-width de escritorio y sin desplazamiento horizontal forzado).
- La sala Live pasa a fondo blanco continuo y sus controles adoptan ancho flexible, mínimo táctil y etiquetas en escritorio; en móvil siguen compactos.
- Se mantiene la diferencia funcional: mute/unmute en Live, grabar/detener solo en fallback por turnos y finalizar clase para cerrar.
- Se añadieron dos regresiones estáticas para canvas móvil y controles manos libres.
- Commits: `ed5e935`, `a7258e5`, `c8c2e50`, `87b5203`.
- Inspección estática en GitHub completada; falta ejecutar tests, TS, lint, build y QA de Chrome/micrófono. No declarar validación completa.
- Sin cambios a `main`, deploy, Supabase remoto, migraciones, dependencias ni proveedores de pago.


## 2026-11-08 — corrección del aviso de cuota y proveedor en fallback
- El usuario reportó la suite `npm run test:orby`: 263/264; la única falla exigía explicación explícita de la cuota y proveedor de voz en el modo por turnos.
- Se actualizó el aviso del fallback: Gemini 3.8 Flash TTS solo con acceso gratuito y autorización de privacidad confirmados; respeto de cuotas; respuesta escrita sin proveedor alternativo ni pago cuando no esté disponible.
- Se reforzó el test para verificar modelo, puerta de privacidad, cuotas y ausencia de fallback de pago.
- Commits: `69532ea` (UI/copy), `e6abcaa` (test).
- Verificación estática en GitHub: cambios presentes. Falta repetir `npm run test:orby` localmente y ejecutar typecheck/lint/build.
- No se tocó la lógica de micrófono, Live, cuota del servidor, filtros de seguridad, `main`, producción ni Supabase remoto.


## 2026-11-08 — clase Live hands-free, corrección de "hola" y pizarra estilo hoja
- Comparación de videos: nuestra clase estaba cayendo a grabación por turnos; Studdy muestra una hoja blanca continua, título marcado en amarillo, dibujo central progresivo y herramientas discretas.
- Diagnóstico Preview Vercel: `ORBY_GEMINI_LIVE_ENABLED=true` y presencia de `GEMINI_API_KEY`, pero faltan las confirmaciones `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED` y `PEAKSCORE_GEMINI_DATA_USE_APPROVED`. No se activaron: Free Tier de Google puede usar contenido para mejorar productos y requiere aprobación explícita.
- La ruta Live ahora diferencia falta de Free Tier y bloqueo de privacidad con códigos dedicados; el cliente ya no convierte un fallo de inicio en llamada por turnos, muestra estado real y permite reintentar.
- La caída de una sesión Live retorna la pregunta pendiente al chat escrito en lugar de simular push-to-talk. No se repite una pregunta ya completada al desconectar un micrófono después.
- El saludo independiente `hola` ahora puede ser una intervención/barge-in válida; frase larga repetida sigue protegida contra eco.
- Se especifica explícitamente `ActivityHandling.START_OF_ACTIVITY_INTERRUPTS`; VAD conserva la detección automática y 400 ms de silencio. El audio sigue fluyendo desde AudioWorklet mientras el micrófono está abierto; el botón de micrófono es mute/unmute.
- Pizarra: papel blanco completo sin marco, título con marcador amarillo, panel ancho y responsive; sin copiar assets/branding de Studdy.
- Investigación: Gemini 3.8 Live es compatible con voz bidireccional, herramientas y barge-in, y tiene Free Tier, pero el uso de datos Free Tier puede mejorar productos. OpenAI Realtime requiere pago; LiveKit es framework/orquestación, no una garantía de inferencia gratuita. La política pública de Studdy describe contenido de voz/pizarra que recopila, pero no revela proveedor/modelo.
- Commits de código: `597b340`, `a5e1c2a`, `ced4093`, `8d65551`, `bbe8fa8`, `69f4e29`, `6f69b35`, `fddd600`, `a7fd6cd`, `cc74e39`, `b27cb8b`, `583cbc8`, `7aa57e8`, `6f7c0ab`.
- QA pendiente: repetir test suite, TypeScript, lint, build y prueba real de micrófono/altavoces. Sin afirmación de que el audio Live ya conecte: en Preview falta la aprobación Free Tier/privacy.
- Sin cambios a `main`, despliegue, Supabase remoto, servicios de pago ni variables sensibles.


## 2026-11-08 — nota de estado de Vercel/CI
- El combined status consultado para el commit de test Live muestra Vercel failure con referencia build-rate-limit; no se obtuvo log que permita atribuirlo a un error del código.
- No hay resultado local de tests/typecheck/lint/build para el HEAD actual. La última cifra aportada por el usuario (263/264) es anterior a las correcciones recientes.
- No afirmar que Preview esté actualizado ni repetir despliegues para sortear el límite. Verificar SHA de Preview o probar localmente.
- Sin cambios a main ni producción.


## 2026-11-08 — análisis del npm run test:orby aportado por el usuario
- Resultado original del checkout del usuario: 267 tests, 261 pass, 6 fail.
- Causas concretas: 3 expectativas de voz desactualizadas respecto a recuperación escrita, 1 expectativa incorrecta para «hola de nuevo» tras audio del tutor que solo dijo «hola», 1 test de política que exigía respuesta local hablada antigua y 1 etiqueta de exportación que ya no coincidía.
- Actualizado el test para confirmar que «hola de nuevo» solo se bloquea como eco cuando OmegaX realmente lo pronunció completo; se conserva «hola» como barge-in.
- Ajustados los tests de fallback y política para validar conservación de la pregunta en chat escrito, y se restauró el botón «Exportar PDF».
- Commits: 4d1e463e29f30625d03115a259ab830d8464e809 y 38f77db3a03cb3df46534b36efc4434bef6e3059.
- Pendiente una nueva ejecución local de npm run test:orby. No está verificado 267/267; tampoco se ejecutó TypeScript/lint/build.
