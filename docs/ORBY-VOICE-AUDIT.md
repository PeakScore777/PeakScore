# Orby VC — auditoría y bitácora

- Proyecto: PeakScore
- Rama de trabajo: `feat/founder-intro`
- Última actualización: 2026-11-06
- Alcance: auditoría de código, rendimiento y regresiones del chat de voz (VC).
- Producción/`main`: no modificados ni desplegados en esta ronda.
- CI base: completo y aprobado para `6e0475e` (regresiones Orby, TypeScript, ESLint, build Next.js y auditoría de dependencias).
- Nueva tanda de carga diferida OCR: commits `453afac` y `38200d1`; CI del commit final pendiente.
- Vercel: check separado con `build-rate-limit`; no confundirlo con el build de producción aprobado en GitHub Actions.
- Validación manual de Gemini Live con micrófono real: pendiente.

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


### Reintento de historial sin doble envío

El botón de reintento del turno de voz ahora usa un cerrojo en `useRef` para impedir dos POST concurrentes y un estado visible que deshabilita el botón mientras guarda. Se libera en `finally` tanto si el guardado funciona como si falla. La conversación afectada permanece bloqueada para nuevos mensajes hasta resolver el guardado; las demás conversaciones pueden continuar.


## 2026-11-06 — carga diferida del motor OCR

Se detectó que `LessonAITutor.tsx` importaba `tesseract.js` de forma estática, aunque el OCR solo se ejecuta cuando el estudiante pulsa la acción para leer texto de una imagen. Esto hacía que el motor opcional formara parte del grafo de carga inicial del componente de chat/voz.

Cambio aplicado:
- Se eliminó el import estático de `createWorker`.
- `readImageText()` importa dinámicamente `tesseract.js` justo antes de crear el worker.
- Se conserva el idioma español (`spa`), la extracción existente, el límite de texto y la terminación del worker en `finally`.
- El camino habitual de chat/voz no necesita cargar Tesseract; la primera solicitud explícita de OCR sí asume la descarga/carga del chunk opcional.

Regresión añadida en `tests/orby-request-filter.test.mjs`: exige que no exista import estático, que la carga dinámica ocurra dentro de `readImageText()`, y que el worker español siga terminándose. No mide por sí sola el tamaño final del bundle ni el tiempo de descarga en Chrome.

Commits:
- `453afac` — `perf(orby): lazy-load local OCR engine`.
- `38200d1` — `test(orby): cover lazy-loaded OCR engine`.

Validación pendiente para esta tanda: CI completo sobre `38200d1` (suite Orby, TypeScript, ESLint, auditoría de dependencias y build Next.js). Después, comparar el bundle inicial/análisis de chunks para cuantificar el ahorro real. Esta optimización no cambia los proveedores de IA, las cuotas ni la facturación.



## 2026-11-06 — carga diferida del SDK de Gemini Live

La revisión del bundle detectó que `@google/genai` se importaba estáticamente desde el componente cliente, aunque la mayor parte de las sesiones solo necesita el chat escrito. Se cambió el punto de carga:

- El componente conserva únicamente los tipos `Session` y `FunctionResponseScheduling` como importación de TypeScript.
- `startRealtimeVoice()` inicia `import("@google/genai")` al comenzar explícitamente una sesión de voz, en paralelo con el flujo de permiso del micrófono.
- La inicialización, reconexión, modalidades de audio, endpointing y respuestas de herramientas usan el módulo cargado dinámicamente.
- El chat escrito no debe descargar el SDK de Gemini Live solo por montar el componente.

Se añadieron/ajustaron regresiones para verificar la carga diferida, la configuración de endpointing y la programación de respuestas de herramientas. La prueba estática comprueba el contrato del código; no reemplaza un análisis de chunks del build ni una sesión real en Chrome.

Commits:
- `ba28b4c` — `perf(orby): lazy-load Gemini Live SDK on voice start`.
- `590ea66` — `test(orby): cover lazy-loaded Gemini Live SDK`.

Estado de CI:
- La tanda OCR en `d232513` terminó correctamente en GitHub Actions.
- El workflow de `ba28b4c` estaba ejecutándose al registrar esta nota.
- El commit de pruebas `590ea66` necesita su propio CI completo antes de dar esta optimización por validada.

No se cambian modelos, proveedores, cuotas ni credenciales. La carga dinámica se activa solo por una acción explícita de iniciar voz.


## 2026-11-07 — solapamiento seguro de persistencia y recuperación

En `app/api/lesson-tutor/route.ts`, el cambio explícito de materia se escribía en Supabase y se esperaba su respuesta antes de iniciar la recuperación académica. Se modificó para iniciar la escritura y la recuperación en paralelo.

Garantías conservadas:
- La materia de la conversación se actualiza en memoria para construir la consulta con el área nueva.
- La escritura se espera antes de iniciar la generación y antes de entregar la respuesta.
- Si la actualización falla, se devuelve `ORBY_SUBJECT_UPDATE_FAILED`; no se entrega una respuesta como si el cambio hubiera quedado guardado.
- La búsqueda sigue usando el área explícita del turno actual y conserva las rutas independientes del Lab.

Se actualizó la regresión para comprobar el solapamiento y que la generación espere la persistencia.

CI de Gemini Live:
- El workflow del commit `ba28b4c` falló en regresiones, no en instalación ni auditoría de dependencias.
- El log identificó dos aserciones desactualizadas: una seguía buscando la referencia estática de `FunctionResponseScheduling`, y otra esperaba `EndSensitivity` sin el prefijo del módulo dinámico.
- Se actualizaron las expectativas para el SDK cargado bajo demanda. No se debe marcar el CI de `ba28b4c` como aprobado.
- El workflow de `2807b9c` y la nueva tanda posterior requieren validación completa propia.

