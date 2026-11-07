# Orby — evolución a tutor continuo con pizarra

Fecha de auditoría: 2026-11-07  
Rama objetivo: `feat/founder-intro`  
Estado: diagnóstico inicial; no desplegar ni integrar en `main`.

## Objetivo de producto

Orby debe sentirse como una tutora que acompaña una sesión de estudio: conversación de voz fluida, interrupciones naturales, contexto persistente y un tablero didáctico que se actualiza mientras explica. La interfaz no debe exigir al estudiante enviar una pregunta nueva para cada intervención.

La persistencia puede seguir guardando intercambios atómicos. Eso es una decisión de almacenamiento, no el modelo de interacción de la experiencia.

## Hallazgos confirmados en el código actual

1. La experiencia escrita vive en `components/aprender/LessonAITutor.tsx`; el contenido del asistente se representa como texto enriquecido. El tipo `Message` todavía no contiene un modelo de escena/pizarra.
2. La voz en tiempo real usa Gemini Live y un flujo de audio continuo en el navegador, con detección de actividad, interrupciones y reanudación. No equivale a una experiencia de chat estrictamente por turnos mientras Live está conectado.
3. Si Live falla o no está disponible, `activateTurnBasedVoiceFallback` desconecta el micrófono y cambia explícitamente a una ruta de voz por turnos. El propio código actual anuncia ese cambio en el estado de voz.
4. En producción, `app/api/orby/realtime-session/route.ts` bloquea Gemini Live si `ORBY_GEMINI_LIVE_ENABLED` no es `true`. El comentario de seguridad indica que la activación está retenida por la revisión de privacidad del uso de datos del nivel gratuito de Google. No se debe activar ese consentimiento ni cambiar el proveedor sin decisión explícita del responsable.
5. La generación de imágenes usa Cloudflare Workers AI con límite diario de 3 imágenes y manejo explícito de cuota gratuita agotada. Es útil como recurso visual puntual, pero no es una pizarra: no permite que el tutor dibuje y modifique figuras, etiquetas, flechas o pasos de manera sincronizada.
6. El tutor escrito devuelve JSON con `reply`, `checkQuestion` y `learningSignal`. No hay contrato estructurado de escena visual en la respuesta.
7. La última ejecución CI consultada para el commit `19af230506d66c94315ddb2430f373dcaac4add6` terminó correctamente: pruebas Orby, TypeScript, ESLint y build de producción.

## Arquitectura objetivo

### A. Motor de pizarra local (sin inferencia de imagen)

- Definir un contrato JSON pequeño y versionado para escenas: título, bloques de texto, formas geométricas, flechas, etiquetas, ecuaciones y gráficas.
- Validar estrictamente tipos, longitudes, cantidades máximas, coordenadas y colores permitidos en servidor y cliente.
- Renderizar la escena con SVG/HTML en el navegador. No ejecutar código ni HTML generado por el modelo.
- Actualizar escenas por operaciones acotadas (añadir, resaltar, mover, sustituir o limpiar elementos), conservando una instantánea para reanudación.
- Soportar una salida de texto si el modelo no entrega una escena válida.

### B. Contrato pedagógico

- Añadir un campo opcional `board` a la salida del tutor escrito.
- Pedir una escena solo cuando ayude a explicar; no generar dibujos para saludos, confirmaciones o respuestas puntuales.
- Mantener el texto como explicación principal y usar la pizarra como apoyo visual verificable.
- En Matemáticas y Ciencias Naturales, comprobar fórmulas, unidades, secuencias y etiquetas; no inventar datos en gráficas.
- Mantener el alcance exclusivo de Saber 11 y los filtros actuales.

### C. Voz continua y sincronización

- Mantener el micrófono abierto mientras la sesión Live esté activa; aceptar intervención, interrupción y reanudación sin obligar a tocar enviar.
- Vincular cada escena con el identificador de generación de voz para descartar anotaciones atrasadas tras una interrupción.
- Permitir que la pizarra avance por etapas sincronizadas con la explicación, sin bloquear la conversación por renderizado.
- El guardado de mensajes puede continuar por intercambio atómico e idempotente.

### D. Cuotas y privacidad

