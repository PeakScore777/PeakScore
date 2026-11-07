# Orby — auditoría inicial de implementación

**Fecha:** 2026-11-07  
**Rama inspeccionada:** `feat/founder-intro`  
**Alcance:** lectura estática de rutas, prompts, tablero, herramientas Live, recuperación de conocimiento y persistencia. No equivale a pruebas ejecutadas en navegador ni a CI aprobada.

## 1. Arquitectura existente confirmada

- `components/aprender/LessonAITutor.tsx` concentra chat, audio, sesión Gemini Live, transcripción, interrupciones, fallback por turnos, pizarra y persistencia de voz.
- `components/aprender/OrbyBoard.tsx` renderiza bloques y visuales educativos tipados.
- `lib/ai/orby-board.ts` define y sanitiza los tipos de tablero; el contrato incluye diagramas, gráficas, vectores, tablas, líneas de tiempo, moléculas, circuitos, células, ADN, cuadros de Punnett, división celular, sistemas orgánicos, neuronas y procesos fisiológicos.
- `lib/ai/orby-live-tools.ts` declara las herramientas no bloqueantes de búsqueda académica y actualización de la pizarra durante una lección hablada.
- `app/api/lesson-tutor/route.ts` autentica, valida alcance, recupera conocimiento publicado, señales de aprendizaje, genera con Cloudflare Workers AI, aplica filtros y guarda respuesta/tablero.
- La recuperación de fragmentos y conceptos usa `Promise.allSettled`; el enriquecimiento pedagógico se realiza después con resultados parciales disponibles.
- La ruta mide recuperación, generación y persistencia mediante `Server-Timing` y `X-Orby-Response-Time-Ms`.
- El proveedor textual del tutor es Cloudflare Workers AI. El código documenta que no debe cambiar silenciosamente a proveedores de pago cuando la cuota gratuita se agota.

## 2. Hallazgos y cambios de esta tanda

### A. Contrato visual de Gemini Live — corregido

La herramienta Live ya permitía llamar repetidamente a `render_orby_teaching_board`, enviar snapshots acumulativos no bloqueantes y actualizar la pizarra del mismo mensaje mientras se reproduce la explicación. El manejador valida cada payload con `sanitizeOrbyBoard`, lo incorpora al turno activo y lo conserva para persistencia/reintentos.

Sin embargo, el texto de la propiedad `visual.type` describía solo cinco tipos básicos, aunque el sanitizador y el renderizador ya aceptaban catorce. Esto podía inducir al modelo a evitar visuales avanzados que el producto sí sabe representar.

Corrección:
- Se documentaron los catorce valores exactos admitidos en el contrato de la herramienta.
- Se corrigieron las instrucciones de coordenadas para que coincidan con los rangos del sanitizador.
- Se añadió una regresión que comprueba que el contrato enumera los tipos visuales avanzados.

### B. Fallback de voz — corregido

La ruta de voz en tiempo real tenía un contrato visual progresivo, pero el fallback por turnos de `/api/lesson-tutor` pedía únicamente `board` versión 1 con bloques textuales. Por eso, cuando Live se interrumpía y la misma pregunta continuaba por turnos, el fallback podía responder oralmente sin producir las escenas visuales avanzadas.

Corrección:
- El prompt de fallback ahora solicita `board` versión 2, con hasta ocho bloques y cuatro visuales tipados.
- Se documentaron los mismos catorce tipos admitidos por el sanitizador.
- Se añadieron instrucciones para respetar límites, secuencias y consistencia conceptual.
- Se añadió una prueba estática que evita regresar accidentalmente al contrato solo textual.

Estos cambios mejoran el contrato de generación; todavía deben validarse con una sesión real de Chrome y micrófono.

## 3. Brechas que siguen abiertas

### A. Cobertura curricular desigual

El prompt de servidor contiene una guía temática explícita y extensa para Ciencias Naturales. Las otras cuatro áreas tienen identidad, alcance y competencias generales, pero no una matriz curricular equivalente integrada de forma verificable en el prompt/recuperación.

