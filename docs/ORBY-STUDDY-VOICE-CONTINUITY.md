# Continuidad: réplica de aula Studdy y voz gratuita

Fecha: 2026-11-09
Rama: `feat/founder-intro`

## Cambios realizados

- Se rehízo la presentación de `components/aprender/OmegaXFreeVoiceTurn.tsx` como aula de pizarra blanca a pantalla completa: título manuscrito sobre resaltado amarillo, contenido sobre el papel, subtítulos centrados en el borde inferior y controles discretos en las esquinas.
- Se quitaron las tarjetas de conversación, la columna lateral «Cómo funciona», los paneles con bordes y las líneas divisorias del aula de voz gratuita.
- Los subtítulos mantienen visible la respuesta del tutor después de terminar la locución; antes podían desaparecer y ser sustituidos por un aviso genérico.
- La identidad del tutor ahora se pasa desde `LessonAITutor`: Orby para el tutor ICFES y OmegaX para English Studio. La identidad también se envía a la ruta de voz y se usa en el prompt.
- La ruta `/api/orby/cloudflare-voice-turn` ahora informa cuál variable de entorno falta, sin exponer credenciales.

## Flujo real de voz gratuita

`LessonAITutor` monta `OmegaXFreeVoiceTurn` cuando `workspaceMode === "voice"` y `cloudflareVoiceMode` está activo. El preflight y los turnos usan `/api/orby/cloudflare-voice-turn`.

La implementación usa:
- Cloudflare Workers AI Whisper para transcribir audio.
- Cloudflare Workers AI Gemma para generar la respuesta.
- Síntesis de voz del navegador (`speechSynthesis`) para leer la respuesta; no se llama a una API de TTS facturable.
- Límite de uso y presupuesto diario; si la cuota gratuita se agota, se detiene sin fallback de pago.

## Bloqueo que requiere configuración externa

El error HTTP 503 observado en `/api/orby/cloudflare-voice-turn` es un preflight que falla antes de pedir permiso al micrófono. El código exige estas variables en el entorno local y en Vercel:

1. `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED=true`, solo después de verificar manualmente que la cuenta está en Workers Free.
2. `CLOUDFLARE_ACCOUNT_ID`, ID de cuenta de 32 caracteres.
3. `CLOUDFLARE_API_TOKEN`, token de API con los permisos de Workers AI necesarios.

No se deben inventar credenciales ni activar la confirmación sin verificar el plan. La modificación de código no puede crear ni recuperar esos secretos. Tras configurar las variables, reiniciar `npm run dev` y volver a probar el GET y POST de `/api/orby/cloudflare-voice-turn`.

## Pendiente de validación

- Ejecutar lint, TypeScript y build en el entorno local.
- Verificar el flujo de voz en Chrome: permiso de micrófono, grabación, transcripción, respuesta, subtítulos persistentes, interrupción de voz y guardado del historial.
- Probar con cuenta Workers Free real y confirmar que no se genera consumo facturable.
- Comparar el resultado visual en escritorio y móvil con las referencias Studdy proporcionadas.

No se afirma que la voz esté habilitada: falta la configuración externa indicada y aún no se ha ejecutado una prueba end-to-end.


## Auditoría de regresiones de `npm run test:orby` — 2026-11-09

Se corrigieron incompatibilidades introducidas por el rediseño y el cambio de proveedor de voz:

- La ruta `cloudflare-voice-turn` vuelve a aplicar el gate compartido `isCloudflareWorkersAIConfigured()`; antes solo se inspeccionaban variables manualmente y se había omitido la validación central que exige la suite y el proveedor.
- El gate ahora informa de forma diferenciada si falta la confirmación Workers Free, el ID de cuenta o el token, y conserva una comprobación final con el gate compartido.
- La prueba de prompt dejó de buscar una frase fija del prompt antiguo dentro de `cloudflare-workers-ai.ts`; ahora comprueba el prompt real que arma la ruta Cloudflare Voice y que admite Orby/OmegaX.
- La prueba de preflight dejó de esperar etiquetas antiguas ("Comprobando acceso"/"Voz no disponible") y comprueba los estados reales de la interfaz nueva ("Conectando voz"/"Voz sin conexión"/"Voz disponible").
- Se corrigió el punto y coma faltante tras `MAX_AUDIO_SECONDS`.

