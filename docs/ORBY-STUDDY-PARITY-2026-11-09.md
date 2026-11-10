# Orby — paridad visual y funcional con Studdy
**Fecha de trabajo:** 9 de noviembre de 2026 (America/Bogota)  
**Rama:** `feat/founder-intro`  
**Repositorio:** `PeakScore777/PeakScore`  
**Objetivo:** llevar la clase de Orby a una experiencia de tutoría por voz y pizarra comparable con el video de referencia de Studdy, sin sustituir Gemini Live ni introducir servicios que puedan facturar.

> Este documento es el registro de trabajo del día. Se actualiza en cada bloque de cambios y conserva explícitamente qué está implementado, qué está validado por CI y qué requiere prueba manual. No representa una afirmación de paridad visual total con Studdy.

## Reglas que no se negocian
- Trabajar únicamente en `feat/founder-intro`; no modificar `main`, no desplegar ni abrir Pull Request como parte de esta tarea.
- Mantener Gemini Live como motor de voz/razonamiento durante esta fase.
- No agregar Kimi-K2, ElevenLabs ni proveedores alternativos de pago.
- Las imágenes siguen utilizando la ruta existente de Cloudflare Workers AI / Flux Schnell, cuota diaria y guardas de coste; al agotarse, no hay fallback pagado.
- El material de Orby ICFES Lab fue eliminado intencionalmente. No reconstruirlo, inferirlo ni usar conteos antiguos.
- No introducir emojis en la interfaz ni permitir que el tutor enseñe programación o contenido ajeno a Saber 11.
- La salida de Live, los subtítulos y el tablero deben pertenecer al mismo turno; eventos de una generación interrumpida no deben contaminar la siguiente.

## Referencia visual observada
Del video de Studdy se toma el patrón de interacción, no sus marcas ni sus activos:
- Lienzo de clase claro, amplio y con predominio del contenido.
- Escritura manuscrita y jerarquía didáctica sencilla.
- Título resaltado, trazos de tinta y anotaciones de distintos colores.
- Subtítulos de voz legibles durante la explicación.
- Barra inferior discreta, con identidad del tutor y controles de micrófono/salida.
- Apoyos visuales insertados dentro de la lección, no como una respuesta separada.

El video/nota aportados identifican Kimi-K2 y ElevenLabs en el stack de Studdy, pero no revelan el proveedor o endpoint de generación de imágenes. PeakScore no copia endpoints ni credenciales desconocidas.

## Arquitectura de PeakScore
1. **Gemini Live:** audio bidireccional, transcripción de entrada/salida, barge-in y llamadas a herramientas.
2. **Pizarra segura:** `render_orby_teaching_board` y `apply_orby_board_action`; JSON tipado, sanitizador y render SVG/React. Nunca se interpreta HTML/SVG arbitrario generado por el modelo.
3. **Banco visual:** primitivas aprobadas para recursos científicos/educativos canónicos.
4. **Ilustración raster opcional:** `generate_orby_teaching_image` solicita una sola ilustración PNG por intervención académica validada, a través de `/api/orby/generate-image` y Cloudflare Flux Schnell. El límite API actual es de tres imágenes por usuario/día.
5. **Presentación:** pizarra, ilustración y subtítulos se asocian al mensaje activo de Orby.
6. **Persistencia:** texto y pizarra se guardan mediante el RPC idempotente existente. La imagen PNG generada aún no se persiste en el historial al momento de este registro; aparece en el turno activo y se pierde al recargar. Esto queda registrado como pendiente, no como funcionalidad terminada.

## Registro de movimientos — 9 de noviembre de 2026

### Movimiento 1 — auditoría del estado y de la referencia
- Confirmada la rama de trabajo `feat/founder-intro`.
- Revisados `LessonAITutor.tsx`, `OrbyBoard.tsx`, `orby-live-tools.ts`, estilos globales, ruta de imágenes, ruta de persistencia y pruebas Orby.
- Revisado el video aportado y documentadas las señales de diseño descritas arriba.
- Confirmado que existe el avatar `public/images/orby/orby-avatar.png`.
- Confirmado que la ruta de imágenes impone autenticación, alcance ICFES, máximo de tres imágenes diarias y errores de cuota sin fallback de pago.

