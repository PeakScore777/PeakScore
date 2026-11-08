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


---

## Fidelidad al video, cobertura ICFES y subtítulos (actualización 8 de noviembre)

### Referencia visual confirmada
Se revisó el video original de 42.7 s, incluidos fotogramas de la clase y la hoja final. Su lenguaje visual es una sola hoja blanca lisa, notas manuscritas, subrayados, flechas y un dibujo principal que se desarrolla por etapas. No es un cuaderno punteado, un tablero cuadriculado ni una cuadrícula de tarjetas.

**Corrección aplicada en esta tanda:**
- `app/globals.css`: el fondo de `.orby-board-canvas` queda blanco con `background-image: none`.
- `components/aprender/LessonAITutor.tsx`: la superficie `.orby-class-paper` y su contenedor quedan blancos y sin textura. El canvas dentro de la llamada pierde borde, radio y sombra; la composición ya no se coloca en una rejilla de tarjetas.
- `tests/orby-request-filter.test.mjs`: nueva regresión estática para impedir que el papel vuelva a tener puntos, cuadrícula o textura.

La cuadrícula geométrica que forme parte de una gráfica matemática/científica (ejes, marcas o líneas de referencia) sí puede seguir apareciendo cuando sea necesaria para leer los datos; lo que se elimina es la textura del papel de fondo.

### Estándar pedagógico transversal
La referencia no se debe limitar a biología. El criterio nuevo es que aproximadamente el 90 % de las explicaciones académicas sustantivas de Saber 11 tenga una representación visual útil. No significa dibujar decoración para saludos o respuestas breves: el dibujo puede ser un subrayado, mapa, línea de tiempo, ecuación construida, gráfica, diagrama de argumentos, flechas de causalidad, anotación de un texto, diálogo o proceso experimental.

Mapa de visualización:
- **Matemáticas:** desarrollo de ecuaciones, representaciones, gráficas con unidades, geometría y visualización estadística.
- **Lectura Crítica:** subrayar tesis/evidencia/conectores, relacionar afirmaciones, premisas e inferencias, anotar textos continuos y discontinuos.
- **Sociales y Ciudadanas:** mapas anotados, cronologías, actores e instituciones, intereses, perspectivas y cadenas causales.
- **Ciencias Naturales:** mecanismos biológicos, estructura atómica y molecular, reacciones, vectores, circuitos, fuerzas, energía, ondas y diseño de experimentos.
- **Inglés:** conservar las siete partes del examen; mapas de vocabulario, pistas de contexto, turnos de diálogo, intención comunicativa, roles gramaticales, tiempos verbales y anotaciones sobre textos.

El plan curricular existente `docs/ORBY-ICFES-CURRICULUM-PLAN.md` sigue siendo la base de cobertura. La guía Icfes Saber 11 2026-2 y los cinco marcos oficiales delimitan competencias y evidencias. Los ejemplos/dibujos/preguntas deben ser originales; no copiar cuadernillos protegidos.

### Orby Lab — conexión actual auditada y alineación
El tutor sí dispone de recuperación del Lab:
- Cliente Live → `search_orby_learning_knowledge`.
- Ruta autenticada `/api/orby/knowledge-search`.
- Recupera fragmentos, conceptos y documentos relacionados con `visibility: "published"`.
- La búsqueda pública externa solo se ejecuta cuando la pregunta requiere referencias, datos actuales o verificación externa; no se usa para cada definición básica.

Se detectó una contradicción: la directiva del servidor pedía buscar el Lab en paralelo ante cada pregunta académica nueva, pero la descripción de la herramienta decía que era opcional y que no debía llamarse en cada pregunta. Se corrigió la descripción en `lib/ai/orby-live-tools.ts`:
- una consulta publicada no bloqueante al iniciar cada nuevo tema sustantivo;
- una segunda consulta solo para un prerrequisito o afirmación que siga necesitando evidencia;
- máximo dos llamadas por turno, usando el límite ya existente;
- voz y primera pizarra deben comenzar sin esperar el resultado;
- si el Lab no tiene contenido publicado, falla o agota la cuota gratuita, Orby sigue con conocimiento fiable y no inventa material.

