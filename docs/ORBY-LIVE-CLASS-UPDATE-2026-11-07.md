# Actualización Orby — Clase en vivo y hoja digital

**Fecha:** 7 de noviembre de 2026  
**Hora de registro:** 18:39 (UTC−05:00, Colombia)  
**Rama:** `feat/founder-intro`  
**Proyecto:** PeakScore

## Objetivo

Acercar la experiencia de Orby a una clase particular por videollamada: la hoja digital es el centro de la sesión, Orby explica con voz, los subtítulos acompañan la narración y el estudiante puede tomar sus propios apuntes.

## Cambios registrados en esta etapa

### Experiencia de clase en vivo
- Se reemplazó el escenario de voz centrado en una esfera por una interfaz de clase centrada en la hoja.
- Se incorporó una barra superior de clase, estado de micrófono, control de subtítulos y controles inferiores de llamada.
- La vista conserva el acceso al chat y permite regresar a la clase.
- Se adaptó el espacio de pizarra y sus subtítulos para escritorio y móvil.

### Pizarra progresiva
- Se conserva el componente visual tipado de Orby y sus dibujos SVG.
- Se orientó el contrato de la herramienta Live a enviar snapshots acumulativos, conservar identificadores de trazos y asociar etapas posteriores a frases habladas mediante `spokenCue`.
- La sincronización disponible es aproximada por coincidencia de frase validada; no equivale a sincronización por palabra o timestamp del audio.

### Apuntes del estudiante
- Se añadieron herramientas de lápiz, resaltador y borrador para trazos propios.
- Se incorporó deshacer y limpiar anotaciones.
- Se añadió una acción para guardar una versión textual de los bloques de la pizarra en la biblioteca de apuntes de Orby.
- Se agregó persistencia local de los trazos del estudiante mediante `localStorage`, con validación de forma y coordenadas al recuperar los datos.
- La persistencia local depende del navegador y dispositivo; todavía no sincroniza los trazos entre dispositivos ni los convierte en un documento/imagen completo.

## Archivos principales involucrados

- `components/aprender/LessonAITutor.tsx` — escenario de clase, subtítulos y guardado de apuntes.
- `components/aprender/OrbyBoard.tsx` — pizarra, trazos generados por Orby y herramientas de anotación del estudiante.
- `lib/ai/orby-live-tools.ts` — contrato de la herramienta de pizarra en voz.
- `tests/orby-request-filter.test.mjs` — regresiones estáticas de la interfaz, sincronización y herramientas.

## Restricciones preservadas

- No introducir modelos, APIs ni servicios con riesgo de facturación.
- Mantener los filtros de Orby y su alcance académico Saber 11/ICFES.
- No reconstruir materiales de Orby ICFES Lab que fueron eliminados intencionalmente.
- No modificar `main`, no desplegar ni aplicar migraciones remotas como parte de esta etapa.

## Estado y pendientes de validación

**Estado:** cambios de interfaz y anotación registrados en la rama de trabajo. Esta documentación no certifica una prueba funcional completa.

Pendiente:
1. Ejecutar Node tests, TypeScript, ESLint y build.
2. Probar la llamada real en Chrome con micrófono, interrupciones y subtítulos.
3. Verificar que los trazos locales se restauran correctamente al reabrir la misma clase y que no colisionan entre clases con títulos iguales.
4. Mejorar el borrador para eliminar segmentos al arrastrar y comprobar que no interfiera con la interacción de la hoja.
5. Incorporar rehacer y persistencia sincronizada en cuenta si se requiere continuidad entre dispositivos.
6. Guardar una captura/exportación completa que combine la pizarra de Orby y las anotaciones del estudiante.

**No declarar listo para Pull Request o producción hasta completar estas validaciones.**

## Sexta mutación — herramientas de edición del cuaderno

**Fecha:** 7 de noviembre de 2026  
**Hora:** 18:48 (UTC−05:00, Colombia)

- Se completó el botón **Rehacer**, que restaura el último trazo retirado con Deshacer.
- Al dibujar un trazo nuevo se limpia la pila de rehacer, evitando reintroducir cambios que ya no corresponden al historial.
- El borrador ahora captura el puntero y permite eliminar trazos mientras se arrastra sobre la hoja, no solo con un toque inicial.
- Limpiar también vacía el historial de rehacer.
- Se añadieron comprobaciones estáticas para la disponibilidad de rehacer y el borrado continuo.

**Commit de implementación:** `feb8456`  
**Commit de regresiones:** `e8910bb`

**Pendiente:** el borrado todavía elimina trazos completos cuando el cursor se aproxima a cualquiera de sus puntos; no recorta geométricamente un segmento. Las anotaciones se guardan localmente en el navegador y no se sincronizan entre dispositivos. Ejecutar Node tests, TypeScript, ESLint, build y QA manual de puntero/táctil antes de considerar esta etapa validada.

## Octava mutación — exportación de la hoja de clase

**Fecha:** 7 de noviembre de 2026  
**Hora:** 18:48 (UTC−05:00, Colombia)

- Se añadió la acción **Exportar / PDF** en la barra de herramientas del cuaderno.
- La acción abre el diálogo de impresión del navegador; desde allí el estudiante puede seleccionar “Guardar como PDF” o imprimir.
- La barra de anotación se oculta en la salida de impresión.
- Se añadió una comprobación estática de la acción de exportación.

**Commits:** `c6add82` (acción), `f1bf033` (ocultar herramientas al imprimir), `38a4e58` (regresión estática).

**Alcance real:** esta es una exportación inicial basada en la impresión del navegador, no un generador PDF dedicado. El navegador controla paginación, márgenes y selección de destino. Aún falta verificar que el resultado incluya correctamente toda la pizarra SVG y los trazos del estudiante, y evitar que contenido externo de la página aparezca en la impresión.

## Novena mutación — salida de impresión aislada para la hoja de clase

**Fecha:** 7 de noviembre de 2026  
**Hora:** 19:07 (UTC−05:00, Colombia)

- Se aisló la hoja de Orby en el modo de impresión: el resto de la página queda oculto y solo la hoja y su contenido permanecen visibles.
- Se definió formato A4 con márgenes de impresión y se quitaron bordes, sombras y fondos innecesarios.
- Se fuerza la visibilidad final de los contenidos animados para que la exportación no dependa de cuánto haya avanzado la animación de escritura.
- Se oculta la punta animada del lápiz y la barra de herramientas en la impresión.
- Se añadió una prueba estática para verificar estas reglas.
**Commits:** `8975602` (aislamiento de hoja y reglas de impresión), `1c16dec` (ocultar barra), `6b8c52f` (prueba de regresión).

**Alcance:** la exportación sigue usando el diálogo de impresión del navegador y “Guardar como PDF”. Aún requiere revisión manual en Chrome para validar saltos de página, SVG largos, varias páginas y la presencia de los trazos locales. No se considera certificada hasta ejecutar Node tests, TypeScript, ESLint, build y QA visual.

## Décima mutación — apuntes de clase estructurados

**Fecha:** 7 de noviembre de 2026  
**Hora:** 19:12 (UTC−05:00, Colombia)

- El guardado de la clase ahora estructura títulos, subtítulos, pasos, fórmulas y recuadros de explicación en Markdown.
- Añade detalles legibles de los apoyos visuales: etiquetas de diagramas, tablas y rótulos de trazos cuando existen.
- Incluye un resumen de las anotaciones personales recuperables desde el almacenamiento local del navegador.
- Añade un bloque JSON acotado con la estructura de los apoyos visuales para que no se pierdan todos sus metadatos al guardar.
- Limita el contenido final a 7.900 caracteres para respetar el máximo de 8.000 caracteres de la API de aprendizaje.
- Si el almacenamiento local no está disponible, el guardado de la explicación continúa sin las anotaciones.

**Commits:** `e1bf6fd` (guardado estructurado), `02891b2` (prueba estática).

**Alcance real:** el registro de apuntes conserva una representación textual y metadatos JSON limitados; no almacena imágenes rasterizadas ni una copia editable de los SVG. Las anotaciones personales se resumen por trazo, no se convierten en una imagen. Se requiere QA para confirmar la legibilidad y el límite de tamaño con clases largas.

## Undécima mutación — aislamiento de anotaciones por clase

**Fecha:** 7 de noviembre de 2026  
**Hora:** 19:10:23 (UTC−05:00, Colombia)

- La clave de almacenamiento local de los trazos ahora puede recibir el ID único del mensaje/clase activa, en lugar de depender solo del título.
- La vista de clase pasa ese ID al componente de la pizarra.
- Al guardar los apuntes, la lectura de las anotaciones usa el mismo ID de clase.
- Esto evita que dos clases distintas con el mismo título compartan accidentalmente la misma capa de anotaciones.
- Se añadieron comprobaciones estáticas para verificar que el ID se propaga desde la clase hasta la persistencia y el guardado.

**Commits:** `a98e415` (pizarra), `d298a6c` (clase y guardado), `e783b4f` (regresión).

**Alcance:** la persistencia sigue siendo local al navegador y no sincroniza entre dispositivos. El ID utilizado corresponde al mensaje activo de la sesión; hace falta probar cambios de turno, recarga y restauración de clases antiguas para comprobar que las anotaciones se mantienen asociadas a la clase correcta.


## Duodécima mutación — etapas visuales progresivas de la clase

**Fecha:** 8 de noviembre de 2026  
**Rama:** `feat/founder-intro`

### Implementado
- Los bloques de explicación de la hoja digital reciben un orden de revelado progresivo con intervalos cortos y acotados.
- Los apoyos visuales se incorporan después de los bloques, con una secuencia de aparición independiente y un retraso máximo limitado.
- Cada bloque y visual expone un índice de etapa mediante atributos `data-board-stage` y `data-board-visual-stage`, útiles para pruebas y diagnóstico visual.
- Se conserva el modelo acumulativo: el contenido anterior permanece visible mientras llegan nuevas etapas; no se borra la hoja para cada actualización.
- Se añadió una prueba de regresión estática para comprobar la secuencia y los límites de animación.

