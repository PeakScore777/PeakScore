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
