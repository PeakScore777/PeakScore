# OmegaX / Orby — auditoría de referencias Studdy y plan de implementación

**Fecha:** 2026-11-08  
**Rama objetivo:** `feat/founder-intro`  
**Estado:** auditoría de referencia y plan ejecutable; no declarar QA de audio completado.

## 1. Material revisado

Se inspeccionaron visualmente los tres videos adjuntos en esta conversación:
- Grabación de PeakScore (aprox. 65 s): el flujo de llamada termina en un estado de error de conexión.
- Studdy (aprox. 47 s): muestra una pantalla inicial despejada, selector de intención de estudio y entrada al aula.
- Studdy (aprox. 309 s): muestra una lección en una pizarra amplia; el contenido escrito aparece por etapas, con diagramas e ilustraciones que se incorporan mientras avanza la explicación.

La inspección disponible fue visual por fotogramas. No se afirma una transcripción literal ni una escucha/verificación acústica completa del audio de los MP4; queda como QA de audio pendiente. Las referencias sirven para identificar patrones funcionales, no para copiar marca, textos, ilustraciones ni pantallas propietarias.

## 2. Patrones observados que PeakScore debe reproducir funcionalmente

### Inicio / tablero de estudio
- Una pregunta principal sencilla: qué quiere aprender o resolver el estudiante.
- Acciones de entrada concretas: explicar un tema, resolver una pregunta, estudiar material y practicar.
- Entrada rápida a la clase, sin un dashboard recargado ni decoración genérica.
- Mantener el contexto de materia, tema y nivel al entrar al aula.

### Aula / tutor
- La pizarra es el área principal de lectura, amplia, blanca y continua.
- La clase se desarrolla progresivamente: títulos, frases, pasos y diagramas se revelan conforme se explican.
- El dibujo debe tener intención pedagógica: señalar, comparar, relacionar y construir; no limitarse a mostrar una lámina terminada.
- La voz enseña en paralelo con la pizarra. El estudiante puede interrumpir, pedir que repita o solicitar otro ejemplo sin reiniciar la clase.
- El contenido anterior permanece visible cuando se agrega una nueva etapa; las correcciones no deben borrar arbitrariamente la explicación útil.
- Interfaz de voz discreta: controles claros, sin transcripción del estudiante ocupando el aula, sin burbujas que tapen la pizarra.
- La experiencia debe sentirse como una clase guiada, no como un chat con una imagen adjunta.

## 3. Estado real encontrado en PeakScore

Ya existen piezas importantes en `feat/founder-intro`:
- `components/aprender/OrbyBoard.tsx`: renderer de bloques y visuales, animación progresiva y foco docente.
- `lib/ai/orby-board.ts` y `orby-board-actions.ts`: contrato/sanitización de pizarra y acciones.
- `lib/ai/orby-live-tools.ts`: herramienta `render_orby_teaching_board`, snapshots acumulativos y reglas para actualizaciones durante la narración.
- `components/aprender/LessonAITutor.tsx`: chat, llamada Live, controles de voz, tablero y English Studio.
- `app/api/orby/realtime-session/route.ts`: creación autenticada de sesión Gemini Live y puertas de coste/privacidad.
- `app/api/orby/realtime-turn/route.ts`: persistencia idempotente de turnos y tablero.
- `docs/ORBY-VOICE-WHITEBOARD-SPEC.md`, `docs/OMEGAX-STUDY-WORKSPACE-UX.md` y `docs/OMEGAX-ACADEMIC-COACH-SPEC.md`: contratos previos.

No reconstruir estas piezas desde cero. El siguiente trabajo debe cerrar la brecha entre los contratos existentes y el comportamiento real de la UI, llamada y pizarra.

## 4. Diagnóstico y prioridades

### P0 — llamada funcional y honesta
1. Reproducir el error de conexión observado en la grabación de PeakScore.
2. Verificar en el orden real: autorización y sesión Supabase, puertas de coste/privacidad, emisión de token efímero, handshake Live, permisos del micrófono, captura PCM, envío de audio, recepción de audio, reproducción, interrupción y cierre.
3. Distinguir claramente errores de configuración, privacidad/cuota, permisos, red y proveedor. No mostrar un genérico «no pudimos conectar» si se conoce la causa.
4. Nunca habilitar Live en producción saltándose `isGeminiFreeTierConfigured()` ni `ORBY_GEMINI_LIVE_ENABLED`; no mandar audio si el plan gratuito y el tratamiento de datos no están aprobados.
5. Mantener un fallback por turnos únicamente cuando el proveedor esté confirmado sin coste y dentro de cuota; avisar que no es llamada en vivo.

