# Actualización Orby — Clase en vivo y pizarra docente

**Fecha:** 8 de noviembre de 2026  
**Rama:** `feat/founder-intro`  
**Proyecto:** PeakScore  
**Fuente de verdad:** GitHub, rama `feat/founder-intro`  
**Referencia anterior:** `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md`  
**Especificación permanente:** `docs/ORBY-LIVE-TUTOR-SPEC.md`  
**Auditoría acumulada:** `docs/ORBY-IMPLEMENTATION-AUDIT.md`

---

## 0. Regla de continuidad: no empezar de cero

Esta actualización **no inicia la pizarra docente desde cero**. Antes de esta sesión ya existía una base considerable en la rama. Cualquier continuación debe leer primero la bitácora del 7, esta bitácora, la especificación permanente y el código actual antes de modificar algo.

### Base que ya estaba implementada antes de esta tanda

- Experiencia de clase en vivo con voz, subtítulos, estado de micrófono y controles de llamada.
- Pizarra exclusiva de Orby: se retiraron las herramientas de escritura del estudiante. No reintroducir lápiz, resaltador, borrador ni controles de edición para el alumno.
- Modelo tipado de pizarra Orby v2, canvas espacial 16:9 y compatibilidad con contenido anterior.
- Bloques pedagógicos y visuales tipados; sanitización de snapshots antes de renderizar.
- Snapshots acumulativos asociados al mismo mensaje de Orby. La tinta previa puede conservar sus IDs entre actualizaciones.
- Dibujo SVG progresivo, cola serial de trazos y un único lápiz que recorre la ruta del trazo.
- Temporización compartida entre tinta y lápiz, lead-in por etapa, pausas entre trazos y límites de duración.
- Pausa/reanudación de la animación SVG cuando el alumno interrumpe la voz; descarte de salidas antiguas por generación.
- Señalamiento docente temporal: `focus` puede enfocar un trazo o un elemento espacial existente.
- Operaciones docentes `erase` y `replace`, con validación de IDs y conservación de referencias.
- Borrado de la última tinta de un sketch sin dejar una visual vacía ni renumerar las etapas restantes.
- Exportación mediante impresión del navegador, con la hoja aislada en el modo de impresión.
- Persistencia del tablero en el mensaje de clase e historial existente; no se requiere una tabla nueva para el contrato visual actual.
- Movimiento reducido y comportamiento de pausa del tablero contemplados en el renderer/CSS.

Estas capacidades son la base. No hay que volver a implementarlas ni reemplazarlas por una solución paralela.

**Límites que ya estaban identificados:** la animación SVG no prueba por sí sola sincronización fonética; los snapshots acumulativos no son sincronización palabra-a-palabra; el lápiz sigue los paths que genera el modelo y no captura una mano física. El comportamiento del video todavía necesitaba validación real en Chrome con micrófono.

---

## 1. Qué se añadió en esta tanda (8 de noviembre)

La evolución de esta sesión fue añadir operaciones de escritura y tinta al canvas ya existente, manteniendo la arquitectura anterior.

### 1.1 Nuevas operaciones incrementales

En `lib/ai/orby-board-actions.ts` se añadieron:

- `append-block`: incorpora un bloque tipado nuevo (título, texto, fórmula, paso o llamada) a una posición del canvas espacial existente.
- `append-strokes`: incorpora entre 1 y 5 trazos nuevos al elemento `sketch` ya existente.

Ambas operaciones modifican la misma composición v2. No generan un mensaje nuevo, otro SVG, otra capa independiente ni reemplazan todo el tablero. Los trazos anteriores permanecen; el modelo debe enviar únicamente la tinta nueva.

### 1.2 Orden e identidad de acciones

Las operaciones `append` requieren:

- `turnGeneration`: debe coincidir exactamente con la generación devuelta por la última instantánea aceptada de esa actividad.
- `actionId`: identificador estable y único dentro del turno.
- `sequence`: entero creciente, iniciado en 1 para la nueva secuencia de la actividad.
- `dependsOn` opcional: solo puede referir a acciones ya aceptadas.

La validación rechaza generación equivocada, IDs repetidos, secuencias repetidas o anteriores, dependencias no aceptadas, dependencias propias, geometría fuera del canvas, bloques no permitidos, lotes de tinta superiores al límite y IDs de trazo repetidos.

El control de secuencia conserva los últimos IDs aceptados y usa la generación de actividad. No es una cola durable en base de datos: es control en memoria del flujo Live. No describirlo como una cola persistente.

### 1.3 Protección de todas las operaciones del profesor

