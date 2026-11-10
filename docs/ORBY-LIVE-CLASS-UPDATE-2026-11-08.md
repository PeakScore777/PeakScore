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


---

## Última prueba del usuario — 2026-11-08 (video 16:54)

**Estado real:** Orby continúa sin cumplir la experiencia solicitada. El usuario informa que no habla y no dibuja. La CI aprobada no se debe presentar como arreglo funcional.

### Lo que se ve en `20261108-1654-50.8443353.mp4` (67,27 s)
- 12 s aprox.: Chrome solicita permiso del micrófono para localhost:3000.
- 24 s aprox.: el estado pasa a «TE ESTÁ ESCUCHANDO».
- 42 s aprox.: consola muestra el warning genérico de token efímero experimental, `Startup stage timings` y `First response transcript timing`.
- 42–60 s: aparece una transcripción/saludo en los subtítulos. Esto prueba que llegó texto de salida, pero NO que el navegador reprodujo voz.
- Del comienzo al final: el lienzo central no recibe ni muestra dibujos; permanece en «Preparando la pizarra de la clase…».
- Esta grabación no muestra el cuerpo de un 503. El 503 previo de `/api/lesson-tutor` sigue registrado como incidente anterior, no como fallo confirmado en este último ensayo.
- El usuario confirma que no escucha la voz; esta revisión visual no permite verificar la salida acústica de forma independiente.

### Comparación con la referencia `1000189532.mp4`
El tablero deseado se parece a una hoja digital real: blanco amplio, limpio, manuscrito natural, trazos que aparecen progresivamente, flechas y esquemas sencillos. Tinta negra como base, azul para conceptos y rojo para énfasis; explicación oral/subtítulos en banda inferior discreta. No es un dashboard de tarjetas ni una pizarra vacía con un gran placeholder.

### Siguiente trabajo (orden estricto)
1. Auditar y corregir la cadena de salida acústica Live: evento de audio → chunks PCM → validación → AudioContext/programación → reproducción real. El log de transcripción por sí solo no sirve como criterio.
2. Auditar y corregir la cadena del tablero: llamada de herramienta → ejecución → respuesta de herramienta → sanitización/estado → render. Agregar logs/mediciones no sensibles por etapa para localizar el primer corte.
3. Probar en Chrome con una respuesta audible real y al menos una escena de tablero dibujada progresivamente.
4. Solo después implementar el diseño aprobado a partir de la referencia de video.

### Evidencia / límites
- No atribuir el silencio al warning genérico del SDK sin revisar chunks y reproducción.
- No atribuir el 503 a Cloudflare o Supabase sin cuerpo JSON y log del servidor.
- No considerar «Connected», «Te está escuchando» ni una transcripción de saludo como prueba de voz audible.
- No considerar CI/build verde como prueba de tablero real.
- No volver a cambiar el diseño a ciegas ni mezclar reparación funcional con rediseño.

**Diseño:** el usuario pidió primero una imagen del resultado visual del tablero para decidirlo antes de tocar código. Mantener el aspecto manuscrito y de hoja blanca del video de referencia, no el dashboard futurista/tarjetas.
**Cambios en código para esta entrada:** ninguno. Solo continuidad y registro de fallos, sin cambios en `main`, despliegues, Supabase remoto o secretos.


### Propuesta visual del tablero — mockup del 8 de noviembre
- Se preparó una imagen estática de referencia `orby-board-design.png` para esta conversación. No es implementación ni está incluida todavía en el repositorio.
- Dirección visual: lienzo blanco amplio como superficie principal; papel con textura/puntos casi imperceptibles; trazos de aspecto manuscrito; contorno/ideas principales en tinta oscura; azul para conceptos y flechas; rojo para relaciones o énfasis; notas explicativas a ambos lados del dibujo central; lápiz visible en el borde como señal de escritura en curso.
- Interfaz mínima: franja superior compacta con materia y estado; herramientas de lápiz/borrar/deshacer pequeñas y discretas; subtítulo en una banda inferior fina; controles de pausa/salida compactos. Sin gran mascota lateral, sin tarjetas, sin columnas de dashboard, sin bloques de color que compitan con la hoja.
- El mockup muestra una escena de célula animal con núcleo/ADN, mitocondria, ribosomas, membrana y citoplasma. Los ejemplos reales de clase deben variar el esquema según el concepto.
- La implementación futura tiene que revelar el dibujo por etapas y por trazos sincronizados con el habla; no se acepta que la escena final aparezca completa de golpe. Esta propuesta visual no reemplaza la prioridad pendiente de recuperar primero la reproducción audible y la llamada/render real del tablero.


---

## 2026-11-08 — rediseño del espacio Orby e integración de herramientas de estudio (referencias Studley AI / Studdy AI)

### Decisión del usuario y alcance visual
El usuario compartió capturas del Orby actual de PeakScore y referencias de Studley AI/Studdy AI, además de un video de recorrido de Studdy AI (archivo aportado en la conversación). La petición no es reemplazar Orby por un producto nuevo ni convertirlo en un dashboard genérico: hay que **evolucionar la interfaz oscura de Orby que ya existe**, conservando su identidad y el área principal de conversación, y convertir la columna izquierda en un centro de herramientas de estudio.

La referencia de Studdy muestra un lienzo de clase muy amplio, blanco/casi blanco, sin cuadrícula visible, con escritura manuscrita, diagramas que aparecen progresivamente, anotaciones con flechas/círculos y controles discretos en las esquinas. La explicación se acompaña de transcripción en la parte inferior. El contenido no debe aparecer como una imagen completa precargada: el tutor lo construye mientras habla.

### Layout acordado para la web PeakScore
- **Shell global:** conservar la navbar superior actual de PeakScore y el tema oscuro del espacio Orby actual (captura proporcionada por el usuario). No reemplazar todo por la estética beige de Studley ni por un dashboard blanco ajeno a PeakScore.
- **Columna izquierda:** pasa de ser únicamente una lista de conversaciones a una navegación de herramientas. Orden inicial:
  1. Nuevo chat.
  2. Flashcards.
  3. Anotaciones / apuntes personales.
  4. Grabaciones.
  5. Resúmenes.
  6. Cuestionarios / práctica tipo Saber 11.
  7. Material de estudio / archivos y enlaces.
  8. Historial de conversaciones, conservado como sección accesible y buscable (no se elimina).
