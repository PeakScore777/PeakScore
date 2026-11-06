# Orby VC — auditoría y bitácora

- Proyecto: PeakScore
- Rama: feat/founder-intro
- Fecha: 2026-11-06
- Estado: auditoría en curso. No desplegado ni fusionado a main.

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
- [ ] Aplicar cambios pequeños y verificables en la rama de trabajo.
- [ ] Añadir pruebas para la espera de resultados académicos.
- [ ] Añadir pruebas para evitar la degradación prematura de una sesión Live conectada.
- [ ] Ejecutar las pruebas, TypeScript, ESLint y build en el mismo commit.
- [ ] Probar en navegador conversaciones largas, interrupciones, cambios de materia y recuperación.
- [ ] Confirmar que los saludos no consultan el Lab.
- [ ] Confirmar que una pregunta académica sí usa material publicado y pertinente del Lab.

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