Las acciones existentes `focus`, `erase` y `replace` se mantienen. En esta tanda también quedaron ligadas a `turnGeneration`; una acción tardía de otra actividad debe ser rechazada. Para estas operaciones heredadas, el identificador de generación es obligatorio, pero `actionId`/secuencia solo se exigen a las operaciones nuevas `append`.

### 1.4 Integración con Gemini Live

- `render_orby_teaching_board` devuelve `turnGeneration` cuando acepta una instantánea.
- El schema de `apply_orby_board_action` anuncia las operaciones nuevas y requiere `turnGeneration` para todas las operaciones docentes.
- El prompt de sesión instruye al modelo a intercalar escritura y trazos con una sola acción por evento, conservar la tinta y no reenviar elementos ya dibujados.
- Las respuestas de herramienta diferencian entre escribir un bloque y añadir trazos para que Orby sepa qué acción se ejecutó.

### 1.5 Ventana de preflight y acciones provisionales

La primera pizarra puede llegar antes de que el alumno termine la transcripción. La integración permite acumular una acción en una instantánea provisional solo cuando coinciden sesión y generación, la instantánea no ha expirado y no hay interrupción. La composición provisional permanece oculta hasta que el preflight acepta el turno.

Durante la revisión de esta tanda se encontró y corrigió una regresión de integración: la guarda de instantánea no debía leer la variable local `pendingBoardSnapshot`, que pertenece al manejador de acciones. Las guardas quedaron separadas:

- El manejador de snapshots usa el estado de actividad de voz/preflight.
- El manejador de acciones exige además instantánea provisional existente, sesión coincidente, actividad coincidente y antigüedad máxima de 15 segundos.

Se añadió una prueba para impedir que ambos caminos vuelvan a mezclarse.

---

## 2. Archivos que recibieron cambios en esta tanda

- `lib/ai/orby-board-actions.ts` — sanitización, operaciones incrementales y control de secuencia/generación.
- `lib/ai/orby-live-tools.ts` — schema y descripción de las herramientas Live.
- `components/aprender/LessonAITutor.tsx` — integración del handler, generaciones, preflight y rechazo de acciones atrasadas.
- `app/api/orby/realtime-session/route.ts` — directivas docentes para el modelo.
- `tests/orby-request-filter.test.mjs` — regresiones de las operaciones y guardas.
- `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md` — se retiró de ese archivo la sección fechada 8 de noviembre para mantener cada bitácora en su fecha correcta.

La bitácora del 7 se conserva con sus avances previos. Esta nueva bitácora pasa a ser la referencia de trabajo para el 8 de noviembre.

---

## 3. Pruebas y estado real

### Inspección estática realizada

- Conteo actual del archivo `tests/orby-request-filter.test.mjs`: **228 definiciones de prueba con nombre** en la revisión de cierre.
- Nombres de prueba duplicados: 0.
- Bloques de prueba vacíos detectados por la comprobación estática: 0.
- Se inspeccionó que el handler de snapshots ya no referencie `pendingBoardSnapshot`.
- Se inspeccionó que el handler de acciones compruebe sesión, actividad y expiración de la instantánea provisional.
- Se revisó la presencia del requisito de generación en el schema Live y la directiva de sesión.

Esto es revisión estática del texto y de los contratos; **no significa que las 228 pruebas hayan sido ejecutadas ni aprobadas**.

### Pendiente de validación runtime

- Node: `npm run test:orby`.
- TypeScript: `npx tsc --noEmit`.
- ESLint: `npm run lint`.
- Build de producción: `npm run build`, solo en un entorno que no dispare una cuota facturable.
- Chrome con micrófono real: al menos tres acciones incrementales durante audio continuo.
- Interrupción a mitad de trazo y confirmación de que no aparece tinta de una generación antigua.
- Preflight lento, transcripción que llega después de la instantánea y acciones recibidas antes/después de la aceptación.
- Recarga del historial y verificación de que se restaura la última composición completa.
- Exportación PDF/impresión, visuales extensos, móvil y `prefers-reduced-motion`.

### CI conocida

El último estado consultado de Vercel reportó `build-rate-limit`. No hay un resultado nuevo de GitHub Actions para el SHA revisado. No afirmar build, TypeScript, ESLint o tests aprobados por CI.

---

## 4. Qué no está terminado todavía