Acción siguiente:
- Convertir el nuevo documento curricular en una fuente estructurada y versionada.
- Mapear área → competencia → componente → tema → subtema → prerrequisitos → prioridad (núcleo/refuerzo/ampliación).
- Inyectar solo el contexto pertinente al área/tema detectado, sin añadir todo el temario en cada solicitud ni inflar la latencia.
- Contrastar primero con la guía Icfes 2026-2 y sus marcos oficiales; no tratar los listados de preparación universitaria como el temario obligatorio del examen.

### B. Validación semántica de respuestas

La ruta devuelve `qualityStatus = "not_required"` y `reviewMs = 0`; la protección final es principalmente estructural, de idioma, alcance, formato y reglas deterministas específicas. Existe una corrección acotada para la confusión entre fase S y mitosis, pero no un verificador semántico general de hechos, fórmulas, procedimientos, cronologías o consistencia entre explicación y dibujo.

Acción siguiente:
- Añadir validadores deterministas pequeños y probados para errores de alto impacto observados.
- Validar coherencia entre board y explicación: mismas unidades, nombres, orden de etapas, valores, etiquetas y relaciones.
- Añadir ejemplos adversariales y casos correctos que no deben ser modificados.
- No introducir una segunda llamada costosa por defecto ni un modelo de pago como juez; cualquier revisión adicional debe respetar cuotas gratuitas y degradar con aviso claro.

### C. Integración del currículo con el conocimiento publicado

La ruta ya recupera fragmentos, conceptos, relaciones, perfiles pedagógicos y señales de aprendizaje. El plan curricular recién creado todavía no está conectado a esta recuperación ni se ha comprobado cómo cubre las cinco áreas con el corpus que actualmente exista.

Acción siguiente:
- Auditar el esquema y las funciones existentes antes de crear migraciones.
- Reconciliar catálogo curricular con documentos publicados realmente disponibles, sin reconstruir material que el propietario eliminó intencionalmente.
- Medir cobertura por competencia/tema y distinguir “tema en temario” de “evidencia de conocimiento publicada y recuperable”.

### D. Pruebas reales

La auditoría fue estática. No se ejecutó el conjunto de pruebas, TypeScript, ESLint, build ni una sesión real de voz/tablero. La consulta de ejecuciones de workflow no devolvió ejecuciones para los commits consultados; no se declara CI aprobada.

Pruebas necesarias:
- Chrome: explicación hablada con varias actualizaciones de tablero acumulativas.
- Interrumpir a Orby y volver a preguntar; comprobar que no se atribuyan dibujos/audio antiguos al turno nuevo.
- Fallback por turnos tras desconexión Live; comprobar que la pizarra versión 2 aparezca y se guarde.
- Cuota gratuita agotada: conservar el texto/pregunta y no activar proveedores de pago.
- Persistencia y reintentos de voz con la migración correspondiente aplicada en un entorno de prueba.
- Pruebas por área con explicaciones y ejercicios originales, incluidas respuestas incorrectas y distractores.

## 4. Orden recomendado de la siguiente fase

1. Ejecutar CI y revisar el estado real de la rama frente a `main`; la comparación disponible reporta ramas divergentes. No hacer rebase ni integración automática sin revisar los commits que faltan en la rama de trabajo.
2. Inspeccionar el resto de los prompts Live y el contrato de salida para asegurar que las cinco áreas reciben la misma exigencia pedagógica.
3. Conectar la matriz curricular selectiva a la recuperación existente.
4. Implementar validación de coherencia semántica y visual en casos concretos.
5. Ejecutar pruebas de regresión, TypeScript, ESLint y build.
6. Probar voz y tablero en Chrome real y registrar latencia hasta primera palabra, primer audio, primera actualización visual y persistencia.

## 5. Estado de seguridad y despliegue

- No se modificó `main`.
- No se desplegó.
- No se ejecutó ninguna migración remota de Supabase.
- La migración de idempotencia de voz documentada previamente continúa pendiente de aplicación/verificación en la base activa; no se debe asumir que el código de persistencia ya está operativo en producción.
- No hacer Pull todavía. Esperar CI completa y pruebas reales, y confirmar el estado de la migración antes de despliegue.