### Archivos
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`

### Alcance y limitaciones
- Esta mutación mejora el ritmo de aparición del contenido que ya llega a la pizarra; **no crea por sí sola trazos que el modelo no haya generado** ni garantiza sincronización exacta con fonemas o timestamps del audio.
- Los retrasos de entrada son una presentación visual, no un sistema de planificación temporal de la voz.
- Sigue pendiente validar en Chrome la interacción entre snapshots rápidos, animaciones SVG, modo de movimiento reducido, pizarra extensa y exportación A4.
- No se introducen dependencias, llamadas de IA, proveedores ni servicios de pago.
- No se modificó `main` ni se desplegó producción.

**Commits:** `1379677` (revelado progresivo de bloques y visuales), `fac4abb` (prueba de regresión).

**Validación:** pendiente de resultado de GitHub Actions para este commit; no se declara TypeScript, ESLint, tests completos ni build aprobados.


## Decimotercera mutación — pizarra exclusiva del profesor

**Fecha:** 8 de noviembre de 2026  
**Rama:** `feat/founder-intro`

### Decisión de producto
La referencia de clase muestra un profesor que escribe y señala; el estudiante observa. El puntero/lápiz visible en el vídeo es del profesor y no representa una herramienta de anotación del alumno.

### Implementado
- Se eliminó del componente de clase la capa SVG interactiva que permitía al estudiante dibujar encima de la pizarra.
- Se retiraron lápiz, resaltador, borrador, deshacer, rehacer y limpieza de trazos del estudiante.
- Se eliminó la lectura/escritura de tinta local desde la pizarra y su inclusión en el guardado de apuntes; se mantienen los apuntes estructurados del contenido generado por Orby.
- Se retiró la prop `storageId` de la pizarra y su uso desde la vista de clase.
- La superficie de clase ahora es blanca y lisa: sin cuadrícula, sin tarjetas decorativas alrededor de cada visual y sin la apariencia de cuaderno.
- Se añadió una banda informativa de herramientas del profesor (dibujar, señalar y borrar). Es indicativa y no interactiva para el estudiante.
- Se conservó la acción independiente «Exportar PDF» en la cabecera; no devuelve herramientas de dibujo al estudiante.
- Los trazos SVG de Orby y su punta animada de lápiz se conservan.

### Archivos
- `components/aprender/OrbyBoard.tsx`
- `components/aprender/LessonAITutor.tsx`
- `tests/orby-request-filter.test.mjs`

### Limitaciones explícitas
- La banda de herramientas muestra las capacidades previstas; no implementa todavía un cursor de señalamiento independiente ni un modo de borrado invocable por eventos del modelo.
- El lápiz animado acompaña los trazos `sketch` que envía Orby; no es un puntero físico ni una entrada del estudiante.
- El guardado de apuntes conserva bloques y datos de apoyos visuales, pero ya no incluye anotaciones del alumno.
- Requiere ejecutar CI y QA visual en Chrome para verificar layout, exportación PDF, animaciones y ausencia completa de interacción de tinta.

**Commits:** `792e042` (retirada de la capa de tinta), `dd8d21d` (integración y apuntes), `91c7ba3` (regresiones teacher-only), `4875b7a` (banda de herramientas del profesor), `97ddc67` (prueba de herramientas visibles), `af4687a` (exportación PDF en cabecera), `6205a42` (ajuste de regresiones de interfaz).

**Validación:** pendiente de CI completa y prueba real en navegador. No se declara build aprobado.


## Decimocuarta mutación — clase manuscrita y puntero de profesor
**Fecha:** 7 de noviembre de 2026  
**Rama:** `feat/founder-intro`

### Objetivo de la referencia
La estudiante observa una clase impartida por Orby. El lápiz visible es el puntero del profesor sobre una tablet; no es una herramienta para que el alumno escriba. El tablero debe ser una superficie blanca lisa y el contenido debe construirse a mano mientras se explica.

### Implementado en esta mutación
- Se retiró la banda de herramientas ficticias del tablero: no se presentan controles de lápiz, señalador o borrador al estudiante.
- La punta animada de lápiz de Orby se hace más visible y queda identificada por el ID del trazo que está recorriendo.
- Los trazos manuscritos se espacian de forma progresiva con un intervalo acotado; el lápiz acompaña el recorrido y las etiquetas aparecen después de su trazo.
- Se amplió la superficie de dibujo para que el esquema respire como una pizarra de clase, no como una tarjeta.
- Los bloques breves de explicación adoptan tipografía manuscrita de sistema cuando está disponible.
- La instrucción de Gemini Live prioriza sketch acumulativo por encima de tarjetas/nodos; pide contorno, estructuras, flechas y etiquetas en snapshots separados, ligados a la narración.
- Se actualizan pruebas estáticas para verificar el puntero docente, el ritmo progresivo y la ausencia de controles falsos para el alumno.

### Límites honestos
- El lápiz sigue el path SVG generado por Orby; no es seguimiento físico de mano ni cursor de stylus capturado desde el dispositivo.
- La calidad y cantidad de trazos dependen de que Gemini Live invoque la herramienta con snapshots válidos. El prompt orienta, pero no garantiza por sí solo una secuencia perfecta.
- El fallback tipado sigue disponible para visuales que requieren precisión; se solicita como apoyo secundario, no como reemplazo del sketch.
- Pendiente: QA real en Chrome con voz Live, múltiples snapshots, pausa/interrupción, exportación PDF y movimiento reducido.
- Sin dependencias nuevas, sin proveedores/API de pago, sin cambios a `main` ni despliegues.

**Validación:** pendiente de GitHub Actions y prueba visual real. No se declara build aprobado.


## Decimoquinta mutación — contrato único de dibujo progresivo

**Fecha:** 8 de noviembre de 2026  
**Rama:** `feat/founder-intro`

### Qué sigue y qué se ajustó
La siguiente prioridad es que la tinta se construya por pequeños movimientos observables, sin duplicar elementos ya escritos ni convertir cada actualización en una lámina nueva.

- Se unificó el límite de trazos nuevos por etapa en **2–5** tanto en la descripción de la herramienta Live como en las instrucciones de sesión.
- Se reforzó la instrucción de conservar los IDs de tinta existente y añadir únicamente el siguiente paso visual.
- Se pide evitar ráfagas simultáneas de trazos para que el alumno alcance a seguir la construcción del esquema.
- Se añadieron regresiones estáticas para detectar divergencias entre el contrato de herramienta y el prompt de Live.

### Plan de continuación
1. Validar CI completa del commit anterior (pruebas, TypeScript, ESLint, build y auditoría de dependencias).
2. Probar en Chrome una clase de 60–90 segundos con al menos cuatro snapshots acumulativos, verificando que la tinta previa no se duplica.
3. Ajustar el cursor/lápiz para que solo aparezca durante trazos nuevos y desaparezca al terminar, incluso al interrumpir una clase.
4. Añadir señalamiento contextual independiente (halo/indicador temporal sobre una parte ya dibujada), sin permitir escritura del estudiante.
5. Validar accesibilidad, movimiento reducido, exportación PDF y rendimiento en pantallas pequeñas.

### Límites
- El contrato del modelo orienta el ritmo, pero no garantiza por sí solo que Gemini Live emita exactamente 2–5 trazos ni que cada explicación tenga cuatro etapas.
- El puntero actual recorre el path SVG del trazo; aún no existe una orden estructurada de señalamiento independiente para apuntar a tinta ya dibujada.
- La prueba automatizada de esta capa es estática; la sincronización real voz–tinta necesita QA de navegador.
- No se añadieron llamadas ni modelos de IA, no se añadieron proveedores ni servicios de pago, no se modificó `main` y no se desplegó producción.

**Commit de esta mutación:** pendiente al momento de documentar.  
**Validación:** CI del commit anterior en ejecución; no se declara build aprobado.


## Decimosexta mutación — consistencia del contrato y limpieza de ESLint

**Fecha:** 8 de noviembre de 2026  
**Rama:** `feat/founder-intro`

### Trabajo realizado
- Se alineó el schema de `render_orby_teaching_board` y el prompt de Gemini Live para limitar cada snapshot a 2–5 trazos nuevos.
- Se reforzó la conservación de IDs y la instrucción de no volver a dibujar elementos que ya están en el tablero.
- Se pide evitar ráfagas de trazos para hacer más legible la progresión.
- Se corrigieron cinco pruebas estáticas que estaban desactualizadas respecto al comportamiento actual (commit `35421b6`).
- La ejecución de CI `42431535166` confirmó que las pruebas de Orby y TypeScript pasan, pero ESLint falló por dos constantes no utilizadas en `LessonAITutor.tsx` (`showVoiceTranscript` y `voiceBoardActive`). Ambas declaraciones se retiraron sin cambiar el flujo funcional.

### Validación y estado
- Pruebas de regresión: 190 aprobadas en la ejecución `42431535166`.
- TypeScript: aprobado en esa ejecución.
- ESLint: falló por dos variables no utilizadas; se corrigieron en el commit `926f849`. Pendiente de reejecución.
- Build de Next.js: no se ejecutó porque el workflow se detuvo al fallar ESLint.
- Auditoría de dependencias: paso de auditoría ejecutado antes del fallo; no se completó la compuerta final del workflow.
- QA visual en Chrome, voz Live, interrupciones, snapshots y PDF: pendiente.

### Próximo paso
Esperar CI completa tras `926f849`. Si ESLint pasa, revisar el resultado del build y luego realizar QA manual con una clase real de 60–90 segundos. No se declara la clase lista para producción.

**Sin nuevas dependencias, llamadas de IA, modelos ni proveedores de pago. Sin cambios a `main`, sin despliegue y sin migraciones remotas.**


## Decimoséptima mutación — operaciones teacher-only sobre tinta existente

**Fecha:** 7 de noviembre de 2026  
**Rama:** `feat/founder-intro`

### Implementado
- Se creó `lib/ai/orby-board-actions.ts` con validación estricta y operaciones tipadas `focus`, `erase` y `replace`.
- `focus` solo acepta IDs de trazos existentes y añade metadatos de foco temporal; no modifica geometría ni agrega tinta.
- La pizarra muestra un halo SVG independiente del lápiz y una etiqueta contextual opcional sobre el trazo señalado.
- `erase` retira únicamente los IDs seleccionados y conserva los demás trazos, bloques y visuales.
- `replace` corrige geometría conservando el mismo ID, para que la actualización se trate como corrección del trazo existente y no como tinta nueva.
- Se añadió la herramienta Live `apply_orby_board_action` con tres operaciones explícitas y schema acotado.
- `LessonAITutor.tsx` enruta las operaciones de pizarra por un manejador separado de la búsqueda académica; cada operación requiere turno académico validado, sesión vigente y un ID que exista en la pizarra actual.
- Se limita a una operación por evento y comparte el máximo de ocho operaciones visuales por turno con las actualizaciones de pizarra.
- El prompt de sesión instruye al modelo a no inventar IDs, señalar sin redibujar y corregir solo tinta propia.
- Se añadieron pruebas unitarias para foco, borrado selectivo, reemplazo, IDs inexistentes, coordenadas inválidas y enrutamiento Live.

### Archivos
- `lib/ai/orby-board-actions.ts` (nuevo)- `lib/ai/orby-board.ts`
- `lib/ai/orby-live-tools.ts`
- `components/aprender/OrbyBoard.tsx`
- `components/aprender/LessonAITutor.tsx`
- `app/api/orby/realtime-session/route.ts`
- `tests/orby-request-filter.test.mjs`

### Commits
- `444e556` — acciones de pizarra validadas.
- `5df6dda` — metadatos de foco temporal en el modelo de pizarra.
- `2628de2` — contrato de herramienta Live para focus/erase/replace.
- `08bac0f` — halo contextual independiente del lápiz.
- `43988ce` — integración de operaciones en la sesión Live.
- `7b9b61b` — instrucciones de Gemini Live para usar operaciones sin inventar IDs.
- `f296f0a` — pruebas de regresión del contrato y el enrutamiento.
- `0430280` — actualización de este documento de continuidad.
- `9ecc6c9` — el borrado exige que todos los IDs seleccionados existan.
- `81ac2c0` — el halo del señalador se desvanece tras dos pulsos.
- `5a96a84` — enum explícito para las operaciones del schema Live.
- `7a53c4c` — prueba para rechazar borrados con mezcla de IDs válidos y desconocidos.
- `0041c8b` — registro de regresiones y commits previos.
- `0721d00` — desvanecimiento de la etiqueta contextual.
- `aca57fb` — actualización del registro de continuidad.
- `3dede39` — respeto a movimiento reducido y ocultación del foco en exportación PDF.
- `a5077c9` — regresión estática para movimiento reducido y exportación.
- `1739186` — revisión incremental del foco en el modelo.
- `78093de` — incremento de revisión al enfocar o corregir.
- `1c555dc` — intento inicial de conectar la revisión al indicador (sin cambio efectivo en el componente).
- `3f644a4` — pruebas de revisión repetida.
- `185a22a` — documentación de la repetición fiable y estado de Vercel.
- `6cacbc2` — key efectiva del halo para reiniciar solo el indicador.
- `76c97cb` — regresión de señalamiento repetido.
- `ae0a4b5` — documentación de la repetición del foco.
- `1fb1a57` — rechazo de IDs duplicados en toda la pizarra.
- `eab86ca` — pruebas para IDs duplicados.
- `eb48b23` — documentación del endurecimiento global.
- `837db96` — corrección del guard de reemplazo para usar unicidad global.

### Seguridad y límites
- Las operaciones no aceptan HTML, SVG ni código; solo datos estructurados tipados.
- Las coordenadas de reemplazo se limitan al canvas 4–96, entre 2 y 40 puntos por trazo, tonos conocidos y grosor 0.6–2.4.
- Los IDs deben existir en la tinta actualmente publicada; un ID desconocido no puede borrar ni reemplazar nada.
- El estudiante no recibe controles ni eventos para ejecutar estas operaciones.
- El foco se renderiza como una animación SVG efímera; no altera el trazo original.
- No se añadieron dependencias, modelos, proveedores ni servicios de pago. No se modificó `main`, no se desplegó y no se aplicaron migraciones remotas.

### Validación pendiente
- Ejecutar Node tests, TypeScript, ESLint y build tras los commits de esta mutación.
- QA manual en Chrome: foco sobre trazos antiguos y repetidos, borrar uno entre varios, reemplazar un trazo sin duplicarlo, snapshots posteriores y barge-in durante el halo.
- Verificar en dispositivo táctil y con movimiento reducido.
- No declarar listo para producción hasta completar CI y QA real.

**Estado:** implementación conectada en la rama; validación completa todavía no certificada.


### Ajuste adicional — repetición fiable del señalamiento
- Se añadió una revisión incremental al foco del profesor. Si Orby vuelve a señalar el mismo trazo con la misma etiqueta, React remonta únicamente el indicador y reinicia el halo; no se vuelve a montar ni animar la tinta.
- La revisión también aumenta al corregir un trazo para que el señalamiento de corrección vuelva a ser visible.
- Se extendieron las pruebas unitarias para comprobar que cada señalamiento repetido incrementa la revisión y reinicia el halo.
- El grupo SVG del halo usa esa revisión como key: React remonta el indicador, pero conserva la key del trazo, por lo que no vuelve a animar la tinta previa.
- Se corrigió el montaje del grupo contextual para aplicar efectivamente esa key.
- Estado CI consultado para el commit anterior: el único estado reportado es Vercel en fallo por límite de builds del plan (`upgradeToPro=build-rate-limit`); no hay evidencia de ejecución satisfactoria de Node tests, TypeScript, ESLint o build en ese commit. No se intenta forzar otro build que pueda generar costes.


### Endurecimiento de IDs globales — 7 de noviembre
- Las operaciones teacher-only ahora exigen que cada ID afectado aparezca exactamente una vez en toda la pizarra, no solo dentro de su visual. La misma regla aplica a focus, replace y erase.
- Si una pizarra contiene accidentalmente IDs duplicados entre dos esquemas, focus, replace y erase rechazan la operación en lugar de señalar o borrar más de un elemento.
- Se añadieron regresiones para los tres casos de ID duplicado.


## Mutación siguiente — pausa inmediata del lápiz al interrumpir la clase

**Rama:** `feat/founder-intro`

### Implementado
- La pizarra recibe un estado explícito `drawingActive`, controlado por el ciclo de voz y no por el modelo.
- Cuando el micrófono detecta una nueva intervención real del estudiante (rama de barge-in, no el eco de los altavoces), la UI marca inmediatamente la animación como pausada.
- El SVG de cada esquema usa `pauseAnimations()` / `unpauseAnimations()` para detener y reanudar sus animaciones SMIL, incluyendo el movimiento del lápiz.
- La animación CSS del trazo conserva su progreso con `animationPlayState: paused`; no reinicia ni reproduce de nuevo el camino desde cero.
- El lápiz se oculta visualmente mientras la pizarra está pausada, pero permanece montado: al reanudar conserva exactamente la posición SMIL alcanzada y no vuelve al inicio del trazo.
- La llegada de un nuevo snapshot válido de Orby reactiva la pizarra; los snapshots rechazados o de generaciones obsoletas no la reactivan.
- Al cerrar la sesión de voz se detiene también la animación.
- Se añadieron pruebas estáticas del contrato de pausa, reanudación, lápiz y conexión con el barge-in.
- La pausa del lápiz se realiza por visibilidad y no desmontando el elemento SVG, de modo que el estado de `animateMotion` se conserva durante la interrupción.
- Se verificó que `drawingActive` llega desde el componente de clase hasta cada visual y el componente Sketch.

### Archivos
- `components/aprender/OrbyBoard.tsx`
- `components/aprender/LessonAITutor.tsx`
- `tests/orby-request-filter.test.mjs`

### Límites / QA
- La pausa se activa tanto en la ruta de actividad del micrófono como en `interruptCurrentVoiceOutput()`, que se invoca cuando el detector de voz confirma un barge-in fuerte. Los fragmentos identificados como eco no interrumpen ni pausan la clase.
- La reanudación solo ocurre al publicar un snapshot válido nuevo.
- Falta probar en Chrome la pausa a mitad de un trazo, la reanudación tras la respuesta y el comportamiento de SVG SMIL en navegadores/dispositivos reales.
- No se han ejecutado Node tests, TypeScript, ESLint ni build desde esta mutación.
- No se añaden proveedores, modelos, dependencias ni servicios de pago. No se modifica `main`, no se despliega y no se fuerzan builds que puedan generar cargos.

**Estado:** cambios implementados en la rama; validación de CI y QA manual pendientes.

### Corrección de integración de interrupción confirmada

Commits de esta mutación:
- `477d7f1` — contrato inicial de pausa/reanudación en la pizarra.
- `5f69e6f` — conexión al estado de voz.
- `079aff7` — regresiones iniciales.
- `dd2fd92` — documentación de pausa inmediata.
- `fb2fd0e` — controlador SMIL del SVG.
- `86e5c20` — propagación del estado a los esquemas.
- `c43e8ef` — aserciones de pausa.
- `e9059bc` — conservar montado el lápiz para reanudar desde su posición.
- `791b2b9` — prueba del lápiz persistente.
- `a9b471c` — documentación del estado persistente.
- `fb6691f` — pausa en el punto común de interrupción confirmada.
- `77d46e2` — prueba del punto de interrupción.
- `5720714` — actualización final de continuidad.
- La pausa se conectó también directamente a `interruptCurrentVoiceOutput()`, el punto común que detiene la salida cuando el detector acepta una interrupción real por transcripción interim o final.
- Esto cubre el caso de barge-in significativo mientras Orby está reproduciendo audio, además del evento de actividad de micrófono sin salida activa.
- La rama de eco acústico continúa sin invocar la interrupción.


## Mutación siguiente — sincronización temporal de lápiz y tinta

### Implementado
- La animación del trazo y el movimiento del lápiz comparten la misma duración y el mismo retraso por trazo.
- Se eliminó la diferencia de curvas de velocidad: el dash-offset de la tinta usa `linear`, igual que el movimiento paced del lápiz sobre el recorrido SVG.
- Así, la punta no debería adelantarse ni quedarse atrás respecto a la tinta durante el recorrido.
- Se conserva el controlador de pausa/reanudación del SVG; la animación sincronizada se congela y continúa en el mismo reloj de la pizarra.
- Se añadió una regresión estática que comprueba duración, retraso, longitud normalizada del path y temporización lineal.

### Archivos
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### Validación pendiente
- Verificar visualmente en Chrome que el movimiento paced de `animateMotion` y el dash-offset lineal coincidan en curvas con longitudes muy distintas entre segmentos.
- Ejecutar Node tests, TypeScript, ESLint y build cuando la cuota de CI permita hacerlo sin coste adicional.
- No se modifican proveedores, modelos, dependencias, servicios de pago ni `main`; no se despliega.

**Estado:** temporización sincronizada implementada en la rama; QA visual y CI pendientes.

Commits de esta mutación:
- `cacce9d` — alinear la temporización CSS de la tinta con el movimiento de la punta.
- `fd22446` — regresión estática de sincronización.
- `0bf0a55` — documentación de continuidad.

Estado de CI consultado para `0bf0a55`: Vercel permanece en fallo por límite de builds del plan (`build-rate-limit`). No se ha ejecutado ni certificado el build de esta mutación.


## Mutación siguiente — contrato determinista de tiempos de escritura

### Implementado
- Se extrajo el cálculo de duración y retraso de cada trazo a `getOrbySketchStrokeTiming()` en el módulo puro de pizarra.
- La UI ya no mantiene una tabla de tiempos duplicada ni recalcula por separado duración y retraso.
- La función normaliza índices y cantidad de puntos, limita la duración entre 760 y 1.600 ms y limita el retraso acumulado a 1.300 ms.
- Se agregaron pruebas de límites, valores inválidos, progresión por orden y duración máxima.
- La animación del lápiz y el trazo consumen exactamente el mismo resultado, conservando la sincronización existente.

### Archivos
- `lib/ai/orby-board.ts`
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### Validación pendiente
- Ejecutar la suite Node y TypeScript; comprobar build y QA de navegador cuando CI lo permita sin coste adicional.
- Vercel sigue reportando `build-rate-limit`; no se fuerza un build ni se habilita un proveedor de pago.
- No se modifica `main`, no se despliega y no se agregan dependencias ni servicios de IA.

**Estado:** helper puro conectado y pruebas añadidas; ejecución de tests y QA real pendientes.


## Mutación — anotaciones pedagógicas universales para las cinco pruebas

### Investigación de referencia
- Se consultó la Guía de Orientación Saber 11° 2026 del ICFES, actualizada el 26 de marzo de 2026.
- Se verificó que el examen contempla cinco pruebas: Lectura Crítica, Matemáticas, Sociales y Ciudadanas, Ciencias Naturales e Inglés.
- Se revisó la organización oficial por competencias, afirmaciones y evidencias; el diseño del tablero debe ayudar a hacer visibles evidencias del razonamiento, no limitarse a decorar respuestas.
- Fuentes oficiales:
  - Guía 2026: https://www.icfes.gov.co/evaluaciones-icfes/saber-11/guia-de-orientacion-examen-saber-11/
  - Marcos de referencia: https://www.icfes.gov.co/marcos-de-referencia-examen-saber-11/
  - Caja de herramientas: https://www.icfes.gov.co/caja-de-herramientas-saber-11/que-se-evalua/

### Implementado
- Nuevo visual tipado `annotation` para círculos, subrayados, flechas y corchetes.
- Cada anotación acepta entre 2 y 12 puntos acotados al lienzo 4–96; tono permitido y etiqueta corta opcional.
- Render SVG visual, sin HTML/SVG aportado por el modelo ni ejecución de código.
- La herramienta Live anuncia el nuevo tipo y sus propiedades.
- Pruebas de sanitización positiva/negativa y contrato de herramienta.
- Utilidad transversal: rodear tesis/evidencia en Lectura, destacar datos y operaciones en Matemáticas, conectar causas y consecuencias en Sociales, señalar variables/mecanismos en Naturales y marcar pistas contextuales en Inglés.

### Límites y QA
- Esta mutación añade la primitiva visual universal; no declara completo el currículo de las cinco áreas ni sustituye la revisión pedagógica de cada explicación.
- Pendiente ejecutar Node tests, TypeScript, ESLint, build y QA en Chrome.
- No se agregan dependencias ni proveedores de IA de pago. No se toca `main` ni se despliega.


## Mutación — núcleo pedagógico especializado por prueba Saber 11
### Investigación oficial aplicada
- Fuente de estructura vigente consultada: Guía de Orientación Saber 11° 2026-2, publicada por ICFES en marzo de 2026.
- Se tomó como principio de diseño el enfoque por competencias y tareas; para las pruebas descritas con Diseño Centrado en Evidencias, se respeta la relación competencia → afirmación → evidencia → tarea.
- Se consultaron los marcos de referencia oficiales de las cinco pruebas y la Caja de Herramientas del ICFES.
- Precisión importante: Inglés tiene especificación propia en la guía; no se fuerza artificialmente el mismo esquema de afirmaciones/evidencias que se usa para las otras pruebas.
- Referencias:
  - Guía 2026: https://www.icfes.gov.co/evaluaciones-icfes/saber-11/guia-de-orientacion-examen-saber-11/
  - Guía calendario A 2026-2: https://www.icfes.gov.co/wp-content/uploads/2026/03/17-marzo-guia-de-orientacion-saber-11-2026-2.pdf
  - Marcos de referencia: https://www.icfes.gov.co/marcos-de-referencia-examen-saber-11/
  - Caja de herramientas: https://www.icfes.gov.co/caja-de-herramientas-saber-11/que-se-evalua/
  - Práctica oficial: https://www.icfes.gov.co/caja-de-herramientas-saber-11/practica/

### Implementado
- Nuevo catálogo tipado de perfiles pedagógicos para Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.
- Cada perfil define propósito, rutina de razonamiento, prioridades de tablero, errores frecuentes y foco de retroalimentación.
- Se genera una instrucción dinámica según la materia de la sesión Live; no se mezcla el perfil de otra área.
- Inglés conserva la explicación y retroalimentación en español, con inglés solo en fragmentos y práctica pertinentes.
- Los perfiles son guías didácticas, no una supuesta transcripción exhaustiva de las matrices oficiales ni una distribución inventada de preguntas.
- Se añadieron pruebas de cobertura de las cinco áreas, campos mínimos, fallback de materia no reconocida y regla lingüística de Inglés.

### Archivos
- `lib/ai/orby-scope.ts`
- `app/api/orby/realtime-session/route.ts`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### QA y límites
- Esta fase especializa la pedagogía y la instrucción de la sesión Live; no certifica todavía precisión de respuestas, cobertura completa del temario ni rendimiento con estudiantes.
- Pendiente ejecutar Node tests, TypeScript, ESLint, build y pruebas de voz/tablero en Chrome.
- No se recupera ni reconstruye contenido de Orby ICFES Lab eliminado intencionalmente.
- No se agregan servicios de pago, dependencias ni cambios a `main`; no se despliega.

 
## Mutación — diagnóstico adaptativo de aprendizaje por materia

### Implementado
- Se agregó `summarizeIcfesLearningSignals()` al núcleo académico.
- Resume señales existentes en conceptos prioritarios, fortalezas, misconceptions repetidas y enfoque recomendado.
- Solo considera registros con confianza entre 0.80 y 1.0; señales dudosas o corruptas no se interpretan como dominio.
- Distingue entre reteaching, práctica guiada, reto y diagnóstico inicial; ausencia de datos nunca significa dominio.
- La sesión Live incluye un resumen diagnóstico junto con señales recientes, filtradas por usuario y materia como en la consulta existente.
- No se crean tablas ni se escriben señales nuevas en esta mutación.

### Archivos
- `lib/ai/orby-scope.ts`
- `app/api/orby/realtime-session/route.ts`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### QA
- Pruebas añadidas para dificultades, fortalezas, misconceptions repetidas, registros inválidos y ausencia de evidencia.
- Pendiente ejecutar Node tests, TypeScript, ESLint, build y pruebas Live integrales.
- No se reconstruye Orby ICFES Lab eliminado intencionalmente. Sin servicios de pago, sin cambios a `main` y sin despliegue.


## Mutación — directiva docente adaptativa a partir del diagnóstico

### Implementado
- Se agregó `buildIcfesAdaptiveTeachingDirective()`, que transforma el diagnóstico estructurado en acciones concretas para la sesión: comprobación inicial, reenseñanza focalizada, uso de fortalezas, revisión de misconceptions y reto/práctica guiada.
- La ruta Live valida y acota los campos del diagnóstico antes de generar la directiva; los datos históricos no se insertan como instrucciones libres.
- La directiva exige verificar el desempeño actual y permite que la evidencia nueva contradiga el historial.
- Si no existen señales fiables, no se genera una directiva adaptativa ni se inventa un diagnóstico.
- Se añadieron pruebas para acciones docentes y ausencia de señales.

### Archivos
- `lib/ai/orby-scope.ts`
- `app/api/orby/realtime-session/route.ts`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### QA
- Validación estática posterior a los cambios pendiente.
- Ejecución de tests, TypeScript, ESLint, build y QA funcional pendiente; Vercel mantiene `build-rate-limit`.
- Sin cambios a `main`, sin dependencias ni APIs de pago. No se reconstruye el contenido del Lab eliminado intencionalmente.


## Corrección de bloqueos locales de compilación — 7 de noviembre de 2026

### Hallazgos reportados al probar en Windows
- Next.js/Turbopack detenía el parseo de `components/aprender/OrbyBoard.tsx` en la línea del bloque CSS de impresión: el literal JSX delimitado con comillas dobles contenía selectores CSS con comillas dobles (por ejemplo, `[data-orby-drawing-active="false"]`), cerrando prematuramente la cadena y haciendo que el parser interpretara `false` como JSX.
- `tests/orby-request-filter.test.mjs` declaraba dos veces `realtimeSessionSource`, provocando `SyntaxError: Identifier 'realtimeSessionSource' has already been declared` antes de ejecutar cualquier prueba.

### Corrección
- Se delimitó el literal CSS de `<style>` con template literal, conservando las reglas existentes sin cambiar su comportamiento.
- Se eliminó únicamente la segunda declaración redundante de `realtimeSessionSource`; la primera permanece disponible para todas las aserciones posteriores.

### Archivos
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### Validación
- Corrección basada en los dos errores reproducidos y capturados localmente por el usuario.
- Pendiente que el usuario actualice la rama y vuelva a ejecutar `npm run dev` y `npm run test:orby` (o el script de pruebas configurado en `package.json`).
- No se ha ejecutado el entorno local del usuario desde GitHub; no se afirma que el build o la suite estén aprobados.
- Solo se modifica `feat/founder-intro`; no se toca `main`, no se despliega y no se añaden dependencias ni servicios de pago.


## Fase 1 — desacoplar enseñanza de la búsqueda del Lab — 7 de noviembre de 2026
### Evidencia revisada
- Se compararon fotogramas de la grabación de referencia `1000189532.mp4` y de la grabación local `20261108-0156-42.6476291.mp4`: la referencia muestra escritura progresiva manual sobre un tablero; la grabación local mantiene el tablero vacío durante la sesión capturada.
- La herramienta `search_orby_learning_knowledge` estaba descrita como obligatoria para cada pregunta académica nueva. El endpoint de recuperación puede depender de embeddings de Cloudflare Workers AI, y la grabación/captura local mostró un rechazo de credenciales de ese motor.
- El material del Orby ICFES Lab fue eliminado intencionalmente; no se debe reconstituir ni tratar su ausencia como un fallo de datos.

### Cambio aplicado
- La búsqueda de conocimiento Live pasa a ser opcional y solo se invoca cuando el estudiante pide fuentes, información actual, verificación externa o material publicado concreto.
- La enseñanza debe comenzar directamente desde conocimiento académico fiable y nunca esperar la búsqueda, reintentarla en bucle ni bloquear voz/pizarra si el Lab está vacío o no disponible.
- No se modifica ni reconstruye contenido del Lab. No se cambian proveedores, modelos, límites gratuitos ni credenciales.

### Archivos
- `lib/ai/orby-live-tools.ts`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### QA y siguiente fase
- Cambio de contrato/instrucción inspeccionado estáticamente; no se ha ejecutado TypeScript, suite de pruebas ni navegador desde GitHub.
- Pendiente instrumentar/validar si Live invoca `render_orby_teaching_board` y si el snapshot aceptado llega al componente visual durante el audio. Si no ocurre, la siguiente mutación debe abordar la invocación y el flujo de snapshots, no maquillar el tablero con puntos decorativos.
- Pendiente revisar las credenciales de Cloudflare en el entorno local; nunca copiar ni compartir tokens en el chat.
- Solo `feat/founder-intro`; no se toca `main`, no se despliega y no se agregan dependencias ni servicios de pago.


## Fase 2 — prioridad explícita de pizarra durante la clase Live — 7 de noviembre de 2026

### Cambio aplicado
- Se añadió una directiva docente prioritaria en la instrucción de cada sesión Live: para preguntas académicas sustanciales, Orby debe invocar la herramienta de pizarra antes de la primera explicación oral extensa, continuar con snapshots acumulativos por etapas y narrar lo que escribe.
- Se especifica cuándo NO dibujar (saludos, confirmaciones y turnos sin tema académico), para evitar diagramas artificiales.
- Si la herramienta falla, Orby debe continuar la explicación oral sin esperar ni afirmar que la pizarra se actualizó.
- La directiva no depende de Cloudflare ni de recuperar material del Lab. No cambia modelos, proveedores ni límites de coste.

### Archivos
- `app/api/orby/realtime-session/route.ts`
- `tests/orby-request-filter.test.mjs`
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`