Esto es recuperación de documentos publicados, no entrenamiento automático del modelo ni garantía de que todo el contenido del Lab esté publicado.

### Subtítulos palabra por palabra — brecha abierta
La UI actual muestra transcripción normal y aún no resalta una palabra activa. El usuario exige subtítulos tipo karaoke: una palabra iluminada mientras se pronuncia, sin adelantos ni retrocesos, y con reinicio inmediato si interrumpe.

Verificación técnica:
- El cliente recibe `outputTranscription.text` y programa audio PCM con Web Audio.
- La documentación oficial del Gemini Live API indica que la transcripción de Live no entrega marcas de tiempo por palabra, sino marcas a nivel de enunciado: https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
- Gemini 3.5 Transcribe en modo de archivo puede producir marcas por palabra; el modelo de transcripción en streaming Live no las soporta. La documentación indica además que las marcas por palabra pueden reducir la exactitud: https://ai.google.dev/gemini-api/docs/transcribe y https://ai.google.dev/gemini-api/docs/models/gemini-3.5-transcribe
- No se debe fingir sincronización fonética exacta con el contrato actual. Tampoco se debe añadir una llamada adicional, proveedor de pago o procesamiento de audio completo sin medir coste, cuota, privacidad y latencia.

**Siguiente trabajo P0:** investigar una fuente de marcas de tiempo compatible con voz Live y cuota gratuita real. Solo como prototipo claramente aproximado se puede mapear el texto incremental a la duración de reproducción de cada fragmento de audio; no debe presentarse como precisión palabra a palabra. Cualquier estado de palabra activa debe quedar invalidado al interrumpir o cambiar la generación de voz.

### Voz natural y tiempo de respuesta
Objetivo del producto: primera frase útil tan pronto Orby entienda la pregunta, idealmente alrededor de un segundo después del cierre de voz del estudiante. Es una meta de rendimiento, no una garantía certificada.

Medir por separado:
- fin de voz del alumno → primer texto de respuesta;
- fin de voz → primer fragmento de audio recibido;
- fin de voz → primer audio programado/reproducido;
- fin de voz → primera acción visible en la pizarra;
- latencia de parada ante interrupción y rearme de escucha.

El cliente actual valida una frase/transcripción antes de reproducir audio Live para evitar voz duplicada o contenido no validado; esta protección puede añadir latencia. Mejorar el inicio del audio sin eliminar los filtros de idioma, alcance, seguridad o identidad. No hay mediciones p50/p95 de Chrome en esta actualización.

### Conteo de pruebas y verificación
- Archivo `tests/orby-request-filter.test.mjs`: 229 definiciones de prueba con nombre; 0 nombres duplicados y 0 pruebas vacías en inspección estática.
- Nueva prueba de superficie blanca añadida.
- El conteo estático no equivale a tests ejecutados. No se certificaron Node tests, TypeScript, ESLint, build ni QA real con micrófono.
- Los subtítulos karaoke, la alineación palabra-audio, la calidad visual de las cinco áreas y los objetivos de latencia siguen pendientes de pruebas en Chrome.

### Archivos y commits de esta actualización
- `app/globals.css` — canvas sin textura.
- `components/aprender/LessonAITutor.tsx` — papel de clase liso y superficies de tablero sin tarjetas; consulta de Lab no bloqueante ya alineada con la directiva.
- `lib/ai/orby-live-tools.ts` — recuperación publicada en cada nuevo tema sustantivo, límite de dos llamadas.
- `tests/orby-request-filter.test.mjs` — regresión de papel blanco.
- `docs/ORBY-LIVE-TUTOR-SPEC.md` — estándar visual, mapa por materia, Lab y subtítulos palabra activa.

No se tocó `main`, producción ni Supabase; no se ejecutaron migraciones ni se añadieron proveedores de pago.



