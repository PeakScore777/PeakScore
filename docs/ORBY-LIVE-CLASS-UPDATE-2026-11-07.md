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

**Fecha:** 8 de noviembre de 2026  
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
- `0041c8b` — registro final de commits y alcance en este documento.

### Seguridad y límites
- Las operaciones no aceptan HTML, SVG ni código; solo datos estructurados tipados.
- Las coordenadas de reemplazo se limitan al canvas 4–96, entre 2 y 40 puntos por trazo, tonos conocidos y grosor 0.6–2.4.
- Los IDs deben existir en la tinta actualmente publicada; un ID desconocido no puede borrar ni reemplazar nada.
- El estudiante no recibe controles ni eventos para ejecutar estas operaciones.
- El foco se renderiza como una animación SVG efímera; no altera el trazo original.
- No se añadieron dependencias, modelos, proveedores ni servicios de pago. No se modificó `main`, no se desplegó y no se aplicaron migraciones remotas.

### Validación pendiente
- Ejecutar Node tests, TypeScript, ESLint y build tras los commits de esta mutación.
- QA manual en Chrome: foco sobre trazos antiguos, borrar uno entre varios, reemplazar un trazo sin duplicarlo, snapshots posteriores y barge-in durante el halo.
- Verificar en dispositivo táctil y con movimiento reducido.
- No declarar listo para producción hasta completar CI y QA real.

**Estado:** implementación conectada en la rama; validación completa todavía no certificada.
