# Auditoría de paridad visual y funcional con Studdy — 2026-11-10

## Alcance y fuentes revisadas

Fecha de revisión: **10 de noviembre de 2026**.

El usuario aclaró la correspondencia de los videos adjuntos:
- `20261110-1516-22.0507107.mp4`: video de PeakScore/Orby.
- `studdy.mp4`, `studdy (2).mp4`, `studdy (3).mp4`, `studdy (4).mp4`, `studdy (5).mp4`: referencias de Studdy.

Se revisaron los seis archivos completos y se contrastaron fotogramas de la clase, el chat abierto, el tablero y los controles. No asumir que el video `2026...` es una referencia de Studdy.

## Hallazgos confirmados en los videos

### PeakScore (video 2026...)
1. La hoja permanece vacía durante una parte relevante de la sesión.
2. La respuesta hablada aparece como una cápsula/transcripción extensa en la zona inferior, en vez de subtítulos breves que acompañen el turno actual.
3. El tablero puede mostrar una frase aislada en una posición demasiado pequeña y con mucho espacio vacío.
4. Los apoyos visuales no alcanzan el nivel de claridad, composición y detalle de las ilustraciones de Studdy.
5. La apertura del chat y su composición no reproducen el drawer de referencia.
6. Los controles no tienen todavía la misma distribución compacta de la referencia.

### Studdy (videos de referencia)
1. El tablero es una hoja blanca continua, amplia y sin tarjetas decorativas.
2. El título aparece manuscrito en la parte superior izquierda.
3. El profesor explica el tema oralmente y escribe progresivamente ideas cortas mientras habla.
4. Los dibujos científicos son grandes, reconocibles, etiquetados y relacionados con la explicación; pueden coexistir con anotaciones en otras zonas de la hoja.
5. El chat se abre como un panel superpuesto desde el borde izquierdo, sin sustituir la clase ni reducir el lienzo. Contiene el historial de turnos y un campo de escritura persistente en la parte inferior.
6. La composición del chat es ligera: panel blanco, cierre arriba, mensajes compactos y compositor tipo píldora.
7. Controles inferiores: identidad/avatar y accesos de conversación/pausa/audio a la izquierda; teclado/chat y micrófono a la derecha. La hoja sigue siendo el foco.
8. Los subtítulos del profesor son una ventana breve de la frase actual, no la transcripción acumulada del turno entero.
9. La interrupción permite introducir una pregunta y continuar en el mismo espacio de clase.

## Cambios aplicados en esta revisión

### Commit `eba06c2`
Archivo: `components/aprender/LessonAITutor.tsx`
- El subtítulo se limita a una ventana móvil de hasta 17 palabras y aproximadamente 132 caracteres.
- Se eliminó la línea acumulativa separada de transcripción del estudiante en el área de subtítulos de la clase.
- El chat pasa a un drawer blanco superpuesto por la izquierda, con cierre compacto y compositor persistente.
- La animación de apertura usa una transición más marcada de entrada lateral y revelado, sin cambiar el tamaño del tablero.

### Commit `720ac59`
Archivo: `lib/ai/orby-class-start.ts`
- Se reforzó el primer turno para exigir una explicación oral inmediata, título exacto y progresivo, y desarrollo didáctico estructurado.
- Se pide escribir solo ideas clave, no transcribir todo el discurso.
- Se reforzaron las exigencias de ortografía, legibilidad, composición, proporciones, etiquetas y exactitud visual.
- Se indica simplificar con honestidad si no se puede representar una estructura con precisión.

### Commit `890b6ec`
Archivo: `app/api/orby/realtime-session/route.ts`
- Se añadió una regla de control de calidad antes de emitir snapshots: ortografía, exactitud de etiquetas, proporciones, flechas correctas, ausencia de superposiciones, legibilidad y composición adaptada al tipo de tema.
- Se especifica que los temas abstractos deben usar mapas de relaciones, comparaciones o líneas de tiempo, no dibujos científicos falsos.
- Se prioriza precisión y claridad sobre complejidad decorativa.