## Estado de verificación

Los cambios están guardados en `feat/founder-intro`. No se ha podido ejecutar `npm run test:orby` en el entorno conectado a GitHub. El check de Vercel sigue mostrando `build-rate-limit`, que es un límite de compilaciones de Vercel y no un resultado de la suite Node. Por tanto, no se declara la suite verde hasta ejecutarla localmente.


## Revisión de log adjunto y regresiones UI — 2026-11-09 (segunda pasada)

Se contrastó el log local adjunto con los archivos actuales de `feat/founder-intro`:

- El log reporta tres fallos: etiqueta fija de la pizarra en vivo, aria-label de subtítulos y validación central de Cloudflare.
- Se restauró en `OrbyBoard.tsx` el rótulo `OMEGAX · CLASE EN DIRECTO` encima del tema dinámico de la pizarra.
- Se corrigió el nombre accesible de la sección de subtítulos a `Subtítulos de la conversación con {assistantLabel}`.
- La ruta Cloudflare actual ya importa y ejecuta `isCloudflareWorkersAIConfigured()` en su gate, y la prueba actual exige esa validación. El log adjunto contiene una versión anterior de esa ruta, sin ese import/llamada; por eso ese fallo no describe el estado actual de GitHub.
- La prueba actual de preflight exige los estados que ya muestra `OmegaXFreeVoiceTurn` (`Voz disponible`, `Conectando voz`, `Voz sin conexión`). El fragmento de log corresponde a una expectativa anterior (`Comprobando acceso` / `Voz no disponible`), no al test actual de la rama.

Verificación pendiente: no se ejecutó la suite Node en un entorno local conectado a dependencias. El estado de Vercel para el commit revisado es `failure` con destino `build-rate-limit`; esto no es evidencia de un fallo de compilación del código ni confirma tests verdes. No declarar CI verde hasta disponer de una ejecución nueva de tests/build.

## Especificación pedagógica y visual aclarada — 2026-11-09

### Orby Lab es la fuente académica existente

- No crear un segundo banco académico paralelo ni reconstruir material que el usuario eliminó deliberadamente.
- La fuente de conocimiento de las clases es Orby Lab. El tutor debe consultar el material publicado pertinente y usarlo para decidir qué enseñar, en qué orden, qué conceptos son prerrequisitos y qué errores aclarar.
- La ruta existente `/api/orby/knowledge-search` consulta fragmentos publicados (hasta 6), conceptos del grafo (hasta 32) y documentos relacionados (hasta 3). La búsqueda de voz usa esta ruta como recuperación de conocimiento, no como entrenamiento o ajuste de pesos del modelo.
- Solo afirmar que se consultó el Lab después de recibir resultados. Si no hay contenido publicado pertinente o la búsqueda falla, enseñar con conocimiento académico fiable sin fingir que el Lab aportó evidencia.
- La herramienta de voz ya instruye una consulta por cada nuevo concepto sustantivo, no bloqueante, con un máximo de dos consultas por turno. Mantener la explicación oral y la primera actualización visual sin esperar la búsqueda.

### Cómo debe enseñar el tutor

- El estudiante elige o escribe el tema antes de iniciar la clase.
- Al abrir el aula, aparece primero el título del tema con resaltado amarillo.
- El profesor comienza a hablar de forma natural y presenta una pregunta, una motivación o un ejemplo para situar el concepto.
- La pizarra NO debe copiar toda la teoría recuperada. Debe seleccionar los puntos esenciales, definiciones, pasos, fórmulas, relaciones y errores frecuentes que ayuden a comprender.
- El texto aparece progresivamente, acompasado con la explicación oral. Cada etapa nueva se añade sin borrar lo que todavía sea útil.
- Preguntar y esperar la respuesta del estudiante, aceptar interrupciones espontáneas, aclarar con otro ejemplo y retomar desde el punto correcto.
- Mantener una conversación humana y contextual: no recitar instrucciones, no repetir saludos, no inventar nombres ni atribuirse una identidad errónea. Si una transcripción confunde un nombre o una palabra, aclararlo de forma natural y seguir la clase.
- La voz, los subtítulos, el foco visual y la escritura deben referirse al mismo concepto en el mismo momento. Al interrumpir la voz, detener la locución y conservar el estado de la pizarra.