- No añadir proveedor ni fallback que pueda generar cargos.
- Respetar límites de Cloudflare y de cualquier servicio gratuito; al agotarse, informar y degradar a explicación escrita.
- No activar Gemini Live en producción ni cambiar su configuración de privacidad como parte de esta implementación.
- Antes de usar voz Live públicamente, el responsable debe decidir explícitamente si acepta las condiciones de tratamiento de datos del nivel gratuito de Google y comprobar la configuración de cuenta.

## Secuencia de implementación y aceptación

1. Contrato de escena, validador y renderizador SVG seguro; pruebas unitarias de payload inválido, límites y geometrías.
2. Integrar `board` en tutor escrito y mostrar una pizarra junto a la explicación; pruebas para respuestas sin escena y escenas malformadas.
3. Enviar escenas incrementales desde voz y asociarlas a generaciones; pruebas de interrupción, salida atrasada, reanudación y persistencia.
4. Pruebas reales en Chrome: conversación de varios minutos, interrupción en mitad de explicación, preguntas de seguimiento, cambio de tema, pérdida de red, cuota agotada y permisos de micrófono.
5. CI completa antes de solicitar Pull. No desplegar automáticamente.

## Restricciones de alcance

- No reconstruir material del Orby ICFES Lab que fue eliminado intencionalmente.
- No modificar `main`, no desplegar y no pedir Pull hasta que el responsable revise el resultado.
- No afirmar que la experiencia está terminada por pasar pruebas estáticas; la voz continua requiere prueba real con micrófono y navegador.


## Avance implementado — primera versión de pizarra

- Se añadió `lib/ai/orby-board.ts` con contrato versionado y sanitizador estricto.
- Se añadió `components/aprender/OrbyBoard.tsx`, que renderiza bloques tipados como texto, fórmulas, pasos y llamadas de atención. No interpreta HTML, SVG ni código del modelo.
- `/api/lesson-tutor` acepta la pizarra opcional, valida el objeto en servidor y solo devuelve el campo si pasa el esquema. También valida la escena recuperada tras el reintento de respuesta incompleta.
- `LessonAITutor` incorpora la pizarra al mensaje del asistente y la muestra debajo de la explicación. Las respuestas antiguas y las respuestas sin escena siguen funcionando sin cambios.
- Se añadió una prueba para escenas válidas, tipos desconocidos, versión incorrecta, exceso de bloques y renderizado sin HTML inseguro.

### Límites pendientes de esta entrega

- La pizarra todavía no se persiste al recargar el historial; el esquema actual de mensajes guarda texto y metadatos de adjunto, no escenas. No se añadió una migración de base de datos en esta fase.
- La pizarra está integrada con el tutor escrito y la ruta de voz alternativa que usa `/api/lesson-tutor`; todavía no se sincroniza con eventos de Gemini Live en tiempo real.
- No se activó Gemini Live en producción ni se cambió ninguna condición de privacidad o cuota.
- CI se encuentra en ejecución para el commit de esta integración. No se declara validada hasta que finalice.


## Segunda fase — persistencia de pizarras

- Se añadió la columna opcional `orby_messages.teaching_board` mediante migración.
- Se creó `orby_save_turn_with_board`: inserta el mensaje del estudiante y la respuesta del tutor con la pizarra en una sola transacción, bloqueando la conversación antes de escribir.
- La ruta escrita ahora utiliza esa RPC y envía únicamente la pizarra previamente validada en servidor.
- El endpoint de historial incluye `teaching_board`; el cliente la reconstruye como bloque tipado al abrir la conversación.
- La validación SQL usa ramas `CASE` para no ejecutar funciones de arrays sobre JSON que no sea un array.
- Se añadieron pruebas estáticas para la ruta de guardado, migración y recuperación.

### Pendiente de despliegue y validación

- La migración nueva está en GitHub; no se aplicó al proyecto Supabase ni se desplegó la aplicación en esta fase.
- Hasta aplicar la migración, la ruta nueva no estará disponible contra la base de datos actual.
- La CI del commit más reciente debe finalizar antes de solicitar Pull.
- Esta persistencia cubre el tutor HTTP y el historial; no convierte todavía Gemini Live en una sesión continua ni sincroniza pizarras durante el audio.