### QA y límites
- Se añadió una prueba estática de contrato para la directiva Live.
- Pendiente ejecutar `npm run test:orby`, TypeScript, build y validar en navegador que el modelo realmente invoque la herramienta y que el componente muestre la pizarra durante el audio.
- Esta directiva mejora el contrato del modelo, pero no garantiza por sí sola la invocación; la siguiente verificación debe medir eventos de herramienta y render efectivo.
- Solo `feat/founder-intro`; sin cambios a `main`, sin despliegue, sin servicios de pago y sin reconstrucción del Lab eliminado.

## Verificación de discrepancia HEAD/origin y normalización del test — 7 de noviembre de 2026

### Evidencia
- La captura de terminal muestra una discrepancia entre las salidas de git show HEAD y git show origin/feat/founder-intro: el snapshot remoto local incluía una segunda carga de liveToolsSource después de liveSessionSource.
- La lectura por rangos de GitHub confirma que la cabecera de la versión actual contiene una única declaración compartida de liveToolsSource.

### Corrección publicada
- Se normalizó la cabecera del archivo de pruebas con un comentario explícito que documenta que liveToolsSource se carga una sola vez y se reutiliza en toda la suite. Se publica una nueva revisión para que el tracking local pueda actualizarse.

### Validación pendiente
- Tras el pull, confirmar que git show HEAD:tests/orby-request-filter.test.mjs | Select-String 'liveToolsSource' muestra una sola declaración (las demás líneas serán aserciones).
- Ejecutar npm run test:orby; no se declara la suite aprobada desde GitHub.
- Solo feat/founder-intro; no se toca main, no se despliega.
## Auditoría de fallo de sintaxis de regex en la suite — 7 de noviembre de 2026