- **Área central:** mantiene el chat actual de Orby como vista por defecto. Cuando se inicia una clase en vivo, el área central cambia al modo de tablero docente, ocupando el espacio disponible; no se abre una segunda página aislada ni se mezcla el tablero con burbujas de chat.
- **Modo clase en vivo:** hoja blanca/casi blanca lisa, sin cuadrícula decorativa, con manuscrito natural, tinta oscura, colores semánticos para conceptos/relaciones, dibujos y anotaciones incrementales. La voz, el dibujo y los subtítulos deben avanzar coordinados. Mantener controles de pausa, reanudar, interrumpir, micrófono, velocidad, subtítulos y salir en una barra compacta.
- **Responsividad:** en escritorio, herramientas en sidebar fija y panel central flexible. En pantallas estrechas, las herramientas se contraen a un menú/drawer; el lienzo conserva prioridad y no se convierte en una columna ilegible.

### Contratos funcionales de las herramientas laterales
Cada herramienta debe ser una vista real, no una tarjeta decorativa. Debe aprovechar el tema, la conversación o los materiales que el estudiante ya seleccionó, con autorización explícita para guardar contenido.

- **Flashcards:** generar tarjetas desde un tema, conversación, apunte o material seleccionado; anverso/reverso; revelar respuesta; autoevaluación; estados de dominio (desconocido, aprendiendo, familiar, dominado); repaso de pendientes y persistencia del progreso. No copiar preguntas protegidas del Icfes.
- **Anotaciones:** editor personal independiente de la pizarra docente; crear/editar/guardar notas vinculadas a materia, tema, conversación o material; permitir que el estudiante escriba aquí. Esta herramienta NO devuelve lápiz, resaltador, borrador ni controles de edición sobre el tablero de Orby.
- **Grabaciones:** iniciar/detener grabación con permiso explícito del navegador; indicar claramente grabando/pausado/finalizado; guardar audio solo tras consentimiento; permitir reproducción y, si existe transcripción válida, convertirla en resumen/apuntes. Gestionar tamaño, duración, errores y eliminación; no subir ni procesar audio silenciosamente.
- **Resúmenes:** producir síntesis estructuradas desde una conversación, grabación transcrita o material seleccionado; separar conceptos clave, definiciones, pasos, ejemplos, errores frecuentes y preguntas de repaso; conservar vínculo a la fuente y permitir guardar en Anotaciones.
- **Cuestionarios:** práctica original estilo Saber 11 basada en el tema/material seleccionado; retroalimentación explicativa y registro de resultados. Mantener Inglés con sus siete partes y la creación/curación manual establecida.
- **Material de estudio:** subir archivos compatibles y pegar enlaces/texto; mostrar progreso de procesamiento y límites de tamaño; organizar por carpetas/materias/temas; reutilizar el material como contexto para tutor, resúmenes, flashcards y cuestionarios. Validar tipo, tamaño, permisos y estado de procesamiento.
- **Historial:** conservar búsqueda, nuevo chat, selección y reanudación de conversaciones existentes. No sacrificar la recuperación del historial al introducir herramientas.

### Flujo compartido de contenido
Un mismo origen autorizado (material, grabación transcrita, nota o conversación) puede alimentar varias herramientas. Mantener referencia de origen, materia, tema, fecha y propietario para que el estudiante pueda volver a la fuente. No duplicar archivos grandes por cada herramienta ni mezclar datos entre usuarios. Las herramientas deben funcionar con contenido existente; no depender de reconstruir el Orby ICFES Lab eliminado intencionalmente.

### Límite de hardware: anatomía humana 3D aplazada
- El usuario confirma que los modelos/partes humanas para Medicina dependen de Blender y que su PC actual no puede ejecutarlos.
- **Se aplaza el Atlas humano 3D y cualquier pipeline/asset que requiera Blender, render pesado o ejecución local equivalente.** No instalar Blender, no exigir GPU ni añadir esa dependencia.
- Se conservan por ahora las representaciones didácticas ligeras 2D ya implementadas (SVG/React y esquemas tipados) cuando sean pertinentes para Saber 11. No confundirlas con modelos anatómicos 3D.
- Cualquier simulación 3D futura debe pasar primero una evaluación de peso, compatibilidad con navegador y rendimiento en el equipo objetivo. No forma parte del alcance inmediato.

### Restricciones de producto y seguridad
- Mantener Orby dentro del alcance Saber 11/ICFES y en español colombiano.
- Mantener la regla de presupuesto: solo modelos/servicios con cuota gratuita real confirmada; si se agota, avisar/degradar sin fallback facturable silencioso.
- No pedir al estudiante que escriba sobre la pizarra del profesor. Las anotaciones personales viven en su herramienta independiente.
- Permisos de micrófono/archivos explícitos, límites de tamaño/duración, propiedad por usuario y validación server-side.
- No añadir proveedores, modelos, dependencias o servicios de pago para imitar funciones comerciales de Studley/Studdy.
- No cambiar `main`, no desplegar ni ejecutar migraciones remotas como parte de esta definición.

### Orden de implementación propuesto
1. Auditar el código real de `OrbyWorkspacePage` y `LessonAITutor`; inventariar qué historial, notas, grabaciones, adjuntos y persistencia ya existen antes de duplicarlos.
2. Rediseñar primero la sidebar del espacio Orby manteniendo el chat actual, con rutas/vistas funcionales y estados vacíos/carga/error.
3. Conectar Anotaciones y Resúmenes con las fuentes de conversación ya existentes, sin nueva tabla si el esquema actual basta.
4. Auditar el soporte real de audio y persistencia antes de construir Grabaciones; no asumir que una grabación de micrófono ya está almacenada.
5. Implementar Flashcards y Cuestionarios reutilizando los datos y servicios existentes, después de revisar esquema/RLS.
6. Integrar Material de estudio y carpetas solo tras inspeccionar tablas/buckets y límites reales de Storage.
7. Mantener el modo Live/whiteboard como experiencia central separada de las herramientas personales; validar voz audible, dibujo progresivo y subtítulos en Chrome.
8. Probar ownership/RLS, permisos, cuotas gratuitas, móvil y rendimiento. Actualizar la bitácora con resultados reales, no con tareas planeadas como si estuvieran terminadas.

### Estado de esta actualización
- Se revisó el código de `app/orby/page.tsx`, `components/aprender/OrbyWorkspacePage.tsx` y la cabecera/contratos de `components/aprender/LessonAITutor.tsx`.
- Confirmado: `/orby` renderiza `OrbyWorkspacePage`, que contiene `LessonAITutor` en modo workspace; el workspace actual es un shell oscuro con el tutor como contenido principal.
- Confirmado: `LessonAITutor` ya contiene funcionalidades relacionadas con conversaciones, notas, adjuntos e interacción de voz; se debe auditar cada una antes de añadir una segunda implementación.
- No se modificó código funcional en esta actualización; solo se registra la dirección de producto, los requisitos y el orden seguro de implementación.
- No se ha implementado aún la nueva sidebar ni se ha validado funcionalmente ninguna herramienta adicional.