## 2026-11-07 — primera conexión de pizarra con Gemini Live

- Se declaró la herramienta `render_orby_teaching_board` dentro de las herramientas Live, con un esquema JSON limitado a título y bloques tipados.
- El cliente despacha las llamadas de pizarra por un manejador separado del buscador académico; no consumen el presupuesto de consultas al Lab.
- El manejador valida el payload con `sanitizeOrbyBoard`, comprueba que la sesión y actividad sigan vigentes y adjunta la escena al mismo mensaje de Orby.
- Las llamadas que aparecen canceladas en el mismo evento se excluyen antes del despacho. La pizarra se limpia al iniciar una nueva actividad, al interrumpir y al cerrar la sesión.
- El paquete inmutable de persistencia del turno incluye la pizarra, de modo que el reintento conserva el mismo `turnId` y la misma escena.
- `/api/orby/realtime-turn` vuelve a validar el payload en servidor y llama a la nueva RPC `orby_save_voice_turn_with_board`; los turnos sin pizarra siguen usando la RPC existente.
- La migración aditiva `20261107060000_orby_voice_board_idempotency.sql` conserva la clave de recibo `(conversation_id,user_id,turn_id)` y guarda el par de mensajes y la pizarra dentro de la misma transacción.
- Se añadió una prueba de regresión estática para despacho, sanitización, payload de reintento y contrato de migración.

### Límites y validación

- La migración **no está aplicada** en Supabase. La persistencia Live con pizarra requiere aplicarla antes de que esa ruta pueda guardar escenas; no se habilita un fallback que oculte un RPC ausente.
- La privacidad de Gemini Live en producción sigue bloqueada; no se modifica `ORBY_GEMINI_LIVE_ENABLED`.
- CI debe finalizar para el último commit antes de considerar esta etapa validada. Después siguen pruebas reales en Chrome de voz larga, barge-in, llamada cancelada y recarga del historial.
- Esta es una primera versión de escena completa por turno, no una pizarra incremental sincronizada fotograma a fotograma con el audio.


## Requisito prioritario confirmado — voz y dibujo simultáneos

La experiencia objetivo de Orby Voice es la del video de referencia del responsable: el tutor **habla y dibuja al mismo tiempo**. No se considera terminado si la escena aparece únicamente cuando finaliza la respuesta hablada.

### Comportamiento obligatorio

- Orby explica oralmente mientras la pizarra se construye progresivamente, en paralelo con el audio.
- Cada bloque, fórmula, paso, etiqueta, flecha o elemento visual debe aparecer cuando corresponda a la parte de la explicación que Orby está pronunciando; no se debe esperar al final del turno.
- La pizarra debe poder actualizarse varias veces durante una misma respuesta, sin crear burbujas independientes ni duplicar la respuesta hablada.
- La conversación sigue siendo continua: el estudiante puede interrumpir, preguntar o cambiar el rumbo; los eventos y dibujos atrasados de la explicación anterior se descartan.
- El dibujo no debe bloquear el micrófono, el audio, la transcripción ni la recepción de nuevas intervenciones.
- La persistencia conserva la escena final asociada al mismo mensaje y al mismo identificador idempotente del turno. Las actualizaciones parciales no deben crear mensajes duplicados.

### Criterio de aceptación

En una sesión real de Chrome, pedir a Orby que resuelva oralmente un ejercicio de Saber 11. Mientras habla, comprobar que el contenido visual aparece y progresa acompasado con la explicación; interrumpirlo a mitad de un paso y hacer una pregunta nueva. Orby debe detener el dibujo anterior, responder a la nueva intervención y continuar sin mostrar elementos atrasados. Repetir con una fórmula y con un esquema conceptual.

La herramienta actual `render_orby_teaching_board` de escena completa por turno es solo un primer puente técnico: **no satisface por sí sola este requisito**. La siguiente implementación debe usar actualizaciones incrementales de pizarra durante la misma generación Live, con validación, límites y asociación a la generación activa. No declarar la experiencia lista hasta superar la prueba real de voz y dibujo simultáneos.

## Auditoría de continuidad — commit 91cc242 (2026-11-07)

### Qué cambió realmente