### P1 — tablero tipo clase
1. Mantener un único lienzo 16:9 legible, con scroll vertical en pantallas pequeñas.
2. Hacer que la primera actualización útil aparezca al iniciar la explicación, no al terminar.
3. Asegurar snapshots acumulativos con IDs estables y secuencia monotónica.
4. Corregir el ciclo docente: escribir/actualizar → enfocar elemento → explicar → retirar foco sin borrar → añadir relación/comparación.
5. Evitar que la pizarra se convierta en una columna de tarjetas o que cada actualización regenere todo el contenido.
6. Sincronizar narración y escritura por intención y orden de enseñanza, no fingir sincronía palabra-a-palabra que el proveedor no garantiza.
7. No generar una segunda llamada de IA para dibujar o subtitular.

### P2 — inicio real del aula
1. La ruta real `/orby` renderiza `OrbyWorkspacePage → LessonAITutor`; `OmegaXStudyHome.tsx` no está montado en esa ruta y su experimento visual fue revertido.
2. El inicio activo debe presentar la pregunta «¿Qué quieres aprender hoy?», un CTA de llamada Live, una entrada por texto y acciones rápidas compactas en chips (no tarjetas grandes).
3. Mantener la navegación global de PeakScore y la identidad propia; no clonar logos, colores de marca ni assets de Studdy.
4. Las acciones rápidas deben iniciar la intención elegida y mantener los cinco ámbitos ICFES; no crear rutas duplicadas ni cambiar el contexto de materia accidentalmente.
5. Eliminar emojis decorativos y sustituirlos por iconografía Lucide semántica consistente.

### P3 — pedagogía
1. Orby explica ICFES en español colombiano, a nivel del estudiante, con ejemplos y comprobación de comprensión.
2. Mantener el ciclo: diagnóstico breve → explicación modelada → práctica guiada → feedback basado en evidencia → reintento.
3. OmegaX English Studio mantiene inglés general MCER A1–C2 y llamada directa para Speaking/Pronunciation; Inglés Saber 11 permanece separado con sus siete partes y banco manual.
4. No enseñar programación, no promocionar otros preICFES y no atribuirse autoría o proveedor externo.
5. No reconstruir material eliminado deliberadamente del Orby ICFES Lab.

## 5. Proveedores / APIs para voz en vivo

### Ruta recomendada ahora
**Mantener Gemini Live como motor de voz**, porque el repositorio ya tiene integración con `@google/genai`, tool calling para la pizarra y un endpoint de sesión. Antes de cambiar proveedor, corregir y medir esa integración existente.

### Complementos de transporte/orquestación
- **WebSocket nativo / SDK oficial de Google:** menor complejidad y sin añadir otro proveedor de inferencia. Es la primera opción para aislar el fallo actual.
- **LiveKit (open source) o Daily:** pueden aportar WebRTC, gestión de salas, reconexión y manejo de medios. No sustituyen el modelo ni hacen gratis la inferencia; hospedaje/servicio puede tener coste. Evaluar solo si el transporte actual demuestra ser el cuello de botella.
- **Pipecat (open source):** útil si más adelante se separan STT, LLM, TTS y transporte en una canalización intercambiable. Aumenta complejidad y no convierte APIs facturables en gratuitas.
- **Firebase AI Logic Live API:** alternativa de integración cliente/seguridad para Gemini Live que merece un spike aislado; confirmar compatibilidad exacta de modelo, tools, cuotas, región y tratamiento de datos antes de migrar.

### Proveedores/modelos alternativos
- OpenAI Realtime ofrece voz bidireccional y WebRTC, pero la API es de pago y no cumple la restricción de coste cero del proyecto.
- Deepgram, Cartesia, ElevenLabs y servicios similares pueden complementar STT/TTS, pero no introducirlos en producción mientras no exista una cuota gratuita verificable y una puerta de coste equivalente.
- Groq puede servir para texto según cuota gratuita vigente, pero no sustituye por sí solo la experiencia nativa speech-to-speech de Gemini Live.