Commits:
- `69f83b6` — `perf(orby): overlap subject persistence with retrieval`.
- `d827e65` — `test(orby): verify parallel subject persistence safely`.

Esta optimización reduce una espera serial en cambios de materia; no hay todavía una medición de producción que permita prometer una reducción concreta de milisegundos.


## 2026-11-07 — continuidad de voz y segmentación TTS

Se revisó el flujo de lectura por fragmentos en `components/aprender/LessonAITutor.tsx` y `lib/ai/orby-speech-chunks.ts`.

Ajustes:
- El divisor protege los puntos decimales y abreviaturas frecuentes en español (`3.14`, `p. ej.`, `Dr.`, `etc.`) para que no se conviertan en pausas artificiales.
- Se añadieron regresiones que comprueban que decimales y abreviaturas no fragmentan una frase, y que los límites reales entre oraciones sí se conservan.
- Se mantuvo el mecanismo existente de un solo fragmento TTS adelantado, cancelación por generación y reintento del mismo fragmento sin saltarse contenido.
- Se repararon tres escapes dobles en expresiones regulares de las pruebas del SDK Gemini Live que impedían incluso analizar el archivo de pruebas (SyntaxError: Invalid regular expression flags).

No se ha cambiado el proveedor de voz ni se ha agregado un fallback de pago. Las mejoras de segmentación todavía requieren pasar CI y una prueba real de escucha en navegador.


## 2026-11-07 — ajuste de regresión de segmentación

El CI de `d36d136` ejecutó las regresiones y detectó que una nueva aserción exigía que dos oraciones cortas generaran dos fragmentos TTS. El algoritmo está diseñado para empaquetar oraciones completas dentro del límite de 480 caracteres, por lo que esa expectativa era incorrecta: no es necesario crear una petición/pausa por cada oración.

Se corrigió la prueba para verificar que ambas oraciones se conserven completas, con puntuación y orden, permitiendo que compartan un fragmento. El CI previo falló solo en esa aserción de segmentación; la auditoría de dependencias sí terminó correctamente y los pasos posteriores se omitieron por el fallo temprano de pruebas.

Commit de corrección: `534fcb4`. CI de este commit pendiente. No se modificó el algoritmo de producción para satisfacer una prueba incorrecta.


## 2026-11-07 — precisión del detector de eco acústico

La auditoría del helper `lib/ai/orby-voice-echo.ts` detectó una comprobación duplicada para palabras de baja información y una comparación de saludos basada en subcadenas. Se endureció la detección:

- Se eliminó el bloque duplicado de coincidencia de palabras cortas.
- Las palabras cortas y saludos requieren coincidencia de token completo; no basta con que aparezcan como subcadena de otra palabra.
- Se añadieron regresiones para evitar falsos positivos como `"sol"` dentro de `"consola"`, mantener `"sí"` distinto de `"sin"` y reconocer frases significativas completas.
- Se conserva el umbral para no suprimir términos académicos cortos como `Saber 11` ni solicitudes nuevas por una coincidencia débil.

Commits:
- `ef01322` — corrección del matching de tokens.
- `2f43545` — regresiones de coincidencia por palabra completa.
- `825e41a` — ajuste de la regresión de frase significativa.

CI: las ejecuciones intermedias fueron canceladas al llegar commits posteriores a la rama; el run anterior `42332341129` aún no había finalizado al registrar esta nota. El siguiente CI completo debe validar la punta de rama. No se declara aprobado todavía.


## 2026-11-07 — cobertura adicional de captura de micrófono

Se revisó el AudioWorklet `public/audio/orby-audio-capture.worklet.js` y su regresión existente. El test anterior validaba la conservación de muestras a 44.1/48 kHz usando bloques mono de 128 frames. Se amplió la cobertura con un caso adicional:

- Bloques de captura con tamaños variables (64, 127, 256, 96, 192, 128 y 80 frames).
- Entrada estéreo con canales de amplitud diferente.
- Verificación de que la mezcla promedia L/R y no duplica el volumen.
- Verificación de paquetes PCM de 640 muestras (40 ms a 16 kHz).
- Verificación de que el total emitido más el remanente coincide con el número esperado de muestras remuestreadas.

No se cambió el AudioWorklet de producción ni el umbral de detección de voz. La prueba complementa las existentes; CI de la nueva punta de rama todavía pendiente.


## 2026-11-07 — corrección de regresión del detector de eco

El CI del commit `bfc1590` ejecutó 120 regresiones: 119 pasaron y una falló en el caso de saludo completo. La auditoría de dependencias pasó; TypeScript, ESLint y build se omitieron por el fallo temprano del test.

Causa: al endurecer la coincidencia por token completo, el detector pasó a buscar el saludo entero como si fuera un único token. Eso rechazaba un eco legítimo como `"¡Hola de nuevo!"` dentro de `"¡Hola de nuevo! Soy Orby."`.

Corrección:
- Se mantiene la coincidencia por límites de frase completa (inicio, fin o espacios alrededor), nunca por subcadena interna.
- Se conserva el rechazo de coincidencias parciales como `"hola"` dentro de `"holanda"`.
- Se amplían las regresiones para saludos rodeados de texto y falsos positivos de subcadenas.

Commits:
- `5e6dd69` — restaurar reconocimiento de frase completa.
- `db8efc2` — pruebas de saludo y subcadenas.

El workflow de la nueva punta debe confirmar la corrección. No se declara validado hasta que termine toda la cadena.


## 2026-11-07 — instrumentación de latencia de voz Live

Se añadieron métricas monotónicas por turno en `components/aprender/LessonAITutor.tsx`:

