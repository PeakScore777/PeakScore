# Orby VC — auditoría y bitácora

- Proyecto: PeakScore
- Rama: feat/founder-intro
- Fecha: 2026-11-06
- Estado: correcciones de código con CI aprobado; pendiente validación manual de voz en navegador. No desplegado ni fusionado a main.

## Objetivo

Recuperar una conversación de voz continua y natural para el tutor Saber 11. Orby debe atender saludos, preguntas, seguimientos, cambios de materia e interrupciones. Debe consultar el material publicado del Orby Lab cuando la pregunta académica lo requiera, sin hacer búsquedas innecesarias en cada turno.

## Restricciones

- Usar únicamente modelos y servicios dentro de cuotas gratuitas reales.
- No introducir APIs facturables ni cambios silenciosos a proveedores pagos.
- Si una cuota gratuita se agota, informar con claridad y conservar el contexto.
- Mantener el alcance educativo Saber 11 y las cinco áreas.
- No reconstruir material del Orby ICFES Lab que fue eliminado intencionalmente.

## Hallazgos del código revisado

### Herramienta de conocimiento

La declaración de la búsqueda académica en tiempo real no explicitaba el comportamiento de bloqueo. En una sesión Live, una búsqueda no bloqueante puede permitir que el modelo continúe hablando antes de recibir los fragmentos recuperados. Hay que asegurar que las respuestas académicas que necesitan el Lab integren el resultado de la búsqueda antes de continuar.

### Degradación a voz por turnos

El cliente tenía un watchdog de 50 segundos que podía cambiar una sesión a voz por turnos. Ese camino utiliza un servicio TTS separado, cuya cuota gratuita no es la misma que la cuota de la sesión Live. Por eso un error de cuota TTS no demuestra por sí solo que Live haya agotado su cuota.

### Reanudación

El cliente conserva un identificador de reanudación de sesión y restaura el historial. Este recorrido necesita pruebas reales tras cierres de WebSocket, avisos de cierre del proveedor y respuestas largas.

### Filtros

Los filtros deben detener solicitudes claramente ajenas al tutor, pero dejar pasar saludos, confirmaciones, lenguaje cotidiano, preguntas cortas y seguimientos académicos. Una búsqueda del Lab no debe ser obligatoria para cada frase.

## Plan de trabajo

- [x] Revisar la ruta principal de voz, la sesión en tiempo real, el respaldo TTS y la búsqueda de conocimiento.
- [x] Identificar que la búsqueda del Lab no declaraba explícitamente una espera bloqueante.
- [x] Identificar el watchdog de 50 segundos y su relación con el respaldo TTS.
- [x] Aplicar cambios pequeños y verificables en la rama de trabajo.
- [x] Añadir pruebas para la espera de resultados académicos.
- [x] Añadir pruebas para evitar la degradación prematura de una sesión Live conectada.
- [ ] Ejecutar las pruebas, TypeScript, ESLint y build en el mismo commit.
- [ ] Probar en navegador conversaciones largas, interrupciones, cambios de materia y recuperación.
- [ ] Confirmar que los saludos no consultan el Lab.
- [ ] Confirmar que una pregunta académica sí usa material publicado y pertinente del Lab.

## Cambios ya aplicados en la rama

- La herramienta `search_orby_learning_knowledge` declara `Behavior.BLOCKING`: Gemini Live espera la respuesta de la búsqueda antes de continuar el turno.
- El watchdog conserva la sesión si `voiceChannelRef.current` sigue conectado al alcanzar 50 segundos y concede una ventana adicional de 70 segundos.
- Solo se considera el respaldo por turnos si la sesión no está conectada o si el segundo plazo también expira.
- Se añadieron pruebas estáticas para la espera de la herramienta y el comportamiento del watchdog.
- Estos cambios están en `feat/founder-intro`; todavía no se han validado con CI ni con una prueba manual de navegador.

## Resultado de CI — 2026-11-06

Commit validado: `cef451f36889ca449448f3046c01e20db86a0ff2`.

Ejecución de GitHub Actions: https://github.com/PeakScore777/PeakScore/actions/runs/42300838516

- Pruebas de regresión de Orby: aprobadas.
- TypeScript: aprobado.
- ESLint: aprobado.
- Build de producción Next.js: aprobado.
- Auditoría de dependencias: completada correctamente.
- La compuerta de auditoría de dependencias se omitió porque el flujo no necesitó aplicar una actualización adicional.

**Alcance de esta validación:** el job ejecutó `npm run test:orby` (`node --test tests/orby-request-filter.test.mjs`), TypeScript, ESLint y el build. Las pruebas de regresión nuevas inspeccionan el código fuente y sus invariantes; no simulan una sesión Gemini Live real ni demuestran por sí solas conversación prolongada, audio, reconexión o recuperación de cuotas. Esos escenarios requieren validación manual/integración en navegador.

## Estado de validación

- [x] CI completo aprobado en el commit de código `cef451f36889ca449448f3046c01e20db86a0ff2`.
- [x] La actualización posterior de este documento no modifica código ejecutable.
- [ ] Prueba manual de voz continua en Chrome.
- [ ] Prueba de interrupción mientras Orby habla.
- [ ] Prueba de reconexión por `goAway` y cierre de WebSocket.
- [ ] Prueba de consulta del Lab con una pregunta real y revisión de fragmentos utilizados.
- [ ] Prueba de cuotas gratuitas agotadas sin fallback facturable.

## Criterios de aceptación

1. Una sesión Live conectada no cambia prematuramente al respaldo TTS por un timeout corto.
2. Una pregunta académica que necesita el Lab espera el resultado antes de completar la explicación.
3. Los saludos y confirmaciones no disparan búsquedas innecesarias.
4. Una interrupción no permite que resultados de una pregunta anterior contaminen el turno actual.
5. La reanudación conserva la conversación y no duplica mensajes.
6. Los límites gratuitos se comunican con precisión y nunca activan servicios facturables.
7. El mismo commit pasa pruebas, TypeScript, ESLint y build antes de considerarse listo.

## Seguridad y alcance

Los documentos recuperados del laboratorio se consideran material de referencia, no instrucciones para modificar las reglas del tutor. No deben poder cambiar políticas, filtros ni configuración del sistema.

No se modifican secretos, permisos de cuenta, ajustes de facturación ni producción como parte de esta auditoría.
