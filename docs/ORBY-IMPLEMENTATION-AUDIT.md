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

## 18. Corrección de rama y aislamiento de base de datos — 2026-11-07

- Rama de trabajo/pruebas correcta: `feat/founder-intro`. No se debe continuar implementando Orby en `feat/orby-studio-classroom`; esa rama se usó por error en la tanda anterior.
- Se verificó la configuración de Vercel sin exponer credenciales: `NEXT_PUBLIC_SUPABASE_URL` apunta a `https://avmywztnsrnyjhvbaiio.supabase.co` para los entornos `production`, `preview` y `development`. El proyecto Supabase activo no tiene ramas de desarrollo.
- Consecuencia de seguridad: aplicar ahora las migraciones de pizarra en ese proyecto alteraría el esquema compartido con producción, no solo el preview `feat/founder-intro`. Aunque la migración es aditiva, no se debe presentar como una operación aislada de pruebas.
- Las tres migraciones de pizarra están presentes en la rama equivocada, no se han aplicado a Supabase y no se deben ejecutar allí. Antes hay que portar/revisar los cambios necesarios directamente en `feat/founder-intro` y disponer de una base de pruebas aislada (proyecto Supabase de staging o branch DB, previa verificación de coste) para aplicar y validar el esquema. Si se decide usar la base compartida, solicitar confirmación explícita indicando que también modifica el esquema de producción.
- Estado de código comprobado en `feat/founder-intro`: existe `OrbyBoard.tsx` y `lib/ai/orby-board.ts`; existe `/api/orby/realtime-turn`; todavía no existe `/api/orby/voice-board`. No asumir que el código de la otra rama está integrado.
- No se han modificado datos, políticas RLS, migraciones ni configuración de producción durante esta verificación.


## Actualización de auditoría — 2026-11-07 (registro de errores y estado de rama)

- Se amplió el registro diario `docs/ORBY-LIVE-CLASS-UPDATE-2026-11-07.md` con la clasificación individual de los siete hallazgos reportados, diferenciando bugs reales, aserciones obsoletas y puntos abiertos.
- Queda expresamente abierto el caso de sanitización de anotaciones que contienen propiedades `undefined`; no se declara resuelto por falta de evidencia de una corrección y de pruebas específicas.
- Se registraron como correcciones de código pendientes de validación runtime: import de `getOrbySketchStrokeTiming`, aceptación de snapshots visuales sin bloques textuales y autorización de `sessionResumption` en el token efímero.
- Estado de rama consultado contra GitHub: `feat/founder-intro` está divergente respecto de `main`, con 3.320 commits ahead y 9 behind según la comparación actual. El tamaño del historial y la divergencia hacen inseguro cualquier merge/rebase automático; no integrar ni reescribir historial como parte de esta auditoría.
- No se ha podido certificar una nueva ejecución completa de tests Orby, TypeScript, ESLint y build tras todas las correcciones. El estado `build-rate-limit` de Vercel no es evidencia de fallo de código ni de aprobación.
- No se ejecutó QA real de Chrome/micrófono, ni se aplicaron migraciones remotas, ni se desplegó. La configuración Supabase compartida con producción permanece protegida.
- Próximo orden: (1) reproducir y corregir el sanitizador de anotaciones `undefined`; (2) inspeccionar los guards de sesión/generación y exclusividad del tablero; (3) ejecutar tests, TS, lint y build sobre SHA exacto; (4) prueba real de interrupción, reconexión y dibujo durante voz; (5) revisar la divergencia con `main` por grupos de commits, sin integración automática.

## Auditoría de referencia visual del tutor con pizarra — 2026-11-07

- Se inspeccionó el video de referencia de 42,746 segundos. El requisito visual es una pizarra blanca continua, escritura a mano y construcción incremental de los diagramas con tinta negra, azul y roja.
- La implementación anterior mezclaba demora por índice del trazo con tiempo SVG, y podía lanzar varios marcadores de lápiz a la vez. También fijaba opacidad desde CSS mientras SMIL manejaba el recorrido.
- Se sustituyó el esquema de temporización del nuevo renderizador por una cola serial basada en duración geométrica. Cada trazo nuevo se agenda después del trazo pendiente anterior; los IDs ya vistos no vuelven a animarse al recibir snapshots acumulativos.
- Tinta, punta y etiqueta se programan en el reloj SVG común. La pausa/reanudación de la pizarra afecta ese mismo reloj, evitando correcciones paralelas por tiempo de pared.
- Se añadieron tonos azul/rojo a tipos, sanitizadores, acciones de corrección y contratos de herramientas Live. Los prompts del tutor por voz y por turnos se alinearon con la misma paleta y secuencia pedagógica.
- Los bloques visuales dejaron de usar tarjetas de fórmula/paso y se acercaron a escritura manuscrita sobre hoja blanca.