- `firstTranscriptMs`: tiempo desde que el cliente acepta la transcripción final del estudiante hasta que llega la primera transcripción de respuesta de Orby.
- `firstAudioMs`: tiempo desde ese mismo punto hasta que se programa el primer paquete de audio Live para reproducción.
- Los dos indicadores se reinician al aceptar cada turno, evitando arrastrar tiempos de la conversación anterior.
- Solo se registran duraciones y no se incluyen transcripciones ni contenido personal en estos eventos.

Esto permite separar el tiempo de respuesta textual del tiempo hasta el primer audio. No cambia el endpointing, el modelo, el proveedor, ni las cuotas; tampoco promete una reducción de latencia por sí mismo. Las métricas reales deberán observarse en sesiones de Chrome y correlacionarse con el rendimiento de red y del servicio.

Commits:
- `58c1218` — instrumentación de primera transcripción y primer audio.
- `5b115d0` — regresión de instrumentación por turno.

Validación de CI:
- El workflow del commit `5e6dd69` completó regresiones y TypeScript correctamente; ESLint y build estaban aún ejecutándose en la última lectura.
- Los commits posteriores `db8efc2`, `7888351` y la instrumentación requieren validación de la punta actual.


## 2026-11-07 — diagnóstico por etapas del arranque de voz

La revisión confirmó que el cliente ya inicia en paralelo la creación de conversación y la emisión del token efímero; no se duplicó esa optimización. Se añadieron mediciones del navegador para conocer dónde se consume el tiempo real:

- `microphonePermissionMs`: espera hasta obtener permiso y stream del micrófono.
- `conversationAndTokenMs`: creación/recuperación de conversación y token efímero (operaciones paralelas).
- `sdkLoadMs`: tiempo transcurrido desde que se inicia la descarga del SDK, que corre en paralelo con el permiso.
- `liveConnectMs`: tiempo hasta resolver la conexión Live.
- `liveSetupMs`: tiempo adicional hasta recibir la confirmación `setupComplete`.
- `workletLoadMs`: carga del AudioWorklet de captura.
- `totalMs`: duración desde el inicio del arranque hasta que el cliente queda escuchando.

Las mediciones usan `performance.now()` y solo registran duraciones, sin transcripciones, prompts ni texto del estudiante. La separación entre conexión y confirmación Live se corrigió expresamente para evitar métricas artificiales de cero. El SDK se mide desde el inicio de la importación, aunque esta se solape con el permiso del micrófono.

No se cambió el umbral de silencio, la política de escucha, el proveedor ni el orden de seguridad de la sesión. Las cifras reales deberán observarse en Chrome para decidir qué etapa optimizar.

Commits:
- `ed6b85e` — instrumentación inicial del arranque.
- `caecffa` — separación de conexión y confirmación Live.
- `bf4c6f3` — medición completa del SDK en paralelo.
- `b665437` — regresión de instrumentación por etapas.

CI de la punta actual pendiente.


## 2026-11-07 — límite de memoria para audio Live pendiente

La auditoría encontró que la cola previa limitaba el número de fragmentos a 512, pero no el tamaño acumulado de sus cargas Base64. Se añadió un presupuesto dual antes de almacenar audio cuya transcripción todavía no ha sido validada:

- Máximo 512 fragmentos pendientes.
- Máximo 8 MiB de caracteres Base64 acumulados (aproximadamente 6 MiB de datos binarios).
- Si se alcanza cualquiera de los límites, se descarta la cola no validada y se activa la ruta existente de voz por texto validado; no se reproduce audio no verificado.
- El registro de diagnóstico conserva el número real de fragmentos antes de vaciar la cola.

La cola se sigue vaciando al aprobarse la primera oración completa y las generaciones interrumpidas siguen limpiando el audio pendiente. No se alteró el orden de reproducción, el límite de escucha ni el proveedor.

Commits:
- `daa92b9` — presupuesto de memoria para audio pendiente.
- `a006f4d` — precisión del registro del límite.
- `8bc40f9` — regresión para ambos límites.

El CI de esta punta debe validar la prueba nueva, TypeScript, ESLint y build. La ejecución anterior `42333196498` corresponde a `fa2cd3a` y no valida estos cambios posteriores.


## 2026-11-07 — contabilidad constante de la cola de audio

Al revisar el presupuesto dual de audio pendiente se detectó que calcular el tamaño acumulado con `Array.reduce()` en cada fragmento podía volver cuadrática la contabilidad bajo una cola larga. Se reemplazó por un contador incremental:

- `voicePendingAudioEncodedCharsRef` mantiene el total de caracteres Base64 retenidos.
- Cada fragmento suma su longitud una sola vez al entrar en la cola.
- `clearPendingGeminiAudioQueue()` vacía la cola y reinicia el contador en un único punto.
- La comprobación del presupuesto queda en O(1) por fragmento, sin recorrer toda la cola.
- Se añadió regresión para verificar el contador, la limpieza centralizada y la ausencia del recorrido repetido.

El límite de 512 fragmentos y 8 MiB se mantiene sin cambios. No se modificó la reproducción de audio ya validado.

Commits:
- `3c87d6c` — contabilidad incremental.
- `b870f34` — regresión de complejidad y limpieza.

La ejecución CI `42333407752` corresponde a la versión anterior `ca5cc6e`; no valida estos commits nuevos. La punta actual necesita una ejecución completa.


## 2026-11-07 — liberación explícita de recursos de audio decodificado

La auditoría del ciclo de vida de audio encontró que los nodos `AudioBufferSourceNode` se desconectaban al terminar, pero podían conservar su callback `onended` y la referencia al `AudioBuffer` hasta que el recolector liberara el nodo. Se endureció la liberación en las rutas Live y TTS:

- Al finalizar naturalmente, se elimina el nodo del conjunto de fuentes, se retira `onended`, se desconecta y se asigna `buffer = null`.
- Al cancelar/interrumpir, se retira primero el callback, se detiene el nodo de forma segura, se desconecta y se libera el buffer.
- Se conserva el control por generación de reproducción para impedir que callbacks antiguos finalicen o persistan un turno nuevo.
- Se añadieron regresiones para final natural, cancelación y limpieza de Live/TTS.

La auditoría también confirmó que la reconexión usa identificadores de conexión y generación de sesión para ignorar eventos atrasados del socket anterior; no se modificó ese flujo ni la persistencia del turno. La prueba de estabilidad de diez minutos sigue requiriendo una sesión real de Chrome, no se afirma como simulada.

Commits:
- `db7a0d6` — liberar buffers decodificados y callbacks.
- `373d43f` — regresiones de limpieza de recursos.

La CI anterior `42333562718` corresponde a `29f9cb4`; no valida estos cambios. La punta actual necesita CI completo.


Nota de cobertura: se ajustó el rango de extracción de la regresión TTS para abarcar la función completa, incluidas sus funciones auxiliares internas, y no detenerse en el primer helper anidado. Commit: `3e0bea9`.


## 2026-11-07 — eventos tardíos del micrófono

La revisión del ciclo de vida del stream encontró que `onended` ya comprobaba la generación y la identidad del stream, pero `onmute` y `onunmute` podían actualizar el estado visual desde un track reemplazado. Se unificaron las tres protecciones:

- Los tres handlers comprueban que el modo de voz siga activo.
- Comprueban la generación de sesión vigente.
- Comprueban que el stream siga siendo el stream activo.
- Al cerrar el micrófono, se eliminan `onended`, `onmute` y `onunmute` antes de detener cada track.
- Se añadieron regresiones para eventos tardíos y desmontaje del stream.

La solicitud de permiso tardía ya detenía los tracks si el usuario cancelaba o vencía el tiempo de espera; ese comportamiento se conserva. No se modificó la captura PCM ni la latencia de envío.

Commits:
- `b5c1323` — proteger eventos tardíos y limpiar handlers.
- `fc39672` — regresiones del ciclo de vida del micrófono.

La CI de `11ea224` ya había completado regresiones, TypeScript y ESLint; el build de producción seguía en ejecución. Esta nueva punta requiere una ejecución completa propia.


## 2026-11-07 — reducción de asignaciones en AudioWorklet

Se optimizó `public/audio/orby-audio-capture.worklet.js` sin cambiar el formato PCM ni la frecuencia objetivo:

- Se reutiliza el buffer de mezcla y solo crece cuando un bloque supera su capacidad.
- Se reutiliza el buffer de remuestreo y se evita el array dinámico de muestras.
- La muestra de arrastre del interpolador se guarda como escalar, eliminando el `slice()` por quantum.
- El PCM se escribe directamente en un buffer fijo de 640 muestras (40 ms a 16 kHz).
- Al transferir un paquete completo al hilo principal, se reserva el siguiente buffer de staging; no se copia ni se concatena el remanente en cada quantum.
- Se actualizaron las regresiones para comprobar el remanente mediante `pendingPcmLength`, conservando las comprobaciones de 44.1/48 kHz, bloques variables, mezcla estéreo y ausencia de pérdida de muestras.

El trabajo de mezcla y remuestreo sigue siendo lineal en el número de muestras. No se modificaron la cancelación de eco del navegador, el envío a Gemini Live, el tamaño de paquete, ni los filtros pedagógicos. La mejora reduce asignaciones por quantum; el impacto real de CPU/GC debe confirmarse en Chrome con dispositivos reales.

Commits:
- `bcf5dab` — buffers reutilizables y PCM fijo.
- `30cb22c` — pruebas adaptadas al buffer de staging.
- `91f72c1` — arrastre del interpolador sin asignación por quantum.

CI de esta punta pendiente.


## 2026-11-07 — regresión de turnos consecutivos con entrada escrita

Se investigó la captura donde Orby respondió a una pregunta anterior y esa respuesta volvió a aparecer después de que el estudiante escribió un tema nuevo. La causa plausible localizada fue una ventana de carrera: tras un barge-in escrito, la salida de la generación anterior podía llegar antes del evento Live `interrupted`. La lógica previa solo activaba el descarte al recibir ese evento; por tanto, un fragmento tardío podía asociarse temporalmente al nuevo turno.

Corrección:
- Si hay un barge-in pendiente y ya existe un nuevo turno del estudiante, el manejador marca como descartable la salida de la generación anterior desde el comienzo del evento.
- El texto de salida, los fragmentos de audio y la finalización de esa generación quedan descartados mientras se espera el evento `interrupted`.
- El evento `interrupted` cierra la generación anterior y libera la protección para la respuesta nueva.
- Se añadió una regresión para comprobar el orden adverso: salida tardía primero, evento `interrupted` después.

Además, se revirtió la optimización reciente del AudioWorklet a la versión previamente validada, porque no era prudente mantener un cambio de procesamiento de bajo nivel mientras se investigaba una regresión conversacional. Se adaptaron las pruebas al formato anterior del remanente PCM.

Commits:
- `8e175bf` — restaurar el AudioWorklet anterior.
- `3a26802` — alinear sus regresiones.
- `b6f9242` — descartar salida Live tardía tras barge-in escrito.
- `8a4af91` — prueba del orden adverso de eventos.

La corrección es una protección de orden de eventos; debe confirmarse con la suite y con una sesión real en Chrome antes de dar el problema por cerrado.


## 2026-11-07 — auditoría profunda de latencia, silencio y turnos escritos

Se amplió la revisión desde la captura hasta el guardado del turno. Se localizaron dos riesgos concretos adicionales:

1. **Fin ambiguo de mensajes escritos en Live.** El compositor escrito enviaba el texto mediante `sendRealtimeInput({ text })`, una ruta de entrada en tiempo real asociada al endpointing/VAD de la sesión. El código no cerraba explícitamente ese turno escrito. Esto podía dejar la respuesta esperando a que Live detectara un final de actividad que el usuario ya había expresado al pulsar Enviar. Ahora el mensaje escrito se envía con `sendClientContent({ turns: [...], turnComplete: true })`, que marca inequívocamente el final del turno.
2. **Recuperación demasiado tardía cuando Live deja de avanzar.** El watchdog anterior avisaba a los 18 s, esperaba 50 s y después añadía otros 70 s antes de cambiar al respaldo. En el peor caso podía dejar al estudiante esperando cerca de dos minutos. Ahora avisa a los 12 s y recupera la misma pregunta después de 32 s sin progreso. Cada evento de transcripción, audio o herramienta vuelve a armar el watchdog, por lo que una respuesta que sigue avanzando no se corta por su duración total.

Se conservan las reglas de coste: el respaldo sigue usando el tutor gratuito configurado; no se añade un proveedor de pago ni un fallback silencioso. Si la cuota gratuita está agotada, se debe informar y conservar la respuesta/pregunta cuando sea posible.

### Rutas y límites revisados

- Inicio de micrófono: permiso acotado a 12 s; preparación del AudioWorklet a 8 s; conexión Live a 15 s y confirmación a 8 s.
- Solicitud escrita del tutor: timeout cliente de 60 s; creación de conversación de 12 s.
- Búsqueda de conocimiento Live: timeout cliente de 12 s; recuperación privada, conceptos y fuentes públicas se ejecutan en paralelo con resultados parciales cuando una fuente falla.
- Whisper: timeout de proveedor de 45 s.
- Cloudflare tutor: timeout de proveedor de 18 s; análisis: 25 s; embeddings: 25 s.
- TTS Gemini: sin límite explícito propio del SDK en esta ruta; debe mantenerse acotado por el tiempo de la solicitud del navegador y no puede convertirse en condición para mostrar la respuesta textual.
- Persistencia de turno Live: timeout cliente de 12 s, con reintento de guardado y sin duplicar el par usuario/asistente.

### Riesgos que requieren seguimiento

- La sesión Live depende de red, cuota y disponibilidad del proveedor; el watchdog convierte el silencio en una recuperación acotada, pero no puede garantizar disponibilidad externa permanente.
- La búsqueda del Lab puede tardar o fallar; no debe bloquear el turno conversacional ni descartar resultados parciales útiles.
- La validación de calidad puede requerir una segunda generación cuando el primer borrador es solo «sí/no»; esa segunda llamada está limitada por el timeout del proveedor y debe devolver error explícito si vuelve a fallar.
- Los logs de rendimiento existentes cubren inicio de sesión Live y etapas de tutor escrito. Falta instrumentar de forma consistente latencia de primera transcripción, primera respuesta textual, primer audio, herramientas y persistencia, con identificador de turno no sensible. No registrar texto, audio, tokens ni datos personales en telemetría.

### Cambios implementados en esta tanda

- `53aded3` — cerrar explícitamente los turnos escritos y reducir el watchdog de inactividad a 32 s (aviso a 12 s).
- `ca31235` — regresiones para el cierre explícito y la recuperación por inactividad.
- `e57e337` — hacer robustas las aserciones del buffer PCM restaurado.
- Se mantiene la protección `b6f9242` contra salida Live atrasada y la restauración del AudioWorklet `8e175bf`.

La auditoría estática identifica causas plausibles y corrige rutas controlables. No equivale a una garantía de cero fallos: antes de producción deben pasar pruebas de CI, TypeScript, ESLint, build y pruebas reales de voz en Chrome con red lenta, interrupciones, turnos escritos consecutivos, cuota agotada y desconexión del micrófono.


- **Emisión del token Live:** el cliente ya limitaba el fetch a 15 s, pero el SDK del servidor no declaraba su propio timeout. Ahora la llamada de emisión del token efímero también tiene un límite de 12 s, y existe una prueba para impedir que se quite accidentalmente.


## 2026-11-07 — corrección de burbujas parciales huérfanas al iniciar una nueva intervención

La grabación de Chrome del 7 de noviembre muestra un fragmento de respuesta de Orby que permanece visible después de que el estudiante vuelve a hablar. La causa estaba en la rama `ACTIVITY_START`: cuando no había audio reproduciéndose (por ejemplo, porque Live aún estaba acumulando la primera frase para validarla), el cliente limpiaba las referencias de la generación anterior, pero no retiraba del chat la burbuja parcial que ya había insertado.

Corrección:
- Antes de reiniciar las referencias de un nuevo ciclo de micrófono, se identifica la burbuja del asistente solo si la respuesta anterior aún no había finalizado.
- Se elimina esa burbuja parcial antes de limpiar `voiceAssistantMessageIdRef`.
- Las respuestas completas no se eliminan ni se vuelven a guardar.
- Se añadió una regresión que comprueba tanto la condición de respuesta incompleta como el orden de limpieza antes del reinicio de referencias.

Esto corrige el fragmento obsoleto observado en la grabación. No se presenta como solución de todos los problemas acústicos: la nueva ejecución CI debe pasar y la misma secuencia debe repetirse en Chrome con micrófono real.


### Aislamiento de generación anterior y turno nuevo

La inspección del mismo video reveló que retirar la burbuja parcial no bastaba: Live puede entregar el texto final de una generación anterior después de que comienza la nueva actividad del micrófono, pero antes del evento `interrupted`. Ese texto tardío podía atribuirse al turno nuevo porque el estudiante ya estaba marcado como pendiente.

