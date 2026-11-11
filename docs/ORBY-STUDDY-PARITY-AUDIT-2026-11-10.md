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
- `app/api/orby/generate-image/route.ts`: reforzada la dirección de arte para FLUX.1 Schnell: ilustración editorial didáctica, líneas limpias, sujeto grande, fondo claro y sin texto generado dentro de la imagen (para evitar pseudoetiquetas y errores ortográficos). Se conserva el proveedor ya configurado y su cuota gratuita real; no se habilita ningún fallback de pago.

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

## Quinta iteración — legibilidad de diagramas celulares — 10 de noviembre de 2026

Archivos:
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`

Hallazgo: el renderizador de células ubicaba todas las etiquetas debajo de cada organelo, con el mismo tamaño y sin distribuirlas según la zona del dibujo. En composiciones densas esto provocaba cruces y superposición de nombres, haciendo que un esquema biológico pareciera desordenado.

Cambio:
- Se distribuyen las etiquetas en cuatro bandas (izquierda, derecha, superior e inferior) según la posición del organelo.
- Cada etiqueta recibe una posición separada dentro de su banda y un conector fino hacia el elemento correspondiente.
- Se conserva el anclaje de foco del profesor en la estructura real, no en la etiqueta reubicada.
- Se añadió una prueba de regresión estática para la distribución, las líneas guía y la preservación del foco.

Commits: implementación `6fd739f`; prueba `ecc0ef8`.

Alcance: mejora la legibilidad del componente de célula (animal, vegetal y procariota). No constituye una validación anatómica completa de cada ilustración ni resuelve por sí sola todos los tipos de diagramas. Deben revisarse por separado moléculas, circuitos, sistemas orgánicos, neuronas, gráficas y dibujos libres.

## Verificación de la quinta iteración

- Código y prueba están guardados en `feat/founder-intro`.
- La prueba nueva aún no se ha ejecutado en este entorno.
- Vercel continúa reportando el bloqueo por límite gratuito de despliegues API; no se afirma build verde ni suite aprobada para estos commits.
- Antes de aceptar la mejora visual, probar en navegador con células de 6–14 organelos y comprobar que los conectores no cruzan texto, que las etiquetas caben en móvil y que el profesor puede señalar cada estructura.
- La rama sigue sin integrarse a `main`; la divergencia de 4.581/9 reportada en la iteración anterior requiere auditoría independiente antes de abrir integración.

## Sexta iteración — geometría y notación molecular — 10 de noviembre de 2026

Archivos:
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`

Hallazgos en el renderizador de moléculas:
- Los enlaces llegaban hasta el centro de los átomos y quedaban dibujados por debajo de los círculos.
- Los enlaces dobles y triples se desplazaban con una separación fija, sin considerar la dirección real del enlace.
- Las cargas aparecían pegadas al símbolo del elemento, con riesgo de leerse como parte de la abreviatura.

Cambios:
- Los enlaces ahora se recortan usando el radio de los átomos y la dirección normalizada entre ambos centros.
- Los enlaces simples, dobles y triples conservan líneas paralelas equidistantes y centradas.
- La paleta de átomos distingue H, C, N, O, F/Cl, Br, I, S y P; elementos no contemplados mantienen un color neutro.
- Las cargas se muestran como superíndice visual separado, sin alterar el símbolo químico.
- Se conserva el foco interactivo para que Orby pueda señalar cada átomo.

Commits: implementación `41aa396`; prueba de regresión `90e567f`.

Alcance y cautela: esto mejora la presentación esquemática; no calcula geometría molecular, ángulos de enlace, longitudes reales, estereoquímica ni valencias. La exactitud química sigue dependiendo de los datos de entrada generados y validados. No se debe presentar como editor molecular ni como representación científica a escala.

## Verificación de la sexta iteración

- Código y prueba guardados en `feat/founder-intro`.
- La prueba añadida todavía no se ha ejecutado; no afirmar suite aprobada.
- Vercel sigue bloqueando la comprobación de despliegue por límite de uso.
- Falta revisión visual en navegador con enlaces simples, dobles, triples, cargas y moléculas con muchos átomos; comprobar que el recorte no deja huecos visibles ni etiquetas solapadas.
- `main` permanece intacta y no se ha abierto integración.

## Corrección posterior — dos fallos de regresión — 10 de noviembre de 2026

Se revisó la salida local de `npm run test:orby`: 316 pruebas aprobadas y 2 fallidas.

Correcciones guardadas:
- `components/aprender/OrbyBoard.tsx`: el renderizador molecular ahora expresa explícitamente los órdenes 1, 2 y 3; órdenes no reconocidos no dibujan enlaces.
- `tests/orby-request-filter.test.mjs`: la comprobación de accesibilidad busca la etiqueta de micrófono dentro de la expresión condicional anidada que realmente usa el botón, sin exigir que sea una condición ternaria aislada.

Commits: `be8e29a` (renderizador), `356f196` (prueba).

La salida adjunta también muestra que el segundo fallo era una expectativa demasiado estricta de la prueba: el botón ya contiene las etiquetas correctas en una expresión condicional más amplia. La corrección ajusta la aserción, no elimina la etiqueta accesible.

Estado: correcciones subidas; falta volver a ejecutar `npm run test:orby` en el entorno del proyecto y confirmar los 318 resultados. No declarar aprobado hasta ver esa nueva ejecución.

## Referencia audiovisual recibida — vídeo 20261110-1551-41.8276821.mp4 — 10 de noviembre de 2026

Duración inspeccionada: 281.27 s (4 min 41 s). La grabación muestra el flujo de entrada de Studdy y una clase en su lienzo de escritura. Se registran únicamente comportamientos visibles; no se infiere ni se afirma conocer el código o los servicios internos propietarios de Studdy.

### Comportamientos visuales que deben guiar la paridad

1. Entrada: pantalla de inicio con fondo degradado pastel, selector de modalidad (tema / preparación para exámenes / tarea), campo grande para describir qué aprender y acción de comenzar. Durante la preparación, el formulario comunica el estado sin perder el tema.
2. Transición a clase: se entra a un lienzo blanco despejado. La clase no se presenta como un chat con tarjetas; el tablero es el foco.
3. Encabezados: escritura manuscrita negra, tamaño destacado, resaltado amarillo suave y aparición progresiva.
4. Contenido: el profesor va construyendo notas en columnas/zonas de una superficie amplia; no se limita a una lista vertical de bloques.
5. Ilustración y código: ejemplos SVG aparecen como elementos legibles dentro del tablero; después se muestra una explicación visual de arquitectura con nube/modelo, JSON, interfaz y salidas (texto, fórmula y SVG).
6. Anotación: se observan trazos azules de énfasis/círculos sobre palabras y una punta de lápiz asociada al momento de escritura.
7. Superficie espacial: el lienzo permite desplazarse por contenido que queda fuera del viewport. El desplazamiento no borra lo ya escrito; la composición conserva relación entre notas, ejemplos y dibujos.
8. Interacción de clase: avatar del profesor abajo a la izquierda; controles de chat, pausa y volumen junto a él. Teclado y micrófono en el extremo inferior derecho. Los subtítulos del profesor se mantienen en una banda inferior discreta.
9. El contenido del ejemplo cambia durante la sesión y se amplía sin reemplazar las secciones previas; la explicación hablada y el tablero avanzan juntos.

### Diferencias concretas encontradas en PeakScore