## 6. Referencia obligatoria: tutor que habla y dibuja en directo

- Especificación permanente: [docs/ORBY-LIVE-TUTOR-SPEC.md](ORBY-LIVE-TUTOR-SPEC.md).
- El video compartido el 2026-11-07 define el estándar: voz y escritura/dibujo ocurren en paralelo; el esquema se construye progresivamente con trazos, etiquetas y relaciones, como un tutor que desarrolla la explicación en una pizarra.
- Hallazgo confirmado al inspeccionar LessonAITutor.tsx y OrbyBoard.tsx: Live acepta snapshots acumulativos y los actualiza en el mensaje activo, pero el renderer actual entrega SVG estático. No se encontró un motor de trazos progresivos ni una secuencia de acciones visuales vinculada a segmentos reales de voz.
- Esto significa que la experiencia solicitada **todavía no está completa**. No confundir “varias actualizaciones de tablero durante el audio” con “dibujar cada paso sincronizado con lo que el tutor está diciendo”.
- Próxima prioridad técnica: diseñar acciones visuales tipadas e incrementales con id/orden/generación, acumulación y cancelación segura al interrumpir; luego enlazar acciones con eventos o segmentos de narración que el proveedor realmente exponga. No inventar timestamps si no existe alineación de voz.
- La especificación exige accesibilidad con movimiento reducido, tablero final estático legible, consistencia académica y pruebas en Live/fallback, sin servicios ni llamadas de IA de pago.
- No se ejecutaron pruebas de navegador ni compilación en esta revisión; estado pendiente de validación.

### Detalle de sincronización de audio (inspección adicional)

- `playGeminiAudio()` decodifica chunks PCM16 y los agenda con Web Audio usando `voiceNextPlaybackTimeRef`; por tanto, el cliente conoce el orden y el tiempo programado de reproducción de cada chunk.
- El flujo inspeccionado no conserva una alineación verificable entre cada chunk PCM y una frase/palabra/segmento del transcript. La herramienta de pizarra entrega snapshots completos, no acciones con marca de narración.
- Consecuencia: hoy podemos medir el inicio de audio y la llegada de snapshots, pero no afirmar que una flecha o etiqueta aparece exactamente cuando Orby pronuncia su nombre.
- Próximo diseño: definir eventos incrementales con `turnGeneration`, `sequence`, `actionId`, estado acumulado y referencia de narración solo si Live ofrece metadatos fiables. Si no hay alineación fiable, usar una secuencia pedagógica sincronizada por eventos de contenido (no timestamps inventados) y etiquetar esa sincronización como aproximada.


## 7. Primera mejora visual incremental — 2026-11-07

- `OrbyBoard.tsx`: se añadieron clases de animación de trazo a conexiones de diagramas, ejes y curvas de gráficas, vectores, enlaces moleculares, conexiones de circuitos y pares/cadenas de ADN. Los nodos de diagramas aparecen suavemente.
- `app/globals.css`: se añadieron keyframes de dibujo SVG y aparición, con alternativa inmediata para `prefers-reduced-motion: reduce`.
- `tests/orby-request-filter.test.mjs`: se añadió una regresión estática para verificar que el renderer usa los trazos y que existe el modo de movimiento reducido.
- Alcance real: los elementos SVG recién montados pueden trazarse al llegar una actualización de tablero; los elementos ya montados no deben reiniciarse por el mero cambio de props. Esto mejora la percepción de snapshots incrementales.
- Límite importante: esto **no** implementa aún escritura manuscrita de texto, secuenciador de acciones por paso, ni alineación exacta con palabras/segmentos de voz. No equivale todavía al objetivo completo del video.
- Validación: cambios verificados mediante relectura de archivos en GitHub; no se pudo ejecutar Node tests, TypeScript, ESLint, build ni navegador desde esta conexión. No declarar CI aprobada.
- Comparación actual con `main`: ramas divergentes; `feat/founder-intro` aparece 8 commits detrás y 2985 delante según compare. No hacer merge/rebase automático ni Pull sin auditar esa divergencia.


## 10. Segunda capa visual — bloques pedagógicos incrementales