### Riesgos pendientes / límites de certificación

1. La cola se ha revisado estáticamente, pero aún necesita una prueba real de navegador con snapshots muy próximos, cambios/correcciones de IDs, interrupción de audio en mitad del trazo y reanudación. 
2. SVG SMIL y movimiento reducido requieren QA en Chrome; no declarar accesibilidad ni pausa/reanudación certificadas solo por la inspección del JSX.
3. La sincronización con el discurso sigue siendo aproximada por la cadencia de llamadas de herramienta, no una sincronización fonética o por timestamp del audio.
4. No se dispone de una ejecución verde de la suite completa, TypeScript, ESLint ni build para el SHA final de esta ronda.
5. El check de Vercel consultado para los commits de esta ronda devolvió `build-rate-limit`; no debe interpretarse como error de compilación. No hay evidencia de CI aprobada.
6. No se hicieron cambios en `main`, despliegues ni migraciones Supabase remotas.

### Próximo orden de validación

- Ejecutar `npm run test:orby` y corregir las regresiones reales sin borrar validaciones útiles.
- Ejecutar `npx tsc --noEmit`, `npm run lint` y `npm run build` sobre el SHA final.
- Probar en Chrome: 1 trazo, 10+ trazos, nuevos snapshots durante una animación, corrección/borrado del profesor, interrupción, reanudación, subtítulos y exportación.
- Comparar visualmente con el video de referencia antes de considerar terminada la mutación.


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


### Estado de la última iteración

- Los checks que fallaron en el primer intento se identificaron en logs de Vercel y se actualizaron: aserción sensible a mayúsculas/minúsculas, expectativas CSS retiradas al migrar el trazo a SMIL, y expectativas de pausa CSS sustituidas por pausa del reloj SVG.
- Se amplió además el esquema de la acción de corrección del profesor para conservar tonos negro/azul/rojo.
- La inspección del estado del commit más reciente sigue devolviendo `build-rate-limit`; no hay un nuevo resultado de compilación, TypeScript, ESLint ni suite completa. No declarar la rama lista para producción.


## Auditoría — guards y consistencia de contrato del tablero (7 nov 2026)

Se cerraron en código las brechas de la siguiente ronda:
- Undefined/null en annotation y acciones teacher-only.
- Límite acumulativo 40 trazos alineado a ocho actualizaciones de hasta cinco trazos, con tope completo de 18 KB.
- Una sola visual sketch por tablero, tanto al sanitizar como al ejecutar acciones.
- Pausa de cada SVG descendiente y CSS de todos los elementos animados de la hoja.
- Hook `useId` incondicional y claves estables para no reiniciar etapas al cambiar texto/título.
- Cola serial con lead-in 60 ms y pen-lift 110 ms.

**Verificación estructural del repositorio:** 215 declaraciones de test detectadas en `tests/orby-request-filter.test.mjs`, sin casos vacíos ni nombres duplicados. La inspección cruzada confirma que sanitizer, acción, herramienta Live y tutor por turnos coinciden en el límite de 40 trazos, capa única y presupuesto de bytes.

**Estado real:** Vercel aún presenta `build-rate-limit`; no hay nuevo workflow de GitHub Actions. Tests, TypeScript, ESLint, build y QA visual de Chrome continúan sin certificación después de esta mutación. No aprobar la rama ni declarar cero errores hasta ejecutar todos esos pasos en el SHA resultante.

## Reconciliación con la referencia de video — actualización posterior

- Se confirmó el inventario existente y las brechas de composición: el renderer sigue pintando `blocks[]` antes de `visuals[]`; los textos no comparten coordenadas con los SVG. La UI es una columna, no el lienzo espacial del video.
- El video muestra papel blanco con puntos tenues, título arriba, notas a la izquierda, dibujo celular central y callouts a la derecha. La especificación anterior de hoja lisa sin cuadrícula se rectifica a favor de la referencia visual.
- El schema SDK oficial sí expone restricciones como `minItems/maxItems`, `minLength/maxLength`, `pattern` y `enum`; los cuatro límites de tamaño se tipan como string, y `enum` requiere `format: "enum"`. La herramienta Live actual no aprovecha formalmente esas restricciones de forma consistente. La aceptación efectiva del schema por el endpoint Live requiere una prueba aislada con la versión fijada `@google/genai@2.17.1`.
- Se rectifica la hipótesis de pérdida de snapshots pendientes: al ser snapshots completos y acumulativos, usar el último como estado autoritativo puede ser correcto. Falta una prueba de integración con múltiples snapshots durante prevalidación; no cambiar a una cola ciega sin evidencia.
- No se cambió código en esta reconciliación. La especificación permanente `ORBY-LIVE-TUTOR-SPEC.md` y la bitácora diaria contienen el criterio de continuación.