- El renderer actual soporta composición espacial version 2/3, pero el modelo v3 divide el contenido en hojas 16:9 apiladas verticalmente y muestra navegación de hojas, zoom y botón «Mover pizarra». La referencia observada se siente como un lienzo amplio y continuo con desplazamiento espacial, no como una secuencia de páginas con controles de administración visibles.
- Los elementos actuales se revelan por bloques/etapas; esto no garantiza una escritura sincronizada a nivel de trazo/palabra con la voz para títulos, párrafos, código y diagramas.
- La mayoría de diagramas tipados son SVG esquemáticos en viewBox 100x100 con límites de tamaño; la referencia muestra elementos visuales de mayor escala y composición editorial dentro del lienzo.
- El diseño de la clase todavía tiene herramientas explícitas de zoom, navegación y exportación que no coinciden con la interfaz mínima observada.
- La transcripción actual tiene ventana móvil, pero debe comprobarse visualmente que sea una sola línea/banda discreta, no una acumulación de subtítulos.
- El flujo de chat, pausa, volumen, teclado y micrófono requiere comparación de posición, expansión y estados contra la referencia; las pruebas estáticas no demuestran paridad visual ni interacción real.

### Especificación de implementación para la siguiente fase

- Separar el lienzo de clase del historial/chat: el lienzo debe permanecer montado y conservar scroll/posición cuando se abre el chat.
- Adoptar una superficie continua de gran tamaño con coordenadas espaciales estables; agregar contenido a la derecha/debajo según la composición, sin repaginar ni reescribir etapas anteriores.
- Mantener tipografía manuscrita consistente, títulos con marcador amarillo y jerarquía de tamaños como en la referencia.
- Sincronizar voz, subtítulo, lápiz y escritura: primero nombrar el tema, escribir el título progresivamente y luego desarrollar teoría en fragmentos pedagógicos; una interrupción pausa la generación/reproducción pero conserva la tinta y el texto ya completados.
- Los diagramas deben componerse en la misma superficie, con dimensiones adecuadas, etiquetas legibles y trazos/énfasis que el profesor pueda señalar.
- El chat debe abrir como panel superpuesto con transición, input libre persistente y cierre accesible, sin sustituir ni limpiar el tablero.
- Reubicar los controles de llamada en una barra inferior estable: profesor/chat/pausa/volumen a la izquierda; teclado/micrófono a la derecha; subtítulos centrados y sin historial acumulativo.
- Mantener accesibilidad, teclado, reduced-motion, seguridad SVG, validación de contenido y presupuesto gratuito. No replicar marcas, recursos privados, código ni servicios internos de Studdy.

### Criterios de aceptación

- Iniciar clase con tema libre; el profesor pronuncia el tema antes de la teoría.
- Título escrito de forma progresiva con marcador visual, sin duplicación.
- La teoría aparece por fragmentos sincronizados con voz; los dibujos se integran en el punto pedagógico correcto.
- El contenido anterior permanece idéntico tras scroll, chat, pausa, interrupción y reanudación.
- Chat abre/cierra con animación y no altera scroll ni dimensiones del lienzo.
- Subtítulos muestran solo el fragmento activo y no se acumulan.
- Controles de micrófono y volumen independientes, con labels accesibles y estados perceptibles.
- Probar varios temas de las cinco áreas Saber 11 y temas con fórmulas, diagramas, imágenes y código SVG seguro.
- Validación manual en navegador y suite completa; no basta con pruebas regex o snapshots.

Estado: referencia documentada. Esta especificación no implica que la paridad ya esté implementada ni que se haya probado. El archivo de vídeo permanece como referencia de la conversación; no se ha copiado ningún recurso propietario de Studdy.

## Inicio de implementación — iteración 1: encabezados del lienzo espacial — 10 de noviembre de 2026

Se inicia la ejecución sobre la rama `feat/founder-intro`, no solo documentación.

Hallazgo: el CSS de `.orby-board-layout-heading` mostraba los títulos de las composiciones espaciales con subrayado rojo, un tamaño relativamente pequeño y sin el marcador amarillo que caracteriza los encabezados observados en la referencia audiovisual. El título general tenía un tratamiento de resaltador separado, pero los títulos dentro del contenido no.

Cambio en `app/globals.css`:
- Encabezado espacial ahora tiene jerarquía tipográfica mayor y adaptable al ancho del lienzo.
- Se elimina el subrayado rojo.
- Se agrega marcador amarillo suave detrás del texto, con inclinación leve y bordes irregulares.
- Se conserva el reveal progresivo existente y el comportamiento de escritura del componente.
- El resaltado se limita a la caja del título para no pintar toda la columna.

Prueba añadida en `tests/orby-request-filter.test.mjs` para comprobar tamaño adaptable, ausencia de subrayado y presencia del marcador amarillo.

Commits: CSS `d51662e`; regresión `33363de`.

Alcance: es el primer ajuste visual pequeño, no la paridad completa. No modifica aún el modelo de composición, la sincronización de voz/palabras, el scroll persistente ni el chat/controles. Requiere inspección visual en navegador para comprobar que el marcador no tapa letras y que títulos largos se ajustan correctamente.

Verificación: prueba añadida pero no ejecutada aquí; no afirmar build ni suite aprobada.

## Iteración 2 — lienzo continuo en modo clase — 10 de noviembre de 2026

Archivo modificado: `app/globals.css`.

Hallazgo: el modo de clase utilizaba una pila de hojas 16:9 con separación amplia, encabezados "CLASE · HOJA" y navegación visible. Aunque compartían el scroll, la interfaz se percibía como páginas separadas y no como el lienzo continuo de la referencia.

Cambio:
- En `.orby-class-board` se oculta la navegación de hojas y sus encabezados editoriales.
- Se eliminan los espacios entre regiones consecutivas.
- Cada hoja conserva el fondo blanco, sin bordes, radios ni sombras, para que la unión visual sea discreta.
- Se mantienen las secciones y coordenadas subyacentes, por lo que no se borra contenido ni se cambia la estructura persistida. La navegación y el layout de otras vistas no se alteran.

Se añadió una prueba de regresión para el modo de clase continuo. Commits: CSS `35ce53e`; prueba `ed32fcb`.

Limitación conocida: esto elimina el chrome y la separación visual, pero las superficies siguen siendo hojas 16:9 concatenadas verticalmente. No es todavía un lienzo de coordenadas ilimitadas; falta evolucionar el modelo de layout y la colocación incremental sin invalidar snapshots existentes. Tampoco se ha probado en navegador.

Verificación: prueba agregada, aún sin ejecución; build no verificado. No declarar paridad completa ni pedir pull.

## Iteración 3 — ritmo de escritura progresiva — 10 de noviembre de 2026

Archivo modificado: `components/aprender/OrbyBoard.tsx`.

Hallazgo: `getHandwritingRevealStyle` calculaba la duración como `text.length * 0.022`, con un máximo de 2.8 s. Para párrafos de teoría, la animación terminaba demasiado rápido y se percibía como un bloque que se destapa, no como escritura acompañando una explicación.

Cambio:
- Se elevó el ritmo estimado a 55 ms por carácter, con mínimo 0.9 s y máximo 10 s.
- Se conserva la animación existente de revelado y su pausa mediante `drawingActive`; no se cambia el estado de la voz ni se reinicia el contenido.
- Se agregó prueba de regresión para la fórmula y la duración aplicada.

Commits: renderer `c33e19a`; prueba `3c52017`.

Límite importante: esta duración es una aproximación visual basada en longitud, no una sincronización fonema/palabra con el audio real. La sincronización exacta exige recibir eventos temporizados de voz o timestamps confiables y asociarlos a segmentos del tablero; no debe afirmarse que ya existe. En una explicación con pausas largas, el texto podría terminar antes o después de la voz. Debe validarse con grabaciones reales y pruebas de interrupción/reanudación.