### Aclaración del usuario y primer cambio de interfaz — 2026-11-08
La instrucción correcta es **rediseñar la interfaz actual de Orby para que las herramientas de estudio y los chats convivan en la columna izquierda, y cambiar el workspace completo de oscuro a claro**. No se trata de crear una página de herramientas separada ni conservar el modo oscuro.

#### Primer cambio aplicado en `feat/founder-intro`
- `components/aprender/LessonAITutor.tsx`: el workspace usa tema claro explícito; cabecera blanca; sidebar marfil; texto y estados de selección legibles; navegación lateral agrupa Chat con Orby, Anotaciones y apuntes, Temas guardados, Progreso, Biblioteca de archivos y el Historial de chats con buscador. Nuevo chat se mantiene arriba. El área central conserva la conversación actual.
- El compositor del chat y la nota inferior de seguridad también usan fondo claro en workspace.
- `components/aprender/OrbyWorkspacePage.tsx`: el shell exterior pasa a fondo claro.
- Los controles ya existentes se conectan a vistas ya existentes (`learningView`); no se presentan Flashcards, Grabaciones o Resúmenes como funciones terminadas porque aún requieren implementación/conexión real.
- Se mantiene el modo clase/tablero como experiencia independiente de la edición de apuntes del estudiante.

#### Validación y límites
- Escrituras confirmadas en GitHub en la rama `feat/founder-intro`; no se tocó `main`.
- Estado Vercel observado para los commits iniciales: pending al momento de consulta; no declarar build/QA aprobado.
- Falta validar visualmente en navegador, revisar las vistas de aprendizaje restantes para eliminar todos los tokens oscuros, y completar las herramientas que hoy no tienen flujo funcional.

---

## 2026-11-08 — OmegaX English Studio (inspiración funcional: Stimuler)

### Objetivo
Añadir práctica oral de inglés dentro del workspace de OmegaX, conservando el tutor general, Orby de Ciencias Naturales y el chat existente. Se toma como referencia funcional el ciclo hablar → recibir feedback → practicar el error; no se copia marca, personaje, textos ni interfaz de Stimuler.

### Alcance incorporado
- **Speaking de 60 segundos:** tema abierto, grabación voluntaria, transcripción y feedback en la conversación existente de OmegaX.
- **Pronunciation practice:** frase modelo pronunciada por la voz del navegador, repetición del estudiante y comparación aproximada de palabras reconocidas.
- **Roleplay:** situaciones cotidianas (cafetería, aeropuerto, entrevista, conocer personas y direcciones), con nivel A1–C1 y correcciones breves en español colombiano.
- **Biblioteca:** opción explícita para guardar la transcripción como un recurso personal tipo grabación; no se guarda el audio bruto.

### Integración técnica
- Nuevo componente: components/aprender/OmegaXEnglishStudio.tsx.
- Integración: components/aprender/LessonAITutor.tsx, nueva vista learningView === english.
- La grabación solicita micrófono solo después de una acción del estudiante, limita cada toma a 60 segundos y 8 MB y ofrece reproducción local temporal.
- La transcripción reutiliza únicamente /api/orby/audio/transcribe y Cloudflare Workers AI, bajo los límites/rate limits gratuitos ya existentes. No se añade proveedor, modelo, dependencia ni fallback facturable.
- La grabación se mantiene temporal en el navegador; se envía a transcripción solo cuando el usuario pulsa el botón y solo se guarda el texto cuando el usuario lo solicita.
- El feedback se envía al hilo actual del chat de OmegaX; el roleplay se desarrolla usando el mismo chat y la llamada Live existente.

### Límites honestos
- La comparación de frase modelo solo mide coincidencia de palabras reconocidas por ASR. No es puntuación de pronunciación, fonemas, acento ni entonación.
- La transcripción y el feedback dependen de la cuota gratuita compartida de Cloudflare Workers AI. Al agotarse, la herramienta debe mostrar el aviso del endpoint existente y no cambiar a otro proveedor.
- La interfaz todavía requiere pruebas reales de micrófono, permisos, navegadores, interrupciones y sesiones largas.
- El nuevo componente y su conexión se someten a pruebas estáticas nuevas; no declarar que Node tests, TypeScript, ESLint, build o QA visual están aprobados hasta ejecutarlos realmente.

### Inspiración de producto consultada
Stimuler describe en su sitio oficial retos improvisados de 60 segundos, conversaciones sobre distintos temas y un ciclo de hablar, recibir feedback y repetir. PeakScore adopta esa estructura educativa y la integra a su propio tutor/identidad. Fuente: https://stimuler.tech/es


## 2026-11-08 — corrección de contraste de subtítulos Live

### Hallazgo
La vista de clase en vivo utiliza una superficie de subtítulos blanca, pero los spans de palabras del karaoke fijaban texto normal en slate-100 y la palabra activa en amber-300. Ambos colores tenían contraste insuficiente sobre blanco en el workspace claro.

### Corrección
- `components/aprender/LessonAITutor.tsx`: palabras normales ahora usan `font-medium text-slate-800`; la palabra activa usa fondo `orange-100`, texto `orange-950` y subrayado `orange-600`.
- Se añadió una regresión estática que exige la paleta legible y prohíbe recuperar `text-slate-100` en los spans del subtítulo.

### Estado
- Commit de corrección: `5d5972a`.
- El cambio resuelve contraste visual en el código; la verificación visual en Chrome y la ejecución del test runner siguen pendientes.
- No se modificó el pipeline de audio ni se afirma sincronización fonética exacta. El resaltado sigue siendo la temporización aproximada ya documentada.


## 2026-11-08 — cierre de contraste Live e identidad de OmegaX en textos del workspace

- Se corrigió el contraste de subtítulos karaoke en la hoja blanca: texto normal `slate-800`; palabra activa `orange-950` sobre `orange-100` con subrayado `orange-600`.
- Se añadió regresión estática para impedir el retorno de `text-slate-100` en las palabras del subtítulo de la clase clara.
- Se corrigieron dos textos visibles que aún nombraban a Orby en el workspace general: la descripción de biblioteca/progreso y el error de timeout al restaurar la sesión Live. Ambos usan ahora `assistantLabel`, conservando Orby cuando está seleccionado su tutor especializado.
- Inventario estático actual del archivo de pruebas: 238 pruebas nombradas, sin títulos duplicados. Este conteo no equivale a ejecución ni aprobación de pruebas.
- GitHub Actions no reporta workflow run asociado al HEAD consultado. Vercel reporta `build-rate-limit`; TypeScript, ESLint, tests, build y QA Chrome/micrófono siguen pendientes de ejecución.
- Se verificó que `main` permanece intacta; los cambios continúan únicamente en `feat/founder-intro`.

## 2026-11-08 — rechazo de solapamientos en append-block

