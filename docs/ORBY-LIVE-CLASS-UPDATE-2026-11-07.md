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
- `lib/ai/orby-board-actions.ts` (nuevo)
- `lib/ai/orby-board.ts`
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