Verificación: prueba añadida, no ejecutada aquí. Build pendiente; no declarar aprobación ni paridad completa.

## Iteración 4 — incorporación incremental de frases habladas — 10 de noviembre de 2026

Archivo principal: `components/aprender/LessonAITutor.tsx`.

Hallazgo: el fallback de voz publicaba una única actualización por generación. Si el modelo emitía la teoría en varias frases, las frases posteriores no se incorporaban al tablero. Además, la ruta anterior de continuación creaba hojas nuevas para cada actualización completa, sin distinguir texto ya escrito de texto recién recibido.

Cambio:
- Se mantiene un cursor de transcripción ya incorporada por generación de voz.
- Se procesan únicamente frases que terminan en puntuación, evitando revelar palabras a medio recibir.
- Se comprueba que el transcript acumulativo siga comenzando por el texto ya confirmado; si cambia de forma inesperada, se evita duplicar o reescribir contenido.
- Cada frase completa nueva se añade como una etapa acumulativa independiente mediante la ruta de continuación existente. No se mutan ni truncan bloques previos.
- El cursor se reinicia al cambiar de generación/actividad de voz.

Prueba añadida en `tests/orby-request-filter.test.mjs` para comprobar el cursor, el corte por frases completas y la ruta append-only.

Commits: implementación `c38f8f7`; prueba inicial `88e990b`; conservación append-only `031d15b`; ajuste de prueba `69bad45`.

Limitaciones: esto hace incremental la publicación del fallback basado en transcripción, pero no sincroniza palabra por palabra con el audio ni reemplaza los eventos temporizados de voz. La ruta de continuación conserva los límites actuales del tablero (hasta cuatro hojas/23 bloques); al alcanzar el límite, no se puede garantizar incorporación ilimitada. Deben probarse reinicios, interrupciones, transcripciones corregidas por el proveedor, frases sin puntuación y contenido largo.

Verificación: pruebas y build no ejecutados en esta sesión. La prueba añadida requiere revisión/ejecución local; no declarar la iteración aprobada ni pedir pull.

## Iteración 5 — ilustraciones fundamentadas en la explicación — 10 de noviembre de 2026

Archivo principal: `components/aprender/LessonAITutor.tsx`.

Hallazgo: la generación inicial de imágenes enviaba un prompt genérico construido casi exclusivamente con el tema. Aunque la petición incluía contexto separado para el servidor, las instrucciones visuales no obligaban a ilustrar el concepto que el profesor acababa de explicar; podía producir una imagen decorativa, genérica o poco conectada con la teoría.

Cambio:
- El prompt se construye ahora con el tema, la transcripción hablada disponible y el contenido que ya está en la pizarra.
- Pide una ilustración pedagógica concreta, no un collage decorativo.
- Da instrucciones específicas para procesos, anatomía y relaciones científicas/matemáticas.
- Exige etiquetas breves en español y prohíbe inventar cifras, nombres, estructuras o relaciones.
- Se mantiene la ruta existente de generación y el control de cuota gratuita; no se introduce un proveedor ni un servicio facturable nuevo.
- Prueba de regresión añadida para verificar que el prompt usa el contexto real de clase.

Commits: prompt `1e5e061`; prueba `bd38c5d`.

Limitación: mejorar el prompt no garantiza por sí solo fidelidad anatómica/científica, ortografía perfecta ni calidad visual uniforme. La generación de imagen puede cometer errores; el resultado debe revisarse y, cuando sea posible, preferirse un esquema SVG validado de la biblioteca visual para conceptos estructurados. La generación sigue sujeta a disponibilidad y cuotas gratuitas.

Verificación: cambios y prueba guardados; no ejecuté suite, build ni inspección visual de la imagen generada en navegador. No declarar aprobación ni paridad total.


## Iteración 6 — continuidad real del fallback de voz — 10 de noviembre de 2026

Hallazgo confirmado al revisar el constructor, no solo la bitácora: aunque el fallback preservaba los bloques anteriores, creaba una hoja nueva por cada frase completa y rechazaba toda continuación al llegar a cuatro hojas. En una clase normal esto podía dejar frases habladas sin representación en el tablero, incluso cuando la hoja actual todavía tenía espacio.

Cambio en `components/aprender/LessonAITutor.tsx`:
- La continuación busca regiones libres en la hoja más reciente antes de crear otra.
- La composición usa zonas laterales cuando la apertura ocupa media hoja y filas de ancho completo cuando la hoja está vacía.
- Las nuevas regiones se comprueban contra los elementos ya publicados con un margen de seguridad; no se pisan texto, diagramas ni imágenes.
- Se conserva el orden de secuencia, los índices y los IDs existentes. Los IDs nuevos se derivan de la secuencia y del índice de bloque, no del reloj.
- Solo se crea una hoja nueva cuando no existe una región segura, la hoja llega a 12 elementos o la versión 2 alcanza su límite de ocho bloques.
- Se conserva el máximo de cuatro hojas, 24 bloques y 32 elementos que ya valida el sanitizador. El contenido anterior no se modifica.
- Se mantiene compatibilidad: la pizarra sigue en versión 2 mientras cabe en una hoja; pasa a versión 3 únicamente cuando necesita una segunda hoja o supera el límite de la estructura v2.

Prueba de regresión añadida en `tests/orby-request-filter.test.mjs` para verificar búsqueda de espacio libre, comprobación de solapamientos, límite de elementos por hoja, crecimiento condicional y compatibilidad v2/v3.

Alcance: corrige el crecimiento del fallback de transcripción. No convierte todavía las hojas persistidas v3 en un lienzo espacial ilimitado ni resuelve el límite global actual de cuatro hojas. No modifica imágenes ni consume cuota adicional.

Verificación: el código y la prueba quedan en la rama `feat/founder-intro`; falta ejecutar `npm run test:orby`, TypeScript, ESLint y build. La prueba automatizada no sustituye QA visual en Chrome con una explicación larga, una interrupción y la reanudación.


## Iteración 7 — subtítulos compactos, texto completo y prompt visual coherente — 10 de noviembre de 2026

Hallazgos:
- El subtítulo estaba limitado a 17 palabras, pero no a caracteres. Con palabras largas podía desbordar la banda y dejar de comportarse como una línea breve.
- El fallback guardaba hasta 420 caracteres en una frase; el sanitizador del tablero acepta 240 por bloque. La frase restante podía quedar marcada como vista aunque la pizarra hubiera guardado solo el prefijo.
- El prompt cliente pedía etiquetas dentro de la imagen, mientras la ruta de servidor prohíbe texto incrustado para evitar pseudo-letras. Eran instrucciones contradictorias.

Cambios en `components/aprender/LessonAITutor.tsx`:
- Los subtítulos conservan como máximo las 17 palabras más recientes y ahora recortan a 132 caracteres, quitando palabras completas desde el inicio de la ventana.
- El fallback divide el texto hablado completo en fragmentos de hasta 220 caracteres, en límites de palabra. Cada fragmento se publica y se marca como comprometido solo después de que el tablero lo acepta; si se queda sin espacio, el cursor no avanza sobre el texto pendiente.
- El constructor de bloques recibe el fragmento completo (220 caracteres), por debajo del máximo del sanitizador de 240; no corta silenciosamente una explicación.
- La generación de ilustraciones ya no pide etiquetas incrustadas. El dibujo queda limpio y la nomenclatura se reserva para texto real de la pizarra, en coherencia con la política del servidor.