### Hallazgo
La ruta incremental `append-block` comprobaba límites del canvas y duplicados de ID, pero permitía que el nuevo rectángulo cubriera una etapa de texto o una visual existente. La bitácora ya marcaba esa validación geométrica como pendiente.

### Corrección aplicada
- `lib/ai/orby-board-actions.ts`: se agregó `rectanglesOverlap` y `applyOrbyBoardAction(append-block)` ahora rechaza el nuevo bloque si intersecta cualquier rectángulo de `layout.elements`. Los bordes que solo se tocan no cuentan como solapamiento.
- `components/aprender/LessonAITutor.tsx`: si se rechaza `append-block`, Gemini Live recibe un motivo espacial útil; `append-strokes` conserva un motivo específico y las operaciones sobre IDs mantienen su mensaje.
- `tests/orby-request-filter.test.mjs`: regresiones para bloque superpuesto, bloque adyacente que solo toca el borde y mensaje explicativo devuelto al modelo.

### Alcance y límites
- La regla afecta solo a nuevas acciones incrementales `append-block`; no invalida snapshots históricos ni cambia el contrato de layout v2 heredado.
- No se permite texto flotando encima de una etapa de dibujo con este tipo de acción. Las etiquetas que forman parte del sketch siguen pudiendo vivir dentro del propio SVG mediante `labelX/labelY`.
- No se ha ejecutado el test runner ni QA de Chrome. La revisión estática del inventario de tests es independiente de su ejecución.
- No se modificó el renderer, la cola del lápiz, el transporte de audio, los prompts de conocimiento ni la cuota de proveedores.

## Cierre de validación CI — 8 de noviembre de 2026

**Run GitHub Actions:** https://github.com/PeakScore777/PeakScore/actions/runs/42519075898
**SHA validado:** `69eebdcdacf94dd0403b1e7d01ab8e3f7d3135c9` (`feat/founder-intro`).

- `npm ci`: correcto.
- Auditoría de dependencias: correcta; sin vulnerabilidades reportadas por el gate.
- `npm run test:orby`: **239/239 aprobadas, 0 fallidas**.
- `npx tsc --noEmit`: correcto.
- `npm run lint`: correcto.
- `npx next build`: correcto.

### Incidencias cerradas durante esta validación
- Se alinearon las regresiones estáticas con la identidad dinámica `assistantLabel` y los textos condicionales OmegaX/Orby, sin cambiar el tutor especializado.
- Se acotó la regresión de desbloqueo de AudioContext al método `startRealtimeVoice`, evitando comparar el micrófono de la grabadora de estudio con el permiso de la clase Live.
- Se reintrodujo en la directiva Live la desambiguación por intención/contexto para no rechazar palabras aisladas como «sí», «moda», «cocina» o «Python».
- Se restauró la dirección de voz femenina, natural y colombiana ligera en el estilo compartido de OmegaX y Orby.
- Se corrigió el cierre prematuro del template literal CSS de `LessonAITutor.tsx`: las reglas de tema claro quedaron de nuevo dentro de `<style jsx global>`.
- Se conserva la protección contra solapamientos de `append-block`, con borde adyacente permitido y feedback espacial claro al modelo.

**Alcance de esta certificación:** es una compilación de producción y suite automatizada con las variables placeholder definidas por el workflow. No equivale a QA de micrófono físico, sesión Gemini Live real, prueba visual de Chrome ni despliegue de producción.

## 2026-11-08 — English Studio roleplay con voz Live

### Experiencia
- El botón de roleplay del English Studio abre/reutiliza una llamada de voz OmegaX y envía el escenario como primer turno; no exige que el estudiante active el micrófono desde un segundo control.
- Si ya hay una sesión general de voz, el tutor la cierra antes de iniciar una sesión dedicada a English Studio, porque el prompt/idioma de Live se fija al crear el token efímero.
- Si Gemini Live no está disponible por cuota, privacidad o red, conserva el escenario en el flujo gratuito por turnos de OmegaX. No introduce otro proveedor.

### Excepción lingüística, acotada
- El cliente envía `englishPracticeMode` solo mientras el estudiante está en English Studio.
- El servidor acepta el flag únicamente si `assistantName === "OmegaX"`; Orby no puede activar el modo.
- En este modo el roleplay se mantiene en inglés natural, una pregunta a la vez, con hasta dos correcciones breves en español colombiano. Las explicaciones gramaticales se dan en español con ejemplos en inglés.
- Se permite la salida en inglés únicamente dentro de esta sesión seleccionada; permanecen activos los filtros de programación, cocina, daño, promoción externa, privacidad, prompt injection y atribución falsa.
- El fallback gratuito del tutor escrito usa el mismo flag de sesión para mantener el roleplay bilingüe cuando Live no está disponible.
- La comparación de pronunciación sigue siendo ASR aproximado; no se afirma que se midan fonemas, acento o entonación.

### Validación CI
- SHA validado: `f1a08ccff8cf7c144d183af8d4acbaa9e259eb60`.
- GitHub Actions run 42519666204: https://github.com/PeakScore777/PeakScore/actions/runs/42519666204
- `npm run test:orby`: **240/240 aprobadas**.
- TypeScript, ESLint, auditoría de dependencias y Next.js production build: correctos.
- No equivale a QA manual con micrófono físico, revisión visual de la clase ni verificación de cuotas reales/proveedor en producción.

## 2026-11-08 — karaoke ponderado por palabra

- La clase Live ya no distribuye el tiempo de audio por igual entre todas las palabras. El resaltado usa `getOrbyKaraokeWordIndexForText`, anclado al reloj real `AudioContext.currentTime` y ponderado por núcleos vocálicos estimados, longitud y pausas de puntuación.
- Palabras largas reciben una ventana visual más amplia; comas, dos puntos, punto y signos de cierre añaden una pausa relativa.
- El índice permanece monotónico cuando la transcripción incremental crece, y el ciclo sigue usando `requestAnimationFrame` sin intervalos ni llamadas adicionales al modelo.
- La aproximación no es alineación fonética: Gemini Live no entrega marcas temporales por palabra. No afirmar precisión a nivel de fonema.
- La función previa `getOrbyKaraokeWordIndex` se conserva para compatibilidad; el componente Live usa el nuevo cálculo ponderado.

### Validación
- Código validado en SHA `8b8894928b5ccd96d010c5509b88338ebe56cb7f`.
- GitHub Actions run 42520586985: https://github.com/PeakScore777/PeakScore/actions/runs/42520586985
- `npm run test:orby`: **240/240 aprobadas**; TypeScript, ESLint, auditoría de dependencias y Next.js production build: correctos.
- Pendiente: comparar visualmente el resaltado con voz real en Chrome y ajustar la heurística mediante observación; la CI no mide sincronía auditiva humana.

## 2026-11-08 — sincronización de animación interna con etapas espaciales