Se añadió un guard de una sola generación:
- Al detectar nueva actividad mientras existe una generación anterior sin finalizar, se marca esa generación como obsoleta y se elimina su burbuja parcial.
- Se descartan texto, audio y cierre de esa generación mientras llega el límite `interrupted`.
- El evento `interrupted` cierra el guard para que la siguiente generación legítima pueda responder.
- Si no llega el evento de interrupción pero sí el cierre de la generación vieja, ese cierre descartado también libera el guard.
- Si no existe un turno nuevo, se limpia además el marcador de barge-in para no contaminar el siguiente mensaje.
- Las regresiones verifican el aislamiento y el orden de liberación del guard.

Este cambio apunta al fallo visible de respuestas repetidas/fragmentos antiguos atribuidos al mensaje siguiente. No se declara validado acústicamente hasta repetir la secuencia en Chrome real y completar CI.

## 2026-11-07 — revisión del video de referencia: guía conversacional y precisión conceptual

Se revisó la grabación de 99,3 s enviada como referencia del estándar pedagógico esperado. Se identificaron tres observaciones concretas:

1. **Seguimiento «no sé, xd»:** después de que Orby invita a elegir un área de Saber 11, la respuesta informal del estudiante termina en el fallback genérico de respuesta incompleta. La causa reproducible en el filtro era un escape duplicado (`\\s+`) dentro de una expresión regular literal: buscaba los caracteres barra+s en lugar de espacios reales. Por eso no reconocía sufijos coloquiales como «xd», «jaja» o «bro» después de «no sé».
2. **Orden de invitación:** el detector de contexto exigía que «Saber 11» apareciera después de la pregunta de selección. Algunas invitaciones naturales presentan primero el examen y después preguntan qué área trabajar. Se amplió para aceptar ambas disposiciones y las formulaciones «¿qué área quieres trabajar?» y «¿qué área trabajamos?».
3. **Explicación de ADN/mitosis:** el video muestra una analogía cercana, pero la secuencia «cuando la célula quiere dividirse, el ADN se separa y hace una copia» mezcla replicación con división celular. La copia del ADN ocurre en la fase S de la interfase; después, durante la mitosis, se separan las cromátidas hermanas. La citocinesis divide el citoplasma. El prompt académico ya contenía la regla correcta, pero la salida observada no la respetó: hace falta una validación de exactitud de la respuesta generada, no solo más instrucciones al modelo.

### Corrección implementada

- Corregido el escape duplicado de la expresión regular y normalizada la puntuación informal antes de evaluar sufijos como «, xd»; ahora «no sé, xd» se convierte en una respuesta de orientación válida.
- Ampliado el detector de invitaciones para reconocer la secuencia del video y preguntas de área con el nombre Saber 11 antes o después.
- Añadidas regresiones para «no sé, xd», «no sé jaja», «dime» y para impedir que una negativa previa se interprete como invitación académica.
- Cuando el filtro reconoce la respuesta de orientación, la ruta responde de forma determinista antes del limitador, la recuperación de conocimiento y la inferencia del modelo. Esto evita una generación innecesaria y reduce latencia para ese caso concreto.

### Pendiente de esta revisión

- Ejecutar CI completo sobre el commit de la corrección; no se declara aprobada la suite hasta ver el resultado.
- Revisar por separado el saludo que en el video termina en el fallback de respuesta incompleta. El video muestra el síntoma, pero aún no se ha aislado qué evento de Live o qué ruta de texto lo produce.
- Diseñar y probar una validación de precisión conceptual para explicaciones de procesos biológicos, sin convertirla en un filtro frágil que rechace explicaciones correctas.
- Medir en Chrome real tiempo hasta primera transcripción, primer texto, primer audio y respuesta completa. La corrección de guía reduce inferencia en un caso específico; no demuestra una mejora general de latencia.

## 2026-11-07 — precisión conceptual y ruta de latencia

### Precisión: replicación del ADN y mitosis

El ejemplo del video evidenció una confusión de alto impacto: presentar la copia del ADN como si ocurriera durante la mitosis. Se agregó una corrección determinista, deliberadamente estrecha, que solo interviene cuando una respuesta menciona mitosis, ADN/copia y atribuye explícitamente la replicación a esa etapa. La explicación corregida separa tres hechos: duplicación en fase S de la interfase, separación de cromátidas hermanas durante la mitosis y división del citoplasma en la citocinesis.

La corrección se aplica a la salida inicial y a la recuperación acotada del tutor, antes de validar y entregar el texto. Se agregaron pruebas para el error observado, una explicación correcta que debe permanecer intacta y una mención de mitosis que no debe activar el reemplazo. Esto no equivale a un verificador universal de biología; el alcance es únicamente esa confusión observada.

### Regresión detectada por CI: respuesta compuesta solo por signos

La ejecución de GitHub Actions del commit `07811197` ejecutó 130 pruebas: 129 pasaron y falló una aserción en `tests/orby-request-filter.test.mjs:2486`. La prueba esperaba que `isLowQualityOrbyReply("???")` clasificara los signos como respuesta incompleta; la función limpiaba la puntuación antes de clasificar y convertía ese contenido en cadena vacía, que estaba reservada para la recuperación del transcript vacío de Live.

Corrección: distinguir explícitamente una salida no vacía compuesta solo por puntuación (respuesta inválida) de un transcript realmente vacío (la ruta de recuperación conserva su responsabilidad). Se mantiene la regla existente de detectar respuestas de una sola palabra como "sí" cuando el estudiante no pidió una respuesta binaria. La siguiente ejecución de CI debe confirmar el arreglo; TypeScript, ESLint y build no corrieron en la ejecución fallida porque el workflow se detiene al fallar las pruebas.

### Repetición de presentación: prioridad incorrecta del área activa