Pruebas de regresión añadidas para el límite de caracteres de subtítulos, división de explicaciones largas y coherencia del prompt visual.

Alcance: estos cambios protegen el fallback de transcripción y la presentación de subtítulos; no demuestran sincronía fonética exacta ni garantizan precisión anatómica de una imagen generada. FLUX Schnell sigue bajo la cuota gratuita configurada y sin fallback facturable.

Verificación: pendiente ejecutar pruebas, TypeScript, ESLint, build y revisión audiovisual en navegador.

## Iteración 9 — láminas anatómicas específicas por sistema — 10 de noviembre de 2026

Hallazgo confirmado en `components/aprender/OrbyBoard.tsx`: el renderizador `OrganSystem` dibujaba el mismo muñeco lineal para los ocho sistemas y trazaba radios desde un punto central a cada estructura. En el círculo aparecían abreviaturas de dos letras, difíciles de leer y sin una correspondencia directa con la lista de funciones.

Cambio:
- Se añadieron ocho dibujos SVG diferenciados: nervioso (encéfalo, médula y ramificaciones), circulatorio (corazón y trayectos vasculares), respiratorio (tráquea, pulmones y bronquios), digestivo (esófago, estómago e intestinos), endocrino (glándulas en una silueta corporal), urinario (riñones, uréteres y vejiga), óseo (cráneo, columna, caja torácica, pelvis y extremidades) y muscular (grupos musculares principales).
- Se eliminaron los rayos genéricos que partían del centro y las abreviaturas internas.
- Las estructuras recibidas conservan sus coordenadas; cada una se representa con un marcador numerado que coincide con su tarjeta explicativa.
- La leyenda conserva el nombre y el rol validados. El dibujo informa explícitamente que es una vista esquemática y no está a escala.
- Se mantiene el resaltado de estructura del profesor mediante `VisualTargetFocus`.
- Se añadió una prueba de regresión para comprobar las ocho plantillas, la relación marcador/leyenda, la descripción accesible y la eliminación del muñeco/rayos anteriores.

Alcance: mejora la representación pedagógica de los ocho sistemas del esquema actual. No diagnostica, no altera el sanitizador ni los datos anatómicos que provee la clase y no consume cuotas de generación de imagen. La precisión de las coordenadas sigue siendo esquemática, no anatómica a escala.

Verificación: cambio, prueba y bitácora guardados en `feat/founder-intro`. No se ejecutaron test runner, TypeScript, ESLint, build ni QA visual en navegador; no declarar aprobado ni listo para pull.

## Iteración 10 — célula limpia con referencias y leyenda legible — 10 de noviembre de 2026

Hallazgo confirmado en `components/aprender/OrbyBoard.tsx`: las etiquetas de organelos se dibujaban dentro del SVG con fuente de 2.8 unidades, distribuídas por cuatro bordes y unidas con líneas guía. Al aumentar el número de estructuras, el dibujo se llenaba de líneas y texto demasiado pequeño; además, no había una leyenda externa fácil de consultar.

Cambio:
- Se conserva el dibujo de célula animal, vegetal o procariota y los organelos con sus formas/colores.
- Se retiran las etiquetas diminutas y las líneas guía que cruzaban el esquema.
- Cada organelo recibe un pin numerado en su coordenada original, con correspondencia directa con una leyenda externa de lectura normal.
- La descripción accesible anuncia el tipo de célula y las etiquetas completas.
- La animación progresiva de cada estructura y el resaltado del profesor se mantienen.
- Se añade una prueba de regresión para el tipo de célula, los marcadores, la leyenda, el texto accesible y la ausencia del diseño anterior.

Alcance: mejora la legibilidad del diagrama celular sin cambiar el contenido ni la validación de organelos. Las coordenadas continúan siendo esquemáticas; el dibujo no está a escala. No se usa cuota de imágenes ni se introduce ningún proveedor.

Verificación: cambio, prueba y bitácora guardados en `feat/founder-intro`. No se ejecutaron test runner, TypeScript, ESLint, build ni QA visual en navegador; no declarar aprobado ni listo para pull.

## Iteración 11 — fases de mitosis y meiosis con cromosomas — 10 de noviembre de 2026

Hallazgo confirmado en `components/aprender/OrbyBoard.tsx`: `CellDivision` repetía cuatro glifos genéricos para representar todas las etapas de mitosis y meiosis. No se podía ver la alineación en el ecuador, la separación de homólogos en meiosis I, la separación de cromátidas hermanas en meiosis II ni el resultado final de dos/cuatro células.

Cambio:
- Cada fase ahora tiene una ilustración SVG que responde a la etapa correspondiente.
- Profase representa cromosomas condensándose dentro del núcleo; metafase muestra la alineación y el huso; anafase muestra la separación; telofase representa la reorganización nuclear y las células hijas.
- Meiosis I conserva las cromátidas hermanas unidas mientras separa homólogos; meiosis II presenta dos células que realizan la segunda división y termina en cuatro células.
- Se mantiene el texto original validado de cada etapa y se añade descripción accesible al SVG.
- Se añade prueba de regresión para distinguir meiosis I/II, la fase final, el resultado de células y la desaparición de los glifos repetidos.

Alcance: diagramas didácticos esquemáticos, no a escala y sin todos los detalles moleculares del huso o del entrecruzamiento. No se modifica el contenido de las etapas ni se usa cuota de generación de imágenes.

Verificación: cambios y prueba registrados en `feat/founder-intro`. No se ejecutaron test runner, TypeScript, ESLint, build ni QA visual en navegador; no declarar aprobado ni listo para pull.

## Iteración 12 — doble hélice de ADN con pares legibles — 10 de noviembre de 2026

Hallazgo confirmado en `components/aprender/OrbyBoard.tsx`: la primera pareja de bases se colapsaba en el centro porque `sin(0)` daba la misma coordenada para ambos lados. Además, las bases eran círculos de radio fijo 5; en visuales de 12 pares, con apenas 6.9 unidades entre filas, se solapaban verticalmente. Las cadenas se dibujaban como segmentos rectos.

Cambio:
- Se corrigió la fase inicial del giro para que la primera pareja tenga separación visible.
- Las dos cadenas se construyen como curvas Bézier suaves y continuas, manteniendo una representación de doble hélice tipo escalera.
- Los pares complementarios se muestran como bases rectangulares redondeadas y legibles, con contraste entre cadenas.
- La altura y el tamaño de la tipografía se adaptan al número de pares para evitar solapamientos al representar de 2 a 12.
- Se muestran los extremos 5′ y 3′ en orientación antiparalela y el texto accesible enumera los pares complementarios presentes.
- Se añadió una prueba estática para separación inicial, curvas, escalado de bases, orientación y eliminación de las coordenadas colapsadas anteriores.

Alcance: representación esquemática en 2D de la doble hélice; no es un modelo molecular a escala ni incorpora surcos, enlaces de hidrógeno detallados o estructura química tridimensional. Las parejas siguen siendo validadas por el sanitizador A–T/C–G.

Verificación: cambio, prueba y bitácora guardados en `feat/founder-intro`. No se ejecutaron test runner, TypeScript, ESLint, build ni QA visual; no declarar aprobado ni listo para pull.

## Iteración 13 — corrección de regresiones del test:orby — 10 de noviembre de 2026

Evidencia recibida: salida de `npm run test:orby` con 331 pruebas, 329 aprobadas y 2 fallidas.