## Auditoría de implementación — primera capa de composición espacial

Se implementó una representación espacial aditiva para OrbyBoard v2:
- `OrbyBoardLayout` define un canvas 16:9 y etapas con ID estable, secuencia estrictamente creciente (puede tener huecos tras erase), referencia tipada a `blocks[]`/`visuals[]` y rectángulo normalizado.
- `sanitizeOrbyBoardLayout` exige cobertura exacta de cada bloque/visual, IDs únicos, índices válidos, secuencia 1..N, dimensiones positivas mínimas y límites dentro del canvas.
- v1 sigue texto-only; v2 sin layout conserva el renderer heredado.
- `OrbyBoard.tsx` representa etapas como elementos posicionados sobre una sola superficie, usando keys estables. La vista legacy no se elimina.
- CSS agrega papel blanco punteado, canvas 16:9, tipografía manuscrita, contención del texto, salida responsive por scroll y soporte de impresión horizontal.
- El schema Live ahora expone layout, enum de tipo/relación, ID ASCII de 1–24 caracteres, límites de secuencia/índice y rangos de geometría. Los prompts Live y turn-based piden la misma composición espacial acumulativa.
- Las RPC actuales guardan el tablero v2 como JSONB y permiten 24 KB; el cliente limita a 18 KB. No hace falta migración por este campo.

**Pruebas añadidas:** escenas válidas, cobertura exacta, IDs/índices repetidos, secuencia repetida/invertida, huecos válidos tras erase, dimensiones fuera del canvas, compatibilidad legacy y snapshots acumulativos. En ese checkpoint el archivo contenía 220 declaraciones de test, sin nombres duplicados ni bloques vacíos en inspección estática.

**Pendiente P0:** convertir los snapshots en una secuencia de acciones docentes idempotentes (texto/trazo/flecha/etiqueta/focus/erase/replace) con una misma generación y cancelación. El layout actual ordena la composición, pero no ofrece aún sincronización exacta palabra-a-palabra con el audio ni mide la latencia real entre voz y acción.

**QA:** tests/TS/lint/build y micrófono/Chrome no ejecutados en esta sesión. Vercel mantiene `build-rate-limit`. No declarar la implementación certificada ni equivalente al video hasta reproducir una clase de inicio a fin.

## Auditoría adicional — señalamiento de etapas espaciales

- La operación teacher-only `focus` soporta ahora `strokeId` (comportamiento anterior) o `elementId` (nuevo canvas); exactamente uno.
- El sanitizador limita ambos IDs a identificadores válidos. `applyOrbyBoardAction` comprueba que `elementId` exista en `layout.elements`.
- El renderer añade `data-orby-teacher-focus="element"` y la clase `orby-board-layout-stage-focused`; CSS dibuja un halo transitorio externo sin tinta.
- La animación del halo se pausa con `data-orby-drawing-active="false"` y se vuelve estática bajo `prefers-reduced-motion`.
- El manejador Live publica la escena actualizada en el mensaje existente, sin persistencia adicional ni migración.

**No certificado:** el foco se verificó por inspección estática y regresiones declaradas; falta probarlo visualmente en Chrome durante voz, interrupción y reanudación. El suite count actual declarado es 221, no 221 pasadas.

## Rectificación — secuencia espacial y borrado de una etapa