- El diff de `91cc2425731962c65e13ed1518ef1775fe6c64cd` contiene un único cambio funcional: la descripción de la herramienta `render_orby_teaching_board` en `lib/ai/orby-live-tools.ts`.
- La nueva instrucción pide al modelo enviar instantáneas acumulativas repetidas durante la explicación. No añade un protocolo nuevo de eventos temporizados ni una señal de alineación con fragmentos de audio.
- El manejador `handleOrbyLiveTeachingBoardTool` en `components/aprender/LessonAITutor.tsx` ya valida cada instantánea y actualiza el objeto `board` del mismo mensaje de asistente. Por tanto, varias llamadas pueden reemplazar la pizarra sin crear burbujas adicionales.
- El manejador verifica la sesión y la generación de actividad vigentes y rechaza llamadas si el turno ya terminó. La cancelación/interrupción elimina la respuesta Live incompleta.
- La respuesta de herramienta usa `FunctionResponseScheduling.WHEN_IDLE`; hay que comprobar en navegador que las llamadas repetidas no introduzcan pausas perceptibles en la voz ni acumulen escenas que lleguen tarde.

### Estado de validación observado

- El estado combinado consultado para `91cc242` informa un check Vercel exitoso. La consulta de ejecuciones de GitHub Actions asociadas no devolvió ejecuciones; esto no demuestra por sí solo que las pruebas de TypeScript, ESLint, tests y build hayan corrido para este SHA.
- No se ha realizado aquí una prueba real de Chrome con micrófono y audio. No declarar sincronización voz-pizarra aprobada.
- El commit `91cc242` es una mejora de instrucciones del modelo, no la implementación completa del criterio de aceptación de voz y dibujo simultáneos.

### Próximos pasos obligatorios

1. Ejecutar y registrar explícitamente tests Orby, TypeScript, ESLint y build sobre el SHA exacto de la rama.
2. Probar en Chrome que dos o más instantáneas de pizarra aparecen durante una misma respuesta mientras el audio sigue reproduciéndose sin cortes ni duplicados.
3. Interrumpir a Orby durante una actualización y comprobar que ninguna llamada o escena de la generación anterior reaparece.
4. Comprobar que la escena final se persiste una sola vez y se recupera al recargar el historial.
5. Solo después de esas pruebas, actualizar el estado de aceptación. Mantener prohibidos Pull, merge a `main` y despliegue hasta autorización expresa.

## Fase siguiente — despacho no bloqueante de pizarra (2026-11-07)

- Commit `dd3c2b77b6785958dfa56bfed46f7d6aa9f306b6`: la herramienta `render_orby_teaching_board` ahora declara `Behavior.NON_BLOCKING`, de modo que una actualización visual no debe detener la generación de voz ni exigir que el modelo espere a que el cliente responda antes de continuar.
- Commit `173b928b8ec25e6e1d37b78b401b8cffb91b9974`: se añadió una aserción de regresión al conjunto `tests/orby-request-filter.test.mjs` para proteger el comportamiento no bloqueante.
- La función de cliente sigue validando la escena y actualizando el mismo mensaje. No se cambió el esquema de persistencia, los proveedores, las cuotas ni la configuración de privacidad.

### Validación pendiente

- Los commits se escribieron en `feat/founder-intro`; no se ejecutó aquí `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` ni `npm run build` sobre el árbol completo. No declarar CI aprobado.
- Confirmar en Chrome que Gemini Live acepta llamadas de pizarra no bloqueantes con `sendToolResponse` y que la voz sigue avanzando sin repetición, pausas ni llamadas acumuladas.
- Confirmar la sincronización perceptible entre audio y cada actualización; `NON_BLOCKING` evita bloquear, pero no crea por sí mismo marcas de tiempo ni alineación fonética.
- Probar interrupción, cancelación, fin de turno y recuperación del historial antes de solicitar Pull. No desplegar ni integrar en `main`.

## Fase de sincronización — respuestas SILENT para la pizarra (2026-11-07)

### Hallazgo