Causas:
- La prueba `La pizarra distribuye etiquetas celulares con llamadas para evitar solapamientos` aún exigía el antiguo diseño interno `labelSlots/labelGroups` con líneas de llamada, aunque la iteración 10 ya había sustituido ese sistema por pines numerados y una leyenda externa legible.
- La prueba de transcripción incremental esperaba la salvaguarda textual `Never mutate`, que había quedado fuera de la función al dividir el fallback en fragmentos. La lógica ya crea nuevas copias acumulativas, pero faltaba dejar esa garantía explícita junto al bucle.

Cambio:
- Actualicé la prueba celular para validar la implementación vigente: tipo de célula accesible, organelos animados, pins numerados, leyenda externa, foco del profesor y ausencia del sistema viejo de llamadas.
- Restauré en el fallback el comentario de inmutabilidad que acompaña la construcción/publicación de snapshots acumulativos.

Alcance: no se reintroduce el diseño celular anterior ni se altera el comportamiento de voz. El cambio responde a los dos fallos exactos del log recibido.

Verificación: cambios guardados en `feat/founder-intro`. La ejecución local de la suite aún debe repetirse para confirmar el resultado; la última ejecución recibida es la de 329/331 y no se debe presentar como suite aprobada.

## Iteración 14 — inicio de clase en dos fases y título previo a la voz — 10 de noviembre de 2026

Hallazgo confirmado al comparar la grabación actual con los videos Studdy: el cliente cambiaba a `workspaceMode="voice"` inmediatamente al hacer clic, antes de terminar preflight, permiso, token efímero, conexión WebSocket, `setupComplete` y carga del AudioWorklet. Eso mostraba una pizarra vacía durante la preparación, mientras Studdy conserva el formulario con el tema y el estado «Preparando tu lección…». También enviábamos la instrucción inicial apenas se conectaba Live, en paralelo con el título; la referencia termina primero de escribir el tema y después empieza a hablar.

Cambio:
- `startWorkspaceClass` bloquea doble envío, mantiene el formulario y muestra el estado/loader azul mientras prepara Live.
- El inicio de la clase solo cambia al lienzo cuando `startRealtimeVoice` ya completó preflight, micrófono, token, setup y worklet.
- La primera instrucción de voz queda aplazada hasta `OrbyBoardTitle.onComplete`; el título manuscrito y su resaltador amarillo terminan antes de hablar.
- El título sigue visible durante toda la clase y OrbyBoard ya no vuelve a pintar el mismo título en el primer snapshot. Se evita así duplicar la cabecera.
- El chat lateral inicia cerrado, como en la referencia; se abre con su botón inferior.
- Se conserva la puerta de gratuidad y consentimiento existente: no se cambia proveedor, no se crea fallback facturable ni se salta el permiso del navegador.

Verificación: prueba estática añadida para el orden de preparación → título → primera instrucción. La suite aún no se ha ejecutado en este entorno; Vercel continúa afectado por el bloqueo `build-rate-limit`. La secuencia necesita prueba de navegador y micrófono real antes de considerarla aprobada.

## Iteración 15 — barra inferior, pausa real, subtítulos y compositor desplegable — 10 de noviembre de 2026

Hallazgo en los videos Studdy de la barra inferior: tres zonas independientes. Izquierda: avatar circular, chat, pausa y volumen. Centro: subtítulo breve con un botón pequeño para contraerlo. Derecha: teclado que despliega un compositor en forma de píldora y un micrófono rojo grande. El cliente actual tenía avatar textual, un control de notas sobrante, micrófono pequeño y sin pausa ni teclado desplegable.

Cambio:
- Se sustituyó el avatar textual por el recurso existente `/avatars/orby.webp`.
- Se reorganizó el pie en grupos de controles a izquierda y derecha; chat, pausa y volumen quedan juntos, el teclado despliega el campo de mensaje y el botón de enviar reutiliza el manejador y estado del chat.
- Los subtítulos tienen un control compacto para contraer/mostrar, manteniendo aria-live y el karaoke.
- La pausa utiliza `AudioContext.suspend/resume`: detiene el reloj Web Audio compartido, por lo que voz programada, resaltado karaoke y animaciones de pizarra se congelan juntos; al reanudar, se rearma el watchdog pendiente.
- El panel lateral de chat entra con una transición de desplazamiento y escala; guardar apuntes y terminar clase quedan accesibles dentro de su encabezado.
- El micrófono pasa a un control circular rojo grande y el teclado/compositor tiene una expansión animada.
- Se respetan `prefers-reduced-motion`.

Alcance: la pausa también suspende temporalmente la captura en el mismo AudioContext, de modo que mientras está pausada la clase no escucha interrupciones; el alumno debe reanudar para hablar. No cambia proveedor ni política de costes.

Verificación: se añadieron pruebas de contrato de pausa y compositor. No se ejecutaron aquí la suite, TypeScript, ESLint, build ni QA visual; requiere probar mouse, teclado, micrófono y barge-in en Chrome.

## Iteración 16 — cierre correcto de meiosis I y mantenimiento de la suite — 10 de noviembre de 2026

Revisión adicional del renderizador tras integrar los videos y las pruebas:
- Se detectó que el cierre de la cuarta fase de meiosis reutilizaba el arreglo final de cuatro células. Eso confundía telofase I con telofase II.
- Ahora la telofase I presenta dos células hijas; profase II/metafase II/anafase II mantienen esas dos células y solo la última fase produce cuatro.
- Se alineó el test de inicio Live con la nueva llamada `toggleVoiceMode(true, true)`, y la prueba de secuencia ahora extrae correctamente el cuerpo de `startWorkspaceClass` sin incluir el callback del título.
- Se reforzó el test del renderizador para exigir los estados de dos células después de meiosis I y cuatro únicamente después de meiosis II.

Verificación: cambios guardados en la rama. La última ejecución aportada por el usuario sigue siendo 329/331 antes de estas correcciones; no se ha ejecutado una nueva corrida ni un build.

## Iteración 17 — cierre de errores de preparación y barra visual sin controles sobrantes — 10 de noviembre de 2026

- Si el preflight, micrófono, token, conexión Live o AudioWorklet falla en el inicio diferido, se limpia `voiceStartInitialClassRef`; un intento posterior de voz normal no puede disparar accidentalmente la clase anterior.
- Se vacía el compositor al seleccionar un nuevo tema.
- La acción «Terminar clase» queda en la cabecera del chat lateral; se retira la X adicional de la barra inferior para respetar la distribución de Studdy (avatar/chat/pausa/volumen a la izquierda, teclado/micrófono a la derecha).
- Se corrigen mensajes de diagnóstico para reflejar que el error conserva la pantalla actual durante la preparación.

Verificación: prueba estática ampliada para la limpieza de la marca de clase pendiente y la composición de la barra. Sin nueva ejecución local de `npm run test:orby`, TypeScript, ESLint o build.

## Iteración 18 — formulario de entrada con modalidades Studdy y área ICFES plegable — 10 de noviembre de 2026

Hallazgo al comparar la pantalla de entrada: PeakScore mostraba cinco tarjetas de materia a tamaño completo antes del campo de tema; Studdy presenta tres pestañas de intención, una caja amplia y el botón de comenzar en la zona inferior. El input corto y el bloque de áreas desplazaban el centro visual respecto a la referencia.