### Causa raíz confirmada
- La suite ya superó el error de declaración duplicada. El nuevo fallo ocurre al parsear el archivo de pruebas, antes de ejecutar casos: la regex de la aserción del selector [data-orby-teacher-focus] tenía barras invertidas duplicadas dentro de una regex literal.
- La expresión se interpretaba como una clase de caracteres con rango inválido (Range out of order in character class). No era un error del CSS ni del componente OrbyBoard.

### Corrección
- Se sustituyó la regex literal defectuosa por una comprobación de inclusión de cadena exacta sobre el selector CSS real: .orby-board [data-orby-teacher-focus] animate { display: none; }.
- Se inspeccionó el resto del archivo para buscar otros patrones de regex literal con escapes duplicados equivalentes; solo se encontró esta otra ocurrencia en forma de regex literal. La ocurrencia en la línea 678 está dentro de una cadena pasada a includes y no se compila como regex.

### QA
- Corrección publicada en tests/orby-request-filter.test.mjs.
- Pendiente ejecutar npm run test:orby en el entorno local; la suite puede revelar fallos de aserciones posteriores una vez que el parser termine de cargar.
- Solo feat/founder-intro; no se toca main, no se despliega y no se añaden dependencias ni servicios de pago.
## Auditoría estática ampliada de la suite Orby — 7 de noviembre de 2026

### Alcance comprobado en la revisión actual de GitHub
- Se inspeccionó tests/orby-request-filter.test.mjs completo (4.199 líneas, 204 casos test()).
- Se validaron sintácticamente 969 regex literales utilizadas por assert.match/assert.doesNotMatch; no se detectaron expresiones inválidas en la revisión actual.
- Se contaron 47 declaraciones const de nivel superior: no hay nombres duplicados.
- Se contaron 204 nombres de pruebas: no hay títulos duplicados.
- La aserción del selector CSS se sustituyó por includes() para evitar que el parser de Node vuelva a interpretar escapes ambiguos.
- package.json confirma que test:orby ejecuta node --test tests/orby-request-filter.test.mjs y que build depende de que esa suite pase antes de next build.

### Límite crítico de esta auditoría
- Estas comprobaciones estáticas no equivalen a ejecutar Node sobre el repositorio ni garantizan que las 204 pruebas pasen: los asserts pueden fallar al ejecutarse y el entorno de GitHub no ha producido una ejecución de Actions para esta rama.
- La última captura del usuario muestra que su pull terminó en el commit 1f3dc7a; la corrección de la regex se publicó después en 6553c17 y la documentación en 455c598. Por tanto, el error mostrado corresponde a una revisión anterior a la corrección.
- El estado combinado del commit 455c598 muestra Vercel failure por build-rate-limit; no es un resultado de la suite Orby.

### Siguiente validación necesaria
- El usuario debe actualizar a la revisión que contiene 6553c17 y ejecutar npm run test:orby. Solo después de ver los fallos reales restantes se deben corregir los asserts de comportamiento que estén desactualizados, sin borrar pruebas válidas ni debilitar cobertura.
- No se debe declarar cero errores hasta que la suite, TypeScript/ESLint y build hayan terminado correctamente.
- Sin cambios a main ni despliegue.

## Auditoría profunda y primera ronda de correcciones — 7 de noviembre de 2026

### Evidencia de partida
Se tomó como evidencia el log local compartido por el usuario, que reportaba siete pruebas fallidas. Se contrastaron las aserciones con los archivos reales de la rama `feat/founder-intro`, en lugar de asumir que cada fallo representaba una regresión funcional.

### Causas identificadas y correcciones aplicadas

1. **La pizarra descartaba snapshots visuales sin bloques de texto — bug real corregido.**
   - `sanitizeOrbyBoard` exigía al menos un bloque textual antes de procesar cualquier tablero.
   - El contrato Live permite que el primer snapshot sea un dibujo pequeño y que el texto llegue en una actualización posterior. La validación rechazaba precisamente ese flujo visual progresivo.
   - Ahora la versión 2 acepta snapshots con visuales y cero bloques; sigue rechazando un tablero completamente vacío. La versión 1 conserva la exigencia de bloques de texto.
   - Commit: `987ccf3a5fc67cb21cdf8293fc5101c5276cbd24`.
2. **Las pruebas de la pizarra estaban acopladas a una implementación antigua — pruebas corregidas, no lógica degradada.**
   - El renderizador ya utiliza `getOrbySketchStrokeTiming`; los tests buscaban una variable intermedia `strokeTimings` y una fórmula duplicada dentro del componente.
   - El contrato JSX real usa `pathLength={1}`, no el texto HTML `pathLength="1"`.
   - El schema Live ya incluye `annotation`; la aserción esperaba una lista antigua que omitía ese tipo.
   - Se actualizaron las comprobaciones para verificar el helper real, su uso en el componente, la forma JSX y el conjunto actual de tipos.
   - Commits: `55af96ce6daa156dcfe0e367514f8199115ecd82` y `134204d222413cddb4770e2d8d4cf6c4e24707ce`.

3. **La prueba de montaje de la hoja esperaba un JSX que ya no existe.**
   - La clase ahora monta el tablero dentro del contenedor `orby-class-board` y pasa `drawingActive` para sincronizar la pausa de voz.
   - Se ajustó la aserción para comprobar ese contrato actual, sin eliminar la verificación de que la hoja se reserva y muestra el tablero validado.

4. **La instrucción pedagógica sí prohibía inventar datos, pero la prueba exigía una frase literal distinta.**
   - Se hizo explícita y más legible la regla: no inventar afirmaciones, evidencias, porcentajes ni distribuciones oficiales.
   - Commit: `cd0151cecd838493fcc8d67342c56de925fa2dc4`.

5. **Movimiento reducido.**
   - La hoja ya cuenta con reglas `prefers-reduced-motion` que desactivan animaciones de tinta, lápiz y aparición, y ocultan la punta del lápiz.
   - Se añadió una regresión que comprueba ese contrato; no se sustituyó la animación real por una solución estática para todos los usuarios.

### Auditoría adicional del flujo inspeccionado
- La sesión Live autentica al usuario, aplica rate limit, limita la vigencia del token efímero y devuelve errores explícitos al agotarse la cuota gratuita; no activa un proveedor de pago como fallback.
- El historial persistido se consulta por `conversation_id` y `user_id`; las señales adaptativas se consultan por usuario y materia canónica.
- La herramienta de pizarra es NON_BLOCKING y el contrato indica que la voz no debe esperar su ejecución.
- Las acciones de foco, borrado y reemplazo validan IDs, geometría y unicidad antes de modificar trazos.
- La superficie de clase no contiene herramientas de tinta del estudiante; el lápiz es una animación SVG asociada a los trazos de Orby.

### Validación y límites
- Se verificó en GitHub el estado combinado del commit `134204d222413cddb4770e2d8d4cf6c4e24707ce`: Vercel informa `failure` con destino `build-rate-limit`. Ese estado no demuestra que los tests Node hayan fallado ni que el código compile; indica que Vercel no completó la comprobación por su límite de builds.
- No se ejecutaron Node tests, TypeScript, ESLint, build ni una llamada real de Gemini Live desde este entorno. Por tanto, estas mutaciones no se declaran verificadas en ejecución.
- La revisión de archivos fuente no sustituye una auditoría de RLS/migraciones, pruebas de navegador ni una prueba de carga real. Esas áreas siguen abiertas.
- No se modificó `main`, no se desplegó, no se añadieron dependencias ni proveedores/API de pago.