Se encontró una causa concreta para saludos que podían retomar el área equivocada: `getActiveOrbySubjectKey` consultaba primero `activeSubject` (estado de la sesión/componente) y solo después buscaba la selección más reciente en el historial. Si el estudiante cambiaba de área dentro de la conversación, un valor de sesión desactualizado podía ganar y el saludo devolver una continuación de la materia anterior.

Se cambió la prioridad: primero se recorre el intercambio de la conversación desde el turno más reciente hacia atrás para detectar la última selección explícita; el área activa queda como respaldo únicamente cuando el historial no contiene una selección. La función compartida alimenta los saludos deterministas del chat de texto y de voz.

Se añadió una regresión con cambio Matemáticas → Ciencias Naturales y un estado de sesión todavía en Matemáticas, además de un caso donde el historial no tiene selección explícita y sí corresponde usar el área activa.

### Latencia: hallazgos confirmados, sin cambios especulativos

- La ruta de tutor ya ejecuta en paralelo la búsqueda vectorial, el grafo de conceptos y el perfil de aprendizaje; la recuperación usa `Promise.allSettled` para no perder una fuente cuando la otra falla.
- Cuando se recuperan documentos, el enriquecimiento pedagógico y la búsqueda de documentos relacionados también corren en paralelo.
- El generador Cloudflare no transmite tokens progresivamente: solicita una respuesta JSON completa, con timeout de 18 s y máximo de 2.200 tokens. Esto fija una cota de espera, pero no reduce por sí solo el tiempo real.
- La búsqueda vectorial consulta primero qué modelos están indexados y luego puede generar hasta dos embeddings de consulta, en paralelo. Cada modelo puede añadir una llamada externa antes de la búsqueda SQL. No se cambia todavía el número de espacios vectoriales ni se elimina una fuente: hacerlo sin métricas de relevancia podría reducir la calidad del Lab.
- El guardado final es atómico y el endpoint informa tiempos de recuperación, generación y persistencia mediante `Server-Timing` y `X-Orby-Response-Time-Ms`. Falta recoger mediciones reales de navegador para localizar la etapa dominante en producción.

### Cambios de esta etapa

- `935cc52a`: detector acotado para corregir la confusión ADN/mitosis.
- `772b243b`: integración de la corrección en la ruta de texto, incluida la recuperación.
- `55713190`: pruebas unitarias de precisión conceptual.
- `c9087518` / `470a51fd`: prueba de integración que verifica que la ruta del tutor aplique la corrección tanto a la primera generación como al reintento.

### Validación pendiente

No se recibió resultado de CI para estos commits; la consulta de ejecuciones de workflow no devolvió ejecuciones. Las pruebas nuevas están escritas, pero no se declaran ejecutadas ni aprobadas desde GitHub. Tampoco se ha realizado una sesión de Chrome/Live en esta etapa. No se cambia la arquitectura de recuperación hasta contar con tiempos reales y comparar calidad de resultados.


## 2026-11-07 — idempotencia atómica del guardado de voz

La auditoría del endpoint `/api/orby/realtime-turn` encontró una carrera real: el endpoint leía los dos mensajes más recientes para detectar un reintento y, después, llamaba a `orby_save_turn`. Dos solicitudes simultáneas podían completar esa lectura antes de que cualquiera insertara el turno. La función anterior bloqueaba la conversación al insertar, pero no recibía una identidad de turno ni hacía la comprobación dentro de la misma transacción.

### Corrección implementada en `feat/founder-intro`

- Se añadió `orby_voice_turn_receipts`, con clave primaria compuesta por conversación, usuario e identificador UUID del turno.
- Se añadió `orby_save_voice_turn`: bloquea la fila de conversación, reclama el UUID con `ON CONFLICT DO NOTHING` y solo inserta el par de mensajes si la reclamación es nueva. La reclamación y los mensajes se confirman en la misma transacción PostgreSQL.
- El cliente genera un UUID al crear el paquete inmutable del turno y lo conserva dentro de `failedVoiceTurn`; el botón de reintento reutiliza exactamente ese identificador.
- El endpoint valida el UUID y delega la idempotencia a la función SQL. Se eliminó la lectura previa de mensajes como mecanismo de deduplicación.
- Las preguntas repetidas de forma legítima no se confunden: cada nuevo turno tiene un UUID distinto, aunque el texto sea idéntico.

Commits:
- `8e439f0` — migración y función SQL atómica.
- `18ac6ed` — endpoint de voz usa la nueva función.
- `9adee8a` — cliente conserva el ID del turno al reintentar.

### Validación pendiente

La garantía de concurrencia se apoya en el bloqueo transaccional de la conversación y la clave única de recibo. Aún falta ejecutar la CI de estos commits y probar dos solicitudes simultáneas contra una base Supabase de prueba. No se ha tocado `main`, no se ha desplegado y no se debe hacer Pull todavía.


## 2026-11-07 — evidencia del fallo de persistencia en Supabase activo

Se inspeccionó el proyecto Supabase PeakScore (`avmywztnsrnyjhvbaiio`) en modo de solo lectura. La base de datos no registra la migración `20261107010000`; `to_regclass('public.orby_voice_turn_receipts')` y `to_regprocedure('public.orby_save_voice_turn(uuid,uuid,uuid,text,text)')` devuelven `NULL`. La función anterior `orby_save_turn` sí existe.

Los logs de Edge de Supabase confirman solicitudes reales a `POST /rest/v1/rpc/orby_save_voice_turn` con respuesta HTTP 404 y `PostgREST; error=PGRST202` (7 nov 2026, 04:37 UTC). Esto coincide con el mensaje de la interfaz: la generación termina, pero la persistencia falla porque PostgREST no encuentra la función RPC desplegada.

### Estado de validación del código