**No se puede inferir qué proveedor interno utiliza Studdy.** Su sitio público describe tutoría de pizarra, voz e interrupciones, pero no revela de forma verificable su stack privado. No afirmar que usa Gemini, OpenAI u otro sin evidencia técnica pública.

## 6. Validación requerida

- [ ] Reproducir la llamada en Chrome con micrófono real.
- [ ] Guardar código de error seguro y etapa exacta del fallo, sin registrar audio ni secretos.
- [ ] Verificar audio de entrada y salida en español colombiano.
- [ ] Interrumpir a Orby mientras habla y comprobar que audio, subtítulos y tablero antiguos se cancelan.
- [ ] Comprobar que la pizarra recibe 3–6 snapshots acumulativos en una clase extensa y no pierde tinta previa.
- [ ] Comprobar que el tutor enfoca y explica cada elemento en el orden correcto.
- [ ] Probar Matemáticas, Ciencias, Lectura Crítica, Sociales e Inglés.
- [ ] Ejecutar `npm run test:orby`, TypeScript, ESLint y build en el checkout real.
- [ ] QA responsive en escritorio y móvil.
- [ ] No declarar prueba con estudiantes: aún no se ha realizado.

## 7. Restricciones de trabajo

- La fuente de verdad es GitHub, rama `feat/founder-intro`.
- Cambios pequeños, verificables y reversibles.
- No modificar `main`, no desplegar, no ejecutar migraciones remotas ni habilitar proveedores de pago.
- Respetar las puertas gratuitas y de privacidad existentes.
- Actualizar este documento, `PEAKSCORE_CONTEXT.md` y `PEAKSCORE_CHANGELOG.md` cuando se confirme cada cambio de runtime.


## 8. Verificación documental de Gemini Live (2026-11-08)
- La documentación oficial de Gemini API lista `gemini-3.8-live` como modelo estable de Live API y confirma audio de entrada/salida, transcripciones opcionales y function calling.
- La página oficial de precios publica el nivel Free como «Free of charge» para entrada y salida de Gemini 3.8 Live. También indica expresamente que las entradas/salidas del Free Tier se usan para mejorar productos de Google. Por eso la puerta `PEAKSCORE_GEMINI_DATA_USE_APPROVED` no debe activarse sin decisión explícita de privacidad.
- El nivel gratuito no es ilimitado: los límites efectivos por proyecto deben comprobarse en AI Studio y manejarse con pausa/degradación honesta. No se debe interpretar «Free of charge» como ausencia de cuotas.
- La guía oficial de sesiones Live describe límites de contexto/duración y el cierre de conexión; la aplicación debe renovar/reanudar sesión y no asumir una conexión indefinida.
- **Diagnóstico final para el SDK actual:** el repositorio fija `@google/genai@2.17.1`; su código versionado y su documentación de tokens declaran soporte `v1alpha` para `auth_tokens/`. Se probó documentalmente `v1beta` por la discrepancia con la documentación REST nueva, pero se revirtió para respetar el SDK realmente instalado. El modelo `gemini-3.8-live` está en el catálogo actual y Google lo usa también en ejemplos `v1alpha`. Falta la prueba runtime/Chrome.
- Fuentes de referencia para futuras revisiones:
  - https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/docs/live-api
  - https://firebase.google.com/docs/ai-logic/live-api/sessions
  - https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
- Studdy no publica en las páginas consultadas una atribución verificable de su proveedor privado de voz/LLM. No deducir su stack a partir de la experiencia visible.
- Las APIs de OpenAI Realtime son de pago; LiveKit/Daily/Pipecat son opciones de transporte/orquestación, no sustitutos gratuitos de la inferencia. No añadirlas sin un caso medido y un análisis de coste operativo.


## 9. Corrección aplicada al protocolo del token Live (2026-11-08)
**Hallazgo intermedio (supersedido):** se detectó una aparente discrepancia con la documentación REST nueva y se intentó `v1beta`. La inspección posterior del código exacto `@google/genai@2.17.1` confirmó que el SDK encapsula tokens `auth_tokens/` en `BidiGenerateContentConstrained` y declara soporte `v1alpha` únicamente. La sección 10.3 establece la decisión final.