---

## Rendimiento de voz y cuota gratuita — actualización (8 de noviembre de 2026)

### Problema investigado
Se auditó por qué el alumno podía ver "cuota gratuita agotada" tras pocos turnos y esperar demasiado. Había dos causas corregibles en el código:
1. El inicio de Gemini Live trataba cualquier HTTP 429 o RESOURCE_EXHAUSTED como cuota diaria agotada y devolvía Retry-After de 3600 segundos. Google también usa 429 para límites temporales RPM/TPM; no es prueba suficiente de que se agotó el día.
2. El respaldo TTS podía volver a intentar el mismo fragmento hasta 12 veces y aceptar esperas de Retry-After largas, acumulando minutos en una sola respuesta.

### Correcciones implementadas
- `lib/ai/orby-tts-errors.ts`: la clasificación separa `quota_exhausted`, `rate_limited` y error general. Un 429 o RESOURCE_EXHAUSTED ambiguo se clasifica como límite temporal. Solo los marcadores explícitos de cuota diaria o `QUOTA_EXCEEDED` se clasifican como cuota agotada. Cuando un mensaje indica explícitamente per-minute/RPM/TPM, esa dimensión tiene prioridad.
- `app/api/orby/realtime-session/route.ts`: usa el error original de Google para conservar campos anidados y metadatos. Devuelve `GEMINI_LIVE_RATE_LIMITED` para throttling temporal con Retry-After corto limitado a 2–30 s; solo usa `GEMINI_FREE_QUOTA_EXCEEDED` y 3600 s cuando el clasificador ve agotamiento real de cuota diaria.
- `components/aprender/LessonAITutor.tsx`: el watchdog de una respuesta Live muestra aviso tras 5 s y pasa la misma pregunta al respaldo tras 15 s de inactividad. Cada evento nuevo de transcripción/audio/herramienta vuelve a armar el watchdog, por lo que una clase que sigue avanzando no se corta por duración total.
- `components/aprender/LessonAITutor.tsx`: el cliente solo reintenta una vez un throttling TTS si Retry-After es de 2 s o menos. Los límites más largos no bloquean el turno; deja el texto completo visible y permite continuar preguntando.
- `app/api/orby/voice-speech/route.ts`: el tamaño máximo aceptado del fragmento TTS subió de 500 a 900 caracteres.
- `components/aprender/LessonAITutor.tsx`: el fallback divide texto en fragmentos de hasta 880 caracteres (antes 480), reduciendo aproximadamente a la mitad las peticiones de audio en respuestas largas.
- `app/api/orby/voice-speech/route.ts`: el fallback usa `gemini-3.8-flash-lite-tts`, modelo gratuito optimizado para bajo retardo y alto volumen de conversación, en lugar de la variante Flash de mayor fidelidad de estudio. La voz Live principal sigue siendo `gemini-3.8-live`.

### Qué significa realmente "gratis durante el día"
- Google mide Gemini API con RPM, TPM y RPD. Los límites dependen del modelo y del proyecto; no son por API key y todos los alumnos que usan el mismo proyecto comparten el presupuesto. El RPD se reinicia a medianoche del Pacífico. Google indica que los límites concretos deben consultarse en AI Studio y que no garantiza capacidad fija. El precio de la capa Free para Gemini 3.8 Live y TTS se muestra como gratuito; eso no significa uso ilimitado.
- Cloudflare Workers AI permite 10.000 neuronas gratuitas al día por cuenta de Workers AI de Workers AI; se comparten entre los modelos que utiliza PeakScore y se reinician a las 00:00 UTC. Si se supera el límite, las operaciones adicionales fallan. No se activa Workers Paid.
- El plan gratuito de Claude en claude.ai es un límite de sesiones de usuario que se restablece cada cinco horas y varía según demanda. La API de Claude/Console se factura con créditos prepagados; no existe un cupo gratuito perpetuo de API que podamos integrar como fallback estable. No añadir Claude API como supuesto proveedor gratuito.
- No se conoce desde este repositorio la cuota real restante del proyecto de Google ni las neuronas disponibles de Cloudflare. Revisar los dashboards oficiales antes de prometer una cantidad de horas o mensajes.