En la CI del commit `9e9b32d`: pruebas de Orby, TypeScript y ESLint aparecen aprobados; el build de producción aún estaba ejecutándose en la última consulta. No se debe afirmar que la CI completa terminó hasta revisar la conclusión del workflow.

### Límite de cambios

No se aplicó la migración al proyecto Supabase activo. Es un cambio de esquema remoto y requiere autorización explícita. No se usó la función antigua como fallback porque eso volvería a permitir duplicados bajo reintentos concurrentes y ocultaría la causa real. La migración permanece en GitHub, rama `feat/founder-intro`; no se tocó `main` ni se desplegó código.


### CI final — commit `9e9b32d`

Workflow `42339106392` terminó con `success`. Pasaron las 130 pruebas de regresión de Orby, TypeScript, ESLint y el build de producción de Next.js. La auditoría de dependencias terminó correctamente. La conclusión valida el código de ese commit; no valida la migración remota, que sigue sin aplicarse en Supabase.

## 2026-11-07 — stable idempotency key across automatic persistence retries

- Found a client-side edge case during the post-migration audit: if the first persistence request timed out after the database had committed, a later automatic persistence attempt could generate a fresh UUID for the same completed voice exchange. The database receipt would then treat it as a new turn, weakening the duplicate-prevention guarantee.
- The client now retains the pending immutable turn (including its UUID) while persistence is unresolved, reuses it for automatic retries of the same conversation/user/assistant content, and clears it only after confirmed persistence.
- The explicit retry path continues to reuse the same immutable turn object.
- Change: `57517d2e9cf73ecadc1d188676ba1ef374912c4f`.
- Validation: pending GitHub Actions for this commit. No Pull or deployment requested/performed.


## 2026-11-08 — nueva auditoría de fidelidad del tutor Live

- Referencia revisada: video de clase de 42,73 s; incluye pizarra manuscrita progresiva con punta de lápiz, notas/flechas/etiquetas y subtítulos inferiores con palabra activa.
- El código ya tenía pizarra v2, `sketch` SVG, lápiz SMIL, acciones teacher-only incrementales, snapshots acumulativos, sanitización, interrupciones por generación e idempotencia de persistencia.
- Hallazgo: la UI de subtítulos solo pintaba la transcripción acumulada; no avanzaba una palabra activa. Se implementó un helper puro de tokenización y cálculo temporal y una UI karaoke que sigue `AudioContext.currentTime` y la duración PCM programada.
- Limitación explícita: Live no expone word timestamps. El resaltado es proporcional al audio real ya programado y monotónico, no fonético exacto. No se agrega una segunda llamada de transcripción para no aumentar la latencia/cuota.
- Se corrigió la incongruencia de `/api/orby/voice-speech`: `MAX_TEXT_LENGTH` es 900, mientras el mensaje de validación indicaba 500.
- Pruebas nuevas: tokenización con preservación de espacios y puntuación, conteo, índices de progreso, clamp, entrada inválida y monotonicidad. CI nueva pendiente tras los últimos commits de la etapa.
- Fuente Live timestamps: https://ai.google.dev/gemini-api/docs/live-api/live-transcribe — Live streaming no admite timestamps por palabra; transcripción no streaming puede solicitarlos: https://ai.google.dev/gemini-api/docs/transcribe.
- Seguridad/presupuesto: no se añadió proveedor, modelo de pago, llamada de inferencia adicional ni cambio de privacidad/cuotas. No se habilitó producción, no se tocó `main`, no se ejecutó migración Supabase y no se desplegó.
- Aceptación manual pendiente: Chrome/micrófono, al menos 20 turnos cortos y 5 explicaciones largas, barge-in, continuidad de voz, sincronía visual aproximada, mobile layout y consumo/cuota real.

### Resultado de CI — commit de código `49024376f9a5d603e619ef97618f467fb070b686`

- GitHub Actions workflow `42497670325` terminó en `success`.
- Suite Orby: 232 pruebas, 232 aprobadas, 0 fallidas.
- `npx tsc --noEmit`: aprobado.
- `npm run lint` con `--max-warnings=0`: aprobado.
- `npx next build`: aprobado.
- `npm audit`: 0 vulnerabilidades (info/low/moderate/high/critical: 0).
- Este CI valida código y build con variables placeholder; no valida credenciales, permisos de micrófono, proveedor Live real, cuota restante ni persistencia remota Supabase.

### Vercel separado del CI de aplicación
- Git status de Vercel continúa en `failure` con destino `?upgradeToPro=build-rate-limit`.
- Vercel deployment context identifica el equipo PeakScore como plan Hobby. No existe un deployment Vercel asociado al SHA `49024376f9a5d603e619ef97618f467fb070b686` en la consulta de despliegues exactos.
- Esto se registra como bloqueo externo de builds/preview por límite del plan, no como fallo de TypeScript, ESLint, tests ni Next build del repositorio.
- No se cambió plan, no se creó/deployó ningún deployment, no se tocó `main` ni se habilitó producción.

### Prueba de producto todavía pendiente
- No se ejecutó una sesión manual de Chrome con micrófono y audio real en esta etapa. El efecto karaoke está validado por tests/código, pero la sensación visual y la precisión percibida requieren prueba real.
- El resaltado usa reloj de reproducción PCM y duración de audio programado; es monotónico y no genera llamadas extra, pero NO equivale a timestamp fonético por palabra. La API Gemini Live streaming no expone dichos timestamps.
- Fallback TTS por turnos deja el contenido visible si falla/agota cuota, pero en esta etapa el resaltado por palabra solo está integrado en la reproducción Live PCM; no declarar karaoke equivalente en el fallback TTS.
- No se afirma que el tutor ya esté idéntico al video. El siguiente criterio de aceptación es probar la clase real y ajustar cadencia/diagramas a partir de esa observación.