### Hallazgo adicional — import faltante del temporizador de trazos
- La revisión del componente completo detectó un defecto de ejecución que los tests de regex anteriores no capturaban: `OrbyBoard.tsx` llamaba `getOrbySketchStrokeTiming`, pero solo importaba los tipos del módulo. El helper no existía en el ámbito de ejecución del componente.
- Se corrigió el import como valor junto con los imports de tipos y se añadió una regresión que exige ese import explícito.
- Commit de código: `b936ac96346a5cae91d3b73a8859927be3d5af9b`.
- Commit de regresión: `f77fd399d2973a355ca6185a93fbaf7bdfb74e2f`.
- Este defecto podía provocar un error de referencia al renderizar un sketch; no se debe considerar cerrado hasta que TypeScript y la prueba de navegador confirmen el render real.


### Ajuste de precisión de las regresiones
- Se verificó el JSX real de la clase: el tablero se monta con `drawingActive={voiceBoardDrawingActive}`; la aserción antigua sin esa prop fue reemplazada por la forma efectiva.
- Se corrigió el patrón de prueba de `prefers-reduced-motion` para que coincida con el CSS real, sin exigir barras invertidas que no existen en la hoja de estilos.
- Commit: `1336e5fbaa65b6328540776955d6df8b32ff1eda`.


### Rectificación de la hipótesis sobre duración de Gemini Live
- La revisión inicial de la ruta del servidor no mostraba toda la configuración: el manejo de sesión está implementado en el cliente, en `LessonAITutor.tsx`.
- La configuración real sí activa `contextWindowCompression: { slidingWindow: {} }` y `sessionResumption`; el cliente recibe `sessionResumptionUpdate`, conserva el handle por conversación, atiende `goAway` y reintenta la reanudación con un token efímero nuevo.
- Por tanto, **no se registra como bug la ausencia de reanudación**. La hipótesis inicial queda descartada tras inspeccionar el código completo.
- Queda pendiente QA real de reconexión: probar cierre voluntario del socket, evento `goAway`, handle no resumible, token expirado, límite de cuota y preservación de audio/micrófono. La presencia de código no certifica que esos caminos funcionen en Chrome.


### Bug real — reanudación no autorizada por el token efímero
- El navegador ya solicitaba `sessionResumption` y manejaba `sessionResumptionUpdate` / `goAway`, pero el servidor no incluía esa capacidad en `liveConnectConstraints.config` al crear el token efímero.
- La documentación oficial de Gemini especifica que la reanudación debe autorizarse en el token del servidor; pedirla únicamente desde el cliente no basta. También se autoriza explícitamente la compresión deslizante que el cliente ya utiliza.
- Se añadió `sessionResumption: {}` y `contextWindowCompression: { slidingWindow: {} }` a las restricciones del token. No se modificó el algoritmo de reconexión del navegador.
- Código: `7ab8b8f224d8204340d616603bc52dcaa511124e`.
- Regresión: `455b030245e452f6d502a1f33816a39368750886`.
- Fuentes oficiales revisadas: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens y https://ai.google.dev/gemini-api/docs/live-api/session-management.
- Pendiente de prueba real: comprobar que el servidor emita un `sessionResumptionUpdate` válido tras un turno completo y que la reanudación recupere contexto y audio sin saltar a fallback.


## Continuidad protegida durante reconexión Live — siguiente ronda

### Auditoría
- Se inspeccionó el ciclo completo de `reconnectLiveSession` y el grafo de audio.
- Durante una reanudación se reemplaza únicamente `voiceChannelRef`; el stream del micrófono, el AudioWorklet, la fuente de micrófono y el estado del tablero no se limpian ni recrean.
- El Worklet consulta `voiceChannelRef.current` por cada bloque PCM, por lo que vuelve a enviar audio por el canal reanudado sin reconstruir la captura.
- La reconexión reutiliza el handle de la misma conversación y no reinicia el turno pedagógico. Si hay una llamada de herramienta pendiente, se evita reenviar un ID de tool obsoleto y se recupera la pregunta por el modo alternativo gratuito.
- Se confirmó también que la interfaz de clase mantiene la pizarra exclusiva de Orby y que el control de salida finaliza la sesión explícitamente.

### Protección añadida
- Se añadió una regresión que exige que el ciclo de reconexión no anule el stream, el Worklet ni la referencia del tablero, y que sustituya el canal solo después de restaurar la sesión.
- Commit de prueba: `3c119e70c9ec5f4ec4b43805fee915837be0d545`.

### Límites
- Esta protección es estática: no sustituye una prueba real de WebSocket/AudioWorklet en navegador.
- No se modificaron el algoritmo de dibujo, los tipos visuales, la animación SVG, la secuencia acumulativa ni las instrucciones de docencia visual.
- No se tocó `main`, no se desplegó y no se añadieron servicios de pago.


## Registro consolidado de los siete fallos reportados — 2026-11-07

Este apartado consolida el reporte local compartido después de la primera ronda de correcciones. Los siete fallos son hallazgos de pruebas; no deben contarse automáticamente como siete bugs de producción. Se separan defectos reales, contratos de prueba desactualizados y puntos que todavía requieren reproducción.

| # | Área reportada | Clasificación actual | Evidencia / estado |
|---|---|---|---|
| 1 | Reserva de la pizarra / primer render | **Bug real corregido en código; QA pendiente** | El sanitizador rechazaba un snapshot Live versión 2 que contenía visuales pero todavía ningún bloque de texto. Se permitió esa forma válida de snapshot, manteniendo el rechazo de tableros completamente vacíos y la exigencia de texto para versión 1. Commit `987ccf3a5fc67cb21cdf8293fc5101c5276cbd24`. |
| 2 | Temporización de la animación del lápiz | **Parte era una expectativa antigua; defecto de import corregido; runtime pendiente** | El componente usa el helper compartido `getOrbySketchStrokeTiming`; la prueba buscaba una variable intermedia/fórmula que ya no pertenece a la implementación. Después se detectó que el componente no importaba el helper como valor. Se corrigió el import y se añadió regresión: `b936ac96346a5cae91d3b73a8859927be3d5af9b` y `f77fd399d2973a355ca6185a93fbaf7bdfb74e2f`. Aún falta confirmar la temporización visual en Chrome. |
| 3 | Contrato de herramientas Gemini Live | **Prueba desactualizada; contrato actualizado; runtime pendiente** | El schema actual incluye `annotation` y tipos visuales que no aparecían en la lista antigua de la prueba. Se actualizaron las aserciones para reflejar el contrato actual. Esto no sustituye probar que Gemini Live acepte y despache todas las herramientas en una sesión real. |
| 4 | Exclusividad de la pizarra de Orby | **No certificado** | El requisito funcional es que el estudiante no tenga herramientas para escribir/dibujar y que el lápiz represente acciones de Orby. El reporte indicó discrepancias entre las condiciones de animación y las expectativas de prueba. El código/documentación describe una pizarra exclusiva de Orby, pero falta una prueba de interacción que demuestre que no existe ruta de escritura del estudiante ni animación indebida al actualizar props. |
| 5 | Sincronización lápiz/tinta (`pathLength`) | **Discrepancia de aserción; comportamiento visual pendiente** | El JSX usa `pathLength={1}`; la prueba antigua buscaba el literal HTML `pathLength="1"`. Se corrigió la expectativa para comprobar JSX real. La presencia del atributo no demuestra por sí sola que el trazo y la punta del lápiz estén sincronizados correctamente en navegador. |
| 6 | Sanitizador de anotaciones con propiedad `undefined` | **ABIERTO — requiere investigación directa** | El reporte detectó una propiedad `undefined` en el flujo de anotaciones y un sanitizador que no cubría completamente ese caso. No hay evidencia suficiente en el registro para declarar este punto corregido. Revisar normalización de entrada, valores opcionales, serialización JSON y límites antes de renderizar o persistir. Añadir pruebas para propiedad ausente, `undefined`, `null`, tipo incorrecto y payload válido. |
| 7 | Perfiles pedagógicos / afirmaciones inventadas | **Instrucción reforzada; validación semántica pendiente** | Se explicitó que Orby no debe inventar afirmaciones, evidencias, porcentajes ni distribuciones oficiales. Commit `cd0151cecd838493fcc8d67342c56de925fa2dc4`. La instrucción reduce el riesgo, pero no constituye un verificador semántico general; hacen falta casos adversariales y positivos para comprobar que no inventa ni elimina datos legítimos. |

### Defectos adicionales confirmados durante la investigación

- **Import faltante del temporizador:** `OrbyBoard.tsx` invocaba `getOrbySketchStrokeTiming` sin importarlo como valor. Corregido en `b936ac96346a5cae91d3b73a8859927be3d5af9b`; regresión en `f77fd399d2973a355ca6185a93fbaf7bdfb74e2f`.
- **Autorización de reanudación Live en token efímero:** el navegador solicitaba `sessionResumption`, pero el servidor no autorizaba esa capacidad en las restricciones del token. Se añadieron `sessionResumption: {}` y `contextWindowCompression: { slidingWindow: {} }`. Código `7ab8b8f224d8204340d616603bc52dcaa511124e`; regresión `455b030245e452f6d502a1f33816a39368750886`. Falta comprobar reconexión real.
- **Primer snapshot visual anterior al texto:** se corrigió la validación para que un dibujo válido pueda aparecer antes de que llegue el primer bloque textual, sin aceptar escenas vacías.

### Estado de validación — no confundir corrección con aprobación

- Último estado de pruebas comunicado por el usuario: 170 pruebas, 165 aprobadas y 5 fallidas. El reporte posterior enumera siete áreas/fallos de auditoría; no implica que los siete sean siete fallos simultáneos de la misma ejecución.
- Se actualizaron aserciones obsoletas y se añadieron correcciones de código, pero **no consta una nueva ejecución completa** que certifique el resultado después de todos esos cambios.
- No hay evidencia de aprobación final de `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` ni `npm run build` sobre el último SHA.
- Vercel reportó `build-rate-limit`; ese estado no debe interpretarse como un error de compilación ni como una suite aprobada.
- No se ha certificado QA real de Chrome/micrófono, dibujo de lápiz, exclusividad de pizarra, reconexión Live ni persistencia.
- Prioridad inmediata: resolver el sanitizador de anotaciones (`undefined`), revisar el contrato de herramientas y las condiciones de exclusividad, y después ejecutar la suite completa sin eliminar aserciones válidas.

### Protección del proyecto

- Rama de trabajo: `feat/founder-intro`.
- No modificar `main`, no hacer merge/Pull, no desplegar y no aplicar migraciones a la base Supabase compartida.
- Mantener el requisito de servicios gratuitos dentro de sus cuotas reales; nunca introducir fallback facturable.
- No reconstruir material del Orby ICFES Lab eliminado intencionalmente.
- No declarar “cero errores” hasta tener resultados verificables de tests, TypeScript, ESLint, build y QA de navegador.

## Decimoquinta mutación — reproducción del tablero de referencia en video

**Fecha:** 7 de noviembre de 2026  
**Rama:** `feat/founder-intro`  
**Referencia de aceptación:** video aportado por el usuario, duración 42,746 s.

### Observación de la referencia

- La hoja digital es una superficie blanca continua y ocupa el centro de la clase.
- El profesor desarrolla el tema progresivamente con escritura manuscrita, contornos, estructuras internas, flechas y etiquetas.
- La tinta utiliza contraste de negro, azul y rojo para separar contorno, explicación y énfasis.
- La punta del lápiz sigue un trazo a la vez; no debe teletransportarse entre partes ni aparecer varios lápices simultáneos.
- Las etiquetas y marcas se incorporan después del recorrido del lápiz correspondiente.
- El estudiante observa la clase: no hay herramientas de escritura del estudiante sobre la pizarra.

### Cambios aplicados en código

| Archivo | Cambio |
|---|---|
| `lib/ai/orby-board.ts` | Se amplió el contrato de tonos a `blue` y `red`; la duración nueva se calcula por longitud geométrica del recorrido, no por número de puntos. La duración queda acotada entre 420 ms y 1.900 ms. |
| `components/aprender/OrbyBoard.tsx` | Hoja simplificada a superficie blanca continua; bloques principales con estilo manuscrito; tinta negra/azul/roja; cola serial de lápiz para que un solo trazo esté activo; nuevos trazos acumulativos conservan su programación. |
| `components/aprender/OrbyBoard.tsx` | La tinta se anima con `stroke-dashoffset` y la punta con `animateMotion` en el mismo reloj SVG; la etiqueta aparece después del trazo. Pausa/reanudación actúa sobre el reloj SVG compartido. |
| `lib/ai/orby-board-actions.ts` | Las correcciones de trazos del profesor aceptan los nuevos tonos sin permitir valores arbitrarios. |
| `lib/ai/orby-live-tools.ts` | El contrato de herramienta Gemini Live describe los colores y cuándo utilizarlos; mantiene snapshots acumulativos e IDs estables. |
| `app/api/orby/realtime-session/route.ts` | Las instrucciones de clase en vivo piden hoja blanca, secuencia incremental, colores consistentes y trazos cortos. |
| `app/api/lesson-tutor/route.ts` | Se alineó el contrato de la pizarra del tutor por turnos con los mismos tonos y criterio visual. |
| `app/globals.css` | Se eliminó la opacidad CSS fija de la punta para que SMIL controle su aparición en la línea temporal compartida. |