**Cambios guardados en `feat/founder-intro`:**
- Ese cambio intermedio a `v1beta` fue revertido después de verificar el SDK exacto. El estado actual queda documentado en §10.3: servidor, cliente inicial, reconexión y pruebas usan `v1alpha`.
- El nombre de modelo `gemini-3.8-live` se conserva: aparece en el catálogo oficial actual y en los ejemplos oficiales de tokens efímeros.
- No se relaja la puerta de plan gratuito/privacidad; no se cambia de proveedor; no se envía la API key al cliente.

**Estado de verificación del intento intermedio:** se releyeron los blobs, pero no se ejecutó runtime. La secuencia de prueba pendiente se realiza ahora en la combinación seleccionada para SDK 2.17.1: token v1alpha, conexión v1alpha, `setupComplete`, audio, tool calls, interrupción y reconexión.

**Referencias oficiales consultadas:**
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/api/live


## 10. Investigación ampliada de Studdy y mapa tecnológico (2026-11-08)

### Evidencia pública que sí se pudo comprobar
- Studdy presenta públicamente dos superficies: una app móvil y el Whiteboard Tutor disponible en su sitio. Su web afirma que el alumno puede cargar apuntes, libros, guías, tareas y video-clases; el tutor estructura la clase alrededor del material, enseña en una pizarra, acepta interrupciones y genera prácticas a partir del contenido del estudiante.
- La página de privacidad declara que recoge contenido de sesiones de tutor, archivos e imágenes subidos, dibujos de pizarra, interacciones de voz, conversaciones de texto, problemas matemáticos, fotos y videos. También declara que usa proveedores externos de hosting, nube, IT y analítica de forma genérica.
- Ni la web, ni la política de privacidad ni los términos consultados nombran el modelo LLM, proveedor STT/TTS, proveedor de embeddings/vector DB, SDK de pizarra, plataforma de WebRTC, framework de frontend o nube específica. Por tanto, **no existe base verificable para atribuirles Gemini, OpenAI, Claude, ElevenLabs, LiveKit, React Native, Next.js, Pinecone u otro producto concreto**.
- Los análisis automáticos de terceros que asignan tecnologías a un dominio no son evidencia suficiente para identificar la arquitectura privada de la app o del producto de pizarra. No usarlos como afirmación del stack.

### Arquitectura de referencia que puede explicar el comportamiento (hipótesis, no atribución a Studdy)
1. **Ingesta multimodal:** almacenamiento de PDF/imagenes/video, extracción de texto, OCR, análisis de diagramas y fragmentación de materiales.
2. **Preparación de lección:** recuperar contexto relevante del material (búsqueda híbrida/vectorial + página/fragmento), inferir objetivos y secuenciar explicación y práctica.
3. **Tutor conversacional:** historial/resumen de sesión, estado de la lección, voz bidireccional, interrupción y control del turno.
4. **Herramientas visuales:** el modelo no “pinta” a mano una imagen final; emite acciones o eventos estructurados (escribir, trazar, enfocar, comparar, borrar foco, continuar). El frontend los representa en el lienzo.
5. **Sincronización:** eventos de audio, subtítulos y pizarra con identificador de turno, secuencia y cancelación de eventos obsoletos.
6. **Evaluación:** ejercicios derivados de lo estudiado, respuesta del alumno, feedback accionable y reintento. El tutor conserva el punto donde quedó después de la interrupción.

### Opciones de tecnología para PeakScore
| Capa | Opción preferida / alternativa | Criterio |
|---|---|---|
| Audio nativo | Gemini 3.8 Live por WebSocket | Ya existe integración real; audio bidireccional, herramientas y barge-in. Con el SDK JS 2.17.1 fijado, usar tokens efímeros v1alpha; v1beta solo si se migra a WebSocket nativo y se prueba por separado. |
| Transporte WebRTC | LiveKit o Agora/Fishjam | Solo si la evidencia muestra que WebSocket es el cuello de botella; agregan servicios/infraestructura. No mejoran el razonamiento ni hacen gratuita la inferencia. |
| Orquestación de voz | Pipecat | Útil si se separan STT, LLM y TTS; no es necesaria si Gemini Live satisface el camino principal. |
| Alternativa de agente | Firebase AI Logic Live | Spike aislado solo después de confirmar modelo, herramientas, región, cuota gratuita y datos procesados. |
| Pizarra | Mantener renderer SVG/React propio (OrbyBoard) | Ya admite bloques, diagramas, gráficas, moléculas, células y trazos; evita dependencia nueva y permite control pedagógico. |
| Pizarra colaborativa genérica | tldraw / Excalidraw | Evaluar solo si hace falta edición manual libre, selección, undo/redo o colaboración; no reemplaza el contrato docente ni la generación de acciones. |
| Historial / estado | Supabase/Postgres actual | Mantener turnos idempotentes, snapshots de tablero y progreso. |
| Materiales y recuperación | Pipeline Orby existente | Preservar almacenamiento, OCR, búsqueda por materia, publicación y filtros; no reconstruir ni revivir el Lab eliminado. |