### Presupuesto interno y límites existentes
- Inicio de sesión Live: límite interno actual 6 intentos por usuario y ventana de 60 s. Se aplica a arranque/reconexión de sesión, no a cada pregunta dentro de una sesión activa.
- TTS de respaldo: 20 solicitudes por usuario en 60 s; cada petición admite ahora hasta 900 caracteres.
- Consulta Live de Orby Lab: máximo dos llamadas por turno, con una consulta ordinaria no bloqueante al iniciar un tema nuevo y una segunda excepcional solo si resuelve un prerrequisito/evidencia.
- No se reduce la calidad de enseñanza para ahorrar una llamada ni se eliminan los filtros de idioma/alcance/seguridad. Se evita consultar web externa para definiciones y ejemplos rutinarios.

### Validación
- Archivo `tests/orby-request-filter.test.mjs`: 230 pruebas nombradas, 0 nombres duplicados y 0 pruebas vacías según inspección estática.
- Se actualizaron regresiones para separar cuota diaria de RPM/TPM, proteger contra esperas TTS largas, mantener los fragmentos íntegros, y comprobar el límite de inactividad de Live.
- Esto no equivale a una ejecución de tests. No se han certificado Node tests, TypeScript, ESLint, build ni Chrome/micrófono en esta sesión.
- Vercel seguía mostrando fallo en las consultas anteriores; se debe revisar el motivo exacto del nuevo SHA. No marcar verde sin CI exitoso.

### Siguiente P0
1. Verificar en Google AI Studio > Rate limits los valores actuales de `gemini-3.8-live`, `gemini-3.8-flash-lite-tts` y `gemini-embedding-001` del proyecto conectado.
2. Verificar el uso diario real de neuronas Cloudflare y separar qué porcentaje consume `@cf/google/gemma-4-26b-a4b-it` frente a embeddings/Whisper.
3. En Chrome, ejecutar una conversación de al menos 20 turnos cortos y 5 explicaciones largas. Registrar first transcript/audio, primer tablero, errores 429, fallback, y p50/p95. Confirmar que nunca se queda en silencio ni bloquea tres minutos.
4. Solo con datos de consumo reales decidir si conviene un segundo proveedor genuinamente gratuito. No integrar Anthropic API pagada ni activar servicios con cargo.


### Fuentes oficiales consultadas para esta actualización
- Gemini API — límites por RPM/TPM/RPD, límites por proyecto y reinicio de RPD: https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API — precios Free Tier de Gemini 3.8 Live y Flash-Lite TTS: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API — modelos de audio y TTS: https://ai.google.dev/gemini-api/docs/speech-generation
- Cloudflare Workers AI — asignación de 10.000 neuronas gratis al día y reinicio UTC: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Anthropic — facturación de la API de Claude mediante créditos prepagados: https://support.claude.com/es/articles/8977456-como-pago-mi-uso-de-la-api-de-claude
- Anthropic — límites variables del plan gratuito de Claude.ai y reinicio de cinco horas: https://support.claude.com/es/articles/8114491-comienza-con-claude


---

## 2026-11-08 — auditoría de fidelidad al video y subtítulos karaoke

### Referencia visual revisada
- Se inspeccionó el video completo compartido (42,73 s), incluidos los fotogramas donde el tutor muestra un tablero de célula animal: contorno dibujado a mano, núcleo/ADN, ribosomas, mitocondria/ATP, flechas, notas manuscritas y punta de lápiz visible.
- La referencia combina explicación oral, construcción progresiva del dibujo y subtítulos en la franja inferior. La palabra que está pronunciando se destaca mientras la frase permanece legible.
- Se mantiene la superficie lisa blanca ya adoptada en la rama; no se introduce textura, cuadrícula ni controles de escritura para el estudiante.