## Estado técnico y limitaciones que siguen abiertas

**Estos cambios son una iteración de mejora, no una certificación de paridad completa.** No declarar que Orby ya iguala o supera a Studdy hasta completar pruebas visuales y funcionales reales.

Pendientes prioritarios:
1. Reproducir el drawer de Studdy con el timing, posición y estados exactos de apertura/cierre; comprobar escritorio y móvil.
2. Añadir/validar los controles inferiores equivalentes: avatar, chat, pausa/reanudar audio del profesor, control de sonido, teclado y micrófono. No simular botones que no tengan una acción real.
3. Comprobar que el subtítulo se reinicia por generación/interrupción y sigue el audio actual sin repetir frases. Verificar sincronía palabra/voz si se mantiene karaoke.
4. Revisar la calidad real de cada visual tipado y del sketch: geometría, escalas, etiquetas, texto, flechas, orden de escritura y animación. Evitar que coordenadas mal generadas produzcan dibujos deformes.
5. Revisar la ruta de generación de imágenes, modelo/servicio permitido, cuotas gratuitas, resolución, compresión, persistencia y fallback. No introducir APIs de pago, créditos facturables ni fallbacks de pago; si no hay cuota gratuita disponible, informar con claridad.
6. Hacer que el flujo se adapte a cualquier tema: ciencias, matemáticas, historia, lectura, economía, gramática y conceptos abstractos. Elegir un tipo de visual adecuado al contenido; no forzar una plantilla científica única.
7. Validar ortografía y terminología de los bloques antes de publicarlos en el tablero. La instrucción al modelo por sí sola no es una garantía; añadir validación y pruebas.
8. Verificar que cada interrupción detenga voz y trazos atrasados, preserve el tablero, acepte texto desde el chat lateral y retome desde el último concepto sin duplicar ni borrar contenido.
9. Probar con grabaciones de navegador: voz, micrófono, permisos, latencia, audio de salida, transcripción, subtítulos, chat y dibujo en una misma sesión.
10. Ejecutar tests, lint, TypeScript y build; corregir regresiones y actualizar este documento con cada nueva iteración.

## Criterios de aceptación para declarar paridad

- El tablero comienza a enseñar en los primeros segundos: título progresivo, voz inmediata y primera idea/visual en paralelo.
- La hoja permanece continua y limpia; contenido escrito y dibujos aparecen por etapas, sin solapamientos ni bloques minúsculos.
- El dibujo es pedagógicamente correcto y legible, no un garabato o un conjunto de formas sin relación.
- El drawer abre desde la izquierda con animación, se superpone sin desplazar la hoja, conserva el historial y permite escribir y enviar mientras la clase sigue activa.
- Los controles de voz/chat/audio tienen posición, estados accesibles y acciones reales.
- Los subtítulos muestran únicamente el fragmento actual del profesor y no se acumulan entre turnos.
- Interrumpir funciona en cualquier momento; la voz se detiene, el alumno pregunta y el profesor continúa sin borrar el tablero.
- El comportamiento se mantiene en varios temas de naturaleza distinta, no solo en mitosis.
- Las pruebas automatizadas y una prueba audiovisual manual confirman el flujo completo.

## Contexto de continuidad del proyecto

- Fuente de verdad del código: GitHub, rama `feat/founder-intro`.
- No modificar `main` sin autorización explícita.
- Mantener la restricción de presupuesto: solo modelos/servicios que operen dentro de cuotas gratuitas reales; nunca fallback silencioso facturable.
- No reconstruir material de Orby ICFES Lab que fue eliminado intencionalmente.
- Los cambios deben probarse antes de afirmar que están listos para pull.
- Este documento es la bitácora de paridad del 10-11-2026. Añadir commits, pruebas y resultados posteriores aquí, sin borrar los hallazgos anteriores.

## Segunda pasada de pulido — 10 de noviembre de 2026