### Banco visual: estado actual y evolución

- `lib/ai/orby-visual-bank.ts` ya contiene 25 claves visuales aprobadas para conceptos de biología, química, física, matemáticas, sociales, lectura e inglés. Son visuales estructurados/vectoriales de tipos como célula, ADN, diagrama, molécula, circuito, gráfica y fases de mitosis; no equivalen todavía a un banco amplio de imágenes rasterizadas.
- `render_orby_teaching_board` ya permite solicitar hasta dos claves exactas con `visualBankKeys`; el runtime expande las claves aprobadas dentro de la instantánea acumulativa de la pizarra.
- No asumir que los dibujos de Studdy proceden necesariamente de un banco interno: el menú contextual «Copiar imagen» del video confirma que se muestra como imagen copiable en el navegador, pero no revela si Studdy la recupera de una biblioteca, la genera o combina ambos métodos.
- Evolución deseada: añadir un banco propio de imágenes didácticas originales, indexado por área, tema, concepto, fase/proceso, etiquetas y función pedagógica. Cada recurso debe conservar URL/ID estable, texto alternativo, proporción, procedencia y licencia. La selección debe ser semántica y contextual: insertar la imagen al lado del texto que explica, no como decoración ni al azar.
- Priorizar recursos propios o con licencia clara. No copiar ilustraciones, imágenes ni identidad visual propietaria de Studdy. Cuando no exista un recurso fiable, usar los diagramas vectoriales y trazos didácticos de Orby; no fabricar imágenes científicas engañosas.

### Pizarra espacial

- El código actual ya soporta layout espacial 16:9 por hojas apiladas verticalmente (versión 3), hasta 4 hojas, con elementos de texto y visuales ubicados por coordenadas.
- `OrbyBoard.tsx` ya incluye zoom de 60% a 200%, ajuste a 100%, desplazamiento vertical/horizontal y modo de arrastre. Preservar estas capacidades; no sustituirlas por tarjetas.
- Composición objetivo según los videos: título arriba a la izquierda; notas esenciales en una columna; ilustraciones o diagramas junto a ellas, normalmente hacia la derecha; siguientes ideas debajo o en la siguiente hoja. Mantener aire y legibilidad, y avanzar por la clase en un orden espacial coherente.
- Las actualizaciones son acumulativas, con IDs estables y animación solo de los elementos nuevos. El contrato actual recomienda 3–6 actualizaciones en una clase de varios pasos y limita a 8 por turno; conservar el historial visual relevante y no reenviar dibujos ya animados como si fueran nuevos.

### Brecha de voz que debe resolverse

- La ruta gratuita Cloudflare actual es por segmentos: MediaRecorder captura, Whisper transcribe, Gemma responde y `speechSynthesis` del navegador lee la respuesta. Es gratuita según la configuración habilitada, pero no equivale por sí sola a una sesión de audio bidireccional continua.
- La ruta Gemini Live existente tiene integración de voz y herramientas de pizarra en tiempo real. No asumir que está disponible gratuitamente ni habilitarla con una configuración de pago.
- El objetivo sigue siendo una experiencia conversacional con interrupción real, respuesta ágil, subtítulos sincronizados y continuidad de clase, respetando la regla de coste: solo servicios dentro de cuotas gratuitas verificadas; al agotarse, pausar o degradar con aviso claro, nunca cambiar silenciosamente a un servicio facturable.

### Estado de esta revisión

Esta sección documenta requisitos y capacidades comprobadas en `feat/founder-intro`; no afirma que el banco ampliado de imágenes ni la brecha de voz estén resueltos. La actualización es documental y no modifica código de producto. Ejecutar tests, lint, TypeScript y build cuando se realicen cambios de implementación.


## Implementación de Gemini Live y aula blanca — 2026-11-09

### Separación definitiva de proveedores