### Auditoría del estado encontrado
- La rama ya contenía una base real de pizarra v2 16:9, SVG progresivo, trazo libre `sketch`, punta de lápiz animada, etiquetas posteriores al trazo, foco temporal del profesor, operaciones incrementales `append-block`/`append-strokes`, snapshots acumulativos y validación/sanitización antes de renderizar.
- Live usa audio PCM 24 kHz de salida, voz nativa, transcripción de salida y una sesión WebSocket persistente. El cliente reproduce chunks secuencialmente por Web Audio y mantiene la interrupción por generación.
- Hallazgo visual concreto: los subtítulos Live mostraban el texto acumulado, pero no tenían índice de palabra activa ni avance ligado al reloj de reproducción. Por eso no replicaban el efecto karaoke de la referencia.
- Hallazgo de precisión: Gemini Live no proporciona marcas de tiempo por palabra. La documentación oficial declara que los timestamps por palabra no están disponibles en el streaming Live; los offsets por palabra pertenecen al flujo de transcripción no streaming y requieren una operación adicional.

### Correcciones implementadas en `feat/founder-intro`
- Se añadió `lib/ai/orby-subtitle-timing.ts`: cuenta palabras, separa palabras/espacios sin alterar puntuación y calcula el índice activo de forma monotónica.
- El cliente registra el instante inicial y el final programado del audio PCM de la respuesta usando `AudioContext.currentTime`. Un `requestAnimationFrame` actualiza únicamente la palabra resaltada; no genera llamadas de red, transcripciones adicionales ni tokens.
- La palabra activa usa un fondo ámbar tenue, negrita y subrayado; el resto de la frase permanece visible sobre una banda oscura debajo de la pizarra.
- El reloj y el resaltado se reinician al interrumpir/cambiar de turno. La posición no retrocede cuando llegan más palabras o chunks de audio.
- Se añadieron pruebas del tokenizador, conteo de palabras, posiciones inicial/mitad/final, entradas inválidas y monotonicidad.
- Se corrigió el mensaje de error del endpoint TTS: el límite real es 900 caracteres y el mensaje decía 500.

### Límite conocido y decisión de presupuesto
- El resaltado actual es una aproximación proporcional al tiempo real de reproducción y al total de audio ya programado, no una sincronización fonética exacta. Puede desviarse en frases largas, pausas expresivas, cambios de prosodia o cuando la transcripción llega después del audio.
- No se añadió una llamada de transcripción por cada respuesta: eso introduciría más latencia y consumo de cuota compartida. Tampoco se añadió ningún modelo/proveedor de pago ni un fallback facturable.
- Gemini Live y TTS tienen disponibilidad Free Tier documentada, pero con límites variables por modelo/proyecto y sin una cantidad diaria universal garantizada. La cuota restante de este proyecto solo se confirma en AI Studio; no se promete uso ilimitado.

### Fuentes técnicas revisadas
- Gemini Live API — salida de audio y transcripción de la salida: https://ai.google.dev/gemini-api/docs/live-api/capabilities
- Referencia WebSocket Live — `outputTranscription`, `modelTurn` y orden no garantizado entre audio y transcripción: https://ai.google.dev/api/live
- Transcripción Live — no admite timestamps de palabra en streaming: https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
- Transcripción no streaming — timestamps granulares por palabra: https://ai.google.dev/gemini-api/docs/transcribe
- Precios/Free Tier de Gemini 3.8 Live y TTS: https://ai.google.dev/gemini-api/docs/pricing