- `components/aprender/LessonAITutor.tsx`: el chat se acerca más al drawer observado en Studdy (superposición izquierda, cabecera mínima, cierre compacto, compositor persistente y animación de revelado lateral). Los subtítulos ya no muestran la transcripción del alumno; muestran una ventana móvil de 17 palabras del profesor y conservan la correspondencia del índice de karaoke con la transcripción completa.
- `lib/ai/orby-class-start.ts`: reforzada la instrucción de primera clase para redacción, ortografía, secuencia didáctica y precisión visual.
- `app/api/orby/realtime-session/route.ts`: añadida una regla universal de control de calidad de la pizarra, con selección de visual apropiada para materias científicas y abstractas.
- `app/api/orby/generate-image/route.ts`: reforzada la dirección de arte para FLUX.1 Schnell: ilustración editorial didáctica, líneas limpias, sujeto grande, fondo claro y sin texto generado dentro de la imagen (para evitar pseudoetiquetas y errores ortográficos). Se conserva el proveedor ya configurado y el límite gratuito; no se habilita ningún fallback de pago.

Commits adicionales:
- `96fa009` — dirección de arte de imágenes educativas.
- `1435445` — tests actualizados para subtítulos móviles.
- `6343d85` — corregido el cierre de cadena de la instrucción de calidad visual.

Verificación:
- En el despliegue de commit `1435445`, **315/315 pruebas automatizadas pasaron**. La compilación posterior detectó una cadena sin cerrar en la nueva instrucción de `route.ts`; el error se corrigió en `6343d85`.
- El build del commit `6343d85` está en ejecución al momento de esta actualización.
- No se ha realizado todavía una prueba manual nueva de micrófono/altavoz ni se ha certificado paridad audiovisual completa.

## Tercera iteración — controles de llamada — 10 de noviembre de 2026

Archivo: `components/aprender/LessonAITutor.tsx`

- Se añadió una identidad compacta del profesor en el pie de la llamada (inicial, nombre y estado de conexión).
- Se separó el silenciamiento de salida del profesor del silenciamiento del micrófono del estudiante. Antes, el único control disponible silenciaba la pista de entrada del micrófono, no el audio que el estudiante escucha.
- Se creó una ganancia de salida Web Audio compartida para las fuentes de audio de Gemini Live y del TTS validado. El control de altavoz aplica una transición suave de ganancia, sin detener el micrófono ni cortar la sesión.
- La limpieza del contexto elimina la referencia a la ganancia para evitar reutilizar un nodo de audio ya cerrado.
- Se añadió una prueba de regresión que comprueba la ruta de audio independiente y la accesibilidad de ambos controles.

Commit de esta iteración: `fd3d86d`.
Prueba añadida: commit `f48db49`.

**Precaución de alcance:** la llamada alternativa `OmegaXFreeVoiceTurn` tiene un componente separado y no recibe aún este control; la modificación cubre la ruta Gemini Live/TTS de la clase principal. Hay que revisar esa ruta por separado antes de afirmar que todas las llamadas tienen el mismo comportamiento.

## Estado de verificación tras la tercera iteración

El despliegue anterior `dpl_5AF43EttXUUcfb6NPWdAYQRZzKrt`, correspondiente al commit `6343d85`, terminó en estado **READY** y sus logs muestran **315/315 pruebas** del comando `test:orby` aprobadas. Ese despliegue no contiene el control nuevo (se generó antes de `fd3d86d`).

El commit `f48db49` añade una prueba nueva. Esperar el despliegue de ese commit y confirmar el total actualizado, el build y el estado READY antes de darlo por validado.

Pendiente de prueba manual: iniciar clase, silenciar/activar únicamente al profesor, verificar que el micrófono sigue enviando audio, silenciar/activar únicamente el micrófono, probar barge-in, pausar/reanudar y finalizar la llamada. Probar también la ruta `OmegaXFreeVoiceTurn`.

### Bloqueo de verificación — 10 de noviembre de 2026 (última actualización)

