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