### Validación y pendientes
- En el commit `b23cd247`, 232 pruebas pasaron y TypeScript pasó; ESLint falló únicamente por una referencia de animación no utilizada. Se corrigió esa referencia, se hizo el tokenizador reutilizable y se ajustó el mensaje TTS.
- CI debe volver a aprobar tests, TypeScript, ESLint y build sobre el SHA más reciente antes de declarar esta etapa verde.
- Sigue pendiente una prueba manual en Chrome con micrófono real: 20 turnos cortos, cinco explicaciones largas, varias interrupciones, nueva pregunta durante el audio, revisión visual de la pizarra y seguimiento de subtítulos en escritorio/móvil.
- La prueba de código no valida permisos reales, cuotas remanentes del proyecto, configuración de privacidad de producción ni persistencia remota. No habilitar Live en producción, aplicar migraciones Supabase, hacer Pull ni desplegar como parte de esta auditoría.

### Resultado de CI — commit de código `49024376f9a5d603e619ef97618f467fb070b686`

- GitHub Actions workflow `42497670325` terminó en `success`.
- Suite Orby: 232 pruebas, 232 aprobadas, 0 fallidas.
- `npx tsc --noEmit`: aprobado.
- `npm run lint` con `--max-warnings=0`: aprobado.
- `npx next build`: aprobado.
- `npm audit`: 0 vulnerabilidades (info/low/moderate/high/critical: 0).
- Este CI valida código y build con variables placeholder; no valida credenciales, permisos de micrófono, proveedor Live real, cuota restante ni persistencia remota Supabase.

### Vercel separado del CI de aplicación
- Git status de Vercel continúa en `failure` con destino `?upgradeToPro=build-rate-limit`.
- Vercel deployment context identifica el equipo PeakScore como plan Hobby. No existe un deployment Vercel asociado al SHA `49024376f9a5d603e619ef97618f467fb070b686` en la consulta de despliegues exactos.
- Esto se registra como bloqueo externo de builds/preview por límite del plan, no como fallo de TypeScript, ESLint, tests ni Next build del repositorio.
- No se cambió plan, no se creó/deployó ningún deployment, no se tocó `main` ni se habilitó producción.

### Prueba de producto todavía pendiente
- No se ejecutó una sesión manual de Chrome con micrófono y audio real en esta etapa. El efecto karaoke está validado por tests/código, pero la sensación visual y la precisión percibida requieren prueba real.
- El resaltado usa reloj de reproducción PCM y duración de audio programado; es monotónico y no genera llamadas extra, pero NO equivale a timestamp fonético por palabra. La API Gemini Live streaming no expone dichos timestamps.
- Fallback TTS por turnos deja el contenido visible si falla/agota cuota, pero en esta etapa el resaltado por palabra solo está integrado en la reproducción Live PCM; no declarar karaoke equivalente en el fallback TTS.
- No se afirma que el tutor ya esté idéntico al video. El siguiente criterio de aceptación es probar la clase real y ajustar cadencia/diagramas a partir de esa observación.


---

## Validación local en Windows — compatibilidad de finales de línea

### Evidencia recibida
- La instalación local quedó completada con `npm ci --include=dev`: 546 paquetes añadidos, auditoría npm con 0 vulnerabilidades y TypeScript `5.9.3` disponible.
- La salida local reportó 230 pruebas aprobadas y 2 fallidas de 232.
- Los dos fallos eran aserciones estáticas que buscaban fragmentos con saltos de línea `\n` exactos dentro de archivos fuente:
  - orden de la primera oración segura y del primer flush de audio Live;
  - pausa de la animación del foco contextual en CSS.
- Ambos fallos son sensibles al checkout Windows con finales `CRLF`; no eran fallos de una respuesta Live ni de la animación en runtime. No se deben ocultar relajando o quitando las aserciones.

### Corrección aplicada
- El lector de fixtures de `tests/orby-request-filter.test.mjs` ahora normaliza `CRLF` y `CR` a `LF` en memoria, antes de ejecutar las comprobaciones estáticas.
- El cambio se limita al harness de pruebas. No reescribe archivos del proyecto, no altera el CSS ni cambia el flujo de audio Live.
- No se ha cambiado el comportamiento de Orby ni se ha debilitado ninguna expectativa funcional.