- **Tutor ICFES / Orby:** el inicio de clase usa la sesión de audio nativo de Gemini Live (`gemini-3.8-live`), no la ruta por segmentos de Cloudflare. El micrófono se envía en streaming mediante `sendRealtimeInput`; Gemini devuelve audio nativo. La detección de inicio de voz interrumpe la respuesta en curso y permite barge-in.
- **Subtítulos de Orby:** `outputAudioTranscription` publica el texto de salida de la misma sesión Live. La vista de clase mantiene los subtítulos siempre visibles y usa el texto incremental para actualizar la banda inferior durante la explicación. `inputAudioTranscription` se conserva como metadato de validación/historial; no es una cadena Whisper → LLM → TTS ni sustituye el audio nativo.
- **English Studio / OmegaX:** conserva `OmegaXFreeVoiceTurn` y `/api/orby/cloudflare-voice-turn` para speaking y pronunciación. La entrada `startOmegaXEnglishRoleplay` sigue llamando `openCloudflareVoiceClass(true)`. El tutor ICFES no llama `openCloudflareVoiceClass(false)`.
- Si Gemini Live interrumpe la sesión, agota la cuota gratuita o no entrega audio/transcripción válidos, se cierra Live y se deja la pregunta para continuar por escrito. No se habilita un modo Whisper de respaldo, Cloudflare como fallback del tutor ni un proveedor facturable.

### Inicio de clase y presentación

- `startWorkspaceClass` establece primero materia y tema, abre el flujo Gemini Live y conserva el gesto original de inicio para desbloquear el contexto de audio antes de la espera de red.
- Tras `setupComplete`, `sendInitialOrbyClassTurn` envía `buildOrbyInitialClassPrompt(activeTopicRef.current)` al mismo canal Live. El profesor recibe la orden de empezar la clase y escribir el título; no queda esperando una primera intervención del estudiante.
- El consentimiento de tratamiento de datos del nivel gratuito se solicita en una pantalla explícita antes de pedir el micrófono. «Aceptar y conectar» reintenta desde una interacción real del usuario; «Cancelar» cierra el inicio. La advertencia indica que Google puede usar el contenido del nivel gratuito para mejorar productos y que puede haber revisión humana.
- El tablero sin contenido conserva solo el título del tema con resaltado amarillo: se eliminó la línea divisoria y el texto de instrucciones genéricas.
- La banda de subtítulos tiene fondo blanco sólido; no tiene degradado. Los subtítulos no se pueden ocultar con un botón. La pizarra en vivo mantiene fondo blanco sin cuadrícula, puntos ni borde; se restableció el resaltado amarillo del título.
- Se eliminó la etiqueta fija «OMEGAX · CLASE EN DIRECTO» para no atribuir la identidad equivocada a Orby.

### Reglas de elegibilidad, cuota y privacidad que permanecen activas

- La página oficial de precios de Google consultada el 9 de noviembre de 2026 muestra `gemini-3.8-live` con coste de entrada/salida «Free of charge» en Free Tier, sujeto al acceso limitado y límites del nivel. El mismo cuadro indica que el contenido del nivel gratuito puede utilizarse para mejorar productos. Por tanto, **el coste cero no elimina las condiciones de tratamiento de datos ni las restricciones de audiencia**.
- La ruta `/api/orby/realtime-session` mantiene `GEMINI_NOT_PERMITTED_FOR_STUDENT_AUDIENCE`, la allowlist de adultos para QA interna, el gate `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED`, el consentimiento por sesión y el bloqueo de producción `ORBY_GEMINI_LIVE_ENABLED`. No se ha quitado ni puenteado ninguna de estas protecciones.
- PeakScore está dirigido a estudiantes de décimo y undécimo. El gate de adulto autorizado es una restricción adicional de QA, no una excepción contractual confirmada para integrar Gemini API en una plataforma dirigida a menores. No habilitar sesiones estudiantiles de Gemini API sin una confirmación contractual escrita de Google o una ruta con condiciones que permitan expresamente este caso de uso.
- No activar `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED` ni `ORBY_GEMINI_LIVE_ENABLED` por el hecho de que la tabla pública muestre un coste de cero. La confirmación del proyecto, acceso al modelo, cuotas reales y tratamiento de datos sigue siendo obligatoria.

### Commits y estado de pruebas

