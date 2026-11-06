# Orby VC — auditoría y bitácora

- Proyecto: PeakScore
- Rama de trabajo: `feat/founder-intro`
- Última actualización: 2026-11-06
- Alcance: auditoría de código y regresiones del chat de voz (VC).
- Producción/`main`: no modificados ni desplegados en esta ronda.
- Estado: corrección de clasificación de errores aplicada; CI del último cambio pendiente de confirmación y validación manual del VC pendiente.

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
- El prompt indica a Orby que complemente lo ya explicado con hallazgos útiles, sin repetir la respuesta completa; si la búsqueda no aporta nada, debe indicarlo brevemente y cerrar el turno.
- Si Gemini cancela la llamada o la conexión se renueva mientras el resultado sigue pendiente, se invalida el trabajo antiguo y se conserva la pregunta para terminarla con el tutor gratuito por turnos. No se envían respuestas de herramienta con IDs de una conexión anterior.
- Si no se puede entregar la respuesta de herramienta, se activa el respaldo gratuito para recuperar la misma pregunta, en lugar de dejar el turno esperando indefinidamente.

Las pruebas nuevas cubren los dos órdenes de llegada (resultado antes/después de la primera finalización), exigen salida real del seguimiento antes de finalizar y comprueban recuperación ante cancelación/reconexión. Son pruebas de lógica e invariantes: la interacción completa debe validarse en Chrome con Gemini Live real.

La semántica coincide con la documentación oficial: `NON_BLOCKING` permite que la conversación continúe mientras se ejecuta la herramienta; `WHEN_IDLE` incorpora el resultado y solicita una generación sin interrumpir la generación activa. Referencias: [Live API — herramientas asíncronas](https://ai.google.dev/gemini-api/docs/live-api/tools) y [API — programación de respuestas de función](https://ai.google.dev/api/generate-content).

### Continuidad, interrupciones y reconexión

- El watchdog avisa a los 18 segundos y a los 50 segundos conserva una sesión Live que sigue conectada, concediendo una ventana adicional de 70 segundos antes de activar el respaldo.
- Se guarda el identificador de reanudación de la sesión y se solicita un token efímero nuevo para cada intento, porque los tokens son de un solo uso.
- La interrupción cancela búsquedas pendientes y audio antiguo para que un resultado anterior no contamine el turno nuevo.
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

Última ejecución conocida antes de esta corrección:
- Workflow: [PeakScore checks #1824](https://github.com/PeakScore777/PeakScore/actions/runs/42306000153)
- Commit: `315091ae57612bce2a9cbf83f16c3ccf2f93d657`
- Resultado: éxito en pruebas Orby, TypeScript, ESLint y build de producción.

La corrección de clasificación Live/TTS y el seguimiento asíncrono Lab–VC son posteriores a ese commit. No se deben considerar validados por el CI anterior. La ejecución más reciente que incluya todos esos cambios debe pasar:
- `npm run test:orby`
- TypeScript (`tsc --noEmit`)
- ESLint
- Build de producción Next.js

Las pruebas de `tests/orby-request-filter.test.mjs` inspeccionan funciones puras e invariantes del código fuente. No simulan el proveedor Gemini Live ni sustituyen una prueba real de micrófono/WebSocket.

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