### Recomendación tecnológica
- **No reescribir a otra plataforma de audio todavía.** La ruta actual de Gemini Live es la que más se acerca a la conversación manos libres: envía audio directamente del navegador a Gemini mediante WebSocket y recibe audio nativo; las tools construyen el tablero.
- El intento de v1beta quedó revertido: el SDK 2.17.1 declara v1alpha para tokens efímeros. Esto aclara el contrato SDK, pero no demuestra que el handshake real funcione ni que todos los errores de llamada se hayan resuelto.
- El cuello de botella prioritario ahora es QA de sesión real, permisos, modelo/cuota, primer setupComplete, envío PCM, respuesta de audio, function calls y recuperación.
- Mantener el lienzo propio es sensato: el diferencial de Studdy que buscamos no es que el alumno pueda mover cualquier figura libremente, sino que la pizarra se comporte como un maestro que construye su explicación.
- Todo proveedor debe estar aprobado para operar sin cargos y con una decisión de privacidad expresa. La tabla de precios de Gemini marca Free como sin coste, pero su uso gratuito se utiliza para mejorar productos de Google; la compuerta de privacidad del proyecto no debe habilitarse automáticamente.

### Fuentes públicas consultadas
- https://studdyai.com/
- https://studdyai.com/privacy-policy
- https://studdyai.com/terms-of-service
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/pricing
- https://docs.livekit.io/agents/integrations/realtime/gemini/
- https://docs.pipecat.ai/
- https://tldraw.dev/
- https://docs.excalidraw.com/


### 10.1. Ajuste del campo de modelo en el token (SDK JavaScript)
- Se corrigió `liveConnectConstraints.model` en el endpoint de sesión: ahora utiliza el ID simple `gemini-3.8-live` (la variable local `model`) como muestra el ejemplo oficial de JavaScript del SDK.
- La documentación REST ilustra `models/gemini-3.8-live`; no mezclar el nombre de recurso REST con el campo de ID usado en el ejemplo JavaScript.
- Se añadió un test estático que exige el campo `model` como ID simple para este flujo SDK.
- Queda pendiente comprobar el comportamiento real con la versión exacta del SDK bloqueada en package-lock y hacer handshake en Chrome.


### 10.2. Compatibilidad cruzada de la versión API y el SDK (advertencia abierta)
- La documentación pública actual de Gemini para tokens efímeros muestra creación REST en `v1beta` y uso del token solo con `v1beta`; el tutorial WebSocket también prescribe `v1beta`.
- Sin embargo, la documentación pública de `@google/genai` y el código actual del SDK conservan una advertencia en `live.connect`: su soporte de tokens efímeros está documentado como `v1alpha` solamente. El código del SDK no aborta por esto: registra warning y construye `BidiGenerateContentConstrained` usando la versión API configurada.
- PeakScore fija `@google/genai` en 2.17.1 en package-lock. No se debe asumir que actualizar dependencias elimina la discrepancia; la rama principal actual del SDK aún contiene la advertencia.
- El cambio guardado a v1beta sigue la especificación actual de la API y la ruta de WebSocket documentada, pero está en estado **candidato no validado** frente al SDK bloqueado. La aceptación requiere crear token y obtener `setupComplete` con Chrome/SDK 2.17.1. En caso de fallo, inspeccionar el código de la versión exacta del SDK y evaluar WebSocket nativo v1beta antes de elegir volver a v1alpha.
- No silenciar ni ocultar el warning como si fuera evidencia de éxito. Registrar etapa, código de cierre y respuesta segura, sin secretos ni audio.
- Fuentes cruzadas:
  - API: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
  - WebSocket: https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
  - SDK: https://googleapis.github.io/js-genai/release_docs/classes/tokens.Tokens.html
  - SDK source: https://github.com/googleapis/js-genai/blob/main/src/live.ts
  - SDK package-lock del proyecto: @google/genai 2.17.1


