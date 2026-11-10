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