La herramienta de pizarra estaba declarada como `Behavior.NON_BLOCKING`, pero el cliente respondía cada llamada con `FunctionResponseScheduling.WHEN_IDLE`. En el SDK `@google/genai 2.17.1`, `WHEN_IDLE` agrega el resultado al contexto y solicita generar una salida cuando el modelo quede libre. Eso no es lo que queremos para una actualización visual: puede provocar una salida de voz adicional por cada dibujo.

La definición oficial de `FunctionResponseScheduling` en `googleapis/js-genai`, tag `v2.17.1`, describe `SILENT` como agregar el resultado al contexto sin interrumpir ni activar generación.

### Cambio realizado

- Commit `3427eba`: ambas respuestas de `render_orby_teaching_board` ahora usan `FunctionResponseScheduling.SILENT`.
- Commit `b3fa6fbe`: la prueba de regresión verifica que el manejador de pizarra tenga dos respuestas SILENT y ninguna WHEN_IDLE/INTERRUPT. También ajusta el conteo de WHEN_IDLE reservado a las herramientas de búsqueda académica.
- La herramienta sigue declarada `Behavior.NON_BLOCKING`. No se cambiaron proveedores, configuración de privacidad, cuotas, base de datos ni migraciones.

### Alcance y validación pendiente

- SILENT evita solicitar una nueva generación por cada dibujo; no proporciona por sí mismo marcas de tiempo ni sincronización fonética. La escena todavía depende de cuándo Gemini emita la llamada a la herramienta.
- Ejecutar `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npm run build` en el SHA final.
- Probar Chrome con audio real: varias actualizaciones dentro de una explicación, ausencia de frases duplicadas, interrupción del estudiante, descarte de llamadas atrasadas y persistencia de la escena final.
- No solicitar Pull, no integrar en `main` ni desplegar hasta cerrar las validaciones y recibir autorización.

## Instrumentación de sincronización — latencia de cada actualización visual (2026-11-07)

- Commit `b237151`: se agregó un contador de actualizaciones de pizarra por pregunta y una métrica en el cliente que registra únicamente el ordinal, milisegundos desde la aceptación de la pregunta y cantidad de fragmentos de audio ya programados.
- El contador se reinicia al aceptar una nueva pregunta. La telemetría no registra texto del estudiante, contenido de la explicación ni bloques de la pizarra.
- Commit `e6c1738`: prueba de regresión para verificar el contador, el reinicio y que la telemetría no incluya contenido académico.
- Esta instrumentación permite comparar cuándo aparece cada dibujo con el inicio del audio y detectar escenas que llegan tarde. No es sincronización automática ni cambia la temporización del modelo.
- Validar privacidad y utilidad de estos logs en una sesión local antes de usarlos en producción. No se activa Gemini Live en producción.

## Incidencia de CI y corrección — 2026-11-07

- La compilación Vercel del commit `314c10b236d3ae78b5377801eb32a5fe2b0349ab` falló durante `npm run build` porque el test estático de la herramienta de pizarra tenía el patrón RegExp sobreescapado: buscaba los caracteres literales `\\s\\S` en vez de cualquier secuencia de caracteres.
- En esa ejecución, el conjunto reportó 134 pruebas: 133 pasaron y falló únicamente la aserción de presencia de `Behavior.NON_BLOCKING`; no fue un error de TypeScript ni del componente de pizarra.
- Commit `b7548bfe77a4686be16ea01c437dd262dd318ccc`: corregido el patrón a `[\\s\\S]` y `Behavior\.NON_BLOCKING`.
- La comprobación del archivo en GitHub confirma que el patrón ya está escrito correctamente. El estado Vercel del nuevo SHA todavía figura como `pending`; esperar el resultado de la nueva compilación antes de declarar CI verde.
- No se ha ejecutado una sesión Chrome con audio real. No solicitar Pull ni desplegar manualmente.


## 2026-11-07 — acumulación segura de instantáneas Live