### Regresiones añadidas/actualizadas

- Duración basada en geometría del trazo, con límites.
- Aceptación de tinta negra, azul y roja.
- Cola de lápiz con un solo trazo activo y conservación de IDs.
- Línea temporal compartida entre tinta y movimiento del lápiz.
- Pausa y reanudación de la línea temporal SVG.
- Hoja blanca continua sin tarjetas de fórmula ni paneles decorativos.

### Estado de calidad

**Implementación en rama:** cambios guardados en los commits de esta mutación.  
**Pruebas automatizadas:** se actualizaron aserciones estáticas y de sanitización, pero no consta una ejecución completa aprobada sobre el SHA final.  
**TypeScript / ESLint / build:** no certificados.  
**QA visual en Chrome:** pendiente; debe comprobar dibujo, múltiples snapshots rápidos, pausa/interrupción de voz, reanudación, etiquetas, movimiento reducido y exportación PDF.  
**Voz / sincronización semántica:** la pizarra se actualiza por herramientas Live independientes; todavía no existe sincronización exacta por fonema o timestamp del audio.  
**CI externa:** el estado Vercel consultado reportó `build-rate-limit`; esto no certifica ni un fallo del código ni una compilación aprobada.

### Restricciones preservadas

- Solo `feat/founder-intro`; no tocar `main`.
- No merge, deploy ni migración remota.
- Sin nuevos servicios ni llamadas facturables.
- No reintroducir herramientas de escritura del estudiante.
- No reconstruir el material eliminado intencionalmente del Orby ICFES Lab.

**Criterio de salida:** no declarar el tablero terminado hasta que la prueba funcional de voz/dibujo en Chrome confirme que el mismo trazo, lápiz y etiqueta avanzan coordinados y sin saltos.


### Corrección posterior al primer build de la mutación — 7 de noviembre de 2026

**Hallazgo del despliegue:** el commit `c1cfd2b40f8a754c540366e56046d1bcdfe61089` sí llegó a ejecutar `npm run build` y terminó con error por aserciones de tests, no por una excepción de TypeScript informada en los logs consultados.

**Fallos identificados en los logs:**
- `cada prueba Saber 11 recibe una rutina pedagógica y de tablero propia`: la prueba comparaba una frase con mayúsculas/minúsculas de forma estricta, aunque la instrucción pedagógica era equivalente. Se normalizó la instrucción a minúsculas en la aserción.
- `el lápiz y la tinta comparten temporización lineal para permanecer sincronizados`: la aserción esperaba `animationTimingFunction` y `animationPlayState` CSS. El renderizador ya no usa ese mecanismo; las tres animaciones ahora comparten el reloj SVG. La prueba se sustituyó por verificaciones de SMIL, cola serial y `pauseAnimations/unpauseAnimations`.

**Correcciones guardadas:** commit `3f2fbd440ba0f30e38770670632b64bb2e938975`.

**Resultado posterior:** el check de Vercel para el commit corregido muestra `build-rate-limit`, y no se encontró una nueva ejecución de despliegue para ese SHA. Por tanto, las aserciones anteriores están corregidas en el código de pruebas, pero el build posterior continúa **sin verificar**. No declarar la suite verde.


### Ajustes finales de paleta, rótulos y trazos — 7 de noviembre de 2026

- La tinta principal y los contornos del tablero usan negro oscuro; `blue` usa azul; `red` y el tono heredado `accent` usan rojo para evitar que el contrato antiguo vuelva a introducir naranja en la escritura.
- Los textos SVG del tablero heredan la familia manuscrita de los bloques escritos. Se conserva la legibilidad de diagramas y etiquetas.
- La punta del lápiz permanece visible hasta el 96 % del recorrido y solo se desvanece al terminar.
- El contrato de corrección `apply_orby_board_action` ahora documenta explícitamente los tonos admitidos, para que Orby no cambie la paleta al corregir un trazo.
- Se reforzaron las pruebas estáticas para verificar paleta, rótulos y finalización del lápiz.

**Commits relevantes de la ronda:** `9dae15f`, `b38dc04`, `e7d6e22`, `8788147`, `ae1277d`, `31224b0`, `5e62d00`, `2ea808a`, `8aad8c9`, `8550daf`, `919300f`, `3f2fbd4`, `aa5521d`, `6806471`, `8044280`, `dea8391`, `9dd8d85`, `e02c4f0`.

**Validación al último commit de código:** el check Vercel sigue mostrando `build-rate-limit`; no existe una ejecución nueva de GitHub Actions visible. La última compilación ejecutada terminó por pruebas antiguas desactualizadas, que se corrigieron posteriormente. El código actual permanece sin confirmación de build verde.


## Mutación — cierre de sanitización, guards y continuidad de la pizarra de Orby

**Fecha de trabajo:** 7 de noviembre de 2026  
**Rama:** `feat/founder-intro`  
**Referencia visual:** video de clase compartido por el usuario (42,746 s).

### 1. Sanitizador de anotaciones: propiedades opcionales

- Se corrigió el tratamiento de `title` y `label` en anotaciones: campo ausente o explícitamente `undefined` se normaliza/omite; `null`, números u objetos se rechazan.
- Cada punto se reconstruye copiando únicamente `x` e `y`; metadatos auxiliares del SDK, aunque contengan `undefined`, no pasan al modelo de salida.
- El tono y la geometría siguen dentro de las listas permitidas y de los límites del lienzo.
- Se aplicó el mismo criterio a las acciones del profesor `focus` y `replace`: optionals ausentes/undefined se omiten y valores mal formados se rechazan.
- Regresiones añadidas para: annotation sin optionals, annotation con optionals undefined, metadata undefined en puntos, null/tipos incorrectos, coordenadas inválidas y replacement/focus con labels opcionales.

### 2. Una sola capa de escritura y un solo lápiz

- `sanitizeOrbyBoard` rechaza más de una visual `sketch` por tablero. Todos los trazos libres deben pertenecer a una única visual acumulativa.
- `applyOrbyBoardAction` también rechaza tableros con capas sketch paralelas; no se permite corregir o señalar una escena que generaría varios relojes de lápiz.
- El contrato de Gemini Live y el prompt del tutor por turnos indican explícitamente una sola visual sketch acumulativa.
- La capacidad se alineó con el máximo funcional de ocho actualizaciones por turno y hasta cinco trazos nuevos por actualización: **40 trazos acumulativos por visual**.
- Se conserva el límite duro de **18 KB por tablero completo**, además de límites por puntos, geometría, texto y cantidad de visuales. Los dibujos grandes deben rechazarse antes de renderizar o persistir.
- La sesión Live y el tutor por turnos ya expresan el mismo máximo de 40 y la misma regla de capa única.

### 3. Pausa coordinada de toda la hoja

- `OrbyBoard` ahora mantiene una referencia a la hoja y pausa/reanuda cada SVG descendiente con `pauseAnimations/unpauseAnimations`.
- El estado `data-orby-drawing-active` se aplica a la hoja raíz.
- CSS detiene las animaciones de revelado, anotaciones, trazos y etiquetas cuando la voz se interrumpe; no se limita al sketch principal.
- La cola de lápiz conserva una sola secuencia temporal, con una preparación de 60 ms para montar los nodos SMIL y 110 ms de levantamiento entre trazos.
- El primer trazo se programa después de montar el DOM; los trazos acumulados ya programados conservan su tiempo y su ID, evitando reinicios innecesarios.

### 4. Estabilidad de React y de las etapas acumulativas

- El `useId` del marcador de anotación se movió al nivel superior de `Visual`; ahora se llama incondicionalmente antes de decidir la primitiva que se renderiza.
- La identidad de cada bloque y visual depende del tipo y su posición, no del texto/título. Una actualización acumulativa del texto no debe desmontar y volver a animar etapas anteriores.
- La identidad de un trazo depende del ID, geometría, tono y grosor. Cambiar solo una etiqueta no vuelve a dibujar el trazo ya completado.

### 5. Regresiones y revisión del conjunto

Se incorporaron o actualizaron pruebas para:
- Normalización de annotation `undefined`, ausentes, `null` y tipos inválidos.
- Acciones `focus/replace` y sus optionals.
- 40 trazos aceptados, 41 rechazados y bloqueo por bytes.
- Rechazo de dos visuales sketch y de acciones sobre capas paralelas.
- Pausa/reanudación de todos los SVG y del CSS de la hoja.
- Hook `useId` incondicional.
- Claves estables para que las etapas acumulativas no se desmonten al cambiar el texto.
- Asociación de la pizarra/historial/apuntes al ID del mensaje, no al título de la clase.

El archivo `tests/orby-request-filter.test.mjs` contiene actualmente **215 pruebas declaradas**; la inspección del archivo no encontró pruebas vacías ni nombres duplicados. Esta inspección estructural no equivale a ejecutar esas pruebas.

### Estado de validación

- **Pruebas ejecutadas:** no certificadas en esta ronda; no se dispone de un entorno de ejecución del repositorio desde el conector.
- **TypeScript / ESLint / build:** pendientes de una ejecución real sobre el SHA final.
- **CI:** Vercel continúa devolviendo `build-rate-limit` para la rama; no aparece un nuevo workflow de GitHub Actions. No se debe confundir la limitación de CI con un build verde o con un error nuevo del código.
- **QA Chrome:** todavía pendiente comprobar trazos múltiples, actualización durante un trazo, focus/erase/replace, interrupción y reanudación de voz, etiquetas y movimiento reducido.
- **No se declara “cero errores” ni equivalencia visual final hasta completar ejecución automatizada y reproducción real del video en navegador.**

### Commits clave de esta mutación

- Sanitizador annotation undefined: `61bfab1165567b9c8fe731858329dfef60885589`.
- Regresiones de annotation: `cdde8c8efd7cc006bb067fc30739dcbf5cc95d87`.
- Capacidad acumulativa 40 y esquema: `3766d3d42cc67aa546a373268e21b581d71a4936`, `c933e7ec4efa6c0fa964ea00f80f5b31871efc8b`, `db8cce81a1394bd4b74a416d6abe14841de0a0d4`.
- Pausa integral de SVG/CSS: `b6efff10807dc0e24df32ddade3a94e3a8fecdc9`, `79913c44235e2141f33758139eebd490e6ed93af`.
- Capa sketch única: `e18a75e6c7315a17e8e0df4c0bd21f7395447bde`, `e9be72d97a1440889d822996870f75f593eebdd9`.
- Hook y claves estables: `79f2ff17566a6596e3c41b1789e22e3af46834df`, `9e778324f7ff64993dd8b1b1acfa5d5d5d0a79ce`.
- Cola con margen de montaje y pausa de levantamiento: `2ca48ef4ef1f1f7c79dcfbb68e92654622a92c4a`.
- Regresiones de guards/cola: `eb63721425aca158ddde0fc657431dd76629df4f`, `a1c4c72286902d1b80bb7db9b0ab344d820841b7`, `8290ea3b2207babf3fecab1745d9403ecbae031e`, `b666fe2a9198a12f43cdf477949260be91b411b6`.
- Prompt Live máximo 40: `522a64f924f695023aca26442fd5dd153b311f0e`.

### Orden de continuidad