- Los bloques de texto (títulos, fórmulas, pasos, llamadas y párrafos) y las secciones visuales ahora usan una revelación suave al montarse. Las etapas de procesos y eventos de líneas de tiempo incorporan retrasos escalonados acotados.
- Se reemplazaron claves de índice simples en bloques/visuales por claves con tipo y contenido más índice. En snapshots acumulativos que agregan contenido al final, los elementos anteriores conservan identidad React y no deberían volver a animarse solo por el append.
- La prueba estática nueva comprueba claves, clases de revelación y retrasos.
- Esto es una aparición progresiva de bloques completos, no un efecto de escritura carácter por carácter. Tampoco establece sincronía temporal exacta con audio; esa capa requiere eventos incrementales y alineación real del proveedor.
- Validación actual: archivos releídos en GitHub; no hay workflow asociado al commit de test. Node tests, TypeScript, ESLint, build y pruebas de navegador siguen sin ejecutarse.


## 11. Voz en escenario con tablero y subtítulos — 2026-11-07

- En el modo de llamada del workspace se muestra ahora el tablero del mensaje de voz activo debajo del escenario de voz, usando el mismo componente `OrbyBoard` y el mismo objeto que se guarda en el mensaje de conversación.
- Se añadió una zona de subtítulos en vivo que lee el texto incremental de `outputTranscription` ya validado por los filtros existentes. El control de subtítulos permite ocultar/mostrar esta zona.
- El tablero se actualiza cuando la herramienta Live `render_orby_teaching_board` actualiza el mensaje activo; no se añadió una segunda llamada de IA ni un proveedor adicional.
- Importante: el subtítulo representa la transcripción textual que el proveedor entrega, no una alineación palabra-a-palabra con el audio. El tablero aparece cuando llega la herramienta; no se puede garantizar todavía que cada trazo coincida temporalmente con una palabra pronunciada.
- El modo fallback por turnos sigue siendo degradado: transcribe la pregunta y responde en texto según el aviso existente; esta mejora no inventa voz ni consume un proveedor de voz adicional.
- Validación: archivos releídos en GitHub y prueba estática añadida; no se ejecutaron navegador, micrófono, TypeScript, ESLint ni build. CI no reportó workflow para el commit consultado.


## 12. Especificación funcional voz + tablero + subtítulos
- Creado docs/ORBY-VOICE-WHITEBOARD-SPEC.md como contrato de producto y QA: escenario de llamada, chat durante llamada, subtítulos incrementales, snapshots acumulativos, interrupciones, filtros, accesibilidad, fallback y cuota gratuita.
- Distingue explícitamente lo implementado, lo parcial y lo pendiente; incluye checklist para no declarar listo antes de probar micrófono, responsive y snapshots reales.


## 13. Continuidad visible de la voz en el chat — 2026-11-07
- La burbuja del mensaje de Orby correspondiente al turno de voz activo ahora marca `EN VIVO` mientras el turno no ha terminado.
- El contenedor del texto incremental expone `aria-live="polite"` y `aria-atomic="false"` solo para el mensaje de voz activo, para que lectores de pantalla puedan anunciar las actualizaciones sin tratar todos los mensajes históricos como contenido en vivo.
- La pizarra permanece debajo del texto en el mismo mensaje; el escenario de llamada y la vista de chat apuntan al mismo id de asistente.
- Se añadió una prueba estática de regresión. Relectura de archivos en GitHub confirmada; no hay workflow asociado al commit de prueba. No se ejecutaron tests, TS, ESLint, build ni Chrome/micrófono.


## 14. Estado de preparación de pizarra en llamada — 2026-11-07
- Mientras hay una pregunta activa y aún no ha llegado un tablero validado, el escenario reserva una superficie clara «Pizarra de Orby · Preparando el apoyo visual…».
- Cuando llega el tablero validado del mismo mensaje de asistente, el estado provisional se sustituye por OrbyBoard. Si el turno no necesita un visual y no llega tablero, el estado provisional desaparece al dejar de estar pendiente el turno.
- No se inventa un tablero vacío ni se duplica una petición de IA. Se usa el indicador de turno pendiente ya existente.
- Prueba estática añadida. Archivos releídos en GitHub; no se ejecutaron pruebas Node, TS, ESLint, build ni Chrome/micrófono.