### Hallazgo corregido
- Las visuales SVG se montaban con su `stageDelay` espacial, pero varios `line`/`path` hijos iniciaban su animación al montar. CSS `animation-delay` en el grupo contenedor no se hereda; en consecuencia, el trazo podía terminar mientras la etapa seguía oculta por su transición de entrada.
- En algunos elementos compuestos (por ejemplo, nodos de diagramas y puntos de gráfica) había animaciones `orby-board-appear` duplicadas en padre e hijo, que también desincronizaban el conjunto.

### Corrección aplicada
- `lib/ai/orby-board.ts`: helper compartido `getOrbyBoardProgressiveDelay(index)` con retraso escalonado de 90 ms y tope de 630 ms.
- `components/aprender/OrbyBoard.tsx`: `Visual` propaga el `startDelayMs` del elemento espacial a diagramas, gráficas, vectores, moléculas, circuitos, células, ADN y procesos fisiológicos.
- Los `line`/`path` que realmente ejecutan `orby-board-draw` reciben directamente el retraso de etapa más su escalonado por elemento; nodos/componentes reciben el mismo retraso en su transición de aparición.
- Se eliminaron animaciones anidadas redundantes en nodos de diagrama y puntos de gráfica para que la figura se revele como una unidad coherente.
- Sketch conserva su cola SMIL, pausa/reanudación y punta de lápiz existentes; no se modificó el transporte de audio, karaoke, proveedor ni lógica de interrupción.

### Validación
- GitHub Actions run 42521925925: https://github.com/PeakScore777/PeakScore/actions/runs/42521925925
- `npm run test:orby`: **241/241 aprobadas**; TypeScript, ESLint, auditoría de dependencias y Next.js production build: correctos.
- SHA de código de pizarra verificado: `6faaa500bea535cdcf9c40680a4f9ae8630d0095`; helper/propagación y regresión quedaron en el mismo HEAD validado de la rama.
- Sigue pendiente QA manual de Chrome con voz Live real para comprobar la sincronía percibida con el audio y las pausas del profesor; CI solo valida contratos y compilación.

## 2026-11-08 — siguiente bloque OmegaX: mano natural, accesibilidad y pasos matemáticos

### Auditoría previa
- Se revisaron la especificación `docs/ORBY-LIVE-TUTOR-SPEC.md`, la bitácora del 8 de noviembre, `app/api/orby/realtime-session/route.ts`, `lib/ai/orby-live-tools.ts`, `components/aprender/OrbyBoard.tsx` y `tests/orby-request-filter.test.mjs`.
- Hallazgo documental: la especificación conservaba una frase antigua que afirmaba que el karaoke de palabra aún no estaba implementado. Se corrigió: existe un resaltado aproximado calculado desde el reloj de reproducción y ponderado por longitud/grupos vocálicos/puntuación; no son timestamps fonéticos exactos.
- La escritura progresiva acumulativa, operaciones incrementales y cola de lápiz ya existían. Esta tanda no las reconstruyó ni cambió su protocolo.

### Correcciones aplicadas
1. **Movimiento reducido real:** `OrbyBoard.tsx` ahora convierte el tablero en una salida estática completa al activarse `prefers-reduced-motion`. La tinta, etiquetas y puntos finales siguen visibles; se elimina el movimiento del lápiz, los SMIL y la aparición animada.
2. **Perfil del lápiz:** tinta y punta usan la misma curva spline, derivada de la geometría del trazo. Se conserva la cola serial y la pausa/reanudación.
3. **Derivaciones de ciencias exactas:** la instrucción de sesión Live pide una transformación visible por evento incremental, alineación de igualdades, explicación del cambio y comprobación de unidades/cálculos.
4. **Regresiones:** se añadieron pruebas para movimiento reducido y derivaciones por etapas.

### Commits
- `777b66a` — reduce motion.
- `e9174ae` — derivaciones por etapas.
- `d501f01` — pruebas de regresión.
- `7e77325` — reconciliación de especificación.

### Validación pendiente y límites
- No se ha ejecutado `npm run test:orby`, TypeScript, ESLint ni build para el HEAD de esta tanda. Los tests nuevos son regresiones añadidas, no pruebas aprobadas.
- La CI histórica 42521925925 (241/241) valida un SHA anterior y no debe atribuirse a estos cambios.
- Vercel ha mostrado `build-rate-limit`; no se ha intentado cambiar el plan ni habilitar facturación.
- Falta comprobar en Chrome real la preferencia de movimiento del sistema, voz Gemini Live, interrupción a mitad de un trazo y que las derivaciones lleguen incrementalmente en el orden explicado.
- No se afirma alineación exacta palabra-audio; la heurística de subtítulos sigue siendo aproximada.

### Corrección de validez SMIL — perfil de escritura (2026-11-08)
- La primera versión del perfil declaró cuatro `keyTimes` y tres `keySplines` para un trazo con solo valores inicial/final implícitos. Esa cardinalidad no era válida para el contrato SMIL usado y podía impedir la animación en navegador.
- Se corrigió el perfil a un solo intervalo `keyTimes="0;1"` y una spline. `animateMotion` especifica además `keyPoints="0;1"`. La complejidad del recorrido ajusta los puntos de control de esa curva única; la tinta y la punta comparten los mismos parámetros.
- La prueba ahora verifica exactamente un intervalo, una spline válida y que los trazos curvos obtengan una curva distinta a los rectos.
- Commits: `3c18f41` (helper), `f18ade7` (renderer), `d7cb8da` (prueba). No se ha ejecutado aún la suite ni QA Chrome de este HEAD.


## 2026-11-08 — consistencia de derivaciones entre Live y tutor de respaldo

### Hallazgo
- Live ya exigía una etapa incremental por transformación en Matemáticas, Física y Química; el endpoint de respaldo por turnos no tenía una regla equivalente y podía condensar una derivación en un solo bloque.
- También había una prueba de movimiento manuscrito cuyo contrato debía reflejar con precisión el perfil SMIL de una transición única, no una secuencia de keyframes inexistente.

### Cambios
- `app/api/lesson-tutor/route.ts`: se reforzó el prompt académico, el prompt de voz y el prompt de seguimiento. Una derivación debe identificar datos/incógnita, presentar una transformación por bloque `formula`/`step`, mantener los pasos previos, explicar la operación y comprobar cálculos/unidades. Las respuestas sencillas no se obligan a dibujar.
- `tests/orby-request-filter.test.mjs`: se corrigieron las aserciones de perfil SMIL y se añadieron regresiones que exigen derivaciones paso a paso tanto en Live como en el fallback, incluso en un seguimiento con varias operaciones.
- Perfil SMIL actual: una curva spline válida `keyTimes="0;1"`; `animateMotion` utiliza `keyPoints="0;1"`. Los parámetros de la spline son compartidos entre tinta y movimiento de lápiz.

