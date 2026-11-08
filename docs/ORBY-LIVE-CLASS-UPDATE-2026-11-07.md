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