## 15. Latencia conversacional de voz — 2026-11-07
- Se redujo el silencio de cierre automático de turno de 500 ms a 400 ms tanto en la configuración Live del cliente como en la configuración de restricciones del token efímero del servidor. Ambos lados deben coincidir.
- Se añadió una instrucción de respuesta ágil: empezar por una respuesta directa, evitar relleno, continuar con los pasos esenciales cuando la pregunta lo requiera, mantener contexto en seguimientos y no narrar razonamiento interno.
- La rapidez no autoriza saltarse filtros, precisión, cuota gratuita ni alcance Saber 11.
- No se fija una promesa de respuesta total en 1 segundo: la red, el modelo, la generación de audio y la complejidad hacen imposible garantizarlo en todos los casos. Objetivo de ingeniería: primera señal útil/subtítulo/audio lo antes posible y medir p50/p95 por etapa.
- El valor de 400 ms es un ajuste conservador sujeto a QA de interrupciones y falsos cierres; si corta frases o turnos naturales, debe revertirse o ajustarse tras medición.
- Prueba estática añadida para asegurar que ambos lados coincidan y que la instrucción no omita seguridad. Archivos releídos en GitHub; no se ejecutaron Node tests, TypeScript, ESLint, build ni pruebas de micrófono. No hay workflow CI asociado al commit de test.


## 16. Medición del primer audio recibido — 2026-11-07
- Se añadió una marca monotónica por turno para registrar cuándo llega el primer chunk de audio Live, separada de cuándo se programa el primer audio audible.
- La marca se reinicia al aceptar un turno por voz o texto dentro de la llamada. Esto permite distinguir latencia de generación/transporte de la programación de reproducción.
- Se añadió prueba estática de presencia de ambas métricas. Los logs registran tiempos y no contenido de voz.
- Aún no hay mediciones reales de p50/p95 ni pruebas runtime; no afirmar que se alcanzó el objetivo de 1 s. Workflow CI no reportado para el commit.


## 17. Escucha manos libres y ciclo conversacional — 2026-11-07
- La ruta de reproducción Live conserva el bloqueo de escucha mientras queden fuentes de audio activas; solo rearma el micrófono después de que termine el último fragmento. Esto evita que el micrófono reabra durante la voz de Orby.
- Se instrumenta el tiempo total desde aceptación de la pregunta hasta quedar listo para el siguiente turno (`fullConversationCycleMs`), separado de primer texto/primer audio.
- El objetivo es conversación manos libres continua sin pulsar de nuevo el micrófono entre turnos. No se modifica la detección de silencio de 400 ms en esta tanda.
- Prueba estática añadida para el orden de espera de audio y rearme de escucha. No ejecutada en Node ni probada con micrófono real; no hay afirmación de QA runtime.


## 18. Auditoría profunda adicional y primera entrega Studio — 2026-11-07

**Rama de trabajo:** `feat/orby-studio-classroom` (derivada de `feat/founder-intro`; cuatro commits por delante y cero por detrás en el momento de la revisión). No modifica `main`.

### Hallazgos confirmados en el video actual y en el código

1. El escenario de llamada daba prioridad visual a la esfera central; la pizarra solo aparecía si ya existía `activeVoiceAssistantMessage.board`. Mientras tanto se mostraba un estado provisional pequeño. Esto no ofrece una superficie de clase persistente ni un layout de enseñanza.
2. La llegada de una pizarra dependía principalmente de que Gemini Live llamara a `render_orby_teaching_board`. Si el modelo no invocaba la herramienta, el escenario permanecía sin tablero. No existía un generador visual independiente para recuperar ese caso.
3. El fallback de voz por turnos podía entregar una respuesta escrita/hablada sin garantizar un tablero visual paralelo.
4. El renderer tenía SVG y animaciones de trazos para algunos tipos, pero no una secuencia de acciones sincronizadas palabra a palabra con el audio. No se debe afirmar sincronía exacta si Live no proporciona alineación verificable.
5. La generación de voz y la generación del tablero comparten límites de proveedor/cuota; la nueva ruta visual usa exclusivamente el Cloudflare Workers AI ya configurado y aplica su propio rate limit. Si la cuota gratuita falla, no activa proveedor alternativo facturable.
6. El identificador de Cloudflare solo desbloquea el endpoint de Workers AI si también existe un API token válido y autorizado. No corrige por sí mismo la sesión Gemini Live, que usa `GEMINI_API_KEY` y un token efímero.