- El contrato permite intercalar texto y tinta, pero no obliga al modelo a emitir una acción para cada frase.
- No se ha demostrado sincronización palabra-a-palabra ni fonema-a-fonema. No inventar timestamps.
- `append-strokes` añade tinta al sketch existente; esta tanda no creó un sistema separado de primitives de flecha, etiqueta independiente o formas paramétricas. El modelo puede representarlas como paths cuando sea apropiado, pero todavía hay que validar calidad y legibilidad.
- El control de secuencia es en memoria y por generación de actividad; no es un worker ni una cola persistente.
- La ventana de 15 segundos del staging provisional necesita pruebas de carrera en Chrome. No declarar que todos los órdenes de llegada de Live ya están cubiertos.
- No se ha probado el escenario completo de biología del video ni la misma secuencia en Matemáticas, Física, Química, Sociales, Lectura e Inglés.
- No se ha certificado la continuidad al desconectar Live y pasar al fallback por turnos.
- No se ha demostrado que la respuesta oral siga fluida mientras entran muchas acciones visuales.

---

## 5. Próximo trabajo: continuar, no rehacer

Orden recomendado:

1. **Validar primero la implementación existente** con tests, TypeScript y ESLint localmente. No añadir otra capa hasta corregir los fallos que aparezcan.
2. Inspeccionar la composición espacial y la forma de calcular posiciones de `append-block`; verificar que nuevos bloques no se superpongan con contenido existente ni queden fuera de la zona legible.
3. Probar la secuencia real snapshot → append-block → append-strokes → focus → erase/replace y confirmar que se conserva un único tablero.
4. Probar el límite de ocho operaciones visuales, el límite de elementos/layout y los casos de evento duplicado o cancelado.
5. Ejecutar una sesión Chrome con la referencia biológica: contorno celular → núcleo → ADN → estructuras internas → mitocondria → relación ATP, con narración simultánea.
6. Interrumpir varias veces: durante snapshot, durante escritura, durante recorrido del lápiz y durante una acción provisional. Confirmar que nunca reaparecen acciones viejas.
7. Solo después de tener datos de runtime, mejorar el ritmo de escritura, el reparto de zonas de canvas y el orden didáctico de acciones.
8. Evaluar timestamps de voz únicamente si el proveedor los expone realmente; de lo contrario conservar secuenciación aproximada honesta.

### Criterio de aceptación

El alumno debe observar una sola hoja docente y una clase coherente: Orby explica mientras añade contenido en pequeños pasos, mantiene los trazos previos, usa el lápiz serial sin saltos, señala o corrige elementos existentes y detiene acciones viejas al ser interrumpido. La voz debe continuar sin esperar innecesariamente cada operación visual.

---

## 6. Restricciones que siguen vigentes

- Solo modelos y servicios gratuitos reales dentro de sus cuotas. Si se agota una cuota, pausar/degradar con aviso; nunca usar fallback de pago silencioso.
- No reconstruir material del Orby ICFES Lab eliminado intencionalmente.
- Mantener el alcance Saber 11/ICFES y el español colombiano.
- El estudiante no obtiene herramientas de escritura sobre la pizarra del profesor.
- No modificar `main`, no desplegar y no aplicar migraciones remotas como parte de esta fase.
- No añadir proveedores, modelos, dependencias ni llamadas extra sin justificación y autorización.

---

## 7. Registro de commits de esta continuación

Los commits de implementación de esta tanda incluyen:

- `db7cd1ed` — primera incorporación de append-block/append-strokes y validación.
- `558f3712` — contrato de herramientas Live para las operaciones incrementales.
- `2a379eed` — integración de secuencia por turno en el cliente Live.
- `12c9b276` — pruebas para escritura y trazos incrementales.
- `7201f90c` — devolución de la generación activa en snapshots aceptados.
- `b15acf29` — acumulación provisional de acciones durante preflight.
- `43081d57` — corrección de alcance de la guarda provisional.
- `3d5f3cd3` y `23928f1d` — regresión de preflight y corrección de expresiones regulares.
- `021cfdb1` — mantener el documento del 7 de noviembre limitado a su fecha original.

Los commits posteriores de ajustes de schema, sanitización y documentación se pueden consultar en el historial de `feat/founder-intro`. Este resumen no certifica CI ni ejecución local.

---

## Nota para el siguiente chat

**Primero leer este MD, el MD del 7, `docs/ORBY-LIVE-TUTOR-SPEC.md`, `docs/ORBY-IMPLEMENTATION-AUDIT.md` y revisar el HEAD actual de `feat/founder-intro`.**

No volver a implementar snapshots acumulativos, pizarra espacial v2, lápiz serial, pausa/reanudación, foco, borrado o reemplazo: ya existen. No reconstruir nada del Lab eliminado. El siguiente paso es validar la capa existente y cerrar sus brechas reales con pruebas, no volver a empezar ni duplicar arquitectura.