- La rama contiene el commit de código `fd3d86d` y la prueba de regresión `f48db49`; el documento se actualiza en `58af9cb`.
- Se solicitó una compilación de Preview para el commit de documentación `58af9cb`, pero Vercel rechazó la creación con HTTP 402: límite gratuito de más de 100 despliegues API en 24 horas (`api-deployments-free-per-day`). El check Vercel de `f48db49` refleja ese límite, no un fallo de TypeScript o de las pruebas.
- No se puede afirmar que la nueva prueba pase ni que el código más reciente compile: el último resultado READY disponible es anterior a los cambios de control de audio y documentales.
- No se intentará eludir el límite ni cambiar el plan. Para volver a verificar, esperar al restablecimiento del límite o ejecutar el build desde el entorno local del proyecto con sus dependencias instaladas.
- El último build READY anterior ejecutó `test:orby` con 315/315 pruebas. La prueba nueva de silenciamiento independiente todavía necesita ejecución.
- Se mantiene el alcance: no hacer merge a `main` ni afirmar paridad total con Studdy. El control de salida se limita a la ruta Gemini Live/TTS de `LessonAITutor`; `OmegaXFreeVoiceTurn` requiere su propia auditoría.

## Cuarta iteración — audio independiente en la ruta de voz alternativa — 10 de noviembre de 2026

Archivos:
- `components/aprender/OmegaXFreeVoiceTurn.tsx`
- `tests/orby-request-filter.test.mjs`

Hallazgo: la ruta alternativa de voz usa `window.speechSynthesis`, no el grafo Web Audio de la clase Gemini Live. Por eso el control de salida implementado en `LessonAITutor` no silenciaba esa modalidad.

Cambios:
- Se añadió un control accesible para silenciar/reactivar únicamente la salida hablada del profesor en la ruta alternativa.
- Al silenciar, se cancela inmediatamente cualquier lectura en curso; la grabación del estudiante y el envío de audio no se detienen.
- El botón de reproducir respuesta queda deshabilitado mientras la salida esté silenciada.
- Se usa un ref síncrono como fuente de verdad para el silencio: evita que una respuesta asíncrona que termine de procesarse justo después de silenciar reproduzca audio por una clausura de estado obsoleta.
- Se añadieron aserciones de regresión a la prueba existente de voz alternativa para comprobar la protección síncrona, el cancelado y el estado accesible del control.

Commits de código y pruebas: `b68d203`, `944e502`, `73212f1`.

Alcance: esto unifica el control de silencio en las dos rutas principales de voz de la clase. No convierte la voz alternativa basada en `speechSynthesis` en una voz neural idéntica a Gemini Live; son motores de audio diferentes.

## Verificación de la cuarta iteración

La suite de regresión está actualizada en el repositorio, pero no se ha ejecutado en este entorno. El check de Vercel sigue bloqueado por el límite de despliegues API gratuitos comunicado anteriormente. No se debe presentar el cambio como compilado ni las pruebas como aprobadas hasta ejecutar `npm run test:orby` y el build de producción en un entorno autorizado.

Pruebas manuales pendientes en ambas rutas:
1. Silenciar mientras Orby está hablando y comprobar que se corta inmediatamente.
2. Mantener el micrófono activo y confirmar que el estudiante sigue pudiendo hablar.
3. Reactivar el altavoz y comprobar una nueva respuesta hablada.
4. Silenciar mientras una respuesta se está generando para verificar que no arranque el TTS al terminar.
5. Finalizar la llamada durante una grabación y comprobar que se liberan las pistas del micrófono.

## Control de rama — comparación con main

La comparación GitHub `main...feat/founder-intro` consultada durante esta iteración devuelve `diverged`, con `feat/founder-intro` 4.581 commits por delante y 9 por detrás. La magnitud es inusual para una rama de funcionalidad; no asumir que es seguro abrir un PR de integración ni intentar un merge automático. Antes de integrar, inspeccionar los refs, el merge-base y el historial real, y determinar si la rama incluye una historia reescrita o un conjunto de commits ajenos al alcance. Esta iteración no modificó `main`.