- Se añadió mergeOrbyBoardSnapshots en lib/ai/orby-board.ts. Recibe únicamente escenas ya sanitizadas y conserva los bloques anteriores, agrega bloques nuevos sin duplicarlos y actualiza visuales por identidad (type + title).
- handleOrbyLiveTeachingBoardTool ahora combina cada instantánea recibida con la escena activa del mismo turno antes de actualizar el mensaje. Se mantienen las comprobaciones de sesión/generación y las respuestas SILENT.
- Se añadió una prueba de regresión que cubre acumulación, repetición de instantáneas y actualización de visuales.
- Commits: 3126977d (merge de escenas), 2410c42e (integración Live), f13511e5 (prueba).
- Esto evita que una instantánea parcial o repetida borre pasos ya dibujados. No crea marcas de tiempo de audio ni garantiza sincronización fonética: el ritmo todavía depende de cuándo Gemini emite cada llamada. La aceptación visual y de voz requiere prueba real en Chrome.
- La consulta de ejecuciones GitHub Actions para f13511e5 no devolvió runs; no se declara CI validada. No se aplicó la migración pendiente de Supabase, no se activó Gemini Live en producción, no se hizo Pull ni despliegue.


## Corrección de contrato y persistencia visual — 2026-11-07

- La herramienta solicita instantáneas completas acumulativas. El cliente utiliza la instantánea validada más reciente como estado autoritativo; no concatena bloques de dos instantáneas. Así el modelo puede corregir, reordenar o retirar contenido sin dejar texto obsoleto en la pizarra.
- Se limita a ocho actualizaciones por turno. La instrucción Live pide emitir una actualización antes de cada sección hablada importante, una llamada a la vez, con 3–6 actualizaciones para clases de varios pasos.
- El renderizador vuelve a montar únicamente el visual cuyo contenido cambió; los bloques sin cambios conservan su estado y el nuevo dibujo vuelve a ejecutar el trazo SVG.
- Hallazgo de persistencia: las RPC anteriores rechazaban version 2, aunque el sanitizador ya permite escenas con visuales. Se añadió la migración aditiva 20261107070000_orby_board_visual_persistence.sql para actualizar ambas RPC (orby_save_turn_with_board y orby_save_voice_turn_with_board) y aceptar version 1 o 2, con máximo de 4 visuales y 24 KB por escena. Se conserva el bloqueo de conversación, el recibo idempotente y los permisos service_role.
- La nueva migración debe aplicarse junto con las migraciones pendientes de pizarra antes de validar persistencia real. No se ha aplicado Supabase ni se ha desplegado la aplicación.
- La cadencia real sigue dependiendo de cuándo Gemini emita los eventos Live; el cliente dibuja al recibir cada evento, pero no hay timestamps fonéticos del audio. La prueba real de Chrome sigue siendo requisito de aceptación.

- Se serializa también la recepción: el cliente acepta como máximo una instantánea de pizarra por evento Live y rechaza las hermanas del mismo evento con respuesta silenciosa. Evita que React agrupe varios cambios recibidos juntos y muestre solo el último, ocultando pasos intermedios.

## Alineación por frase hablada — 2026-11-07

- Cada instantánea puede incluir `spokenCue`: frase breve exacta (3–12 palabras) que el tutor debe pronunciar justo antes de revelar ese dibujo.
- El cliente valida la frase, conserva la instantánea pendiente y la revela cuando la transcripción acumulada de Live contiene la frase normalizada. No se inventan timestamps ni se simula sincronización fonética.
- Si el reconocimiento omite la frase, al terminar el turno se muestra la última instantánea válida para no perder el contenido. Las instantáneas sin `spokenCue` conservan el comportamiento inmediato.
- El historial guarda la pizarra final del turno, no una secuencia temporal completa. La precisión depende de la transcripción que emita Live; debe medirse en Chrome con audio real antes de aceptar esta fase.

## Trazos progresivos y reconciliación visual — 2026-11-07

- La tarjeta de cada visual conserva una identidad estable entre instantáneas; no se desmonta todo el SVG cuando cambia un elemento.
- Nodos, conexiones, puntos, vectores, átomos, componentes de circuito, pares de ADN y orgánulos usan claves basadas en identidad y geometría. Si una pieza nueva o corregida cambia, se monta como pieza nueva y activa su trazo/entrada; las piezas que no cambian permanecen montadas.
- Las piezas reciben un escalonado breve de hasta 630 ms para que el esquema se construya en secuencia. Se conserva `prefers-reduced-motion`.
- Esto es animación de dibujo por primitivas SVG/DOM, no un flujo de lápiz con coordenadas en tiempo real. El siguiente paso de fidelidad requiere eventos de trazo incrementales del modelo y validación de carga/rendimiento en navegador.

