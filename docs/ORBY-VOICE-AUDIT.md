# Orby VC — auditoría y bitácora

- Proyecto: PeakScore
- Rama de trabajo: `feat/founder-intro`
- Última actualización: 2026-11-06
- Alcance: auditoría de código y regresiones del chat de voz (VC).
- Producción/`main`: no modificados ni desplegados en esta ronda.
- Estado: correcciones de clasificación de errores y ciclo asíncrono Lab–VC aplicadas; CI completo aprobado para `be9e7d5`; validación manual del VC con Gemini Live real pendiente.

## Objetivo

Mantener una conversación oral continua, natural y recuperable para el tutor Saber 11. Orby debe atender saludos, preguntas, seguimientos, cambios de materia e interrupciones; conservar el texto y el historial; y consultar el contenido publicado del Orby Lab cuando aporte valor académico.

## Restricciones obligatorias

- Usar únicamente modelos y servicios que puedan operar dentro de cuotas gratuitas reales.
- No introducir APIs facturables, proveedores de pago ni fallbacks de pago silenciosos.
- Ante cuota agotada, informar con claridad y preservar el texto/contexto.
- Mantener el alcance exclusivo de las cinco áreas Saber 11.
- El material del Orby ICFES Lab fue eliminado intencionalmente: no tratarlo como una pérdida accidental ni reconstruirlo.
- Trabajar con cambios pequeños, revisables y documentados en esta rama.

## Auditoría del flujo VC

### Captura y procesamiento de voz

- El navegador captura audio del micrófono y lo envía a la sesión Gemini Live mediante AudioWorklet y audio PCM de 16 kHz.
- Se conserva transcripción de entrada y salida para mostrar el intercambio, validar la respuesta y persistir el turno.
- Se revisaron las rutas de transcripción, sesión Live, TTS de respaldo y guardado de conversaciones.
- Se verificaron controles para ecos del audio del propio tutor, interrupciones, duplicados de transcripción y conservación de mensajes largos.

### Recuperación del Orby Lab

- La herramienta `search_orby_learning_knowledge` está declarada como `Behavior.NON_BLOCKING`: la consulta se ejecuta en paralelo y no congela toda la conversación Live.
- El cliente procesa también `serverContent` cuando llega en el mismo evento que `toolCall`, para no descartar audio o transcripción.
- La búsqueda envía la pregunta contextualizada y materia solicitada a `/api/orby/knowledge-search`.
- Cada ruta de respuesta de herramienta utiliza `FunctionResponseScheduling.WHEN_IDLE`; el test actual exige cinco puntos de programación.
- La consulta pendiente se cancela si cambia la actividad del estudiante, se interrumpe la respuesta o se reemplaza la sesión. Antes de enviar resultados, se valida que sigan perteneciendo a la misma sesión y actividad.
- Los saludos, confirmaciones y seguimientos que ya se resuelven con el contexto no deben provocar búsquedas innecesarias.
- Cuando no hay material publicado útil, Orby debe continuar con conocimiento académico fiable sin inventar que consultó el Lab.

**Nota de auditoría:** una descripción anterior de este documento afirmaba que la herramienta era bloqueante. Esa afirmación quedó obsoleta tras los cambios recientes. El estado actual del código y las pruebas es no bloqueante, con entrega diferida de resultados cuando Live puede incorporarlos.

### Incorporación diferida del Lab en el mismo turno de voz

Se detectó una condición de carrera en el cliente: el modelo podía terminar su primera generación mientras la búsqueda no bloqueante seguía en curso. Cuando llegaba el resultado y Gemini programaba su respuesta con `WHEN_IDLE`, el cliente ya podía haber marcado el turno como finalizado e ignorar la transcripción y el audio posteriores.

Corrección aplicada:

- Se agregó `lib/ai/orby-voice-tool-turn.ts`, una máquina de estados pura que distingue la primera generación, el envío de la respuesta de herramienta y la transcripción del seguimiento.
- La primera finalización de Live queda provisional cuando existe una búsqueda pendiente. El turno del estudiante permanece abierto y el watchdog sigue activo.
- El resultado se envía con `FunctionResponseScheduling.WHEN_IDLE`. El turno solo se finaliza cuando llega la transcripción del seguimiento posterior al resultado.
- Se cubren ambos órdenes: el resultado del Lab puede llegar antes o después de la primera finalización de Live; una transcripción anterior al resultado no cuenta como seguimiento.
- Se cubrió además una carrera de llamadas encadenadas: Live puede emitir la transcripción del primer aporte y una nueva llamada a la herramienta en el mismo evento WebSocket. El cliente marca primero esa transcripción y luego abre la fase nueva, evitando que ambas búsquedas compartan el mismo cierre de turno.
- El prompt indica a Orby que complemente lo ya explicado con hallazgos útiles, sin repetir la respuesta completa; si la búsqueda no aporta nada, debe indicarlo brevemente y cerrar el turno.
- Si Gemini cancela la llamada o la conexión se renueva mientras el resultado sigue pendiente, se invalida el trabajo antiguo y se conserva la pregunta para terminarla con el tutor gratuito por turnos. No se envían respuestas de herramienta con IDs de una conexión anterior.
- Si no se puede entregar la respuesta de herramienta, se activa el respaldo gratuito para recuperar la misma pregunta, en lugar de dejar el turno esperando indefinidamente.

Las pruebas nuevas cubren los dos órdenes de llegada (resultado antes/después de la primera finalización), exigen salida real del seguimiento antes de finalizar y comprueban recuperación ante cancelación/reconexión. Son pruebas de lógica e invariantes: la interacción completa debe validarse en Chrome con Gemini Live real.