### Commits
- `4b5254a` — corregir contrato de prueba del perfil SMIL.
- `156159a` — alinear tutor de respaldo con derivaciones paso a paso.
- `056d33a` — preservar el método en seguimientos breves.
- `480164b` — probar Live y fallback.
- `da3a3a8` — probar la continuidad de seguimientos.

### Validación
- Revisión estática: 245 tests nombrados, sin títulos duplicados. No se han ejecutado.
- Se ejecutó únicamente un smoke-check Node de la expresión regular del perfil spline; no equivale a la suite ni a TypeScript/ESLint/build.
- El status Vercel del HEAD reporta `build-rate-limit`. No se obtuvo un resultado de push de GitHub Actions mediante el conector disponible.
- Pendiente ejecutar `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npx next build` y QA manual Chrome/micrófono, voz Live, interrupciones y movimiento reducido.
- La rama se comprobó divergente de `main`; no se fusionó, rebasó ni desplegó.


### Contrato adicional de notación legible
- Los bloques `formula`/`step` se renderizan como texto manuscrito en HTML, no como TeX. Las instrucciones de Live y del tutor de respaldo ahora exigen notación de texto plano (ej. `2x + 3 = 11`) y prohíben comandos LaTeX/HTML/Markdown complejo.
- Regresiones añadidas para exigir esta regla en ambas rutas. Commits: `36a3587` (Live), `4f34a50` (fallback), `9625453` (tests).


## 2026-11-08 — señalador del profesor con selección de punto exacto

### Implementado
- La acción `focus` admite `pointIndex` opcional junto a `strokeId`. Es un índice desde cero de un punto existente dentro del trazo; no es una coordenada libre. Omitirlo conserva el foco al punto medio.
- El foco sobre un `elementId` sigue destacando la etapa completa y rechaza `pointIndex`.
- La validación comprueba primero el tipo/rango del índice y luego la cantidad real de puntos del trazo. El índice inexistente se rechaza con una guía clara para Gemini Live.
- La UI muestra un anillo pulsante sobre el punto exacto, punto central, línea guía y rótulo. No altera ni añade tinta. En `prefers-reduced-motion` el foco conserva un estado estático visible.
- El prompt de Live explica cuándo apuntar a una unión/extremo/parte específica y cuándo omitir el índice para usar el centro.

### Pruebas y límites
- Regresiones añadidas para selección exacta, índices negativos/máximos, índice mayor que el tamaño real del trazo, incompatibilidad con `elementId`, conservación de la tinta y contrato de renderer/schema/prompt.
- No se ha ejecutado `npm run test:orby`, TypeScript, ESLint ni build para el HEAD de esta mutación. Falta QA real en Chrome con voz Live y sistema configurado con movimiento reducido.
- No se añadieron servicios/modelos de pago, migraciones ni cambios a `main`; no se desplegó producción.

- Cierre de inventario estático: 246 pruebas nombradas y 0 títulos duplicados. El conteo no certifica ejecución; la suite/TypeScript/ESLint/build y QA de navegador permanecen pendientes.


## 2026-11-08 — acción para retirar el señalador del profesor

### Cambio
- Se añadió `clear-focus` a las acciones de pizarra. Es una orden de presentación: elimina únicamente `teacherFocus`, sin alterar bloques, visuales, trazos, geometría ni layout.
- El sanitizer exige el `turnGeneration` vigente y rechaza IDs, puntos, labels o listas de trazos en esta operación, para evitar que se convierta accidentalmente en un borrado.
- La herramienta de Gemini Live documenta el nuevo enum y el prompt ordena utilizarlo al terminar una explicación puntual o cambiar de zona. Se prohíbe usar `erase` para quitar el resaltado.
- El cliente confirma que el foco fue retirado y que el contenido quedó intacto.

### Regresión y estado
- Se añadió una prueba de integración del módulo de acciones: foco previo con punto exacto, retirada de foco, igualdad profunda de bloques/visuales/layout y rechazo de una generación ausente o de targets extra.
- Inventario estático: **247 pruebas nombradas, sin duplicados**. No son resultados de ejecución.
- Commits: `1c6d8df`, `c2d0f8e`, `3c362d9`, `4b89988`, `805e7bc`, `e6ab60f`.
- Tests, TypeScript, ESLint, build y QA en Chrome/Gemini Live aún pendientes; no se desplegó y `main` no se modificó.

### Revisión de coherencia
- La lista de operaciones del prompt Live ahora enumera también `clear-focus`; la prueba de contrato valida el enum de la herramienta con la expresión regular corregida para el texto JSON real.
- Inventario estático final: 247 pruebas nombradas y 0 duplicados; no ejecutadas para este HEAD.
- Commits de sincronización: `1b88395`, `3e7d2f3`.


## 2026-11-08 — foco interno en elementos visuales con ID estable

### Implementación
- Se añadió `targetId` opcional a la acción Live `focus`, exclusivamente cuando también se envía un `elementId` de tipo visual. El validador comprueba el visual asociado, no solo el formato del ID.
- Se agregó una lista explícita de IDs compatibles por visual y no se aceptan targets desconocidos o provenientes de otro tipo de elemento.
- El renderer contiene un marcador reutilizable para nodos, átomos, orgánulos visibles, componentes eléctricos y estructuras anatómicas. El foco aparece sobre la posición real del SVG: anillo, punto, línea guía y rótulo.
- La operación mantiene intacto el visual y no crea tinta. La instrucción Live aclara que debe usar IDs incluidos en el snapshot, nunca generar coordenadas ni nombres de ID por inferencia.

### Cobertura y límites
- Compatible: `diagram.nodes`, `molecule.atoms`, orgánulos independientes de `cell`, `circuit.components`, `organ-system.structures`.
- No compatible todavía: enlaces/aristas/cables, puntos de gráficas y vectores, partes de neurona y contornos de membrana/pared celular. Sus renderers aún no exponen un subelemento posicionado con ID específico.
- Se añadieron pruebas de cinco tipos válidos y rechazo de target desconocido, target en bloque de texto, gráfica sin IDs y membrana no separada.
- Inventario estático: **249 pruebas con nombre, 0 duplicados**; no implica ejecución.
- Pendiente: `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npx next build` y QA manual de Live/Chrome. Sin despliegue ni cambios a `main`.


### Último ajuste de regresión
- La prueba estática del renderer ahora comprueba también el objetivo `component.id` usado por los circuitos, además de nodos, átomos y elementos anatómicos/orgánulos. Inventario estático: 249 pruebas, sin duplicados; no ejecutadas.


## Auditoría correctiva transversal — 8 de noviembre de 2026