### Advertencias de instalación observadas
- npm mostró `allow-scripts` para cinco paquetes (`@google/genai`, `core-js`, `protobufjs`, `tesseract.js` y `unrs-resolver`). La instalación terminó, pero esas advertencias deben revisarse antes de aprobar el entorno como completamente validado; no aprobar scripts masivamente sin determinar cuáles son necesarios y seguros.
- También apareció una advertencia deprecada de `node-domexception`; no es la causa de los dos tests fallidos.
- El CI Linux del commit de corrección debe confirmar que el cambio conserva las 232 pruebas, TypeScript, ESLint y build.

### Estado al registrar esta nota
- Corrección subida a `feat/founder-intro`; CI del nuevo commit pendiente.
- No se tocó `main`, no se desplegó, no se modificaron secretos/cuotas ni se aplicaron migraciones Supabase.


### Resultado final de la corrección Windows — 8 de noviembre de 2026

- Commit comprobado: `4a2612b47833fc67af51ceb612e21ff3bae32773`.
- GitHub Actions: workflow `42499733806`, conclusión `success`.
- Suite Orby: **232/232 aprobadas, 0 fallidas**.
- TypeScript: aprobado.
- ESLint: aprobado.
- Build de Next.js: aprobado.
- `npm audit`: 0 vulnerabilidades.
- La corrección del lector que normaliza finales de línea queda validada en CI. Para validar el mismo cambio en el equipo Windows, actualizar la rama local y volver a correr `npm run test:orby`.


---

## 2026-11-08 — prioridad: recuperar voz antes de retocar la pizarra

### Evidencia del video del estudiante (16:31)
- Duración aproximada: 75,8 s; Chrome en `localhost:3000`.
- Se ve el prompt del navegador solicitando permiso del micrófono; después la clase sigue sin transcripción ni reproducción.
- La interfaz cae a «Voz alternativa en espera».
- DevTools muestra el warning de `@google/genai@2.17.1`: los tokens efímeros Live requieren `v1alpha`, aunque el cliente estaba utilizando `v1beta`.
- DevTools también registra HTTP 503 en `/api/lesson-tutor`. No se ve el cuerpo JSON de esa respuesta y no hay evidencia suficiente para asignar el status 503 a Cloudflare, Supabase u otra causa específica.

### Cambios de recuperación
- `app/api/orby/realtime-session/route.ts`: token efímero se crea usando `v1alpha`.
- `components/aprender/LessonAITutor.tsx`: cliente Live inicial y reconexión usan `v1alpha`.
- `app/api/lesson-tutor/route.ts`: las peticiones `voiceMode` ya no persisten antes de la reproducción. La persistencia idempotente se deja al endpoint de voz `/api/orby/realtime-turn` al completar el audio; la persistencia normal del chat escrito no cambia.
- Se añadieron/actualizaron regresiones para versión de SDK, reanudación y persistencia del fallback.

### Resultado CI — SHA `a67b78d937c864a5bab616b2149b37be432a4194`
- Workflow `42501757928`: success.
- 233/233 pruebas Orby, TypeScript, ESLint y build de Next.js aprobados.
- Auditoría npm: 0 vulnerabilidades.

### Siguiente puerta de aceptación
1. Actualizar la rama local y volver a iniciar Next.js después de terminar el Fast Refresh.
2. Conceder explícitamente el permiso del micrófono a `localhost:3000`; sin ese permiso, el navegador no puede enviar audio.
3. Confirmar en consola que ya no aparece el warning de token efímero `v1alpha` ni el cambio inmediato al modo por turnos.
4. Confirmar una pregunta real, transcripción entrante, primer audio de Orby y respuesta oral.
5. Si aparece HTTP 503 en el fallback, capturar únicamente el campo `code` y el mensaje JSON de esa respuesta junto con la línea correspondiente del terminal servidor; nunca compartir API keys ni variables secretas.

**Alcance de esta tanda:** voz y continuidad de turnos solamente. No se cambiaron CSS, colores, texto de la pizarra ni renderer visual. No se tocó `main`, despliegues, migraciones o datos remotos.