### Movimiento 2 — integración de herramienta PNG en Gemini Live
- Añadida la declaración `generate_orby_teaching_image` a `lib/ai/orby-live-tools.ts`.
- Añadido el manejador `handleOrbyLiveImageTool` en `LessonAITutor.tsx`.
- La herramienta exige turno académico validado, filtra prompt, permite una imagen por intervención y aborta solicitudes anteriores cuando comienza una actividad nueva.
- La imagen se anexa al mismo mensaje activo y se representa junto con la pizarra.
- El flujo reutiliza `/api/orby/generate-image`; no crea proveedor ni fallback nuevo.
- Commit: `2ad86a9b` (declaración) y `c1cdf8ae` (manejador/render).

### Movimiento 3 — composición visual de la clase
- Barra inferior reordenada con avatar de Orby, acceso al chat, guardado de apuntes, micrófono y botón de terminar.
- Título del tema resaltado con estilo manuscrito.
- Estilos de lienzo claro, tipografía, subtítulos y controles agregados al final de `app/globals.css`.
- Commit: `b876616c` (controles), `e018530c` (título), `78ee1414` (composición CSS).

### Movimiento 4 — regresiones y contrato
- Añadida prueba de integración estática para la herramienta Live de imagen, límite por turno, ruta de cuota y renderizado.
- Actualizado el contrato de subtítulos para que sean permanentes durante la llamada; el estudiante no se presenta como la voz de Orby.
- Ajustadas dos expectativas antiguas de pruebas: el límite entre manejador de pizarra y manejador de imagen; subtítulos permanentes en lugar de una preferencia de ocultación.
- Commits: `7c9a6fc6`, `f49fc708`, `88880325`.

### Movimiento 5 — correcciones de TypeScript detectadas por CI
- Quitada una referencia a un setter de subtítulos ya inexistente.
- Eliminadas comparaciones imposibles de `learningView` contra `english` en un panel cuyo tipo no permite ese valor.
- Envueltos los handlers de voz para no pasar el MouseEvent a una función que espera boolean.
- Conservados literales de tipos para `role` en el historial de voz.
- Definido un límite de longitud del prompt antes de llamar al modelo de análisis de Cloudflare.
- Commits: `aaac2836`, `263c24ae`, `0a82d7bb`.