- La fase de revisión se amplió a los 109 archivos de TypeScript/JavaScript de servidor bajo `app/api` y `lib`. El uso de proveedores de inferencia quedó centralizado o bloqueado por `lib/ai/provider-free-tier.ts`; el único endpoint adicional con cliente Gemini directo encontrado en las rutas API fue `app/api/import.pdf/route.ts`, ahora protegido con aprobación de nivel gratuito y uso de datos antes de procesar el PDF y después de autenticar al administrador.
- Gemini Free requiere dos confirmaciones separadas: `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED` (plan sin coste verificado por el operador) y `PEAKSCORE_GEMINI_DATA_USE_APPROVED` (aprobación independiente del uso de datos de Free Tier). Ambas quedan apagadas por defecto. Esta decisión no sustituye consentimiento legal ni consulta automática de facturación.
- Groq, LLM7 y Cloudflare Workers AI también requieren confirmaciones explícitas de plan sin coste; no hay fallback silencioso a proveedores no confirmados. El OpenAI legacy client está bloqueado.
- El cronómetro de English Studio arranca al recibir `MediaRecorder.onstart` y usa `performance.now()`.
- La etiqueta de foco de pizarra tiene una regresión que verifica preservación de tildes, siglas, cifras y fórmulas.
- CI completó tests, TypeScript, ESLint y build en SHA `4a7e21230deb385b94860848cf6bc4d71e7712b9` (run 42537054107). Un ajuste posterior movió la comprobación del importador PDF después de autenticación y verificación de rol admin; pendiente run 42537169406.
- Pendiente QA real Chrome/Gemini Live/micrófono, verificación manual de planes/cuotas y transición compatible de embeddings antes de la retirada del modelo actual. No cambiar el índice de 768 dimensiones sin probar/reindexar.
- Sin cambios a `main`, sin deploy y sin migraciones remotas.


## 2026-11-09 — ajuste del arranque de clase y del margen del tablero

- La instrucción inicial anterior pedía explícitamente un saludo breve. Se eliminó: la primera frase oral ahora debe anunciar el título del tema y explicar su idea central, sin saludo ni relleno.
- La primera frase se mantiene corta y completa para que la validación incremental de voz pueda liberar audio mientras la pizarra se construye en paralelo.
- La instrucción pide escribir el título progresivamente dentro del margen superior izquierdo de una hoja blanca completa y dibujar el esquema por etapas, narrando cada parte.
- Se añadió un ajuste CSS al final de la cascada para resolver los márgenes acumulados del encabezado en la vista Live y dar al lienzo una altura útil, con reglas móviles.
- La integración Gemini Live conserva el consentimiento explícito del nivel gratuito y los bloqueos de gasto. No se elimina ni se sustituye por una ruta facturable.
- Pendiente de ejecutar en entorno local: test dirigido, lint y build; este cambio aún no está validado por ejecución.


## 2026-11-09 — auditoría comparativa Studdy vs PeakScore y corrección Live

- Las grabaciones Studdy muestran una clase en un lienzo blanco amplio, con título manuscrito en el margen superior izquierdo, contenido organizado por zonas, diagramas que se amplían por etapas y apoyos visuales ubicados junto al concepto que ilustran. En una referencia también se aprecia un panel lateral de conversación/guion mientras la pizarra permanece visible.
- En la grabación PeakScore, tras aceptar el aviso, el lienzo llega a mostrar únicamente el título «mitosis» durante la sesión; posteriormente Live finaliza con «sin entregar una transcripción utilizable» y la app devuelve al formulario de inicio. No se observa explicación hablada ni desarrollo visual en esa prueba.
- Hallazgo de configuración: outputAudioTranscription se enviaba con languageCodes. La documentación oficial de Gemini Live indica que el idioma de la transcripción de salida se infiere del habla generada y muestra outputAudioTranscription: {}. languageCodes corresponde a la transcripción de entrada. Se corrigió la configuración de salida a objeto vacío, manteniendo languageCodes: [] y vocabulario personalizado solo en inputAudioTranscription.
- Hallazgo de instrucciones: había una directiva que podía interpretarse como «llama primero al tablero antes de hablar», en conflicto con otra que pedía voz inmediata y herramienta en paralelo. Se unificó: primera frase oral breve y útil primero; llamada de tablero en paralelo, sin bloquear la voz.
- Diferencias de producto por cerrar: panel lateral de conversación persistente junto al tablero, integración de imágenes generadas dentro de la composición didáctica (ahora se muestran fuera del canvas) y prueba real de sincronía voz/trazo en Chrome.
- Se mantienen los límites de privacidad, rol, cuota y no facturación. No se cambia main ni se despliega.
- Pendiente QA: test dirigido, lint/build y una sesión real de Live tras esta corrección; no declarar la voz reparada hasta comprobarla en navegador.


## 2026-11-09 — comparación detallada con la grabación Studdy (47,6 s)

### Observación directa del vídeo

- 0–3 s: Studdy muestra el selector de clase/tema en un entorno de lienzo limpio.
- 5–27 s: se ve una hoja didáctica completa con notas manuscritas a la izquierda, términos resaltados, ilustraciones explicativas en el centro/derecha y flechas/etiquetas que relacionan cada imagen con el texto. El material no es una respuesta de chat ni una cuadrícula de tarjetas.
- 42–45 s: al comenzar otra explicación, la hoja vuelve a un lienzo casi vacío; aparece el título «Mitosis: La División Celular» con resaltado amarillo. La voz comienza mientras el lienzo todavía está despejado.
- 47 s: aparece el primer pequeño grupo de trazos/puntos de la nueva construcción. Esto confirma que Studdy inicia con título + narración y después va incorporando la explicación visual; no muestra necesariamente la clase completa al inicio.
- La interfaz mantiene controles discretos en los bordes y deja la mayor parte del área disponible para el contenido. La voz se representa con subtítulos breves en la parte inferior.

### Diferencias reales identificadas en PeakScore

- La pizarra ya tenía tinta SVG animada, bloques con fuente manuscrita, diagramas tipados, anotaciones de círculo/subrayado/flecha y foco del profesor.
- El modelo no tenía una regla de uso suficientemente explícita para añadir solo puntos clave al ritmo de la explicación y destacar cada concepto al presentarlo.
- Las anotaciones existían en el tipo y renderer, pero no estaban incluidas claramente en el inventario de recursos de la herramienta Live.
- Las imágenes generadas se mostraban como una figura separada debajo del título y fuera del canvas; esto rompía la composición integrada de Studdy.
- Los bloques escritos aparecían con una animación de entrada/opacidad, no con un revelado progresivo que simulara que el profesor los va escribiendo.
- La clase podía dejar espacio vacío al comenzar; se debe conservar ese comportamiento y construir la hoja por etapas, no llenar el tablero antes de que el profesor explique.

### Implementación realizada en feat/founder-intro