### Cambios realizados en esta rama

- `components/aprender/OrbyBoard.tsx`: rediseño del tablero como lienzo de aula, fondo claro de papel, área de escritura amplia, jerarquía didáctica, cabecera de clase y pie PeakScore.
- `components/aprender/LessonAITutor.tsx`: rediseño del escenario de voz como aula de dos columnas: pizarra dominante y panel lateral con Orby, subtítulos y controles. La pizarra tiene una superficie estable incluso antes de recibir el primer tablero; la esfera deja de ocupar el centro de la clase.
- `app/api/orby/voice-board/route.ts`: endpoint autenticado para generar un tablero independiente usando el modelo de Cloudflare Workers AI ya existente. Valida alcance Saber 11, entrada, límite por usuario y salida con `sanitizeOrbyBoard`; no guarda turnos ni duplica el chat.
- `LessonAITutor.tsx`: petición visual paralela al aceptar una pregunta académica en voz. La respuesta Live sigue siendo prioritaria: si llega una pizarra Live, cancela la petición alternativa; si el respaldo llega primero, se muestra y una pizarra Live posterior puede sustituirla. La petición se cancela al cambiar de generación/interrumpir.
- `tests/orby-request-filter.test.mjs`: regresión estática para el escenario de aula, endpoint visual, cancelación y límites.

### Validación y límites

- Se verificó por GitHub que la rama nueva contiene los tres archivos principales y el test actualizado.
- Comparación con `feat/founder-intro`: 4 commits ahead, 0 behind.
- El estado Vercel consultado para el commit anterior de la rama base muestra fallo por `build-rate-limit`/límite de builds del plan; no es evidencia de un error TypeScript de esta rama.
- No se pudo ejecutar Node tests, TypeScript, ESLint, build ni una sesión Chrome/micrófono desde la conexión actual. Por tanto, esta entrega es una implementación estática comprometida, todavía no una validación runtime aprobada.
- Falta QA manual de: voz real + pizarra simultánea, carrera entre Live y fallback, interrupción durante generación visual, fallback con cuota agotada, móvil, persistencia de la pizarra Live y tiempos p50/p95.
- No crear PR hacia `main`, no desplegar y no aplicar migraciones remotas hasta que las pruebas locales/CI estén verdes.


## 19. Corrección de la experiencia visual según las nuevas referencias — 2026-11-07

Se revisaron las dos nuevas referencias de video junto con la grabación actual. La referencia buscada no es un chat con una tarjeta de subtítulos ni una pizarra de bloques limpios: es una clase visual sobre una hoja digital, con apuntes manuscritos, diagramas, flechas, círculos, etiquetas y un puntero que dibuja; los subtítulos van superpuestos en la franja inferior, como captions de video, y no dentro de una tarjeta lateral.

### Causa técnica encontrada

La primera ruta de respaldo visual reutilizaba `generateWithCloudflareTutor`. Esa función tiene un contrato de sistema que exige JSON con `reply`, `checkQuestion` y `learningSignal`, mientras que la ruta visual pedía además `board`. Por tanto, el modelo podía obedecer el contrato del tutor de texto y omitir `board`; el sanitizador rechazaba el resultado y el alumno se quedaba sin una pizarra útil. Se separó el contrato de generación visual para que la respuesta de la ruta sea exclusivamente `{ board: ... }`.

### Cambios adicionales