### 10.3. Resolución para el SDK bloqueado en PeakScore — prevalece sobre el candidato v1beta
- Se inspeccionó el código fuente etiquetado exactamente `googleapis/js-genai@v2.17.1`, la misma versión fijada en `package-lock.json`. En `src/live.ts`, líneas 1648–1675, cuando la API key empieza por `auth_tokens/`, el SDK usa `BidiGenerateContentConstrained` y el parámetro `access_token`, pero emite warning explícito si `apiVersion !== "v1alpha"`; indica que su soporte de tokens efímeros es solo `v1alpha`. El cookbook oficial de Google también muestra `api_version="v1alpha"` junto con el modelo estable `gemini-3.8-live`.
- La documentación de la clase `Tokens` del mismo SDK también declara “Support in v1alpha only” y su ejemplo configura el cliente token con `v1alpha`.
- Por tanto, para la arquitectura actual que usa `@google/genai@2.17.1` en ambos extremos, se restauró `v1alpha` en emisión del token, conexión inicial y reconexión; los tests estáticos vuelven a exigir ese contrato. Esta sección **anula los apartados anteriores 9, 10.1 y 10.2 cuando sugieren usar v1beta en el SDK**.
- La API REST actual y el tutorial WebSocket público de Google describen un flujo `v1beta`. No se debe mezclar ese contrato REST/WebSocket nativo con el flujo encapsulado que usa el SDK 2.17.1. Si PeakScore decide migrar a WebSocket nativo v1beta, hacerlo como un spike separado que sustituya el SDK en conexión/renovación y pruebe auth, handshake, setupComplete, herramientas, reconexión, audio e interrupciones.
- El campo `liveConnectConstraints.model` mantiene el ID simple `gemini-3.8-live`, porque la documentación del SDK JS muestra el identificador sin prefijo.
- Estado: versión de SDK alineada documentalmente y prueba estática corregida. Todavía falta reproducir con Chrome y micrófono real; esto no demuestra que el handshake o la cuota ya funcionen.

**Fuentes exactas:**
- Código versionado: https://github.com/googleapis/js-genai/blob/v2.17.1/src/live.ts (auth_tokens, API version y endpoint WebSocket).
- Clase Tokens versionada: https://googleapis.github.io/js-genai/release_docs/classes/tokens.Tokens.html (soporte v1alpha).
- Lockfile de PeakScore: `@google/genai@2.17.1`.
- Documentación REST/WebSocket actual (flujo separado): https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens y https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket.


### 10.4. Bloqueos de configuración que pueden explicar «No pudimos conectar la llamada»
- `.env.example` define por defecto `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=false`, `PEAKSCORE_GEMINI_DATA_USE_APPROVED=false` y `ORBY_GEMINI_LIVE_ENABLED=false`.
- `isGeminiFreeTierConfigured()` exige las dos confirmaciones en `true` y que exista `GEMINI_API_KEY`.
- En `NODE_ENV=production`, la ruta además exige `ORBY_GEMINI_LIVE_ENABLED=true`. Los despliegues Preview de Vercel también usan entorno de producción de Next/Node a estos efectos; confirmar el valor en el entorno concreto.
- Si falta cualquiera, el endpoint devuelve `GEMINI_FREE_TIER_NOT_CONFIRMED` o `GEMINI_LIVE_PRIVACY_DISABLED` antes de emitir token; en ese caso no es un error WebSocket y no se ha enviado audio/texto al proveedor.
- No activar esas variables automáticamente. El nivel gratuito de Gemini puede usar los datos de las solicitudes para mejorar productos de Google. El dueño del proyecto debe confirmar por separado que la cuenta permanece en cuota sin coste y aprobar expresamente la política de datos antes de habilitar voz en producción.
- El UI actual ya renderiza `voiceError` debajo del estado «No pudimos conectar la llamada»; ese texto debe indicar la puerta concreta. El QA debe registrar código seguro, fase y estado HTTP de `/api/orby/realtime-session` para distinguir esta configuración de un rechazo real del WebSocket.