Cambio:
- Se creó el selector superior de tres modalidades: Tema, Preparación para exámenes y Tarea.
- El campo pasó a ser una caja de texto amplia, como el compositor de Studdy; Ctrl+Enter o Cmd+Enter inicia la clase y Enter conserva los saltos de línea.
- Las cinco áreas ICFES se conservaron, pero pasan a un selector plegable para que no invadan el formulario principal.
- La modalidad acompaña el primer turno de Gemini Live: tema conceptual, preparación Saber 11 o acompañamiento de tarea. La modalidad Tarea se restringe explícitamente a contenidos y competencias de Saber 11.
- Se creó el fondo pastel azul/lila/rosa, pestañas blancas, caja con sombra, estado de preparación y botón azul redondeado.
- Se conserva visible el consentimiento gratuito y de uso de datos; no se elimina la protección por cambiar el diseño.
- Se añadieron pruebas del comportamiento de las tres modalidades y de la estructura del formulario.

Alcance: la nueva UI imita la estructura de Studdy, pero mantiene el alcance académico de PeakScore y no incorpora el servicio externo de archivos/URL del producto de referencia. No cambia los proveedores ni los límites de uso gratuito.

Verificación: cambios en `feat/founder-intro`; suite, TS, ESLint y build siguen pendientes de ejecución.

## Iteración 19 — actualizar contrato del test de entrada al nuevo copy — 10 de noviembre de 2026

La prueba de integración `Orby ICFES inicia Gemini Live` seguía verificando el texto anterior «¿Qué tema quieres estudiar?» después de que el formulario adoptó los placeholders contextuales por modalidad. La aserción ahora valida la pregunta de Tema, la de preparación Saber 11 y el tablist, además del campo y las puertas de seguridad existentes. Es una actualización del contrato de UI, no un cambio de política.

Verificación: prueba editada en la rama; no ejecutada localmente.


## Iteración 20 — compositor inferior y escaneo en navegación lateral — 10 de noviembre de 2026

Referencia visual: captura del estado actual de OmegaX y comparación solicitada con el panel de Studdy.

Cambios registrados en el commit `5615f5de969680b4b38ff66cb2acbdf74db1f37c`:
- Se movió la acción de cámara/escaneo de preguntas desde el compositor inferior al grupo «Aprender» de la barra lateral, con el rótulo «Escanear pregunta».
- Se retiró el botón de cámara duplicado del compositor inferior; se conserva el input oculto de captura y su manejador para que la acción lateral siga utilizando el flujo de adjuntos existente.
- Se retiró el aviso fijo «OmegaX puede cometer errores…» que ocupaba una franja debajo del compositor.

Alcance real: esta iteración solo ajusta la ubicación de la acción de escaneo y limpia el pie del chat. No implementa todavía el lienzo completo de Studdy, ni verifica equivalencia de animaciones, ni cambia el flujo de clase/voz.

Validación: commit publicado en `feat/founder-intro`. No se ha ejecutado una nueva corrida de `npm run test:orby`, TypeScript, ESLint, build ni QA manual del escáner después de este commit. No declarar esta iteración validada funcionalmente hasta completar esas comprobaciones.

Siguiente bloque visual: comparar la barra lateral y el compositor con los fotogramas del video de referencia; después reconstruir el área de trabajo y el comportamiento del compositor inferior por etapas, manteniendo el flujo gratuito y los controles de privacidad existentes.


## Iteración 21 — pulido del compositor expandible de clase — 10 de noviembre de 2026

Objetivo: acercar el compositor desplegable de la clase en vivo a la barra compacta observada en Studdy, sin alterar el flujo de envío existente.

Cambios publicados en `feat/founder-intro`:
- `components/aprender/LessonAITutor.tsx` (`0049293`): se refinó el control de adjuntar dentro del compositor expandible, usando el icono de clip y un texto contextual más claro; se conserva el input, el estado `input` y el manejador `onSubmit` existentes.
- `app/globals.css` (`ec73ddd`): se ajustó la distribución flexible de los grupos izquierdo/derecho del pie de clase; el compositor usa ancho adaptable, crece junto a los controles, mantiene foco visible y contempla pantallas pequeñas y `prefers-reduced-motion`.

Alcance: es un pulido incremental del compositor inferior de la clase en vivo. No representa una copia completa de Studdy ni cambia la arquitectura de voz, el proveedor, el flujo de clase o las políticas de coste.

Validación: commits publicados. No se ejecutaron en este entorno `npm run test:orby`, TypeScript, ESLint, build ni QA visual real; no declarar la iteración libre de errores hasta ejecutar esos controles.

Siguiente paso: comprobar en navegador el ancho/expansión del compositor en escritorio y móvil, envío con Enter, adjuntos y foco de teclado; después continuar con la composición del lienzo y las transiciones de la clase.


## Iteración 22 — lienzo de clase amplio y tipografía manuscrita dedicada — 10 de noviembre de 2026

Comparación con el video de referencia: Studdy mantiene una hoja blanca amplia, título y apuntes manuscritos, texto de tamaño legible y apoyos visuales integrados en el espacio de enseñanza. La clase de OmegaX todavía limitaba el lienzo con un máximo de ancho/alto y utilizaba una pila de fuentes manuscritas de fallback que dependía de cada sistema operativo.

Cambios publicados:
- `app/layout.tsx` — commit `534950e`: carga la familia Kalam mediante `next/font/google` y expone `--font-handwriting` con pesos 400/700 para escritura consistente.
- `app/globals.css` — commit de esta iteración: el lienzo Live ocupa el ancho disponible, elimina el límite de altura de la hoja, mantiene el formato apaisado 16:9 en escritorio, aumenta el tamaño/legibilidad de apuntes y fórmulas y aplica Kalam a los textos y etiquetas SVG. En móvil conserva una hoja 4:3 para evitar texto microscópico y desplazamiento horizontal. Se respeta `prefers-reduced-motion`.
- Se mantienen el motor de layout espacial, los tiempos progresivos, el lápiz SVG, el foco docente y la pausa sincronizada ya existentes; esta iteración ajusta la superficie y su presentación, no reescribe esos motores.

Límites y verificación: el uso de `next/font/google` requiere que el build pueda descargar/servir la fuente durante la compilación; verificar el build en CI. No se ejecutaron `npm run test:orby`, TypeScript, ESLint, build ni QA de navegador en este entorno. No afirmar paridad completa: faltan validar que el contenido se genere en secuencia sincronizada con audio real, revisar dibujos/diagramas de distintos temas y comparar el drawer de chat y controles con los videos completos.

Siguiente paso: inspección visual en Chrome de una clase real, con micrófono, a resoluciones de escritorio y móvil; corregir cualquier solapamiento o escala antes de continuar con las transiciones de dibujo y el chat lateral.


## Iteración 23 — secuencia progresiva de cada elemento — 10 de noviembre de 2026

Revisión de las tres grabaciones aportadas: la clase de referencia construye la hoja por etapas y conserva elementos anteriores; los elementos nuevos se incorporan en momentos distintos, sin una ráfaga simultánea de todo el contenido. La versión espacial de Orby ya tenía un orden `sequence`, pero su retardo se limitaba a 945 ms, por lo que las etapas tardías podían aparecer casi juntas. La versión heredada también limitaba los retrasos a 260/325 ms.

Cambio publicado:
- `components/aprender/OrbyBoard.tsx` — commit `5066c25`: el lienzo espacial calcula el retraso por posición real de cada elemento dentro de la hoja, con 135 ms entre etapas, sin techo artificial. El render heredado usa intervalos de 90 ms por bloque/visual, también sin truncar el orden. No se modifica el contenido, la sanitización, el layout, el sistema de audio, los identificadores de foco ni la pausa de la pizarra.

Criterio de seguridad: se mantiene el contrato de datos actual y la compatibilidad v1/v2/v3; no se inventa sincronización palabra-a-trazo a partir de subtítulos, porque el texto transcrito de Live puede llegar agrupado y no representa con precisión el instante acústico. La sincronización fina requiere cues verificables o marcas de tiempo por etapa emitidas por el tutor.