Cambios guardados en `feat/founder-intro`:
- `58e89d49ee9a4048d75a8571bd3025fd9776e663` — el inicio del tutor deja de abrir Cloudflare y prepara el primer turno Live; se añade el gate de consentimiento en el cliente.
- `0c215ab18f224541dd4075aee7725ce06b89081f` — diálogo de consentimiento, subtítulos permanentes y tablero blanco sin línea ni instrucciones genéricas.
- `a6338568eb7e3c1b12a25bf5bffce27f047c5e80` — fondo blanco sólido en subtítulos.
- `b2dc57f66ec46f44b00feade95ae3336a53d0b4d` — desbloqueo de AudioContext en la interacción de inicio.
- `d62b93043433349f931aa9b8235c08d685d87295` — limpieza de control de subtítulos opcionales y acción redundante.
- `fb7e3b9f044be8d29a77b92e0a37e6acb84dd41f` — elimina identidad fija incorrecta de OmegaX en la pizarra.
- `8d6629712b1c764a46b0a2cc6f6d6e3a1dd9ca3a` — restaura resaltado amarillo del título en el aula.
- `1585c0cda180e10a4060f0e9ac3069ab98588d94` — actualiza pruebas de regresión para Gemini Live, inicio automático, separación Cloudflare/English y subtítulos permanentes.

Se consultó el estado del commit de pruebas: el único check devuelto es Vercel `failure` con destino `build-rate-limit`; GitHub no devolvió ejecuciones de Actions para ese commit. No se ejecutó `npm run test:orby`, `npm run lint`, TypeScript ni `npm run build` en un entorno local conectado al repositorio. Por lo tanto, estos cambios están guardados y sus expectativas de regresión están actualizadas, pero **no se declara build ni suite aprobados**. Tampoco se ha realizado una llamada end-to-end a Gemini Live desde una cuenta habilitada.


## Continuación: corrección de regresión y configuración Preview — 2026-11-09

### Cambios posteriores

- `tests/orby-request-filter.test.mjs` se actualizó en el commit `3b616f90b21d55351734b58e86afe8055c7b55ab`: la prueba de inicio ahora reconoce el parámetro `freeTierDataUseAccepted` y comprueba que el primer turno de clase se emite automáticamente después de establecer Live.
- El despliegue Vercel que ejecutó ese commit sí inició `npm run test:orby`. La suite detectó una regresión introducida al retirar el botón grande de «Guardar apuntes»: también se había retirado la función de guardar la pizarra completa, aún protegida por una prueba de contrato.
- El commit `477df753640cacab8191c4597ad2ef92a6ddf2e1` restaura el guardado de la pizarra como un icono discreto, sin volver a introducir el control grande. También elimina el contenedor vacío que había quedado en la barra y cambia el estado inicial a «Preparando llamada en directo…».
- `.env.example` quedó actualizado en el commit `2dd074641b5908b1bdf9385df6e5f62d502ff80d` con las variables de Free Tier, la lista vacía de cuentas adultas autorizadas y la clave de servidor, sin credenciales reales.

### Configuración Vercel verificada

- Vercel Preview del proyecto `peak-score` tiene `ORBY_GEMINI_LIVE_ENABLED=true` para la rama `feat/founder-intro`.
- Se registró `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true` únicamente en Preview, con una nota de confirmación del operador. No se habilitó Production.
- La variable secreta `GEMINI_API_KEY` está definida para ese Preview; su contenido nunca se leyó ni se expuso.
- **Bloqueo pendiente:** no aparece `PEAKSCORE_GEMINI_ADULT_TESTER_EMAILS` en las variables Preview. La ruta rechaza la sesión antes de pedir el micrófono cuando el correo autenticado no está en esa lista. No se debe añadir una cuenta que no haya sido confirmada como adulta y autorizada para QA.

### Estado de pruebas

- En el despliegue del commit `3b616f90b21d55351734b58e86afe8055c7b55ab`, los registros de Vercel mostraron los tests de Gemini Live, audio nativo, interrupciones, búsqueda de Orby Lab y subtítulos aprobados. La suite terminó fallando en el contrato que requería el guardado de la pizarra completa, eliminado accidentalmente en la limpieza de la cabecera.
- El guardado de pizarra se restauró en `477df753640cacab8191c4597ad2ef92a6ddf2e1`. **No se ha podido repetir la suite después de esa corrección**: el check posterior de Vercel reporta `build-rate-limit` y no ha generado un despliegue nuevo para ese commit.
- No se afirma que `npm run test:orby`, lint, TypeScript o build estén verdes después del último cambio. Tampoco se ha realizado una llamada real de extremo a extremo a Gemini Live.