## 10.5. Evidencia adicional de Studdy Partnerships y límites de atribución
- La página pública de Partnerships presenta a Studdy como infraestructura de IA educativa para escuelas, editoriales, LMS y centros de tutoría, e incluye un widget embebible. La muestra de integración expone un constructor `StuddyWidget({ apiKey, mode: "tutor", context })` y un método `mount(...)`. Esto confirma una **interfaz de integración pública** con API key, modo y contexto; no revela su transporte, framework ni el proveedor del modelo.
- La misma página comercial anuncia un Whiteboard Tutor como «infinite AI canvas», generación en tiempo real de gráficos y diagramas, y una experiencia de visualización STEM. Es coherente con el video: el área de enseñanza es un lienzo amplio que se construye progresivamente, no una respuesta encerrada en una tarjeta.
- La página también afirma guardrails para que el tutor guíe en vez de hacer la tarea, protección de privacidad y ajuste/fine-tuning de IA a materiales curriculares. Son **afirmaciones comerciales del proveedor**, no una auditoría técnica independiente. El término «fine-tune» no permite distinguir si usan ajuste de pesos, retrieval/RAG, prompting por institución o una combinación.
- Su política (actualizada el 8 de noviembre de 2026) declara recopilar contenido de sesión, archivos/imágenes, voz, texto, dibujos de pizarra, videos y métricas de interacción. Los terceros se describen de forma genérica como hosting/cloud/IT y analítica; no publican nombres de LLM, STT, TTS, vector DB ni transporte de voz.
- A partir de la función visible, las posibles capas técnicas son: frontend de canvas con motor de geometría/dibujo; una API de tutor con contexto curricular; orquestación del turno de voz y eventos de interrupción; un stream de acciones visuales estructuradas; y generación de ejercicios desde el material. Es una hipótesis funcional, no una atribución de proveedores o frameworks concretos.
- No encontramos una huella pública reproducible de Wappalyzer/BuiltWith que permita atribuir React, Next.js, Tailwind, Firebase, AWS, GCP, WebRTC, LiveKit, OpenAI, Gemini, Claude o ElevenLabs a Studdy. Los detectores públicos se limitan a fingerprints visibles de la web y no revelan el stack móvil, los servicios privados ni los modelos de inferencia; no usar sus resultados hipotéticos como prueba.
- La página pública de privacidad también limita el servicio a mayores de 13 años y exige consentimiento de padres/tutores para menores de 18 (según la política consultada); PeakScore debe mantener su propio diseño de consentimiento y tratamiento de datos conforme a su público y jurisdicción.
- Recomendación: copiar el patrón de interacción (lienzo continuo, notas y diagramas incrementales, tutor que se puede interrumpir, ejercicios conectados al material) y construirlo con el renderer seguro de PeakScore. No copiar la arquitectura supuesta ni agregar proveedores solo por semejanza.

**Fuentes públicas específicas:**
- https://studdyai.com/partnerships (widget, tutor embebible y Whiteboard Tutor; consultado 2026-11-08).
- https://studdyai.com/privacy-policy (categorías de datos y descripción genérica de proveedores; actualizado 2026-11-08).
- https://studdyai.com/ (flujo de carga de materiales y tutoría).
- https://ai.google.dev/gemini-api/docs/live-api


## 10.6. Diagnóstico confirmado en la grabación de PeakScore
- Se extrajo y revisó un fotograma legible de la grabación de pantalla, alrededor del segundo 17. El estado de la llamada muestra «No pudimos conectar la llamada» y el mensaje explícito: «Falta confirmar que Gemini está en el plan gratuito y aprobar expresamente el uso de datos de ese nivel. No se envió tu audio ni tu texto a Gemini».
- Esto confirma que la causa observada en ese intento es la puerta de configuración/privacidad, no un rechazo del WebSocket, un fallo del micrófono ni una respuesta defectuosa del modelo. El endpoint corta antes de emitir el token efímero.
- La llamada seguirá bloqueada deliberadamente mientras no estén aprobadas `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED` y `PEAKSCORE_GEMINI_DATA_USE_APPROVED`. En producción también hace falta `ORBY_GEMINI_LIVE_ENABLED=true`.
- No activar las variables por inferencia ni para «probar»: el dueño debe confirmar que la cuenta no generará cargos fuera de Free Tier y aprobar expresamente el tratamiento de datos. Si no acepta el uso de datos del nivel gratuito, mantener Live bloqueado y no enviar audio/texto.
- No hace falta seguir depurando handshake para explicar este fotograma. Una vez resuelta la decisión de privacidad, sí procede una prueba nueva para comprobar token, setupComplete, audio bidireccional, interrupción y pizarra.
- La pista de audio de los videos de Studdy no se ha transcrito ni validado acústicamente desde este entorno. La comparación docente descrita en este documento se basa en fotogramas observados y fuentes públicas, no en una transcripción inventada.