La semántica coincide con la documentación oficial: `NON_BLOCKING` permite que la conversación continúe mientras se ejecuta la herramienta; `WHEN_IDLE` incorpora el resultado y solicita una generación sin interrumpir la generación activa. Referencias: [Live API — herramientas asíncronas](https://ai.google.dev/gemini-api/docs/live-api/tools) y [API — programación de respuestas de función](https://ai.google.dev/api/generate-content).

### Continuidad, interrupciones y reconexión

- El watchdog avisa a los 18 segundos y a los 50 segundos conserva una sesión Live que sigue conectada, concediendo una ventana adicional de 70 segundos antes de activar el respaldo.
- Se guarda el identificador de reanudación de la sesión y se solicita un token efímero nuevo para cada intento, porque los tokens son de un solo uso.
- La interrupción cancela búsquedas pendientes y audio antiguo para que un resultado anterior no contamine el turno nuevo.
- La desconexión física de la pista del micrófono activa el modo gratuito por turnos y conserva la pregunta pendiente; se ignoran eventos `ended` tardíos de streams reemplazados.
- Se añadió una prueba aislada del AudioWorklet para verificar remuestreo de 44.1/48 kHz a 16 kHz, paquetes PCM de 640 muestras (40 ms) y conservación del remanente entre bloques.
- El fallback conserva la pregunta y el contexto cuando la conexión no puede continuar.
- La lógica está cubierta parcialmente por pruebas estáticas; las reconexiones reales y las interrupciones acústicas aún requieren pruebas en Chrome.

### Cuotas gratuitas y errores 429

Se detectó que el handler de errores de Gemini Live marcaba cualquier HTTP 429 como cuota gratuita agotada. Ese criterio era incorrecto: 429 también puede significar limitación temporal de frecuencia.

Corrección aplicada en esta ronda:

- Se creó `classifyGeminiProviderFailure` en `lib/ai/orby-tts-errors.ts`, compartido por Live y TTS.
- La clasificación distingue `quota_exhausted`, `rate_limited` y `provider_error`.
- Un 429 aislado o un mensaje como `Too many requests` se trata como limitación temporal, no como cuota consumida.
- Códigos explícitos como `RESOURCE_EXHAUSTED`/`QUOTA_EXCEEDED` o mensajes verificables de cuota agotada se clasifican como agotamiento.
- El flujo Live presenta mensajes distintos y utiliza el respaldo gratuito ante un rate limit temporal, sin afirmar que se agotó la cuota.
- La ruta TTS conserva su compatibilidad mediante `classifyGeminiTtsFailure`, que delega en el clasificador común.
- No se agregó ningún proveedor ni servicio de pago.

## Cambios relevantes ya presentes en la rama antes de esta ronda

- Respuestas deterministas de política pueden solicitar voz nativa a la sesión Live; no llaman a TTS para cada rechazo.
- La respuesta hablada de política se valida contra el texto autorizado antes de liberar audio.
- La cuota TTS agotada se recuerda durante la sesión del navegador para no repetir llamadas que ya fallarán.
- El audio WAV válido se conserva completo; solo se envuelve PCM cuando el formato declara que no tiene cabecera WAV.
- Las respuestas largas se dividen en fragmentos conservando orden y contenido.
- Los mensajes de voz se guardan con una ruta de persistencia que evita duplicar el mismo turno en reintentos.

## Pruebas y CI

Última ejecución completa:
- Workflow: [PeakScore checks #1845](https://github.com/PeakScore777/PeakScore/actions/runs/42309990796)
- Commit: `be9e7d569a8a8154dc4c1724096363a4ed9800a0`
- Resultado: `success`.
- Job: `Orby tests, TypeScript, ESLint and production build` — completado correctamente.
- Pasos aprobados: auditoría de dependencias, pruebas de regresión Orby, TypeScript, ESLint, build de producción Next.js, validación/actualización de dependencias y artefactos de lockfile.

El job completo terminó en `success`: auditoría de dependencias, pruebas de regresión Orby, TypeScript, ESLint y build de producción Next.js. Las pruebas de `tests/orby-request-filter.test.mjs` inspeccionan funciones puras e invariantes del código fuente. No simulan el proveedor Gemini Live ni sustituyen una prueba real de micrófono/WebSocket. Por eso, CI verde permite actualizar la rama local, pero no declarar aprobado el comportamiento acústico real.

## Nueva revisión de captura de audio

Se revisó el procesador `public/audio/orby-audio-capture.worklet.js`: el remuestreo lineal mantiene el cursor entre bloques, y el envío agrupa PCM mono de 16 kHz en paquetes de 40 ms. La prueba nueva ejecuta el worklet con un mock del entorno AudioWorklet y comprueba el conteo de muestras en 44.1 y 48 kHz; no reemplaza una medición de audio real ni prueba todos los dispositivos.

También se detectó que `track.onended` solo mostraba un aviso aunque el micrófono físico se hubiera desconectado, dejando el modo Live aparentemente activo sin entrada. Ahora se conmuta al respaldo por turnos, conservando el texto pendiente y evitando que un evento tardío de un stream anterior cierre una sesión nueva.

## Validación manual pendiente

- [ ] Conversación larga en Chrome: varios intercambios sin detener ni reiniciar el chat.
- [ ] Seguimientos cortos: «sí», «no», «¿por qué?» y «pon otro ejemplo».
- [ ] Cambio entre las cinco áreas sin heredar indebidamente la materia anterior.
- [ ] Interrumpir a Orby mientras habla y comprobar que escucha el nuevo turno.
- [ ] Confirmar que el eco del parlante no se convierte en una pregunta nueva.
- [ ] Pregunta académica nueva: comprobar consulta selectiva del Lab y pertinencia de los fragmentos recuperados.
- [ ] Confirmar que una consulta del Lab no bloquea el audio y que el resultado se incorpora sin perder la respuesta.
- [ ] Confirmar que el segundo aporte de `WHEN_IDLE` se escucha y se añade sin repetir la primera explicación.
- [ ] Cierre, `goAway` y reconexión: conservar sesión, contexto e historial sin duplicados.
- [ ] Simular/observar rate limit y cuota agotada por separado; los mensajes deben ser distintos.
- [ ] Confirmar que ningún error activa un proveedor facturable.

## Criterios de aceptación

1. Orby sostiene una conversación de varios turnos y no se limita a un único mensaje.
2. No descarta mensajes largos, seguimientos ni cambios de materia.
3. Las interrupciones cancelan únicamente la respuesta anterior y preservan el turno nuevo.
4. La búsqueda del Lab es selectiva, contextual y no contamina turnos posteriores.
5. La voz Live es prioritaria; cualquier respaldo se mantiene dentro del presupuesto gratuito permitido.
6. Rate limit temporal y cuota agotada no se confunden.
7. El historial persiste sin duplicar turnos.
8. La rama pasa CI completo y las pruebas manuales anteriores antes de solicitar Pull/Merge.

## Seguridad y alcance

Los fragmentos recuperados del Lab son datos de referencia, nunca instrucciones capaces de modificar rol, alcance o políticas del tutor. No se deben enseñar programación ni promocionar otros preICFES. No se modifican secretos, permisos de cuentas, configuración de facturación ni producción durante esta auditoría.


## Incidencia nueva: interrupción durante la respuesta y latencia percibida

En la revisión del video del 6 de noviembre se identificó un caso concreto de cruce de turnos: si el estudiante interrumpe el audio de Live y el primer evento reconocible es la transcripción final (sin una transcripción intermedia fuerte), el manejador cancelaba la respuesta anterior pero conservaba `voiceUserTextRef`. El siguiente texto final podía fusionarse con la pregunta anterior. Ahora la interrupción limpia también el texto del estudiante; el flujo que recibe la transcripción nueva la asigna después como un turno independiente. La respuesta parcial anterior se elimina cuando corresponde y los identificadores del nuevo turno no reutilizan los del anterior.

La latencia no se debe declarar resuelta por este cambio. El flujo actual espera la generación de Live y valida una frase completa antes de liberar audio, mientras que el chat por turnos espera retrieval académico y generación antes de mostrar la respuesta. Se conserva esa validación de seguridad; no se reduce a ciegas ni se habilitan proveedores facturables. La siguiente medición debe separar tiempo de cierre de voz, primer texto, primer audio y final de respuesta en Chrome real.

**Prueba añadida:** regresión estática que exige limpiar el texto anterior al interrumpir y verifica que el transcript final nuevo se fusiona después de esa limpieza. No sustituye una prueba acústica en navegador.


### Ajuste de latencia de voz (VAD)

Se configuró el endpointing automático de Gemini Live de forma explícita tanto en el cliente como en las restricciones del token efímero: sensibilidad alta para detectar el final de voz, 40 ms de prefijo y 500 ms de silencio. El valor busca reducir la espera predeterminada sin usar un umbral extremo que corte pausas normales. El SDK documenta que `silenceDurationMs` controla cuánto silencio se espera para cerrar el turno y que valores mayores aumentan la latencia; la guía recomienda 500–800 ms como equilibrio. Referencias: https://googleapis.github.io/js-genai/release_docs/interfaces/types.AutomaticActivityDetection.html y https://ai.google.dev/gemini-api/docs/live-api/capabilities.

**Límite de validación:** el cambio reduce el umbral de cierre del habla; no demuestra por sí solo que la respuesta completa llegue “al toque”. Hay que medir en Chrome real la latencia desde el último audio del estudiante hasta la primera transcripción, primer audio y finalización. Si corta pausas naturales, volver a 600–700 ms.


## Recuperación de respuestas incompletas: conservar el contrato del turno

En la revisión del 6 de noviembre se encontró una inconsistencia entre la generación inicial y su reintento automático. Cuando el modelo devolvía una respuesta de baja calidad (por ejemplo, un «sí» aislado ante el nombre de un concepto), el reintento construía un prompt reducido y genérico. Eso descartaba precisamente instrucciones que podían ser decisivas: el contrato especial de voz, el historial ya filtrado, los fragmentos académicos recuperados, las reglas de idioma y el formato de salida de cada modalidad. En un turno VC podía provocar una recuperación que ya no se comportara como VC.

Corrección aplicada en `app/api/lesson-tutor/route.ts`:

- El reintento ahora reutiliza `activePromptForRetry`, es decir, el prompt exacto seleccionado para la generación original (voz, conversación breve o tutor académico con RAG).
- Añade la instrucción de recuperación y la pregunta exacta, sin sustituir las reglas originales ni eliminar la evidencia académica.
- Conserva explícitamente idioma y formato de salida de la modalidad original.
- Suma el tiempo de la segunda inferencia a `generationMs`; antes, el encabezado `Server-Timing` podía subestimar la latencia total de modelo cuando ocurría un reintento.
- Se agregó una regresión que verifica que el reintento reutilice el prompt original y contabilice su tiempo.

Este ajuste no reduce filtros ni expone borradores: el resultado recuperado sigue pasando por los mismos controles de JSON, calidad, seguridad, idioma, alcance y persistencia. Tampoco cambia proveedor, cuotas ni facturación. Pendiente: ejecutar CI completo para el nuevo commit y validar el comportamiento real en Chrome; las pruebas de código no reemplazan una sesión de voz acústica.


## Recuperación híbrida del conocimiento ante fallos parciales

En la revisión adicional del 6 de noviembre se detectó otro problema en la ruta académica compartida por chat y VC: la búsqueda vectorial del Lab y la búsqueda del grafo conceptual estaban agrupadas en un único `Promise.all`. Si cualquiera de las dos fallaba, el bloque completo saltaba al `catch` y se perdían también los resultados válidos de la otra fuente. En consecuencia, una caída parcial podía hacer que Orby respondiera como si no hubiera material recuperado, aunque una de las dos fuentes sí estuviera disponible.

Corrección aplicada en `app/api/lesson-tutor/route.ts`:

- Se sustituyó el acoplamiento de ambas búsquedas por `Promise.allSettled` y se conservan por separado los resultados exitosos.
- Los fallos del índice vectorial y del grafo conceptual se registran independientemente, sin revelar datos del estudiante.
- El enriquecimiento posterior (material relacionado y perfiles pedagógicos) queda aislado: si falla, no elimina los fragmentos vectoriales o conceptos ya recuperados.
- Se añadió una prueba de regresión que verifica el comportamiento ante fallos parciales.

No se crean ni reconstruyen materiales del Lab; se usa exclusivamente el material publicado que exista. Tampoco se cambia el proveedor de IA ni se introduce gasto. Pendiente de CI y de validación funcional con una sesión real.


## 2026-11-06 — límite de búsquedas encadenadas en Gemini Live

- Hallazgo: el flujo NON_BLOCKING/WHEN_IDLE mantenía correctamente abierto el turno mientras llegaba el suplemento del Lab, pero permitía que Live solicitara nuevas búsquedas encadenadas sin un presupuesto explícito por turno.
- Riesgo: una cadena repetitiva podía aumentar la latencia, consumir cuota gratuita de Workers AI en la ruta de conocimiento y retrasar la finalización de la respuesta.
- Cambio en `lib/ai/orby-voice-tool-turn.ts`: el estado ahora conserva `toolCallsStarted` durante las fases encadenadas y define un máximo de dos llamadas de conocimiento por turno del estudiante. El contador se reinicia al finalizar o reiniciar el turno.
- Cambio en `components/aprender/LessonAITutor.tsx`: solo inicia las búsquedas que caben en el presupuesto restante. Las llamadas adicionales reciben una respuesta estructurada indicando que debe continuar con la evidencia disponible, en vez de lanzar otra consulta.
- Pruebas: se añadió cobertura para la primera búsqueda, la búsqueda encadenada, el agotamiento del presupuesto, el reinicio del contador y la respuesta de límite desde el cliente.
- Restricción preservada: no se añade proveedor, modelo ni fallback de pago. Este límite no impide responder desde el conocimiento del tutor cuando no se consulta el Lab.
- Pendiente de validación externa: el test automatizado verifica la máquina de estados y el cableado del cliente; no sustituye una sesión real de Chrome con micrófono y audio ni demuestra por sí solo la calidad acústica de Gemini Live.


### Verificación CI del límite de búsquedas (6 de noviembre)

La primera ejecución completa del CI para el límite de dos búsquedas detectó una prueba estática demasiado rígida: esperaba cinco apariciones de la programación `WHEN_IDLE`, pero el nuevo camino de respuesta de límite añadió una sexta aparición válida. Las otras 110 pruebas pasaron. Se ajusta la expectativa estructural a seis; no se modifica el comportamiento de producción por este fallo. La siguiente ejecución debe confirmar la suite completa, TypeScript, ESLint y build.


### Cancelación aislada de búsquedas hermanas

La auditoría del lote de llamadas Live encontró que el aborto de una búsqueda ejecutaba un `return` desde el manejador completo. Si el modelo había enviado más de una llamada y solo una era cancelada, ese retorno podía descartar también las respuestas de las llamadas hermanas que seguían vigentes. Ahora se descarta únicamente el resultado abortado y se continúa procesando el lote, siempre que la sesión y la generación del turno sigan siendo actuales. Se añadió una regresión estática para este guard. Pendiente de CI y validación funcional con micrófono real.

## Video VC — regresión de alcance y respuestas repetidas (2026-11-06)

Se revisó la grabación de pantalla de 125,7 s posterior a la prueba anterior.

- Se observa que Orby sigue produciendo respuestas de alcance general ante preguntas sobre personas conocidas, fuera del objetivo de tutor ICFES.
- La conversación mantiene mensajes/respuestas previas visibles y repite contenido de tutoría/presentación; se debe revisar asociación de turnos y contexto reciente además del filtro de dominio.
- La captura de consola durante la prueba contiene advertencias/eventos repetidos de audio; no se atribuye una causa raíz sin correlacionar eventos y tiempos.
- En la UI se aprecia que el estudiante puede continuar escribiendo, pero la prueba no demuestra por sí sola que todos los turnos hayan sido recibidos por el servidor.

### Corrección implementada en esta iteración

Se encontró un error de escape en la expresión regular de consultas generales «quién es / quién fue / who is / who was»: la expresión tenía barras invertidas duplicadas en un literal RegExp, por lo que buscaba secuencias literales y no límites de palabra/espacios. Se corrigió el patrón para reconocer consultas generales de personas y se añadieron regresiones para Westcol, Michael Scott, Lionel Messi y Taylor Swift.

La regla conserva excepciones explícitas para figuras del currículo de Sociales (Simón Bolívar) y preguntas literarias sobre narrador/personaje en Lectura Crítica. Pendiente: confirmar el resultado del CI y validar el comportamiento real de Live en navegador con micrófono y audio.


### Ajuste de excepción curricular

El primer CI detectó que la pregunta aislada «¿Quién fue Simón Bolívar?» no tenía suficiente ancla curricular para distinguir una consulta biográfica general. Se amplió el marco de preguntas en español sobre figuras históricas y la regresión usa ahora «¿Quién fue Simón Bolívar en la independencia de Colombia?». Así se conserva la excepción académica explícita sin abrir consultas biográficas generales. La prueba curricular usa una formulación académica explícita («Analiza el papel de Simón Bolívar en la independencia de Colombia»), no una pregunta biográfica abierta. La prueba literaria también permanece en la suite.

## Live Lab — carrera de cancelación entre llamadas hermanas

Se detectó una carrera en `handleOrbyLiveKnowledgeTool`: los controladores se registraban dentro de un bucle secuencial, después de cada espera. Si Gemini cancelaba varias llamadas mientras la primera búsqueda seguía pendiente, las llamadas hermanas aún no registradas podían escapar de la cancelación y ejecutarse con un turno obsoleto.

Corrección aplicada:
- Registrar todos los controladores aceptados antes del primer `await fetch`.
- La cancelación por ID puede alcanzar todas las llamadas hermanas desde el inicio.
- Si la sesión/turno deja de ser vigente, limpiar y abortar los controladores restantes antes de salir.
- Conservar el comportamiento de no descartar resultados hermanos válidos cuando solo se cancela una búsqueda.

Se añadió una prueba estática que verifica el orden de registro respecto al primer `await` y la limpieza de solicitudes obsoletas. Pendiente CI y prueba acústica real en navegador.


## 2026-11-06 — revisión de las dos grabaciones y optimización de turnos

Se revisaron las grabaciones de pantalla de 80,1 s y 125,7 s. Los hallazgos reproducibles en la UI fueron:

- La transcripción abreviada «qn es Westcol» llegaba al modelo como pregunta general y producía una biografía fuera del alcance Saber 11.
- La transcripción «q y es PeakScore?» no activaba la respuesta de identidad de la plataforma. Después, «es recomendable?» permitía una respuesta promocional sobre PeakScore.
- La transcripción breve «qn soy o» recibía una respuesta de identidad personal poco clara, aunque el tutor no debe afirmar que conoce quién es el estudiante.

### Correcciones implementadas

1. lib/ai/orby-request-filter.ts: el filtro de consultas generales reconoce variantes ASR/coloquiales (qn, qien, kien, q y es, q es, además de who is/was) sin quitar la excepción para preguntas curriculares sobre narradores, conceptos o textos. La clasificación distingue la intención actual de una mención contextual.
2. lib/ai/orby-scope.ts: la detección de identidad de PeakScore/Orby incorpora variantes abreviadas para que «qn es PeakScore» y «q y es PeakScore» reciban la respuesta determinista de identidad.
3. app/api/lesson-tutor/route.ts: un seguimiento como «es recomendable?» después de una pregunta de identidad de PeakScore recibe una respuesta neutral: Orby aclara que no puede valorar independientemente su propia plataforma ni prometer resultados, y ofrece describir funciones y limitaciones. La pregunta «qn soy o» recibe una aclaración de privacidad: el tutor no puede identificar al estudiante ni presume acceso a su identidad.
4. components/aprender/LessonAITutor.tsx: la lectura TTS por fragmentos prepara como máximo un segmento por delante mientras se reproduce el actual. Mantiene el orden, el texto completo, los límites del endpoint y la cancelación del segmento anticipado al interrumpir o cerrar la lectura.
5. tests/orby-request-filter.test.mjs: se añadieron regresiones para las abreviaturas observadas, la excepción curricular, la respuesta neutral sobre la plataforma, la aclaración de identidad y la preparación/cancelación de TTS anticipado.

### Validación y límites

- La suite automatizada, TypeScript, ESLint y build deben aprobar en el workflow asociado al commit final de esta tanda antes de considerar la rama lista para Pull.
- El prefetch reduce la espera de red entre fragmentos TTS; no se presenta como una medición de latencia en Chrome ni cambia el tiempo de generación del proveedor.
- Aún se necesita una prueba manual en Chrome con micrófono real: «qn es Westcol», «q y es PeakScore», «es recomendable», «qn soy yo», una pregunta académica abreviada («q y es fotosíntesis»), una respuesta larga y una interrupción durante el TTS.
- No se modifica main, no se reconstruye el material eliminado del Lab y no se introduce un proveedor de pago.


## 2026-11-06 — endurecimiento de salida, ortografía y cuota de voz

Esta tanda amplía la revisión de las grabaciones y registra controles adicionales que no existían en la primera nota:

- La detección de consultas fuera de alcance comprende transcripciones ASR/coloquiales (`qn`, `qien`, `kien`, `q y es`, `q es` y variantes inglesas `who is/was`) sin bloquear preguntas curriculares del tipo «¿qué es fotosíntesis?» ni las preguntas sobre narrador/personajes de un texto.
- La política de salida detecta autopromoción de PeakScore/Orby y marketing genérico de herramientas de preparación. Se aplica en chat, en el cierre de Gemini Live y en el validador de frases parciales antes de permitir audio. Se conserva la recomendación académica concreta (por ejemplo, practicar preguntas Saber 11) y se reemplaza la publicidad por una aclaración neutral.
- Los prompts del tutor de voz por turnos y de Gemini Live prohíben actuar como portavoz/vendedor de PeakScore, prometer mejoras de puntaje o dar una valoración supuestamente independiente de la plataforma propia.
- Gemini Live recibe una instrucción explícita para no reiniciar una bienvenida ante un saludo breve dentro de una conversación activa y retomar el tema anterior; si no hay contexto útil, pregunta por el área Saber 11 que se desea retomar.
- `normalizeOrbySpanishOutput` amplía correcciones de tildes de vocabulario académico frecuente y añade regresiones que comprueban que la puntuación y el sentido se mantienen.
- El TTS gratuito prepara como máximo un fragmento por adelantado, pero espera a que se haya reproducido aproximadamente el 65 % del fragmento actual y omite segmentos de menos de 1,5 segundos. El temporizador se limpia al cambiar de fragmento y al terminar/cancelar la lectura. Esto reduce la espera entre clips sin anticipar llamadas desde el inicio ni permitir más de una precarga activa.

### Restricción de cuota y límite de validación

La cancelación de un `AbortSignal` en el SDK de Gemini es del lado cliente y no garantiza cancelar el trabajo ya aceptado por el servicio ni evitar su consumo de cuota. Por eso el prefetch se retrasa para reducir el intervalo en el que una interrupción podría dejar una generación especulativa sin aprovechar. La mejora es de preparación de red entre fragmentos; no se presenta como una medición de latencia de producción.

El CI debe terminar verde sobre el último commit de `feat/founder-intro` (suite Orby, TypeScript, ESLint, build y auditoría de dependencias). Antes de considerar la voz completamente validada, falta ejecutar en Chrome real los casos `qn es Westcol`, `q y es PeakScore`, `es recomendable`, `qn soy yo`, `oe` durante un hilo activo, una consulta académica abreviada, respuesta larga e interrupción durante Live/TTS. El test automatizado no simula la acústica del micrófono ni la latencia real del proveedor.


### Saludos breves en Live: resolución determinista

La voz ya no deja que «hola», «oe», «oee», «oye», etc. activen una nueva respuesta general del modelo. `LessonAITutor` reconoce esos turnos con `isOrbyGreetingRequest`, elimina el saludo recién recibido del contexto que consulta y obtiene la continuación con `getOrbyGreetingFollowUpReply` usando los últimos mensajes y la materia activa. La respuesta se envía como turno de política controlado a Gemini Live, sin búsqueda del Lab ni generación de tutoría académica adicional. Cuando no existe contexto útil, la respuesta breve pregunta cuál de las cinco áreas de Saber 11 quiere trabajar, sin repetir la presentación de Orby.

La unión del contexto usa saltos de línea reales. Se añadieron regresiones para comprobar que Live usa esta ruta determinista, retoma Matemáticas cuando corresponde y no repite la identidad de Orby al saludar.


## 2026-11-06 — protección de interrupciones Live y guardado idempotente

Se auditó el ciclo de interrupción del micrófono, generación Live y persistencia del historial. Se corrigieron dos carreras:

1. `components/aprender/LessonAITutor.tsx`: `interruptCurrentVoiceOutput` marca únicamente interrupciones de una sesión Live conectada que tenía una respuesta pendiente. Cuando llega `serverContent.interrupted` para esa generación anterior y ya existe un nuevo turno del estudiante, se conserva `waitingForVoiceReply`, se mantiene el watchdog del nuevo turno y se descartan la transcripción, el audio y el `turnComplete` tardíos de la generación interrumpida. La entrada/transcripción del estudiante se procesa antes de ese cierre; la rama de interrupción ya no retorna anticipadamente y no impide procesar eventos posteriores independientes. La marca se reinicia al detener Live y al completar un turno normal.
2. `app/api/orby/realtime-turn/route.ts`: la idempotencia solo reconoce como reintento el par usuario/asistente situado en las dos posiciones más recientes del historial, devuelto en orden descendente. Buscar cualquier par coincidente en los últimos 20 mensajes podía omitir una repetición legítima de la misma pregunta mucho después. Si falla la lectura de verificación, la ruta ahora devuelve `SAVE_TURN_IDEMPOTENCY_CHECK_FAILED` sin insertar a ciegas, para que el cliente pueda reintentar sin duplicar.

Se añadieron regresiones para: preservar el nuevo turno durante `interrupted`; descartar los restos de texto/audio y no finalizar el nuevo turno con un `turnComplete` viejo; comprobar el par más reciente; y no escribir cuando la lectura idempotente falla.

### Validación pendiente de esta tanda

El workflow de CI debe completar suite Orby, TypeScript, ESLint y build de producción sobre el commit que contiene estos cambios, además de la auditoría de dependencias. Las pruebas automatizadas no sustituyen una sesión Chrome real con micrófono, una interrupción hablada durante Live ni una repetición posterior de exactamente la misma pregunta.


### Recuperación de Lab sin esperar embeddings lentos

La búsqueda de conocimiento conserva la recuperación híbrida y el aislamiento estricto por materia. Se separó el timeout de embeddings de consulta del timeout de ingestión documental: `createOrbyQueryEmbeddingForModel` usa un límite de 8 segundos para la solicitud de consulta; si no hay vector a tiempo, `searchOrbyKnowledge` continúa con la búsqueda léxica acotada a la materia. `createCloudflareEmbeddings` conserva 25 segundos por defecto, para que los lotes de procesamiento del Orby Lab no hereden el límite corto de una consulta interactiva. Se añadieron pruebas que comprueban explícitamente ambos contratos.


### Barge-in después de `turnComplete`, mientras Live aún reproduce audio

Se amplió la marca de interrupción del estudiante. No basta con `voiceResponseDoneRef`: Live puede haber terminado la generación, pero el audio programado continuar reproduciéndose. `interruptCurrentVoiceOutput` ahora considera también `voiceBrowserSpeechActiveRef`, fuentes Web Audio activas y el horizonte de reproducción del `AudioContext`. Así, una interrupción durante ese intervalo conserva el turno nuevo y no permite que el evento `interrupted` cierre su espera.

La prueba verifica que la marca de barge-in cubra tanto una generación aún abierta como el audio que sigue en reproducción tras finalizarla.

### Timeouts de embeddings separados por uso

Las consultas de embeddings Cloudflare para recuperación interactiva usan 8 segundos y luego permiten continuar con búsqueda léxica por materia. La función genérica `createCloudflareEmbeddings` conserva 25 segundos por defecto para los lotes del Lab; solo el caller de embeddings de consulta pasa explícitamente 8 segundos. Esto acota el posible bloqueo de una pregunta sin recortar el presupuesto de ingestión documental.


### Cobertura de ambas rutas de embeddings de consulta

La auditoría encontró dos callers interactivos distintos: `createOrbyQueryEmbedding` (ruta de consulta heredada) y `createOrbyQueryEmbeddingForModel` (recuperación híbrida por modelo). Ambos pasan ahora explícitamente 8 segundos a `createCloudflareEmbeddings`. El valor predeterminado de esa función queda en 25 segundos, de modo que `createOrbyEmbeddings` y los lotes de documentos conservan su presupuesto de ingestión. La prueba inspecciona ambas rutas para evitar que una consulta interactiva vuelva a heredar silenciosamente el límite largo.