Validación pendiente: `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build` y reproducción real de clases con 1, 2 y 4 hojas, diagramas, esquemas y pausas/interrupciones. En esta sesión no se ejecutó el repositorio local ni hay evidencia de workflow de CI para este commit; no se declara libre de errores todavía.


## Iteración 24 — cues de voz para etapas de pizarra — 10 de noviembre de 2026

Cambios publicados:
- `7db6d22`: las instantáneas que incluyen `spokenCue` se retienen en una cola independiente en vez de publicarse de inmediato. Se buscan palabras completas normalizadas (sin diferencias de tildes/mayúsculas) dentro de la transcripción incremental y se compara su índice con el reloj de palabras que ya utiliza el karaoke de Orby. Cuando el audio alcanza el final de la frase, se publica la instantánea acumulativa. Las instantáneas sin cue mantienen compatibilidad con el render inmediato.
- `86666eb`: el índice de comparación se alinea con el índice real del karaoke (tokens sin espacios); se corrige la normalización Unicode y se descartan cues no resueltos al finalizar la reproducción para impedir que aparezcan tarde en otro turno.
- La cola se invalida al limpiar la pizarra/cambiar de generación; cada elemento conserva sesión, generación y caducidad para evitar dibujos obsoletos después de interrupciones.

Limitación deliberada: Live no entrega marcas fonéticas reales por palabra; el karaoke es una estimación temporal del reloj PCM. El cue mejora el orden relativo, pero no se debe anunciar como alineación fonética exacta. Si la frase no aparece exactamente en la transcripción, esa etapa se descarta al terminar la reproducción en vez de mostrarse fuera de tiempo.

Verificación CI: GitHub reporta el check Vercel como `failure` con destino `build-rate-limit` (límite de compilaciones del plan), no como fallo de TypeScript/tests. No se pudo confirmar build ni pruebas automáticas con ese check bloqueado. Antes de darlo por cerrado, ejecutar localmente `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npm run build` cuando el límite de Vercel lo permita.

## Iteración 25 — acciones acumulativas respetan la cola de voz — 10 de noviembre de 2026

Hallazgo: una instantánea con `spokenCue` se retenía correctamente hasta alcanzar la frase en el reloj de subtítulos, pero una acción posterior de Live (por ejemplo, enfocar una parte, añadir tinta o corregir un trazo) podía tomar esa instantánea pendiente como base y publicarla inmediatamente. Eso adelantaba visualmente una etapa que debía seguir oculta hasta su frase.

Cambio publicado:
- `components/aprender/LessonAITutor.tsx` — commit `7f9cfaa`: las acciones de pizarra priorizan la instantánea pendiente con `spokenCue`, comprueban sesión/generación/caducidad y actualizan esa instantánea dentro de la cola. No publican el tablero antes de tiempo. La respuesta a la herramienta informa `updated_queued_for_spoken_cue` y recuerda que la etapa sigue oculta hasta el audio.
- `tests/orby-request-filter.test.mjs` — commit `41a2ce2`: se añadieron regresiones estáticas para proteger la selección de la instantánea pendiente y evitar que una acción la revele prematuramente.

Límites: el reloj sigue siendo una estimación de reproducción basada en el audio PCM y el karaoke; no equivale a alineación fonética ni a marcas de tiempo exactas por palabra. Las instantáneas sin `spokenCue` conservan el comportamiento anterior.

Validación pendiente: no se ejecutaron `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build` ni una clase real en navegador. No declarar la iteración libre de errores hasta completar esos controles.


## Iteración 26 — microinteracciones premium del panel de estudio — 10 de noviembre de 2026

Objetivo: hacer que el panel lateral se sienta más cuidado al abrirlo y al interactuar, sin cambiar la navegación ni las herramientas existentes.

Cambios publicados en `feat/founder-intro`:
- `components/aprender/LessonAITutor.tsx`: el control del menú comunica su estado con `aria-expanded` y `aria-controls`, cambia entre menú/cierre y el panel tiene un identificador accesible. El fondo superpuesto tiene una clase de estado propia.
- `app/globals.css`: entrada lateral con opacidad y desplazamiento breve, aparición suave del fondo, respuesta de hover/press en botones y tarjetas, foco visible y transiciones del campo de búsqueda. Se respeta `prefers-reduced-motion`.
- `tests/orby-request-filter.test.mjs`: regresión estática para el contrato accesible y los estados animados del panel.

Alcance: se conserva la biblioteca dedicada exclusivamente a sesiones `live`; el endpoint de listado filtra `session_type = live` y no incluye el historial de chat escrito. No se cambia el flujo de audio, la pizarra docente, la persistencia de turnos, los proveedores ni los límites gratuitos.

Validación pendiente: las aserciones estáticas se añadieron, pero no se ejecutaron en este entorno `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build` ni QA visual en Chrome/escritorio/móvil. No declarar esta iteración libre de errores hasta ejecutar esos controles.


## Iteración 27 — retirar el historial de conversaciones del panel — 10 de noviembre de 2026

Corrección de alcance solicitada: el historial de clases/conversaciones pertenecía al tutor escrito anterior. El workspace actual se centra en clases con el tutor en tiempo real; por tanto, el panel lateral no debe listar, buscar, eliminar ni reabrir sesiones anteriores.

Cambios en `feat/founder-intro`:
- `components/aprender/LessonAITutor.tsx`: retirados el GET inicial de conversaciones, la hidratación del historial, el buscador/listado, la reapertura y eliminación de conversaciones previas y las métricas basadas en ese historial.
- Se conserva la creación del registro de la sesión activa y su `conversationId`, porque las llamadas Live usan ese identificador para persistir turnos, pizarra e imágenes de la clase actual. No se borra ninguna fila ni mensaje de la base de datos.
- El panel lateral mantiene las herramientas de estudio (tutor, escaneo, English Studio, flashcards, apuntes, recursos y seguimiento), pero ya no es una biblioteca de sesiones.
- La métrica «Conversaciones» se sustituye por «Observaciones», basada en señales de aprendizaje y no en chats anteriores.
- Se mantiene el pulido del drawer de herramientas y se añaden microinteracciones al chat superpuesto de la clase en vivo: entrada lateral, hover/press, foco del compositor y soporte de movimiento reducido.
- Las pruebas estáticas ahora exigen que no exista listado/reapertura/hidratación de historial en el componente y que la sesión Live activa siga creando y conservando su ID.

Alcance de datos: el endpoint GET heredado puede permanecer disponible para compatibilidad, pero el workspace ya no lo invoca. No se ejecutan operaciones de borrado de datos ni migraciones destructivas.

Validación pendiente: no se ejecutaron localmente `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build` ni pruebas manuales de micrófono/drawer en Chrome. La prueba estática y el diff deben revisarse antes de dar por finalizado el bloque.

## Cuarta iteración — ilustración SVG IA y dibujo progresivo — 11 de noviembre de 2026

Rama: `feat/founder-intro`. No se modificó `main`.

### Archivos modificados

- `components/aprender/OrbyBoard.tsx`
  - Las ilustraciones vectoriales ahora se revelan con una secuencia de trazo única: cada forma empieza después de la anterior, con un pequeño intervalo de levantamiento del lápiz.
  - Cada contorno se dibuja antes de revelar su relleno.
  - Se añadió una punta de lápiz animada que recorre el trazado de paths, círculos, elipses, líneas y polígonos.
  - Las etiquetas aparecen después de terminar el contorno de la ilustración, en vez de competir con el dibujo.
  - La animación se pausa junto con el reloj SVG del tablero y se conserva la preferencia de movimiento reducido.
  - Se mantiene la sanitización de escenas; no se renderiza SVG arbitrario ni HTML del modelo.