### Movimiento 6 — resultado de CI
- GitHub Actions run [42737267121](https://github.com/PeakScore777/PeakScore/actions/runs/42737267121), commit `0a82d7bb47df3e15c5d8cf9ad7015a59f4f20c14): **306/306 pruebas Orby aprobadas**.
- TypeScript `npx tsc --noEmit`: aprobado.
- ESLint `npm run lint`: aprobado.
- Build `npx next build`: aprobado.
- La auditoría de dependencias completó sin fallo.
- Esta validación corresponde al código de aplicación hasta el commit `0a82d7bb`; los commits posteriores del mismo bloque solo actualizaron documentos y dispararon ejecuciones adicionales.
- El resultado de CI no prueba micrófono real, reproducción de audio, generación de imagen de proveedor ni diseño responsive en navegador.

## Pendientes prioritarios
1. Mostrar un estado de generación de ilustración en la misma hoja mientras Flux trabaja y un mensaje de cuota agotada sin dejar un hueco vacío.
2. Reforzar continuidad de la pizarra: foco/spotlight inequívoco, acciones incrementales, estados de espera y cancelación limpios al interrumpir.
3. Revisar la persistencia de ilustraciones generadas en el historial. Hoy solo se conserva texto/pizarra; no guardar base64 crudo en Postgres. Diseñar uso de storage privado y referencias firmadas respetando los límites existentes, o declarar claramente la limitación.
4. Revisar diseño en escritorio y móvil: canvas, subtítulos, barra inferior, scroll, controles y superposición con chat.
5. Añadir regresiones de fallos de imagen, aborto por barge-in, límite de imágenes por turno y ausencia de salida atrasada.
6. Ejecutar CI completo después de cada bloque. Probar en navegador con micrófono y cuota real solo con autorización/entorno de prueba apropiado.

## Estado al abrir este registro
- Integración Live de PNG: implementada en rama.
- Lienzo y barra inferior: primera iteración visual implementada.
- Subtítulos: permanentes por contrato y prueba.
- Pruebas/TypeScript/ESLint/build: aprobados en run [42737267121](https://github.com/PeakScore777/PeakScore/actions/runs/42737267121).
- Imagen generada persistida en historial: pendiente.
- QA manual de Chrome/micrófono: pendiente.
- `main` / despliegue / PR: sin cambios.

## Movimientos adicionales — persistencia y continuidad de imágenes (9 de noviembre)

### Movimiento 7 — optimización local antes de Storage
- Añadido `lib/ai/orby-image-upload.ts`.
- Convierte el PNG/JPEG de Flux a WebP desde el navegador, limita el borde mayor a 1440 px y prueba calidades descendentes hasta quedar por debajo del límite existente de 1 MB.
- No envía la imagen a un segundo modelo ni proveedor; toda la compresión es local.
- Commit: `b1167cd7`.

### Movimiento 8 — almacenamiento privado y URLs firmadas
- La ruta `GET /api/orby/images?path=...` valida que el path pertenezca al usuario autenticado, comprueba metadata y redirige a una URL firmada de 10 minutos.
- La pantalla de historial usa una ruta del mismo origen; no guarda URLs firmadas caducables ni base64 en la base de datos.
- Commits: `c3742920`.

### Movimiento 9 — vinculación a un turno de voz específico
- Nueva ruta `POST /api/orby/realtime-turn/image`, que verifica sesión, UUID de conversación/turno y prefijo de path antes de invocar la RPC.
- Nueva migración `20261110010000_orby_voice_image_persistence.sql`: agrega `generated_image_path` y `voice_turn_id`, conserva el RPC idempotente de voz y define `orby_attach_voice_turn_image` con acceso exclusivo a `service_role`.
- Se incluye `voice_turn_id` también cuando la llamada no tiene pizarra: el guardado usa `orby_save_voice_turn_with_board(..., p_teaching_board: null)` y conserva fallback al RPC legacy si la migración todavía no existe.
- La imagen se puede adjuntar tanto si termina antes de guardar el turno como si termina después. Se conserva el path al reintentar un guardado fallido y se evita que una subida tardía se vincule a un turno posterior.
- Commits: `83fa3401` (migración inicial), `5a4a8921` (endpoint), `c98ecbbd` (guardar turn ID sin pizarra), `43c5bf16` (reintentos), `d73093fb` (corrección de comillas de delimitación SQL).

### Movimiento 10 — historial compatible por etapas
- El endpoint de mensajes pide primero `teaching_board` + `generated_image_path`.
- Si falta solo `generated_image_path`, vuelve a consultar con `teaching_board` para no perder las pizarras actuales.
- Si también falta `teaching_board`, cae al historial textual anterior y entrega campos opcionales nulos.
- Commit: `dee371aa`.

### Movimiento 11 — estados visuales de generación
- La clase muestra un estado de carga no bloqueante: «Orby está preparando una ilustración» y explica que la clase continúa mientras se crea el apoyo visual.
- La imagen aparece con una revelación corta; respeta `prefers-reduced-motion`.
- Commit: `a445f5e6`.

### Movimiento 12 — pruebas de almacenamiento y fallback
- Añadida regresión que comprueba conversión WebP bajo 1 MB, llamada de subida, cancelación/turn generation, asociación con el ID del turno, URL firmada, ruta de historial y migración.
- Actualizado el test de compatibilidad histórica para cubrir ambas columnas opcionales, en vez de acoplarse al nombre anterior del helper.
- Commits: `30ac1c1f`, `7dace362`.
- El primer CI del nuevo test detectó que el test histórico seguía esperando el antiguo helper `isMissingTeachingBoardColumn`; la expectativa fue adaptada a la nueva función genérica `isMissingColumn`. Esa ejecución fallida no representa un fallo de la ruta en producción.

## Dependencias operativas de la persistencia PNG
- **Importante:** la migración `20261110010000_orby_voice_image_persistence.sql` ya está en GitHub, pero no se ha aplicado a Supabase remoto desde esta tarea.
- Hasta aplicar la migración, el guardado del turno mantiene su fallback y la imagen puede verse en la sesión actual, pero no puede quedar asociada de forma persistente al historial. La subida al bucket privado conserva el límite de 20 activos por cuenta y el máximo de 1 MB por objeto.
- Una vez aplicada la migración, los nuevos turnos Live guardan el `voice_turn_id`, y el endpoint de asociación escribe solamente la ruta privada de la imagen en el mensaje del asistente.
- No ejecutar la migración en remoto sin revisión/autorización. No almacenar base64 en `orby_messages`.

## Validación de este bloque
- La nueva ejecución de CI para el commit `7dace362` está en curso al escribir este registro: [GitHub Actions run 42738365834](https://github.com/PeakScore777/PeakScore/actions/runs/42738365834).
- El resultado todavía debe confirmar tests, TypeScript, ESLint y build antes de declarar este bloque aprobado.
- QA manual pendiente: llamada Gemini Live real, generación Flux, subida WebP, interrupción durante la subida, imagen visible tras recargar historial y comprobación responsive en Chrome.

## Movimientos adicionales — QA tipado y advertencias honestas (9 de noviembre)

### Movimiento 13 — tipado del fallback de historial
- El primer TypeScript encontró que Supabase infiere un tipo genérico cuando se parametriza `.select(columns)` con `string`; se sustituyó por tres consultas con selecciones literales explícitas y casts controlados a `Record<string, unknown>`.
- Se conservó la consulta legacy descendente de 80 mensajes, invirtiendo los resultados al devolverlos, para no cambiar qué mensajes ve el usuario si falta la migración.
- Commits: `046ced85` y `6bd5c115`.

### Movimiento 14 — carrera imagen/guardado y estado de sesión
- Se estrechó el path a `savedPath` después de validar que era string, para evitar que el estado de reintento recibiera `string | null`.
- Se cubrió la carrera en la que la imagen termina entre el inicio del guardado y la respuesta del RPC: después de guardar se vuelve a leer la ruta vigente del mismo `turnId` y se intenta asociar.
- Al comenzar una nueva actividad Live se aborta cualquier imagen antigua y se limpian los refs de turno/ruta para que una respuesta tardía no se una a otra pregunta.
- Commits: `0139ab88`, `3f8915b2`.

### Movimiento 15 — aviso visible si la ilustración no se conserva
- El mensaje de Orby diferencia una imagen persistida de una ilustración que solo está disponible durante la sesión actual.
- Si el almacenamiento o la asociación de historial falla, se muestra una nota debajo de la ilustración en lugar de afirmar que ya se guardó.
- Se añadió una entrada visual de carga no bloqueante y una animación breve de aparición, respetando movimiento reducido.
- Commits: `a445f5e6`, `6afaf72f`.

### Movimiento 16 — ajuste de ESLint
- La ejecución CI de `3f8915b2` pasó las pruebas Orby y TypeScript, pero ESLint rechazó una única variable local sin uso (`storedImagePath`).
- Se retiró esa variable; el valor validado `savedPath` es ahora la única fuente de verdad para storage, estado de reintento y asociación al turno.
- Commit: `c690d556`.

## Último estado de CI observado
- Run [42738528870](https://github.com/PeakScore777/PeakScore/actions/runs/42738528870), commit `3f8915b2`: Orby tests aprobados, TypeScript aprobado; ESLint falló por una sola advertencia de variable no usada. El build no se ejecutó debido a la política fail-fast del workflow.
- Run [42738605790](https://github.com/PeakScore777/PeakScore/actions/runs/42738605790), commit `6afaf72f`: repitió tests y TypeScript aprobados, pero también incluyó la advertencia que se retiró en `c690d556`.
- Run [42738752411](https://github.com/PeakScore777/PeakScore/actions/runs/42738752411), commit `c690d556`: validación en curso al actualizar este documento. Debe terminar ESLint y build antes de declarar QA completo.
- Estado operativo: la migración SQL está versionada, no aplicada en Supabase remoto. Hasta aplicarla, las imágenes pueden mostrarse en la sesión; su asociación persistente al historial aún no está disponible en la base remota.

## Validación final del bloque de persistencia — 9 de noviembre (actualización final)
- Run [42738752411](https://github.com/PeakScore777/PeakScore/actions/runs/42738752411), commit de código `c690d556be2ed8fef576858938c6408c19f18969`: **307/307 pruebas Orby aprobadas, 0 fallos**.
- `npx tsc --noEmit`: aprobado.
- `npm run lint`: aprobado con `--max-warnings=0`.
- `npx next build`: aprobado; compilación y generación estática de 70 páginas completadas.
- Auditoría de dependencias: completada; el gate final se omitió al no haber fallo que bloqueara.
- La última ejecución validó todo el código de aplicación del bloque de persistencia, incluido el arreglo ESLint de `storedImagePath`. El HEAD de la rama incluye después commits de documentación, no cambios de código de aplicación.
- **No significa que la migración remota esté aplicada ni que QA con micrófono real haya sido realizado.** La migración `20261110010000_orby_voice_image_persistence.sql` sigue pendiente de aplicación/revisión en Supabase remoto; hasta entonces el cliente conserva el comportamiento de imagen de sesión y muestra una advertencia visible cuando no puede guardar la referencia.
## Actualización de trabajo — Gemini Live y pizarra de clase (9 de noviembre, noche)

### Movimiento 17 — comparación audiovisual de la clase real
- Revisados los dos videos de referencia: la grabación actual de PeakScore y la de Studdy.
- En PeakScore se observó visualmente un título duplicado: uno en el encabezado superior y otro en el lienzo blanco. La hoja tenía una zona vacía enorme y el error de Gemini aparecía centrado dentro de la clase.
- En Studdy se observó una única hoja blanca de enseñanza: título manuscrito dentro del lienzo, escritura progresiva, notas, recursos visuales intercalados y subtítulos/controles discretos.
- No se copian activos, branding ni endpoints privados de Studdy; se replica el patrón de interacción y composición.

### Movimiento 18 — diagnóstico de Gemini Live y coste cero
- Revisado app/api/orby/realtime-session/route.ts y lib/ai/provider-free-tier.ts.
- El error anterior combinaba la falta de API key y la falta de confirmación de Free Tier bajo isGeminiFreeTierConfigured(), por lo que no identificaba el motivo exacto.
- Consultado Vercel de forma no secreta: existe GEMINI_API_KEY para Preview asociado a feat/founder-intro; existe PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true para esa misma rama con comentario de aprobación del prototipo; y existe ORBY_GEMINI_LIVE_ENABLED=true solo en Preview.
- El último deployment READY que estaba publicándose al mirar el video era anterior a esas variables. Varios deployments posteriores no quedaron READY porque el build falló ejecutando regresiones de la aplicación; los fallos incluían expectativas obsoletas de tests, no pruebas de que Gemini fuese facturable.
- Se dividió el guard del endpoint para reportar por separado GEMINI_API_KEY_NOT_CONFIGURED y GEMINI_FREE_TIER_NOT_CONFIRMED, y se añadió guía explícita de que el deployment debe volver a desplegarse para tomar el entorno correcto.
- La comprobación del nivel gratuito no se eliminó, no se creó un fallback de pago y se mantiene el consentimiento por sesión para el tratamiento de datos del Free Tier.
- Commits: 46532406, 810d3756.

### Movimiento 19 — un solo título en la hoja blanca, escrito progresivamente
- Creado components/aprender/OrbyBoardTitle.tsx: revela cada glifo en secuencia, agrega pausas tras puntuación, expone estado de escritura accesible y muestra un cursor tipo marcador mientras escribe; respeta prefers-reduced-motion.
- components/aprender/OrbyBoard.tsx reutiliza ese componente en su render normal, añade showTitle para que Live pueda tener una única cabecera compartida y filtra bloques heading que repiten el título principal.
- LessonAITutor.tsx elimina el título del topbar, pone la cabecera manuscrita dentro del lienzo blanco y renderiza el tablero Live con showTitle={false}; quitó también el título del estado vacío para evitar una segunda copia.
- app/globals.css extiende el lienzo blanco, reduce la barra superior a una franja de estado y da al título una posición consistente de hoja de clase con cursor animado.
- Commits: 4ed7a4d8, cce00a03, f8dd1004, b41f6d8f, 086b480b, cf24b274.

### Movimiento 20 — nuevas regresiones
- Actualizados contratos de tests que asumían la vieja cabecera roja y el título interno, para comprobar el título único externo en Live.
- Añadido contrato para distinguir la ausencia de key de la ausencia de la confirmación gratuita.
- Añadido contrato para el componente de escritura progresiva, cursor, clases CSS y que el tablero Live esconda su cabecera duplicada.
- Commit de test actual: d6591ec1.

### Estado de validación de esta actualización
- CI run 42741609800, commit d6591ec177060606300a6ec16081e95ae1963eeb: en ejecución al escribir esta nota.
- Los fallos anteriores de esta iteración correspondían a expectativas de pruebas anteriores: OrbyBoard en la clase Live sin showTitle=false, subrayado rojo eliminado y helper gratuito combinado. Se reemplazaron por las expectativas nuevas.
- QA manual con audio y navegador aún pendiente.
- No se modificó main, no se hizo despliegue de producción ni se eliminó la protección de coste.

## Actualización de trabajo — reconexión Live y limpieza visual de la clase (10 de noviembre)

### Movimiento 21 — causa concreta del estado «Conectando»
- La UI mostraba «Conectando» aunque stopRealtimeVoice() ya había dejado voiceMode=false; el control de micrófono estaba deshabilitado precisamente cuando debía ofrecer reintento.
- El inicio de clase dependía de voiceStartInitialClassRef, que se descartaba al fallar la conexión; un reintento podía reconectar sin enviar el tema inicial.
- El consentimiento de Free Tier se pasaba como parámetro, pero no se conservaba en memoria después de aceptarlo, complicando los reintentos.
- Se añadió voiceFreeTierDataUseAcceptedRef, actualizado únicamente al pulsar «Aceptar y conectar». Los reintentos reutilizan ese consentimiento de la sesión actual, sin persistirlo entre recargas ni saltarse la autorización.
- El control de micrófono ahora ofrece «Reintentar» cuando la sesión no está conectada; solo permite silenciar/activar el micrófono cuando Live está listo. El tema inicial permanece pendiente hasta que el socket conecta y se envía la primera instrucción.
- El modelo se mantiene en gemini-3.8-live; no se añadió proveedor alternativo ni ruta facturable.

### Movimiento 22 — pizarra limpia y mayor superficie
- Se quitó de la clase el topbar duplicado «OmegaX · Clase en directo / Sin llamada» y se oculta la cabecera general del panel mientras la clase está abierta.
- Se eliminó el PNG del personaje retirado de la barra inferior. No se coloca un personaje provisional.
- Se ocultaron herramientas de zoom/movimiento y navegación redundantes dentro de la clase en vivo; la pizarra usa el ancho disponible, hoja blanca continua y sin bordes/sombras.
- Se eliminaron separadores del pie y del área de subtítulos; los subtítulos quedan superpuestos de forma discreta cuando hay texto.
- Se añadieron transiciones suaves de entrada al volver al chat y al regresar a la pizarra, respetando prefers-reduced-motion.

### Validación y despliegue
- El primer build del cambio de reconexión ejecutó npm run test:orby; las pruebas funcionales pasaron, pero falló una aserción estática que esperaba el antiguo toggleVoiceMode(false). Se actualizó el contrato para comprobar el consentimiento retenido y la opción de reintento.
- Se añadieron regresiones para verificar que no vuelva el avatar antiguo ni el topbar redundante y que el lienzo conserve ancho completo, controles limpios y transiciones.
- Commits de esta iteración: 81f072e7 (reconexión y UI), 23756720 (pizarra y transiciones), 45788530 y 168c2c0d (regresiones).
- Pendiente de confirmar: build completo del HEAD actual y QA manual en navegador con micrófono real. La inspección de logs de runtime no devolvió eventos; el plan Hobby limita la retención, así que eso no demuestra que la llamada esté funcionando.
- No se modificó main, producción ni Supabase remoto.

## Auditoría profunda — OmegaX Live, interrupciones, pizarra e imágenes (10 de noviembre)

### Flujo de voz revisado
- Verificados el preflight GET, consentimiento explícito, sesión de conversación, token efímero POST, importación del SDK, solicitud de micrófono, AudioContext, AudioWorklet, PCM16 mono a 16 kHz, WebSocket Live, confirmación setupComplete, envío del turno inicial y reproducción PCM16 a 24 kHz.
- El modelo configurado es gemini-3.8-live, ID estable documentado por Google. El modelo admite voz bidireccional, llamada a funciones y streaming de audio. El nivel gratuito figura como sin coste en la tabla oficial de precios; el uso gratuito puede utilizarse para mejorar productos de Google y no debe confundirse con el nivel pagado.
- Se confirmó que los tokens efímeros requieren el flujo Live y que la versión de API usada por la integración del SDK debe mantenerse compatible con @google/genai 2.17.1; no cambiar v1alpha a ciegas por ejemplos REST más recientes.
- Se revisaron los tiempos máximos de permisos (12 s), preparación del AudioWorklet (8 s), conexión Live (15 s), setupComplete (8 s), watchdog de respuesta (15 s) y la reanudación de sesiones con nuevo token y handle.
- El flujo de interrupción usa START_OF_ACTIVITY_INTERRUPTS, VAD de inicio de voz, descarte de audio de la generación anterior, persistencia del fragmento interrumpido y limpieza de la cola PCM. La entrada escrita también interrumpe el audio actual.
- La clase inicial envía buildOrbyInitialClassPrompt después de que Live confirma setupComplete; no depende de que el estudiante escriba otra pregunta. Si falla el arranque, conserva el tema y ofrece reintentar con el consentimiento ya otorgado en esa pestaña.
- Se revisaron los estados de micrófono silenciado, stream ended/muted/unmuted, AudioContext suspendido, buffer de audio limitado, duplicación de respuestas, transcripción y recuperación de turnos sin audio.

### Flujo de pizarra e imágenes
- Verificados los cuatro tools Live: render_orby_teaching_board, apply_orby_board_action, generate_orby_teaching_image y search_orby_learning_knowledge.
- La pizarra tiene snapshots acumulativos, IDs estables de trazos, límite de ocho actualizaciones por turno, sanitización de geometría, acciones idempotentes y foco visual sincronizado con la narración.
- Las imágenes se solicitan como herramienta NON_BLOCKING: Gemini continúa hablando mientras Cloudflare FLUX.1 Schnell genera el apoyo. La ruta valida autenticación, alcance ICFES, cuota de tres imágenes diarias y presupuesto interno de neuronas; al agotarse o fallar no cambia a proveedor de pago.
- La imagen se optimiza, se guarda de forma privada en Supabase, se recupera mediante URL firmada y se adjunta al turno cuando la migración está disponible. Si el guardado falla, permanece visible en la sesión con advertencia.
- La imagen se cancela al cambiar de intervención y no se permite duplicar solicitudes dentro del mismo turno.
- Se cambió el texto de carga de imagen para usar assistantLabel (OmegaX), sin mostrar al personaje retirado.

### Regresiones de CI corregidas
- CI 42747722991 falló primero en la prueba de controles Live que exigía el antiguo handler de micrófono.
- CI 42748689572 reveló otra expectativa antigua sobre el estado disabled del botón.
- CI 42748790867 reveló una segunda expectativa antigua: «Esperando conexión de voz», sustituida por el estado actual de conexión/reintento.
- Se actualizaron las aserciones para comprobar el comportamiento real y se añadieron verificaciones de reconexión, consentimiento de sesión, pizarra continua, ausencia de avatar antiguo y etiqueta de carga de imagen de OmegaX.
- Commits de corrección de contratos: dc239362, 90d23459, edf8f41b. Identidad de carga de imagen: 4fec1481 y e536ec89.

### Límites de verificación
- Los contratos de CI son pruebas automatizadas estáticas y unitarias; no sustituyen una llamada real desde Chrome con micrófono, altavoces, cuenta autorizada y cuotas disponibles.
- No se ha confirmado una sesión real Gemini Live en navegador, ni el primer audio audible, ni la interrupción acústica en hardware. Tampoco se ha ejecutado una generación real de FLUX desde una cuenta de estudiante con presupuesto disponible.
- Vercel rechazó un despliegue Preview adicional por alcanzar el límite diario de despliegues API (100/24 h). No se cambió el plan ni se modificó producción.
- La última auditoría no modifica main, variables de entorno, migraciones remotas ni datos de estudiantes.

## Continuidad de trabajo — fallo de arranque Live y clase a pantalla completa (10 de noviembre)

### Evidencia de la sesión del usuario
- Se revisó la grabación local de 29,8 segundos y las capturas de navegador/consola.
- El estudiante introduce «mitosis», pulsa «Comenzar clase» y el área de enseñanza queda casi vacía: aparece el título, pero no se observa una explicación oral ni un desarrollo visual.
- La consola muestra GET /api/orby/realtime-session 503 y GEMINI_FREE_TIER_NOT_CONFIRMED.
- El mensaje de error hablaba de un deployment Preview incluso cuando el usuario ejecutaba npm run dev desde Windows. Eso confundía una configuración local ausente con una configuración de Vercel Preview.
- El resto de rutas de conversaciones, imágenes y aprendizaje respondían 200; eso no demuestra que Live esté operativo.

### Movimiento 23 — configuración Free Tier local/Preview más clara
- Se añadió getGeminiFreeTierConfigurationError en lib/ai/provider-free-tier.ts.
- El diagnóstico ahora separa falta de GEMINI_API_KEY y falta de PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true, con instrucciones distintas para .env.local en desarrollo y para variables Preview de feat/founder-intro.
- GET y POST de /api/orby/realtime-session usan la misma validación centralizada.
- La protección sigue fallando en cerrado: no se solicita micrófono, no se emite token y no se intenta otro proveedor si falta la confirmación. La variable solo debe ponerse en true después de verificar en la consola del proveedor que la cuenta usa realmente una cuota sin coste.
- Se actualizó .env.example para explicar el uso de .env.local y el reinicio del servidor local.
- Commits: 534c63b1 (helper), f92e47aa (ruta Live), fff8a909 (ejemplo de entorno).

### Movimiento 24 — el primer turno debe enseñar, no solo titular
- Se reforzó buildOrbyInitialClassPrompt: pide hablar inmediatamente en español colombiano, explicar el primer concepto, escribir el título progresivamente y construir un primer esquema educativo en el mismo turno.
- Se mantiene el orden seguro: solo se envía el turno inicial después de recibir setupComplete y asignar el canal Live activo.
- Commit: c105b8df.
- Importante: el prompt no puede reparar una sesión que no llega a crearse. Si la validación Free Tier falla, el bloqueo correcto es anterior a la solicitud de micrófono y el tutor no hablará.

### Movimiento 25 — hoja de enseñanza a pantalla completa
- Se añadió un modo de clase Live fijado al viewport completo (100vw/100dvw × 100vh/100dvh), independiente del ancho de la columna del dashboard.
- La hoja, el tablero y el canvas eliminan el máximo de ancho en el modo Live; controles y subtítulos conservan franjas compactas.
- Se mantiene el fondo blanco limpio y se respetan los estilos responsive existentes.
- Commit: d897da00.
- Esto replica el patrón de lienzo amplio de Studdy, sin copiar marca ni activos privados.

### Regresiones
- Se actualizaron las expectativas del prompt inicial y del guard Free Tier.
- Se añadieron contratos para distinguir el error local, comprobar que la confirmación explícita siga siendo obligatoria y verificar el posicionamiento a pantalla completa.
- Commit: 87fcd280.

### Pasos locales para desbloquear una prueba real
1. Verificar primero que la cuenta Gemini usada para GEMINI_API_KEY esté realmente en un nivel sin coste y que la política de uso de datos sea aceptable para la prueba.
2. En el proyecto local, copiar la configuración necesaria a .env.local; no compartir la clave ni subir ese archivo a Git.
3. Solo después de verificar el nivel gratuito, establecer PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true en .env.local. Mantener el consentimiento de uso de datos por sesión.
4. Detener y volver a ejecutar npm run dev para que Next.js lea las variables.
5. En Vercel, configurar las variables por separado para Preview de feat/founder-intro y generar un nuevo deployment Preview; una variable local no configura Vercel y viceversa.

### QA aún pendiente
- No se ha ejecutado un navegador real con micrófono después de estos cambios.
- No se ha confirmado que Gemini Live acepte una nueva sesión con la cuenta/clave actual ni que la cuota gratuita siga disponible.
- Debe comprobarse en navegador: primer audio espontáneo, subtítulo sincronizado, título letra a letra, dibujo de mitosis en varias etapas, interrupción por voz, reanudación y controles de clase.
- Debe revisarse el diseño a distintas resoluciones para confirmar que el lienzo ocupa todo el viewport sin tapar acciones esenciales.
- No se modificó main, no se hizo merge, no se desplegó producción ni se ejecutó ninguna migración remota.