- Nuevo `generateWithCloudflareBoard`, usando el mismo modelo de Cloudflare Workers AI y la misma política de cuota gratuita; no añade proveedores ni servicios facturables.
- La ruta visual exige ahora al menos un visual validado. Si no lo obtiene, devuelve un error explícito en vez de aceptar silenciosamente una hoja solo textual.
- El prompt de dibujo exige apuntes tipo cuaderno y favorece sketch manuscrito con contornos, flechas, círculos y etiquetas; los diagramas se construyen progresivamente.
- La validación de programación del respaldo recibe el contexto académico completo para no confundir expresiones de Ciencias Naturales como «código genético» con una solicitud de programación.
- `OrbyBoard` se rediseñó como hoja de cuaderno con margen rojo, líneas azules, tinta azul oscura, anotaciones rojas y tipografía manuscrita; conserva el lápiz animado sobre los trazos SVG.
- Se reemplazó la tarjeta lateral de subtítulos por captions inferiores centrados, blancos, con sombra y degradado oscuro. Los captions se actualizan con la transcripción incremental segura de Live y con cada fragmento de voz alternativa; las salidas que no pasan los filtros no se muestran.
- La pizarra informa cuándo está dibujando o cuando el servicio gratuito no pudo producir un dibujo; no debe quedarse visualmente vacía sin explicación.
- Se reforzó la instrucción de la herramienta Live para pedir un visual en cada explicación académica sustantiva y snapshots acumulativos tempranos.

### Estado de validación

Los cambios están guardados en `feat/orby-studio-classroom`. No se ha confirmado una compilación ni una prueba de navegador: el estado de Vercel sigue reportando `build-rate-limit`. No se declara lista para producción hasta probar una sesión real, observar los snapshots Live y comprobar el fallback Cloudflare con cuota disponible y agotada.

- La voz alternativa actualiza cada caption cuando comienza realmente su fragmento de audio (Web Audio o reproducción HTML), no al iniciar la solicitud de síntesis; evita subtítulos adelantados si el proveedor gratuito rechaza la lectura.

## 20. Validación automatizada de la rama de aula — 2026-11-07

**Commit validado:** `6460537df77d208b0657a5a1105e5bbf30ded928`  
**Ejecución CI:** `42418855620` — resultado `success`.

Resultados observados en GitHub Actions:

- Suite Orby: **177 pruebas aprobadas, 0 fallidas**.
- TypeScript (`npx tsc --noEmit`): aprobado.
- ESLint (`npm run lint`): aprobado.
- Compilación de producción (`npx next build`): aprobada.
- `npm audit`: 0 vulnerabilidades (info, low, moderate, high y critical).
- La ejecución terminó con éxito; el aviso de caché de un HDRI de más de 2 MB no impidió la compilación.

### Lo que esta validación NO demuestra

- No se ha ejecutado una sesión real de Chrome con micrófono ni se ha comprobado visualmente la sincronización voz/trazos.
- No se han medido primera palabra audible, primer audio, primer trazo ni latencias p50/p95.
- No se ha verificado en la base activa que las migraciones de persistencia/idempotencia estén aplicadas.
- No se ha desplegado ni se ha probado la cuota real de Cloudflare en la cuenta de producción.
- La auditoría de dependencias solo refleja el árbol de dependencias del commit y la fecha de ejecución.

### Política de coste: comprobación pendiente de cuenta

Cloudflare Workers AI documenta una asignación de 10.000 Neurons diarios. En Workers Free, al agotarla, las operaciones se detienen; en Workers Paid, el consumo superior a esa asignación se factura. Por tanto, la garantía de coste cero depende también de que la cuenta de Cloudflare permanezca en Workers Free y no tenga un mecanismo de facturación/prepago que permita continuar consumiendo. El código no puede inferir ni cambiar el plan de la cuenta. Antes de habilitar uso real, confirmar el plan y vigilar el consumo en el panel de Cloudflare.

Referencia oficial consultada: https://developers.cloudflare.com/workers-ai/platform/pricing/

### Decisión de entrega

CI está verde, pero **no autoriza por sí sola un Pull/merge ni un despliegue**. Mantener intactas `main` y la base de datos activa hasta completar QA manual de voz/pizarra, confirmar la política de coste de Cloudflare y verificar las migraciones pendientes.