## 10.7. Estado real del canvas de PeakScore frente al «infinite canvas» de Studdy
- PeakScore ya no está limitado a una sola hoja. Se implementó el contrato de pizarra **v3 multipágina**: una clase puede contener de 2 a 4 hojas consecutivas de proporción 16:9, apiladas verticalmente dentro de un mismo espacio desplazable.
- Cada hoja admite hasta 12 etapas posicionadas. Una clase v3 puede contener hasta 24 bloques de texto, 8 visuales y 32 elementos posicionados en total; el snapshot completo tiene un presupuesto de hasta 36 KB. Las versiones v1 y v2 se conservan para compatibilidad: v1 texto y v2 una sola hoja espacial de hasta 8 bloques + 4 visuales / 18 KB.
- Cada elemento de v3 tiene ID estable, secuencia global y una página de destino. El sanitizador rechaza páginas ausentes/vacías, páginas fuera de rango, más de 12 elementos por hoja, referencias duplicadas o snapshots que no cubran todos los bloques/visuales.
- La herramienta de Gemini Live ya conoce la versión 3 y exige que el modelo asigne cada etapa a una hoja. Las acciones incrementales también soportan v3: pueden añadir contenido en una hoja existente o abrir la siguiente hoja sin reubicar lo anterior.
- `OrbyBoard.tsx` renderiza las hojas de forma vertical con indicador «CLASE · HOJA n / N». El contenido se desplaza como una misma clase; al imprimir, cada hoja se separa en una página apaisada.
- **Límite honesto:** esto es un canvas vertical paginado y acotado, no un lienzo verdaderamente infinito. Todavía no ofrece paneo/zoom libre, páginas ilimitadas ni un motor gráfico colaborativo libre como el que Studdy anuncia. La similitud alcanzada está en la continuidad pedagógica y el crecimiento progresivo del área de enseñanza.
- Siguientes evoluciones posibles: conservar el estado del tablero a través de más de cuatro hojas con snapshots/deltas persistentes; navegación por miniaturas de página; zoom accesible para móvil; y pan libre solo si las pruebas demuestran que aporta valor. No aumentar límites sin medir payload, legibilidad, consumo de contexto y persistencia.
- La arquitectura sigue siendo segura: el modelo emite primitivas estructuradas validadas; nunca HTML/SVG libre. Focus, append y correcciones deben conservar IDs, tinta y etapas anteriores.


## 10.8. Implementación multipágina v3 y validación CI — 2026-11-09
- Archivos: `lib/ai/orby-board.ts`, `lib/ai/orby-live-tools.ts`, `lib/ai/orby-board-actions.ts`, `components/aprender/OrbyBoard.tsx`, `app/globals.css`, `app/api/lesson-tutor/route.ts`, `tests/orby-request-filter.test.mjs`.
- El contrato nuevo usa `version: 3`, `layout.pageCount` (2–4) y `layout.elements[].page` (índice base cero). Las páginas 16:9 son verticalmente contiguas; las secuencias/IDs se mantienen globales a la clase.
- El modelo recibe instrucciones de escoger v2 para clases cortas y v3 únicamente cuando necesite más de una hoja. En v3 puede distribuir hasta 24 bloques y 8 visuales en 2–4 páginas, máximo 12 etapas por página.
- La validación cubre snapshots acumulativos, preservación de IDs y posiciones, referencias exactas, secuencia creciente, páginas vacías o inválidas, límite por hoja y acciones de append que abren la siguiente hoja.
- CI del commit `fb8b655a35260cfdf1a84fdc423e31aeac5d7ae7`: 270/270 tests Orby, TypeScript, ESLint y build de Next.js pasaron; auditoría de dependencias también correcta. Esto valida código y compilación, no la calidad de una sesión real de Gemini Live.
- Pendiente: QA real en Chrome con micrófono/audio, llamadas de herramienta de tablero, interrupciones y continuidad cuando una clase cruza varias hojas; QA responsive con estudiantes aún no realizado.