## Dibujo libre tipo profesor — 2026-11-07

- Se añadió el visual `sketch` al contrato seguro de la pizarra: hasta 16 trazos por visual, cada uno con 2–40 puntos normalizados, color controlado (`ink`, `accent`, `muted`, `success`), grosor limitado y etiqueta opcional con coordenadas obligatorias.
- Gemini Live recibe el esquema de trazos y la instrucción de dibujar contorno, estructuras internas, flechas y rótulos en pequeñas actualizaciones acumulativas. Los IDs estables preservan trazos no modificados entre instantáneas.
- El renderizador suaviza los puntos con curvas Bézier cuadráticas, anima la línea con `stroke-dashoffset` y mueve una punta de lápiz SVG por la trayectoria. Las etiquetas entran después de que termina su trazo; `prefers-reduced-motion` desactiva la animación y oculta la punta.
- La voz no debe esperar a la herramienta no bloqueante. El prompt de sesión pide emitir la primera frase útil enseguida y dibujar en paralelo. La alineación visual sigue siendo por `spokenCue` de transcripción, no por reloj fonético; se revela máximo una instantánea por evento de transcripción y se conserva el fallback de escena final.
- Los trazos se validan en servidor antes de renderizar. Los límites por punto/visual y el límite existente de 24 KB por escena reducen superficie de abuso y memoria.
- No se ha ejecutado build, test ni una sesión Chrome real desde esta edición. La validación de CI continúa bloqueada por el estado `build-rate-limit` de Vercel y no hay ejecuciones GitHub Actions asociadas. No se han aplicado migraciones, modificado `main` ni desplegado.

- Corrección adicional de cue: una instantánea con `spokenCue` queda realmente fuera del mensaje visible hasta reconocer la frase. Si la transcripción ya llegó antes que la herramienta, se compara con el texto oral acumulado y se revela en cuanto llega el snapshot; si no, queda en cola. Se añadió prueba para proteger esta condición y el fallback final crea/actualiza la burbuja aunque no hubiera texto previo.

- Se alineó también la búsqueda del Lab con la latencia: la primera frase oral empieza desde conocimiento fiable mientras la consulta no bloqueante corre en paralelo; el material recuperado solo amplía o corrige la explicación cuando llega. No se cita contenido no recibido.
- El sanitizador limita la escena compacta a 18 KB para dejar margen a la serialización JSONB; la RPC conserva el tope estricto de 24 KB. Las escenas excesivas se rechazan antes de mostrar o persistir.

- En cada nuevo turno de estudiante se limpia la referencia interna de pizarra y la cola de cues. La escena anterior permanece asociada a su mensaje histórico, pero no puede filtrarse ni persistirse otra vez como parte de la respuesta nueva.
- El contrato `sketch` también se añadió al tutor escrito y al fallback de voz por turnos; las mismas restricciones de trazos se validan antes de renderizar. Live continúa usando el contrato no bloqueante para voz simultánea.

## Implementación directa en GitHub — corrección de pizarra Live (2026-11-07)

### Cambios aplicados en `feat/founder-intro`

- Se retiró `spokenCue` del contrato de nuevas llamadas Live y del prompt de sesión. El sanitizador conserva compatibilidad con pizarras antiguas que todavía contengan ese campo.
- El callback Live procesa primero VAD/transcripción del alumno cuando comparte evento con una llamada de herramienta. Después despacha herramientas y finalmente procesa salida/audio una sola vez.
- Se añadió una cola temporal de una instantánea acumulativa para cuando la llamada de pizarra llegue antes de la transcripción final. Solo se muestra tras el preflight académico y de idioma; expira a los 15 segundos y queda ligada a la generación activa.
- Las instantáneas de un turno validado aparecen al recibirlas y usan respuesta `SILENT`; no esperan frases reconocidas ni el final del audio.
- Interrupciones, saludos, rechazos de política, fallback y cambios de conversación limpian los dibujos provisionales.
- La pizarra pasa a ocupar el espacio principal de la pantalla de voz; el orbe se reduce al aparecer el tablero.
- El cursor circular se sustituyó por un lápiz SVG animado; se amplió el lienzo y se conserva `prefers-reduced-motion`.
- La selección manual del historial recupera `teaching_board`; el deduplicador conserva metadatos visuales y adjuntos cuando llegan en una actualización posterior.
- Se añadieron pruebas de regresión para el orden entrada-antes-de-herramienta, la retirada del gate por frase, la restauración del historial y la conservación de metadatos.