1. Obtener ejecución automatizada completa cuando CI lo permita: `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
2. Hacer QA real en Chrome de una clase completa con 1, 5, 16 y 40 trazos, snapshots consecutivos, corrección de un trazo, interrupción y reanudación.
3. Comparar la secuencia visual y la voz con el video; corregir cualquier salto, desfase o reinicio antes de continuar con mejoras periféricas.

**Protección:** solo `feat/founder-intro`; sin merge a `main`, deploy, migraciones Supabase ni servicios de IA facturables. El material del Orby ICFES Lab eliminado intencionalmente no se reconstruye.

## Reconciliación integral del tutor existente con la referencia en video — 7 de noviembre de 2026 (UTC−05)

**Rama inspeccionada:** `feat/founder-intro`  
**Video de aceptación:** `1000189532.mp4`, duración 42,746 s.  
**Documentos cotejados:** este registro diario, `ORBY-IMPLEMENTATION-AUDIT.md`, `ORBY-LIVE-TUTOR-SPEC.md` y `ORBY-VOICE-WHITEBOARD-SPEC.md`.  
**Archivos de fuente cotejados:** `LessonAITutor.tsx`, `OrbyBoard.tsx`, `orby-board.ts`, `orby-board-actions.ts`, `orby-live-tools.ts`, `orby-scope.ts`, rutas Live y tutor por turnos, estilos y suite de regresión.

> Esta sección reconcilia el trabajo ya realizado. No crea un tutor nuevo, no sustituye la arquitectura existente y no afirma que las capacidades inspeccionadas hayan pasado QA de navegador.

### 1. Inventario de capacidades que ya existen — no duplicar ni retirar

| Capacidad | Evidencia en la rama | Madurez real |
|---|---|---|
| Escenario de clase de voz, estado de micrófono, subtítulos y controles de llamada | `LessonAITutor.tsx` | Implementado en interfaz; QA real pendiente |
| Subtítulos de salida y continuidad entre llamada y chat | Transcripción Live validada, mismo mensaje de asistente y tablero asociado por ID | Implementado; sin alineación palabra-a-palabra garantizada |
| Herramienta de tablero no bloqueante con snapshots completos y acumulativos | `render_orby_teaching_board` y manejador Live | Implementado; depende de que Gemini emita llamadas válidas |
| Fallback por turnos con tablero versión 2 y visuales tipados | `app/api/lesson-tutor/route.ts` | Contrato implementado; QA de desconexión pendiente |
| Primitivas visuales educativas | `orby-board.ts` y `OrbyBoard.tsx`: sketch, annotation, diagram, graph, vectors, table, timeline, molecule, circuit, cell, dna, punnett, cell-division, organ-system, neuron y physiology-process | 16 tipos definidos y sanitizados; no todos equivalen a escritura manual |
| Tinta acumulativa y lápiz serial | IDs estables, una sola visual sketch, cola SVG, duración geométrica y margen de levantamiento | Implementado en código; sincronización visual real no certificada |
| Interrupción y pausa de dibujo | `drawingActive`, pausa/reanudación SVG y reglas CSS | Implementado; falta QA de navegador a mitad del trazo |
| Operaciones teacher-only | `focus`, `erase`, `replace`, IDs únicos, halo independiente y corrección de geometría | Implementadas en contrato, sanitizador y enrutamiento |
| Exclusividad del profesor | No hay herramientas de tinta, borrador ni controles de escritura del estudiante | Decisión preservada; no restaurar las herramientas retiradas |
| Guardado de apuntes y exportación | Apuntes estructurados y diálogo de impresión/PDF | Implementados; fidelidad de exportación pendiente de QA |
| Pedagogía de las cinco áreas Saber 11 | Perfiles en `orby-scope.ts` para Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés | Implementados como directivas; precisión semántica sigue requiriendo evaluación |
| Diagnóstico y enseñanza adaptativa | Resumen de señales y directiva pedagógica acotada por usuario/materia | Implementados; dependen de señales válidas existentes |
| Reconexión, historial y protección de turnos | Handle de reanudación, compresión de contexto, generaciones y persistencia atómica | Código presente; reconexión y persistencia real pendientes de QA |
| Restricción económica | Sin proveedores nuevos ni fallback de voz facturable silencioso; cuotas y errores explícitos | Restricción de diseño preservada |

La base existente es sustancial. La siguiente fase debe **conectar y completar estas capacidades**, no volver a implementarlas en paralelo.

### 2. Lectura precisa del video — criterio visual que prevalece

La referencia no es una columna de bloques seguida de una imagen. Es una composición didáctica libre sobre una misma superficie de escritura:

- Fondo blanco con una **cuadrícula de puntos muy tenue**. La descripción histórica de una hoja lisa/sin cuadrícula no reproduce este detalle del video y queda rectificada para la aceptación visual.
- Título manuscrito en la zona superior, con énfasis/subrayado.
- Notas y conceptos a la izquierda, conectados por flechas con el dibujo principal.
- Esquema biológico grande en el centro: contorno celular, núcleo y estructuras internas.
- Etiquetas y anotaciones laterales a la derecha, incluyendo una explicación contextual.
- Tinta negra para contornos y texto principal, azul para estructuras/etiquetas y rojo para énfasis, subrayados y conexiones.
- El lápiz/indicador acompaña el trazo que se está construyendo; no debe saltar entre zonas ni hacer que una figura completa aparezca de golpe.
- Los subtítulos permanecen en el área inferior de la clase, separados del lienzo, mientras voz y tablero avanzan en paralelo.

La prueba de aceptación no es que aparezca “una célula” ni que haya un SVG bonito: es reproducir **la distribución espacial, el orden pedagógico y la sensación de construcción en vivo** observados entre los segundos 26 y 38 del video.

### 3. Brechas actuales confirmadas al cotejar código y especificaciones

#### P0 — El modelo de datos no representa todavía una pizarra espacial ordenada

- `OrbyBoard` mantiene `blocks[]` y `visuals[]` como colecciones separadas.
- `OrbyBoard.tsx` renderiza todos los bloques primero y después cada visual en secciones independientes.
- Los bloques de texto no tienen posición, tamaño ni relación espacial con trazos, flechas o anotaciones.
- Los visuales se dibujan en componentes separados; el sketch usa un `viewBox` cuadrado 100×100. No hay un sistema de coordenadas compartido para componer un título, notas laterales, esquema central y callout en un solo lienzo apaisado.
- El retraso de aparición de las secciones visuales depende de `board.blocks.length`. Al cambiar la cantidad de bloques, puede cambiar el retraso calculado para una visual que ya estaba montada. La clave React estable no corrige por sí sola este acoplamiento temporal.

**Consecuencia:** la implementación puede presentar texto y diagramas durante una misma clase, pero no puede reproducir todavía la composición libre del video.

#### P0 — El contrato Gemini y el sanitizador tienen distinta fuerza

- El sanitizador aplica límites estrictos: bloques, visuales, puntos, IDs, tonos, geometría y presupuesto completo de 18 KB.
- La declaración de `render_orby_teaching_board` describe varios límites en prosa, pero los arreglos de visuales no expresan de forma consistente `minItems/maxItems`; los IDs se declaran como cadenas sin longitud/formato formal; y varios campos enumerados se describen, pero no se restringen con enum.
- En la revisión del schema de render se identificaron 24 propiedades declaradas como arreglos y ninguna con `minItems/maxItems` formales. Es una medida estructural del archivo, no una prueba de que Gemini siempre produzca datos inválidos.
- El SDK fijado por el lockfile es `@google/genai@2.17.1`. Su interfaz oficial `Schema` documenta `minItems`, `maxItems`, `minLength`, `maxLength`, `pattern`, `enum`, `minimum` y `maximum`. Para `minItems/maxItems/minLength/maxLength`, la interfaz declara valores de tipo string. La aceptación efectiva debe comprobarse con un pequeño test de contrato Live; el sanitizador de cliente sigue siendo la autoridad final.
- Referencia SDK: https://googleapis.github.io/js-genai/release_docs/interfaces/types.Schema.html

**Consecuencia:** el modelo puede recibir una descripción menos precisa que las reglas que el cliente utiliza para rechazar el tablero. El siguiente trabajo debe alinear ambos contratos sin relajar el sanitizador ni crear una definición desmesurada que el endpoint Live no acepte.

#### P1 — La especificación anterior de `spokenCue` está desfasada

- `ORBY-VOICE-WHITEBOARD-SPEC.md` conserva una propuesta histórica de `spokenCue` y coincidencia de frase con transcripción.
- La herramienta Live actual no declara `spokenCue`; el cliente publica el snapshot aceptado inmediatamente y las pruebas rechazan volver a sincronizar por coincidencia textual.
- `ORBY-LIVE-TUTOR-SPEC.md` establece el criterio más seguro: usar referencia a segmentos/eventos de narración solo cuando el proveedor entregue metadatos fiables; no inventar timestamps ni inferir sincronía exacta a partir de texto.
- Por tanto, la propuesta antigua de coincidencia de frase no debe reintroducirse como solución de sincronización. La sincronía actual es por orden de llamadas/etapas pedagógicas y es aproximada, no fonética ni palabra-a-palabra.

#### P1 — El almacenamiento de snapshot pendiente necesita una prueba de flujo, no un reemplazo apresurado

- El modelo de la herramienta exige que cada snapshot sea el **tablero acumulativo completo**. Por ese contrato, conservar el último snapshot completo pendiente antes de validar la transcripción puede ser correcto: el último debe contener los elementos anteriores que siguen vigentes.
- No clasificar `voicePendingBoardSnapshotsRef` como pérdida de etapas sin reproducir un caso real. La suite existente verifica que el último snapshot sea autoritativo, pero no demuestra por sí sola que varios snapshots reales pendientes se fusionen correctamente.
- Prueba pendiente: enviar dos o más snapshots completos en el estado de prevalidación, comprobar que el último conserva los IDs/etapas previas, validar la entrada y comprobar que se publica una sola escena coherente. Si la prueba falla, corregir el contrato o la acumulación; no convertir indiscriminadamente snapshots completos en una cola que duplique tinta.

#### P1 — La animación actual es una base, no la sincronización completa del video

- Hay revelado CSS de bloques, dibujos SVG con `stroke-dashoffset`, movimiento SMIL del lápiz, etiquetas posteriores, cola serial y pausa/reanudación.
- No existe todavía un flujo general de acciones espaciales intercaladas (escribir nota → dibujar contorno → añadir flecha → señalar etiqueta) con secuencia monotónica compartida.
- La presencia de una llamada de tablero durante el audio no demuestra que cada elemento aparezca en el momento exacto en que se pronuncia. Sin marcas temporales/segmentos del proveedor, no prometer sincronización exacta.

### 4. Arquitectura de continuación — evolución compatible, no reemplazo total

La especificación permanente `ORBY-LIVE-TUTOR-SPEC.md` ya recomienda una secuencia de acciones visuales tipadas. La evolución debe seguir esa especificación y reutilizar los mecanismos existentes:

1. **Conservar compatibilidad:** mantener lectura/renderizado de los tableros versión 1 y 2 y su ruta de fallback. La nueva representación debe ser aditiva y versionada.
2. **Definir una escena espacial compartida:** un lienzo apaisado con coordenadas normalizadas y elementos tipados colocables: texto manuscrito, título, trazo, flecha, etiqueta, énfasis, forma/diagrama y borrado/corrección.
3. **Definir acciones incrementales:** `turnGeneration`, `sequence` monotónico, `actionId` estable, `elementId`, tipo, payload tipado, `dependsOn` opcional y duración sugerida acotada. Las referencias a voz son opcionales y solo se aceptan si Live entrega un segmento verificable.
4. **Aplicar idempotencia:** rechazar acciones duplicadas o antiguas, conservar lo ya dibujado, cancelar acciones pendientes al interrumpir y no mezclar generaciones. Las operaciones existentes `focus/erase/replace` deben seguir trabajando sobre IDs de elementos/trazos existentes.
5. **Un solo lienzo y un solo motor:** los elementos tipados se convierten en primitivas de la misma superficie; no crear múltiples SVG de sketch con relojes de lápiz paralelos.
6. **Añadir el fondo de puntos con baja intensidad:** debe ayudar a orientar la escritura sin competir con el contenido y respetar impresión, contraste y movimiento reducido.
7. **Renderizar el estado final estático:** si hay movimiento reducido, interrupción o exportación, la información completa sigue legible sin depender de animaciones.

No se aprueba todavía una versión 3 de código ni se cambia el contrato en esta mutación documental. Primero se diseña y prueba la compatibilidad con los datos, persistencia y fallback actuales.

### 5. Criterios de aceptación nuevos, medibles y comparables con el video

- Lienzo apaisado de relación de aspecto adaptable, con cuadrícula de puntos sutil y sin tarjetas separadas que rompan la composición.
- Título arriba, notas/conceptos a la izquierda, dibujo principal central y anotaciones explicativas a la derecha; en móvil, distribución responsive sin perder el orden.
- En una clase biológica comparable al video, mostrar en secuencia contorno celular → núcleo/ADN → ribosomas/relaciones → mitocondria → flecha/ATP → explicación lateral. No anticipar elementos antes de explicarlos.
- La misma secuencia debe poder intercalar texto, trazos, flechas y etiquetas en el orden de enseñanza.
- Cada acción aparece una sola vez; los elementos anteriores no parpadean ni se redibujan cuando llega la siguiente actualización.
- Un solo lápiz activo; punta y tinta comparten tiempo; pausa durante interrupción y cancelación de eventos antiguos.
- Al pedir «repite esa parte», focus debe señalar sin agregar tinta; replace/erase solo afectan los IDs elegidos.
- La voz inicia sin esperar al tablero; subtítulos son de la transcripción de Orby validada, nunca de la pregunta del alumno.
- Si no existe alineación fiable del proveedor, se mantiene sincronía por secuencia/eventos y se documenta como aproximada.
- Probar snapshot rechazado, snapshot completo acumulativo, snapshots en prevalidación, cambio de generación, reconexión, fallback, movimiento reducido, exportación PDF y cuotas gratuitas sin proveedor facturable.

### 6. Validación y límites de esta reconciliación

- Se confirmó en GitHub la presencia de los archivos y contratos descritos. Esta revisión es estática; no ejecutó Node, TypeScript, ESLint, build, micrófono ni Chrome.
- La suite contiene 215 declaraciones `test()` en `tests/orby-request-filter.test.mjs`; varias comprobaciones de tablero son aserciones estáticas del código. El número de tests no es un resultado de tests aprobados.
- Último estado de Vercel consultado: `build-rate-limit`. No hay una nueva ejecución visible de GitHub Actions para certificar el SHA actual.
- La comparación de ramas consultada muestra `feat/founder-intro` divergente (3387 commits ahead, 9 behind). No hacer merge, rebase ni cambios en `main`.
- No se modificó código, datos, RLS, migraciones ni despliegue como parte de esta reconciliación.
- No se reintroducen herramientas de dibujo del estudiante, material eliminado intencionalmente del Orby ICFES Lab, proveedores de pago ni llamadas adicionales de IA por defecto.

### 7. Orden de trabajo inmediato

1. Diseñar el schema espacial/acciones con compatibilidad v1/v2 y documentar sus invariantes antes de tocar el renderer.
2. Alinear schema Gemini con los límites del sanitizador y probar la declaración Live en aislamiento; mantener el sanitizador como autoridad.
3. Implementar el lienzo apaisado compartido, la cuadrícula punteada sutil y las posiciones libres de texto/dibujo.
4. Adaptar el renderer para consumir acciones ordenadas en un solo reloj/lienzo, preservando focus/erase/replace y cancelación por generación.
5. Añadir pruebas unitarias de secuencia, idempotencia, dependencias, snapshots completos y prevalidación.
6. Ejecutar `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build` y QA real en Chrome cuando la vía de CI/ejecución esté disponible sin generar coste.
7. Comparar una clase completa con el video y registrar primera palabra audible, primer audio, primera acción visual, latencia entre voz/acción, acciones rechazadas, cancelaciones y resultado final.

**Regla de cierre:** no declarar el tutor equivalente al video hasta reproducir visualmente la composición y el orden de escritura/dibujo en navegador. La base existente se conserva; la meta es conectarla y elevarla, no rehacerla.

### Precisión técnica posterior — schema oficial de `@google/genai`

La inspección de la documentación oficial del SDK corrige una formulación de la auditoría anterior:

- La interfaz `Schema` de `@google/genai` sí declara `minItems`, `maxItems`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum` y `enum`.
- En esa interfaz, `minItems`, `maxItems`, `minLength` y `maxLength` están tipados como **string**, no como number.
- La documentación del SDK indica que `enum` debe acompañarse de `format: "enum"`.
- El schema de `render_orby_teaching_board` inspeccionado no usa actualmente estas restricciones formales de forma consistente; muchos límites están escritos solo en `description`. Los IDs tampoco declaran formalmente el patrón que valida `safeId()`.
- Esto es una brecha real de alineación entre schema y sanitizador, pero **no permite afirmar que el servidor Live acepte automáticamente cada restricción sin prueba**. El siguiente paso es un test mínimo de contrato con la versión instalada `@google/genai@2.17.1` y una validación de la declaración en el endpoint Live, conservando `sanitizeOrbyBoard` como última autoridad.