- Se añadió el visual image al contrato de pizarra, pero solo acepta rutas relativas autenticadas de /api/orby/images?path=...; se rechazan URLs externas para impedir contenido remoto arbitrario.
- OrbyBoard ahora puede renderizar una ilustración guardada dentro del mismo canvas 16:9, con object-contain, texto alternativo y pie opcional.
- Cuando termina una generación de imagen y la imagen se guarda correctamente, Live intenta insertarla en la zona libre derecha de la hoja activa. Comprueba colisiones con los elementos existentes y el máximo de elementos por página; si no hay espacio seguro, conserva la imagen como apoyo externo en vez de tapar apuntes.
- Se mantiene la cuota gratuita, el máximo de una imagen por intervención y la regla de no cambiar a otro proveedor ni provocar cargos si se agota la cuota.
- La herramienta Live ahora instruye explícitamente escribir puntos clave conforme se pronuncian, conservar las notas anteriores y usar anotaciones circulares/subrayados para términos centrales. La generación de imágenes continúa en paralelo con la voz y el runtime las integra en el canvas cuando se guardan.
- Los bloques manuscritos ahora usan revelado progresivo de izquierda a derecha con duración proporcional a su longitud. La animación se pausa al pausar la clase y respeta prefers-reduced-motion.
- Los círculos de énfasis se muestran como trazos continuos en lugar de una línea discontinua.

### Pruebas y pendientes

- Se añadieron pruebas para validar imágenes privadas dentro del layout, rechazar URLs externas, comprobar la integración de imágenes y verificar el revelado progresivo de los puntos clave.
- Pendiente: ejecutar la suite npm run test:orby, npm run lint y npm run build en la rama actual; confirmar con una sesión real en Chrome que Gemini Live produce la voz, que los snapshots se publican sin retraso, que el profesor dibuja/subraya en el orden narrado y que la ilustración aparece dentro del mismo canvas.
- No declarar equivalencia completa con Studdy hasta validar esa sesión real. No modificar main ni desplegar a producción.


### Seguimiento de validación — 2026-11-09

- Se corrigió una aserción antigua de la suite que todavía esperaba languageCodes dentro de outputAudioTranscription; ahora comprueba el objeto vacío correcto y conserva la prueba de languageCodes en entrada.
- El último estado de commit que reporta GitHub muestra el check de Vercel como fallo por límite diario de despliegues del plan actual (api-deployments-free-per-day), no como un nuevo error de TypeScript o de la integración de imágenes.
- No se pudo iniciar un nuevo build de Preview porque Vercel respondió que se superó el límite de más de 100 despliegues API en 24 horas. No se ha intentado producción ni se ha cambiado el plan.
- La suite completa, ESLint y Next build todavía requieren ejecución después de la última corrección. El commit previo que ejecutó la suite falló en la aserción antigua de idioma de salida; esa aserción ya fue actualizada, pero su corrección aún no tiene resultado de ejecución.

## 2026-11-10 — auditoría de los vídeos: clase actual frente a Studdy

### Evidencia del vídeo de PeakScore (56,4 s)

- Tras seleccionar «Mitosis», la hoja queda casi vacía durante la mayor parte de la grabación.
- El título aparece pegado al borde superior y parcialmente recortado por la navegación global; además, su tamaño domina la hoja.
- El escenario de clase no cubre el chrome de PeakScore, por lo que la cabecera global invade la superficie de enseñanza.
- Alrededor del segundo 40, la vista vuelve al chat y muestra en una burbuja naranja el prompt interno completo («Quiero estudiar: mitosis. Empieza a hablar…»). Ese texto es una instrucción de sistema de la aplicación, no un mensaje que deba mostrarse como si lo hubiera escrito el estudiante.
- No se observa una respuesta oral audible ni una construcción progresiva de apuntes durante el tramo en blanco.

### Patrón observado en los vídeos de Studdy

- Hoja blanca amplia y limpia; el tema aparece pequeño, manuscrito y dentro del margen superior izquierdo.
- La hoja se construye por etapas: apuntes breves y legibles, conceptos destacados, flechas/círculos y diagramas o ilustraciones ubicados junto a la explicación correspondiente.
- Las imágenes forman parte de la composición didáctica y no sustituyen los apuntes.
- La interfaz deja el lienzo como protagonista, con controles discretos en los bordes y sin exponer instrucciones internas del tutor en una burbuja de chat.

### Correcciones aplicadas en feat/founder-intro

- app/globals.css: el escenario Live ahora se superpone a la navegación global; el título queda dentro de un margen superior seguro, alineado a la izquierda y reducido a una escala de encabezado manuscrito, no de cartel.
- app/api/orby/realtime-session/route.ts: el token efímero ahora autoriza explícitamente inputAudioTranscription y outputAudioTranscription, además de fijar el idioma de voz de acuerdo con el modo español/English Studio. El cliente retiene el audio hasta validar la transcripción; sin conceder esa capacidad en el token, el modelo podía conectarse y generar audio que la aplicación no liberaba.
- components/aprender/LessonAITutor.tsx: la instrucción larga para iniciar la clase se mantiene interna. El historial visible solo muestra «Quiero estudiar: [tema]», nunca la directiva interna completa.
- El consentimiento explícito de uso de datos del nivel gratuito se conserva, pero una aceptación expresa se recuerda en sessionStorage para que no vuelva a aparecer tras cada recarga de la misma pestaña.
- El estado visual indica «Activando micrófono…» en vez de presentar la solicitud del navegador como un paso adicional de PeakScore.

### Privacidad y permisos que no se deben falsear

- El permiso nativo del micrófono lo controla Chrome/Edge. La web no puede ni debe saltárselo; si el sitio ya está autorizado, getUserMedia no vuelve a mostrar el diálogo. Si el usuario lo denegó, debe cambiarlo en los permisos del sitio.
- El consentimiento del nivel gratuito de Gemini es distinto del permiso del micrófono: Google indica que las entradas y salidas del nivel gratuito pueden utilizarse para mejorar sus productos. No se debe marcar como aceptado automáticamente ni ocultar esa condición. La elección expresa se recuerda solo durante la pestaña actual.
- No se introdujo ningún proveedor de pago ni fallback facturable.

### Validación automatizada

- La suite Orby pasó en la ejecución CI del commit 42375789e1157af603529e5bd7271003a09c1923 después de ajustar la aserción de speechConfig para admitir el languageCode explícito.
- TypeScript, ESLint y next build estaban en ejecución al redactar esta nota. No declarar la entrega libre de errores hasta que esos tres checks terminen correctamente.
- Falta validación manual con micrófono real y sesión Gemini Live real en Chrome. La CI no puede demostrar que el proveedor haya emitido voz audible ni que la pizarra se actualice al ritmo de esa voz.