- `app/globals.css`
  - Estilos para la punta de lápiz y revelado de etiquetas.
  - Movimiento reducido: rellenos visibles sin animación y punta de lápiz oculta.

- `lib/ai/orby-live-tools.ts`
  - Dirección de arte reforzada para que el modelo construya escenas científicas SVG completas, no iconos ni figuras genéricas.
  - Se exige jerarquía visual, proporciones reconocibles, espacio negativo, curvas orgánicas, estructuras internas útiles, líneas guía precisas y etiquetas académicas en español.
  - La política sigue siendo IA primero; el banco curado es respaldo cuando la escena no puede construirse correctamente o falla la validación.

### Commits de esta iteración

- `1b1fc7a` — primera secuencia de dibujo SVG.
- `faef478` — relleno posterior al trazo.
- `69b5631` — separación de animaciones de trazo y relleno.
- `3399921` — dirección de arte científica para SVG IA.
- `378f359` — punta de lápiz animada.
- `0935d00` — estilos de la punta de lápiz.
- `73b2d31` — secuencia de un solo lápiz y etiquetas al final.
- `603810b` — conservación de opacidad del relleno.
- `bbc311e` / `f317671` — retirada del tope de 20 imágenes por cuenta en la API; se conserva la validación de tamaño necesaria para el bucket.
- `aa57a9e` — migración que elimina el trigger y la función SQL del antiguo límite de 20 imágenes por cuenta.

### Restricciones y verificación

- No se añadió un proveedor nuevo ni una ruta facturable.
- No se añadió un límite artificial por usuario para imágenes del antiguo chat. Los únicos límites admisibles son los límites reales de cuota gratuita del proveedor, con degradación clara y sin fallback de pago.
- No se ha ejecutado todavía TypeScript, ESLint, build ni una sesión manual en Chrome para esta iteración. No declarar la animación validada visualmente hasta probar una ilustración real en clase.
- La paridad completa con Studdy + Studley sigue pendiente de QA audiovisual: pizarra, voz, subtítulos, cámara, panel lateral, interrupción y reanudación en la misma sesión.


## Séptima iteración — cámara de tablero controlada con mouse — 11 de noviembre de 2026

Archivo:
- `components/aprender/OrbyBoard.tsx`

Cambios:
- Se eliminó la barra visible de controles de cámara (zoom +/−, porcentaje, ajustar y modo «Mover pizarra»), además de la navegación manual de hojas que ocupaba espacio en el lienzo.
- El desplazamiento manual ahora es directo: clic izquierdo sostenido y arrastre sobre el tablero cuando la clase está pausada o finalizada. Se conserva el arrastre con botón central como alternativa.
- La rueda del mouse acerca/aleja con el cursor como punto de anclaje, al estilo de un lienzo de exploración; el zoom queda limitado entre 60 % y 200 % para evitar escalas inutilizables.
- Mientras Orby enseña, la rueda no altera el zoom y el seguimiento automático de foco continúa guiando la cámara. Al pausar, el seguimiento automático se detiene y el estudiante recibe el control manual.
- No se añadieron botones ni controles decorativos nuevos.

Commit de implementación: `3f21dbb`.

Comprobación estática posterior al commit:
- Se verificó la presencia del manejador de rueda y su conexión al viewport.
- Se verificó que el arrastre izquierdo está condicionado a clase pausada/finalizada.
- Se verificó que el seguimiento automático se detiene durante la pausa.
- Se verificó la eliminación de los controles de zoom y del modo manual explícito.

Pendiente de verificación funcional:
- Ejecutar `npm run test:orby`, lint y build local.
- Probar en navegador: arrastre sobre texto/ilustraciones, zoom en distintos puntos del tablero, límites del zoom, pausa/reanudación y seguimiento de foco.
- Revisar interacción táctil en dispositivos compatibles. No afirmar build verde ni paridad audiovisual completa hasta completar estas pruebas.


## Octava iteración — barra inferior de clase en vivo — 11 de noviembre de 2026

Referencias revisadas: vídeos `studdy (4).mp4` y `studdy (5).mp4`, con atención a la barra inferior y la salida de clase.

Cambios en `components/aprender/LessonAITutor.tsx`:
- Se ordenaron los controles izquierdos como volumen del tutor, pausar/reanudar y conversación escrita.
- El tercer control abre/cierra el panel de conversación escrita de la clase; su etiqueta accesible ahora describe esa acción.
- Se conservaron a la derecha el teclado (que despliega el campo para escribir) y el micrófono.
- Se confirmó que la salida de clase ya está en la esquina superior derecha del encabezado del tablero mediante `finishVoiceCall`; no se duplicó con otro botón.

Cambios en `app/globals.css`:
- Se añadió una respiración y un halo expansivo muy sutil al micrófono activo.
- Los controles de teclado y micrófono tienen una entrada breve; el compositor mantiene su animación de expansión existente.
- Se respetan preferencias de movimiento reducido.

Commits:
- Código: `82257c86a84e3181691528c5ac7b77653f9d2251`
- Estilos: `a5e4ddad982598e42e94e102a31a3beb062d1194`

Pendiente: validar visualmente la barra a distintas anchuras, verificar el panel de conversación durante pausa/reanudación y ejecutar tests, lint y build. La animación es una implementación propia basada en la referencia visual, no una copia de código de Studdy.


## Novena iteración — compositor escrito de la clase — 11 de noviembre de 2026

Corrección según aclaración del usuario y revisión de los vídeos de Studdy:
- El control de teclado es el acceso al chat escrito durante la clase; no debe existir un botón de burbuja/chat duplicado.
- Se retiró el botón de mensaje independiente del grupo izquierdo. Allí quedan volumen y pausa/reanudar; teclado y micrófono permanecen a la derecha.
- El teclado abre la cápsula de escritura flotante. Al enviar, se oculta inmediatamente y el mensaje sigue el flujo de envío existente de Orby. Escape también la cierra.
- Se refinó la animación de entrada: expansión horizontal desde la derecha, leve desenfoque inicial y asentamiento elástico; el campo gana un halo discreto al enfocarse. El botón enviar usa el acento coral y responde al hover.
- Se mantiene accesibilidad con etiquetas claras y respeto a `prefers-reduced-motion`.

Commits:
- Código: `7fc5ba97d591583faf7ccaeae0b4a41238abe96e`
- Estilos: `155e70f5a7793a2d060c9ccab8a015e97dea2947`

Pendiente: probar teclado/Enter, envío real, cierre mientras la petición está en curso, y responsive en móvil; ejecutar tests, lint y build. La conversación escrita del tutor permanece en el panel existente cuando se abre desde el control de conversación de la clase, no se duplica con un segundo botón inferior.


### Ajuste de significado del control de teclado — 11 de noviembre de 2026

Aclaración del usuario:
- El icono de teclado del grupo izquierdo representa el acceso a la conversación escrita/transcripción de lo que ha dicho el tutor. Se añadió allí con el mismo drawer animado ya existente.
- Se conserva el segundo control de teclado a la derecha como acceso al compositor flotante para escribir una pregunta durante la clase; al enviar, se oculta.
- Así quedan diferenciadas las dos acciones: consultar el historial escrito (izquierda) y enviar una intervención nueva (derecha).

Commit: `2726a540646fc5ac64d099e089d576225da5d505`.