- Se corrigió la hipótesis de que el sequence tuviera que ser contiguo. El contrato actual requiere orden estrictamente creciente y permite huecos (1, 3, 5…) cuando una etapa se elimina; el máximo de sequence es 1000 y la cantidad de elementos sigue acotada a 12.
- \`applyOrbyBoardAction(erase)\` quita el elemento de layout si se elimina la última tinta de sketch, ajusta el índice de visuales posteriores y no renumera IDs ni sequence supervivientes.
- El primer grupo de trazos de un sketch espacial respeta el retraso de aparición de su etapa. Los snapshots posteriores agregan trazos a la cola actual sin volver a aplicar el lead-in de la etapa.
- Nuevas regresiones cubren borrado del último trazo con otras visuales después, layout válido después de la acción, secuencia no monótona rechazada y valores crecientes con huecos aceptados.
- Suite declarada estáticamente: 222, sin nombres duplicados ni pruebas vacías; no ejecutada.

## Incidente de build y corrección — prueba espacial

- El deployment del SHA \`07b6e153c3e16f8616042f4baa2b759d74b8a255\` llegó a ejecutar \`npm run build\`, pero Node detuvo la carga de \`tests/orby-request-filter.test.mjs\` con \`SyntaxError: Invalid or unexpected token\` en la línea 4587.
- La causa fue un \`\\n\` literal insertado dentro de la declaración de un test, no un error de TypeScript ni del renderer.
- Se corrigió en \`aa90b02e56ecdf03c8f765642bf69f9b69298e76\`.
- Revisión estática posterior: 222 tests declarados, cero nombres duplicados y cero bloques de test vacíos.
- El check posterior reporta \`build-rate-limit\` y no hay un deployment posterior registrado para el SHA arreglado. Tests, TypeScript, ESLint y build continúan pendientes de ejecución verde.


## Actualización de auditoría — motor incremental de acciones docentes (2026-11-08)

### Estado de implementación
Se implementó una primera capa aditiva de acciones incrementales sobre el canvas espacial v2. Ya no dependemos exclusivamente de enviar snapshots completos para cada actualización: Orby puede añadir un bloque de escritura o un pequeño conjunto de trazos a la pizarra existente.

- Operaciones nuevas: `append-block` y `append-strokes`.
- Operaciones previas preservadas: `focus`, `erase`, `replace`.
- Envelope de seguridad: `turnGeneration` obligatorio en todas las operaciones docentes; `actionId`, `sequence` y `dependsOn` obligatorios para append.
- La secuencia verifica generación actual, idempotencia, orden creciente y dependencias aceptadas.
- Los bloques y trazos nuevos pasan por sanitización tipada; se validan geometría, límites, tipos y presupuesto del tablero.
- La herramienta Live devuelve `turnGeneration` al aceptar una instantánea. La directiva de sesión exige que el modelo lo reenvíe en acciones posteriores.
- Durante preflight se permite acumular acciones solamente en la pizarra provisional de la misma sesión/actividad y dentro de su ventana de vigencia; no se publica hasta validar la pregunta.
- Se limpian selecciones temporales al agregar contenido para evitar halos antiguos.

### Riesgo residual
La secuencia implementa orden e idempotencia de operaciones visuales; no proporciona alineación fonética/timestamps. La sincronización observada depende de la cadencia de eventos que entregue Gemini Live. No se garantiza que cada segmento oral tenga su acción visual correspondiente.

### Validación
- Revisión estática de contratos, integración de cliente, schema Live, directiva de sesión y pruebas.
- Suite declarada: 228 tests según conteo del archivo; no ejecutada en esta sesión.
- TypeScript, ESLint y build: pendientes. Último estado conocido de Vercel fue `build-rate-limit`.
- Chrome/micrófono, interrupción a mitad de trazo e historial: pendientes de QA manual.
- Sin cambios a `main`, producción, Supabase ni migraciones remotas. Sin proveedores/modelos de pago ni dependencias nuevas.

### Siguiente P0
Ejecutar validaciones locales del SHA final sin forzar una cuota facturable y realizar una clase real con micrófono: al menos tres append operations durante voz, interrupción, pregunta nueva, recuperación del tablero y comprobación de ausencia de acciones antiguas.


## Auditoría de fidelidad al video — 2026-11-08

### Cambios comprobados
- Se inspeccionó el video del propietario (42.7 segundos) y se tomó como referencia una hoja blanca lisa, manuscrita, con dibujo principal progresivo, flechas, etiquetas y anotaciones.
- Se quitó la textura punteada del canvas global y de la hoja de clase Live; el canvas en la llamada queda sin borde, radio ni sombra de tarjeta.
- Se añadió una regresión estática en `tests/orby-request-filter.test.mjs` para proteger la superficie lisa.
- Se mantuvo el renderer progresivo y las acciones incrementales ya existentes; no se creó otra pizarra.

### Cobertura ICFES
La guía 2026-2 y los marcos Icfes se reflejaron en una gramática visual para las cinco pruebas:
- Matemáticas: ecuaciones, gráficas, geometría, datos y justificación.
- Lectura Crítica: subrayado, argumentos, inferencias, conectores y análisis de textos/infografías.
- Sociales y Ciudadanas: mapas, cronologías, instituciones, actores, perspectivas y causalidad.
- Ciencias Naturales: mecanismos y estructuras biológicas/químicas/físicas, CTS y experimentos.
- Inglés: siete partes, vocabulario contextual, diálogo, intención comunicativa, gramática y lectura.

La base curricular preexistente permanece en `docs/ORBY-ICFES-CURRICULUM-PLAN.md`. No copiar preguntas protegidas ni reconstruir materiales del Lab eliminados.

### Recuperación Orby Lab
- La integración existente sí consulta el Lab mediante `search_orby_learning_knowledge` y `/api/orby/knowledge-search`, limitándose a material `published`, conceptos y documentos relacionados.
- La herramienta se ejecuta como NON_BLOCKING; el resultado no debe retrasar la primera frase ni la primera acción visual.
- Se corrigió una contradicción de instrucciones: el servidor ordenaba recuperar por tema académico nuevo, pero el schema decía que la búsqueda era opcional. Ahora el schema exige una búsqueda publicada por nuevo tema sustantivo, con máximo dos llamadas por turno; una segunda solo se admite si resuelve un prerrequisito o evidencia nueva.
- La web pública sigue reservada para referencias, actualidad o verificación externa. Si no hay Lab publicado o se agota la cuota gratuita, Orby continúa desde conocimiento académico fiable y no inventa fuentes.

### Brecha principal — subtítulos palabra activa
- La UI sigue mostrando una transcripción normal; el resaltado palabra por palabra aún no existe.
- Gemini Live streaming no entrega marcas de tiempo por palabra. Gemini 3.5 Transcribe no streaming puede entregar offsets por palabra, pero no ofrece ese alineamiento en su endpoint Live y las marcas pueden afectar la precisión.
- No fingir sincronización exacta mediante un temporizador arbitrario. Investigar un mecanismo de alineación compatible con la voz Live, cuota gratuita real, privacidad e interrupciones antes de implementarlo.
- Las palabras activas deben seguir el reloj de reproducción real, no el tiempo de llegada de la transcripción; invalidar toda palabra pendiente con barge-in/generación nueva.

### Latencia y voz natural
- Meta de producto: primera frase útil idealmente ~1 s después de cerrar el turno de voz; no está garantizada ni medida.
- Medir p50/p95 desde fin de voz hasta texto, primer audio recibido, audio programado y primera acción de pizarra; medir también parada por interrupción y rearme del micrófono.
- Mantener filtros y validación de salida; no eliminarlos para bajar latencia.

### Validación
- Conteo estático: 229 pruebas nombradas; cero nombres duplicados y cero bloques vacíos detectados. No ejecutadas aquí.
- TypeScript, ESLint, build y QA Chrome/micrófono siguen pendientes.
- El check Vercel del SHA de documentación `ffcda699528ff73729740a796f9395b1770d8acc` reporta `failure`; el conector no devuelve la causa detallada de esa ejecución. No se afirma que sea verde.
- No se tocaron `main`, producción ni Supabase. Sin migraciones, proveedores ni servicios de pago añadidos.


## Rendimiento y cuotas de Orby Live — 2026-11-08

### Causa identificada y corregida
La ruta de creación de sesión clasificaba todo HTTP 429/RESOURCE_EXHAUSTED de Google como cuota gratuita diaria agotada y bloqueaba Live durante 3600 s. La misma respuesta 429 también puede representar throttling temporal de RPM/TPM. El clasificador ahora diferencia:
- `quota_exhausted`: marcador explícito de cuota diaria/QUOTA_EXCEEDED.
- `rate_limited`: 429 o RESOURCE_EXHAUSTED ambiguo, y límites explícitos por minuto/tokens por minuto.
- `provider_error`: fallos restantes.

La ruta conserva el objeto de error completo para inspeccionar campos anidados. El error temporal devuelve `GEMINI_LIVE_RATE_LIMITED` y Retry-After limitado entre 2 y 30 s, no una cuarentena de una hora.

### Latencia y TTS
- Advertencia si Live no emite avances: 5 s.
- Recuperación de la misma pregunta por turno de texto si Live queda inactivo: 15 s. El temporizador se rearma con cada evento de texto/audio/herramienta.
- TTS rate-limited: un máximo de un reintento corto si Retry-After <= 2 s; no se encadenan reintentos de hasta 12 veces.
- Fragmento TTS: 880 caracteres en el cliente, 900 máximo en endpoint (antes 480/500); reduce casi a la mitad las peticiones en respuestas largas.
- Modelo TTS: `gemini-3.8-flash-lite-tts` gratuito, optimizado por Google para baja latencia y alto volumen. Live principal: `gemini-3.8-live`.

### Límites de cuota — no prometer uso ilimitado
- Google aplica RPM, TPM y RPD por proyecto, no por API key; el RPD se reinicia a medianoche Pacífico. Los límites dependen del modelo/tier, pueden cambiar y deben verificarse en AI Studio. Gemini 3.8 Live y Flash-Lite TTS están marcados como gratuitos en el Free Tier, pero no tienen una cifra universal de sesiones/hora publicada en la tabla de precios.
- Cloudflare Workers AI tiene 10.000 neuronas gratuitas/día por cuenta de Workers AI; modelos de tutor, embeddings y transcripción comparten esa cuota. Superar el límite detiene operaciones; PeakScore no activa plan de pago.
- Claude Free en claude.ai se mide por sesiones de usuario (reinicio cada cinco horas, demanda variable). Claude API/Console usa créditos prepagados; no es un respaldo de API gratuito permanente.

### Revisión estática y validación
- 230 tests nombrados, sin duplicados ni bloques vacíos detectados estáticamente.
- Node tests, TypeScript, ESLint, build y QA real del micrófono siguen sin ejecutarse/certificarse. El estado de Vercel del SHA final debe revisarse; no afirmar CI verde.
- Sin cambios a main, producción, Supabase remoto o migraciones. Sin proveedor pagado ni dependencia nueva.


### Fuentes oficiales consultadas para esta actualización
- Gemini API — límites por RPM/TPM/RPD, límites por proyecto y reinicio de RPD: https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API — precios Free Tier de Gemini 3.8 Live y Flash-Lite TTS: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API — modelos de audio y TTS: https://ai.google.dev/gemini-api/docs/speech-generation
- Cloudflare Workers AI — asignación de 10.000 neuronas gratis al día y reinicio UTC: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Anthropic — facturación de la API de Claude mediante créditos prepagados: https://support.claude.com/es/articles/8977456-como-pago-mi-uso-de-la-api-de-claude
- Anthropic — límites variables del plan gratuito de Claude.ai y reinicio de cinco horas: https://support.claude.com/es/articles/8114491-comienza-con-claude


## Auditoría incremental — prevención de solapamientos en append-block (2026-11-08)

- **Corregido:** `applyOrbyBoardAction(append-block)` comprueba el rectángulo nuevo frente a cada `layout.elements` existente usando intersección estricta de rectángulos. Un contacto de borde sin área compartida se permite; cualquier intersección de área se rechaza.
- La protección comprende bloques y visuales, por lo que un bloque nuevo no puede cubrir un sketch/diagram/graph existente ni texto previo.
- Las etiquetas propias del sketch siguen usando la geometría/labels internos del SVG; no requieren un `append-block` superpuesto.
- El manejador Live devuelve una razón específica para bloque superpuesto o límite de layout, en lugar del mensaje incorrecto de ID de tinta inexistente.
- Regresiones nuevas cubren rechazo de intersección, aceptación de borde adyacente y mensaje de error al modelo.
- **Alcance conservador:** no se endureció `sanitizeOrbyBoardLayout` para snapshots existentes, evitando invalidar de forma retroactiva composiciones guardadas. La protección está aplicada a nuevas acciones `append-block`.
- **No certificado:** tests/TS/lint/build y QA Chrome siguen pendientes; Vercel mantiene `build-rate-limit`.

## Cierre de validación integral — 2026-11-08

- Commit validado en `feat/founder-intro`: `69eebdcdacf94dd0403b1e7d01ab8e3f7d3135c9`.
- GitHub Actions run 42519075898: https://github.com/PeakScore777/PeakScore/actions/runs/42519075898
- Resultado verde en todos los pasos: instalación, auditoría de dependencias, 239 pruebas Orby, TypeScript, ESLint y Next.js production build.
- El run confirmó `239 tests / 239 pass / 0 fail`.
- La compilación reveló un cierre prematuro de template literal en el CSS JSX del workspace claro. Se movió el cierre hasta después de las últimas reglas de tema claro; el build posterior pasó.
- Esto certifica los checks automatizados del SHA, no el comportamiento de voz con micrófono físico, cuotas reales del proyecto, la sesión Live en Chrome ni QA visual manual.
- Se mantiene el trabajo exclusivamente en `feat/founder-intro`; `main` no se modificó.

## English Studio — roleplay por voz y aislamiento de idioma (2026-11-08)

- La vista English Studio ahora inicia/reutiliza la llamada Live de OmegaX desde el CTA de roleplay y envía el escenario como primer mensaje. Una sesión Live general se renueva antes de cambiar el idioma de la sesión.
- `englishPracticeMode` viaja en la creación de sesión y reanudación Live, pero el servidor lo acepta únicamente con `assistantName === "OmegaX"`. La excepción de inglés nunca se activa para Orby.
- Los roleplays hablan inglés natural y corrigen brevemente en español colombiano; las explicaciones de gramática pueden darse en español. El fallback gratuito por turnos también recibe el flag limitado.
- Se mantiene la validación de programación, cocina, temas dañinos, privacidad, promoción externa y prompt injection. El filtro de respuesta inglesa se omite únicamente durante una sesión English Studio autorizada.
- GitHub Actions run 42519666204: 240/240 tests, TypeScript, ESLint, dependency audit y `next build` aprobados. https://github.com/PeakScore777/PeakScore/actions/runs/42519666204
- Pendiente de validación fuera de CI: Chrome con micrófono real, inglés hablado con ASR real, cortes/interrupciones, salida audible del fallback y cuotas reales. No declarar fidelidad fonética ni pronunciación evaluada.

## Karaoke de subtítulos Live — ponderación de palabras (2026-11-08)

- Reemplazado el avance uniforme palabra-a-palabra por `getOrbyKaraokeWordIndexForText`, que estima peso temporal mediante grupos vocálicos, longitud y puntuación.
- El reloj sigue siendo `AudioContext.currentTime`; el loop usa `requestAnimationFrame`, conserva monotonía y no añade intervalos, TTS ni llamadas a Gemini.
- La ponderación es una aproximación visual, no timestamp fonético. Gemini Live no expone marcas por palabra.
- Regresión amplía la cobertura de palabra larga, punto final, palabra final, texto vacío, duración inválida y no retroceso del índice durante streaming.
- CI run 42520586985: 240/240 tests, TypeScript, ESLint, dependency audit y `next build` aprobados. https://github.com/PeakScore777/PeakScore/actions/runs/42520586985
- Requiere QA manual con reproducción de voz real en Chrome; observar si el resaltado se adelanta/atrasa en voz natural, pausas y respuestas largas.

## Auditoría del renderer — desincronización de strokes SVG y spatial stages (2026-11-08)

- **Causa raíz:** `animation-delay` definido en grupos SVG no se hereda por los paths/lines hijos. La transición de la etapa espacial podía ocultar un trazo que ya había completado sus 680 ms de dibujo.
- **Corregido:** se añadió `getOrbyBoardProgressiveDelay(index)` y se propagó `startDelayMs` desde el layout espacial a las visuales relevantes. Los elementos que ejecutan `orby-board-draw` reciben su propio `animationDelay` con la suma `startDelayMs + stagger`.
- Diagramas, gráficas, vectores, moléculas, circuitos, células, ADN, anotaciones y procesos fisiológicos ahora inician el contenido animado al llegar su etapa, no al montar toda la pizarra.
- Eliminadas animaciones duplicadas en elementos anidados de nodos/puntos donde el grupo ya animaba el conjunto.
- Se conserva el reloj SMIL del sketch y su pausa/reanudación al interrumpir la clase.
- Regresión cubre valores negativos/NaN/topes del escalonado, propagación del delay y aplicación al trazo SVG real.
- CI run 42521925925: 241/241 tests, TypeScript, ESLint, dependency audit y Next.js production build aprobados. https://github.com/PeakScore777/PeakScore/actions/runs/42521925925
- Pendiente QA auditivo/visual manual de Chrome: la CI no certifica percepción humana de sincronización con voz real ni el comportamiento de un dispositivo físico.

## Auditoría de continuidad — OmegaX CEFR y pedagogía visual ICFES (2026-11-08)

### Código actualizado en `feat/founder-intro`
- `components/aprender/OmegaXEnglishStudio.tsx`: el selector ofrece seis niveles A1–C2 con descriptores/coaching. Se conserva el flujo existente de speaking 60 s, repetición, grabación, transcripción, roleplay y feedback.
- `components/aprender/LessonAITutor.tsx`: feedback con evidencia de la transcripción, una fortaleza, máximo dos mejoras prioritarias, frase original/reformulación/razón, modelo breve y mini-reto de reintento. La transcripción no se usa como medida de fonemas, acento ni entonación.
- `app/api/orby/realtime-session/route.ts`: instrucciones por área ICFES, ruta English Studio CEFR A1–C2 y separación de la preparación de Inglés Saber 11.
- `app/api/lesson-tutor/route.ts`: mismas rutas y pedagogía visual para el fallback; conserva alcance, filtros y banco manual de Inglés ICFES.
- `tests/orby-request-filter.test.mjs`: tres regresiones nuevas para niveles CEFR, ciclo feedback/reintento y directivas de pizarra/separación de examen.
- Nueva especificación de continuidad: `docs/OMEGAX-ACADEMIC-COACH-SPEC.md`.

### Distinción de producto
CEFR A1–C2 es una ruta general de aprendizaje elegible. No se debe llamar a C1/C2 nivel oficial de Inglés Saber 11 ni asignar un nivel certificado a partir de una sola conversación. La ruta ICFES conserva sus propias bandas, competencias, siete partes y banco manual.

### Validación y límites
- Inventario estático: 252 tests nombrados, 0 duplicados; no equivale a ejecución.
- Se comprobaron referencias estáticas del selector, descriptores, prompts, perfiles de las cinco áreas, fallback y pruebas.
- No se ejecutaron para este HEAD el test runner, TypeScript, ESLint, producción build ni Chrome/Gemini Live con micrófono real.
- El status de Vercel consultado para el commit de integración devuelve `build-rate-limit`; no es un resultado de compilación de este HEAD. No se recibió workflow run de GitHub Actions asociado.
- Quedan pendientes actividades dedicadas de listening/reading/writing, evaluación CEFR por habilidades, persistencia de progreso lingüístico y QA de pizarra real para todos los niveles.
- Sin proveedor nuevo, coste nuevo, migración remota, despliegue ni cambio de `main`.


### Ajuste final de tareas CEFR por nivel
- `OmegaXEnglishStudio.tsx` ahora usa `TOPICS_BY_LEVEL` y `PHRASES_BY_LEVEL` para variar speaking prompts y frases de repetición según A1–C2. `speakModel` lee la frase dinámica seleccionada; el selector se bloquea mientras exista grabación, transcripción o blob pendiente.
- Se agregó la regresión de bancos específicos por nivel. Inventario estático al 2026-11-08: 253 tests nombrados, cero duplicados. Sigue pendiente ejecutar el runner y validación TypeScript/ESLint/build/browser.


### Refactor de perfiles y última comprobación del HEAD
- El fallback dejó de mantener una descripción visual paralela por área: ahora llama a `buildIcfesPedagogyInstruction(normalizeIcfesSubject(...))`, reutilizando los perfiles definidos en `lib/ai/orby-scope.ts`. OmegaX selecciona el perfil según materia/tema; Orby permanece limitado a Ciencias Naturales.
- Último commit consultado: `9c09a7e20a42264da6a89c8d17a590d1c61a2606` (`test(omegax): assert shared pedagogy profile in fallback`).
- Status de Vercel para ese SHA: `failure / build-rate-limit`; el enlace informa que el servicio bloqueó la compilación por límite de builds. No equivale a un error TypeScript/build del código.
- GitHub workflow runs asociados consultados: ninguno devuelto. No se afirma que la suite o build se hayan ejecutado.
- Conteo estático: 253 pruebas nombradas, 0 duplicados. Pendiente correr tests, TypeScript, ESLint, build y QA Chrome/Gemini Live/micrófono real.


## Auditoría de continuidad — English Studio con cinco destrezas (2026-11-08)

### Archivos modificados
- `components/aprender/OmegaXEnglishStudio.tsx`: amplía Mode a speaking, pronunciation, listening, reading, writing. Crea bancos por nivel A1–C2 para listening, reading y writing (dos actividades por nivel), controles de TTS/revelar transcripción, lectura de pasajes, editor de escritura, contador de palabras y botones de feedback/guardado.
- `components/aprender/LessonAITutor.tsx`: mapea los cinco modos a etiquetas y criterios de feedback independientes. Listening se evalúa contra el guion y las pistas; reading contra el pasaje y evidencia; writing contra la consigna, extensión, organización, cohesión, gramática, vocabulario y registro. Las respuestas escritas se guardan como notas; la voz se guarda como grabación. Las respuestas del estudiante se delimitan como datos no confiables.
- `tests/orby-request-filter.test.mjs`: se añadieron dos regresiones para bancos A1–C2 por destreza e integración de feedback/guardado.

### Límites y validación
- Listening actualmente reproduce un guion escrito con TTS nativo del navegador `SpeechSynthesisUtterance`; la UI lo declara y no afirma ser audio grabado de hablante nativo.
- Dos ejercicios por nivel/habilidad son una primera base, no el curso completo ni un test MCER certificado.
- Inventario estático del archivo de pruebas: 255 pruebas nombradas, sin duplicados; no es ejecución.
- No se han ejecutado aún test runner, TypeScript, ESLint, build, ni QA de Chrome/voz para este HEAD.
- No se agregaron servicios/modelos ni costes nuevos, ni migraciones remotas, despliegues o cambios a `main`.