### Límites y validación pendiente

- `NON_BLOCKING` y `SILENT` evitan que cada dibujo solicite otra generación. No fuerzan al modelo a invocar la herramienta en toda explicación ni crean timestamps fonéticos; la frecuencia depende de las llamadas que emita Gemini Live.
- No se añadió proveedor, modelo, solicitud extra de inferencia, búsqueda adicional, generación de imágenes ni fallback facturable.
- No se cambió `ORBY_GEMINI_LIVE_ENABLED`, privacidad, cuotas, migraciones ni configuración de Supabase.
- La CI debe finalizar tests Orby, TypeScript, ESLint y build sobre el commit nuevo. Después se requiere Chrome con micrófono: primera escena durante voz, varias actualizaciones acumulativas, interrupción, nueva pregunta e historial manual.
- No hacer Pull, merge a `main` ni despliegue hasta revisar los resultados.

## Revisión del primer resultado local — 2026-11-07

- El registro local compartido reporta 170 pruebas: 165 aprobadas y 5 fallidas.
- Se identificaron tres expectativas estáticas desactualizadas por el nuevo flujo: tres salidas SILENT (visible/provisional/rechazada), limpieza segura antes de responder un rechazo y nueva disposición de la pizarra.
- Una de las cinco fallas sí detectó un detalle de presentación: el deduplicador conservaba los espacios periféricos de la copia más reciente aunque el texto normalizado fuera idéntico. Ahora conserva el primer texto y fusiona los metadatos visuales posteriores.
- Se actualizó el contrato de pruebas y se corrigió el texto accesible del estado de preparación. El siguiente resultado local debe confirmar que desaparecen estas cinco fallas.
- Este registro no equivale a una ejecución nueva: falta volver a correr `npm run test:orby`, TypeScript, ESLint y build. No declarar CI verde hasta ver esos resultados.


## 2026-11-07 — correcciones de regresiones y compatibilidad de migraciones

- Se eliminó una doble llamada consecutiva a `handleGeminiLiveEvent(payload)`: cada evento WebSocket normal debe procesarse una sola vez para no programar dos veces el mismo fragmento PCM ni duplicar transcripciones.
- El historial ahora reintenta la lectura con las columnas anteriores cuando Supabase todavía no conoce `teaching_board` (errores PostgreSQL `42703` o PostgREST `PGRST204`). El chat textual ya no debe quedar bloqueado por una columna aditiva pendiente.
- Tutor escrito y voz Live conservan el turno con sus RPC atómicas anteriores si la RPC aditiva de pizarra aún no existe (`PGRST202` / `42883`). La pizarra se muestra en la sesión activa y la interfaz advierte que no se conservará al recargar hasta aplicar la migración.
- No se aplicó ninguna migración, no se cambió la configuración de privacidad/cuotas de Gemini Live, no se desplegó y no se integró `main`.
- Pendiente de validación: ejecutar tests Orby, TypeScript, ESLint y build sobre este commit; probar Chrome con audio y micrófono; confirmar que la voz reproduce cada fragmento una sola vez, que el tablero recibe varias instantáneas y que una interrupción descarta todo lo anterior. La persistencia completa de escenas requiere aplicar las migraciones de pizarra ya presentes en la rama.

- Compatibilidad adicional: si la RPC de pizarra existe pero responde `invalid_input` ante una escena version 2 (por una migración SQL anterior que aún solo acepta version 1), se guarda el turno mediante la RPC textual idempotente/atómica y se informa de que la escena no se conservará al recargar.

- TypeScript: el deduplicador de mensajes conserva el merge de metadatos visuales mediante un registro mutable no genérico para evitar TS2862; mantiene el texto original y las propiedades visuales más recientes sin modificar la API pública.