Referencia consultada: https://googleapis.github.io/js-genai/release_docs/interfaces/types.Schema.html

### Rectificación de la hipótesis de snapshots pendientes

- El contrato exige que cada snapshot de pizarra sea completo y acumulativo. Por eso, guardar únicamente el último snapshot completo pendiente antes de validar la transcripción **no prueba por sí solo pérdida de etapas**: el último debería contener todos los elementos anteriores que deben permanecer.
- La prueba existente `la pizarra Live acepta la última instantánea completa como estado autoritativo` documenta esa semántica.
- Se mantiene pendiente un caso de integración con dos o más snapshots completos recibidos durante prevalidación: el último debe preservar IDs y etapas previas, y solo una escena coherente debe publicarse al validar el turno.
- No convertir snapshots completos en una cola ciega: podría duplicar trazos y volver a animar contenido antiguo. Solo cambiar el flujo si la reproducción muestra una pérdida real.

### Estado documental consolidado

- Esta reconciliación se añadió a la bitácora diaria original; no se creó un segundo documento de continuidad.
- La especificación permanente `ORBY-LIVE-TUTOR-SPEC.md` sigue siendo el contrato de aceptación de la experiencia incremental.
- La sección histórica de `ORBY-VOICE-WHITEBOARD-SPEC.md` que describe `spokenCue` por coincidencia de frase queda marcada como obsoleta por el addendum de esa especificación; no debe reintroducirse sin metadatos de voz fiables.
- El código de aplicación no se modificó en esta reconciliación. Se actualizaron únicamente documentos de continuidad/especificación.

## Primera implementación del lienzo espacial docente — contrato y renderer v2

**Objetivo de esta mutación:** comenzar la evolución del tutor real sobre las piezas existentes, sin reemplazar voz Live, snapshots completos, visuales tipados, operaciones teacher-only, historial ni fallback.

### Entrega implementada

1. **Contrato espacial opcional en OrbyBoard v2**
   - Nuevo `OrbyBoardLayout` con `aspectRatio: "16:9"` y `elements[]`.
   - Cada etapa contiene `id`, `sequence`, `kind` (`block`/`visual`), `index` y rectángulo normalizado `x/y/width/height`.
   - El layout debe referenciar cada bloque y visual exactamente una vez; no acepta IDs/índices repetidos ni secuencias no monótonas, posiciones/tamaños inválidos ni rectángulos fuera del lienzo.
   - `layout` es opcional para snapshots v2 antiguos. Version 1 sigue siendo texto-only y rechaza el nuevo campo.

2. **Renderer espacial**
   - `OrbyBoard.tsx` conserva el renderer heredado para v1/v2 sin layout.
   - Cuando recibe layout, coloca bloques y visuales en el mismo canvas 16:9, en el orden de `sequence`, mediante posiciones y tamaños porcentuales.
   - Las etapas usan IDs estables como key React para no desmontar ni reiniciar las anteriores al recibir snapshots acumulativos.
   - Se agregó scroll horizontal para conservar la composición apaisada en pantallas estrechas, en vez de aplastar el tablero.
   - La impresión del canvas espacial usa A4 horizontal y conserva la cuadrícula de puntos.

3. **Superficie visual de referencia**
   - Fondo blanco con cuadrícula de puntos muy tenue.
   - Tipografía manuscrita heredada para bloques y etiquetas.
   - Título de la clase en encabezado; el modelo ubica la idea/título pedagógico como bloque dentro del lienzo.
   - El modelo recibe la distribución recomendada: título/idea arriba, notas a la izquierda, dibujo principal al centro y explicaciones/anotaciones a la derecha.
   - Los bloques tienen tamaño tipográfico adaptable al ancho del canvas; el contenido de texto queda contenido en su región.

4. **Contrato Gemini y tutor escrito**
   - `render_orby_teaching_board` ya declara `layout` y sus campos.
   - El schema expresa enum para `aspectRatio`/`kind`, formato/longitud/patrón de IDs, límites de secuencia/índice y rangos numéricos de geometría; el sanitizador sigue siendo la autoridad final.
   - Los prompts de Gemini Live y del tutor por turnos piden una composición espacial completa y snapshots acumulativos que preservan IDs, secuencias y posiciones.
   - El contrato sigue permitiendo v2 legacy sin layout para no invalidar historial ni respuestas antiguas.

5. **Persistencia**
   - Se inspeccionaron `orby_save_turn_with_board` y `orby_save_voice_turn_with_board`: ambas guardan `teaching_board` como JSONB, aceptan v2 y no validan una lista cerrada de propiedades del objeto.
   - La RPC visual existente permite hasta 24 KB; el sanitizador cliente mantiene 18 KB. El layout queda incluido en el mismo objeto, sin nueva columna ni cambio de RPC.
   - **No se creó ni aplicó migración Supabase.**

### Regresiones añadidas

- Layout 16:9 válido con intercalado de bloques y visual.
- Rechazo de aspect ratio incorrecto, IDs duplicados, secuencias repetidas o con huecos, índices duplicados/no existentes, rectángulos fuera del canvas y referencias incompletas.
- Compatibilidad de v1 y v2 sin layout.
- Continuidad de snapshots: IDs, posiciones y secuencias previas permanecen iguales al añadir una nueva etapa.
- Contrato estático compartido entre renderer, herramienta Live, prompts y CSS.

**Suite declarada al finalizar esta mutación:** 220 pruebas en `tests/orby-request-filter.test.mjs`, sin nombres duplicados ni pruebas vacías en la inspección del archivo. Este recuento no equivale a 220 aprobadas.

### Límite funcional de esta primera entrega

El canvas espacial es el primer paso hacia el video, no el final del tutor humano:
- La composición y revelación de etapas ya pueden intercalar texto y visuales; la narración sigue llegando mediante el flujo Live/fallback existente.
- La secuencia de canvas controla orden/revelación, pero todavía no es una alineación fonética o timestamp exacta con cada palabra del audio.
- El mecanismo de snapshots sigue siendo completo y acumulativo. No se convirtió en una cola de fragmentos.
- La herramienta `focus/erase/replace` y el lápiz serial se conservan; falta probarlas en una escena espacial real con voz interrumpida y reanudada.

### Validación honesta

- **Inspección estática:** contratos, renderer, prompts, persistencia JSONB y pruebas revisados en GitHub.
- **Tests ejecutados:** no ejecutados en este entorno; no se afirma aprobación.
- **TypeScript / ESLint / build:** pendientes de ejecución real en el SHA resultante.
- **CI de Vercel:** la última comprobación disponible sigue reportando `build-rate-limit`; no es un build aprobado ni prueba por sí sola un error de código.
- **QA Chrome/micrófono:** pendiente.

### Commits de esta mutación

- Contrato espacial/sanitizador: `6f15fde`, `887968e`, `fafb858`.
- Renderer de canvas y compatibilidad legacy: `02fe661`, `5012e8d`, `2bbbb60`.
- CSS de papel punteado/layout: `24417f3`, `b32dae3`, `4c5b9c1`.
- Herramienta y prompts Gemini: `8a51f7a`, `de326c5`, `558a7f6`, `08aa496`.
- Regresiones: `963badc`, `a4b959f`, `c735b23`, `9a01262`, `483a186`.

### Siguiente fase exacta

1. Añadir acciones visuales incrementales tipadas sobre el mismo canvas: escribir bloque, dibujar trazo/forma/flecha, colocar etiqueta, señalar, borrar/corregir.
2. Mantener `turnGeneration`, sequence, idempotencia y cancelación de operaciones antiguas; no mezclar turnos tras barge-in.
3. Conservar `focus/erase/replace` y traducirlas al mismo sistema de elementos sin dar herramientas de edición al estudiante.
4. Usar metadatos/segmentos reales de voz si el proveedor los entrega; en ausencia de ellos, secuencia pedagógica aproximada y sin timestamps inventados.
5. Evaluar el schema en una llamada Live aislada y ejecutar suite, TypeScript, ESLint, build y QA de navegador.
6. Reproducir la escena de la célula del video y ajustar composición, tiempos, densidad de tinta y tamaño del lápiz.

**Criterio de aceptación:** el estudiante debe ver una sola hoja docente donde Orby intercala nota → dibujo → flecha → etiqueta → explicación, sin reiniciar lo ya escrito, sin saltos de lápiz y sin dejar de hablar. La base existente se conserva.

### Segunda extensión del lienzo: Orby puede señalar una idea completa

Se amplió la operación teacher-only `focus` para aceptar uno de dos destinos excluyentes:

- `strokeId`: conserva el halo sobre un trazo manual, como antes.
- `elementId`: señala una etapa espacial completa del canvas (bloque de texto, fórmula, nota o visual) por el ID exacto declarado en `layout.elements[]`.

La acción valida que exista exactamente un destino. Rechaza ambos IDs, ninguno, IDs mal formados y etapas inexistentes. El foco por etapa usa un halo exterior rojo, independiente del lápiz y sin crear ni modificar tinta. El halo se pausa cuando se interrumpe la voz y queda estático en movimiento reducido.

El contrato `apply_orby_board_action`, su schema Live, el prompt de clase y el renderer están conectados. La publicación actualiza el mismo mensaje de clase; no requiere nueva RPC ni migración. El foco permanece temporal: un nuevo snapshot completo sustituye el estado anterior, como ocurre con el resto de la escena.

**Regresiones nuevas:** focus de etapa existente, destino inexistente, rechazo de ambos destinos/ninguno, ausencia de cambios de bloques/visuales y pausa del halo durante barge-in.

**Suite declarada tras esta extensión:** 221 tests en `tests/orby-request-filter.test.mjs`, sin nombres duplicados ni pruebas vacías en inspección estática. No afirmar que se ejecutaron/aprobaron.

### Ajuste de continuidad tras operaciones erase y temporización del lápiz

- El primer trazo de un sketch espacial ahora espera el mismo lead-in que la etapa visual (\`sequence\`); tinta y lápiz no avanzan mientras su etapa está oculta.
- Ese lead-in se aplica únicamente al primer grupo de trazos del sketch. Cuando llega un snapshot acumulativo posterior, los trazos nuevos continúan después del trazo pendiente y de la pausa de levantamiento; no vuelven a esperar el retraso completo de la etapa.
- La secuencia espacial ahora es **estrictamente creciente**, no necesariamente consecutiva, con rango 1–1000. Esto permite eliminar una etapa sin renumerar las que sobreviven.
- Al ejecutar \`erase\`, si se elimina el último trazo de la visual sketch, la visual vacía se retira del arreglo y se quita su elemento de layout. Los índices de visuales posteriores se desplazan, pero sus IDs, coordenadas y sequence se conservan. La prueba vuelve a sanitizar el resultado para verificar que el layout sigue siendo válido.
- Suite declarada tras estas regresiones: **222 tests**, sin nombres duplicados ni pruebas vacías en inspección estática. Sigue sin equivaler a tests ejecutados/aprobados.
