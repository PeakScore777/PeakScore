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

### P2 — tablero de entrada
1. Convertir `OmegaXStudyHome` en una entrada centrada en «¿Qué quieres aprender hoy?» con accesos por intención y continuidad de sesiones.
2. Conservar la navegación global de PeakScore y la identidad propia; no clonar logos, colores de marca ni assets de Studdy.
3. La selección de materia/tema debe alimentar la sesión, la pizarra y el contexto académico de Orby.
4. Eliminar emojis decorativos y sustituirlos por iconografía Lucide semántica consistente.

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
- **Corrección aplicada:** el código solicitaba token efímero y conectaba el navegador con `v1alpha`, aunque la documentación oficial exige `v1beta` para tokens efímeros de Live. Se alinearon emisión, conexión inicial y reanudación en `v1beta`; también se corrigió la regresión estática que exigía `v1alpha`. El modelo `gemini-3.8-live` está en el catálogo oficial. Falta todavía ejecutar pruebas runtime/Chrome para confirmar la recuperación de la llamada.
- Fuentes de referencia para futuras revisiones:
  - https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/docs/live-api
  - https://firebase.google.com/docs/ai-logic/live-api/sessions
  - https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
- Studdy no publica en las páginas consultadas una atribución verificable de su proveedor privado de voz/LLM. No deducir su stack a partir de la experiencia visible.
- Las APIs de OpenAI Realtime son de pago; LiveKit/Daily/Pipecat son opciones de transporte/orquestación, no sustitutos gratuitos de la inferencia. No añadirlas sin un caso medido y un análisis de coste operativo.


## 9. Corrección aplicada al protocolo del token Live (2026-11-08)
**Hallazgo:** el proyecto emitía tokens con el SDK `@google/genai` usando `httpOptions.apiVersion: "v1alpha"`, y el navegador creaba ambas conexiones (inicial y reanudada) con esa misma versión. La documentación oficial establece que los tokens efímeros de Live solo se pueden usar con `v1beta`. El test estático del repositorio reforzaba el error: exigía `v1alpha` y rechazaba `v1beta`.

**Cambios guardados en `feat/founder-intro`:**
- `app/api/orby/realtime-session/route.ts`: token provisioning ahora usa `v1beta`.
- `components/aprender/LessonAITutor.tsx`: cliente inicial y cliente de reanudación ahora usan `v1beta`.
- `tests/orby-request-filter.test.mjs`: la regresión valida `v1beta` en servidor, conexión inicial y reanudación, y prohíbe `v1alpha`.
- El nombre de modelo `gemini-3.8-live` se conserva: aparece en el catálogo oficial actual y en los ejemplos oficiales de tokens efímeros.
- No se relaja la puerta de plan gratuito/privacidad; no se cambia de proveedor; no se envía la API key al cliente.

**Estado de verificación:** los tres blobs y sus versiones actualizadas se leyeron de GitHub después de guardar. Esto confirma persistencia y consistencia textual, pero no equivale a `npm run test:orby`, TypeScript, ESLint, build o una llamada real desde Chrome. Siguiente prueba: autenticar, crear token, conectar vía SDK en `v1beta`, recibir `setupComplete`, enviar audio y verificar audio de retorno + interrupción + pizarra.

**Referencias oficiales consultadas:**
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/api/live
